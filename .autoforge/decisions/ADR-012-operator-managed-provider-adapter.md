# ADR-012 — Operator-managed provider adapter

**Status:** Accepted
**Date:** 2026-08-07

## Context

The user changed the approved product from user-entered browser credentials and direct CORS provider calls to a zero-credential working prototype. Static browser-bundled secrets are extractable and cannot satisfy near-production security. The map also requires independent pinned geometry so region selection is not dependent on marker-only interaction or a live basemap.

## Decision

Use the existing OpenAI Sites Cloudflare Worker as a narrow same-origin provider adapter. Keep OpenAI-compatible, Tavily, and optional read-only MCP configuration in operator-managed runtime secrets. Local development derives equivalent Worker bindings from ignored `TEST.md`. Ship pinned Stats NZ regional geometry and prepared markers, with one canonical region-selection operation across polygon, marker, list, search, and coordinate paths.

## Consequences

- Ordinary users see no API-key or endpoint interface.
- Provider secrets never enter the client bundle or browser storage.
- Browser/provider CORS compatibility is no longer a user concern.
- The Worker must implement closed schemas, fixed upstream allowlists, limits, sanitisation, secret-safe diagnostics, and open-proxy tests.
- The private hackathon deployment is acceptable; public anonymous access requires durable abuse/rate/cost controls.
- The adapter can later move to a separate service behind the unchanged browser contract.

## Rejected alternatives

- Separate API service now: stronger independent operations but disproportionate deployment and schedule cost.
- Short-lived browser tokens: no common supported token contract across the configured model/Tavily/MCP stack and still exposes temporary credentials to browser script.
- Build-time/client-bundled credentials: rejected because users can extract them.
