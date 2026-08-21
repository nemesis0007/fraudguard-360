const $ = (selector) => document.querySelector(selector);
let modelHealth;

async function api(path, options = {}) {
  const response = await fetch(path, { headers: { "content-type": "application/json" }, ...options });
  const envelope = await response.json();
  if (!response.ok) throw new Error(envelope.error?.message ?? "Request failed");
  return envelope.data;
}

function toast(message) {
  const node = $("#toast"); node.textContent = message; node.classList.add("show");
  window.setTimeout(() => node.classList.remove("show"), 2400);
}

function percent(value) { return `${(Number(value) * 100).toFixed(1)}%`; }

async function loadCatalog() {
  const [catalog, health] = await Promise.all([api("/api/v1/attack/catalog"), api("/api/v1/model/health")]);
  modelHealth = health;
  $("#attackCount").textContent = catalog.length;
  $("#modelStatus").textContent = health.status === "READY" ? `${health.model_version} ready` : "Safe fallback active";
  $("#scenario").innerHTML = catalog.map((item) => {
    const holdout = health.holdout_scenarios?.includes(item.id) ? " · NOVEL HOLDOUT" : "";
    return `<option value="${item.id}">${item.name} · ${item.severity}${holdout}</option>`;
  }).join("");
}

async function refresh() {
  const data = await api("/api/v1/metrics/summary");
  $("#scoredCount").textContent = data.transactions_scored.toLocaleString();
  $("#latency").textContent = data.average_latency_ms;
  $("#retrainCount").textContent = data.retraining_candidates;
  $("#fidelityScore").textContent = data.fidelity.status === "PASS" ? `${data.fidelity.checks_passed}/${data.fidelity.checks_passed + data.fidelity.checks_failed}` : "N/A";
  $("#fidelityDetail").textContent = data.fidelity.status === "PASS" ? "Quality gates passed" : "Report unavailable";
  $("#decisionRows").innerHTML = data.recent_decisions.length ? data.recent_decisions.map((item) => `
    <tr><td>${item.transaction_id}</td><td><b>${item.risk_score}</b> / 100</td><td><span class="badge ${item.decision}">${item.decision}</span></td><td class="reasons">${item.reason_codes.join(" · ") || "BASELINE"}</td><td>${item.latency_ms} ms</td></tr>`).join("") : '<tr><td colspan="5" class="empty">No transactions scored in this session.</td></tr>';
}

function renderResult(data, extra = "") {
  const { metrics, confusion_matrix: matrix } = data;
  $("#f1Score").textContent = metrics.f1.toFixed(2);
  $("#precision").textContent = percent(metrics.precision); $("#recall").textContent = percent(metrics.recall); $("#falsePositive").textContent = percent(metrics.false_positive_rate);
  $("#scoreRing").style.background = `conic-gradient(var(--cyan) ${metrics.f1 * 360}deg, var(--line) 0deg)`;
  $("#confusion").innerHTML = `Detected <b>${matrix.tp}</b> attacks · Missed <b>${matrix.fn}</b> · False alerts <b>${matrix.fp}</b> · Correct approvals <b>${matrix.tn}</b><br><span>${data.scoring_mode} · ${data.model_version}${extra}</span>`;
}

async function evaluate() {
  const button = $("#simulate"); const heroButton = $("#runEvaluation");
  button.disabled = true; heroButton.disabled = true; $("#resultStatus").textContent = "Running";
  try {
    const data = await api("/api/v1/evaluate", { method: "POST", body: JSON.stringify({ scenarioId: $("#scenario").value, volume: Number($("#volume").value), seed: Number($("#seed").value), fraudRate: .25 }) });
    renderResult(data);
    $("#resultStatus").textContent = "Complete"; toast("Synthetic replay completed"); await refresh();
  } catch (error) { $("#resultStatus").textContent = "Error"; toast(error.message); }
  finally { button.disabled = false; heroButton.disabled = false; }
}

async function evaluateHoldout() {
  const button = $("#holdout"); button.disabled = true; $("#resultStatus").textContent = "Running";
  try {
    const scenarioId = modelHealth?.holdout_scenarios?.[0] ?? "LAUNDER_001";
    $("#scenario").value = scenarioId;
    const data = await api("/api/v1/evaluate/holdout", { method: "POST", body: JSON.stringify({ scenarioId, volume: Number($("#volume").value), seed: Number($("#seed").value) }) });
    renderResult(data.ensemble, ` · F1 lift ${data.lift.f1 >= 0 ? "+" : ""}${data.lift.f1.toFixed(3)} vs fallback`);
    $("#resultStatus").textContent = "Holdout"; toast("Novel-family comparison completed"); await refresh();
  } catch (error) { $("#resultStatus").textContent = "Error"; toast(error.message); }
  finally { button.disabled = false; }
}

async function generateMutations() {
  const button = $("#mutate"); button.disabled = true; button.textContent = "Finding model misses…";
  try {
    const scenarioId = modelHealth?.holdout_scenarios?.[0] ?? "LAUNDER_001";
    const data = await api("/api/v1/learn/mutate", { method: "POST", body: JSON.stringify({ scenarioId, volume: Number($("#volume").value), seed: Number($("#seed").value), maxMisses: 8 }) });
    $("#learningResult").textContent = `${data.baseline_false_negatives} misses → ${data.variants_generated} traceable variants · ${percent(data.variant_detection_rate)} detected · human review required`;
    toast("Defense-guided mutation batch created");
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.textContent = "Generate reviewed variants"; }
}

$("#simulate").addEventListener("click", evaluate);
$("#holdout").addEventListener("click", evaluateHoldout);
$("#mutate").addEventListener("click", generateMutations);
$("#runEvaluation").addEventListener("click", () => { document.querySelector("#console").scrollIntoView(); evaluate(); });
$("#refresh").addEventListener("click", refresh);

Promise.all([loadCatalog(), refresh()]).catch((error) => toast(error.message));
