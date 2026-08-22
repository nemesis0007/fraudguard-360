import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = fileURLToPath(new URL("../public", import.meta.url));
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };

function sendJson(response, status, payload, requestId) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "x-request-id": requestId });
  response.end(JSON.stringify({ request_id: requestId, status: status < 400 ? "success" : "error", data: status < 400 ? payload : null, error: status < 400 ? null : payload }));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error("PAYLOAD_TOO_LARGE");
  }
  try { return body ? JSON.parse(body) : {}; } catch { throw new Error("INVALID_JSON"); }
}

function required(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
  if (missing.length) throw new Error(`MISSING_FIELDS:${missing.join(",")}`);
}

function staticFile(pathname, response) {
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const file = normalize(join(publicDir, relative));
  if (!file.startsWith(publicDir) || !existsSync(file) || !statSync(file).isFile()) return false;
  response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(response);
  return true;
}

export function createHandler(platform) {
  return async (request, response) => {
    const requestId = request.headers["x-request-id"] ?? crypto.randomUUID();
    const url = new URL(request.url, "http://localhost");
    try {
      if (request.method === "GET" && url.pathname === "/health") return sendJson(response, 200, { service: "fraudguard-360", healthy: true, model_version: platform.risk.modelVersion }, requestId);
      if (request.method === "GET" && url.pathname === "/api/v1/model/health") return sendJson(response, 200, platform.risk.modelHealth(), requestId);
      if (request.method === "GET" && url.pathname === "/api/v1/fidelity/report") return sendJson(response, 200, platform.fidelityReport(), requestId);
      if (request.method === "GET" && url.pathname === "/api/v1/data/evidence") return sendJson(response, 200, platform.evidenceStack(), requestId);
      if (request.method === "GET" && url.pathname === "/api/v1/architecture") return sendJson(response, 200, platform.architectureStatus(), requestId);
      if (request.method === "GET" && url.pathname === "/api/v1/audit/recent") return sendJson(response, 200, platform.recentAudit(Number(url.searchParams.get("limit")) || 20), requestId);
      if (request.method === "GET" && url.pathname === "/api/v1/attack/catalog") return sendJson(response, 200, platform.catalog(), requestId);
      if (request.method === "GET" && url.pathname === "/api/v1/campaign/catalog") return sendJson(response, 200, platform.campaigns(), requestId);
      if (request.method === "GET" && url.pathname === "/api/v1/challenge/coverage") return sendJson(response, 200, platform.challengeCoverage(), requestId);
      if (request.method === "GET" && url.pathname === "/api/v1/agents/health") return sendJson(response, 200, platform.agentHealth(), requestId);
      if (request.method === "GET" && url.pathname === "/api/v1/metrics/summary") return sendJson(response, 200, platform.summary(), requestId);
      if (request.method === "POST" && url.pathname === "/api/v1/simulate") {
        const body = await readJson(request); required(body, ["scenarioId"]);
        return sendJson(response, 200, platform.simulate(body), requestId);
      }
      if (request.method === "POST" && url.pathname === "/api/v1/score") {
        const body = await readJson(request);
        required(body, ["transaction_id", "customer_id", "merchant_id", "device_id", "amount", "timestamp"]);
        if (Number(body.amount) < 0) throw new Error("INVALID_AMOUNT");
        return sendJson(response, 200, platform.score(body, { modelAvailable: body.model_available !== false }), requestId);
      }
      if (request.method === "POST" && url.pathname === "/api/v1/payments/simulate") {
        const body = await readJson(request);
        required(body, ["transaction_id", "customer_id", "merchant_id", "device_id", "amount", "timestamp"]);
        return sendJson(response, 200, platform.authorizeInSimulator(body, { modelAvailable: body.model_available !== false }), requestId);
      }
      if (request.method === "POST" && url.pathname === "/api/v1/evaluate") {
        const body = await readJson(request); required(body, ["scenarioId"]);
        return sendJson(response, 200, platform.evaluate(body), requestId);
      }
      if (request.method === "POST" && url.pathname === "/api/v1/evaluate/holdout") {
        const body = await readJson(request);
        return sendJson(response, 200, platform.evaluateHoldout(body), requestId);
      }
      if (request.method === "POST" && url.pathname === "/api/v1/arena/run") {
        const body = await readJson(request);
        return sendJson(response, 200, platform.runArena(body), requestId);
      }
      if (request.method === "POST" && url.pathname === "/api/v1/agents/mission") {
        const body = await readJson(request);
        return sendJson(response, 200, platform.runAgentMission(body), requestId);
      }
      if (request.method === "POST" && url.pathname === "/api/v1/learn/mutate") {
        const body = await readJson(request);
        return sendJson(response, 200, platform.learnFromMisses(body), requestId);
      }
      if (request.method === "POST" && url.pathname === "/api/v1/feedback") {
        const body = await readJson(request); required(body, ["transaction_id", "predicted", "actual"]);
        return sendJson(response, 201, platform.addFeedback(body), requestId);
      }
      if (request.method === "GET" && staticFile(url.pathname, response)) return;
      return sendJson(response, 404, { code: "NOT_FOUND", message: "Route not found" }, requestId);
    } catch (error) {
      const code = String(error.message).split(":")[0];
      const status = code === "PAYLOAD_TOO_LARGE" ? 413 : code === "UNKNOWN_SCENARIO" ? 404 : 400;
      return sendJson(response, status, { code, message: error.message }, requestId);
    }
  };
}
