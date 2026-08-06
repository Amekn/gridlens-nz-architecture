# GridLens NZ — Selected architecture

**Artifact version:** 0.3 approved
**Status:** Approved at Gate 2
**Approved baseline:** Requirements 0.4 and Usage Definition 0.4
**Decision source:** `03-architecture-options.md` version 0.3 draft
**Approval evidence:** User message, “Approve Gate 2 architecture v0.3 (Option A)”
**Target:** OpenAI Sites capability-path deployment

## Decision

Adopt the **worker-separated browser platform** for Design 1.

GridLens NZ will be a React/TypeScript Sites application whose required product logic and local data remain in the browser. A deterministic analysis/evidence Web Worker owns calculations, assessment, spatial rules, evidence-graph queries, site screening, and visual-spec resolution. A separate connector/agent Web Worker owns user-configured model/MCP/Tavily calls and transient secret use. The main thread owns the trusted interface, MapLibre map, accessible equivalents, and rendering.

A release-time Node data compiler obtains, validates, transforms, aggregates, and packages official/public data and prepared project documents into immutable content-addressed assets. It is not a runtime backend. Design 1 deploys no application database, user authentication, credential relay, secret-bearing server function, or hidden data proxy.

## Architectural outcomes

- Deterministic results render without waiting for any remote request.
- AI/network failures cannot mutate or suppress authoritative results.
- Whole-NZ data and deep case records are bounded, versioned, lazy-loadable, cacheable, and reproducible.
- Keys survive refresh only on the current origin/device, remain outside ordinary UI state, and are never sent through GridLens infrastructure.
- Remote facts remain cited candidate evidence or AI interpretation unless deterministic source/policy logic recognizes them.
- Dynamic visuals use trusted components bound to known data IDs; model-authored executable content has no rendering path.
- Core app, national map/catalog, three demonstration records, one deep case, and deterministic brief remain available after caching even when AI/live services are unavailable.

## Deployment and execution topology

```text
Release/build environment
┌───────────────────────────────────────────────────────────────────────┐
│ Data compiler                                                         │
│ source registry → fetch/checksum → schema/unit/spatial transforms     │
│ → EMI rolling aggregate → document/page extraction → evidence graph  │
│ → licence/coverage reports → immutable data-pack manifest             │
└───────────────────────────────┬───────────────────────────────────────┘
                                │ static, content-addressed assets
                                ▼
OpenAI Sites / CDN / Worker-compatible ESM deployment
┌───────────────────────────────────────────────────────────────────────┐
│ Product shell (main thread)                                           │
│ routes · MapLibre · accessible list · case components · prompt UI     │
│ trusted visual/report renderers · disclosures · update UI             │
│           │ validated commands                     ▲ view models      │
│           ▼                                        │                  │
│ Application coordinator ───── immutable snapshots/generation IDs      │
│       │                                     │                         │
│       ▼                                     ▼                         │
│ Analysis/evidence Worker             Connector/agent Worker           │
│ validation · units · calculations    vault · capability tests         │
│ minimax · assessment · geometry      Responses/Chat streaming         │
│ evidence graph · site screening      remote MCP/Tavily · citations    │
│ visual grammar validation            bounded tool loop                │
│       │                                     │                         │
│       ▼                                     │ direct HTTPS + CORS      │
│ immutable data packs                       ├────► custom model         │
│                                             ├────► Tavily/MCP          │
│ IndexedDB stores ◄──────────────────────────└────► enabled live APIs   │
│ CacheStorage + versioned service worker                                │
└───────────────────────────────────────────────────────────────────────┘
```

## Components and responsibilities

| ID | Component | Owns | Must not own |
|---|---|---|---|
| CMP-SHELL-01 | Sites product shell | Routes, application metadata, CSP/security headers, service-worker registration, first-run and update experience. | User secrets, authoritative calculations, evidence promotion. |
| CMP-UI-01 | Trusted interface | Map Explorer, Case File, scenario editor, compare tray, audience/lens controls, prompt/connection UI, accessible list/table/text equivalents. | Formula or policy reimplementation, raw HTML rendering, secret read-back. |
| CMP-APP-01 | Application coordinator | Typed commands, navigation state, operation IDs, immutable generations, cancellation, result/case/compare selection. | Domain arithmetic, direct fetch, credential bytes. |
| CMP-MAP-01 | Map adapter | MapLibre lifecycle, bounded GeoJSON/vector layers, source/version legend, hit testing, selection events. | Region truth, nearest-region guesses, suitability inference. |
| CMP-ANL-01 | Analysis/evidence worker | All pure/authoritative operations and read-only indexes over prepared data. | Connector credentials, arbitrary network access, DOM. |
| MOD-VAL-01 | Validation and units module | Normalization, unit conversions, trusted origin proofs, error taxonomy. | UI-origin labels or model assertions as trust. |
| MOD-CAL-01 | Calculation module | Facility MW, annual energy, flexible bound, water ranges, calculation traces. | Evidence inference or model calls. |
| MOD-FLX-01 | Flexibility module | Deterministic same-day minimax simulation, constraints, movement ledger, invariant checks. | Greedy fallback presented as optimum. |
| MOD-ASM-01 | Assessment module | Five category outcomes, evidence gates, reason IDs, overall precedence. | Overall numeric score, consent/recommendation language. |
| MOD-GEO-01 | Spatial module | Stats point-in-polygon, border tie rule, EPSG transformations used at build/runtime where approved, contextual layer joins. | Nearest substitution, parcel/capacity claims. |
| MOD-EVD-01 | Evidence graph module | Records/edges/indexes, freshness, coverage, conflict/supersession, case/timeline/community queries. | Silent source overwrite or AI promotion. |
| MOD-SITE-01 | Site-screening module | Confirmed profile validation, deterministic exclusion/classification/order, sensitivity and reasons. | Hidden weights or objective best-site output. |
| MOD-VIS-01 | Visual grammar module | Validate AI visual specs, resolve known data bindings, enforce row/mark/series bounds, produce trusted view models. | HTML, scripts, expressions, unapproved URLs or code. |
| CMP-AGT-01 | Connector/agent worker | Connector capability matrix, outbound policy, model stream, bounded tool loop, MCP/Tavily/live adapters, citation/schema checks. | Mutation of domain results, evidence authority, UI commands. |
| CMP-VLT-01 | Credential vault | Session/persistent modes, masked metadata, best-effort encryption, replace/clear, key-bearing URL redaction. | Raw-key export, logs, prompt history, scenario storage. |
| CMP-DB-01 | Local repository | Separate IndexedDB stores, transactions, revisions, operation IDs, tombstones, migrations, quarantine, cache expiry. | Cloud sync, identity, silent conflict resolution. |
| CMP-PACK-01 | Data-pack loader | Manifest/schema/checksum validation, dependency activation, lazy load, in-memory indexes, coverage status. | Partial activation of an incompatible pack set. |
| CMP-OFF-01 | Offline/update manager | Shell/core-pack precache, cache-on-use packs, atomic release versions, update prompt and cache cleanup. | Credential/model response caching. |
| CMP-RPT-01 | Deterministic brief composer | Technical/plain-language statements, facts/units/outcomes/sources/disclaimer, copied Markdown/text. | Free-form model facts in required sections. |
| CMP-OBS-01 | Diagnostics | Allowlisted error class, component/version, correlation ID, status class, timing, local sanitized export. | Keys, sensitive URLs, prompts, documents, scenarios, response bodies. |
| PIPE-DATA-01 | Release-time data compiler | Registered-source ingestion, licences, raw manifests, EMI processing, project/document extraction, graph/data packs, validation reports. | Runtime user data, server availability, undocumented scraping. |

## Principal public contracts

Phase 4 will freeze exact schemas. Architecture fixes these contract families and ownership:

| Contract family | Producer | Consumers | Version/failure rule |
|---|---|---|---|
| `AppCommand` / `AppEvent` | UI/coordinator | Coordinator, workers, UI | Discriminated JSON-compatible messages; unknown version/type rejected. |
| `ScenarioInput` / `OriginProof` | Validation module | Calculation, assessment, report | UI/restored claims never self-assign trusted origin. |
| `ResultSnapshot` / `ReproducibilityManifest` | Analysis worker | UI, compare, report, agent context | Immutable and fingerprinted; complete/insufficient/failed variants retain constituent versions. |
| `EvidenceRecord` / `EvidenceEdge` / `EvidenceSnapshot` | Data compiler and evidence module | Case, assessment, agent context, report | Typed provenance/authority/freshness; conflicts retained; runtime candidates cannot auto-promote. |
| `ProjectCase` / `ProjectEvent` / `CommunityRecord` | Data compiler/evidence module | Map sheet, Case File, report | Exact source/page references or explicit unavailable locator. |
| `DataPackManifest` / `SourceRegistry` | Data compiler | Pack loader, service worker, release QA | Content hashes and compatible schema/version graph; atomic activation only. |
| `ConnectorConfig` / `CapabilityMatrix` | Connector UI/worker | Agent coordinator | Sanitized origin/label only outside vault; unsupported capabilities disable dependent actions. |
| `AgentRequest` / `AgentResult` | Coordinator/connector worker | Model/tool adapters, UI, research cache | Immutable generation, selected-context manifest, bounds, citations; late/malformed result rejected. |
| `VisualSpec` / `ResolvedVisualModel` | Model then visual module | Trusted renderer | Model spec is untrusted; unknown binding/primitive/transformation fails closed. |
| `StoredRecordEnvelope` / `StorageOperation` | Local repository | All local stores | Transactional revision/tombstone/idempotency/migration semantics. |
| `DiagnosticEvent` | All components | Local diagnostics UI/export | Strict allowlist and size bounds; unknown/sensitive fields rejected. |

## Data ownership and lifecycle

### Prepared public data

`PIPE-DATA-01` creates immutable packs rather than one monolithic national file:

- deployment/source registry and compatibility manifest;
- simplified Stats NZ region geometry and accessible region index;
- searchable place/project catalog and layer metadata;
- regional/context packs for electricity, environment, hazards, population, and other enabled sources;
- compact rolling-12-month EMI node/region series and its coverage/exclusion ledger;
- project case packs containing entities, claims, documents, page references, timeline events, community records, comparables, edges, and evidence counts;
- factors, thresholds, profiles, assessment/freshness policies, and deterministic statement templates.

Every pack records schema and semantic version, content hash, source URLs/resource IDs, ETag/last-modified when available, publisher, licence/attribution, retrieval/observation interval, transformations, coverage, exclusions, dependencies, and compatible application versions. The deployment contains compact derived assets and manifests, not the latest year of raw multi-gigabyte EMI files.

### Runtime and user data

Mutable user records live only in IndexedDB and are separated by store. Credential secrets are never embedded in connector configuration. Prompt history is off by default and independently clearable. Research cache retains cited typed outputs and original retrieval times; it never changes an immutable result snapshot. Local cache/storage failure leaves the current in-memory scenario and deterministic result visible.

### Evidence authority

Prepared records receive type/authority only from the registered data compiler and deterministic policies. Runtime adapters preserve publisher/source metadata, but web/model results enter as discovery candidates, web discourse, source extracts, or AI interpretations. They may be shown and cited; they cannot satisfy low-concern gates unless a future approved policy explicitly and deterministically admits that source/field/version.

## Core control flows

### 1. Start, validate, and recover offline

1. Shell loads the release manifest and core national/catalog/demo pack set.
2. Pack loader validates schema, hashes, dependencies, IDs, geometry compatibility, and source metadata before activation.
3. Service worker serves only one complete shell/pack generation. A newer generation downloads separately and prompts reload.
4. If the network is unavailable, the last validated cached generation opens. Missing cache packs are marked unavailable without affecting cached functions.
5. Corrupt/incompatible core assets fail closed with a recovery/refresh path; no nearest geometry or unvalidated stale mix is used.

### 2. Explore map and open a case

1. UI sends search/filter/viewport intent to the coordinator.
2. Evidence worker returns bounded project/place/layer view models and coverage metadata.
3. Map adapter renders only validated geometries/features; accessible list renders the same IDs and states.
4. Selection opens the project sheet. Case navigation lazy-loads and atomically validates the project pack.
5. Case File uses trusted components over graph queries for overview, timeline, discrepancies, People/Planet, community, company/comparables, evidence, and missing questions.

### 3. Analyse a scenario

1. Validation normalizes input and assigns origin proofs from the active UI action/preset/evidence reference.
2. Calculation and flexibility modules return exact values, traces, constraint ledger, and per-result status.
3. Evidence module selects a pinned evidence snapshot and evaluates freshness/coverage/conflicts at the result `as-of`.
4. Assessment module produces category outcomes/reasons and overall precedence.
5. Worker freezes a fingerprinted `ResultSnapshot` and manifest. UI renders it immediately.
6. Optional live/agent enrichment creates separate cited records and never edits the snapshot.

### 4. Ask the agent or conduct research

1. User chooses current context and sees destination/privacy disclosure.
2. Coordinator creates a bounded immutable context projection; no unrelated saves or secret values are included.
3. Connector worker resolves the connector by ID inside the vault and selects its tested dialect/tool route.
4. It calls the configured endpoint directly. Remote MCP may be delegated to a capable model endpoint; otherwise an approved direct CORS MCP/REST adapter can participate in a bounded application tool loop.
5. Every tool result is inert, typed, cited, size-limited, and prompt-injection-marked as external data.
6. Schema/citation validation yields `AgentResult`, partial result, or structured failure. Obsolete generations are discarded.
7. User-visible output remains labelled AI-generated with endpoint/model/connector/time and source links.

### 5. Generate a visual safely

1. Model receives only known data/evidence descriptors and the approved visual JSON schema.
2. `MOD-VIS-01` rejects executable/unknown content, resolves IDs to trusted bounded data, applies only allowlisted transformations, and produces a renderer-specific view model.
3. Main-thread trusted components render chart/map/table/panel plus deterministic accessible summary and source table.
4. Invalid output falls back to the trusted raw data table; no partial executable content renders.

### 6. Screen and compare sites

1. Agent parses the user prompt into a proposed structured profile.
2. UI requires confirmation/correction of every hard constraint, preference, and priority.
3. Site module applies deterministic classifications and exclusions to prepared/context evidence, with reason/evidence IDs.
4. Any ordering uses only the visible confirmed priority rule; ties and missing data remain visible.
5. Comparison is pure over immutable snapshots/classification records. Agent explanation is optional and non-authoritative.

### 7. Save, restore, clear, and migrate

1. Repository writes one record mutation transaction with stable operation ID and expected revision.
2. Same-operation retry returns the committed outcome. Same-record stale revision becomes a visible conflict. Tombstones prevent resurrection.
3. Restore validates envelope and trusted references, runs sequential idempotent migrations, quarantines invalid records individually, and reports source/version drift.
4. Credential, scenario, comparison, cache, prompt history, and all-data clear actions remain separate and report exact scope.

## Connector and credential security model

- The ignored local `TEST.md` fixture may supply developer-only Llama-compatible endpoint and Tavily credentials to opt-in local verification tooling. It is never imported by application/production code, copied to `.env`, included in deployment assets, logged, or used as a runtime fallback. Tests consume it only when explicitly enabled and redact seeded values from all evidence. Release QA scans source and built artifacts for the filename and exact seeded secret values without printing them.
- Only explicit HTTPS origins entered/approved by the user and passing a capability/CORS test enter the connector registry.
- The static policy denies inline/eval scripts, third-party script origins, objects, framing, and unsafe base/form behavior. Supporting arbitrary custom HTTPS APIs requires a wider `connect-src` than a fixed provider product; exact destinations are therefore also enforced by the connector worker and shown in the UI.
- Credentials remain in worker-local variables for use and a dedicated IndexedDB vault for persistence. They never enter route state, URLs where headers are supported, domain messages, visual specs, diagnostic events, clipboard, exports, or application logs.
- Persistent vault records use authenticated encryption with an origin-local non-extractable key when the browser can persist it reliably. If unavailable, the UI either uses clearly disclosed origin-local storage or offers session-only mode according to the Phase 4 compatibility table. It never claims OS-keychain protection.
- A compromised same-origin script can potentially act with the origin’s authority despite at-rest encryption. The primary mitigations are no third-party runtime scripts, strict validation, trusted renderers, no raw HTML, dependency pinning/scanning, CSP, connector data minimisation, and easy clear controls.
- Key-bearing MCP URLs are stored and handled as complete secrets. Only a sanitized origin/label leaves the vault.
- Provider errors and capability tests are sanitized before display. No fallback relay or alternate hidden provider is attempted.

## Trusted visual and document model

The Case File and generated visual areas share a trusted component registry. Approved primitives include metric, prose/citation block, evidence card, timeline, discrepancy, comparison table, bar/line/area/scatter chart, bounded map overlay, annotation, coverage panel, and missing-question list. Each takes validated typed props and data/evidence IDs.

The AI schema contains no HTML, CSS, JavaScript, event handler, executable expression, arbitrary component name, arbitrary URL, or unbounded data payload. Model prose is displayed as labelled text with resolved citations; authoritative statements are reconstructed from trusted records. URL rendering accepts only source-registry/citation records and safe protocols.

## Failure containment

| Failure | Containment | Recovery |
|---|---|---|
| Invalid release/core pack | Do not activate it or mix versions. | Use last validated cache; otherwise show scoped fatal recovery and refresh guidance. |
| Invalid optional region/case/layer pack | Disable only that pack/category. | Explain version/source/coverage reason; allow other regions/cases. |
| Analysis worker crash or invariant failure | Preserve last immutable UI snapshot; reject partial operation. | Restart worker, reload validated indexes, retry by operation ID; mark affected result failed if repeat fails. |
| Map/WebGL failure | Domain location and evidence remain available. | Switch to accessible list/table and static region summary. |
| One calculation/evidence category fails | Typed per-result/category failure only. | Keep unaffected outputs and deterministic brief with explicit missing/failure statement. |
| IndexedDB unavailable/quota/corruption | Preserve in-memory work; abort transaction; quarantine one invalid record. | Session-only operation, delete/retry guidance, exact clear scope. |
| Concurrent save/delete conflict | No silent overwrite/resurrection. | Reconcile operation ID or show versions for user choice/refresh. |
| Credential unlock/storage failure | No key is exposed; connector unavailable. | Replace key, switch to session-only, or clear affected connector. |
| Endpoint CORS/auth/capability failure | Disable only unsupported connector/features; no proxy. | Show tested origin/capabilities and corrective guidance. |
| Model/MCP quota, timeout, malformed stream, injection, missing citation | Cancel/reject/return partial typed result; deterministic state untouched. | Retry within bound, change connector, or continue offline. |
| Invalid visual spec | No renderer invocation for invalid fields/bindings. | Explain failure and show trusted data table/default visual. |
| Service-worker update interruption | Active validated generation continues. | Retry download; activate only after complete manifest validation and user reload. |

## Performance and resource budgets

Exact values become Gate 3 contracts, with these architecture envelopes:

- deterministic recalculation target below 1 second on representative desktop hardware;
- prepared first useful result below 5 seconds on the release test profile;
- map interaction kept on the main thread while heavy filtering, graph, screening, pack validation, and data transformations run in the analysis worker;
- simplified national geometry and bounded per-layer feature/vertex budgets; viewport filtering and clustering where appropriate;
- immutable pack size/count budgets enforced by the data compiler, with core/demo precache and lazy regional/case packs;
- agent/tool call, token, response byte, citation, visual row/series/mark, retry, and wall-time limits;
- 24-hour flexibility vectors stay bounded; EMI raw intervals are aggregated at release time, not processed as a year-long browser workload;
- IndexedDB quota estimates and graceful session fallback; no automatic unbounded prompt/research retention.

## Observability and operations

- Browser performance marks: shell ready, core pack validated, map ready, case ready, calculation, minimax, assessment, evidence query, first deterministic render, connector first token, visual validation/render, persistence transaction.
- Diagnostic events: allowlisted category, component/schema/app/data version, status class, correlation ID, bounded timing/counts. No default remote telemetry.
- Release reports: source/link/licence review, content hashes, schema/cross-reference validation, data/geometry/layer sizes, EMI interval/DST/unit/spatial coverage, document/page extraction coverage, project/evidence counts, bundle budgets, dependency/licence/security scans.
- Operations are immutable deploy, smoke verification, and rollback to a prior complete Sites deployment. Local browser data remains independently clearable after unpublish.

## Build, deployment, upgrade, rollback, and removal

- Initialize with the Sites capability-path starter only after Gate 3. Preserve its package manager, vinext/Vite structure, `sites()` plugin, lockfile, and `.openai/hosting.json`.
- Production output is Cloudflare Worker-compatible ESM plus static assets and no declared D1/R2/auth resource.
- `.env.example` contains names only for non-user build/release inputs; no user connector key is bundled or hosted.
- A release manifest binds app/schema/policy/geometry/data-pack versions. Deployment is atomic; old assets remain valid for rollback.
- Service-worker upgrades do not silently replace an active result. UI announces a ready compatible version and reload creates a new app generation.
- IndexedDB migrations are forward sequential, transactional, idempotent, and tested from every supported version. Unsupported records are quarantined, not guessed.
- Removal unpublishes the Sites release; the app documentation explains that users must separately clear device-local data and credentials.

## Proposed source ownership layout

The exact scaffold remains prohibited until Gate 3, but implementation ownership will follow this layout:

```text
design-1-browser-first/
  .autoforge/                  approved artifacts and verification evidence
  .openai/hosting.json         Sites resource/deployment declaration
  app/                         vinext routes, shell, metadata and styles
  src/application/             coordinator, state machines, snapshots, compare
  src/domain/                  validation, calculations, flexibility, assessment
  src/evidence/                evidence graph, freshness, coverage, conflicts
  src/spatial/                 geometry and site-screening rules
  src/agent/                   connector protocol, model/MCP/Tavily adapters
  src/storage/                 IndexedDB, vault, cache, migrations
  src/visuals/                 visual grammar and trusted renderers
  src/workers/                 analysis and connector worker entrypoints/protocol
  src/ui/                      Map Explorer, Case File and accessible components
  data-pipeline/               registered build-time ingestion/transformation
  public/data/                 compact immutable content-addressed packs
  schemas/                     boundary/storage/data/agent/visual JSON schemas
  tests/                       unit/property/contract/integration/e2e/fixtures
```

`Shared/` and user-supplied source documents remain read-only inputs outside the implementation boundary.

## Requirements-to-architecture traceability

| Approved requirements | Primary architecture evidence |
|---|---|
| FR-LOC-001–004, FR-MAP-001–004 | CMP-UI-01, CMP-MAP-01, MOD-GEO-01, CMP-PACK-01, accessible shared-ID list/map model. |
| FR-SCN-001–004 | CMP-UI-01, CMP-APP-01, MOD-VAL-01, CMP-DB-01. |
| FR-CASE-001–004 | CMP-UI-01 trusted Case File, MOD-EVD-01, project packs, trusted component registry. |
| FR-CAL-001–006 | MOD-CAL-01, MOD-FLX-01, immutable snapshot/manifest contracts. |
| FR-ASM-001–008 | MOD-ASM-01, MOD-EVD-01 evidence gates, deterministic statement/report layer. |
| FR-EVD-001–018 | PIPE-DATA-01, CMP-PACK-01, MOD-EVD-01, MOD-GEO-01, source/data/evidence contracts. |
| FR-AGT-001–011 | CMP-APP-01, CMP-AGT-01, bounded context/tool protocol, MOD-SITE-01, labelled output. |
| FR-VIZ-001–003 | MOD-VIS-01 and trusted visual registry; schema/data binding/provenance contracts. |
| FR-CONN-001–008 | CMP-AGT-01, CMP-VLT-01, capability matrix, direct CORS policy, no-relay topology. |
| FR-RES-001–004 | CMP-UI-01, CMP-APP-01, shared evidence/result IDs, trusted audience/lens presentation. |
| FR-RPT-001–003 | CMP-RPT-01 and immutable trusted records; AI appendix separation. |
| FR-SAVE-001–002 | CMP-DB-01 and CMP-VLT-01 transaction/revision/operation/tombstone/migration model. |
| FR-DOC-001–002 | PIPE-DATA-01 prepared deep-case ingestion; user upload boundary remains absent/deferred. |
| NFR-PER-001 | Worker split, pack budgets/lazy load, release-time EMI aggregation. |
| NFR-REL-001–002 | Pure deterministic modules, immutable generations/snapshots, typed partial failure, offline packs. |
| NFR-ACC-001 | CMP-UI-01 shared map/list and chart/table/text models, trusted component semantics. |
| NFR-SEC-001–002 | Worker/message/schema boundaries, CSP, self-hosted dependencies, connector allowlist, trusted renderers, scans. |
| NFR-PRI-001 | Anonymous/no-server topology, CMP-VLT-01, separate local stores and disclosure/clear flows. |
| NFR-EXP-001 | Typed origin/evidence/AI records, evidence graph, deterministic trace/report. |
| NFR-MNT-001–002 | Versioned component/contract families, separate workers/modules, immutable request generation. |
| NFR-DEP-001 | Sites capability-path, Worker-compatible ESM, no D1/R2/auth declaration. |
| NFR-OBS-001 | CMP-OBS-01 allowlist and local diagnostics design. |
| CON-001–008 | Isolated tree, deterministic boundary, no relay/database, direct CORS, read-only tools, Sites target, coverage disclaimers. |

## Acceptance-criterion coverage

| Acceptance criteria | Architectural proof point |
|---|---|
| AC-001–002 | Shared map/list ID model, Stats geometry module, all-region scenario path, per-category coverage. |
| AC-003–006 | Pure calculation/flexibility/assessment modules, exact traces, immutable manifests, property/golden-test boundaries. |
| AC-007–009, AC-022 | Registered data compiler, typed packs/evidence, conflict/freshness model, exact EMI spatial/unit/DST pipeline. |
| AC-010–013 | Connector worker, vault, capability/CORS matrix, Tavily/MCP routes, no-relay topology. |
| AC-014–015 | Bounded agent protocol and schema-bound trusted visual pipeline. |
| AC-016–019 | Shared result/evidence IDs, typed discourse/company/legislation records, deterministic comparison/report, offline failure independence. |
| AC-020–021 | Transactional local stores, immutable data generations, accessibility/security/build/hosted verification points. |
| AC-023–026 | Map/catalog/sheet/compare components, prepared deep case/evidence graph, controlled community model, confirmed deterministic site screening. |

## Risks and mandatory mitigations

| Risk | Mandatory mitigation/evidence before implementation acceptance |
|---|---|
| Worker protocol complexity delays delivery | Keep exactly two workers; freeze small discriminated protocols in Gate 3; contract-test cancellation/late/crash behavior before slices integrate. |
| Map and national layers exceed browser budgets | Build-time simplification/validation, viewport filtering/clustering, worker filtering, explicit byte/feature/vertex budgets and low-memory fixtures. |
| Persistent credentials create false security expectations | Plain disclosure, session-only mode, best-effort encryption, no read-back/export/log path, seeded-secret tests, same-origin compromise limitation. |
| Arbitrary custom endpoints weaken CSP `connect-src` | No third-party scripts, exact connector registry enforced in worker, visible destinations, HTTPS only, strict non-connect CSP, dependency/XSS tests, document residual. |
| Service worker serves mixed/stale assets | Content-addressed immutable assets, release manifest, generation-specific caches, atomic activation, explicit reload and rollback tests. |
| Agent loops leak context or follow injected source instructions | User-selected context manifest, system/tool separation, bounded allowlisted tools, inert evidence, schema/citation validation, injection/failure tests. |
| Evidence graph implies authority from connectivity | Authority/type is a deterministic record field, not graph reachability; candidate/AI edges cannot satisfy assessment gates. |
| EMI aggregate is mistaken for capacity | Separate source semantics, explicit labels, quality/exclusion ledger, no headroom/self-sufficiency derivation contract. |
| Prepared case documents have extraction errors | Preserve document/page/section and extraction version, source-open fallback, discrepancy/claim types, manual release QA. |
| Offline support conflicts with fresh evidence | Cached retrieval time never changes; freshness evaluated against pinned `as-of`; live/agent items visibly cached/stale. |

## Gate 2 approval record

The user approved **Gate 2 architecture v0.3 (Option A)**, accepting:

- the main-thread plus two-worker topology;
- browser ownership of deterministic logic and user data;
- release-time prepared-data compiler and immutable data packs;
- direct CORS-only custom model/MCP/live connectors with no GridLens relay;
- separate local credential vault and transactional IndexedDB model;
- trusted component/visual grammar and typed evidence graph;
- versioned service-worker offline/update strategy;
- OpenAI Sites capability-path deployment without D1, R2, or app authentication; and
- the stated privacy, CSP, performance, failure, migration, and operational consequences.

It does not authorize production scaffolding. After approval, Phase 4 must specify all schemas, state machines, algorithms, invariants, migrations, resource limits, and tests, followed by an independent validated Gate 3 review.
