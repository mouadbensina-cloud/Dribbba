import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCityAiDataset, getCityBySlug } from "@/lib/data";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildSystemPrompt(cityName: string, dataset: unknown) {
  return `Tu es l'assistant "Ask AI" de Quartier OS, un outil de découverte de quartiers pour ${cityName}, au Maroc.

Voici les données éditoriales complètes des quartiers de ${cityName}, au format JSON :

${JSON.stringify(dataset)}

Règles strictes :
- Réponds uniquement à partir des données de quartiers fournies ci-dessus.
- Si l'utilisateur demande un quartier qui n'est pas dans ces données, dis-le clairement plutôt que d'inventer une réponse.
- Réponds toujours en français, de façon concise et honnête (mentionne aussi les points faibles pertinents).
- Quand tu recommandes un ou plusieurs quartiers, termine ta réponse par un bloc JSON structuré contenant leurs slugs, sur la dernière ligne, exactement sous cette forme :
{"matches": ["bourgogne", "gauthier"]}
Si tu ne recommandes aucun quartier précis, omets ce bloc JSON.`;
}

function extractMatches(text: string, validSlugs: Set<string>): { reply: string; matches: string[] } {
  const jsonBlockPattern = /\{\s*"matches"\s*:\s*\[[^\]]*\]\s*\}\s*$/;
  const match = text.match(jsonBlockPattern);

  if (!match) return { reply: text.trim(), matches: [] };

  let matches: string[] = [];
  try {
    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed.matches)) {
      matches = parsed.matches.filter(
        (slug: unknown): slug is string => typeof slug === "string" && validSlugs.has(slug),
      );
    }
  } catch {
    matches = [];
  }

  const reply = text.slice(0, match.index).trim();
  return { reply, matches };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY n'est pas configurée sur le serveur." },
      { status: 500 },
    );
  }

  let body: { citySlug?: string; messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête JSON invalide." }, { status: 400 });
  }

  const { citySlug, messages } = body;
  if (!citySlug || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "citySlug et messages sont requis." }, { status: 400 });
  }
  if (messages.length > MAX_MESSAGES) {
    return NextResponse.json({ error: "Conversation trop longue." }, { status: 400 });
  }
  for (const m of messages) {
    if (
      (m.role !== "user" && m.role !== "assistant") ||
      typeof m.content !== "string" ||
      m.content.length === 0 ||
      m.content.length > MAX_MESSAGE_LENGTH
    ) {
      return NextResponse.json({ error: "Message invalide." }, { status: 400 });
    }
  }

  const city = await getCityBySlug(citySlug);
  if (!city) {
    return NextResponse.json({ error: "Ville introuvable." }, { status: 404 });
  }

  const dataset = await getCityAiDataset(city.id);
  const validSlugs = new Set(dataset.map((q) => q.slug));

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(city.name, dataset),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    const { reply, matches } = extractMatches(text, validSlugs);

    return NextResponse.json({ reply, matches });
  } catch (error) {
    console.error("Anthropic API error", error);
    return NextResponse.json(
      { error: "L'assistant est momentanément indisponible." },
      { status: 502 },
    );
  }
}
