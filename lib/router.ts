import { OUTCOMES, type OutcomeId } from "./corpus.ts";

export type Verdict = "have_evidence" | "out_of_jurisdiction" | "no_evidence";

export type Routing = {
  verdict: Verdict;
  matched_outcome: OutcomeId | null;
  reason: string;
  /** Which layer decided. Shown in the UI so the demo is auditable. */
  decided_by: "rules" | "jev" | "claude" | "gemini" | "fallback";
};

/**
 * Things a Philadelphia mayor cannot legally do, because Pennsylvania preempts
 * the field. The model never decides preemption. It is a hand-written list with
 * a statute attached, because getting this wrong is a factual error about law.
 */
export const PREEMPTED: { match: RegExp; reason: string }[] = [
  {
    match: /\b(minimum wage|min wage|\$\d+ an hour|\$\d+\/hour|living wage)\b/i,
    reason:
      "Pennsylvania's Minimum Wage Act preempts municipalities from setting their own minimum wage for private employers. Philadelphia has tried and lost. A mayor cannot do this, so there is nothing to simulate.",
  },
  {
    match: /\b(gun|guns|firearm|firearms|assault weapons?|ammunition|concealed carry)\b/i,
    reason:
      "18 Pa.C.S. section 6120 expressly preempts municipal regulation of firearms and ammunition. Philadelphia has passed such ordinances and Pennsylvania courts have struck them down. A mayor cannot do this.",
  },
];

/**
 * Keyword routing. Deliberately boring. The demo must survive a dead API, dead
 * venue wifi, and a judge typing something at 2am, so the common paths never
 * touch a network call.
 *
 * SUBJECT terms and OUTCOME terms are kept apart on purpose. "beverage tax" says
 * what the policy is, not what you are asking about it. Mixing the two made
 * "did the beverage tax cost jobs" route to prices, because the subject term
 * outvoted the only word in the sentence that named an outcome.
 */
const SUBJECT =
  /\b(soda tax|beverage tax|sugary drink|sweetened beverage|sugar tax|soda|pop|the tax|this tax)\b/i;

const KEYWORDS: { outcome: OutcomeId; terms: RegExp }[] = [
  {
    outcome: "price_pass_through",
    // "cost" alone is out. "Did it cost jobs" is not a question about prices.
    terms:
      /\b(price|prices|pricing|shelf|pass.?through|costs? more|more expensive|expensive|charge[ds]?|markup|sticker|per ounce|passed on)\b/i,
  },
  {
    outcome: "volume_net",
    terms:
      /\b(drink|drank|drinking|drinks|consum\w*|volume|sales|sold|buy|buying|bought|purchas\w*|demand|border|cross.?border|stopped buying|shop\w*)\b/i,
  },
  {
    outcome: "employment",
    terms:
      /\b(job|jobs|employ\w*|unemploy\w*|layoffs?|laid off|hiring|hire[ds]?|worker|workers|work ?force|bottler|bottlers)\b/i,
  },
  {
    outcome: "revenue",
    terms:
      /\b(revenue|money|raised|funding|funds?|budget|collect\w*|pre.?k|prekindergarten|rebuild|dollars|where did it go)\b/i,
  },
];

/** Another city or level of government. This corpus is Philadelphia only. */
const ELSEWHERE =
  /\b(new york|nyc|chicago|boston|seattle|berkeley|oakland|san francisco|los angeles|la county|pittsburgh|baltimore|washington dc|d\.c\.|federal|nationwide|nationally|congress|the country|america|united states|state of|statewide)\b/i;

export function routeByRules(text: string): Routing | null {
  const t = text.trim();
  if (t.length < 3) {
    return {
      verdict: "no_evidence",
      matched_outcome: null,
      reason: "Type a policy proposal and I will show you what was actually measured.",
      decided_by: "rules",
    };
  }

  for (const p of PREEMPTED) {
    if (p.match.test(t)) {
      return { verdict: "out_of_jurisdiction", matched_outcome: null, reason: p.reason, decided_by: "rules" };
    }
  }

  const mentionsPhilly = /\b(phil\w*|philly|pa\b|pennsylvania)\b/i.test(t);
  if (ELSEWHERE.test(t) && !mentionsPhilly) {
    return {
      verdict: "out_of_jurisdiction",
      matched_outcome: null,
      reason:
        "Every study in this corpus measured Philadelphia. Other cities taxed different products at different rates, so their results are not transferable here. I will not reuse a Philadelphia estimate for somewhere else.",
      decided_by: "rules",
    };
  }

  // Score by how many distinct terms hit, and treat a tie as ambiguous rather
  // than letting list order silently decide.
  const scores = KEYWORDS.map((k) => ({
    outcome: k.outcome,
    score: (t.match(new RegExp(k.terms.source, "gi")) || []).length,
  })).filter((x) => x.score > 0);
  scores.sort((a, b) => b.score - a.score);

  if (scores.length > 0 && (scores.length === 1 || scores[0].score > scores[1].score)) {
    const o = OUTCOMES.find((x) => x.id === scores[0].outcome)!;
    return {
      verdict: "have_evidence",
      matched_outcome: scores[0].outcome,
      reason: `Routed to "${o.question}" on published Philadelphia Beverage Tax evidence.`,
      decided_by: "rules",
    };
  }

  // On topic but no outcome named, or a genuine tie between outcomes. Open on
  // pass-through and say plainly that the choice was mine, not the evidence's.
  if (SUBJECT.test(t)) {
    return {
      verdict: "have_evidence",
      matched_outcome: "price_pass_through",
      reason:
        "That is about the beverage tax but does not name one outcome, so this opens on price pass-through. Switch outcomes above. Nothing was inferred about what you meant.",
      decided_by: "rules",
    };
  }

  return null; // ambiguous: hand it to the model layer if one is configured
}

export function noEvidence(text: string): Routing {
  const list = OUTCOMES.map((o) => o.short.toLowerCase()).join(", ");
  return {
    verdict: "no_evidence",
    matched_outcome: null,
    reason: `Nothing in this corpus measures that. I will not estimate it. What is encoded, all of it from the Philadelphia Beverage Tax literature: ${list}. Ask about one of those and every number you see will carry a citation.`,
    decided_by: "fallback",
  };
}
