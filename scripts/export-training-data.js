import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { ATTACK_CATALOG } from "../src/catalog.js";
import { FeatureEngine } from "../src/features.js";
import { generateTrainingTransactions } from "../src/generator.js";

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function bucket(value) {
  return Number.parseInt(createHash("sha256").update(value).digest("hex").slice(0, 8), 16) % 10;
}

const output = resolve(argument("--output", "data/runtime/training-dataset.jsonl"));
const holdoutScenario = argument("--holdout", "LAUNDER_001");
const rowsPerScenario = Math.max(200, Math.min(50000, Number(argument("--rows", "10000")) || 10000));
const scenarios = ATTACK_CATALOG.filter((item) => item.id !== holdoutScenario);
const lines = [JSON.stringify({
  _meta: {
    schema_version: "1.0",
    feature_version: "features-1.0",
    generator_version: "synthetic-1.1",
    hard_negative_rate: 0.15,
    signal_strength: 0.88,
    seed: 2026,
    rows_per_scenario: rowsPerScenario,
    training_scenarios: scenarios.map((item) => item.id),
    holdout_scenarios: [holdoutScenario],
    split_strategy: "customer-entity hash: 70% train / 10% validation / 20% test"
  }
})];

for (const [index, scenario] of scenarios.entries()) {
  const featureEngine = new FeatureEngine();
  const transactions = generateTrainingTransactions({ scenarioId: scenario.id, volume: rowsPerScenario, seed: 2026 + index * 97, fraudRate: 0.25 });
  for (const transaction of transactions) {
    const entityBucket = bucket(`${scenario.id}:${transaction.customer_id}`);
    const split = entityBucket < 7 ? "train" : entityBucket === 7 ? "validation" : "test";
    lines.push(JSON.stringify({
      split,
      scenario_id: scenario.id,
      customer_id: transaction.customer_id,
      label: transaction.is_fraud ? 1 : 0,
      synthetic_profile: transaction.synthetic_profile,
      features: featureEngine.transform(transaction)
    }));
  }
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${lines.join("\n")}\n`, "utf8");
console.log(JSON.stringify({ output, rows: lines.length - 1, holdout_scenario: holdoutScenario }));
