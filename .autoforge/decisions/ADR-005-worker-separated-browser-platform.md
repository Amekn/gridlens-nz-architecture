# ADR-005 — Worker-separated browser platform

**Status:** Accepted at Gate 2 v0.3
**Date:** 2026-08-06

## Context

The approved product combines interactive national mapping, deterministic calculations, spatial/evidence queries, local persistence, user-supplied remote AI connectors, and untrusted streamed content. A single browser realm is simpler but gives weaker fault, responsiveness, and secret-handling separation; a browser analytical database adds disproportionate hackathon risk.

## Decision

Use a Sites React/TypeScript main thread plus exactly two Web Workers:

- an analysis/evidence worker for validation, calculation, minimax simulation, assessment, geometry, evidence graph, site screening, and visual-spec resolution; and
- a connector/agent worker for credential use, capability tests, model streaming, bounded MCP/Tavily/live research, and citation/schema validation.

All cross-boundary messages are versioned, schema-validated, generation-scoped, cancellable, and free of raw credential material. MapLibre and trusted UI renderers remain on the main thread.

## Alternatives

- In-process modular SPA: faster initially, but weaker isolation and a greater risk of map jank and secret/domain coupling.
- Browser-local analytical database PWA: stronger large-corpus querying, but unnecessary database/WASM/migration risk for the approved demo.

## Consequences

- Domain and connector failures remain independently containable.
- Worker protocols and restart/cancellation behavior become critical public contracts.
- Main-thread map rendering still requires explicit geometry/feature budgets.
- Future server components can reuse the versioned contracts without changing domain authority.
