# ADR-008 — Typed evidence and trusted visual boundary

**Status:** Accepted at Gate 2 v0.3
**Date:** 2026-08-06

## Context

The Project Case File and prompt workspace must combine facts, proposal claims, official records, community material, web research, discrepancies, AI interpretation, and dynamically requested visualisations. Rendering arbitrary model HTML/code or treating graph connectivity as authority would violate the product’s deterministic and security requirements.

## Decision

Represent project knowledge as typed evidence records and edges with deterministic provenance, authority, freshness, conflict, and derivation states. AI may propose candidate records/edges but cannot promote them or change assessment evidence gates.

Render Case File and AI-generated visual content only through an application-owned trusted component registry. The model may emit a bounded versioned visual JSON specification referencing known data/evidence IDs and allowlisted primitives/transformations. The analysis worker resolves it to a trusted view model. HTML, scripts, CSS, executable expressions, event handlers, arbitrary component names/URLs, unknown IDs, and unbounded payloads fail closed.

## Alternatives

- Free-form model HTML/React/code: rejected for XSS, provenance, accessibility, and reproducibility risk.
- Static visuals only: viable but does not meet the approved prompt-driven visualisation journey.
- Opaque vector/embedding authority: rejected; retrieval similarity is not evidence authority.

## Consequences

- Visual expressiveness is deliberately bounded.
- Every visual needs a text/table equivalent and complete provenance label.
- Evidence schemas and the trusted component registry require contract and adversarial tests.
