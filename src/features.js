export class FeatureEngine {
  constructor() {
    this.customerHistory = new Map();
    this.deviceCustomers = new Map();
  }

  reset() {
    this.customerHistory.clear();
    this.deviceCustomers.clear();
  }

  transform(transaction) {
    const history = this.customerHistory.get(transaction.customer_id) ?? [];
    const timestampMs = Date.parse(transaction.timestamp);
    const recent = history.filter((item) => timestampMs - item.timestampMs <= 3_600_000);
    const priorAmounts = history.map((item) => item.amount);
    const average = priorAmounts.length
      ? priorAmounts.reduce((sum, value) => sum + value, 0) / priorAmounts.length
      : 1800;
    const amountDeviation = Math.abs(transaction.amount - average) / Math.max(average, 1);
    const knownDevices = new Set(history.map((item) => item.deviceId));
    const deviceCustomers = this.deviceCustomers.get(transaction.device_id) ?? new Set();
    const hour = new Date(transaction.timestamp).getUTCHours();

    const features = {
      velocity_1h: recent.length + 1,
      amount_deviation: Number(amountDeviation.toFixed(3)),
      new_device: history.length > 0 && !knownDevices.has(transaction.device_id) ? 1 : 0,
      shared_device_count: deviceCustomers.size,
      location_shift: transaction.country && transaction.country !== "IN" ? 1 : 0,
      new_payee: transaction.new_payee ? 1 : 0,
      card_not_present: transaction.card_present === false ? 1 : 0,
      unusual_hour: hour < 5 || hour > 22 ? 1 : 0,
      new_account: Number(transaction.account_age_days ?? 365) < 30 ? 1 : 0,
      identity_mismatch: transaction.identity_mismatch ? 1 : 0,
      merchant_risk: Number(transaction.merchant_risk ?? 0)
    };

    history.push({ timestampMs, amount: Number(transaction.amount), deviceId: transaction.device_id });
    this.customerHistory.set(transaction.customer_id, history.slice(-100));
    deviceCustomers.add(transaction.customer_id);
    this.deviceCustomers.set(transaction.device_id, deviceCustomers);
    return features;
  }
}

