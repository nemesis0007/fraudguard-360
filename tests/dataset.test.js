import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

const samplePath = new URL("../data/sample/training-dataset.sample.jsonl", import.meta.url);
const archivePath = new URL("../data/releases/fraudguard-360-synthetic-dataset-210k.zip", import.meta.url);
const manifestPath = new URL("../data/dataset-manifest.json", import.meta.url);

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
}

test("committed dataset sample and full archive match the lineage manifest", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const lines = readFileSync(samplePath, "utf8").trim().split("\n");
  const metadata = JSON.parse(lines[0])._meta;
  const first = JSON.parse(lines[1]);

  assert.equal(lines.length - 1, manifest.sample_rows);
  assert.equal(manifest.rows, 210000);
  assert.equal(metadata.generator_version, manifest.version);
  assert.deepEqual(metadata.holdout_scenarios, manifest.holdout_scenarios);
  assert.equal(first.synthetic_profile, "ATTACK");
  assert.equal(typeof first.features.amount_deviation, "number");
  assert.equal(sha256(samplePath), manifest.sample_sha256);
  assert.equal(sha256(archivePath), manifest.full_archive_sha256);
  assert.ok(statSync(archivePath).size > 2_000_000);
  assert.equal(manifest.synthetic_only, true);
  assert.equal(manifest.contains_pii, false);
});
