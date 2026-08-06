# ADR-003 — Versioned static regional bundles

**Status:** Superseded by requirements v0.4; historical pending Gate 2 v0.3
**Date:** 2026-08-06

## Context

The MVP uses prepared Southland, Waikato, and Auckland records, pinned New Zealand geometry, curated evidence, approved freshness windows, assessment thresholds, and deterministic profiles. It must prevent unsupported analysis and reproduce complete, insufficient, and failed results using every constituent version. It has no approved live-ingestion or administration service.

## Decision

Package a deployment manifest, pinned geometry bundle, and each supported region as content-hashed static assets. Region manifests independently identify schema, regional dataset, 24-hour profile, factor, absolute water threshold, evidence, pinned `as-of`, freshness-policy, and assessment-policy versions. Evidence records include category, publication date, optional `validUntil`, provenance, and quality. Validate schemas, geometry, required region IDs, category coverage, source links, content hashes, thresholds, and all cross-version references at build time and again at the browser boundary. Activate a region atomically only after its whole dependency graph passes validation. Point-in-polygon border ties choose the lexicographically smallest matching region ID and never the nearest region.

## Alternatives

- One unversioned global JSON file: rejected because failures cannot be isolated and provenance/version drift is opaque.
- Server database and live ingestion: deferred to an API-backed architecture because operations, auth, and migrations are outside MVP scope.

## Consequences

- Strong reproducibility and rollback; a bad region bundle affects only its region, while invalid shared geometry disables map/coordinate resolution rather than guessing.
- Data changes require rebuilding and redeploying the site.
- Bundle-size budgets and on-demand loading are required to protect performance.
- Every supported bundle must contain qualifying current source-backed evidence, or fail validation; stale/unknown items remain contextual but cannot satisfy low-concern gates.
