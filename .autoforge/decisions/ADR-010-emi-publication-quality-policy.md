# ADR-010 - EMI publication quality policy

**Status:** Accepted
**Phase:** Logic / Gate 3
**Date:** 2026-08-07

## Context

GridLens must not present incomplete Electricity Authority/EMI data as a complete regional picture, but overly strict thresholds would remove useful evidence. The policy must independently cover source-time completeness, eligible POC-interval coverage nationally, and coverage for every published geography. It must also freeze unconditional failures and the maximum search distance for a rolling 12-calendar-month window.

A bounded official dry run processed the public 2026-08-01 through 2026-08-05 daily nodal CSVs and the 2026-08-05 NSP mapping. Daily source-time completeness ranged from 88.1944% to 97.2222%; national observed-POC interval coverage from 86.2301% to 93.6003%; and minimum mapped-region coverage from 73.6111% to 82.0312%. This calibrates the options but is not a 12-month completeness claim.

## Options

### A. Balanced (recommended)

- Complete: source-time >=90%, national POC-interval >=85%, each published geography >=70%.
- Partial: source-time >=75%, national POC-interval >=65%, publish only geographies >=50%.
- Search backward at most 45 NZ calendar days.

### B. Strict

- Complete: >=95% / >=90% / >=80%.
- Partial: >=85% / >=75% / >=60%.
- Search backward at most 30 days.

### C. Availability-first

- Complete: >=85% / >=75% / >=60%.
- Partial: >=65% / >=50% / >=40%.
- Search backward at most 60 days.

All options use the same unconditional failures: unknown or missing required schema/unit; invalid timestamp/offset cadence; conflicting values under one canonical row identity; source checksum mismatch; mapping/transform version mismatch; or aggregate conservation/recomputation failure. Per-POC coordinate/geography conflicts are recorded exclusions and become publication failures only through the chosen coverage threshold.

## Decision

The product owner selected **Option A, Balanced**, on 2026-08-07: complete at `>=90% / >=85% / >=70%`, partial at `>=75% / >=65% / >=50%`, with a 45-NZ-calendar-day backward search and the common unconditional-failure set above.

## Consequences

The selected values become `EmiQualityPolicyV1`, release-blocking equality-boundary tests, public coverage labels, regional suppression rules, and rolling-window search behavior. Changing them after Gate 3 requires a policy version bump and Gate 3 reconsideration.
