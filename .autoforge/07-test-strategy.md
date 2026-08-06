# GridLens NZ — Test strategy

**Artifact version:** 0.2  
**Status:** Frozen logic-review candidate  
**Baselines:** Requirements 0.3, Usage 0.3, Architecture 0.2, Contracts 0.2, Logic Map 0.2

## Quality strategy

Determinism, minimax correctness, provenance, evidence freshness, conservative assessment, transactional data integrity, accessibility, privacy, and failure containment are release-blocking. Tests must prove externally observable behavior and contract invariants; passing a build or snapshot alone is not completion. Every requirement and acceptance criterion has named evidence below.

## Planned implementation test surface

| Layer | Tooling target | Purpose |
|---|---|---|
| Static/type/import | TypeScript strict, ESLint, dependency rules | Exhaustive discriminated unions, no undefined contract type, module ownership, browser/server secret separation. |
| Unit | Vitest | Validation/origin derivation, formulas, freshness, assessments, geometry, reports, migration steps. |
| Property/model | fast-check + test-only generic max-flow/model oracles | Formula laws, minimax optimality/invariants, date boundaries, canonical snapshots, persistence state-machine interleavings. |
| Schema/contract | Zod/JSON fixtures + Vitest | Every CTR-001..011 valid/invalid shape, semantic invariant, producer/consumer compatibility. |
| Integration/component | Vitest, Testing Library, fake-indexeddb | Workflow, atomic activation, partial results, report reconstruction, IndexedDB transactions and fallback. |
| Multi-context browser | Playwright two-page contexts | Real IndexedDB concurrency, tombstones, version changes, late network responses. |
| End-to-end | Playwright | UJ-001..011, responsive/keyboard flows, clipboard fallback, production routing. |
| Accessibility | axe-core plus recorded manual protocol | WCAG 2.2 AA target, semantics, keyboard, zoom, non-colour meaning, chart alternatives. |
| Performance | browser marks + bounded benchmarks | <1s deterministic requirement, <5s first result, data/geometry/storage budgets. |
| Security/privacy | malicious fixtures, bundle/secret/CSP/dependency scans | Inert content, forged-origin rejection, factual-AI impossibility, safe diagnostics. |
| Packaging/deployment | Sites production build and clean hosted smoke | Worker-compatible artifact, source/link checks, no secrets/local paths, rollback/removal. |

Equivalent tooling may replace a target only if it proves the same contracts and this artifact is revalidated before Gate 3.

## Test data and authoritative oracles

### Golden scenarios

| Fixture | Inputs | Required oracle |
|---|---|---|
| GOLD-SOUTH-001 | Southland; 50 MW; 80%; PUE 1.3; air; 30% flexible; diesel; 50 jobs | Exactly 65 MW, 455.52 GWh, 19.5 MW configured flexible, 52 MW active, 15.6 MW active flexible before formatting. |
| GOLD-SOUTH-FLX-001 | GOLD-SOUTH-001 with profile `[80,78,…,34]`, four peak hours, destination utilisation 1.0 | Sources 0–3; 62.4 MWh moved; destination additions h5..h12=`2,4,6,8,10,12,13,7.4`; peak 132→124 MW; reduction 8; exact ledger sums. |
| GOLD-MINIMAX-001 | Regional `[100,50,50,75×21]`; demand 100; utilisation .5; flexibility 1; one peak hour; destination cap 1 | Move 50 MWh as 25/25 to hours 1/2; hours 3..23 establish the 125 MW floor; combined peak 150→125 MW; reduction 25; no eligible remainder. |
| GOLD-ZERO-FLEX-001 | Valid profile/scenario; flexibility 0 | Identical series, no movement, zero reduction. |
| GOLD-NO-HEADROOM-001 | Destination utilisation cap below baseline active load | Simulation fails with `SIMULATION_INFEASIBLE` and an actionable baseline/cap reason; electricity totals remain. Equality allows no illegal added load. |
| GOLD-UNKNOWN-WATER-001 | Valid electricity; cooling unknown | Electricity complete; water insufficient; water assessment insufficient and questions present. |
| GOLD-WATER-NO-THRESHOLD-001 | Low WUE/factor; current water context; threshold absent | Water range may be complete; water assessment is insufficient, never low. |
| GOLD-UNSUPPORTED-001 | Outside coordinate/unsupported region | No nearest substitution, bundle activation, or detailed analysis. |
| GOLD-COMPARE-001 | 100 MW baseline PUE 1.5/flex 10 vs PUE 1.2/flex 40/lower-water/staged | Exact input/result/outcome deltas and trade-offs; baseline immutable. |

### Independent minimax oracle

Production pseudocode uses continuous monotone feasibility. Tests use two independent oracles:

1. `GOLD-MINIMAX-001` with hand-derived 125 MW and 25/25 allocation.
2. A test-only generic source/destination max-flow solver for randomly generated 3–24 hour continuous problems. At a candidate peak it models mandatory source reductions, source upper capacities, complete source-to-destination edges, and destination capacities as a network rather than using the production aggregate-feasibility formula. Independent bisection finds the minimum feasible peak; a second maximum-flow pass finds the maximum shift at that peak. Production target and total shifted energy must match within tolerance. Direct golden/tie fixtures prove the production deterministic ledger order. The oracle shares no production feasibility/allocation code.

For 24-hour real-valued cases, an independent verifier reconstructs all constraints solely from inputs and the movement ledger, verifies the certificate, and probes `optimalPeak-EPS` as infeasible.

### Regional/data fixtures

- Valid separately versioned deployment, geometry, Southland, Waikato, and Auckland bundles with content hashes.
- Geometry: points inside each named region, outside NZ, shared-border synthetic overlap, vertex, horizontal/vertical segment, hole interior, hole boundary, and invalid/self-intersecting rings.
- Bundle invalid variants: wrong hash/ID/schema/constituent version; 23/25 profile points; non-finite/negative values; duplicate/dangling evidence/fact IDs; empty fact/factor/threshold evidence; invalid/missing/future publication or retrieval dates; `validUntil` before publication; wrong 24/36 policy; invalid threshold order; mismatched present/absent threshold manifest version; missing named region; missing qualifying current source-backed evidence; broken source URL fixture; oversize asset.
- Evidence dates: exact 24/36-month boundary, one day before/after, leap/end-month clamp, `validUntil` exact/expired, missing dates, empty category.

### Malicious/untrusted fixtures

- Editable/persisted `verified_evidence` and `calculated_value` labels; wrong-value preset/fact references; missing IDs; developer evidence presented as authoritative; post-selection user edits.
- Evidence text containing HTML/script/event handlers, prompt-like instructions, bidi/control characters, deceptive URL text, and maximum length.
- IndexedDB records with prototype-pollution keys, future major versions, invalid/mixed database epochs, invalid revisions/timestamps/enums, stale tombstones, duplicate operation IDs, same operation ID with different command hashes, truncated legacy JSON, mixed valid/invalid legacy records.
- Presentation requests attempting factual/canonical text and responses with unknown/duplicate/missing required IDs, forbidden text properties such as `canonicalText`/`replacementText`, invalid connective, wrong snapshot/audience/generation, partial JSON, oversized response, and late completion.

## Unit, property, and model catalogue

### Validation and origin trust — `UT-VAL-*`, `UT-ORIGIN-*`, `PROP-VAL-*`

- UT-VAL-001: every required input and hard boundary; just-outside values reject.
- UT-VAL-002: strict number rejection for whitespace-only, comma, unit, infinity, NaN, exponent, locale separator.
- UT-VAL-003: every enum plus unknown value; stable issue order and recovery hints.
- UT-VAL-004: suspicion thresholds on both sides; submitted values unchanged.
- UT-ORIGIN-001: user edit always derives `user_assumption` despite supplied label.
- UT-ORIGIN-002: valid preset ID/version/exact value derives preset; wrong value/ID/version blocks.
- UT-ORIGIN-003: verified fact exact kind/value/reference derives verified; mismatch/dangling/stale label alone does not.
- UT-ORIGIN-004: valid developer `ProposalClaim` field/value derives proposal claim only; missing/mismatched claim blocks and cannot become verified.
- UT-ORIGIN-005: editing a preset/verified value revokes its prior proof.
- UT-ORIGIN-006: restored saved references re-resolve; saved `OriginProof` fields are ignored/rejected.
- PROP-VAL-001: every valid normalized output satisfies CTR-003 finite/range/proof invariants.

### Calculation and per-result manifests — `UT-CAL-*`, `UT-WATER-*`, `PROP-CAL-*`

- UT-CAL-001: GOLD-SOUTH-001 canonical outputs and display separation.
- UT-CAL-002: 10/50/100 presets across representative PUE/utilisation.
- UT-CAL-003: dependency failure scope; no invalid value/status combination parses.
- UT-CAL-004: every complete/insufficient/failed result embeds all manifest fields.
- UT-WATER-001: `GWh × L/kWh = ML` annual conversion and peak-day formula.
- UT-WATER-002: unknown cooling, missing/invalid factor, min/max boundary.
- UT-WATER-003: annual and peak-daily ranges carry exact min/max metric IDs, unrounded canonical decimals, formula IDs, input references, assumptions, display precision, factor version/evidence, and the full manifest; displayed rounding never feeds assessment.
- PROP-CAL-001: demand monotonic in capacity/PUE; energy monotonic in demand/utilisation.
- PROP-CAL-002: `activeFlexible<=activeLoad<=demand`; configured flexible `<=demand`.
- PROP-CAL-003: identical canonical inputs/manifests produce byte-identical records/statuses.

### Minimax simulation — `UT-FLX-*`, `PROP-FLX-*`, `MODEL-FLX-*`

- UT-FLX-001: GOLD-MINIMAX-001 exact target, 25/25 ledger, and certificate.
- UT-FLX-001A: GOLD-SOUTH-FLX-001 exact source set, per-hour additions, ledger sums, 124 MW target, and 8 MW reduction.
- UT-FLX-002: zero flexibility; no strict improvement means no pointless movement.
- UT-FLX-003: destination utilisation cap below baseline fails; equality/above respects the cap without illegal movement.
- UT-FLX-004: flat/equal profiles and deterministic source/destination tie-breaks.
- UT-FLX-005: partial destination capacity and remaining eligible energy.
- UT-FLX-006: 100% flexibility, exact nameplate cap, invalid profile, invariant-failure containment.
- UT-FLX-007: exact decimal feasibility at a target and one-unit-below canonical decimal rejects the lower probe; `EPS` is used only for search termination/reconstructed invariant comparisons.
- PROP-FLX-001: facility energy conservation within `1e-9 MWh`.
- PROP-FLX-002: all hourly, source, destination-utilisation, original-peak constraints.
- PROP-FLX-003: ledger sums equal hourly deltas; movements stay in-day/source≠destination.
- PROP-FLX-004: reported peak equals max series and reduction is exact/non-negative.
- PROP-FLX-005: inputs/manifest/snapshot never mutate.
- MODEL-FLX-001: generic max-flow oracle matches the primary minimax objective on random continuous problems.
- MODEL-FLX-002: when objective improves, production matches the independent maximum-flow secondary total; golden/tie fixtures prove deterministic ledger order.
- MODEL-FLX-003: certificate target is exactly feasible and `target-EPS`/recorded lower probe is infeasible; tolerance is used for invariant comparison, never to redefine feasibility.

### Evidence freshness — `UT-EVD-*`, `PROP-EVD-*`

- UT-EVD-001: 2026-08-06 with 24-month boundary: 2024-08-06 current, 2024-08-05 stale.
- UT-EVD-002: exact 36-month boundary and one-day neighbors.
- UT-EVD-003: leap/end-month clamping, including 2024-02-29 minus 24 months → 2022-02-28.
- UT-EVD-004: `validUntil` overrides publication date; equality current, prior day expired.
- UT-EVD-005: missing publication/valid-until → unknown; no item → missing.
- UT-EVD-006: stale/unknown remain contextual but never qualifying current.
- UT-EVD-007: deterministic output unchanged when browser/system clock changes.
- PROP-EVD-001: moving `asOfDate` forward cannot turn an expired non-overridden item current.

### Assessments and critic — `UT-ASM-*`

- UT-ASM-001: electricity ratios exactly 5%, 15%, and immediately around; missing/stale/unknown demand/grid evidence.
- UT-ASM-002: configured flexibility alone never changes outcome; only simulated peak does.
- UT-ASM-003: water annual/peak low/moderate/high bands and worse-of rule; conservative upper values.
- UT-ASM-004: GOLD-WATER-NO-THRESHOLD-001 and stale/unknown threshold evidence are insufficient.
- UT-ASM-005: battery/DR capacity, duration, commitment, and evidence matrix; boolean alone insufficient.
- UT-ASM-006: fossil restrictions false→high; true+verified→moderate; true unverified→insufficient; unknown backup insufficient; diesel/gas/mixed plus otherwise qualifying battery or demand response still follows the fossil branch.
- UT-ASM-007: economic fields with verified origin proof plus exact current fact/basis/roles→low; matching fact without linked proof or unsupported claim→moderate; contradictory/implausible→high; absent→insufficient; one asserted job never low.
- UT-ASM-008: community no representative consultation→insufficient; current moderate/high concerns; no low state constructible.
- UT-ASM-009: critic questions, stable uniqueness/order, no automatic rejection.
- UT-ASM-010: overall precedence for high, insufficient/failed, moderate, and all-low; no score/approval wording.
- UT-ASM-011: every completed category has reasons, exact inputs, versions, and evidence trace; invalid trace fails category.

### Geometry — `UT-GEO-*`, `PROP-GEO-*`

- UT-GEO-001: canonical points resolve Southland, Waikato, Auckland.
- UT-GEO-002: shared edge/vertex overlap chooses lexicographically smallest matching RegionId.
- UT-GEO-003: outside returns outside, never nearest; hole interior outside; hole boundary matches.
- UT-GEO-004: invalid coordinate/ring/ID graph returns typed geometry error.
- PROP-GEO-001: selection is independent of feature order.
- PROP-GEO-002: map/list/keyboard/coordinate canonical ID feeds identical activation record.

### Snapshot, comparison, and report — `UT-SNAP-*`, `UT-CMP-*`, `UT-RPT-*`

- UT-SNAP-001: identical input and full manifest gives same snapshot despite time/correlation/browser clock.
- UT-SNAP-002: changing each manifest field individually changes snapshot ID.
- UT-SNAP-003: water, simulation, evidence, assessment, and partial failures are fingerprinted.
- UT-CMP-001: GOLD-COMPARE-001 and baseline immutability.
- UT-CMP-002: zero baseline omits percentage; failed/incompatible metric is listed unavailable, never zero.
- UT-RPT-001: every material statement has valid non-empty trace closure.
- UT-RPT-002: technical/public required statements, sources, questions, freshness, and exact disclaimer.
- UT-RPT-003: typed water/evidence/simulation failures are explicit.
- UT-RPT-004: no score or definitive approval/rejection field/phrase.
- UT-RPT-005: Markdown/plain serializers preserve raw values, units, links, origins, and disclaimer.
- PROP-SNAP-001: canonical ordering and deep immutability under random valid snapshots.

### Transactional persistence — `UT-SAVE-*`, `MODEL-SAVE-*`, `UT-MIG-*`

- UT-SAVE-001: create/update/delete transactions write operation outcome and exact revision.
- UT-SAVE-002: same operation ID retry after simulated lost response mutates once and returns prior result.
- UT-SAVE-002A: reusing an operation ID with a different canonical command hash conflicts without mutation.
- UT-SAVE-003: same-record stale revision conflicts without overwrite; independent record writes both survive.
- UT-SAVE-004: tombstone revision prevents old-tab resurrection; new scenario requires new ID.
- UT-SAVE-004A: impossible scenario+tombstone coexistence is detected as corruption and never executed as a normal update/delete.
- UT-SAVE-005: quota/abort leaves no partial scenario/tombstone/operation write and keeps memory state.
- UT-SAVE-006: 20-record/64-KiB limits reject without auto-deletion.
- UT-SAVE-006A: two concurrent creates at the 19-record boundary serialize the in-transaction count so at most one reaches 20.
- UT-SAVE-006B: an operation/tombstone cap atomically rotates `databaseEpoch`, rewrites every active envelope without changing ID/revision/content, clears only old-epoch operation/tombstone history, and permits a refreshed new-operation-ID retry.
- UT-SAVE-006C: a stale tab or lost-response retry from the old epoch conflicts without duplicate mutation or resurrection; a racing compaction has exactly one winner.
- UT-SAVE-006D: quarantine cap never auto-prunes evidence or blocks ordinary valid mutation; another invalid record remains inert in its original store and returns explicit maintenance guidance.
- UT-SAVE-007: restore recalculates, re-derives origins, and reports drift for every manifest field.
- UT-SAVE-008: calculated results, origin proofs, evidence, assessments, and plans are absent from persistence.
- MODEL-SAVE-001: generated create/update/delete/retry interleavings match a pure revision/tombstone model.
- MODEL-SAVE-002: tab A/B adversarial schedules, including epoch compaction between read and write, never lose independent IDs, duplicate operations, or resurrect deletes.
- UT-MIG-001: valid v1 record imports to revision 1; unresolved origin becomes assumption.
- UT-MIG-002: mixed v1 valid/invalid records imports valid and quarantines only invalid.
- UT-MIG-003: crash before/after readback marker safely retries without duplicates using deterministic operation IDs.
- UT-MIG-004: unsupported future major and failed sequential step quarantine original, not siblings.

## Schema and contract catalogue

- CT-DATA-001..018: deployment/region assets, hashes, required IDs, versions, thresholds, atomic activation, size caps.
- CT-GEO-001..012: geometry structure, rings, canonical IDs, resolution result unions.
- CT-EVD-001..016: evidence/facts/statuses, dates, URL/provenance, category completeness, manifest.
- CT-SCN-001..018 and CT-ORIGIN-001..012: draft/input/issues/source selections/proofs and invalid combinations.
- CT-CAL-001..018 and CT-WATER-001..012: discriminated results, five-record tuple, units/formulas/manifest.
- CT-FLX-001..024: constraints, 24 points, ledger, certificate, complete/failed exclusive states.
- CT-ASM-001..032: five category results, outcomes/reasons/traces/precedence, no score.
- CT-SNAP-001..014: manifest closure, canonical fingerprint, immutable comparison.
- CT-RPT-001..016: statement roles/traces, required disclaimer, serializers.
- CT-SAVE-001..026 and CT-MIG-001..012: singleton metadata, epoch alignment, envelopes, revisions, command hashes, operations, tombstones, quarantine, compaction, drift, and migration.
- CT-AI-001..024: 2.0 request/plan, exact ID and per-slot connective allowlists, no unknown/free-text field, mismatch/timeout/cancel/rate/provider paths.
- CT-OBS-001..010: allowed event shapes and each forbidden data class.

Valid fixtures must parse and satisfy semantic invariants. Invalid fixtures assert the exact `ErrorCode`, scope, and failure containment.

## Integration and multi-context catalogue

| ID | Scenario and oracle |
|---|---|
| INT-BOOT-001 | Manifest/geometry validate before selection; storage unavailable still allows session. |
| INT-GEO-001 | Map/pointer/coordinate/list/keyboard select identical three-region records and exact-border rule. |
| INT-DATA-001 | Rapid Southland→Waikato aborts stale request; only latest bundle commits. |
| INT-DATA-002 | Invalid Southland bundle isolates region; Auckland remains usable. |
| INT-ORIGIN-001 | Forged draft/saved origin labels and mismatched references cannot become trusted or produce low economic concern. |
| INT-ANALYSE-001 | GOLD-SOUTH-001 creates exact snapshot, manifest, profiles, evidence, assessments, brief. |
| INT-ANALYSE-002 | Water failure retains electricity/simulation and explicit partial status. |
| INT-FLX-001 | GOLD-MINIMAX-001 visible 25/25 movement and 125 MW peak. |
| INT-ASM-001 | Freshness and five-category policy boundaries render traced outcomes and overall precedence. |
| INT-CMP-001 | Duplicate/edit/compare/stale-state path preserves baseline. |
| INT-RPT-001 | AI disabled produces complete identical factual briefs and copy payload. |
| INT-AI-001 | Invalid/factual/late plan leaves deterministic brief byte-identical. |
| INT-AI-002 | Valid plan reorders original immutable statements only; navigation discards response. |
| INT-SAVE-001 | Save/reload/restore/delete with full drift and local-only disclosure. |
| INT-SAVE-002 | Storage denial/quarantine preserves active scenario and valid siblings. |
| BROWSER-SAVE-001 | Two pages save independent IDs concurrently; both appear after refresh. |
| BROWSER-SAVE-002 | Two pages update same revision; exactly one commits, one conflicts. |
| BROWSER-SAVE-003 | Delete in page A then stale update in B cannot resurrect; retry operation reconciles. |
| BROWSER-SAVE-004 | Page A rotates the epoch at a history cap; all active records survive, page B's old-epoch mutation conflicts, and its refreshed retry succeeds once. |
| INT-MIG-001 | Mixed legacy records migrate/quarantine idempotently across interrupted startup. |
| INT-OBS-001 | Representative failures emit safe events with no forbidden fields. |

## End-to-end journeys

- E2E-UJ-001: first run and three-region/outside/map/list/keyboard parity.
- E2E-UJ-002: Southland demo through exact metrics, origins, per-result statuses, manifest.
- E2E-UJ-003: calculations, sources, current/stale/unknown/missing evidence, accessible tables.
- E2E-UJ-004: minimax chart, 100/50/50 oracle, movement ledger, constraints/disclosure.
- E2E-UJ-005: documented 100 MW comparison.
- E2E-UJ-006: unknown/known cooling, missing thresholds, water recovery without false low.
- E2E-UJ-007: technical/public brief, presentation disabled/malicious/late, clipboard fallback.
- E2E-UJ-008: IndexedDB save/restore/delete/conflict/drift/quarantine disclosure.
- E2E-UJ-009: build-time three-region/geometry/evidence/threshold validation and link report.
- E2E-UJ-010: clean Sites publish, first run, update/rollback, removal/local-data instructions.
- E2E-UJ-011: all category outcomes and deterministic overall precedence with traces/no score.

## Accessibility protocol

Automated axe checks cover all workflow stages, dialogs, error/partial/stale/unsupported states, comparison, tables, freshness, assessments, and briefs with zero serious/critical violations.

Manual release checks record browser, OS, assistive technology, viewport, result, defect, and retest:

1. Complete UJ-001/002/005/007/008/011 keyboard-only with visible focus/logical order.
2. Verify screen-reader names/descriptions/errors, headings, status announcements, tables, outcome/freshness text, external-link purpose.
3. Verify 200% zoom at 1280×720 and responsive 390×844 without lost controls/content.
4. Disable colour; support/outcome/evidence/series meaning remains via text/icon/pattern/labels.
5. Reduced motion removes nonessential animation; no uncontrolled movement.
6. Audit contrast for text, focus, controls, charts, badges, and error/partial states.

## Performance and resource protocol

| ID | Budget | Method |
|---|---|---|
| PERF-001 | deterministic analysis p95 <100 ms reference desktop; hard <1s | 1,000 warm random analyses plus cold golden runs. |
| PERF-002 | first Southland deterministic result <5s on throttled fast-3G-equivalent | Playwright production trace. |
| PERF-003 | manifest ≤256 KiB, geometry ≤2 MiB/250k vertices, selected bundle ≤1 MiB/300 evidence | build-manifest budget tests. |
| PERF-004 | input-change response p95 <200 ms | browser performance marks. |
| PERF-005 | optional provider delayed 15s never delays deterministic render | timestamp ordering assertion. |
| PERF-006 | IndexedDB list/mutation p95 <100 ms for 20 records | browser benchmark excluding first migration. |

Budgets cannot be waived silently; failure blocks release or reopens an approved gate.

## Security, privacy, and failure protocols

- SEC-001: production browser bundle contains no server-only names/values or secret-like fixtures.
- SEC-002: malicious evidence renders inert; no runtime HTML path or script/event node.
- SEC-003: forged/persisted origins and wrong references cannot produce trusted origins or low economic concern.
- SEC-004: presentation request/response schemas cannot transmit or express factual text; unknown `canonicalText`/`replacementText` rejects; late generation cannot apply.
- SEC-005: external links are HTTPS with opener isolation; release link checker records result/disclosure.
- SEC-006: CSP omits `unsafe-eval`; browser cannot call provider; endpoint rejects non-JSON/oversize/prompt/unknown fields/missing secret.
- SEC-007: diagnostics and edge logs contain no scenario/evidence/prose/URL/secret/label/storage body.
- SEC-008: dependency audit has no unresolved high/critical production vulnerability; licenses recorded.
- PRI-001: no sign-in/cookies/server scenario storage; local and optional external processing disclosures are visible.
- PRI-002: test sink proves request/response bodies are not logged.

| Injected failure | Detection | Recovery oracle |
|---|---|---|
| Manifest/geometry 404, hash, schema, ID mismatch | typed manifest/geometry error | retry; no fabricated/nearest region |
| One region invalid | scoped bundle error | other region remains usable |
| Water dependency missing | failed/insufficient water | electricity/simulation remain |
| Profile/optimizer invariant failure | failed simulation | totals remain; electricity assessment incomplete |
| Evidence stale/unknown/missing/threshold absent | explicit category status/reason | calculations remain; no false low |
| IndexedDB denied/quota/transaction abort | typed storage error | session continues; no partial commit |
| Concurrent revision/tombstone/epoch | conflict | committed record preserved; no duplicate or resurrection |
| Crash before/after commit | abort or indeterminate | retry same operation ID yields once-only outcome |
| Clipboard denied | `CLIPBOARD_DENIED` | selectable manual content |
| AI disabled/timeout/429/500/malformed/factual/late | typed presentation status | deterministic brief unchanged; explicit retry only |
| Unexpected exception | `INTERNAL_UNEXPECTED` at boundary | safe message/correlation; no stack trace |

## Acceptance-criteria evidence matrix

| AC | Primary automated evidence | Manual/deployment evidence |
|---|---|---|
| AC-001 | CT-DATA/GEO, INT-DATA/GEO, E2E-UJ-001 | parity keyboard review |
| AC-002 | UT-VAL/ORIGIN, E2E-UJ-002 | help/origin/error association |
| AC-003 | UT-CAL-001, INT-ANALYSE-001 | demo smoke |
| AC-004 | UT/PROP-CAL | test report |
| AC-005 | UT/PROP-FLX, E2E-UJ-003/004 | table/chart review |
| AC-006 | PROP/MODEL-FLX, E2E-UJ-004 | movement explanation |
| AC-007 | CT/UT-EVD, INT-ANALYSE | link report/spot check |
| AC-008 | CT-SNAP/RPT, UT-RPT-001 | provenance review |
| AC-009 | UT-ASM-009/010, E2E-UJ-006/011 | wording review |
| AC-010 | UT-RPT-002, INT-RPT-001, E2E-UJ-007 | copied brief review |
| AC-011 | partial integrations, INT-AI-001 | visible warning review |
| AC-012 | UT/INT-CMP, E2E-UJ-005 | comparison review |
| AC-013 | complete CI/build/E2E | clean Sites and accessibility protocol |
| AC-014 | SEC-001..008, UT-RPT-004 | production scan/wording |
| AC-015 | CT-RPT, E2E-UJ-003 | non-colour/text/table review |
| AC-016 | UT-ASM-001..011, INT-ASM-001, E2E-UJ-011 | traced boundary review |
| AC-017 | UT/PROP-EVD, CT-EVD, E2E-UJ-003 | pinned-date display review |
| AC-018 | UT/MODEL-FLX, INT-FLX-001, E2E-UJ-004 | oracle chart review |
| AC-019 | UT-ORIGIN, CT-AI, SEC-003/004, INT-AI | malicious/late review |
| AC-020 | UT/PROP-GEO, INT-GEO, E2E-UJ-001 | map/list/border review |
| AC-021 | UT/MODEL/BROWSER-SAVE, UT/INT-MIG, E2E-UJ-008 | conflict/quarantine review |
| AC-022 | UT-CAL-004, UT-WATER-003, UT-SNAP-001..003, CT-SNAP | manifest inspection |

## Requirement coverage audit

| Requirement | Exact planned evidence |
|---|---|
| FR-LOC-001 | UT-GEO-001..003, PROP-GEO-002, INT-GEO-001, E2E-UJ-001 |
| FR-LOC-002 | GOLD-UNSUPPORTED-001, CT-DATA-001..018, INT-DATA-002, E2E-UJ-001 |
| FR-SCN-001 | UT-VAL-001..004, PROP-VAL-001, E2E-UJ-002 |
| FR-SCN-002 | UT-VAL-001..004, UT-ORIGIN-001, E2E-UJ-002, manual field-association review |
| FR-SCN-003 | UT-ORIGIN-001..006, CT-ORIGIN-001..012, INT-ORIGIN-001, SEC-003 |
| FR-CAL-001 | UT-CAL-001..002, PROP-CAL-001, GOLD-SOUTH-001, INT-ANALYSE-001 |
| FR-CAL-002 | UT-FLX-001A/002/006, PROP-FLX-001/003, GOLD-SOUTH-FLX-001 |
| FR-CAL-003 | UT-FLX-003..006, PROP-FLX-002..004, MODEL-FLX-001..003 |
| FR-CAL-004 | UT-WATER-001..003, GOLD-UNKNOWN-WATER-001, INT-ANALYSE-002 |
| FR-CAL-005 | UT-CAL-004, UT-WATER-003, UT-SNAP-001..003, CT-SNAP-001..014, AC-022 inspection |
| FR-CAL-006 | UT-CAL-003, UT-WATER-002, INT-ANALYSE-002, failure matrix |
| FR-CAL-007 | UT-FLX-001, MODEL-FLX-001..003, INT-FLX-001, GOLD-MINIMAX-001 |
| FR-EVD-001 | CT-EVD-001..016, INT-ANALYSE-001, E2E-UJ-003, SEC-005 |
| FR-EVD-002 | UT-EVD-005..006, CT-EVD-001..016, E2E-UJ-003 |
| FR-EVD-003 | UT-EVD-001..005/007, PROP-EVD-001, E2E-UJ-003 |
| FR-EVD-004 | UT-EVD-006, UT-ASM-001/004, CT-DATA-001..018, test:links |
| FR-CRT-001 | UT-ASM-009, INT-ASM-001, E2E-UJ-011 |
| FR-ASM-001 | UT-ASM-011, CT-ASM-001..032, INT-ASM-001 |
| FR-ASM-002 | UT-ASM-010, UT-RPT-004, E2E-UJ-011, production phrase/schema scan |
| FR-ASM-003 | UT-ASM-001..002, MODEL-FLX-001, E2E-UJ-011 |
| FR-ASM-004 | UT-ASM-003..004, GOLD-WATER-NO-THRESHOLD-001, E2E-UJ-006/011 |
| FR-ASM-005 | UT-ASM-005..006, INT-ASM-001, E2E-UJ-011 |
| FR-ASM-006 | UT-ASM-007, UT-ORIGIN-003..004, SEC-003, E2E-UJ-011 |
| FR-ASM-007 | UT-ASM-008, CT-ASM community-low rejection, E2E-UJ-011 |
| FR-ASM-008 | UT-ASM-010, CT-ASM precedence fixtures, INT-ASM-001, E2E-UJ-011 |
| FR-CMP-001 | UT-CMP-001..002, GOLD-COMPARE-001, INT-CMP-001, E2E-UJ-005 |
| FR-RES-001 | E2E-UJ-001/002/005/007, workflow-state integration tests |
| FR-RES-002 | INT-ANALYSE-001..002, E2E-UJ-002..004/011, accessibility protocol |
| FR-RES-003 | UT-RPT-002/005, E2E-UJ-003, manual non-colour/table equivalence review |
| FR-RPT-001 | UT-RPT-001..004, INT-RPT-001, E2E-UJ-007 |
| FR-RPT-002 | UT-RPT-005, clipboard denied failure fixture, E2E-UJ-007 |
| FR-RPT-003 | CT-AI-001..024, INT-AI-001..002, SEC-004/006, E2E-UJ-007 |
| FR-ERR-001 | INT-DATA-002, INT-ANALYSE-002, INT-AI-001, INT-SAVE-002, failure matrix |
| FR-DAT-001 | CT-DATA-001..018, CT-EVD/GEO, UT-SNAP-002, E2E-UJ-009 |
| FR-DAT-002 | UT-GEO-001..004, CT-GEO-001..012, INT-GEO-001, E2E-UJ-001/009 |
| FR-LOCALSAVE-001 | UT-SAVE-001/006, INT-SAVE-001, E2E-UJ-008, PRI-001 |
| FR-LOCALSAVE-002 | UT-SAVE-002..008, MODEL-SAVE-001..002, BROWSER-SAVE-001..004, UT/INT-MIG |
| NFR-PER-001 | PERF-001/004/006 and randomized benchmark corpus |
| NFR-PER-002 | PERF-002/003/005 and delayed-provider E2E fixture |
| NFR-REL-001 | PROP-CAL/FLX/EVD/SNAP, MODEL-FLX, UT-SNAP-001..003 |
| NFR-REL-002 | UT-CAL-003, INT-ANALYSE-002, failure matrix, CT union-invalid fixtures |
| NFR-ACC-001 | axe suite, manual accessibility steps 1..6, E2E keyboard/zoom fixtures |
| NFR-SEC-001 | CT-DATA/GEO/SCN/SAVE, UT-ORIGIN, SEC-001/003/005 |
| NFR-SEC-002 | malicious evidence fixtures, CT-AI, SEC-002/004/006 |
| NFR-PRI-001 | PRI-001/002, UT-SAVE-008, SEC-007, edge-log inspection |
| NFR-EXP-001 | UT-ORIGIN, UT-RPT-001..003, CT-SNAP/RPT, E2E-UJ-003/011 |
| NFR-MNT-001 | strict type/import-boundary checks and isolated domain/contract suites |
| NFR-MNT-002 | CT-AI-001..024, INT-AI-001..002, compile-time no-free-text plan schema check |
| NFR-DEP-001 | production Sites build, clean E2E-UJ-010 smoke, package/local-path scan |
| NFR-OBS-001 | CT-OBS-001..010, INT-OBS-001, SEC-007 |
| CON-001 | repository path-ownership scan and package manifest inspection |
| CON-002 | import-rule/AI-boundary static checks, UT-ASM/CAL/FLX, SEC-004 |
| CON-003 | browser/network route allowlist and data-source integration tests |
| CON-004 | production resource/auth/database manifest scan and PRI-001 |
| CON-005 | route/form/schema scan proving no upload/community-submission boundary |
| CON-006 | Sites production build and hosted E2E-UJ-010 |
| CON-007 | repository write-scope scan and normative-source attribution audit |

Before implementation completion, every range above is expanded into individual executable test cases in the checked-in test manifest; no requirement may rely only on a manual umbrella statement.

## Execution and release requirements

Expected commands after scaffold initialization:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm test:e2e
pnpm test:a11y
pnpm test:links
pnpm build
pnpm audit --prod
```

Gate expectations:

1. Deterministic unit/property/model/contract/integration tests pass without retries.
2. Domain statement/branch/function coverage ≥90%; application ≥85%; critical invariants require explicit tests regardless of percentage.
3. No serious/critical axe issue and the recorded manual accessibility protocol passes.
4. Performance/resource budgets pass on a recorded reference environment.
5. No unresolved high/critical production vulnerability, secret, local-path, or forbidden-network finding.
6. Production build and clean Sites deployment smoke pass.
7. Independent QA reproduces every AC-001..022 and records limitations.

Flaky tests fail the gate. A quarantined test cannot be the sole evidence for a release-blocking criterion.

## Independent logic-review checklist

The reviewer must independently:

- simulate GOLD-SOUTH-001, GOLD-MINIMAX-001, date boundaries, assessment matrices, and persistence interleavings;
- challenge the minimax feasibility proof, secondary objective, utilization cap, certificate, `1e-9` behavior, and independence of the generic max-flow oracle with counterexamples;
- find undefined types, invalid union states, unnamed producers/consumers, incomplete versions, and ambiguous errors;
- attack trusted-origin derivation, stale/unknown evidence exclusion, water thresholds, resilience/economic/community rules, and overall precedence;
- attack transaction atomicity, same-ID conflicts, independent-ID concurrency, tombstone resurrection, crash-after-commit retry, migrations, and quarantine;
- prove the presentation response cannot carry factual text and that late responses cannot pass generation guards;
- verify geometry/named-region parity and exact border behavior;
- expand/check every requirement and AC literal across requirements, contracts, logic, and tests;
- return `validated`, `validated-with-nonmaterial-edits`, or `blocked`, with evidence and exact corrections/decision requests.
