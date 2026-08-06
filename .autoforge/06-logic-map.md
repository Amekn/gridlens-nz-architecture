# GridLens NZ — Whole-system logic map

**Artifact version:** 0.2  
**Status:** Frozen logic-review candidate  
**Contract baseline:** `05-contracts.md` 0.2

## Global invariants

| ID | Invariant |
|---|---|
| INV-001 | No provider output participates in origin validation, arithmetic, simulation, evidence freshness, assessment, sources, unresolved questions, factual statements, or disclaimer generation. |
| INV-002 | Detailed analysis exists only for an atomically activated `supported` bundle whose deployment, geometry, region ID, hashes, and constituent versions validate. |
| INV-003 | Every complete, insufficient, and failed result embeds the full `ReproducibilityManifest`; no browser-clock value affects deterministic output. |
| INV-004 | Every material report statement has a non-empty trace to calculations, evidence/facts, assessment, assumptions, presets, or warnings. |
| INV-005 | Missing/failed inputs create typed incomplete results; they never become zero, a midpoint, a hidden omission, or inferred evidence. |
| INV-006 | The simulator conserves 24-hour facility energy, satisfies every source/destination/original-peak constraint, and returns a deterministic minimax optimality certificate. |
| INV-007 | Every assessment category has one typed result; insufficient evidence never becomes low concern, and community is never low in the MVP. |
| INV-008 | No contract or state contains an overall numeric score or approval/rejection decision. |
| INV-009 | Saved state contains raw scenario values and source references, not authoritative origin proofs, calculated results, assessments, or presentation plans; restore re-derives/recalculates. |
| INV-010 | A committed local mutation is idempotently identified by `operationId`; concurrent tabs cannot silently lose independent records, overwrite a newer revision, or resurrect a tombstone. |
| INV-011 | Optional AI output contains no factual text and applies only when snapshot, audience, and active request generation all still match. |
| INV-012 | Diagnostics contain no scenario values, labels, evidence/prose, URLs, secrets, raw storage, stack traces, or stable user identifiers. |
| INV-013 | Design 1 implementation stays under `design-1-browser-first/`; `Shared/` remains read-only and only `Shared/GridLens NZ.md` is normative. |

## Runtime state machines

### Application state

```text
Booting
  -> ManifestReady          validated manifest + geometry + region index
  -> ShellDataFailure       retryable manifest/geometry failure

ManifestReady
  -> RegionLoading          supported or limited canonical selection
  -> UnsupportedSelected    unsupported/outside selection

RegionLoading(requestToken)
  -> Editing                latest token activates valid supported bundle
  -> LimitedSelected        valid limited record; detailed analysis disabled
  -> RegionUnavailable      hash/schema/cross-version/category failure
  -> RegionLoading          newer selection aborts/replaces token

Editing
  -> Validating             Analyse
  -> Editing                draft change

Validating
  -> Editing                blocking issues
  -> Calculating            valid normalized input and origin proofs

Calculating
  -> Results                immutable snapshot, including typed partial results
  -> Editing                only when no valid regional context/snapshot is possible

Results
  -> Editing(staleSnapshot) input change
  -> Comparing              duplicate/compare
  -> Results                inspect/save/copy/presentation-plan events

Comparing
  -> Comparing              valid side recalculation
  -> Results                comparison exit
```

Forbidden: Results without a snapshot; calculation for limited/unsupported region; active bundle/scenario ID mismatch; baseline mutation; current-looking output after draft edit.

### Presentation-plan state per snapshot and audience

```text
Idle(generation=n)
  -> Requesting(generation=n+1, snapshotId, audience)
  -> Disabled

Requesting
  -> Available              only exact active generation/snapshot/audience
  -> Unavailable            timeout|rate|provider|schema|factual_text|stale
  -> Cancelled              navigation/snapshot/audience/new-request change

Available|Unavailable|Cancelled
  -> Requesting             explicit retry creates a new generation
  -> Idle                   snapshot/audience change
```

Every transition away from Requesting aborts the fetch and increments the application generation. Post-await matching is mandatory even if abort races with a completed response.

### IndexedDB repository state

```text
Closed -> Opening -> Migrating -> Ready
Closed -> Opening -> Unavailable
Migrating -> ReadyWithQuarantine     invalid records isolated
Migrating -> Unavailable             database-level failure

Ready -> Transaction(create|update|delete)
Transaction -> Ready(success)
Transaction -> Ready(conflict)
Transaction -> Ready(failure; no partial commit)
Transaction -> Ready(reconciled prior operationId)

Ready -> VersionChangeClosing -> Closed
```

No repository state has a last-write-wins collection blob.

## LOG-BOOT-001 — Start application and validate deployment graph

**Serves:** FR-LOC-001, FR-LOC-002, FR-DAT-001, FR-DAT-002, NFR-PER-002, NFR-REL-002.

```text
async function bootApplication(abortSignal): AppState
  correlation = newCorrelationId()
  emit(startup.begin)
  parallel:
    manifestBytes = fetchSameOrigin(PUBLIC_DATA_MANIFEST_URL, cap=256KiB, timeout=5s)
    storageState = repository.openAndMigrateOrUnavailable()
  manifest = parseDeploymentManifest(manifestBytes)
  require exact unique canonical entries southland, waikato, auckland
  geometryBytes = fetchSameOrigin(manifest.geometry.url, cap=2MiB, timeout=5s)
  require sha256(geometryBytes) == manifest.geometry.sha256
  geometry = parseAndValidateGeometry(geometryBytes, manifest)
  require geometry contains exact IDs for all indexed regions used by selection
  emit(startup.success, versions/hashes only)
  return ManifestReady(deepFreeze(manifest), deepFreeze(geometry), storageState)
catch known BoundaryError e:
  emit(startup.failure, e.code)
  return ShellDataFailure(userMessage(e), retry=bootApplication)
catch unknown:
  emit(startup.failure, INTERNAL_UNEXPECTED)
  return ShellDataFailure(genericMessage, retry=bootApplication)
```

The shell, purpose statement, and disclaimer may render first. Map/coordinate/list selection stays disabled until the canonical region index and geometry agree. Storage failure never blocks session-only analysis.

## LOG-GEO-001 — Resolve coordinates and selection parity

```text
function pointOnSegment(p, a, b): boolean
  cross = (p.lon-a.lon)*(b.lat-a.lat) - (p.lat-a.lat)*(b.lon-a.lon)
  if abs(cross) > 1e-12: return false
  return p.lon within inclusive min/max(a.lon,b.lon) AND
         p.lat within inclusive min/max(a.lat,b.lat)

function ringRelation(p, ring): boundary | inside | outside
  inside = false
  for each edge (a,b) including closing edge:
    if pointOnSegment(p,a,b): return boundary
    if edge straddles p.lat and ray-to-east intersection is strictly > p.lon:
      inside = not inside
  return inside ? inside : outside

function featureMatches(p, multiPolygon): boolean
  for polygon in multiPolygon:
    exterior = ringRelation(p, polygon[0])
    if exterior == boundary: return true
    if exterior == outside: continue
    excludedByHole = false
    for hole in polygon[1..]:
      relation = ringRelation(p, hole)
      if relation == boundary: return true
      if relation == inside: excludedByHole = true; break
    if not excludedByHole: return true
  return false

function resolveRegion(p, geometry): RegionResolution
  coordinate = parseFiniteCoordinate(p) else failed(GEOMETRY_INVALID)
  matches = sorted(feature.regionId for feature if featureMatches(coordinate, feature.geometry))
  if matches empty: return outside(coordinate)
  return matched(coordinate, matches, selectedRegionId=matches[0],
                 rule=point_in_polygon_lexicographic_border)
```

Map click calls `resolveRegion`; list and keyboard selection dispatch the canonical `RegionId` directly. Both paths then look up the same manifest entry. Exact-border fixtures prove lexicographic resolution. No path selects a nearest supported region. Complexity is `O(totalVertices)` with build cap 250,000 vertices and no mutation.

Geometry validation has two layers. The build validator uses robust orientation/segment predicates and a sweep-line or equivalently proven library routine to reject non-finite/out-of-bounds coordinates, unclosed/short rings, adjacent duplicates, self-intersections, holes outside their exterior, and overlapping holes; it records the validated content hash. The browser rechecks the hash, schema, bounds, closure, canonical IDs, and vertex budget before activation. Cross-feature shared boundaries/overlap are permitted because the lexicographic match rule resolves them; invalid topology inside one feature is not. Test fixtures verify the selected validation implementation against independently classified valid/invalid rings.

## LOG-DATA-001 — Activate a selected regional bundle atomically

```text
async function activateRegion(regionId, currentBundle, requestToken, abortSignal)
  entry = manifest.regions.findExact(regionId)
  if missing or unsupported: return UnsupportedSelected
  if limited: return LimitedSelected
  bytes = fetchSameOrigin(entry.bundle.url, cap=1MiB, timeout=5s, abortSignal)
  require sha256(bytes) == entry.bundle.sha256 else ASSET_HASH_MISMATCH
  candidate = parseRegionBundle(bytes)
  errors = validateBundleGraph(candidate, entry, manifest, geometry):
    exact region/canonical IDs and support status
    compatible schema and every constituent version
    asOfDate and all calendar dates; publication/retrieval <= asOfDate;
      validUntil >= publicationDate when both exist
    24 positive finite profile values
    factor and threshold order/ranges
    evidence/fact/reference uniqueness and closure
    freshness-policy exact 24/36 mapping
    assessment-policy exact approved thresholds/precedence
    supported bundle has qualifying current source-backed evidence
  if errors: return RegionUnavailable(stableSorted(errors))
  if requestToken != latestSelectionToken: return cancelled
  return Editing(atomicReplace(currentBundle, deepFreeze(candidate)))
```

Validation computes evidence freshness before the final supported-bundle check. Broken external links fail release verification; if availability changes at runtime, links may be disclosed as unavailable but no evidence is fabricated. A bundle failure never partially replaces the active bundle.

## LOG-EVD-001 — Classify evidence freshness against pinned date

```text
function subtractCalendarMonths(date, months): ISODate
  targetYearMonth = shift year/month backward by months
  targetDay = min(date.day, daysInMonth(targetYearMonth))
  return ISODate(targetYearMonth, targetDay)

function classifyItem(item, asOfDate, policy): ItemFreshness
  if item.validUntil exists:
    return asOfDate <= item.validUntil
      ? current(reason=valid_until_current, boundary=item.validUntil)
      : stale(reason=valid_until_expired, boundary=item.validUntil)
  if item.publicationDate missing:
    return unknown_freshness(reason=publication_date_missing)
  boundary = subtractCalendarMonths(asOfDate, policy.monthsByCategory[item.category])
  return item.publicationDate >= boundary
    ? current(reason=within_window, boundary)
    : stale(reason=past_window, boundary)

function selectEvidence(bundle): EvidenceSelection
  for category in EvidenceCategory enum order:
    items = stableSort(bundle.evidence where category, publicationDate desc then id)
    if items empty: status = missing(category_missing)
    else:
      classified = items.map(classifyItem)
      qualifying = classified current items where isSourceBacked(item)
      aggregate status = current if any current
                         else stale if any stale
                         else unknown_freshness
    emit explicit EvidenceCategoryStatus even when missing
  return immutable selection with all contextual items and full manifest
```

`isSourceBacked` excludes `developer_claim`, `community_submission`, and `unknown_unverified` quality. `isCurrentAuthoritative` additionally requires quality primary/secondary authoritative and source type government/council/infrastructure_provider/research. Exact boundary equality is current. The function never reads the browser clock.

## LOG-VAL-001 — Parse draft and derive trusted origins

```text
function validateDraft(draft, activeBundle, manifest): ValidationResult
  parse raw fields with strict canonical decimal/integer/boolean/enum rules
  apply hard ranges from CTR-003; collect stable blocking issues
  require regionId == activeBundle.region.id and supported
  if blocking: return invalid(issues sorted by field order then code)

  for each FieldName in normalized input:
    selection = draft.sourceSelections[field] default user_edit
    proof = resolveOrigin(selection, field, canonicalValue):
      user_edit -> user_assumption
      preset_ref -> find exact manifest preset/version and exact canonical field value;
                    mismatch/missing => blocking ORIGIN_REFERENCE_INVALID/MISMATCH
      proposal_claim_ref -> find exact ProposalClaim, require its evidence sourceType
                            is developer and its field/value match; otherwise blocking
      verified_fact_ref -> find fact ID, require its kind maps to field, exact value,
                           all cited evidence exists; otherwise blocking
    never accept a claimed InputOrigin or persisted OriginProof
  if origin issue blocking: return invalid
  normalized = deepFreeze(ScenarioInput(values, originProofs))
  warnings = runVersionedSuspicionRules(normalized)
  return valid(normalized, stableSorted(warnings))
```

Restore supplies only `rawScenario` and `SourceSelection`; the same function re-derives proofs. User edits after preset/evidence selection immediately replace that field’s selection with `user_edit`.

## LOG-CAL-001 — Calculate facility metrics and water ranges

All arithmetic uses a deterministic decimal library configured once; canonical strings feed calculations and golden tests. Each constructor embeds the same frozen manifest.

```text
function calculateScenario(input, bundle, manifest): CalculationBundle
  demand = dec(input.itCapacityMw) * dec(input.pue)
  annual = demand * dec(input.utilisation) * 8760 / 1000
  configuredFlexible = demand * dec(input.flexibleWorkloadRatio)
  activeLoad = demand * dec(input.utilisation)
  activeFlexible = activeLoad * dec(input.flexibleWorkloadRatio)
  records = five complete MetricResult values with formula IDs, inputs, units,
            canonical decimals, display precision, and manifest

  if coolingMethod == unknown:
    water = insufficient(cooling_method_required, manifest)
  else if factor missing/invalid/dangling evidence:
    water = failed(WATER_FACTOR_MISSING, manifest)
  else:
    annualMin = annual * factor.minLitresPerKwh
    annualMax = annual * factor.maxLitresPerKwh
    peakDailyMin = demand * 24 / 1000 * factor.minLitresPerKwh
    peakDailyMax = demand * 24 / 1000 * factor.maxLitresPerKwh
    annualRange = RangeCalculation(
      minMetricId=annual_water_min_ml, maxMetricId=annual_water_max_ml,
      minValue=annualMin, maxValue=annualMax,
      minUnroundedCanonical=canonical(annualMin),
      maxUnroundedCanonical=canonical(annualMax),
      unit="ML", displayPrecision=2, formulaId=annual_water_range,
      inputRefs=["/records/annual_energy_gwh/value",
                 pointer("/region/factors/coolingFactors", coolingMethod,
                         "minLitresPerKwh"),
                 pointer("/region/factors/coolingFactors", coolingMethod,
                         "maxLitresPerKwh")],
      assumptions=["water.factor_basis.facility_energy"], manifest)
    peakDailyRange = RangeCalculation(
      minMetricId=peak_daily_water_min_ml, maxMetricId=peak_daily_water_max_ml,
      minValue=peakDailyMin, maxValue=peakDailyMax,
      minUnroundedCanonical=canonical(peakDailyMin),
      maxUnroundedCanonical=canonical(peakDailyMax),
      unit="ML", displayPrecision=3, formulaId=peak_daily_water_range,
      inputRefs=["/records/facility_demand_mw/value",
                 pointer("/region/factors/coolingFactors", coolingMethod,
                         "minLitresPerKwh"),
                 pointer("/region/factors/coolingFactors", coolingMethod,
                         "maxLitresPerKwh")],
      assumptions=["water.factor_basis.facility_energy",
                   "water.peak_day.constant_facility_demand_24h"], manifest)
    water = complete(annual=annualRange, peakDaily=peakDailyRange,
                     factorVersion=factor.version,
                     factorEvidenceIds=factor.evidenceIds, manifest)
  return deepFreeze(bundle)
```

Southland oracle:

```text
capacity=50, PUE=1.3, utilisation=0.8, flexibility=0.30
facility demand = 65 MW
annual energy = 65 * 0.8 * 8760 / 1000 = 455.52 GWh
configured shiftable capacity = 19.5 MW
average active load = 52 MW
average active flexible load = 15.6 MW
```

Water failure/insufficiency never changes the five electricity metrics. Complexity/memory are `O(1)`.

Frozen Southland simulation oracle used by logic and tests:

```text
profile MW by hour = [80,78,76,74,72,70,68,66,64,62,60,58,
                      56,54,52,50,48,46,44,42,40,38,36,34]
peakHourCount=4; maxDestinationUtilisation=1.0
Southland scenario B=52 MW, F=15.6 MW, facilityDemand=65 MW
source hours=[0,1,2,3]; original combined peak=132 MW
optimal target=124 MW because non-source hour 4 already has 72+52=124 MW
remove 15.6 MWh from each source (62.4 MWh total)
destination additions by hour:
  h5=2, h6=4, h7=6, h8=8, h9=10, h10=12, h11=13, h12=7.4
shifted combined peak=124 MW; reduction=8 MW; remaining eligible=0
```

The deterministic source/destination-hour tie-break expands those aggregate additions into the exact movement ledger. Tests assert both the per-hour deltas and the reconstructed ledger sums, not only the peak value.

## LOG-FLX-001 — Deterministic minimax simulation

The primary objective is the smallest feasible maximum combined regional-plus-facility load. When strict improvement exists, the secondary objective moves as much eligible source work as possible without exceeding that optimal peak. If no strict improvement is feasible, no work moves.

```text
function buildProblem(input, calculations, profile, factors)
  require 24 positive regional MW and five complete electricity metrics
  B = averageActiveLoadMw
  F = min(averageActiveFlexibleLoadMw, B)
  facilityDemand = facilityDemandMw
  destinationFacilityCap = min(facilityDemand,
                               facilityDemand * factors.maxDestinationUtilisation)
  if destinationFacilityCap < B:
    return failed(SIMULATION_INFEASIBLE,
                  reason=baseline_exceeds_destination_utilisation_cap)
  P0 = max(profile[h] + B)
  S = top peakHourCount indices sorted by (profile desc, hour asc)
  D = remaining indices sorted hour ascending
  return immutable problem

function feasibility(problem, targetPeak T): Feasibility
  // All comparisons in this predicate are exact deterministic-decimal comparisons.
  required = 0
  maximumSourceRemoval = 0
  for s in S:
    minRemove[s] = max(0, profile[s] + B - T)
    maxRemove[s] = F
    if minRemove[s] > maxRemove[s]: return infeasible
    required += minRemove[s]
    maximumSourceRemoval += maxRemove[s]
  destinationCapacity = 0
  for d in D:
    if profile[d] + B > T: return infeasible
    cap[d] = max(0, min(destinationFacilityCap,
                        T - profile[d]) - B)
    destinationCapacity += cap[d]
  if required > destinationCapacity: return infeasible
  return feasible(minRemove, maxRemove, cap,
                  maxShift=min(maximumSourceRemoval, destinationCapacity))

function findOptimalPeak(problem): CertificateSeed
  averageLower = (sum(profile) + 24*B) / 24
  nonSourceLower = max(profile[d] + B for d in D, default=0)
  sourceLower = max(profile[s] + B - F for s in S, default=0)
  low = max(averageLower, nonSourceLower, sourceLower)
  high = P0
  if feasibility(low) is feasible:
    lowerProbe = max(0, low-EPS)
    require feasibility(lowerProbe) is infeasible
    return optimalPeak=low, lastInfeasibleLowerPeak=lowerProbe
  lastInfeasible = low
  repeat at most 80 while high-low > EPS:
    mid = (low+high)/2
    if feasibility(mid) feasible: high = mid
    else: lastInfeasible = mid; low = mid
  require feasibility(high) feasible
  return optimalPeak=high, lastInfeasibleLowerPeak=lastInfeasible

function allocateAtOptimalPeak(problem, T): Allocation
  if T >= P0: return baseline with zero movements
  f = feasibility(T); require feasible
  targetShift = f.maxShift
  removal[s] = f.minRemove[s]
  extra = targetShift - sum(removal)
  for s in S sorted hour ascending:
    add = min(extra, f.maxRemove[s]-removal[s])
    removal[s] += add; extra -= add
  destinationAdd[d] = 0
  remainingDestination = targetShift
  for d in D sorted hour ascending:
    add = min(remainingDestination, f.cap[d])
    destinationAdd[d] = add; remainingDestination -= add
  construct movement ledger by matching sources then destinations, both hour ascending
  shifted[s] = B-removal[s]; shifted[d] = B+destinationAdd[d]
  return allocation

function simulateFlexibility(...): SimulationBundle
  problem = buildProblem(...)
  seed = findOptimalPeak(problem)
  allocation = allocateAtOptimalPeak(problem, seed.optimalPeak)
  result = construct points/ledger/metrics/certificate/manifest
  verify every CTR-005 invariant independently from result
  if any fail: return failed(SIMULATION_INVARIANT_FAILED, manifest)
  return complete result
```

Binary-search feasibility is monotone: increasing `T` weakly reduces required removal and weakly increases destination capacity. Complete bipartite source-to-destination movement means the aggregate capacity condition is sufficient. `EPS=1e-9 MW` terminates binary search and bounds reconstructed invariant comparisons; it never relaxes the feasibility predicate or turns an infeasible target into a feasible one. The certificate records an exactly feasible target and an exactly infeasible lower probe. The independent verifier recomputes source/destination sums from the ledger and checks `feasibility(lastInfeasibleLowerPeak)` is false unless the analytical lower bound is the target within EPS, in which case it checks the explicit `target-EPS` lower probe.

Frozen reviewer counterexample:

```text
regional=[100,50,50,75 repeated for hours 3..23], facilityDemand=100, utilisation=0.5,
flexibility=1, peakHourCount=1, maxDestinationUtilisation=1
B=50, F=50, P0=150, S=[0]
optimal T=125; non-source hours 3..23 already equal the 125 MW floor;
destination caps at hours 1 and 2 are 25 each
secondary objective removes all 50 MWh and allocates 25 MWh to each destination
shifted combined peak=125; reduction=25; remaining eligible=0
```

Boundary oracles include 0% flexibility, 100% utilisation with no destination cap, flat profile/no strict improvement, utilisation cap below baseline, insufficient destination capacity, exact ties, invalid profile, and floating values within EPS. Complexity is `O(H log((P0-low)/EPS) + H²)` and bounded by `H=24`, 80 feasibility passes, and 576 ledger pairs.

## LOG-ASM-001 — Detect predefined missing information

```text
function detectMissingInformation(input, calculations, simulation, evidence, facts, thresholds)
  add grid connection/capacity questions unless qualifying current grid evidence/facts
  add cooling/annual/peak/source/dry-period questions when water incomplete,
      thresholds absent, or qualifying current water evidence absent
  add capacity/duration/commitment/restriction questions when resilience fact incomplete
  add workload/deadline/commitment questions when flexibility > 0
  add employment basis/role questions unless exact current verified economic fact
  add representative consultation question unless current representative fact
  add staging option when not staged
  return unique stable list in category/question order
```

The critic is structural, deterministic, and bundle-bounded. It does not infer absence from unrestricted sources or recommend approval/rejection.

## LOG-ASM-002 — Apply category and overall assessment policies

Helpers:

```text
qualifyingCurrent(category) = evidence category status current items filtered by
                              isCurrentAuthoritative where policy requires authority
factIsCurrentAuthoritative(fact) = fact.evidenceIds is non-empty AND every fact
                                   evidence ID resolves to a current authoritative
                                   item for the relevant category
band(value,bands) = low if value<=lowMax; moderate if value<=moderateMax; else high
```

### Electricity

```text
if simulation failed OR no current authoritative electricity demand fact/evidence
   OR no current authoritative grid evidence OR regionalPeak<=0:
  insufficient
else:
  ratio = max(0, shiftedCombinedPeakMw-regionalPeak) / regionalPeak
  if ratio <= 0.05:
    low
  else if ratio <= 0.15:
    moderate
  else:
    high
```

The exact 5% and 15% boundaries are inclusive in the lower band. Configured flexibility never changes the outcome except through the verified shifted peak.

### Water

```text
if water not complete OR thresholds missing/invalid
   OR threshold evidence is not current authoritative water evidence:
  insufficient
else:
  annualRank = band(water.annual.maxValue, thresholds.annualUpperMl)
  peakRank = band(water.peakDaily.maxValue, thresholds.peakDailyUpperMl)
  outcome = worse(annualRank, peakRank)
```

Cooling efficiency alone never produces an assessment. Conservative upper estimates drive both comparisons.

### Resilience

```text
if backup in diesel|gas|mixed:
  if generatorRestrictionsEnabled is false: high
  else if current authoritative fossil fact has operatingRestrictionsConfirmed=true:
    moderate
  else: insufficient
else if backup is battery OR demandResponseEnabled:
  qualifying = current authoritative matching battery/DR fact with
               capacity>0, duration>0, commitmentConfirmed
  if qualifying: low
  else: insufficient
else:
  insufficient
```

A fossil backup classification takes precedence even when demand response is enabled or a battery/DR fact is present. A boolean battery/DR/restriction label alone cannot produce low/moderate. An explicit absence of fossil restrictions is a high-concern scenario assumption and is traced as such.

### Economic contribution

```text
claims = permanent_jobs when >0 plus investment_nzd when present and >0
if claims empty: insufficient
else if any current authoritative fact of same claim kind contradicts submitted value
        OR submitted value violates high suspicion/implausibility rule:
  high
else if every material claim has verified_evidence OriginProof referencing an exact
        current authoritative fact with basisDetail, and permanent_jobs fact also
        has non-empty roleDetail:
  low
else if any claim origin is user_assumption|preset|proposal_claim
        OR supporting evidence is developer_claim/stale/unknown:
  moderate
else:
  insufficient
```

Zero jobs is absence of a material contribution claim, not automatically high. One asserted job, preset, or forged origin cannot produce low.

### Community

```text
representativeFacts = current authoritative community facts where representative=true
if none: insufficient
else if any concernLevel=high: high
else: moderate // includes moderate concern or no representative basis for low
```

The MVP never emits low community concern.

### Overall

```text
if any completed category high: substantial_issues_require_investigation
else if any failed OR any completed category insufficient:
  evidence_incomplete
else if any completed category moderate:
  potentially_suitable_with_conditions
else:
  lower_concern_professional_review_required
```

Every completed category has non-empty reasons and explicit exact inputs, policy/threshold versions, qualifying evidence, and contextual evidence. Failure to construct a valid trace produces a failed category, which triggers evidence-incomplete overall.

## LOG-SNAP-001 — Create immutable result snapshot

```text
function analyse(draft, activeDeployment, activeBundle): AnalysisResult
  validation = validateDraft(...)
  if invalid: return ValidationFailure
  manifest = buildAndValidateCompleteReproducibilityManifest(activeDeployment,bundle)
  calculations = calculateScenario(input,bundle,manifest)
  simulation = simulateFlexibilityOrTypedFailure(input,calculations,bundle,manifest)
  evidence = selectEvidence(bundle,manifest)
  missing = detectMissingInformation(...)
  assessment = assess(...,manifest)
  canonical = canonicalJson({scenario,manifest,calculations,simulation,evidence,assessment})
  snapshotId = sha256(canonical)
  return SnapshotReady(deepFreeze(ResultSnapshot(snapshotId, now, correlationId,...)), warnings)
```

Canonical JSON sorts object keys and stable-ID sets, preserves ordered tuples/series, canonicalises decimals and dates, and excludes `createdAt`/`correlationId`. Repeating identical normalized inputs and constituent versions returns identical domain fields and snapshot ID, including water, simulation, evidence statuses, assessment, and partial failures.

## LOG-CMP-001 — Compare immutable snapshots

```text
function compare(baseline, improved)
  assert frozen and distinct snapshots
  for each ComparableMetricId:
    if both values complete and units equal: emit deterministic delta
    else: add ID to unavailableMetricIds
  changedInputs = stable structural diff excluding derived OriginProof internals
  changedOutcomes = stable category status/outcome diff
  tradeoffs = deterministic allowlisted keys from input/value/outcome changes
  return deepFreeze(bundle)
```

No missing/failed value becomes zero. The baseline snapshot is never mutated.

## LOG-RPT-001 — Compose factual deterministic briefs

```text
function composeBrief(snapshot, audience)
  append required overall narrative statement with assessment traces
  append complete electricity values/formula/version traces or typed failure statement
  append minimax peak result/certificate/simplification traces or failure statement
  append water range and assessment OR explicit insufficient/failed statement
  append resilience/economic/community outcomes and reasons
  append assumptions grouped by derived origin proofs
  append unresolved questions and freshness statuses
  append source statements only for traced evidence
  append required immutable professional-review disclaimer
  assert every material factual statement has non-empty valid traces
  render each statement from deterministic template+typed parameters
  return deterministic_template ImpactBrief
```

Technical view includes formulas, constituent versions, units, thresholds, and reason inputs. Public view simplifies syntax but retains raw values, uncertainty, sources, origins, and accessible equivalents. Familiar comparisons appear only with versioned source-backed factors. Copy serialises the same AST to Markdown/plain text; Clipboard denial exposes selectable content.

## LOG-AI-001 — Request and apply an optional presentation plan

```text
async function requestPresentationPlan(snapshot, brief, audience)
  if disabled: return unchanged brief + disabled status
  generation = coordinator.incrementGeneration()
  request = {snapshotId, generation, audience,
             statements: brief statements with ID/section/role/required and
                         deterministic allowedConnectives only}
  response = await POST /api/presentation-plan under timeout and AbortSignal
  if request aborted/error: return unchanged brief + typed status
  plan = parseStrictPresentationPlan(response) // schema has no free-text field
  require coordinator.activeGeneration == generation
  require current snapshotId/audience == request snapshotId/audience
  require every required ID exactly once, optional ID at most once,
          no unknown/duplicate IDs, each connective in its statement's allowlist
  orderedStatements = lookup original immutable BriefStatement by ID
  rendered = composeDeterministicConnectives(orderedStatements, plan tokens)
  assert disclaimer and all required statements present
  return brief generatedBy deterministic_with_presentation_plan
```

The edge repeats inbound/outbound schema validation, never accepts evidence excerpts or user prompts, and returns no provider prose. Any one invalid field rejects the whole plan. A late response cannot survive the generation guard even if network abort loses a race.

## LOG-SAVE-001 — Transactional create/update/delete and crash reconciliation

```text
async function mutateScenario(command): PersistenceResult
  repeat at most twice:
    attempt = await attemptMutation(command)
    if attempt is not internal_history_cap: return attempt
    compacted = await compactPersistenceHistory(command.databaseEpoch)
    if compacted is conflict/failure: return compacted
    command = same semantic command with databaseEpoch=compacted.newEpoch
              and a fresh operationId; recompute its command hash
  return failure(STORAGE_QUOTA)

async function attemptMutation(command): PersistenceResult | internal_history_cap
  validate command, label, raw values, SourceSelections, byte/count limits
  commandHash = sha256(canonical command excluding transient request time)
  tx = db.transaction([metadata,scenarios,tombstones,operations], readwrite)
  metadata = await metadata.get("singleton")
  require command.databaseEpoch == metadata.databaseEpoch else return conflict
  priorOp = await operations.get(command.operationId)
  if priorOp exists:
    require priorOp.databaseEpoch == metadata.databaseEpoch AND
            priorOp.commandSha256 == commandHash else return conflict
    await tx.done; return success(reconciled prior outcome)
  if await operations.count() >= MAX_OPERATION_RECORDS:
    abort without mutation; return internal_history_cap
  current = await scenarios.get(command.scenarioId)
  tomb = await tombstones.get(command.scenarioId)
  if current/tomb exists with a different databaseEpoch:
    return conflict // occupied inert identity; create must allocate a fresh UUID
  if current exists and tomb exists in the current epoch:
    abort transaction; return STORAGE_CORRUPT
    // explicit recovery runs a separate atomic quarantine transaction

  if create:
    require current absent and tomb absent (or explicit new ScenarioId)
    require count(valid current-epoch active envelopes) < MAX_ACTIVE_SCENARIOS
            inside this transaction
    revision=1; put envelope/operation with metadata.databaseEpoch and commandHash
  if update:
    require current exists in current epoch, tomb absent,
            current.revision==expectedRevision
    revision=current.revision+1; put current-epoch envelope/operation with commandHash
  if delete:
    require current exists in current epoch, tomb absent,
            current.revision==expectedRevision
    if await tombstones.count() >= MAX_TOMBSTONES:
      abort without mutation; return internal_history_cap
    deletedRevision=current.revision+1
    delete scenario; put current-epoch monotonic tombstone/operation with commandHash
  await tx.done
  return success
catch transaction abort/quota:
  return failure with no partial commit
catch response lost after possible commit:
  return failure(STORAGE_COMMIT_INDETERMINATE, retrySameOperationId=true)

async function compactPersistenceHistory(expectedEpoch): CompactionResult
  tx = db.transaction([metadata,scenarios,tombstones,operations], readwrite)
  metadata = await metadata.get("singleton")
  if metadata.databaseEpoch != expectedEpoch:
    abort; return conflict(currentEpoch=metadata.databaseEpoch)
  if any valid current-epoch scenario and tombstone share a ScenarioId:
    abort; return failure(STORAGE_CORRUPT)
  newEpoch = randomUuid()
  for each valid active envelope where envelope.databaseEpoch == expectedEpoch:
    rewrite only envelope.databaseEpoch = newEpoch; preserve ID/revision/content/times
  // invalid or older-epoch entries remain inert for explicit quarantine maintenance
  clear operations
  clear tombstones
  put metadata with databaseEpoch=newEpoch
  await tx.done
  return success(newEpoch)
```

Within an epoch, the operation record proves whether an atomic commit occurred. After compaction, any retry carrying the old epoch conflicts rather than duplicating a mutation; the caller refreshes and reconciles from the preserved active state. Same-record revision conflicts return the current/tombstone revision and never overwrite. Different record IDs can commit independently in concurrent tabs. IndexedDB transaction serialization plus epoch/revision checks are the consistency mechanism; `BroadcastChannel` merely refreshes lists.

```text
async function restoreScenario(id)
  metadata = read and validate singleton StoreMetadata
  envelope = parse current record; if invalid quarantineRecordAtomically(id)
  require envelope.databaseEpoch == metadata.databaseEpoch else treat as inert maintenance record
  if tombstone revision >= envelope revision: reject resurrection and quarantine envelope
  migrated = runSequentialIdempotentMigrations(envelope) or quarantine individually
  draft = {raw:migrated.rawScenario, sourceSelections:migrated.sourceSelections}
  activate current canonical region bundle
  analysis = analyse(draft, current deployment/bundle) // re-derives origins
  notices = compare every savedManifest field with current manifest
  return restored(draft, analysis, notices)
```

### Legacy v1 import

After IndexedDB v2 opens, create or validate singleton metadata and its database epoch. If `metadata.legacyV1ImportComplete` is false, read the single legacy key once. Each record is independently parsed and imported under the current epoch in its own idempotent operation; valid records begin at revision 1, unresolved origins become user assumptions, and invalid records enter `quarantine` with raw hash. After readback audit, set the completion marker transactionally. Remove the legacy key only after the marker and successful audit; an interruption before that point safely retries by deterministic current-epoch legacy operation IDs.

## LOG-UI-001 — Accessible rendering and workflow rules

- Map, coordinates, pointer, keyboard, and list share one canonical region-selection model; the list remains available when map data fails only if the index is independently valid.
- Form labels, explanations, origin badges, warnings, and errors are programmatically associated. User edits immediately show `User assumption`.
- Validation failure focuses an error summary linking to the first field while preserving values.
- Outcomes use text/icon/shape as well as colour; evidence freshness is explicit text.
- Every chart has an adjacent summary and 24-row data table from the identical `HourPoint` tuple.
- Polite debounced announcements cover recalculation; user-triggered blocking errors are assertive.
- Reduced motion, keyboard-only operation, high contrast, and 200% zoom retain the complete journey.
- Draft changes label prior results stale; stale results never masquerade as current.
- Partial failures retain unaffected cards and state exactly what is incomplete/failed.

## LOG-OBS-001 — Privacy-preserving diagnostics

```text
function emitDiagnostic(candidate)
  event = strictAllowlistParse(candidate)
  if candidate contains forbidden field/value class:
    drop event; increment in-memory safe counter only
  development sink may log validated event
  production browser/edge sinks receive validated event without bodies/content
```

Correlation IDs last for one operation and are not stored as user identifiers. Presentation requests use a separate generation ID.

## Security boundaries and resource limits

| Boundary | Controls | Limit and recovery |
|---|---|---|
| Form/source selection | strict parsing; hard ranges; resolve preset/evidence/fact and exact value | field issue; preserve draft; untrusted labels become assumptions/errors |
| Manifest/geometry/bundle | same-origin; byte hash; schema; semantic/cross-version/reference checks | manifest 256 KiB, geometry 2 MiB/250k vertices, bundle 1 MiB/300 evidence; isolate scope |
| Geometry | finite coordinates, closed/non-self-intersecting rings, deterministic boundary rule | disable map/coordinate path; never guess nearest |
| Evidence | inert text, HTTPS URL, pinned freshness, release link check | 1,000 chars/item; stale/unknown contextual only |
| Calculation/simulation | decimal canonicalisation, fixed 24 hours, 80 feasibility iterations, independent invariant verifier | typed metric/simulation failure; retain unrelated results |
| IndexedDB | per-record transactions, epoch + revision CAS, operation idempotency, tombstones, atomic epoch compaction, schema/migration checks | 20 active/64 KiB each; rotate epoch at 2,000 operations or 1,000 tombstones; 100 quarantine with explicit maintenance; memory path continues |
| Presentation client/gateway | fixed endpoint, JSON schema without factual response fields, 64 KiB, 50 statements, 8s timeout/cancel | discard whole plan; deterministic fallback |
| Clipboard | plain text/Markdown only | manual selection fallback |
| Diagnostics | strict allowlist and forbidden-field guard | drop unsafe event |

CSP target: same-origin scripts/styles/assets; no `unsafe-eval`; browser does not connect to AI provider; object/frame sources denied; base URI self; form action self; only the server adapter may reach the allowlisted HTTPS provider.

## Crash, update, migration, and rollback

- A tab crash loses only unsaved in-memory draft/results; a committed IndexedDB mutation is recoverable by operation ID within its epoch, while an old-epoch retry after compaction conflicts and reconciles from current active state.
- Code/data deployment is atomic and content-hashed; one release never mixes manifest/bundle versions.
- No service worker is required, avoiding mixed stale caches.
- Host rollback restores a complete prior deployment. Current saved records restore with explicit full-version drift.
- IndexedDB upgrades are sequential, transactional, idempotent, and quarantine per record; no migration silently deletes the source on failure.
- Provider outage requires no rollback because deterministic briefs remain authoritative and complete.

## Requirement-to-logic traceability

| Requirement IDs | Logic units and invariants |
|---|---|
| FR-LOC-001, FR-LOC-002 | LOG-BOOT-001, LOG-GEO-001, LOG-DATA-001, LOG-UI-001, INV-002 |
| FR-SCN-001, FR-SCN-002, FR-SCN-003 | LOG-VAL-001, LOG-UI-001, INV-005 |
| FR-CAL-001, FR-CAL-004, FR-CAL-005, FR-CAL-006 | LOG-CAL-001, LOG-SNAP-001, INV-003, INV-005 |
| FR-CAL-002, FR-CAL-003, FR-CAL-007 | LOG-FLX-001, INV-006 |
| FR-EVD-001, FR-EVD-002, FR-EVD-003, FR-EVD-004 | LOG-DATA-001, LOG-EVD-001, LOG-ASM-002, INV-003, INV-007 |
| FR-CRT-001 | LOG-ASM-001 |
| FR-ASM-001, FR-ASM-002, FR-ASM-003, FR-ASM-004, FR-ASM-005, FR-ASM-006, FR-ASM-007, FR-ASM-008 | LOG-ASM-001, LOG-ASM-002, INV-007, INV-008 |
| FR-CMP-001 | LOG-SNAP-001, LOG-CMP-001 |
| FR-RES-001, FR-RES-002, FR-RES-003 | application states, LOG-UI-001, LOG-RPT-001 |
| FR-RPT-001, FR-RPT-002, FR-RPT-003 | LOG-RPT-001, LOG-AI-001, INV-004, INV-011 |
| FR-ERR-001 | Typed failure paths throughout, LOG-RPT-001, LOG-AI-001 |
| FR-DAT-001, FR-DAT-002 | LOG-BOOT-001, LOG-GEO-001, LOG-DATA-001, LOG-SNAP-001 |
| FR-LOCALSAVE-001, FR-LOCALSAVE-002 | LOG-SAVE-001, INV-009, INV-010 |
| NFR-PER-001, NFR-PER-002 | Bounded local algorithms, post-render LOG-AI-001, resource limits |
| NFR-REL-001, NFR-REL-002 | INV-003/005/006/010, LOG-SNAP-001, typed partial states |
| NFR-ACC-001 | LOG-UI-001 |
| NFR-SEC-001, NFR-SEC-002 | All parsers, trust derivation, security table, INV-001/011/012 |
| NFR-PRI-001 | LOG-SAVE-001, LOG-AI-001 minimisation, INV-009/012 |
| NFR-EXP-001 | INV-003/004/007, LOG-EVD-001, LOG-RPT-001 |
| NFR-MNT-001, NFR-MNT-002 | Contract-separated units and LOG-AI-001 plan-only boundary |
| NFR-DEP-001 | Deployment/crash/rollback model and CSP |
| NFR-OBS-001 | LOG-OBS-001, INV-012 |
| CON-001, CON-002, CON-003, CON-004, CON-005, CON-006, CON-007 | INV-001/008/013 and deployment/security boundaries |

## Acceptance-criterion-to-logic traceability

| Acceptance criterion | Logic proof obligation |
|---|---|
| AC-001 | LOG-BOOT-001, LOG-GEO-001, LOG-DATA-001, and LOG-UI-001 enforce prepared/unsupported behavior. |
| AC-002 | LOG-VAL-001 and LOG-UI-001 cover fields, trusted origins, explanations, and validation. |
| AC-003 | LOG-CAL-001 proves the 65 MW and 455.52 GWh Southland oracle. |
| AC-004 | LOG-CAL-001 exposes typical/boundary/invalid/conversion/rounding seams. |
| AC-005 | LOG-FLX-001 and LOG-UI-001 produce accessible 24-hour baseline/flexible views. |
| AC-006 | INV-006 and LOG-FLX-001 prove flexibility, energy, utilization, and peak bounds. |
| AC-007 | LOG-DATA-001 and LOG-EVD-001 require source-backed quality/freshness evidence. |
| AC-008 | INV-003/004 and LOG-RPT-001 expose origin/formula/evidence traces. |
| AC-009 | LOG-ASM-001/002 produce predefined questions without rejection logic. |
| AC-010 | LOG-RPT-001 is complete without LOG-AI-001 and includes the disclaimer. |
| AC-011 | Typed partial flows and LOG-AI-001 preserve deterministic results. |
| AC-012 | LOG-SNAP-001 and LOG-CMP-001 provide immutable deltas/trade-offs. |
| AC-013 | Module boundaries, limits, and lifecycle seams are exercised by `07-test-strategy.md`. |
| AC-014 | INV-001/005/008/011/012 and security controls exclude forbidden output. |
| AC-015 | LOG-UI-001 and LOG-RPT-001 retain raw values, sources, confidence, and equivalents. |
| AC-016 | LOG-ASM-002 covers exact five-category and overall-precedence branches. |
| AC-017 | LOG-EVD-001 proves pinned dates, exact boundaries, `validUntil`, and low-concern exclusion. |
| AC-018 | LOG-FLX-001 proves minimax feasibility/optimality and the 100/50/50→125 oracle. |
| AC-019 | LOG-VAL-001 and LOG-AI-001 reject forged origin and malicious/late plans. |
| AC-020 | LOG-GEO-001 proves three-region selection parity and exact-border behavior. |
| AC-021 | LOG-SAVE-001 proves concurrency, crash reconciliation, migration, drift, and quarantine. |
| AC-022 | INV-003 and LOG-SNAP-001 attach the full manifest to every result status. |
