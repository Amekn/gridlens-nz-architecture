# GridLens NZ — Independent Gate 2 Logic Review

**Review version:** 0.2  
**Review status:** Final against frozen artifacts  
**Reviewer role:** independent logic reviewer  
**Scope:** requirements 0.3, usage definition 0.3, selected architecture 0.2, ADR-001..ADR-004, contracts 0.2, logic map 0.2, and test strategy 0.2

## Frozen review basis

The final read and verdict use exactly these frozen files:

| Artifact | SHA-256 |
|---|---|
| `05-contracts.md` | `01739a5aa50e28f8ef51887681033da6e509ab483e6ab02b027053853ae432a3` |
| `06-logic-map.md` | `19202e0a188a78e5cb58f4b18e4c9011b9da1f21fe82702dd694a84cdbc7fc53` |
| `07-test-strategy.md` | `94dd0bb3a3478cac7477b844b31de6b49c94c7118b3ca59f79fd5bb8a03574bb` |

All listed Gate 1/Gate 2 inputs were read in full. I independently simulated the formula, minimax, freshness, assessment, geometry, presentation-plan, and persistence paths; challenged union states and producer/consumer closure; and checked the literal requirement/acceptance mappings.

## What now survives review

- The Southland scalar oracle is correct: `50 × 1.3 = 65 MW`; `65 × 0.8 × 8760 / 1000 = 455.52 GWh`; configured flexible load is `19.5 MW`; average active load is `52 MW`; average active flexible load is `15.6 MW`.
- The frozen Southland simulation is coherent. Source hours 0–3 each remove `15.6 MWh`; destination additions `2,4,6,8,10,12,13,7.4` sum to `62.4 MWh`; the combined peak falls from `132` to `124 MW` without violating the source, destination, or energy constraints.
- The corrected minimax counterexample `[100,50,50,75×21]` is exact. The non-source floor is `125 MW`, and hours 1 and 2 each accept `25 MWh`, so `150→125 MW` with no eligible remainder.
- The exact feasibility predicate no longer uses epsilon to admit an infeasible target. Destination utilisation below baseline is consistently a typed simulation failure.
- Calendar-month freshness, end-of-month clamping, `validUntil`, equality boundaries, and the pinned bundle date are coherent and testable.
- The geometry contract has exact named IDs, point-in-polygon behavior, hole/boundary behavior, lexicographic overlap resolution, and no nearest-region fallback.
- Proposal claims, non-empty fact evidence arrays, threshold presence/absence versioning, water range provenance, complete/insufficient/failed unions, category order, and overall precedence are substantially improved.
- The optional provider cannot return factual text, and snapshot/audience/generation checks prevent a late response from applying.
- The IndexedDB core now has per-record transactions, revision compare-and-swap, command hashes, tombstones, epoch compaction, migration, and individual quarantine. The principal race/resurrection logic is coherent.
- The test strategy now has an independent generic max-flow oracle and explicit requirement/acceptance coverage tables.

These corrections close many earlier defects, but the remaining findings below are specification gaps, not implementation polish.

## Remaining findings

### R2-001 — Legal profile magnitudes can exhaust the minimax search without an optimal certificate

**Severity:** Blocking  
**Affected:** CTR-001 `DemandProfile24h`; CTR-005; LOG-DATA-001; LOG-FLX-001; MODEL-FLX-003; FR-CAL-007; NFR-REL-001

`DemandProfile24h.values` accepts every positive finite JSON number. `findOptimalPeak` nevertheless performs at most 80 bisections. The final contract now correctly requires a feasible/infeasible certificate gap of at most `1e-9 MW`, but the algorithm does not require that gap before returning its seed.

Counterexample: a schema-valid profile containing a spread of approximately `10^30 MW` starts with an interval near `10^30`. After 80 halvings the interval is still about `8.27×10^5 MW`, not `1e-9 MW`. The independent result verifier must therefore turn this otherwise valid bundle into `SIMULATION_INVARIANT_FAILED`; it cannot satisfy the Must requirement to minimize the peak. The random oracle does not state that it samples the maximum contract range.

Required correction:

```text
MAX_REGIONAL_PROFILE_MW = an approved finite operational ceiling

validateBundleGraph:
  require every profile value <= MAX_REGIONAL_PROFILE_MW

findOptimalPeak:
  requiredIterations = ceil(log2((high-low)/EPS))
  require requiredIterations <= MAX_ITERATIONS before optimization
  repeat until high-low <= EPS
  require feasible(high)
  require not feasible(high-EPS) or analytical exact-lower-bound proof
```

Alternatively derive the iteration count dynamically under an explicit resource ceiling and fail bundle activation, not a valid runtime simulation, when the ceiling cannot prove the tolerance. Add a fixture at the approved maximum magnitude. Also require `abs(shiftedCombinedPeakMw - certificate.optimalPeakMw) <= EPS`; the present invariants relate the series to `shiftedCombinedPeakMw` but never explicitly relate the realized series peak to the claimed optimal target.

### R2-002 — Assessment rules and qualifying fact semantics are not closed or independently replaceable

**Severity:** Blocking  
**Affected:** CTR-001 `AssessmentPolicy`; CTR-002/003/006; LOG-VAL-001; LOG-DATA-001; LOG-ASM-002; FR-SCN-003; FR-ASM-001/005/006; FR-DAT-001; AC-016/019

There are four connected defects:

1. `AssessmentPolicy` carries only the electricity thresholds and overall precedence. Water, resilience, economic, community, authority, and contradiction rules are hard-coded prose/branches. This contradicts FR-DAT-001, which requires assessment rules to be independently versioned and replaceable without rewriting core calculation logic. `assessmentPolicyVersion` therefore does not identify the complete policy that produced an outcome.
2. Economic high concern depends on a “high suspicion/implausibility rule”, but no exact economic rule is contracted. The only nearby warning list says permanent jobs above 10,000 is suspicious and contains no investment threshold. It is unclear whether a warning becomes high concern, and no implementation can independently reproduce the intended branch.
3. `factIsCurrentAuthoritative` uses an undefined “relevant category”. No normative map says, for example, that `economic_claim/permanent_jobs` requires employment evidence, investment requires investment evidence, resilience requires resilience evidence, and community consultation requires community/current-news evidence. `resolveOrigin` checks only that all evidence IDs exist. A fact citing current authoritative evidence from the wrong category can therefore acquire `verified_evidence` origin, contrary to FR-SCN-003's “qualifying source record”.
4. Fossil backup plus `generatorRestrictionsEnabled=false` produces high concern from a traced user assumption without current evidence. FR-ASM-001 currently says every non-insufficient outcome has the required current evidence. The artifact must decide whether this conservative high branch is an intentional exception or whether absent verified restriction evidence yields insufficient evidence.

Material decisions required before implementation:

- **Resilience:** choose one rule. Recommended: an explicit user assertion of unrestricted fossil generation may produce conservative high concern, but amend FR-ASM-001/AC-016 to name this assumption-backed exception and require the reason to trace the assumption. Otherwise change the branch to insufficient until a current authoritative fossil fact confirms absence of restrictions.
- **Economic implausibility:** approve exact, versioned thresholds separately for jobs and investment. Recommended interim rule: an exact contradictory current authoritative fact may produce high; a jobs warning above 10,000 remains a warning/moderate unsupported claim until a numeric high threshold is deliberately approved; do not invent an investment threshold.

Required structural correction:

```text
record AssessmentPolicy {
  version
  electricityRule
  waterRule
  resilienceRule
  economicRule       // exact contradiction and implausibility predicates
  communityRule
  authorityRule
  overallPrecedence
}

factEvidenceRule:
  regional_peak -> electricity
  grid_capacity -> grid
  resilience_commitment -> resilience
  economic_claim(permanent_jobs) -> employment
  economic_claim(investment_nzd) -> investment
  community_consultation -> community_current_news
```

Each mapping must also state allowed source types/qualities and freshness requirements. Bundle validation, origin derivation, assessment, and tests must consume the same policy rather than duplicating prose.

### R2-003 — Per-result reproducibility and report trace closure remain incomplete

**Severity:** Blocking  
**Affected:** `ReproducibilityManifest`; CTR-003/004/005/007/008; LOG-CAL-001; LOG-RPT-001; FR-CAL-005; FR-RES-003; FR-RPT-001; AC-008/015/022

FR-CAL-005 explicitly requires exact inputs, units, unrounded value, display value, assumptions, and every version for each result. The current records retain `displayPrecision` but no `displayValue`. `CalculatedOrigin` is declared and said to be exposed by metric contracts, but no metric record contains it. Simulation outputs have JSON numbers and a manifest but no stable simulation-result IDs, canonical unrounded values, display values/precision, or result-level input/assumption references.

This also breaks report trace closure. `TraceRef.kind` has no `simulation` variant; `MetricId` has no shifted-peak/reduction/total-shift IDs. LOG-RPT-001 says it traces the minimax result and certificate, but CTR-008 cannot represent that trace. Separately, familiar electricity/water comparisons are promised only with versioned source-backed factors, yet no comparison-factor contract, producer, version pin, source references, or test oracle exists.

Required correction:

```text
record DisplayedNumber {
  value: number
  unroundedCanonical: CanonicalDecimal
  displayValue: string
  displayPrecision: integer
  unit
}

CompleteMetric {
  ...
  displayed: DisplayedNumber
  origin: CalculatedOrigin
}

record SimulationMetric {
  id: shifted_combined_peak_mw | peak_reduction_mw | total_shifted_mwh
  displayed: DisplayedNumber
  inputRefs: JsonPointer[]
  assumptions: MessageKey[]
  manifest: ReproducibilityManifest
}

TraceRef.kind += simulation
TraceRef.id = stable simulation metric/certificate ID
```

Add a versioned `ComparisonFactor`/bundle with unit conversion, evidence IDs, version/hash, uncertainty wording, producer/consumer rows, and tests; or remove familiar comparisons from the Gate 2 claims. Tests must assert retained `displayValue`, origin, exact simulation trace closure, and comparison-factor reproducibility—not merely manifest presence.

### R2-004 — Persistence commands cannot construct the required envelope or replay their typed result

**Severity:** Blocking  
**Affected:** architecture `SaveOperation`; CTR-009; LOG-SAVE-001; producer/consumer matrix; FR-LOCALSAVE-002; AC-021

`SavedScenarioEnvelope` requires `savedManifest`, and restore compares every saved-manifest field. Neither create nor update `PersistenceCommand` carries that manifest, and LOG-SAVE-001 does not obtain it from another typed input. Two implementations can therefore write different or missing version context from the same command.

`PersistenceResult<T>.success` requires `value:T`, but `PersistenceOperation` stores only outcome and revision. The prior-operation branch returns “success(reconciled prior outcome)” without a stored value capable of reconstructing the original generic response. For create/update, reading the current scenario is not equivalent: a later committed update may have changed it. The replay contract is consequently impossible for arbitrary `T`.

Required correction:

```text
CreateCommand/UpdateCommand {
  ...
  savedManifest: ReproducibilityManifest
}

record MutationReceipt {
  kind: created | updated | deleted
  scenarioId
  resultingRevision
}

record PersistenceOperation {
  ...
  receipt: MutationReceipt
}

PersistenceResult = success { receipt, operation } | conflict | failure
```

Hash the entire canonical typed command, including `savedManifest`, while excluding only explicitly named transient timestamps. Add contract tests proving an exact prior receipt is returned after a later revision exists.

The producer/consumer matrix also omits real consumers: CTR-001 presets are consumed by CMP-VAL-01, CTR-002 facts/claims/evidence are consumed by CMP-VAL-01, and CTR-008 has an unnamed clipboard adapter with no typed copy success/failure result despite FR-RPT-002. Name those components/contracts and add their contract tests.

### R2-005 — Reordering makes per-statement connective allowlists semantically unsafe

**Severity:** Blocking  
**Affected:** CTR-010; LOG-AI-001; FR-RPT-003; NFR-MNT-002; AC-019

The provider may reorder statements and select `however` or `meanwhile` from an allowlist attached only to the current statement. Whether a contrast or simultaneity connective is valid depends on the actual preceding statement. A token safe in the deterministic order can become misleading after provider reordering, introducing a semantic relationship even though no factual text field exists.

Required correction: either restrict provider-selectable connectives to adjacency-neutral `none`/`additionally`, let the provider choose order while the deterministic composer selects the connective after seeing each actual pair, or contract a pairwise map:

```text
allowedBefore[currentStatementId][previousStatementId] -> ConnectiveToken[]
```

Add adversarial tests that reorder unrelated, supporting, and opposing statements and prove no causal, contrastive, temporal, or certainty relation can be introduced.

### R2-006 — The four-stage workflow and comparison oracle are named but not specified

**Severity:** Blocking  
**Affected:** application state machine; LOG-CMP-001; LOG-UI-001; GOLD-COMPARE-001; FR-CMP-001; FR-RES-001; AC-012

FR-RES-001 requires four coherent stages—Build Scenario, Review Results, Explore Improvements, Impact Brief—and lossless forward/back navigation. The state machine has `Editing`, `Results`, and `Comparing`; Impact Brief is only an event inside Results. It does not specify the four stage identities, back transitions, or which immutable snapshot/draft each transition preserves. The requirement audit cites unnamed “workflow-state integration tests”, so there is no executable test identity for this Must requirement.

`GOLD-COMPARE-001` also cannot be an exact oracle. It omits utilisation, profile/factors, cooling methods/factors, evidence, thresholds, and expected numeric/category deltas. “Lower-water” is not a contract value. Implementations can choose different inputs and still claim the fixture passed.

Required correction:

```text
WorkflowStage = build_scenario | review_results |
                explore_improvements | impact_brief

WorkflowState {
  stage
  activeDraft
  activeSnapshot?
  baselineSnapshot?
  improvedDraft?
  improvedSnapshot?
}
```

Specify every allowed forward/back transition and preservation invariant, then add named `INT-WORKFLOW-*` tests. Freeze the complete comparison scenario, bundle/profile/factor/policy versions, and exact expected input, metric, water, and outcome deltas, or downgrade it from a golden oracle to a non-oracular journey.

## Reconciliation of LR-001 through LR-012

| Prior finding | Status against frozen artifacts | Evidence |
|---|---|---|
| LR-001 | Replaced | The greedy algorithm is gone, exact feasibility is used, and `[100,50,50,75×21]` correctly yields 125 MW. R2-001 is the narrower remaining magnitude/iteration/certificate closure defect. |
| LR-002 | Closed | Southland formulas and the complete 62.4 MWh movement oracle are arithmetically consistent. |
| LR-003 | Replaced | Fossil precedence and most category branches are now explicit. R2-002 isolates the remaining policy-version, economic-rule, fact-category, and assumption/evidence decisions. |
| LR-004 | Replaced | Editable/persisted origin labels are no longer trusted and proposal claims are typed. R2-002 retains only the missing definition of a qualifying fact/evidence mapping. |
| LR-005 | Closed | Pinned-date freshness, calendar clamping, `validUntil`, equality, and stale/unknown exclusion are specified and tested. |
| LR-006 | Replaced | Provider factual text and late-response application are structurally prevented. R2-005 is the remaining adjacency-dependent connective issue. |
| LR-007 | Replaced | Transactional CAS, command hashes, tombstones, epoch compaction, migration, and quarantine close the earlier race model. R2-004 is the narrower unconstructible envelope/replay boundary. |
| LR-008 | Still open, narrowed | Most previously undefined unions now exist. Persistence inputs/results, simulation trace IDs, comparison factors, clipboard result, and several consumers remain undefined as detailed in R2-003/R2-004. |
| LR-009 | Still open, narrowed | Manifests and water provenance improved, but display values, calculated origins, simulation result provenance, and familiar-comparison versions remain incomplete under FR-CAL-005/AC-022. |
| LR-010 | Closed | Geometry topology, named regions, exact border behavior, and no-nearest behavior are now contractible and tested. |
| LR-011 | Still open, narrowed | Literal requirement/AC tables now exist and the minimax oracle is independent; R2-006 captures the unnamed workflow test and non-exact comparison oracle. |
| LR-012 | Closed | Requirement and artifact statuses are aligned with the approved/frozen review-candidate lifecycle. |

## Minimum Gate 2 re-review entry conditions

1. Bound profile magnitudes or derive a search budget that proves the minimax tolerance for every accepted profile; add the realized-peak/certificate equality invariant.
2. Obtain the two material policy decisions in R2-002 and encode the entire assessment/fact-qualification policy in a versioned contract consumed by validation and assessment.
3. Add retained display values, calculated origins, stable simulation results/traces, and versioned comparison factors.
4. Make persistence commands self-sufficient and make exact idempotent receipts replayable; close the consumer/clipboard contracts.
5. Make connective validation safe for the actual reordered adjacency.
6. Specify and test the four workflow stages and freeze a genuinely exact comparison oracle.

The arithmetic and core algorithms are now credible, but six Must-level contract gaps still permit conforming implementations to disagree or prevent an accepted input from satisfying its required behavior. Gate 2 cannot safely authorize implementation from this snapshot.

**Verdict: blocked**
