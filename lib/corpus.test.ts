import { test } from "node:test";
import assert from "node:assert/strict";
import { OUTCOMES } from "./corpus.ts";

test("any outcome that draws no chart must say why", () => {
  for (const o of OUTCOMES) {
    if (o.plotUnits === null) {
      assert.ok(o.noChartReason, `${o.id} suppresses its chart with no reason given`);
    }
  }
});

test("axis labels stay short enough for a phone", () => {
  // The SVG viewBox is 392 units wide on a phone. An axis label past about 48
  // characters at 11.5px runs off both edges. Caught on the substitution view.
  for (const o of OUTCOMES) {
    if (!o.plotUnits) continue;
    assert.ok(
      o.axisLabel.length > 0 && o.axisLabel.length <= 48,
      `${o.id} axis label is ${o.axisLabel.length} chars: "${o.axisLabel}"`
    );
  }
});
