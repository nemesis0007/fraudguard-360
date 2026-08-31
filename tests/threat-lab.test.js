import test from "node:test";
import assert from "node:assert/strict";
import { FraudGuardPlatform } from "../src/platform.js";
import { buildServer } from "../src/server.js";

test("GenAI threat drafts require explicit human approval before simulation", async () => {
  const platform = new FraudGuardPlatform();
  const draft = await platform.discoverThreat({ focus: "cross-channel synthetic identity coordination", base_scenario_id: "SYNID_001", payment_surface: "WALLET" });
  assert.equal(draft.status, "PENDING_REVIEW");
  assert.equal(draft.simulation_ready, false);
  assert.throws(() => platform.simulateThreatDraft(draft.scenario_id), /SCENARIO_NOT_APPROVED/);

  const approved = platform.reviewThreat(draft.scenario_id, { decision: "APPROVE", reviewer: "member-6", notes: "Safe aggregate telemetry only" });
  assert.equal(approved.status, "APPROVED");
  const dataset = platform.simulateThreatDraft(draft.scenario_id, { volume: 40, seed: 77 });
  assert.equal(dataset.rows, 40);
  assert.equal(dataset.source_threat_scenario_id, draft.scenario_id);
  assert.equal(dataset.governance.synthetic_only, true);
});
test("feedback gaps create review-gated threat candidates without changing the model", async () => {
  const platform = new FraudGuardPlatform();
  platform.addFeedback({ transaction_id: "TX_GAP", predicted: "LEGITIMATE", actual: "FRAUD", scenario_id: "MULE_001" });
  const draft = await platform.proposeThreatFromFeedback();
  assert.equal(draft.status, "PENDING_REVIEW");
  assert.equal(draft.provenance.source, "AGGREGATED_FEEDBACK_GAP");
  assert.deepEqual(draft.provenance.parent_feedback_ids, [platform.feedback[0].feedback_id]);
  assert.equal(platform.risk.modelHealth().status, "READY");
});

test("threat-lab HTTP flow exposes discover, review, and approved simulation", async () => {
  const { server } = buildServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const discovery = await fetch(`${base}/api/v1/threat-lab/discover`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ focus: "adaptive merchant graph anomaly", base_scenario_id: "MERCHANT_001" }) }).then((response) => response.json());
    const id = discovery.data.scenario_id;
    const blocked = await fetch(`${base}/api/v1/threat-lab/scenarios/${id}/simulate`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    assert.equal(blocked.status, 409);
    const review = await fetch(`${base}/api/v1/threat-lab/scenarios/${id}/review`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision: "APPROVE", reviewer: "operator" }) });
    assert.equal(review.status, 200);
    const simulated = await fetch(`${base}/api/v1/threat-lab/scenarios/${id}/simulate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ volume: 25 }) }).then((response) => response.json());
    assert.equal(simulated.data.rows, 25);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
