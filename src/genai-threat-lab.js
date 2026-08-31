import { randomUUID } from "node:crypto";

const REVIEW_STATES = Object.freeze(["PENDING_REVIEW", "APPROVED", "REJECTED"]);
const FORBIDDEN_OUTPUT = /(?:credential|password|otp|victim|phish|bypass|exploit|steal|malware|payload|account number|card number)/i;
const ALLOWED_SURFACES = Object.freeze(["CARD", "UPI", "WALLET", "BANK_TRANSFER", "BNPL", "REMITTANCE", "MERCHANT_ACQUIRING", "LOYALTY"]);

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, Number(value) || minimum));
}

function text(value, maximum = 280) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maximum);
}

function textList(value, minimum, maximum) {
  const items = Array.isArray(value) ? value.map((item) => text(item, 180)).filter(Boolean) : [];
  if (items.length < minimum || items.length > maximum) throw new Error("INVALID_SCENARIO_SCHEMA");
  if (items.some((item) => FORBIDDEN_OUTPUT.test(item))) throw new Error("UNSAFE_SCENARIO_OUTPUT");
  return items;
}

function boundedRange(value, fallback, minimum, maximum) {
  const raw = Array.isArray(value) ? value : fallback;
  const low = clamp(raw[0], minimum, maximum);
  const high = clamp(raw[1], low, maximum);
  return [Number(low.toFixed(2)), Number(high.toFixed(2))];
}

function validateCandidate(candidate, baseScenarioIds) {
  const title = text(candidate.title, 96);
  const hypothesis = text(candidate.hypothesis, 420);
  const rationale = text(candidate.rationale, 420);
  if (!title || !hypothesis || !rationale || FORBIDDEN_OUTPUT.test(`${title} ${hypothesis} ${rationale}`)) throw new Error("UNSAFE_SCENARIO_OUTPUT");
  const baseScenarioId = baseScenarioIds.includes(candidate.base_scenario_id) ? candidate.base_scenario_id : baseScenarioIds[0];
  const paymentSurface = ALLOWED_SURFACES.includes(candidate.payment_surface) ? candidate.payment_surface : "CARD";
  return Object.freeze({
    title,
    hypothesis,
    rationale,
    base_scenario_id: baseScenarioId,
    payment_surface: paymentSurface,
    ai_enabler: text(candidate.ai_enabler, 180),
    observable_signals: textList(candidate.observable_signals, 4, 8),
    expected_controls: textList(candidate.expected_controls, 3, 6),
    novelty_score: Math.round(clamp(candidate.novelty_score, 1, 100)),
    difficulty_score: Math.round(clamp(candidate.difficulty_score, 1, 100)),
    simulation_parameters: Object.freeze({
      velocity_multiplier: boundedRange(candidate.simulation_parameters?.velocity_multiplier, [1.2, 3.5], 0.5, 8),
      amount_multiplier: boundedRange(candidate.simulation_parameters?.amount_multiplier, [0.8, 2.5], 0.1, 12),
      new_device_probability: boundedRange(candidate.simulation_parameters?.new_device_probability, [0.25, 0.75], 0, 1),
      geography_shift_probability: boundedRange(candidate.simulation_parameters?.geography_shift_probability, [0.1, 0.55], 0, 1),
      timing_jitter_minutes: boundedRange(candidate.simulation_parameters?.timing_jitter_minutes, [1, 45], 0, 240),
      graph_density: boundedRange(candidate.simulation_parameters?.graph_density, [0.15, 0.7], 0, 1)
    })
  });
}

function fallbackCandidate(input, baseScenarioIds) {
  const focus = text(input.focus || "coordinated cross-channel behavior", 90);
  return {
    title: `${focus.slice(0, 62).replace(/\s+\S*$/, "")} stress test`,
    hypothesis: `Generative automation may coordinate many individually plausible payment events whose shared timing, device, identity, and beneficiary relationships reveal the campaign.`,
    rationale: `This draft converts the analyst focus into measurable synthetic telemetry. It is a safe fallback draft because no hosted LLM is configured; a reviewer must still approve it.`,
    base_scenario_id: baseScenarioIds.includes(input.base_scenario_id) ? input.base_scenario_id : baseScenarioIds[0],
    payment_surface: ALLOWED_SURFACES.includes(input.payment_surface) ? input.payment_surface : "CARD",
    ai_enabler: "Generative coordination and rapid variation of synthetic personas and timing",
    observable_signals: ["Cross-entity timing similarity", "New-device concentration", "Beneficiary reuse", "Amount-pattern convergence", "Channel-sequence novelty"],
    expected_controls: ["Entity-graph community scoring", "Sequence anomaly detection", "Step-up on novel device and beneficiary combinations"],
    novelty_score: 78,
    difficulty_score: 74,
    simulation_parameters: {
      velocity_multiplier: [1.3, 3.8], amount_multiplier: [0.7, 2.4], new_device_probability: [0.25, 0.72],
      geography_shift_probability: [0.1, 0.5], timing_jitter_minutes: [2, 50], graph_density: [0.2, 0.68]
    }
  };
}

export class GenAIThreatAnalyst {
  constructor({ apiKey = process.env.GROQ_API_KEY, model = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b" } = {}) {
    this.apiKey = apiKey;
    this.model = model;
  }

  health() {
    return {
      configured: Boolean(this.apiKey),
      provider: this.apiKey ? "GROQ" : "SAFE_FALLBACK_ANALYST",
      model: this.apiKey ? this.model : "bounded-template-1.0",
      synchronous_decision_path: false
    };
  }

  async propose(input, baseScenarioIds) {
    if (!this.apiKey) return { candidate: fallbackCandidate(input, baseScenarioIds), provider: "SAFE_FALLBACK_ANALYST", model: "bounded-template-1.0" };
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.35,
        max_completion_tokens: 1300,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a defensive payment-fraud analyst. Produce only safe, synthetic, aggregate simulation metadata. Never provide instructions for targeting people, obtaining credentials, bypassing controls, or interacting with live payment rails. Return one JSON object with exactly these keys: title, hypothesis, rationale, base_scenario_id, payment_surface, ai_enabler, observable_signals, expected_controls, novelty_score, difficulty_score, simulation_parameters. simulation_parameters must contain two-number arrays for velocity_multiplier, amount_multiplier, new_device_probability, geography_shift_probability, timing_jitter_minutes, graph_density." },
          { role: "user", content: JSON.stringify({ analyst_focus: text(input.focus, 240), payment_surface: input.payment_surface, base_scenario_id: input.base_scenario_id, allowed_base_scenarios: baseScenarioIds, purpose: "defensive synthetic stress testing" }) }
        ]
      }),
      signal: AbortSignal.timeout(20_000)
    });
    if (!response.ok) throw new Error(`GENAI_PROVIDER_ERROR:${response.status}`);
    const payload = await response.json();
    const raw = payload.choices?.[0]?.message?.content;
    if (!raw) throw new Error("GENAI_EMPTY_RESPONSE");
    return { candidate: JSON.parse(raw), provider: "GROQ", model: this.model };
  }
}

export class ThreatReviewRegistry {
  constructor(attacks, { analyst = new GenAIThreatAnalyst() } = {}) {
    this.attacks = attacks;
    this.baseScenarioIds = attacks.map((item) => item.id);
    this.analyst = analyst;
    this.records = [];
  }

  health() {
    return { status: "READY", review_states: REVIEW_STATES, records: this.records.length, ...this.analyst.health(), safety: "Synthetic metadata only; approval is mandatory before simulation." };
  }

  list() { return this.records; }

  get(id) {
    const record = this.records.find((item) => item.scenario_id === id);
    if (!record) throw new Error("THREAT_DRAFT_NOT_FOUND");
    return record;
  }

  async discover(input = {}) {
    const generated = await this.analyst.propose(input, this.baseScenarioIds);
    const candidate = validateCandidate(generated.candidate, this.baseScenarioIds);
    const record = {
      scenario_id: `AI_${randomUUID().slice(0, 8).toUpperCase()}`,
      scenario_version: "1.0-draft",
      status: "PENDING_REVIEW",
      generated_at: new Date().toISOString(),
      generated_by: generated.provider,
      model: generated.model,
      provenance: { source: "ANALYST_PROMPT", focus: text(input.focus, 240), parent_feedback_ids: [] },
      candidate,
      review: null,
      simulation_ready: false
    };
    this.records.unshift(record);
    return record;
  }

  review(id, { decision, reviewer = "human-operator", notes = "" } = {}) {
    const record = this.get(id);
    if (!['APPROVE', 'REJECT'].includes(decision)) throw new Error("INVALID_REVIEW_DECISION");
    record.status = decision === "APPROVE" ? "APPROVED" : "REJECTED";
    record.scenario_version = decision === "APPROVE" ? "1.0" : record.scenario_version;
    record.review = { reviewer: text(reviewer, 80), notes: text(notes, 280), reviewed_at: new Date().toISOString(), decision };
    record.simulation_ready = decision === "APPROVE";
    return record;
  }

  async proposeFromFeedback(feedback = []) {
    const gaps = feedback.filter((item) => item.error_type === "FALSE_NEGATIVE").slice(0, 25);
    if (!gaps.length) throw new Error("NO_FALSE_NEGATIVE_GAP");
    const record = await this.discover({ focus: `Aggregate false-negative coverage gap across ${gaps.length} reviewed outcomes`, base_scenario_id: gaps[0].scenario_id });
    record.provenance.source = "AGGREGATED_FEEDBACK_GAP";
    record.provenance.parent_feedback_ids = gaps.map((item) => item.feedback_id);
    return record;
  }
}

export function assertSimulationApproved(record) {
  if (record.status !== "APPROVED" || !record.simulation_ready) throw new Error("SCENARIO_NOT_APPROVED");
}
