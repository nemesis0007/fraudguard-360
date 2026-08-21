import { getScenario } from "./catalog.js";
import { pick, seededRandom } from "./random.js";

const merchants = ["M_GROCERY", "M_TRAVEL", "M_ELECTRONICS", "M_FASHION", "M_GAMING"];
const countries = ["IN", "IN", "IN", "SG", "AE"];

function round(value) {
  return Math.round(value * 100) / 100;
}

export function generateTransactions({
  scenarioId,
  volume = 100,
  seed = 42,
  fraudRate = 0.2,
  hardNegativeRate = 0.15,
  signalStrength = 0.88
}) {
  const scenario = getScenario(scenarioId);
  if (!scenario) throw new Error("UNKNOWN_SCENARIO");
  const count = Math.max(1, Math.min(1000, Number(volume) || 100));
  const rate = Math.max(0.01, Math.min(0.8, Number(fraudRate) || 0.2));
  const hardRate = Math.max(0, Math.min(0.5, Number(hardNegativeRate) || 0));
  const strength = Math.max(0.5, Math.min(1, Number(signalStrength) || 0.88));
  const random = seededRandom(seed);
  const start = Date.parse("2026-08-21T08:00:00.000Z");
  const rows = [];
  let elapsedMs = 0;

  for (let i = 0; i < count; i += 1) {
    const isFraud = random() < rate;
    const isHardNegative = !isFraud && random() < hardRate;
    const activates = (signal) => scenario.signals.includes(signal)
      && (isFraud ? random() < strength : isHardNegative && random() < 0.55);
    const customerNumber = 1 + Math.floor(random() * Math.max(8, count / 4));
    const customerId = `C${String(customerNumber).padStart(4, "0")}`;
    const normalAmount = 120 + random() * 4200;
    const attackMultiplier = isFraud ? 1.25 + random() * 4 : isHardNegative ? 1.2 + random() * 1.8 : 1;
    const family = scenario.family;
    const smallBurst = family === "BOT_TESTING" || family === "PROMOTION_ABUSE";
    const amount = smallBurst && isFraud ? 1 + random() * 49 : normalAmount * attackMultiplier;
    const newDevice = activates("NEW_DEVICE");
    const deviceId = newDevice
      ? `${isFraud ? "D_NEW" : "D_BENIGN_NEW"}_${i}`
      : `D_${String(customerNumber).padStart(4, "0")}`;
    elapsedMs += isFraud || isHardNegative ? 8_000 + Math.floor(random() * 55_000) : 90_000 + Math.floor(random() * 240_000);
    const timestamp = new Date(start + elapsedMs).toISOString();
    const locationShift = activates("LOCATION_SHIFT");
    const newPayee = activates("NEW_PAYEE");
    const newAccount = activates("NEW_ACCOUNT");
    const identityMismatch = isFraud && activates("IDENTITY_MISMATCH");
    const merchantRisk = activates("MERCHANT_RISK");
    const cardNotPresent = family === "CARD_NOT_PRESENT" && (isFraud ? random() < strength : isHardNegative && random() < 0.45);
    rows.push({
      transaction_id: `TX_${seed}_${String(i + 1).padStart(5, "0")}`,
      customer_id: customerId,
      merchant_id: pick(random, merchants),
      device_id: deviceId,
      amount: round(amount),
      currency: "INR",
      channel: family === "INSTANT_PAYMENT_SCAM" ? "UPI" : "CARD",
      timestamp,
      country: locationShift ? pick(random, ["SG", "AE"]) : pick(random, countries),
      card_present: !cardNotPresent,
      new_payee: newPayee,
      account_age_days: newAccount ? (isFraud ? 2 : 12 + Math.floor(random() * 18)) : 90 + Math.floor(random() * 1200),
      identity_mismatch: identityMismatch,
      merchant_risk: merchantRisk ? round(0.58 + random() * 0.34) : round(random() * 0.35),
      scenario_id: scenario.id,
      scenario_version: "1.0",
      synthetic: true,
      is_fraud: isFraud,
      synthetic_profile: isFraud ? "ATTACK" : isHardNegative ? "HARD_NEGATIVE" : "BASELINE"
    });
  }
  return rows;
}
