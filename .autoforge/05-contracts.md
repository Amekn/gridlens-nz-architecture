# GridLens NZ — Contracts

**Artifact version:** 0.2  
**Status:** Frozen logic-review candidate  
**Approved inputs:** Requirements 0.3, Usage Definition 0.3, Selected Architecture 0.2

## Contract principles

1. Deterministic browser code is authoritative for validation, calculations, simulation, evidence freshness, assessment, and factual reporting.
2. Every boundary parses from `unknown`; unvalidated bundle, form, IndexedDB, and gateway data never reaches domain operations.
3. Input origins are derived from current application actions and validated immutable references. Editable or persisted origin labels have no authority.
4. Internal electricity units are MW, MWh, and GWh; water units are litres-per-kWh and ML; ratios are in `[0,1]`. Display conversion is separate.
5. Complete, insufficient, and failed results are discriminated unions. A value cannot coexist with an incompatible status.
6. Every result carries the exact constituent versions needed to reproduce its value or status against a pinned regional-bundle `asOfDate`.
7. Missing data is represented by a typed status/reason, never `0`, `NaN`, an empty citation, a hidden omission, or invented prose.
8. Optional AI returns only a presentation plan made of allowlisted statement IDs, order, and non-factual connective tokens. It cannot return factual replacement text.
9. Errors identify scope and recovery; a metric, category, evidence item, region, persistence operation, or optional service may fail without erasing unrelated valid state.

## Common scalar and utility contracts

```text
type Scalar = string | number | boolean | null
type ISODateTime = string       // RFC 3339 with offset or Z
type ISODate = string           // canonical YYYY-MM-DD Gregorian date
type SemVer = string            // ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$
type Sha256 = string            // 64 lowercase hexadecimal characters
type UUID = string              // canonical lowercase RFC 4122 UUID
type RegionId = string          // ^[a-z0-9]+(?:-[a-z0-9]+)*$
type EvidenceId = string        // ^evidence-[a-z0-9-]+$
type FactId = string            // ^fact-[a-z0-9-]+$
type ClaimId = string           // ^claim-[a-z0-9-]+$
type PresetId = string          // ^preset-[a-z0-9-]+$
type ScenarioId = string        // UUID v4
type OperationId = string       // UUID v4; UUID v5 in fixed namespace for migrations
type RequestGenerationId = string // UUID v4
type CorrelationId = string     // UUID v4, regenerated per user operation
type SnapshotId = Sha256        // canonical snapshot fingerprint; not a signature
type StatementId = string       // ^statement-[a-z0-9-]+$
type ReasonId = string          // ^reason-[a-z0-9-]+$
type MissingInformationId = string // ^missing-[a-z0-9-]+$
type MessageKey = string        // ^[a-z0-9]+(?:[._-][a-z0-9]+)*$
type HourIndex = integer        // 0..23, representative Pacific/Auckland day
type Ratio = number             // finite 0..1
type Megawatts = number         // finite >= 0
type MegawattHours = number     // finite >= 0
type GigawattHours = number     // finite >= 0
type Megalitres = number        // finite >= 0
type Latitude = number          // finite -47.5..-34.0
type Longitude = number         // finite 166.0..179.0
type CanonicalDecimal = string  // /^-?(0|[1-9][0-9]*)(\.[0-9]+)?$/; no exponent
type JsonPointer = string       // RFC 6901 pointer
type DatabaseEpoch = UUID       // identity generation for local persistence
type FieldName = region_id | it_capacity_mw | utilisation | pue |
                 flexible_workload_ratio | cooling_method | backup_generation |
                 permanent_jobs | construction_staged | demand_response_enabled |
                 generator_restrictions_enabled | battery_capacity_mw |
                 battery_duration_hours | demand_response_capacity_mw |
                 demand_response_duration_hours | investment_nzd
type MetricId = facility_demand_mw | annual_energy_gwh |
                configured_shiftable_capacity_mw | average_active_load_mw |
                average_active_flexible_load_mw | annual_water_min_ml |
                annual_water_max_ml | peak_daily_water_min_ml |
                peak_daily_water_max_ml
type ComparableMetricId = facility_demand_mw | annual_energy_gwh |
                          configured_shiftable_capacity_mw |
                          shifted_combined_peak_mw | annual_water_max_ml |
                          peak_daily_water_max_ml
```

Numbers are JSON numbers at data/API boundaries. Form parsing accepts canonical decimal text using `.` and rejects non-finite values, exponent notation, locale separators, and unit-bearing strings. Localised formatting occurs only after calculation.

```text
enum SupportStatus = supported | limited | unsupported
enum CoolingMethod = air | evaporative | direct_liquid | hybrid | unknown
enum BackupGeneration = diesel | gas | battery | mixed | none_specified | unknown
enum EvidenceQuality = primary_authoritative | secondary_authoritative |
                       developer_claim | reputable_news |
                       community_submission | unknown_unverified
enum SourceType = government | council | infrastructure_provider | developer |
                  research | news | community | other
enum EvidenceCategory = electricity | grid | water | resilience | employment |
                        investment | community_current_news |
                        cooling_technology | planning | environmental
enum FreshnessStatus = current | stale | unknown_freshness | missing
enum AssessmentOutcome = low_concern | moderate_concern |
                         high_concern | insufficient_evidence
enum AssessmentCategory = electricity | water | resilience |
                          economic_contribution | community
enum Severity = warning | blocking
enum Audience = technical | public
enum ResultStatus = complete | insufficient_evidence | failed
enum SemanticRole = heading | finding | context | limitation |
                    question | source | disclaimer
enum InputOrigin = user_assumption | preset | proposal_claim |
                   verified_evidence | calculated_value
enum DomainErrorScope = field | metric | simulation | category | evidence |
                        geometry | region | storage | presentation | application
```

## Reproducibility manifest

Every deterministic result embeds this complete manifest, including failed and insufficient results.

```text
record ReproducibilityManifest {
  appVersion: SemVer
  scenarioSchemaVersion: SemVer
  deploymentReleaseId: string
  deploymentManifestSha256: Sha256
  geometryVersion: SemVer
  geometrySha256: Sha256
  regionId: RegionId
  regionBundleVersion: SemVer
  regionBundleSha256: Sha256
  regionAsOfDate: ISODate
  profileId: string
  profileVersion: SemVer
  factorVersion: SemVer
  waterThresholdVersion: SemVer | "absent"
  evidenceBundleVersion: SemVer
  freshnessPolicyVersion: SemVer
  assessmentPolicyVersion: SemVer
  formulaVersion: SemVer
  simulationVersion: SemVer
}
```

## CTR-001 — Deployment, geometry, and regional bundles

### Static locations

```text
/data/deployment-manifest.json
/data/geometry/nz-regions.json
/data/regions/{regionId}/bundle.json
```

```text
record DeploymentManifest {
  schemaVersion: SemVer
  appVersion: SemVer
  releaseId: string
  generatedAt: ISODateTime
  geometry: AssetRef
  presets: ScenarioPreset[]     // unique presetId/version pairs
  regions: RegionManifestEntry[] // exactly one canonical ID each; includes required IDs
}

record ScenarioPreset {
  presetId: PresetId
  presetVersion: SemVer
  label: string
  values: map<FieldName,CanonicalDecimal | string | boolean>
}

record AssetRef {
  url: string       // absolute-path, same-origin URL
  sha256: Sha256
  schemaVersion: SemVer
  contentVersion: SemVer
}

record RegionManifestEntry {
  id: RegionId
  name: string                  // 1..80 Unicode scalar values
  supportStatus: SupportStatus
  bundle?: AssetRef             // required for supported; forbidden for unsupported
}

record Coordinate { latitude: Latitude, longitude: Longitude }
type LinearRing = Coordinate[]  // >=4; first equals last; finite; no self-intersection
type Polygon = LinearRing[]     // first exterior; remaining holes
type MultiPolygon = Polygon[]   // non-empty

record GeometryFeature {
  regionId: RegionId
  geometry: MultiPolygon
}

record GeometryBundle {
  schemaVersion: SemVer
  geometryVersion: SemVer
  sourceTitle: string
  sourceUrl: string             // absolute https
  sourcePublicationDate?: ISODate
  features: GeometryFeature[]   // unique regionId; includes southland, waikato, auckland
}

sum RegionResolution =
  | { kind: "matched", coordinate: Coordinate, matchingRegionIds: RegionId[],
      selectedRegionId: RegionId, rule: "point_in_polygon_lexicographic_border" }
  | { kind: "outside", coordinate: Coordinate }
  | { kind: "failed", coordinate?: Coordinate, error: DomainError }

record RegionBundle {
  schemaVersion: SemVer
  bundleVersion: SemVer
  asOfDate: ISODate
  region: RegionRecord
  demandProfile: DemandProfile24h
  factors: RegionalFactors
  waterThresholds?: WaterConcernThresholds
  freshnessPolicy: FreshnessPolicy
  assessmentPolicy: AssessmentPolicy
  evidenceVersion: SemVer
  evidence: EvidenceItem[]
  verifiedFacts: VerifiedFact[]
  proposalClaims: ProposalClaim[]
}

record RegionRecord {
  id: RegionId
  name: string
  centroid: Coordinate
  supportStatus: SupportStatus
  profileKind: representative_normalised | prepared_synthetic
  profileDisclosure: string     // 20..500 Unicode scalar values
}

record DemandProfile24h {
  id: string
  version: SemVer
  timezone: "Pacific/Auckland"
  unit: "MW"
  values: tuple<Megawatts,24>   // each > 0
  methodologyEvidenceIds: EvidenceId[] // non-empty, unique
}

record RegionalFactors {
  version: SemVer
  peakHourCount: integer        // 1..8
  maxDestinationUtilisation: Ratio
  coolingFactors: map<CoolingMethodExceptUnknown, CoolingFactor>
}

type CoolingMethodExceptUnknown = air | evaporative | direct_liquid | hybrid

record CoolingFactor {
  basis: "facility_energy"
  minLitresPerKwh: number       // finite 0..10
  maxLitresPerKwh: number       // finite 0..10 and >= min
  evidenceIds: EvidenceId[]     // non-empty, unique
}

record ConcernBands {
  lowMaxInclusive: number       // finite >=0
  moderateMaxInclusive: number // finite > lowMaxInclusive
}

record WaterConcernThresholds {
  version: SemVer
  annualUpperMl: ConcernBands
  peakDailyUpperMl: ConcernBands
  evidenceIds: EvidenceId[]     // non-empty; current authoritative water evidence
}

record FreshnessPolicy {
  version: SemVer
  monthsByCategory: map<EvidenceCategory, integer>
  // exactly 24 for electricity/grid/water/resilience/employment/investment/
  // community_current_news; exactly 36 for cooling_technology/planning/environmental
}

record AssessmentPolicy {
  version: SemVer
  electricityAddedPeakRatio: { lowMaxInclusive: 0.05,
                               moderateMaxInclusive: 0.15 }
  overallPrecedence: tuple<"high_concern", "insufficient_evidence",
                           "moderate_concern", "all_low", 4>
}
```

Deployment validation requires canonical IDs `southland`, `waikato`, and `auckland` in both the region index and geometry. Bundle activation is atomic and rejects hash mismatch, incompatible major versions, cross-ID mismatch, invalid geometry, non-24 profiles, invalid factor/threshold ranges, duplicate IDs, dangling references, publication/retrieval dates after `asOfDate`, `validUntil < publicationDate` when both exist, or a supported region without at least one qualifying current source-backed evidence record. Manifest construction sets `waterThresholdVersion` to the exact threshold version when thresholds exist and to `"absent"` only when the optional threshold object is absent; any other pairing is invalid.

Point-in-polygon treats a point on an exterior or hole boundary as matching that feature. If multiple features match, `selectedRegionId` is the lexicographically smallest canonical ID. `outside` never selects the nearest region.

## CTR-002 — Evidence, verified facts, and freshness

```text
record EvidenceItem {
  id: EvidenceId
  category: EvidenceCategory
  title: string                // 1..200
  publisher: string            // 1..120
  publicationDate?: ISODate
  validUntil?: ISODate
  retrievedDate: ISODate
  regionId: RegionId
  sourceUrl: string            // absolute https
  sourceType: SourceType
  quality: EvidenceQuality
  relevantText: string         // 1..1000, rendered inertly
  pageOrSection?: string       // 1..120
}

record ProposalClaim {
  id: ClaimId
  regionId: RegionId
  field: FieldName
  canonicalValue: CanonicalDecimal | string | boolean
  evidenceId: EvidenceId        // resolves to sourceType=developer
}

sum VerifiedFact =
  | { kind: "regional_peak", id: FactId, regionId: RegionId,
      peakMw: Megawatts, evidenceIds: EvidenceId[] }
  | { kind: "grid_capacity", id: FactId, regionId: RegionId,
      basis: string, evidenceIds: EvidenceId[] }
  | { kind: "resilience_commitment", id: FactId, regionId: RegionId,
      resource: "battery" | "demand_response" | "fossil_backup",
      capacityMw?: Megawatts, durationHours?: number,
      commitmentConfirmed: boolean, operatingRestrictionsConfirmed?: boolean,
      evidenceIds: EvidenceId[] }
  | { kind: "economic_claim", id: FactId, regionId: RegionId,
      claim: "permanent_jobs" | "investment_nzd", value: number,
      basisDetail: string, roleDetail?: string, evidenceIds: EvidenceId[] }
  | { kind: "community_consultation", id: FactId, regionId: RegionId,
      representative: boolean, concernLevel?: "moderate" | "high",
      evidenceIds: EvidenceId[] }

record EvidenceCategoryStatus {
  category: EvidenceCategory
  status: FreshnessStatus
  asOfDate: ISODate
  freshnessPolicyVersion: SemVer
  itemIds: EvidenceId[]         // items in this category, including stale/unknown
  qualifyingCurrentItemIds: EvidenceId[]
  reasons: EvidenceStatusReason[] // non-empty
}

record EvidenceStatusReason {
  code: "within_window" | "past_window" | "valid_until_current" |
        "valid_until_expired" | "publication_date_missing" | "category_missing"
  evidenceId?: EvidenceId
  boundaryDate?: ISODate
}

record EvidenceSelection {
  regionId: RegionId
  asOfDate: ISODate
  evidenceVersion: SemVer
  freshnessPolicyVersion: SemVer
  items: EvidenceItem[]
  categories: tuple<EvidenceCategoryStatus,10> // one per enum member
  manifest: ReproducibilityManifest
}
```

Freshness uses calendar-month arithmetic against the bundle `asOfDate`, clamping to the last valid day of the target month. An item is current when `asOfDate <= validUntil` if `validUntil` exists; otherwise when `publicationDate >= subtractCalendarMonths(asOfDate, policyMonths)`. Equality is current. A missing publication date without `validUntil` is `unknown_freshness`. No items is `missing`. Stale/unknown items remain in `items` but not `qualifyingCurrentItemIds`.

Every `VerifiedFact.evidenceIds` array is non-empty and unique. Bundle validation rejects empty/dangling fact evidence so an `every(...)` authority check cannot succeed vacuously. The browser never fetches `sourceUrl` to calculate a result. Release tooling checks links; runtime links open with safe external-link attributes.

## CTR-003 — Scenario draft, trusted origin, and validation

```text
record ScenarioDraft {
  raw: map<FieldName, string | boolean | null>
  sourceSelections: map<FieldName, SourceSelection>
}

sum SourceSelection =
  | { kind: "user_edit" }
  | { kind: "preset_ref", presetId: PresetId, presetVersion: SemVer }
  | { kind: "proposal_claim_ref", claimId: ClaimId }
  | { kind: "verified_fact_ref", factId: FactId }

sum OriginProof =
  | { origin: "user_assumption", field: FieldName }
  | { origin: "preset", field: FieldName, presetId: PresetId,
      presetVersion: SemVer, canonicalValue: CanonicalDecimal | string | boolean }
  | { origin: "proposal_claim", field: FieldName, claimId: ClaimId,
      evidenceId: EvidenceId, canonicalValue: CanonicalDecimal | string | boolean }
  | { origin: "verified_evidence", field: FieldName, factId: FactId,
      evidenceIds: EvidenceId[], canonicalValue: CanonicalDecimal | string | boolean }

record CalculatedOrigin {
  origin: "calculated_value"
  calculationId: MetricId
}

record ScenarioInput {
  regionId: RegionId
  itCapacityMw: number          // finite 0.1..1000
  utilisation: Ratio           // 0.01..1
  pue: number                  // finite 1..3
  flexibleWorkloadRatio: Ratio
  coolingMethod: CoolingMethod
  backupGeneration: BackupGeneration
  permanentJobs: integer       // 0..100000
  constructionStaged: boolean
  demandResponseEnabled: boolean
  generatorRestrictionsEnabled: boolean
  batteryCapacityMw?: Megawatts
  batteryDurationHours?: number // finite >0..168
  demandResponseCapacityMw?: Megawatts
  demandResponseDurationHours?: number // finite >0..168
  investmentNzd?: number       // finite >=0
  originProofs: map<FieldName, OriginProof>
}

record ValidationIssue {
  id: string
  field?: FieldName
  severity: Severity
  code: ErrorCode
  messageKey: MessageKey
  parameters: map<string,Scalar>
  recoveryHintKey: MessageKey
}

sum ValidationResult =
  | { kind: "invalid", issues: ValidationIssue[] } // non-empty; >=1 blocking
  | { kind: "valid", input: ScenarioInput, warnings: ValidationIssue[] }
```

The validator resolves every `SourceSelection` against the active validated preset/claim/fact/evidence collections and checks canonical field-value equality. Any failed, missing, mismatched, persisted-only, or editable label becomes `user_assumption` or a blocking invalid-reference issue; it never becomes `verified_evidence`, `preset`, or `calculated_value`. `ScenarioInput.originProofs` can contain only the four `OriginProof` variants; calculations expose `CalculatedOrigin` through their metric contracts. Saved records persist `SourceSelection` references, not `OriginProof`; restore derives proofs again.

Versioned suspicion warnings initially cover capacity over 500 MW, utilisation below 10%, PUE below 1.05 or above 2.0, and permanent jobs above 10,000. Warnings never rewrite values.

## CTR-004 — Deterministic calculations and water ranges

```text
record CompleteMetric {
  status: "complete"
  id: MetricId
  value: number
  unit: "MW" | "GWh" | "ML"
  unroundedCanonical: CanonicalDecimal
  displayPrecision: integer    // 0..3
  formulaId: string
  inputRefs: JsonPointer[]
  assumptions: MessageKey[]
  manifest: ReproducibilityManifest
}

record InsufficientMetric {
  status: "insufficient_evidence"
  id: MetricId
  unit: "MW" | "GWh" | "ML"
  reasons: ReasonId[]          // non-empty
  requiredEvidenceCategories: EvidenceCategory[]
  manifest: ReproducibilityManifest
}

record FailedMetric {
  status: "failed"
  id: MetricId
  unit: "MW" | "GWh" | "ML"
  error: DomainError
  manifest: ReproducibilityManifest
}

type MetricResult = CompleteMetric | InsufficientMetric | FailedMetric

record RangeCalculation {
  minMetricId: MetricId
  maxMetricId: MetricId
  minValue: Megalitres
  maxValue: Megalitres
  minUnroundedCanonical: CanonicalDecimal
  maxUnroundedCanonical: CanonicalDecimal
  unit: "ML"
  displayPrecision: integer     // 0..3
  formulaId: "annual_water_range" | "peak_daily_water_range"
  inputRefs: JsonPointer[]       // non-empty, unique
  assumptions: MessageKey[]
  manifest: ReproducibilityManifest
}

sum WaterEstimate =
  | { status: "complete", annual: RangeCalculation,
      peakDaily: RangeCalculation,
      factorVersion: SemVer, factorEvidenceIds: EvidenceId[], // non-empty, unique
      manifest: ReproducibilityManifest }
  | { status: "insufficient_evidence", reasons: ReasonId[],
      requiredFields: FieldName[], manifest: ReproducibilityManifest }
  | { status: "failed", error: DomainError,
      manifest: ReproducibilityManifest }

record CalculationBundle {
  records: tuple<MetricResult,5>
  water: WaterEstimate
  manifest: ReproducibilityManifest
}
```

Formulas:

```text
facilityDemandMw = itCapacityMw * pue
annualEnergyGwh = facilityDemandMw * utilisation * 8760 / 1000
configuredShiftableCapacityMw = facilityDemandMw * flexibleWorkloadRatio
averageActiveLoadMw = facilityDemandMw * utilisation
averageActiveFlexibleLoadMw = averageActiveLoadMw * flexibleWorkloadRatio
annualWaterMlRange = annualEnergyGwh * [minLitresPerKwh, maxLitresPerKwh]
peakDailyWaterMlRange = facilityDemandMw * 24 / 1000 *
                        [minLitresPerKwh, maxLitresPerKwh]
```

The five tuple records are the five non-water metric IDs in declaration order. Each complete water range has finite `minValue <= maxValue`, canonical unrounded values matching those numbers, its exact annual/peak formula ID and metric-ID pair, non-empty factor/input provenance, and the same manifest as its enclosing water/calculation bundle. Display precision is presentation metadata and never feeds an assessment. Water returns `insufficient_evidence` for `unknown` cooling or missing factors. A factor error fails only water; electricity records remain complete.

## CTR-005 — Deterministic minimax flexibility simulation

```text
record SimulationConstraints {
  peakHours: HourIndex[]               // unique; deterministic profile ranking
  flexibleCapacityMw: Megawatts
  baselineActiveLoadMw: Megawatts
  destinationFacilityCapMw: Megawatts // facilityDemand * maxDestinationUtilisation
  originalCombinedPeakMw: Megawatts
  toleranceMw: 0.000000001
}

record HourPoint {
  hour: HourIndex
  regionalMw: Megawatts
  baselineFacilityMw: Megawatts
  shiftedFacilityMw: Megawatts
  baselineCombinedMw: Megawatts
  shiftedCombinedMw: Megawatts
}

record ShiftMovement {
  fromHour: HourIndex
  toHour: HourIndex
  energyMwh: MegawattHours
}

record OptimalityCertificate {
  objective: "minimise_max_combined_load"
  optimalPeakMw: Megawatts
  lastInfeasibleLowerPeakMw: Megawatts
  toleranceMw: 0.000000001
  feasibilityIterations: integer // 0..80
  tieBreak: "source_hour_then_destination_hour_ascending"
}

sum SimulationBundle =
  | { status: "complete", simulationVersion: SemVer,
      profileId: string, profileVersion: SemVer,
      constraints: SimulationConstraints, hours: tuple<HourPoint,24>,
      movements: ShiftMovement[], totalShiftedMwh: MegawattHours,
      remainingEligibleMwh: MegawattHours,
      baselineCombinedPeakMw: Megawatts, shiftedCombinedPeakMw: Megawatts,
      peakReductionMw: Megawatts, certificate: OptimalityCertificate,
      disclosures: MessageKey[], manifest: ReproducibilityManifest }
  | { status: "failed", error: DomainError,
      manifest: ReproducibilityManifest }
```

Mandatory complete-state invariants, each within `1e-9`:

- `destinationFacilityCapMw >= baselineActiveLoadMw`; otherwise the simulator returns failed `SIMULATION_INFEASIBLE` before optimization;
- each facility load is in `[0, facilityDemandMw]`;
- total baseline facility MWh equals total shifted facility MWh;
- source removal per peak hour is at most `averageActiveFlexibleLoadMw` and never below zero facility load;
- destinations exclude source peak hours and never exceed `destinationFacilityCapMw`;
- every destination combined load is at most the original combined peak;
- total moved energy equals the movement ledger and is at most total eligible source energy;
- movements stay inside the 24-hour window and never have equal source/destination;
- `shiftedCombinedPeakMw` equals `max(hours.shiftedCombinedMw)`;
- the reported target is exactly feasible under the deterministic predicate, `lastInfeasibleLowerPeakMw` is lower and exactly infeasible, and their gap is at most the stated tolerance when binary search is used;
- peak reduction is exactly `max(0, baselinePeak - shiftedPeak)`.

## CTR-006 — Evidence-qualified assessments

```text
record AssessmentReason {
  id: ReasonId
  messageKey: MessageKey
  parameters: map<string,Scalar>
  inputRefs: JsonPointer[]
  calculationIds: MetricId[]
  evidenceIds: EvidenceId[]
  factIds: FactId[]
  thresholdVersion?: SemVer
}

record MissingInformation {
  id: MissingInformationId
  category: AssessmentCategory
  questionKey: MessageKey
  whyNeededKey: MessageKey
}

record CompletedCategoryAssessment {
  status: "complete"
  category: AssessmentCategory
  outcome: AssessmentOutcome
  reasons: AssessmentReason[]           // non-empty
  qualifyingEvidenceIds: EvidenceId[]
  contextualEvidenceIds: EvidenceId[]   // may include stale/unknown
  missingInformation: MissingInformation[]
  policyVersion: SemVer
  manifest: ReproducibilityManifest
}

record FailedCategoryAssessment {
  status: "failed"
  category: AssessmentCategory
  error: DomainError
  manifest: ReproducibilityManifest
}

type CategoryAssessmentResult = CompletedCategoryAssessment |
                                FailedCategoryAssessment

enum OverallNarrativeId = substantial_issues_require_investigation |
                          evidence_incomplete | potentially_suitable_with_conditions |
                          lower_concern_professional_review_required

record AssessmentBundle {
  categories: tuple<CategoryAssessmentResult,5> // enum order
  overallNarrativeId: OverallNarrativeId
  precedenceTrigger: "high_concern" | "insufficient_or_failed" |
                     "moderate_concern" | "all_low"
  hasOverallScore: false
  manifest: ReproducibilityManifest
}
```

Policy contracts:

- Electricity uses `(shiftedCombinedPeakMw - regionalPeakMw) / regionalPeakMw`: `<=0.05` low, `>0.05 && <=0.15` moderate, `>0.15` high. Low additionally requires current authoritative electricity-demand and grid evidence. Missing profile/decisive evidence is insufficient.
- Water uses the worse concern band from conservative `water.annual.maxValue` and `water.peakDaily.maxValue`. Any banded outcome requires current authoritative water evidence and valid source-backed absolute thresholds; otherwise insufficient.
- Fossil backup (`diesel`, `gas`, or `mixed`) is assessed before any battery or demand-response claim: no operating restrictions is high, current verified restrictions is moderate, and unverified restrictions is insufficient. Only a non-fossil scenario may be low, and then only with a current verified battery or demand-response fact carrying positive capacity, duration, and confirmed commitment. Unknown/unspecified or missing decisive evidence is insufficient.
- Economic low requires each material jobs/investment field to carry a `verified_evidence` origin proof referencing a current authoritative exact-value fact with basis detail and role detail when jobs apply. Unsupported user/developer/preset claims are moderate; contradictory values or suspicion-rule violations are high; absent material claims are insufficient.
- Community is insufficient without current representative-consultation evidence. Current source-backed concerns yield moderate/high from the fact severity. The MVP never emits low community concern.
- Overall precedence is any high, otherwise any insufficient or failed, otherwise any moderate, otherwise all low. No score or approval/rejection field exists.

The five-category tuple order is electricity, water, resilience, economic contribution, and community, with each category exactly once. Semantic validation rejects a category/order mismatch and rejects `category=community` with `outcome=low_concern`. The generic all-low reducer branch remains tested as an approved precedence rule, although a valid MVP bundle cannot reach it while community-low is prohibited.

## CTR-007 — Immutable result snapshot and comparison

```text
record ResultSnapshot {
  snapshotId: SnapshotId
  createdAt: ISODateTime
  correlationId: CorrelationId
  scenario: ScenarioInput
  manifest: ReproducibilityManifest
  calculations: CalculationBundle
  simulation: SimulationBundle
  evidence: EvidenceSelection
  assessment: AssessmentBundle
}

record Difference<T> {
  baseline: T
  improved: T
  absoluteDelta: T
  percentDelta?: number
}

record FieldChange {
  field: FieldName
  baseline: Scalar
  improved: Scalar
}

record CategoryOutcomeChange {
  category: AssessmentCategory
  baseline: AssessmentOutcome | "failed"
  improved: AssessmentOutcome | "failed"
}

record ComparisonBundle {
  baselineSnapshotId: SnapshotId
  improvedSnapshotId: SnapshotId
  differences: map<ComparableMetricId,Difference<number>>
  unavailableMetricIds: ComparableMetricId[]
  changedInputs: FieldChange[]
  changedOutcomes: CategoryOutcomeChange[]
  tradeoffKeys: MessageKey[]
}
```

`snapshotId` hashes canonical normalized input, all constituent version pins, and deterministic result fields; timestamps and correlation IDs are excluded. It is a reproducibility identifier, not tamper-proof attestation. Comparison includes only compatible complete values and lists unavailable metrics explicitly.

## CTR-008 — Deterministic impact brief

```text
record TraceRef {
  kind: "calculation" | "evidence" | "fact" | "assumption" |
        "preset" | "warning" | "assessment"
  id: string
}

record BriefStatement {
  id: StatementId
  sectionId: string
  semanticRole: SemanticRole
  required: boolean
  templateKey: MessageKey
  parameters: map<string,Scalar>
  renderedText: string
  traces: TraceRef[] // non-empty for every material factual statement
}

record ImpactBrief {
  snapshotId: SnapshotId
  audience: Audience
  generatedBy: "deterministic_template" |
               "deterministic_with_presentation_plan"
  orderedStatements: BriefStatement[]
  sources: EvidenceItem[]
  assumptions: OriginProof[]
  unresolvedQuestions: MissingInformation[]
  disclaimerStatementId: StatementId
  manifest: ReproducibilityManifest
}
```

The composer reconstructs `renderedText` from templates and typed parameters. A presentation plan may reorder statements and omit only `required=false` context statements. It cannot alter any `BriefStatement`. The deterministic disclaimer is required and appears in copied Markdown/plain text.

## CTR-009 — Transactional IndexedDB persistence

```text
const DATABASE_NAME = "gridlens-nz"
const DATABASE_VERSION = 2
const STORAGE_SCHEMA_VERSION = "2.0.0"
const MAX_ACTIVE_SCENARIOS = 20
const MAX_RECORD_BYTES = 65536
const MAX_OPERATION_RECORDS = 2000
const MAX_TOMBSTONES = 1000
const MAX_QUARANTINE_RECORDS = 100

enum ObjectStoreName = scenarios | tombstones | operations | quarantine | metadata

record StoreMetadata {
  key: "singleton"
  databaseEpoch: DatabaseEpoch
  storageSchemaVersion: SemVer
  legacyV1ImportComplete: boolean
}

record SavedScenarioEnvelope {
  databaseEpoch: DatabaseEpoch
  storageSchemaVersion: SemVer
  inputSchemaVersion: SemVer
  id: ScenarioId
  revision: integer             // >=1, increments by one
  label: string                 // 1..80
  createdAt: ISODateTime
  updatedAt: ISODateTime
  sourceSelections: map<FieldName,SourceSelection>
  rawScenario: map<FieldName,string | boolean | null>
  savedManifest: ReproducibilityManifest
}

record ScenarioTombstone {
  databaseEpoch: DatabaseEpoch
  storageSchemaVersion: SemVer
  id: ScenarioId
  deletedRevision: integer      // >= last scenario revision + 1
  deletedAt: ISODateTime
  operationId: OperationId
}

record PersistenceOperation {
  databaseEpoch: DatabaseEpoch
  operationId: OperationId
  commandSha256: Sha256         // canonical command identity excluding transient time
  kind: "create" | "update" | "delete" | "migrate" | "quarantine"
  scenarioId: ScenarioId
  expectedRevision?: integer
  completedAt: ISODateTime
  outcome: "created" | "updated" | "deleted" | "migrated" | "quarantined"
  resultingRevision: integer
}

sum PersistenceCommand =
  | { kind: "create", databaseEpoch: DatabaseEpoch, operationId: OperationId,
      scenarioId: ScenarioId, label: string,
      rawScenario: map<FieldName,string | boolean | null>,
      sourceSelections: map<FieldName,SourceSelection> }
  | { kind: "update", databaseEpoch: DatabaseEpoch, operationId: OperationId,
      scenarioId: ScenarioId, expectedRevision: integer, label: string,
      rawScenario: map<FieldName,string | boolean | null>,
      sourceSelections: map<FieldName,SourceSelection> }
  | { kind: "delete", databaseEpoch: DatabaseEpoch, operationId: OperationId,
      scenarioId: ScenarioId, expectedRevision: integer }

record QuarantinedRecord {
  quarantineId: string
  originalStore: ObjectStoreName
  scenarioId?: ScenarioId
  detectedAt: ISODateTime
  reasonCode: ErrorCode
  rawSha256: Sha256
  rawValue: unknown             // never executed; visible only to delete/export diagnostics
}

record VersionDriftNotice {
  field: JsonPointer
  savedVersion: string
  currentVersion: string
  consequenceKey: MessageKey
}

sum PersistenceResult<T> =
  | { kind: "success", value: T, operation: PersistenceOperation }
  | { kind: "conflict", currentRevision?: integer,
      tombstoneRevision?: integer, error: DomainError }
  | { kind: "failure", error: DomainError }
```

`create`, `update`, and `delete` execute scenario/tombstone/operation writes in one `readwrite` transaction. Every command, active envelope, tombstone, and operation must match the singleton `StoreMetadata.databaseEpoch`; an old-epoch command conflicts before mutation. Retrying a completed `operationId` in the same epoch with the same command hash returns the stored outcome without another mutation; reuse with a different command is a conflict. Updates require `expectedRevision`; mismatch is conflict. Deletes create/update a tombstone in the same transaction and remove the scenario. A write with revision not greater than a tombstone is rejected, preventing resurrection. The logical identity is `(databaseEpoch, scenarioId)`; the UI generates a fresh UUID for every create and never lets a caller revive an old identity. Independent IDs both survive concurrent tabs.

At the operation or tombstone cap, the application performs an atomic epoch compaction over `metadata`, `scenarios`, `tombstones`, and `operations`: compare the expected epoch, generate a fresh epoch, rewrite all active envelopes under it without changing their scenario IDs or revisions, clear operations and tombstones, then update metadata and commit. A racing compaction or every command from a stale tab conflicts on the old epoch, so cleared tombstones cannot enable resurrection and cleared operations cannot enable a duplicate retry. The caller refreshes metadata and issues a new canonical command with a new operation ID. This is a generation change, not age-based pruning, and preserves all active scenarios.

Quarantine evidence is never automatically pruned. When its cap is reached, another quarantine attempt returns `STORAGE_QUARANTINE_FULL`, leaves the invalid source record inert and unchanged, and offers explicit export/delete maintenance; ordinary valid mutations remain available. The 20-active-record and 64-KiB per-record caps reject only the proposed write with `STORAGE_QUOTA` and never delete user scenarios.

Startup opens IndexedDB v2 and performs sequential, idempotent migrations. The supported legacy path is the draft v1 collection key `gridlens.saved-scenarios.v1` to v2 per-record envelopes: parse/validate each record, import valid records with revision 1 and user-assumption source selections unless resolvable immutable references exist, quarantine invalid records individually, then set a metadata import-complete marker. The legacy key is retained until a successful readback audit, then removal is recoverable only through the browser’s storage controls. Unsupported future major versions are quarantined, never coerced.

Restore re-derives origin proofs, recalculates with current bundles, and returns every `VersionDriftNotice`; it never restores cached results or presentation plans.

## CTR-010 — Optional presentation-plan gateway

### Endpoint

`POST /api/presentation-plan`

JSON only, maximum 64 KiB, no cookies or user prompt, maximum 50 statements, default timeout 8 seconds, no automatic retry for the same render.

```text
record PlanStatement {
  id: StatementId
  sectionId: string
  semanticRole: SemanticRole
  required: boolean
  allowedConnectives: ConnectiveToken[] // deterministic per-slot subset
}

enum ConnectiveToken = none | additionally | however | meanwhile

record PresentationPlanRequest {
  contractVersion: "2.0.0"
  snapshotId: SnapshotId
  requestGenerationId: RequestGenerationId
  audience: Audience
  statements: PlanStatement[]   // unique IDs; 1..50
}

record PlannedStatement {
  statementId: StatementId
  connectiveBefore: ConnectiveToken
}

record PresentationPlan {
  contractVersion: "2.0.0"
  snapshotId: SnapshotId
  requestGenerationId: RequestGenerationId
  audience: Audience
  ordered: PlannedStatement[]   // unique IDs
}
```

Validation requires every required request ID exactly once in `ordered`; optional IDs may appear zero or one time; no unknown or duplicate ID is accepted; each connective must be in that statement's deterministic `allowedConnectives`. The response schema has no free-text field. The client also requires exact snapshot, audience, and currently active generation match after awaiting the response. Any mismatch discards the entire plan. The browser then applies deterministic connective text and reconstructs factual statements from CTR-008. The gateway rate limit may return `429` with `Retry-After`; missing configuration returns typed `503 PRESENTATION_DISABLED`.

## CTR-011 — Diagnostic events

```text
record DiagnosticEvent {
  eventVersion: "2.0.0"
  timestamp: ISODateTime
  correlationId: CorrelationId
  category: "startup" | "data" | "geometry" | "validation" |
            "calculation" | "simulation" | "evidence" | "assessment" |
            "storage" | "presentation" | "rendering"
  componentId: string
  componentVersion: SemVer
  outcome: "success" | "partial" | "failure" | "cancelled" | "conflict"
  durationMs?: integer          // >=0
  errorCode?: ErrorCode
}
```

Forbidden fields include scenario values, labels, evidence text, rendered/generated prose, source URLs, stack traces in user messages, keys/tokens, and raw IndexedDB/quarantine payloads.

## Error taxonomy

```text
enum ErrorCode =
  INVALID_REQUIRED | INVALID_NUMBER | INVALID_RANGE | INVALID_ENUM |
  INVALID_DATE | SUSPICIOUS_VALUE | ORIGIN_REFERENCE_INVALID |
  ORIGIN_VALUE_MISMATCH | UNSUPPORTED_REGION | MANIFEST_FETCH_FAILED |
  MANIFEST_INVALID | ASSET_HASH_MISMATCH | REGION_BUNDLE_FETCH_FAILED |
  REGION_BUNDLE_INVALID | GEOMETRY_INVALID | GEOMETRY_REGION_MISMATCH |
  VERSION_INCOMPATIBLE | CROSS_REFERENCE_MISSING | SOURCE_LINK_BROKEN |
  CALCULATION_INPUT_MISSING | CALCULATION_NON_FINITE |
  WATER_FACTOR_MISSING | WATER_THRESHOLD_MISSING | PROFILE_INVALID |
  SIMULATION_INFEASIBLE | SIMULATION_INVARIANT_FAILED |
  ASSESSMENT_INPUT_MISSING | ASSESSMENT_POLICY_INVALID |
  EVIDENCE_MISSING | EVIDENCE_DATE_INVALID |
  STORAGE_UNAVAILABLE | STORAGE_QUOTA | STORAGE_QUARANTINE_FULL |
  STORAGE_CONFLICT |
  STORAGE_COMMIT_INDETERMINATE | STORAGE_CORRUPT |
  STORAGE_VERSION_UNSUPPORTED | STORAGE_MIGRATION_FAILED |
  CLIPBOARD_DENIED | PRESENTATION_DISABLED | PRESENTATION_TIMEOUT |
  PRESENTATION_RATE_LIMITED | PRESENTATION_REQUEST_INVALID |
  PRESENTATION_RESPONSE_INVALID | PRESENTATION_STALE |
  PRESENTATION_PROVIDER_FAILED | CANCELLED | INTERNAL_UNEXPECTED

record DomainError {
  code: ErrorCode
  scope: DomainErrorScope
  messageKey: MessageKey
  parameters: map<string,Scalar>
  recoverable: boolean
  recoveryHintKey?: MessageKey
}
```

Component boundaries catch internal exceptions, convert them to `DomainError`, and emit CTR-011. UI rendering uses message keys/parameters, never raw exception strings.

## Configuration and secret contract

```text
// browser-visible build configuration
PUBLIC_APP_VERSION: SemVer
PUBLIC_DATA_MANIFEST_URL: same-origin absolute path
PUBLIC_PRESENTATION_ENABLED: "true" | "false"

// server-only optional configuration
AI_PROVIDER_API_KEY: secret
AI_PROVIDER_MODEL: allowlisted deployment value
AI_PROVIDER_BASE_URL: allowlisted https origin
AI_REQUEST_TIMEOUT_MS: integer 1000..15000, default 8000
```

The build fails if server-only names are referenced from browser modules. Missing optional server configuration disables only the endpoint.

## Compatibility rules

- Major schema mismatch rejects or quarantines; no implicit coercion.
- Minor/patch additions may be ignored only when the field is explicitly optional and enum exhaustiveness is unchanged.
- Enum additions are incompatible until every consumer handles them deliberately.
- Deployment assets are immutable within one release ID and verified against content hashes.
- Formula, simulation, freshness, threshold, geometry, or assessment-policy changes increment their own versions and require golden/oracle review.
- IndexedDB migrations are explicit, sequential, transactional, idempotent, and preserve/quarantine the original on failure.
- Presentation-plan contract changes require concurrent client/gateway support or feature disablement.

## Producer/consumer and contract-test matrix

| Contract | Producer | Every consumer | Planned contract tests |
|---|---|---|---|
| CTR-001 | Curated data build | CMP-DATA-01, CMP-GEO-01, CMP-EVD-01, CMP-FLX-01, CMP-ASM-01 | CT-DATA-001..018, CT-GEO-001..012 |
| CTR-002 | Curated data build and CMP-EVD-01 | CMP-ASM-01, CMP-RPT-01, CMP-UI-01 | CT-EVD-001..016 |
| CTR-003 | CMP-UI-01 and CMP-VAL-01 | CMP-CAL-01, CMP-FLX-01, CMP-ASM-01, CMP-SAVE-01 | CT-SCN-001..018, CT-ORIGIN-001..012 |
| CTR-004 | CMP-CAL-01 | CMP-FLX-01, CMP-ASM-01, CMP-RPT-01, CMP-UI-01 | CT-CAL-001..018, CT-WATER-001..012 |
| CTR-005 | CMP-FLX-01 | CMP-ASM-01, CMP-RPT-01, CMP-UI-01 | CT-FLX-001..024 |
| CTR-006 | CMP-ASM-01 | CMP-RPT-01, CMP-UI-01 | CT-ASM-001..032 |
| CTR-007 | CMP-WEB-01 | CMP-WEB-01 comparison, CMP-RPT-01, CMP-AI-01 | CT-SNAP-001..014 |
| CTR-008 | CMP-RPT-01 | CMP-UI-01 and clipboard adapter | CT-RPT-001..016 |
| CTR-009 | CMP-SAVE-01 | CMP-WEB-01 and saved-scenario UI | CT-SAVE-001..026, CT-MIG-001..012 |
| CTR-010 | CMP-AI-01 and CMP-EDGE-01 | CMP-EDGE-01 and CMP-RPT-01 | CT-AI-001..024 |
| CTR-011 | CMP-OBS-01 | Browser and optional host diagnostic sinks | CT-OBS-001..010 |

## Requirement traceability

| Contract groups | Requirements served |
|---|---|
| CTR-001, CTR-002 | FR-LOC-001, FR-LOC-002, FR-EVD-001, FR-EVD-002, FR-EVD-003, FR-EVD-004, FR-DAT-001, FR-DAT-002, FR-ERR-001 |
| CTR-003 | FR-SCN-001, FR-SCN-002, FR-SCN-003, NFR-SEC-001, NFR-EXP-001 |
| CTR-004 | FR-CAL-001, FR-CAL-004, FR-CAL-005, FR-CAL-006, NFR-REL-001, NFR-REL-002, NFR-EXP-001 |
| CTR-005 | FR-CAL-002, FR-CAL-003, FR-CAL-007, NFR-PER-001, NFR-REL-001 |
| CTR-006 | FR-CRT-001, FR-ASM-001, FR-ASM-002, FR-ASM-003, FR-ASM-004, FR-ASM-005, FR-ASM-006, FR-ASM-007, FR-ASM-008 |
| CTR-007 | FR-CMP-001, FR-RES-001, NFR-REL-001, NFR-REL-002 |
| CTR-008 | FR-RES-002, FR-RES-003, FR-RPT-001, FR-RPT-002, FR-RPT-003, NFR-ACC-001, NFR-EXP-001 |
| CTR-009 | FR-LOCALSAVE-001, FR-LOCALSAVE-002, NFR-PRI-001, NFR-SEC-001 |
| CTR-010 | FR-RPT-003, FR-ERR-001, NFR-SEC-002, NFR-MNT-002, NFR-PRI-001 |
| CTR-011 | NFR-OBS-001 |
| Compatibility and configuration | NFR-PER-002, NFR-MNT-001, NFR-DEP-001, CON-001, CON-002, CON-003, CON-004, CON-005, CON-006, CON-007 |
