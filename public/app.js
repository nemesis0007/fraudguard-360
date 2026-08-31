const $ = (selector) => document.querySelector(selector);
const state = { catalog: [], attacks: [], health: null, scorecard: null, agentHealth: null, threatHealth: null, threatDraft: null, mission: null, missionTimer: null, arena: null, graphNodes: [], animation: 0, heroPreset: "normal" };
const workspaceTargets = { overview: "#top", missions: "#agent-lab", threats: "#threats", simulation: "#arena", evidence: "#evaluation", data: "#dataset", system: "#architecture" };
const workspaceNames = { overview: "Overview", missions: "Discover", simulation: "Defend", evidence: "Prove", system: "Architecture" };
const workspaceGroups = { overview: ["overview"], missions: ["missions", "threats"], simulation: ["simulation"], evidence: ["evidence", "data"], system: ["system"] };
const workspaceGuides = {
  missions: {
    eyebrow: "STEP 1 / DISCOVER & GENERATE",
    title: "Turn attack ideas into governed test scenarios.",
    description: "Start with the attack catalogue, let GenAI propose safe synthetic metadata, then require human approval before generating any fictional payment.",
    steps: ["Choose an attack", "Review the AI proposal", "Approve synthetic generation"],
    action: "Start discovery"
  },
  threats: {
    eyebrow: "ATTACK LIBRARY / PLAIN ENGLISH",
    title: "Meet each attack before running it.",
    description: "Every attack card explains the criminal goal, the payment signals it changes, and the defense expected to catch it.",
    steps: ["Pick an attack", "Follow its stages", "See the defensive signals"],
    action: "Explore the attacks"
  },
  simulation: {
    eyebrow: "STEP 2 / SIMULATE & DEFEND",
    title: "Watch an attack become a payment decision.",
    description: "Choose an attack and press Run. The GFF lab creates fictional payments, scores their risk, then shows why each payment was allowed, challenged, reviewed, or blocked.",
    steps: ["Select an attack", "Run fictional payments", "Inspect the decision"],
    action: "Open the simulator"
  },
  evidence: {
    eyebrow: "STEP 3 / PROVE & LEARN",
    title: "Connect the dataset, model results, and feedback loop.",
    description: "Inspect where the 210,000 synthetic records came from, compare models on the same test set, and turn misses into human-reviewed retraining candidates.",
    steps: ["Verify dataset lineage", "Inspect errors and holdout results", "Queue reviewed improvements"],
    action: "Review the proof"
  },
  data: {
    eyebrow: "DATASET / WHAT IT ACTUALLY CONTAINS",
    title: "A fraud dataset, explained without jargon.",
    description: "The dataset contains 210,000 fictional payment events—not real cardholder records. It includes normal behavior, known attack patterns, difficult safe examples, and one unseen attack family for a fair final test.",
    steps: ["Generate fictional payments", "Label normal and attack behavior", "Train, validate, and test"],
    action: "See and download the data"
  },
  system: {
    eyebrow: "HOW IT WORKS / ONE PAYMENT AT A TIME",
    title: "Follow a payment through the whole system.",
    description: "Start with a payment request, add behavior and relationship signals, calculate risk, apply policy, and record an explainable decision.",
    steps: ["Receive a payment", "Calculate risk", "Allow, challenge, review, or block"],
    action: "View the architecture"
  }
};
const heroPresets = {
  normal: { merchant: "Aster Market", glyph: "A", channel: "Card present · Mumbai", amount: "₹2,480", reasons: ["Known device", "Stable amount", "Local merchant"], features: { velocity_1h: 1, amount_deviation: .32, new_device: 0, shared_device_count: 0, location_shift: 0, new_payee: 0, card_not_present: 0, unusual_hour: 0, new_account: 0, identity_mismatch: 0, merchant_risk: .08 } },
  device: { merchant: "Northstar Travel", glyph: "N", channel: "Online · Singapore", amount: "₹18,900", reasons: ["New device", "Location shift", "Remote payment"], features: { velocity_1h: 2, amount_deviation: 1.35, new_device: 1, shared_device_count: 1, location_shift: 1, new_payee: 0, card_not_present: 1, unusual_hour: 0, new_account: 0, identity_mismatch: 0, merchant_risk: .31 } },
  coordinated: { merchant: "Orbit Digital", glyph: "O", channel: "Online · Cross-channel", amount: "₹74,200", reasons: ["Velocity burst", "Shared device", "New beneficiary"], features: { velocity_1h: 8, amount_deviation: 4.2, new_device: 1, shared_device_count: 7, location_shift: 1, new_payee: 1, card_not_present: 1, unusual_hour: 1, new_account: 1, identity_mismatch: 1, merchant_risk: .82 } }
};
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

function getPreference(key, fallback) {
  try { return localStorage.getItem(`fraudguard:${key}`) ?? fallback; }
  catch { return fallback; }
}

function setPreference(key, value) {
  try { localStorage.setItem(`fraudguard:${key}`, value); }
  catch { /* Preferences remain session-only when storage is unavailable. */ }
}

function resolvedTheme(preference) {
  if (preference !== "auto") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyWorkspacePreferences() {
  const theme = getPreference("theme", "dark");
  const reduced = getPreference("motion", window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "full");
  document.documentElement.dataset.theme = resolvedTheme(theme);
  document.documentElement.dataset.themePreference = theme;
  document.documentElement.dataset.motion = reduced;
  document.querySelectorAll('[data-preference="theme"] button').forEach((button) => button.classList.toggle("active", button.dataset.value === theme));
}

function workspaceForHash(hashValue) {
  if (["#agent-lab"].includes(hashValue)) return "missions";
  if (["#threats"].includes(hashValue)) return "threats";
  if (["#arena"].includes(hashValue)) return "simulation";
  if (["#evaluation"].includes(hashValue)) return "evidence";
  if (["#dataset", "#evidence"].includes(hashValue)) return "data";
  if (["#architecture", "#team"].includes(hashValue)) return "system";
  return "overview";
}

function activateWorkspace(view, { updateHistory = true, scroll = true } = {}) {
  const requested = view === "threats" ? "missions" : view === "data" ? "evidence" : view;
  const selected = workspaceGroups[requested] ? requested : "overview";
  const guide = $("#workspaceGuide");
  const guideContent = workspaceGuides[selected];
  guide.hidden = true;
  if (guideContent) {
    $("#workspaceGuideEyebrow").textContent = guideContent.eyebrow;
    $("#workspaceGuideTitle").textContent = guideContent.title;
    $("#workspaceGuideDescription").textContent = guideContent.description;
    $("#workspaceGuideFlow").innerHTML = guideContent.steps.map((step, index) => `<li><span>0${index + 1}</span><b>${step}</b></li>`).join("");
    $("#workspaceGuideAction").firstChild.textContent = `${guideContent.action} `;
    $("#workspaceGuideAction").dataset.target = workspaceTargets[selected];
  }
  const visibleSections = [];
  document.querySelectorAll("[data-workspace-view]").forEach((section) => {
    const active = workspaceGroups[selected].includes(section.dataset.workspaceView);
    section.classList.toggle("workspace-view-hidden", !active);
    if (active) visibleSections.push(section);
  });
  document.querySelectorAll("[data-workspace-tab]").forEach((button) => {
    const active = button.dataset.workspaceTab === selected;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  document.body.dataset.workspace = selected;
  $("#viewAnnouncer").textContent = `${workspaceNames[selected]} workspace selected`;
  if (document.documentElement.dataset.motion !== "reduced") {
    visibleSections.forEach((section, index) => {
      section.classList.remove("workspace-entering");
      section.style.setProperty("--enter-delay", `${index * 65}ms`);
      requestAnimationFrame(() => section.classList.add("workspace-entering"));
    });
  }
  setPreference("workspace", selected);
  if (updateHistory) history.replaceState(null, "", workspaceTargets[selected]);
  if (scroll) {
    window.scrollTo({ top: 0, behavior: document.documentElement.dataset.motion === "reduced" ? "auto" : "smooth" });
  }
}

function bindWorkspaceControls() {
  applyWorkspacePreferences();
  const requestedHash = window.location.hash;
  const requestedView = requestedHash ? workspaceForHash(requestedHash) : getPreference("workspace", "overview");
  if (requestedView !== "overview" && requestedHash) history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  activateWorkspace(requestedView, { updateHistory: false, scroll: false });
  if (requestedView !== "overview") {
    const showGuideFromTop = () => {
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    if (document.readyState === "complete") showGuideFromTop();
    else window.addEventListener("load", showGuideFromTop, { once: true });
  }

  const tabs = [...document.querySelectorAll("[data-workspace-tab]")];
  tabs.forEach((button, index) => {
    button.addEventListener("click", () => activateWorkspace(button.dataset.workspaceTab));
    button.addEventListener("keydown", (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus(); tabs[next].click();
    });
  });

  document.querySelectorAll('[data-preference="theme"] button').forEach((button) => button.addEventListener("click", () => { setPreference("theme", button.dataset.value); applyWorkspacePreferences(); }));

  document.querySelectorAll("[data-open-workspace]").forEach((button) => button.addEventListener("click", () => activateWorkspace(button.dataset.openWorkspace)));
  document.querySelectorAll('a[href^="#"]:not([data-open-workspace])').forEach((link) => link.addEventListener("click", (event) => {
    const nextView = workspaceForHash(link.getAttribute("href"));
    if (!workspaceTargets[nextView]) return;
    event.preventDefault(); activateWorkspace(nextView);
  }));
  window.addEventListener("hashchange", () => activateWorkspace(workspaceForHash(window.location.hash), { updateHistory: false }));
  $("#workspaceGuideAction").addEventListener("click", (event) => {
    const target = document.querySelector(event.currentTarget.dataset.target);
    target?.scrollIntoView({ behavior: document.documentElement.dataset.motion === "reduced" ? "auto" : "smooth", block: "start" });
  });
}

function bindMotionEnhancements() {
  const hero = document.querySelector(".hero-visual");
  hero?.addEventListener("pointermove", (event) => {
    if (document.documentElement.dataset.motion === "reduced") return;
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    hero.style.setProperty("--tilt-x", `${(-y * 3.2).toFixed(2)}deg`);
    hero.style.setProperty("--tilt-y", `${(x * 4.4).toFixed(2)}deg`);
    hero.style.setProperty("--glow-x", `${((x + .5) * 100).toFixed(1)}%`);
    hero.style.setProperty("--glow-y", `${((y + .5) * 100).toFixed(1)}%`);
  });
  hero?.addEventListener("pointerleave", () => { hero.style.setProperty("--tilt-x", "0deg"); hero.style.setProperty("--tilt-y", "0deg"); });

  document.addEventListener("pointerdown", (event) => {
    const button = event.target.closest("button, .dataset-actions a");
    if (!button || document.documentElement.dataset.motion === "reduced") return;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement("i");
    ripple.className = "button-ripple";
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    button.append(ripple);
    window.setTimeout(() => ripple.remove(), 620);
  });

  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("revealed"); observer.unobserve(entry.target);
  }), { threshold: .12, rootMargin: "0px 0px -35px" });
  document.querySelectorAll(".section-intro, .capability, .proof-grid>div, .team-resource-grid>a, .dataset-console, .architecture-board").forEach((node, index) => {
    node.classList.add("motion-reveal"); node.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 55}ms`); observer.observe(node);
  });
}

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
  const motionTime = document.documentElement.dataset.motion === "reduced" ? 0 : time;
  context.clearRect(0, 0, width, height);
  const center = { x: width * .5, y: height * .51 };
  const points = Array.from({ length: 18 }, (_, index) => {
    const angle = index / 18 * Math.PI * 2 + (index % 3) * .1;
    const ring = index % 4 === 0 ? .18 : index % 3 === 0 ? .33 : .45;
    const drift = document.documentElement.dataset.motion === "reduced" ? 0 : motionTime / 1700;
    return { x: center.x + Math.cos(angle) * width * ring + Math.sin(drift + index * .8) * 4, y: center.y + Math.sin(angle) * height * ring * .72 + Math.cos(drift * .78 + index) * 3, hot: index === 3 || index === 8 || index === 14 };
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
    const pulse = point.hot ? 2 + Math.sin(motionTime / 430 + index) * 1.3 : 0;
    if (point.hot) {
      const halo = context.createRadialGradient(point.x, point.y, 1, point.x, point.y, 24 + pulse * 2);
      halo.addColorStop(0, "rgba(255,102,95,.16)"); halo.addColorStop(1, "rgba(255,102,95,0)");
      context.beginPath(); context.arc(point.x, point.y, 26 + pulse * 2, 0, Math.PI * 2); context.fillStyle = halo; context.fill();
    }
    context.beginPath(); context.arc(point.x, point.y, (point.hot ? 4 : 2.4) + pulse, 0, Math.PI * 2);
    context.fillStyle = point.hot ? "rgba(255,102,95,.85)" : index % 3 === 0 ? "rgba(113,216,223,.75)" : "rgba(158,230,202,.64)"; context.fill();
  });
  const moving = document.documentElement.dataset.motion === "reduced" ? .58 : (motionTime / 3500) % 1;
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
  const motionTime = document.documentElement.dataset.motion === "reduced" ? 0 : time;
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
      const progress = ((motionTime / 1700) + index * .17) % 1;
      context.beginPath(); context.arc(source.x + (target.x - source.x) * progress, source.y + (target.y - source.y) * progress, 1.7, 0, Math.PI * 2);
      context.fillStyle = edge.blocked ? "#71d8df" : "#ff665f"; context.fill();
    }
  });
  nodes.forEach((node) => {
    const hot = node.risk >= 60;
    if (hot) {
      context.beginPath(); context.arc(node.x, node.y, 11 + Math.sin(motionTime / 350 + hash(node.id)) * 2, 0, Math.PI * 2); context.fillStyle = "rgba(255,102,95,.055)"; context.fill();
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

function renderAttackVisual(campaign) {
  const graphClue = campaign.graph_motif.replaceAll("_", " ").toLowerCase();
  $("#attackVisualStatus").textContent = `${campaign.kill_chain.length} observable stages · ${campaign.channels.join(" → ")}`;
  $("#attackAiMove").textContent = campaign.ai_enabler;
  $("#attackGraphClue").textContent = `${graphClue} links events that appear harmless in isolation.`;
  $("#attackDefenseMove").textContent = `${campaign.defenses[0]} interrupts the path; ${campaign.defenses.slice(1).join(" and ").toLowerCase()} contain the remaining network.`;
  $("#attackDiagram").innerHTML = campaign.kill_chain.map((stage, index) => `${index ? `<div class="attack-link" style="--delay:${index * .55}s"><i></i><span>PAYMENT SIGNAL</span></div>` : ""}<article class="attack-stage ${index === campaign.kill_chain.length - 1 ? "attack-stage-terminal" : ""}" style="--delay:${index * .55}s"><div class="attack-node"><span>${String(index + 1).padStart(2, "0")}</span><i></i></div><small>${escapeHtml(stage.phase)}</small><b>${escapeHtml(stage.title)}</b><p>${escapeHtml(stage.observable)}</p></article>`).join("");
  $("#attackSignalMap").innerHTML = Object.entries(campaign.fingerprint).map(([signal, value]) => `<div title="${escapeHtml(signal)} pressure ${value} out of 100"><span><i style="height:${value}%"></i></span><small>${escapeHtml(signal)}<b>${value}</b></small></div>`).join("");
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
  $("#spotlightFamily").textContent = campaign.base_scenario_name ?? campaign.base_family?.replaceAll("_", " ") ?? campaign.base_scenario_id;
  renderAttackVisual(campaign);
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

function renderArchitecture(architecture) {
  const offline = architecture.lanes.find((lane) => lane.id === "OFFLINE_NEARLINE");
  const stores = architecture.lanes.find((lane) => lane.id === "NEARLINE_PROCESSING");
  const realtime = architecture.lanes.find((lane) => lane.id === "REAL_TIME_PATH");
  const feedback = architecture.lanes.find((lane) => lane.id === "FEEDBACK_LOOP");
  $("#architectureOffline").innerHTML = offline.stages.map((stage) => `<article class="architecture-box"><small>${String(stage.number).padStart(2, "0")}</small><span>${escapeHtml(stage.id.split("_").map((word) => word[0]).join("").slice(0, 3))}</span><b>${escapeHtml(stage.label)}</b><p>${escapeHtml(stage.module)}</p><em>${escapeHtml(stage.output)}</em></article>`).join("");
  $("#architectureStores").innerHTML = stores.stages.map((stage) => `<article><span></span><div><small>${escapeHtml(stage.id.replaceAll("_", " "))}</small><b>${escapeHtml(stage.label)}</b></div><em>${escapeHtml(stage.status.status ?? stage.status.registry_mode ?? "READY")}</em></article>`).join("");
  $("#architectureRealtime").innerHTML = realtime.stages.map((stage, index) => `<article class="architecture-box realtime-box"><small>RT${String(index + 1).padStart(2, "0")}</small><span>${escapeHtml(stage.id.split("_").map((word) => word[0]).join("").slice(0, 3))}</span><b>${escapeHtml(stage.label)}</b><p>${escapeHtml(stage.output)}</p><em>DETERMINISTIC</em></article>`).join("");
  $("#architectureFeedback").innerHTML = feedback.stages.map((stage, index) => `<article><small>${String(index + 1).padStart(2, "0")}</small><span></span><b>${escapeHtml(stage)}</b></article>`).join("");
  $("#architectureInfrastructure").innerHTML = architecture.cross_cutting.map((service) => `<article><small>${escapeHtml(service.id.replaceAll("_", " "))}</small><b>${escapeHtml(service.status)}</b></article>`).join("");
  $("#architecturePrinciples").innerHTML = architecture.principles.slice(0, 3).map((principle) => `<span>${escapeHtml(principle)}</span>`).join("");
}

function renderAgentRoster(agents) {
  $("#agentMetric").textContent = agents.length;
  $("#agentRosterLive").innerHTML = agents.map((agent) => `<article class="live-agent ${agent.team.toLowerCase()}" data-agent-id="${escapeHtml(agent.id)}"><span>${escapeHtml(agent.id.slice(0, 2))}</span><div><b>${escapeHtml(agent.name)}</b><small>${escapeHtml(agent.goal)}</small></div><i></i></article>`).join("");
}

function setActiveAgent(agentId = null) {
  document.querySelectorAll(".live-agent").forEach((agent) => agent.classList.toggle("active", agent.dataset.agentId === agentId));
}

function renderMissionEvent(event, index) {
  const agent = state.agentHealth?.agents.find((item) => item.id === event.agent);
  const team = agent?.team?.toLowerCase() ?? "neutral";
  const node = document.createElement("article");
  node.className = `agent-event ${team}`;
  node.innerHTML = `<small>G${String(event.generation).padStart(2, "0")} / ${escapeHtml(event.agent)} / ${escapeHtml(event.state)}</small><div><b>${escapeHtml(event.action)}</b><span>${escapeHtml(event.observation)}</span>${event.candidate_id ? `<em>${escapeHtml(event.candidate_id)}</em>` : ""}</div>`;
  $("#missionConsole").append(node);
  $("#missionConsole").scrollTop = $("#missionConsole").scrollHeight;
  $("#missionClock").textContent = `00:${String(Math.floor(index * 0.09)).padStart(2, "0")}.${String((index * 90) % 1000).padStart(3, "0")}`;
  $("#agentRunState").textContent = `${event.agent.toLowerCase()} · ${event.state.toLowerCase()}`;
  setActiveAgent(event.agent);
}

function renderEvolution(mission) {
  $("#evolutionChart").innerHTML = mission.evolution.map((generation) => `<div class="evo-generation"><div><b>GEN ${String(generation.generation).padStart(2, "0")}</b><span>BEST ${generation.best_reward} · BLUE ${Math.round(generation.blue_strength * 100)}</span></div><div class="evo-bars">${generation.candidates.map((candidate) => `<i class="${candidate.candidate_id === generation.winner ? "winner" : ""}" title="${escapeHtml(candidate.candidate_id)}: fitness ${candidate.fitness.reward}"><b style="width:${candidate.fitness.reward}%"></b></i>`).join("")}</div></div>`).join("");
}

function renderMissionResult(mission) {
  const champion = mission.champion;
  const redWon = mission.summary.winner === "RED_AGENT";
  $("#missionId").textContent = `${mission.mission_id} · SEALED LOCAL RUN`;
  $("#championPressure").style.width = `${champion.aggression * 100}%`;
  $("#championPressureValue").textContent = `${Math.round(champion.aggression * 100)}%`;
  $("#championStealth").style.width = `${champion.stealth * 100}%`;
  $("#championStealthValue").textContent = `${Math.round(champion.stealth * 100)}%`;
  $("#missionWinner").textContent = redWon ? "DEFENSE GAP FOUND" : "BLUE DEFENSE HELD";
  $("#missionWinner").classList.toggle("red", redWon);
  $("#missionSummary").textContent = `${mission.campaign.codename}: ${champion.candidate_id} reached fitness ${champion.fitness.reward}. ${Math.round(champion.fitness.escape_rate * 100)}% of synthetic attack attempts escaped the adapted defense.`;
  $("#missionPolicies").textContent = mission.summary.policies_evaluated;
  $("#missionEvents").textContent = mission.summary.synthetic_events_materialized.toLocaleString();
  $("#missionReward").textContent = champion.fitness.reward;
  $("#missionHandoff").textContent = `${champion.candidate_id} is loaded into the manual arena. The model stayed unchanged; only bounded simulation policy memory evolved.`;
  $("#agentRunState").textContent = "mission sealed";
  renderEvolution(mission);
  renderArena(mission.final_arena);
}

function playMission(mission) {
  window.clearInterval(state.missionTimer);
  $("#missionConsole").innerHTML = "";
  $("#missionClock").textContent = "00:00.000";
  $("#agentRunState").textContent = "agents active";
  let index = 0;
  state.missionTimer = window.setInterval(() => {
    renderMissionEvent(mission.events[index], index);
    index += 1;
    if (index >= mission.events.length) {
      window.clearInterval(state.missionTimer);
      state.missionTimer = null;
      setActiveAgent();
      renderMissionResult(mission);
      $("#runMission").disabled = false;
      $("#runMission").firstChild.textContent = "Launch mission ";
      toast(`${mission.campaign.codename}: local agent mission sealed`);
    }
  }, 90);
}

async function runAgentMission() {
  const button = $("#runMission");
  if (state.missionTimer) window.clearInterval(state.missionTimer);
  button.disabled = true;
  button.firstChild.textContent = "Agents working ";
  $("#agentRunState").textContent = "forking synthetic twins";
  try {
    const payload = {
      objective: $("#agentObjective").value,
      campaignId: $("#agentCampaign").value,
      generations: Number($("#agentGenerations").value),
      volume: Number($("#agentVolume").value),
      seed: 2026,
      aggression: Number($("#aggression").value) / 100,
      stealth: Number($("#stealth").value) / 100,
      defenderStrength: Number($("#defenseStrength").value) / 100,
      graphDefense: $("#graphDefense").checked
    };
    const mission = await api("/api/v1/agents/mission", { method: "POST", body: JSON.stringify(payload) });
    state.mission = mission;
    playMission(mission);
  } catch (error) {
    button.disabled = false;
    button.firstChild.textContent = "Launch mission ";
    $("#agentRunState").textContent = "mission failed safely";
    setActiveAgent();
    toast(error.message);
  }
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
  finally { button.disabled = false; button.firstChild.textContent = "Run simulation "; }
}

function renderThreatDraft(draft) {
  state.threatDraft = draft;
  const candidate = draft.candidate;
  const statusClass = draft.status === "APPROVED" ? "approved" : draft.status === "REJECTED" ? "rejected" : "";
  $("#threatReviewResult").innerHTML = `<div class="draft-head"><div><small>${escapeHtml(draft.scenario_id)} · ${escapeHtml(draft.generated_by)}</small><h3>${escapeHtml(candidate.title)}</h3></div><span class="draft-status ${statusClass}">${escapeHtml(draft.status.replaceAll("_", " "))}</span></div><p class="draft-hypothesis">${escapeHtml(candidate.hypothesis)}</p><div class="draft-scores"><div><small>NOVELTY</small><b>${candidate.novelty_score} / 100</b></div><div><small>DIFFICULTY</small><b>${candidate.difficulty_score} / 100</b></div><div><small>ANCHOR</small><b>${escapeHtml(candidate.base_scenario_id)}</b></div></div><div class="draft-signals">${candidate.observable_signals.map((signal) => `<span>${escapeHtml(signal)}</span>`).join("")}</div><div class="draft-actions"><button class="approve" type="button" data-threat-action="APPROVE" ${draft.status !== "PENDING_REVIEW" ? "disabled" : ""}>Approve for simulation</button><button type="button" data-threat-action="REJECT" ${draft.status !== "PENDING_REVIEW" ? "disabled" : ""}>Reject</button><button class="simulate" type="button" data-threat-action="SIMULATE" ${draft.status !== "APPROVED" ? "disabled" : ""}>Generate synthetic evidence</button></div>`;
}

async function discoverThreat() {
  const button = $("#discoverThreat"); button.disabled = true; button.firstChild.textContent = "Analysing safely ";
  try { const draft = await api("/api/v1/threat-lab/discover", { method: "POST", body: JSON.stringify({ focus: $("#threatFocus").value, base_scenario_id: $("#threatBase").value, payment_surface: $("#threatSurface").value }) }); renderThreatDraft(draft); toast(`${draft.generated_by}: draft awaiting human review`); }
  catch (error) { toast(error.message); }
  finally { button.disabled = false; button.firstChild.textContent = "Generate review draft "; }
}

async function actOnThreat(event) {
  const action = event.target.closest("[data-threat-action]")?.dataset.threatAction;
  if (!action || !state.threatDraft) return;
  try {
    if (action === "SIMULATE") { const dataset = await api(`/api/v1/threat-lab/scenarios/${state.threatDraft.scenario_id}/simulate`, { method: "POST", body: JSON.stringify({ volume: 160, seed: 2026 }) }); toast(`${dataset.rows} approved synthetic events generated with full provenance`); const campaign = state.catalog.find((item) => item.base_scenario_id === state.threatDraft.candidate.base_scenario_id); if (campaign) { $("#scenario").value = campaign.id; $("#agentCampaign").value = campaign.id; } return; }
    const updated = await api(`/api/v1/threat-lab/scenarios/${state.threatDraft.scenario_id}/review`, { method: "POST", body: JSON.stringify({ decision: action, reviewer: "dashboard-operator", notes: "Reviewed in the Mastercard GFF operator console" }) }); renderThreatDraft(updated); toast(action === "APPROVE" ? "Scenario approved; simulation is now unlocked" : "Scenario rejected and sealed");
  } catch (error) { toast(error.message); }
}

function populateModelForm(features) {
  $("#modelVelocity").value = features.velocity_1h;
  $("#modelDeviation").value = features.amount_deviation;
  $("#modelShared").value = features.shared_device_count;
  $("#modelRelationship").value = features.merchant_risk;
  $("#modelNewDevice").checked = Boolean(features.new_device);
  $("#modelLocation").checked = Boolean(features.location_shift);
}

async function scoreHeroPreset(name) {
  const preset = heroPresets[name] || heroPresets.normal;
  state.heroPreset = name;
  document.querySelectorAll("[data-hero-preset]").forEach((button) => button.classList.toggle("active", button.dataset.heroPreset === name));
  $("#heroMerchant").textContent = preset.merchant;
  $("#heroMerchantGlyph").textContent = preset.glyph;
  $("#heroChannel").textContent = preset.channel;
  $("#heroAmount").textContent = preset.amount;
  $("#heroReasons").innerHTML = preset.reasons.map((reason) => `<span>${escapeHtml(reason)}</span>`).join("");
  $("#heroReceiptPulse").classList.add("scoring");
  $("#heroDecision").className = "";
  $("#heroDecision").textContent = "SCORING";
  try {
    const result = await api("/api/v1/model/challenger/predict", { method: "POST", body: JSON.stringify({ features: preset.features }) });
    const level = result.prediction.startsWith("HIGH") ? "high" : result.prediction.startsWith("MEDIUM") ? "medium" : "low";
    $("#heroDecision").className = level;
    $("#heroDecision").textContent = result.prediction.replaceAll("_", " ");
    $("#heroProbability").textContent = `${(result.fraud_probability * 100).toFixed(1)}%`;
    $("#heroRiskScore").textContent = `${result.risk_score} / 100`;
    $("#heroRiskFill").style.width = `${Math.max(4, result.risk_score)}%`;
    $("#heroRiskFill").style.background = level === "high" ? "linear-gradient(90deg,#ff9a62,#ff5964)" : level === "medium" ? "linear-gradient(90deg,#ffd36b,#ff9a5a)" : "linear-gradient(90deg,#61e6c5,#38c9e9)";
    $("#auralisCard").className = `auralis-card risk-${level}`;
    $("#heroModelVersion").textContent = `${result.model_version.toUpperCase()} · ${result.latency_ms} MS`;
  } catch (error) {
    $("#heroDecision").textContent = "SAFE FALLBACK";
    $("#heroProbability").textContent = "Unavailable";
    $("#heroModelVersion").textContent = "MODEL ENDPOINT UNAVAILABLE";
  } finally { $("#heroReceiptPulse").classList.remove("scoring"); }
}

function inspectHeroPayment() {
  populateModelForm(heroPresets[state.heroPreset].features);
  activateWorkspace("simulation");
  window.setTimeout(() => $("#modelInputForm").requestSubmit(), 320);
}

async function classifyWithTeamModel(event) {
  event.preventDefault();
  const features = { velocity_1h: Number($("#modelVelocity").value), amount_deviation: Number($("#modelDeviation").value), new_device: Number($("#modelNewDevice").checked), shared_device_count: Number($("#modelShared").value), location_shift: Number($("#modelLocation").checked), new_payee: 0, card_not_present: 1, unusual_hour: 0, new_account: 0, identity_mismatch: 0, merchant_risk: Number($("#modelRelationship").value) };
  const output = $("#modelResult"); output.innerHTML = "<small>MODEL OUTPUT</small><strong>SCORING…</strong><span>Sending the canonical 11-feature vector.</span>";
  try { const result = await api("/api/v1/model/challenger/predict", { method: "POST", body: JSON.stringify({ features }) }); const level = result.prediction.startsWith("HIGH") ? "high" : result.prediction.startsWith("MEDIUM") ? "medium" : "low"; output.innerHTML = `<small>MODEL OUTPUT · ${escapeHtml(result.provider)}</small><strong class="${level}">${escapeHtml(result.prediction.replaceAll("_", " "))}</strong><span>${Math.round(result.fraud_probability * 1000) / 10}% fraud probability · risk ${result.risk_score}/100</span><b>${escapeHtml(result.model_version)} · ${result.latency_ms} ms</b>`; }
  catch (error) { output.innerHTML = `<small>MODEL OUTPUT</small><strong>UNAVAILABLE</strong><span>${escapeHtml(error.message)}. The locked local artifact could not be loaded, so no model claim is shown.</span>`; }
}

function metricPercent(value, digits = 1) {
  return `${(Number(value) * 100).toFixed(digits)}%`;
}

function renderEvaluationScorecard(scorecard) {
  state.scorecard = scorecard;
  const champion = scorecard.comparisons.find((item) => item.id === "XGBOOST_CHAMPION");
  const baseline = scorecard.comparisons.find((item) => item.id === "LINEAR_BASELINE");
  const holdout = scorecard.comparisons.find((item) => item.id === "EXCLUDED_FAMILY");
  const f1Lift = scorecard.lift_vs_linear.f1 * 100;
  const recallLift = scorecard.lift_vs_linear.recall * 100;
  $("#evidenceHeadline").textContent = `XGBoost gains ${f1Lift.toFixed(2)} F1 points and ${recallLift.toFixed(2)} recall points.`;
  $("#evidenceSummary").textContent = `The false-positive rate moves from ${metricPercent(baseline.metrics.false_positive_rate, 2)} to ${metricPercent(champion.metrics.false_positive_rate, 2)}. ${holdout.scope} retains ${metricPercent(holdout.metrics.recall)} recall.`;
  $("#modelComparison").innerHTML = scorecard.comparisons.map((item) => {
    const className = item.id === "XGBOOST_CHAMPION" ? " champion" : item.id === "EXCLUDED_FAMILY" ? " holdout" : "";
    return `<article class="model-proof-card${className}"><div><small>${escapeHtml(item.scope)}</small><span>${item.id === "XGBOOST_CHAMPION" ? "ACTIVE" : item.id === "EXCLUDED_FAMILY" ? "UNSEEN" : "BASELINE"}</span></div><h3>${escapeHtml(item.label)}</h3><p>${escapeHtml(item.model_version)}</p><dl><div><dt>Recall</dt><dd>${metricPercent(item.metrics.recall)}</dd></div><div><dt>F1</dt><dd>${metricPercent(item.metrics.f1)}</dd></div><div><dt>Precision</dt><dd>${metricPercent(item.metrics.precision)}</dd></div><div><dt>False positive</dt><dd>${metricPercent(item.metrics.false_positive_rate, 2)}</dd></div></dl></article>`;
  }).join("");
  const matrix = champion.metrics.confusion_matrix;
  $("#confusionMatrix").innerHTML = `<div class="matrix-axis matrix-predicted">PREDICTED</div><div class="matrix-axis matrix-actual">ACTUAL</div><article class="matrix-good"><small>TRUE NEGATIVE</small><strong>${matrix.tn.toLocaleString()}</strong><span>safe payments cleared</span></article><article class="matrix-warn"><small>FALSE POSITIVE</small><strong>${matrix.fp.toLocaleString()}</strong><span>safe payments interrupted</span></article><article class="matrix-bad"><small>FALSE NEGATIVE</small><strong>${matrix.fn.toLocaleString()}</strong><span>fraud attempts missed</span></article><article class="matrix-good"><small>TRUE POSITIVE</small><strong>${matrix.tp.toLocaleString()}</strong><span>fraud attempts detected</span></article>`;
  $("#evidenceGates").innerHTML = scorecard.evidence_gates.map((gate) => `<article class="evidence-gate ${gate.status === "VERIFIED" ? "verified" : "open-gap"}"><i></i><div><b>${escapeHtml(gate.label)}</b><span>${escapeHtml(gate.evidence)}</span></div><small>${gate.status === "VERIFIED" ? "VERIFIED" : "OPEN GAP"}</small></article>`).join("");
  $("#coverageList").innerHTML = scorecard.attack_coverage.map((item) => `<article class="coverage-item ${item.evaluation_role.toLowerCase().replaceAll("_", "-")}"><div><small>${escapeHtml(item.scenario_id)}</small><b>${escapeHtml(item.name)}</b></div><span>${escapeHtml(item.family.replaceAll("_", " "))}</span><em>${escapeHtml(item.evaluation_role.replaceAll("_", " "))}</em></article>`).join("");
}

async function runHoldoutProof() {
  const button = $("#runHoldoutProof");
  const output = $("#holdoutResult");
  button.disabled = true;
  output.className = "holdout-result running";
  output.innerHTML = "<small>LIVE PROOF STATUS</small><strong>SCORING 600 EVENTS...</strong><span>The active artifact remains locked while the synthetic holdout is replayed.</span>";
  try {
    const result = await api("/api/v1/evaluate/holdout", { method: "POST", body: JSON.stringify({ volume: 600, seed: 104729, fraudRate: .25 }) });
    const metrics = result.ensemble.metrics;
    output.className = "holdout-result complete";
    output.innerHTML = `<small>LIVE PROOF COMPLETE · ${escapeHtml(result.scenario_id)}</small><strong>${metricPercent(metrics.recall)} RECALL · ${metricPercent(metrics.f1)} F1</strong><span>${result.ensemble.confusion_matrix.tp} detected · ${result.ensemble.confusion_matrix.fn} missed · ${metricPercent(metrics.false_positive_rate, 2)} false-positive rate · model unchanged</span>`;
  } catch (error) {
    output.className = "holdout-result failed";
    output.innerHTML = `<small>LIVE PROOF STATUS</small><strong>UNAVAILABLE</strong><span>${escapeHtml(error.message)}</span>`;
  } finally { button.disabled = false; }
}

async function initialize() {
  const [catalog, attacks, health, scorecard, agentHealth, threatHealth] = await Promise.all([
    api("/api/v1/campaign/catalog"), api("/api/v1/attack/catalog"), api("/api/v1/model/health"), api("/api/v1/evaluation/scorecard"), api("/api/v1/agents/health"), api("/api/v1/threat-lab/health")
  ]);
  state.catalog = catalog; state.attacks = attacks; state.health = health; state.agentHealth = agentHealth; state.threatHealth = threatHealth;
  $("#scenario").innerHTML = catalog.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.codename)} · ${escapeHtml(item.name)}</option>`).join("");
  $("#scenario").value = catalog[0].id;
  $("#agentCampaign").innerHTML = catalog.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.codename)} · ${escapeHtml(item.name)}</option>`).join("");
  $("#agentCampaign").value = catalog[0].id;
  $("#agentObjective").innerHTML = agentHealth.objectives.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join("");
  $("#threatBase").innerHTML = attacks.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.id)} · ${escapeHtml(item.name)}</option>`).join("");
  $("#threatProvider").textContent = threatHealth.configured ? `${threatHealth.provider} · ${threatHealth.model}` : "SAFE FALLBACK · ADD GROQ_API_KEY FOR HOSTED GENAI";
  $("#teamModelState").textContent = `${health.model_type.toUpperCase()} · ${health.test_metrics.f1.toFixed(3)} TEST F1 · 210K ROWS`;
  renderAgentRoster(agentHealth.agents);
  renderCampaignAtlas(catalog);
  renderCampaignPreview(catalog[0]);
  renderEvaluationScorecard(scorecard);
  $("#modelMetric").textContent = health.status;
  $("#modelVersion").textContent = health.model_version.slice(0, 20).toUpperCase();
  $("#heroModelVersion").textContent = `${health.model_version.toUpperCase()} · READY`;
  const [fidelityResult, evidenceResult, coverageResult, architectureResult] = await Promise.allSettled([
    api("/api/v1/fidelity/report"), api("/api/v1/data/evidence"), api("/api/v1/challenge/coverage"), api("/api/v1/architecture")
  ]);
  if (fidelityResult.status === "fulfilled") {
    $("#fidelityMetric").textContent = `${fidelityResult.value.passed} / ${fidelityResult.value.checks.length}`;
  }
  if (evidenceResult.status === "fulfilled") {
    const statuses = new Map(evidenceResult.value.layers.map((item) => [item.id, item.status]));
    if (statuses.get("public") !== "REFERENCE_ONLY") toast("Evidence manifest changed; review provenance labels.");
  }
  if (coverageResult.status === "fulfilled") renderCoverage(coverageResult.value);
  if (architectureResult.status === "fulfilled") renderArchitecture(architectureResult.value);
  await scoreHeroPreset("normal");
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
    if (campaign) { $("#agentCampaign").value = campaign.id; renderCampaignPreview(campaign); renderSpotlight(campaign); }
  });
  [["#agentGenerations", "#agentGenerationsValue"], ["#agentVolume", "#agentVolumeValue"]].forEach(([input, output]) => {
    $(input).addEventListener("input", () => { $(output).textContent = $(input).value; });
  });
  $("#agentCampaign").addEventListener("change", () => {
    const campaign = state.catalog.find((item) => item.id === $("#agentCampaign").value);
    if (campaign) { $("#scenario").value = campaign.id; renderCampaignPreview(campaign); renderSpotlight(campaign); }
  });
  $("#campaignCards").addEventListener("click", (event) => {
    const card = event.target.closest(".campaign-card");
    if (!card) return;
    const campaign = state.catalog.find((item) => item.id === card.dataset.campaignId);
    if (campaign) { $("#scenario").value = campaign.id; $("#agentCampaign").value = campaign.id; renderSpotlight(campaign); renderCampaignPreview(campaign); }
  });
  $("#launchSpotlight").addEventListener("click", () => { activateWorkspace("simulation"); window.setTimeout(runArena, 350); });
  $("#runMission").addEventListener("click", runAgentMission);
  $("#discoverThreat").addEventListener("click", discoverThreat);
  $("#threatReviewResult").addEventListener("click", actOnThreat);
  $("#modelInputForm").addEventListener("submit", classifyWithTeamModel);
  $("#runHoldoutProof").addEventListener("click", runHoldoutProof);
  document.querySelectorAll("[data-hero-preset]").forEach((button) => button.addEventListener("click", () => scoreHeroPreset(button.dataset.heroPreset)));
  $("#heroInspect").addEventListener("click", inspectHeroPayment);
  $("#runArena").addEventListener("click", runArena);
  ["#heroRun", "#bottomRun"].forEach((selector) => $(selector).addEventListener("click", () => { activateWorkspace("missions"); window.setTimeout(runAgentMission, 350); }));
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

bindWorkspaceControls();
bindControls();
bindMotionEnhancements();
requestAnimationFrame(drawHero);
requestAnimationFrame(drawGraph);
initialize().catch((error) => toast(error.message));
