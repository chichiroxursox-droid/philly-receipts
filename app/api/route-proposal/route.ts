import { NextResponse } from "next/server";
import { OUTCOMES, type OutcomeId } from "@/lib/corpus.ts";
import { noEvidence, routeByRules, type Routing } from "@/lib/router.ts";

export const runtime = "nodejs";

const VALID: OutcomeId[] = OUTCOMES.map((o) => o.id);
const CHOICES = [...VALID, "out_of_jurisdiction", "no_evidence"] as const;

/**
 * The scope gate, and the only model call in the product.
 *
 * It returns a ROUTE, never a quantity. Whatever it picks, the numbers that
 * follow are read straight out of lib/corpus.json by deterministic code. The
 * worst a wrong answer here can do is show you the wrong chart, which you can
 * see and correct with one click. It cannot invent a number.
 *
 * Order: hand-written rules, then Jev, then Claude, then refuse. Every layer
 * below the rules is optional, so the demo works with no keys at all.
 */
export async function POST(req: Request) {
  let text = "";
  try {
    text = String((await req.json())?.text ?? "").slice(0, 600);
  } catch {
    return NextResponse.json(noEvidence(""), { status: 200 });
  }

  const byRules = routeByRules(text);
  if (byRules) return NextResponse.json(byRules);

  const viaJev = await askJev(text);
  if (viaJev) return NextResponse.json(viaJev);

  const viaClaude = await askClaude(text);
  if (viaClaude) return NextResponse.json(viaClaude);

  return NextResponse.json(noEvidence(text));
}

function toRouting(choice: string, decided_by: "jev" | "claude"): Routing | null {
  if (choice === "out_of_jurisdiction") {
    return {
      verdict: "out_of_jurisdiction",
      matched_outcome: null,
      reason:
        "That is not something Philadelphia's government controls, so there is no city policy to look up evidence for.",
      decided_by,
    };
  }
  if (choice === "no_evidence") return { ...noEvidence(""), decided_by };
  if ((VALID as string[]).includes(choice)) {
    const o = OUTCOMES.find((x) => x.id === choice)!;
    return {
      verdict: "have_evidence",
      matched_outcome: choice as OutcomeId,
      reason: `Routed to "${o.question}" on published Philadelphia Beverage Tax evidence.`,
      decided_by,
    };
  }
  return null;
}

/** TypeSafe Jev, Choice primitive. Returns one of N with a probability, never a number. */
async function askJev(text: string): Promise<Routing | null> {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "jev-latest",
        choice: {
          question:
            "Which of these does the proposal ask about? Pick out_of_jurisdiction if Philadelphia's city government has no power over it. Pick no_evidence if it is a city matter but none of the listed outcomes covers it.",
          context: text,
          options: CHOICES,
        },
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const pick: unknown = data?.choice?.answer ?? data?.answer ?? data?.result?.answer;
    return typeof pick === "string" ? toRouting(pick, "jev") : null;
  } catch {
    return null;
  }
}

/** Claude fallback. Constrained to one token out of a closed set. */
async function askClaude(text: string): Promise<Routing | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 16,
        system:
          `Classify a policy proposal about Philadelphia into exactly one of: ${CHOICES.join(", ")}. ` +
          `Answer with the label only, nothing else. Use out_of_jurisdiction when Philadelphia's ` +
          `city government has no legal power over the thing proposed. Use no_evidence when it is a ` +
          `city matter but none of the outcome labels covers it. Never explain.`,
        messages: [{ role: "user", content: text }],
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = String(data?.content?.[0]?.text ?? "").trim().toLowerCase();
    const pick = CHOICES.find((c) => raw.includes(c));
    return pick ? toRouting(pick, "claude") : null;
  } catch {
    return null;
  }
}
