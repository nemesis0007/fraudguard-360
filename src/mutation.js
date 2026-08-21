import { createHash } from "node:crypto";
import { seededRandom } from "./random.js";

function round(value) {
  return Math.round(value * 100) / 100;
}

export function createDefensiveVariants(transaction, { seed = 42, count = 3 } = {}) {
  const random = seededRandom(seed);
  const strategies = ["AMOUNT_BOUNDARY", "PAYEE_NOVELTY", "DEVICE_CONTEXT", "MERCHANT_CONTEXT"];
  return Array.from({ length: Math.max(1, Math.min(4, count)) }, (_, index) => {
    const strategy = strategies[index % strategies.length];
    const variant = {
      ...transaction,
      transaction_id: `${transaction.transaction_id}_M${index + 1}`,
      parent_transaction_id: transaction.transaction_id,
      mutation_strategy: strategy,
      mutation_version: "defensive-1.0",
      scenario_version: "1.1",
      timestamp: new Date(Date.parse(transaction.timestamp) + (index + 1) * 1000).toISOString(),
      synthetic: true,
      synthetic_profile: "DEFENSE_GUIDED_VARIANT"
    };
    if (strategy === "AMOUNT_BOUNDARY") variant.amount = round(transaction.amount * (0.9 + random() * 0.35));
    if (strategy === "PAYEE_NOVELTY") variant.new_payee = true;
    if (strategy === "DEVICE_CONTEXT") variant.device_id = `D_MUT_${transaction.customer_id}_${index + 1}`;
    if (strategy === "MERCHANT_CONTEXT") variant.merchant_risk = round(Math.min(1, Number(transaction.merchant_risk || 0) + 0.18));
    return variant;
  });
}

export function mutationBatchId(payload) {
  const digest = createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 10);
  return `MUT_${digest}`;
}
