export const ATTACK_CATALOG = Object.freeze([
  { id: "ATO_001", family: "ACCOUNT_TAKEOVER", name: "Account takeover", severity: "HIGH", signals: ["NEW_DEVICE", "HIGH_VELOCITY", "LOCATION_SHIFT"] },
  { id: "CNP_001", family: "CARD_NOT_PRESENT", name: "Card-not-present burst", severity: "HIGH", signals: ["CARD_NOT_PRESENT", "NEW_DEVICE", "AMOUNT_DEVIATION"] },
  { id: "MULE_001", family: "MULE_NETWORK", name: "Mule account fan-in", severity: "CRITICAL", signals: ["SHARED_DEVICE", "NEW_PAYEE", "HIGH_VELOCITY"] },
  { id: "BOT_001", family: "BOT_TESTING", name: "Bot-driven card testing", severity: "HIGH", signals: ["HIGH_VELOCITY", "SMALL_AMOUNT_BURST", "REPEATED_ATTEMPTS"] },
  { id: "REFUND_001", family: "REFUND_ABUSE", name: "Merchant refund abuse", severity: "MEDIUM", signals: ["MERCHANT_RISK", "HIGH_VELOCITY", "AMOUNT_DEVIATION"] },
  { id: "UPI_001", family: "INSTANT_PAYMENT_SCAM", name: "Urgent new-payee transfer", severity: "HIGH", signals: ["NEW_PAYEE", "UNUSUAL_HOUR", "AMOUNT_DEVIATION"] },
  { id: "SYNID_001", family: "SYNTHETIC_IDENTITY", name: "Synthetic identity lifecycle", severity: "HIGH", signals: ["NEW_ACCOUNT", "IDENTITY_MISMATCH", "HIGH_VELOCITY"] },
  { id: "LAUNDER_001", family: "TRANSACTION_LAYERING", name: "Rapid split-and-merge", severity: "CRITICAL", signals: ["GRAPH_DENSITY", "HIGH_VELOCITY", "NEW_PAYEE"] },
  { id: "PROMO_001", family: "PROMOTION_ABUSE", name: "Multi-account incentive abuse", severity: "MEDIUM", signals: ["SHARED_DEVICE", "NEW_ACCOUNT", "SMALL_AMOUNT_BURST"] },
  { id: "FRIENDLY_001", family: "FRIENDLY_FRAUD", name: "First-party dispute precursor", severity: "MEDIUM", signals: ["DEVICE_STABLE", "AMOUNT_DEVIATION", "MERCHANT_RISK"] }
]);

export function getScenario(id) {
  return ATTACK_CATALOG.find((scenario) => scenario.id === id);
}

