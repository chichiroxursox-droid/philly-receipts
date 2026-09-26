import corpusJson from "./corpus.json" with { type: "json" };
import { band, consistency, partitionByUnits, type Row } from "./band.ts";

export const CORPUS = corpusJson as Row[];

export type OutcomeId =
  | "price_pass_through"
  | "volume_net"
  | "health"
  | "employment"
  | "revenue";

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
  /** Why no chart is drawn. Required whenever plotUnits is null. */
  noChartReason?: string;
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
    id: "health",
    question: "Did anyone actually get healthier?",
    short: "Health",
    plotUnits: "kg/m2 change at 3 years",
    axisLabel: "change in adult BMI after three years, kg/m2",
    takeaway:
      "Look at the two plotted rows. They are the same paper, the same city and the same three years. The panel sample follows the same adults over time and its interval crosses zero. The cross-sectional sample takes different people each period and its interval does not. The dental paper below splits the same way. So the honest sentence is that whether this tax improved health depends on how you build your sample, and the published work does not settle it.",
  },
  {
    id: "employment",
    question: "Did it cost jobs?",
    short: "Employment",
    // Three papers, three units. There is no honest shared axis.
    plotUnits: null,
    axisLabel: "",
    noChartReason:
      "These three papers do not share a unit, so there is no axis they can honestly share. Putting them on one would assert they measured the same quantity. They did not.",
    takeaway:
      "These three studies do not share a unit, so this tool will not draw them on one axis. Two looked at administrative data and found nothing. The third is an industry-funded input-output model reporting jobs nobody counted.",
  },
  {
    id: "revenue",
    question: "How much money did the tax raise, and on how much soda?",
    short: "Revenue",
    plotUnits: null,
    axisLabel: "",
    alsoShow: ["spending"],
    noChartReason:
      "These are city records, not study estimates, and they are not comparable quantities. One is a full year of collections, one is eleven months, one is a budget forecast, and one is the statutory rate. Charting them side by side would invite exactly the comparison that misreports this tax.",
    takeaway:
      "This one is division, not economics. Collections divided by the statutory rate gives the taxed volume the city actually billed for. Watch the labels: the FY2026 figure covers eleven months, not a year, and the larger number next to it is a budget forecast rather than money collected. Comparing either to a full year is the most common way this tax gets misreported.",
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

const IDS = new Set(CORPUS.map((r) => r.id));

/**
 * Provenance guard. Every number on screen renders through this, so a number
 * without a real corpus row id is a crash, not a silent unsourced figure.
 */
export function assertRowId(id: string): string {
  if (!IDS.has(id)) {
    throw new Error(
      `Unsourced number: no corpus row "${id}". Every displayed figure must trace to lib/corpus.json.`
    );
  }
  return id;
}

export function rowById(id: string): Row | undefined {
  return CORPUS.find((r) => r.id === id);
}
