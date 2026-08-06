import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  fingerprintPromptContext,
  handleProviderRequest,
} from "../src/server/index";
import type { Env, PromptContextInput } from "../src/server/index";

const requestId = "018f08cb-3bb8-7cc2-8000-000000000001";

const env = (): Env => ({
  GRIDLENS_MODEL_ENDPOINT: "https://model.gridlens.nz/v1",
  GRIDLENS_MODEL_API_KEY: "unit-model-canary",
  GRIDLENS_MODEL_ID: "unit-model-id",
  GRIDLENS_TAVILY_API_KEY: "unit-tavily-canary",
  GRIDLENS_LOCAL_SMOKE_TOKEN: "unit-smoke-canary",
});

const jsonPost = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`https://private.gridlens.nz${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://private.gridlens.nz",
      "sec-fetch-site": "same-origin",
      ...headers,
    },
    body: JSON.stringify(body),
  });

const baseContext = (): PromptContextInput => ({
  schemaVersion: "gridlens.prompt-context.v3",
  scenario: {
    scenarioId: "current-demo",
    name: "Southland 50 MW fixture",
    itCapacityMw: 50,
    pue: 1.3,
    utilizationRatio: 0.8,
    concurrencyRatio: 0.3,
  },
  calculations: {
    addedPeakMw: 65,
    annualEnergyGwh: 455.52,
    concurrentDemandMw: 19.5,
    maximumFlexibleLoadMw: 19.5,
    formulaVersion: "gridlens-demo-1.0.0",
  },
  selection: {
    kind: "selected_region",
    regionId: "15",
    source: "accessible_list",
    geometryEdition: "Stats NZ Regional Council 2023",
    selectedAt: "2026-08-07T00:00:00.000Z",
  },
  trustedEvidenceIds: ["evidence:transpower-demand"],
});

async function agentBody(includeWebResearch = true) {
  const context = baseContext();
  return {
    schemaVersion: "gridlens.agent-request.v3",
    requestId,
    mode: "analysis",
    prompt: "Explain the deterministic scenario and important uncertainty.",
    context: {
      ...context,
      contextFingerprint: await fingerprintPromptContext(context),
    },
    includeWebResearch,
  };
}

function upstreamFetch(options: { leak?: string; reasoningOnly?: boolean; uncitedSource?: boolean } = {}) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    calls.push({ url, init });
    if (url === "https://api.tavily.com/search") {
      return Response.json({
        results: [
          {
            title: "Electricity Authority overview",
            url: "https://www.ea.govt.nz/industry/overview",
            content: "Public candidate excerpt.",
          },
        ],
      });
    }
    if (options.reasoningOnly) {
      return Response.json({ choices: [{ message: { reasoning_content: "private" } }] });
    }
    return Response.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              claims: [
                {
                  claimId: "claim:scenario-summary",
                  kind: options.uncitedSource ? "source_statement" : "model_inference",
                  text: options.leak ?? "Peak demand follows the deterministic inputs.",
                  citationIds: [],
                },
              ],
            }),
          },
        },
      ],
    });
  };
  return { calls, fetcher };
}

describe("closed provider routes", () => {
  it("returns sanitized health without exposing configuration", async () => {
    const response = await handleProviderRequest(
      new Request("https://private.gridlens.nz/api/v1/providers/health"),
      env(),
    );
    assert.ok(response);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    const body = JSON.stringify(await response.json());
    assert.match(body, /gridlens\.provider-health\.v3/);
    assert.equal(body.includes("unit-model-canary"), false);
    assert.equal(body.includes("model.gridlens.nz"), false);
  });

  it("runs one Tavily attempt and one model attempt inside the agent operation", async () => {
    const upstream = upstreamFetch();
    const response = await handleProviderRequest(
      jsonPost("/api/v1/agent", await agentBody()),
      env(),
      { fetch: upstream.fetcher },
    );
    assert.ok(response);
    assert.equal(response.status, 200);
    assert.deepEqual(
      upstream.calls.map((call) => call.url),
      ["https://api.tavily.com/search", "https://model.gridlens.nz/v1/chat/completions"],
    );
    assert.equal(upstream.calls.every((call) => call.init?.redirect === "manual"), true);
    const modelBody = String(upstream.calls[1].init?.body);
    assert.equal(modelBody.includes("Public candidate excerpt."), true);
    const body = await response.json() as { partial: boolean; claims: unknown[]; citations: unknown[] };
    assert.equal(body.partial, false);
    assert.equal(body.claims.length, 1);
    assert.equal(body.citations.length, 0);
  });

  it("rejects forged browser research and cross-origin POSTs before fetch", async () => {
    const upstream = upstreamFetch();
    const forged = { ...(await agentBody()), research: [{ url: "https://attacker.invalid" }] };
    const forgedResponse = await handleProviderRequest(
      jsonPost("/api/v1/agent", forged),
      env(),
      { fetch: upstream.fetcher },
    );
    assert.equal(forgedResponse?.status, 400);

    const crossOrigin = jsonPost("/api/v1/agent", await agentBody(), {
      origin: "https://elsewhere.gridlens.nz",
      "sec-fetch-site": "same-site",
    });
    const originResponse = await handleProviderRequest(crossOrigin, env(), {
      fetch: upstream.fetcher,
    });
    assert.equal(originResponse?.status, 400);
    assert.equal(upstream.calls.length, 0);
  });

  it("accepts a headerless smoke request only with the server token", async () => {
    const upstream = upstreamFetch();
    const request = new Request("https://private.gridlens.nz/api/v1/research", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-gridlens-local-smoke-token": "unit-smoke-canary",
      },
      body: JSON.stringify({
        schemaVersion: "gridlens.research-request.v3",
        requestId,
        query: "Southland electricity constraints",
        regionId: "15",
        scenarioId: "current-demo",
      }),
    });
    const response = await handleProviderRequest(request, env(), { fetch: upstream.fetcher });
    assert.equal(response?.status, 200);
    assert.equal(upstream.calls.length, 1);
  });

  it("does not retry reasoning-only model output", async () => {
    const upstream = upstreamFetch({ reasoningOnly: true });
    const response = await handleProviderRequest(
      jsonPost("/api/v1/agent", await agentBody(false)),
      env(),
      { fetch: upstream.fetcher },
    );
    assert.equal(response?.status, 502);
    assert.equal(upstream.calls.length, 1);
  });

  it("downgrades an uncited source statement to inference without fabricating citations", async () => {
    const upstream = upstreamFetch({ uncitedSource: true });
    const response = await handleProviderRequest(
      jsonPost("/api/v1/agent", await agentBody(false)),
      env(),
      { fetch: upstream.fetcher },
    );
    assert.equal(response?.status, 200);
    const body = await response!.json() as { claims: Array<{ kind: string; citationIds: string[] }> };
    assert.equal(body.claims[0]?.kind, "model_inference");
    assert.deepEqual(body.claims[0]?.citationIds, []);
    assert.equal(upstream.calls.length, 1);
  });

  it("falls back to a deterministic visualization when the model omits a visual payload", async () => {
    const upstream = upstreamFetch();
    const body = await agentBody(false);
    body.mode = "visual";
    const response = await handleProviderRequest(
      jsonPost("/api/v1/agent", body),
      env(),
      { fetch: upstream.fetcher },
    );
    assert.equal(response?.status, 200);
    const result = await response!.json() as { payload: { kind: string; sourceRecordIds: string[] } };
    assert.equal(result.payload.kind, "bar_chart");
    assert.deepEqual(result.payload.sourceRecordIds, ["evidence:transpower-demand"]);
  });

  it("rejects the whole response when an active secret reaches an output leaf", async () => {
    const upstream = upstreamFetch({ leak: "unit-model-canary" });
    const response = await handleProviderRequest(
      jsonPost("/api/v1/agent", await agentBody(false)),
      env(),
      { fetch: upstream.fetcher },
    );
    assert.equal(response?.status, 502);
    const body = await response!.text();
    assert.equal(body.includes("unit-model-canary"), false);
    assert.match(body, /invalid_upstream_response/);
  });

  it("rejects duplicate JSON keys before dispatch", async () => {
    const upstream = upstreamFetch();
    const duplicate = `{"schemaVersion":"gridlens.research-request.v3","requestId":"${requestId}","query":"one","query":"two","regionId":"15","scenarioId":"current-demo"}`;
    const request = new Request("https://private.gridlens.nz/api/v1/research", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://private.gridlens.nz",
        "sec-fetch-site": "same-origin",
      },
      body: duplicate,
    });
    const response = await handleProviderRequest(request, env(), { fetch: upstream.fetcher });
    assert.equal(response?.status, 400);
    assert.equal(upstream.calls.length, 0);
  });
});
