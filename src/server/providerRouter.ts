import { runModelAnalysis, runTavilySearch, ProviderFailure } from "./providerClients";
import { resolveProviderConfig } from "./providerConfig";
import { readBoundedJson, StrictJsonError } from "./providerJson";
import { browserPostIsAuthorized, isSafePublicEgress } from "./providerSecurity";
import { validateAgentRequest, validateResearchRequest } from "./providerValidation";
import type {
  AgentResponse,
  Env,
  ProviderHealthEntry,
  ProviderHealthResponse,
  ProviderRouterOptions,
  PublicApiError,
  PublicErrorCode,
  ResearchCandidate,
  ResearchResponse,
  ResolvedProviderConfig,
} from "./providerTypes";

const ROUTES = new Set(["/api/v1/providers/health", "/api/v1/research", "/api/v1/agent"]);
const MAX_IN_FLIGHT = 4;
let inFlight = 0;

function uuidV7(now: Date): string {
  const time = BigInt(now.getTime());
  const random = crypto.getRandomValues(new Uint8Array(10));
  const timeHex = time.toString(16).padStart(12, "0").slice(-12);
  const randomHex = [...random].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const variant = ((random[2] & 0x3f) | 0x80).toString(16).padStart(2, "0");
  return `${timeHex.slice(0, 8)}-${timeHex.slice(8)}-7${randomHex.slice(0, 3)}-${variant}${randomHex.slice(5, 7)}-${randomHex.slice(7, 19).padEnd(12, "0")}`;
}

const SAFE_MESSAGES: Record<PublicErrorCode, string> = {
  invalid_request: "The request was not accepted.",
  payload_too_large: "The request exceeds the allowed size.",
  provider_unavailable: "Analysis is currently unavailable.",
  research_unavailable: "Web research is currently unavailable.",
  rate_limited: "Provider capacity is currently busy.",
  upstream_timeout: "The provider did not respond in time.",
  upstream_rejected: "The provider rejected the operation.",
  invalid_upstream_response: "The provider returned an unusable response.",
  cancelled: "The operation was cancelled.",
  internal_error: "The operation could not be completed.",
};

const ERROR_STATUS: Record<PublicErrorCode, number> = {
  invalid_request: 400,
  payload_too_large: 413,
  provider_unavailable: 503,
  research_unavailable: 503,
  rate_limited: 429,
  upstream_timeout: 504,
  upstream_rejected: 502,
  invalid_upstream_response: 502,
  cancelled: 499,
  internal_error: 500,
};

function errorValue(code: PublicErrorCode, now: () => Date, retryable?: boolean): PublicApiError {
  return {
    schemaVersion: "gridlens.public-error.v3",
    error: {
      code,
      message: SAFE_MESSAGES[code],
      retryable: retryable ?? ["provider_unavailable", "research_unavailable", "rate_limited", "upstream_timeout"].includes(code),
      correlationId: uuidV7(now()),
    },
  };
}

function responseHeaders(health = false): Headers {
  return new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": health ? "private, max-age=60" : "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
  });
}

function jsonResponse(
  value: unknown,
  status: number,
  config: ResolvedProviderConfig,
  now: () => Date,
  health = false,
): Response {
  let body = JSON.stringify(value);
  if (!isSafePublicEgress(value, body, config)) {
    const safe = errorValue("invalid_upstream_response", now, false);
    body = JSON.stringify(safe);
    return new Response(body, { status: 502, headers: responseHeaders() });
  }
  return new Response(body, { status, headers: responseHeaders(health) });
}

function errorResponse(
  code: PublicErrorCode,
  config: ResolvedProviderConfig,
  now: () => Date,
  retryable?: boolean,
): Response {
  return jsonResponse(errorValue(code, now, retryable), ERROR_STATUS[code], config, now);
}

function healthEntry(
  providerClass: ProviderHealthEntry["providerClass"],
  reason: ProviderHealthEntry["reason"],
  capabilities: ProviderHealthEntry["capabilities"],
): ProviderHealthEntry {
  return {
    providerClass,
    state: reason === "configured" ? "ready" : "unavailable",
    reason,
    capabilities,
  };
}

function healthResponse(config: ResolvedProviderConfig, now: () => Date): ProviderHealthResponse {
  const providers: ProviderHealthEntry[] = [healthEntry("openai_compatible", config.model.reason, ["analysis"])];
  if (config.tavily) providers.push(healthEntry("tavily", config.tavily.reason, ["web_research", "web_search"]));
  if (config.mcp) providers.push(healthEntry("remote_mcp", config.mcp.reason, ["web_research", "web_search"]));
  const model = providers[0];
  const overall = model.state === "unavailable"
    ? "unavailable"
    : providers.slice(1).some((provider) => provider.state !== "ready")
      ? "limited"
      : "ready";
  return {
    schemaVersion: "gridlens.provider-health.v3",
    overall,
    providers,
    checkedAt: now().toISOString(),
    cacheSeconds: 60,
  };
}

function acquire(): boolean {
  if (inFlight >= MAX_IN_FLIGHT) return false;
  inFlight += 1;
  return true;
}

function release(): void {
  inFlight = Math.max(0, inFlight - 1);
}

function internalCandidatesAreSafe(candidates: ResearchCandidate[], config: ResolvedProviderConfig): boolean {
  return isSafePublicEgress(candidates, JSON.stringify(candidates), config);
}

async function parsePost(
  request: Request,
  limit: number,
  config: ResolvedProviderConfig,
  now: () => Date,
): Promise<unknown | Response> {
  if (request.headers.get("content-type") !== "application/json" || !browserPostIsAuthorized(request, config)) {
    return errorResponse("invalid_request", config, now, false);
  }
  try {
    return await readBoundedJson(request, limit);
  } catch (error) {
    if (error instanceof RangeError) return errorResponse("payload_too_large", config, now, false);
    if (error instanceof StrictJsonError) return errorResponse("invalid_request", config, now, false);
    return errorResponse("invalid_request", config, now, false);
  }
}

export async function handleProviderRequest(
  request: Request,
  env: Env,
  options: ProviderRouterOptions = {},
): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (!ROUTES.has(path)) return null;
  const config = resolveProviderConfig(env);
  const now = options.now ?? (() => new Date());
  const fetcher = options.fetch ?? fetch;

  if (path === "/api/v1/providers/health") {
    if (request.method !== "GET") return errorResponse("invalid_request", config, now, false);
    return jsonResponse(healthResponse(config, now), 200, config, now, true);
  }
  if (request.method !== "POST") return errorResponse("invalid_request", config, now, false);

  const parsed = await parsePost(request, path === "/api/v1/research" ? 16 * 1024 : 64 * 1024, config, now);
  if (parsed instanceof Response) return parsed;
  if (!acquire()) return errorResponse("rate_limited", config, now, true);

  try {
    if (path === "/api/v1/research") {
      const input = validateResearchRequest(parsed);
      if (!input) return errorResponse("invalid_request", config, now, false);
      if (!config.tavily?.config) return errorResponse("research_unavailable", config, now, true);
      const candidates = await runTavilySearch(config.tavily.config, input.query, fetcher, request.signal, now);
      if (!internalCandidatesAreSafe(candidates, config)) throw new ProviderFailure("invalid_upstream_response", false);
      const response: ResearchResponse = {
        schemaVersion: "gridlens.research-response.v3",
        requestId: input.requestId,
        candidates,
        providerClass: "tavily",
        partial: false,
      };
      return jsonResponse(response, 200, config, now);
    }

    const input = await validateAgentRequest(parsed);
    if (!input) return errorResponse("invalid_request", config, now, false);
    if (!config.model.config) return errorResponse("provider_unavailable", config, now, true);
    let candidates: ResearchCandidate[] = [];
    let partial = false;
    if (input.includeWebResearch) {
      if (!config.tavily?.config) {
        partial = true;
      } else {
        try {
          candidates = await runTavilySearch(config.tavily.config, input.prompt, fetcher, request.signal, now);
          if (!internalCandidatesAreSafe(candidates, config)) throw new ProviderFailure("invalid_upstream_response", false);
        } catch (error) {
          if (error instanceof ProviderFailure && error.code === "cancelled") throw error;
          partial = true;
          candidates = [];
        }
      }
    }
    const modelResult = await runModelAnalysis(
      config.model.config,
      input.mode,
      input.prompt,
      input.context,
      candidates,
      fetcher,
      request.signal,
    );
    if (partial && modelResult.claims.length < 16 && !modelResult.claims.some((claim) => claim.kind === "uncertainty")) {
      modelResult.claims.push({
        claimId: "claim:web-research-unavailable",
        kind: "uncertainty",
        text: "Web research was unavailable for this response.",
        citationIds: [],
      });
    }
    const referenced = new Set(modelResult.claims.flatMap((claim) => claim.citationIds));
    const response: AgentResponse = {
      schemaVersion: "gridlens.agent-response.v3",
      requestId: input.requestId,
      mode: input.mode,
      contextFingerprint: input.context.contextFingerprint,
      claims: modelResult.claims,
      citations: candidates.filter((candidate) => referenced.has(candidate.citationId)),
      ...(modelResult.payload ? { payload: modelResult.payload } : {}),
      providerClass: "openai_compatible",
      generatedAt: now().toISOString(),
      partial,
    };
    return jsonResponse(response, 200, config, now);
  } catch (error) {
    if (error instanceof ProviderFailure) return errorResponse(error.code, config, now, error.retryable);
    return errorResponse("internal_error", config, now, false);
  } finally {
    release();
  }
}
