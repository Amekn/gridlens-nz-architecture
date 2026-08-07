# GridLens NZ — independent Gate 3 logic review v0.12.2 final

**Review date:** 2026-08-07 (Pacific/Auckland)
**Reviewer:** `/root/logic_reviewer_v011`, independently rechecking G3V12.2-001
**Scope:** amended CTR-043 and `CT-STORED-ENVELOPE-V122`, with prior G3V11/G3V12 closure results held constant
**Verdict:** `validated`

## Exact reviewed set

| Artifact | Lines | SHA-256 |
|---|---:|---|
| `.autoforge/01-requirements.md` | 229 | `0495a1de589caceebf6a158cd972494e85d334cae2600ccca9f2b0e88ee95b60` |
| `.autoforge/02-usage-definition.md` | 270 | `daaa5c3bf7a022cec347ef192dd809d6cd9459805ea9fb4775a4ebd5bcf93c9c` |
| `.autoforge/04-selected-architecture.md` | 131 | `0fb1ffb8a6ea7c86edf980f3632163be88a091b170b17c597258f8b8ffa22eed` |
| `.autoforge/05-contracts.md` | 5,050 | `42eaae6ff9eea67461d29f304782e80b4c38f49d37a1730a7643574cf7d74977` |
| `.autoforge/06-logic-map.md` | 2,697 | `a15f06e9ff2e944a521c8d18518d118df2a16298a1530df789c5649ac2eed7c5` |
| `.autoforge/07-test-strategy.md` | 843 | `e601d82d566a7bcdaef5b2974496b90fc1c8e4410672ba206bd7db7c6af5f6e7` |
| `.autoforge/decisions/ADR-013-provider-origin-and-research-integrity.md` | 23 | `815987ccc2982985c83209f8cb7e70aeb6fbfd1019fbaa6694747179429178d2` |

The two ADR-013 decisions remain approved. There are **zero open user decisions**.

## Focused finding disposition

### G3V12.2-001 — Closed

**References:** `05-contracts.md:5015-5050`; `06-logic-map.md:2695-2697`; `07-test-strategy.md:841-843`.

CTR-043 now declares an exact current storage graph with distinct variants for:

- scenario draft/normalization state via `ScenarioStorePayloadV2`;
- separate `ResultSnapshotV2` and complete `ComparisonSnapshotV2` bytes;
- evidence, case, brief, confirmed site profile, screening, and trusted visual records;
- current/legacy-stale research cache and immutable route state;
- opt-in prompt history, migration/operation receipts, and quarantine;
- key-discriminated audience, lens, and reduced-motion preferences.

`StoredEnvelopeV3` has exact live and tombstone variants. Live records bind canonical payload bytes to `payloadHash`; tombstones cannot contain a payload and retain the exact deleted store class. Connector/configuration/credential/server/raw-provider/arbitrary-JSON variants remain unrepresentable, and legacy records enter only through the named CTR-037 adapter or quarantine.

The previous counterexamples now fail: a pre-calculation scenario round-trips through the scenario variant; a result remains separate; a comparison restores from its complete stored bytes; preference value kinds cannot cross; and per-store deletion state remains reconstructable from tombstones. `CT-STORED-ENVELOPE-V122` explicitly compiles and round-trips each live/tombstone variant, proves offline byte restoration, mutation-kills the former omissions and mismatches, and proves reachability from both effective roots without an unresolved symbol.

## Final closure assessment

G3V12.2-001 is closed. The previously reviewed CTR-037–042 changes remain sufficient to close G3V12-001–006, and those changes in turn close the G3V11-001–012 counterexamples. The reviewed contract, logic, and release-test set is internally consistent for Gate 3; its schema graphs are closed, every material producer/consumer path has a stated invariant and release-blocking proof, and no unresolved user decision remains.

## Exact verdict

`validated`

---

# v0.13 scenario-first interaction amendment — independent Gate 3 review

**Review date:** 2026-08-07 (Pacific/Auckland)
**Reviewer:** `/root/logic_reviewer_v011`
**Scope:** FR-UX-001–007, AC-027–029, UJ-018, LOG-WORKFLOW-001, INV-068–071, the v0.13 release-test rows, and compatibility with the previously validated deterministic/security contracts
**v0.13 verdict:** `blocked`

## Exact v0.13 reviewed set

| Artifact | Lines | SHA-256 |
|---|---:|---|
| `.autoforge/01-requirements.md` | 249 | `1728372049b86d1611926d2d9c27ba544e307b9e2f263bdc56ad5f770c37741d` |
| `.autoforge/02-usage-definition.md` | 283 | `d3595a4cb632e02b7bf6388f2f4b7039d35e060a8a0e927a03a44ef8a7aaf146` |
| `.autoforge/04-selected-architecture.md` | 135 | `84c7a20ea04e1f9f654f3cddc5e8272155d152ac4b980aecef11d2b8f8d5d2db` |
| `.autoforge/05-contracts.md` | 5,050 | `42eaae6ff9eea67461d29f304782e80b4c38f49d37a1730a7643574cf7d74977` |
| `.autoforge/06-logic-map.md` | 2,740 | `ead6051f5be959e91dfb6c4126c0c4b9046e64734eb9265a7e7febeac1b962b7` |
| `.autoforge/07-test-strategy.md` | 854 | `f0c64f0bcf5522a33d0e4db5837159b7dac9adc1be8cb9fa525d0619b71b2e80` |

## Independently enumerated obligations

1. Remove the top-bar prepared-evidence/as-of element while retaining evidence qualification in result/source contexts.
2. Preserve the exact five domain outcomes, three presentation groups, deterministic calculations, candidate IDs, evidence, and security boundaries while changing reader copy only.
3. Map the three internal groups to three exact reader labels and distinct explanations.
4. Derive every reader-facing selected/list/progress/result region name from the canonical Stats NZ region record, without RegionId prefixes, candidate/outcome suffixes, technical tags, or “demonstration zone.”
5. Admit evaluation only after the complete typed scenario is valid and the selected region resolves to exactly one current prepared regional assessment record.
6. Remove every tab, shortcut, restored state, or URL path that can reveal results without the permitted evaluation transition.
7. Bind a result to the exact scenario, region, prepared assessment, release generation, and successful deterministic snapshot that entered the current run.
8. Announce all three ordered stages accessibly; input mutation, cancellation, failure, and stale callbacks must not reveal or relabel a result. Reduced motion shortens bounded presentation timing without changing states or result bytes.

## Findings

### G3V13-001 — Blocker — eligibility conflicts with the existing scenario contract and does not prove a unique regional input

**References:** `01-requirements.md:39,243,249`; `02-usage-definition.md:275-282`; `05-contracts.md:3810-3874`; `06-logic-map.md:231-252,2699-2724`; `07-test-strategy.md:850-851`.

`scenarioComplete` independently reimplements only a fragment of `normalizeScenario`. It accepts `direct_liquid`, which is absent from `ScenarioDraftV2` and `NormalizedScenarioV2`, but rejects the declared `water_cooled` value. It also omits required controlled fields and their conditional rules, even though the existing normalizer is the sole source of blocking issues and engine-issued origin proofs. The condition `selectedAssessment exists` neither requires a selected `RegionId`, proves that the assessment belongs to it and the active spatial/data generation, nor enforces UJ-018's “exactly one prepared regional record.”

**Counterexamples:** a complete `water_cooled` scenario is valid under the deterministic contract but cannot evaluate under LOG-WORKFLOW-001; a `direct_liquid` draft passes `scenarioComplete` and then fails the authoritative decoder. If two prepared candidate assessments exist for one region, any truthy one satisfies `canEvaluate`, so different implementations can evaluate different records.

**Required correction:** derive workflow eligibility from the authoritative normalization result, not a second field validator. Add an exact current prepared-region index/refinement that yields one byte-identical `(regionId, candidateId, screeningHash, evidenceSnapshotId, releaseManifestHash)` or a typed `missing|ambiguous|stale` reason. Preserve the existing cooling vocabulary; any new cooling kind requires a separately approved deterministic-contract amendment.

### G3V13-002 — Blocker — run state is not bound to inputs, evaluator success, or stale stage events

**References:** `01-requirements.md:243,249`; `02-usage-definition.md:277-282`; `05-contracts.md:3920-3939`; `06-logic-map.md:513-529,2699-2727,2737-2740`; `07-test-strategy.md:850-854`.

The new unversioned `WorkflowState` contains only `runId` and stage. It collides in name with the existing persisted `WorkflowState` at `05-contracts.md:3301`, has no public/runtime contract, and carries no scenario fingerprint, `RegionId`, selection generation, assessment/candidate identity, release hash, or `ResultSnapshotV2` ID. `startEvaluation` advances to results after the final presentation stage without requiring `analyse` to return a successful immutable snapshot for the captured inputs. Only final completion checks current `runId`; no exact event rule prevents a stale stage-1/2 timer from mutating or announcing during a later run. Mutation invalidates an ID but does not specify cancellation of timers/analysis or destruction of a pending result.

**Counterexamples:** run A schedules stage 2; a region change starts run B at stage 0; A's untagged callback can announce or set stage 2 during B even though only the final callback checks currency. Separately, `analyse` can reject a normalized draft or generation while the cosmetic stages still transition to `results(runId)` with no valid snapshot. A scenario change and reversal to the same visible values can also leave no exact fingerprint proving which calculation produced the displayed result.

**Required corrected model:** define a versioned, closed UI-run contract and reduce only typed events:

```text
EvaluationRunV1 = exact {
  runId:SelectionGeneration
  scenarioFingerprint:Sha256
  regionId:RegionId
  selectionGeneration:SelectionGeneration
  candidateId:CandidateId
  screeningHash:Sha256
  evidenceSnapshotId:Sha256
  releaseManifestHash:Sha256
}

EvaluationWorkflowV1 =
  scenario(generation, guidance?) |
  evaluating(run, stage:0|1|2, pendingSnapshotId?) |
  results(run, resultSnapshotId:Sha256)

startEvaluation():
  require authoritative normalization succeeds
  require exactly one current prepared-region binding
  allocate runId and capture immutable run tuple
  start analyse(captured tuple) and tagged stage schedule

onStage(runId, expectedPriorStage, nextStage):
  require current state/runId/prior stage all match; otherwise discard

onAnalysisTerminal(runId, outcome):
  require run remains current and returned snapshot closure matches every captured hash
  retain success as pending; rejection returns scenario with typed guidance

finish(runId):
  require current run, stage 2, and matching successful pending snapshot
  transition to results(run, snapshotId)

onScenarioOrRegionMutation():
  increment generation; cancel run timers/analysis; discard pending; transition scenario
```

Normal and reduced-motion timing must have exact upper bounds; stage announcements must be queued as three semantic events rather than relying on rapid replacement of one live-region string.

### G3V13-003 — Blocker — the effective route contract still permits direct result restoration

**References:** `01-requirements.md:131,243`; `05-contracts.md:3288-3315,4955-4966,5028-5050`; `06-logic-map.md:2733,2737`; `07-test-strategy.md:850-851`.

The effective `WorkflowRouteStateV3` still has `page:"evaluation"` with only result ID, region ID, and optional candidate ID. It contains no successful current-run receipt or scenario/input fingerprint and remains storable through `StoredEnvelopeV3`. That route can therefore reveal a result directly on back/forward, deep link, or restored client state, contradicting INV-068 and the new gate. Conversely, deleting restoration entirely would conflict with FR-RES-001's approved requirement that back/forward retain the active immutable result snapshot.

**Counterexample:** store a valid old evaluation route, change the scenario record, then restore the route. The strict route decoder accepts it and supplies a result ID without proving it belongs to the current scenario/region/run. UI-GATE-V13 does not exercise route/storage restoration.

**Required correction:** supersede the evaluation route with either a scenario-only route or a verified result-route variant containing a closed `EvaluationRunReceiptV1` and exact result snapshot binding. Restoration must validate the stored result closure and current input policy before entering results; any missing/mismatched receipt falls back to scenario entry with guidance. Add history, reload, deep-link, stored-route, and changed-input tests.

### G3V13-004 — High — copy, mapping, and accessibility tests do not prove AC-027–029

**References:** `01-requirements.md:237-249`; `02-usage-definition.md:277-281`; `06-logic-map.md:2729-2740`; `07-test-strategy.md:845-854`.

`UI-COPY-V13` inspects server-rendered HTML only. It does not exercise hydrated map markers/polygons, all 17 list rows in canonical order, selection cards, each progress stage, results, accessible names, copied/exported content, or selection through every input source. It tests removal of the top-bar evidence phrase but not the required positive preservation of evidence qualification in result/source contexts. The design lists three labels without an exact internal-group-to-label/explanation mapping; a UI could swap “Meets scenario” and “Does not meet scenario” while keeping internal enums and calculations unchanged and pass the stated oracles. Reduced-motion timing and all three announcements are manual-only and have no numeric bound or stale-callback accessibility oracle.

**Required correction:** declare and test this exact mapping: `passes_declared_constraints -> Meets scenario`, `needs_investigation -> More evidence needed`, `excluded -> Does not meet scenario`, each with fixed explanatory copy. Derive display names only from the canonical region feature indexed by `RegionId`. Add runtime component/E2E matrices for 17 ordered names, every selection source and state, forbidden terminology in visible/accessibility/copy/export surfaces, preserved result/source qualification, correct mapping/explanations, fake-timer stale events, focus, three ordered announcements, and exact normal/reduced-motion duration ceilings. Compare deterministic result canonical bytes/hashes before and after the amendment, not only general suite compatibility.

## Material decision request

### G3V13-D01 — verified result restoration

Should back/forward/reload restore a previously completed result directly when its immutable snapshot and exact evaluation-run receipt still match, or should every navigation/reload return to scenario entry and require **Evaluate** again?

- **Option A — verified restoration (recommended):** admit results only from a validated receipt binding scenario fingerprint, region, candidate/screening, release/evidence, and result snapshot. This preserves FR-RES-001 while preventing arbitrary URL/client-state bypass.
- **Option B — always re-evaluate:** persist no results route; restoration always returns to scenario entry. This is simpler but materially changes approved history/restoration behavior.

No other user decision is required; the remaining corrections implement already approved behavior.

## v0.13 traceability conclusion

FR-UX-001–006 are directionally specified, but the exact display-name source, group mapping, positive evidence-qualification assertion, and runtime surface coverage are incomplete. FR-UX-007/AC-029/UJ-018 are blocked by divergent scenario validation, ambiguous region-to-assessment resolution, an unbound timer state, unconditional result transition, and the surviving result-route bypass. The unchanged deterministic and security contracts remain sound; the amendment does not yet connect to them without ambiguity.

## Exact v0.13 verdict

`blocked`

---

# v0.13.1 scenario-first amendment — independent re-review

**Review date:** 2026-08-07 (Pacific/Auckland)
**Reviewer:** `/root/logic_reviewer_v011`
**Scope:** revised CTR-044, LOG-WORKFLOW-001 v0.13.1, INV-072–075, the v0.13.1 blocker-closure tests, prior G3V13-001–004 counterexamples, and approved restoration policy G3V13-D01 Option A
**v0.13.1 verdict:** `blocked`

## Exact v0.13.1 reviewed set

| Artifact | Lines | SHA-256 |
|---|---:|---|
| `.autoforge/01-requirements.md` | 251 | `4751ed6825a3a5fdf7fad4611dde23c11b0297e7cf3ab04624c69b63f0c46d69` |
| `.autoforge/02-usage-definition.md` | 284 | `8b0da66966f5551364ca53e396ad338fb7e2dc61bbd02ec2d5672f61653e6f63` |
| `.autoforge/04-selected-architecture.md` | 135 | `84c7a20ea04e1f9f654f3cddc5e8272155d152ac4b980aecef11d2b8f8d5d2db` |
| `.autoforge/05-contracts.md` | 5,109 | `a44d3bfab0e4201d8901cacfd5f263852bd3b8c78a72906e61059fefdd1e591f` |
| `.autoforge/06-logic-map.md` | 2,796 | `454b83b21dff3931a9d8943cff0342b19bc590dcbae0042ad1f69e664e20d1b1` |
| `.autoforge/07-test-strategy.md` | 868 | `5699a5256c270f9bec3d7a6e8f41429716bc759b6a1419145778d5e0a7b45e02` |

G3V13-D01 is explicitly resolved as Option A. There are **zero open user decisions**.

## Prior-finding disposition

| Prior finding | v0.13.1 disposition |
|---|---|
| G3V13-001 — eligibility and sole regional binding | **Partly closed.** The second hand-written validator is removed, shipped cooling values are intended to remain unchanged, and zero/duplicate/stale/cross-region bindings fail. The named shipped input/normalized contract is nevertheless undeclared and its field use conflicts with the only declared normalized scenario (G3V13.1-001). |
| G3V13-002 — immutable run, result success, and stale events | **Partly closed.** The run captures scenario/region/candidate/screening/evidence/release hashes; stage and ready/finish events check run identity; pending results stay hidden; timers/work cancel. Analysis failure has no event or recovery transition, invalidation/start are not generation-tagged, and the reduced-motion total ceiling conflicts with the calculation budget (G3V13.1-003). |
| G3V13-003 — direct/restored result bypass | **Partly closed.** `evaluation_v1` is the sole results route and mutation/legacy/direct-route tests are explicit. Restoration cannot deterministically reproduce a time-sensitive snapshot and `scenarioFingerprint` has no exact hash rule (G3V13.1-002). |
| G3V13-004 — copy, group mapping, and accessibility proof | **Closed.** CTR-044 defines the exact three-way mapping and canonical display-name source; runtime coverage includes all 17 rows and interaction surfaces, positive evidence qualification, accessible/copy projections, deterministic byte equality, focus, ordered announcements, stale callbacks, and timing modes. |

## Remaining findings

### G3V13.1-001 — Blocker — the authoritative shipped normalization boundary is not a closed contract

**References:** `05-contracts.md:267-344,3810-3874,5052-5054`; `06-logic-map.md:231-252,2746-2757`; `07-test-strategy.md:860-862`.

CTR-044 says it consumes `ScenarioInput -> normalizeScenario -> NormalizedScenario`, but no `ScenarioInput` declaration exists in the reviewed contracts. The declared `NormalizedScenario` has `cooling`, while LOG-WORKFLOW-001 reads `normalized.coolingMethod`; the later `NormalizedScenarioV2` likewise represents cooling as a nested `cooling.kind`. CTR-044's statement that this is a different “shipped domain module” does not declare that module's exact input, output, error union, canonical encoding, or adapter to the approved deterministic scenario contract. `CONTRACT-RECEIPT-V13` compiles the run/event/receipt types, not this eligibility boundary.

**Counterexample:** an implementation typed against declared `NormalizedScenario` reads `normalized.cooling.kind`; one typed from the new pseudocode reads `normalized.coolingMethod`. Both can claim authoritative normalization, but one rejects/throws on every scenario produced by the other. The former `water_cooled`/undeclared-value problem is therefore directionally corrected but not compilably closed.

**Required correction:** either bind CTR-044 directly to one existing declared scenario input/outcome and its exact field paths, or declare closed `ShippedScenarioInputV1`, `ShippedNormalizedScenarioV1`, and `ShippedNormalizationOutcomeV1` schemas plus one behavior-preserving adapter to the approved deterministic input. Make `MODEL-ELIGIBILITY-V13` compile through that exact boundary and mutation-fail every renamed/missing controlled field.

### G3V13.1-002 — Blocker — verified restoration is not reproducible across clock/freshness changes

**References:** `01-requirements.md:131,251`; `02-usage-definition.md:279`; `05-contracts.md:3889-3938,5066-5078,5093-5099`; `06-logic-map.md:513-529,2779-2781,2789`; `07-test-strategy.md:863`.

`scenarioFingerprint` is a bare `Sha256` with no normative hash input or equality rule to `ResultSnapshotV2.reproducibility.normalizedScenarioHash`. Restoration says to recompute the deterministic result snapshot, but the existing `analyse` reads the current clock and embeds `asOf` in the reproducibility/freshness closure. The receipt does not preserve an analysis instant or declare that recomputation uses the stored snapshot's instant. Thus unchanged scenario, region, candidate, evidence bytes, and release can still produce a different result ID merely because reload occurs later.

**Counterexample:** evaluate immediately before an evidence freshness boundary, then reload immediately after it without changing any saved input or release. Re-evaluation at the new clock changes freshness, `reproducibility.asOf`, and potentially statements/assessment bytes, so the valid receipt fails Option A restoration. An implementation that hashes the raw scenario for `scenarioFingerprint` and one that uses normalized canonical bytes can also disagree while both pass the current scalar schema.

**Required correction:** define `scenarioFingerprint` exactly, preferably as the canonical normalized-scenario hash already carried by the result reproducibility manifest. A receipt or referenced stored result must preserve the original analysis `asOf`. Restoration should load and content-validate the immutable stored `ResultSnapshotV2`, validate all receipt/reproducibility/binding hashes, and, if differential recomputation is required, run an explicit pure `analyseAt(originalAsOf, retainedExactInputs)` oracle rather than reading the current clock. Add before/after freshness-boundary, timezone/DST, and raw-equivalent/normalized-equivalent scenario restoration tests.

### G3V13.1-003 — Blocker — failure, invalidation tagging, and duration semantics are not total

**References:** `01-requirements.md:147,243,249`; `02-usage-definition.md:280-283`; `05-contracts.md:5074-5087`; `06-logic-map.md:2746-2787`; `07-test-strategy.md:394-395,862,866`.

`EvaluationEventV1` has `analysis_ready` but no `analysis_failed|cancelled` terminal. A deterministic worker rejection, crash, or closure-validation failure therefore leaves the current state `evaluating` indefinitely; MODEL-EVENTS-V13 proves only that failure cannot reveal results, not that it recovers with typed guidance. The `invalidate` event carries caller-selected `nextGeneration` but no expected current generation or invalidated run ID, and the reducer prose ignores the supplied value; a stale invalidation can cancel a newer run. The `start` event also lacks an expected scenario-workflow generation, so scenario reversal cannot be rejected solely from its contract.

The test requires reduced-motion **completion** within 180 ms, but deterministic analysis is allowed up to one second by NFR-PER-001/PERF-CAL-001 and `finish` correctly requires analysis readiness. A valid 900 ms calculation cannot both obey the existing performance contract and finish within 180 ms. The intended bound can apply to presentation delay, not total calculation latency, unless a new 180 ms hard computation requirement is approved.

**Counterexamples:** inject an analysis terminal failure for the current run: no legal event returns to scenario, so progress remains forever. Queue an old `invalidate(nextGeneration=9)` after run B has begun: no expected-generation rule rejects it. Under reduced motion, hold a valid analysis result for 900 ms: either A11Y-PROGRESS-V13 fails its 180 ms ceiling or the UI enters results without the required ready snapshot.

**Required correction:** add a run-tagged `analysis_terminal` union with `ready|failed|cancelled`; failure/cancel returns to scenario with bounded guidance after cleaning all resources. Add `workflowGeneration` to captured runs/start events and make invalidation carry `expectedGeneration`/optional `invalidatedRunId`, while the reducer alone allocates the next generation. Require exact current generation on every mutating event. Define 1,800/180 ms as maximum presentation contribution; total completion is the later of completed stage presentation and analysis readiness and remains governed by the existing calculation budget. Tests must cover current-run failure recovery, stale start/invalidate, maximum-valid slow analysis in both motion modes, and zero post-cancel announcements.

## v0.13.1 traceability conclusion

CTR-044 and the v0.13.1 tests materially close the sole-region, run-binding, direct-route, copy, mapping, and accessibility-surface defects. They do not yet make the authoritative normalization producer, receipt restoration oracle, or workflow failure/generation/timing state total and reproducible. Those are executable correctness gaps in FR-UX-007, AC-029, UJ-018, NFR-REL-001, NFR-PER-001, INV-072–075, and approved Option A—not nonmaterial wording edits.

No further user decision is needed unless the intended reduced-motion rule is actually a new 180 ms end-to-end calculation requirement; the recommended correction preserves the already approved performance contract by bounding presentation delay only.

## Exact v0.13.1 verdict

`blocked`

---

# v0.13.2 scenario-first amendment — final independent re-review

**Review date:** 2026-08-07 (Pacific/Auckland)
**Reviewer:** `/root/logic_reviewer_v011`
**Scope:** CTR-044 v0.13.2, LOG-WORKFLOW-001 v0.13.2, INV-076–079, v0.13.2 release tests, all prior G3V13/G3V13.1 counterexamples, and approved Option A restoration
**v0.13.2 verdict:** `blocked`

## Exact v0.13.2 reviewed set

| Artifact | Lines | SHA-256 |
|---|---:|---|
| `.autoforge/01-requirements.md` | 251 | `4751ed6825a3a5fdf7fad4611dde23c11b0297e7cf3ab04624c69b63f0c46d69` |
| `.autoforge/02-usage-definition.md` | 284 | `8b0da66966f5551364ca53e396ad338fb7e2dc61bbd02ec2d5672f61653e6f63` |
| `.autoforge/04-selected-architecture.md` | 135 | `84c7a20ea04e1f9f654f3cddc5e8272155d152ac4b980aecef11d2b8f8d5d2db` |
| `.autoforge/05-contracts.md` | 5,189 | `10a197d248ad464eaa79c69d8746af71be521900e2a21a7c87c1f0e257c69946` |
| `.autoforge/06-logic-map.md` | 2,848 | `e81d0f724d6034ad1a3caaa43827d2b169cf757bd0b815bdc4b42a3c983ceea2` |
| `.autoforge/07-test-strategy.md` | 876 | `0473986ba62c63c59c807ebbc424e36ad3d25c2087c6ac2cb538b5853d684379` |

Option A remains approved and there are **zero open user decisions**.

## Counterexample disposition

| Finding family | v0.13.2 disposition |
|---|---|
| G3V13-001 / G3V13.1-001 — authoritative eligibility, cooling, sole binding | **Partly closed.** Input/normalized/outcome shapes and a sole producer are now named; cooling no longer uses the erroneous `direct_liquid` field; zero/duplicate/cross-region/stale bindings reject. The new schema graph is still not closed and its promised deterministic adapter accepts an incompatible jobs value (G3V13.2-001). |
| G3V13-002 / G3V13.1-003 — run/result closure, stale events, terminality, timing | **Closed.** Workflow generation and run ID tag every relevant mutating/run event; reducer-owned generation rejects stale start/invalidate/stage/terminal/finish; ready/failed/cancelled are total; resources and announcements cancel; results require stage 2 plus a ready matching snapshot. The 1,800/180 ms limits now correctly bound presentation contribution while slower valid analysis obeys the existing calculation budget. |
| G3V13-003 / G3V13.1-002 — verified Option A restoration | **Partly closed.** Canonical scenario hashing, immutable stored snapshot/receipt, result hashing, current-clock exclusion, legacy/direct-route rejection, and differential `evaluateAt` are explicit. The selected evidence instant is narrowed to `LocalDate`, so exact freshness/timezone restoration is still not representable (G3V13.2-002). |
| G3V13-004 — mapping/copy/accessibility | **Closed.** The exact internal-to-reader mapping, canonical region display names, all runtime surfaces, positive evidence qualification, byte-identical deterministic regression, ordered announcements, focus, stale callbacks, and both motion modes remain covered. |

## Remaining findings

### G3V13.2-001 — Blocker — the shipped schema/adapter graph is not closed or type-preserving

**References:** `05-contracts.md:267-344,3848-3873,5111-5161`; `06-logic-map.md:2802-2819`; `07-test-strategy.md:872`.

CTR-044 uses `NumericText`, `Utf8Bytes`, `ScenarioCalculations`, and `SiteAssessment`, but none has a type/record/union declaration anywhere in the reviewed contract artifact. The new contract-compile test covers `ShippedScenarioInputV1` through `ShippedNormalizationOutcomeV1`, not the complete `ShippedResultSnapshotV1` graph, so the latter two unresolved symbols can escape its stated oracle.

The claimed exact adapter also permits `permanentJobs:FiniteNumber[0,100000]`, while the approved normalized deterministic contract requires permanent jobs to be an integer (`UInt64`). Thus `12.5` is a valid `ShippedNormalizedScenarioV1` but cannot be adapted to the promised deterministic input. Numeric normalization additionally says “rounds ... to six decimal places” without naming a tie-breaking rule, allowing different canonical bytes/fingerprints at half-way values.

**Counterexamples:** compile the full CTR-044 transitive graph: resolution stops at the four undeclared types. Separately, normalize `permanentJobs="12.5"`; the shipped schema returns `valid`, but the deterministic adapter must reject or silently alter it. For a seventh-decimal half-way input, half-even and half-away-from-zero implementations produce different canonical fingerprints while both satisfy the current wording.

**Required correction:** declare exact bounded `NumericText` grammar/bytes, canonical-byte encoding, calculation result, and site-assessment schemas, or reference existing declared types by their exact names. Compile the full CTR-044 transitive closure. Make jobs an integer in input normalization, specify investment unit conversion and every preset/origin-proof field in an exact adapter record, and either preserve approved exact decimal inputs or name one deterministic six-place rounding algorithm with boundary fixtures.

### G3V13.2-002 — Blocker — `analysisAsOf` loses the evidence snapshot instant

**References:** `05-contracts.md:1584-1612,3893-3917,5149-5170,5189`; `06-logic-map.md:2811-2819,2836-2847`; `07-test-strategy.md:873,876`.

The approved `EvidenceSnapshot.asOf` and result reproducibility `asOf` are `Instant`, but `ShippedResultSnapshotV1.analysisAsOf` and `EvaluationRunCoreV1.analysisAsOf` are only `LocalDate`. CTR-044 says this value is captured from the evidence snapshot, yet the narrowing discards time-of-day and offset/UTC identity. `evaluateAt` therefore cannot reproduce the exact original freshness boundary when two instants share one date or when UTC and Pacific/Auckland dates differ. The promised DST/timezone test cannot recover information absent from the schema.

**Counterexample:** the evidence snapshot is evaluated at `2026-09-27T01:59:59+12:00`, immediately before the NZ daylight-saving transition/freshness cutoff. The receipt stores only `2026-09-27`. Reload cannot determine the original instant; choosing UTC midnight, NZ midnight, or current offset can yield different freshness and result bytes while all match the stored `LocalDate`.

**Required correction:** make `analysisAsOf:Instant` byte-identical to the selected `EvidenceSnapshot.asOf` and the stored result reproducibility instant. Require equality across binding, snapshot, receipt, and `evaluateAt`. Extend the restoration test with two distinct instants on the same local date, UTC/NZ date-boundary pairs, and both DST transition directions; mutation of any subsecond/offset-normalized instant must fail or canonicalize to the same UTC instant by one declared rule.

## v0.13.2 traceability conclusion

The revised reducer and tests close the stale-run, terminal failure/cancellation, presentation timing, route bypass, copy, mapping, and accessibility defects. Gate 3 remains blocked because the shipped result contract cannot compile as a closed graph, a schema-valid jobs value cannot traverse its advertised deterministic adapter, and the receipt cannot retain the exact evidence instant required for reproducible Option A restoration. These are material correctness gaps in FR-UX-007, AC-029, UJ-018, NFR-REL-001, INV-076–079, and the approved restoration policy.

No additional user decision is needed; both corrections preserve approved behavior.

## Exact v0.13.2 verdict

`blocked`

---

# v0.13.3 scenario-first amendment — independent closure review

**Review date:** 2026-08-07 (Pacific/Auckland)
**Reviewer:** `/root/logic_reviewer_v011`
**Scope:** CTR-044 v0.13.3, LOG-WORKFLOW-001 v0.13.3, INV-080–081, v0.13.3 tests, prior G3V13.2-001/002, all previously closed v0.13 findings, and approved Option A restoration
**v0.13.3 verdict:** `blocked`

## Exact v0.13.3 reviewed set

| Artifact | Lines | SHA-256 |
|---|---:|---|
| `.autoforge/01-requirements.md` | 251 | `4751ed6825a3a5fdf7fad4611dde23c11b0297e7cf3ab04624c69b63f0c46d69` |
| `.autoforge/02-usage-definition.md` | 284 | `8b0da66966f5551364ca53e396ad338fb7e2dc61bbd02ec2d5672f61653e6f63` |
| `.autoforge/04-selected-architecture.md` | 135 | `84c7a20ea04e1f9f654f3cddc5e8272155d152ac4b980aecef11d2b8f8d5d2db` |
| `.autoforge/05-contracts.md` | 5,228 | `92eededcfde58754152e333c5d6e90253995370c9f5431fd71acbbfd09541704` |
| `.autoforge/06-logic-map.md` | 2,857 | `8cf868d57ec7738034bb2b467d8129cc584d3cfdfc735ea5b1846883bf845e7d` |
| `.autoforge/07-test-strategy.md` | 882 | `1b3aa36d166db65b009307fc2a75c5286b2cc1016ff08d70867fa92a529fece7` |

Option A remains approved. There are **zero open user decisions**.

## Closure disposition

The following prior findings remain closed: exact group/copy mapping, all 17 canonical display names and surfaces, positive evidence qualification, deterministic byte preservation, unique regional assessment selection, immutable run/result identity, legacy/direct route rejection, reducer-owned generation, stale event rejection, ready/failed/cancelled cleanup, ordered accessible announcements, and presentation-only normal/reduced-motion ceilings.

G3V13.2-001 is **partly closed**: `NumericText`, RFC 8785 canonical bytes, calculation, assessment, round6, investment conversion, preset values, and the former shorthand symbols are now named. Exact normalized jobs and the adapter/origin-proof boundary remain inconsistent (G3V13.3-001).

G3V13.2-002 is **partly closed**: run/snapshot/receipt restoration now uses a canonical UTC `Instant` and forbids current-clock/date reconstruction. The prepared-region binding does not contain that instant, so the required full equality chain remains unrepresentable (G3V13.3-003).

## Remaining findings

### G3V13.3-001 — Blocker — normalized jobs and the claimed exact adapter remain outside the closed type graph

**References:** `05-contracts.md:3838-3873,5118-5147,5191-5226`; `06-logic-map.md:2850-2856`; `07-test-strategy.md:878-881`.

The v0.13.3 prose says permanent-jobs normalization emits `UInt64[0,100000]`, but `ShippedNormalizedScenarioV1.permanentJobs` remains declared as `FiniteNumber[0,100000]`. The generated schema therefore still accepts `12.5`; a producer-only promise does not make the exact normalized decoder or transitive graph integer-safe.

The “exact adapter” is also only a prose field list. No closed adapter-input/output record attaches the generated `ScenarioDraftV2`, preset identity, and field-by-field `OriginProofV2` set to the CTR-044 transitive graph. The sentence requiring an origin proof for every emitted/defaulted field “naming `gridlens-demo-form-v1`” does not distinguish user-entered fields, which must retain `user_assumption`, from actual defaults, which must be `versioned_preset`, as required by the unchanged normalization/origin contract.

**Counterexamples:** decode a normalized object with `permanentJobs:12.5`; it passes the declared exact type while the advertised deterministic adapter cannot emit the required integer. Separately, two adapters can emit byte-identical scenario fields but label all fields `versioned_preset` versus label user inputs `user_assumption`; the current prose does not define a typed proof map that makes one fail, although the difference is material to result origin labels.

**Required correction:** change the actual `ShippedNormalizedScenarioV1.permanentJobs` field to `UInt64[0,100000]`. Declare and export an exact `ShippedDeterministicAdapterOutputV1` containing the complete draft/normalized target, preset ID/version/hash, and an exact proof map. User-supplied overlapping fields must receive `user_assumption`; only enumerated defaults receive `versioned_preset` with the preset identity. Compile and mutation-test that adapter output as part of the CTR-044 root.

### G3V13.3-002 — Blocker — an unselected cooling method still passes readiness

**References:** `01-requirements.md:243,249`; `02-usage-definition.md:277-280`; `05-contracts.md:5116-5147,5224`; `06-logic-map.md:2803-2813`; `07-test-strategy.md:872,881`.

`ShippedScenarioInputV1.coolingMethod` is optional and the sole normalizer defaults an omission to `hybrid`. Eligibility rejects only when the **normalized** value is `unknown`. Consequently an unselected/omitted cooling control becomes `hybrid` and is eligible, directly contradicting UJ-018's boundary rule that an unknown or unselected cooling method disables evaluation. It also labels a fabricated cooling choice as if it were part of the complete scenario.

**Counterexample:** submit a valid scenario with `coolingMethod` absent. Normalization supplies `hybrid`; `deriveEligibility` sees a non-unknown value and returns ready. AC-029 requires the evaluate action to remain disabled with corrective guidance.

**Required correction:** make shipped cooling required, or have eligibility require the original field to be present and non-`unknown` before applying any preset. Remove the hybrid default for this user-required declaration. Add omitted, empty/decoder-invalid, explicit `unknown`, and every supported cooling value to the eligibility and origin-proof tests.

### G3V13.3-003 — Blocker — the instant cannot be equal across the prepared-region binding because the field is absent

**References:** `05-contracts.md:1584-1612,5057-5064,5157-5189,5228`; `06-logic-map.md:2809-2819,2836-2857`; `07-test-strategy.md:873,876,882`.

Replacing `LocalDate` with canonical UTC `Instant` closes the date-narrowing defect for the run, snapshot, receipt, and `evaluateAt`. But `PreparedRegionBindingV1` still contains only region, candidate, selection generation, screening hash, evidence snapshot ID, and release hash—no `analysisAsOf`. CTR-044 v0.13.3 and INV-081 nevertheless require byte-identical instant equality across evidence **binding**, run, snapshot, receipt, and evaluator. The full graph and RESTORE-INSTANT test cannot assert a field that the binding schema cannot carry.

**Counterexample:** construct two prepared bindings with identical declared bytes that resolve the same evidence snapshot ID through two indexes carrying different stale `asOf` metadata. Both bindings are schema-identical; only later lookup decides which instant enters the run, so binding-to-run equality is not a contract invariant and mixed metadata cannot be rejected at the binding boundary.

**Required correction:** add canonical `analysisAsOf:Instant` to a superseding prepared-region binding and require it to equal the resolved `EvidenceSnapshot.asOf` after the one declared UTC/millisecond canonicalization. Include that field in run/snapshot/receipt/result hashes and mutation-test evidence↔binding as well as binding↔run equality, including same-date distinct instants, offset-equivalent instants, both NZ DST transitions, and current-clock substitution.

## v0.13.3 traceability conclusion

The new scalar and result types, round6 rule, investment conversion, and UTC-instant restoration substantially improve closure. Gate 3 is still blocked because the exact normalized schema admits a fractional jobs value, the adapter/origin-proof output is not a typed member of the transitive graph, missing cooling silently becomes a valid choice, and the required evidence instant is absent at the binding boundary. These affect FR-UX-007, AC-029, UJ-018, NFR-REL-001, INV-080–081, and Option A restoration.

No further product decision is required; the corrections implement already approved behavior.

## Exact v0.13.3 verdict

`blocked`

---

# v0.13.4 scenario-first amendment — independent exact-root re-review

**Review date:** 2026-08-07 (Pacific/Auckland)
**Reviewer:** `/root/logic_reviewer_v011`
**Scope:** CTR-044 v0.13.4 V2 roots, LOG-WORKFLOW-001 v0.13.4, INV-082–084, v0.13.4 tests, prior G3V13.3-001–003, and regression of every previously closed v0.13 finding
**v0.13.4 verdict:** `blocked`

## Exact v0.13.4 reviewed set

| Artifact | Lines | SHA-256 |
|---|---:|---|
| `.autoforge/01-requirements.md` | 251 | `4751ed6825a3a5fdf7fad4611dde23c11b0297e7cf3ab04624c69b63f0c46d69` |
| `.autoforge/02-usage-definition.md` | 284 | `8b0da66966f5551364ca53e396ad338fb7e2dc61bbd02ec2d5672f61653e6f63` |
| `.autoforge/04-selected-architecture.md` | 135 | `84c7a20ea04e1f9f654f3cddc5e8272155d152ac4b980aecef11d2b8f8d5d2db` |
| `.autoforge/05-contracts.md` | 5,322 | `2a20265057bb12e23d86466625c05e92174e1cb4cb05b7ba4dc3b39908905545` |
| `.autoforge/06-logic-map.md` | 2,867 | `144e6a1b1a18a2c233b4cf8f2858025eea30813ac2d097b0da7e2aaa8860afc5` |
| `.autoforge/07-test-strategy.md` | 889 | `48e157db3674fcc1dfd0894f36a27318aa292cd66fd06f208b1dae74ebd8ac34` |

Option A remains approved. There are **zero open user decisions**.

## G3V13.3 closure disposition

- **G3V13.3-001 closed for data types and adapter payload.** `ShippedNormalizedScenarioV2.permanentJobs` is actually `UInt64`; the input decoder uses the integer numeric-text subset; the adapter output is a closed record containing source, exact draft/normalized targets, preset identity/hash, a nine-user/seven-preset origin-proof map, and an adapter hash. Round6, exact NZD-million conversion, and preset values remain stated and tested.
- **G3V13.3-002 closed.** Cooling is required in `ShippedScenarioInputV2`; omission/empty/unknown block, no scenario-field default is applied, every supported explicit value remains user-originated, and the eligibility mutations are release-blocking.
- **G3V13.3-003 closed.** `PreparedRegionBindingV2` contains canonical `analysisAsOf:Instant`; evidence↔binding↔run↔snapshot↔receipt/evaluator equality and hash inclusion cover same-date instants, offset equivalence, DST, and current-clock substitution.

All earlier event/generation/terminal, unique-region, result-binding, route-policy, presentation timing, copy, group mapping, canonical-name, evidence-qualification, accessibility, and deterministic-regression findings remain logically closed by the unchanged v0.13.1–v0.13.3 rules and tests.

## Remaining finding

### G3V13.4-001 — Blocker — retiring V1 leaves no exact V2 workflow/event/route root

**References:** `05-contracts.md:4955-4966,5074-5099,5163-5185,5230-5232,5298-5322`; `06-logic-map.md:2815-2843,2859-2867`; `07-test-strategy.md:860,862-866,884-889`.

CTR-044 v0.13.4 correctly replaces the V1 input, normalized scenario, prepared binding, run, snapshot, and receipt and states that no V1 workflow root is exported. However, the only exact workflow and event declarations remain `EvaluationWorkflowV1` and `EvaluationEventV1`; their fields reference `EvaluationRunCoreV1`, `ShippedResultSnapshotV1`, and `EvaluationRunReceiptV1`. The only exact receipt-bearing results route remains `page:"evaluation_v1"` with `EvaluationRunReceiptV1`. No `EvaluationWorkflowV2`, `EvaluationEventV2`, or V2 receipt-bearing route/storage union is declared.

Line 5322 says events/routes/storage “use only V2” in prose, but it does not define the resulting closed unions. `CONTRACT-CTR044-V2` compiles only the V2 input/normalized/binding/adapter/run/snapshot/receipt list; it does not name the workflow, event, route, or stored-route roots. Therefore either the retired V1 types remain reachable, contradicting retirement, or the production reducer/restore path has no schema root.

**Counterexamples:** start strict generation from the declared V2 closure and add the reducer's `analysis_terminal` event: the only named event schema requires a V1 snapshot. Alternatively, decode a stored verified V2 receipt route: the only exact verified route accepts a V1 receipt, so a V2 receipt is an unknown shape. Hand-substituting V2 field types can yield multiple incompatible event/route schemas while all claim to implement line 5322.

**Required correction:** declare exact `EvaluationWorkflowV2` and `EvaluationEventV2` unions using only `EvaluationRunCoreV2`, `ShippedResultSnapshotV2`, and `EvaluationRunReceiptV2`, preserving the already validated generation/run/prior-stage/terminal rules. Supersede the result route with one exact V2 receipt variant and amend the stored route payload to that union. Export all of these from the effective public/client graph; make any import of the V1 workflow/event/route roots fail compilation. Extend `CONTRACT-CTR044-V2` to compile and mutation-test workflow, every event variant, route, and storage round-trip in addition to the data/receipt roots.

## v0.13.4 traceability conclusion

The requested jobs, cooling, typed adapter/origin, and canonical evidence-instant corrections are materially complete, and all previously closed behavioral counterexamples remain closed. Gate 3 is still blocked because the exact reducer and restoration consumers cannot consume the new V2 types without an undeclared manual substitution or re-importing retired V1 roots. This is a schema-graph defect in FR-UX-007, AC-029, UJ-018, INV-078/080–084, and Option A restoration, not a presentation-only edit.

No product decision is required; the correction is the exact V2 expression of already approved behavior.

## Exact v0.13.4 verdict

`blocked`

---

# v0.13.5 scenario-first amendment - independent exact-root re-review

**Review date:** 2026-08-07 (Pacific/Auckland)
**Reviewer:** `/root/logic_reviewer_v011`
**Scope:** CTR-044 v0.13.5 V2 workflow/event/route/stored-route roots, LOG-WORKFLOW-001 v0.13.5, INV-085-086, v0.13.5 tests, G3V13.4-001, and regression of all earlier v0.13 findings
**v0.13.5 verdict:** `blocked`

## Exact v0.13.5 reviewed set

| Artifact | Lines | SHA-256 |
|---|---:|---|
| `.autoforge/01-requirements.md` | 251 | `4751ed6825a3a5fdf7fad4611dde23c11b0297e7cf3ab04624c69b63f0c46d69` |
| `.autoforge/02-usage-definition.md` | 284 | `8b0da66966f5551364ca53e396ad338fb7e2dc61bbd02ec2d5672f61653e6f63` |
| `.autoforge/04-selected-architecture.md` | 135 | `84c7a20ea04e1f9f654f3cddc5e8272155d152ac4b980aecef11d2b8f8d5d2db` |
| `.autoforge/05-contracts.md` | 5,365 | `a68d1412337f05b315c88f96d0840acb93ecbf8f99818dcdb5c9b5daab13d680` |
| `.autoforge/06-logic-map.md` | 2,874 | `9a5412af0abf64dc9201ce43b9ed697e52103e0db731adee69705956abd1c06e` |
| `.autoforge/07-test-strategy.md` | 894 | `fd80f3355117b45b76cacce86a4900ab712c45ab3c08377011f6d6ad26a3a31f` |

Option A remains approved. There are **zero open user decisions**.

## G3V13.4-001 closure disposition

G3V13.4-001 is **closed at the newly declared CTR-044 roots**. `EvaluationWorkflowV2` and every `EvaluationEventV2` variant now reference only the V2 run, snapshot and receipt. `EvaluationRouteV2` is an exact receipt-bearing `evaluation_v2` route; `StoredEvaluationRouteV2` carries that route, the V2 snapshot, retained V2 input and a payload hash over all three. The restore contract validates that hash and the complete closure before dispatching an accepted V2 `restore` event. The v0.13.5 tests explicitly reject route/receipt/snapshot/input/hash mutation, a bare route, the legacy V3 evaluation route, deep links and attacker guidance.

All prior jobs, cooling, adapter/origin-proof, evidence-instant, event/generation/terminal, unique-region, result-binding, presentation timing, copy, group mapping, canonical-name, evidence-qualification, accessibility and deterministic-regression findings remain closed. No V1 run, snapshot or receipt is reachable from the four newly declared V2 orchestration roots.

## Remaining finding

### G3V13.5-001 - Blocker - the effective public and storage roots still export the legacy evaluation route

**References:** `05-contracts.md:4712,4727-4748,4955-4966,4981,5018-5042,5324-5365`; `06-logic-map.md:2869-2874`; `07-test-strategy.md:891-894`.

The new V2 declarations are internally closed, but they are not connected to either existing master export graph. `GridLensPublicContractV3` remains the declared build-time public compile root and its `workflowRoute:WorkflowRouteV3` still admits the literal `"evaluation"`. The later route-state amendment also says `WorkflowRouteStateV3` is exported from that public root. Separately, the effective `StoredPayloadV3` route variant remains `exact { store:"route"; value:WorkflowRouteStateV3 }`; it therefore accepts the old `page:"evaluation"` member and has no reference to `WorkflowRouteStateV4` or `StoredEvaluationRouteV2`. Those two new types occur only in their declarations and the assertion that they are sole exports.

The v0.13.5 assertion that legacy evaluation routes are compile-time forbidden therefore conflicts with the exact roots from which production schemas are generated. INV-085 and `CONTRACT-ORCHESTRATION-V135` cannot both hold when compiled from the stated public/storage roots.

**Counterexamples:** compile `GridLensPublicContractV3` with `workflowRoute:"evaluation"`; it satisfies the declared exact public graph. Independently, decode a `StoredEnvelopeV3` whose route payload is `{page:"evaluation", resultSnapshotId, regionId}`; it satisfies the still-effective `StoredPayloadV3` route variant. Conversely, placing a `StoredEvaluationRouteV2` in that exact route-store variant fails because the new stored root is not a member. Thus the route-inclusive hash, mutation rejection and accepted-V2-event restore policy are defined for an orphaned root while the production storage graph retains the legacy path.

**Required correction:** supersede the effective public root so its workflow-route field reaches `WorkflowRouteStateV4` (or an equivalently exact current route union) and removes `WorkflowRouteV3`'s legacy `"evaluation"` member. Supersede the effective stored-payload/envelope route variant so evaluation persistence reaches `StoredEvaluationRouteV2` and cannot decode `WorkflowRouteStateV3.page="evaluation"`. Compile the positive V2 round-trip and all bare/legacy/mutated negatives starting from those master public and storage roots, not only from the standalone CTR-044 roots.

## v0.13.5 traceability conclusion

The v0.13.5 workflow, event, route and stored-route declarations close the former missing-schema defect, and the prior behavioral and data-contract findings remain closed. Gate 3 is still blocked because the effective exported public and storage graphs retain a legacy evaluation route and do not reach the new V2 route/storage roots. This is a production schema-reachability defect affecting FR-UX-007, AC-029, UJ-018, INV-085-086 and Option A restoration.

No product decision is required; the correction is the already approved V2 export substitution.

## Exact v0.13.5 verdict

`blocked`

---

# v0.13.6 scenario-first amendment - independent effective-root re-review

**Review date:** 2026-08-07 (Pacific/Auckland)
**Reviewer:** `/root/logic_reviewer_v011`
**Scope:** CTR-044 v0.13.6 V4 master/route/storage roots, LOG-WORKFLOW-001 v0.13.6, INV-087-088, v0.13.6 tests, G3V13.5-001, and regression of all earlier v0.13 findings
**v0.13.6 verdict:** `validated`

## Exact v0.13.6 reviewed set

| Artifact | Lines | SHA-256 |
|---|---:|---|
| `.autoforge/01-requirements.md` | 251 | `4751ed6825a3a5fdf7fad4611dde23c11b0297e7cf3ab04624c69b63f0c46d69` |
| `.autoforge/02-usage-definition.md` | 284 | `8b0da66966f5551364ca53e396ad338fb7e2dc61bbd02ec2d5672f61653e6f63` |
| `.autoforge/04-selected-architecture.md` | 135 | `84c7a20ea04e1f9f654f3cddc5e8272155d152ac4b980aecef11d2b8f8d5d2db` |
| `.autoforge/05-contracts.md` | 5,403 | `51ef7cbfbd04ed221720ec39dfa5708c3542caeb8edeff5fe2b1ada92be66ddd` |
| `.autoforge/06-logic-map.md` | 2,881 | `fb8737d1bef5d463dba72a673de6f0bc3ca70d762eb9263526da34ff3468c183` |
| `.autoforge/07-test-strategy.md` | 899 | `c0bc09e6f8622ae805b124740ac378a4a554cfd47d04c4fe859da75d97180e67` |

Option A remains approved. There are **zero open user decisions**.

## G3V13.5-001 closure disposition

G3V13.5-001 is **closed**. `GridLensPublicContractV4` is now the sole effective schema/client/storage compile root and removes the V3 `workflowRoute` field before adding the exact current kind/state roots. From that root, `EvaluationWorkflowV2` and `EvaluationEventV2` are direct children; `EvaluationRouteV2` is reached through `WorkflowRouteStateV4`; and `StoredEvaluationRouteV2` is reached through `StoredEnvelopeV4 -> StoredPayloadV4 -> evaluation_route`. The result route token is only `evaluation_v2`.

`StoredPayloadV4` removes the complete V3 `route` variant before adding exact current `route:WorkflowRouteStateV4` and `evaluation_route:StoredEvaluationRouteV2` variants. `StoredEnvelopeV4` has disjoint exact live/tombstone shapes and includes `evaluation_route` in its tombstone store set. The inherited V3 bases are used only under discriminant subtraction; no current decoded public, route or storage variant exposes the removed legacy evaluation member. The old V3 public, route-state, payload and envelope roots are explicitly migration-only and forbidden to current producers.

The migration rule is total for V3 routes: non-evaluation variants map to their V4 equivalents, while every legacy `evaluation` input becomes `scenario` with bounded local guidance. It cannot produce an `EvaluationRunReceiptV2`, result snapshot or results state. `CT-MASTER-ROOT-V136` checks reachability and rejects any current V3/legacy reference; `MIGRATE-ROUTE-V136` covers every V3 route, the forced demotion, receipt/snapshot non-creation, and separate V4 route/evaluation-route live and tombstone round-trips.

## Counterexample replay and regression

- A current `workflowRouteKind:"evaluation"` fails `WorkflowRouteV4`; only `evaluation_v2` is legal.
- A current state or `store:"route"` payload with `page:"evaluation"` is removed by the V3 discriminant exclusions and fails the V4 graph.
- A V3 migration input containing legacy evaluation IDs cannot enter results because its only declared outcome is fresh scenario state with local guidance and no receipt creation.
- A bare, deep-linked or mutated V2 evaluation route still cannot reveal results: the v0.13.5 route/storage tests require the exact route-inclusive stored hash, full receipt/snapshot/input/evidence closure, and an accepted V2 restore event.

All earlier jobs, cooling, adapter/origin-proof, canonical evidence-instant, reducer generation/run/stage/terminal, unique-region, immutable result-binding, presentation timing, copy, group mapping, canonical-name, evidence-qualification, accessibility and deterministic-regression findings remain closed.

## Findings and decisions

No blocking or non-blocking logic defect was found in the v0.13.6 effective-root replacement. No correction or product decision is required.

## v0.13.6 traceability conclusion

The sole current V4 compile graph now reaches every V2 orchestration and persistence root while excluding the legacy evaluation token from all current route and storage variants. V3 is confined to migration input, and its evaluation member deterministically demotes to scenario without a receipt or result. INV-085-088, FR-UX-007, AC-029, UJ-018 and Option A restoration are coherently specified and covered by release-blocking compile, mutation, migration and round-trip tests.

## Exact v0.13.6 verdict

`validated`
