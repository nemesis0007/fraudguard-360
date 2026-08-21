import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { createHandler } from "./http.js";
import { FraudGuardPlatform } from "./platform.js";

export function buildServer() {
  const platform = new FraudGuardPlatform();
  return { server: createServer(createHandler(platform)), platform };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 8080);
  const { server } = buildServer();
  server.listen(port, "0.0.0.0", () => console.log(`FraudGuard 360 running at http://localhost:${port}`));
}

