# ADR-001 — Browser-first hybrid execution

**Status:** Superseded by requirements v0.4; historical pending Gate 2 v0.3
**Date:** 2026-08-06

## Context

GridLens NZ requirements v0.3 require sub-one-second deterministic results, anonymous use, graceful AI/evidence failure, transparent formulas, reproducible evidence/assessment policy, transactional same-device saves, and a short hackathon delivery path on OpenAI Sites.

## Decision

Run every authoritative and required product operation in the browser. Use a narrow, optional Sites edge gateway only to select/reorder allowlisted deterministic statement IDs and non-factual connective choices. The gateway is stateless and cannot author facts, calculate, assess, retrieve arbitrary web content, or persist scenarios.

## Alternatives

- Entirely static client: simpler, but makes later controlled AI enrichment a new trust-boundary retrofit.
- API-backed modular monolith: stronger central persistence and administration, but adds unapproved operations/privacy scope and weakens failure independence.

## Consequences

- Instant required results and low operating complexity.
- Transparent client-delivered formulas/data are an intentional product property.
- Optional AI cost and provider failure cannot block or alter authoritative output.
- Central persistence/admin features require a future architecture change.
