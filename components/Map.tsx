"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import type { City, QuartierSummary } from "@/lib/types";

const BRAND = "#e2622e";
const SOURCE_ID = "quartiers";
const FILL_LAYER_ID = "quartier-fill";
const LINE_LAYER_ID = "quartier-line";

const SPARKLE_HTML = `
  <div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:9999px;background:${BRAND};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.25);">
    <svg width="14" height="14" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 8l1.3 3.7L19 13l-3.7 1.3L14 18l-1.3-3.7L9 13l3.7-1.3L14 8z" fill="white"/>
    </svg>
  </div>`;

function toFeatureCollection(quartiers: QuartierSummary[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: quartiers.map((q) => ({
      type: "Feature",
      id: q.slug,
      properties: { slug: q.slug },
      geometry: q.polygon as GeoJSON.Polygon,
    })),
  };
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
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
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

    map.on("load", () => setReady(true));
    map.on("error", (e) => {
      console.error("Mapbox error", e.error);
      setLoadError("load-failed");
    });

    map.on("click", FILL_LAYER_ID, (e) => {
      const slug = e.features?.[0]?.properties?.slug as string | undefined;
      if (!slug) return;
      suppressMapClickRef.current = true;
      onSelectQuartier(slug);
      setTimeout(() => {
        suppressMapClickRef.current = false;
      }, 0);
    });

    map.on("click", () => {
      // The FILL_LAYER_ID listener above sets this flag first when a
      // polygon was clicked, since Mapbox GL fires both listeners on the
      // same click; skip deselecting in that case.
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
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, city.id]);

  // Add source + layers once the style has loaded, and keep the source data
  // in sync if the quartier list changes.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const data = toFeatureCollection(quartiers);
    const existing = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;

    if (existing) {
      existing.setData(data);
      return;
    }

    map.addSource(SOURCE_ID, { type: "geojson", data });
    map.addLayer({
      id: FILL_LAYER_ID,
      type: "fill",
      source: SOURCE_ID,
      paint: {
        "fill-color": BRAND,
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          0.4,
          0.15,
        ],
      },
    });
    map.addLayer({
      id: LINE_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": BRAND,
        "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 2, 1.5],
        "line-opacity": [
          "case",
          [
            "any",
            ["boolean", ["feature-state", "selected"], false],
            ["boolean", ["feature-state", "aiMatch"], false],
          ],
          1,
          0.4,
        ],
      },
    });
  }, [ready, quartiers]);

  // Reactively style selected + AI-match state, and toggle sparkle markers.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    for (const quartier of quartiers) {
      map.setFeatureState(
        { source: SOURCE_ID, id: quartier.slug },
        {
          selected: quartier.slug === selectedSlug,
          aiMatch: aiMatchSlugs.includes(quartier.slug),
        },
      );

      const isAiMatch = aiMatchSlugs.includes(quartier.slug);
      const existingMarker = markersRef.current[quartier.slug];
      if (isAiMatch && !existingMarker) {
        const el = document.createElement("div");
        el.innerHTML = SPARKLE_HTML;
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([quartier.center_lng, quartier.center_lat])
          .addTo(map);
        markersRef.current[quartier.slug] = marker;
      } else if (!isAiMatch && existingMarker) {
        existingMarker.remove();
        delete markersRef.current[quartier.slug];
      }
    }
  }, [ready, quartiers, selectedSlug, aiMatchSlugs]);

  // Recenter when a quartier is selected.
  useEffect(() => {
    if (!ready || !mapRef.current || !selectedSlug) return;
    const quartier = quartiers.find((q) => q.slug === selectedSlug);
    if (!quartier) return;
    mapRef.current.easeTo({ center: [quartier.center_lng, quartier.center_lat] });
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
