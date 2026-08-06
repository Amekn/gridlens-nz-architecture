# GridLens NZ — Design 1 architecture options

**Artifact version:** 0.3 draft
**Status:** Gate 2 decision packet
**Approved baseline:** Requirements 0.4 and Usage Definition 0.4
**Target:** OpenAI Sites, browser-first, whole New Zealand
**Prepared:** 2026-08-06 (Pacific/Auckland)

## Decision context

GridLens NZ must combine four unusually different concerns without weakening the approved trust model:

1. fast, deterministic engineering calculations and evidence-gated assessments;
2. a whole-NZ Map Explorer and document-like Project Case File over a versioned evidence graph;
3. user-configured OpenAI-compatible and Tavily/MCP research from the browser, with credentials retained locally after successful use; and
4. reproducible prepared public data, including an EMI node-to-region pipeline, while runtime calls remain limited to CORS-compatible endpoints.

The choice is not whether to add an application backend. Requirements v0.4 explicitly exclude an application-owned credential relay, user database, and hidden proxy in Design 1. The architectural choice is how strongly to partition execution and local data inside the browser.

## Fixed constraints shared by every viable option

- All implementation stays under `design-1-browser-first/` and uses the Sites capability path with Cloudflare Worker-compatible ESM output.
- The required product works anonymously and without AI, MCP, live feeds, or a network after its core assets have been cached.
- Deterministic formulas, simulations, assessment policies, origin/freshness states, and required brief statements never execute in or defer to an LLM.
- User credentials and prompts never pass through a GridLens application server. Browser requests go directly to an explicitly configured CORS-compatible HTTPS destination; provider-side remote MCP remains possible.
- Non-CORS or bulk sources are ingested by a reproducible release-time data pipeline. Report-page HTML is not a data contract.
- The model produces typed, cited analysis and a bounded visual specification, never executable HTML, JavaScript, CSS, formulas, or arbitrary URLs.
- Browser storage is same-device convenience, not an OS keychain, backup, identity system, or cloud collaboration surface.
- Map/list and chart/table/text equivalents are architectural peers, not later accessibility patches.

## Shared logical capabilities

All options need the following capabilities even when their physical placement differs:

| Capability | Responsibility |
|---|---|
| Product shell | Routes, responsive UI, audience/lens controls, prompt workspace, consent/privacy disclosures, accessibility. |
| Application coordinator | Operation IDs, immutable request generations, cancellation, state transitions, result snapshots, comparison orchestration. |
| Deterministic domain | Validation, units, formulas, minimax flexibility, assessment policy, site-screening rules, reproducibility manifests. |
| Spatial and evidence domain | Stats geometry resolution, typed evidence graph, project cases, timeline/conflict/community queries, source coverage/freshness. |
| Map and trusted visual renderers | MapLibre-backed map plus accessible list; app-owned chart/table/panel renderers over validated data bindings. |
| Connector subsystem | Custom endpoint capability tests, Responses/Chat dialects, streaming, bounded agent/tool loop, remote MCP and Tavily REST routes. |
| Credential vault | Separate connector configuration and secret records, masking, replace/clear controls, session-only option, best-effort local encryption. |
| Local repositories | Scenarios, snapshots/comparisons, connector configuration, credentials, research cache, optional prompt history, migrations and tombstones. |
| Prepared-data compiler | Source registry, downloads, checksums, document extraction, EMI aggregation/spatial mapping, schemas, content-addressed data packs. |
| Offline/update layer | Atomic shell/data-pack versions, core-demo caching, stale/update signaling, rollback-compatible assets. |
| Diagnostics | Allowlisted non-sensitive categories, component/version/correlation/timing only; no keys, prompts, document bodies, or scenarios. |

## Evaluation criteria

Scores use 1 (poor) to 5 (excellent) against the same approved scope. Weighted totals are directional design evidence, not a hidden product/site score.

| Criterion | Weight | What it measures |
|---|---:|---|
| Deterministic correctness and trust separation | 20% | Ability to prevent untrusted data/AI/network output from mutating authoritative results. |
| Privacy and connector security | 16% | Credential isolation, data minimisation, CORS-only direct calls, prompt/tool abuse containment. |
| Hackathon delivery confidence | 16% | Likelihood of completing and demonstrating the full approved scope on time. |
| Whole-NZ map/data performance | 12% | UI responsiveness, evidence graph queries, spatial work, visual generation, bounded memory. |
| Failure and offline resilience | 12% | Scoped failures, cancellation, atomic updates, prepared-data availability without AI/live services. |
| Testability and maintainability | 10% | Contract clarity, deterministic tests, fault injection, comprehensible module ownership. |
| Portability and evolution | 8% | Ability to add sources, models, richer cases, or later server services without a rewrite. |
| Operational cost and simplicity | 6% | Hosting/runtime cost, release operations, dependency burden. |

## Option A — Worker-separated browser platform

### Summary

Use a Sites React/TypeScript shell on the main thread, one deterministic analysis/evidence Web Worker, and one network/agent Web Worker. Communicate only through versioned, schema-validated messages with operation IDs and cancellation generations. Keep rendering on the main thread; keep formulas, evidence queries, spatial rules, and site screening in the deterministic worker; keep keys and remote I/O out of ordinary UI state in the connector worker.

```text
                     OpenAI Sites deployment
┌─────────────────────────────────────────────────────────────────────┐
│ React product shell                                                 │
│ Map Explorer · Case File · Scenario · Compare · Brief · A11y views  │
│           │ validated commands                 │ trusted view models │
│           ▼                                    ▲                    │
│ Application coordinator ─────────────── Trusted renderers            │
│       │                         │            MapLibre/charts/tables   │
│       │ typed messages          │ typed connector operations         │
│       ▼                         ▼                                    │
│ Analysis/evidence Worker     Connector/agent Worker                  │
│ calc · minimax · policy      capability probe · model · MCP/REST     │
│ geometry · graph · screening credential vault · bounded tool loop   │
│       │                         │ direct HTTPS+CORS                   │
│       ▼                         ├──────────────► model endpoint       │
│ prepared data packs           └──────────────► MCP/Tavily/live APIs  │
│       │                                                              │
│ IndexedDB repositories · CacheStorage/service worker                 │
└───────┼──────────────────────────────────────────────────────────────┘
        ▲
 release-time data compiler ─ official/public raw sources + documents
```

### Boundaries and ownership

- **Main thread:** DOM, MapLibre canvas, keyboard/list equivalence, trusted component rendering, user confirmations, route and selection state. It never stores raw keys in a global UI store.
- **Analysis/evidence worker:** owns normalized scenario validation, calculations, assessment, result fingerprints, evidence graph indexes, spatial queries, candidate screening, and visual-spec validation/resolution. It has no connector credentials and makes no arbitrary remote calls.
- **Connector/agent worker:** owns transient secret use, capability probes, outbound allowlist enforcement, model streaming, bounded research/tool orchestration, citation validation, and research-cache writes. It receives immutable context projections, never mutable domain objects.
- **IndexedDB:** separate stores and transactions for scenarios, immutable snapshots, comparisons, connector configuration, credential ciphertext/key handle, evidence/research cache, optional prompt history, operations/tombstones, schema metadata, and quarantine.
- **CacheStorage/service worker:** caches only immutable application/data-pack assets. It never caches credential-bearing requests or model/MCP responses.
- **Prepared-data compiler:** a Node release tool, not a runtime service. It produces content-integrity manifests with checksums and compact immutable packs; raw bulk inputs remain outside the deployed bundle.

### Data and consistency model

- Every public message and stored record has `schemaVersion`, stable ID, revision where mutable, and explicit error variant.
- Analysis operations use immutable input/evidence snapshots and generation IDs. Late worker/network results cannot update a newer selection.
- Prepared data is content-addressed and activated as one compatible release manifest. The service worker never mixes shell and pack generations.
- Results are immutable. A changed scenario creates a new result; comparison references snapshot IDs.
- Evidence records remain normalized and typed. Runtime research is `candidate` or `AI interpretation` until a deterministic registry/policy explicitly recognizes it; it cannot silently satisfy an assessment gate.

### Security and privacy

- Strict CSP for scripts, frames, objects, base URI, and same-origin assets; `connect-src` must permit HTTPS custom endpoints, so an application-level exact-origin connector allowlist is mandatory and the residual CSP limitation is disclosed.
- Self-host runtime dependencies; no analytics or third-party scripts in the trusted UI origin.
- Credentials are stored in a dedicated record after first successful use. Best-effort AES-GCM with a non-extractable origin-local Web Crypto key reduces casual at-rest exposure, but does not claim protection from a compromised same-origin script; session-only mode remains available.
- Model/MCP destinations, selected context, retention uncertainty, and cancellation/clear controls are shown before use. Key-bearing URLs are sanitized as secrets.
- Both workers validate every message. Remote content is inert and cannot call tools, issue UI commands, mutate result records, or bind a visual to unknown data.

### Failure, observability, and recovery

- A worker crash is restarted and the last immutable command may be retried by operation ID; active deterministic UI state remains visible.
- A failed source, model stream, MCP call, or generated visual affects only that operation. Deterministic views and brief remain complete.
- IndexedDB writes are transactional with compare-and-swap revisions, stable operation IDs, monotonic tombstones, sequential migrations, and per-record quarantine.
- Core app/demo packs are precached; other regional/case packs are cache-on-use with visible coverage/offline state.
- Diagnostics contain allowlisted categories and timings only. Local diagnostic export is sanitized; telemetry is off by default.

### Build, testing, deployment, and evolution

- Sites capability-path project using the bundled vinext/Vite structure and Worker-compatible ESM.
- Unit/property tests target pure worker modules. Contract tests validate every message/schema/store/data pack. Integration tests run workers and IndexedDB in a browser environment. End-to-end tests cover map/case/agent/visual/offline/update journeys.
- Static data compiler tests include schemas, checksums, licences, source coverage, EMI DST/unit/spatial fixtures, and document page references.
- Later application services can consume the same versioned contracts, but Design 1 does not deploy them.

### Costs and weak points

- More initial coordination and worker-contract work than an ordinary SPA.
- Debugging cross-worker streams/cancellation is harder.
- Map rendering remains main-thread work, so geometry/feature budgets and layer throttling are still required.
- Local encryption is defense in depth, not an OS keychain or XSS remedy.

## Option B — In-process modular SPA

### Summary

Run the product shell, deterministic domain, evidence graph, connector orchestration, and persistence adapters in one browser JavaScript realm. Use strong TypeScript module boundaries and immutable stores, but no dedicated workers except the service worker.

```text
Sites React SPA
  ├─ UI + MapLibre + trusted visuals
  ├─ application/domain/evidence modules
  ├─ connector/model/MCP modules
  ├─ IndexedDB/Web Crypto
  └─ service worker + prepared packs
```

### Strengths

- Fastest architecture to implement and easiest to debug during a hackathon.
- No worker serialization/stream protocol; ordinary function-level unit tests cover most logic.
- Direct access to shared immutable records simplifies map, case-file, and prompt-context coordination.
- Lowest runtime/dependency overhead and simplest Sites bundle.

### Weaknesses and failure implications

- Large evidence/spatial queries, bundle validation, AI stream parsing, and visual resolution can contend with map/UI rendering unless every task is carefully chunked.
- Secret-handling, untrusted connector output, deterministic state, and UI state share one realm. Module discipline prevents accidental access but provides less fault/isolation evidence.
- A runaway parsing/query operation can freeze the complete app rather than one subsystem.
- Cancellation and obsolete-generation protection must be implemented consistently across ordinary async functions; missed checks are easier.
- Scaling from three demo projects to richer national evidence risks a later worker retrofit and contract churn.

### Operations, testing, and evolution

- Same prepared-data compiler, schemas, repositories, direct connectors, CSP limits, and service-worker strategy as Option A.
- Browser integration tests must compensate for weaker physical boundaries with stronger mutation, race, blocking-duration, and secret-leak assertions.
- Suitable if the demo scope is intentionally kept small or delivery time becomes the dominant constraint.

## Option C — Offline analytical-database PWA

### Summary

Package the product as an offline-first PWA with a browser-local SQLite-compatible/WASM analytical database in a worker. Load project, evidence-graph, source, time-series, and spatial indexes into relational tables; express case-file, map, comparison, and evidence queries through a repository/query layer. Keep connectors in a separate worker and the deterministic formulas in pure TypeScript or database functions.

```text
Sites PWA shell
  ├─ UI + MapLibre + trusted visuals
  ├─ application coordinator
  ├─ analytical DB worker (projects/evidence/time series/spatial indexes)
  ├─ connector/agent worker + credential vault
  └─ service worker + versioned database/data-pack migrations
```

### Strengths

- Strong fit for a growing evidence graph, full-text project/document search, large time series, ad-hoc filters, and offline case research.
- Query plans and transactions provide a clear path to many more projects and richer national evidence.
- Worker-hosted database protects UI responsiveness and supports reproducible snapshots.
- Closest client-only analogue to a future server database, easing data-model migration.

### Weaknesses and failure implications

- WASM/database initialization, cross-origin isolation requirements where applicable, asset size, browser storage behavior, and migration/recovery add substantial delivery risk.
- Spatial extensions and full-text support vary by browser build and increase the supply-chain surface.
- A database is unnecessary for the bounded calculation arrays and three-project hackathon demo; much work would serve future scale rather than current acceptance.
- Corrupt/mismatched local database versions need more complex backup/rebuild behavior than immutable JSON packs plus per-record IndexedDB stores.
- Clean Sites/PWA packaging, offline upgrades, and mobile memory limits require feasibility work before implementation.

### Operations, testing, and evolution

- Requires database schema/migration artifacts, clean-install and upgrade tests, query-budget tests, and package/license review beyond the other options.
- Best only if offline research over hundreds of projects or very large user-imported evidence becomes a near-term requirement.

## Weighted comparison

| Criterion | Weight | Option A: worker-separated | Option B: in-process | Option C: analytical PWA |
|---|---:|---:|---:|---:|
| Deterministic correctness and trust separation | 20 | 5.0 | 4.0 | 4.5 |
| Privacy and connector security | 16 | 4.5 | 4.0 | 4.0 |
| Hackathon delivery confidence | 16 | 4.0 | 5.0 | 2.5 |
| Whole-NZ map/data performance | 12 | 4.5 | 3.5 | 4.5 |
| Failure and offline resilience | 12 | 4.5 | 3.5 | 5.0 |
| Testability and maintainability | 10 | 4.5 | 3.5 | 3.0 |
| Portability and evolution | 8 | 4.0 | 3.5 | 4.5 |
| Operational cost and simplicity | 6 | 4.5 | 5.0 | 3.5 |
| **Weighted total / 100** | **100** | **89.6** | **80.2** | **79.0** |

## Recommendation

Select **Option A: Worker-separated browser platform**.

It preserves the short-path operating model of a static browser application while establishing enforceable boundaries around the two highest-risk areas: deterministic authority and user-supplied remote connectors. It also keeps expensive evidence/spatial work away from MapLibre and interactive UI without paying the database/migration cost of Option C.

The implementation should remain pragmatic: one analysis/evidence worker and one connector/agent worker, not a micro-worker fleet. The worker protocol, data packs, storage records, and visual grammar become the principal contracts for Phase 4.

## Conditions that would change the recommendation

- Choose **Option B** if the approved demo is reduced to a small fixed dataset and schedule risk becomes more important than worker isolation/performance.
- Choose **Option C** if near-term scope adds hundreds of deep case files, offline full-text research, large user imports, or browser-side analytical querying that immutable packs cannot meet.
- Reopen requirements and consider a server architecture if scope adds user accounts, shared links, central audit retention, public submissions, server-side secrets, non-CORS runtime proxying, or authoritative live ingestion. None is approved for Design 1.

## Gate 2 decision request

The proposed selection is Option A as specified in `04-selected-architecture.md` version 0.3 draft. Gate 2 approval accepts its topology, data ownership, trust boundaries, direct-connector model, offline/data-pack strategy, local credential/persistence consequences, and deployment model. It does not yet approve low-level schemas or implementation; those require Phase 4 artifacts and independent Gate 3 validation.
