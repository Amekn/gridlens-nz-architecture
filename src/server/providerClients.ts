import { parseStrictJson, utf8Length } from "./providerJson";
import { validateModelResult } from "./providerValidation";
import type {
  AgentMode,
  AgentPayload,
  AgentClaim,
  DeterministicPromptContext,
  ModelConfig,
  PublicErrorCode,
  ResearchCandidate,
  TavilyConfig,
} from "./providerTypes";

const OFFICIAL_HOSTS = new Set([
  "data.govt.nz",
  "ea.govt.nz",
  "www.ea.govt.nz",
  "emi.ea.govt.nz",
  "lawa.org.nz",
  "mbie.govt.nz",
  "www.mbie.govt.nz",
  "stats.govt.nz",
  "www.stats.govt.nz",
  "transpower.co.nz",
  "www.transpower.co.nz",
]);

export class ProviderFailure extends Error {
  constructor(
    readonly code: PublicErrorCode,
    readonly retryable: boolean,
  ) {
    super(code);
  }
}

function boundedString(value: unknown, maxBytes: number, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const clean = [...value].map((character) => {
    const code = character.charCodeAt(0);
    return (code <= 0x08 || code === 0x0b || code === 0x0c || (code >= 0x0e && code <= 0x1f) || code === 0x7f)
      ? " "
      : character;
  }).join("").trim();
  if (utf8Length(clean) <= maxBytes) return clean;
  let result = "";
  for (const character of clean) {
    if (utf8Length(result + character) > maxBytes) break;
    result += character;
  }
  return result;
}

function publicCandidateUrl(value: unknown): URL | null {
  if (typeof value !== "string" || utf8Length(value) > 2048) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.hash) return null;
  const hostname = url.hostname.toLowerCase();
  if (!hostname.includes(".") || hostname.includes(":") || /^\d+(?:\.\d+){3}$/.test(hostname) || !/^[a-z0-9.-]+$/.test(hostname)) return null;
  if (["localhost", "local", "internal"].some((part) => hostname === part || hostname.endsWith(`.${part}`))) return null;
  return url;
}

function normalizeModelClaims(value: unknown, allowedCitationIds: ReadonlySet<string>): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const root = value as Record<string, unknown>;
  if (!Array.isArray(root.claims)) return value;
  const claims = root.claims.map((claim, index) => {
    if (!claim || typeof claim !== "object" || Array.isArray(claim)) return claim;
    const raw = claim as Record<string, unknown>;
    const citationIds = Array.isArray(raw.citationIds)
      ? [...new Set(raw.citationIds.filter(
          (citationId): citationId is string => typeof citationId === "string" && allowedCitationIds.has(citationId),
        ))].sort()
      : raw.citationIds;
    const kind = raw.kind === "source_statement" && Array.isArray(citationIds) && citationIds.length === 0
      ? "model_inference"
      : raw.kind;
    return {
      claimId: `claim:response-${index + 1}`,
      kind,
      text: raw.text,
      citationIds,
    };
  });
  return {
    claims,
    ...(root.payload !== undefined ? { payload: root.payload } : {}),
  };
}

function upstreamFailure(status: number): ProviderFailure {
  if (status === 429) return new ProviderFailure("rate_limited", true);
  return new ProviderFailure("upstream_rejected", status >= 500);
}

async function readBoundedResponse(response: Response, maxBytes: number): Promise<string> {
  const declared = response.headers.get("content-length");
  if (declared && /^\d+$/.test(declared) && Number(declared) > maxBytes) {
    throw new ProviderFailure("invalid_upstream_response", false);
  }
  const reader = response.body?.getReader();
  if (!reader) throw new ProviderFailure("invalid_upstream_response", false);
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new ProviderFailure("invalid_upstream_response", false);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ProviderFailure("invalid_upstream_response", false);
  }
}

async function fetchOnce(
  fetcher: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
  signal: AbortSignal,
): Promise<Response> {
  if (signal.aborted) throw new ProviderFailure("cancelled", false);
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const cancel = () => controller.abort();
  signal.addEventListener("abort", cancel, { once: true });
  try {
    return await fetcher(url, { ...init, signal: controller.signal, redirect: "error" });
  } catch (error) {
    if (signal.aborted) throw new ProviderFailure("cancelled", false);
    if (timedOut) throw new ProviderFailure("upstream_timeout", true);
    console.warn("GridLens provider transport failed", {
      origin: new URL(url).origin,
      errorName: error instanceof Error ? error.name : "unknown",
      errorMessage: error instanceof Error ? error.message.slice(0, 240) : "unknown",
    });
    throw new ProviderFailure("upstream_rejected", true);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", cancel);
  }
}

export async function runTavilySearch(
  config: TavilyConfig,
  query: string,
  fetcher: typeof fetch,
  signal: AbortSignal,
  now: () => Date,
): Promise<ResearchCandidate[]> {
  const body = JSON.stringify({
    query,
    search_depth: "basic",
    topic: "general",
    max_results: 4,
    include_domains: ["transpower.co.nz", "ea.govt.nz", "emi.ea.govt.nz", "lawa.org.nz", "mbie.govt.nz", "data.govt.nz", "stats.govt.nz"],
    include_answer: false,
    include_raw_content: false,
  });
  if (utf8Length(body) > 16 * 1024) throw new ProviderFailure("payload_too_large", false);
  const response = await fetchOnce(fetcher, config.searchUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      authorization: `Bearer ${config.apiKey}`,
    },
    body,
  }, 10_000, signal);
  if (!response.ok) throw upstreamFailure(response.status);
  let payload: unknown;
  try {
    payload = parseStrictJson(await readBoundedResponse(response, 256 * 1024));
  } catch (error) {
    if (error instanceof ProviderFailure) throw error;
    throw new ProviderFailure("invalid_upstream_response", false);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new ProviderFailure("invalid_upstream_response", false);
  const results = (payload as Record<string, unknown>).results;
  if (!Array.isArray(results)) throw new ProviderFailure("invalid_upstream_response", false);
  const candidates: ResearchCandidate[] = [];
  for (const entry of results.slice(0, 4)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const item = entry as Record<string, unknown>;
    const url = publicCandidateUrl(item.url);
    const title = boundedString(item.title, 240);
    if (!url || !title) continue;
    candidates.push({
      citationId: `citation:research-${candidates.length + 1}`,
      title,
      url: url.href,
      excerpt: boundedString(item.content, 900),
      retrievedAt: now().toISOString(),
      sourceClass: OFFICIAL_HOSTS.has(url.hostname.toLowerCase()) ? "official_candidate" : "public_web_candidate",
    });
  }
  return candidates;
}

export async function runModelAnalysis(
  config: ModelConfig,
  mode: AgentMode,
  prompt: string,
  context: DeterministicPromptContext,
  citations: ResearchCandidate[],
  fetcher: typeof fetch,
  signal: AbortSignal,
): Promise<{ claims: AgentClaim[]; payload?: AgentPayload }> {
  const allowedCitationIds = new Set(citations.map((candidate) => candidate.citationId));
  const body = JSON.stringify({
    ...(config.modelId ? { model: config.modelId } : {}),
    temperature: 0.2,
    max_tokens: 900,
    // llama-server/Qwen-compatible runtimes otherwise may spend the entire
    // response budget on hidden reasoning and return no public JSON content.
    chat_template_kwargs: { enable_thinking: false },
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are GridLens NZ. Return exactly one JSON object and no markdown. The root must contain "claims" and may contain "payload" only when the requested mode requires it. Each claim must be {"claimId":"claim:<lowercase-hyphen-id>","kind":"source_statement"|"model_inference"|"uncertainty"|"recommendation","text":"plain text","citationIds":[]}. Use 2-5 concise claims. A source_statement must cite one or more supplied citationId values; every other claim may use an empty citationIds array. Never invent citation IDs. For analysis or guided_question mode, omit payload. For site_profile mode, payload must be {"kind":"site_profile_candidate","regionId":"<selected two-character regionId>","summary":"...","strengths":[],"constraints":[],"missingEvidence":[]}. For visual mode, payload must be a small bar_chart, line_chart, or table using only supplied deterministic values and evidence IDs. Preserve deterministic values, label inference and uncertainty, and never emit code, HTML, reasoning, credentials, endpoints, or model details.`,
      },
      {
        role: "user",
        content: JSON.stringify({ mode, prompt, deterministicContext: context, researchCandidates: citations }),
      },
    ],
  });
  if (utf8Length(body) > 96 * 1024) throw new ProviderFailure("payload_too_large", false);
  const response = await fetchOnce(fetcher, config.chatUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      authorization: `Bearer ${config.apiKey}`,
    },
    body,
  }, 40_000, signal);
  if (!response.ok) {
    console.warn("GridLens model provider rejected a request", { status: response.status });
    throw upstreamFailure(response.status);
  }
  let envelope: unknown;
  try {
    envelope = parseStrictJson(await readBoundedResponse(response, 256 * 1024));
  } catch (error) {
    if (error instanceof ProviderFailure) throw error;
    throw new ProviderFailure("invalid_upstream_response", false);
  }
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) throw new ProviderFailure("invalid_upstream_response", false);
  const choices = (envelope as Record<string, unknown>).choices;
  const message = Array.isArray(choices) && choices[0] && typeof choices[0] === "object"
    ? (choices[0] as Record<string, unknown>).message
    : undefined;
  const content = message && typeof message === "object" && !Array.isArray(message)
    ? (message as Record<string, unknown>).content
    : undefined;
  if (typeof content !== "string") throw new ProviderFailure("invalid_upstream_response", false);
  const publicContent = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (!publicContent) throw new ProviderFailure("invalid_upstream_response", false);
  let modelResult: unknown;
  try {
    modelResult = parseStrictJson(publicContent);
  } catch {
    throw new ProviderFailure("invalid_upstream_response", false);
  }
  const normalizedModelResult = normalizeModelClaims(modelResult, allowedCitationIds);
  let validated = validateModelResult(normalizedModelResult, mode, allowedCitationIds);
  if (!validated && mode === "visual" && normalizedModelResult && typeof normalizedModelResult === "object" && !Array.isArray(normalizedModelResult)) {
    validated = validateModelResult({
      ...(normalizedModelResult as Record<string, unknown>),
      payload: {
        kind: "bar_chart",
        title: `${context.scenario.name} deterministic load profile`,
        xLabel: "Scenario metric",
        yLabel: "MW",
        series: [{
          name: "Declared scenario",
          values: [
            { label: "Added peak", value: context.calculations.addedPeakMw },
            { label: "Concurrent demand", value: context.calculations.concurrentDemandMw },
            { label: "Flexible load", value: context.calculations.maximumFlexibleLoadMw },
          ],
        }],
        sourceRecordIds: context.trustedEvidenceIds,
      },
    }, mode, allowedCitationIds);
  }
  if (!validated) {
    const root = modelResult && typeof modelResult === "object" && !Array.isArray(modelResult)
      ? modelResult as Record<string, unknown>
      : undefined;
    const rawClaims = Array.isArray(root?.claims) ? root.claims : [];
    console.warn("GridLens model returned an invalid structured response", {
      rootKeys: root ? Object.keys(root) : [],
      claimCount: rawClaims.length,
      claimKeys: rawClaims.slice(0, 5).map((claim) => claim && typeof claim === "object" && !Array.isArray(claim)
        ? Object.keys(claim as Record<string, unknown>)
        : []),
      claimKinds: rawClaims.slice(0, 5).map((claim) => claim && typeof claim === "object" && !Array.isArray(claim)
        ? (claim as Record<string, unknown>).kind
        : undefined),
      claimIds: rawClaims.slice(0, 5).map((claim) => claim && typeof claim === "object" && !Array.isArray(claim)
        ? (claim as Record<string, unknown>).claimId
        : undefined),
      citationIds: rawClaims.slice(0, 5).map((claim) => claim && typeof claim === "object" && !Array.isArray(claim)
        ? (claim as Record<string, unknown>).citationIds
        : undefined),
      payloadKind: root?.payload && typeof root.payload === "object" && !Array.isArray(root.payload)
        ? (root.payload as Record<string, unknown>).kind
        : undefined,
    });
    throw new ProviderFailure("invalid_upstream_response", false);
  }
  return validated;
}
