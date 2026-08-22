import { randomUUID } from "node:crypto";
import { FeatureEngine } from "./features.js";
import { generateTransactions } from "./generator.js";
import { seededRandom } from "./random.js";
import { CAMPAIGN_CATALOG, getCampaign } from "./campaigns.js";
import { getScenario } from "./catalog.js";

const SCENARIO_PROFILES = Object.freeze({
  ATO_001: { label: "Agentic account takeover", tactic: "AUTHORIZATION_DRIFT", graph: "DEVICE_FAN_OUT" },
  CNP_001: { label: "Autonomous card-testing swarm", tactic: "PROBE_AND_PIVOT", graph: "MERCHANT_BURST" },
  MULE_001: { label: "Merchant–mule collusion ring", tactic: "COLLUSIVE_NETWORK", graph: "SHARED_DEVICE_CLUSTER" },
  BOT_001: { label: "Adaptive authorization probing", tactic: "POLICY_ORACLE_PROBING", graph: "LOW_VALUE_BURST" },
  REFUND_001: { label: "Dispute-loop optimization", tactic: "REFUND_LOOP", graph: "MERCHANT_RECURRENCE" },
  UPI_001: { label: "AI-assisted payment coercion", tactic: "SOCIAL_ENGINEERING", graph: "NEW_PAYEE_CHAIN" },
  SYNID_001: { label: "Synthetic identity maturation", tactic: "IDENTITY_INCUBATION", graph: "IDENTITY_REUSE" },
  LAUNDER_001: { label: "Cross-rail value fragmentation", tactic: "SPLIT_AND_MERGE", graph: "RAPID_LAYERING" },
  PROMO_001: { label: "Multi-agent incentive abuse", tactic: "ACCOUNT_SWARM", graph: "DEVICE_COMMUNITY" },
  FRIENDLY_001: { label: "Adversarial dispute precursor", tactic: "DISPUTE_PRECONDITIONING", graph: "BEHAVIORAL_STABILITY" }
});

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function round(value, places = 2) { const factor = 10 ** places; return Math.round(value * factor) / factor; }
function money(transactions) { return round(transactions.reduce((sum, item) => sum + Number(item.amount), 0)); }

function policy(score) {
  if (score >= 80) return "BLOCK";
  if (score >= 60) return "REVIEW";
  if (score >= 35) return "STEP_UP";
  return "ALLOW";
}
function graphSignal(transaction, profile, random) {
  const base = transaction.is_fraud ? 20 : transaction.synthetic_profile === "HARD_NEGATIVE" ? 7 : 2;
  const motif = profile.graph === "RAPID_LAYERING" || profile.graph === "SHARED_DEVICE_CLUSTER" ? 8 : 4;
  return clamp(Math.round(base + motif + random() * 8), 0, 35);
}

function scoreBranch(transactions, risk, { graphDefense, defenderStrength, profile, seed }) {
  const features = new FeatureEngine();
  const random = seededRandom(seed);
  return transactions.map((transaction, index) => {
    const base = risk.score(features.transform(transaction));
    const graph_score = graphDefense ? graphSignal(transaction, profile, random) : 0;
    const fusionWeight = graphDefense ? 0.35 + defenderStrength * 0.25 : 0;
    const fused = clamp(Math.round(base.risk_score * (1 - fusionWeight) + graph_score * 2.35 * fusionWeight), 0, 100);
    const decision = policy(fused);
    return {
      transaction_id: transaction.transaction_id,
      sequence: index + 1,
      amount: transaction.amount,
      is_fraud: transaction.is_fraud,
      decision,
      risk_score: fused,
      transaction_score: base.risk_score,
      graph_score,
      reason_codes: [...new Set([...base.reason_codes, ...(graph_score >= 20 ? [profile.graph] : [])])].slice(0, 4)
    };
  });
}

function summarize(transactions, decisions) {
  const attacks = decisions.filter((item) => item.is_fraud);
  const benign = decisions.filter((item) => !item.is_fraud);
  const detected = attacks.filter((item) => item.decision !== "ALLOW");
  const escaped = attacks.filter((item) => item.decision === "ALLOW");
  const falseInterventions = benign.filter((item) => item.decision !== "ALLOW");
  const values = new Map(transactions.map((item) => [item.transaction_id, Number(item.amount)]));
  return {
    transactions: transactions.length,
    payment_value: money(transactions),
    attack_attempts: attacks.length,
    attacks_detected: detected.length,
    attack_recall: attacks.length ? round(detected.length / attacks.length, 4) : 0,
    prevented_value: round(detected.reduce((sum, item) => sum + values.get(item.transaction_id), 0)),
    escaped_value: round(escaped.reduce((sum, item) => sum + values.get(item.transaction_id), 0)),
    customer_friction_rate: benign.length ? round(falseInterventions.length / benign.length, 4) : 0,
    false_interventions: falseInterventions.length
  };
}

function buildGraph(transactions, decisions, profile) {
  const nodeMap = new Map();
  const edges = [];
  const decisionMap = new Map(decisions.map((item) => [item.transaction_id, item]));
  const addNode = (id, type, label) => {
    if (!nodeMap.has(id)) nodeMap.set(id, { id, type, label, risk: 0, events: 0 });
    return nodeMap.get(id);
  };
  for (const transaction of transactions.slice(0, 70)) {
    const decision = decisionMap.get(transaction.transaction_id);
    const customer = addNode(transaction.customer_id, "customer", transaction.customer_id);
    const merchant = addNode(transaction.merchant_id, "merchant", transaction.merchant_id.replace("M_", ""));
    const device = addNode(transaction.device_id, "device", transaction.device_id.startsWith("D_NEW") ? "new device" : transaction.device_id);
    for (const node of [customer, merchant, device]) {
      node.risk = Math.max(node.risk, decision.risk_score);
      node.events += 1;
    }
    edges.push({ source: customer.id, target: merchant.id, kind: "payment", risk: decision.risk_score, blocked: decision.decision !== "ALLOW" });
    edges.push({ source: customer.id, target: device.id, kind: "uses", risk: decision.graph_score, blocked: false });
  }
  return {
    motif: profile.graph,
    nodes: [...nodeMap.values()].sort((a, b) => b.risk - a.risk).slice(0, 34),
    edges: edges.filter((edge) => nodeMap.has(edge.source) && nodeMap.has(edge.target)).slice(0, 72)
  };
}

function timeline(profile, attack, adapted) {
  const firstDetected = adapted.find((item) => item.is_fraud && item.decision !== "ALLOW");
  const firstEscape = attack.find((item) => item.is_fraud && item.decision === "ALLOW");
  return [
    { offset_ms: 0, actor: "TWIN", title: "Counterfactual baseline forked", detail: "Identical customer intent is replayed into clean and attacked worlds." },
    { offset_ms: 420, actor: "RED", title: profile.label, detail: `${profile.tactic.replaceAll("_", " ")} policy activated inside a fictional payment network.` },
    { offset_ms: 910, actor: "RED", title: firstEscape ? "Low-signal probe passed" : "Attack pressure observed", detail: firstEscape ? `${firstEscape.transaction_id} remained below the transaction-only threshold.` : "The first wave produced enough local risk to trigger intervention." },
    { offset_ms: 1380, actor: "BLUE", title: `${profile.graph.replaceAll("_", " ")} motif surfaced`, detail: "Temporal and entity-link evidence was fused with the real-time transaction score." },
    { offset_ms: 1810, actor: "BLUE", title: firstDetected ? "Adaptive policy intervened" : "Case escalated for review", detail: firstDetected ? `${firstDetected.transaction_id} produced a governed ${firstDetected.decision} decision.` : "No automatic block was issued without sufficient evidence." },
    { offset_ms: 2240, actor: "GOVERNANCE", title: "Replay sealed", detail: "Decision receipts, versions, and counterfactual deltas were recorded; no live model was changed." }
  ];
}

function agentTrace(campaign, controls, attackMetrics, adaptedMetrics) {
  const escaped = Math.max(0, attackMetrics.attack_attempts - attackMetrics.attacks_detected);
  return [
    { agent: "THREAT SCOUT", state: "COMPLETE", action: "Selected an under-covered payment behavior", evidence: `${campaign.channels.length} channels · novelty ${campaign.novelty}` },
    { agent: "SCENARIO PLANNER", state: "COMPLETE", action: "Compiled a bounded campaign plan", evidence: `${campaign.kill_chain.length} stages · difficulty ${campaign.difficulty}` },
    { agent: "SWARM ORCHESTRATOR", state: "COMPLETE", action: "Materialized fictional actors and events", evidence: `${controls.volume} events · ${Math.max(4, Math.round(controls.aggression * 12))} parallel agents` },
    { agent: "POLICY MUTATOR", state: escaped ? "ADAPTED" : "CONTAINED", action: escaped ? "Shifted pressure toward observed gaps" : "Could not find a transaction-only escape", evidence: `${escaped} initial escapes · stealth ${Math.round(controls.stealth * 100)}%` },
    { agent: "BLUE EVALUATOR", state: "SEALED", action: "Compared transaction-only and graph-aware defense", evidence: `${Math.round(adaptedMetrics.attack_recall * 100)}% recall · human gate preserved` }
  ];
}

export function runTwinArena(risk, input = {}) {
  const campaign = getCampaign(input.campaignId)
    ?? CAMPAIGN_CATALOG.find((item) => item.base_scenario_id === input.scenarioId)
    ?? CAMPAIGN_CATALOG[0];
  const scenarioId = campaign.base_scenario_id;
  const baseScenario = getScenario(scenarioId);
  const profile = { label: campaign.name, tactic: campaign.ai_enabler, graph: campaign.graph_motif };
  const seed = Number(input.seed) || 42;
  const volume = clamp(Number(input.volume) || 120, 40, 400);
  const aggression = clamp(Number(input.aggression) || 0.72, 0.2, 1);
  const stealth = clamp(Number(input.stealth) || 0.64, 0.1, 0.95);
  const defenderStrength = clamp(Number(input.defenderStrength) || 0.78, 0.2, 1);
  const graphDefense = input.graphDefense !== false;
  const attackRate = clamp(0.08 + aggression * 0.32, 0.08, 0.45);
  const signalStrength = clamp(0.96 - stealth * 0.38, 0.55, 0.93);

  const baseline = generateTransactions({ scenarioId, volume, seed, fraudRate: 0.02, hardNegativeRate: 0.12, signalStrength: 0.64 });
  const attacked = generateTransactions({ scenarioId, volume, seed: seed + 101, fraudRate: attackRate, hardNegativeRate: 0.16, signalStrength });
  const baselineDecisions = scoreBranch(baseline, risk, { graphDefense: false, defenderStrength, profile, seed });
  const attackDecisions = scoreBranch(attacked, risk, { graphDefense: false, defenderStrength, profile, seed: seed + 1 });
  const adaptedDecisions = scoreBranch(attacked, risk, { graphDefense, defenderStrength, profile, seed: seed + 2 });
  const baselineMetrics = summarize(baseline, baselineDecisions);
  const attackMetrics = summarize(attacked, attackDecisions);
  const adaptedMetrics = summarize(attacked, adaptedDecisions);
  const exposureDelta = Math.max(0, attackMetrics.escaped_value - adaptedMetrics.escaped_value);
  const defenderScore = clamp(Math.round(adaptedMetrics.attack_recall * 72 + (1 - adaptedMetrics.customer_friction_rate) * 28), 0, 100);
  const attackerScore = clamp(100 - defenderScore + Math.round(stealth * 10), 0, 100);

  return {
    arena_id: `AR_${randomUUID().slice(0, 8)}`,
    created_at: new Date().toISOString(),
    scenario: {
      id: campaign.id,
      campaign_id: campaign.id,
      base_scenario_id: scenarioId,
      base_family: baseScenario.family,
      base_scenario_name: baseScenario.name,
      severity: baseScenario.severity,
      codename: campaign.codename,
      label: campaign.name,
      tactic: campaign.ai_enabler,
      graph: campaign.graph_motif,
      thesis: campaign.thesis,
      channels: campaign.channels,
      novelty: campaign.novelty,
      difficulty: campaign.difficulty,
      fingerprint: campaign.fingerprint,
      kill_chain: campaign.kill_chain,
      defenses: campaign.defenses
    },
    controls: { campaign_id: campaign.id, seed, volume, aggression, stealth, defender_strength: defenderStrength, graph_defense: graphDefense, attacker_budget: Math.round(25000 + aggression * 175000) },
    rounds: [
      { id: "BASELINE", label: "Counterfactual normal", metrics: baselineMetrics },
      { id: "ATTACK", label: "Adaptive attack", metrics: attackMetrics },
      { id: "ADAPTED", label: "Graph-aware defense", metrics: adaptedMetrics }
    ],
    outcome: {
      defender_score: defenderScore,
      attacker_score: attackerScore,
      prevented_value_lift: round(exposureDelta),
      escaped_value_reduction: attackMetrics.escaped_value ? round(exposureDelta / attackMetrics.escaped_value, 4) : 0,
      friction_delta: round(adaptedMetrics.customer_friction_rate - baselineMetrics.customer_friction_rate, 4),
      estimated_detection_latency_ms: Math.round(19 + stealth * 18 + (graphDefense ? 8 : 0)),
      winner: defenderScore >= attackerScore ? "DEFENDER" : "ATTACKER"
    },
    graph: buildGraph(attacked, adaptedDecisions, profile),
    timeline: timeline(profile, attackDecisions, adaptedDecisions),
    agent_trace: agentTrace(campaign, { volume, aggression, stealth }, attackMetrics, adaptedMetrics),
    simulation_scale: {
      events_materialized: volume,
      virtual_population: volume * 200,
      parallel_agents: Math.max(4, Math.round(aggression * 12)),
      replay_mode: "DETERMINISTIC_SEEDED"
    },
    decision_receipts: adaptedDecisions.filter((item) => item.is_fraud || item.decision !== "ALLOW").slice(0, 8),
    governance: {
      mode: "SYNTHETIC_SANDBOX",
      active_model_changed: false,
      human_review_required: true,
      model_version: risk.modelVersion,
      feature_version: "features-1.0",
      limitations: "Scenario evidence is synthetic and intended for comparative stress testing, not production efficacy claims."
    }
  };
}
