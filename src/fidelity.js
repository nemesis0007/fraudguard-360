import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const defaultPath = fileURLToPath(new URL("../models/synthetic-fidelity-v1.json", import.meta.url));

export function loadFidelityReport(path = defaultPath) {
  try {
    const report = JSON.parse(readFileSync(path, "utf8"));
    if (!Array.isArray(report.checks) || !report.report_version) throw new Error("INVALID_FIDELITY_REPORT");
    return { status: report.failed === 0 ? "PASS" : "FAIL", ...report };
  } catch (error) {
    return {
      status: "UNAVAILABLE",
      report_version: null,
      passed: 0,
      failed: 0,
      quality_score: 0,
      checks: [],
      error: String(error.message)
    };
  }
}
