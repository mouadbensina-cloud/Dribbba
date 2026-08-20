import { RATING_ICONS, RATING_LABELS } from "@/lib/constants";
import type { RatingDimension } from "@/lib/types";

interface RatingBarSegmentedProps {
  dimension: RatingDimension;
  score: number | undefined;
}

/** 5-segment bar used on the full profile page's "Ambiance" list. */
export function RatingBarSegmented({ dimension, score = 0 }: RatingBarSegmentedProps) {
  const Icon = RATING_ICONS[dimension];

  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="size-4 shrink-0 text-foreground/70" strokeWidth={2} />
        <span className="text-sm text-foreground truncate">{RATING_LABELS[dimension]}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="block h-2 w-4 rounded-sm"
            style={{
              backgroundColor: i < score ? "var(--rating-fill)" : "var(--rating-track)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
