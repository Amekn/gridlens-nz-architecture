# GridLens NZ — Test strategy

**Artifact version:** 0.10 draft
**Status:** Phase 4 design; awaiting independent Gate 3 validation
**Approved baseline:** Requirements 0.4, Usage Definition 0.4, Architecture 0.3 Option A
**Contracts and logic:** `05-contracts.md` and `06-logic-map.md` version 0.10 draft

**Normative precedence:** the v0.10 reconciliation at the end of this artifact supersedes any conflicting v0.4/v0.5/v0.6/v0.7/v0.8/v0.9 fixture or release condition.

## Quality strategy

Testing proves contract behavior and the approved acceptance criteria; it does not treat compilation, snapshots, or the absence of an observed error as broad proof. Every deterministic result has an independent oracle or invariant. Every trust boundary has a malformed, oversized, late, injected, and secret-bearing negative fixture. Every failure path must prove unaffected deterministic behavior remains available.

The implementation cycle is test-first:

1. add the smallest test that expresses the approved contract and observe the expected failure;
2. implement the behavior without weakening the oracle;
3. refactor only under the complete affected suite;
4. run accumulating contract/integration checks after shared-boundary changes; and
5. preserve command output and artifacts as QA evidence without secrets or user content.

## Planned test surfaces and environments

| Layer | Planned runner/environment | Purpose |
|---|---|---|
| Static/schema | TypeScript type check, JSON Schema validator, lint/security rules | Public contracts, strict unknown-field behavior, forbidden imports/rendering APIs. |
| Unit/property/model | Vitest-compatible Node/browser runner and property generator | Pure calculations, geometry, assessment, freshness, screening, canonicalization, storage models. |
| Worker contract | Real Web Workers in browser harness | Message cloning/schema, generations, cancellation, restart, stream/progress backpressure. |
| Storage/integration | Real IndexedDB/Web Crypto/BroadcastChannel in current Chromium plus fallback harness | Transactions, encryption capability, concurrency, migrations, crash reconciliation, clear flows. |
| Data pipeline | Node release tools with pinned miniature source fixtures | Source registry, checksums, licences, EMI, coordinates, documents, graph/data packs. |
| Browser end-to-end | Playwright-compatible Chromium; later current Firefox/WebKit smoke where platform allows | UJ-001–017, responsive/keyboard/touch/failure/offline/update behavior. |
| Accessibility | Automated axe-compatible checks plus manual keyboard, screen-reader, zoom, contrast/non-colour review | WCAG 2.2 AA target and equivalent map/chart paths. |
| Security/privacy | Static dependency/bundle scans, malicious fixtures, browser network/storage inspection | XSS/injection/tool abuse, destination control, secret/content leakage, CSP, cache exclusions. |
| Performance | Production build, representative desktop profile, throttled network/CPU and low-memory fixtures | Sub-second deterministic calculation, five-second prepared first result, map/pack/visual budgets. |
| Deployment/clean QA | Fresh checkout/install/build/Sites preview and deployed Sites release | Packaging, first run, local persistence, refresh, offline, rollback/removal, no dev dependency/secret. |

Exact commands become `09-implementation-plan.md` after the Sites scaffold exists. The expected command families are `typecheck`, `lint`, `test:unit`, `test:contract`, `test:data`, `test:integration`, `test:e2e`, `test:a11y`, `test:security`, `test:performance`, and `build`; a single aggregate release check must run all required non-live suites.

## Test ID convention

```text
UT-<MODULE>-NNN       deterministic unit example
PROP-<MODULE>-NNN     generated property/invariant
MODEL-<MODULE>-NNN    model/state-machine exploration
CT-<CONTRACT>-NNN     boundary/schema producer-consumer test
IT-<FLOW>-NNN         multi-component/browser integration
E2E-UJ-NNN            approved usage journey
DATA-<SOURCE>-NNN     data compiler/source fixture
SEC-<BOUNDARY>-NNN    adversarial/security/privacy test
A11Y-<SURFACE>-NNN    automated/manual accessibility evidence
PERF-<SURFACE>-NNN    timed/resource budget
PKG-<TARGET>-NNN      package/deployment/clean-environment proof
```

Each test record links requirement IDs, contract IDs, logic IDs, fixture IDs, oracle, environment, and whether it blocks release.

## Frozen fixtures and authoritative oracles

### FX-SOUTHLAND-50 — exact deterministic scenario

```text
region=Southland
IT capacity=50 MW
PUE=1.3
utilisation=80%
cooling=air
flexibility=30%
backup=diesel
permanent jobs=50
expected facility demand=65 MW exactly
expected annual energy=455.52 GWh exactly
expected maximum flexible load=19.5 MW exactly
```

Oracles use canonical decimals before display formatting. This fixture does not invent a water factor, regional assessment, or backup restriction; those use separately versioned evidence/policy fixtures.

### FX-FLEX-100-50-50 — independent minimax counterexample

```text
regional=[100,50,50,75 repeated hours 3..23]
facility demand=100 MW; utilisation=.5; flexibility=1
peakHourCount=1; maximumDestinationUtilisation=1
expected baseline facility=50 MW; original peak=150 MW
expected optimum=125 MW
expected canonical ledger=[0→1:25 MWh, 0→2:25 MWh]
expected shifted energy=50 MWh
```

Small generated problems use an independent rational-number exhaustive/linear-program oracle, not the production feasibility predicate. It enumerates discretized allocations for `H≤6` and proves the production peak is no lower than feasible and no higher than optimum within the declared tolerance. The frozen 24-hour case verifies the exact certificate and ledger.

### FX-FRESHNESS — calendar boundaries

- Basis `2024-08-06T00:00:00Z`, 24-month category: current at `2026-08-06T00:00:00Z`; stale one nanosecond/representable tick later.
- Same basis with `validUntil=2026-09-01T00:00:00Z`: override current through equality, stale afterward.
- Basis `2024-02-29` plus 24 months: clamped calendar-month result is tested explicitly.
- Missing basis → unknown; future basis → future-invalid; qualifying forecast interval covering `asOf` → evaluated under its explicit validity.
- Browser/system clock changes do not affect a pinned snapshot `asOf`.

### FX-NZ-GEOMETRY — whole-country selection

- All 16 regional council areas plus `99 Area Outside Region`/Chatham have stable IDs, names, representative interior points, and accessible list entries.
- Shared-edge and shared-vertex points resolve to lexicographically smallest matching geography ID.
- Chatham point resolves correctly; ocean/outside point remains coordinate-only; no nearest substitution.
- Map click, list, coordinate, project, and restored paths yield the same selection contract.

### FX-CATALOG-AND-CASE — hackathon content

- At least three records cover existing, proposed, and candidate states with distinct non-colour markers.
- One prepared deep case contains every fixed section, source counts, documents/page locators, a timeline, one discrepancy or explicit none-found record, controlled community records, company/comparables, alternatives, and evidence gaps.
- At least one missing section/value uses an explicit missing state rather than omission.
- Mana whenua evidence is separate; a web-discourse-only collection cannot generate a representative percentage or low concern.

### FX-ASSESSMENT — policy branch table

- Electricity exact 5%, exact 15%, epsilon above/below, zero/invalid regional peak, missing/stale demand/grid.
- Water valid annual/peak threshold bands, exact boundaries, missing threshold, stale authority, factor missing, conservative upper range.
- Resilience unrestricted fossil user assertion; claimed restriction; verified restriction; battery/DR with and without capacity/duration/commitment; mixed fossil precedence.
- Economic no claim, exact verified basis/roles, proposal/user claim, jobs 10,000 and 10,001 warning, exact authoritative contradiction, unrelated evidence that must not contradict.
- Community absent representative evidence, web/news only, current representative low/moderate/high, mixed records, missing methodology.
- All category combinations for high → insufficient → moderate → all-low overall precedence.

### FX-EMI — structured electricity data

Miniature daily files and NSP snapshots include:

- exact matching and unmatched POCs;
- valid NZTM coordinates landing in known Stats regions, boundary tie, invalid/missing coordinate, and Area Outside Region;
- network reporting region differing from Stats regional council;
- ordinary, short, and long Pacific/Auckland local days: 48/46/50 half-hour and 288/276/300 five-minute expectations;
- MW and kWh columns, load, modelled generation, price, dead/disconnected rows;
- duplicate revision with documented precedence and ambiguous duplicate exclusion;
- missing file/date/interval and schema drift;
- known interval-energy calculation and a trap that fails if MW is summed across time;
- explicit checks that no output/field/statement exposes spare capacity, self-sufficiency, or transmission headroom.

### FX-MALICIOUS — untrusted and oversized inputs

- HTML/script/event handlers, CSS, JavaScript/data/file URLs, Markdown links with unsafe schemes, Unicode confusables, formula injection, prototype keys, deep nesting, duplicate JSON keys, NaN/infinity, oversized strings/arrays.
- Prompt/source instructions to reveal keys, call an unapproved/write tool, ignore authority rules, fabricate citations, output arbitrary HTML, add hidden site weights, or change deterministic values.
- Forged restored `verified_evidence` origins, candidate graph edges marked accepted, false representative flags, stale cache with new display date.
- Provider errors and URLs containing exact seeded secrets.

### FX-CONNECTIONS-LOCAL — opt-in real connector smoke

`TEST.md` is ignored and untracked. A test-only loader outside production import graphs may read it only when an explicit local-smoke flag is set. It returns credentials directly to the smoke harness, never snapshots, echoes, logs, screenshots, traces, or persists them. Default unit/integration/CI uses local deterministic mock servers.

The opt-in smoke suite performs at most:

1. one sanitized Llama-compatible capability sequence against the supplied endpoint (CORS/auth, listed/declared model, selected Responses/Chat route, streaming, structured JSON and tools where supported);
2. one minimal deterministic prompt with no project/user content;
3. one minimal Tavily search returning a source citation; and
4. a production build/source scan that loads exact fixture secrets into memory and reports only zero/nonzero occurrence counts.

The suite must not run automatically in public CI or consume Tavily/model quota repeatedly. Production application code must not import `TEST.md`, the test loader, or hardcoded test connector values.

## Unit, property, and model catalogue

### Validation/origin — `UT-VAL-*`, `PROP-VAL-*`, `SEC-ORIGIN-*`

- Decimal grammar, empty/whitespace, sign, exponent policy, range edges, custom values, suspicious warnings, cross-field compatibility.
- Origin proof issued only from active action/preset/prepared evidence; all restored/self-declared proofs discarded.
- Generated drafts never crash; valid normalization is idempotent and canonical.
- Capacity/PUE/jobs/investment warnings do not silently clamp or become assessment outcomes.

### Calculations/water — `UT-CAL-*`, `PROP-CAL-*`, `UT-WATER-*`

- FX-SOUTHLAND-50 exact decimals, unit conversions, 8760 basis, zero/one utilisation/flexibility, display rounding independence.
- Positive finite inputs preserve formula identities and monotonicity where mathematically valid.
- Unknown cooling/factor absent/ambiguous/inapplicable/invalid range returns insufficient, not zero.
- Water unit oracle independently computes annual and full-load peak-day kWh × L/kWh ÷ 1000 and both conservative upper values.
- Per-metric failure leaves unaffected results and trace/manifest data.

### Flexibility — `UT-FLX-*`, `PROP-FLX-*`, `MODEL-FLX-*`

- FX-FLEX-100-50-50 exact optimum and canonical ledger.
- 0% identity; 100% still bounded; flat profile; no destination capacity; one destination; exact ties; invalid array/profile; tolerance edges.
- Properties: daily energy conservation, non-negativity, source/destination/peak/utilisation/headroom bounds, achieved peak ≤ original, shifted energy ≤ eligible.
- Independent small rational oracle proves optimality/certificate. Mutating feasibility inequality, source selection, destination cap, or tie order must make a test fail.
- Cancellation at each search/construction step emits no completed result.

### Freshness/evidence/conflicts — `UT-EVD-*`, `PROP-EVD-*`

- FX-FRESHNESS including leap-day/calendar clamping, `validUntil`, future forecasts, pinned time.
- Category routing to 24/36 months; unknown category rejected.
- National fallback, stale/unknown/future, source failure, expected-field missing coverage states.
- Conflicting definitions/times/geographies retain both; precedence applies only for exact registered field rule.
- Graph traversal depth/record limits, accepted versus AI candidate edges, supersession history, unknown node/edge rejection.

### Assessments — `UT-ASM-*`, `PROP-ASM-*`

- Exhaust FX-ASSESSMENT branch table and exact electricity/water boundaries.
- Stale/unknown never produces low. Missing decisive input never defaults low.
- Economic 10,001 warning remains moderate unless exact authoritative contradiction exists.
- Fossil explicit assumption and evidence-qualified restrictions trace the correct origin/evidence.
- Community web-source counts cannot produce representative result; mana whenua not merged.
- Every valid outcome has reasons, decisive inputs, evidence/missing, policy version; trace omission fails the record.
- Enumerate all `4^5` category combinations for overall precedence; forbidden score/approval output absent.

### Geography/map/case — `UT-GEO-*`, `PROP-GEO-*`, `UT-CASE-*`

- FX-NZ-GEOMETRY and generated points near edges/holes using an independent geometry oracle/reference fixtures.
- Coordinate-entry text, map pointer/touch/keyboard and accessible-list points all traverse the coordinator `resolve_location` command; exact inside/border/outside fixtures return the same `LocationResolutionOutcomeV2`. Direct UI calls to geometry logic, wrong geometry hash, nearest-region substitution and missing boundary-candidate IDs fail.
- Deterministic project/place search normalization, stable sort, marker semantics, layer disabled/qualified states, viewport feature budget and clustering.
- Map/list shared ID parity and selection retention across audience/lens.
- Case section completeness, recomputed evidence counts, page fallback, event precision sort, conflict preservation, source opening.
- Controlled community taxonomy invariants and no unsupported aggregate percentage.

### Site screening — `UT-SITE-*`, `PROP-SITE-*`

- `SiteProfileCandidateV2` from a model is always proposed/unconfirmed and rejects any confirmation timestamp/hash/reviewer field; explicit user confirmation or edits create a new `ConfirmedSiteProfile` revision and every edit changes its confirmation hash.
- The UI can create a confirmed profile only through coordinator `confirm_site_profile` targeted to the analysis worker with a strict `SiteProfileConfirmationRequestV2`; direct storage, hidden module calls, wrong epoch/generation, reviewed-content hash mismatch and model-originated confirmation all reject.
- Unknown field/operator/unit, >20 criteria, weights/scores/hidden metadata fail closed.
- Domain-outcome precedence is exactly excluded -> specialist -> infrastructure -> insufficient evidence -> included. Presentation mapping is exact: excluded -> excluded; specialist/infrastructure/insufficient -> needs investigation; included -> passes.
- Ordering uses confirmed preference vectors then stable ID only within one presentation group; no numeric aggregate, cross-group ordinal or global rank exists.
- Permuting map/object iteration does not change results. Changing one priority can reproduce order change and sensitivity record.

### Snapshot/comparison/report — `UT-SNAP-*`, `UT-CMP-*`, `UT-RPT-*`

- Canonical JSON/fingerprint stable across key/set iteration; ordered time series retained; timestamp/correlation exclusions correct.
- Every referenced constituent ID/version/hash resolves; removing one manifest member fails closure.
- Snapshot deep immutability; late enrichment cannot alter it.
- Compare exact unrounded values/units, assumptions, assessment/coverage/conflict/version drift for 2–6 snapshots; incompatible units fail.
- Brief remains complete with AI absent/malformed, includes disclaimer/missing evidence, and keeps AI only in labelled appendix.
- Clipboard failure exposes identical selectable content.

### Storage/vault — `UT-SAVE-*`, `MODEL-SAVE-*`, `UT-MIG-*`, `SEC-VAULT-*`

- State-machine model generates create/replace/delete/retry/conflict/interleaving histories across tabs and compares IndexedDB outcome with pure model.
- Independent records survive; stale same-record write conflicts; tombstone prevents resurrection; crash-after-commit retry replays receipt.
- Sequential migration from every supported version, idempotent rerun, interrupted transaction rollback, skipped/invalid version quarantine.
- Per-record checksum/corruption quarantine preserves siblings; quota/denied/blocked fallback preserves in-memory state.
- Credential persistence only after successful ordinary use; session-only absent after refresh; replace/clear-one/clear-all exact scope.
- CryptoKey support/fallback disclosure, unique IV, authenticated metadata, ciphertext tamper failure, no generic enumeration/read-back.
- Seeded keys and key-bearing URLs absent from every non-vault store and diagnostic/export/copy value.

### Agent/connector/visual — `UT-CONN-*`, `MODEL-AGENT-*`, `SEC-AGENT-*`, `UT-VIS-*`

- URL origin normalization, HTTPS/userinfo/fragment/header policy, key-query sanitization, exact-origin request enforcement.
- Capability matrix for Responses-only, Chat-only, both, chat without tools, structured-output failure, streaming failure, remote-MCP supported/unsupported, CORS/auth/quota/timeouts.
- Agent state-machine exploration across disclosure, model/tool loops, retry, cancel, obsolete generation, partial/failure and worker restart.
- Tool allowlist, six-call/two-concurrent limits, no write/discovery recursion, result size/source capture, prompt injection containment.
- Citation validation: every external fact maps to context/tool URL; fabricated/lost citation fails or becomes unsupported.
- Visual strict schema/fuzz, unknown data/field/filter/evidence, every byte/row/point/series limit, no executable fields.
- Each primitive produces trusted renderer model, provenance, table and deterministic accessible summary.

### Offline/update/diagnostics — `UT-OFF-*`, `IT-OFF-*`, `SEC-OBS-*`

- Service-worker request classifier bypasses cross-origin, auth, no-store, model/MCP/live paths.
- Interrupted download/hash/schema failure never changes active generation; explicit reload activates complete generation.
- Two open clients on old/new worker lifecycle do not delete active old cache prematurely.
- Cached research retains original retrieval time/freshness; offline never relabels it live.
- Diagnostics strict allowlist, duration buckets, bounded ring/retention, secret/content canary scan and sanitized export.

## Contract test catalogue

| Contract | Required tests |
|---|---|
| CTR-000 | Canonical scalars/decimals/instants/URLs; invalid/unknown/error serialization. |
| CTR-001 | Request/event schemas, cloneability, operation/generation, duplicate terminal, late/cancel/restart/progress throttle. |
| CTR-002 | Manifest/pack hashes, dependency cycles/mismatch, source/licence/size, atomic core and optional isolation. |
| CTR-003 | Geography/catalog/layer schema, map/list IDs, marker/coverage semantics, boundary/outside. |
| CTR-004 | Draft/normalized/origin producer-consumer snapshots and forged restore. |
| CTR-005 | Calculation traces/manifests, water complete/insufficient/failed variants. |
| CTR-006 | Profile/policy/input/result schemas, exact 24 slots, ledger/certificate invariants. |
| CTR-007 | Evidence/edge/freshness/coverage/conflict strict schemas and authority non-promotion. |
| CTR-008 | Documents/page locators/events/community/case counts/sections. |
| CTR-009 | Threshold/assessment/overall/trusted-statement completeness and forbidden outputs. |
| CTR-010 | Draft/confirmed profile, criterion/finding/classification/order schemas. |
| CTR-011 | Config/vault/capability/disclosure strict schema and no secret-bearing public fields. |
| CTR-012 | Agent/tool/citation/claim/partial/cancel/failure schemas and limits. |
| CTR-013 | Visual spec/resolved model strict schemas, unknown fields, trusted data resolution. |
| CTR-014 | Snapshot/comparison/brief fingerprints, references, deterministic templates, AI appendix. |
| CTR-015 | Envelope/checksum/operation/outcome/cache schemas, transaction/receipt/tombstone semantics. |
| CTR-016 | Cache/update generations and active/candidate lifecycle. |
| DiagnosticEventV2 | Diagnostic field allowlist and content/secret structural absence. |
| CTR-018 | EMI raw/NSP/exclusion/interval/coverage schemas and semantics. |

Every contract test runs producer output through the consumer’s actual validator. Hand-authored schema examples alone are insufficient.

## Data compiler and source validation

### Generic source pipeline — `DATA-REG-*`, `DATA-PACK-*`

- Registered enabled/disabled/access-mode/source-field/licence/attribution validation.
- Conditional HTTP receipt metadata, checksum repeatability, schema drift, unit/geography mismatch, rate/retry behavior.
- Content-addressed filenames and deterministic pack bytes for identical canonical inputs.
- Cross-pack stable IDs/edges/references, dependency graph, core/optional size budgets, link and attribution report.
- No raw bulk source, local absolute path, connector credential, test fixture, or unlicensed document body in public output.

### EMI — `DATA-EMI-*`

- FX-EMI exercises rolling 12-calendar-month window selection, latest-date gaps and fallback to most recent complete window.
- Exact POC normalization/join; no substring/fuzzy/nearest match.
- Pinned EPSG:2193→WGS84 known-coordinate fixtures and Stats point-in-polygon/tie parity.
- Source-documented duplicate precedence versus ambiguous exclusion; dead/disconnected exclusion.
- Pacific/Auckland DST expected counts at 30- and 5-minute resolution; UTC canonical instants.
- Load/generation/price aggregation oracle, interval energy conversion, coverage/exclusion ledgers and source receipts.
- Legacy `Generation_MD` remains separate and labelled; dispatch/modelled generation never presented as metered output.
- Schema/coverage thresholds block/qualify publishing according to the frozen Gate 3 policy.

### Project documents/evidence graph — `DATA-DOC-*`, `DATA-CASE-*`

- Licensed/public source allowlist, hash/extraction version/page count, page/section mapping and source-open fallback.
- Instructions embedded in documents remain inert; statement self-label cannot grant official/verified type.
- AI extraction candidates require deterministic schema and curator/release acceptance before accepted edge.
- Timeline precision/conflicts, company/site/comparable edges, evidence counts and fixed section states.
- Community taxonomy, method limitation, missing voices and mana whenua separation.

## Worker and integration flows

| ID | Flow and assertions |
|---|---|
| IT-BOOT-001 | Valid core release boots workers/indexes and renders cached prepared content; invalid candidate retains prior generation. |
| IT-PACK-001 | Concurrent duplicate case/region loads deduplicate; cancel/obsolete leaves no partial index; optional failure isolates. |
| IT-MAP-001 | Search/layers/selection/sheet/compare tray share IDs across map/list and keyboard/touch paths. |
| IT-ANALYSE-001 | Draft→validation→calculation→flex→evidence→assessment→snapshot renders before delayed AI/live. |
| IT-PARTIAL-001 | Water/profile/source failures affect only their metrics/categories; brief explicitly preserves them. |
| IT-CASE-001 | Catalog→prepared deep case→source page→timeline discrepancy→audience/lens switches retain IDs. |
| IT-CONN-001 | Configure→test capabilities→ordinary use→persist→refresh→reuse→replace/clear without key read-back. |
| IT-AGENT-001 | Selected context→disclosure→model→Tavily/tool→cited typed result; unrelated saves absent from captured request. |
| IT-AGENT-FAIL-001 | CORS/auth/quota/timeout/injection/malformed/late/cancel produces scoped state; deterministic page unchanged. |
| IT-VIS-001 | Prompt→schema spec→worker resolution→trusted chart/map/table+sources+a11y; malicious spec fails to table. |
| IT-SITE-001 | Prompt parse→user confirmation→deterministic classifications/order/sensitivity→AI explanation; no hidden score. |
| IT-SAVE-001 | Two contexts save/delete/migrate/quarantine with operation receipt and BroadcastChannel invalidation. |
| IT-OFF-001 | Core demo works offline after cache; uncached pack disabled; cached research visibly stale/original time. |
| IT-UPDATE-001 | Interrupted and complete update paths, explicit reload, old snapshot/version drift, rollback. |
| IT-REPORT-001 | Deterministic public/decision-maker People/Planet briefs complete with AI/live unavailable and copy fallback. |

## End-to-end journey matrix

| Journey | Automated path | Required manual evidence |
|---|---|---|
| UJ-001 | `E2E-UJ-001` whole-NZ search/map/list/layers/markers/sheet/compare | Touch/keyboard map-list comprehension and layer qualifications. |
| UJ-002 | `E2E-UJ-002` connector capability/persistence/refresh/clear and non-CORS | Privacy/storage wording; real local smoke separately opt-in. |
| UJ-003 | `E2E-UJ-003` Southland exact snapshot and partial-source mode | Raw calculation/assumption clarity. |
| UJ-004 | `E2E-UJ-004` deep case and four audience/lens combinations | Reading order, source navigation and public/planner comprehension. |
| UJ-005 | `E2E-UJ-005` cited question/context manifest/cancel/late failure | AI label, disclosure and uncertainty clarity. |
| UJ-006 | `E2E-UJ-006` valid and malicious dynamic visuals | Chart/map/table equivalence and labels. |
| UJ-007 | `E2E-UJ-007` prepared/live legislation/consent/timeline discrepancy | Official link/version/legal disclaimer. |
| UJ-008 | `E2E-UJ-008` entity disambiguation/company claims/findings/comparables | Allegation/response/finding distinction. |
| UJ-009 | `E2E-UJ-009` controlled discourse/community records and sparse sources | Non-representative and mana whenua separation. |
| UJ-010 | `E2E-UJ-010` prepared/live refresh, conflict, stale cache, one-feed failure | Coverage/conflict/freshness comprehension. |
| UJ-011 | `DATA-EMI-*` plus `E2E-UJ-011` open aggregate provenance/quality | Maintainer reproducibility report. |
| UJ-012 | `E2E-UJ-012` flexibility chart/table/certificate including frozen oracle | Constraint/simplification explanation. |
| UJ-013 | `E2E-UJ-013` design/site compare and confirmed screening flow | No “best” interpretation; priority transparency. |
| UJ-014 | `E2E-UJ-014` water missing/factor/range/threshold paths | Missing water questions and independent other outputs. |
| UJ-015 | `E2E-UJ-015` brief modes, AI absent/valid/malformed, clipboard fallback | Standalone readability/source completeness. |
| UJ-016 | `E2E-UJ-016` save/restore/refresh/migrate/conflict/quarantine/clear | Shared-device risk and exact clear scope. |
| UJ-017 | `PKG-SITES-*` build/publish/smoke/rollback/removal with release manifest | Operator lifecycle and local-data-after-removal guidance. |

Stretch upload and direct-feedback journeys are not production routes. Static/import scans and route tests assert their absence.

## Accessibility protocol

Automated checks run on every route/state, but manual evidence is mandatory:

- keyboard-only complete UJ-001, 003, 004, 006, 013, 015, 016; no trap; visible focus; logical restoration;
- screen-reader landmarks/headings/labels/status/errors on Map Explorer, project sheet, Case File, scenario, result, connector, prompt, visual, comparison and brief;
- accessible list alternative selects the same region/project and exposes layer/marker/source/coverage semantics;
- every chart/map-generated visual has deterministic summary and data table; screen reader can reach sources/units;
- 200%, 300%, and 400% zoom at representative widths; reflow except bounded map/table with equivalent controls;
- non-colour marker/status/outcome/confidence/conflict/freshness semantics and contrast checks;
- reduced motion, touch target, drag alternative, mobile sheet/dialog and orientation checks;
- public/decision-maker language review without hiding raw values or disclaimers.

Accessibility defects blocking a core journey block QA even if automated scans pass.

## Security and privacy protocol

### Static/build

- Dependency lock/license/vulnerability review; no third-party runtime scripts or unexpected network SDK.
- Forbid raw HTML/eval/Function/dynamic external imports/model-created style/code paths.
- Production CSP/header inspection and exact intended connect policy.
- Production source/bundle/public asset scan for `TEST.md`, `.env`, absolute local paths, source credentials, test keys, prompt/document fixtures, debug artifacts and unexpected source maps.

### Runtime/browser

- Capture all requests for representative workflows; assert each destination equals same-origin asset or explicit connector/source registry origin.
- Assert model/MCP/live requests are direct, CORS-compatible, `no-store`, and absent from service-worker caches; non-CORS produces no relay request.
- Seed unique secrets in model/Tavily/key-query inputs and scan DOM, accessibility tree where available, console, network URLs/bodies excluding authorized header/request field, IndexedDB non-vault stores, CacheStorage, clipboard, downloads, brief, prompt history, visual model, diagnostics and errors.
- XSS/content injection fixtures through source, document, model, tool, stored record and visual boundaries.
- Tool injection/write/discovery, context expansion, prompt exfiltration and forged citation/origin/authority tests.
- Clear/replace/storage-denied/incognito/shared-device disclosures and exact results.

The test report records pass/fail and sanitized hashes/counts only; it never prints a secret or sensitive URL.

## Performance and resource protocol

Measurements use production output, cold and warm cache, representative desktop plus throttled CPU/network profile. Each budget has median and worst accepted sample; five-run medians cannot hide a single hard ceiling breach.

| ID | Measurement | Target/blocking ceiling |
|---|---|---|
| PERF-CAL-001 | Validate + calculate + flexibility + assess after packs indexed | target <1 s; hard 1 s per NFR on representative desktop. |
| PERF-FIRST-001 | Navigation to first deterministic prepared result | target/hard ≤5 s on declared release profile. |
| PERF-MAP-001 | Pan/zoom/select with max declared visible feature budget | no sustained >100 ms task; interaction remains usable. |
| PERF-CASE-001 | Open core prepared case warm/cold | warm <500 ms; cold within five-second useful-content envelope. |
| PERF-PACK-001 | Every core/optional compressed/parsed size and index duration | Within LOG resource ceilings; build blocks hard overage. |
| PERF-AGENT-001 | Cancellation/first progress/timeout | cancel acknowledgement <250 ms local; wall timeout ≤120 s. |
| PERF-VIS-001 | Maximum accepted 2,000-row/5,000-point visual | no hard limit bypass; accessible table remains responsive. |
| PERF-STORE-001 | 500 scenario/cache operations and migration fixture | no silent loss; bounded transaction duration/quota handling. |

Memory is sampled after repeated pack/case/visual open-close cycles; retired indexes/object URLs/listeners must be collectible. A low-memory/mobile smoke may reduce enabled optional layers visibly, never silently alter calculations.

## Acceptance-criteria evidence matrix

| AC | Required proof before QA pass |
|---|---|
| AC-001 | FX-NZ-GEOMETRY + `UT/IT/E2E-UJ-001` all geographies, parity, borders and outside. |
| AC-002 | Generated all-geography scenario matrix with category coverage and no whole-region unsupported shortcut. |
| AC-003 | FX-SOUTHLAND-50 exact unit test, integration snapshot and UI values before formatting. |
| AC-004 | Unit/property/model formula, boundary, invalid, rounding, conservation and minimax mutation tests. |
| AC-005 | Full assessment branch fixtures including approved fossil/economic/community policies and precedence. |
| AC-006 | Snapshot manifest closure, raw/display/source/status and chart/table/text assertions. |
| AC-007 | Source registry/pack integration for Stats/LINZ/Transpower/EA-EMI/EM6/environment or explicit tested disabled reason. |
| AC-008 | Material conflict fixture showing both definitions/times/geographies and exact precedence/unresolved reason. |
| AC-009 | FX-FRESHNESS exact boundary/validUntil/unknown/future and low-concern exclusion. |
| AC-010 | Mock plus opt-in local Llama connector configure/capability/use/refresh without key re-entry. |
| AC-011 | Seeded secret scans across all runtime/build surfaces; replace/clear-one/clear-all. |
| AC-012 | Non-CORS browser test proves blocked request and zero app-relay network calls. |
| AC-013 | Tavily mock plus one opt-in minimal real search, citation, limits, cancel/quota/timeout recovery. |
| AC-014 | Agent modes from every workflow stage; immutable deterministic snapshot before/after. |
| AC-015 | Valid visual plus malicious/unknown/oversized specs, provenance and accessible equivalent. |
| AC-016 | Four audience/lens views compared by underlying record ID/value/source/status set. |
| AC-017 | Discourse/company/legislation typed fixtures, source/version links and representation/allegation safeguards. |
| AC-018 | Comparison and site order with confirmed visible criteria/priorities, trade-offs, missing, no hidden score/best. |
| AC-019 | AI/live/MCP-off deterministic technical/plain brief and separately cited AI appendix. |
| AC-020 | Model-based concurrent persistence, refresh, migration, quarantine, cache expiry and storage failure. |
| AC-021 | Full aggregate build/type/lint/test/a11y/security/privacy/performance/Sites clean-run evidence. |
| AC-022 | FX-EMI complete window, exact POC/NSP, EPSG/Stats, exclusions, DST/units/coverage and no-capacity output. |
| AC-023 | FX-CATALOG map search/layers/markers/project sheet/compare plus accessible equivalent. |
| AC-024 | Offline prepared deep case trusted sections/counts/timeline/discrepancy/pages in both audiences. |
| AC-025 | Community taxonomy/method/missing voices/mana whenua fixtures and no web representative percentage. |
| AC-026 | Proposed→confirmed profile, deterministic classification/order/sensitivity and LLM explanation-only assertions. |

## Requirement coverage audit

| Requirements | Planned evidence groups |
|---|---|
| FR-LOC-001–004, FR-MAP-001–004 | FX-NZ-GEOMETRY/CATALOG, `UT-GEO/MAP`, `IT-MAP`, `E2E-UJ-001`, A11Y-MAP |
| FR-SCN-001–004 | `UT/PROP-VAL`, `SEC-ORIGIN`, `IT-ANALYSE/SAVE`, UJ-003/013/016 |
| FR-CASE-001–004 | FX-CATALOG-AND-CASE, `DATA-CASE/DOC`, `UT/IT-CASE`, UJ-004/007–009 |
| FR-CAL-001–006 | FX-SOUTHLAND/FLEX, `UT/PROP/MODEL-CAL/FLX`, IT-ANALYSE/PARTIAL |
| FR-ASM-001–008 | FX-ASSESSMENT, `UT/PROP-ASM`, UJ-003/014 |
| FR-EVD-001–012 | `UT/PROP-EVD`, `DATA-REG/PACK`, IT-PACK/CASE/OFF, UJ-007–010 |
| FR-EVD-013–015 | FX-EMI, `DATA-EMI`, UJ-011, AC-022 |
| FR-EVD-016–018 | FX-CATALOG-AND-CASE, `DATA-DOC/CASE`, `UT-CASE/EVD`, AC-024–025 |
| FR-AGT-001–008, FR-AGT-011 | `UT/MODEL/SEC-AGENT`, IT-AGENT, UJ-005/007–009 |
| FR-AGT-009–010 | `UT/PROP-SITE`, IT/E2E-UJ-013, AC-018/026 |
| FR-VIZ-001–003 | `UT/SEC-VIS`, IT/E2E-UJ-006, A11Y-VIS |
| FR-CONN-001–008 | `UT-CONN`, `SEC-VAULT/AGENT`, IT/E2E-UJ-002, FX-CONNECTIONS-LOCAL |
| FR-RES-001–004 | IT/E2E MAP/CASE/ANALYSE, A11Y, record-set parity |
| FR-RPT-001–003 | `UT/IT-RPT`, E2E-UJ-015, clipboard manual fallback |
| FR-SAVE-001–002 | `UT/MODEL-SAVE`, `UT-MIG`, IT/E2E-UJ-016 |
| FR-DOC-001–002 | `DATA-DOC/CASE`, E2E deep case, static absence of runtime upload route |
| NFR-PER-001 | PERF suite and release resource-budget report |
| NFR-REL-001–002 | Property/model/contract/integration failure suites and immutable fingerprints |
| NFR-ACC-001 | Automated plus manual accessibility protocol |
| NFR-SEC-001–002 | Static/runtime security protocol, malicious fixtures, seeded scans and CSP |
| NFR-PRI-001 | Network/storage inspection, disclosure/clear flows, no identity/telemetry |
| NFR-EXP-001 | Origin/evidence/AI semantic assertions and trusted report/visual provenance |
| NFR-MNT-001–002 | CTR contract suite, dependency/static boundary rules, late/duplicate/malformed messages |
| NFR-DEP-001 | Production build, Sites preview/deploy and browser matrix |
| NFR-OBS-001 | `SEC-OBS`, local export and seeded-content scans |
| CON-001–008 | Tree/package/network/tool/forbidden-output/static-route audits |

No approved requirement family or acceptance criterion is intentionally untested. The independent reviewer must verify this against raw requirements, not rely on this table.

## Release execution order and evidence

1. Clean dependency install from lockfile; record runtime/browser/OS versions.
2. Static type/lint/schema/dependency/licence checks.
3. Unit/property/model and contract suites with fixed seeds plus recorded randomized seeds.
4. Data compiler on miniature fixtures, then candidate real-source build with sanitized receipts/coverage report.
5. Worker/storage/integration suites in isolated browser contexts.
6. Production build and static package/secret/path/debug scan.
7. End-to-end, accessibility and performance suites against production preview.
8. Opt-in `TEST.md` Llama/Tavily smoke only in the authorized local environment; no values recorded.
9. Independent QA from clean environment, deployed Sites smoke, offline/update/rollback/removal checks.
10. Map every AC-001–026 to durable pass evidence in `10-qa-report.md`; any missing/indirect evidence is not passed.

Failures are fixed at the owning layer, rerun narrowly for diagnosis, then rerun the complete relevant regression group and aggregate release suite. Flaky tests are release failures until their nondeterminism is understood and removed; rerun-to-green alone is not acceptance.

## Independent Gate 3 review checklist

The logic reviewer receives the approved requirements, usage definition, architecture, raw contracts, raw logic map, and this strategy—without the author’s hidden reasoning or requested verdict. The reviewer must:

- enumerate all requirements/ACs and independently detect any missing contract/logic/test mapping;
- simulate Southland, freshness boundaries, minimax counterexample, every assessment branch, site classification, multi-tab persistence, connector/agent limits, visual rejection, offline update, EMI DST/spatial/unit cases;
- challenge data ownership, worker messages, secret flows, evidence authority, graph edges, late/cancel/retry semantics, migration and crash recovery;
- identify every ambiguity that could produce two conforming but behaviorally different implementations;
- propose corrected pseudocode/contracts/tests for each defect and name any material user decision; and
- issue only `validated`, `validated-with-nonmaterial-edits`, or `blocked` with evidence.

Gate 3 can be recorded only after a fresh re-check returns `validated`, all blocking/material findings are closed, all approved upstream hashes remain valid, and state has zero open decisions.

## Normative v0.10 review-reconciliation tests

All suites below are release-blocking. Fixture serializers use exact rational decimal strings and independent expected artifacts; they do not call production helpers to construct their oracle.

### FLEX-V2 - exact continuous optimizer and total results

- `FLEX-CAP-1385`: regional `[100,99,0 x22]`, facility baseline `[50,50,0 x22]`, one-hour slots, movable energy `22 MWh`, the first two source caps sufficient, each of 22 destinations capped at `1 MWh`. Require exact optimum `138.5 MW`, conservation zero, feasible certificate containing it, and independent rational LP agreement. Mutating a destination to `1+epsilon` cannot make a target below the exact physical optimum pass through tolerance.
- `FLEX-FROZEN-125`: preserve the earlier frozen fixture and prove exact result/ledger constraints.
- `FLEX-MAX`: regional and facility profiles each at the `1,000,000 MW` input bound (combined `2,000,000 MW`), exact `0.000001 MW` audit tolerance, derive at most 41 audit iterations, complete without overflow and match oracle. Values one decimal quantum above either input bound fail schema.
- `FLEX-DURATION`: exactly 24 `1` values accepted; a `0.5`, `2`, zero or negative duration rejected; arrays of 23 or 25 rejected with `input_profile_not_representative_v1`. Separate compiler fixtures normalize real 23/25-hour NZ DST days to a declared 24-slot representative profile and retain raw lineage.
- `FLEX-ZERO`: `0%` flexibility and a profile with zero derived source limits return a complete identity: unchanged baseline/shifted profiles, zero ledger/shift/improvement and equal exact primal/dual peak.
- `FLEX-PRODUCER`: independently recompute baseline, peak-hour selection, maximum flexible MW, every source/destination limit and transfer edge from normalized scenario/profile/policy. A caller-supplied mismatch fails before solve.
- `FLEX-DUAL`: independently validate the primary rational LP primal and dual constraints/objectives and zero gap. A mutation where a low source exports while a high source remains above a false target must fail; no max-flow certificate omitting mandatory high-slot export is accepted.
- `FLEX-UNION`: construct and strict-round-trip every `complete`, each legitimate `insufficient` reason and `failed` variant; accessing a field from the wrong variant must be impossible at compile time and rejected at runtime.
- `PROP-FLEX-CONTINUOUS`: random small rational profiles/graphs compare exact optimum to independent vertex-enumeration/LP oracle, including fractional capacities not divisible by common quanta. Discretized-oracle implementations are mutation-killed.

### EVD-V2 - typed facts, authority and immutable closure

- Strict schema fixtures cover every `EvidenceFact` member, typed value/unit, basis, role, definition, national/regional/point scope, observation and forecast validity, and direct/formula/aggregation derivation.
- Each of the five assessments is given a narrative extract that appears to contain a value but no matching FactId; outcome must be insufficient, proving no runtime text parsing.
- Authority matrix fixtures span source type x fact kind x field x geography x purpose x temporal state x derivation. Zero or multiple matching rules fail compilation. Developer claims, AI candidates and unverified extracted statements marked authoritative fail regardless of text.
- National fact, regional fact and point fact cannot substitute for one another without a rule. Forecast ordering rejects `issuedAt > validFrom` or `validFrom > validUntilInclusive`; exact `validFrom`, exact `validUntilInclusive`, one instant after the inclusive end, unknown basis and future-invalid basis prove the approved temporal semantics.
- Resilience evidence fixtures require same-technology verified capacity, positive duration and verified commitment; a boolean label or any missing/mismatched component cannot produce low.
- Snapshot content-address test changes each record, fact, freshness state, conflict, failed source, adapter/source/pack version and `asOf` independently and requires a new ID. A previous result remains fully resolvable after replacing the live pack because its essential closure is inline.
- Malicious source values, derivation cycles, wrong units, invalid geography, missing authority purposes and impossible authority combinations fail before pack emission.

### ASM-V2 - total assessment and representative consultation

- For electricity, water, resilience, economic and community, strict fixtures round-trip `complete`, `insufficient` and `failed` and verify deterministic StatementId, nonempty reason IDs, closed decisive-input references and policy version.
- An unrestricted fossil user assumption produces high with zero FactIds and one exact OriginProof input. An unsupported 10,001-job scenario claim produces moderate with zero FactIds and its exact OriginProof; fabricating an Evidence Fact to satisfy either fixture fails.
- Electricity binds the complete flexibility trace and achieved post-flex added peak; water binds both annual and peak-day calculation traces. Mutating any referenced calculation/flexibility trace changes the assessment/result hash, and omitting it rejects.
- Water requires annual and peak-day typed limits; missing either is insufficient. Outcome is the worse of the approved annual and peak-day bands.
- Representative methodology exercises empty population/frame/measure, zero or inconsistent counts, date/geography mismatch, missing limitations, unauthorized evidence and deterministic qualification reasons.
- Community precedence covers current qualifying categorical high, low and moderate; low succeeds only with qualifying representative methodology, while a formal-summary low without it is insufficient; formal current cited moderate/high remains legal; mixed incompatible same-population categorical facts -> insufficient; anecdotes -> insufficient. Support/opposition percentages at `0,15,35,70,100` remain contextual and never derive a band. Mana whenua never changes the band and always renders separately.
- Result snapshot strict-decodes exactly five `CategoryAssessment` values plus calculation trace references; every complete/insufficient/failed category variant survives freeze/restore without old `AssessmentResult` coercion.
- Overall assessment enumerates all category combinations with exact precedence: any high -> high; otherwise any failed -> failed; otherwise any insufficient -> insufficient; otherwise any moderate -> moderate; otherwise all-low -> low. Its category StatementIds/reasons survive byte-identical replay.
- Economic contradiction requires every key member. Change one of definition, role, scope, time overlap or price year and verify records remain separate rather than contradictory.

### SITE-V2 - operands, boundaries, classification, grouping and sensitivity

- Every numeric/enum/distance/area/evidence-presence criterion runs pass/partial/missing/fail/not-applicable fixtures, inclusive/exclusive equality, direction, exact unit conversion and invalid missing policy. Only a false declared applicability rule yields N/A; missing data never does.
- `MissingPolicy` accepts only missing or partial. Unavailable/partial input can never emit fail or any exclusion/specialist/infrastructure outcome; mutation-adding `finding_fail` to the missing-policy enum is killed. A fail requires an available observed value that violates the exact comparator.
- Geometry fixtures pin WGS84 geodesic engine/version, points on either side and exactly on a boundary, invalid geometry and conflicting layers.
- Unconfirmed preferences and confirmed ordering-only preferences never alter classification. The classification ID set must exactly equal criteria flagged `affectsClassification=true`; omission/addition/duplicate or confirmation-hash mismatch rejects.
- Five domain outcomes are exhaustive under the exact precedence: an exclusion fail -> excluded; otherwise specialist fail -> specialist assessment required; otherwise infrastructure fail -> infrastructure upgrade required; otherwise hard missing/partial -> insufficient evidence; otherwise included.
- Every domain outcome maps exactly to the three presentation groups: included -> passes declared constraints; excluded -> excluded; specialist/infrastructure/insufficient -> needs investigation. The map group never replaces or hides the domain outcome.
- `SITE-GROUP-SEPARATE` proves no global rank/ARIA position or cross-group ordinal exists and lexicographic ordering/tie by candidate ID applies only within groups. It is the release configuration. `SITE-GROUP-WORKFLOW` proves an attempted cross-class release configuration is rejected under the approved policy.
- `SITE-MAP-FIRST` selects regions and candidate features across all New Zealand by pointer, touch, keyboard map navigation, place search that focuses/confirms a map feature, and the synchronized accessible map list. Map and panel share exact IDs/state; automated DOM and interaction checks reject checkbox or drop-down geography/site selectors on desktop and mobile.
- Strict `SiteFindingV2`, `SiteProfileCandidateV2`, `ConfirmedSiteProfile`, `CandidateScreeningV2` and `SensitivityResultV2` round-trips retain the five domain outcomes and separate three-group presentation. Sensitivity mutates exactly one declared operand/value at a time; undeclared numeric steps, model-invented variants or weighted scores are rejected.

### AGENT-CONN-V2 - worker isolation, limits, dedupe, restart and secrets

- Every command/event in the closed worker graph round-trips: map viewport/place search, coordinate resolution, pack asset load, case load, impact-brief load/build, scenario normalization, analysis snapshot, comparison, site profile confirmation/screening/sensitivity, evidence and graph query, visual resolution, two-stage research fetch/compile, projection, agent execution, destination-disclosure authorization, connector normalize/commit/discard/capability/replace/persist/clear/remove/clear-all, pack validation and exact cancellation acknowledgement. Unknown kinds/fields and wrong command/result pairs reject.
- The coordinator harness proves every architecture-owned operation crosses `WorkerCommandV2`/`WorkerEventV2`; a hidden direct module call or worker-to-worker channel fails. Wrong worker kind, target/producer instance, epoch, operation, request or generation is obsolete; cancellation terminalizes once and late terminals are ignored.
- Architecture harness records all message ports: main coordinator requests the analysis projection, validates bytes/hash/epoch and clones it to connector; any connector-to-analysis channel or call fails.
- Every `WorkerCommandV2` targets and every `WorkerEventV2` produces the exact current instance/epoch; stale/missing/wrong epoch messages are obsolete. `AgentRequestV2.stage` drives every StageContext projection and every terminal variant attaches one `AgentExecutionReceipt`.
- Exercise every StageContext variant, including an unsaved normalized draft, and reject wrong-stage IDs, omitted context category, oversized bytes, hash mismatch and executable content.
- Hit equality and one-over independently for model calls, format repairs, model-emitted tool requests, new logical tool calls, concurrent tools, wall time, per-network-call time, transient retries, context bytes, response bytes, output tokens, citations and research items. Count every contacted HTTP attempt immediately before fetch, including failed calls/retries, while a formatting repair consumes a logical model call and the one request-level transient retry counter. Hanging fetches abort at the per-call deadline; repeated 429/5xx exhausts the single allowed retry; auth/CORS/redirect/schema/cancel/non-idempotent failures never retry.
- Reject limits where format repairs are not below model calls, per-call timeout exceeds wall time, enabled concurrency exceeds logical tool calls, logical tool calls exceed tool requests, disabled tools have nonzero request/call/concurrency/scope/route-binding fields, or enabled tools have an empty/unregistered scope or zero/multiple route bindings for one scope.
- Output-token fixtures verify the declared dialect limit and exact receipt count; when provider usage is absent, the conservative UTF-8-byte upper bound stops at equality before any one-over content is exposed. Citation/research overflow produces one typed partial terminal when validated cited content exists, otherwise failed, with deterministic UI unchanged.
- Final receipt embeds two distinct exact collections: canonical `acceptedDisclosureAcceptances`, including request-preaccepted or dynamically accepted grants whether used or unused, and gap-free `contactedNetworkAttempts: AgentOutboundContactReceiptV2[]`, containing exactly one member per started fetch/retry. Every contact resolves its acceptance/content/configuration/route and `networkAttemptCount == contactedNetworkAttempts.length`; an accepted-but-unused grant has no contact. Mutate either collection, sequence, purpose, attempt identity or binding and reject the terminal.
- Receipt counter oracle requires `toolRequestCount == toolCallCount + sameCallReplayCount + preallocationRejectCount` and `toolCallCount == toolReceipts.length`. A unique child tool operation ID exists only for each new logical call. Same ID/same args increments request+replay only and returns the existing receipt/result without appending it; same ID/different args increments request+preallocation-reject and fails before disclosure/child/network; new ID/same operation increments request+logical call and atomically stores a unique-child network-false alias+receipt; new ID/new operation does the same with one network execution.
- Run same-ID/same-arguments replay before and after durable-index reconstruction when `toolCallCount == maximumToolCalls`; it remains legal until `maximumToolRequests` equality and the request-limit one-over terminalizes without a child/receipt/network. Run same ID/different args before/after restart, and new ID/same/new operation at equality/one-over. Assert exact counters, receipt lengths, child uniqueness, alias reconstruction and zero repeated network at every crash boundary.
- Exact alias fixture executes call A/op X, replays A/X, dedupes call B/op X, crashes, rebuilds indexes, then submits B/op Y and must reject before disclosure/network. Duplicate child tool operation IDs, agent-operation ID reuse, duplicate same-ID receipt append, missing alias/receipt/replay edges, counter disagreement and transaction-hash mismatch fail restore.
- Retention/clear of any tool replay/alias/receipt expands visibly to the exact three-store dependency closure; interruption at every alias/receipt/replay boundary resumes without orphaning or resurrecting an index.
- Queue agent and non-agent operations and cancel each queued/active position independently using the exact worker/instance/epoch/operation/request/generation target. The cancel command receives one acknowledgement. Only the matched agent original receives one `agent_terminal(status=cancelled)` with final receipt/cancel-command ID; a queued agent receipt is derived from its hash-valid `AgentExecutionBindingV2`, has zero activity counters, empty contact/tool arrays, the byte-identical request accepted set and equal start/finish time. Mutating binding/configuration/matrix/route/dialect/model/label identity rejects queue admission or execution without network. Only a matched non-agent original receives `operation_cancelled`. Exercise cancel-before-start/fetch/stream/parse/tool/hash, while suspended for every model/tool disclosure, after-terminal race, wrong target, worker restart and late output; assert no original receives both families, siblings remain byte-identical and no automatic retry occurs.
- Compile the exact five-entry `ReadOnlyToolRegistryV2`; each canonical ID accepts only its discriminated arguments, connector kind, route capability, result kind, mode/stage and read-only side-effect class. Unknown/write-like/model-invented/server-advertised tool IDs, mismatched toolId/arguments, prompt-injected discovery and remote MCP schema-hash substitution fail before dispatch with zero network.
- Tool arguments containing an active secret or credential/key/authorization pattern reject before disclosure, hashing, replay persistence or network; canary inspection covers tool operation/receipt/replay/alias stores and diagnostics without printing matches.
- Primary model, model+Tavily, model+remote-MCP and direct-research fixtures prepare a separate disclosure for each exact connector/configuration/origin/route/operation/purpose/tool/outbound-content hash. Exercise the initial model body, tool-result continuation, format-repair body and a third continued-reasoning call with a one-bit body change each. At every call a missing acceptance pauses on `destination_disclosure_required`; accept resumes only after the target-bound command acknowledgement, while decline, expiry and cancellation perform zero network and yield the exact terminal receipt.
- Supply zero, one and two `ToolRouteBindingV2` records for one enabled canonical tool while two same-kind Tavily or remote-MCP connectors are compatible. Only the single exact binding admits the request and the network origin/configuration/route must match it; connector array order, provider discovery and model output never choose. Preaccept one unused model/tool disclosure and dynamically accept one used and one unused disclosure; assert all three occur in the accepted set, only contacted ones occur in network attempts, and every contact acceptance hash resolves exactly once.
- Tool operation/receipt/replay records bind the exact connector ID/kind, configuration hash, route ID, arguments, acceptance and registry entry. Replay after connector substitution/configuration change either uses the already-recorded result without network or rejects; it can never execute through a different destination.
- Connector negative suite covers constructed URL revalidation, userinfo, fragment, secret parameter/name/value, path traversal, default/nondefault port, cross-origin and same-origin redirects, authorization in every undeclared place, CORS failure and cache/referrer/credentials settings.
- Connector refresh round-trip persists and restores exact connector kind, sanitized origin/label, public-path or sensitive-vault-route discriminator, random opaque route-policy/route IDs, model ID, Auto/Responses/Chat/MCP/Tavily preference and selected dialect, authorization placement, allowlisted non-secret headers, persistence mode and every capability state. A public endpoint restores its public path; a sensitive endpoint reconstructs its exact path/query only through the vault. Capability tests require a matching `connector_test` disclosure for every exact route/request; a missing or substituted test acceptance performs no network. Changing/omitting any public field or assuming one untested capability fails AC-010.
- The connector setup harness runs normalize-draft -> explicit commit -> capability test -> first successful use -> persist-after-success. Before success only staged/session material exists; after success the selected persistent mode survives refresh. Draft cancellation/expiry destroys staged secrets, and endpoint/model/header/auth/config-hash changes invalidate the 24-hour capability matrix and selected route.
- A sensitive key-bearing endpoint with `secretIngress=none` is still credential material: encrypted/disclosed persistence after first successful use restores its vault route without path/query re-entry, while a truly unauthenticated public endpoint with no secret is session-only/not-applicable.
- When a sensitive route and a separate API credential are both configured, the vault receipt names exactly two credential records; persistence/clear is atomic across both and no generic repository path can enumerate either.
- Structured-clone control tests transfer dedicated secret/key-bearing endpoint buffers once, prove sender-side detachment and receiver-side zero-fill after import/staging, reject JSON/stringification and exclude credential/handle types from every public JSON Schema. AES-256-GCM fixtures require a non-extractable 256-bit key, fresh 12-byte IV, connector-bound AAD, base64url syntax, exact decoded lengths and 16-byte tag; one-bit mutation fails authentication without leakage.
- Seed independent sensitive path, query, userinfo and fragment canaries. Userinfo/fragment inputs reject inside the vault; accepted path/query bytes remain vault-only. Prove no canary occurs in draft/configuration/hash/events, any non-vault IndexedDB store, diagnostics, prompt/history, agent/visual/brief/export/clipboard values, source maps or builds; guarded fetch reconstructs the accepted route and clear/remove destroys it. Citation/config/error serializers also reject endpoint URLs and active-secret equality without printing match content.
- Vault suite covers encrypted persistent, disclosed browser-local and session-memory variants, non-enumerability/read-back prevention, storage denied/private mode, explicit fallback consent, reload persistence, clear-secret versus remove-configuration receipts, and full vault clear recovery.

### PRODUCT-V2 - catalog, pack, graph, community, brief, disclosure and diagnostics

- Generate/compile every new effective public root using only `GridLensPublicContractV2`. Mutation-delete every `DataPackManifestV2` dependency, asset hash, source, licence, attribution, purpose or coverage field; wrong pack key/hash/asset/source-registry binding or a pack manifest listing its own manifest asset fails before activation and leaves the prior release active.
- Project fixtures contain exactly one existing, one proposed and one candidate record with distinct non-colour marker semantics. Each project map feature resolves one exact `ProjectCatalogRecordV2`; search/map/list IDs match, and the selected `ProjectSheetV2` retains status, capacity, stage, resolved/ambiguous owner/operator records, People/Planet statement records, coverage and fixed actions with no score. Orphan/duplicate/hash-mutated statement/company/catalog records fail the whole catalog pack.
- Every requested or returned layer ID resolves exactly one `MapLayerDescriptorV2`. Exercise all ten categories and enabled/qualified/disabled states with exact labels/reasons, sources, date, licences, coverage, confidence, geometry and zoom relation; missing/extra descriptors, a feature on an undeclared layer, unknown reason, unresolved statement or fabricated metadata reject before map rendering.
- Exercise every `EvidenceEdgeTypeV2` with its legal discriminated source/target node kinds and every derivation/state; swap any endpoint kind and require rejection. Every effective evidence/graph document locator compiles only as one `PageLocatorV2`; `{}`, page zero, document-without-locator, locator-without-document, partial or mixed variants and the legacy `PageLocator` fail public-schema compilation. Delete or alter a node, edge, content hash, graph entry, statement/company record, evidence link or snapshot binding and require pack/case/query rejection. AI candidate/rejected edges never enter trusted traversal or elevate authority. Reload and offline pack replacement retain the old immutable graph for old cases.
- Cross every community stance, theme, stakeholder and evidence-quality variant with date/geography/source/limitation fields. `mana_whenua` requires distinct=true and all others false; representative requires a qualifying methodology; web discourse cannot be representative. Removing any taxonomy/source/limitation field or folding mana whenua into a percentage fails AC-025.
- Map-to-case-to-brief E2E runs prepared-only/offline: query map/layers/catalog/sheet, resolve every trusted statement and company identity/claim role, follow the stable `caseAssetId` through `ProjectCaseLocatorV2.prepared_asset`, load the deep case and recompute its snapshot ID with exact catalog/graph/community/question/missing-voice/company closure, build and atomically persist `ImpactBriefV2` in one forward canonical-hash pass, then restore the case through `immutable_snapshot` and the byte-identical brief by route/hash before copying both Markdown and text. Deterministic sections/disclaimer/sources/semantic hash remain complete with AI/live/MCP disabled; malicious/stale AI can appear only as a separately labelled validated appendix.
- Brief crash points before repository mutation, between envelope/receipt writes and after commit prove no orphan/partial brief. Public brief writes reject; strict delete/clear and store caps work. Clipboard denial returns `manual_copy_required` with the exact content/semantic hash and an embedded, hash-valid selectable-guidance `TrustedStatementV2`.
- Deleting a result/case referenced by a live brief is blocked with only dependent counts. A clear plan expands to every dependent brief, deletes briefs first and resumes after each crash boundary; deleting only a brief preserves all source snapshots.
- For every agent stage and connector-test/direct-research path, prepare disclosures containing exact request/operation/generation, connector/configuration/origin/route, operation kind/model purpose/tool ID, outbound-content hash, prompt hash when sent, context categories/hash, send flags, retention state and cancel/clear controls. Explicit acceptance binds each destination independently; the final agent receipt separately embeds the canonical accepted set and actual contact attempts without prompt/query text. Expiry or one-bit change in any bound identity/content field invalidates only that acceptance before projection/network. No global, category-only or untyped disclosure side argument is accepted.
- `TrustedStatementV2`, `UnresolvedQuestionV2`, `MissingVoiceRecordV2`, `CompanyIdentityRecordV2` and `CompanyClaimRecordV2` round-trip every variant. For all six question scopes, accept every subject kind listed in the closed matrix and reject every omitted scope/kind pair, opaque ID, orphan and duplicate. A brief-scoped question accepts only stable project/company/geography/site-candidate/evidence/statement IDs already in its closure; injected current-brief or older-brief hash variants fail strict schema before hashing. Construct an open-question brief, compute its hash in one forward pass, mutate each question/subject/statement hash and reject, then restore the byte-identical brief offline. Official findings require regulator/court authority; allegation, company claim, response and unresolved item remain distinct. Delete/mutate one statement, locator, question, missing voice, company candidate, role or hash and reject the containing product rather than rendering partial trusted text.
- Produce each legal `DiagnosticEventV2` and reject unknown fields, raw errors, URLs, paths, prompts, scenarios, documents, evidence text and seeded secrets. Event hash round-trips through the bounded local ring/export, and network inspection proves diagnostics are never telemetered.

### PACK-MAP-V2 - closure, hashing and public types

- Swap same-sized asset bytes, wrong PackId mapping, missing manifest/data asset, wrong kind, duplicate AssetId, dependency cycle, truncated byte length and post-parse hash mutation; all fail before activation.
- Mock WebCrypto proves every required byte object is hashed before parsing and every parsed object is bound to asset/pack/release hashes.
- Strict MapFeature fixtures cover point/line/area, inline and referenced bounded geometry, stable ID, scope, evidence/source/licence, time, coverage/confidence and qualification. Missing lineage/oversize geometry/unknown layer rejects.
- Compile-time and runtime fixtures compile the actual `GridLensPublicContractV2` transitive graph and close every referenced identifier, including `SemVer`, strict locators, layers, trusted statements, questions/missing voices, companies/claim roles, the read-only tool registry, IDs, dates, connector/migration records and all V2 roots. Importing any superseded old root (including legacy `EvidenceRecord`/`PageLocator`), or using `any`, an open object/string enum, ambiguous featureKind/geometry pair or unresolved shorthand fails.
- Generate real TypeScript declarations and strict JSON Schema from the public graph. Validate every `SanitizedToolResultV2`, `VisualFilterV2`, terminal-result and per-store command variant; mutation-kill dependent payload lookup, status-refinement notation, arbitrary JSON, catch-all objects, free-form expressions and store/payload mismatches.
- Compile every explicit `TypedScalar`/`TypedChange` variant and reject scalar-kind/unit mismatches; no refinement or `same kind/unit` shorthand remains. Independently generate TypeScript/runtime guards for `GridLensStructuredCloneContractV2`; prove secret buffers/handles and `CredentialRecordV2` are unreachable from every JSON Schema root.
- Reproducibility fixture consumes one asset/feature/layer/evidence/fact/statement/question/missing-voice/company/claim-role/tool-registry/geometry-engine/Stats-geometry record at a time and requires every corresponding hash in `ReproducibilityManifestV2`; deleting any consumed hash fails, while an unused loaded object is omitted.
- Reproducibility mutation test adds/removes one actually-consumed hash and requires fingerprint change; loading-but-not-consuming an optional pack does not change the operation manifest.

### SAVE-V2 - typed commands, caps and resumable clearing

- Generate every legal explicit caller command and reject wrong payload/action, payload on delete/clear, missing expected revision and unknown action. Forged public writes to results/comparisons/cases/briefs/research/agent receipts/tool replay/tool aliases/tool receipts/migrations/operation receipts/quarantines reject before repository dispatch; no recursive receipt path exists.
- Public create/update/delete of connector configuration also rejects; only successful connector-control configure/capability/vault operations may issue the repository-internal sanitized configuration mutation, preventing orphaned secrets.
- `selected_application_data` clear plans reject `connector_config`, vault targets, `includeVault=true` and every non-`GenericClearableStoreV2` value. Per-connector `remove_connector_configuration` persists a strict `ConnectorRemovalJournalV2` for the exact configuration plus zero/one/two credentials and optional sensitive route, destroys vault records first, resumes after every phase/count boundary and never exposes vault IDs or touches a sibling connector.
- `all_application_and_connectors` accepts only the canonical complete store set, `includeVault=true`, and the displayed exact connector/configuration hashes plus vault-record counts bound by confirmation. Exercise zero/one/two vault records, clear one versus clear all, target-set drift and crashes before/after every vault/config/control-receipt boundary; prove configuration remains when vault deletion fails, post-vault crash resumes config removal, and no orphan, resurrection or unrelated deletion occurs.
- Same operation ID/same canonical command hash returns the byte-identical original receipt with its original outcome; same ID with one changed action/store/record/revision/payload/clear-plan bit returns `operation_id_conflict` without changing that receipt. Crash points before/after data and receipt commits prove atomicity.
- A live envelope cannot carry `deletedAt`; tombstone cannot carry payload. Corrupt/old/origin-proof-bearing scenarios quarantine, while valid raw drafts renormalize origins and retain immutable result/evidence/brief references.
- Hit each per-record/count cap, hard total cap at 200 MiB, warning at 160 MiB, browser quota denial, exact 5,000 tombstone cap, operation-receipt cap and quarantine cap. Failure is visible and changes no prior record; no automatic compaction runs.
- Prompt history is disabled by default; when explicitly enabled its separate schema/cap/expiry/clear control cannot affect research or scenarios. Research/prompt/tool-replay expiry creates a visible selected-data plan. Interrupt both clear-plan variants after every applicable store/vault/config boundary, including operation receipts last; the separate `gridlens_control` plan survives and resumes remaining targets exactly once.
- Research reload/inspect returns the exact retained sanitized query, hash, connector, result/evidence IDs, URLs, initial/retrieval times, freshness, expiry and schema versions with prompt history disabled. Refresh resubmits that exact query, preserves the original retrieval time, creates a new revision and never relabels an expired prior result as fresh; secret-shaped query content is rejected/redacted under the declared boundary.
- Initial and refresh research both require connector `fetch_research` with an exact direct-research destination/content acceptance, followed by analysis `compile_research`. Request/envelope identity or connector/config/route/tool/query/acceptance mismatch performs no network. The fetch result schema rejects EvidenceId, FactId, authority and freshness fields; only analysis assigns candidate IDs/freshness and constructs/persists `ResearchCacheRecordV2` with the exact acceptance hash. Hidden connector-to-evidence writes and direct connector cache records fail.
- Crash before analysis compilation, after compilation/before repository commit, and after atomic research-envelope+receipt commit proves no orphan IDs or partial record. Embedded candidate record/fact ID sets must match exactly and the prior expired revision remains byte-identical.

### OFF-V2 - real multi-client generation protocol

- Playwright/WebDriver harness opens three clients: two busy and one ready. Verify candidate waits, every client sees notice, no `skipWaiting`, immediate reload disabled for busy operations, and activation only after all old clients close/navigate/reload.
- Simultaneous discoveries serialize; queued newer candidate begins only after first terminal state. New boot revalidates manifest.
- Network/hash/schema/cache-quota/storage-pressure failures delete candidate only and continue serving active generation. Optional caches are generation-specific. Previous active generation remains usable as rollback.
- Run the same suite with BroadcastChannel absent, using service-worker client messages. Concurrent tabs never mix release/data versions.

### EMI-V2 - source keys, joins, aggregation, DST, coverage and quality

- Schema fixture pins all required columns, business partition key, exact source-row identity, RTD case and greatest RunDateTime/lexicographic CaseID precedence. Multiple runs in one business partition compete correctly; byte-identical exact-row duplicates dedupe/count, while same exact identity/different values is unconditional failure.
- NSP fixtures include composite ID, participant, current flag, network reporting region and effective start/end trading periods. Exact effective row, no row, overlapping agreeing rows, coordinate disagreement and invalid NZTM exercise every exclusion branch. Valid coordinates transform EPSG:2193 -> WGS84 and enter the same Stats polygon resolver as the map; known interiors, shared-boundary lexicographic tie and outside/unmatched points are tested. Network reporting region remains a separate dimension and cannot set Stats GeographyId.
- One interval contains two POCs, duplicate load rows, multiple unique generation units and negative/zero/positive loads. Oracle proves: one load/price per POC; generation per unique unit; region load/generation sums; load-weighted price uses only unique positive-load POCs; zero denominator -> null.
- Raw UTC, NZ local, offset, fold, MW/NZD-per-MWh units and flags round-trip. Spring-forward expects 276 five-minute instants; ordinary 288; fall-back 300 with both folds. Integrating MW uses actual duration and emits MWh; summing MW over time as power/capacity fails invariant tests.
- Coverage fixture independently changes source-time, eligible-POC and one geography numerator/denominator so no metric can substitute for another. A geography below partial is suppressed, never averaged into national completeness.
- Search-window fixture exercises day 0, day 45, day 46, newest complete, newest partial and no publishable window. Quality fixtures run every exact Balanced equality boundary: complete `0.90/0.85/0.70`, partial `0.75/0.65/0.50`, and one decimal quantum below each.

#### Bounded official dry run, 2026-08-06

The calibration downloaded no persistent source file and processed official public EMI daily CSVs for 2026-08-01 through 2026-08-05 plus the 2026-08-05 NSP mapping. It is not a 12-month completeness claim.

| Trading day | Source-time completeness | National observed-POC interval coverage | Minimum mapped-region daily coverage | Canonical duplicate keys | Dead/disconnected rows |
|---|---:|---:|---:|---:|---:|
| 2026-08-01 | 92.7083% | 89.3358% | 79.8611% | 0 | 0 |
| 2026-08-02 | 88.1944% | 86.2301% | 76.7361% | 0 | 0 |
| 2026-08-03 | 95.8333% | 92.6857% | 82.0312% | 0 | 0 |
| 2026-08-04 | 96.5278% | 92.8230% | 81.6551% | 0 | 0 |
| 2026-08-05 | 97.2222% | 93.6003% | 73.6111% | 0 | 0 |

Observed live schema columns were `TradingDate, TradingPeriodNumber, IntervalDateTime, RunDateTime, CaseTypeCode, CaseID, PointOfConnectionCode, UnitCode, PlantName, Island, LoadMegawatts, InitialMegawatts, GenerationMegawatts, LocationFactor, DollarsPerMegawattHour, IsDeadFlag, IsDisconnectedFlag`. The latest day had 70,763 rows, 280/288 source instants, 218 POCs, no blank load on `N/A` rows and no blank price.

#### Approved owner decision `g3-emi-quality`

Approved Balanced v1 thresholds, calibrated to preserve honest utility without presenting sparse data as complete:

- `complete`: source-time >= 90%; national eligible-POC interval coverage >= 85%; every published geography >= 70%;
- `partial`: source-time >= 75%; national eligible-POC interval coverage >= 65%; publish only geographies >= 50%, with an unavoidable partial-data label and exact coverage;
- `not_published`: below either partial national threshold, no geography at/above 50%, or an unconditional failure;
- unconditional failures: unknown/missing required schema or units, invalid timestamp/offset cadence, conflicting values under one canonical identity, a source checksum mismatch, a mapping/transform version mismatch, or aggregate conservation/recomputation failure. Coordinate/geography conflicts on individual POCs are recorded exclusions and become a build failure only if they cause coverage to fall below threshold;
- search backward at most 45 NZ calendar days for a complete rolling 12-calendar-month window, then use the newest partial window only if it meets partial thresholds; otherwise do not publish.

This recommendation would classify four of the five sampled days as complete on source-time/national thresholds; 2026-08-02 would be partial, and each geography would be independently complete/partial/suppressed from its own coverage. The real rolling-window build still calculates and publishes its exact metrics.

### DOC-CASE-V2 - verified statements and exact case semantics

- Every `PageLocatorV2` variant must be non-empty and exclusive; `{}`, page zero, partial/mixed variants and legacy `PageLocator` imports reject through both `EvidenceRecordV2` and graph roots. Candidate extraction has zero evidence/edges. Only curator verification creates evidence/edges and a correction changes output hash. Rejection remains edge-free.
- Content-hash mismatch, extractor-version drift and locator fallback are visible. LLM candidates can never self-verify.
- Every prepared event requires nonempty evidence; typed `project_event_date` facts produce exact/range/disputed outcomes, while no qualifying date produces explicit undated/missing. Agreeing exact dates, overlapping ranges and disjoint conflicts retain FactIds/ConflictIds and stable ordering.
- Strict `ProjectCaseV2` accepts exactly the ten CaseSection values, requires a state for each, embeds one hash-valid catalog record, graph snapshot, trusted statement/question/missing-voice/company/claim-role closures and controlled community-record set, references only ProjectEventV2/CaseSourceCounts, and binds case/evidence/graph hashes plus stable release ID. The runtime envelope supplies the later-built release-manifest hash; embedding that hash back into the case asset is rejected as cyclic. Any orphan/role/locator/hash mismatch rejects the case atomically.
- Source count fixture crosses AI-candidate/developer precedence with every temporal state and qualification. Current/forecast-valid qualifying records alone enter current; stale, unknown, future-invalid, forecast-expired and nonqualifying current records enter distinct visible buckets. Every record is linked and counted once, total equals all eight buckets, and missing/conflict counters stay separate. Community/evidence/statement/question/company records, mana-whenua subset and typed missing voices reconcile exactly and remain separate.

### VIS-V2 - lineage, rejection and equivalent outputs

- A cited `narrative_panel` succeeds with no bindings or series, resolves every citation/evidence lineage and produces the same accessible equivalent. Missing/forged citations reject. Every chart/map/table primitive requires nonempty bindings and series.
- Every closed `VisualFilterV2` predicate/combination round-trips at exact depth one and 1/20-predicate boundaries; 0/21 predicates, recursion and node-count mismatch reject. Numeric and local-date compare/range fixtures succeed with exact kind/unit; wrong field-schema hash, scalar mismatch, boolean/text ordered comparison, enum `one_of` mismatch, empty/inverted range, coercion, arbitrary HTML/URLs/scripts/expressions, unknown operators and catch-all objects reject.
- Missing/null field values make only that predicate false and then follow exact `all|any` truth tables; null-as-zero, null-as-empty-text and null filter literals reject.
- Strict `VisualSpecV2` annotation fixtures cover trusted data point, cited source statement, labelled model inference and labelled uncertainty. Empty lineage, unresolved scalar, missing citation, unlabelled inference and unsupported factual text reject in `ResolvedVisualModelV2`.
- Every series/annotation mutation of asset/feature/evidence/fact/snapshot hash invalidates resolution. Model text cannot create a lineage ID.
- `VisualOutcomeV2` success requires `ResolvedVisualModelV2`, `VisualExecutionReceipt` and one `AccessibleVisualEquivalent`; failure requires a trusted fallback and the equivalent. Receipt covers request/operation/generation, model and endpoint labels, spec/context/snapshot/release/data IDs, source IDs, times and disclaimer. URL/key-shaped labels reject.
- Screen, copy and export are parsed back to an `AccessibleVisualEquivalent`; require identical semantic hash, model/source label, summary, table and disclaimer. Clipboard fallback preserves the same semantics.
- On every validation/resource/security failure the deterministic trusted table/default remains available.

### ROUTE-REG-PLATFORM-V2 - restoration, education, registry and budgets

- Route round-trip/back/forward/deep-link fixtures cover map/place with exact layer/text/company/catalog records, project case with graph/community/question/missing-voice/company closure, unsaved draft, result, comparison, evidence/fact/strict-locator/graph, site profile/candidate, persisted impact brief with trusted text/company roles and settings. Missing/orphaned/hash-mutated immutable records, unsupported version and release drift produce exact restoration variants without mutating old snapshots.
- URL/history fuzz rejects whole payloads, prompt text, connector endpoints, secrets, identity and opinion. Draft restore always renormalizes origins.
- Guided education exact sequence asks relationship/location, then issue, explains source-linked raw values, asks what is unclear and completes. Storage/diagnostic/URL inspection proves none of the answers persist.
- Source registry oracle requires exactly 17 entries: Stats NZ, LINZ, Transpower, Electricity Authority/EMI, EM6, LAWA, NIWA, GeoNet, Data.govt.nz, EECA, Ministry for the Environment, NZTA, NZ Legislation, NZBN, Companies Office, EPA/council and Tavily. Exercise exact shipped labels `enabled`, `prepared-only`, `link-only`, `agent-only`, `disabled` and their one-to-one legal retrieval modes plus authority purposes, supported fields, routes/assets, origins/methods, auth, CORS, licence/attribution/purpose, quota/cadence, spatial/temporal resolution and fallback; omission/duplicate/rename/bad combination/reasonless entry or mismatched pack binding fails build.
- Stable invariant-ID lint requires exactly one meaning for each INV-001..INV-038 and scans every reference; duplicate/missing IDs fail.
- Release-blocking matrix runs current stable Chromium, Firefox and WebKit desktop, mobile-equivalent WebKit viewport/touch, plus real iOS Safari or Android Chrome smoke. Explicit feature-off runs prove WebGL, IndexedDB, persistent CryptoKey, BroadcastChannel and Clipboard fallbacks.
- Hit every CTR-021 cap by exact equality and one unit over: shell/core/optional packs, retained generations/cache, IndexedDB, compiler bytes/rows/expanded bytes, worker queues/concurrency, agent context/response/output-token/per-call/retry/tool/citation/research ceilings and visual sizes. Equality succeeds; overflow emits the typed visible failure without truncation or prior-state loss.

### Approved SITE owner decision `g3-site-grouping`

Approved: `separate_classification_groups`. The UI shows `passes declared constraints`, `needs investigation`, and `excluded` as visibly separate map groups with synchronized result panels; confirmed preferences sort only within a group and the product exposes no global rank. Whole-NZ selection remains map-based, never a checkbox/drop-down geography or site selector.

These are presentation groups only. Every candidate still displays one exact domain outcome: `included` maps to passes; `excluded` maps to excluded; and `specialist assessment required`, `infrastructure upgrade required`, and `insufficient evidence` map to needs investigation.

### Gate 3 re-review entry checklist v0.10

- Confirm the state ledger records Balanced `g3-emi-quality` and separate-groups `g3-site-grouping` with zero open decisions.
- Prove approved Gate 1/Gate 2 artifact and state hashes remain unchanged; do not re-record or reinterpret their user approvals.
- Run structural ID/traceability/unknown-type scans, generated TypeScript/strict JSON Schema compilation and mutation fixtures, exact-secret source/build scan, markdown encoding/fence scan and `git diff --check`.
- Re-test G3V08-001 through G3V08-004: one agent cancellation terminal, exact per-destination disclosure/read-only routing, connector/vault clear dependency, and strict locator/layer/text/company product closure.
- Re-test G3V09-001 through G3V09-003: every model/tool outbound authorization transition and single frozen tool route, satisfiable same-call replay accounting before/after restart, and the exact acyclic question scope/subject matrix.
- Give the independent reviewer only the current raw artifacts and require a fresh requirement/AC enumeration plus a `validated` verdict.
