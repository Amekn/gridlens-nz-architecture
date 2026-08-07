# GridLens NZ — Selected architecture

**Artifact version:** 0.4 approved
**Status:** Approved at Gate 2
**Selection:** Option A — Integrated Sites Worker adapter
**Approval evidence:** User message, "Approve Gate 2 architecture v0.4 Option A"
**Requirements baseline:** `01-requirements.md` v0.5 approved and `02-usage-definition.md` v0.5 approved

## Decision summary

GridLens NZ remains one OpenAI Sites deployment. Its browser UI owns the whole-NZ map, local scenario state, deterministic calculations, evidence presentation, and accessible interaction. Its Cloudflare Worker owns a narrow same-origin AI/research API and operator-managed OpenAI-compatible, Tavily, and optional read-only MCP secrets.

Ordinary users never configure or receive provider keys, endpoints, model IDs, or MCP URLs. The application is not a general proxy: upstream destinations, methods, models, headers, tools, limits, and redirects are fixed by operator configuration and code policy.

## Runtime topology

```text
Browser
  ├─ MapLibre UI
  │    ├─ pinned Stats NZ region GeoJSON
  │    ├─ prepared candidate/project markers
  │    └─ optional public CORS basemap/context tiles
  ├─ deterministic scenario + assessment domain
  ├─ device-local scenarios/preferences/cache
  └─ same-origin /api/v1/*
                 │
OpenAI Sites Cloudflare Worker
  ├─ provider health and capability projection
  ├─ schema/size/origin/tool validation
  ├─ timeout, cancellation, output and retry bounds
  ├─ response sanitisation and safe error mapping
  └─ fixed upstream adapters
       ├─ OpenAI-compatible model
       ├─ Tavily REST search
       └─ optional allowlisted read-only MCP
```

## Component boundaries

### Map and spatial selection

- Build-time preparation stores an attributed, versioned, simplified Stats NZ regional-council FeatureCollection in `public/data` with source URL, edition, licence, feature count, and checksum.
- MapLibre layers render in this order: basemap, region fill, region outline, hover/selected outline, marker hit targets, marker halos, marker symbols/labels.
- `regionId` is canonical. Polygon, marker, accessible list, search, and coordinate selection dispatch the same `selectRegion(regionId, source)` application operation.
- Polygon selection works across the complete visible polygon. Markers have larger hit targets than their symbols and remain visible at the national starting zoom.
- Basemap, region geometry, and marker data have independent load/error states. Pinned polygons, markers, list selection, and deterministic results continue if the external basemap fails.

### Deterministic domain

- Existing scenario normalization, calculations, five domain outcomes, and three presentation groups remain browser-local deterministic modules.
- AI/research responses are untrusted additions and cannot mutate scenario inputs, calculations, evidence authority/freshness, domain outcome, presentation group, or mandatory disclaimer.

### Same-origin provider API

- `GET /api/v1/providers/health` returns a sanitized public capability view only.
- `POST /api/v1/research` accepts a bounded research query plus selected public context IDs and returns sanitized cited candidates.
- `POST /api/v1/agent` accepts a bounded prompt, immutable deterministic context, and optional sanitized research results; it returns labelled analysis and citations.
- Request bodies have closed schemas, explicit byte/count limits, and no endpoint, key, arbitrary header, model override, HTTP method, URL, or tool fields.
- Upstream responses have size/time limits and are parsed into closed public schemas. Upstream URLs, raw errors, headers, secrets, and reasoning channels never cross the boundary.

### Configuration and secrets

- Local development reads the ignored `TEST.md` through Vite/Worker development configuration and creates in-memory Worker bindings. It never imports TEST data into client modules or build-time public constants.
- Hosted configuration uses Sites environment variables/secrets: model endpoint, API key, model ID, Tavily key, and optional MCP endpoint/credential.
- Client source and browser storage contain no provider credential/configuration. The former credential vault and connector form are removed.
- Health responses expose only provider class and `ready | limited | unavailable` capability state.

## Data ownership and flow

1. Browser loads pinned regions and prepared sites.
2. User selects a polygon, marker, list item, search result, or coordinate; one canonical region selection updates map and panels.
3. Browser computes and renders deterministic scenario/assessment results immediately.
4. If the user requests research, the browser sends only the bounded query and selected context to `/api/v1/research`; the Worker calls fixed Tavily/MCP destinations and returns sanitized candidates.
5. If the user requests analysis, the browser sends the prompt, immutable deterministic context, and optionally accepted research candidates to `/api/v1/agent`; the Worker calls the fixed model and returns public answer text/citations.
6. Provider failure changes only provider status/optional analysis. Deterministic state remains byte-identical.

## Security and privacy model

- Trust boundaries: untrusted browser input → trusted Worker validator → untrusted provider → trusted Worker sanitizer → untrusted labelled browser analysis.
- The Worker enforces same-origin browser access, closed JSON schemas, size/count/time/token limits, fixed upstream origins, fixed headers, no user redirects, bounded retries, and allowlisted read-only tools.
- The private hackathon deployment supplies the current access/abuse boundary. Public anonymous publication is blocked until durable rate limiting, cost controls, and abuse tests are added.
- Logs are metadata-only: public route, provider class, status class, stable error code, duration, correlation ID, and safe counters.
- No prompt, scenario body, source excerpt, provider endpoint, key, upstream body, stack trace, or reasoning trace is logged by default.

## Failure and recovery

| Failure | Public behavior | Recovery |
|---|---|---|
| Basemap unavailable | Pinned polygons/markers and list remain selectable | Retry basemap independently |
| Region asset invalid | Map reports geometry unavailable; list/deterministic scenario remains usable where stable IDs exist | Roll back the versioned asset/release |
| Marker asset invalid | Polygon/list selection remains usable; marker status is explicit | Roll back or refresh prepared marker pack |
| Provider configuration missing | Health is `unavailable`; no secret detail | Operator configures/rotates Sites secret |
| Model unavailable/invalid | Research and deterministic results remain; agent shows stable scoped error | Retry within bounds or operator rotates provider |
| Tavily/MCP unavailable | Model may explain prepared evidence; research state is unavailable | Retry within bounds or operator repairs connector |
| Invalid/oversized browser request | Reject before upstream call | User shortens/retries; client defect is test-blocking |
| Upstream oversized/malformed response | Discard/quarantine and return stable error | Operator inspection through secret-safe diagnostics |

## Observability

- Public health is sanitized and cacheable for a short bounded interval.
- Server metrics cover route count, schema rejection, timeout, upstream status class, sanitized parse failure, latency, and circuit-open state.
- Map diagnostics expose asset version/checksum, load state, feature/marker count, and selection source without recording precise user-created coordinates in default logs.

## Testing strategy

- Contract tests for every public route and closed schema.
- Security tests for arbitrary endpoints, headers, methods, models, tools, redirects, oversized bodies/responses, secret/error leakage, and reasoning-channel leakage.
- Integration tests with local mock model/Tavily/MCP servers and TEST-backed opt-in live smoke tests that print no values.
- Spatial tests verify all expected region IDs, polygon/marker/list parity, click interiors, boundary tie behavior, feature count/checksum, layer order, and basemap-failure fallback.
- Browser end-to-end tests verify visible markers, polygon click/tap selection, keyboard/list parity, deterministic result updates, zero credential UI, provider health, research, agent response, and provider-failure containment.

## Deployment, migration, and rollback

1. Add pinned regional geometry and prepared marker manifests.
2. Introduce same-origin provider routes and server-only adapters behind tests.
3. Switch the AI UI to the same-origin client and sanitized health status.
4. Remove browser credential vault and connector configuration UI after parity tests pass.
5. Configure ignored TEST-backed local bindings and encrypted hosted Sites secrets.
6. Build, exact-secret scan, deploy a new immutable private Sites version, and run hosted map/AI/Tavily smoke tests.
7. Roll back by redeploying the previous Sites version; rotate provider secrets separately without changing client code.

## Consequences and accepted risks

- Accepted: frontend and provider adapter share one release unit for the hackathon.
- Accepted: provider features are optional and bounded by Worker/provider time limits.
- Required before public anonymous access: durable rate limiting, spend budgets, and abuse monitoring.
- Rejected: browser-bundled keys, browser-stored provider secrets, user-supplied endpoints, arbitrary proxying, arbitrary MCP discovery/actions, and AI authority over deterministic outputs.

## Evolution path

If sustained traffic, asynchronous research, or organizational audit/storage becomes necessary, the provider adapter may move to a separate service while preserving `/api/v1/providers/health`, `/api/v1/research`, and `/api/v1/agent` as the browser-facing contract.

## v0.13 interaction-amendment compatibility

The approved scenario-first regional workflow is implemented wholly inside the existing browser UI/state boundary. It adds no service, storage, data ownership, trust, deployment, or public API boundary. The deterministic evaluator continues to calculate from typed scenario input and the same prepared candidate record; only result access, transition state, and reader-facing terminology change. Option A therefore remains the selected architecture without a topology alternative.
