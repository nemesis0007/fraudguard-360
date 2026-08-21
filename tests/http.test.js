import test from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "../src/server.js";

async function withServer(run) {
  const { server } = buildServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try { await run(`http://127.0.0.1:${port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

test("health and catalog endpoints use the shared envelope", () => withServer(async (base) => {
  const health = await fetch(`${base}/health`).then((response) => response.json());
  const catalog = await fetch(`${base}/api/v1/attack/catalog`).then((response) => response.json());
  assert.equal(health.status, "success");
  assert.equal(health.data.healthy, true);
  assert.ok(catalog.data.length >= 8);
}));

test("score endpoint rejects incomplete transactions", () => withServer(async (base) => {
  const response = await fetch(`${base}/api/v1/score`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ transaction_id: "TX_BAD" }) });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error.code, "MISSING_FIELDS");
}));

test("model health exposes the locked artifact manifest", () => withServer(async (base) => {
  const response = await fetch(`${base}/api/v1/model/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.status, "READY");
  assert.match(body.data.model_version, /^fg-linear-/);
  assert.deepEqual(body.data.holdout_scenarios, ["LAUNDER_001"]);
}));

test("fidelity endpoint exposes the committed generator audit", () => withServer(async (base) => {
  const response = await fetch(`${base}/api/v1/fidelity/report`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.status, "PASS");
  assert.equal(body.data.failed, 0);
  assert.equal(body.data.checks.length, body.data.passed);
}));

test("learning endpoint returns traceable variants without model promotion", () => withServer(async (base) => {
  const response = await fetch(`${base}/api/v1/learn/mutate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ scenarioId: "LAUNDER_001", volume: 180, seed: 9001, maxMisses: 3 })
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.governance.active_model_changed, false);
  assert.equal(body.data.governance.promotion_allowed, false);
  assert.ok(body.data.variants_generated > 0);
}));
