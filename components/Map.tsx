"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import type { City, QuartierSummary } from "@/lib/types";

const BRAND = "#e2622e";

const POINTS_SOURCE_ID = "quartier-points";
const DOT_LAYER_ID = "quartier-dot";
const PILL_LAYER_ID = "quartier-pill";
const PILL_ICON_ID = "quartier-pill-bg";

// Below this zoom, quartiers show as small dots; at/above it they expand
// into named pills (Airbnb-style). Mapbox's own label-collision system
// declutters the pill layer, so fewer names show when zoomed out and more
// appear as you zoom in — no clustering library needed.
const PILL_ZOOM_THRESHOLD = 13;

const CLICKABLE_LAYER_IDS = [DOT_LAYER_ID, PILL_LAYER_ID];

const SPARKLE_HTML = `
  <div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:9999px;background:${BRAND};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.25);">
    <svg width="14" height="14" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 8l1.3 3.7L19 13l-3.7 1.3L14 18l-1.3-3.7L9 13l3.7-1.3L14 8z" fill="white"/>
    </svg>
  </div>`;

// No shape is drawn on the map for any quartier — see README "Decisions I
// made": even the 16 quartiers with a real surveyed boundary only had it
// used for camera framing, and the other 31's shape was never more than an
// approximate placeholder box, which read as more precise than it was.
// Selecting a quartier instead swaps its default white dot/pill for this
// filled, name-bearing badge.
function buildSelectedBadge(name: string): HTMLDivElement {
  const el = document.createElement("div");
  el.textContent = name;
  el.style.cssText = `display:flex;align-items:center;padding:7px 14px;border-radius:9999px;background:${BRAND};color:#ffffff;font-weight:600;font-size:13px;white-space:nowrap;box-shadow:0 2px 8px rgba(28,25,23,0.3);border:2px solid white;`;
  return el;
}

function polygonBounds(polygon: QuartierSummary["polygon"]): mapboxgl.LngLatBounds {
  const bounds = new mapboxgl.LngLatBounds();
  for (const ring of polygon.coordinates) {
    for (const [lng, lat] of ring) bounds.extend([lng, lat]);
  }
  return bounds;
}

// Feature ids must be numeric here: Mapbox GL silently fails to propagate
// feature-state to rendered features when a GeoJSON feature's top-level
// `id` is a string (confirmed empirically against mapbox-gl 3.29 — the
// source data keeps the string id fine, but queryRenderedFeatures/
// setFeatureState then can't find it). The array index is a stable numeric
// id since `quartiers` doesn't reorder between renders; `slug` still lives
// in `properties` for click handling and filters, which read fine either way.
function toPointFeatureCollection(quartiers: QuartierSummary[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: quartiers.map((q, index) => ({
      type: "Feature",
      id: index,
      properties: {
        slug: q.slug,
        name: q.name,
        // Hand-authored quartiers survive Mapbox's label-collision culling
        // before generated ones, so the 3 flagship quartiers stay visible
        // longest while zooming out.
        priority: q.id.startsWith("lightweight-") ? 1 : 0,
      },
      geometry: { type: "Point", coordinates: [q.center_lng, q.center_lat] },
    })),
  };
}

/** A capsule/pill background image, 9-slice-stretchable so it fits any label width. */
function buildPillIcon(): { data: ImageData; height: number; radius: number; width: number } {
  const width = 48;
  const height = 28;
  const radius = height / 2;
  const canvas = document.createElement("canvas");
  const scale = 2; // render at 2x for crisp text on retina screens
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(28, 25, 23, 0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(0.5, 0.5, width - 1, height - 1, radius - 0.5);
  ctx.fill();
  ctx.stroke();
  const data = ctx.getImageData(0, 0, width * scale, height * scale);
  return { data, height: height * scale, radius: radius * scale, width: width * scale };
}

interface MapProps {
  city: City;
  quartiers: QuartierSummary[];
  selectedSlug: string | null;
  aiMatchSlugs: string[];
  onSelectQuartier: (slug: string | null) => void;
}

export function Map({ city, quartiers, selectedSlug, aiMatchSlugs, onSelectQuartier }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const sparkleMarkersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const suppressMapClickRef = useRef(false);
  const [ready, setReady] = useState(false);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [loadError, setLoadError] = useState<string | null>(token ? null : "missing-key");

  // Init map once.
  useEffect(() => {
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [city.center_lng, city.center_lat],
      zoom: city.default_zoom,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));

    // "style.load" (not "load") gates adding our custom sources/layers:
    // it fires once the style spec/sprite/glyphs are ready, which is all
    // addSource/addLayer need — "load" additionally waits for every tile
    // to finish loading, which can hang indefinitely on a flaky network.
    //
    // React Strict Mode (dev only) mounts, cleans up, then mounts again —
    // if this first map's event fires after that cleanup already ran
    // map.remove(), it must not flip `ready` on for the second instance,
    // which isn't loaded yet.
    let cancelled = false;
    map.on("style.load", () => {
      if (!cancelled) setReady(true);
    });
    map.on("error", (e) => {
      console.error("Mapbox error", e.error);
      setLoadError("load-failed");
    });

    for (const layerId of CLICKABLE_LAYER_IDS) {
      map.on("click", layerId, (e) => {
        const slug = e.features?.[0]?.properties?.slug as string | undefined;
        if (!slug) return;
        suppressMapClickRef.current = true;
        onSelectQuartier(slug);
        setTimeout(() => {
          suppressMapClickRef.current = false;
        }, 0);
      });
    }

    map.on("click", () => {
      // The per-layer listeners above set this flag first when a dot/pill
      // was clicked, since Mapbox GL fires both listeners on the same
      // click; skip deselecting in that case.
      if (suppressMapClickRef.current) return;
      onSelectQuartier(null);
    });

    mapRef.current = map;

    // The container's final size can settle after Mapbox's first
    // measurement (e.g. while Tailwind/layout is still resolving on first
    // paint), leaving the canvas stuck at a stale size — keep it in sync.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, city.id]);

  // Add the points source + dot/pill layers once the style has loaded, and
  // keep the source data in sync if the quartier list changes.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const points = toPointFeatureCollection(quartiers);

    const existingPoints = map.getSource(POINTS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (existingPoints) {
      existingPoints.setData(points);
      return;
    }

    if (!map.hasImage(PILL_ICON_ID)) {
      const icon = buildPillIcon();
      map.addImage(PILL_ICON_ID, icon.data, {
        pixelRatio: 2,
        stretchX: [[icon.radius, icon.width - icon.radius]],
        stretchY: [[0, icon.height]],
        content: [icon.radius, 0, icon.width - icon.radius, icon.height],
      });
    }

    map.addSource(POINTS_SOURCE_ID, { type: "geojson", data: points });
    map.addLayer({
      id: DOT_LAYER_ID,
      type: "circle",
      source: POINTS_SOURCE_ID,
      paint: {
        "circle-radius": 5,
        "circle-color": BRAND,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          PILL_ZOOM_THRESHOLD - 0.5,
          1,
          PILL_ZOOM_THRESHOLD,
          0,
        ],
        "circle-stroke-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          PILL_ZOOM_THRESHOLD - 0.5,
          1,
          PILL_ZOOM_THRESHOLD,
          0,
        ],
      },
    });
    map.addLayer({
      id: PILL_LAYER_ID,
      type: "symbol",
      source: POINTS_SOURCE_ID,
      layout: {
        "icon-image": PILL_ICON_ID,
        "icon-text-fit": "both",
        "icon-text-fit-padding": [6, 10, 6, 10],
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-size": 12,
        "text-allow-overlap": false,
        "icon-allow-overlap": false,
        "symbol-sort-key": ["get", "priority"],
      },
      paint: {
        "text-color": "#1c1917",
        "icon-opacity": ["interpolate", ["linear"], ["zoom"], PILL_ZOOM_THRESHOLD - 0.5, 0, PILL_ZOOM_THRESHOLD, 1],
        "text-opacity": ["interpolate", ["linear"], ["zoom"], PILL_ZOOM_THRESHOLD - 0.5, 0, PILL_ZOOM_THRESHOLD, 1],
      },
    });
  }, [ready, quartiers]);

  // Toggle AI-match sparkle markers, and swap the selected quartier's
  // default dot/pill for a filled, name-bearing badge (no shape is ever
  // drawn — see the comment on buildSelectedBadge).
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    for (const quartier of quartiers) {
      const isAiMatch = aiMatchSlugs.includes(quartier.slug);
      const existingMarker = sparkleMarkersRef.current[quartier.slug];
      if (isAiMatch && !existingMarker) {
        const el = document.createElement("div");
        el.innerHTML = SPARKLE_HTML;
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([quartier.center_lng, quartier.center_lat])
          .addTo(map);
        sparkleMarkersRef.current[quartier.slug] = marker;
      } else if (!isAiMatch && existingMarker) {
        existingMarker.remove();
        delete sparkleMarkersRef.current[quartier.slug];
      }
    }

    selectedMarkerRef.current?.remove();
    selectedMarkerRef.current = null;
    const selectedQuartier = quartiers.find((q) => q.slug === selectedSlug);
    if (selectedQuartier) {
      selectedMarkerRef.current = new mapboxgl.Marker({
        element: buildSelectedBadge(selectedQuartier.name),
        anchor: "center",
      })
        .setLngLat([selectedQuartier.center_lng, selectedQuartier.center_lat])
        .addTo(map);
    }

    const hideSelectedFilter: mapboxgl.FilterSpecification | null = selectedSlug
      ? ["!=", ["get", "slug"], selectedSlug]
      : null;
    if (map.getLayer(DOT_LAYER_ID)) map.setFilter(DOT_LAYER_ID, hideSelectedFilter);
    if (map.getLayer(PILL_LAYER_ID)) map.setFilter(PILL_LAYER_ID, hideSelectedFilter);
  }, [ready, quartiers, selectedSlug, aiMatchSlugs]);

  // Frame the selected quartier when it's selected — fitBounds sizes the
  // zoom to the quartier's real geographic extent (its polygon data still
  // exists and is used for this, just never drawn — see above), so tiny
  // and huge quartiers both end up reasonably framed. Selecting opens the
  // bottom sheet's "preview" state, which covers the bottom ~45% of the
  // screen (see BottomSheet's PREVIEW fraction) — asymmetric padding keeps
  // the quartier inside the space that's actually still visible, instead
  // of centered behind the sheet.
  useEffect(() => {
    if (!ready || !mapRef.current || !selectedSlug) return;
    const map = mapRef.current;
    const quartier = quartiers.find((q) => q.slug === selectedSlug);
    if (!quartier) return;

    const containerHeight = map.getContainer().clientHeight;

    map.fitBounds(polygonBounds(quartier.polygon), {
      padding: {
        top: 110,
        bottom: containerHeight * 0.48,
        left: 32,
        right: 32,
      },
      maxZoom: 16,
      duration: 500,
    });
  }, [ready, selectedSlug, quartiers]);

  if (loadError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-surface-muted px-8 text-center">
        <p className="text-sm text-muted-foreground">
          {loadError === "missing-key"
            ? "Clé Mapbox manquante. Ajoutez NEXT_PUBLIC_MAPBOX_TOKEN dans .env.local."
            : "Impossible de charger la carte."}
        </p>
      </div>
    );
  }

  return (
    // Inline position/inset (not Tailwind's .absolute/.inset-0 classes):
    // Mapbox's own stylesheet sets `.mapboxgl-map { position: relative }` on
    // this exact element once it mounts, which otherwise wins the cascade
    // and collapses this container's height to its (empty) content size.
    <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
  );
}
