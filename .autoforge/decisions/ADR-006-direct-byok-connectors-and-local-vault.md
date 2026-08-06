# ADR-006 — Direct BYOK connectors and local vault

**Status:** Accepted at Gate 2 v0.3
**Date:** 2026-08-06

## Context

Users must configure a custom OpenAI-compatible endpoint and Tavily/MCP credentials in the web app, retain them across refresh after successful use, and make only direct browser calls to CORS-compatible endpoints. Design 1 prohibits a GridLens credential relay, server escrow, hidden proxy, and user database.

## Decision

The connector worker calls only explicit user-approved HTTPS origins that pass capability and CORS tests. Credentials are separate from connector configuration, masked, non-readable through the UI, and held in a dedicated IndexedDB vault after first successful use. Use authenticated best-effort browser-local encryption when supported, while clearly disclosing that it is not an OS keychain and does not protect against a compromised same-origin application. Provide session-only, replace, clear-one, and clear-all modes.

The ignored `TEST.md` file is an opt-in local-test input only. Production/application code has no import or fallback path to it, and release scans prove that neither it nor its exact secret values enter artifacts.

## Alternatives

- Session-only keys: rejected because refresh persistence is explicitly required.
- Application relay/secret store: rejected by the approved privacy and direct-call constraints.
- Credential-bearing URL display/logging: rejected; the entire sensitive URL is treated as secret.

## Consequences

- Non-CORS providers are incompatible unless provider-side remote MCP or prepared/link-only use applies.
- Arbitrary custom HTTPS origins require a broader CSP `connect-src`; exact application allowlisting, self-hosted scripts, trusted rendering, and XSS prevention are mandatory compensating controls.
- Same-device storage can be cleared or lost and is not synchronization or backup.
