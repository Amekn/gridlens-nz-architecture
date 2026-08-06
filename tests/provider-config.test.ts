import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  resolveProviderConfig,
  validateConfiguredHostAddresses,
} from "../src/server/index";
import type { Env } from "../src/server/index";

const validEnv = (): Env => ({
  GRIDLENS_MODEL_ENDPOINT: "https://model.gridlens.nz/v1",
  GRIDLENS_MODEL_API_KEY: "unit-model-canary",
  GRIDLENS_MODEL_ID: "unit-model-id",
  GRIDLENS_TAVILY_API_KEY: "unit-tavily-canary",
  GRIDLENS_LOCAL_SMOKE_TOKEN: "unit-smoke-canary",
});

describe("provider configuration policy", () => {
  it("accepts the demo OpenAI-compatible base path and fixed Tavily origin", () => {
    const resolved = resolveProviderConfig(validEnv());

    assert.equal(resolved.model.reason, "configured");
    assert.equal(resolved.model.config?.chatUrl, "https://model.gridlens.nz/v1/chat/completions");
    assert.equal(resolved.model.config?.modelsUrl, "https://model.gridlens.nz/v1/models");
    assert.equal(resolved.tavily?.reason, "configured");
    assert.equal(resolved.tavily?.config?.searchUrl, "https://api.tavily.com/search");
  });

  it("rejects unsafe or ambiguous model destinations", () => {
    const rejected = [
      "http://model.gridlens.nz/v1",
      "https://user@model.gridlens.nz/v1",
      "https://model.gridlens.nz:8443/v1",
      "https://127.0.0.1/v1",
      "https://[::1]/v1",
      "https://localhost/v1",
      "https://%6dodel.gridlens.nz/v1",
      "https://model.gridlens.nz/v1/../admin",
      "https://model.gridlens.nz/v1?destination=elsewhere",
      "https://model.gridlens.nz/v1#fragment",
    ];

    for (const endpoint of rejected) {
      const env = validEnv();
      env.GRIDLENS_MODEL_ENDPOINT = endpoint;
      const resolved = resolveProviderConfig(env);
      assert.equal(resolved.model.config, undefined, endpoint);
      assert.equal(resolved.model.reason, "policy_rejected", endpoint);
    }
  });

  it("rejects deployment DNS if any approved hostname resolves non-publicly", async () => {
    const resolved = resolveProviderConfig(validEnv());
    const ok = await validateConfiguredHostAddresses(resolved, async (hostname) =>
      hostname === "model.gridlens.nz" ? ["203.0.113.20", "10.1.2.3"] : ["203.0.113.21"],
    );

    assert.equal(ok, false);
  });
});
