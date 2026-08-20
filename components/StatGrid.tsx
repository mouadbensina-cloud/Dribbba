interface StatGridProps {
  safetyScore: number | null;
  priceBuyPerSqm: number | null;
  priceRent2br: number | null;
  walkability: number | null;
}

function formatMad(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function StatGrid({
  safetyScore,
  priceBuyPerSqm,
  priceRent2br,
  walkability,
}: StatGridProps) {
  const stats = [
    {
      value: safetyScore !== null ? `${safetyScore.toFixed(1)}/5` : "—",
      label: "Sécurité",
    },
    {
      value: `${formatMad(priceBuyPerSqm)}`,
      label: "DH / m² (achat)",
    },
    {
      value: formatMad(priceRent2br),
      label: "DH / mois (2p)",
    },
    {
      value: walkability !== null ? `${walkability}/5` : "—",
      label: "Marchabilité",
    },
  ];

  return (
    <div className="grid grid-cols-4 divide-x divide-border rounded-2xl border border-border bg-surface">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col items-center gap-1 px-2 py-4 text-center">
          <span className="text-lg font-bold leading-none tabular-nums">{stat.value}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground leading-tight">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
