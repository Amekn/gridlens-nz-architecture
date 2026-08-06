import type { IncomingMessage } from "node:http";
import type { Plugin } from "vite";

import { handleProviderRequest, type Env } from "../src/server/index";

async function requestBody(request: IncomingMessage): Promise<string | undefined> {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const chunks: Uint8Array[] = [];
  let length = 0;
  for await (const value of request) {
    const chunk = typeof value === "string" ? Buffer.from(value) : value;
    length += chunk.byteLength;
    if (length > 128 * 1024) throw new RangeError("Local request is too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, length).toString("utf8");
}

/**
 * Development-only provider boundary. Vite's Cloudflare runtime cannot use
 * every host trust configuration available to the machine running the demo,
 * so TEST.md-backed provider calls are handled by the local Node process.
 * Hosted builds do not include this middleware and still use the Worker.
 */
export function localProviderPlugin(env: Env): Plugin {
  return {
    name: "gridlens-local-provider",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (!request.url?.startsWith("/api/v1/")) return next();
        try {
          const host = request.headers.host ?? "localhost:3000";
          const body = await requestBody(request);
          const webRequest = new Request(`http://${host}${request.url}`, {
            method: request.method,
            headers: request.headers as HeadersInit,
            ...(body ? { body } : {}),
          });
          const providerResponse = await handleProviderRequest(webRequest, env, { fetch: globalThis.fetch });
          if (!providerResponse) return next();
          response.writeHead(providerResponse.status, Object.fromEntries(providerResponse.headers));
          response.end(Buffer.from(await providerResponse.arrayBuffer()));
        } catch {
          response.writeHead(500, { "content-type": "application/json" });
          response.end(JSON.stringify({
            schemaVersion: "gridlens.public-error.v3",
            error: {
              code: "internal_error",
              message: "The operation could not be completed.",
              retryable: false,
              correlationId: "local-development",
            },
          }));
        }
      });
    },
  };
}
