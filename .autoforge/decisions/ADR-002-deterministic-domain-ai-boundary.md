# ADR-002 — Deterministic domain and constrained AI boundary

**Status:** Superseded by requirements v0.4; historical pending Gate 2 v0.3
**Date:** 2026-08-06

## Context

The requirements prohibit LLM-authoritative arithmetic or factual prose and require every result and material statement to be traceable. AI output may fail, arrive after the active result changes, or contain unsupported claims even when schema-valid.

## Decision

Separate trusted-origin derivation, validation, calculation, minimax simulation, evidence freshness, assessment, and deterministic factual reporting into independently testable modules. Optional AI receives only a result fingerprint, request-generation ID, allowlisted deterministic statement IDs, presentation metadata, and non-factual connective choices. It returns an ephemeral schema-validated presentation plan containing only IDs, order, and allowlisted connective selections. The browser reconstructs every factual sentence, number, unit, outcome, source, unresolved question, and disclaimer deterministically. Unknown/duplicate/missing required IDs, factual free text, HTML, fingerprint mismatch, or obsolete generation rejects the entire plan.

## Alternatives

- Generate full reports directly with an LLM: rejected because arithmetic, provenance, reproducibility, and failure behavior become unsafe.
- No AI adapter: viable fallback but does not establish the intended controlled enrichment boundary.

## Consequences

- Required reports remain complete and reproducible without AI.
- The presentation-plan contract, result fingerprint, request generation, cancellation, and deterministic reconstruction need strict tests.
- Natural-language variation is limited to ordering and explicitly non-factual connectives around statements already proven by structured records.
