"use client";

import { useRouter } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AI_MATCHES_STORAGE_KEY } from "@/lib/constants";
import type { City, QuartierSummary } from "@/lib/types";
import { BottomSheet, type SheetState } from "./BottomSheet";
import { FiltersModal } from "./FiltersModal";
import { Map } from "./Map";
import { QuartierListItem } from "./QuartierListItem";
import { QuartierPreview } from "./QuartierPreview";
import { TopControls } from "./TopControls";

interface MapHomeScreenProps {
  city: City;
  quartiers: QuartierSummary[];
}

interface StoredAiMatches {
  citySlug: string;
  slugs: string[];
}

export function MapHomeScreen({ city, quartiers }: MapHomeScreenProps) {
  const router = useRouter();
  const [sheetState, setSheetState] = useState<SheetState>("resting");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [aiMatchSlugs, setAiMatchSlugs] = useState<string[]>([]);

  useEffect(() => {
    // Reading sessionStorage (an external system, unavailable during SSR) on
    // mount to pick up AI matches left by the Ask AI screen.
    try {
      const raw = sessionStorage.getItem(AI_MATCHES_STORAGE_KEY);
      if (!raw) return;
      const stored: StoredAiMatches = JSON.parse(raw);
      if (stored.citySlug === city.slug) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAiMatchSlugs(stored.slugs);
      }
    } catch {
      // ignore malformed/unavailable storage
    }
  }, [city.slug]);

  // Resting state has no selection by definition — derive it rather than
  // syncing with an effect.
  const effectiveSelectedSlug = sheetState === "resting" ? null : selectedSlug;

  const selectedQuartier = useMemo(
    () => quartiers.find((q) => q.slug === effectiveSelectedSlug) ?? null,
    [quartiers, effectiveSelectedSlug],
  );

  const filteredQuartiers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return quartiers;
    return quartiers.filter(
      (q) =>
        q.name.toLowerCase().includes(query) || q.one_liner.toLowerCase().includes(query),
    );
  }, [quartiers, search]);

  function handleSelectQuartier(slug: string | null) {
    if (slug === null) {
      setSelectedSlug(null);
      if (sheetState === "preview") setSheetState("resting");
    } else {
      setSelectedSlug(slug);
      setSheetState("preview");
    }
  }

  function handleListItemClick(slug: string) {
    setSelectedSlug(slug);
    setSheetState("preview");
  }

  return (
    <div className="relative mx-auto h-dvh w-full max-w-[430px] overflow-hidden bg-background">
      <Map
        city={city}
        quartiers={quartiers}
        selectedSlug={effectiveSelectedSlug}
        aiMatchSlugs={aiMatchSlugs}
        onSelectQuartier={handleSelectQuartier}
      />

      {sheetState !== "expanded" && (
        <div className="pt-safe fixed inset-x-0 top-0 z-40 mx-auto max-w-[430px] px-4 pt-3">
          <TopControls
            searchValue={search}
            onSearchChange={setSearch}
            onFiltersClick={() => setFiltersOpen(true)}
            onAskAiClick={() => router.push(`/${city.slug}/ask-ai`)}
          />
        </div>
      )}

      <BottomSheet state={sheetState} onStateChange={setSheetState}>
        {sheetState === "resting" && (
          <div className="flex flex-col items-center gap-1 px-4 pt-1 text-center">
            <p className="text-sm font-semibold text-foreground">{city.name}</p>
            <p className="text-xs text-muted-foreground">{quartiers.length} quartiers</p>
            <ChevronUp className="mt-1 size-4 text-muted-foreground/60" />
          </div>
        )}

        {sheetState === "preview" && selectedQuartier && (
          <div className="overflow-y-auto px-4 pb-6 pt-1">
            <QuartierPreview citySlug={city.slug} quartier={selectedQuartier} />
          </div>
        )}

        {sheetState === "expanded" && (
          <>
            <div className="flex flex-col gap-3 border-b border-border px-4 pb-3">
              <TopControls
                searchValue={search}
                onSearchChange={setSearch}
                onFiltersClick={() => setFiltersOpen(true)}
                onAskAiClick={() => router.push(`/${city.slug}/ask-ai`)}
              />
            </div>
            <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-3">
              <div className="flex flex-col gap-2 pb-8">
                {filteredQuartiers.map((quartier) => (
                  <QuartierListItem
                    key={quartier.id}
                    quartier={quartier}
                    isAiMatch={aiMatchSlugs.includes(quartier.slug)}
                    onClick={() => handleListItemClick(quartier.slug)}
                  />
                ))}
                {filteredQuartiers.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Aucun quartier ne correspond à votre recherche.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </BottomSheet>

      <FiltersModal open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </div>
  );
}
