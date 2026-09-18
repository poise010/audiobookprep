// Proposal only: no billing, payments or membership entitlement is implemented.
export const plans = Object.freeze([
  {
    id: "essential",
    name: "Essential",
    monthly: 19,
    annualMonthly: 15,
    words: 150000,
    seats: 1,
  },
  {
    id: "narrator",
    name: "Narrator",
    monthly: 39,
    annualMonthly: 31,
    words: 400000,
    seats: 1,
  },
  {
    id: "studio",
    name: "Studio",
    monthly: 99,
    annualMonthly: 79,
    words: 1200000,
    seats: 3,
  },
]);
export const number = new Intl.NumberFormat("en-US");
export function recommendPlan(words) {
  if (!Number.isFinite(words) || words < 1)
    throw new RangeError("Monthly words must be a positive number.");
  return plans.find((plan) => words <= plan.words) ?? null;
}
export function planPrice(plan, billing) {
  if (billing !== "monthly" && billing !== "annual")
    throw new TypeError("Unknown billing period.");
  return billing === "annual" ? plan.annualMonthly : plan.monthly;
}
export function annualSaving(plan) {
  return (plan.monthly - plan.annualMonthly) * 12;
}
