import { notFound } from "next/navigation";
import { MapHomeScreen } from "@/components/MapHomeScreen";
import { getCityBySlug, getQuartiersForCity } from "@/lib/data";
import { STATIC_CITY } from "@/lib/staticData";

// TODO: analytics — log a pageview for the city map screen here once an
// analytics provider is wired up.

export function generateStaticParams() {
  return [{ city: STATIC_CITY.slug }];
}

interface CityPageProps {
  params: Promise<{ city: string }>;
}

export default async function CityPage({ params }: CityPageProps) {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) notFound();

  const quartiers = await getQuartiersForCity(city.id);

  return <MapHomeScreen city={city} quartiers={quartiers} />;
}
