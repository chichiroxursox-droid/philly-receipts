import corpusJson from "./corpus.json" with { type: "json" };
import { band, consistency, partitionByUnits, type Row } from "./band.ts";

export const CORPUS = corpusJson as Row[];

export type OutcomeId = "price_pass_through" | "volume_net" | "employment" | "revenue";

export type Outcome = {
  id: OutcomeId;
  /** The question a person would actually ask. */
  question: string;
  short: string;
  /**
   * The one unit allowed on the shared axis. null means the papers share no
   * unit at all, so no axis exists and the plot is suppressed on purpose.
   */
  plotUnits: string | null;
  axisLabel: string;
  /** Extra outcome ids folded in as context below the plot. */
  alsoShow?: string[];
  /** What the reader should take away. Written by hand, never generated. */
  takeaway: string;
};

export const OUTCOMES: Outcome[] = [
  {
    id: "price_pass_through",
    question: "Did the tax actually reach the shelf price?",
    short: "Price pass-through",
    plotUnits: "cents/oz",
    axisLabel: "cents added per ounce, tax is 1.5 cents/oz",
    takeaway:
      "Three teams measured the same quantity in the same city and their intervals do not all overlap. That is the finding. Anyone who quotes a single pass-through number is picking a paper.",
  },
  {
    id: "volume_net",
    question: "Did people actually drink less, or just shop elsewhere?",
    short: "Volume sold",
    plotUnits: "percent",
    axisLabel: "percent change in taxed beverage volume, net of cross-border purchases",
    alsoShow: ["volume_city"],
    takeaway:
      "In-city sales fell hard. Once purchases just over the city line are counted, the drop shrinks. No paper here published an interval, so the spread between them is all the uncertainty you get.",
  },
  {
    id: "employment",
    question: "Did it cost jobs?",
    short: "Employment",
    // Three papers, three units. There is no honest shared axis.
    plotUnits: null,
    axisLabel: "",
    takeaway:
      "These three studies do not share a unit, so this tool will not draw them on one axis. Two looked at administrative data and found nothing. The third is an industry-funded input-output model reporting jobs nobody counted.",
  },
  {
    id: "revenue",
    question: "How much money did the tax raise, and on how much soda?",
    short: "Revenue",
    plotUnits: null,
    axisLabel: "",
    takeaway:
      "This one is division, not economics. Collections divided by the statutory rate gives the taxed volume the city actually billed for.",
  },
];

export function outcomeById(id: string): Outcome | undefined {
  return OUTCOMES.find((o) => o.id === id);
}

export function rowsFor(outcomeIds: string[]): Row[] {
  return CORPUS.filter((r) => outcomeIds.includes(r.outcome));
}

/** Everything the view needs, all of it computed by lib/band.ts. */
export function viewFor(o: Outcome) {
  const primary = rowsFor([o.id]);
  const { plotted, otherScale } = partitionByUnits(primary, o.plotUnits);
  const context = o.alsoShow ? rowsFor(o.alsoShow) : [];
  return {
    plotted,
    otherScale,
    context,
    band: band(plotted),
    consistency: consistency(plotted),
  };
}
