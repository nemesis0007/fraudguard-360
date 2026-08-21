const $ = (selector) => document.querySelector(selector);
const state = { catalog: [], health: null, arena: null, graphNodes: [], animation: 0 };
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

async function api(path, options = {}) {
  const response = await fetch(path, { headers: { "content-type": "application/json" }, ...options });
  const envelope = await response.json();
  if (!response.ok) throw new Error(envelope.error?.message ?? "Request failed");
  return envelope.data;
}

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  window.setTimeout(() => node.classList.remove("show"), 2600);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 }).format(Number(value) || 0);
}

function percentage(value) { return `${(Number(value) * 100).toFixed(1)}%`; }

function sizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(rect.width * ratio) || canvas.height !== Math.round(rect.height * ratio)) {
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
  }
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { context, width: rect.width, height: rect.height };
}

function hash(text) {
  let value = 0;
  for (const character of text) value = ((value << 5) - value + character.charCodeAt(0)) | 0;
  return Math.abs(value);
}

function drawHero(time = 0) {
  const canvas = $("#heroCanvas");
  if (!canvas) return;
  const { context, width, height } = sizeCanvas(canvas);
  context.clearRect(0, 0, width, height);
  const center = { x: width * .5, y: height * .51 };
  const points = Array.from({ length: 18 }, (_, index) => {
    const angle = index / 18 * Math.PI * 2 + (index % 3) * .1;
    const ring = index % 4 === 0 ? .18 : index % 3 === 0 ? .33 : .45;
    return { x: center.x + Math.cos(angle) * width * ring, y: center.y + Math.sin(angle) * height * ring * .72, hot: index === 3 || index === 8 || index === 14 };
  });
  context.lineWidth = 1;
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const targets = [points[(index + 3) % points.length], points[(index + 7) % points.length]];
    for (const target of targets) {
      context.beginPath(); context.moveTo(point.x, point.y); context.lineTo(target.x, target.y);
      context.strokeStyle = point.hot && target.hot ? "rgba(255,102,95,.28)" : "rgba(112,181,171,.12)"; context.stroke();
    }
  }
  points.forEach((point, index) => {
    const pulse = point.hot ? 2 + Math.sin(time / 430 + index) * 1.3 : 0;
    context.beginPath(); context.arc(point.x, point.y, (point.hot ? 4 : 2.4) + pulse, 0, Math.PI * 2);
    context.fillStyle = point.hot ? "rgba(255,102,95,.85)" : index % 3 === 0 ? "rgba(113,216,223,.75)" : "rgba(158,230,202,.64)"; context.fill();
  });
  const moving = (time / 3500) % 1;
  const a = points[1], b = points[8];
  context.beginPath(); context.arc(a.x + (b.x - a.x) * moving, a.y + (b.y - a.y) * moving, 2.2, 0, Math.PI * 2); context.fillStyle = "#ff817a"; context.fill();
  requestAnimationFrame(drawHero);
}

function layoutGraph(nodes, width, height) {
  const centers = { customer: [width * .27, height * .52], merchant: [width * .73, height * .42], device: [width * .53, height * .72] };
  const counts = { customer: 0, merchant: 0, device: 0 };
  return nodes.map((node) => {
    const center = centers[node.type] || [width / 2, height / 2];
    const index = counts[node.type]++;
    const angle = ((hash(node.id) % 360) / 180) * Math.PI + index * .5;
    const radius = 34 + (hash(`${node.id}:radius`) % 105);
    return { ...node, x: center[0] + Math.cos(angle) * radius, y: center[1] + Math.sin(angle) * radius * .62 };
  });
}

function drawGraph(time = 0) {
  const canvas = $("#graphCanvas");
  if (!canvas) return;
  const { context, width, height } = sizeCanvas(canvas);
  context.clearRect(0, 0, width, height);
  if (!state.arena) { state.animation = requestAnimationFrame(drawGraph); return; }
  const nodes = layoutGraph(state.arena.graph.nodes, width, height);
  state.graphNodes = nodes;
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  state.arena.graph.edges.forEach((edge, index) => {
    const source = nodeMap.get(edge.source), target = nodeMap.get(edge.target);
    if (!source || !target) return;
    context.beginPath(); context.moveTo(source.x, source.y); context.lineTo(target.x, target.y);
    context.lineWidth = edge.blocked ? 1.2 : .7;
    context.strokeStyle = edge.risk >= 55 ? "rgba(255,102,95,.28)" : edge.blocked ? "rgba(113,216,223,.23)" : "rgba(100,139,135,.13)"; context.stroke();
    if (edge.risk >= 55 && index < 12) {
      const progress = ((time / 1700) + index * .17) % 1;
      context.beginPath(); context.arc(source.x + (target.x - source.x) * progress, source.y + (target.y - source.y) * progress, 1.7, 0, Math.PI * 2);
      context.fillStyle = edge.blocked ? "#71d8df" : "#ff665f"; context.fill();
    }
  });
  nodes.forEach((node) => {
    const hot = node.risk >= 60;
    if (hot) {
      context.beginPath(); context.arc(node.x, node.y, 11 + Math.sin(time / 350 + hash(node.id)) * 2, 0, Math.PI * 2); context.fillStyle = "rgba(255,102,95,.055)"; context.fill();
    }
    context.beginPath(); context.arc(node.x, node.y, hot ? 4.8 : 3.2, 0, Math.PI * 2);
    context.fillStyle = hot ? "#ff665f" : node.type === "merchant" ? "#f1a25d" : node.type === "device" ? "#71d8df" : "#9ee6ca"; context.fill();
    context.strokeStyle = "rgba(7,16,20,.9)"; context.lineWidth = 2; context.stroke();
  });
  state.animation = requestAnimationFrame(drawGraph);
}

function renderTimeline(events) {
  $("#timeline").innerHTML = events.map((event) => `<li class="${event.actor === "RED" ? "red" : event.actor === "BLUE" ? "blue" : ""}"><small>+${event.offset_ms} MS<br>${escapeHtml(event.actor)}</small><div><b>${escapeHtml(event.title)}</b><span>${escapeHtml(event.detail)}</span></div></li>`).join("");
}

function renderReceipt(receipt) {
  if (!receipt) { $("#receipt").className = "receipt-empty"; $("#receipt").textContent = "No flagged receipt was generated."; return; }
  $("#receipt").className = "receipt-grid";
  $("#receipt").innerHTML = `<div class="receipt-risk"><strong>${receipt.risk_score}</strong><span>/ 100 FUSED RISK<br>${escapeHtml(receipt.transaction_id)}</span><b>${escapeHtml(receipt.decision)}</b></div><div class="receipt-lines"><div><span>Transaction model</span><b>${receipt.transaction_score}</b></div><div><span>Graph signal</span><b>${receipt.graph_score}</b></div><div><span>Amount</span><b>${money(receipt.amount)}</b></div><div><span>Ground truth</span><b>${receipt.is_fraud ? "SYNTHETIC ATTACK" : "BENIGN"}</b></div></div><div class="reason-chips">${receipt.reason_codes.map((code) => `<span>${escapeHtml(code.replaceAll("_", " "))}</span>`).join("")}</div>`;
}

function renderKillChain(campaign, target = "#killChain") {
  const container = $(target);
  if (!container) return;
  container.innerHTML = campaign.kill_chain.map((stage, index) => `<div class="${target === "#killChain" ? "kill-stage" : ""}"><small>0${index + 1} / ${escapeHtml(stage.phase)}</small><b>${escapeHtml(stage.title)}</b><span>${escapeHtml(stage.observable)}</span></div>`).join("");
}

function renderFingerprint(fingerprint) {
  Object.entries(fingerprint).forEach(([signal, value]) => {
    const name = signal[0].toUpperCase() + signal.slice(1);
    const bar = $(`#signal${name}`); const output = $(`#signal${name}Value`);
    if (bar) bar.style.width = `${value}%`;
    if (output) output.textContent = value;
  });
}

function renderCampaignPreview(campaign) {
  const index = Math.max(0, state.catalog.findIndex((item) => item.id === campaign.id || item.id === campaign.campaign_id));
  $("#campaignNumber").textContent = `CAMPAIGN ${String(index + 1).padStart(2, "0")} / ${String(state.catalog.length).padStart(2, "0")}`;
  $("#campaignCodename").textContent = campaign.codename.toUpperCase();
  $("#campaignName").textContent = campaign.name ?? campaign.label;
  $("#campaignThesis").textContent = campaign.thesis;
  $("#campaignNovelty").textContent = campaign.novelty;
  $("#campaignDifficulty").textContent = campaign.difficulty;
  $("#activeTactic").textContent = campaign.ai_enabler ?? campaign.tactic;
  $("#campaignChannels").innerHTML = campaign.channels.map((channel) => `<span>${escapeHtml(channel)}</span>`).join("");
  $("#defenseControls").innerHTML = campaign.defenses.map((defense) => `<span>${escapeHtml(defense)}</span>`).join("");
  renderKillChain(campaign);
  renderFingerprint(campaign.fingerprint);
}

function renderSpotlight(campaign) {
  const index = state.catalog.findIndex((item) => item.id === campaign.id);
  $("#spotlightIndex").textContent = `${String(index + 1).padStart(2, "0")} / ${String(state.catalog.length).padStart(2, "0")}`;
  $("#spotlightNovelty").textContent = `NOVELTY ${campaign.novelty}`;
  $("#spotlightCodename").textContent = campaign.codename.toUpperCase();
  $("#spotlightName").textContent = campaign.name;
  $("#spotlightThesis").textContent = campaign.thesis;
  $("#spotlightEnabler").textContent = campaign.ai_enabler;
  $("#spotlightChannels").textContent = campaign.channels.join(" · ");
  renderKillChain(campaign, "#spotlightChain");
  document.querySelectorAll(".campaign-card").forEach((card) => card.classList.toggle("active", card.dataset.campaignId === campaign.id));
}

function renderCampaignAtlas(campaigns) {
  $("#campaignCards").innerHTML = campaigns.map((campaign, index) => `<button class="campaign-card${index === 0 ? " active" : ""}" data-campaign-id="${escapeHtml(campaign.id)}"><small>${String(index + 1).padStart(2, "0")} · ${escapeHtml(campaign.codename.toUpperCase())}</small><b>${escapeHtml(campaign.name)}</b><span>N${campaign.novelty} · D${campaign.difficulty}</span></button>`).join("");
  renderSpotlight(campaigns[0]);
}

function renderAgentTrace(trace, scale) {
  $("#scaleLabel").textContent = `${scale.events_materialized} materialized events · ${scale.virtual_population.toLocaleString()} virtual population · ${scale.parallel_agents} parallel agents`;
  $("#agentTrace").innerHTML = trace.map((step) => `<div class="agent-step ${step.state === "ADAPTED" ? "adapted" : ""}"><small>${escapeHtml(step.agent)} · ${escapeHtml(step.state)}</small><b>${escapeHtml(step.action)}</b><span>${escapeHtml(step.evidence)}</span><em>TRACE SEALED</em></div>`).join("");
}

function renderCoverage(coverage) {
  $("#coverageLedger").innerHTML = coverage.pillars.map((pillar) => `<article class="ledger-card"><div class="ledger-score" style="--score:${pillar.score}"><b>${pillar.score}</b></div><small>${escapeHtml(pillar.id)} / PROOF</small><h3>${escapeHtml(pillar.label)}</h3><ul>${pillar.proof.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>`).join("");
  $("#pilotGaps").innerHTML = coverage.gaps_before_pilot.map((gap) => `<b>${escapeHtml(gap)}</b>`).join("");
}

function renderArena(data) {
  state.arena = data;
  const baseline = data.rounds.find((round) => round.id === "BASELINE").metrics;
  const adapted = data.rounds.find((round) => round.id === "ADAPTED").metrics;
  $("#arenaId").textContent = `${data.arena_id} · ${data.governance.mode}`;
  $("#defenderAdvantage").textContent = `${data.outcome.defender_score} : ${data.outcome.attacker_score}`;
  $("#winnerLabel").textContent = `${data.outcome.winner.toLowerCase()} leads`;
  $("#preventedValue").textContent = money(data.outcome.prevented_value_lift);
  $("#exposureReduction").textContent = percentage(data.outcome.escaped_value_reduction);
  $("#detectionLatency").textContent = `${data.outcome.estimated_detection_latency_ms} ms`;
  $("#attackerBudget").textContent = money(data.controls.attacker_budget);
  $("#motifLabel").textContent = data.graph.motif.replaceAll("_", " ").toLowerCase();
  $("#graphStats").textContent = `${data.graph.nodes.length} entities · ${data.graph.edges.length} relationships`;
  $("#baselineValue").textContent = money(baseline.payment_value);
  $("#baselineFriction").textContent = percentage(baseline.customer_friction_rate);
  $("#adaptedPrevented").textContent = money(adapted.prevented_value);
  $("#adaptedEscaped").textContent = money(adapted.escaped_value);
  $("#graphEmpty").classList.add("hidden");
  renderCampaignPreview({ ...data.scenario, id: data.scenario.campaign_id, name: data.scenario.label, ai_enabler: data.scenario.tactic });
  renderAgentTrace(data.agent_trace, data.simulation_scale);
  renderTimeline(data.timeline);
  renderReceipt(data.decision_receipts[0]);
}

async function runArena() {
  const button = $("#runArena");
  button.disabled = true; button.firstChild.textContent = "Simulating ";
  try {
    const payload = {
      campaignId: $("#scenario").value,
      volume: 130,
      seed: 42,
      aggression: Number($("#aggression").value) / 100,
      stealth: Number($("#stealth").value) / 100,
      defenderStrength: Number($("#defenseStrength").value) / 100,
      graphDefense: $("#graphDefense").checked
    };
    const data = await api("/api/v1/arena/run", { method: "POST", body: JSON.stringify(payload) });
    renderArena(data);
    toast(`${data.scenario.label}: replay complete`);
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.firstChild.textContent = "Run attack "; }
}

async function initialize() {
  const [catalog, health] = await Promise.all([
    api("/api/v1/campaign/catalog"), api("/api/v1/model/health")
  ]);
  state.catalog = catalog; state.health = health;
  $("#scenario").innerHTML = catalog.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.codename)} · ${escapeHtml(item.name)}</option>`).join("");
  $("#scenario").value = catalog[0].id;
  renderCampaignAtlas(catalog);
  renderCampaignPreview(catalog[0]);
  $("#modelMetric").textContent = health.status;
  $("#modelVersion").textContent = health.model_version.replace("fg-linear-", "FG-").slice(0, 14).toUpperCase();
  const [fidelityResult, evidenceResult, coverageResult] = await Promise.allSettled([
    api("/api/v1/fidelity/report"), api("/api/v1/data/evidence"), api("/api/v1/challenge/coverage")
  ]);
  if (fidelityResult.status === "fulfilled") {
    $("#fidelityMetric").textContent = `${fidelityResult.value.passed} / ${fidelityResult.value.checks.length}`;
  }
  if (evidenceResult.status === "fulfilled") {
    const statuses = new Map(evidenceResult.value.layers.map((item) => [item.id, item.status]));
    if (statuses.get("public") !== "REFERENCE_ONLY") toast("Evidence manifest changed; review provenance labels.");
  }
  if (coverageResult.status === "fulfilled") renderCoverage(coverageResult.value);
  await runArena();
  if (window.location.hash) {
    requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView({ block: "start" })));
  }
}

function bindControls() {
  [["#aggression", "#aggressionValue"], ["#stealth", "#stealthValue"], ["#defenseStrength", "#defenseValue"]].forEach(([input, output]) => {
    $(input).addEventListener("input", () => { $(output).textContent = `${$(input).value}%`; if (input === "#aggression") $("#attackerBudget").textContent = money(25000 + Number($(input).value) / 100 * 175000); });
  });
  $("#graphDefense").addEventListener("change", () => { document.querySelector(".model-state .cyan").textContent = $("#graphDefense").checked ? "ACTIVE" : "DISABLED"; });
  $("#scenario").addEventListener("change", () => {
    const campaign = state.catalog.find((item) => item.id === $("#scenario").value);
    if (campaign) { renderCampaignPreview(campaign); renderSpotlight(campaign); }
  });
  $("#campaignCards").addEventListener("click", (event) => {
    const card = event.target.closest(".campaign-card");
    if (!card) return;
    const campaign = state.catalog.find((item) => item.id === card.dataset.campaignId);
    if (campaign) { $("#scenario").value = campaign.id; renderSpotlight(campaign); renderCampaignPreview(campaign); }
  });
  $("#launchSpotlight").addEventListener("click", () => { $("#arena").scrollIntoView({ behavior: "smooth" }); window.setTimeout(runArena, 450); });
  $("#runArena").addEventListener("click", runArena);
  ["#heroRun", "#bottomRun"].forEach((selector) => $(selector).addEventListener("click", () => { $("#arena").scrollIntoView({ behavior: "smooth" }); window.setTimeout(runArena, 450); }));
  $("#graphCanvas").addEventListener("click", (event) => {
    if (!state.arena) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    const target = state.graphNodes.find((node) => Math.hypot(node.x - x, node.y - y) < 13);
    if (!target) return;
    const receipt = state.arena.decision_receipts.find((item) => item.transaction_id.includes(target.id)) || state.arena.decision_receipts[0];
    renderReceipt(receipt); toast(`${target.type} ${target.label} · peak risk ${target.risk}`);
  });
}

bindControls();
requestAnimationFrame(drawHero);
requestAnimationFrame(drawGraph);
initialize().catch((error) => toast(error.message));
