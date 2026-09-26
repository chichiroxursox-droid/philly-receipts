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
