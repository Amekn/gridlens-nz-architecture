# ADR-007 — Content-addressed prepared data packs

**Status:** Accepted at Gate 2 v0.3
**Date:** 2026-08-06

## Context

Whole-NZ mapping, a prepared deep case, environmental/context layers, deterministic policies, and a rolling year of EMI node data must be reproducible and available without relying on runtime CORS or multi-gigabyte browser processing. Sources vary in schema, licence, freshness, spatial reference, and availability.

## Decision

Use a release-time Node data compiler driven by a versioned source registry. It records raw URLs/resource IDs, ETags/last-modified values, checksums, licences, transformations, units, spatial/temporal coverage, exclusions, and validation reports. It emits compact immutable content-addressed packs and one compatibility manifest for national geometry/catalog, regional/context data, EMI aggregates, policies/factors/profiles, and project case/evidence graphs.

The runtime activates only compatible, schema-valid, checksum-valid dependency graphs. Bulk raw source files are not shipped. EMI report HTML is not a data contract; structured public files/APIs are used, with exact POC-to-NSP joins and declared NZTM-to-Stats-region mapping.

## Alternatives

- Runtime retrieval of every public source: rejected because of CORS, availability, quota, reproducibility, and size constraints.
- One monolithic JSON file: rejected because failure isolation, lazy loading, version compatibility, and attribution become opaque.
- Runtime server database: rejected by Design 1 constraints.

## Consequences

- Data changes require a validated release, but rollback and offline use are strong.
- Pack byte/feature/evidence limits and source/licence review are release gates.
- Live sources remain contextual overlays and cannot silently replace prepared evidence.
