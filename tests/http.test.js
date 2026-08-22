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
  assert.equal(catalog.data.length, 22);
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

test("arena endpoint returns the twin graph, adaptive rounds, and decision receipts", () => withServer(async (base) => {
  const response = await fetch(`${base}/api/v1/arena/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ scenarioId: "MULE_001", volume: 80, seed: 27, aggression: 0.75, stealth: 0.6 })
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.rounds[0].id, "BASELINE");
  assert.equal(body.data.rounds[2].id, "ADAPTED");
  assert.ok(body.data.graph.edges.length > 0);
  assert.equal(body.data.governance.mode, "SYNTHETIC_SANDBOX");
}));

test("evidence endpoint exposes the hybrid data governance manifest", () => withServer(async (base) => {
  const response = await fetch(`${base}/api/v1/data/evidence`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.layers[1].status, "REFERENCE_ONLY");
}));

test("challenge endpoints and site expose expanded campaign intelligence", () => withServer(async (base) => {
  const [campaigns, coverage, homepage] = await Promise.all([
    fetch(`${base}/api/v1/campaign/catalog`).then((response) => response.json()),
    fetch(`${base}/api/v1/challenge/coverage`).then((response) => response.json()),
    fetch(base).then((response) => response.text())
  ]);
  assert.equal(campaigns.data.length, 24);
  assert.equal(campaigns.data.find((item) => item.id === "CORRIDOR_COMPOSER_020").base_family, "REMITTANCE_CORRIDOR_ABUSE");
  assert.equal(coverage.data.pillars.length, 4);
  assert.deepEqual(coverage.data.pillars.map((item) => item.id), ["IDENTIFY", "GENERATE", "DEFEND", "LEARN"]);
  assert.match(homepage, /24<\/b> AI-native campaigns/);
  assert.match(homepage, /22<\/b> payment attack families/);
}));

test("new attack surfaces run through the complete arena", () => withServer(async (base) => {
  const response = await fetch(`${base}/api/v1/arena/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ campaignId: "CORRIDOR_COMPOSER_020", volume: 90, seed: 2026, aggression: 0.81, stealth: 0.74 })
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.scenario.base_family, "REMITTANCE_CORRIDOR_ABUSE");
  assert.equal(body.data.scenario.codename, "Corridor Composer");
  assert.equal(body.data.scenario.kill_chain.length, 4);
  assert.ok(body.data.graph.edges.length > 0);
}));
