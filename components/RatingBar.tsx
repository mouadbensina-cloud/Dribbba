import { RATING_ICONS, RATING_LABELS } from "@/lib/constants";
import type { RatingDimension } from "@/lib/types";

interface RatingBarProps {
  dimension: RatingDimension;
  score: number | undefined;
  showLabel?: boolean;
}

/** Compact icon + fill-bar, no numeric score shown. Used in list items and the map preview. */
export function RatingBar({ dimension, score, showLabel = true }: RatingBarProps) {
  const Icon = RATING_ICONS[dimension];
  const pct = score ? Math.round((score / 5) * 100) : 0;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
      {showLabel && (
        <span className="text-xs text-muted-foreground shrink-0 w-[6.5rem] truncate">
          {RATING_LABELS[dimension]}
        </span>
      )}
      <span className="flex-1 h-1.5 rounded-full bg-[var(--rating-track)] overflow-hidden min-w-[2.5rem]">
        <span
          className="block h-full rounded-full bg-[var(--rating-fill)] transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  );
}
