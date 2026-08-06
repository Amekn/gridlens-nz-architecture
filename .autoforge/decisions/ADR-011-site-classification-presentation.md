# ADR-011 - Site classification presentation

**Status:** Accepted
**Phase:** Logic / Gate 3
**Date:** 2026-08-07

## Context

Site screening produces one of five domain outcomes independently of user preferences: `included`, `excluded`, `infrastructure upgrade required`, `specialist assessment required`, or `insufficient evidence`. A single global rank across the three presentation groups `passes declared constraints`, `needs investigation`, and `excluded` could imply that a candidate with a hard failure is comparable to a candidate with missing evidence. The visible grouping behavior therefore requires an explicit owner decision without replacing those five outcomes.

## Options

### A. Separate presentation groups (recommended)

Render the three presentation groups independently. Apply confirmed lexicographic preferences only within each group. Expose no global ordinal, ARIA position, score, or cross-group rank. Preserve and display each site's five-valued domain outcome.

### B. Explicit workflow order

Render `passes declared constraints` -> `needs investigation` -> `excluded`. Apply preferences only within each group and permanently state that the group order is workflow order, not overall suitability.

Both options keep unconfirmed preferences from the domain outcome and require explicit profile confirmation before a criterion can become outcome-affecting.

## Decision

The product owner selected **Option A, separate presentation groups**, on 2026-08-07, and explicitly required a map-based interface rather than checkbox or drop-down geography/site selection. The whole-NZ map is the primary selector; pointer, touch, keyboard map navigation, place search that focuses the map, and the synchronized accessible map list share exact feature IDs and state. The mapping is fixed: `included -> passes declared constraints`; `excluded -> excluded`; and `infrastructure upgrade required|specialist assessment required|insufficient evidence -> needs investigation`.

## Consequences

The selection fixes `SitePresentationPolicy`, screen-reader ordering, comparison exports, map/list parity, and release-blocking site-order tests. It does not erase the five domain outcomes, create weighted scores, or allow the LLM to classify sites. The LLM may only propose an unconfirmed profile; deterministic rules classify after explicit user confirmation.
