import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type LocalProviderBindings = Record<string, string>;

const LABEL_TO_BINDING: Readonly<Record<string, string>> = {
  "llama-server endpoint": "GRIDLENS_MODEL_ENDPOINT",
  "llama-server http endpoint": "GRIDLENS_MODEL_ENDPOINT",
  "llama-server api key": "GRIDLENS_MODEL_API_KEY",
  "tavily api key": "GRIDLENS_TAVILY_API_KEY",
};

/**
 * Development-only configuration boundary. Values are returned directly to
 * Miniflare bindings and are never exposed as Vite client constants.
 */
export async function loadLocalTestBindings(root: string): Promise<LocalProviderBindings> {
  const bindings: LocalProviderBindings = {};
  const testPath = resolve(root, "TEST.md");
  let source: string;
  try {
    source = await readFile(testPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return bindings;
    throw error;
  }

  for (const rawLine of source.split(/\r?\n/u)) {
    const separator = rawLine.indexOf(":");
    if (separator < 1) continue;
    const label = rawLine.slice(0, separator).trim().toLowerCase();
    const binding = LABEL_TO_BINDING[label];
    if (!binding) continue;
    const value = rawLine.slice(separator + 1).trim();
    if (value) bindings[binding] = value;
  }

  if (bindings.GRIDLENS_MODEL_ENDPOINT && bindings.GRIDLENS_MODEL_API_KEY) {
    try {
      const endpoint = new URL(bindings.GRIDLENS_MODEL_ENDPOINT);
      const normalizedPath = endpoint.pathname.replace(/\/+$/u, "");
      endpoint.pathname = normalizedPath.endsWith("/chat/completions")
        ? `${normalizedPath.slice(0, -"/chat/completions".length)}/models`
        : normalizedPath.endsWith("/v1")
          ? `${normalizedPath}/models`
          : `${normalizedPath}/v1/models`;
      const response = await fetch(endpoint, {
        headers: { authorization: `Bearer ${bindings.GRIDLENS_MODEL_API_KEY}` },
        signal: AbortSignal.timeout(5_000),
      });
      const payload = response.ok ? await response.json() as { data?: Array<{ id?: unknown }> } : undefined;
      const discoveredModel = payload?.data?.find((entry) => typeof entry.id === "string")?.id;
      if (typeof discoveredModel === "string" && discoveredModel.trim()) {
        bindings.GRIDLENS_MODEL_ID = discoveredModel.trim();
      }
    } catch {
      // Health stays truthful and the request path reports a safe upstream error.
    }
  }
  return bindings;
}
