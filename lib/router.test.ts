import { test } from "node:test";
import assert from "node:assert/strict";
import { routeByRules, noEvidence } from "./router.ts";

test("the demo question routes to pass-through", () => {
  const r = routeByRules("What if Philadelphia doubled the soda tax price?");
  assert.equal(r?.verdict, "have_evidence");
  assert.equal(r?.matched_outcome, "price_pass_through");
});

test("minimum wage is refused as preempted, not answered", () => {
  const r = routeByRules("Raise the Philly minimum wage to $20 an hour");
  assert.equal(r?.verdict, "out_of_jurisdiction");
  assert.equal(r?.matched_outcome, null);
  assert.match(r!.reason, /Minimum Wage Act/);
});

test("firearms is refused as preempted", () => {
  const r = routeByRules("Ban assault weapons in Philadelphia");
  assert.equal(r?.verdict, "out_of_jurisdiction");
  assert.match(r!.reason, /6120/);
});

test("another city is refused rather than borrowing Philadelphia numbers", () => {
  const r = routeByRules("What would a soda tax do in Chicago?");
  assert.equal(r?.verdict, "out_of_jurisdiction");
  assert.match(r!.reason, /not transferable/);
});

test("naming Philadelphia beats the elsewhere guard", () => {
  // "Philadelphia vs the federal government" must still route, not refuse.
  const r = routeByRules("Did Philadelphia's tax raise revenue the federal government noticed?");
  assert.equal(r?.verdict, "have_evidence");
});

test("jobs routes to employment", () => {
  const r = routeByRules("Did the beverage tax cost jobs?");
  assert.equal(r?.matched_outcome, "employment");
});

test("ambiguous input falls through to the model layer, it does not guess", () => {
  assert.equal(routeByRules("purple monorail zoning variance"), null);
});

test("the no-evidence refusal names what the corpus does cover", () => {
  const r = noEvidence("build a monorail");
  assert.equal(r.verdict, "no_evidence");
  assert.match(r.reason, /price pass-through/);
  assert.match(r.reason, /will not estimate/);
});

test("preemption is checked before keyword routing", () => {
  // Contains "jobs", which would otherwise route to employment. Preemption wins.
  const r = routeByRules("Would a higher minimum wage cost jobs in Philadelphia?");
  assert.equal(r?.verdict, "out_of_jurisdiction");
});

test("on-topic with no outcome named opens on pass-through and admits the choice", () => {
  const r = routeByRules("What if Philadelphia doubled the soda tax?");
  assert.equal(r?.verdict, "have_evidence");
  assert.equal(r?.matched_outcome, "price_pass_through");
  assert.match(r!.reason, /does not name one outcome/);
});

test("a tie between two outcomes is not broken by list order", () => {
  // One price word, one employment word. Neither wins, so it must not pretend.
  const r = routeByRules("prices jobs");
  assert.equal(r, null);
});
