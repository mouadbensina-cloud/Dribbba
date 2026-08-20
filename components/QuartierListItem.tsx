import Image from "next/image";
import { Sparkles } from "lucide-react";
import { HEADLINE_DIMENSIONS } from "@/lib/constants";
import type { QuartierSummary } from "@/lib/types";
import { RatingBar } from "./RatingBar";

interface QuartierListItemProps {
  quartier: QuartierSummary;
  isAiMatch?: boolean;
  onClick: () => void;
}

export function QuartierListItem({ quartier, isAiMatch, onClick }: QuartierListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left active:bg-surface-muted transition-colors"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
        {quartier.hero_photo_url && (
          <Image
            src={quartier.hero_photo_url}
            alt={quartier.name}
            fill
            sizes="64px"
            className="object-cover"
            unoptimized
          />
        )}
        {isAiMatch && (
          <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-brand shadow">
            <Sparkles className="size-3 text-brand-foreground" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{quartier.name}</p>
        <p className="truncate text-xs text-muted-foreground">{quartier.one_liner}</p>
        <div className="mt-2 flex flex-col gap-1">
          {HEADLINE_DIMENSIONS.map((dimension) => (
            <RatingBar
              key={dimension}
              dimension={dimension}
              score={quartier.ratings[dimension]}
              showLabel={false}
            />
          ))}
        </div>
      </div>
    </button>
  );
}
