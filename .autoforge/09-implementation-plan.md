# GridLens NZ — Design 1 implementation plan

**Artifact version:** 1.0  
**Status:** implementation-ready  
**Gate basis:** Requirements 0.4 approved; Usage Definition 0.4 approved; Architecture 0.3 Option A approved; Contracts/Logic/Test Strategy 0.10 independently validated in `08-logic-review.md`; `state.json` records Gate 3 `validated` with zero open decisions.  
**Delivery target:** OpenAI Sites capability path, isolated under `design-1-browser-first/`.

## 1. Outcome and delivery posture

Build a presentable, honest browser-first GridLens NZ vertical slice first, then complete the remaining release-hardening slices without changing the approved behavior.

The three-hour milestone is successful when a reviewer can:

1. use a whole-New-Zealand map to select a region or map feature without a checkbox or drop-down geography selector;
2. run the Southland 50 MW fixture and see exact deterministic values (`65 MW`, `455.52 GWh`, `19.5 MW`) before any AI response;
3. inspect candidate sites on the map in three separate presentation groups while each marker/panel retains one of the five domain outcomes;
4. open prepared project/evidence context, switch Public/Decision-maker and People/Planet presentation without changing the underlying record, and copy a deterministic impact brief;
5. configure a custom OpenAI-compatible endpoint plus Tavily/MCP research route, make direct browser calls only to accepted HTTPS/CORS destinations, persist credentials only after successful ordinary use, refresh, and reuse them; and
6. ask a cited question and render one schema-bound trusted visual with an accessible table/text equivalent.

Prepared, versioned fixtures are acceptable for the milestone and must be visibly labelled with their source, coverage, freshness, and limitations. A mock connector may prove automated tests; a live connector demo is opt-in and uses the user's local test credentials only through the test harness. The milestone is not a release claim: complete EMI ingestion, the full browser matrix, independent QA, packaging, and deployed rollback/removal evidence remain release blockers.

## 2. Non-negotiable implementation boundaries

- Deterministic calculation, assessment, evidence authority/freshness, site classification, required statements, and disclaimers run only in the analysis/evidence worker. Model, MCP, live-feed, and UI code cannot override them (`INV-001`–`INV-004`, `INV-030`).
- The whole-NZ map is the primary selector. Pointer, touch, keyboard-map navigation, place search focused back to the map, and a synchronized accessible map list share stable feature IDs. Checkbox and drop-down geography/site selectors are forbidden (`INV-009`, `LOG-MAP-SITE-001A`).
- Site domain outcomes are exactly `included`, `excluded`, `infrastructure_upgrade_required`, `specialist_assessment_required`, and `insufficient_evidence`. Presentation groups are exactly:
  - `included` → **passes declared constraints**;
  - `excluded` → **excluded**;
  - infrastructure/specialist/insufficient → **needs investigation**.
  Ordering is permitted only within a group, never across groups or through a hidden score (`INV-016`).
- Credentials and sensitive endpoint path/query bytes remain connector-worker/vault-only. The UI receives only a masked label, normalized origin, capability state, and opaque route ID. Direct runtime calls are HTTPS, exact-destination, CORS-enabled, no-redirect, and never relayed by GridLens (`INV-005`–`INV-007`, `INV-031`, `INV-037`–`INV-038`).
- Default persistent credentials are written only after a successful ordinary authenticated use, not a capability probe. Provide a session-only opt-out, clear-one, clear-all, replace, storage-denied guidance, and explicit browser-storage disclosure.
- The agent's tool registry is closed and read-only: `tavily_search`, `tavily_extract`, `mcp_web_search`, `mcp_web_research`, and `mcp_fetch_source`. Every contacted model/tool payload has its own exact disclosure acceptance and contacted-attempt receipt.
- `TEST.md` is ignored, untracked, test-only, and never imported by production code, copied to `.env`, bundled, cached, logged, displayed, or deployed. An explicit local-smoke flag may let a test-only loader read it in memory; output is limited to sanitized pass/fail or zero/non-zero counts.
- Design 1 has no application authentication, D1, R2, server database, credential escrow, runtime proxy, user upload, or feedback-submission route. Browser storage is intentional device-local product behavior approved by the user; `.openai/hosting.json` keeps `d1` and `r2` null.
- Every cross-module payload uses the effective V2 public or structured-clone contract. Importing superseded roots or using open `any`/catch-all schemas fails the contract build (`CTR-022`).

## 3. Current scaffold and integrator baseline

The Sites/vinext starter already exists. Do not run a second initializer. Preserve its package manager, lockfile, `sites()` plugin, Worker-compatible ESM shape, and `.openai/hosting.json`.

Before feature work, the lead/integrator records the current build/test result and then owns these starter-wide edits:

- replace `app/_sites-preview`, starter metadata, and placeholder page with GridLens shell imports;
- remove `react-loading-skeleton` if nothing uses it and refresh the lockfile;
- remove or exclude starter-only D1/auth examples (`db/`, `drizzle/`, `examples/d1/`, `app/chatgpt-auth.ts`) after confirming they are not required; keep `d1`/`r2` null;
- establish scripts for `typecheck`, `lint`, `test:unit`, `test:contract`, `test:data`, `test:integration`, `test:e2e`, `test:a11y`, `test:security`, `test:performance`, `check:demo`, `check:release`, and `build`; and
- add dependency-boundary and production-import checks before parallel feature changes merge.

## 4. Dependency graph

```text
S0 scaffold + generated contracts + test harness
├── S1 prepared core/demo packs + geography/catalog
├── S2 deterministic scenario/calculation/evidence/assessment
├── S3 repository + coordinator + analysis worker protocol
└── S6 connector vault/protocol foundations

S1 + S2 + S3 ──> S4 map-to-result vertical slice
S1 + S3 + S4 ──> S5 deep case + deterministic brief
S3 + S6 ───────> S7 cited agent + Tavily/MCP + safe visual
S1 + S2 + S4 + S7 ──> S8 map-first site screening/groups
S1 + S3 + S5 ──> S9 offline/update + Sites product shell
S1 ────────────> S10 complete data compiler/EMI proof
S4 + S5 + S7 + S8 + S9 + S10 ──> S11 independent QA and Sites release
```

The demo integration checkpoint is `S0`–`S9` using compact validated prepared packs. `S10` and the full `S11` evidence matrix remain mandatory before a production/release claim.

## 5. Exclusive ownership

| Owner | Writable paths | Read-only or forbidden |
|---|---|---|
| Lead/integrator | `package.json`, `package-lock.json`, `tsconfig.json`, lint/build/Vite config, `.openai/hosting.json`, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `worker/index.ts`, `README.md`, integration-only barrel files, `.autoforge/state.json` | Inspects every diff; no credential values; does not rewrite feature modules to bypass ownership. |
| Contract steward | `src/contracts/**`, `schemas/**`, contract generators and `tests/contracts/**`; only the steward may propose edits to `.autoforge/05-contracts.md` | Approved contracts are frozen. A semantic change pauses affected work, identifies all producers/consumers, and requires Gate 3 revalidation before implementation resumes. |
| Data/spatial owner | `data-pipeline/**`, `public/data/**`, `src/spatial/**`, `src/packs/**`, `tests/data/**`, `tests/unit/spatial/**` | No UI, agent, vault, or domain-policy edits. Shared raw sources and `Shared/` are read-only. |
| Domain/analysis owner | `src/domain/**`, `src/evidence/**`, `src/report/**`, `src/workers/analysis.worker.ts`, `tests/unit/domain/**`, `tests/unit/evidence/**`, `tests/property/**` | No DOM, network, secret, connector, or package edits. |
| Application/storage owner | `src/application/**`, `src/storage/repository/**`, `src/workers/analysis-client/**`, `tests/unit/storage/**`, `tests/integration/application/**`, `tests/integration/storage/**` | No vault secret codecs, UI markup, or domain formulas. |
| Connector/agent owner | `src/agent/**`, `src/storage/vault/**`, `src/workers/connector.worker.ts`, `tests/unit/agent/**`, `tests/unit/vault/**`, `tests/integration/agent/**`, `tests/smoke/local/**` | `TEST.md` remains read-only and test-only; no domain/evidence authority writes; no app relay. |
| UI/visual owner | `src/ui/**`, `src/visuals/**`, `tests/unit/visuals/**`, `tests/integration/ui/**`, `tests/e2e/**`, `tests/a11y/**` | Consumes view models only; no formula, assessment, geometry-truth, vault, or arbitrary HTML/code implementation. |
| Offline/package owner | `src/offline/**`, generated same-origin service-worker assets, `tests/integration/offline/**`, `tests/package/**` | Cross-origin/model/MCP/live responses and credentials are never cached. Integrator mediates shared config/hosting edits. |
| Independent QA | `.autoforge/10-qa-report.md` after implementation freeze and isolated QA artifacts outside production bundles | Must not author the behavior under test. No production fixes; defects return to the owning agent. |

All implementation agents treat `.autoforge/00`–`09`, `Shared/`, and other owners' paths as read-only. Shared config, lockfile, route entrypoints, generated registries, and cross-slice barrel exports are serialized through the integrator.

## 6. Test-first vertical slices

Each slice follows red → minimum implementation → focused green → boundary tests → refactor under green → accumulating `check:demo`/`check:release`. The owner returns changed paths, the expected failing test evidence, passing commands, assumptions, and remaining risks.

| Slice | Priority / owner | Depends on | Owned implementation focus | Contracts and logic | First failing tests | Definition of done |
|---|---|---|---|---|---|---|
| S0 — scaffold, strict V2 contracts, harness | Demo P0 / integrator + contract steward | Gate 3 | Starter cleanup; strict generated TypeScript/JSON Schema/clone guards; test runners; dependency-boundary rules | `CTR-000A`, `CTR-001A`, `CTR-022`, `GridLensPublicContractV2`, `GridLensStructuredCloneContractV2` | `CT-PUBLIC-*`, `CT-CLONE-*`: unknown fields, legacy roots, `any`, secret reachability, duplicate terminal; production import of `TEST.md` | Clean install/build works; generated roots close; old roots and secret/public crossing fail; all later agents use one frozen contract package. |
| S1 — prepared national/demo packs | Demo P0 / data-spatial | S0 | Simplified Stats region geometry, accessible region index, three project catalog records, declared layers, one prepared case/evidence pack, source registry, hashes/licences/coverage | `CTR-002A`, `CTR-003A`, `CTR-007A`, `CTR-008A`, `CTR-020`; `LOG-BOOT/PACK-001A`, `LOG-GEO-001`, `LOG-PRODUCT-001B` | `DATA-REG-*`, `DATA-PACK-*`, `UT-GEO-*`: all 17 geographies, border tie, outside, three marker states, disabled/qualified layer, orphan/hash/licence rejection | Core/demo packs activate atomically, satisfy byte budgets, show real provenance/limitations, and support the complete demo offline. |
| S2 — deterministic analysis core | Demo P0 / domain-analysis | S0, S1 schemas | Input normalization/origin; exact decimal demand/energy/flexible bound; water insufficiency/range; evidence freshness/conflict; five assessments; immutable snapshot; brief statements | `CTR-004`–`CTR-007A`, `CTR-009A`, `CTR-014`; `LOG-VAL/CAL/FLX/EVD/ASM/SNAP/RPT` including v0.10 routines | `UT-VAL-*`, `UT-CAL-*`, `UT-WATER-*`, `UT/PROP-FLX-*`, `UT-EVD-*`, `UT/PROP-ASM-*`, `UT-SNAP-*`: Southland exact oracle, 5/15% boundaries, stale evidence, 125 MW and 138.5 MW optimizer oracles, per-metric failure | Exact fixture passes before formatting; immutable manifest closes; all assessment outcomes/reasons are total; AI/live unavailable has no effect. |
| S3 — coordinator, repository, analysis worker | Demo P0 / application-storage | S0, S2 | Command/event coordinator, generations/cancellation, analysis worker client, IndexedDB envelopes/operations/tombstones/migrations/quarantine, route restoration | `CTR-001A`, `CTR-015A`, `CTR-019`; `LOG-WORKER-001A`, `LOG-SAVE-001A`, `LOG-ROUTE-001` | `CT-WORKER-*`, `MODEL-SAVE-*`, `UT-MIG-*`, `IT-SAVE-001`: late generation, exact terminal, op-ID conflict/replay, multi-tab delete, crash/quarantine | Analysis uses worker messages only; snapshots save/restore without mutation; stale tabs cannot resurrect records; storage failure preserves in-memory work. |
| S4 — map-to-result UI | Demo P0 / UI-visual | S1, S2, S3 | Whole-NZ map, synchronized accessible map list, search/layers/legend, project sheet, scenario editor, result cards/chart/table, audience/lens shell | `CTR-003A`, `CTR-004`, `CTR-014`; `LOG-MAP-SITE-001A`, `LOG-UI-001` | `IT-MAP-001`, `IT-ANALYSE-001`, `E2E-UJ-001`, `E2E-UJ-003`, `A11Y-MAP-*`: shared IDs, keyboard/touch selection, no checkbox/drop-down selector, AI delay | A user selects any NZ region on the map, runs the fixture, and sees authoritative results/coverage in under the declared budget with an equivalent keyboard/list path. |
| S5 — prepared Project Case File and brief | Demo P0 / domain + UI, serialized at file boundary | S1, S3, S4 | Ten trusted case sections, statements/locators/timeline/discrepancy/community/company/comparables/questions, source counts, deterministic technical/plain brief and copy fallback | `CTR-008A`, `CTR-014`, `CTR-019`; `LOG-DOC-001A`, `LOG-PRODUCT-001B`, `LOG-RPT-001`, `LOG-ROUTE-001` | `DATA-DOC-*`, `DATA-CASE-*`, `UT-CASE-*`, `UT-RPT-*`, `IT-CASE-001`, `E2E-UJ-004/015`: strict locator, counts, acyclic brief hash, audience/lens record parity | Deep case opens without live web/AI; all missing content is explicit; four presentation combinations retain identical underlying IDs; brief remains complete with AI disabled. |
| S6 — connector vault and capability lifecycle | Demo P0 / connector-agent | S0, S3 repository interface | Normalized custom endpoint/model/dialect config; capability test; first-success vault commit; session mode; masked metadata; replace/clear; privacy disclosure | `CTR-011A`, `CTR-015A`, `CTR-017`; `LOG-CONN-001A`, `LOG-SAVE-001A` | `UT-CONN-*`, `SEC-VAULT-*`, `IT-CONN-001`, `E2E-UJ-002`: CORS/auth/dialect matrices, capability-only non-persistence, ordinary-use persistence, refresh, storage denied, clear journal | Successful-use credentials survive refresh by default without raw read-back; session-only does not; clear-one/all is vault-first/resumable; non-CORS produces no relay. |
| S7 — bounded cited agent and safe visuals | Demo P0 / connector-agent + UI-visual, serialized at contract boundary | S3, S6 | Selected-context projection, exact disclosures, OpenAI Responses/Chat adapters, Tavily/MCP routes, five-tool registry, bounded/cancellable loop, citations; strict visual resolver/renderers | `CTR-012A`, `CTR-013A`, `CTR-021`; `LOG-AGENT-001A`, `LOG-CONN-001A`, `LOG-VIS-001A` | `MODEL-AGENT-*`, `SEC-AGENT-*`, `UT-VIS-*`, `IT-AGENT-001/FAIL-001`, `IT-VIS-001`: changed-body reauthorization, frozen route, replay counters, cancel, injection, unknown IDs, semantic parity | A selected-context prompt yields a cited typed result; one valid spec renders trusted chart/map/table plus equivalent; arbitrary HTML/JS and malformed/uncited output fail to a trusted fallback; deterministic state is byte-identical. |
| S8 — map-first site screening | Demo P0 / domain-analysis + UI-visual, serialized at profile contract | S1, S2, S4, optionally S7 parser | Proposed profile parsing, explicit user confirmation, deterministic criterion evaluation, five outcomes, three map groups, within-group order/sensitivity | `CTR-010A`; `LOG-SITE-001A`, `LOG-MAP-SITE-001A` | `UT/PROP-SITE-*`, `IT-SITE-001`, `E2E-UJ-013`: unconfirmed rejection, precedence, partial/missing preservation, exact group mapping, no cross-group rank | Candidate markers and synchronized panel show all five outcomes within three distinct non-colour-only map groups; no checkbox/drop-down selector, hidden score, cross-group rank, or “best site” claim exists. |
| S9 — offline shell and presentable Sites build | Demo P0 / offline-package + integrator | S1, S3, S4, S5, S7, S8 | Core/demo caching, generation-safe update notice, failure fallbacks, finished metadata/styles/responsive layout, one bespoke social card, production build | `CTR-016A`, `CTR-017`, `CTR-019`–`CTR-021`; `LOG-OFF-001A`, `LOG-REGISTRY-001`, resource enforcement | `IT-BOOT/OFF/UPDATE-*`, `SEC-OBS-*`, `PERF-FIRST/MAP/CASE-*`, `PKG-SITES-DEMO-*`: interrupted update, AI/live offline, no remote response/credential cache, starter marker absence | `check:demo` and production build pass; cached map/case/calculation/brief work offline; starter copy/assets are gone; responsive first viewport is GridLens-specific and presentable. |
| S10 — complete public-data/EMI pipeline | Release P1 / data-spatial | S1 | Registered-source compiler, bounded official inputs, exact EMI/NSP join, EPSG:2193→WGS84, Stats assignment, DST/unit aggregation, Balanced quality ledger, immutable release packs | `CTR-018A`, `CTR-020`–`CTR-021`; `LOG-PIPE-001`, `LOG-EMI-001A`, approved `g3-emi-quality` | `DATA-EMI-*`: exact keys/revisions, 46/48/50 periods, coverage equality and one-below, 45-day window, checksum/schema/conservation failures, no capacity language | Reproducible rolling-window report and compact pack pass Balanced thresholds or clearly do not publish; every exclusion/coverage metric is retained; no scraping/report-DOM contract or spare-capacity inference. |
| S11 — full release and independent QA | Release P1 / integrator then independent QA | S0–S10 | Browser matrix, a11y/security/privacy/performance, clean build, hosted smoke, offline/update/rollback/removal, AC evidence | All contracts, `UJ-001`–`UJ-017`, `AC-001`–`AC-026`, `INV-001`–`INV-038` | `check:release`, all `E2E-UJ-*`, `A11Y-*`, `SEC-*`, `PERF-*`, `PKG-SITES-*`; opt-in local smoke separately | Independent `10-qa-report.md` contains exact clean-environment evidence with no release-blocking defect; only then package/publish and record QA/delivery gates. |

## 7. Three-hour demo integration schedule

This is a coordination target, not permission to skip a failing gate.

| Timebox | Integration target | Stop/go evidence |
|---|---|---|
| 0–30 min | S0 baseline and contract/test harness; agree exact fixture pack/view-model interfaces | Build runs; Southland/geometry/contract tests fail for the intended missing implementations; paths are exclusively assigned. |
| 30–90 min | Parallel S1/S2/S3/S6 foundations; integrator wires the shell without reimplementing their logic | Core pack validates; exact calculation tests pass; worker/repository happy path passes; connector configuration stays masked. |
| 90–140 min | S4/S5 map, case, result and brief; S7 connector/agent/visual integration | Demo walkthrough works with mock remote services; deterministic output appears first and survives injected/failed remote responses. |
| 140–165 min | S8 site-profile confirmation and three map groups; persistence refresh demonstration | Five outcomes map exactly to three groups; credentials persist only after successful use; refresh works; no forbidden selector/rank. |
| 165–180 min | S9 focused regression, accessibility/secret scan, production build, demo rehearsal | `check:demo` and build pass; zero seeded secret occurrences in production source/output; offline deterministic path and live opt-in path are both rehearsed. |

If a P0 dependency misses its checkpoint, preserve the strongest honest deterministic path: prepared map → scenario → results → case/brief. Do not replace it with fake live data, a hard-coded AI answer, an unsafe key fallback, or a misleading release claim.

## 8. Traceability by implementation slice

| Slice | Requirements | Acceptance criteria | Primary invariants |
|---|---|---|---|
| S0 | `NFR-MNT-001/002`, `NFR-SEC-001/002`, `CON-001/003/004/007` | `AC-021` | `INV-001`–`INV-008`, `INV-028`, `INV-036`–`INV-038` |
| S1 | `FR-LOC-001–004`, `FR-MAP-001–003`, `FR-EVD-001–011`, `FR-EVD-016–018`, `FR-CASE-004`, `FR-DOC-001` | `AC-001/002/007/008/009/023/024/025` | `INV-009`–`INV-013`, `INV-019/020`, `INV-025`, `INV-035/036` |
| S2 | `FR-SCN-001–003`, `FR-CAL-001–006`, `FR-ASM-001–008`, `FR-RPT-001/002`, `NFR-REL-001/002` | `AC-003–006`, `AC-019` | `INV-001–004`, `INV-011–015`, `INV-017/018/020`, `INV-029/030` |
| S3 | `FR-SCN-004`, `FR-SAVE-001/002`, `FR-EVD-012`, `FR-RES-001`, `NFR-MNT-002` | `AC-020` | `INV-004`, `INV-020–022`, `INV-028`, `INV-032/036` |
| S4 | `FR-LOC-001–004`, `FR-MAP-001–004`, `FR-RES-001–004`, `NFR-ACC-001`, `NFR-EXP-001` | `AC-001/002/006/016/023` | `INV-008/009/016/020/026/027/034` |
| S5 | `FR-CASE-001–004`, `FR-DOC-001`, `FR-EVD-016–018`, `FR-RPT-001–003` | `AC-017/019/024/025` | `INV-002/004/013/019/026/036` |
| S6 | `FR-CONN-001–008`, `FR-SAVE-001`, `NFR-PRI-001`, `NFR-OBS-001` | `AC-010–012` | `INV-005/006/021/023/024/031/037/038` |
| S7 | `FR-AGT-001–008/011`, `FR-VIZ-001–003`, `FR-CONN-003/007/008` | `AC-013–017` | `INV-002/005–008`, `INV-020/024/028/031/034/038` |
| S8 | `FR-AGT-009/010`, `FR-LOC-003`, `FR-MAP-003/004`, `FR-ASM-008` | `AC-018/026` | `INV-009/016/020/026/030` |
| S9 | `FR-RES-001`, `NFR-PER-001`, `NFR-REL-002`, `NFR-ACC-001`, `NFR-DEP-001`, `CON-007` | `AC-021` plus demo paths | `INV-010/020/023/024/026/027/033/034` |
| S10 | `FR-EVD-005–011/013–015`, `NFR-REL-001`, `NFR-PER-001` | `AC-007/008/022` | `INV-010–013`, `INV-020/025/035/036` |
| S11 | All 101 approved requirements and constraints | `AC-001–AC-026` | `INV-001–INV-038` |

No slice is complete if its mapped acceptance evidence or invariant tests are missing, even when the UI appears to work.

## 9. Integration and contract-change protocol

1. Freeze the current V2 contract output and its generated hashes before parallel work.
2. Integrate in dependency order. The integrator reviews scope, secrets, generated noise, meaningful test assertions, and owner boundaries before merging each slice.
3. After every slice, independently rerun its focused tests plus the accumulated contract/unit/integration set. A test that passes only in an agent's environment is incomplete.
4. Shared-contract discoveries are reported immediately. A proposal must include old/new schema, motivation, compatibility, affected producers/consumers, migration, and tests. The contract steward accepts or rejects it; affected work pauses.
5. Any material change to approved behavior, architecture, public contract, invariant, state transition, trust boundary, or failure behavior invalidates the relevant Autoforge gate. Do not “fix” it only in code.
6. Record sanitized command results and artifact hashes for QA. Never record credentials, key-bearing URLs, prompt/document contents, or live response bodies.

## 10. Demo gate and release QA gates

### Demo gate (`check:demo`)

Must pass before presentation:

- strict type/schema/clone contract checks for all used V2 roots;
- Southland exact calculation, map/list ID parity, no-checkbox/drop-down audit, five-outcome/three-group mapping, deterministic brief with AI off;
- custom endpoint/Tavily mock capability, first-success persistence and refresh, non-CORS no-relay behavior, cancel/failure containment;
- safe-visual valid/malicious fixtures with equivalent text/table;
- automated accessibility smoke for map, scenario, result, connector, site groups, case, and brief plus manual keyboard rehearsal;
- production import/bundle/public/DOM/cache/log scan proving no `TEST.md`, exact seed, absolute local path, starter marker, raw HTML/eval path, or unexpected network SDK;
- production build and offline prepared-path smoke within the demo pack/resource budgets.

### Release gate (`check:release`)

Adds all unit/property/model/contract/data/worker/storage/integration/E2E suites, complete `DATA-EMI-*`, all `UJ-001–017`, current Chromium/Firefox/WebKit and mobile-equivalent coverage, required real-device smoke, feature-off fallbacks, WCAG manual protocol, seeded runtime network/storage inspection, all hard resource limits at equality and one-over, clean install/build, and the full Sites lifecycle.

The opt-in local Llama/Tavily smoke may run after the mock suite. It performs the minimal calls described in `07-test-strategy.md`; it never runs in public CI and never prints or persists credential values. Failure of a live third party does not invalidate deterministic behavior, but it must be reported honestly and cannot be represented as a passing live connector demo.

Independent QA starts only after the source is frozen and `check:release` passes locally. QA owns `10-qa-report.md`, reproduces defects, and returns fixes to the path owner. QA passes only when every `AC-001–AC-026` has direct durable evidence and no release-blocking defect remains.

## 11. Sites packaging and publication

1. Use the existing Sites capability-path project; do not reinitialize. Keep the development server available during implementation and build.
2. Keep `.openai/hosting.json` resource bindings `d1: null` and `r2: null`; after site creation it may additionally contain only the Sites `project_id`. Runtime connector values never enter hosting configuration.
3. Remove the starter preview/imports and temporary `codex-preview` metadata. Set GridLens-specific title, description, icons, security headers, and responsive product copy.
4. Once the finished visual direction and copy are stable, generate exactly one bespoke social-preview card in parallel, inspect its text, save a valid result as `public/og.png`, and wire host-derived Open Graph/X metadata. Omit the image if the one allowed retry still fails validation.
5. Run the successful production build and package the exact validated source with the Sites packaging helper. The package must contain Worker-compatible ESM/static output and hosting metadata, with no D1/R2 migrations, secrets, debug/test data, absolute paths, or undeclared runtime dependency.
6. Create/reuse the Sites project, commit/push the exact validated source, save one version, and prefer private deployment. Poll to terminal status and run the deployed map/Southland/connector-persistence/offline smoke.
7. Verify rollback/removal behavior. Unpublishing never claims to clear browser data; user guidance must separately explain device-local scenario/cache/credential clearing.

Publication is not complete until the deployed URL, exact source/version hash, supported targets, clean verification, rollback/removal evidence, and known limitations are recorded in `11-delivery-report.md`, then Autoforge QA and delivery gates pass.

## 12. Definition of project completion

GridLens NZ Design 1 is complete only when:

- every production file remains under `design-1-browser-first/` and shared references remain unmodified;
- all V2 producers/consumers and all 101 requirements, 26 acceptance criteria, and 38 invariants have passing evidence;
- the whole-NZ map-first workflow, five outcomes/three groups, deterministic case/brief, custom OpenAI and Tavily/MCP direct-CORS paths, successful-use credential persistence, safe dynamic visuals, offline generation behavior, and Balanced EMI evidence are verified;
- production and packaged artifacts contain no credential/test secret or hidden relay/auth/database capability;
- independent QA passes from a clean environment; and
- the exact Sites artifact is privately deployed and verified with rollback/removal guidance.

