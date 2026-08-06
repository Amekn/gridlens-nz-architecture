# ADR-004 — Explicit local-only scenario persistence

**Status:** Superseded by requirements v0.4; historical pending Gate 2 v0.3
**Date:** 2026-08-06

## Context

The approved MVP is anonymous and has no server database or sharing. Users may want same-device convenience without providing identity or sending scenarios elsewhere.

## Decision

Keep drafts/results in memory by default. After explicit Save, store normalized scenario inputs, trusted immutable references, complete save-time source versions, stable record/operation IDs, revision, schema version, and timestamps in IndexedDB. Use one transaction per record mutation, compare-and-swap revisions, and monotonic tombstones so concurrent tabs cannot silently lose independent saves, overwrite a newer same-record revision, or resurrect a deletion. Retrying an operation ID is idempotent and reconciles crash-after-commit ambiguity. Restore runs supported sequential transactional migrations, reports all version drift, revalidates trusted references, and recalculates using current bundles. Invalid records are quarantined individually and deletable. Results and presentation plans are never authoritative persisted state.

## Alternatives

- Session-only state: simplest but loses user-requested optional save convenience.
- Cloud persistence: requires identity, permissions, retention, migration, backup, and privacy decisions outside approved scope.

## Consequences

- No central personal-data store or cross-device expectation.
- Users can lose data through browser clearing/device loss and must be told this clearly; IndexedDB is convenience, not backup.
- Removal of the hosted site does not itself erase browser-local records.
- IndexedDB/version migrations and concurrency tests add implementation complexity but are required to avoid silent data loss.
