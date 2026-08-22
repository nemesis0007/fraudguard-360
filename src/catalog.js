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
  { id: "FRIENDLY_001", family: "FRIENDLY_FRAUD", name: "First-party dispute precursor", severity: "MEDIUM", signals: ["DEVICE_STABLE", "AMOUNT_DEVIATION", "MERCHANT_RISK"] },
  { id: "SIMSWAP_001", family: "ACCOUNT_RECOVERY_ATTACK", name: "Recovery-channel identity takeover", severity: "CRITICAL", signals: ["NEW_DEVICE", "IDENTITY_MISMATCH", "LOCATION_SHIFT", "UNUSUAL_HOUR"] },
  { id: "TOKEN_001", family: "TOKEN_PROVISIONING_ABUSE", name: "Wallet-token provisioning drift", severity: "HIGH", signals: ["NEW_DEVICE", "SHARED_DEVICE", "CARD_NOT_PRESENT"] },
  { id: "QR_001", family: "QR_DESTINATION_SUBSTITUTION", name: "Dynamic QR destination substitution", severity: "HIGH", signals: ["NEW_PAYEE", "MERCHANT_RISK", "LOCATION_SHIFT"] },
  { id: "BNPL_001", family: "CREDIT_BUST_OUT", name: "Cross-provider credit bust-out", severity: "CRITICAL", signals: ["NEW_ACCOUNT", "HIGH_VELOCITY", "AMOUNT_DEVIATION"] },
  { id: "INVOICE_001", family: "BUSINESS_PAYMENT_REDIRECTION", name: "Business invoice beneficiary redirection", severity: "CRITICAL", signals: ["NEW_PAYEE", "AMOUNT_DEVIATION", "MERCHANT_RISK"] },
  { id: "LOYALTY_001", family: "LOYALTY_VALUE_THEFT", name: "Loyalty balance conversion", severity: "MEDIUM", signals: ["NEW_DEVICE", "HIGH_VELOCITY", "SMALL_AMOUNT_BURST"] },
  { id: "SUBSCRIPTION_001", family: "SUBSCRIPTION_FARM", name: "Synthetic subscription trial farm", severity: "MEDIUM", signals: ["SHARED_DEVICE", "CARD_NOT_PRESENT", "NEW_ACCOUNT"] },
  { id: "MERCHANT_001", family: "TRANSACTION_LAUNDERING", name: "Merchant transaction laundering", severity: "CRITICAL", signals: ["MERCHANT_RISK", "GRAPH_DENSITY", "AMOUNT_DEVIATION"] },
  { id: "NFC_001", family: "CONTACTLESS_RELAY", name: "Contactless proximity relay", severity: "HIGH", signals: ["LOCATION_SHIFT", "DEVICE_STABLE", "AMOUNT_DEVIATION"] },
  { id: "REMIT_001", family: "REMITTANCE_CORRIDOR_ABUSE", name: "Cross-border corridor hopping", severity: "CRITICAL", signals: ["LOCATION_SHIFT", "NEW_PAYEE", "GRAPH_DENSITY", "HIGH_VELOCITY"] },
  { id: "PAYROLL_001", family: "PAYROLL_REDIRECTION", name: "Payroll destination redirection", severity: "CRITICAL", signals: ["NEW_PAYEE", "AMOUNT_DEVIATION", "IDENTITY_MISMATCH"] },
  { id: "GIFT_001", family: "GIFT_CARD_CASHOUT", name: "Gift-card conversion cascade", severity: "HIGH", signals: ["SMALL_AMOUNT_BURST", "HIGH_VELOCITY", "MERCHANT_RISK"] }
]);

export function getScenario(id) {
  return ATTACK_CATALOG.find((scenario) => scenario.id === id);
}
