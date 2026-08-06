import type {
  ConfiguredProvider,
  Env,
  McpConfig,
  ModelConfig,
  ResolvedProviderConfig,
  TavilyConfig,
} from "./providerTypes";

const UNSAFE_DNS_SUFFIXES = [
  ".internal",
  ".invalid",
  ".lan",
  ".local",
  ".localhost",
  ".onion",
  ".test",
];

function isIpv4(value: string): boolean {
  const pieces = value.split(".");
  return pieces.length === 4 && pieces.every((piece) => /^\d{1,3}$/.test(piece) && Number(piece) <= 255);
}

function isPublicDnsHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (!host.includes(".") || host.includes(":") || host.includes("[") || isIpv4(host)) return false;
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(host)) {
    return false;
  }
  return host !== "localhost" && !UNSAFE_DNS_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

function parseApprovedHttpsUrl(raw: string, allowedPaths: readonly string[]): URL | null {
  if (!raw || raw !== raw.trim() || /[^\x20-\x7e]/.test(raw) || raw.includes("%") || raw.includes("\\")) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    (parsed.port && parsed.port !== "443") ||
    !isPublicDnsHostname(parsed.hostname)
  ) {
    return null;
  }
  const rawPath = raw.slice(raw.indexOf(parsed.host) + parsed.host.length).split(/[?#]/, 1)[0];
  if (/(?:^|\/)\.{1,2}(?:\/|$)/.test(rawPath)) return null;
  const path = parsed.pathname.length > 1 ? parsed.pathname.replace(/\/+$/, "") : parsed.pathname;
  if (!allowedPaths.includes(path)) return null;
  parsed.pathname = path;
  return parsed;
}

function modelConfig(env: Env): ConfiguredProvider<ModelConfig> {
  const endpoint = env.GRIDLENS_MODEL_ENDPOINT;
  const apiKey = env.GRIDLENS_MODEL_API_KEY;
  if (!endpoint && !apiKey) return { reason: "not_configured" };
  if (!endpoint || !apiKey || !apiKey.trim()) return { reason: "policy_rejected" };
  const parsed = parseApprovedHttpsUrl(endpoint, ["/", "/v1", "/v1/chat/completions"]);
  if (!parsed) return { reason: "policy_rejected" };

  const basePath = parsed.pathname === "/v1/chat/completions"
    ? "/v1"
    : parsed.pathname === "/"
      ? "/v1"
      : parsed.pathname;
  const modelId = env.GRIDLENS_MODEL_ID;
  if (modelId !== undefined && (!modelId.trim() || modelId !== modelId.trim() || modelId.length > 160)) {
    return { reason: "policy_rejected" };
  }
  return {
    reason: "configured",
    config: {
      origin: parsed.origin,
      chatUrl: `${parsed.origin}${basePath}/chat/completions`,
      modelsUrl: `${parsed.origin}${basePath}/models`,
      apiKey,
      ...(modelId ? { modelId } : {}),
    },
  };
}

function tavilyConfig(env: Env): ConfiguredProvider<TavilyConfig> | undefined {
  const apiKey = env.GRIDLENS_TAVILY_API_KEY;
  if (apiKey === undefined) return undefined;
  if (!apiKey.trim()) return { reason: "policy_rejected" };
  return {
    reason: "configured",
    config: {
      origin: "https://api.tavily.com",
      searchUrl: "https://api.tavily.com/search",
      apiKey,
    },
  };
}

function mcpConfig(env: Env): ConfiguredProvider<McpConfig> | undefined {
  if (env.GRIDLENS_MCP_ENDPOINT === undefined && env.GRIDLENS_MCP_KEY === undefined) return undefined;
  if (!env.GRIDLENS_MCP_ENDPOINT) return { reason: "policy_rejected" };
  const parsed = parseApprovedHttpsUrl(env.GRIDLENS_MCP_ENDPOINT, ["/mcp", "/v1/mcp"]);
  if (!parsed) return { reason: "policy_rejected" };
  return {
    reason: "configured",
    config: {
      origin: parsed.origin,
      endpointUrl: parsed.href,
      ...(env.GRIDLENS_MCP_KEY ? { credential: env.GRIDLENS_MCP_KEY } : {}),
    },
  };
}

export function resolveProviderConfig(env: Env): ResolvedProviderConfig {
  const localSmokeToken = env.GRIDLENS_LOCAL_SMOKE_TOKEN;
  return {
    model: modelConfig(env),
    tavily: tavilyConfig(env),
    mcp: mcpConfig(env),
    ...(localSmokeToken?.trim() ? { localSmokeToken } : {}),
  };
}

function parseIpv4(address: string): number[] | null {
  if (!isIpv4(address)) return null;
  return address.split(".").map(Number);
}

export function isPublicIpAddress(address: string): boolean {
  const v4 = parseIpv4(address);
  if (v4) {
    const [a, b, c] = v4;
    if (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113)
    ) return false;
    return true;
  }
  const value = address.toLowerCase().split("%", 1)[0];
  if (!value.includes(":")) return false;
  return !(
    value === "::" || value === "::1" || value.startsWith("fe8") || value.startsWith("fe9") ||
    value.startsWith("fea") || value.startsWith("feb") || value.startsWith("fc") || value.startsWith("fd") ||
    value.startsWith("ff") || value.startsWith("2001:db8:")
  );
}

export async function validateConfiguredHostAddresses(
  resolved: ResolvedProviderConfig,
  lookup: (hostname: string) => Promise<string[]>,
): Promise<boolean> {
  const origins = [resolved.model.config?.origin, resolved.tavily?.config?.origin, resolved.mcp?.config?.origin]
    .filter((value): value is string => Boolean(value));
  for (const origin of new Set(origins)) {
    const addresses = await lookup(new URL(origin).hostname);
    if (!addresses.length || addresses.some((address) => !isPublicIpAddress(address))) return false;
  }
  return true;
}
