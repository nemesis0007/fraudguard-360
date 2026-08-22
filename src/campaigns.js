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
    id: "TOKEN_PARASITE_009", codename: "Quiet Provision", name: "Token lifecycle parasite", base_scenario_id: "TOKEN_001",
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
    id: "INVOICE_SWITCH_012", codename: "Semantic Switch", name: "Agent-to-agent invoice redirection", base_scenario_id: "INVOICE_001",
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
  },
  {
    id: "RECOVERY_GHOST_013", codename: "Recovery Ghost", name: "Adaptive recovery-channel takeover", base_scenario_id: "SIMSWAP_001",
    ai_enabler: "Conversational agents adapt identity claims across recovery checkpoints",
    thesis: "The attacker avoids a single impossible identity claim and instead builds a locally plausible recovery story whose device, geography, and behavior do not agree globally.",
    channels: ["ACCOUNT RECOVERY", "MOBILE", "WALLET"], graph_motif: "RECOVERY_CONTEXT_FRACTURE", novelty: 94, difficulty: 92,
    fingerprint: { intent: 79, identity: 98, graph: 66, velocity: 58, merchant: 26, sequence: 95 },
    kill_chain: [
      { phase: "PROBE", title: "Recovery paths are sampled", observable: "Low-impact recovery attempts move between channels and claimed contexts." },
      { phase: "RECOVER", title: "Identity story converges", observable: "Each answer is plausible while the combined evidence remains inconsistent." },
      { phase: "REBIND", title: "Trusted factors change", observable: "Device, phone, or wallet relationships are replaced within a compressed window." },
      { phase: "MONETIZE", title: "New context moves value", observable: "A newly recovered identity immediately approaches unfamiliar beneficiaries." }
    ],
    defenses: ["Recovery-journey graph", "Factor-change cooling period", "Cross-channel identity consistency"]
  },
  {
    id: "QR_CHAMELEON_014", codename: "Chameleon Code", name: "Context-aware QR substitution", base_scenario_id: "QR_001",
    ai_enabler: "Vision-language generation produces context-matched payment destinations",
    thesis: "A QR destination looks native to the physical or digital context while merchant identity and settlement lineage point somewhere else.",
    channels: ["QR PAY", "PHYSICAL RETAIL", "MESSAGING"], graph_motif: "VISUAL_SETTLEMENT_DIVERGENCE", novelty: 95, difficulty: 88,
    fingerprint: { intent: 94, identity: 57, graph: 79, velocity: 48, merchant: 96, sequence: 82 },
    kill_chain: [
      { phase: "MIMIC", title: "Payment context is mirrored", observable: "Visual branding agrees with the expected merchant experience." },
      { phase: "SUBSTITUTE", title: "Destination lineage changes", observable: "Resolved payee differs from the merchant or invoice context." },
      { phase: "DISTRIBUTE", title: "Codes rotate", observable: "Many surface variants resolve into a smaller beneficiary community." },
      { phase: "MIGRATE", title: "Risk shifts destination", observable: "Traffic moves when a beneficiary is challenged or blocked." }
    ],
    defenses: ["Signed QR payloads", "Merchant-payee binding", "Destination community detection"]
  },
  {
    id: "LIMIT_WEAVE_015", codename: "Limit Loom", name: "Cross-provider credit stacking", base_scenario_id: "BNPL_001",
    ai_enabler: "Planning agents coordinate applications and spending across isolated credit providers",
    thesis: "Each lender sees a plausible new borrower, but the combined network reveals synchronized limit acquisition and a shared bust-out objective.",
    channels: ["BNPL", "CARD", "ECOMMERCE"], graph_motif: "CROSS_LENDER_LIMIT_CONVERGENCE", novelty: 92, difficulty: 95,
    fingerprint: { intent: 65, identity: 93, graph: 98, velocity: 87, merchant: 63, sequence: 91 },
    kill_chain: [
      { phase: "APPLY", title: "Thin files spread", observable: "Applications arrive across providers with correlated timing and infrastructure." },
      { phase: "SEASON", title: "Small obligations perform", observable: "Early repayments are unusually regular across the cohort." },
      { phase: "STACK", title: "Limits expand together", observable: "Available credit rises faster than independent income evidence." },
      { phase: "BREAK", title: "Exposure synchronizes", observable: "High-value spending appears across providers before outcomes are shared." }
    ],
    defenses: ["Consortium exposure graph", "Credit-age velocity", "Synchronized-limit hold"]
  },
  {
    id: "LOYALTY_MIRROR_016", codename: "Point Doppel", name: "Behavior-matched loyalty drain", base_scenario_id: "LOYALTY_001",
    ai_enabler: "Personalization models imitate each member's ordinary redemption behavior",
    thesis: "Redemptions resemble the customer's preferences transaction by transaction, but destination reuse and accelerated balance conversion expose coordination.",
    channels: ["LOYALTY", "TRAVEL", "GIFT CARD"], graph_motif: "REDEMPTION_DESTINATION_REUSE", novelty: 89, difficulty: 86,
    fingerprint: { intent: 72, identity: 84, graph: 91, velocity: 82, merchant: 74, sequence: 89 },
    kill_chain: [
      { phase: "PROFILE", title: "Preferences are inferred", observable: "Redemption choices closely match historical categories." },
      { phase: "MIMIC", title: "Low-value behavior blends", observable: "Initial conversions remain within ordinary customer ranges." },
      { phase: "ACCELERATE", title: "Balance drains", observable: "Redemption cadence detaches from the customer's long-term rhythm." },
      { phase: "CONVERGE", title: "Value shares endpoints", observable: "Many accounts redeem into linked travel, voucher, or delivery identities." }
    ],
    defenses: ["Redemption rhythm model", "Fulfilment-identity graph", "Balance-drain step-up"]
  },
  {
    id: "TRIAL_CONSTELLATION_017", codename: "Trial Constellation", name: "Synthetic subscription farm", base_scenario_id: "SUBSCRIPTION_001",
    ai_enabler: "Autonomous agents maintain varied personas, usage, and cancellation timing",
    thesis: "Synthetic subscribers appear individually engaged while shared devices, payment instruments, and synchronized lifecycle events reveal one coordinated farm.",
    channels: ["SUBSCRIPTION", "CARD", "DIGITAL SERVICE"], graph_motif: "LIFECYCLE_SYNCHRONY", novelty: 88, difficulty: 84,
    fingerprint: { intent: 49, identity: 89, graph: 97, velocity: 73, merchant: 61, sequence: 94 },
    kill_chain: [
      { phase: "ENROLL", title: "Personas diversify", observable: "Profiles vary while infrastructure overlap remains weak but persistent." },
      { phase: "ENGAGE", title: "Usage looks organic", observable: "Automated sessions imitate different consumption patterns." },
      { phase: "CONVERT", title: "Value is harvested", observable: "Benefits or trials concentrate into related fulfilment endpoints." },
      { phase: "ROTATE", title: "Cohort is replaced", observable: "Cancellations and new enrollments reproduce the same community shape." }
    ],
    defenses: ["Lifecycle community model", "Instrument reuse graph", "Cohort-shape matching"]
  },
  {
    id: "MERCHANT_MASK_018", codename: "Merchant Mask", name: "Adaptive transaction laundering", base_scenario_id: "MERCHANT_001",
    ai_enabler: "Generative catalogs and descriptors continuously imitate low-risk merchant activity",
    thesis: "Transaction descriptions and storefront content change to match expected categories while settlement, refund, and infrastructure relationships remain stable.",
    channels: ["ACQUIRING", "ECOMMERCE", "SETTLEMENT"], graph_motif: "DESCRIPTOR_SETTLEMENT_MISMATCH", novelty: 96, difficulty: 94,
    fingerprint: { intent: 61, identity: 58, graph: 100, velocity: 69, merchant: 100, sequence: 85 },
    kill_chain: [
      { phase: "MASK", title: "Commerce narrative changes", observable: "Catalog and descriptor semantics move faster than business operations." },
      { phase: "BLEND", title: "Volume imitates peers", observable: "Amounts and timing track the selected low-risk merchant cohort." },
      { phase: "SETTLE", title: "Infrastructure persists", observable: "Bank, device, domain, or refund entities recur beneath new presentations." },
      { phase: "MORPH", title: "Category shifts", observable: "The merchant changes identity after risk pressure without changing hidden ownership." }
    ],
    defenses: ["Descriptor-content consistency", "Merchant ownership graph", "Settlement lineage scoring"]
  },
  {
    id: "TAP_SHADOW_019", codename: "Tap Shadow", name: "Coordinated contactless relay", base_scenario_id: "NFC_001",
    ai_enabler: "Real-time agents coordinate timing and context across separated devices",
    thesis: "A contactless payment carries valid local credentials while device geography, terminal context, and customer presence form an impossible combined state.",
    channels: ["CONTACTLESS", "DEVICE", "PHYSICAL RETAIL"], graph_motif: "PROXIMITY_IMPOSSIBILITY", novelty: 93, difficulty: 96,
    fingerprint: { intent: 68, identity: 86, graph: 80, velocity: 62, merchant: 55, sequence: 98 },
    kill_chain: [
      { phase: "PAIR", title: "Sessions synchronize", observable: "Separated device contexts show unusually tight timing relationships." },
      { phase: "RELAY", title: "Presence is contradicted", observable: "Credential validity and physical proximity evidence disagree." },
      { phase: "REPEAT", title: "Terminal path expands", observable: "The same device relationship appears across distant merchant locations." },
      { phase: "ADAPT", title: "Cadence changes", observable: "Intervals and merchant choices shift after authorization friction." }
    ],
    defenses: ["Proximity attestation", "Impossible-travel sequence", "Terminal-device lineage"]
  },
  {
    id: "CORRIDOR_COMPOSER_020", codename: "Corridor Composer", name: "Adaptive remittance corridor hopping", base_scenario_id: "REMIT_001",
    ai_enabler: "Route-planning agents optimize transfers across currencies, providers, and timing windows",
    thesis: "Transfers remain ordinary inside each provider while a cross-border temporal graph reveals repeated corridor pivots and downstream reconvergence.",
    channels: ["REMITTANCE", "WALLET", "BANK TRANSFER"], graph_motif: "CORRIDOR_RECONVERGENCE", novelty: 97, difficulty: 97,
    fingerprint: { intent: 58, identity: 72, graph: 100, velocity: 88, merchant: 39, sequence: 99 },
    kill_chain: [
      { phase: "QUOTE", title: "Routes are explored", observable: "Low-value transfers sample providers, currencies, and destinations." },
      { phase: "SPLIT", title: "Value crosses corridors", observable: "Fragments remain under local thresholds and timing norms." },
      { phase: "PIVOT", title: "Pressure changes route", observable: "Declines cause coordinated provider or corridor substitution." },
      { phase: "RECONVERGE", title: "Destinations reconnect", observable: "Downstream wallets or beneficiaries reveal conserved value flow." }
    ],
    defenses: ["Cross-provider corridor graph", "Currency-flow conservation", "Outcome-conditioned route model"]
  },
  {
    id: "PAYROLL_WHISPER_021", codename: "Payroll Whisper", name: "Employee-agent destination redirection", base_scenario_id: "PAYROLL_001",
    ai_enabler: "Language agents imitate employee communication and HR workflow context",
    thesis: "A payroll change is semantically convincing but destination ownership, communication provenance, and employee behavior do not share the same history.",
    channels: ["PAYROLL", "HR WORKFLOW", "BANK TRANSFER"], graph_motif: "EMPLOYEE_DESTINATION_BREAK", novelty: 95, difficulty: 90,
    fingerprint: { intent: 99, identity: 94, graph: 77, velocity: 31, merchant: 20, sequence: 92 },
    kill_chain: [
      { phase: "CONTEXT", title: "Employee style is mirrored", observable: "Change language resembles prior internal communication." },
      { phase: "REQUEST", title: "Destination changes", observable: "A new account enters an otherwise stable payroll relationship." },
      { phase: "CONFIRM", title: "Workflow reinforces itself", observable: "Machine-readable approvals share the same unverified source context." },
      { phase: "PAY", title: "Cohort risk appears", observable: "Destination accounts connect to other redirected employees or cash-out paths." }
    ],
    defenses: ["Out-of-band employee confirmation", "Payroll destination ownership", "Change-cohort graph"]
  },
  {
    id: "GIFT_CASCADE_022", codename: "Gift Cascade", name: "Adaptive stored-value conversion", base_scenario_id: "GIFT_001",
    ai_enabler: "Agents optimize denominations, merchants, and redemption timing from payment outcomes",
    thesis: "Many small gift-card purchases and redemptions appear unrelated until value lineage exposes a coordinated conversion cascade.",
    channels: ["GIFT CARD", "ECOMMERCE", "WALLET"], graph_motif: "STORED_VALUE_CASCADE", novelty: 90, difficulty: 87,
    fingerprint: { intent: 52, identity: 71, graph: 96, velocity: 94, merchant: 89, sequence: 90 },
    kill_chain: [
      { phase: "ACQUIRE", title: "Denominations diversify", observable: "Purchases spread across values, merchants, and accounts." },
      { phase: "TRANSFER", title: "Ownership fragments", observable: "Stored-value instruments move through loosely linked identities." },
      { phase: "REDEEM", title: "Endpoints repeat", observable: "Redemptions converge on related fulfilment or wallet entities." },
      { phase: "ADAPT", title: "Portfolio rebalances", observable: "Merchant and denomination choices change after friction." }
    ],
    defenses: ["Stored-value lineage", "Redemption endpoint graph", "Denomination sequence scoring"]
  },
  {
    id: "RETURN_SYNTH_023", codename: "Phantom Return", name: "Generative return-evidence fraud", base_scenario_id: "REFUND_001",
    ai_enabler: "Multimodal generation fabricates mutually consistent return and support evidence",
    thesis: "Images, messages, and shipment narratives agree inside one claim while cross-claim artifacts and refund destinations reveal reuse.",
    channels: ["REFUND", "SUPPORT", "ECOMMERCE"], graph_motif: "EVIDENCE_TEMPLATE_REUSE", novelty: 91, difficulty: 89,
    fingerprint: { intent: 82, identity: 60, graph: 88, velocity: 64, merchant: 91, sequence: 86 },
    kill_chain: [
      { phase: "CLAIM", title: "Evidence bundle agrees", observable: "Text, image, and order details have unusually low contradiction." },
      { phase: "PERSUADE", title: "Support path is optimized", observable: "Claim language changes systematically after policy responses." },
      { phase: "REFUND", title: "Value leaves merchant", observable: "Refund destinations or replacement addresses recur across claims." },
      { phase: "REUSE", title: "Templates resurface", observable: "Latent visual or narrative structure links apparently unrelated customers." }
    ],
    defenses: ["Cross-claim evidence similarity", "Refund destination graph", "Multimodal provenance"]
  },
  {
    id: "SESSION_CHORUS_024", codename: "Device Chorus", name: "Emulated wallet-session swarm", base_scenario_id: "TOKEN_001",
    ai_enabler: "Multi-agent device emulation coordinates provisioning and low-risk usage histories",
    thesis: "Wallet sessions appear device-diverse while timing, attestation residue, and token-use sequences reveal a shared orchestration layer.",
    channels: ["WALLET", "TOKEN", "MOBILE"], graph_motif: "EMULATOR_ATTESTATION_COMMUNITY", novelty: 94, difficulty: 98,
    fingerprint: { intent: 45, identity: 95, graph: 99, velocity: 86, merchant: 52, sequence: 97 },
    kill_chain: [
      { phase: "EMULATE", title: "Device identities diversify", observable: "Surface fingerprints vary while deeper attestation residue repeats." },
      { phase: "PROVISION", title: "Tokens enter quietly", observable: "Provisioning is distributed across plausible time windows." },
      { phase: "SEASON", title: "Sessions build trust", observable: "Low-risk usage histories follow coordinated but varied scripts." },
      { phase: "CHORUS", title: "Swarm acts together", observable: "Token and merchant behavior synchronizes across the hidden device community." }
    ],
    defenses: ["Attestation-residue graph", "Provisioning cohort model", "Session-sequence diversity test"]
  }
]);

export function getCampaign(id) {
  return CAMPAIGN_CATALOG.find((campaign) => campaign.id === id);
}

export const CHALLENGE_COVERAGE = Object.freeze({
  title: "Challenge proof ledger",
  brief: "Build an end-to-end adversarial AI system that identifies novel GenAI payment fraud, simulates it at scale, and detects, flags, and mitigates it.",
  pillars: [
    { id: "IDENTIFY", label: "Identify", score: 94, proof: ["24 AI-native campaigns", "22 payment attack families", "Kill chain + observable telemetry", "Novelty and difficulty scores"], endpoint: "/api/v1/campaign/catalog" },
    { id: "GENERATE", label: "Generate", score: 94, proof: ["Six-role autonomous local agent missions", "Three competing policies per generation", "Counterfactual normal/attack worlds", "Versioned provenance + fidelity gates"], endpoint: "/api/v1/agents/mission" },
    { id: "DEFEND", label: "Defend", score: 90, proof: ["Transaction + graph fusion", "Allow / step-up / review / block", "Explainable decision receipts", "Latency and customer-friction metrics"], endpoint: "/api/v1/score" },
    { id: "LEARN", label: "Closed loop", score: 82, proof: ["False-negative mining", "Defense-guided mutation", "Unseen-family holdout", "Human-gated promotion"], endpoint: "/api/v1/learn/mutate" }
  ],
  evidence_status: "PROTOTYPE_VERIFIED",
  gaps_before_pilot: ["Authorized aggregate calibration", "Persistent drift monitoring", "Tree-model challenger", "Signed candidate-model promotion"]
});
