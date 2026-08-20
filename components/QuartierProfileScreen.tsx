"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ESSENTIAL_CATEGORIES,
  ESSENTIAL_ICONS,
  ESSENTIAL_LABELS,
  RATING_DIMENSIONS,
} from "@/lib/constants";
import type { QuartierDetail } from "@/lib/types";
import { RatingBarSegmented } from "./RatingBarSegmented";
import { StatGrid } from "./StatGrid";

interface QuartierProfileScreenProps {
  citySlug: string;
  cityName: string;
  quartier: QuartierDetail;
}

const HERO_HEIGHT = 280;

export function QuartierProfileScreen({
  citySlug,
  cityName,
  quartier,
}: QuartierProfileScreenProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > HERO_HEIGHT - 56);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: quartier.name, url });
      } catch {
        // user cancelled the native share sheet — no-op
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard unavailable — nothing we can do silently
    }
  }

  const safetyDay = quartier.ratings.safety_day;
  const safetyNight = quartier.ratings.safety_night;
  const safetyScore =
    safetyDay !== undefined && safetyNight !== undefined
      ? (safetyDay + safetyNight) / 2
      : (safetyDay ?? safetyNight ?? null);

  const pros = quartier.prosCons.filter((pc) => pc.type === "pro");
  const cons = quartier.prosCons.filter((pc) => pc.type === "con");

  const essentialsByCategory = new Map(
    quartier.essentials.map((e) => [e.category, e.count]),
  );

  return (
    <div className="mx-auto min-h-dvh max-w-[430px] bg-background">
      {/* Sticky top bar */}
      <div
        className={`pt-safe fixed inset-x-0 top-0 z-40 mx-auto flex max-w-[430px] items-center justify-between px-4 py-3 transition-colors duration-200 ${
          scrolled ? "border-b border-border bg-surface/95 backdrop-blur" : "bg-transparent"
        }`}
      >
        <Link
          href={`/${citySlug}`}
          className={`flex size-9 items-center justify-center rounded-full transition-colors ${
            scrolled ? "bg-surface-muted text-foreground" : "bg-black/25 text-white backdrop-blur-sm"
          }`}
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span
          className={`truncate text-sm font-semibold text-foreground transition-opacity duration-200 ${
            scrolled ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {quartier.name}
        </span>
        <button
          type="button"
          onClick={handleShare}
          className={`flex size-9 items-center justify-center rounded-full transition-colors ${
            scrolled ? "bg-surface-muted text-foreground" : "bg-black/25 text-white backdrop-blur-sm"
          }`}
        >
          <Share2 className="size-4" />
        </button>
      </div>

      {/* 1. Hero image */}
      <div className="relative w-full bg-surface-muted" style={{ height: HERO_HEIGHT }}>
        {quartier.hero_photo_url && (
          <Image
            src={quartier.hero_photo_url}
            alt={quartier.name}
            fill
            sizes="430px"
            className="object-cover"
            unoptimized
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      </div>

      <div className="px-4">
        {/* 2. Header block */}
        <div className="border-b border-border pb-5 pt-5">
          <h1 className="text-2xl font-bold text-foreground">{quartier.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{quartier.one_liner}</p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            {quartier.description}
          </p>
        </div>

        {/* 3. Stat grid */}
        <div className="py-5">
          <StatGrid
            safetyScore={safetyScore}
            priceBuyPerSqm={quartier.price_buy_per_sqm}
            priceRent2br={quartier.price_rent_2br}
            walkability={quartier.ratings.walkability ?? null}
          />
        </div>

        {/* 4. Vibe ratings */}
        <div className="border-t border-border py-5">
          <h2 className="mb-1 text-base font-bold text-foreground">Ambiance</h2>
          <div className="divide-y divide-border/70">
            {RATING_DIMENSIONS.map((dimension) => (
              <RatingBarSegmented
                key={dimension}
                dimension={dimension}
                score={quartier.ratings[dimension]}
              />
            ))}
          </div>
        </div>

        {/* 5. Pros / cons */}
        <div className="border-t border-border py-5">
          <div className="mb-4">
            <h2 className="mb-2 text-base font-bold text-foreground">Ce qu&apos;on aime</h2>
            <ul className="flex flex-col gap-1.5">
              {pros.map((pro) => (
                <li key={pro.id} className="text-sm leading-relaxed text-[var(--pro)]">
                  {pro.content}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-2 text-base font-bold text-foreground">Ce qui coince</h2>
            <ul className="flex flex-col gap-1.5">
              {cons.map((con) => (
                <li key={con.id} className="text-sm leading-relaxed text-[var(--con)]">
                  {con.content}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 6. Commute */}
        <div className="border-t border-border py-5">
          <h2 className="mb-2 text-base font-bold text-foreground">Trajets</h2>
          <div className="flex flex-col divide-y divide-border/70">
            {quartier.commute.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-foreground/80">{c.reference_point}</span>
                <span className="font-semibold text-foreground">{c.duration_minutes} min</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Life essentials */}
        <div className="border-t border-border py-5">
          <h2 className="mb-3 text-base font-bold text-foreground">Essentiels</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {ESSENTIAL_CATEGORIES.map((category) => {
              const Icon = ESSENTIAL_ICONS[category];
              const count = essentialsByCategory.get(category) ?? 0;
              return (
                <div
                  key={category}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface py-4 text-center"
                >
                  <Icon className="size-5 text-brand" strokeWidth={1.75} />
                  <span className="text-lg font-bold leading-none">{count}</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {ESSENTIAL_LABELS[category]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 8. Photo gallery */}
        {quartier.photos.length > 0 && (
          <div className="border-t border-border py-5">
            <h2 className="mb-3 text-base font-bold text-foreground">Photos — {cityName}</h2>
            <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
              {quartier.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative h-48 w-[85%] shrink-0 snap-start overflow-hidden rounded-2xl bg-surface-muted"
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? quartier.name}
                    fill
                    sizes="85vw"
                    className="object-cover"
                    unoptimized
                  />
                  {photo.caption && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
                      {photo.caption}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
