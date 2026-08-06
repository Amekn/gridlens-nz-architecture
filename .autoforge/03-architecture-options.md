# GridLens NZ — Architecture options for the working prototype

**Artifact version:** 0.4 draft
**Status:** Awaiting Gate 2 selection
**Requirements baseline:** `01-requirements.md` v0.5 approved and `02-usage-definition.md` v0.5 approved
**Target:** Existing OpenAI Sites / Cloudflare Worker deployment

## Decision to make

Choose where operator-managed OpenAI-compatible, Tavily, and optional MCP credentials live and how the browser reaches those services. Every option keeps deterministic calculations authoritative and upgrades the map to use pinned selectable regional geometry.

## Shared map architecture

All options use the same map design because it is independent of credential topology.

- A versioned Stats NZ regional-council GeoJSON asset is prepared at build time, simplified for browser use, checksummed, attributed, and shipped with the site. Region selection therefore does not depend on a live third-party API or basemap.
- MapLibre renders ordered layers: muted basemap, regional fill, regional outline, selection/hover outline, candidate-site halos, and candidate-site symbols.
- `regionId` is the canonical selection key. Polygon click/tap, marker activation, accessible list, search, and coordinate resolution all call one selection operation.
- Region fills remain clickable across their full area. Candidate markers have a larger invisible hit layer than their visible symbol and remain visible at the national starting zoom; overlaps use deterministic displacement or clustering.
- Basemap, geometry, and marker loading have separate visible states. A basemap failure retains polygons, markers, list selection, and deterministic analysis.
- Keyboard/list selection is feature-equivalent. Focus, hover, and selected states use outline/shape/text in addition to colour.

## Option A — Integrated Sites Worker adapter (recommended)

### Topology

```text
Browser UI
  ├─ pinned region GeoJSON + prepared site/evidence data
  ├─ deterministic scenario and assessment modules
  └─ same-origin /api/v1/* calls
                  │
OpenAI Sites Cloudflare Worker
  ├─ /api/v1/providers/health
  ├─ /api/v1/research
  └─ /api/v1/agent
        ├─ fixed OpenAI-compatible upstream
        ├─ fixed Tavily upstream
        └─ optional fixed read-only MCP upstream
```

### Boundaries and ownership

- The browser owns presentation, map state, device-local scenarios/preferences, and deterministic calculation inputs/results.
- The Worker owns provider configuration, secrets, upstream allowlists, request validation, budgets, timeout/cancellation propagation, and response sanitisation.
- Provider secrets are Cloudflare/Sites environment secrets in hosted deployments. Local development parses ignored `TEST.md` into development-only Worker bindings; raw values are never emitted to the browser or build.
- The Worker is not an arbitrary proxy: route, upstream origin, model, method, headers, and MCP tools are fixed by operator configuration and code policy.

### Public contracts

- `GET /api/v1/providers/health` returns only `ready | limited | unavailable`, supported public capabilities, and a non-secret provider-class label.
- `POST /api/v1/research` accepts a bounded query plus active region/scenario IDs and returns sanitized evidence candidates with title, URL, excerpt, retrieval time, and source class.
- `POST /api/v1/agent` accepts a bounded prompt and immutable deterministic context; it may use sanitized research results and returns labelled analysis plus citations. It cannot accept an endpoint, key, arbitrary header, model override, or tool name.
- Every error uses a stable public code and correlation ID; upstream bodies, endpoints, keys, and stack traces remain server-only.

### Security and privacy

- Same-origin browser calls eliminate user-facing CORS configuration and keep credentials out of the browser.
- Request schemas reject unknown fields, oversized prompt/context, private URLs, arbitrary tools, and prototype-polluting values.
- Outbound requests use fixed HTTPS origins, no user-controlled redirects, allowlisted headers, explicit timeouts, response-size ceilings, and bounded retries.
- The owner-only hackathon deployment provides the immediate abuse boundary. A later public launch must add durable rate limiting/budget enforcement before public access is enabled.
- Logs contain only route, stable error category, timing, status class, provider class, and correlation ID.

### Failure handling and observability

- Provider health never gates the map or deterministic assessment.
- Model failure can still return cited research; research failure can still return model-only interpretation of prepared evidence; both failing leaves deterministic results intact.
- Health, latency, timeout, schema rejection, upstream status class, and circuit-open counters are observable without prompt or secret content.

### Build, deployment, migration, and rollback

- Keep the existing single Sites project and Worker entry point.
- Replace the browser credential vault and connector modal with a sanitized provider-status surface.
- Add server provider adapters and versioned same-origin routes; keep D1/R2 null.
- Configure local development from `TEST.md`; store corresponding hosted values with Sites environment secrets.
- One source commit, one build/archive, one Sites version, and one private deployment remain the rollback unit.

### Cost, complexity, and evolution

- Lowest delivery and operational complexity; one deployment and no separate service.
- Cloudflare Worker request/runtime limits and owner-only access are suitable for the hackathon prototype.
- Can later extract the provider adapter behind the unchanged browser route contract if traffic or governance requires it.

### Weaknesses

- AI and frontend releases are coupled.
- A public launch needs stronger durable abuse/rate controls.
- Provider-specific streaming and long-running research must fit Worker limits or become asynchronous later.

## Option B — Separate provider API service

### Topology

The Sites application remains map/deterministic UI only. A separately deployed API service owns provider secrets, `/health`, `/research`, and `/agent`; the browser calls that service over a tightly configured CORS contract.

### Strengths

- Independent scaling, deployments, logs, rate limits, queues, and provider lifecycle.
- Easier to add asynchronous research, organization accounts, audit storage, or multiple applications later.
- Provider incidents can be rolled back without rebuilding the site.

### Weaknesses

- Two deployments, two release/rollback paths, CORS configuration, extra DNS/TLS, and more operational failure modes.
- Higher delivery effort and a materially larger attack/maintenance surface for a three-hour hackathon milestone.
- Requires an additional hosting/provider decision and may no longer be a self-contained Sites deliverable.

### Best fit

A post-hackathon public service with sustained traffic, durable rate limiting, background jobs, audit requirements, or multiple client applications.

## Option C — Short-lived browser credentials through a token broker

### Topology

A small same-origin broker holds long-lived operator secrets and attempts to mint short-lived, scoped provider credentials. The browser then calls OpenAI-compatible/Tavily/MCP providers directly with those ephemeral credentials.

### Strengths

- Direct provider streaming and lower proxy bandwidth.
- Long-lived operator keys remain server-only when every provider supports genuinely scoped, short-lived tokens.
- Provider traffic can bypass Worker execution limits after token issuance.

### Weaknesses

- The configured llama-server and Tavily paths do not provide one common ephemeral-token contract, so this would require custom credential translation or provider changes.
- Short-lived tokens are still exposed to browser script and extension risk during their lifetime.
- CORS and provider-specific client behavior return to the product surface.
- More complex than Option A while failing the current zero-technical-configuration goal for unsupported providers.

### Best fit

A future provider stack that natively supports narrowly scoped ephemeral client tokens across model and research services.

## Weighted comparison

Scores are 1 (poor) to 5 (strong). Weighted total is out of 500.

| Criterion | Weight | A: Integrated Worker | B: Separate API | C: Token broker |
|---|---:|---:|---:|---:|
| Meets zero-credential/security requirements now | 30 | 5 | 5 | 2 |
| Working-prototype delivery speed | 25 | 5 | 2 | 1 |
| Map/deterministic failure isolation | 15 | 5 | 5 | 4 |
| Maintainability and testability | 15 | 4 | 4 | 2 |
| Future scale and operational control | 10 | 3 | 5 | 3 |
| Cost and deployment simplicity | 5 | 5 | 2 | 3 |
| **Weighted total** | **100** | **465** | **380** | **225** |

## Recommendation

Select **Option A: Integrated Sites Worker adapter** for the hackathon and near-production prototype.

It directly satisfies the approved user journey, keeps all long-lived credentials server-only, requires no user configuration, preserves one deployable Sites application, and leaves the deterministic/map workflow independent of provider availability. Its browser API contract is deliberately shaped so the provider adapter can move to Option B later without rewriting the UI.

The condition that would change this recommendation is a commitment to immediate public anonymous traffic or long-running asynchronous research. Either would justify Option B and durable platform rate limiting/queues before release.

## Gate 2 decision

The user must select Option A, B, or C. No production implementation or secret migration begins until Gate 2 is explicitly approved.
