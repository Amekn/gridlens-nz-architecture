# ADR-009 — Atomic offline release generations

**Status:** Accepted at Gate 2 v0.3
**Date:** 2026-08-06

## Context

The prepared national map, demonstration cases, deterministic analysis, and brief must survive AI/live failure and be usable after caching. A service worker can also create dangerous mixed-version or stale-evidence behavior if shell, schemas, policies, geometry, and data packs update independently.

## Decision

Use immutable content-addressed assets and generation-specific service-worker caches. Precache the shell, national geometry/catalog, policies, and core demonstration packs; cache other compatible packs on use. Activate only a complete manifest generation. Download updates separately, notify the user, and switch generations on an explicit reload. Never cache credential-bearing requests or model/MCP responses through the service worker.

Freshness always uses the record’s original observation/retrieval time and the result’s pinned `as-of`; a cached response is never relabelled freshly retrieved.

## Alternatives

- Network-only application: rejected because core offline/failure journeys would fail.
- Cache-first URLs without content addressing: rejected because mixed schema/data generations and opaque staleness are likely.
- Automatic background activation: rejected because it could mutate the active evidence context during analysis.

## Consequences

- Releases need cache-generation, interrupted-update, rollback, and storage-pressure tests.
- Users may stay on an older validated generation until reload; the UI must disclose update availability and data versions.
- Unpublishing the site does not clear device-local IndexedDB or caches; removal guidance must explain both.
