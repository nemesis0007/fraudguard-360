import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { ATTACK_CATALOG } from "../src/catalog.js";
import { FeatureEngine } from "../src/features.js";
import { generateTransactions } from "../src/generator.js";

const FEATURE_NAMES = [
  "velocity_1h", "amount_deviation", "new_device", "shared_device_count",
  "location_shift", "new_payee", "card_not_present", "unusual_hour",
  "new_account", "identity_mismatch", "merchant_risk"
];

function round(value, digits = 4) {
  return Number(value.toFixed(digits));
}

function mean(values) {
  return values.reduce((total, value) => total + value, 0) / Math.max(values.length, 1);
}

function correlation(left, right) {
  const leftMean = mean(left);
  const rightMean = mean(right);
  let numerator = 0; let leftVariance = 0; let rightVariance = 0;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index] - leftMean;
    const b = right[index] - rightMean;
    numerator += a * b;
    leftVariance += a * a;
    rightVariance += b * b;
  }
  const denominator = Math.sqrt(leftVariance * rightVariance);
  return denominator ? numerator / denominator : 0;
}

function histogramOverlap(left, right, bins = 12) {
  const values = [...left, ...right].map((value) => Math.log1p(value));
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const width = (maximum - minimum) / bins || 1;
  const histogram = (source) => {
    const counts = Array(bins).fill(0);
    for (const raw of source) {
      const index = Math.min(bins - 1, Math.floor((Math.log1p(raw) - minimum) / width));
      counts[index] += 1;
    }
    return counts.map((count) => count / Math.max(source.length, 1));
  };
  const first = histogram(left);
  const second = histogram(right);
  return first.reduce((total, value, index) => total + Math.min(value, second[index]), 0);
}

function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

const output = resolve(process.argv[2] ?? "models/synthetic-fidelity-v1.json");
const rows = [];
const scenarioResults = [];
let deterministic = true;
let seedDiverse = true;
let monotonic = true;

for (const [index, scenario] of ATTACK_CATALOG.entries()) {
  const seed = 3100 + index * 101;
  const input = { scenarioId: scenario.id, volume: 600, seed, fraudRate: 0.25 };
  const transactions = generateTransactions(input);
  deterministic &&= stableHash(transactions) === stableHash(generateTransactions(input));
  seedDiverse &&= stableHash(transactions) !== stableHash(generateTransactions({ ...input, seed: seed + 1 }));
  monotonic &&= transactions.every((row, rowIndex) => rowIndex === 0 || row.timestamp > transactions[rowIndex - 1].timestamp);
  const engine = new FeatureEngine();
  const enriched = transactions.map((transaction) => ({ transaction, features: engine.transform(transaction) }));
  rows.push(...enriched);
  const fraudRows = transactions.filter((row) => row.is_fraud);
  const legitimateRows = transactions.filter((row) => !row.is_fraud);
  scenarioResults.push({
    scenario_id: scenario.id,
    rows: transactions.length,
    fraud_rate: round(fraudRows.length / transactions.length),
    hard_negative_rate: round(legitimateRows.filter((row) => row.synthetic_profile === "HARD_NEGATIVE").length / legitimateRows.length)
  });
}

const transactions = rows.map((row) => row.transaction);
const featureRows = rows.map((row) => row.features);
const requiredFields = [
  "transaction_id", "customer_id", "merchant_id", "device_id", "amount", "currency",
  "channel", "timestamp", "country", "scenario_id", "scenario_version", "synthetic",
  "is_fraud", "synthetic_profile"
];
const schemaCompleteness = mean(transactions.map((row) => requiredFields.every((field) => row[field] !== undefined && row[field] !== null) ? 1 : 0));
const uniqueIds = new Set(transactions.map((row) => `${row.scenario_id}:${row.transaction_id}`)).size / transactions.length;
const legitimate = transactions.filter((row) => !row.is_fraud);
const fraud = transactions.filter((row) => row.is_fraud);
const hardNegatives = legitimate.filter((row) => row.synthetic_profile === "HARD_NEGATIVE");
const overallFraudRate = fraud.length / transactions.length;
const overallHardNegativeRate = hardNegatives.length / legitimate.length;
const hardNegativeFeatureCoverage = mean(rows.filter((row) => row.transaction.synthetic_profile === "HARD_NEGATIVE").map(({ features }) => (
  features.new_device || features.location_shift || features.new_payee || features.card_not_present
  || features.new_account || features.merchant_risk >= 0.55 || features.amount_deviation >= 0.8
) ? 1 : 0));
const amountOverlap = histogramOverlap(fraud.map((row) => row.amount), legitimate.map((row) => row.amount));

let maximumCorrelation = { left: null, right: null, absolute_correlation: 0 };
for (let left = 0; left < FEATURE_NAMES.length; left += 1) {
  for (let right = left + 1; right < FEATURE_NAMES.length; right += 1) {
    const value = Math.abs(correlation(
      featureRows.map((row) => Number(row[FEATURE_NAMES[left]]) || 0),
      featureRows.map((row) => Number(row[FEATURE_NAMES[right]]) || 0)
    ));
    if (value > maximumCorrelation.absolute_correlation) {
      maximumCorrelation = { left: FEATURE_NAMES[left], right: FEATURE_NAMES[right], absolute_correlation: round(value) };
    }
  }
}

const privacySafe = transactions.every((row) => row.synthetic === true
  && !Object.keys(row).some((key) => ["card_number", "pan", "cvv", "email", "phone"].includes(key)));
const featureRangesValid = featureRows.every((row) => FEATURE_NAMES.every((name) => Number.isFinite(Number(row[name])))
  && row.merchant_risk >= 0 && row.merchant_risk <= 1);

const checks = [
  { id: "deterministic_replay", value: deterministic, target: true, pass: deterministic },
  { id: "seed_diversity", value: seedDiverse, target: true, pass: seedDiverse },
  { id: "timestamp_monotonicity", value: monotonic, target: true, pass: monotonic },
  { id: "schema_completeness", value: round(schemaCompleteness), target: ">= 0.999", pass: schemaCompleteness >= 0.999 },
  { id: "identifier_uniqueness", value: round(uniqueIds), target: "1.0", pass: uniqueIds === 1 },
  { id: "fraud_rate_control", value: round(overallFraudRate), target: "0.20–0.30", pass: overallFraudRate >= 0.2 && overallFraudRate <= 0.3 },
  { id: "hard_negative_prevalence", value: round(overallHardNegativeRate), target: "0.10–0.20", pass: overallHardNegativeRate >= 0.1 && overallHardNegativeRate <= 0.2 },
  { id: "hard_negative_feature_coverage", value: round(hardNegativeFeatureCoverage), target: ">= 0.55", pass: hardNegativeFeatureCoverage >= 0.55 },
  { id: "amount_distribution_overlap", value: round(amountOverlap), target: ">= 0.20", pass: amountOverlap >= 0.2 },
  { id: "feature_correlation_ceiling", value: maximumCorrelation.absolute_correlation, target: "<= 0.95", pass: maximumCorrelation.absolute_correlation <= 0.95 },
  { id: "feature_ranges", value: featureRangesValid, target: true, pass: featureRangesValid },
  { id: "privacy_boundary", value: privacySafe, target: true, pass: privacySafe }
];

const evidence = {
  schema_version: "1.0",
  generator_version: "synthetic-1.1",
  rows: transactions.length,
  scenarios: ATTACK_CATALOG.length,
  checks,
  passed: checks.filter((check) => check.pass).length,
  failed: checks.filter((check) => !check.pass).length,
  quality_score: round(checks.filter((check) => check.pass).length / checks.length),
  diagnostics: {
    maximum_feature_correlation: maximumCorrelation,
    scenario_profiles: scenarioResults
  },
  limitations: [
    "Statistical checks compare synthetic cohorts with each other, not with a confidential production reference population.",
    "Passing gates establishes generator consistency and controlled overlap; it does not establish production realism."
  ]
};
const identity = stableHash(evidence).slice(0, 10);
const report = { ...evidence, report_version: `fg-fidelity-${identity}` };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output, report_version: report.report_version, passed: report.passed, failed: report.failed, quality_score: report.quality_score }, null, 2));
if (report.failed) process.exitCode = 1;
