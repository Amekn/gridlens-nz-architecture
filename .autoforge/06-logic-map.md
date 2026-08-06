# GridLens NZ — Whole-system logic map

**Artifact version:** 0.12 draft
**Status:** Phase 4 design; awaiting independent Gate 3 validation
**Approved baseline:** Requirements 0.5, Usage Definition 0.5, Architecture 0.4 Option A
**Contracts:** `05-contracts.md` version 0.12 draft

**Normative precedence:** the v0.12 reconciliation at the end of this artifact is the effective execution model and retires conflicting v0.4–v0.11 connector, provider, map-selection, registry, cache, and asset-loading logic.

## Global invariants

| ID | Invariant |
|---|---|
| INV-001 | Only normalized, schema-valid data reaches domain operations; UI labels, restored records, URLs, model text, and graph edges never grant trust. |
| INV-002 | Deterministic values, category outcomes, evidence authority/freshness, required statements, and disclaimers are produced only by the analysis/evidence worker. |
| INV-003 | Every result status carries the reproducibility information available at the point of completion/failure; every completed snapshot carries the complete manifest and deterministic fingerprint. |
| INV-004 | Result snapshots are immutable. Editing, refreshing evidence, changing release, or receiving a late response creates a new generation/snapshot and never mutates an old one. |
| INV-005 | Raw credential bytes and key-bearing URLs never cross into UI state, analysis messages, prompts, diagnostics, exports, clipboard, service-worker cache, or production assets. |
| INV-006 | The connector worker sends each request only to the exact configured HTTPS origin/route covered by an unexpired destination-and-content acceptance; a CORS failure never falls back to a GridLens proxy. |
| INV-007 | External content is inert data. Tool/model/source instructions cannot issue commands, add tools beyond the five-entry read-only registry, mutate domain state, or execute/render code. |
| INV-008 | Visuals render only from a validated `VisualOutcomeV2`/`ResolvedVisualModelV2` bound to known trusted data IDs; failure exposes the trusted table/default visual. |
| INV-009 | Map and accessible list use the same feature/selection IDs. Boundary ties use the smallest geography ID; outside points never resolve to nearest. |
| INV-010 | A pack dependency graph activates atomically. Shell, schema, policy, geometry, and pack generations never mix. |
| INV-011 | Freshness is evaluated against the snapshot’s pinned `asOf`; cache hits never change observation, publication, retrieval, or expiry times. |
| INV-012 | Stale, unknown, future-invalid, or forecast-expired evidence remains visible but never satisfies a low-concern prerequisite. |
| INV-013 | Evidence graph reachability and AI candidate edges never elevate authority or verification state. |
| INV-014 | Water without a valid factor returns no numeric estimate; water without current regional thresholds/evidence returns insufficient assessment, never zero/low. |
| INV-015 | Flexibility conserves same-day energy, respects all bounds, and is labelled optimal only with a verified feasibility certificate. |
| INV-016 | Site screening runs only on a user-confirmed profile; it retains one of five domain outcomes, maps it to one of three separate map groups, and orders only within a group, never by hidden score or objective best site. |
| INV-017 | Economic high requires exact current authoritative contradiction. A claim above 10,000 jobs produces a warning/moderate unsupported path, not an invented high threshold. |
| INV-018 | Explicit unrestricted fossil backup may produce high concern traced to the user assumption; restricted/battery/demand-response low/moderate requires qualifying evidence. |
| INV-019 | Web/news discourse is never representative consultation. Mana whenua evidence remains a separate stakeholder category and aggregate. |
| INV-020 | One metric/source/connector/storage-record failure cannot remove unaffected deterministic output or sibling records. |
| INV-021 | Storage mutation plus operation receipt/tombstone commit in one transaction; completed tool replay plus its individual receipt also commits atomically; connector configuration and its vault records clear as one resumable dependency with no orphan path; retrying the same operation ID is idempotent. |
| INV-022 | A tombstoned record cannot be resurrected by an older tab or migration. Corrupt records quarantine individually. |
| INV-023 | Service-worker caches contain immutable app/data assets only, never credentials or remote model/MCP/live responses. |
| INV-024 | Diagnostics accept only `DiagnosticEventV2` and never serialize user/source/provider text or sensitive URLs. |
| INV-025 | EMI load/generation MW is not summed across time; node generation is context and never becomes spare capacity, self-sufficiency, or headroom. |
| INV-026 | Public/decision-maker and People/Planet controls change presentation only; record IDs, values, sources, outcomes, and uncertainty remain identical. |
| INV-027 | Direct public feedback and user document upload have no production route/store in the core release. |
| INV-028 | Exactly one command-family terminal worker event is accepted per operation/generation; cancelled agents use only `agent_terminal(status=cancelled)`, other cancelled commands use only `operation_cancelled`, and obsolete generations cannot update visible state. |

## Runtime state machines

### Application lifecycle

| State | Event | Guard/action | Next |
|---|---|---|---|
| booting | shell loaded | register update manager; fetch release manifest | validating_core |
| validating_core | core valid | activate generation; start workers; load local metadata | ready_online or ready_offline |
| validating_core | candidate invalid, prior cache valid | retain prior generation; record scoped update failure | ready_offline or ready_online |
| validating_core | no valid generation | expose retry/clear-cache diagnostics without guessing | fatal_recoverable |
| ready_* | release available | download/validate separately | update_ready |
| update_ready | user reloads and no active mutation | activate new generation on navigation | booting |
| ready_* | worker crash | preserve snapshots; restart/reindex; increment generation | ready_* or degraded |
| any | unhandled security invariant failure | fail affected operation closed; preserve deterministic record where safe | degraded |

### Analysis operation slot

```text
idle --ANALYSE(g=n+1)--> validating
validating --blocking issues--> rejected
validating --valid--> calculating --> selecting_evidence --> assessing --> freezing
freezing --snapshot valid--> completed
any running --CANCEL/superseded/deadline--> cancelling --> cancelled
any running --typed module failure--> partial_or_failed
terminal --ANALYSE(g=n+1)--> validating
```

Only the latest generation for the scenario/result slot can become active. Partial metric/category failures remain inside a valid snapshot when trace construction succeeds; a manifest/fingerprint/invariant failure rejects the entire snapshot.

### Pack state

```text
unloaded -> fetching -> bytes_validated -> dependencies_validated -> indexed -> active
fetching|validating|indexing -> failed
active -> retired only after a newer complete release activates
```

An optional pack failure does not deactivate other packs. A core pack failure prevents candidate generation activation.

### Connector state

```text
unconfigured -> configured_unverified -> testing -> ready | degraded | incompatible
ready -> in_use -> ready
ready|degraded -> credential_locked | authentication_rejected
any configured -> clearing -> unconfigured
config/origin/model/header change -> configured_unverified
capability age >24h -> configured_unverified
```

Only a successful ordinary authenticated use enables default persistent credential commit. Capability probes alone do not persist a new key.

### Agent request state

```text
idle -> disclosure_required -> queued -> model_running
model_running <-> tool_running (bounded)
model_running|tool_running -> validating_result -> complete | partial | failed
queued|running -> cancelling -> cancelled
any response from obsolete generation -> discarded_obsolete
```

### Local repository record

```text
absent --create(op)--> live(rev=1)
live(rev=n) --replace(expected=n, op)--> live(rev=n+1)
live(rev=n) --delete(expected=n, op)--> tombstone(rev=n+1)
tombstone --old replace/delete--> conflict
valid old schema --migrate transaction--> valid current schema
invalid/unsupported --quarantine transaction--> quarantined + original excluded
same op at any post-commit state --> replay original receipt
```

### Offline update generation

```text
idle -> checking -> downloading -> validating -> ready
checking|downloading|validating -> failed (active generation unchanged)
ready --explicit reload--> activating -> active
active old generation -> retired -> delete only when no controlled client uses it
```

## LOG-BOOT-001 — Start and activate a release

```text
function boot(): BootOutcome
  candidateManifest = fetchNoStore("/data/release-manifest.json")
  if fetch failed:
    return activateLastValidatedCacheOrRecovery(failure)

  if not validateReleaseManifest(candidateManifest):
    return activateLastValidatedCacheOrRecovery(PACK_MANIFEST_INVALID)

  coreGraph = resolveDependencyGraph(candidateManifest.corePackIds)
  for each asset in coreGraph in topological order:
    bytes = fetchSameOrigin(asset.relativeUrl)
    require byteLength <= descriptor.byteLengthBudget
    require sha256(bytes) == descriptor.sha256
    parsed = schemaValidate(bytes, expected schema major)
    require crossReferencesResolveWithinGraph(parsed)
  require geometry/list/catalog IDs reconcile
  require policy/factor/profile/evidence references reconcile

  build read-only indexes in analysis worker
  start connector worker without loading any credential
  activate cache generation candidateManifest.releaseId atomically
  restore local metadata and validate each record independently
  emit BOOT_READY(releaseId, onlineState, quarantinedCount)
```

Preconditions: same-origin shell and supported browser. Postconditions: exactly one complete validated release generation is active or the app is in explicit recovery. Complexity is `O(total core bytes + references)` under release budgets.

## LOG-PACK-001 — Load an optional regional/case/layer pack

```text
function loadPack(packId, generation, signal): PackOutcome
  reject if packId not declared by active release
  return existing active index if already loaded for same release
  deduplicate concurrent loads by (releaseId, packId)
  fetch, size-check, hash, parse, and schema-check
  resolve only dependencies declared in active release
  validate all source/licence/coverage records and stable IDs
  build temporary indexes off to the side
  if signal cancelled or generation obsolete: discard temporary indexes
  else atomically publish indexes and PACK_READY
```

At most four optional pack fetches and one index build run concurrently. The loader applies backpressure rather than allowing viewport changes to create an unbounded queue.

## LOG-GEO-001 — Resolve geography deterministically

```text
function resolvePoint(pointWgs84, geometrySet): LocationSelection
  require finite longitude [-180,180] and latitude [-90,90]
  matches = geometrySet.polygons where bboxContains(point) and pointInPolygonInclusive(point)
  if matches empty:
    return { point, resolution: outside_recognized_geometry, candidateOnly: true }
  chosen = sort(matches by geographyId ascending)[0]
  resolution = matches.length > 1 ? boundary_tie : inside
  return { geographyId: chosen.id, point, method, resolution,
           candidateOnly: true, geometrySetId }
```

`pointInPolygonInclusive` uses one frozen robust algorithm/tolerance and handles holes. Test fixtures include vertices, edges, antimeridian-irrelevant NZ bounds, Chatham, and outside points. The list path sets the same `geographyId` without fabricating a point.

The UI never calls `resolvePoint` directly. It sends `resolve_location` through the coordinator to the analysis worker. Coordinate-entry text is parsed and range-validated there; map/list inputs are revalidated against the pinned geometry-set hash. The worker returns `LocationResolutionOutcomeV2`, including every boundary candidate ID and the lexicographically selected result.

## LOG-MAP-001 — Search, filter, render, and select

```text
function queryMap(query, viewport, enabledLayerIds, generation): MapViewModel
  validate query length <= 200 and layer IDs belong to active release
  projectMatches = normalized token/prefix search over catalog name/aliases
  placeMatches = normalized local place index search
  for each enabled layer:
    if descriptor disabled/missing: emit qualified disabled state
    else query worker spatial index by viewport and feature budget
  cluster or summarize when returned feature count exceeds render budget
  return features and accessibleRows referencing identical stable IDs,
         layer provenance/coverage, legend semantics, and result counts

onSelect(featureId):
  resolve catalog/feature record by ID
  update one selection object consumed by both map and list
  open project sheet; never infer suitability from marker/layer proximity
```

Map WebGL failure swaps to accessible rows/region summaries without changing selection or evidence state.

## LOG-CASE-001 — Build a trusted Project Case File

```text
function buildCaseView(projectId, audience, lens, evidenceSnapshot): CaseView
  case = requireValidatedProjectCase(projectId)
  records = evidenceGraph.records(case.evidenceIds)
  events = sort(case.events by known date, precision, stable ID)
  conflicts = retain all unresolved/precedence records
  community = group controlled records; keep mana_whenua group distinct
  counts = recompute current/stale/claim/missing-conflict/ai counts
  require counts == case declared counts or mark pack invalid
  sections = trustedComponentRegistry.compose(case, audience, lens)
  for missing section: insert explicit missing panel and questions
  return sections with stable record/source/page IDs and identical underlying data
```

No document extract becomes an instruction. An extracted claim opens its document/page/section or documented fallback. Public/decision-maker and lens filtering hides density, not contradictory or missing evidence.

## LOG-VAL-001 — Normalize a scenario and issue origin proofs

```text
function normalizeScenario(draft, activeUiAction, preset?, preparedEvidence?): ValidationOutcome
  schema-check draft shape and bounded strings
  parse decimals using locale-independent decimal grammar
  emit blocking issues for nonfinite/syntax/hard ranges/incompatible combinations
  emit warnings for capacity>1000, PUE>3, jobs>10000, investment>1e11
  preserve custom/unknown controlled values; do not map to favourable defaults

  for each field:
    if value came from current user edit: issue user_assumption proof
    else if selected current release preset: issue versioned_preset proof with pack ID
    else if explicitly imported from proposal claim: issue proposal_claim proof with evidence ID
    else if exact qualifying prepared evidence reference: issue verified_evidence proof
    else reject claimed origin and issue untrusted_origin warning/block as applicable

  discard all origin labels embedded in draft/restored records
  return normalized immutable scenario + proofs + warnings
```

Precondition: active release. Postcondition: every material field has one engine-issued proof. Normalization is pure for the supplied active action/references.

## LOG-CAL-001 — Calculate scenario metrics

```text
function calculate(normalized, factorSet, asOf): CalculationBundle
  facility = exact(normalized.itCapacityMw * normalized.pue)
  annualGwh = exact(facility * normalized.utilisationRatio * 8760 / 1000)
  flexibleMw = exact(facility * normalized.flexibleWorkloadRatio)

  if cooling unknown/custom without approved mapping:
    water = insufficient(MISSING_COOLING_FACTOR)
  else factor = select one applicable versioned factor for cooling/asOf
    if none or ambiguous or missing evidence: water = insufficient
    else:
      energyKwh = facility * 1000 * utilisation * 8760
      minM3 = energyKwh * factor.minLPerKwh / 1000
      maxM3 = energyKwh * factor.maxLPerKwh / 1000
      peakDayEnergyKwh = facility * 1000 * 24
      minPeakDayM3 = peakDayEnergyKwh * factor.minLPerKwh / 1000
      maxPeakDayM3 = peakDayEnergyKwh * factor.maxLPerKwh / 1000
      require 0 <= minM3 <= maxM3 and 0 <= minPeakDayM3 <= maxPeakDayM3
      water = complete(annual, average-day, and peak-day ranges,
                       trace using both conservative maxima for assessment)

  return independently typed metrics with exact traces and display rounding metadata
```

Worked Southland fixture:

```text
IT=50 MW, PUE=1.3, utilisation=0.8, flexibility=0.3
facility = 50×1.3 = 65 MW
annual = 65×0.8×8760÷1000 = 455.52 GWh
flexible upper bound = 65×0.3 = 19.5 MW
```

Display rounding never feeds later calculations. Complexity is constant.

## LOG-FLX-001 — Build and solve the 24-hour minimax simulation

### Build inputs

```text
function buildFlexInput(scenario, calculations, profile, policy): FlexibilityInput
  require facility/flexible metrics complete and profile has 24 valid slots
  B[h] = facilityDemandMw * utilisationRatio for every h
  C[h] = regionalLoadMw[h] + B[h]
  P0 = max(C)
  sourceHours = first policy.peakHourCount hours sorted by
                (regionalLoad desc, hour index asc)
  eligiblePerSourceMwh = min(maximumFlexibleLoadMw, B[h]) * slot.durationHours
  movableEnergy[h] = eligiblePerSourceMwh if h in sourceHours else 0
  destinationLimitMw[h] = facilityDemandMw * policy.maximumDestinationUtilisationRatio
  destinationHeadroomMw[h] = max(0, P0 - C[h])
  return validated input; source hours are not destinations in version 1
```

### Feasibility predicate

```text
function feasibleAtPeak(T, input): Feasibility
  require T <= P0 and T >= 0
  requiredRemoval[s] = max(0, C[s] - T) * duration[s] for each source
  if any requiredRemoval[s] > movableEnergy[s] + EPS: return false

  destinationCapacity[d] = max(0, min(
      input.destinationHeadroomMw[d],
      input.destinationUtilisationLimitMw[d] - B[d],
      P0 - C[d],
      T - C[d]
    )) * duration[d]
  return sum(requiredRemoval) <= sum(destinationCapacity) + EPS
```

Because each source can move to every non-source destination and all work is fungible within the same day, aggregate capacity plus each source bound is sufficient. `feasibleAtPeak(T)` is monotone.

### Optimize and construct a deterministic ledger

```text
function simulateFlexibility(input, operation): FlexibilityResult
  validate all arrays, durations, limits, and P0
  if maximumFlexibleLoadMw == 0 or movable total == 0:
    return complete(identity result, exact certificate)

  analyticalLower = max(
    max over sources of C[s] - movableEnergy[s]/duration[s],
    max over destinations of C[d],
    totalCombinedEnergyMwh / sum(slot durations)
  )
  low = analyticalLower
  high = P0 // always feasible with required removal zero
  lastInfeasible = null
  repeat up to policy.maximumFeasibilityIterations:
    check cancellation/deadline
    if high-low <= EPS: break
    mid = exact((low+high)/2)
    if feasibleAtPeak(mid): high=mid else: low=mid; lastInfeasible=mid
  T = high
  require feasibleAtPeak(T)

  sourceRemoval = requiredRemovalAt(T)
  destinationCapacity = capacityAt(T)
  // secondary objective: shift as much eligible energy as possible without raising T
  extra = min(sum(movable-sourceRemoval), sum(destinationCapacity)-sum(sourceRemoval))
  add extra to sourceRemoval by source hour ascending within movable bounds

  remainingBySource = sourceRemoval
  remainingByDestination = destinationCapacity
  movements=[]
  for source ascending:
    for destination ascending:
      moved=min(remainingBySource[source], remainingByDestination[destination])
      if moved>0: append movement; decrement both

  reconstruct shifted facility/combined arrays from ledger
  certificate={lowerBound:lastInfeasible or analyticalLower, upperBound:T,
               iterations, toleranceMw:EPS}
  independently verify every invariant and lower-bound infeasibility
  if any check fails: return failed(CAL_FLEX_INVARIANT)
  return complete result
```

Required independent checks:

- source removal and destination additions match ledger;
- daily facility energy conserved within exact decimal tolerance;
- no negative load and no source exceeds movable energy;
- no destination exceeds headroom, utilisation limit, original peak, or `T`;
- achieved maximum equals reconstructed series maximum;
- `feasibleAtPeak(T)` true and last lower probe false unless lower bound is within EPS;
- stable ordering and canonical result independent of map/object iteration order.

Frozen counterexample:

```text
regional=[100,50,50,75×21], facilityDemand=100, utilisation=.5,
flexibility=1, peakHourCount=1, maximumDestinationUtilisation=1
B=50, P0=150, source=[0], movable=50 MWh
non-source hours 3..23 create a 125 MW floor
at T=125, hours 1 and 2 each accept 25 MWh
ledger=[0→1:25, 0→2:25], achieved peak=125 MW, shifted=50 MWh
```

Complexity is `O(H log((P0-low)/EPS) + H²)` with `H=24`, at most 80 feasibility iterations and 576 ledger pairs.

## LOG-EVD-001 — Evaluate freshness and coverage

```text
function freshness(evidence, asOf, policy): FreshnessEvaluation
  basis = evidence.observationEnd ?? evidence.publicationAt
  if basis absent: return unknown
  if basis > asOf and not forecastValidityCovers(evidence, asOf): return future_invalid
  if evidence.validUntil exists:
    expiry = evidence.validUntil
  else:
    months = category in {cooling, planning, legislation, environment} ? 36 : 24
    expiry = addCalendarMonthsUtcClamped(basis, months)
  return asOf <= expiry ? current : stale // exact boundary inclusive

function coverage(category, geography, expected, evidence, sourceFailures, asOf): CoverageRecord
  relevant = evidence matching exact category and geography, or explicit national fallback
  classify freshness for each
  missing = expected fields/sources not represented
  if sourceFailures and no usable records: failed
  else if relevant empty: missing
  else if all relevant stale/unknown/future: stale
  else if missing nonempty or only national fallback: partial
  else complete
  return record with all contributing/missing/stale/failed IDs
```

National fallback remains `national context`, cannot satisfy regional evidence gates, and lowers coverage. Material conflicts retain both evidence definitions/times/geographies unless an exact field-level registry precedence rule applies.

## LOG-EVD-002 — Query evidence graph and discrepancies

```text
function queryEvidence(seedIds, edgeTypes, filters): EvidenceSubgraph
  validate every seed/filter and cap seeds<=50, depth<=2, records<=1000
  traverse accepted prepared/manual edges only for trusted view
  optionally include candidate AI edges in a separate labelled collection
  load records by stable ID; do not infer authority from path
  detect claim contradictions only from explicit contradiction edges/field comparator rules
  retain superseded record and link; never overwrite history
  sort by requested stable rule then ID
```

Community queries group by stance/theme/stakeholder/evidence quality, not demographics. Representative percentages are emitted only when a current qualifying methodology record declares sampling/population/measure; otherwise the output is counts of sources/records with non-representative warning.

## LOG-ASM-001 — Apply the five assessment policies

```text
function assessElectricity(snapshotInputs): AssessmentResult
  require simulation complete, regionalPeak>0,
          current qualifying regional demand evidence,
          current qualifying grid evidence
  else insufficient
  addedRatio = max(0, achievedCombinedPeak-regionalPeak)/regionalPeak
  if addedRatio <= .05: low
  else if addedRatio <= .15: moderate
  else high

function assessWater(water, annualThreshold, peakDayThreshold, evidence): AssessmentResult
  require water complete and valid current regional threshold records
          for annual and peak-day measures, both backed by current qualifying water evidence
  else insufficient
  annualBand = bandInclusive(water.maximumM3PerYear, annualThreshold bands)
  peakBand = bandInclusive(water.maximumM3PerPeakDay, peakDayThreshold bands)
  return worse(annualBand, peakBand)

function assessResilience(scenario, evidence): AssessmentResult
  if backup in {diesel,gas,mixed} and restriction == unrestricted:
    return high traced to explicit user/proposal assumption
  if backup in {diesel,gas,mixed}:
    if current qualifying evidence verifies emergency/time restriction: moderate
    else insufficient
  else if backup==battery or demandResponse enabled:
    if current qualifying evidence verifies capacity>0, duration>0, commitment: low
    else insufficient
  else insufficient

function assessEconomic(scenario, evidence): AssessmentResult
  claims = positive permanent jobs and positive investment claims
  if none: insufficient
  if current qualifying authoritative fact of exact claim kind/basis contradicts value: high
  if every material claim has verified-evidence origin and exact current independent basis,
     and job evidence includes role detail: low
  else:
    reasons include unsupported/proposal/user/stale/unknown basis
    if permanentJobs>10000 add suspicion warning reason
    moderate

function assessCommunity(projectOrRegion, evidence): AssessmentResult
  representative = current qualifying representative consultation/survey records
  if none: insufficient
  if any qualifying record declares high/material opposition/concern: high
  if any declares moderate/conditional/material unresolved concern: moderate
  if records explicitly support low concern under qualifying method: low
  else insufficient

function overall(categoryResults): OverallNarrative
  if any high: substantial_issues
  else if any failed or insufficient: evidence_incomplete
  else if any moderate: potentially_suitable_with_conditions
  else lower_concern_review_required
```

Every result has nonempty reason IDs, decisive inputs, qualifying/contextual evidence, policy version, conflicts and missing items. Trace construction failure makes the category failed; overall becomes evidence incomplete. No score is calculated.

Boundary table:

| Added electricity ratio | Current qualifying demand/grid | Outcome |
|---:|---|---|
| exactly 5% | yes | low |
| greater than 5%, exactly 15% | yes | moderate |
| greater than 15% | yes | high |
| any | missing/stale/unknown | insufficient evidence |

## LOG-SNAP-001 — Freeze an analysis snapshot

```text
function analyse(draft, generation, activeRelease, selectedPacks): AnalysisOutcome
  validate generation and core/selected packs
  asOf = readClockOnceAsUtcInstant()
  normalized = normalizeScenario(draft, active action/references)
  if blocking issues: return rejected without snapshot
  calculations = calculate(normalized, factorSet, asOf)
  flexibility = simulate or typed insufficient/failed when profile unavailable/incompatible
  evidenceSnapshot = select exact records/coverage/conflicts and evaluate freshness at asOf
  assessments = assess independently
  overall = deterministic precedence
  statements = buildTrustedStatements(normalized, calculations, evidence, assessments)
  manifest = close over every app/algorithm/policy/pack/hash/source/profile/factor/threshold ID
  canonicalDomain = canonicalJson(excluding createdAt/correlationId, preserving ordered series)
  fingerprint = sha256(canonicalDomain)
  snapshotId = "snap_" + fingerprint prefix
  require manifest closure and all referenced IDs resolve
  return deepFrozen ResultSnapshot
```

Canonical JSON sorts unordered maps/ID sets, preserves ordered arrays, and normalizes decimals/instants. Repeating the same normalized input, `asOf`, and constituent versions yields the same fingerprint and domain record.

## LOG-CMP-001 — Compare immutable snapshots

```text
function compare(snapshotIds, criterionIds): ComparisonResult
  require 2..6 distinct valid snapshots
  validate criterion IDs and compatible units; never coerce unknown units
  compute exact metric deltas from unrounded values
  diff normalized scenario paths excluding IDs/timestamps
  diff category outcome/reasons, coverage, conflicts, and evidence IDs
  mark version/asOf differences explicitly
  return immutable comparison; never mutate baseline or rank as best
```

## LOG-SITE-001 — Parse, confirm, screen, and order candidates

```text
function acceptParsedProfile(agentPayload): RequirementProfileDraft
  schema-check allowed fields/operators/units; cap criteria<=20
  reject model-added hidden fields, weights, scores, or unknown layers
  mark every criterion source=parsed_by_ai and state=proposed

function confirmProfile(draft, userEdits): ConfirmedRequirementProfile
  apply only explicit current-user edits
  require acknowledgement of every hard constraint and priority order
  assign revision and confirmedAt; freeze profile

function screen(profile, candidates, evidence): CandidateScreening[]
  reject unless profile.confirmationState=confirmed
  for candidate by stable ID:
    findings = evaluate each criterion deterministically against typed values/evidence
    if any hard not_satisfied: excluded
    else if any criterion missingPolicy specialist_review and state missing/partial: specialist_review
    else if any criterion missingPolicy infrastructure_required and state missing/partial: infrastructure_required
    else if any required state missing: insufficient_evidence
    else included
    record every observed value, evidence ID, and reason
  if ordering enabled:
    group by displayed classification order
    compare displayed ordinal finding at each confirmed priority position
    stable candidate ID breaks full tie
  return records plus sensitivity notes from one-criterion-at-a-time perturbations
```

The UI calls this “ordered by your confirmed priorities,” never “best.” Changing a priority produces a reproducible new profile revision and order.

## LOG-CONN-001 — Configure, capability-test, persist, and clear a connector

```text
function normalizeConnectorDraft(draft): ConnectorConfig
  parse URL; require HTTPS, no fragment/userinfo, bounded path/header values
  normalize origin using URL parser, not string prefix
  reject secret-looking non-secret headers and unsupported methods
  if key query mode: move complete sensitive URL into vault-only input;
                     config retains sanitized origin/path template
  assign new connector ID; never log raw draft

function capabilityTest(config, transientCredential, signal): CapabilityMatrix
  enforce exact origin and 15s probe deadline
  probe real CORS with required method/headers
  test authentication and selected model using minimal bounded request
  test requested/auto Responses then Chat dialect without assuming either
  independently test streaming, structured output, function tools,
                     and remote MCP only when requested/applicable
  sanitize provider errors to status class/capability reason
  never persist credential solely because tests pass

function ordinaryUseSucceeded(connectorId, credential, persistenceMode): void
  update lastSuccessfulUseAt
  if persistent_device:
    persist credential in vault transaction after encryption/fallback disclosure
  else hold only in connector-worker memory

function clearConnector(connectorId): ClearReceipt
  cancel active requests for connector
  transactionally tombstone credential and config as selected
  zero/drop worker references best-effort
  broadcast sanitized cleared event
```

The vault first probes persistent structured-clone support for a non-extractable AES-GCM CryptoKey. If supported, it encrypts with unique random 96-bit IV and authenticated metadata binding connector ID/schema. If unsupported, default persistence requires the explicit browser-local-not-keychain disclosure and stores through the isolated credential adapter; session-only remains available. Encryption never supports UI read-back and is not claimed to resist same-origin compromise.

## LOG-AGENT-001 — Execute a bounded cited agent request

```text
function runAgent(request, signal): AgentResult
  validate request/schema/limits/generation
  require connector ready and request disclosure acceptance valid for exact destination,
          request/generation and context categories
  context = analysisWorker.projectSelectedContext(request.context IDs)
  require bytes(context)<=256KiB and fingerprint matches manifest
  assert context excludes unrelated saved records and all credential fields

  messages = trusted instructions + deterministic context + user prompt
  toolBudget=6; attempts=0; citationsByUrl={}; claims=[]
  while attempts<2 and wallTime<120s:
    response = direct model call through selected tested dialect; no-store; cancellable
    for each streamed event: validate size/type/generation before exposing safe progress
    if response requests tools:
      for call in at most 2 concurrent calls:
        require toolBudget>0, allowlisted read-only operation, schema-valid bounded args
        reject source/prompt requests to add/discover/write/communicate/purchase
        result = direct CORS adapter or provider-side remote MCP route
        sanitize, cap, type and capture source URLs/retrieval time
        append as external untrusted tool data; toolBudget--
      continue model loop
    candidate = parse mode-specific structured output
    validation = validate claims/citations/structured payload against tool/context records
    if valid: return complete or partial with typed citations
    if retryable format/citation repair and attempts==0: attempts++; request correction
    else return partial/failed
  return timeout/cancel/limit typed outcome
```

Citation validation requires every external factual claim to cite a URL/evidence ID present in context/tool results; source statements, inference, uncertainty, conflict, and unsupported are distinct. A late stream event is discarded. Chat-only endpoints can explain provided deterministic context but research/visual/site functions are disabled when their capabilities are absent.

## LOG-VIS-001 — Resolve and render an AI visual safely

```text
function resolveVisual(specBytes, request, dataRegistry): VisualOutcome
  require bytes<=128KiB and strict schema with no unknown fields
  reject any HTML/script/style/expression/event/arbitrary URL/raw data property
  require primitive and every dataset/field/filter/evidence ID exist and are authorized
  estimate resolved rows/points/series/annotations before materializing; enforce limits
  apply only allowlisted filter/group/sort/aggregate operations in analysis worker
  create trusted scalar arrays, table, source IDs, provenance and deterministic summary IDs
  validate resolved model again at main-thread boundary
  render via trusted component; always render equivalent table/text
```

Map overlays are bounded view models passed to CMP-MAP-01; the model never emits MapLibre style expressions or tile URLs. Invalid specs display reason and the trusted raw table/default visual.

## LOG-RPT-001 — Compose and copy the impact brief

```text
function composeBrief(snapshotOrComparison, audience, lens, aiAppendix?): ImpactBriefV2
  select trusted statement IDs required for overview, calculations, assessments,
         evidence, assumptions, conflicts, coverage, missing questions, limitations
  for ResultSnapshotV2 require its OverallAssessmentV2 statement, five category
    StatementIds, reasonIds and decisive-input references to resolve exactly
  bind exact values/units/outcomes/source labels through deterministic templates
  include mandatory indicative-use/professional-review disclaimer
  include AI appendix only when claim/citation records validate and label it AI-generated
  build Markdown/text from trusted nodes; never concatenate provider HTML
  verify all referenced statements/evidence resolve and required sections nonempty
  return brief

function copyBrief(brief): ImpactBriefCopyOutcomeV2
  attempt Clipboard API with plain text/Markdown only
  if denied/unavailable: expose same content in selectable focused region with guidance
```

## LOG-SAVE-001 — Transactional storage, concurrency, migration, and quarantine

```text
function mutate(operation): StorageOutcome
  validate operation before transaction
  begin readwrite transaction on target store + receipts
  if receipt exists for operationId: return replayed receipt/result
  current = get record/tombstone
  apply create/replace/delete guards and expected revision
  on conflict: write no record; return conflict
  next = canonical envelope with revision/current timestamps/checksum
  write next and immutable operation receipt in same transaction
  commit; broadcast only storeKind/recordId/revision/operationId
  if completion ambiguous: caller retries same operationId

function restoreAll(store): RestoreOutcome
  open supported IndexedDB version using versionchange protocol
  for each record independently:
    verify envelope/checksum/schema/store kind
    run sequential pure migrations in one transaction
    validate post-migration trusted references against active release
    if invalid: transactionally copy sanitized metadata to quarantine and exclude original
  report restored/quarantined/version-drift counts without content
```

Same-record conflict is surfaced; independent record writes coexist. Clear-one-store enumerates exact count in a transaction and writes a clear receipt. Clear-all requires explicit confirmation, runs stores in a declared order, and reports partial failure without claiming complete removal. Credential clear uses the vault adapter and never exposes values.

## LOG-OFF-001 — Cache, update, rollback, and removal

```text
serviceWorker.install(candidateRelease):
  create generation-specific temporary cache
  fetch/hash/store declared shell+core assets only
  if any fail: delete temporary cache; keep current worker/cache
  mark generation validated; do not skipWaiting over active result

shell.onUpdateReady:
  show release/data version and reload action
  on explicit reload: allow waiting worker activation; new boot validates generation

serviceWorker.fetch(request):
  if request is model/MCP/live, cross-origin, authorization-bearing, or no-store:
    bypass cache unchanged
  if immutable same-origin declared asset: serve exact active generation/cache
  otherwise use normal network without inventing cache entry

cleanup:
  delete retired cache only when no controlled client declares it active
```

Rollback republishes/reactivates a prior complete immutable Sites release. Unpublish does not clear IndexedDB/cache; the product exposes local clear instructions before removal.

## LOG-PIPE-001 — Compile registered public data safely

```text
function compileRelease(sourceRegistry, pinnedAsOf): CompilerOutcome
  validate every enabled source licence/purpose/access/adapter/schema contract
  fetch with bounded concurrency, rate policy and retries; never use undocumented report DOM
  store raw receipt: URL, retrieval, ETag/last-modified, bytes, SHA-256, coverage
  parse into typed staging rows; reject schema drift or incompatible units
  transform with versioned deterministic adapters and exclusion ledgers
  build geometry/catalog/region/electricity/policy/project/document packs
  validate IDs, edges, page locators, source links, coverage, attribution, sizes and dependencies
  produce one strict DataPackManifestV2 per pack with exact asset hashes,
    dependencies and source/licence/attribution/purpose/coverage bindings;
    bind all manifests into ReleaseManifestV2 and release reports
  run golden/domain/data contract tests against candidate packs
  publish nothing if core validation or required demo acceptance fails
```

No user connector credential or local `TEST.md` value is read by this pipeline. Raw bulk files and unlicensed document bodies stay outside `public/`.

## LOG-EMI-001 — Select, join, transform, and aggregate EMI data

```text
function selectRollingWindow(blobListing, cutoffLocalDate): Window
  for endExclusive from latest complete local day +1 descending:
    startInclusive = endExclusive minus 12 calendar months
    expectedDates = every Pacific/Auckland local date in [start,end)
    if exactly one accepted daily dispatch file exists for every date:
      return window and chosen source revisions
  fail if no window meets declared search horizon

function compileEmi(window, nspSnapshot, statsGeometry): EmiOutput
  validate raw file schemas/receipts and one declared compatible NSP snapshot
  nspByPoc = unique exact normalized POC mapping; ambiguous codes excluded
  for each dispatch row in deterministic file/instant/POC/unit order:
    exclude dead/disconnected/invalid value or unit
    resolve documented run/revision precedence; ambiguous duplicates excluded
    nsp = exact nspByPoc[row.POC] else unmatched exclusion
    require valid EPSG:2193 coordinate; transform with pinned transform version
    geography = pointInPolygon using LOG-GEO-001 rule else exclusion
    preserve NSP network region/zone as separate fields
    normalize UTC instant and derive Pacific/Auckland local day/offset
    accumulate interval load/generation/price context by geography with exact units

  for each local day and source interval length:
    expected = timezone-derived day minutes / intervalMinutes
    // examples: 46/48/50 half-hour; 276/288/300 five-minute
    record observed/expected and short/ordinary/long/irregular class
  compute coverage and exclusion ledger; reject below Gate-3 quality thresholds
  emit compact intervals/summary/evidence/receipt packs with prohibition flags:
       no_spare_capacity, no_self_sufficiency, no_transmission_headroom
```

For price aggregation, the pack labels the exact statistic (for example load-weighted mean only when denominator is valid); no unlabeled averaging occurs. MW values are instantaneous/interval-average power. Any energy derivative is `MW × intervalHours`, never a raw MW sum.

## LOG-DOC-001 — Prepare the deep Project Case File

```text
function compileProjectDocuments(registeredDocuments, project): ProjectCasePack
  require public/licensed source, stable URL, receipt, content hash and media type
  extract text/page boundaries with versioned deterministic tool
  retain document/page/section locator for every extracted candidate statement
  classify statement as proposal claim/official document/etc from source registry,
           never from the statement’s self-description
  run deterministic/entity/date/unit parsers; AI may propose candidates offline only
  require curator/release validation before candidate edge becomes accepted
  build timeline; retain conflicting dates as separate events + conflict record
  build community records using controlled stance/theme/stakeholder/quality taxonomy
  keep mana whenua distinct and record missing voices/method limits
  require every fixed Case File section, inserting explicit missing state/questions
  emit strict ProjectCatalogRecordV2, EvidenceGraphSnapshotV2, CommunityRecordV2 and
    ProjectCaseV2 assets under DataPackManifestV2 plus extraction coverage report
```

Document instructions are ignored as content. The prepared release must open sources/page locators or provide a documented fallback. Runtime user uploads remain unimplemented.

## LOG-UI-001 — Trusted accessible presentation

- Every map selection/action has a keyboard-operable list equivalent sharing IDs and state.
- Marker status, coverage, concern, staleness, and selection never rely on colour alone.
- Charts always expose a table and deterministic text summary with the same units/source IDs.
- Focus moves predictably to sheets/dialogs/errors; Escape/close restores the invoking control.
- Live worker/model progress uses polite status regions; critical validation uses associated field messages, not toasts alone.
- 200–400% zoom reflows without two-dimensional scrolling except intrinsically tabular/map regions with alternatives.
- Reduced-motion preference disables nonessential animation. Touch targets and drag alternatives meet the approved accessibility target.
- Audience/lens switches select different trusted statement/layout views only; a development invariant compares underlying IDs before/after.

## LOG-OBS-001 — Emit privacy-preserving diagnostics

```text
function diagnostic(candidate): void
  construct new DiagnosticEventV2 from explicit allowlisted enums/scalars only
  never spread error/provider/request/source objects
  bucket durations; cap counts; validate strict schema with no unknown fields
  scan serialized event for seeded-secret canaries during tests
  append to bounded in-memory ring (max 500); no telemetry or persistence in core
```

Provider messages are mapped to safe status classes. Local export contains only validated events and release/version summary.

## Concurrency, cancellation, and backpressure

- Coordinator owns one monotonic generation per mutable UI slot: map query, analysis, case load, agent request, visual, connector test, update.
- Worker tasks include operation ID, generation, deadline, and cancellation token. Progress is throttled to at most 10 events/second/operation.
- Analysis worker serializes pack activation and IndexedDB migration; pure calculations may run after active indexes are stable.
- Connector worker permits one active model stream per conversation/request slot, two concurrent research calls, and six total tool calls. Replacing a slot dispatches an exact targeted cancel command; independent tasks remain untouched.
- Pack loader permits four network fetches and one CPU index build. Map viewport requests coalesce to the newest pending viewport.
- Storage transactions are short and contain no network/worker wait. BroadcastChannel signals invalidation only; receivers reread/validate authoritative IndexedDB state.
- Shutdown cancels network work, lets active storage transaction settle, and never writes half a stream/result.

## Security boundaries and forbidden states

1. Main thread cannot call arbitrary connectors directly; production imports expose only the typed connector-worker client.
2. Analysis worker has no vault/network adapter and rejects credential-like fields at its message schema.
3. Connector worker cannot open result/storage stores other than its config/vault/research-cache adapters.
4. UI rendering uses text nodes/trusted component props; no `dangerouslySetInnerHTML`, script URL, model CSS, eval, Function, or dynamic code import from external content.
5. URL parser accepts safe HTTPS citation/source URLs; credentials/userinfo/fragments and unsafe protocols are rejected. Key-query MCP configuration is vault-only.
6. CSP self-hosts scripts/workers and denies inline/eval/object/frame/base violations. Broad custom HTTPS connection permission is compensated by the exact connector registry and no third-party runtime scripts.
7. Package scan rejects `TEST.md`, `.env*`, exact secret canaries, raw source credentials, absolute developer paths, source maps unless intentionally approved, and unexpected executables.
8. Forbidden domain outputs include overall score, approved/rejected consent, objective best site, household bill prediction, representative web sentiment, capacity/headroom from proximity/generation, and low concern from missing evidence.

## Resource ceilings

| Resource | Version-1 limit | Failure behavior |
|---|---:|---|
| Core compressed app + data assets | 12 MiB target, 20 MiB hard | Release build fails over hard limit. |
| Optional pack | 8 MiB compressed, 32 MiB parsed | Pack disabled/compile fails. |
| National map rendered features | 20,000 after filtering; 5,000 generated points | Cluster/summarize or reject visual. |
| Evidence graph per case | 5,000 records, 10,000 edges | Compiler fails deep case pack. |
| Graph query | 50 seeds, depth 2, 1,000 records | Return bounded partial with limit reason. |
| Scenario comparison | 2–6 snapshots | Validation failure. |
| Site criteria/candidates | 20 criteria, 500 prepared candidates | Validation/partial, never silent truncation. |
| Agent context/response | 256 KiB / 1 MiB | Reject/partial. |
| Agent execution | 120 s, 2 model attempts, 6 tools, 2 concurrent | Cancel/partial/limit. |
| Visual | 128 KiB spec, 8 series, 2,000 rows, 5,000 points | Fail closed to trusted table/default. |
| Diagnostics | 500 events, 7-day optional retention | Oldest-first deletion. |
| Flexibility | exactly 24 slots, 80 search iterations | Typed failure; no approximate fallback. |

## Worked boundary examples

### Freshness

For evidence basis `2024-08-06T00:00:00Z`, a 24-month category is current at `2026-08-06T00:00:00Z` and stale one instant later. An explicit `validUntil=2026-09-01T00:00:00Z` makes it current through that inclusive instant. Missing basis is unknown. Basis after `asOf` is future-invalid unless a typed forecast interval covers the instant.

### Overall assessment

`[low, low, moderate, low, low]` → potentially suitable with conditions. Any high wins even when another category is insufficient. Without high, any insufficient/failed → evidence incomplete. All low still produces lower-concern professional-review-required wording, never approval.

### Site screening

A confirmed hard criterion “outside authoritative flood exclusion” fails → excluded. If the flood layer is missing and its configured missing policy is specialist review → specialist review, not included. A fibre preference with approximate data can affect the visible lexicographic vector only as partial/unknown and cannot become a hard capacity fact.

## Requirement-to-logic traceability

| Requirements | Logic units/invariants |
|---|---|
| FR-LOC-001–004 | LOG-BOOT-001, LOG-GEO-001, LOG-MAP-001, INV-009–010 |
| FR-MAP-001–004 | LOG-MAP-001, LOG-CASE-001, LOG-UI-001 |
| FR-SCN-001–004 | LOG-VAL-001, LOG-SAVE-001, LOG-CMP-001 |
| FR-CASE-001–004 | LOG-CASE-001, LOG-EVD-002, LOG-DOC-001 |
| FR-CAL-001–006 | LOG-CAL-001, LOG-FLX-001, LOG-SNAP-001, INV-014–015, INV-020 |
| FR-ASM-001–008 | LOG-ASM-001, LOG-SNAP-001, INV-017–019 |
| FR-EVD-001–012 | LOG-PACK-001, LOG-EVD-001–002, LOG-PIPE-001, LOG-OFF-001 |
| FR-EVD-013–015 | LOG-EMI-001, INV-025 |
| FR-EVD-016–018 | LOG-EVD-002, LOG-CASE-001, LOG-DOC-001, INV-013/019 |
| FR-AGT-001–008, FR-AGT-011 | LOG-CONN-001, LOG-AGENT-001, LOG-CASE-001, LOG-UI-001 |
| FR-AGT-009–010 | LOG-SITE-001, INV-016 |
| FR-VIZ-001–003 | LOG-VIS-001, LOG-UI-001, INV-008 |
| FR-CONN-001–008 | LOG-CONN-001, LOG-AGENT-001, LOG-SAVE-001, INV-005–007 |
| FR-RES-001–004 | LOG-MAP-001, LOG-CASE-001, LOG-SNAP-001, LOG-UI-001 |
| FR-RPT-001–003 | LOG-RPT-001, INV-002/026 |
| FR-SAVE-001–002 | LOG-SAVE-001, LOG-CONN-001, INV-021–022 |
| FR-DOC-001–002 | LOG-DOC-001, INV-027 |
| NFR-PER-001 | LOG-PACK-001, LOG-FLX-001, concurrency/backpressure, resource ceilings |
| NFR-REL-001–002 | LOG-SNAP-001, typed state machines/failures, INV-003–004/020/028 |
| NFR-ACC-001 | LOG-UI-001, LOG-MAP-001, LOG-VIS-001 |
| NFR-SEC-001–002 | Security boundaries, LOG-CONN-001, LOG-AGENT-001, LOG-VIS-001, INV-005–008 |
| NFR-PRI-001 | LOG-CONN-001, LOG-SAVE-001, LOG-OBS-001 |
| NFR-EXP-001 | LOG-VAL-001, LOG-EVD-001–002, LOG-ASM-001, LOG-RPT-001 |
| NFR-MNT-001–002 | Every versioned LOG/CTR boundary and state machine |
| NFR-DEP-001 | LOG-BOOT-001, LOG-OFF-001, LOG-PIPE-001 |
| NFR-OBS-001 | LOG-OBS-001, INV-024 |
| CON-001–008 | Security/forbidden boundaries, INV-001–028, LOG-PIPE/CONN/OFF |

## Acceptance-criterion-to-logic traceability

| Acceptance criteria | Logic evidence |
|---|---|
| AC-001–002 | LOG-GEO-001/MAP-001 plus per-category LOG-EVD-001 coverage and all-region analysis. |
| AC-003–004 | LOG-CAL-001 exact Southland values and LOG-FLX-001/property oracles. |
| AC-005–006 | LOG-ASM-001, LOG-SNAP-001, manifest/trace and accessible presentation invariants. |
| AC-007–009 | LOG-PIPE/PACK/EVD/OFF source, conflict, freshness and failure paths. |
| AC-010–012 | LOG-CONN-001 persistent vault/CORS/no-relay state machine. |
| AC-013–015 | LOG-AGENT-001 and LOG-VIS-001 bounded citation/security/cancellation behavior. |
| AC-016–019 | LOG-CASE/EVD/ASM/CMP/RPT and presentation-only audience/lens invariants. |
| AC-020–021 | LOG-SAVE/OFF/OBS/UI plus clean build/hosted checks in test strategy. |
| AC-022 | LOG-EMI-001 exact window/join/transform/DST/unit/exclusion logic. |
| AC-023–024 | LOG-MAP-001, LOG-CASE-001, LOG-DOC-001 and offline core packs. |
| AC-025 | LOG-EVD-002/ASM-001 and INV-019 controlled community model. |
| AC-026 | LOG-SITE-001 confirmed profile, classification precedence, visible order and sensitivity. |

## Normative v0.10 logic reconciliation

The routines below replace the same-named v0.4/v0.5/v0.6/v0.7/v0.8/v0.9 routines and every old producer of a superseded CTR-022 root, including old LOG-CASE/ASM/SNAP/SITE/AGENT/VIS payload production. All arithmetic is exact `RationalDecimal` until an explicit display formatter. The approved v1 policies are Balanced EMI quality and separate site-presentation groups that retain the five site-domain outcomes.

### LOG-FLX-001A - exact continuous minimax

```text
function buildFlexibilityInputV1(scenario, calculation, profile, policy): FlexibilityInputV1
  require calculation/scenario/profile hashes and exactly 24 one-hour slots
  B[h] = calculation.facilityDemandMw * scenario.utilisationRatio
  C[h] = profile.regionalDemandMw[h] + B[h]
  P0 = max(C)
  maxFlexibleMw = calculation.facilityDemandMw * scenario.flexibleWorkloadRatio
  sourceHours = first policy.peakHourCount indices sorted by
    (profile.regionalDemandMw descending, hour index ascending)
  sourceLimit[h] = min(maxFlexibleMw,B[h]) * duration[h] if h in sourceHours else 0
  destinationLimit[h] = 0 if h in sourceHours else max(0,min(
    calculation.facilityDemandMw*policy.maximumDestinationUtilisationRatio-B[h],
    P0-C[h])) * duration[h]
  allowed[s][d] = (s in sourceHours and d not in sourceHours)
  return strict FlexibilityInputV1 with maximumMovableEnergyMwh=sum(sourceLimit)
    and FlexibilityProducerTrace over every source value/version/hash

function solveFlexibilityV1(input): FlexibilityResultV2
  require length of all slot vectors = 24 and every duration == exactly 1
  require every input MW <= 1_000_000, every combined MW <= 2_000_000
  require canonical decimals, exact producer trace recomputation, diagonal transfers false
  combined[h] = regionalDemandMw[h] + facilityBaselineMw[h]
  sourceCap[h] = min(sourceLimitsMwh[h], facilityBaselineMw[h]*duration[h])

  if sum(sourceCap) == 0:
    P0 = max(combined)
    return complete identity profiles, zero ledger/shift/improvement,
      exact primal=dual=P0 certificate and zero residuals

  // Primary exact rational LP with optional continuous transfers.
  primary = solveRationalPrimalAndDual(
    minimize P,
    0 <= transfer[s,d],
    transfer[s,d] == 0 when not allowedTransfer[s,d],
    sum_d transfer[s,d] <= sourceCap[s],
    sum_s transfer[s,d] <= destinationLimitsMwh[d],
    shiftedFacility[h] = facilityBaseline[h]
      - sum_d transfer[h,d]/duration[h]
      + sum_s transfer[s,h]/duration[h],
    shiftedFacility[h] >= 0,
    regionalDemand[h] + shiftedFacility[h] <= P for every h)
  require primary status exact_optimal
  require exact primary.primalObjective == primary.dualObjective
  Pstar = primary.primalObjective

  secondary = solve exact LP holding P=Pstar and maximising sum(transfer)
  shiftedEnergy = secondary.maximum
  ledger = solve exact LP holding P=Pstar and sum(transfer)=shiftedEnergy,
    lexicographically minimise transfer[0,0]..transfer[23,23]

  recompute shifted facility/combined arrays from ledger
  require exact source/destination/nonnegative/conservation/allowed-edge constraints
  require max(shiftedCombined) == Pstar
  require primal and dual constraint hashes revalidate independently

  auditLow = exact primary.dualObjective
  auditHigh = exact primary.primalObjective
  auditIterations = ceil(log2(2_000_000/0.000001)) == 41 maximum
  return complete with identity-or-ledger profiles, shiftedEnergy, improvement,
    active constraints and zero-gap exact primal/dual certificate
```

The independent oracle is a separate continuous rational LP implementation with no shared production pivot, constraint builder or dual code. It enumerates LP vertices for small property cases and uses an independently sourced exact simplex for larger fixtures. It never discretizes MWh. The cap-limited fixture `[100,99,0 x22]`, facility `50 MW`, two source slots and twenty-two `1 MWh` destination caps must return exact `138.5 MW`; a result below `138.5` is impossible. A dedicated mutation fixture makes a low source export while a high source remains above a false target; only the exact primary/dual certificate passes.

### LOG-EVD-001A - compile typed facts and freeze authority

```text
function compileEvidence(sourceRecord, adapter, registry, authorityRules, asOf): CompiledEvidence
  validate source bytes, adapter schema/version, registry entry and licence
  evidence = adapter.toEvidenceRecordV2(sourceRecord)
  require strict PageLocatorV2 when documentId/pageOrSection is present; reject `{}`,
    mixed variants and every legacy PageLocator before content hashing
  candidateFacts = adapter.toTypedFacts(sourceRecord)
  for fact in candidateFacts:
    require fact.evidenceId == evidence.evidenceId
    require typed value/unit/definition/basis/role/scope
    if forecast exists:
      require issuedAt <= validFrom <= validUntilInclusive
      forecast_valid iff validFrom <= asOf <= validUntilInclusive
      forecast_expired iff asOf > validUntilInclusive
    basis after asOf without a covering forecast => future_invalid
    absent usable observation/publication and forecast => unknown
    require authority rule explicitly includes the resulting temporal state
    require every derivation input exists and graph is acyclic
    applicable = authorityRules.filter(exact match on sourceType, factKind, field,
      scope.kind, intendedPurpose, temporalState, derivation.kind)
    if applicable.count != 1: fail compiler
    if impossibleAuthority(sourceType, fact.basis, applicable[0].resultingAuthority): fail compiler
    bind fact to applicable rule ID/version and resulting authority
  return compiled evidence and facts

function freezeEvidenceSnapshot(selection, asOf): EvidenceSnapshot
  resolve every selected evidence/fact/statement/question/missing-voice/company/
    company-claim/edge/community record byte-for-byte
  evaluate freshness using pinned asOf and policy version
  compute coverage/conflicts/failed-source ledger deterministically
  include source, adapter, policy and pack versions
  inline the complete essential V2 closure and exact ID/content-hash projections
  canonicalize, hash remainder, set evidenceSnapshotId to hash
  reparse and rehash before returning immutable snapshot
```

National scope is a first-class scope; it is never encoded as an empty geography list. Forecast validity is inclusive at `validUntilInclusive`; equality remains `forecast_valid`. Snapshots preserve `current`, `stale`, `unknown`, `future_invalid`, `forecast_valid` and `forecast_expired`. Refreshing a pack creates a new snapshot; old results continue resolving their inlined essential closure.

### LOG-ASM-001A - total five-category policies

```text
function assessCategory(category, scenario, calculations, flexibility, snapshot, policy): CategoryAssessment
  try:
    facts = resolve only policy-declared FactIds from snapshot
    require each fact's authority rule permits assessment purpose and required field
    if required fact absent/stale/conflicting/wrong scope/wrong definition/basis/role:
      return insufficient(exact MissingRecords and ConflictIds)
    switch category:
      electricity:
        require flexibility complete and consume its post-flex shifted facility profile
        derive achieved added peak without display rounding and bind flexibility.traceRef
        apply approved added-peak bands to current typed regional peak/supply facts
      water:
        require complete annual_water_demand and peak_day_water_demand CalculationOutputV2
        compare their conservative upper values to annual and peak-day typed limit facts
        outcome is the worse band; bind both calculation trace refs and both fact sets
      resilience: apply verified backup/restriction/commitment branch table
      economic: compare only commensurate facts; keep direct/indirect/induced separate;
                exact contradiction key is definition+role+scope+overlapping time+price year
      community: apply exact tier precedence below; report mana whenua separately
    return complete with nonempty decisive AssessmentInputRefV2 values, nonempty reasonIds,
      every consumed fact hash/origin proof/calculation trace and deterministic statement ID
  catch typed DomainError e:
    return failed(e) with accumulated decisive refs and nonempty reasonIds
      // never serialize failure as insufficient

function assessCommunity(snapshot): CategoryAssessment
  highCategorical = current qualifying authoritative concern facts with value high
    and basis in {representative_consultation,formal_submission_summary}
  if highCategorical nonempty:
    if internally incompatible within same population/window: return insufficient(conflict)
    return high
  treat every support/opposition percentage fact as contextual display only
  remaining = current qualifying authoritative low/moderate facts legal for their basis
  if remaining contains incompatible values for same population/window:
    return insufficient(conflict)
  moderate = current qualifying authoritative moderate facts with basis in
    {representative_consultation,formal_submission_summary}
  if exactly one compatible moderate: return moderate
  low = current qualifying authoritative low facts with basis representative_consultation
    and qualifying RepresentativeMethodology
  if exactly one compatible low: return low
  if incompatible: return insufficient(conflict)
  return insufficient(missing representative community evidence)

function assessResilience(scenario, snapshot): CategoryAssessment
  if scenario.backup generation in {diesel,gas,mixed} and
     scenario.backup.restriction == unrestricted and
     originProof(backup.restriction) == user_assumption:
    return complete high with zero FactIds, the exact backup-restriction OriginProofV2,
      its hash and reasonId unrestricted_fossil_user_assumption
  verifiedSets = match current qualifying resilience_capacity + backup_duration +
    resilience_commitment facts by identical technology in {battery,demand_response},
    scope and overlapping validity
  if one compatible set has capacity > 0, duration > 0, commitment == true,
     and every basis/authority is verified/qualifying:
    return complete low with all three FactIds
  restrictions = current qualifying binding_restriction facts for fossil technology
    with value=true and restrictionKind in {emergency_only,time_limited,verified_restricted}
  if one compatible verified restriction exists: return complete moderate with FactId
  return insufficient with exact missing capacity/duration/commitment/restriction records

function assessEconomic(scenario, calculations, snapshot): CategoryAssessment
  resolve only commensurate qualifying economic facts
  if a scenario construction-jobs value exceeds 10,000 and is not backed by a current
     qualifying FactId:
    return complete moderate with zero FactIds, the field's OriginProofV2,
      any available calculation trace and reasonId unsupported_large_jobs_claim
  apply the approved commensurate-fact branch table and retain definition/role/scope/
    overlapping time/price-year identities in decisive refs

function assessOverall(assessments): OverallAssessmentV2
  require exactly the five category keys and collect their StatementIds in fixed order
  if any complete high: return complete high with reason overall_high_precedence
  if any failed: return failed with every failed error ID and reason overall_failed_category
  if any insufficient: return insufficient with reason overall_insufficient_category
  if any complete moderate: return complete moderate with reason overall_moderate_precedence
  require every category is complete low
  return complete low with reason overall_all_categories_low

function freezeResultSnapshotV2(scenario, calculations, flexibility, snapshot, policy): ResultSnapshotV2
  require normalized scenario V2 and exact EvidenceSnapshot ID/hash
  run five assessCategory functions with calculations and flexibility, including the
    dedicated resilience/economic branches above
  preserve each CategoryAssessment variant without coercion
  create CalculationTraceRefV2 for every CalculationOutputV2 and flexibility result
  overall = assessOverall(five assessments)
  build ReproducibilityManifestV2 from actual read tracking over every consumed
    asset/feature/evidence record/fact/policy/geometry/geography hash
  require assessments has exactly electricity,water,resilience,economic,community
  require overall references the five frozen category StatementIds exactly
  canonicalize remainder, calculate resultSnapshotId, deep-freeze and return
```

`qualifying methodology` requires all fields in CTR-009A, sample/response counts consistent, authority evidence permitted for community assessment, and a deterministic `qualification=qualifying`. A categorical fact based only on informal anecdotes is context. Mana whenua facts render in their own block and do not alter the community band.

### LOG-SITE-001A - closed classification, grouping and sensitivity

```text
function evaluateCriterion(candidate, criterion, snapshot): SiteFindingV2
  applicability = evaluate exact ApplicabilityRule from candidate typed fields
  if applicability == false: return not_applicable with rule hash
  resolve exact field/layer/fact/geometry declared by criterion kind
  if unavailable: return finding_missing or finding_partial exactly as declared;
    MissingPolicy has no fail member
  if partial: return finding_partial; never convert partial/unavailable data to fail
  convert units only through criterion.conversionTableVersion
  for distance/area use exact geometryEngineVersion and geodesic/boundary rule
  compare an available observed value using exact inclusive/exclusive operator;
    only this comparison may produce fail; never use display rounding
  return findingOrdinal plus criterion-declared desirability

function confirmSiteProfile(request: SiteProfileConfirmationRequestV2): ConfirmedSiteProfile
  require invocation came from coordinator `confirm_site_profile` targeted to analysis worker
  require request.proposal is SiteProfileCandidateV2 with status proposed_unconfirmed
  reject any confirmation timestamp, confirmation hash or reviewer field in model output
  use only request.reviewedCriteria and reviewedPreferenceOrder shown in the review UI
  derive classificationAffectingCriterionIds exactly from reviewed criteria
  verify reviewedContentHash; hash proposal, reviewed content, derived ID set,
    preference order and user-review receipt
  create revision 1 or the next explicit user-confirmed revision; never auto-confirm
  persist through a repository-only site_profiles mutation plus operation receipt
    atomically before emitting site_profile_confirmed

function classify(candidate, confirmedProfile): CandidateScreeningV2
  require classificationAffectingCriterionIds == exactly
    set(criteria where affectsClassification == true)
  require confirmationHash covers criteria plus that exact derived set
  findings = evaluate every criterion
  hard = applicable findings whose criterionId is in confirmed classification-affecting IDs
  failedOutcomes = failureOutcome for every hard finding == fail
  if failedOutcomes contains excluded: domainOutcome = excluded
  else if failedOutcomes contains specialist_assessment_required:
    domainOutcome = specialist_assessment_required
  else if failedOutcomes contains infrastructure_upgrade_required:
    domainOutcome = infrastructure_upgrade_required
  else if any hard finding in {missing,partial}: domainOutcome = insufficient_evidence
  else: domainOutcome = included
  presentationGroup = mapDomainOutcome(domainOutcome)
  return screening with both values and exact findings

function mapDomainOutcome(domainOutcome): SitePresentationGroup
  excluded -> excluded
  specialist_assessment_required|infrastructure_upgrade_required|insufficient_evidence ->
    needs_investigation
  included -> passes_declared_constraints

function presentCandidates(candidates): visible groups
  evaluate domain outcome and presentation mapping before preferences
  sort within each presentation group by confirmed preference keys;
    for each key use preferred < acceptable < adverse < unknown;
    tie by candidateId
  require SitePresentationPolicyV2.kind == separate_classification_groups
  render three independent map groups; expose no cross-group ordinal/rank
  show each candidate's five-valued domain outcome in its synchronized panel item
  bind every candidate to a stable map feature and synchronized panel item

function sensitivity(baseProfile, plan): SensitivityResultV2[]
  validate plan hash == base profile hash
  for each declared operand/value in order:
    change exactly that one operand, enum set or classification toggle
    recompute every CandidateScreeningV2 and record typed changed findings, domain outcomes
      and presentation groups
  never invent a numeric step, value, criterion or weight
```

The selected behavior is map-first separate presentation groups. Whole-NZ region/site choice occurs by map pointer, touch, keyboard map navigation, place search that focuses the map, or the synchronized accessible map list; checkbox and drop-down selection controls are forbidden. The five-valued domain outcome remains visible and is never replaced by its three-valued presentation group.

### LOG-MAP-SITE-001A - map-first whole-NZ selection and grouped sites

```text
function selectOnNzMap(interaction): NzMapSelectionState
  require map extent covers all Stats NZ mainland/island regional geometries
  if interaction map pointer/touch:
    hit-test bounded visible features; disambiguate overlaps on-map; choose stable feature ID
  if interaction keyboard:
    move focus among visible features in deterministic spatial order; Enter selects
  if interaction place search:
    resolve result to GeographyId/FeatureId; move and focus map; user confirms map feature
  if interaction accessible map list:
    choose the same FeatureId and focus/highlight it on the map
  update exactly one shared selection object consumed by map, scenario, evidence and side panel
  return state with synchronizedPanelHash

function renderSiteGroupsOnMap(candidates): SiteMapGroupView
  groups = presentCandidates(candidates)
  assign redundant shape+colour+text symbol by classification, never colour alone
  cluster only within a classification group; mixed clusters expose counts per group
  selecting marker/polygon highlights the matching within-group panel item and vice versa
  never emit a checkbox/drop-down geography selector or cross-group rank
  return exact candidate-to-feature mapping and group symbols
```

The list is an accessibility-equivalent view of the map's feature IDs, not an alternate form with different data. Mobile uses the same map with a draggable synchronized result sheet; it does not replace geography choice with a drop-down.

### LOG-BOOT/PACK-001A - resolve and activate content-addressed objects

```text
function verifyRelease(manifestBytes): VerifiedRelease
  hash bytes with WebCrypto; parse strict ReleaseManifestV2; verify manifestHash
  require unique AssetIds and complete packAssets mapping
  require every core/optional PackId resolves to one manifest asset and >=1 data asset
  for every pack entry parse strict DataPackManifestV2 and require:
    key=packId, manifestHash recomputes, manifest asset hash matches release declaration,
    exact data asset IDs/hashes, nonempty source/licence/attribution/purpose bindings,
    registry compatibility, coverage and compatible version
  require dependency graph from pack manifests acyclic and every dependency declared
  for each required asset:
    fetch same-origin bytes with byte cap
    verify byteLength and SHA-256 before parse
    strict parse by schemaId/version
    bind parsed object to asset/pack/release hashes
  validate strict EvidenceRecordV2/PageLocatorV2 records and exact statement/question/
    missing-voice/company/company-claim/layer ID/hash closures; reject every legacy locator
  validate the built-in ReadOnlyToolRegistryV2 has exactly five closed read-only entries
  ensure first-source registry exact 17-entry oracle
  activate only the fully verified graph
```

Map feature parsing enforces feature-kind geometry bounds, stable FeatureId, layer, evidence/source/licence, scope, observation, coverage, confidence and qualification. Any feature lacking lineage is rejected at pack build and runtime. Reproducibility collects hashes transitively from only the actual objects touched by an operation.

### LOG-PRODUCT-001B - closed catalog, graph, community, brief, disclosure and diagnostics

```text
function queryMapProducts(query): MapQueryResultV2
  resolve features under LOG-MAP and one active release
  resolve exactly one MapLayerDescriptorV2 for every requested/returned layer ID; validate
    state/reason, source/date/licence/coverage/confidence, geometry/zoom and statement IDs
  for every project-layer feature resolve exactly one ProjectCatalogRecordV2 whose
    mapFeatureId matches and whose status/name/location/source/statement/company IDs validate
  place/project matches carry that same feature/project identity
  if a project is selected construct ProjectSheetV2 from the exact catalog record,
    coverage and fixed actions; never compute a score
  validate every returned unresolved question against the closed scope/subject matrix and
    require every subject in the same returned immutable closure
  return layer descriptors, trusted statements, company records, project records,
    selected sheet, features/list selection and release hash together

function validateUnresolvedQuestion(question, containingClosure)
  strict-decode UnresolvedQuestionV2; require embedded statement ID/hash/origin/trust label
  allowed = {
    map: [geography,project,company,site_candidate,evidence,statement],
    case: [project,company,geography,site_candidate,evidence,statement],
    evidence: [evidence,statement,project,company,geography],
    company: [company,statement,evidence,project],
    site: [site_candidate,geography,project,evidence,statement],
    brief: [project,company,geography,site_candidate,evidence,statement]
  }[question.scope]
  require every unique subject kind is in allowed and every typed ID resolves byte-identically
    in containingClosure; reject all omitted pairs and opaque/orphan subject IDs
  require no subject variant can carry a current or older briefSnapshotId
  recompute question contentHash with only itself omitted

function loadProjectCase(locator: ProjectCaseLocatorV2): ProjectCaseV2
  if locator.kind == prepared_asset, resolve the selected catalog record's exact caseAssetId
    through the active/retained verified release, strict-load the case and recompute caseSnapshotId
  else resolve the immutable caseSnapshotId through the exact retained case/asset index
  require embedded catalog record hash, graph snapshot/evidence snapshot identity,
    all edge/node/evidence/statement/question/company/claim IDs, community records,
    events, missing voices and counts resolve
  validate every unresolved question against the exact closed scope/subject matrix
  require manaWhenuaCommunityRecordIds equals exactly the distinct mana-whenua records;
    validate missing voices remain typed/distinct and every company claim role/identity
  reject the case atomically on any orphan/hash/taxonomy mismatch

function queryEvidenceProducts(query): EvidenceQueryResultV2
  strict-load the named EvidenceSnapshot and apply exact ID/maximum-record filters
  return selected EvidenceRecordV2/facts/conflicts plus the exact statement/question/
    missing-voice/company/company-claim/edge/community closure needed to resolve every ID
  validate every question with validateUnresolvedQuestion; recompute entry/content hashes
    and reject an orphan, illegal pair, legacy locator or partial closure

function queryEvidenceGraph(query): EvidenceGraphQueryResultV2
  strict-load graph by graphSnapshotId and verify its content hash/edge entries
  require every typed seed node, edge type and edge-type endpoint-kind pair is legal;
    apply exact maximumEdges before traversal
  resolve every document_page through PageLocatorV2 and every statement/company node through
    the graph's exact statement/company/claim closure
  return those exact selected statements/companies/claims with accepted prepared/manual edges
    for trusted views and candidate AI edges only when
    the caller explicitly requested their labelled state; graph reachability grants no authority

function buildImpactBrief(request): ImpactBriefV2
  require analysis-worker build_impact_brief command and strict immutable input snapshots
  deterministically bind calculations, five category outcomes, evidence, assumptions,
    conflicts, typed unresolved questions, company roles, limitations and mandatory
    professional disclaimer; copy exact trusted statement records into the brief closure
  validate every question against the closed matrix; for scope=brief require only stable
    underlying IDs in that closure and reject any attempted current/older brief-hash subject
  construct technical/plain-language trusted sections and deterministic Markdown
  include an AI appendix only from a complete/partial validated agent receipt with exact
    labelled claims/citations; never let it replace deterministic sections
  canonicalize the complete remainder once, compute briefSnapshotId in one forward pass with
    only that field omitted, recompute all referenced IDs and require the target briefs-envelope
    recordId equals briefSnapshotId, then atomically persist one briefs envelope plus
    repository receipt before emitting
    impact_brief_ready

function loadImpactBrief(briefSnapshotId): ImpactBriefV2
  strict-load the immutable briefs envelope; recompute snapshot/semantic/reference hashes
  require every result/case/evidence/statement/disclaimer reference remains resolvable
  return byte-identical stored brief or typed failure; never regenerate during restore

function copyImpactBrief(brief, format): ImpactBriefCopyOutcomeV2
  derive plain text or Markdown solely from the trusted deterministic brief plus its
    separately labelled validated appendix; recompute content and semantic hashes
  if Clipboard succeeds return copied without returning content
  otherwise expose that exact content in a focused selectable region with guidance

function prepareExternalDisclosure(requestIdentity, config, routeId, operationKind,
    optionalModelPurpose, optionalToolId, exactContextProjection, categories, sendFlags,
    canonicalOutboundBytes):
    ExternalDisclosureV2
  accept only sanitized connector origin/label, current configurationHash, declared route,
    exact operation kind/optional model purpose/optional closed tool ID and its exact agent-stage,
    direct-query or connector-test context projection; require model purpose exactly for
    primary_model and tool ID exactly for agent_tool/direct_research
  hash the prompt without retaining it when sendsPrompt, then hash promptHash + context +
    sorted categories + send flags into selectedContextHash; hash the exact canonical outbound
    bytes before credential insertion into outboundContentHash; set provider-retention state,
    cancel/clear controls and exact ten-minute expiry; include no endpoint path or content bytes
  changing request/generation/connector/config/origin/route/operation/tool/content/context/
    category/flag invalidates only that destination's prior acceptance

function acceptExternalDisclosure(disclosure, userAction): ExternalDisclosureAcceptanceV2
  require unexpired disclosure and explicit user_accepted action
  hash the whole accepted disclosure; no implicit/global acceptance exists

function emitDiagnosticV2(candidate): DiagnosticEventV2
  construct only the closed enum/scalar allowlist; never spread error/provider/content objects
  allow only sanitized connector/source label, status class, timing bucket, bounded counts and
    correlation/version IDs; recompute eventHash and append to a 500-event in-memory ring
  reject unknown/free-text/URL/path/prompt/scenario/document/evidence/secret fields
```

`DataPackManifestV2` is the only pack-manifest decoder. Catalog records, graph snapshots, community records and prepared case records are content-addressed pack assets and stay available in the retained verified generation when offline. Briefs are immutable device records. Route restoration resolves `projectId/caseSnapshotId/briefSnapshotId` to these exact records; it never accepts a hash without its strict record. `DiagnosticEventV2` may be exported locally only after revalidation and is never sent as telemetry in the core release.

### LOG-WORKER-001A - closed coordinator/worker operation graph

```text
function dispatchWorkerCommand(command: WorkerCommandV2<WorkerCommandPayloadV2>): terminal event
  strict-decode the closed command union; reject unknown kind/field before dispatch
  require target instance/epoch is ready and generation is current
  require command kind -> worker ownership exactly:
    analysis = query_map, resolve_location, load_pack_assets, load_project_case,
      load_impact_brief, build_impact_brief,
      normalize_scenario, build_analysis_snapshot, build_comparison, screen_sites,
      run_site_sensitivity, confirm_site_profile, query_evidence, resolve_visual,
      query_evidence_graph, inspect_research_cache, compile_research,
      build_agent_projection, validate_pack
    connector = execute_agent, authorize_agent_destination, fetch_research,
      normalize_connector_draft,
      commit_connector_configuration, discard_connector_draft, replace_connector_secret,
      test_connector_capabilities, persist_connector_after_success, clear_connector_secret,
      remove_connector_configuration, clear_all_connector_secrets
    either exact queued/active target = cancel_operation, whose payload target tuple must
      match the command target worker instance/epoch and one known original operation
  for authorize_agent_destination require target.workerKind=connector and the full target
    tuple names one suspended active execute_agent; queued/non-agent/terminal targets reject
  coordinator sends one WorkerCommandV2; direct UI/module/worker side channels are forbidden
  worker emits ordered WorkerEventV2 progress and exactly one terminal payload whose kind
    matches the command result family
  coordinator accepts an event only when operationId, requestId, generation,
    producer worker kind, instance and epoch all match the active command
  unknown/wrong-worker/wrong-epoch/wrong-generation/late-terminal events are obsolete
  cancellation command terminalizes once as cancellation_acknowledged; a successfully
    cancelled original operation separately terminalizes exactly once in its command family

command/result pairs:
  query_map -> map_query_ready(MapQueryResultV2)
  resolve_location -> location_resolution(LocationResolutionOutcomeV2)
  load_pack_assets -> pack_assets_ready(PackAssetLoadResultV2)
  load_project_case -> project_case_ready(ProjectCaseV2)
  load_impact_brief/build_impact_brief -> impact_brief_ready(ImpactBriefV2)
  normalize_scenario -> scenario_validation(ScenarioValidationOutcomeV2)
  build_analysis_snapshot -> analysis_snapshot_ready(ResultSnapshotV2)
  build_comparison -> comparison_ready(ComparisonSnapshotV2)
  screen_sites -> site_screenings_ready(CandidateScreeningV2[])
  run_site_sensitivity -> site_sensitivity_ready(SensitivityResultV2[])
  confirm_site_profile -> site_profile_confirmed(ConfirmedSiteProfile)
  query_evidence -> evidence_query_ready(EvidenceQueryResultV2)
  query_evidence_graph -> evidence_graph_query_ready(EvidenceGraphQueryResultV2)
  resolve_visual -> visual_resolution_ready(VisualOutcomeV2)
  inspect_research_cache -> research_cache_inspection(ResearchCacheInspectionV2)
  fetch_research -> research_fetch_ready(ResearchFetchResultV2)
  compile_research -> research_compilation_ready(ResearchCompilationOutcomeV2)
  normalize_connector_draft -> connector_draft_ready(SanitizedConnectorDraftV2)
  commit_connector_configuration -> connector_configured(configuration + vaultReceipt)
  discard-draft/replace/persist-after-success/clear/remove/clear_all connector operations ->
    connector_vault_mutation
  test_connector_capabilities -> connector_capabilities(ConnectorCapabilityMatrixV2)
  build_agent_projection -> projection_ready(AgentContextProjection)
  execute_agent -> agent_terminal(AgentTerminalResultV2)
  authorize_agent_destination -> destination_disclosure_accepted(target + acceptanceHash)
  cancel_operation -> cancellation_acknowledged(CancellationAcknowledgementV2)
  validate_pack -> pack_validation
```

The cancel command has its own new operation/request/generation tuple and carries one complete `CancellationTargetV2`. If it targets a queued `execute_agent`, the connector removes only that entry, constructs the zero-activity receipt from its already-validated request/projection/execution binding, emits exactly one `agent_terminal(status=cancelled)` on the original tuple with the cancel-command ID, and acknowledges `cancelled_queued` on the cancel tuple. If the agent is active, it signals only that operation, acknowledges `signalled_active`, and the original emits the same single agent terminal after cooperative cleanup with final counters. A cancelled non-agent original instead emits exactly one `operation_cancelled`. An already-terminal, absent, wrong-worker, wrong-instance/epoch or otherwise mismatched target produces only the corresponding acknowledgement and never cancels a sibling. A target terminal racing before cancellation wins; the acknowledgement is `already_terminal` and no second target terminal is accepted. An agent original never emits `operation_cancelled`, and a non-agent original never fabricates an `AgentExecutionReceipt`.

All coordinate/location, map/catalog/sheet, case, impact-brief, scenario, calculation/assessment, comparison, site profile confirmation/screening, evidence/graph and visual work therefore crosses the same versioned coordinator boundary that enforces epochs, generations, cancellation and terminality. Connector setup/capability/vault commands use the same envelope and terminal rules but their secret-bearing structured-clone payloads are excluded from JSON serialization and transferred exactly once.

### LOG-AGENT-001A - coordinator-mediated bounded agent execution

```text
function beginAgent(request: AgentRequestV2, signal): AgentTerminalResultV2
  strict-decode AgentRequestV2 including StageContext
  require analysisReady and connectorReady handshakes for current instance/epoch
  load SanitizedConnectorConfiguration by request.connectorId; require unexpired capability
    matrix matches configurationHash and selected route/dialect/model are supported
  construct AgentExecutionBindingV2 from that exact public configuration/matrix; hash it
  strict-validate request.acceptedDisclosureAcceptances as a canonical acceptance-hash set;
    require one exact primary_model acceptance for the current primary connector/config/
    origin/route/initial outbound prompt+context bytes, purpose=initial and this
    request/operation/generation
  strict-load the five-entry ReadOnlyToolRegistryV2; require requested tool scopes are exact
    ReadOnlyToolIdV2 values supported for mode/stage; require exactly one request-frozen
    ToolRouteBindingV2 per allowed scope and no extra binding; each binding must match one
    current connector/configuration/capability matrix, its registry connector kind and route
    capability; reject zero/two compatible bindings rather than choosing by kind/order/model
  validate every additional preaccepted model/tool disclosure against the primary execution
    binding or the exact named ToolRouteBindingV2, content hash and ten-minute expiry;
    an uncontacted preaccepted destination grants no background fetch
  require disabled tools have zero route bindings; disable unsupported actions rather than
    inferring them from chat, MCP discovery or streaming support
  coordinator -> analysisWorker via WorkerCommandV2 targeted to exact instance/epoch:
    buildProjection(request.stage, selected context IDs)
  projectionBytes = analysis response
  verify schema, analysis instance/epoch, byteLength <= maximumContextBytes, hash,
    exact disclosure categories and requested StageContext variant
  validate projection contains only inert typed values and allowed tool scopes
  structuredClone request + projection + executionBinding in WorkerCommandV2 targeted to
    connector instance/epoch; connector recomputes both hashes and requires every
    connector/config/matrix/route/dialect/model/label field still matches
    // no worker-to-worker call

  connector establishes canonical effectiveAccepted = request.acceptedDisclosureAcceptances,
    contactedNetworkAttempts=[], all receipt counters=0, a request wall deadline and
    per-request tool receipt maps

  function authorizeOutbound(disclosure): ExternalDisclosureAcceptanceV2
    require disclosure exactly binds the active original target, operation kind/purpose,
      connector/configuration/origin/route/tool/content/context and is not expired
    if effectiveAccepted has its exact unexpired acceptance: return it
    emit nonterminal destination_disclosure_required on the original tuple and suspend it
    coordinator obtains explicit user choice and, only on acceptance, sends
      authorize_agent_destination on a new command tuple carrying the original exact target
      plus the byte-identical acceptance
    connector validates command target/current epoch/disclosure bytes/expiry, acknowledges the
      authorization command once, inserts the unique acceptance in canonical hash order, emits
      destination_disclosure_accepted on the original tuple and resumes it
    decline, expiry, substitution, conflicting duplicate, cancellation or stale target resumes
      no fetch and terminates the original with its exact current receipt
    return the newly accepted value only after acknowledgement

  function recordNetworkAttempt(disclosure, acceptance, call identity, attemptOrdinal)
    require acceptance is in effectiveAccepted and exactly accepts disclosure
    atomically increment networkAttemptCount and append the next gap-free
      AgentOutboundContactReceiptV2 before guardedFetch begins; require
      networkAttemptCount == contactedNetworkAttempts.length

  while not terminal:
    before every model HTTP request:
      require modelCallCount < maximumModelCalls
      revalidate connector URL/policy and worker epoch
      derive purpose=initial|tool_result_continuation|format_repair|continued_reasoning and
        construct the exact primary_model disclosure over these canonical request bytes
      primaryAcceptance = authorizeOutbound(disclosure)
      require it is still unexpired and byte-identical; then modelCallCount += 1
      send maximumOutputTokens through the selected dialect's declared field
      start a fresh abort deadline <= perNetworkCallTimeoutMs and remaining wall time
      recordNetworkAttempt(disclosure, primaryAcceptance, modelCallOrdinal, attemptOrdinal=1)
      execute the model request only through guardedFetch with that primary acceptance and
        no tool-registry entry
      on 429 or transient 5xx only, retry only an idempotent read when
        transientRetryCount < maximumTransientRetries; increment before retry and
        repeat URL/epoch/deadline guards, revalidate the same acceptance and call
        recordNetworkAttempt with attemptOrdinal=2 before the retry
      never retry auth, CORS, redirect, schema, cancellation or non-idempotent failure
    stream with maximumResponseBytes and maximumOutputTokens enforced before exposure;
      use verified provider output usage when available, otherwise count every emitted
      UTF-8 byte as a conservative upper bound on output tokens
    parse model response as inert content
    if format repair required:
      require formatRepairCount < maximumFormatRepairs
      formatRepairCount += 1
      construct the changed repair body and continue through the common authorization/model guard
    for requested tool call:
      require toolMode=enabled and toolRequestCount < maximumToolRequests;
        increment toolRequestCount exactly once on receipt from the model
      strict-decode exactly one ReadOnlyToolArgumentsV2 and resolve its ReadOnlyToolRegistryV2
        entry and the request's single ToolRouteBindingV2 for that ID; require mode, stage,
        projection scope, bound connector/configuration/route capability,
        sideEffectClass=read_only_external_research and expected result kind all match;
        any failure increments preallocationRejectCount and returns a typed inert tool error
      reject argument text/URLs equal to active secret material or matching credential/
        authorization/key patterns before disclosure, hashing or persistence; classify the
        rejection in preallocationRejectCount
      canonicalize exact arguments against that frozen route; compute argumentHash
      durableAlias = lookup(requestId, callId) before disclosure, quota mutation or child allocation
      if durableAlias exists with different argumentHash, tool ID or frozen route binding:
        increment preallocationRejectCount and terminalize tool_call_id_conflict with no network
      if durableAlias exists and matches:
        increment sameCallReplayCount; return its recorded result/receipt without appending it,
        allocating a child, consuming maximumToolCalls or performing network
      if toolCallCount == maximumToolCalls:
        increment preallocationRejectCount and terminalize the new logical call as limit
      construct exact agent_tool disclosure over arguments/outbound bytes and the frozen route
      toolAcceptance = authorizeOutbound(disclosure); if authorization does not complete,
        increment preallocationRejectCount before the original terminal
      revalidate route binding, acceptance, wall deadline and worker epoch
      increment toolCallCount and allocate one unique child toolOperationId
      construct ToolOperationV2 with exact arguments, connector kind/ID, configurationHash,
        routeId and byte-identical toolAcceptance; calculate operationHash
      if same operationHash completed under another ID in this request:
        build networkPerformed=false CompleteToolReceiptV2 and ToolCallAliasRecordV2
        atomically append alias + receipt under the unique child toolOperationId
        return recorded result only after that commit
      schedule no more than maximumConcurrentTools and record concurrency high-water
      execute only that compile-time registered read-only tool within projection scope using
        guardedFetch; call recordNetworkAttempt(disclosure, toolAcceptance, tool child/call ID,
        attemptOrdinal=1) immediately before fetch and apply the same per-call/wall deadline;
        a permitted transient retry revalidates the same acceptance, increments the shared retry
        counter and records attemptOrdinal=2 before retry
      strict-parse as one SanitizedToolResultV2 variant and sanitize citations
      require cumulative citations <= maximumCitations and research result items <=
        maximumResearchItems before allocation/exposure
      construct immutable ToolReplayRecord containing full ToolOperationV2, exact result,
        completedAt, networkPerformed and CompleteToolReceiptV2
      through repository-only append_tool_completion, atomically commit the replay record
        to tool_replay, initial alias to tool_aliases and byte-identical complete receipt
        to tool_receipts
        before exposing result to model/UI
      every admitted new logical call appends exactly one complete/rejected/failed ToolReceipt;
        cancellation/failure after child allocation uses a failed receipt and never drops the slot
    validate every claim-to-citation edge and structured result schema; update exact
      output-token/citation/research counters in AgentExecutionReceipt
  emit exactly one WorkerEventV2 terminal carrying AgentTerminalResultV2,
    which always attaches AgentExecutionReceipt with byte-identical canonical
    acceptedDisclosureAcceptances, exact contactedNetworkAttempts and exact counters
    satisfying toolRequestCount = toolCallCount + sameCallReplayCount +
    preallocationRejectCount and toolCallCount = toolReceipts.length

on exact cancellation target:
  abort fetch/stream; cooperative parsers check signal every <=1 MiB or <=25 ms
  terminalize the original exactly once as agent_terminal(status=cancelled) with the final
    receipt and cancelledByCommandOperationId; queued cancellation uses zero activity counters;
  discard late generation output and leave all sibling operations untouched
on worker restart:
  allocate new instanceId/epoch; terminalize all old-epoch operations worker_restarted
  clear in-memory secret handles; require explicit user retry and ready handshake
on crash/reload after a completed tool network call:
  rebuild per-request callId/argumentHash/operationHash indexes from durable
    ToolCallAliasRecordV2 records; resolve replay records and matching tool receipts;
    verify every transaction hash before accepting an index entry; reconstruct one counted
    logical call/receipt per distinct alias call ID and never synthesize a second child/receipt
    for a repeated same call ID
  replay exact stored result+citation payload without network; audit/recovery simulation of the
    same request preserves counters, while real worker restart still requires explicit retry
```

Each request has independent exact maxima for model calls, format repairs, model-emitted tool requests, new logical tool calls/concurrency, wall/per-network time, transient retries, context/response bytes, output tokens, citations and research items. Equality is permitted and one-over terminalizes as `partial` when validated cited content exists or `failed` otherwise; deterministic output remains visible. A same-call replay may occur at logical-call quota equality but remains bounded by `maximumToolRequests`; a new call at logical-call equality is a pre-allocation limit rejection. A formatting repair is a real model call and each changed body is separately accepted. Every retry is a contacted network attempt but not a new logical model/tool call; all retries share one request-level retry counter and wall deadline. No retry, restart or reconnection automatically resends a credential.

### LOG-CONN-001A - direct fetch and vault lifecycle

```text
function guardedFetch(connectorId, routeId, publicArgs, credentialHandle,
    disclosureAcceptance, optionalAgentContactReceipt, optionalReadOnlyToolEntry,
    optionalToolRouteBinding): ConnectorOutcome
  config = resolve sanitized configuration
  canonicalOutboundBytes = build exact request bytes without credential
  require unexpired accepted disclosure matches request/operation/generation, connectorId,
    config.configurationHash, origin, routeId, operation/tool kind/model purpose and
    hash(canonicalOutboundBytes); otherwise return before URL construction/network
  if optionalAgentContactReceipt exists, require it was gap-free appended before this attempt,
    resolves this exact acceptance/content/configuration/route and matches primary model ordinal
    or tool child/call identity; otherwise return before URL construction/network
  if optionalReadOnlyToolEntry exists, require it is the exact built-in registry entry whose
    connector kind/route capability/argument/result schemas match this request and require the
    exact request-frozen optionalToolRouteBinding; if neither exists require both are absent
  if config.endpointRoute.visibility == public_path:
    policy = construct policy from public origin/base path + declared routeId
  else:
    policy = vault.resolveRoutePolicy(config.endpointRoute.vaultRoutePolicyId, routeId)
    require policy public origin equals config.normalizedOrigin and policy ID is not
      derived from route/path/query bytes
  sensitiveUrl = vault.constructSensitiveUrl(config, routeId, publicArgs, credentialHandle)
  parsed = vault.parseFinalUrl(sensitiveUrl)
  require parsed.scheme == https and parsed.origin == policy.configuredOrigin
  require parsed.path matches policy.declaredRoute
  require no userinfo and no fragment
  require credential appears only at policy.authorizationPlacement
  response = fetch(sensitiveUrl, {
    redirect: error, credentials: omit, referrerPolicy: no-referrer, cache: no-store,
    headers/body: vault.authorizedRequestParts(policy, credentialHandle) })
  if response is redirect or effective URL/origin differs: fail and destroy handles
  stream bounded response through strict inert parser
  serialize only public citation URLs; reject endpoints/secret params/userinfo/fragments
  return sanitized outcome; never return sensitiveUrl or credential bytes

function firstUsePersistence(choice): CredentialRecord
  if choice encrypted_persistent:
    attempt non-extractable CryptoKey + encrypted record
    on denial: show explicit choice of disclosed browser-local or session-memory
  if choice disclosed_browser_local: require versioned disclosure acceptance
  if choice session_memory: persist no secret bytes

function normalizeConnectorDraft(setup: ConnectorSetupV2): SanitizedConnectorDraftV2
  require connector-worker `normalize_connector_draft` clone command for current epoch/generation
  copy into dedicated mutable endpoint/secret buffers, transfer each once, require sender
    views detached, and validate the final HTTPS endpoint in the vault
  if setup endpoint is public_endpoint:
    reject userinfo, query, fragment and credential-shaped path segments
    expose SanitizedEndpointRouteV2.public_path with its normalized base path
  else sensitive_endpoint:
    parse only inside the vault; reject userinfo or fragment and destroy the ingress buffer
      without serializing either; retain the entire accepted path/query and exact route policy
      only as staged vault material; generate a random UUIDv7 vaultRoutePolicyId independent
      of those bytes; use only fixed dialect tokens or separately random IDs as public routeIds
    expose SanitizedEndpointRouteV2.sensitive_vault_route plus origin-only endpoint label
  validate model ID, dialect preference, auth placement and allowlisted non-secret headers
  reject duplicate headers, undeclared names, CR/LF, authorization/cookie semantics,
    and any header value equal to or shaped like active credential material
  if endpoint is public_endpoint and setup.secretIngress.kind == none:
    require persistenceMode=session_memory and authorization capability starts not_applicable
  if endpoint is sensitive_endpoint, treat its route bytes as credential material even when
    secretIngress.kind == none and apply the selected first-success persistence mode
  create content-addressed draft with createdAt and expiry exactly ten minutes later
  zero-fill worker ingress buffers after import/staging; return no handle or secret-bearing URL

function discardConnectorDraft(draftId, draftHash): ConnectorVaultMutationReceiptV2
  require connector-worker `discard_connector_draft` clone command
  load the exact staged draft or return a typed not-found/expired failure
  destroy its staged endpoint and credential material, then return one sanitized
    `draft_discarded` receipt; timer expiry performs the same destruction without reuse

function commitConnectorConfiguration(draftId, draftHash, confirmationHash):
    sanitized configuration + vault receipt
  load exact unexpired staged draft; verify user confirmation and hashes
  create initial all-not-tested ConnectorCapabilityMatrixV2 bound to configurationHash
  persist complete SanitizedConnectorConfiguration; retain secret as pending first-use
    session material unless user explicitly selected session-only
  for a sensitive route, configurationHash covers only visibility + random vault policy ID;
    accepted path/query bytes remain solely in the staged vault record and rejected
    userinfo/fragment bytes are destroyed without crossing the vault boundary
  destroy staged draft and return sanitized records only

function testConnectorCapabilities(connectorId, disclosureAcceptances): ConnectorCapabilityMatrixV2
  load persisted sanitized configuration and vault secret handle
  require a unique unexpired connector_test acceptance for every exact attempted route/request,
    all bound to this command identity, connector and current configurationHash/origin
  test CORS, authentication, requested dialect, model, streaming, structured output,
    function/tool calling and remote MCP as applicable using guardedFetch with the matching acceptance
  record each exact supported|unsupported|not_applicable state and reason IDs,
    testedConfigurationHash and expiry exactly 24 hours after test
  choose selectedDialect only when supported; persist updated matrix/configuration
  never treat one supported feature as proof of another

function persistConnectorAfterSuccess(connectorId, successfulReceiptId): vault receipt
  verify the referenced capability/agent receipt completed successfully for the same
    connector and current configurationHash
  if configured persistence is encrypted_persistent, import a non-extractable key and
    persist AES-GCM material now; if disclosed_browser_local require prior disclosure;
    session_memory performs no persistence write
  emit one sanitized immutable receipt; refresh can then restore without secret re-entry

function mutateConnectorVault(command): ConnectorVaultMutationReceiptV2
  accept only discard draft, replace, persist-after-success, clear one, remove configuration or
    confirmed clear-all clone commands
  for remove_configuration, write ConnectorRemovalJournalV2 naming the exact public
    configurationHash plus only 0..2 credential and 0..1 sensitive-route counts; the vault
    adapter binds its private IDs internally; disable the connector, destroy those exact vault
    records first, advance counts/phase, then remove configuration and complete the receipt;
    resume that journal after interruption and never expose or enumerate unrelated IDs
  atomically update vault and sanitized configuration as declared for all other actions
  zero-fill received ingress buffers and destroy/drop old in-memory handles;
    return sanitized immutable receipt
```

`clear_secret` destroys the secret and keeps a sanitized configuration; `remove_configuration` destroys both and produces a distinct receipt. Storage denied/private mode never falls back silently. Error/citation/diagnostic serializers perform both pattern rejection and equality checks against active secret values without logging matches.

### LOG-SAVE-001A - typed transactions and crash replay

```text
function applyStorageCommand(command: StorageCommandV2): StorageCommandOutcomeV2
  strict-decode the explicit caller-writable command variant
  if command.action == request_clear_plan:
    require exact confirmation for the immutable plan and dispatch executeClearPlan(plan)
    return its resumable ClearReceipt; do not synthesize a single-store StorageReceipt
  reject any caller attempt to write results, comparisons, cases, briefs, research, agent_receipts,
    site_profiles, connector_config,
    tool_replay, tool_aliases, tool_receipts, migrations, operation_receipts or quarantines
  convert the legal command to a RepositoryMutationV2 inside the repository boundary only
  canonicalCommandHash = hash(exact action,store,recordId,revision,payloadHash,
    complete canonical clearPlan including target set/counts/confirmation when present)
  prior = receiptStore.get(operationId)
  if prior exists and prior.commandHash == canonicalCommandHash: return byte-identical prior receipt
  if prior exists and prior.commandHash != canonicalCommandHash: return operation_id_conflict
  preflight per-record/per-store caps, exact 5,000 total tombstones,
    5,000 receipts, 160 MiB warning and 200 MiB hard total cap
  for result/case deletion require zero live dependent briefs or return blocked with count
  in one IndexedDB transaction:
    verify expected revision
    write either closed StoreRecordV2 live envelope or tombstone; never both payload and deletedAt
    write immutable receipt before commit
  on abort return typed blocked/quota/failure without partial mutation

function restoreScenario(envelope): RestoreOutcome
  strict decode; reject/quarantine stored origin proof or unsupported/corrupt record
  take saved raw draft and immutable refs
  send draft through current normalization/origin-proof LOG-VAL
  preserve immutable refs; show version drift rather than mutating them

function persistToolCompletion(replay, alias, receipt): StorageReceipt
  require repository-only RepositoryMutationV2.append_tool_completion
  require replay.completeReceipt byte-equals receipt and alias.completeReceipt byte-equals receipt
  require operation.toolOperationId is unique across every stored tool alias/receipt/replay
  recompute acyclic replayRecordId, aliasRecordId and tool receiptHash;
    build repository commandHash from append action + toolOperationId + replayRecordId +
    aliasRecordId + tool receiptHash
  construct repository receipt, set replay.transactionReceiptHash to its receiptHash,
    and require result/citation/completion/network fields and all hashes recompute exactly
  require repository receipt action=append, store=tool_replay and recordId=replayRecordId;
    its commandHash also binds the matching tool_receipts record by tool receiptHash
  in one IndexedDB transaction write replay to tool_replay, alias to tool_aliases,
    receipt to tool_receipts and the repository operation receipt;
    abort all writes if any step fails

function persistToolAlias(alias, receipt): StorageReceipt
  require repository-only RepositoryMutationV2.append_tool_alias and unique toolOperationId
  require alias.completeReceipt byte-equals receipt and referenced replay already validates
  atomically write alias to tool_aliases, receipt to tool_receipts and repository receipt
  expose deduped result only after commit; abort all on any failure

function inspectResearch(recordId): ResearchCacheInspectionV2
  load and strict-decode ResearchCacheRecordV2
  expose its sanitizedQuery, connector, result/evidence IDs, source URLs,
    initial/retrieval times, freshness, versions and expiry; expose no credentials

function fetchResearch(request: ResearchFetchRequestV2): ResearchFetchResultV2
  require connector-worker `fetch_research` command and explicit initial/refresh user action
  require request identity equals the WorkerCommandV2 envelope; load the current connector
    configuration and exact ReadOnlyToolRegistryV2 entry for request.toolId
  canonicalize the exact sanitized query/route request bytes; require an unexpired
    direct_research disclosure acceptance matching request/operation/generation, connector,
    configurationHash, origin, routeId, toolId and outboundContentHash
  for refresh, load/verify prior query identity before dispatch
  execute declared read-only connector through guardedFetch and return only strict inert
    ResearchNetworkResultV2, result IDs,
    citations, source URLs, retrieval time and connector schema version
  return no EvidenceId, FactId, authority or freshness field

function compileResearch(request: ResearchCompilationRequestV2): ResearchCompilationOutcomeV2
  require analysis-worker `compile_research` command and strict fetch-result hash
  validate URLs/citations; compile fetched content only as candidate evidence under authority rules
  calculate freshness against request.asOf and policy; assign candidate EvidenceIds/FactIds
    only inside analysis worker
  create initial ResearchCacheRecordV2 for mode=initial
  for refresh, preserve initialRetrievedAt, set retrievedAt/lastRefreshedAt,
    set refreshOfRecordId and create a new immutable revision
  embed exact candidate EvidenceRecordV2/facts and matching ID lists plus the exact
    destination disclosure acceptance hash in the cache record;
    persist its one envelope plus repository receipt atomically after successful compilation
  never relabel or mutate an expired prior record

function executeClearPlan(plan): ClearReceipt
  write plan/initial receipt to separate gridlens_control database first
  resume from control receipt if same plan/hash
  if plan.scope == selected_application_data:
    require includeVault=false and every store is GenericClearableStoreV2;
    reject connector_config, connector targets or a silently broadened clear
  else all_application_and_connectors:
    require includeVault=true and stores equal the canonical complete StorageStoreV2 set
    enumerate every current sanitized connector through the connector adapter only; require
      the displayed connectorTargets/config hashes/credential counts/route-policy counts and
      confirmation hash equal that exact set before any mutation
    disable all targets; for each target destroy only its named vault records, commit progress,
      then remove its matching connector_config record and commit progress
    if vault destruction fails leave that target's configuration intact; after destruction,
      an interruption resumes configuration removal and can never leave a secret orphan
    mark vault and connector_config complete only after every frozen target is complete
  if plan selects any of tool_replay|tool_aliases|tool_receipts, require the displayed
    plan includes all three stores and delete aliases/receipts before their replay records
  if plan selects results or cases, require it includes all dependent briefs and delete
    those brief records before their referenced sources
  clear one remaining declared application store per committed transaction, excluding
    operation_receipts until last, and update control receipt after each
  clear operation_receipts last; never clear gridlens_control in-app
  interruption leaves pending store list in control database and resumable=true
```

V1 retains tombstones and receipts until a user-approved clear/export; no automatic compaction can resurrect deletion or erase idempotency. Research expiry becomes a visible clear plan, never background silent loss.

### LOG-OFF-001A - serialized no-skipWaiting updates

```text
on manifest discovery:
  if candidate exists: queue newest manifest hash; do not parallel-download
  create generation-specific candidate cache
  fetch/hash/parse every required asset; on any failure delete candidate cache only
  mark verified_waiting; notify every controlled client with update_ready

on client reply:
  record ready or busy for that client
  do not call skipWaiting
  busy client offers cancel/finish; immediate reload disabled while operation active

activation condition:
  old worker activates only through normal lifecycle after all old clients
  close, navigate or explicitly reload
  new client boot independently revalidates candidate manifest and bound assets
  atomically label candidate active; retain previous verified generation for rollback
  process queued newer manifest after terminal state

on cache quota/storage pressure:
  remove candidate and unpinned inactive optional caches only
  preserve active shell/core and saved/vault data
```

BroadcastChannel is an optimization only. `clients.matchAll()+postMessage` drives the same state machine when it is missing. Optional cache keys include generation ID, so two generations never share mutable response bytes.

### LOG-EMI-001A - effective joins, exact interval aggregation and publication

```text
function compileEmi(candidateWindow, schema, nspRows, authorityRules, qualityPolicy): EmiPublishOutcome
  require qualityPolicy exactly equals approved Balanced EmiQualityPolicyV1 version 1.0.0
  expectedInstants = enumerate NZ trading days as UTC instants;
    ordinary=288, spring-forward=276, fall-back=300 at five-minute cadence
  staged = strict-stream source rows under byte/row caps
  require exact columns, offset-bearing IntervalDateTime, MW and NZD/MWh units, RTD case

  partitions = group by schema.businessPartitionFields
  for partition in partitions:
    choose greatest RunDateTime then greatest lexicographic CaseID
    within the chosen run, group by exactSourceRowIdentityFields
    byte-identical duplicates: dedupe and count
    same exact source-row identity with differing business values: unconditional failure
    preserve UTC instant, NZ local time, offset and DST fold

  for each observed POC at each instant:
    effective = NSP rows where composite ID/POC are nonempty and instant lies in
      [effectiveFrom,effectiveUntil), resolving date+trading-period boundaries
    require current/effective flags consistent for selected mapping release
    if none: exclude no_effective_nsp
    if coordinates disagree and no exact authority rule selects one: exclude coordinate_conflict
    if coordinate parse/range/transform invalid: exclude invalid_coordinate
    else transform EPSG:2193 -> EPSG:4326 with pinned version
      assign Stats GeographyId by LOG-GEO inclusive point-in-polygon;
      boundary tie chooses lexicographically smallest ID and records tie;
      no match excludes stats_boundary_unmatched
    retain each NSP networkReportingRegionId as separate network dimension

  for each interval+POC:
    loadRow = unique selected UnitCode=N/A row
    generationRows = unique selected non-N/A UnitCode rows
    load = loadRow.LoadMegawatts or missing
    price = loadRow.DollarsPerMegawattHour or missing
    generation = sum generationRows.GenerationMegawatts
  for each interval+Stats geography:
    load = sum unique present POC loads
    generation = sum unique unit generation values
    priceNumerator = sum(load[p]*price[p]) for unique POCs with load>0 and price present
    denominator = sum(load[p]) for same POCs
    price = null if denominator==0 else numerator/denominator
    set capacityInferenceAllowed=false

  eligibleNationalPocs = union of observed POCs with effective non-conflicting NSP mapping
  eligibleStatsPocs[g] = subset with valid coordinate transform and Stats polygon assignment g
  coverage.sourceTime = observed expected instants / expected instants
  coverage.national = observed distinct (instant,eligibleNationalPoc) /
    (expected instants * eligibleNationalPocs)
  coverage.statsGeography[g] = observed distinct (instant,eligibleStatsPoc in g) /
    (expected instants * eligibleStatsPocs[g])
  assert all denominators and exclusions recorded

  if any qualityPolicy unconditional failure condition occurred: return not_published
  if all complete thresholds met: return complete
  if national partial thresholds met:
    suppress each geography below per-geography partial threshold
    if no geography remains: return not_published
    return partial with exact qualification and suppressed IDs
  return not_published below_partial_threshold

function chooseRollingWindow(latestPublishedDay, policy): WindowOutcome
  for back in 0..policy.maximumBackwardSearchDays:
    end = latestPublishedDay - back days, exclusive at next NZ midnight
    start = same NZ calendar date 12 months earlier
    outcome = compileEmi([start,end), ...)
    if outcome complete: return outcome
    retain newest partial candidate for labelled fallback
  return newest partial if policy permits; otherwise not_published(no_window_within_search_horizon)
```

Source-time, eligible-POC and geography denominators are independent. A partial geography is never relabelled complete because national coverage passes. Power remains MW per instant; no sum across instants becomes power/capacity/headroom. Energy, if displayed, integrates MW by actual interval duration and is labelled MWh. Balanced v1 uses complete thresholds `0.90/0.85/0.70`, partial thresholds `0.75/0.65/0.50`, and a 45-day backward search.

### LOG-DOC-001A - extraction verification and case construction

```text
function prepareDocument(bytes, metadata, extractor): PreparedDocument
  verify content hash and allowed document type; extract under resource cap
  for each proposed statement:
    require exactly one nonempty PageLocatorV2 variant
    create candidate with document hash, statement hash, method/version and proposed type
    create no evidence/edge IDs
  curator action accept/accept_with_correction/reject creates immutable verification receipt
  only curator_verified statements may compile EvidenceRecordV2/Facts/Edges
  rejected/candidate statements remain visibly non-authoritative and edge-free

function buildTimeline(verifiedEvents, evidenceSnapshot): Timeline
  require every prepared event has nonempty evidenceIds
  resolve current qualifying project_event_date facts from the same snapshot
  if none: ProjectEventDateV2.undated with exact MissingRecords
  else if exact dates all agree: ProjectEventDateV2.exact with FactIds
  else if exact/range values have nonempty intersection:
    ProjectEventDateV2.range using exact intersection and FactIds
  else: ProjectEventDateV2.disputed with every candidate date/range,
    nonempty FactIds and ConflictIds; sort after exact/ranged peers by eventId

function freezeProjectCaseV2(parts, snapshot, release): ProjectCaseV2
  require exactly ten CaseSection keys and every event is ProjectEventV2
  require CaseSourceCounts invariant and distinct community/mana-whenua/missing-voice records
  resolve exact trusted statement, unresolved-question, company identity and claim-role records;
    require every ID/hash/locator uses the same immutable EvidenceSnapshot closure
  bind evidence/graph/catalog/release hashes, canonicalize and hash; reject partial trusted text

function countCaseSources(snapshot, requiredSlots): CaseSourceCounts
  for each evidence record exactly once:
    if AI candidate: aiCandidate++
    else if developer claim: developerClaim++
    else switch frozen freshness state:
      stale -> staleOther++
      unknown -> unknownOther++
      future_invalid -> futureInvalidOther++
      forecast_expired -> forecastExpiredOther++
      current|forecast_valid -> currentOther++ when authorityClass is
        qualifying_authoritative, else nonqualifyingOther++
  assert totalEvidenceRecords == sum of all eight mutually exclusive buckets
  missing = count required slots lacking an authorized record
  conflicting = count conflict records
```

Case files instantiate all ten fixed sections, each `complete|partial|missing`. Community records, mana whenua records and missing voices remain distinct nodes and views.

### LOG-VIS-001A - trusted resolver and one semantic accessible view

```text
function resolveVisual(specBytes, projection, dataRegistry): VisualOutcomeV2
  strict-decode VisualSpecV2; reject oversize, unknown fields/primitives/bindings/
    annotations/filters/executable content
  if spec.visualKind == data_visual:
    require primitive is not narrative_panel and bindings are nonempty
    evaluate only the closed non-recursive VisualFilterV2; require depth=1,
      nodeCount=predicates.length in 1..20 and total nodes <=21
    resolve every fieldSchemaHash; require exact scalar-kind/unit compatibility,
      numeric/local-date-only ordering/ranges, enum-only one_of, minimum <= maximum and
      both-inclusive when minimum == maximum
    evaluate a missing/null referenced value as false for that predicate, then apply
      ordinary all|any combination; never coerce null to zero/empty text
    reject HTML, URLs, expressions, script-like text, unknown operators, coercion,
      empty ranges or unit conversion inside a filter
    for every series:
      resolve only declared trusted data IDs
      require nonempty lineage with current content hashes
    for every annotation:
      trusted_data_point -> resolve authorized TypedScalar and lineage
      source_statement -> validate citations and EvidenceIds
      model_inference -> require visible label, uncertainty and basis data lineage
      uncertainty -> require visible label, affected series and lineage
      otherwise reject unsupported factual text
  if spec.visualKind == narrative_panel:
    require primitive == narrative_panel and no bindings/series fields are present
    for every block require nonempty citation/evidence IDs, resolve each against the
      projection/evidence snapshot, reject forged/missing citations and attach lineage
  construct ResolvedVisualModelV2 and complete VisualExecutionReceipt
  construct one AccessibleVisualEquivalent with label, summary, table, sources, disclaimer
  return VisualOutcomeV2 complete containing model, receipt and equivalent
  render screen from outcome.equivalent; copy/export serialize the same semantic object
  assert semantic hashes equal across screen/copy/export
  on any failure return VisualOutcomeV2 failed with trusted fallback/equivalent and typed reason
```

Endpoint and model are sanitized labels, never URLs or keys. Regeneration always produces a new receipt/spec hash and never replaces the prior deterministic result snapshot.

### LOG-ROUTE-001 - history, deep links and guided education

```text
function serializeRoute(route, release): WorkflowState
  keep only version, typed route, immutable hashes and optional draft ID/revision
  reject secret, free-text answer, identity/opinion or whole mutable payload
  canonicalize and hash

function restoreRoute(serialized): RestorationOutcome
  strict-decode version and route variant
  resolve every immutable ID by content hash
  for map/project routes resolve feature + layer/statement/company/catalog records from retained pack
  for case routes resolve ProjectCaseV2 plus embedded catalog/graph/community/question/
    missing-voice/statement/company/claim closure
  for brief routes strict-load the ImpactBriefV2 envelope, trusted text/company closure and snapshots
  for evidence routes resolve EvidenceSnapshot plus strict locator/graph/text/company closure
  if current release differs: preserve immutable view and show version notice
  if mutable draft exists: restore via LOG-SAVE/VAL renormalization
  if missing/unsupported: route to map with exact non-destructive explanation

function advanceEducation(state, answer): GuidedEducationState
  accept only controlled relationship, region-level location and issue choices
  display source-linked raw values before an explanation
  ask what remains unclear using controlled answer
  retain state only in memory; destroy on completion/navigation/reload
```

Back/forward replay restoration, not application-side mutation. Deep links never embed credential/configuration, unsaved free text or user identity.

### LOG-REGISTRY-001 - exact sources and capability fallbacks

```text
function validateFirstSourceRegistry(entries): BuildOutcome
  expected = exact 17 canonical source names in CTR-020
  require set(entries.canonicalName) == expected and no duplicates
  require every shippedState in exact {enabled,prepared-only,link-only,agent-only,disabled}
  require exact legal shippedState/retrievalMode pair and every reason nonempty
  require every entry declares authority purposes, supported fields, retrieval/auth/CORS,
    methods/origins, licence/attribution/purpose, quota/cadence, spatial/temporal
    resolution and fallback exactly as applicable
  enabled entry must pass schema/route/licence/freshness/CORS adapter fixture
  require every DataPackManifestV2 source binding matches registry source/licence/purpose
  disabled entry must pass a fixture proving its stated reason and UI label
  fail release on any mismatch

function capabilityPlan(detected): CapabilityPlan
  no WebGL -> accessible list + static bounded preview
  no IndexedDB -> session draft + export guidance
  no persistent CryptoKey -> explicit disclosed-local/session choice
  no BroadcastChannel -> clients.matchAll/postMessage
  no Clipboard -> selection/manual copy
```

Release tests run current Chromium, Firefox and WebKit desktop plus mobile-equivalent and real-device smoke. Support is not waived because a CI host lacks a feature; the fallback is exercised instead.

### Resource enforcement and updated invariants

Every producer checks CTR-021 and CTR-015A budgets. Downloads and compiler rows are streamed and aborted at the first byte/row beyond the cap. Worker queue overflow rejects newest requests with stable retry guidance. Cache eviction is generation-aware. Storage cap failures never truncate, overwrite or compact. Add these invariants:

| ID | Invariant |
|---|---|
| INV-029 | Flexibility physical feasibility and optimality are exact rational primal/dual facts; audit tolerance cannot create capacity. |
| INV-030 | Deterministic assessments consume only closed decisive-input references: authorized FactIds from one immutable evidence snapshot, normalized scenario OriginProofs, and calculation/flexibility trace refs. |
| INV-031 | A connector worker never calls the analysis worker and never follows redirects. |
| INV-032 | Same persistence operation ID with a different command hash is a conflict, never a replay. |
| INV-033 | No service-worker candidate replaces an active generation while any old-generation client remains open. |
| INV-034 | Every rendered visual fact has typed lineage and identical semantic content across screen, copy and export. |
| INV-035 | Every public EMI statistic carries independent source-time, national POC and Stats-geography coverage. |
| INV-036 | Every locator, layer, statement, unresolved-question, missing-voice, company/claim-role, catalog, pack, evidence edge/graph, community, case and brief ID/hash resolves to one strict effective V2 record in the retained release/device generation; question scope/subject pairs use the closed matrix and no brief hash is a question subject. |
| INV-037 | A sensitive endpoint exposes only normalized origin, sanitized label and random opaque route-policy IDs; path/query bytes remain vault-only and never affect public hashes. |
| INV-038 | Cancellation names one exact original worker/correlation tuple; every external model/research/tool request has an exact destination/content acceptance, actual contacts are separately receipted, each enabled tool has one request-frozen read-only route, and every agent request enforces all declared token, request, call, time, retry, concurrency, citation and research ceilings. |

### v0.10 review-closure traceability

| Review finding | Logic |
|---|---|
| LR3-001 | LOG-FLX-001A |
| LR3-002/003 | LOG-EVD-001A, LOG-ASM-001A |
| LR3-004 | LOG-SITE-001A and approved separate-group map policy |
| LR3-005/006 | LOG-AGENT-001A, LOG-CONN-001A |
| LR3-007 | LOG-BOOT/PACK-001A |
| LR3-008 | LOG-SAVE-001A |
| LR3-009 | LOG-OFF-001A |
| LR3-010 | LOG-EMI-001A and approved Balanced quality policy |
| LR3-011 | LOG-DOC-001A |
| LR3-012 | LOG-VIS-001A |
| LR3-013 | LOG-ROUTE-001, LOG-REGISTRY-001, resource enforcement |
| G3V05-001 | LOG-ASM-001A total category/overall producers |
| G3V05-002 | LOG-SITE-001A five outcomes, three groups and user confirmation |
| G3V05-003 | LOG-WORKER-001A closed coordinator graph |
| G3V05-004 | LOG-WORKER/AGENT/SAVE/VIS strict union dispatch |
| G3V05-005 | LOG-AGENT-001A and LOG-SAVE-001A atomic tool completion |
| G3V05-006 | LOG-SAVE-001A inspect/refresh research lifecycle |
| G3V05-007 | LOG-DOC-001A eight-bucket source counting |
| G3V05-008 | LOG-VIS-001A discriminated narrative resolution |
| G3V06-001 | LOG-GEO/SITE/WORKER/CONN closed operation graph |
| G3V06-002 | LOG-CONN normalized draft, capability, first-success persistence and restore |
| G3V06-003 | LOG-SAVE connector fetch -> analysis compile -> atomic research record |
| G3V06-004 | LOG-SITE missing/partial preservation and observed-only failure |
| G3V06-005 | LOG-AGENT/SAVE durable aliases with unique child operation IDs |
| G3V06-006 | Closed JSON roots plus separately guarded structured-clone contract |
| G3V06-007 | LOG-VIS exact non-recursive filter boundary and scalar semantics |
| G3V07-001 | LOG-PRODUCT-001B plus closed WORKER/PACK/SAVE/ROUTE/REGISTRY producers |
| G3V07-002 | LOG-CONN public-path versus sensitive-vault-route handling and canary-free hashes |
| G3V07-003 | LOG-WORKER exact cancellation target/ack plus LOG-AGENT complete limit guards/counters |
| G3V08-001 | LOG-WORKER command-family cancellation plus LOG-AGENT final/queued cancelled receipts |
| G3V08-002 | LOG-PRODUCT destination disclosures, LOG-AGENT registry/authorization handshake and LOG-CONN guarded binding |
| G3V08-003 | LOG-CONN per-connector journal plus LOG-SAVE closed selected/all clear variants |
| G3V08-004 | LOG-EVD/PRODUCT/PACK/DOC strict locator and complete layer/text/company product closure |
| G3V09-001 | LOG-AGENT common outbound authorization, request-frozen tool routes and separate accepted/contacted receipts |
| G3V09-002 | LOG-AGENT pre-allocation alias lookup, bounded request classifications and one receipt per new logical call |
| G3V09-003 | LOG-PRODUCT closed question matrix and one-pass brief hashing without brief subjects |

## Version 0.11 reconciliation — working map and server-managed provider flow

This section is normative and retires the browser credential vault, connector setup UI, direct browser model/Tavily/MCP fetch, CORS capability probing, per-destination user acceptance, and per-connector secret-clear logic. Existing deterministic calculation, assessment, evidence, report, and safe-visual logic remains valid unless explicitly changed below.

### New and revised invariants

| ID | Invariant |
|---|---|
| INV-039 | Exactly the 17 `RegionIdV3` values exist in the pinned region asset; bytes, feature count, IDs, geometry types, coordinate range, edition, and checksum validate before polygon selection is enabled. |
| INV-040 | Polygon, marker, list, search, coordinate, restore, pointer, touch, and keyboard selection converge on one `SelectRegionCommandV3` and one application selection state; no renderer owns a second truth. |
| INV-041 | Basemap, region geometry, and marker readiness are independent. Basemap or marker failure cannot disable valid pinned polygon/list selection or deterministic analysis. |
| INV-042 | Candidate marker symbols remain visible at the national starting zoom and their pointer/touch hit layer is at least 24 CSS pixels in diameter; keyboard/list alternatives expose the same stable ID and outcome. |
| INV-043 | Provider credentials, raw/private provider endpoint paths, model IDs, authorization headers, upstream bodies, and reasoning channels are server-only and cannot enter any client-reachable graph. |
| INV-044 | Browser provider requests are same-origin closed-schema operations with no dynamic destination, credential, header, method, model, redirect, or arbitrary tool field. |
| INV-045 | Server outbound destination, method, path, model, authorization placement, and tool registry derive only from validated operator configuration and code-owned constants. User/model/research content cannot alter them. |
| INV-046 | A provider failure, cancellation, timeout, quota, malformed response, or unavailable configuration never mutates or hides deterministic map/scenario/result/evidence/report state. |
| INV-047 | Public errors and logs are created from stable internal categories. They contain no upstream body, secret, private endpoint, prompt/context body, stack, or reasoning text. |
| INV-048 | Local `TEST.md` is read only by the development configuration boundary. Production modules, client bundles, public assets, archives, responses, logs, tests snapshots, and committed files contain zero exact credential/endpoint canaries from it. |
| INV-049 | The private hackathon deployment is the current access boundary. Deployment to public anonymous access is blocked until durable rate/cost/abuse controls are approved and tested. |

### LOG-MAP-002 — Load and verify selectable region assets

```text
loadSpatialAssets(manifest, regionUrl, preparedSites, signal): MapReadinessV1
  transition basemap, regions, markers independently from idle -> loading

  regionTask := fetch same-origin regionUrl(no-store, signal)
    require response.status == 200
    require response bytes <= 2 MiB
    require sha256(response bytes) == manifest.sha256
    parse closed RegionFeatureCollectionV3
    require feature count == 17
    require exact ID set == manifest.regionIds == RegionIdV3 set
    for each feature:
      require feature.id == feature.properties.regionId
      require Polygon or MultiPolygon, finite coordinates, closed rings
      require every coordinate lies in declared NZ/Chatham bounds
    transition regions -> ready(version=manifest.edition,count=17)
  on any region failure:
    transition regions -> failed(publicCode=region_asset_invalid,retryable=false)

  markerTask := validate preparedSites
    require unique SiteId, valid owning RegionIdV3, finite WGS84 point
    require exact five outcome -> three group mapping
    transition markers -> ready(count=preparedSites.length)
  on marker failure:
    transition markers -> failed(publicCode=marker_asset_invalid,retryable=false)

  basemapTask := initialize external raster source independently
  on basemap failure:
    transition basemap -> failed(publicCode=basemap_unavailable,retryable=true)

  interactive := regions.ready OR accessibleKnownRegionIndex.ready
  return states without waiting for model/research health
```

Preconditions: the build produced a matching manifest and file; static known region labels are available for accessible fallback. Postconditions: no unverified geometry becomes interactive; a failed basemap cannot blank the pinned overlay. Complexity is O(total geometry coordinates + markers), bounded by the asset byte ceiling and marker pack count.

### LOG-MAP-003 — Install MapLibre layers idempotently

```text
installGridLensLayers(map, verifiedRegions, preparedSites):
  on every style.load generation:
    if source missing, add region source with promoteId="regionId"
    if source missing, add site source with generateId=false
    ensure exact layer order:
      basemap
      regions-fill            // low-opacity selectable surface
      regions-outline
      regions-selected-outline
      site-hit-targets        // transparent >=24px effective diameter
      site-halos
      site-symbols
      site-labels when collision permits
    attach each semantic listener once for this style generation
    set initial feature state for selected/hovered region and selected site
    publish observed feature and marker counts
```

The overlay style uses non-colour selection: thicker outline, changed opacity, and selected-region/site text. Map wash/title/legend overlays have `pointer-events:none` except their explicit controls. A marker event handles the marker first and stops any duplicate polygon activation for the same pointer operation.

### LOG-MAP-004 — Canonical region selection

```text
selectRegion(command: SelectRegionCommandV3, current, generation):
  validate closed command and RegionIdV3
  if command.operationId already completed: return prior receipt
  if command generation < latest accepted generation: return stale_ignored

  if command.selectedSiteId exists:
    site := preparedSites.byId(command.selectedSiteId)
    require site.regionId == command.regionId
  if command.candidatePoint exists:
    resolved := pointInPinnedRegions(command.candidatePoint)
    require resolved matches command.regionId using lexical border tie

  next := RegionSelectionV3(command fields, manifest.edition, now)
  atomically replace application selection and latest generation
  renderer sets region/site feature state
  scenario/evaluation selectors derive from next.regionId/siteId
  accessible status announces region, exact outcome/group when site selected
  if source is list/search/restore and region not visible:
    fit verified geometry bounds with reduced-motion-safe duration
  if regionId == "99":
    focus the Chatham/Area Outside Region inset or wrapped geometry
  return accepted receipt
```

Pointer flow: query rendered marker hit layer first; if a marker exists dispatch its site/region command; otherwise query region fill layer and dispatch polygon command. Clicking ocean/outside recognized geometry changes nothing and gives no nearest-region substitution. List/search/coordinate sources call the same operation.

### LOG-MAP-005 — Visible readiness and recovery

| Regions | Markers | Basemap | Public state |
|---|---|---|---|
| ready | ready | ready | Full map interaction |
| ready | ready | failed | Pinned polygons and markers on neutral background; retry basemap control |
| ready | failed | any | Polygon/list interaction; visible marker-pack error |
| failed | ready | any | Markers/list only; geometry-dependent point selection disabled and qualified |
| failed | failed | any | Accessible region index and deterministic preset paths only; map error panel |

No empty unlabeled map is a valid terminal state. A retry creates a new asset generation; late work from an older generation is discarded.

### LOG-CONFIG-002 — Resolve operator provider configuration

```text
resolveOperatorConfig(env): ConfigOutcome
  read named server bindings only
  trim and validate configured values without logging them
  require model base URL is HTTPS, fixed origin/path policy passes,
          no userinfo/fragment, model ID length valid, API key nonempty
  Tavily base URL is compile-time constant; optional key enables research
  optional MCP URL must match operator allowlist and allowedTools exact subset
  return server-only OperatorProviderConfigV1
  on missing/invalid values:
    return unavailable categories without returning offending value
```

Local development logic:

```text
loadLocalDemoBindings():
  execute only inside Vite/Worker configuration when mode=development
  if ignored TEST.md exists:
    parse the three labelled values in memory
    map them to Worker environment bindings
    emit only boolean presence diagnostics
  else configure providers unavailable
```

The parser module is excluded from client and production Worker import graphs. Hosted values come from Sites runtime secrets. Secret rotation changes environment revision, not browser code or storage.

### LOG-PROVIDER-001 — Public health projection

```text
getProviderHealth(request, env): ProviderHealthResponseV1
  require same-origin request context
  if valid cached sanitized health age <=30s: return it
  config := resolveOperatorConfig(env)
  for each configured provider within a shared short deadline:
    run minimum capability call with server credentials
    map result to ready|limited|unavailable and public capabilities
    never include URL, model ID, status body, header or secret
  cache sanitized projection only
  return closed ProviderHealthResponseV1
```

Health is advisory. Each ordinary request revalidates configuration and handles current failure. A capability probe never returns or stores secret material.

### LOG-PROVIDER-002 — Common same-origin route guard

```text
guardProviderRequest(request, schema, bodyLimit): GuardedRequest
  require expected method and path selected by code router
  require Content-Type exactly application/json for POST
  require request URL origin equals service origin
  require Origin absent or equals service origin
  require Sec-Fetch-Site absent|same-origin|same-site as deployment policy permits
  stream-read body with bodyLimit; abort and reject overflow
  parse JSON once; reject duplicate keys/prototype pollution where parser exposes it
  validate exact closed schema and semantic limits
  acquire isolate concurrency permit(max=4) or return rate_limited
  bind request.signal and correlationId
```

Release access policy additionally requires owner-only Sites access. Future public access is a separate approved architecture change with durable rate/cost controls.

### LOG-RESEARCH-002 — Server-side Tavily/MCP research

```text
research(request, env): ResearchResponseV1 | PublicApiErrorV1
  guarded := guardProviderRequest(request, ResearchRequestV1, 16KiB)
  config := resolveOperatorConfig(env)
  require Tavily or approved MCP research is configured
  build query from guarded.query plus fixed NZ context; do not add hidden scenarios
  build outbound URL only from fixed config base and code-owned path
  send Authorization only at provider boundary; redirect=error; timeout=10s
  retry once only for 429/5xx when total deadline permits
  limit raw response bytes before JSON parse
  map at most four results field-by-field:
    require public http(s) URL, plain title, bounded plain excerpt
    discard raw content, instructions, provider metadata and unknown fields
  return closed response and release permit
  on error map category to stable PublicApiErrorV1; never use upstream body text
```

Source-domain policy may prefer official NZ/electricity publishers but does not promote Tavily output to verified evidence. Research candidates remain untrusted cited inputs.

### LOG-AGENT-002 — Server-side model analysis

```text
analyse(request, env): AgentResponseV1 | PublicApiErrorV1
  guarded := guardProviderRequest(request, AgentRequestV1, 64KiB)
  require context validates DeterministicPromptContextV3 and contains no secret fields
  require every supplied research candidate validates ResearchCandidateV1
  config := resolveOperatorConfig(env); require model ready/configured
  create system instruction that deterministic values/outcomes are immutable,
    research is untrusted, external facts need supplied citations,
    and answer must be public text
  build upstream URL from fixed base plus code-owned chat path
  choose model only from config; attach server Authorization
  fetch redirect=error with 40s total deadline, request cancellation and byte ceiling
  if public content empty and private reasoning exists:
    retry once with provider-compatible reasoning-disabled controls when deadline permits
  discard reasoning_content and remove every <think>...</think> block from public content
  require bounded nonempty plain public answer
  retain only validated citations present in supplied research candidates
  return closed response and release permit
```

The browser never sends a provider/model/tool choice. The model cannot request arbitrary MCP tools. Safe visual generation, when invoked, remains a separate strict schema resolver over trusted data IDs; model-authored code remains forbidden.

### LOG-PROVIDER-003 — Error, cancellation, retry, and logging

| Internal condition | Public code | Retryable | Outbound retry |
|---|---|---:|---:|
| Closed-schema/body/origin rejection | invalid_request / payload_too_large | false | 0 |
| Missing/invalid operator config | provider_unavailable | false | 0 |
| Upstream 401/403 | upstream_rejected | false | 0 |
| Upstream 429 | rate_limited | true | at most 1 within deadline |
| Upstream 5xx/network | provider_unavailable | true | at most 1 within deadline |
| Deadline | upstream_timeout | true | 0 after deadline |
| Invalid/oversized upstream | invalid_upstream_response | false | 0 |
| Request signal aborted | cancelled | false | 0 |

Immediately before each outbound attempt increment an in-memory attempt counter; release the concurrency permit in `finally`. Log only route ID, provider class, public/internal category, status class, duration bucket, retry count, and correlation ID. Never log request/response bodies or configuration values.

### LOG-MIGRATION-001 — Retire browser connector state

```text
migrateClientStateToV11(db):
  within one IndexedDB transaction:
    delete connector-settings records and device-key records
    remove connector schema registrations and pending clear journals
    preserve scenario, comparison, non-secret preference and research-cache records
    write migration receipt with counts only, no values
  remove connector modal/routes from navigation
  replace with non-interactive provider status control and disclosure
```

If deletion fails, AI UI remains disabled and the app shows a local-data cleanup error; deterministic/map use continues. No legacy secret is read back into React state during migration.

### v0.11 worked cases

1. **Interior polygon click:** click inside Waikato with no marker under pointer → `regionId=03`, source `polygon_pointer`; the Waikato outline, panel, scenario and evaluation update once.
2. **Marker over polygon:** click Auckland marker → one command with Auckland site and `regionId=02`; the underlying region click is suppressed.
3. **Basemap blocked:** raster request fails → neutral background plus verified region fills/markers remains interactive; no empty-map terminal state.
4. **Chatham selection:** activate region `99` through its mapped inset/list → same RegionSelectionV3 and geometry edition; missing evidence stays explicit.
5. **Forged agent endpoint:** browser adds `endpoint` or `model` → closed-schema rejection, zero outbound attempts.
6. **TEST canary:** local config loads values in memory; client bundle/public response/source scan returns zero exact matches.
7. **Model reasoning-only first result:** first public content empty → one bounded reasoning-disabled retry; only final public content is returned, with reasoning discarded.
8. **Tavily outage:** research returns scoped unavailable; prompt may still explain prepared deterministic context; outcome and map selection remain unchanged.

### v0.11 traceability

| Requirement / acceptance | Logic and invariants |
|---|---|
| FR-LOC-001–004, FR-MAP-001–004, AC-001/023 | LOG-MAP-002–005, INV-039–042 |
| FR-CONN-001–008, AC-010–013 | LOG-CONFIG-002, LOG-PROVIDER-001–003, LOG-RESEARCH-002, LOG-AGENT-002, INV-043–049 |
| FR-SAVE-001–002, AC-020 | LOG-MIGRATION-001 plus existing non-secret storage logic |
| NFR-PER-001, NFR-REL-002, NFR-ACC-001 | independent map readiness, bounded provider work, LOG-MAP-002–005 |
| NFR-SEC-001–002, NFR-PRI-001, NFR-OBS-001, AC-011/012/021 | LOG-CONFIG-002, LOG-PROVIDER-002–003, INV-043–049 |
| NFR-DEP-001 | single Worker route topology and v0.11 migration/deployment flow |

## Version 0.12 reconciliation — closed map and orchestrated provider logic

This section implements CTR-029–036 and closes G3V11-001–012. INV-039–049 remain only where consistent with the following invariants.

### Revised invariants

| ID | Invariant |
|---|---|
| INV-050 | `RegionId` is the only current geography identity. Map, scenario, evidence, results, routes, caches, prompts, visuals, reports, and exports serialize the same two-character value. |
| INV-051 | The selection store allocates every monotonic generation. A lower generation never commits; one operation ID returns one byte-identical receipt. |
| INV-052 | Pointer and coordinate selections derive region from all pinned polygon matches and the lexical boundary rule; renderer feature order and caller-provided region are never authority. |
| INV-053 | Project and screened-candidate markers are distinct closed variants. A polygon/list/search selection clears marker selection; marker selection derives its owning region from the verified marker pack. |
| INV-054 | Region manifest, geometry, and markers are one immutable core release generation. Only verified candidate bytes activate; the prior active generation remains available offline and after candidate failure. |
| INV-055 | The public/client schema graph is exactly `GridLensPublicContractV3`; the server configuration graph is exactly `GridLensServerContractV1` and is unreachable from the client graph. |
| INV-056 | Provider destinations are exact approved public HTTPS origins and paths. No request/model/tool content can select a destination, method, header, model, tool, redirect, or retry. |
| INV-057 | Agent research is performed server-side in the same operation. `/agent` never accepts browser research candidates and model citations can reference only sanitized candidates minted in that operation. |
| INV-058 | Every provider leaf and final response byte stream passes the active-secret/private-endpoint egress guard; a match discards the whole result without logging the match. |
| INV-059 | Each provider has at most one outbound attempt per public operation. Raw byte, time, concurrency, and structured-result bounds apply before public projection. |
| INV-060 | Tavily/MCP use `server_provider`; current caches/routes contain no connector identity. Legacy cache content is stale/nonrefreshable or quarantined, never silently rebound. |

### LOG-SCHEMA-003 — Compile the only effective roots

```text
compileEffectiveContracts(): artifacts
  publicGraph := transitiveClosure(GridLensPublicContractV3)
  require every reference declared exactly once
  require all JSON encodings closed, bounded, duplicate-aware and finite
  reject retired connector/vault/acceptance/connector-route roots
  emit TypeScript + strict JSON Schema + runtime decoders from publicGraph

  serverGraph := transitiveClosure(GridLensServerContractV1)
  require server-only module boundary and no React/RSC/client import path
  emit TypeScript/runtime guards only; emit no JSON Schema or public serializer

  compile explicit deterministic adapters using RegionId exactly
```

Any unresolved scalar, open object, ambiguous set encoding, `any`, connector import, or server-to-client dependency fails the build.

### LOG-ASSET-003 — Prepare, activate, and recover core spatial assets

```text
prepareSpatialRelease(sourceBytes, releaseId): candidate
  verify Stats layer identity, licence, 17 exact source codes and names
  normalize source codes 1..9 -> 01..09 once; retain 12..18 and 99
  transform to WGS84; generalize at 0.0005 degrees; precision=5
  compute a valid label point inside each region geometry
  compile exact RegionFeatureCollectionV3 and MarkerPackV3
  hash canonical prepared bytes; bind manifest/geometry/markers to releaseId
  reject any missing/duplicate/invalid/mismatched item

activateSpatialRelease(candidate): activation receipt
  fetch immutable same-origin core assets through the release cache
  stream-hash bytes before parse and validate closed schemas
  atomically mark the complete generation active
  retain prior verified active generation for rollback/offline
  transport failure => retryable scoped error; integrity/schema failure => nonretryable candidate rejection

bootSpatialRelease(): active assets
  prefer active verified cached generation
  network checks may discover a newer manifest without bypassing active cache
  never use no-store for an already active immutable region asset
```

### LOG-SELECT-003 — Allocate and commit canonical selection

```text
dispatchSelection(intentWithoutGeneration): SelectionReceiptV3
  generation := selectionStore.nextGeneration()
  operationId := caller id or new UUIDv7
  command := exact intent + generation

  if operationId exists:
    if canonical command hash matches, return prior byte-identical receipt
    else return invalid receipt

  if command source is polygon pointer/touch:
    require pointerPoint and no requestedRegionId
    matches := pointInAllVerifiedRegions(pointerPoint)
    regionId := lexicalMinimum(matches)
    if no match, return invalid without changing selection
  else if command source is coordinate:
    matches := pointInAllVerifiedRegions(point)
    next := matches empty
      ? unresolved_point(point, outside_verified_regions)
      : selected_region(lexicalMinimum(matches), candidatePoint=point)
  else if marker source:
    marker := verifiedMarkerPack.byId(markerId)
    next := selected_region(marker.regionId, selectedMarkerId=markerId)
  else:
    require requestedRegionId; next := selected_region(requestedRegionId); clear marker

  if generation < selectionStore.latestGeneration: return stale_ignored receipt
  atomically commit next + generation + receipt
  derive map state, scenario, evidence, prompt context and exports from next
```

Rapid pointer/list/search/restore permutations, shared-edge feature-order permutations, duplicate commands, and stale async callbacks use this function. An unresolved point remains visible and never fabricates a region.

### LOG-PROVIDER-004 — Validate server configuration and route origin

```text
resolveServerContract(env): GridLensServerContractV1 | unavailable categories
  parse configured URL once
  require https, DNS hostname (not IP literal), port 443, no userinfo/fragment
  reject localhost and private/loopback/link-local/reserved host forms
  split exact origin and normalized base path
  require path in provider-class code-owned allowed path table
  bind model/tool IDs only from server config
  local serve may map ignored TEST.md values at Vite/Worker config boundary only
  hosted run reads Sites runtime secrets only
  never log or serialize parsed values

guardBrowserPost(request, exactSchema, bodyLimit): guarded
  require private Sites edge already authenticated request
  require method/path/content-type exact
  require Origin == request URL origin and Sec-Fetch-Site == same-origin
  or require server-only local smoke token for headerless test client
  duplicate-aware stream parse within bodyLimit
  validate exact GridLensPublicContractV3 member; acquire one of four permits
```

CORS/preflight is denied. Incoming URL origin alone is never treated as initiator proof. Deployment validation resolves every configured hostname and rejects non-public address classes before saving/deploying environment revision; redirects remain disabled on every fetch.

### LOG-RESEARCH-003 — Standalone and in-operation research

```text
runServerResearch(query, contextIds, operationBudget): internal candidates
  require approved Tavily or exact pinned MCP operation
  build destination/method/headers/tool name solely from server contract
  enforce one attempt, 10 s, 16 KiB request, 256 KiB raw response
  for MCP require exact remote tool name + input/output schema hashes
  parse bounded upstream fields
  classify official_candidate only by code-owned exact public host registry
  create internal citation IDs; treat every candidate as unverified
  run egress guard over every leaf and serialized projection
  return sanitized internal candidates or whole-operation safe error

POST /research:
  guarded request -> runServerResearch -> public ResearchResponseV3
  persist optional ResearchCacheRecordV3 with server route and response hash only
```

### LOG-AGENT-003 — Server-orchestrated structured analysis

```text
POST /agent:
  guarded := guardBrowserPost(AgentRequestV3, 64 KiB)
  recompute deterministic context fingerprint from canonical fields
  reject mismatch or any unclosed/untrusted context field
  if includeWebResearch:
    citations := runServerResearch(prompt + bounded region context, ids, shared budget)
  else citations := []

  build mode-specific system/schema instruction
  send deterministic context + sanitized citations to exact model path
  enforce one model attempt, 40 s, 96 KiB request, 256 KiB raw response
  discard reasoning/private fields before parsing public structured JSON
  validate exact requested-mode response:
    claim IDs unique; claim kinds legal
    every citation ID resolves to this operation's citations
    source_statement requires citation; inference/uncertainty visibly labelled
    site_profile payload required only for site_profile mode
    visual payload required only for visual mode and contains no code/HTML/expression
    contextFingerprint equals recomputed value
  run active-secret/private-endpoint egress guard on decoded leaves and final bytes
  return AgentResponseV3; never accept or echo browser research candidates
```

If research fails, the response may continue only with `partial=true`, zero research citations, explicit uncertainty, and unchanged deterministic state. If structured model output fails, return a safe scoped error; do not fall back to untyped narrative for structured modes.

### LOG-EGRESS-001 — Whole-result secret rejection

```text
guardPublicEgress(value, serverContract): safe bytes
  forbidden := exact active keys/credentials/model IDs/endpoints/origin/path/query/auth values
  patterns := declared credential-shaped patterns
  canonicalBytes := serialize closed public value
  scan each decoded string leaf and canonicalBytes, including adjacent-field/chunk joins
  if any exact or pattern match:
    destroy value/bytes; emit invalid_upstream_response metadata only
  else return canonicalBytes
```

Health, research, agent, errors, diagnostics, traces, screenshots, labels, and logs use the same guard. Test harnesses report only boolean canary absence.

### LOG-HEALTH-002 — Total sanitized health projection

```text
getHealth(): ProviderHealthResponseV3
  one canonical entry per configured class; no duplicates
  probe each provider at most once per 60-second cache generation
  map class to legal capabilities and stable reason
  overall := model unavailable ? unavailable
             : model limited or any optional not ready ? limited
             : ready
  egress-guard response and cache sanitized projection only
```

### LOG-MIGRATION-002 — Connector retirement without dangling cache references

```text
migrateToV3(storage): receipt
  delete legacy secrets, device keys, connector configuration/routes and clear journals
  remove connector-settings workflow route
  for each legacy research cache:
    if content/provenance can be retained without connector/secret fields:
      convert to legacy_stale inspectable record; refreshable=false
    else quarantine with reason/count only
  for scenario/result/preference geography:
    map only by frozen explicit RegionId table; otherwise quarantine
  preserve valid non-secret deterministic records
  write counts-only receipt atomically
```

### Performance and recovery budgets

- Representative desktop broadband: region overlay plus selectable marker/list readiness <=3.0 s cold and <=1.0 s warm.
- Representative mobile connection/profile: same readiness <=5.0 s cold and <=2.0 s warm.
- Basemap readiness is measured separately and cannot block region readiness.
- Selection dispatch-to-visible-state <=100 ms for list/marker and <=250 ms for polygon coordinate resolution at the prepared geometry ceiling.
- Provider timeouts never block deterministic calculation, selection, evidence, or report interaction.

### v0.12 traceability

| Requirement / review closure | Logic |
|---|---|
| G3V11-001/002/003/004/010/012; FR-LOC/MAP; AC-001/002/023 | LOG-SCHEMA-003, LOG-ASSET-003, LOG-SELECT-003, INV-050–055, budgets |
| G3V11-005/006/007/008/011; FR-CONN/AGT/VIZ; AC-010–015/017/018/021/026 | LOG-PROVIDER-004, LOG-RESEARCH-003, LOG-AGENT-003, LOG-EGRESS-001, LOG-HEALTH-002, INV-055–059 |
| G3V11-009; FR-SAVE; AC-020 | LOG-MIGRATION-002, INV-060 |
| `g3v11-d01` | exact public origin/DNS/path validation and no redirect/retry |
| `g3v11-d02` | same-operation server research; no browser candidate input |

## Version 0.12.1 blocker closure logic

CTR-037–042 replace the affected v0.12 routines as follows:

1. `compileEffectiveContracts` now compiles `GridLensPublicContractV3`, its embedded `GridLensDeterministicContractV3`, every named legacy-to-V3 adapter, current storage/route/cache roots, and all transitive references in one build. The only accepted legacy geography spellings are the three CTR-037 variants; every unknown identity quarantines the containing record.
2. `dispatchSelection` accepts only `CallerSelectionIntentV3`. The store checks operation replay, allocates `selectionGeneration`, computes `canonicalIntentHash`, and constructs the internal `StampedSelectionCommandV3`. No caller can submit a generation or irrelevant field. Marker-pack validation enforces canonical order, unique IDs, prefix/variant equality, and point-in-declared-region before selection is enabled.
3. Agent context projection walks the exact selected stage closure and emits `DeterministicPromptContextV4`: every sent deterministic value, evidence statement, authority/freshness/origin label, snapshot hash, and disclaimer is visible and fingerprinted. Valid scenario bounds are 100,000 MW, PUE 5, and 4,380,000 GWh. Site-profile, guided, and visual modes require their exclusive CTR-039 payload. Visual resolution reads trusted values from verified context bindings; model numbers are never authoritative inputs.
4. Registry compilation validates all exact 17 `SourceRegistryEntryV4` rows and conditional mode/state fields. Route restoration resolves immutable IDs/hashes before rendering. Current research cache provider/route/hash/time invariants validate atomically; legacy cache migration emits only `legacy_stale` or quarantine.
5. Research sanitization parses every returned URL as `PublicClickableUrlV3`; unsafe URLs discard their candidate and can never reach DOM/copy/export. A claim referencing a discarded citation rejects the response.
6. Spatial activation verifies `SpatialReleaseManifestV3.manifestHash`, then each exact asset byte length/hash/schema, then closed geometry/marker cross-references. The cache/rollback unit is manifest plus both assets; no plain release label or self-declared asset hash grants trust.

### Additional invariants

| ID | Invariant |
|---|---|
| INV-061 | Every current deterministic/storage/route root and every permitted legacy adapter is reachable from the effective V3 compile graph; unlisted legacy roots reject. |
| INV-062 | Caller selection intents are source-discriminated and generation-free; only the store stamps comparable commands. Marker IDs are unique, variant-prefixed, and spatially consistent. |
| INV-063 | Prompt context is lossless for the selected stage within approved bounds and immutable record closure; mode payloads cannot substitute for one another. |
| INV-064 | Model-authored visual candidates contain bindings only; rendered values come from trusted context records with matching field/unit/snapshot. |
| INV-065 | Registry, route, current cache, legacy-stale cache, and quarantine states are all closed V3 roots with no connector dependency. |
| INV-066 | Clickable citation URLs are public HTTPS DNS-host URLs and are never treated as fetch authority. |
| INV-067 | Spatial release identity is the verified manifest hash plus its two exact asset bindings; partial or mixed activation is impossible. |

### v0.12.1 counterexample closure

- `select_region + coordinate`, marker without ID, extra caller region, and cross-source fields fail the discriminated decoder.
- Duplicate or prefix-mismatched marker IDs and markers outside their declared region reject the pack.
- A 20,000 MW/PUE 4 scenario and the approved maximum values project without truncation; context fingerprint covers every sent record.
- A visual binding to an unrelated record/field/unit/hash rejects before rendering.
- A Tavily response cannot use an MCP route; refreshability is derived from current-vs-legacy kind.
- `http://127.0.0.1`, localhost, IP literals, private/reserved host forms, fragments, userinfo, or non-443 citation URLs never become links.
- Swapping valid geometry or marker bytes from another release fails the manifest asset hash.

### Version 0.12.2 storage-root closure

`StoredEnvelopeV3` is the exact CTR-043 live/tombstone union. Storage admission validates the store/payload discriminant, canonical payload hash, revision, timestamps, and absence of all deletion fields on live records or payload fields on tombstones. Legacy values can enter only after a successful named CTR-037 adapter receipt; connector-bearing or unknown-geography payloads quarantine. No generic or arbitrary JSON storage path exists.
