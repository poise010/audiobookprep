import test from "node:test";
import assert from "node:assert/strict";
import {
  plans,
  recommendPlan,
  planPrice,
  annualSaving,
} from "../assets/pricing.js";
test("Recommendations use inclusive allowance boundaries", () => {
  assert.equal(recommendPlan(1).id, "essential");
  assert.equal(recommendPlan(150000).id, "essential");
  assert.equal(recommendPlan(150001).id, "narrator");
  assert.equal(recommendPlan(400000).id, "narrator");
  assert.equal(recommendPlan(400001).id, "studio");
  assert.equal(recommendPlan(1200000).id, "studio");
  assert.equal(recommendPlan(1200001), null);
});
test("Annual totals and savings reconcile with monthly prices", () => {
  for (const plan of plans) {
    assert.equal(
      planPrice(plan, "annual") * 12 + annualSaving(plan),
      planPrice(plan, "monthly") * 12,
    );
    assert.ok(annualSaving(plan) > 0);
    assert.ok(annualSaving(plan) / (plan.monthly * 12) > 0.19);
    assert.ok(annualSaving(plan) / (plan.monthly * 12) < 0.22);
  }
});
test("Invalid values cannot silently select a plan", () => {
  for (const value of [NaN, Infinity, -1, 0, "150000"])
    assert.throws(() => recommendPlan(value));
  assert.throws(() => planPrice(plans[0], "weekly"));
});
