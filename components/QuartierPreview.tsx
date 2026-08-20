import Link from "next/link";
import { HEADLINE_DIMENSIONS } from "@/lib/constants";
import type { QuartierSummary } from "@/lib/types";
import { RatingBar } from "./RatingBar";

interface QuartierPreviewProps {
  citySlug: string;
  quartier: QuartierSummary;
}

export function QuartierPreview({ citySlug, quartier }: QuartierPreviewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-foreground truncate">{quartier.name}</h2>
        <p className="truncate text-sm text-muted-foreground">{quartier.one_liner}</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {HEADLINE_DIMENSIONS.map((dimension) => (
          <RatingBar key={dimension} dimension={dimension} score={quartier.ratings[dimension]} />
        ))}
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-surface-muted px-4 py-3">
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Achat</p>
          <p className="text-sm font-semibold text-foreground">
            {quartier.price_buy_per_sqm.toLocaleString("fr-FR")} DH/m²
          </p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Loyer 2p</p>
          <p className="text-sm font-semibold text-foreground">
            {quartier.price_rent_2br.toLocaleString("fr-FR")} DH
          </p>
        </div>
      </div>

      <Link
        href={`/${citySlug}/${quartier.slug}`}
        className="flex w-full items-center justify-center rounded-full bg-brand py-3.5 text-sm font-semibold text-brand-foreground active:scale-[0.98] transition-transform"
      >
        Voir le profil complet
      </Link>
    </div>
  );
}
