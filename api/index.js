import { createHandler } from "../src/http.js";
import { FraudGuardPlatform } from "../src/platform.js";

const platform = new FraudGuardPlatform();
const handler = createHandler(platform);

export default async function fraudGuardApi(request, response) {
  return handler(request, response);
}
