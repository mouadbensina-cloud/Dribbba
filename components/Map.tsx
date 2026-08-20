"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";
import { MAP_STYLES } from "@/lib/mapStyles";
import type { City, QuartierSummary } from "@/lib/types";

const BRAND = "#e2622e";
let mapsApiOptionsSet = false;

const SPARKLE_ICON_URL =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="${BRAND}" stroke="white" stroke-width="2"/>
      <path d="M14 8l1.3 3.7L19 13l-3.7 1.3L14 18l-1.3-3.7L9 13l3.7-1.3L14 8z" fill="white"/>
    </svg>`,
  );

function polygonToPaths(polygon: QuartierSummary["polygon"]): google.maps.LatLngLiteral[] {
  const ring = polygon.coordinates[0] ?? [];
  const points = ring.map(([lng, lat]) => ({ lat, lng }));
  // Drop a duplicated closing point (GeoJSON rings are closed; Maps paths don't need it).
  if (
    points.length > 1 &&
    points[0].lat === points[points.length - 1].lat &&
    points[0].lng === points[points.length - 1].lng
  ) {
    points.pop();
  }
  return points;
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
  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonsRef = useRef<Record<string, google.maps.Polygon>>({});
  const markersRef = useRef<Record<string, google.maps.Marker>>({});
  const suppressMapClickRef = useRef(false);
  const [ready, setReady] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [loadError, setLoadError] = useState<string | null>(apiKey ? null : "missing-key");

  // Init map once.
  useEffect(() => {
    if (!apiKey) return;
    if (!containerRef.current) return;

    let cancelled = false;
    if (!mapsApiOptionsSet) {
      setOptions({ key: apiKey, v: "weekly" });
      mapsApiOptionsSet = true;
    }

    Promise.all([importLibrary("maps"), importLibrary("marker")])
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const map = new google.maps.Map(containerRef.current, {
          center: { lat: city.center_lat, lng: city.center_lng },
          zoom: city.default_zoom,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          styles: MAP_STYLES,
        });

        map.addListener("click", () => {
          if (suppressMapClickRef.current) return;
          onSelectQuartier(null);
        });

        mapRef.current = map;
        setReady(true);
      })
      .catch((err: unknown) => {
        console.error("Google Maps failed to load", err);
        if (!cancelled) setLoadError("load-failed");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, city.id]);

  // Create polygons + markers once map is ready / quartiers change.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const g = google;

    for (const polygon of Object.values(polygonsRef.current)) polygon.setMap(null);
    for (const marker of Object.values(markersRef.current)) marker.setMap(null);
    polygonsRef.current = {};
    markersRef.current = {};

    for (const quartier of quartiers) {
      const polygon = new g.maps.Polygon({
        paths: polygonToPaths(quartier.polygon),
        map,
        fillColor: BRAND,
        fillOpacity: 0.15,
        strokeColor: BRAND,
        strokeOpacity: 0.4,
        strokeWeight: 1.5,
        clickable: true,
      });

      polygon.addListener("click", () => {
        suppressMapClickRef.current = true;
        onSelectQuartier(quartier.slug);
        setTimeout(() => {
          suppressMapClickRef.current = false;
        }, 0);
      });

      polygonsRef.current[quartier.slug] = polygon;

      const marker = new g.maps.Marker({
        position: { lat: quartier.center_lat, lng: quartier.center_lng },
        map: null,
        icon: {
          url: SPARKLE_ICON_URL,
          scaledSize: new g.maps.Size(24, 24),
          anchor: new g.maps.Point(12, 12),
        },
        clickable: false,
        zIndex: 999,
      });
      markersRef.current[quartier.slug] = marker;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, quartiers]);

  // Reactively style selected + AI-match state.
  useEffect(() => {
    if (!ready) return;
    for (const [slug, polygon] of Object.entries(polygonsRef.current)) {
      const isSelected = slug === selectedSlug;
      const isAiMatch = aiMatchSlugs.includes(slug);
      polygon.setOptions({
        fillOpacity: isSelected ? 0.4 : 0.15,
        strokeOpacity: isSelected || isAiMatch ? 1 : 0.4,
        strokeWeight: isSelected ? 2 : 1.5,
        zIndex: isSelected ? 10 : isAiMatch ? 5 : 1,
      });
    }
    for (const [slug, marker] of Object.entries(markersRef.current)) {
      marker.setMap(aiMatchSlugs.includes(slug) ? mapRef.current : null);
    }
  }, [ready, selectedSlug, aiMatchSlugs]);

  // Recenter when a quartier is selected.
  useEffect(() => {
    if (!ready || !mapRef.current || !selectedSlug) return;
    const quartier = quartiers.find((q) => q.slug === selectedSlug);
    if (!quartier) return;
    mapRef.current.panTo({ lat: quartier.center_lat, lng: quartier.center_lng });
  }, [ready, selectedSlug, quartiers]);

  if (loadError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-surface-muted px-8 text-center">
        <p className="text-sm text-muted-foreground">
          {loadError === "missing-key"
            ? "Clé Google Maps manquante. Ajoutez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY dans .env.local."
            : "Impossible de charger la carte."}
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className="absolute inset-0" />;
}
