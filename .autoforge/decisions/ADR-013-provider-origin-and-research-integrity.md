# ADR-013 — Provider origin and research integrity policy

**Status:** Accepted
**Date:** 2026-08-07
**Decision owners:** User and GridLens NZ design team
**Approval evidence:** User message, “Approve both recommended Gate 3 security policies.”

## Context

The independent Gate 3 v0.11 review found that Option A's same-origin Worker adapter still needed two material security policies: the network scope permitted for operator-configured providers and the integrity boundary between browser-visible research and model synthesis.

## Decision

1. Provider traffic targets exact operator-approved public HTTPS origins and code-owned paths only. Private, loopback, link-local, reserved, IP-literal, redirected, runtime-selected, user-selected, and model-selected destinations are forbidden. Deployment validates public DNS/address classification and a provider hostname change requires operator review.
2. Research used by the agent is performed within the same Worker operation and stays server-side until sanitized citations are projected. `/agent` accepts no browser research candidates or source-authority labels. `/research` remains a standalone inspectable feature but its output is never trusted as `/agent` input.

## Consequences

- The architecture remains one private OpenAI Sites deployment with a narrow same-origin Worker API.
- No receipt-signing secret or application database is required for the hackathon prototype.
- Provider POST calls receive no automatic retry, limiting ambiguous billing and replay.
- A future private enterprise endpoint or browser-resubmitted research flow requires a new approved ADR and threat model.
