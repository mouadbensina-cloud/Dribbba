import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { QuartierProfileScreen } from "@/components/QuartierProfileScreen";
import { getCityBySlug, getQuartierDetail } from "@/lib/data";

// TODO: analytics — log a pageview for the quartier profile screen here
// once an analytics provider is wired up.

export const dynamic = "force-dynamic";

interface QuartierPageProps {
  params: Promise<{ city: string; quartier: string }>;
}

export async function generateMetadata({ params }: QuartierPageProps): Promise<Metadata> {
  const { city: citySlug, quartier: quartierSlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) return {};
  const quartier = await getQuartierDetail(city.id, quartierSlug);
  if (!quartier) return {};

  return {
    title: `${quartier.name}, ${city.name} — Quartier OS`,
    description: quartier.one_liner,
  };
}

export default async function QuartierPage({ params }: QuartierPageProps) {
  const { city: citySlug, quartier: quartierSlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) notFound();

  const quartier = await getQuartierDetail(city.id, quartierSlug);
  if (!quartier) notFound();

  return (
    <QuartierProfileScreen citySlug={city.slug} cityName={city.name} quartier={quartier} />
  );
}
