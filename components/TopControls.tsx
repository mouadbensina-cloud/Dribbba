"use client";

import { Search, SlidersHorizontal, Sparkles } from "lucide-react";

interface TopControlsProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFiltersClick: () => void;
  onAskAiClick: () => void;
}

export function TopControls({
  searchValue,
  onSearchChange,
  onFiltersClick,
  onAskAiClick,
}: TopControlsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Chercher un quartier..."
          className="w-full rounded-full border border-border/80 bg-white/90 py-3 pl-10 pr-4 text-sm text-foreground shadow-sm backdrop-blur-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onFiltersClick}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-white/90 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-md active:scale-[0.98] transition-transform"
        >
          <SlidersHorizontal className="size-4" />
          Filtres
        </button>
        <button
          type="button"
          onClick={onAskAiClick}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand py-2.5 text-sm font-medium text-brand-foreground shadow-sm active:scale-[0.98] transition-transform"
        >
          <Sparkles className="size-4" />
          Ask AI
        </button>
      </div>
    </div>
  );
}
