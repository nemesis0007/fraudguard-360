export const CAMPAIGN_CATALOG = Object.freeze([
  {
    id: "AGENT_INTENT_001", codename: "Ghost Cart", name: "Agent intent hijack", base_scenario_id: "UPI_001",
    ai_enabler: "Prompt injection against a delegated commerce agent",
    thesis: "A compromised shopping agent stays inside a valid spending mandate while merchant and payee intent quietly diverge.",
    channels: ["AGENTIC COMMERCE", "INSTANT PAY", "CARD"], graph_motif: "DELEGATION_DRIFT", novelty: 96, difficulty: 91,
    fingerprint: { intent: 98, identity: 44, graph: 64, velocity: 38, merchant: 82, sequence: 94 },
    kill_chain: [
      { phase: "CONTEXT", title: "Delegation established", observable: "Agent mandate and human intent initially agree." },
      { phase: "DRIFT", title: "Semantic scope shifts", observable: "Cart, merchant, or beneficiary meaning changes without a matching mandate update." },
      { phase: "EXECUTE", title: "Authorized-looking payment", observable: "Payment is locally valid but globally inconsistent with the requested outcome." },
      { phase: "ADAPT", title: "Agent retries within policy", observable: "Subsequent attempts remain close to approval boundaries." }
    ],
    defenses: ["Intent attestation", "Payee lineage", "Scope-bound step-up"]
  },
  {
    id: "CONSENT_RELAY_002", codename: "Consent Mirage", name: "Deepfake consent relay", base_scenario_id: "UPI_001",
    ai_enabler: "Synthetic voice/video and real-time conversational persuasion",
    thesis: "A convincing authorization signal is relayed across channels while the payment behavior contradicts the customer’s established context.",
    channels: ["VOICE", "MESSAGING", "INSTANT PAY"], graph_motif: "CROSS_CHANNEL_CONTRADICTION", novelty: 91, difficulty: 84,
    fingerprint: { intent: 91, identity: 76, graph: 48, velocity: 46, merchant: 34, sequence: 96 },
    kill_chain: [
      { phase: "CONTEXT", title: "Trusted identity simulated", observable: "A high-confidence consent cue arrives on a new interaction path." },
      { phase: "PRESSURE", title: "Urgency compresses review", observable: "Conversation-to-payment time becomes unusually short." },
      { phase: "HANDOFF", title: "Channel changes", observable: "Consent and transaction originate from inconsistent devices or sessions." },
      { phase: "PAYMENT", title: "Novel beneficiary paid", observable: "Payee novelty and amount deviation appear together." }
    ],
    defenses: ["Cross-channel binding", "Behavioral contradiction score", "Cooling-off policy"]
  },
  {
    id: "POLICY_ORACLE_003", codename: "Glass Box", name: "Policy-oracle learning swarm", base_scenario_id: "BOT_001",
    ai_enabler: "Reinforcement-learning agents infer approval boundaries from outcomes",
    thesis: "A coordinated swarm treats payment responses as feedback and evolves low-signal probes toward the defender’s decision boundary.",
    channels: ["ECOMMERCE", "API", "CARD"], graph_motif: "BOUNDARY_OSCILLATION", novelty: 94, difficulty: 93,
    fingerprint: { intent: 30, identity: 52, graph: 88, velocity: 96, merchant: 70, sequence: 92 },
    kill_chain: [
      { phase: "PROBE", title: "Low-value observations", observable: "Repeated small attempts sample different contexts." },
      { phase: "LEARN", title: "Responses shape policy", observable: "Attempt features move systematically after declines or step-ups." },
      { phase: "PIVOT", title: "Swarm reallocates", observable: "Traffic shifts toward identities and merchants with better outcomes." },
      { phase: "PRESSURE", title: "Boundary campaign", observable: "Risk scores cluster tightly below intervention thresholds." }
    ],
    defenses: ["Response-conditioned sequence model", "Swarm linkage", "Randomized friction"]
  },
  {
    id: "DORMANT_GARDEN_004", codename: "Sleeper Garden", name: "Synthetic identity maturation", base_scenario_id: "SYNID_001",
    ai_enabler: "Generative identity artifacts and autonomous lifecycle management",
    thesis: "A portfolio of fictional identities builds ordinary histories independently, then reveals hidden coordination during synchronized monetization.",
    channels: ["ONBOARDING", "CARD", "ACCOUNT"], graph_motif: "TEMPORAL_SYNCHRONY", novelty: 89, difficulty: 96,
    fingerprint: { intent: 38, identity: 99, graph: 94, velocity: 57, merchant: 43, sequence: 91 },
    kill_chain: [
      { phase: "CREATE", title: "Plausible identities appear", observable: "Cross-field evidence is unusually consistent but shallow." },
      { phase: "AGE", title: "Independent histories grow", observable: "Accounts exhibit low-risk behavior over long windows." },
      { phase: "CONVERGE", title: "Hidden infrastructure repeats", observable: "Weak device, address, or document relationships accumulate." },
      { phase: "SYNCHRONIZE", title: "Portfolio acts together", observable: "Dormant identities change behavior within the same temporal window." }
    ],
    defenses: ["Long-horizon entity memory", "Artifact provenance", "Synchrony detection"]
  },
  {
    id: "STOREFRONT_MESH_005", codename: "Mirage Market", name: "Autonomous storefront mesh", base_scenario_id: "REFUND_001",
    ai_enabler: "Generative storefronts, product content, support, and transaction narratives",
    thesis: "AI-operated merchants continuously change presentation while a stable hidden infrastructure coordinates laundering and refund behavior.",
    channels: ["MERCHANT", "ECOMMERCE", "REFUND"], graph_motif: "MERCHANT_INFRASTRUCTURE_REUSE", novelty: 93, difficulty: 87,
    fingerprint: { intent: 42, identity: 56, graph: 97, velocity: 68, merchant: 100, sequence: 74 },
    kill_chain: [
      { phase: "SPAWN", title: "Storefront identities rotate", observable: "Merchant-facing content changes faster than settlement infrastructure." },
      { phase: "BLEND", title: "Ordinary sales are mixed", observable: "Customer and amount distributions look locally plausible." },
      { phase: "RECYCLE", title: "Refund narratives emerge", observable: "Refund timing and beneficiary paths repeat across merchants." },
      { phase: "MIGRATE", title: "Risk moves to a sibling", observable: "Volume transfers between merchants sharing hidden entities." }
    ],
    defenses: ["Merchant lineage graph", "Infrastructure fingerprints", "Refund-path analysis"]
  },
  {
    id: "RAIL_SPLINTER_006", codename: "Shard Route", name: "Cross-rail micro-splintering", base_scenario_id: "LAUNDER_001",
    ai_enabler: "Planning agents optimize value movement across heterogeneous rails",
    thesis: "A single objective is fragmented into many individually ordinary movements that only become suspicious when reconstructed across rails.",
    channels: ["CARD", "INSTANT PAY", "WALLET"], graph_motif: "CROSS_RAIL_FLOW_CONSERVATION", novelty: 97, difficulty: 95,
    fingerprint: { intent: 52, identity: 66, graph: 100, velocity: 84, merchant: 61, sequence: 97 },
    kill_chain: [
      { phase: "SPLIT", title: "Value becomes fragments", observable: "Many small movements replace one expected transfer." },
      { phase: "ROUTE", title: "Rail identities diverge", observable: "Cards, wallets, and payees appear unrelated locally." },
      { phase: "BRIDGE", title: "Hidden junctions repeat", observable: "Common devices or merchants connect otherwise separate paths." },
      { phase: "MERGE", title: "Value reconverges", observable: "Flow conservation reveals a shared downstream objective." }
    ],
    defenses: ["Cross-rail entity resolution", "Flow-conservation graph", "Temporal path scoring"]
  },
  {
    id: "LABEL_LAUNDER_007", codename: "Clean Label", name: "Outcome-label laundering", base_scenario_id: "FRIENDLY_001",
    ai_enabler: "Agents optimize behavior around delayed disputes and feedback windows",
    thesis: "The attacker targets the learning system itself, cultivating apparently clean labels before delayed outcomes reveal the true pattern.",
    channels: ["DISPUTE", "CARD", "MODEL FEEDBACK"], graph_motif: "DELAYED_LABEL_REVERSAL", novelty: 98, difficulty: 98,
    fingerprint: { intent: 70, identity: 64, graph: 75, velocity: 35, merchant: 83, sequence: 100 },
    kill_chain: [
      { phase: "CULTIVATE", title: "Clean outcomes accumulate", observable: "Accounts and merchants build unusually regular histories." },
      { phase: "EXPLOIT", title: "Feedback window is used", observable: "Risk expands before dispute labels mature." },
      { phase: "REVERSE", title: "Delayed outcomes arrive", observable: "A cohort’s labels change together after settlement." },
      { phase: "POISON", title: "Model evidence diverges", observable: "Training-window truth differs from operational-window truth." }
    ],
    defenses: ["Delayed-label survival model", "Cohort reconciliation", "Training-data quarantine"]
  },
  {
    id: "KYC_CONSENSUS_008", codename: "Perfect Stranger", name: "Synthetic KYC consensus", base_scenario_id: "SYNID_001",
    ai_enabler: "Cross-modal generation creates mutually consistent identity artifacts",
    thesis: "Documents, face, voice, and profile agree too perfectly with one another while lacking independent provenance outside the generated bundle.",
    channels: ["KYC", "ONBOARDING", "ACCOUNT"], graph_motif: "ARTIFACT_PROVENANCE_COLLISION", novelty: 95, difficulty: 90,
    fingerprint: { intent: 46, identity: 100, graph: 81, velocity: 24, merchant: 18, sequence: 72 },
    kill_chain: [
      { phase: "ASSEMBLE", title: "Identity bundle agrees", observable: "Cross-modal fields have abnormally low contradiction." },
      { phase: "ONBOARD", title: "Independent proof is thin", observable: "Artifacts share provenance or generation characteristics." },
      { phase: "DIVERSIFY", title: "Accounts appear unrelated", observable: "Surface attributes vary while latent infrastructure repeats." },
      { phase: "ACTIVATE", title: "Behavior becomes coordinated", observable: "New accounts converge on devices, merchants, or timing." }
    ],
    defenses: ["Provenance attestation", "Cross-modal entropy", "Latent infrastructure graph"]
  },
  {
    id: "TOKEN_PARASITE_009", codename: "Quiet Provision", name: "Token lifecycle parasite", base_scenario_id: "ATO_001",
    ai_enabler: "Automation selects low-friction token provisioning and usage windows",
    thesis: "The attack hides inside a legitimate device-token lifecycle, avoiding a single dramatic takeover signal.",
    channels: ["TOKEN", "WALLET", "CARD"], graph_motif: "TOKEN_DEVICE_DRIFT", novelty: 87, difficulty: 89,
    fingerprint: { intent: 55, identity: 86, graph: 82, velocity: 48, merchant: 46, sequence: 93 },
    kill_chain: [
      { phase: "PROVISION", title: "New token appears", observable: "Provisioning context is individually plausible but historically unusual." },
      { phase: "REST", title: "Activity remains quiet", observable: "The token avoids immediate high-risk behavior." },
      { phase: "EXPAND", title: "Merchant surface widens", observable: "Usage diversity grows faster than the device relationship ages." },
      { phase: "DRIFT", title: "Device identity separates", observable: "Token, device, and customer context cease to move together." }
    ],
    defenses: ["Token lineage", "Provisioning sequence score", "Device relationship age"]
  },
  {
    id: "SWARM_INCENTIVE_010", codename: "Hive Coupon", name: "Cooperative incentive swarm", base_scenario_id: "PROMO_001",
    ai_enabler: "Multi-agent orchestration coordinates many low-value identities",
    thesis: "Individually benign accounts cooperate through shared infrastructure and timing to extract incentives without obvious per-account abuse.",
    channels: ["PROMOTION", "WALLET", "MERCHANT"], graph_motif: "EMERGENT_ACCOUNT_COMMUNITY", novelty: 86, difficulty: 82,
    fingerprint: { intent: 50, identity: 83, graph: 96, velocity: 79, merchant: 72, sequence: 78 },
    kill_chain: [
      { phase: "SPAWN", title: "Low-value identities join", observable: "Accounts have varied surface features but synchronized objectives." },
      { phase: "DISTRIBUTE", title: "Actions stay below limits", observable: "Activity is spread across identities and merchants." },
      { phase: "COORDINATE", title: "Infrastructure overlaps", observable: "Devices, addresses, or cash-out endpoints form a community." },
      { phase: "REPEAT", title: "Campaign regenerates", observable: "A new cohort reproduces the same graph shape." }
    ],
    defenses: ["Community detection", "Campaign-shape matching", "Shared-value attribution"]
  },
  {
    id: "TRUST_LADDER_011", codename: "Trust Ladder", name: "Beneficiary trust warming", base_scenario_id: "MULE_001",
    ai_enabler: "Planning agents optimize a gradual path through trust controls",
    thesis: "A beneficiary relationship is warmed with normal-looking interactions before a coordinated network changes amount and velocity.",
    channels: ["INSTANT PAY", "ACCOUNT", "P2P"], graph_motif: "TRUST_AGE_VALUE_BREAK", novelty: 88, difficulty: 92,
    fingerprint: { intent: 74, identity: 62, graph: 92, velocity: 81, merchant: 24, sequence: 98 },
    kill_chain: [
      { phase: "INTRODUCE", title: "New beneficiary added", observable: "Initial interaction is low value and low urgency." },
      { phase: "WARM", title: "Trust history accumulates", observable: "Regular small transfers reduce local novelty." },
      { phase: "CONNECT", title: "Network context changes", observable: "The payee begins receiving from multiple warmed relationships." },
      { phase: "BREAK", title: "Value exceeds trust age", observable: "Amount and onward velocity detach from the prior history." }
    ],
    defenses: ["Trust-age/value ratio", "Beneficiary fan-in graph", "Onward-velocity hold"]
  },
  {
    id: "INVOICE_SWITCH_012", codename: "Semantic Switch", name: "Agent-to-agent invoice redirection", base_scenario_id: "CNP_001",
    ai_enabler: "Business agents interpret manipulated invoice semantics as legitimate intent",
    thesis: "Two authorized enterprise agents agree on document content while the beneficiary semantics have changed outside the trusted workflow.",
    channels: ["B2B", "INVOICE", "BANK TRANSFER"], graph_motif: "DOCUMENT_PAYEE_DIVERGENCE", novelty: 97, difficulty: 94,
    fingerprint: { intent: 100, identity: 69, graph: 78, velocity: 30, merchant: 88, sequence: 86 },
    kill_chain: [
      { phase: "INGEST", title: "Invoice enters workflow", observable: "Document structure appears normal to automated processing." },
      { phase: "INTERPRET", title: "Semantic beneficiary shifts", observable: "Textual intent and registered payee lineage disagree." },
      { phase: "AGREE", title: "Agents confirm each other", observable: "Machine approvals reinforce the same corrupted context." },
      { phase: "SETTLE", title: "Payment leaves trusted path", observable: "Destination is novel despite an apparently familiar invoice." }
    ],
    defenses: ["Invoice provenance", "Beneficiary semantic binding", "Human confirmation on lineage break"]
  }
]);

export function getCampaign(id) {
  return CAMPAIGN_CATALOG.find((campaign) => campaign.id === id);
}

export const CHALLENGE_COVERAGE = Object.freeze({
  title: "Challenge proof ledger",
  brief: "Build an end-to-end adversarial AI system that identifies novel GenAI payment fraud, simulates it at scale, and detects, flags, and mitigates it.",
  pillars: [
    { id: "IDENTIFY", label: "Identify", score: 92, proof: ["12 AI-native campaigns", "AI enabler + payment channel", "Kill chain + observable telemetry", "Novelty and difficulty scores"], endpoint: "/api/v1/campaign/catalog" },
    { id: "GENERATE", label: "Generate", score: 88, proof: ["Seeded agent orchestration", "Counterfactual normal/attack worlds", "Entity graph + event sequence", "Versioned provenance + fidelity gates"], endpoint: "/api/v1/arena/run" },
    { id: "DEFEND", label: "Defend", score: 90, proof: ["Transaction + graph fusion", "Allow / step-up / review / block", "Explainable decision receipts", "Latency and customer-friction metrics"], endpoint: "/api/v1/score" },
    { id: "LEARN", label: "Closed loop", score: 82, proof: ["False-negative mining", "Defense-guided mutation", "Unseen-family holdout", "Human-gated promotion"], endpoint: "/api/v1/learn/mutate" }
  ],
  evidence_status: "PROTOTYPE_VERIFIED",
  gaps_before_pilot: ["Authorized aggregate calibration", "Persistent drift monitoring", "Tree-model challenger", "Signed candidate-model promotion"]
});
