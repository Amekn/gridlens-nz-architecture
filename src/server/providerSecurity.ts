import type { ResolvedProviderConfig } from "./providerTypes";

const encoder = new TextEncoder();

function activeForbiddenValues(config: ResolvedProviderConfig): string[] {
  const model = config.model.config;
  const tavily = config.tavily?.config;
  const mcp = config.mcp?.config;
  const values = [
    model?.apiKey,
    model?.modelId,
    model?.origin,
    model?.chatUrl,
    model?.modelsUrl,
    model ? new URL(model.origin).hostname : undefined,
    model ? new URL(model.chatUrl).pathname : undefined,
    model ? `Bearer ${model.apiKey}` : undefined,
    tavily?.apiKey,
    tavily?.origin,
    tavily?.searchUrl,
    tavily ? new URL(tavily.origin).hostname : undefined,
    tavily ? new URL(tavily.searchUrl).pathname : undefined,
    tavily ? `Bearer ${tavily.apiKey}` : undefined,
    mcp?.credential,
    mcp?.origin,
    mcp?.endpointUrl,
    mcp ? new URL(mcp.origin).hostname : undefined,
    mcp ? new URL(mcp.endpointUrl).pathname : undefined,
    mcp?.credential ? `Bearer ${mcp.credential}` : undefined,
    config.localSmokeToken,
  ];
  return [...new Set(values.filter((value): value is string => Boolean(value) && value!.length >= 3))];
}

function decodedLeaves(value: unknown, output: string[]): void {
  if (typeof value === "string") {
    output.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) decodedLeaves(item, output);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      output.push(key);
      decodedLeaves(item, output);
    }
  }
}

function credentialPattern(value: string): boolean {
  return /(?:\bsk-[A-Za-z0-9_-]{16,}|\btvly-[A-Za-z0-9_-]{16,}|\bBearer\s+[A-Za-z0-9._~-]{16,})/.test(value);
}

export function isSafePublicEgress(value: unknown, serialized: string, config: ResolvedProviderConfig): boolean {
  const leaves: string[] = [];
  decodedLeaves(value, leaves);
  const adjacent = leaves.map((leaf, index) => `${leaf}${leaves[index + 1] ?? ""}`);
  const searchable = [...leaves, ...adjacent, serialized];
  const forbidden = activeForbiddenValues(config);
  return !searchable.some((candidate) => credentialPattern(candidate) || forbidden.some((secret) => candidate.includes(secret)));
}

export function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

export function browserPostIsAuthorized(request: Request, config: ResolvedProviderConfig): boolean {
  const requestOrigin = new URL(request.url).origin;
  if (request.headers.get("origin") === requestOrigin && request.headers.get("sec-fetch-site") === "same-origin") {
    return true;
  }
  const supplied = request.headers.get("x-gridlens-local-smoke-token");
  return Boolean(supplied && config.localSmokeToken && constantTimeEqual(supplied, config.localSmokeToken));
}
