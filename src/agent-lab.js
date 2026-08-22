import { randomUUID } from "node:crypto";
import { CAMPAIGN_CATALOG, getCampaign } from "./campaigns.js";
import { seededRandom } from "./random.js";
import { runTwinArena } from "./twin-engine.js";

export const AGENT_ROSTER = Object.freeze([
  { id: "SCOUT", name: "Threat Scout", team: "RED", goal: "Select a high-value under-covered campaign", observes: ["campaign novelty", "difficulty", "signal surface"], acts: ["select campaign"] },
  { id: "PLANNER", name: "Policy Planner", team: "RED", goal: "Propose bounded pressure and stealth policies", observes: ["prior rewards", "defender strength", "campaign fingerprint"], acts: ["raise pressure", "raise stealth", "rebalance"] },
  { id: "OPERATOR", name: "Twin Operator", team: "RED", goal: "Execute candidate policies in the fictional network", observes: ["candidate policy", "seed", "event budget"], acts: ["fork twin", "materialize events"] },
  { id: "CRITIC", name: "Outcome Critic", team: "NEUTRAL", goal: "Score candidates against the selected objective", observes: ["escape rate", "detection lift", "customer friction"], acts: ["rank candidates", "seal evidence"] },
  { id: "EVOLVER", name: "Policy Evolver", team: "RED", goal: "Mutate the best policy from observed outcomes", observes: ["fitness history", "defense response"], acts: ["explore", "exploit", "retain"] },
  { id: "DEFENDER", name: "Blue Sentinel", team: "BLUE", goal: "Adapt graph-aware defense without changing the live model", observes: ["winning red policy", "misses", "false interventions"], acts: ["increase graph pressure", "preserve human gate"] }
]);

export const AGENT_OBJECTIVES = Object.freeze([
  { id: "ESCAPE_MAXIMIZATION", label: "Find defense gaps", description: "Search for bounded synthetic policies that maximize escaped attack events." },
  { id: "STEALTH_DISCOVERY", label: "Optimize stealth", description: "Prefer low-signal policies that remain difficult to detect." },
  { id: "FRICTION_PRESSURE", label: "Stress customer friction", description: "Expose where stronger controls intervene on legitimate hard negatives." },
  { id: "GRAPH_EVASION", label: "Challenge graph fusion", description: "Search for policies that reduce the graph-aware defense advantage." }
]);

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function round(value, places = 4) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function objectiveById(id) {
  return AGENT_OBJECTIVES.find((item) => item.id === id) ?? AGENT_OBJECTIVES[0];
}

function selectCampaign(input, objective) {
  const explicit = getCampaign(input.campaignId);
  if (explicit) return explicit;
  return [...CAMPAIGN_CATALOG].sort((left, right) => {
    const score = (campaign) => campaign.novelty + campaign.difficulty
      + (objective.id === "GRAPH_EVASION" ? campaign.fingerprint.graph * 0.4 : 0)
      + (objective.id === "STEALTH_DISCOVERY" ? campaign.fingerprint.sequence * 0.25 : 0)
      + (objective.id === "FRICTION_PRESSURE" ? campaign.fingerprint.identity * 0.2 : 0);
    return score(right) - score(left);
  })[0];
}

function candidatePolicies(parent, random, generation) {
  const jitter = () => (random() - 0.5) * 0.05;
  const variants = [
    { id: "EXPLORE", label: "Probe a quieter boundary", aggression: parent.aggression - 0.07 + jitter(), stealth: parent.stealth + 0.08 + jitter() },
    { id: "PRESSURE", label: "Increase coordinated pressure", aggression: parent.aggression + 0.09 + jitter(), stealth: parent.stealth - 0.03 + jitter() },
    { id: "BALANCE", label: "Balance pressure and concealment", aggression: parent.aggression + 0.02 + jitter(), stealth: parent.stealth + 0.03 + jitter() }
  ];
  return variants.map((variant, index) => ({
    ...variant,
    candidate_id: `G${generation + 1}_${index + 1}_${variant.id}`,
    aggression: round(clamp(variant.aggression, 0.2, 1), 3),
    stealth: round(clamp(variant.stealth, 0.1, 0.95), 3)
  }));
}

function fitness(arena, objective) {
  const attack = arena.rounds.find((round) => round.id === "ATTACK").metrics;
  const adapted = arena.rounds.find((round) => round.id === "ADAPTED").metrics;
  const escapeRate = 1 - adapted.attack_recall;
  const transactionOnlyEscape = 1 - attack.attack_recall;
  const pressure = attack.attack_attempts / Math.max(attack.transactions, 1);
  const graphLift = Math.max(0, adapted.attack_recall - attack.attack_recall);
  const friction = adapted.customer_friction_rate;
  const stealth = arena.controls.stealth;
  const formulas = {
    ESCAPE_MAXIMIZATION: escapeRate * 0.5 + transactionOnlyEscape * 0.2 + pressure * 0.15 + stealth * 0.15,
    STEALTH_DISCOVERY: escapeRate * 0.45 + stealth * 0.4 + (1 - friction) * 0.15,
    FRICTION_PRESSURE: escapeRate * 0.35 + friction * 0.4 + pressure * 0.25,
    GRAPH_EVASION: escapeRate * 0.45 + (1 - graphLift) * 0.3 + stealth * 0.25
  };
  return {
    reward: Math.round(clamp(formulas[objective.id] ?? formulas.ESCAPE_MAXIMIZATION, 0, 1) * 100),
    escape_rate: round(escapeRate),
    transaction_only_escape_rate: round(transactionOnlyEscape),
    graph_detection_lift: round(graphLift),
    customer_friction_rate: friction,
    escaped_value: adapted.escaped_value,
    attacks_detected: adapted.attacks_detected,
    attack_attempts: adapted.attack_attempts
  };
}

function event(sequence, generation, agent, state, action, observation, candidateId = null) {
  return { sequence, generation, agent, state, action, observation, candidate_id: candidateId };
}

export function localAgentHealth() {
  return {
    status: "READY",
    provider: "LOCAL_POLICY_ENGINE",
    execution: "IN_PROCESS",
    external_model_required: false,
    agents: AGENT_ROSTER,
    objectives: AGENT_OBJECTIVES,
    safety_boundary: "Synthetic payment twin only. Agents can choose bounded simulation controls but cannot access networks, credentials, customer data, or live payment rails."
  };
}

export function runLocalAgentMission(risk, input = {}) {
  const objective = objectiveById(input.objective);
  const campaign = selectCampaign(input, objective);
  const seed = Number(input.seed) || 2026;
  const generations = Math.round(clamp(Number(input.generations) || 4, 2, 6));
  const volume = Math.round(clamp(Number(input.volume) || 110, 60, 180));
  const graphDefense = input.graphDefense !== false;
  const random = seededRandom(seed + campaign.novelty);
  let parent = {
    aggression: clamp(Number(input.aggression) || 0.64, 0.2, 1),
    stealth: clamp(Number(input.stealth) || 0.58, 0.1, 0.95)
  };
  let defenderStrength = clamp(Number(input.defenderStrength) || 0.68, 0.2, 1);
  let sequence = 1;
  const events = [];
  const evolution = [];
  const evaluated = [];

  events.push(event(sequence++, 0, "SCOUT", "OBSERVED", "Selected campaign from the governed registry", `${campaign.codename} · novelty ${campaign.novelty} · ${campaign.channels.length} channel contexts`));
  events.push(event(sequence++, 0, "PLANNER", "BOUNDED", "Established local action space", "Aggression 20–100% · stealth 10–95% · synthetic events only"));

  for (let generation = 0; generation < generations; generation += 1) {
    const candidates = candidatePolicies(parent, random, generation);
    events.push(event(sequence++, generation + 1, "PLANNER", "PROPOSED", `Generated ${candidates.length} candidate policies`, `Parent policy ${Math.round(parent.aggression * 100)}% pressure · ${Math.round(parent.stealth * 100)}% stealth`));
    const results = candidates.map((candidate, index) => {
      events.push(event(sequence++, generation + 1, "OPERATOR", "RUNNING", candidate.label, `${volume} fictional events · seed ${seed + generation * 101 + index}`, candidate.candidate_id));
      const arena = runTwinArena(risk, {
        campaignId: campaign.id,
        volume,
        seed: seed + generation * 101 + index,
        aggression: candidate.aggression,
        stealth: candidate.stealth,
        defenderStrength,
        graphDefense
      });
      const score = fitness(arena, objective);
      events.push(event(sequence++, generation + 1, "CRITIC", "SCORED", `Assigned fitness ${score.reward}`, `${Math.round(score.escape_rate * 100)}% escaped · ${Math.round(score.graph_detection_lift * 100)}pt graph lift · ${Math.round(score.customer_friction_rate * 100)}% friction`, candidate.candidate_id));
      const result = { ...candidate, fitness: score, arena };
      evaluated.push(result);
      return result;
    });
    const best = [...results].sort((left, right) => right.fitness.reward - left.fitness.reward)[0];
    parent = { aggression: best.aggression, stealth: best.stealth };
    defenderStrength = clamp(defenderStrength + 0.035, 0.2, 1);
    evolution.push({
      generation: generation + 1,
      candidates: results.map(({ arena, ...result }) => result),
      winner: best.candidate_id,
      best_reward: best.fitness.reward,
      red_policy: parent,
      blue_strength: round(defenderStrength, 3)
    });
    events.push(event(sequence++, generation + 1, "EVOLVER", "RETAINED", `Promoted ${best.candidate_id} into agent memory`, `Reward ${best.fitness.reward} · next policy ${Math.round(best.aggression * 100)}% pressure / ${Math.round(best.stealth * 100)}% stealth`, best.candidate_id));
    events.push(event(sequence++, generation + 1, "DEFENDER", "ADAPTED", "Raised graph-aware defense pressure", `Strength ${Math.round(defenderStrength * 100)}% · active model unchanged`, best.candidate_id));
  }

  const champion = [...evaluated].sort((left, right) => right.fitness.reward - left.fitness.reward)[0];
  events.push(event(sequence++, generations + 1, "CRITIC", "SEALED", "Mission evidence sealed", `${evaluated.length} policies evaluated · champion ${champion.candidate_id} · reward ${champion.fitness.reward}`, champion.candidate_id));

  return {
    mission_id: `MS_${randomUUID().slice(0, 8)}`,
    created_at: new Date().toISOString(),
    status: "COMPLETE",
    mode: "LOCAL_AUTONOMOUS_SANDBOX",
    provider: "LOCAL_POLICY_ENGINE",
    objective,
    campaign: {
      id: campaign.id,
      codename: campaign.codename,
      name: campaign.name,
      base_scenario_id: campaign.base_scenario_id,
      graph_motif: campaign.graph_motif
    },
    agents: AGENT_ROSTER,
    action_space: {
      aggression: [0.2, 1],
      stealth: [0.1, 0.95],
      generations: [2, 6],
      events_per_candidate: [60, 180],
      external_actions: []
    },
    events,
    evolution,
    champion: {
      candidate_id: champion.candidate_id,
      generation: Number(champion.candidate_id.slice(1, 2)),
      aggression: champion.aggression,
      stealth: champion.stealth,
      fitness: champion.fitness
    },
    final_arena: champion.arena,
    summary: {
      policies_evaluated: evaluated.length,
      synthetic_events_materialized: evaluated.length * volume,
      best_reward: champion.fitness.reward,
      winner: champion.fitness.reward >= 58 ? "RED_AGENT" : "BLUE_DEFENSE",
      model_changed: false
    },
    governance: {
      synthetic_only: true,
      network_access: false,
      live_payment_access: false,
      customer_data_access: false,
      human_review_required: true,
      audit_log_complete: true
    }
  };
}
