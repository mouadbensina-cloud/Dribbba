import { notFound } from "next/navigation";
import { ChatInterface } from "@/components/ChatInterface";
import { getCityBySlug } from "@/lib/data";
import { STATIC_CITY } from "@/lib/staticData";

export function generateStaticParams() {
  return [{ city: STATIC_CITY.slug }];
}

interface AskAiPageProps {
  params: Promise<{ city: string }>;
}

export default async function AskAiPage({ params }: AskAiPageProps) {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) notFound();

  return <ChatInterface citySlug={city.slug} />;
}
