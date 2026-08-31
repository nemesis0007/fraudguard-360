import { writeFileSync } from "node:fs";
import { FeatureEngine } from "../src/features.js";
import { generateTrainingTransactions } from "../src/generator.js";
import { ModelAdapter } from "../src/model-adapter.js";

function round(value) { return Number(value.toFixed(6)); }

function averagePrecision(rows) {
  const ordered = [...rows].sort((a, b) => b.probability - a.probability);
  const positives = ordered.filter((row) => row.label).length;
  let tp = 0; let total = 0;
  for (let index = 0; index < ordered.length; index += 1) if (ordered[index].label) { tp += 1; total += tp / (index + 1); }
  return positives ? total / positives : 0;
}

function rocAuc(rows) {
  const ordered = [...rows].sort((a, b) => a.probability - b.probability);
  let rankSum = 0; let index = 0;
  while (index < ordered.length) {
    let end = index + 1;
    while (end < ordered.length && ordered[end].probability === ordered[index].probability) end += 1;
    const averageRank = (index + 1 + end) / 2;
    for (let cursor = index; cursor < end; cursor += 1) if (ordered[cursor].label) rankSum += averageRank;
    index = end;
  }
  const positive = ordered.filter((row) => row.label).length; const negative = ordered.length - positive;
  return positive && negative ? (rankSum - positive * (positive + 1) / 2) / (positive * negative) : 0;
}

const model = new ModelAdapter("models/auralis-xgb-210k-v1.json");
if (!model.available) throw new Error(model.error);
const transactions = generateTrainingTransactions({ scenarioId: "LAUNDER_001", volume: 10000, seed: 104729, fraudRate: 0.25, hardNegativeRate: 0.15, signalStrength: 0.88 });
const engine = new FeatureEngine();
const rows = transactions.map((transaction) => ({ label: transaction.is_fraud, probability: model.predict(engine.transform(transaction)) }));
const threshold = model.artifact.decision_threshold;
let tp = 0; let fp = 0; let tn = 0; let fn = 0;
for (const row of rows) {
  const predicted = row.probability >= threshold;
  if (predicted && row.label) tp += 1; else if (predicted) fp += 1; else if (row.label) fn += 1; else tn += 1;
}
const precision = tp / (tp + fp); const recall = tp / (tp + fn);
const report = {
  schema_version: "1.0", model_version: model.artifact.model_version, dataset: "synthetic-1.1",
  evaluation_type: "COMPLETELY_EXCLUDED_ATTACK_FAMILY", holdout_scenario: "LAUNDER_001", rows: rows.length,
  seed: 104729, threshold, metrics: { accuracy: round((tp + tn) / rows.length), precision: round(precision), recall: round(recall), f1: round(2 * precision * recall / (precision + recall)), false_positive_rate: round(fp / (fp + tn)), roc_auc: round(rocAuc(rows)), pr_auc: round(averagePrecision(rows)), confusion_matrix: { tp, fp, tn, fn } },
  limitation: "Synthetic excluded-family stress evidence; not a production performance claim."
};
writeFileSync("models/auralis-xgb-210k-holdout.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
