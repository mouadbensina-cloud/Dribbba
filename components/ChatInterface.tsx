"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUp, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AI_MATCHES_STORAGE_KEY } from "@/lib/constants";

interface ChatInterfaceProps {
  citySlug: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Un quartier calme pour une famille avec enfants",
  "Où louer pour moins de 6 000 DH par mois",
  "Un bon quartier proche de Casa Finance City",
  "Sûr le soir et bien connecté au centre-ville",
];

export function ChatInterface({ citySlug }: ChatInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citySlug, messages: nextMessages }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur inconnue");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

      if (Array.isArray(data.matches) && data.matches.length > 0) {
        sessionStorage.setItem(
          AI_MATCHES_STORAGE_KEY,
          JSON.stringify({ citySlug, slugs: data.matches }),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <div className="pt-safe flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={() => router.push(`/${citySlug}`)}
          className="flex size-9 items-center justify-center rounded-full bg-surface-muted text-foreground"
        >
          <ArrowLeft className="size-4.5" />
        </button>
        <span className="text-sm font-semibold text-foreground">Ask AI</span>
        <div className="size-9" />
      </div>

      <div ref={scrollRef} className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-brand/10">
              <Sparkles className="size-6 text-brand" />
            </span>
            <p className="text-sm text-muted-foreground">
              Décrivez ce que vous cherchez et je vous suggère des quartiers à Casablanca.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "rounded-br-md bg-brand text-brand-foreground"
                    : "rounded-bl-md bg-surface-muted text-foreground"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-surface-muted px-4 py-2.5 text-sm text-muted-foreground">
                En train de réfléchir…
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-con/10 px-4 py-2.5 text-sm text-[var(--con)]">
                {error}
              </div>
            </div>
          )}
        </div>
      </div>

      {messages.length === 0 && (
        <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-4 pb-3">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => sendMessage(q)}
              className="shrink-0 rounded-full border border-border bg-surface px-3.5 py-2 text-xs text-foreground/80 active:bg-surface-muted"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="pb-safe flex shrink-0 items-center gap-2 border-t border-border px-4 py-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrivez votre question..."
          className="flex-1 rounded-full border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground disabled:opacity-40"
        >
          <ArrowUp className="size-4.5" />
        </button>
      </form>
    </div>
  );
}
