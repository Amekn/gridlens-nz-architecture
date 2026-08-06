# GridLens NZ — Whole-system contracts

**Artifact version:** 0.12 draft
**Status:** Phase 4 design; awaiting independent Gate 3 validation
**Approved baseline:** Requirements 0.5, Usage Definition 0.5, Architecture 0.4 Option A

**Normative precedence:** the v0.12 reconciliation at the end of this artifact is the only effective browser/server schema graph. It supersedes conflicting v0.4–v0.11 connector, vault, provider, map-selection, route, source-registry, and research-cache rules. Historical V2 types remain design history only unless v0.12 explicitly imports a named deterministic type.

## Contract principles

1. All cross-module, cross-worker, storage, data-pack, connector, agent, and visual boundaries are versioned and schema-validated.
2. Every record uses a stable opaque ID. Display labels, URLs, coordinates, model text, restored state, and graph connectivity never grant trust.
3. Authoritative operations are deterministic functions of normalized input plus an explicit versioned evidence/policy snapshot and pinned `asOf` instant.
4. Mutable commands use stable operation IDs and revisions. Long-running work also uses a request generation; obsolete responses are rejected.
5. Partial, insufficient, unavailable, cancelled, and failed states are typed outcomes, not missing fields or exceptions hidden by the UI.
6. External content is inert data. No contract contains executable HTML, script, CSS, formula, function, event handler, or arbitrary tool invocation.
7. Secret bytes occur only in the connector worker/vault boundary and authorized outbound header/body. All other contracts use sanitized connector IDs/labels.
8. Unknown schema versions, enum members, units, IDs, graph edges, visual fields, or diagnostic fields fail closed.

## CTR-000 — Common scalars, envelopes, and errors

```text
type SchemaVersion = positive integer
type SemanticVersion = "MAJOR.MINOR.PATCH"
type StableId = non-empty ASCII string matching a contract-specific prefix
type Sha256 = 64 lowercase hexadecimal characters
type Instant = RFC3339 UTC instant with explicit Z
type LocalDate = YYYY-MM-DD
type IanaTimeZone = "Pacific/Auckland" | registered IANA identifier
type Url = parsed absolute HTTPS URL, except same-origin relative asset URLs
type CorrelationId = "corr_" + UUIDv7
type OperationId = "op_" + UUIDv7
type Generation = unsigned safe integer
type Revision = unsigned safe integer
type ErrorCode = StableId
type CommandKind = StableId

record ContractEnvelope<T> {
  schemaVersion: SchemaVersion
  kind: exact discriminant
  id: StableId
  createdAt: Instant
  payload: T
}

record UnitValue {
  value: finite decimal string
  unit: UnitCode
}

enum UnitCode {
  MW, MWh, GWh, kW, kWh,
  NZD, NZD_per_MWh,
  kgCO2e_per_kWh, tCO2e,
  L_per_kWh, m3, m3_per_day,
  percent, ratio, count, km, degrees
}

enum ResultStatus { complete, insufficient_evidence, failed }
enum CoverageState { complete, partial, stale, missing, failed }
enum FreshnessState { current, stale, unknown, future_invalid }
enum Severity { info, warning, blocking }

record DomainError {
  code: ErrorCode
  category: validation | data | calculation | storage | connector | security | cancelled | internal
  retryable: boolean
  safeMessageId: StableId
  fieldPath?: bounded JSON Pointer
  sourceOrConnectorId?: StableId
  correlationId: CorrelationId
  details: allowlisted scalar map without content or secrets
}
```

Decimals cross contracts as canonical decimal strings. Domain calculations use one chosen decimal implementation; binary floating-point display values never become the oracle. IDs and hashes are correlation/integrity identifiers, not signatures or third-party attestation.

## CTR-001 — Main-thread/worker protocol

```text
record WorkerCommand<T> {
  schemaVersion: 1
  kind: CommandKind
  operationId: OperationId
  generation: Generation
  correlationId: CorrelationId
  deadlineAt: Instant
  payload: T
}

union WorkerEvent<T> =
  | { kind: "accepted", operationId, generation }
  | { kind: "progress", operationId, generation, phaseId, completed, total? }
  | { kind: "completed", operationId, generation, payload: T }
  | { kind: "partial", operationId, generation, payload: T, errors: DomainError[] }
  | { kind: "cancelled", operationId, generation, reasonId }
  | { kind: "failed", operationId, generation, errors: DomainError[] }

record CancelCommand {
  operationId: OperationId
  generation: Generation
  reason: user | superseded | deadline | shutdown
}
```

Rules:

- UI → coordinator → worker messages are cloned data and validated on both ends.
- At most one terminal event is accepted for an operation/generation.
- A terminal event with a generation lower than the coordinator’s current generation for that state slot is acknowledged then discarded.
- Cancellation is cooperative. Each bounded loop checks before/after I/O and at least every 10 ms of CPU work; a hard worker restart is the last resort.
- Worker restart increments generation, rebuilds indexes from validated packs, and never replays a secret-bearing command automatically.

## CTR-002 — Release manifest, source registry, and data packs

```text
record ReleaseManifest {
  schemaVersion: 1
  releaseId: "rel_" + content-derived ID
  appVersion: SemanticVersion
  generatedAt: Instant
  compatiblePackSchemaMajors: integer[]
  corePackIds: PackId[]
  optionalPackIds: PackId[]
  sourceRegistryId: PackId
  freshnessPolicyId: StableId
  assessmentPolicyId: StableId
  geometrySetId: StableId
  statementTemplateSetId: StableId
  files: AssetDescriptor[]
}

record AssetDescriptor {
  relativeUrl: same-origin relative URL
  sha256: Sha256
  byteLength: positive integer
  mediaType: allowlisted media type
  cacheClass: shell | core | on_demand | never
}

record DataPackManifest {
  schemaVersion: 1
  packId: PackId
  packKind: source_registry | geometry | catalog | regional_context |
            electricity | policy | project_case | document_index
  semanticVersion: SemanticVersion
  createdAt: Instant
  asOf: Instant
  contentSha256: Sha256
  byteLength: positive integer
  dependencyPackIds: PackId[]
  compatibleAppRange: bounded semver range
  geographyIds: GeographyId[]
  sourceIds: SourceId[]
  coverage: CoverageRecord[]
}

record SourceRegistryEntry {
  sourceId: SourceId
  publisher: non-empty text
  title: non-empty text
  authorityScope: bounded text
  sourceType: EvidenceType
  accessMode: prepared_file | public_cors | keyed_cors | provider_side | link_only | disabled
  approvedOrigins: normalized HTTPS origin[]
  methods: GET | POST allowlist
  authMode: none | api_key_header | bearer_header | key_query_secret | provider_managed
  expectedCors: boolean
  licenceId: stable licence record ID
  attribution: non-empty text
  permittedPurpose: bounded text
  quotaSummary?: bounded text
  refreshCadence?: ISO8601 duration
  spatialResolution?: bounded text
  temporalResolution?: bounded text
  supportedFields: stable field ID[]
  fallback: prepared | link | provider_research | none
  enabledState: enabled | prepared_only | link_only | agent_only | disabled
  disabledReasonId?: StableId
}

record RawAssetReceipt {
  sourceId: SourceId
  resourceUrl: Url
  retrievedAt: Instant
  etag?: bounded text
  lastModified?: Instant
  sha256: Sha256
  byteLength: positive integer
  licenceId: StableId
  coverageStart?: Instant
  coverageEnd?: Instant
  parserVersion: SemanticVersion
  transformations: TransformationReceipt[]
}

record TransformationReceipt {
  transformationId: StableId
  transformationVersion: SemanticVersion
  inputHash: Sha256
  outputHash: Sha256
}
```

Pack activation is atomic over the full dependency graph. The runtime re-hashes fetched assets before activation where the browser API permits; build verification always hashes them. An invalid optional pack is isolated; an invalid core compatibility graph prevents that release generation from activating.

## CTR-003 — Geography, map, catalog, and layers

```text
type GeographyId = "geo_" + stable Stats-derived code

record GeographyRecord {
  geographyId: GeographyId
  officialCode: bounded text
  name: bounded text
  kind: regional_council | area_outside_region
  geometrySetId: StableId
  bboxWgs84: [west, south, east, north]
  polygonRef: StableId
  sourceEvidenceId: EvidenceId
}

record LocationSelection {
  geographyId?: GeographyId
  pointWgs84?: { longitude: decimal, latitude: decimal }
  method: map | list | coordinate | project | restored
  resolution: inside | boundary_tie | outside_recognized_geometry | unresolved
  candidateOnly: true
  geometrySetId: StableId
}

enum ProjectStatus { existing, proposed, candidate }

record ProjectCatalogRecord {
  projectId: ProjectId
  name: bounded text
  aliases: bounded text[]
  status: ProjectStatus
  pointWgs84: coordinate
  geographyId?: GeographyId
  capacityMw?: UnitValue
  stage: bounded controlled value
  ownerCompanyId?: CompanyId
  operatorCompanyId?: CompanyId
  casePackId?: PackId
  evidenceCoverage: CoverageRecord[]
  sourceEvidenceIds: EvidenceId[]
}

record MapLayerDescriptor {
  layerId: StableId
  category: projects | electricity | water | connectivity | population |
            environment | hazards | consent | community | company | evidence_coverage
  state: enabled | disabled | qualified
  sourceIds: SourceId[]
  observationOrPublicationAt?: Instant
  coverage: CoverageState
  confidence: authoritative | contextual | approximate | incomplete | unknown
  geometrySemantics: point | line | polygon | raster | none
  qualificationMessageId?: StableId
  featureBudget: positive integer
}
```

Point-in-polygon may return multiple matches only on shared boundaries; choose the lexicographically smallest `geographyId` and record `boundary_tie`. No nearest geography is substituted. Map and accessible list consume the same selection and feature IDs.

## CTR-004 — Scenario drafts, normalized inputs, and origin proof

```text
record ScenarioDraft {
  scenarioId?: ScenarioId
  name: text
  location: LocationSelection
  itCapacityMw: user text
  workloadType: general | ai_training | ai_inference | mixed | custom
  workloadDescription?: text
  utilisationPercent: user text
  pue: user text
  coolingMethod: air | evaporative | water_cooled | hybrid | unknown | custom
  coolingDescription?: text
  flexibleWorkloadPercent: user text
  backupGeneration: none | battery | diesel | gas | mixed | unknown | custom
  backupRestriction: unrestricted | emergency_only | time_limited | verified_restricted | unknown
  backupCapacityMw?: user text
  backupDurationHours?: user text
  demandResponse: none | claimed | verified | unknown
  stage: concept | announced | application | consented | construction | operating | unknown
  stagingDescription?: text
  ownershipType: owner_operator | colocation | public_private | unknown | custom
  constructionJobs?: user text
  permanentJobs?: user text
  investmentNzd?: user text
  wasteHeatReuseClaim: none | claimed | committed_verified | unknown
  proposalId?: text
  companyId?: text
}

record NormalizedScenario {
  schemaVersion: 1
  scenarioId: ScenarioId
  name: bounded normalized text
  location: LocationSelection
  itCapacityMw: Decimal
  workload: controlled value + optional bounded description
  utilisationRatio: Decimal
  pue: Decimal
  cooling: controlled value + optional bounded description
  flexibleWorkloadRatio: Decimal
  backup: normalized backup record
  demandResponse: normalized demand-response record
  stage: controlled value
  stagingDescription?: bounded text
  ownershipType: controlled value
  constructionJobs?: non-negative integer
  permanentJobs?: non-negative integer
  investmentNzd?: Decimal
  wasteHeatReuseClaim: controlled value
  proposalId?: bounded text
  companyId?: bounded text
  originProofs: map<FieldPath, OriginProof>
}

enum OriginKind { user_assumption, versioned_preset, proposal_claim, verified_evidence, calculated }

record OriginProof {
  fieldPath: bounded JSON Pointer
  origin: OriginKind
  issuedBy: validation_engine | calculation_engine | active_preset | prepared_evidence_reference
  sourceId?: StableId
  evidenceId?: EvidenceId
  packId?: PackId
  operationId: OperationId
}

record ValidationIssue {
  fieldPath: bounded JSON Pointer
  code: StableId
  severity: Severity
  rejectedValueClass: empty | syntax | range | incompatible | suspicious | untrusted_origin
  messageId: StableId
}
```

Hard numeric/resource bounds are computational, not assessment thresholds: capacity `(0, 100000] MW`, utilisation `[0,1]`, PUE `[1,5]`, flexibility `[0,1]`, backup capacity `[0,100000] MW`, duration `[0,720] h`, jobs integers `[0,10,000,000]`, investment `[0,10^15] NZD`. Values over 1,000 MW capacity, PUE over 3, jobs over 10,000, or investment over `10^11 NZD` warn but remain valid. Unknown/custom values never silently map to a favourable preset.

## CTR-005 — Calculation, water, and reproducibility

```text
record MetricTrace {
  metricId: StableId
  formulaVersion: SemanticVersion
  expressionId: StableId
  normalizedInputs: map<FieldPath, UnitValue | scalar>
  unrounded: UnitValue
  display: bounded text
  roundingRuleId: StableId
  assumptions: StableId[]
}

union MetricResult<T> =
  | { status: complete, value: T, trace: MetricTrace }
  | { status: insufficient_evidence, missing: MissingRecord[], partialTrace?: MetricTrace }
  | { status: failed, errors: DomainError[], partialTrace?: MetricTrace }

record WaterFactor {
  factorId: StableId
  coolingMethod: controlled value
  minimumLitresPerKwh: Decimal
  maximumLitresPerKwh: Decimal
  sourceEvidenceIds: EvidenceId[]
  semanticVersion: SemanticVersion
  applicableFrom?: Instant
  applicableUntil?: Instant
}

record WaterRange {
  minimumM3PerYear: Decimal
  maximumM3PerYear: Decimal
  minimumM3PerDayAverage: Decimal
  maximumM3PerDayAverage: Decimal
  minimumM3PerPeakDay: Decimal
  maximumM3PerPeakDay: Decimal
  factorId: StableId
  conservativeAssessmentValueM3PerYear: Decimal
  conservativeAssessmentValueM3PerPeakDay: Decimal
}

record CalculationBundle {
  facilityDemandMw: MetricResult<Decimal>
  annualEnergyGwh: MetricResult<Decimal>
  maximumFlexibleLoadMw: MetricResult<Decimal>
  waterRange: MetricResult<WaterRange>
}

record ReproducibilityManifest {
  schemaVersion: 1
  appVersion: SemanticVersion
  calculationVersion: SemanticVersion
  flexibilityVersion: SemanticVersion
  assessmentPolicyId: StableId
  freshnessPolicyId: StableId
  statementTemplateSetId: StableId
  releaseId: StableId
  packIdsAndHashes: map<PackId, Sha256>
  sourceAdapterVersions: map<SourceId, SemanticVersion>
  geometrySetId: StableId
  profileIds: StableId[]
  factorIds: StableId[]
  thresholdIds: StableId[]
  evidenceSnapshotId: StableId
  asOf: Instant
  normalizedScenario: NormalizedScenario
  algorithmParameters: allowlisted scalar map
}
```

Formulas use exact decimals:

```text
facilityDemandMw = itCapacityMw × pue
annualEnergyGwh = facilityDemandMw × utilisationRatio × 8760 ÷ 1000
maximumFlexibleLoadMw = facilityDemandMw × flexibleWorkloadRatio
annualFacilityEnergyKwh = facilityDemandMw × 1000 × utilisationRatio × 8760
waterM3 = annualFacilityEnergyKwh × litresPerKwh ÷ 1000
peakDayFacilityEnergyKwh = facilityDemandMw × 1000 × 24
peakDayWaterM3 = peakDayFacilityEnergyKwh × litresPerKwh ÷ 1000
```

Unknown cooling, absent/inapplicable factor, invalid range, or missing factor provenance yields `insufficient_evidence`, not zero. Calculations never use live market price or generation context as capacity.

## CTR-006 — Regional profile and flexibility simulation

```text
record HourSlot {
  index: integer 0..23
  localDate: LocalDate
  startInstant: Instant
  durationHours: Decimal
}

record DailyProfile {
  profileId: StableId
  geographyId: GeographyId
  localDateClass: representative_weekday | representative_weekend | selected_day
  timeZone: IanaTimeZone
  slots: exactly 24 HourSlot[]
  regionalLoadMw: exactly 24 non-negative Decimal[]
  sourceEvidenceIds: EvidenceId[]
  version: SemanticVersion
}

record FlexibilityPolicy {
  policyId: StableId
  peakHourCount: integer 1..8
  maximumDestinationUtilisationRatio: Decimal in (0,1]
  toleranceMw: Decimal fixed to 0.000000001 for version 1
  maximumFeasibilityIterations: integer fixed to 80 for version 1
  version: SemanticVersion
  methodologyEvidenceIds: EvidenceId[]
}

record FlexibilityInput {
  baselineFacilityMw: exactly 24 non-negative Decimal[]
  regionalLoadMw: exactly 24 non-negative Decimal[]
  flexibleCapacityMw: Decimal
  movableEnergyMwh: exactly 24 non-negative Decimal[]
  destinationHeadroomMw: exactly 24 non-negative Decimal[]
  destinationUtilisationLimitMw: exactly 24 non-negative Decimal[]
  originalCombinedPeakMw: Decimal
  toleranceMw: Decimal
  policy: FlexibilityPolicy
}

record Movement {
  sourceHour: integer 0..23
  destinationHour: integer 0..23
  energyMwh: positive Decimal
}

record FlexibilityResult {
  status: ResultStatus
  baselineFacilityMw: Decimal[24]
  shiftedFacilityMw: Decimal[24]
  baselineCombinedMw: Decimal[24]
  shiftedCombinedMw: Decimal[24]
  movements: Movement[]
  shiftedEnergyMwh: Decimal
  baselinePeakMw: Decimal
  achievedPeakMw: Decimal
  optimumCertificate: { lowerBoundMw, upperBoundMw, iterations, toleranceMw }
  activeConstraintIds: StableId[]
  invariantResults: map<InvariantId, pass | fail>
  error?: DomainError
}
```

The algorithm must minimize the maximum shifted combined load subject to same-day energy conservation, non-negativity, per-source movable energy, flexible capacity, destination headroom/utilisation, and `shiftedCombined[h] ≤ originalCombinedPeak`. Tie-breaking is deterministic: ascending source hour then ascending destination hour after the minimum feasible peak is certified. No greedy result may be labelled optimal.

## CTR-007 — Evidence graph, freshness, coverage, and conflicts

```text
type EvidenceId = "ev_" + stable content-derived ID

enum EvidenceType {
  authoritative_dataset, official_document, developer_claim, independent_analysis,
  regulator_or_court_finding, news_report, community_submission,
  web_discourse_indicator, user_assumption, prepared_preset, calculation, ai_interpretation
}

enum AuthorityClass { qualifying_authoritative, official_context, independent_context, claim, discourse, ai, unknown }
enum DerivationState { raw, extracted, normalized, calculated, aggregated, candidate, superseded }

record EvidenceRecord {
  evidenceId: EvidenceId
  title: bounded text
  publisher: bounded text
  publicationAt?: Instant
  observationStart?: Instant
  observationEnd?: Instant
  retrievedAt: Instant
  validUntil?: Instant
  sourceId: SourceId
  sourceUrl: Url
  resourceId?: bounded text
  sourceType: EvidenceType
  authorityClass: AuthorityClass
  derivationState: DerivationState
  category: electricity | grid | water | resilience | employment | investment |
            community | cooling | planning | legislation | environment | company |
            consent | hazards | connectivity | population | project | price | carbon
  geographyIds: GeographyId[]
  geometryRef?: StableId
  unit?: UnitCode
  relevantExtract?: bounded text
  documentId?: DocumentId
  pageOrSection?: PageLocator
  licenceId: StableId
  qualityMethodId: StableId
  adapterVersion: SemanticVersion
  parentEvidenceIds: EvidenceId[]
}

enum EdgeType {
  claim_supported_by, claim_contradicted_by, supersedes, extracted_from,
  project_company, project_site, concern_stakeholder, project_comparable,
  document_page, event_evidence, evidence_about_geography
}

record EvidenceEdge {
  edgeId: StableId
  type: EdgeType
  fromId: StableId
  toId: StableId
  evidenceId: EvidenceId
  derivation: prepared_rule | manual_curated | ai_candidate
  state: accepted | candidate | rejected
}

record FreshnessEvaluation {
  evidenceId: EvidenceId
  asOf: Instant
  basisInstant?: Instant
  expiryInstant?: Instant
  policyId: StableId
  state: FreshnessState
  reasonId: StableId
}

record CoverageRecord {
  category: controlled category
  geographyId?: GeographyId
  state: CoverageState
  expectedSourceOrFieldIds: StableId[]
  availableEvidenceIds: EvidenceId[]
  missingIds: StableId[]
  staleIds: EvidenceId[]
  failedSourceIds: SourceId[]
}

record ConflictRecord {
  conflictId: StableId
  fieldOrClaimId: StableId
  evidenceIds: EvidenceId[]
  definitions: bounded text[]
  observedOrPublishedAt: (Instant | null)[]
  geographyIds: GeographyId[][]
  state: unresolved | precedence_applied | superseded
  precedenceRuleId?: StableId
  reasonId: StableId
}
```

Freshness policy uses the most relevant `observationEnd`, otherwise `publicationAt`. If both are missing, freshness is unknown. A basis later than `asOf` is `future_invalid` unless a typed forecast validity interval explicitly covers `asOf`. `validUntil` is inclusive and overrides the default. Otherwise expiry is the basis plus 24 or 36 calendar months in UTC with end-day clamping; equality is current. Stale/unknown/future-invalid evidence remains visible but cannot satisfy a low-concern prerequisite.

Graph edges do not imply authority. Only accepted prepared/manual edges are used in authoritative views; AI candidate edges remain visibly candidate.

## CTR-008 — Project Case File, timeline, and community records

```text
record PageLocator {
  pageNumber?: positive integer
  sectionLabel?: bounded text
  paragraphId?: bounded text
  fallbackDescription?: bounded text
}

record DocumentRecord {
  documentId: DocumentId
  title: bounded text
  sourceEvidenceId: EvidenceId
  mediaType: pdf | html | text
  publicationAt?: Instant
  contentSha256: Sha256
  extractionVersion: SemanticVersion
  pageCount?: positive integer
  openUrl: Url
}

record ProjectEvent {
  eventId: StableId
  projectId: ProjectId
  eventType: announcement | application | hearing | infrastructure_agreement |
             commitment | objection | appeal | design_change | capacity_change |
             consent_decision | construction | operation | evidence_update
  occurredAt?: Instant
  datePrecision: instant | day | month | year | unknown
  title: bounded text
  evidenceIds: EvidenceId[]
  conflictIds: StableId[]
}

enum CommunityStance { supportive, opposed, conditional, neutral_informational, unclear }
enum StakeholderType { mana_whenua, resident, community_group, council, regulator, business,
                       developer, worker, expert, media, unknown }
enum EvidenceQuality { representative, formal_submission, official_consultation,
                       attributed_statement, reported_statement, web_discourse, unknown }

record CommunityRecord {
  communityRecordId: StableId
  projectId?: ProjectId
  geographyIds: GeographyId[]
  stance: CommunityStance
  themeIds: StableId[]
  stakeholderType: StakeholderType
  stakeholderLabel?: bounded text
  manaWhenuaDistinct: boolean
  evidenceQuality: EvidenceQuality
  methodologyId?: StableId
  observedOrPublishedAt?: Instant
  evidenceIds: EvidenceId[]
  limitations: StableId[]
}

record ProjectCase {
  projectId: ProjectId
  caseVersion: SemanticVersion
  catalogRecord: ProjectCatalogRecord
  sectionStates: map<CaseSection, complete | partial | missing>
  eventIds: StableId[]
  evidenceIds: EvidenceId[]
  conflictIds: StableId[]
  communityRecordIds: StableId[]
  comparableProjectIds: ProjectId[]
  questionIds: StableId[]
  sourceCounts: { current, stale, claim, missingOrConflict, aiInterpretation }
}
```

`manaWhenuaDistinct` must be true when `stakeholderType=mana_whenua`, and those records are never folded into a generic positive/negative percentage. A representative percentage requires an independently qualifying representative methodology record; web-source counts never meet it.

## CTR-009 — Assessments and deterministic statements

```text
enum ConcernOutcome { low_concern, moderate_concern, high_concern, insufficient_evidence }
enum AssessmentCategory { electricity, water, resilience, economic_contribution, community }

record ThresholdRecord {
  thresholdId: StableId
  category: AssessmentCategory
  geographyIds: GeographyId[]
  measureId: StableId
  lowUpperInclusive?: Decimal
  moderateUpperInclusive?: Decimal
  unit: UnitCode
  evidenceIds: EvidenceId[]
  validFrom?: Instant
  validUntil?: Instant
  policyVersion: SemanticVersion
}

record AssessmentResult {
  category: AssessmentCategory
  outcome: ConcernOutcome
  reasonIds: StableId[]
  decisiveInputPaths: bounded JSON Pointer[]
  qualifyingEvidenceIds: EvidenceId[]
  contextualEvidenceIds: EvidenceId[]
  missing: MissingRecord[]
  conflicts: StableId[]
  policyId: StableId
}

record OverallNarrative {
  kind: substantial_issues | evidence_incomplete | potentially_suitable_with_conditions | lower_concern_review_required
  reasonCategoryIds: AssessmentCategory[]
  statementId: StableId
  disclaimerStatementId: StableId
}

record TrustedStatement {
  statementId: StableId
  templateId: StableId
  bindings: map<string, scalar | UnitValue | StableId>
  sourceEvidenceIds: EvidenceId[]
  origin: calculated | assessment | evidence | required_disclaimer
  audience: public | decision_maker | both
  lens: people | planet | both
}
```

Assessment outcomes follow requirements FR-ASM-002–007 exactly. Water low/moderate/high is impossible without current qualifying regional `ThresholdRecord` values for both annual and peak-day measures; either absent threshold yields insufficient evidence. Economic high needs an exact current authoritative contradiction. Community low requires qualifying representative consultation. Overall narrative precedence is high → insufficient → moderate → all low. No contract contains an overall numeric score or approval/rejection value.

## CTR-010 — Site requirement profile and deterministic screening

```text
enum CriterionKind { hard_constraint, preference }
enum CriterionOperator { equals, one_of, at_least, at_most, within_distance, outside_area,
                         evidence_present, user_boolean }

record SiteCriterion {
  criterionId: StableId
  kind: CriterionKind
  fieldOrLayerId: StableId
  operator: CriterionOperator
  operand: typed scalar or UnitValue
  priorityPosition?: positive integer
  missingPolicy: insufficient | specialist_review | infrastructure_required
  source: parsed_by_ai | entered_by_user
}

record RequirementProfileDraft {
  profileId: StableId
  sourcePromptRequestId?: StableId
  criteria: SiteCriterion[]
  confirmationState: proposed
}

record ConfirmedRequirementProfile {
  profileId: StableId
  revision: Revision
  criteria: SiteCriterion[]
  orderingRule: none | classification_then_lexicographic_priorities
  confirmationState: confirmed
  confirmedAt: Instant
  confirmedBy: current_user_action
}

enum CandidateClass { included, excluded, infrastructure_required, specialist_review, insufficient_evidence }

record CriterionFinding {
  criterionId: StableId
  state: satisfied | not_satisfied | partial | missing
  observedValue?: typed scalar
  evidenceIds: EvidenceId[]
  reasonId: StableId
}

record CandidateScreening {
  candidateId: StableId
  profileId: StableId
  classification: CandidateClass
  findings: CriterionFinding[]
  exclusionReasonIds: StableId[]
  orderingVector?: controlled ordinal[]
  sensitivityNotes: StableId[]
}
```

Only a confirmed profile can execute. Classification precedence is: any failed hard constraint → excluded; otherwise any required specialist state → specialist review; otherwise any infrastructure-required state → infrastructure required; otherwise any required missing evidence → insufficient evidence; otherwise included. Optional ordering first groups by visible classification and then compares the displayed ordinal finding for each confirmed priority in order; stable candidate ID breaks a complete tie. There is no weighted sum, normalized score, or output named “best”.

## CTR-011 — Connector configuration, vault, and capability matrix

```text
type ConnectorId = "conn_" + UUIDv7

enum ApiDialect { responses, chat_completions, auto }
enum CredentialMode { api_key_header, bearer_header, key_query_secret, none }
enum PersistenceMode { persistent_device, session_only }

record ConnectorConfig {
  connectorId: ConnectorId
  kind: model | remote_mcp | tavily_rest | live_data
  label: bounded text
  sanitizedOrigin: normalized HTTPS origin
  basePathTemplate: bounded path without secret query values
  modelId?: bounded text
  requestedDialect?: ApiDialect
  credentialMode: CredentialMode
  persistenceMode: PersistenceMode
  allowedNonSecretHeaders: map<allowlisted header name, bounded value>
  createdAt: Instant
  lastSuccessfulUseAt?: Instant
}

record CredentialRecord {
  credentialId: StableId
  connectorId: ConnectorId
  state: present | unavailable | clearing
  cipher: AES_256_GCM | browser_local_disclosed | session_memory
  ciphertextBase64Url?: Base64UrlTextV2
  ciphertextDecodedByteLength?: positive integer in 17..65_552
  ivBase64Url?: Base64UrlTextV2
  ivDecodedByteLength?: exactly 12
  keyHandleId?: StableId
  createdAt: Instant
  replacedAt?: Instant
}

record CapabilityMatrix {
  connectorId: ConnectorId
  testedAt: Instant
  cors: supported | unsupported | indeterminate
  authentication: supported | rejected | indeterminate
  dialects: map<ApiDialect, supported | unsupported | indeterminate>
  model: supported | unsupported | indeterminate
  streaming: supported | unsupported | indeterminate
  structuredOutput: supported | unsupported | indeterminate
  functionTools: supported | unsupported | indeterminate
  remoteMcp: supported | unsupported | indeterminate
  selectedRoute?: StableId
  sanitizedErrors: DomainError[]
}

record ExternalDisclosure {
  disclosureVersion: SemanticVersion
  connectorId: ConnectorId
  destinationOrigin: normalized origin
  contextCategories: controlled ID[]
  sendsPrompt: boolean
  sendsScenario: boolean
  sendsEvidenceExtracts: boolean
  sendsDocumentText: boolean
  retentionUnknown: boolean
  persistenceMode: PersistenceMode
}
```

The first successful authenticated ordinary use—not merely a preflight—permits persistence. Raw keys are write-only from the UI. Exact seeded secrets from developer test input are never included in a contract snapshot or failure report.

## CTR-012 — Agent, research, tools, and citations

```text
record AgentLimits {
  wallTimeMs: 120000
  perNetworkCallMs: 30000
  maximumModelAttempts: 2
  maximumToolCalls: 6
  maximumConcurrentTools: 2
  maximumContextBytes: 262144
  maximumResponseBytes: 1048576
  maximumOutputTokens: 8192
  maximumCitations: 50
  maximumResearchItems: 50
}

record AgentContextManifest {
  resultSnapshotIds: StableId[]
  projectIds: ProjectId[]
  evidenceIds: EvidenceId[]
  visualDataSetIds: StableId[]
  includedCategories: controlled ID[]
  excludedLocalRecordCount: non-negative integer
  deterministicFingerprint: Sha256
}

record AgentRequest {
  requestId: StableId
  operationId: OperationId
  generation: Generation
  mode: explain | research | compare | find_gaps | generate_questions |
        parse_site_profile | generate_visual | guided_education
  userPrompt: bounded plain text
  audience: public | decision_maker
  lens: people | planet | both
  connectorId: ConnectorId
  researchConnectorIds: ConnectorId[]
  context: AgentContextManifest
  disclosureVersion: SemanticVersion
  limits: AgentLimits
}

enum ToolOperation { tavily_search, tavily_extract, tavily_crawl, tavily_map,
                     tavily_research, remote_mcp_search, remote_mcp_fetch }

record ToolCall {
  toolCallId: StableId
  operation: ToolOperation
  connectorId: ConnectorId
  arguments: schema-valid bounded object
  generation: Generation
}

record Citation {
  citationId: StableId
  sourceUrl: Url
  title: bounded text
  publisher?: bounded text
  publishedAt?: Instant
  retrievedAt: Instant
  evidenceId?: EvidenceId
  relevantExtract?: bounded text
  toolCallId?: StableId
}

record AgentClaim {
  claimId: StableId
  text: bounded plain text
  kind: source_statement | model_inference | uncertainty | unresolved_conflict | unsupported
  citationIds: StableId[]
  relatedEvidenceIds: EvidenceId[]
}

union AgentResult =
  | { status: complete, claims: AgentClaim[], citations: Citation[], structuredPayload?: bounded typed payload }
  | { status: partial, claims: AgentClaim[], citations: Citation[], errors: DomainError[] }
  | { status: cancelled, reasonId: StableId }
  | { status: failed, errors: DomainError[] }
```

All external factual claims require citations. Search snippets are discovery candidates until their underlying URL/extract is captured. The agent never receives credential bytes in its context or tool results. Tools are read-only and statically allowlisted; unknown tool names, write actions, recursive discovery, and prompt-injected instructions are rejected.

## CTR-013 — Safe visual specification

```text
enum VisualPrimitive { metric_grid, bar, line, stacked_area, scatter,
                       map_points, map_choropleth, comparison_table,
                       evidence_timeline, coverage_panel, narrative_panel }
enum Aggregate { none, sum, average, minimum, maximum, count }

record VisualBinding {
  dataSetId: StableId
  xFieldId?: StableId
  yFieldIds?: StableId[]
  categoryFieldId?: StableId
  geographyFieldId?: StableId
  aggregate: Aggregate
  filterIds: StableId[]
}

record VisualSpec {
  schemaVersion: 1
  visualId: StableId
  primitive: VisualPrimitive
  title: bounded plain text
  purpose: bounded plain text
  bindings: VisualBinding[]
  annotations: { text: bounded plain text, dataPointId?: StableId, citationIds: StableId[] }[]
  sourceEvidenceIds: EvidenceId[]
  requestId: StableId
}

record ResolvedVisualModel {
  visualId: StableId
  rendererKind: VisualPrimitive
  title: bounded plain text
  series: bounded trusted arrays
  table: { columns: bounded column descriptors, rows: bounded scalar arrays }
  accessibleSummaryStatementIds: StableId[]
  sourceEvidenceIds: EvidenceId[]
  provenance: { requestId, createdAt, connectorLabel, modelId, snapshotFingerprint }
}
```

Limits: spec ≤128 KiB; title/purpose/annotation ≤500 characters each; ≤8 bindings; ≤8 series; ≤2,000 resolved rows; ≤5,000 map points; ≤50 annotations. Allowed transformations are field selection, equality/range filters declared by stable filter ID, grouping, sort by known field, and the listed aggregates. No free-form expression, code, URL, style property, or raw data payload exists.

## CTR-014 — Immutable results, comparison, and brief

```text
record ResultSnapshot {
  snapshotId: StableId
  fingerprint: Sha256
  createdAt: Instant
  asOf: Instant
  scenario: NormalizedScenario
  calculations: CalculationBundle
  flexibility: FlexibilityResult
  evidenceSnapshotId: StableId
  assessments: map<AssessmentCategory, AssessmentResult>
  overall: OverallNarrative
  coverage: CoverageRecord[]
  conflicts: ConflictRecord[]
  statements: TrustedStatement[]
  manifest: ReproducibilityManifest
}

record ComparisonResult {
  comparisonId: StableId
  snapshotIds: StableId[]
  criterionIds: StableId[]
  metricDeltas: typed delta[]
  assessmentChanges: typed change[]
  coverageChanges: typed change[]
  conflictChanges: typed change[]
  changedAssumptionPaths: bounded JSON Pointer[]
}

record ImpactBrief {
  briefId: StableId
  snapshotIds: StableId[]
  audience: public | decision_maker
  lens: people | planet | both
  sections: { sectionId, statementIds, tableIds, visualIds }[]
  deterministicMarkdown: bounded text
  sourceEvidenceIds: EvidenceId[]
  disclaimerStatementId: StableId
  optionalAiAppendix?: { requestId, claimIds, citationIds, labelStatementId }
}
```

The deterministic brief is reconstructed from trusted statement templates and record bindings. AI text can appear only in the labelled appendix; it cannot replace values, outcomes, sources, missing-evidence statements, or the disclaimer.

## CTR-015 — Transactional local persistence and vault stores

```text
record StoredRecordEnvelope<T> {
  storageSchemaVersion: positive integer
  storeKind: StoreKind
  recordId: StableId
  revision: Revision
  createdAt: Instant
  updatedAt: Instant
  deletedAt?: Instant
  lastOperationId: OperationId
  payload: T
  checksum: Sha256
}

enum StoreKind {
  scenario, result_snapshot, comparison, connector_config, credential,
  research_cache, prompt_history, operation_receipt, quarantine, metadata
}

record StorageOperation<T> {
  operationId: OperationId
  storeKind: StoreKind
  action: create | replace | delete | clear_store
  recordId?: StableId
  expectedRevision?: Revision
  payload?: T
}

union StorageOutcome<T> =
  | { status: committed, record?: StoredRecordEnvelope<T>, receiptId: StableId }
  | { status: replayed, originalReceiptId: StableId, record?: StoredRecordEnvelope<T> }
  | { status: conflict, expectedRevision?: Revision, actualRevision?: Revision, tombstoned: boolean }
  | { status: failed, error: DomainError }

record ResearchCacheRecord {
  cacheId: StableId
  sanitizedQuery: bounded text <= 65,536 UTF-8 bytes
  normalizedQueryHash: Sha256
  connectorId: ConnectorId
  resultIds: StableId[]
  evidenceIds: EvidenceId[]
  sourceUrls: Url[]
  initialRetrievedAt: Instant
  retrievedAt: Instant
  freshness: current|stale|unknown|future_invalid|forecast_valid|forecast_expired
  expiresAt: Instant
  connectorSchemaVersion: SchemaVersion
  resultSchemaVersion: SchemaVersion
  schemaVersion: SchemaVersion
}
```

One IndexedDB transaction writes the record/tombstone and operation receipt. Operation IDs are unique across all stores. Tombstones are monotonic until the documented retention/compaction migration. A corrupt record is copied to quarantine with sanitized error metadata, then excluded; sibling records still load. Clear credentials never clears scenarios; clear-all reports each store count and requires exact confirmation.

Credential stores use a separate access adapter. No generic repository enumeration returns ciphertext, IV, key handle, or secret-bearing URL.

## CTR-016 — Offline/cache generation and update state

```text
record CacheGeneration {
  releaseId: StableId
  cacheName: bounded text derived from releaseId
  manifestSha256: Sha256
  assetIds: StableId[]
  state: downloading | validated | active | retired | failed
  createdAt: Instant
  activatedAt?: Instant
}

enum UpdateState { idle, checking, downloading, ready, activating, failed }

record UpdateEvent {
  state: UpdateState
  activeReleaseId: StableId
  candidateReleaseId?: StableId
  progress?: { completedBytes, totalBytes }
  error?: DomainError
}
```

Only one generation is active per controlled client. Core assets must validate before `ready`. Activation occurs on explicit reload/navigation, never during an active result operation. Model/MCP/key-bearing/live API requests use `cache: no-store` and are excluded from service-worker caches.

## CTR-017 — Diagnostics and security events

```text
record DiagnosticEvent {
  schemaVersion: 1
  eventId: StableId
  occurredAt: Instant
  category: app | data | calculation | worker | storage | connector | visual | security | performance
  code: allowlisted StableId
  severity: info | warning | error
  componentId: StableId
  componentVersion: SemanticVersion
  releaseId: StableId
  correlationId: CorrelationId
  durationBucket?: lt_10ms | lt_100ms | lt_1s | lt_5s | lt_30s | gte_30s
  statusClass?: success | cancelled | timeout | auth | quota | cors | invalid | internal
  counts?: map<allowlisted name, non-negative integer>
}
```

Unknown fields reject the event. Strings originating in prompts, evidence, documents, scenarios, connector URLs, headers, provider errors, or secrets have no slot. Diagnostics remain local unless a later separately approved telemetry design exists.

## CTR-018 — EMI build-time ingestion and regional aggregate

```text
record EmiDispatchRow {
  sourceFileId: StableId
  tradingOrDispatchInstant: Instant
  pointOfConnectionCode: bounded normalized code
  unitCode?: bounded normalized code
  loadMw?: Decimal
  initialMw?: Decimal
  generationMw?: Decimal
  locationFactor?: Decimal
  priceNzdPerMwh?: Decimal
  dead: boolean
  disconnected: boolean
  runOrRevisionId?: bounded text
}

record NetworkSupplyPoint {
  snapshotId: StableId
  pocCode: bounded normalized code
  nztmEasting?: Decimal
  nztmNorthing?: Decimal
  networkReportingRegion?: bounded text
  networkZone?: bounded text
  island?: north | south | unknown
}

record EmiExclusion {
  sourceFileId: StableId
  rowIdentityHash: Sha256
  reason: dead | disconnected | duplicate_superseded | missing_interval | unmatched_poc |
          invalid_coordinate | outside_stats_geometry | invalid_unit | invalid_value
}

record RegionalElectricityInterval {
  geographyId: GeographyId
  intervalStart: Instant
  intervalMinutes: positive integer
  loadMw?: Decimal
  modelledDispatchGenerationMw?: Decimal
  weightedOrRepresentativePriceNzdPerMwh?: Decimal
  contributingPocCount: non-negative integer
  coverageRatio: Decimal
  sourceEvidenceIds: EvidenceId[]
}

record EmiCoverageReport {
  sourceStart: Instant
  sourceEnd: Instant
  expectedIntervalCount: positive integer
  observedIntervalCount: non-negative integer
  sourceFileCount: positive integer
  missingFileDates: LocalDate[]
  unmatchedPocCount: non-negative integer
  invalidCoordinateCount: non-negative integer
  excludedByReason: map<reason, count>
  localDayIntervalCounts: map<LocalDate, {
    intervalMinutes: positive integer,
    expectedCount: positive integer,
    observedCount: non-negative integer,
    dstClass: short_day | ordinary_day | long_day | irregular
  }>
  geographyCoverage: map<GeographyId, Decimal>
}
```

The compiler exact-joins POC codes to one declared compatible NSP snapshot, transforms valid EPSG:2193 coordinates to WGS84, then uses the same Stats point-in-polygon/tie rule as runtime. Network reporting region remains separate. Duplicate selection uses a source-documented revision/run precedence; if absent, duplicate ambiguity is excluded rather than guessed. UTC instants are canonical; Pacific/Auckland local dates are derived using timezone rules. Expected local-day counts derive from actual interval length: 46/48/50 for half-hour data and 276/288/300 for five-minute data on short/ordinary/long days. MW is never summed across time; interval energy uses `MW × intervalHours` where required. Output remains generation/load/price context and carries a prohibition flag against spare-capacity, self-sufficiency, or headroom inference.

## Error taxonomy

| Prefix | Category | Examples | Retry rule |
|---|---|---|---|
| `VAL_*` | Input/schema | empty, range, unknown enum, unknown schema | Correct input; never automatic retry. |
| `PACK_*` | Prepared data | checksum, dependency, geometry, licence metadata | Retry fetch once; otherwise isolate/use last validated generation. |
| `CAL_*` | Domain | decimal overflow, invariant failure, profile mismatch | No alternate algorithm; affected result fails. |
| `STORE_*` | Persistence | quota, blocked, revision conflict, corrupt, migration | Conflict/user action; transient blocked once; quarantine corruption. |
| `CONN_*` | Connector | CORS, auth, dialect, quota, timeout, malformed stream | Auth requires replacement; 429/5xx at most one bounded retry; CORS no proxy. |
| `AGENT_*` | Agent/tools | injection, unknown tool, citation loss, limit, obsolete | Reject/partial/cancel; no retry for validation/security. |
| `VIS_*` | Visual | unknown binding, limit, executable field | Fail closed; show trusted table/default visual. |
| `SEC_*` | Security | secret egress, unsafe URL, raw HTML, unapproved origin | Fail closed, local sanitized event; never retry automatically. |
| `CANCELLED` | Cancellation | user, superseded, deadline, shutdown | Terminal for generation. |

## Compatibility and migration rules

- Major schema mismatch rejects. A reader may accept a newer minor only when unknown fields are explicitly allowed by that schema; security-sensitive contracts allow none.
- Pack compatibility is declared in the release manifest; no runtime best-effort joins across releases.
- Stored records migrate one version at a time in one transaction. Every migration is deterministic and idempotent. Unsupported/skipped versions quarantine.
- Connector capability results expire after 24 hours, endpoint/config change, or an auth/CORS failure. Expiry disables dependent action until retested but does not delete the key.
- Evidence/research cache expiry never changes `retrievedAt`. Revalidation creates a new cache/evidence record.
- Active result snapshots remain immutable when the app/data generation changes; the UI labels version drift and offers explicit recomputation.

## Producer, consumer, and contract-test matrix

| Contract | Producer | Every consumer | Required contract tests |
|---|---|---|---|
| CTR-001 worker messages | Coordinator/workers | Coordinator, analysis worker, connector worker | Unknown version/type, late generation, duplicate terminal, cancel/restart, size bound. |
| CTR-002 release/packs | Data compiler | Pack loader, offline manager, analysis worker, QA | Hash/dependency/schema/size/source/licence and atomic activation. |
| CTR-003 geography/map | Data compiler/spatial module | Map, list, scenario, site screening, EMI compiler | Border tie, outside, parity, unknown/approximate layers. |
| CTR-004 scenario/origin | UI/validation | Calculation, assessment, storage, report, agent context | Parse/range/warn, forged origin, custom/unknown preservation. |
| CTR-005 calculations | Calculation module | Assessment, UI, report, compare | Golden decimals, rounding isolation, missing factor, manifest closure. |
| CTR-006 flexibility | Flexibility module | Assessment, UI, report, compare | Brute-force/model oracle, conservation, all constraints, certificate, tie. |
| CTR-007 evidence | Compiler/evidence module | Case, assessment, map, agent, report | Freshness boundaries, conflicts, authority, graph-edge non-promotion. |
| CTR-008 case/community | Compiler/evidence module | Case UI, report, agent context | Section completeness, page links, timeline conflict, taxonomy, mana whenua separation. |
| CTR-009 assessments/statements | Assessment/report modules | UI, compare, brief, agent context | Every branch/boundary, exact evidence gates, overall precedence, forbidden score. |
| CTR-010 site screening | Agent parser/user confirmation/site module | Map, compare, agent explanation | Unconfirmed rejection, classification precedence, visible lexicographic order, ties/missing. |
| CTR-011 connector/vault | Connector UI/worker/vault | Agent worker, storage, disclosures | CORS/capabilities, persistence-after-use, no read-back, clear, seeded-secret absence. |
| CTR-012 agent/tools | Coordinator/agent worker | UI, cache, visual/site parsers | Limits, injection, citations, cancel, quota/timeout, route selection, partial result. |
| CTR-013 visuals | Model/visual module | Trusted renderers/report | Fuzz schema, unknown IDs, limits, no executable fields, a11y/provenance. |
| CTR-014 snapshot/brief | Analysis/report modules | UI, storage, compare, copy | Immutability/fingerprint, deterministic reconstruction, AI appendix separation. |
| CTR-015 storage | Repository/vault | All local workflows | Model-based multi-tab/crash/migration/tombstone/quarantine/clear tests. |
| CTR-016 offline/update | Service worker/shell | Shell, pack loader, UI | Clean/offline start, interrupted update, no mixed generation, no credential caching. |
| CTR-017 diagnostics | All modules | Local diagnostics | Field allowlist, seeded secrets/content never serialized, size bounds. |
| CTR-018 EMI | Data compiler | Electricity pack/evidence module/QA | File coverage, exact join, coordinate, DST, units, duplicates, exclusions, no capacity inference. |

## Requirement traceability

| Requirements | Contract families |
|---|---|
| FR-LOC-001–004, FR-MAP-001–004 | CTR-002, CTR-003, CTR-007, CTR-016 |
| FR-SCN-001–004 | CTR-004, CTR-005, CTR-015 |
| FR-CASE-001–004 | CTR-007, CTR-008, CTR-013–014 |
| FR-CAL-001–006 | CTR-004–006, CTR-014 |
| FR-ASM-001–008 | CTR-007, CTR-009, CTR-014 |
| FR-EVD-001–018 | CTR-002–003, CTR-007–008, CTR-016, CTR-018 |
| FR-AGT-001–011 | CTR-001, CTR-007–013 |
| FR-VIZ-001–003 | CTR-012–014 |
| FR-CONN-001–008 | CTR-001, CTR-011–012, CTR-015, CTR-017 |
| FR-RES-001–004 | CTR-003, CTR-007–010, CTR-013–014 |
| FR-RPT-001–003 | CTR-009, CTR-013–014 |
| FR-SAVE-001–002 | CTR-011, CTR-015–017 |
| FR-DOC-001–002 | CTR-002, CTR-007–008, CTR-012 |
| NFR-PER-001 | CTR-001–003, CTR-006, CTR-012–013, CTR-016, resource limits |
| NFR-REL-001–002 | CTR-001–018 typed outcomes, generations, manifests, recovery rules |
| NFR-ACC-001 | CTR-003, CTR-008–010, CTR-013–014 shared accessible view contracts |
| NFR-SEC-001–002 | CTR-000–002, CTR-007, CTR-011–013, CTR-015–017 |
| NFR-PRI-001 | CTR-011–012, CTR-015, CTR-017 |
| NFR-EXP-001 | CTR-004–005, CTR-007–009, CTR-012–014 |
| NFR-MNT-001–002 | All versioned CTR families and producer/consumer matrix |
| NFR-DEP-001 | CTR-002, CTR-016 and approved Sites topology |
| NFR-OBS-001 | DiagnosticEventV2 and error taxonomy |
| CON-001–008 | Direct-call/no-server boundaries, CTR-002, CTR-007, CTR-011–018 |

## Normative v0.10 reconciliation

This section closes LR3-001 through LR3-013 and all subsequent Gate 3 findings through G3V09. It is normative and replaces any conflicting v0.4/v0.5/v0.6/v0.7/v0.8/v0.9 declaration above. The product owner resolved `g3-emi-quality` as Balanced and `g3-site-grouping` as separate presentation groups on 2026-08-07; the five approved site-domain outcomes remain intact beneath those groups.

### CTR-000A - closed public scalar and result types

```text
type AssetId = opaque string
type FactId = opaque string
type StatementId = opaque string
type CandidateId = opaque string
type WorkerInstanceId = opaque string
type WorkerEpoch = UInt64
type RequestId = opaque string
type CommandHash = Sha256
type FieldPath = non-empty JSON Pointer
type InvariantId = `INV-` + three digits
type BoundedText = UTF-8 string with a contract-specific byte maximum
type BigInt = canonical signed base-10 integer string
type UInt8 = JSON integer in [0,255]
type UInt16 = JSON integer in [0,65535]
type UInt32 = JSON integer in [0,4294967295]
type UInt64 = JSON safe integer in [0,9007199254740991]
type Int16 = JSON integer in [-32768,32767]
type Int64 = JSON safe integer in [-9007199254740991,9007199254740991]
type RationalDecimal = canonical base-10 decimal represented as { coefficient: BigInt, scale: 0..9 }
type Decimal = RationalDecimal
type Megawatts = RationalDecimal in [0, 1_000_000]
type MegawattHours = RationalDecimal in [0, 24_000_000]
type Percentage = RationalDecimal in [0, 100]
type Confidence = RationalDecimal in [0, 1]
type SourceHash = Sha256

enum Unit {
  MW, MWh, litres, litres_per_day, cubic_metres, cubic_metres_per_day,
  hours, count, nzd, nzd_per_year, nzd_per_mwh, percent, kilometres, hectares,
  degrees_celsius, ordinal, boolean, text, local_date
}

record DecimalTypedScalarV2 { kind: decimal, value: RationalDecimal, unit: Unit }
record IntegerTypedScalarV2 { kind: integer, value: Int64, unit: count }
record BooleanTypedScalarV2 { kind: boolean, value: Boolean, unit: boolean }
record EnumTypedScalarV2 { kind: enum, value: controlled non-empty token, unit: ordinal }
record TextTypedScalarV2 { kind: text, value: BoundedText, unit: text }
record LocalDateTypedScalarV2 { kind: local_date, value: LocalDate, unit: local_date }

union TypedScalar = DecimalTypedScalarV2 | IntegerTypedScalarV2 |
  BooleanTypedScalarV2 | EnumTypedScalarV2 | TextTypedScalarV2 |
  LocalDateTypedScalarV2

union TypedChange =
  | { kind: decimal_delta, before: DecimalTypedScalarV2,
      after: DecimalTypedScalarV2, absoluteDelta: DecimalTypedScalarV2,
      relativeDelta?: RationalDecimal }
  | { kind: integer_delta, before: IntegerTypedScalarV2,
      after: IntegerTypedScalarV2, absoluteDelta: IntegerTypedScalarV2,
      relativeDelta?: RationalDecimal }
  | { kind: enum_change, before: EnumTypedScalarV2, after: EnumTypedScalarV2,
      changed: Boolean }
  | { kind: boolean_change, before: BooleanTypedScalarV2,
      after: BooleanTypedScalarV2, changed: Boolean }
  | { kind: text_change, before: TextTypedScalarV2, after: TextTypedScalarV2,
      changed: Boolean }
  | { kind: local_date_change, before: LocalDateTypedScalarV2,
      after: LocalDateTypedScalarV2, changed: Boolean }
  | { kind: availability_change, before: present|missing, after: present|missing }

union CopyOutcome =
  | { status: copied, method: clipboard_api|selection_fallback, copiedHash: Sha256 }
  | { status: unavailable, reason: permission_denied|unsupported|not_secure_context }
  | { status: failed, error: DomainError }

record MissingRecord {
  fieldPath: FieldPath
  reason: absent | invalid | stale | unauthorized | conflicting | suppressed_by_policy
  requiredBy: non-empty InvariantId[]
  evidenceIds: EvidenceId[]
}
```

Every closed public union is decoded with unknown-field rejection. Decimal arithmetic is rational until an explicitly declared display-rounding boundary. A `decimal_delta` requires identical `before.unit`, `after.unit` and `absoluteDelta.unit`; an `integer_delta` is count throughout. Enum/boolean/text/local-date variants cannot mix scalar kinds, and `changed` must equal exact value inequality. `absoluteDelta` is the non-negative exact difference. `relativeDelta` is absent exactly when `before.value=0`; otherwise it is the signed exact `(after-before)/abs(before)` ratio.

### CTR-006A - total flexibility contract

Version 1 accepts exactly 24 representative civil-time slots of exactly one hour. A 23- or 25-hour DST source day must be normalized by the compiler to this declared representative profile before it can enter the solver; raw 23/25 arrays and non-unit durations are rejected, never padded or truncated.

```text
record FlexibilityInputV1 {
  version: 1
  regionalDemandMw: Megawatts[24]
  facilityBaselineMw: Megawatts[24]
  slotDurationHours: RationalDecimal[24] // every value must equal exactly 1
  maximumMovableEnergyMwh: MegawattHours // exact sum(sourceLimitsMwh)
  sourceLimitsMwh: MegawattHours[24]
  destinationLimitsMwh: MegawattHours[24]
  allowedTransfer: Boolean[24][24]       // diagonal false
  producerTrace: FlexibilityProducerTrace
  objective: minimise_peak_then_maximise_shift_then_lexicographic_ledger
  auditToleranceMw: exactly 0.000001 // audit bracket only; never physical feasibility
}

record FlexibilityProducerTrace {
  scenarioId: ScenarioId
  normalizedScenarioHash: Sha256
  profileId: opaque string
  profileHash: Sha256
  policyVersion: SemVer
  facilityDemandMw: Megawatts
  utilisationRatio: RationalDecimal
  flexibleWorkloadRatio: RationalDecimal
  maximumFlexibleLoadMw: Megawatts
  peakHourCount: UInt8 in 1..8
  maximumDestinationUtilisationRatio: RationalDecimal in (0,1]
  sourceHourIndices: UInt8[]
}

record FlexibilityCertificate {
  exactPeakMw: RationalDecimal
  primalObjectiveMw: RationalDecimal
  dualObjectiveMw: RationalDecimal
  primalDualGapMw: exactly 0
  dualVariables: non-empty RationalDecimal[]
  primalConstraintHash: Sha256
  dualConstraintHash: Sha256
  auditLowerBoundMw: RationalDecimal
  auditUpperBoundMw: RationalDecimal
  auditToleranceMw: exactly 0.000001
  auditIterationsRequired: UInt16 <= 41
  combinedProfileBoundMw: 2_000_000
  conservationResidualMwh: exactly 0
  sourceResidualsMwh: RationalDecimal[24]
  destinationResidualsMwh: RationalDecimal[24]
  recomputedPeakMw: RationalDecimal
  oracleFixtureHash?: Sha256
}

union FlexibilityResultV2 =
  | { status: complete, baselineFacilityMw: RationalDecimal[24],
      shiftedFacilityMw: RationalDecimal[24], ledgerMwh: RationalDecimal[24][24],
      shiftedEnergyMwh: RationalDecimal, improvementMw: RationalDecimal,
      activeConstraintIds: InvariantId[], certificate: FlexibilityCertificate,
      traceRef: CalculationTraceRefV2 }
  | { status: insufficient, reason: input_profile_not_representative_v1 |
      invalid_profile_lineage | incompatible_transfer_graph,
      traceRef?: CalculationTraceRefV2 }
  | { status: failed, error: DomainError, reproducibility: ReproducibilityManifestV2,
      traceRef?: CalculationTraceRefV2 }
```

`FlexibilityInputV1` is produced only as follows: `facilityBaselineMw[h] = facilityDemandMw * utilisationRatio`; choose the first `peakHourCount` indices sorted by `(regionalDemandMw descending, hour index ascending)`; `maximumFlexibleLoadMw = facilityDemandMw * flexibleWorkloadRatio`; each selected source limit is `min(maximumFlexibleLoadMw, facilityBaselineMw[h]) * duration[h]`, every other source limit is zero; every selected source is forbidden as a destination; each non-source destination limit is `max(0, min(facilityDemandMw*maximumDestinationUtilisationRatio-facilityBaselineMw[h], originalCombinedPeakMw-(regionalDemandMw[h]+facilityBaselineMw[h]))) * duration[h]`; and every selected source connects to every non-source destination. The scalar maximum movable energy is exactly the sum of source limits. No UI/model caller may supply these derived fields directly.

Physical feasibility and the primary optimality certificate use exact rational primal/dual LP comparisons. A zero flexible ratio or zero source limit is a valid complete identity result with unchanged profiles, zero ledger, zero shift, zero improvement and equal exact primal/dual peak. The `0.000001 MW` audit tolerance is used only for an optional independent bracket; with a maximum combined profile of `2,000,000 MW`, its derived iteration count is at most 41. Independent tests use a continuous rational max-flow/linear-program oracle; discretized energy quanta are forbidden.

### CTR-007A - typed evidence, authority and immutable snapshots

```text
union GeographyScope =
  | { kind: national, countryCode: NZ }
  | { kind: regional, geographyId: GeographyId, boundaryVersion: SemVer }
  | { kind: point, longitude: Decimal[-180,180], latitude: Decimal[-90,90],
      accuracyMetres: Decimal[0,100000], coordinateSystem: epsg_4326 }

record ObservationWindow { start: Instant, endExclusive: Instant }
record ForecastValidity { issuedAt: Instant, validFrom: Instant, validUntilInclusive: Instant,
  scenario?: controlled token, modelVersion: non-empty string }

enum FactKind {
  regional_peak_demand, regional_annual_electricity, regional_supply_limit,
  annual_water_limit, peak_day_water_limit, resilience_capacity, backup_duration,
  binding_restriction, resilience_commitment, committed_finance,
  permanent_jobs, temporary_jobs, capital_investment,
  annual_operating_spend, community_concern_level, community_support_percentage,
  community_opposition_percentage, mana_whenua_position, electricity_load,
  electricity_generation, nodal_price, source_availability, document_statement,
  project_event_date
}

union EvidenceFact =
  | { factKind: regional_peak_demand, factId: FactId, evidenceId: EvidenceId,
      value: RationalDecimal, unit: MW, definition: coincident_regional_peak_demand,
      basis: measured|modelled|forecast, role: observed|baseline, scope: GeographyScope,
      observation?: ObservationWindow, forecast?: ForecastValidity, derivation: Derivation }
  | { factKind: regional_supply_limit, factId: FactId, evidenceId: EvidenceId,
      value: RationalDecimal, unit: MW, definition: deliverable_regional_supply_limit,
      basis: measured|modelled|forecast, role: limit, scope: GeographyScope,
      observation?: ObservationWindow, forecast?: ForecastValidity, derivation: Derivation }
  | { factKind: electricity_load, factId: FactId, evidenceId: EvidenceId,
      value: RationalDecimal, unit: MW, definition: interval_average_load,
      basis: measured, role: observed, scope: GeographyScope,
      observation: ObservationWindow, derivation: Derivation }
  | { factKind: electricity_generation, factId: FactId, evidenceId: EvidenceId,
      value: RationalDecimal, unit: MW, definition: interval_average_generation,
      basis: measured, role: observed, scope: GeographyScope,
      observation: ObservationWindow, derivation: Derivation }
  | { factKind: regional_annual_electricity, factId: FactId, evidenceId: EvidenceId,
      value: RationalDecimal, unit: MWh, definition: non-empty controlled token,
      basis: measured|modelled|forecast, role: observed|baseline, scope: GeographyScope,
      observation?: ObservationWindow, forecast?: ForecastValidity, derivation: Derivation }
  | { factKind: annual_water_limit, factId: FactId, evidenceId: EvidenceId,
      value: RationalDecimal, unit: litres|cubic_metres, period: calendar_year|rolling_365_days,
      definition: non-empty controlled token, basis: consented|available|modelled,
      role: limit, scope: GeographyScope, observation?: ObservationWindow,
      forecast?: ForecastValidity, derivation: Derivation }
  | { factKind: peak_day_water_limit, factId: FactId, evidenceId: EvidenceId,
      value: RationalDecimal, unit: litres_per_day|cubic_metres_per_day,
      definition: non-empty controlled token, basis: consented|available|modelled,
      role: limit, scope: GeographyScope, observation?: ObservationWindow,
      forecast?: ForecastValidity, derivation: Derivation }
  | { factKind: backup_duration, factId: FactId, evidenceId: EvidenceId,
      value: RationalDecimal, unit: hours, definition: tested_continuous_duration|contracted_duration,
      technology: battery|demand_response|diesel|gas|mixed_fossil|other,
      basis: verified|claimed, role: current|proposed, scope: GeographyScope,
      observation?: ObservationWindow, forecast?: ForecastValidity, derivation: Derivation }
  | { factKind: resilience_capacity, factId: FactId, evidenceId: EvidenceId,
      value: RationalDecimal, unit: MW, definition: verified_available_capacity,
      technology: battery|demand_response, basis: verified|claimed,
      role: current|proposed, scope: GeographyScope,
      observation?: ObservationWindow, forecast?: ForecastValidity, derivation: Derivation }
  | { factKind: binding_restriction, factId: FactId, evidenceId: EvidenceId,
      value: Boolean, unit: boolean, definition: binding_operational_or_legal_restriction,
      technology: diesel|gas|mixed_fossil|other,
      restrictionKind: emergency_only|time_limited|verified_restricted|unrestricted,
      basis: verified|claimed, role: current|proposed, scope: GeographyScope,
      observation?: ObservationWindow, forecast?: ForecastValidity, derivation: Derivation }
  | { factKind: committed_finance, factId: FactId, evidenceId: EvidenceId,
      value: Boolean, unit: boolean, definition: finance_committed_and_evidenced,
      basis: verified|claimed, role: current|proposed, scope: GeographyScope,
      observation?: ObservationWindow, forecast?: ForecastValidity, derivation: Derivation }
  | { factKind: resilience_commitment, factId: FactId, evidenceId: EvidenceId,
      value: Boolean, unit: boolean, definition: capacity_and_duration_committed,
      technology: battery|demand_response, basis: verified|claimed,
      role: current|proposed, scope: GeographyScope,
      observation?: ObservationWindow, forecast?: ForecastValidity, derivation: Derivation }
  | { factKind: permanent_jobs, factId: FactId, evidenceId: EvidenceId,
      value: Int64, unit: count, definition: full_time_equivalent|headcount,
      basis: verified|developer_claim|modelled, role: direct|indirect|induced,
      scope: GeographyScope, observation?: ObservationWindow, forecast?: ForecastValidity,
      derivation: Derivation }
  | { factKind: temporary_jobs, factId: FactId, evidenceId: EvidenceId,
      value: Int64, unit: count, definition: full_time_equivalent|headcount,
      basis: verified|developer_claim|modelled, role: direct|indirect|induced,
      scope: GeographyScope, observation?: ObservationWindow, forecast?: ForecastValidity,
      derivation: Derivation }
  | { factKind: capital_investment, factId: FactId, evidenceId: EvidenceId,
      value: RationalDecimal, unit: nzd, priceYear: UInt16,
      basis: verified|developer_claim|modelled, role: direct|indirect|induced,
      scope: GeographyScope, observation?: ObservationWindow, forecast?: ForecastValidity,
      derivation: Derivation }
  | { factKind: annual_operating_spend, factId: FactId, evidenceId: EvidenceId,
      value: RationalDecimal, unit: nzd_per_year, priceYear: UInt16,
      basis: verified|developer_claim|modelled, role: direct|indirect|induced,
      scope: GeographyScope, observation?: ObservationWindow, forecast?: ForecastValidity,
      derivation: Derivation }
  | { factKind: community_concern_level, factId: FactId,
      evidenceId: EvidenceId, value: low|moderate|high|mixed,
      unit: ordinal, definition: community_concern_band,
      basis: representative_consultation|formal_submission_summary,
      role: community, scope: GeographyScope, observation: ObservationWindow,
      derivation: Derivation, methodologyId?: MethodologyId }
  | { factKind: mana_whenua_position, factId: FactId,
      evidenceId: EvidenceId, value: support|neutral|oppose|mixed,
      unit: ordinal, definition: mana_whenua_stated_position,
      basis: explicit_statement, role: mana_whenua, scope: GeographyScope,
      observation: ObservationWindow, derivation: Derivation }
  | { factKind: community_support_percentage, factId: FactId,
      evidenceId: EvidenceId, value: Percentage, unit: percent,
      definition: respondent_share_supporting, basis: representative_consultation,
      role: community, scope: GeographyScope, observation: ObservationWindow,
      derivation: Derivation, methodologyId: MethodologyId }
  | { factKind: community_opposition_percentage, factId: FactId,
      evidenceId: EvidenceId, value: Percentage, unit: percent,
      definition: respondent_share_opposing, basis: representative_consultation,
      role: community, scope: GeographyScope, observation: ObservationWindow,
      derivation: Derivation, methodologyId: MethodologyId }
  | { factKind: nodal_price, factId: FactId, evidenceId: EvidenceId,
      value: RationalDecimal, unit: nzd_per_mwh, definition: nzd_per_mwh,
      basis: measured, role: observed, scope: GeographyScope,
      observation: ObservationWindow, derivation: Derivation }
  | { factKind: source_availability, factId: FactId,
      evidenceId: EvidenceId, value: Boolean, unit: boolean,
      definition: source_available_for_declared_purpose, basis: observed,
      role: registry_status, scope: GeographyScope,
      observation: ObservationWindow, derivation: Derivation }
  | { factKind: document_statement, factId: FactId,
      evidenceId: EvidenceId, value: BoundedText, unit: text,
      definition: non-empty controlled token, basis: verified,
      role: source_statement, scope: GeographyScope,
      observation?: ObservationWindow, derivation: Derivation }
  | { factKind: project_event_date, factId: FactId, evidenceId: EvidenceId,
      value: { kind: exact, date: LocalDate } |
        { kind: range, earliest: LocalDate, latestInclusive: LocalDate },
      unit: local_date, definition: controlled event type,
      basis: verified, role: observed|announced|scheduled, scope: GeographyScope,
      observation?: ObservationWindow, derivation: Derivation }

union Derivation =
  | { kind: direct, sourceField: non-empty string }
  | { kind: formula, formulaId: non-empty controlled token, inputFactIds: non-empty FactId[] }
  | { kind: aggregation, methodId: non-empty controlled token, inputRecordHashes: non-empty Sha256[] }

record AuthorityUseRule {
  ruleId: opaque string
  version: SemVer
  sourceTypes: non-empty SourceType[]
  factKinds: non-empty FactKind[]
  permittedFields: non-empty FieldPath[]
  geographyKinds: non-empty (national|regional|point)[]
  purposes: non-empty (assessment|map|case_file|site_screening|brief|research)[]
  temporalStates: non-empty (current|stale|unknown|future_invalid|forecast_valid|forecast_expired)[]
  allowedDerivations: non-empty (direct|formula|aggregation)[]
  resultingAuthority: qualifying_authoritative|context_only|candidate_only|forbidden
}

record EvidenceSnapshot {
  evidenceSnapshotId: Sha256 // hash of canonical remainder of this record
  asOf: Instant
  evidenceEntries: non-empty { evidenceId: EvidenceId, contentHash: Sha256 }[]
  factEntries: non-empty { factId: FactId, contentHash: Sha256 }[]
  statementEntries: { statementId: StatementId, contentHash: Sha256 }[]
  unresolvedQuestionEntries: { questionId: opaque string, contentHash: Sha256 }[]
  missingVoiceEntries: { missingVoiceId: opaque string, contentHash: Sha256 }[]
  companyEntries: { companyId: CompanyId, contentHash: Sha256 }[]
  companyClaimEntries: { companyClaimRecordId: opaque string, contentHash: Sha256 }[]
  edgeEntries: { edgeId: EdgeId, contentHash: Sha256 }[]
  communityEntries: { communityRecordId: opaque string, contentHash: Sha256 }[]
  freshness: { evidenceId: EvidenceId, policyVersion: SemVer,
    state: current|stale|unknown|future_invalid|forecast_valid|forecast_expired }[]
  coverage: CoverageRecord[]
  conflicts: ConflictRecord[]
  failedSources: { sourceId: SourceId, failureClass: controlled token, observedAt: Instant }[]
  sourceVersions: non-empty { sourceId: SourceId, sourceVersion: string, adapterVersion: SemVer }[]
  packVersions: non-empty { packId: PackId, contentHash: Sha256 }[]
  essentialClosure: { evidence: EvidenceRecordV2[], facts: EvidenceFact[],
    statements: TrustedStatementV2[], unresolvedQuestions: UnresolvedQuestionV2[],
    missingVoices: MissingVoiceRecordV2[], companies: CompanyIdentityRecordV2[],
    companyClaims: CompanyClaimRecordV2[], edges: EvidenceEdgeV2[],
    communityRecords: CommunityRecordV2[],
    authorityRules: AuthorityUseRule[] }
}
```

Every assessment and deterministic statement consumes `FactId` references resolved inside one `EvidenceSnapshot`; parsing narrative text into a value at assessment time is forbidden. Every evidence, fact, statement, unresolved-question, missing-voice, company, company-claim, edge and community entry list must exactly equal the corresponding IDs/content hashes in `essentialClosure`. An `EvidenceGraphSnapshotV2` is then content-addressed over that already-frozen evidence snapshot ID and the exact edge/node set, avoiding a hash cycle. An accepted prepared/manual edge can establish a relationship but never changes the authority of either node; an `ai_candidate` or candidate/rejected edge is presentation-only. The compiler validates every fact against exactly one applicable authority rule. Developer claims, model output and unverified extracted candidates can never compile as `qualifying_authoritative`. Old snapshots remain resolvable through their inlined essential closure even after pack refresh.

`ForecastValidity` requires `issuedAt <= validFrom <= validUntilInclusive`. It covers an `asOf` instant exactly when `validFrom <= asOf <= validUntilInclusive`; equality at the end remains valid, matching the approved inclusive `validUntil` rule. A basis later than `asOf` with no covering valid forecast is `future_invalid`. A record with neither usable observation/publication basis nor covering forecast is `unknown`. `unknown` and `future_invalid` are frozen in snapshots and can be matched only by authority rules that explicitly list those states; neither can satisfy a low-concern prerequisite.

### CTR-009A - total assessment and representative-methodology contract

```text
record RepresentativeMethodology {
  methodologyId: MethodologyId
  populationDefinition: non-empty BoundedText
  samplingFrame: non-empty BoundedText
  sampleSize: UInt32 > 0
  responseCount: UInt32 in 1..sampleSize
  collectionStart: LocalDate
  collectionEnd: LocalDate >= collectionStart
  geographyScope: GeographyScope
  measureDefinition: non-empty BoundedText
  weightingMethod: none|post_stratified
  limitations: non-empty BoundedText[]
  authorityEvidenceIds: non-empty EvidenceId[]
  qualification: qualifying|non_qualifying
  qualificationReasons: non-empty controlled token[]
}

union AssessmentInputRefV2 =
  | { kind: evidence_fact, factId: FactId, factContentHash: Sha256 }
  | { kind: scenario_origin, fieldPath: FieldPath, originProof: OriginProofV2,
      originProofHash: Sha256 }
  | { kind: calculation, traceRef: CalculationTraceRefV2 }
  | { kind: flexibility, traceRef: CalculationTraceRefV2 }

union CategoryAssessment =
  | { status: complete, category: electricity|water|resilience|economic|community,
      outcome: low|moderate|high, statementId: StatementId,
      decisiveInputRefs: non-empty AssessmentInputRefV2[],
      reasonIds: non-empty controlled token[], policyVersion: SemVer,
      conflictIds: ConflictId[], qualificationIds: opaque string[] }
  | { status: insufficient, category: electricity|water|resilience|economic|community,
      missing: non-empty MissingRecord[], statementId: StatementId,
      decisiveInputRefs: AssessmentInputRefV2[],
      reasonIds: non-empty controlled token[], policyVersion: SemVer,
      conflictIds: ConflictId[] }
  | { status: failed, category: electricity|water|resilience|economic|community,
      error: DomainError, statementId: StatementId,
      decisiveInputRefs: AssessmentInputRefV2[],
      reasonIds: non-empty controlled token[], policyVersion: SemVer }

union OverallAssessmentV2 =
  | { status: complete, outcome: low|moderate|high, statementId: StatementId,
      categoryStatementIds: non-empty StatementId[],
      reasonIds: non-empty controlled token[] }
  | { status: insufficient, statementId: StatementId,
      categoryStatementIds: non-empty StatementId[],
      reasonIds: non-empty controlled token[] }
  | { status: failed, statementId: StatementId,
      categoryStatementIds: non-empty StatementId[],
      reasonIds: non-empty controlled token[], errorIds: non-empty opaque string[] }
```

Community `low` is legal only from a current qualifying authoritative `community_concern_level=low` fact backed by a qualifying representative methodology. `moderate|high` may additionally come from a current cited formal authoritative consultation summary declaring that concern band. Support/opposition percentages remain contextual typed facts and are never converted into a concern band in v1. Missing/non-qualifying representative methodology can never produce low. Mana whenua position is always reported separately and never folded into a community percentage or concern band.

For mixed community records, exact precedence is: a current qualifying high-concern categorical fact -> high; else one compatible current qualifying categorical fact -> its declared value; else insufficient. Incompatible values for the same geography/observation population yield conflict and insufficient. Economic contradiction exists only when facts share `definition`, `role`, `scope`, overlapping observation/forecast interval, and monetary price year where applicable; unrelated role/basis differences are displayed as separate facts, not contradictions.

### CTR-010A - typed site criteria and presentation policy

```text
enum FindingOrdinal { pass, partial, missing, fail }
enum Desirability { preferred, acceptable, adverse, unknown }
enum SiteDomainOutcome { excluded, specialist_assessment_required,
  infrastructure_upgrade_required, insufficient_evidence, included }
enum SitePresentationGroup { passes_declared_constraints, needs_investigation, excluded }
enum CriterionFailureOutcome { excluded, specialist_assessment_required,
  infrastructure_upgrade_required }
enum BoundaryRule { inclusive, exclusive }
enum Direction { at_least, at_most, equals, one_of, present, absent }
enum MissingPolicy { finding_missing, finding_partial }

union ApplicabilityRule =
  | { kind: always }
  | { kind: field_equals, fieldPath: FieldPath,
      value: EnumTypedScalarV2|BooleanTypedScalarV2 }
  | { kind: field_in, fieldPath: FieldPath,
      values: non-empty EnumTypedScalarV2[] }

union SiteCriterionV2 =
  | { kind: numeric, criterionId: opaque string, fieldPath: FieldPath,
      operand: RationalDecimal, unit: Unit, conversionTableVersion: SemVer,
      direction: at_least|at_most, boundary: BoundaryRule,
      applicability: ApplicabilityRule,
      affectsClassification: Boolean, missingPolicy: MissingPolicy,
      failureOutcome: CriterionFailureOutcome,
      desirabilityByFinding: map<FindingOrdinal,Desirability> }
  | { kind: enum, criterionId: opaque string, fieldPath: FieldPath,
      allowedValues: non-empty controlled token[], direction: one_of,
      applicability: ApplicabilityRule,
      affectsClassification: Boolean, missingPolicy: MissingPolicy,
      failureOutcome: CriterionFailureOutcome,
      desirabilityByFinding: map<FindingOrdinal,Desirability> }
  | { kind: distance, criterionId: opaque string, sourceGeometryId: opaque string,
      targetLayerId: LayerId, operand: RationalDecimal, unit: kilometres,
      geometryEngineVersion: SemVer, distanceMethod: geodesic_wgs84,
      direction: at_least|at_most, boundary: BoundaryRule,
      applicability: ApplicabilityRule,
      affectsClassification: Boolean, missingPolicy: MissingPolicy,
      failureOutcome: CriterionFailureOutcome,
      desirabilityByFinding: map<FindingOrdinal,Desirability> }
  | { kind: area, criterionId: opaque string, geometryId: opaque string,
      operand: RationalDecimal, unit: hectares, geometryEngineVersion: SemVer,
      direction: at_least|at_most, boundary: BoundaryRule,
      applicability: ApplicabilityRule,
      affectsClassification: Boolean, missingPolicy: MissingPolicy,
      failureOutcome: CriterionFailureOutcome,
      desirabilityByFinding: map<FindingOrdinal,Desirability> }
  | { kind: evidence_presence, criterionId: opaque string, factKinds: non-empty FactKind[],
      direction: present|absent, authorityMinimum: qualifying_authoritative|context_only,
      applicability: ApplicabilityRule,
      affectsClassification: Boolean, missingPolicy: MissingPolicy,
      failureOutcome: CriterionFailureOutcome,
      desirabilityByFinding: map<FindingOrdinal,Desirability> }

union SiteFindingV2 =
  | { state: applicable, candidateId: CandidateId, criterionId: opaque string,
      finding: FindingOrdinal, desirability: Desirability,
      observed?: TypedScalar, operand?: TypedScalar, evidenceIds: EvidenceId[],
      geometryVersion?: SemVer, reasonId: non-empty controlled token }
  | { state: not_applicable, candidateId: CandidateId, criterionId: opaque string,
      applicabilityRuleHash: Sha256, reasonId: criterion_applicability_false }

record CandidateScreeningV2 {
  candidateId: CandidateId
  profileId: opaque string
  profileRevision: UInt64
  profileConfirmationHash: Sha256
  domainOutcome: SiteDomainOutcome
  presentationGroup: SitePresentationGroup
  findings: non-empty SiteFindingV2[]
  orderedPreferenceKey: Desirability[]
  evidenceSnapshotId: Sha256
  screeningHash: Sha256
}

record SiteProfileCandidateV2 {
  candidateProfileId: opaque string
  generation: UInt64
  criteria: non-empty SiteCriterionV2[]
  proposedClassificationAffectingCriterionIds: opaque string[]
  proposedPreferenceOrder: opaque string[]
  sourceClaimIds: opaque string[]
  citationIds: CitationId[]
  status: proposed_unconfirmed
  candidateHash: Sha256
}

record ConfirmedSiteProfile {
  profileId: opaque string
  revision: UInt64
  criteria: non-empty SiteCriterionV2[]
  classificationAffectingCriterionIds: opaque string[]
  preferenceOrder: opaque string[]
  sourceCandidateHash?: Sha256
  userReview: { action: confirm|confirm_with_edits, reviewer: user,
    reviewedAt: Instant, reviewedContentHash: Sha256 }
  confirmedAt: Instant
  confirmationHash: Sha256
}

union SensitivityVariant =
  | { kind: numeric_operand, criterionId: opaque string, values: non-empty RationalDecimal[], unit: Unit }
  | { kind: enum_membership, criterionId: opaque string, valueSets: non-empty controlled token[][] }
  | { kind: classification_toggle, criterionId: opaque string, values: [false,true] }

record SensitivityPlan { version: SemVer, variants: non-empty SensitivityVariant[],
  method: one_at_a_time, baseProfileHash: Sha256 }

record SensitivityResultV2 {
  planHash: Sha256
  baseScreeningHash: Sha256
  variant: SensitivityVariant
  changedCriterionId: opaque string
  candidateChanges: { candidateId: CandidateId, before: CandidateScreeningV2,
    after: CandidateScreeningV2, domainOutcomeChange: TypedChange,
    presentationGroupChange: TypedChange,
    findingChanges: TypedChange[] }[]
  resultHash: Sha256
}

union SitePresentationPolicyAlternatives =
  | { kind: separate_classification_groups, withinGroupOrder: lexicographic_confirmed_preferences,
      crossGroupRank: forbidden }
  | { kind: cross_class_workflow_order, groupOrder: non-empty SitePresentationGroup[],
      warningTextId: non-empty controlled token, withinGroupOrder: lexicographic_confirmed_preferences }

record SitePresentationPolicyV2 {
  kind: separate_classification_groups
  withinGroupOrder: lexicographic_confirmed_preferences
  crossGroupRank: forbidden
}

record NzMapSelectionState {
  mapId: whole_nz_primary_map
  viewport: { bbox: [Decimal,Decimal,Decimal,Decimal], zoom: Decimal }
  selectedGeographyId?: GeographyId
  selectedFeatureId?: AssetId
  selectionMethod: map_pointer|map_touch|map_keyboard|place_search|accessible_map_list
  activeSiteGroup?: SitePresentationGroup
  synchronizedPanelHash: Sha256
}

record SiteMapGroupView {
  policy: separate_classification_groups
  groups: {
    passes_declared_constraints: CandidateId[],
    needs_investigation: CandidateId[],
    excluded: CandidateId[]
  }
  featureByCandidate: map<CandidateId, AssetId>
  groupSymbolIds: map<SitePresentationGroup, non-empty controlled token>
  crossGroupRank: forbidden
}
```

An agent may propose only `SiteProfileCandidateV2`; it can never emit a `ConfirmedSiteProfile`. Confirmation is a separate explicit user action that hashes the reviewed candidate plus any user edits and creates the first immutable confirmed revision. Unconfirmed criteria or preferences never affect screening. For every confirmed profile, `classificationAffectingCriterionIds` must equal exactly the set of criterion IDs whose `affectsClassification` is true; duplicates, omissions or additions reject the profile, and the confirmation hash covers the entire criteria array, derived set, preference order and user-review receipt. Applicability is evaluated before data availability. Only a false declared `ApplicabilityRule` produces `not_applicable`; that finding is excluded from the domain outcome and preference keys. Missing or partial data always remains a `missing|partial` finding and can never be converted to `fail`, N/A, exclusion, specialist assessment, or infrastructure upgrade. Domain-outcome precedence is exactly `excluded`, then `specialist_assessment_required`, then `infrastructure_upgrade_required`, then `insufficient_evidence`, then `included`. Only an observed, available value that fails its comparator contributes the criterion's declared `failureOutcome`; any applicable classification criterion with `missing|partial` contributes `insufficient_evidence`. The presentation mapping is total and fixed: `excluded -> excluded`; `specialist_assessment_required|infrastructure_upgrade_required|insufficient_evidence -> needs_investigation`; `included -> passes_declared_constraints`. Findings display in the exact ordinal order `fail, missing, partial, pass`, followed by a separate N/A section, with desirability rendered separately. Unit conversions are stable tables, not locale arithmetic. Equal lexicographic keys tie by stable `candidateId`. The selected `SitePresentationPolicy` is `separate_classification_groups`; cross-group rank is forbidden and the map plus synchronized accessible result panel render the groups independently while showing each candidate's five-valued domain outcome. Whole-NZ geography and candidate selection is performed on the primary map by pointer, touch, keyboard map navigation, place search that moves/focuses the map, or the synchronized accessible map list. A checkbox or drop-down must not be used as the geography/site selector.

### CTR-001A/012A - worker epochs, inert agent context, bounded calls and receipts

```text
record WorkerReady {
  workerKind: analysis | connector
  instanceId: WorkerInstanceId
  epoch: WorkerEpoch
  protocolVersion: SemVer
  supportedContractVersions: non-empty SemVer[]
}

record WorkerCommandV2<T> {
  protocolVersion: 2
  operationId: OperationId
  requestId: RequestId
  generation: UInt64
  target: { workerKind: analysis|connector, instanceId: WorkerInstanceId, epoch: WorkerEpoch }
  sentAt: Instant
  payload: T
}

union WorkerEventV2<T> =
  | { kind: ready, producer: { workerKind: analysis|connector,
      instanceId: WorkerInstanceId, epoch: WorkerEpoch }, ready: WorkerReady }
  | { kind: progress, operationId: OperationId, requestId: RequestId,
      generation: UInt64, producer: { workerKind: analysis|connector,
      instanceId: WorkerInstanceId, epoch: WorkerEpoch },
      sequence: UInt32, payload: T }
  | { kind: terminal, operationId: OperationId, requestId: RequestId,
      generation: UInt64, producer: { workerKind: analysis|connector,
      instanceId: WorkerInstanceId, epoch: WorkerEpoch },
      payload: T }

union StageContext =
  | { kind: map_place, geographyId: GeographyId, selectedFeatureIds: AssetId[] }
  | { kind: project, projectId: opaque string, caseSnapshotId: Sha256 }
  | { kind: unsaved_scenario_draft, normalizedDraft: NormalizedScenarioV2, originProofHash: Sha256 }
  | { kind: result, resultSnapshotId: Sha256 }
  | { kind: comparison, resultSnapshotIds: non-empty Sha256[] }
  | { kind: case_file, caseSnapshotId: Sha256, section: CaseSection }
  | { kind: evidence, evidenceSnapshotId: Sha256, selectedFactIds: FactId[] }
  | { kind: site_profile, profile: ConfirmedSiteProfile, candidateIds: opaque string[] }
  | { kind: impact_brief, briefSnapshotId: Sha256 }

record AgentContextProjection {
  projectionVersion: SemVer
  generatedBy: { instanceId: WorkerInstanceId, epoch: WorkerEpoch }
  operationId: OperationId
  requestId: RequestId
  stage: StageContext
  categoryIds: non-empty controlled token[]
  evidenceSnapshotId: Sha256
  releaseId: opaque string
  dataPackHashes: non-empty Sha256[]
  deterministicStatements: BoundedText[]
  allowedToolScopes: ReadOnlyToolIdV2[]
  byteLength: UInt32 <= 262_144
  projectionHash: Sha256
}

record ExternalDisclosureV2 {
  disclosureId: opaque string
  disclosureVersion: SemVer
  requestId: RequestId
  operationId: OperationId
  generation: UInt64
  connectorId: ConnectorId
  configurationHash: Sha256
  destinationOrigin: NormalizedOrigin
  routeId: non-empty controlled token
  endpointLabel: non-empty sanitized string
  operationKind: primary_model|agent_tool|direct_research|connector_test
  modelRequestPurpose?: initial|tool_result_continuation|format_repair|continued_reasoning
  readOnlyToolId?: ReadOnlyToolIdV2
  contextCategories: non-empty controlled token[]
  selectedContextHash: Sha256
  outboundContentHash: Sha256
  sendsPrompt: Boolean
  promptHash?: Sha256
  sendsScenario: Boolean
  sendsEvidenceExtracts: Boolean
  sendsDocumentText: Boolean
  providerRetention: unknown|declared_no_retention|declared_retention
  cancelControlId: non-empty controlled token
  clearControlId: non-empty controlled token
  preparedAt: Instant
  expiresAt: Instant // exactly preparedAt + 10 minutes
  disclosureHash: Sha256
}

record ExternalDisclosureAcceptanceV2 {
  disclosure: ExternalDisclosureV2
  action: user_accepted
  acceptedAt: Instant
  acceptedDisclosureHash: Sha256
  acceptanceHash: Sha256
}

record CancellationTargetV2 {
  workerKind: analysis|connector
  instanceId: WorkerInstanceId
  epoch: WorkerEpoch
  operationId: OperationId
  requestId: RequestId
  generation: UInt64
}

union CancellationAcknowledgementV2 =
  | { disposition: cancelled_queued|signalled_active, target: CancellationTargetV2,
      cancellationCommandOperationId: OperationId }
  | { disposition: already_terminal|not_found|target_mismatch,
      target: CancellationTargetV2, cancellationCommandOperationId: OperationId }

union AgentLimitsV2 =
  | { toolMode: disabled,
      maximumModelCalls: UInt8 in 1..4, maximumFormatRepairs: UInt8 in 0..2,
      maximumToolRequests: exactly 0, maximumToolCalls: exactly 0,
      maximumConcurrentTools: exactly 0,
      maximumWallTimeMs: UInt32 in 1..120_000,
      perNetworkCallTimeoutMs: UInt32 in 1..30_000,
      maximumTransientRetries: UInt8 in 0..1,
      maximumContextBytes: UInt32 in 1..262_144,
      maximumResponseBytes: UInt32 in 1..1_048_576,
      maximumOutputTokens: UInt32 in 1..8_192,
      maximumCitations: UInt8 in 1..50,
      maximumResearchItems: UInt8 in 1..50 }
  | { toolMode: enabled,
      maximumModelCalls: UInt8 in 1..4, maximumFormatRepairs: UInt8 in 0..2,
      maximumToolRequests: UInt8 in 1..12, maximumToolCalls: UInt8 in 1..6,
      maximumConcurrentTools: UInt8 in 1..2,
      maximumWallTimeMs: UInt32 in 1..120_000,
      perNetworkCallTimeoutMs: UInt32 in 1..30_000,
      maximumTransientRetries: UInt8 in 0..1,
      maximumContextBytes: UInt32 in 1..262_144,
      maximumResponseBytes: UInt32 in 1..1_048_576,
      maximumOutputTokens: UInt32 in 1..8_192,
      maximumCitations: UInt8 in 1..50,
      maximumResearchItems: UInt8 in 1..50 }

enum AgentModeV2 { explain, research, compare, find_gaps, generate_questions,
  parse_site_profile, generate_visual, guided_education }
record ToolRouteBindingV2 {
  toolId: ReadOnlyToolIdV2
  connectorId: ConnectorId
  connectorKind: tavily_rest|remote_mcp
  configurationHash: Sha256
  routeId: non-empty controlled token
  routeCapability: ReadOnlyToolRouteCapabilityV2
  endpointLabel: non-empty sanitized string
  bindingHash: Sha256
}
record AgentRequestV2 {
  requestId: RequestId
  operationId: OperationId
  generation: UInt64
  mode: AgentModeV2
  userPrompt: BoundedText <= 65_536 bytes
  audience: public|decision_maker
  lens: people|planet|both
  stage: StageContext
  connectorId: ConnectorId
  toolRouteBindings: ToolRouteBindingV2[]
  acceptedDisclosureAcceptances: non-empty ExternalDisclosureAcceptanceV2[]
  limits: AgentLimitsV2
}

record AgentExecutionBindingV2 {
  connectorId: ConnectorId
  configurationHash: Sha256
  capabilityMatrixHash: Sha256
  dialect: openai_chat_completions|openai_responses|mcp_streamable_http
  modelId: non-empty sanitized string
  routeId: non-empty controlled token
  endpointLabel: non-empty sanitized string
  bindingHash: Sha256
}

`AgentLimitsV2` is relationally valid only when `maximumFormatRepairs < maximumModelCalls`,
`perNetworkCallTimeoutMs <= maximumWallTimeMs`, and, for `toolMode=enabled`,
`maximumConcurrentTools <= maximumToolCalls <= maximumToolRequests`. The strict semantic validator rejects a
record that satisfies field ranges but violates one of these named invariants.
Disabled tool mode requires `AgentContextProjection.allowedToolScopes=[]` and
`toolRouteBindings=[]`; enabled mode requires a non-empty scope set, exactly one route binding
for every allowed scope and no extra binding, and every scope must resolve in the exact
five-entry registry.

`ToolRouteBindingV2.bindingHash` omits only itself. For a request, `toolId` is unique and each
binding fixes exactly one coordinator-selected connector/configuration/route/capability before
the first model dispatch; zero or multiple bindings for an enabled tool reject admission rather
than selecting by connector kind, array order or model output. The binding must match the current
configuration, capability matrix and exact five-entry registry. A connector may serve more than
one tool only through separate exact bindings.

`AgentRequestV2.acceptedDisclosureAcceptances` is a unique acceptance-hash set. It contains
exactly one current `primary_model` acceptance for the initial canonical model bytes and primary
connector. Additional exact acceptances may pre-authorize later model bytes or a tool operation
through a declared route binding and may remain unused; no acceptance may name another
connector/configuration/route/tool. Every outbound operation whose exact disclosure is not in
the effective accepted set uses the same target-bound suspend/authorize/resume transition.
Removing a route binding removes its unused grants; adding or substituting one creates a new
request, projection and disclosure set.

`AgentExecutionBindingV2.bindingHash` omits only itself and is created by the coordinator from
the current sanitized configuration plus unexpired capability matrix before queue admission.
The execute command, every primary disclosure and the final receipt must agree on connector,
configuration, route, dialect, model and endpoint label. It contains no endpoint URL or secret
handle and is sufficient to create a zero-activity receipt if the queued command is cancelled.

union MapQueryV2 =
  | { kind: viewport, viewport: { bbox: [Decimal,Decimal,Decimal,Decimal], zoom: Decimal },
      layerIds: non-empty LayerId[], selectedGeographyId?: GeographyId,
      selectedFeatureId?: AssetId, maximumFeatures: UInt32 in 1..10_000 }
  | { kind: place_search, sanitizedQuery: non-empty BoundedText <= 512 bytes,
      layerIds: non-empty LayerId[], maximumResults: UInt8 in 1..20 }

union MapPlaceMatchV2 =
  | { kind: place, geographyId: GeographyId, featureId: AssetId,
      displayLabel: non-empty BoundedText }
  | { kind: project, projectId: ProjectId, geographyId?: GeographyId,
      featureId: AssetId, displayLabel: non-empty BoundedText }

record MapQueryResultV2 {
  queryHash: Sha256
  features: MapFeature[]
  layerDescriptors: MapLayerDescriptorV2[]
  trustedStatements: TrustedStatementV2[]
  companyRecords: CompanyIdentityRecordV2[]
  placeMatches: MapPlaceMatchV2[]
  projectCatalogRecords: ProjectCatalogRecordV2[]
  selectedProjectSheet?: ProjectSheetV2
  selection: NzMapSelectionState
  releaseManifestHash: Sha256
}

union ScenarioValidationOutcomeV2 =
  | { status: complete, normalized: NormalizedScenarioV2,
      warnings: ValidationIssueV2[], normalizedHash: Sha256 }
  | { status: rejected, issues: non-empty ValidationIssueV2[] }
  | { status: failed, error: DomainError }

record ValidationIssueV2 {
  fieldPath: FieldPath
  code: non-empty controlled token
  severity: warning|error
  rejectedValueClass: empty|syntax|range|incompatible|suspicious|untrusted_origin
  messageId: non-empty controlled token
}

record AnalysisSnapshotRequestV2 {
  scenario: NormalizedScenarioV2
  evidenceSnapshotId: Sha256
  assessmentPolicyVersion: SemVer
  calculationPolicyVersion: SemVer
}

record ComparisonRequestV2 { resultSnapshotIds: Sha256[2..20] }
record SiteScreeningRequestV2 { profile: ConfirmedSiteProfile,
  candidateIds: non-empty CandidateId[], evidenceSnapshotId: Sha256 }
record SiteSensitivityRequestV2 { profile: ConfirmedSiteProfile,
  candidateIds: non-empty CandidateId[], evidenceSnapshotId: Sha256,
  plan: SensitivityPlan }
record EvidenceQueryV2 { evidenceSnapshotId: Sha256, factIds: FactId[],
  evidenceIds: EvidenceId[], includeConflicts: Boolean, maximumRecords: UInt32 in 1..2_000 }
record EvidenceQueryResultV2 { facts: EvidenceFact[], records: EvidenceRecordV2[],
  statements: TrustedStatementV2[], unresolvedQuestions: UnresolvedQuestionV2[],
  missingVoices: MissingVoiceRecordV2[], companies: CompanyIdentityRecordV2[],
  companyClaims: CompanyClaimRecordV2[], edges: EvidenceEdgeV2[],
  communityRecords: CommunityRecordV2[],
  conflicts: ConflictRecord[], queryHash: Sha256 }
record EvidenceGraphQueryV2 { graphSnapshotId: Sha256, nodes: EvidenceGraphNodeRefV2[],
  edgeTypes: EvidenceEdgeTypeV2[], maximumEdges: UInt32 in 1..2_000 }
record EvidenceGraphQueryResultV2 { graphSnapshotId: Sha256,
  edges: EvidenceEdgeV2[], statements: TrustedStatementV2[],
  companies: CompanyIdentityRecordV2[], companyClaims: CompanyClaimRecordV2[],
  unresolvedNodes: EvidenceGraphNodeRefV2[], queryHash: Sha256 }
record ResearchCacheInspectionV2 { record: ResearchCacheRecordV2, expired: Boolean,
  refreshAllowed: Boolean }
record PackAssetLoadResultV2 { releaseManifestHash: Sha256,
  assetIds: non-empty AssetId[], assetHashes: non-empty map<AssetId,Sha256>,
  packManifests: non-empty DataPackManifestV2[] }

record ImpactBriefBuildRequestV2 {
  resultSnapshotIds: non-empty Sha256[1..20]
  projectCaseSnapshotIds: Sha256[]
  audience: public|decision_maker
  lens: people|planet|both
  includeAiAppendixFromReceiptId?: Sha256
}

union ProjectCaseLocatorV2 =
  | { kind: prepared_asset, caseAssetId: AssetId }
  | { kind: immutable_snapshot, caseSnapshotId: Sha256 }

union LocationResolutionRequestV2 =
  | { method: coordinate_entry, longitudeText: non-empty BoundedText <= 64 bytes,
      latitudeText: non-empty BoundedText <= 64 bytes, geometrySetHash: Sha256 }
  | { method: map_pointer|map_touch|map_keyboard|accessible_map_list,
      longitude: RationalDecimal, latitude: RationalDecimal,
      featureId?: AssetId, geometrySetHash: Sha256 }

union LocationResolutionOutcomeV2 =
  | { status: complete, location: LocationSelectionV2,
      matchedFeatureId?: AssetId, boundaryCandidateIds: GeographyId[] }
  | { status: rejected, issues: non-empty ValidationIssueV2[] }
  | { status: failed, error: DomainError }

record SiteProfileConfirmationRequestV2 {
  proposal: SiteProfileCandidateV2
  action: confirm|confirm_with_edits
  reviewedCriteria: non-empty SiteCriterionV2[]
  reviewedPreferenceOrder: opaque string[]
  reviewedAt: Instant
  reviewedContentHash: Sha256
}

record ResearchFetchRequestV2 {
  requestId: RequestId
  operationId: OperationId
  generation: UInt64
  mode: initial|refresh
  sanitizedQuery: non-empty BoundedText <= 65_536 bytes
  normalizedQueryHash: Sha256
  connectorId: ConnectorId
  configurationHash: Sha256
  routeId: non-empty controlled token
  toolId: ReadOnlyToolIdV2
  disclosureAcceptance: ExternalDisclosureAcceptanceV2
  priorResearchRecordId?: opaque string
  initialRetrievedAt?: Instant
}

record NetworkResearchClaimV2 { claimId: opaque string, text: BoundedText,
  citationIds: CitationId[] }
union ResearchNetworkResultV2 =
  | { kind: web_search_results, items: WebSearchResultItemV2[] }
  | { kind: source_extracts, items: SourceExtractV2[] }
  | { kind: cited_research_text, claims: NetworkResearchClaimV2[],
      citations: CitationV2[] }

record ResearchFetchResultV2 {
  request: ResearchFetchRequestV2
  networkResult: ResearchNetworkResultV2
  resultIds: opaque string[]
  sourceUrls: Url[]
  citations: CitationV2[]
  retrievedAt: Instant
  connectorSchemaVersion: SemVer
}

record ResearchCompilationRequestV2 { fetchResult: ResearchFetchResultV2,
  asOf: Instant, freshnessPolicyVersion: SemVer, evidencePolicyVersion: SemVer }
record ResearchCompilationOutcomeV2 { cacheRecord: ResearchCacheRecordV2,
  candidateEvidenceRecords: EvidenceRecordV2[], candidateFactIds: FactId[],
  compilationHash: Sha256 }

union SanitizedEndpointRouteV2 =
  | { visibility: public_path, publicBasePath: non-empty normalized absolute path }
  | { visibility: sensitive_vault_route, vaultRoutePolicyId: opaque random UUIDv7 string }

record ConnectorSetupV2 {
  connectorId: ConnectorId
  connectorKind: openai_compatible|remote_mcp|tavily_rest
  endpoint: ConnectorEndpointIngressV2
  modelId?: non-empty sanitized string
  dialectPreference: auto|openai_responses|openai_chat_completions|mcp_streamable_http|tavily_rest
  authorizationPlacement: header_authorization|header_x_api_key|body_declared_field|
    query_declared_secret_parameter
  optionalNonSecretHeaders: { name: AllowedNonSecretHeaderNameV2,
    value: non-empty sanitized string <= 1024 bytes }[]
  persistenceMode: encrypted_persistent|disclosed_browser_local|session_memory
  secretIngress: ConnectorSecretIngressV2
}

record SanitizedConnectorDraftV2 {
  draftId: opaque string
  connectorId: ConnectorId
  connectorKind: openai_compatible|remote_mcp|tavily_rest
  normalizedOrigin: NormalizedOrigin
  endpointRoute: SanitizedEndpointRouteV2
  endpointLabel: non-empty sanitized string
  modelId?: non-empty sanitized string
  dialectPreference: auto|openai_responses|openai_chat_completions|
    mcp_streamable_http|tavily_rest
  authorizationPlacement: header_authorization|header_x_api_key|body_declared_field|
    query_declared_secret_parameter
  optionalNonSecretHeaders: { name: AllowedNonSecretHeaderNameV2,
    value: non-empty sanitized string <= 1024 bytes }[]
  persistenceMode: encrypted_persistent|disclosed_browser_local|session_memory
  secretState: staged|none
  draftHash: Sha256
  createdAt: Instant
  expiresAt: Instant // exactly createdAt + 10 minutes
}

union ConnectorControlCommandPayloadV2 =
  | { kind: normalize_connector_draft, setup: ConnectorSetupV2 }
  | { kind: commit_connector_configuration, draftId: opaque string,
      draftHash: Sha256, confirmationHash: Sha256 }
  | { kind: discard_connector_draft, draftId: opaque string, draftHash: Sha256 }
  | { kind: replace_connector_secret, connectorId: ConnectorId,
      secretIngress: SecretIngressBufferV2 }
  | { kind: test_connector_capabilities, connectorId: ConnectorId,
      disclosureAcceptances: non-empty ExternalDisclosureAcceptanceV2[] }
  | { kind: persist_connector_after_success, connectorId: ConnectorId,
      successfulReceiptId: Sha256 }
  | { kind: clear_connector_secret, connectorId: ConnectorId }
  | { kind: remove_connector_configuration, connectorId: ConnectorId }
  | { kind: clear_all_connector_secrets, confirmationHash: Sha256 }

union InertWorkerCommandPayloadV2 =
  | { kind: query_map, query: MapQueryV2 }
  | { kind: resolve_location, request: LocationResolutionRequestV2 }
  | { kind: load_pack_assets, assetIds: non-empty AssetId[] }
  | { kind: load_project_case, locator: ProjectCaseLocatorV2 }
  | { kind: load_impact_brief, briefSnapshotId: Sha256 }
  | { kind: normalize_scenario, draft: ScenarioDraftV2 }
  | { kind: build_analysis_snapshot, request: AnalysisSnapshotRequestV2 }
  | { kind: build_comparison, request: ComparisonRequestV2 }
  | { kind: screen_sites, request: SiteScreeningRequestV2 }
  | { kind: run_site_sensitivity, request: SiteSensitivityRequestV2 }
  | { kind: confirm_site_profile, request: SiteProfileConfirmationRequestV2 }
  | { kind: query_evidence, query: EvidenceQueryV2 }
  | { kind: query_evidence_graph, query: EvidenceGraphQueryV2 }
  | { kind: build_impact_brief, request: ImpactBriefBuildRequestV2 }
  | { kind: resolve_visual, spec: VisualSpecV2, projection: AgentContextProjection }
  | { kind: inspect_research_cache, researchRecordId: opaque string }
  | { kind: fetch_research, request: ResearchFetchRequestV2 }
  | { kind: compile_research, request: ResearchCompilationRequestV2 }
  | { kind: build_agent_projection, request: AgentRequestV2 }
  | { kind: execute_agent, request: AgentRequestV2, projection: AgentContextProjection,
      executionBinding: AgentExecutionBindingV2 }
  | { kind: authorize_agent_destination, target: CancellationTargetV2,
      acceptance: ExternalDisclosureAcceptanceV2 }
  | { kind: cancel_operation, target: CancellationTargetV2,
      reasonId: non-empty controlled token }
  | { kind: validate_pack, assetIds: non-empty AssetId[] }

union WorkerCommandPayloadV2 = InertWorkerCommandPayloadV2 |
  ConnectorControlCommandPayloadV2

union WorkerEventPayloadV2 =
  | { kind: map_query_ready, result: MapQueryResultV2 }
  | { kind: location_resolution, outcome: LocationResolutionOutcomeV2 }
  | { kind: pack_assets_ready, result: PackAssetLoadResultV2 }
  | { kind: project_case_ready, projectCase: ProjectCaseV2 }
  | { kind: impact_brief_ready, brief: ImpactBriefV2 }
  | { kind: scenario_validation, outcome: ScenarioValidationOutcomeV2 }
  | { kind: analysis_snapshot_ready, result: ResultSnapshotV2 }
  | { kind: comparison_ready, comparison: ComparisonSnapshotV2 }
  | { kind: site_screenings_ready, screenings: CandidateScreeningV2[] }
  | { kind: site_sensitivity_ready, results: SensitivityResultV2[] }
  | { kind: site_profile_confirmed, profile: ConfirmedSiteProfile }
  | { kind: evidence_query_ready, result: EvidenceQueryResultV2 }
  | { kind: evidence_graph_query_ready, result: EvidenceGraphQueryResultV2 }
  | { kind: visual_resolution_ready, outcome: VisualOutcomeV2 }
  | { kind: research_cache_inspection, inspection: ResearchCacheInspectionV2 }
  | { kind: research_fetch_ready, result: ResearchFetchResultV2 }
  | { kind: research_compilation_ready, outcome: ResearchCompilationOutcomeV2 }
  | { kind: connector_draft_ready, draft: SanitizedConnectorDraftV2 }
  | { kind: connector_configured, configuration: SanitizedConnectorConfiguration,
      vaultReceipt: ConnectorVaultMutationReceiptV2 }
  | { kind: connector_capabilities, matrix: ConnectorCapabilityMatrixV2,
      configuration: SanitizedConnectorConfiguration }
  | { kind: connector_vault_mutation, receipt: ConnectorVaultMutationReceiptV2 }
  | { kind: projection_ready, projection: AgentContextProjection }
  | { kind: analysis_progress, phase: map|case|brief|validation|calculation|assessment|
      comparison|site|evidence|visual|pack, completed: UInt32, total?: UInt32 }
  | { kind: agent_progress, phase: disclosure|model|tool|validation,
      completed: UInt16, total?: UInt16 }
  | { kind: destination_disclosure_required, target: CancellationTargetV2,
      disclosure: ExternalDisclosureV2 }
  | { kind: destination_disclosure_accepted, target: CancellationTargetV2,
      acceptanceHash: Sha256 }
  | { kind: agent_terminal, terminal: AgentTerminalResultV2 }
  | { kind: cancellation_acknowledged, outcome: CancellationAcknowledgementV2 }
  | { kind: operation_cancelled, cancellationCommandOperationId: OperationId,
      reasonId: non-empty controlled token }
  | { kind: operation_failed, error: DomainError }
  | { kind: pack_validation, outcome: complete|failed, error?: DomainError }

Cancellation terminality is command-family-specific. The cancel command always terminates on
its own tuple with `cancellation_acknowledged`. A cancelled original `execute_agent` emits
exactly one `agent_terminal` whose `AgentTerminalResultV2.status=cancelled`; it never emits
`operation_cancelled`. Its receipt carries the cancel-command operation ID and final counters.
If it was still queued, the already-validated execute command supplies projection/execution-binding
identity, `startedAt == finishedAt` at cancellation, every activity counter is zero, tool receipts
are empty and the request's accepted destination set is copied byte-identically. Every other
v1 cancelled original command emits exactly one `operation_cancelled`. Neither family may emit
both terminals.

record CitationV2 {
  citationId: CitationId
  sourceUrl: Url
  title: BoundedText
  publisher?: BoundedText
  publishedAt?: Instant
  retrievedAt: Instant
  evidenceId?: EvidenceId
  relevantExtract?: BoundedText
  toolCallId?: opaque string
}

record AgentClaimV2 {
  claimId: opaque string
  text: BoundedText
  kind: source_statement|model_inference|uncertainty|unresolved_conflict|unsupported
  citationIds: CitationId[]
  relatedEvidenceIds: EvidenceId[]
}

enum ReadOnlyToolIdV2 { tavily_search, tavily_extract, mcp_web_search,
  mcp_web_research, mcp_fetch_source }
type SanitizedHostnameV2 = lower-case IDNA ASCII hostname with no scheme, port, path,
  query, fragment, userinfo, wildcard or credential-shaped label
union ReadOnlyToolArgumentsV2 =
  | { toolId: tavily_search, sanitizedQuery: non-empty BoundedText <= 65_536 bytes,
      maximumResults: UInt8 in 1..20, includeDomains: SanitizedHostnameV2[0..10] }
  | { toolId: tavily_extract, sourceUrls: non-empty Url[1..10] }
  | { toolId: mcp_web_search, sanitizedQuery: non-empty BoundedText <= 65_536 bytes,
      maximumResults: UInt8 in 1..20 }
  | { toolId: mcp_web_research, sanitizedQuestion: non-empty BoundedText <= 65_536 bytes,
      maximumSources: UInt8 in 1..20 }
  | { toolId: mcp_fetch_source, sourceUrl: Url,
      maximumExtractBytes: UInt32 in 1..262_144 }
enum ReadOnlyToolRouteCapabilityV2 { tavily_search_route, tavily_extract_route,
  mcp_tools_call_web_search, mcp_tools_call_web_research, mcp_tools_call_fetch_source }
enum AgentStageKindV2 { map_place, project, unsaved_scenario_draft, result, comparison,
  case_file, evidence, site_profile, impact_brief }
record ReadOnlyToolRegistryEntryV2 {
  toolId: ReadOnlyToolIdV2
  connectorKinds: non-empty (tavily_rest|remote_mcp)[]
  routeCapability: ReadOnlyToolRouteCapabilityV2
  argumentsSchemaId: non-empty controlled token
  resultKind: web_search_results|source_extracts|research_synthesis
  sideEffectClass: exactly read_only_external_research
  allowedAgentModes: non-empty AgentModeV2[]
  allowedStageKinds: non-empty AgentStageKindV2[]
  registryVersion: SemVer
  entryHash: Sha256
}
record ReadOnlyToolRegistryV2 {
  registryVersion: SemVer
  entries: exactly five ReadOnlyToolRegistryEntryV2[]
  registryHash: Sha256
}
record ToolDestinationBindingV2 {
  connectorId: ConnectorId
  connectorKind: tavily_rest|remote_mcp
  configurationHash: Sha256
  routeId: non-empty controlled token
  disclosureAcceptance: ExternalDisclosureAcceptanceV2
}
record ToolOperationV2 {
  toolOperationId: OperationId // unique child operation for this new logical requestId/callId
  requestId: RequestId
  callId: opaque non-empty string
  toolId: ReadOnlyToolIdV2
  arguments: ReadOnlyToolArgumentsV2
  destination: ToolDestinationBindingV2
  canonicalArgumentsHash: Sha256
  operationHash: Sha256 // hash(toolId + exact destination + acceptance hash + canonical arguments)
}

record CompleteToolReceiptV2 { status: complete, operation: ToolOperationV2,
  resultHash: Sha256, replayRecordId: Sha256, sanitizedCitationIds: CitationId[],
  completedAt: Instant, networkPerformed: Boolean, receiptHash: Sha256 }

union ToolReceipt =
  | CompleteToolReceiptV2
  | { status: rejected, operation: ToolOperationV2,
      reason: call_id_argument_conflict|tool_not_allowed|limit|invalid_arguments }
  | { status: failed, operation: ToolOperationV2, error: DomainError }

record WebSearchResultItemV2 {
  resultId: opaque string
  title: non-empty BoundedText
  sourceUrl: Url
  snippet: BoundedText
  publishedAt?: Instant
  retrievedAt: Instant
}

union SourceExtractLocatorV2 =
  | { kind: web_text_fragment, exactTextHash: Sha256,
      precedingTextHash?: Sha256, followingTextHash?: Sha256 }
  | { kind: document, locator: PageLocatorV2 }
record SourceExtractV2 {
  resultId: opaque string
  sourceUrl: Url
  title: non-empty BoundedText
  extracts: non-empty { extractId: opaque string, text: BoundedText,
    locator: SourceExtractLocatorV2 }[]
  retrievedAt: Instant
}

union SanitizedToolResultV2 =
  | { kind: web_search_results, normalizedQueryHash: Sha256,
      items: WebSearchResultItemV2[] }
  | { kind: source_extracts, items: SourceExtractV2[] }
  | { kind: research_synthesis, normalizedQueryHash: Sha256,
      claims: AgentClaimV2[], citations: CitationV2[] }
  | { kind: evidence_candidates, evidenceIds: EvidenceId[],
      citations: CitationV2[] }

record ToolReplayRecord {
  replayRecordId: Sha256
  operation: ToolOperationV2
  initialCallId: opaque non-empty string
  sanitizedResult: SanitizedToolResultV2
  sanitizedResultByteLength: UInt32 <= 2_097_152
  resultHash: Sha256
  citations: CitationV2[]
  completedAt: Instant
  networkPerformed: Boolean
  completeReceipt: CompleteToolReceiptV2
  createdAt: Instant
  expiresAt: Instant
  transactionReceiptHash: Sha256
}

record ToolCallAliasRecordV2 {
  aliasRecordId: Sha256
  requestId: RequestId
  callId: opaque non-empty string
  canonicalArgumentsHash: Sha256
  operationHash: Sha256
  replayRecordId: Sha256
  completeReceipt: CompleteToolReceiptV2
  createdAt: Instant
  expiresAt: Instant
  transactionReceiptHash: Sha256
}

union AgentOutboundContactReceiptV2 =
  | { kind: primary_model, contactSequence: UInt16, modelCallOrdinal: UInt8,
      purpose: initial|tool_result_continuation|format_repair|continued_reasoning,
      connectorId: ConnectorId, configurationHash: Sha256,
      routeId: non-empty controlled token, disclosureAcceptanceHash: Sha256,
      outboundContentHash: Sha256, attemptOrdinal: UInt8 in 1..2,
      attemptedAt: Instant, contactHash: Sha256 }
  | { kind: agent_tool, contactSequence: UInt16, toolOperationId: OperationId,
      callId: opaque non-empty string, toolId: ReadOnlyToolIdV2,
      connectorId: ConnectorId, configurationHash: Sha256,
      routeId: non-empty controlled token, disclosureAcceptanceHash: Sha256,
      outboundContentHash: Sha256, attemptOrdinal: UInt8 in 1..2,
      attemptedAt: Instant, contactHash: Sha256 }

record AgentExecutionReceipt {
  receiptId: Sha256
  requestId: RequestId
  operationId: OperationId
  generation: UInt64
  connectorWorker: { instanceId: WorkerInstanceId, epoch: WorkerEpoch }
  analysisProjectionProducer: { instanceId: WorkerInstanceId, epoch: WorkerEpoch }
  contextHash: Sha256
  contextCategories: non-empty controlled token[]
  acceptedDisclosureAcceptances: non-empty ExternalDisclosureAcceptanceV2[]
  contactedNetworkAttempts: AgentOutboundContactReceiptV2[]
  connectorId: ConnectorId
  dialect: openai_chat_completions|openai_responses|mcp_streamable_http
  modelId: non-empty sanitized string
  routeId: non-empty controlled token
  endpointLabel: non-empty sanitized string // never a URL
  startedAt: Instant
  finishedAt: Instant
  limits: AgentLimitsV2
  modelCallCount: UInt8
  formatRepairCount: UInt8
  toolRequestCount: UInt8
  toolCallCount: UInt8
  sameCallReplayCount: UInt8
  preallocationRejectCount: UInt8
  networkAttemptCount: UInt16
  transientRetryCount: UInt8
  maximumObservedConcurrentTools: UInt8
  outputTokenCount: UInt32
  outputTokenCountMethod: provider_usage_verified|conservative_utf8_byte_upper_bound
  citationCount: UInt8
  researchItemCount: UInt8
  toolReceipts: ToolReceipt[]
  cancelledByCommandOperationId?: OperationId
  terminalStatus: complete|partial|cancelled|failed|worker_restarted|obsolete
}

union AgentStructuredPayloadV2 =
  | { kind: site_profile_candidate, value: SiteProfileCandidateV2 }
  | { kind: visual_spec, value: VisualSpecV2 }
  | { kind: guided_education, value: GuidedEducationState }
  | { kind: research_evidence_candidates, value: EvidenceId[] }
  | { kind: questions, value: BoundedText[] }

record CompleteAgentCoreResultV2 { status: complete, claims: AgentClaimV2[],
  citations: CitationV2[], structuredPayload?: AgentStructuredPayloadV2 }
record PartialAgentCoreResultV2 { status: partial, claims: AgentClaimV2[],
  citations: CitationV2[], errors: DomainError[] }
record CancelledAgentCoreResultV2 { status: cancelled,
  reasonId: non-empty controlled token }
record FailedAgentCoreResultV2 { status: failed, errors: non-empty DomainError[] }

union AgentCoreResultV2 = CompleteAgentCoreResultV2 | PartialAgentCoreResultV2 |
  CancelledAgentCoreResultV2 | FailedAgentCoreResultV2

union AgentTerminalResultV2 =
  | { status: complete, result: CompleteAgentCoreResultV2, receipt: AgentExecutionReceipt }
  | { status: partial, result: PartialAgentCoreResultV2, receipt: AgentExecutionReceipt }
  | { status: cancelled, result: CancelledAgentCoreResultV2, receipt: AgentExecutionReceipt }
  | { status: failed, result: FailedAgentCoreResultV2, receipt: AgentExecutionReceipt }
  | { status: worker_restarted|obsolete,
      result?: PartialAgentCoreResultV2|CancelledAgentCoreResultV2,
      receipt: AgentExecutionReceipt }
```

The main-thread coordinator requests the projection from the analysis worker, verifies producer instance/epoch, schema, exact UTF-8 byte count and hash, then structured-clones that inert projection to the connector worker. The connector worker never calls the analysis worker. Before every initial, continued, tool-result or format-repair model request it prepares the exact disclosure; a missing acceptance suspends through the same `authorize_agent_destination` transition used by tools. Each outbound model request increments `modelCallCount` only after authorization and immediately before its first fetch; `formatRepairCount` increments separately.

Every decoded model-emitted tool request increments `toolRequestCount` before alias lookup and is bounded by `maximumToolRequests`. Alias lookup occurs before child allocation or `toolCallCount` mutation. A completed same-call-ID/same-arguments/operation alias increments `sameCallReplayCount`, returns its stored receipt/result without network, creates no child operation and appends no receipt. Same call ID with different canonical arguments or destination-bound operation hash increments `preallocationRejectCount` and fails with `tool_call_id_conflict` before disclosure, child allocation, network or receipt append. A new call ID increments `toolCallCount`, receives one unique child `toolOperationId` and produces exactly one terminal `ToolReceipt`; if its operation hash already completed under another ID in the same request, its atomically persisted alias/receipt has `networkPerformed=false` before the prior result is returned.

Every agent receipt separately embeds (a) the byte-identical unique `acceptedDisclosureAcceptances` set, which starts from the request and may grow only through acknowledged target-bound authorization and may include unused grants, and (b) `contactedNetworkAttempts`, exactly one entry for every started fetch including retries. Every contacted acceptance hash resolves to the accepted set; unused request-preaccepted or dynamically accepted grants have no contact entry. Contact sequence is gap-free in attempted order and `networkAttemptCount == contactedNetworkAttempts.length`. `toolRequestCount == toolCallCount + sameCallReplayCount + preallocationRejectCount`, `toolCallCount == toolReceipts.length`, and all request/call/repair/retry/concurrency/byte/token/citation/research counters are within their named limits. Disabled tool mode requires every tool counter, tool receipt and tool contact array member to be zero/empty. `cancelledByCommandOperationId` is present exactly for an explicitly cancelled terminal. Any mismatch rejects the terminal rather than clipping it.

Before a new tool-network result is exposed to the model or UI, one immutable `ToolReplayRecord` containing the complete operation, strict result, citations, completion time, network flag and complete receipt is committed atomically with the same receipt in the append-only `tool_receipts` store and its initial `ToolCallAliasRecordV2` in `tool_aliases`. A crash after network completion therefore replays the stored strict result bytes and citations by `replayRecordId` without a second network request; a result hash alone is insufficient. Per-request call-ID and operation-hash indexes are rebuilt from durable alias and replay records after restart.

Hash construction is acyclic: `replayRecordId` is the SHA-256 of the canonical operation, strict result, result hash, citations, completion time and network flag; it excludes the receipt and repository transaction fields. `CompleteToolReceiptV2.receiptHash` is then computed over that complete receipt with only `receiptHash` omitted. `aliasRecordId` hashes request/call/argument/operation/replay IDs and the tool receipt hash, excluding its transaction field. The repository `append_tool_completion` command hash binds the action, unique tool operation ID, `replayRecordId`, `aliasRecordId` and tool `receiptHash`; the resulting repository receipt is then hashed, copied to both transaction fields, and replay + initial alias + tool receipt + repository receipt commit in one transaction. A dedupe-only `append_tool_alias` uses its own unique child tool operation ID and atomically stores the alias plus receipt.

For both append variants, repository `operationId` must equal `completeReceipt.operation.toolOperationId`; request ID, call ID, argument hash and operation hash must match the alias exactly. No agent-level operation ID may be reused as a tool child operation ID, and no child ID may appear in more than one alias/receipt transaction.

The initial replay requires `initialCallId == operation.callId` and an initial alias with the same request/call/argument/operation/replay IDs. Every alias points to one immutable replay in the same request. Alias records, not a mutable call-ID array on the replay, are the sole durable same-ID conflict index.

Worker restart creates a new instance/epoch, terminalizes every old-epoch operation as `worker_restarted`, clears in-memory secret handles and requires an explicit user retry; the coordinator never automatically replays a secret-bearing command. Every command names its exact target instance/epoch and every event names its producer instance/epoch; mismatch is obsolete and ignored. Ready handshake is mandatory before accepting work. Cancellation is event/message based at parse/hash chunk boundaries; the contract promises bounded cancellation checkpoints after each 1 MiB or 25 ms of cooperative work, not polling every 10 ms.

### CTR-011A - fail-closed connectors, sensitive URLs and vault states

```text
type SensitiveUrl = opaque vault-only URL handle
type SecretIngressBufferV2 = structured-clone-only transferable ArrayBuffer with byteLength 1..65_536
type SensitiveEndpointIngressBufferV2 = structured-clone-only transferable ArrayBuffer
  containing UTF-8 HTTPS URL bytes with byteLength 1..65_536
type Base64UrlTextV2 = non-empty unpadded RFC4648 base64url ASCII string
type AesGcmIvBase64UrlV2 = unpadded RFC4648 base64url ASCII string of exactly 16 characters
type AesGcmCiphertextBase64UrlV2 = unpadded RFC4648 base64url ASCII string
  with length 23..87_403 characters
enum AllowedNonSecretHeaderNameV2 { accept_language, openai_organization,
  openai_project, x_client_version }

union ConnectorEndpointIngressV2 =
  | { kind: public_endpoint, url: Url }
  | { kind: sensitive_endpoint, buffer: SensitiveEndpointIngressBufferV2 }
union ConnectorSecretIngressV2 =
  | { kind: none }
  | { kind: secret, buffer: SecretIngressBufferV2 }

union CredentialRecordV2 =
  | { mode: encrypted_persistent, credentialId: opaque string, connectorId: ConnectorId,
      secretMaterialKind: api_credential|sensitive_endpoint,
      algorithm: aes_256_gcm, ciphertextBase64Url: AesGcmCiphertextBase64UrlV2,
      ciphertextDecodedByteLength: UInt32 in 17..65_552,
      ivBase64Url: AesGcmIvBase64UrlV2, ivDecodedByteLength: exactly 12,
      aadHash: Sha256, keyHandle: CryptoKeyHandle,
      createdAt: Instant, lastUsedAt: Instant }
  | { mode: disclosed_browser_local, credentialId: opaque string, connectorId: ConnectorId,
      secretMaterialKind: api_credential|sensitive_endpoint,
      secretHandle: BrowserLocalSecretHandle, disclosureVersion: SemVer,
      acceptedAt: Instant, lastUsedAt: Instant }
  | { mode: session_memory, credentialId: opaque string, connectorId: ConnectorId,
      secretMaterialKind: api_credential|sensitive_endpoint,
      secretHandle: SessionSecretHandle, createdAt: Instant, lastUsedAt: Instant }

record ConnectorCapabilityStateV2 { state: supported|unsupported|not_applicable|not_tested,
  reasonIds: controlled token[] }

record ConnectorCapabilityMatrixV2 {
  connectorId: ConnectorId
  testedAt: Instant
  expiresAt: Instant // exactly testedAt + 24 hours
  testVersion: SemVer
  testedConfigurationHash: Sha256
  cors: ConnectorCapabilityStateV2
  authentication: ConnectorCapabilityStateV2
  selectedDialect: ConnectorCapabilityStateV2
  model: ConnectorCapabilityStateV2
  streaming: ConnectorCapabilityStateV2
  structuredOutput: ConnectorCapabilityStateV2
  functionTools: ConnectorCapabilityStateV2
  remoteMcp: ConnectorCapabilityStateV2
  matrixHash: Sha256
}

record ConnectorRequestPolicy {
  configuredOrigin: NormalizedOrigin
  declaredRoute: non-empty path template
  authorizationPlacement: header_authorization | header_x_api_key | body_declared_field |
    query_declared_secret_parameter
  redirect: error
  credentials: omit
  referrerPolicy: no-referrer
  cache: no-store
}

union CredentialClearReceipt =
  | { action: clear_secret, credentialId: opaque string, secretRemoved: true,
      configurationRetained: true, completedAt: Instant }
  | { action: remove_configuration, connectorId: ConnectorId, secretRemoved: true,
      configurationRemoved: true, completedAt: Instant }

union ConnectorVaultMutationReceiptV2 =
  | { action: draft_discarded, connectorId: ConnectorId, draftId: opaque string,
      stagedSecretDestroyed: Boolean, completedAt: Instant, receiptHash: Sha256 }
  | { action: configured_no_secret, connectorId: ConnectorId,
      persistenceMode: session_memory, secretPersisted: false,
      completedAt: Instant, receiptHash: Sha256 }
  | { action: configured|secret_replaced|persisted_after_success,
      connectorId: ConnectorId,
      credentialIds: non-empty opaque string[1..2], persistenceMode: encrypted_persistent|
        disclosed_browser_local|session_memory,
      secretPersisted: Boolean, completedAt: Instant, receiptHash: Sha256 }
  | { action: clear_secret|remove_configuration, connectorId: ConnectorId,
      secretRemoved: true, configurationRemoved: Boolean,
      completedAt: Instant, receiptHash: Sha256 }
  | { action: clear_all_secrets, connectorIds: ConnectorId[],
      secretRemovedCount: UInt16, completedAt: Instant, receiptHash: Sha256 }
```

Before every fetch the worker constructs the final URL, parses it once, and revalidates scheme `https`, exact origin, exact declared path, absence of userinfo/fragments and authorization placement. Fetch uses `redirect:"error"`, `credentials:"omit"`, `referrerPolicy:"no-referrer"`, and `cache:"no-store"` wherever Fetch supports them. Authorization bytes may appear only in the declared header/body/query location. Any response redirect is a hard failure; no credential crosses origins.

`SensitiveUrl`, secret ingress buffers and secret/key handles are structured-clone/vault-only values and are excluded from every JSON Schema root. The UI copies each secret into a dedicated mutable ingress buffer, transfers that buffer exactly once, and verifies that its sender-side view is detached. The connector worker immediately imports or stages the bytes, zero-fills its received buffer before releasing it, and destroys any staged material on discard or at the exact ten-minute expiry. AES-GCM uses a fresh 96-bit IV, 256-bit non-extractable key, connector-bound AAD and a 128-bit authentication tag included in the decoded ciphertext length. Public citation, configuration, error and diagnostic serializers reject URLs containing userinfo, fragments, known secret parameter names, any live secret value, or a connector endpoint URL proposed as a public citation. Endpoint errors expose only an endpoint label plus domain error code. Persistent vault failure or private-browsing/storage denial offers `session_memory`, or the explicitly disclosed `disclosed_browser_local` fallback only after separate consent; there is no silent plaintext fallback. Secret values are accessible solely through vault adapter methods and can never be listed/read back.

### CTR-002A/003A - resolvable assets, packs and map features

```text
enum AssetKind { release_manifest, pack_manifest, geography, map_features, evidence,
  evidence_snapshot, source_registry, policy, case_file, emi_aggregate, visual_data,
  translations, app_shell }

record AssetDescriptorV2 {
  assetId: AssetId
  packId?: PackId
  kind: AssetKind
  url: same-origin relative URL
  byteLength: UInt64 > 0
  sha256: Sha256
  mediaType: controlled token
  schemaId: non-empty controlled token
  schemaVersion: SemVer
}

record ReleaseManifestV2 {
  releaseId: opaque string
  generatedAt: Instant
  manifestAssetId: AssetId // stable boot ID for these manifest bytes; not a key in assets
  assets: non-empty map<AssetId, AssetDescriptorV2> // all referenced assets except this manifest
  packAssets: non-empty map<PackId, { manifestAssetId: AssetId,
    manifestHash: Sha256, dataAssetIds: non-empty AssetId[] }>
  corePackIds: non-empty PackId[]
  dependencyHashes: non-empty Sha256[]
  manifestHash: Sha256
}

union BoundedGeometry =
  | { kind: point, coordinates: [Decimal[-180,180], Decimal[-90,90]] }
  | { kind: line_string, coordinates: [Decimal,Decimal][], pointCount: 2..10_000,
      bbox: [Decimal,Decimal,Decimal,Decimal] }
  | { kind: polygon, rings: non-empty [Decimal,Decimal][][], pointCount: 4..20_000,
      bbox: [Decimal,Decimal,Decimal,Decimal] }
  | { kind: line_geometry_reference, geometryAssetId: AssetId, featureOffset: UInt32,
      bbox: [Decimal,Decimal,Decimal,Decimal] }
  | { kind: polygon_geometry_reference, geometryAssetId: AssetId, featureOffset: UInt32,
      bbox: [Decimal,Decimal,Decimal,Decimal] }

union MapFeature =
  | { featureKind: point, featureId: AssetId, layerId: LayerId, geometry: BoundedGeometry(point),
      geographyScope: GeographyScope, evidenceIds: non-empty EvidenceId[], sourceIds: non-empty SourceId[],
      licenceIds: non-empty controlled token[], observation?: ObservationWindow,
      coverage: Confidence, confidence: Confidence, qualification: exact|approximate|context_only }
  | { featureKind: line, featureId: AssetId, layerId: LayerId,
      geometry: BoundedGeometry(line_string|line_geometry_reference),
      geographyScope: GeographyScope, evidenceIds: non-empty EvidenceId[], sourceIds: non-empty SourceId[],
      licenceIds: non-empty controlled token[], observation?: ObservationWindow,
      coverage: Confidence, confidence: Confidence, qualification: exact|approximate|context_only }
  | { featureKind: area, featureId: AssetId, layerId: LayerId,
      geometry: BoundedGeometry(polygon|polygon_geometry_reference),
      geographyScope: GeographyScope, evidenceIds: non-empty EvidenceId[], sourceIds: non-empty SourceId[],
      licenceIds: non-empty controlled token[], observation?: ObservationWindow,
      coverage: Confidence, confidence: Confidence, qualification: exact|approximate|context_only }
```

`manifestHash` is the SHA-256 of the canonical manifest with only the `manifestHash` field omitted; `manifestAssetId` is included in that hashed payload and must not appear in `assets`, avoiding a self-hash cycle. Every `packAssets` entry resolves one strict `DataPackManifestV2`; its key must equal `packId`, its declared manifest hash must recompute from the manifest with only `manifestHash` omitted, and its exact data-asset IDs/hashes, dependency IDs, source/licence bindings and coverage must validate before activation. The release manifest is fetched from the fixed same-origin boot route and verified by recomputing its hash. At runtime all referenced asset bytes are hashed with WebCrypto before parsing or activation. The parsed object carries `{assetId, packId, assetHash, packManifestHash, releaseManifestHash}` and consumers reject a mismatch. `packAssets` is the only PackId-to-byte resolution path. `ReproducibilityManifestV2` includes every release, asset, pack, feature/layer, evidence record/fact, trusted statement, question, missing voice, company/claim role, read-only tool registry, policy and geometry-engine hash actually consumed; unused loaded data is excluded.

`DataPackManifestV2.assetIds/assetHashes` contain exactly the pack's data assets and never its own manifest asset; the owning `ReleaseManifestV2.packAssets` entry supplies that manifest asset ID/hash. This keeps pack hashing acyclic.

### CTR-015A - typed persistence, idempotency, retention and clear plans

```text
enum StorageStoreV2 { scenarios, results, comparisons, cases, briefs, site_profiles,
  agent_receipts, research, prompt_history, tool_replay, tool_aliases, tool_receipts,
  connector_config, migrations, operation_receipts, quarantines }
enum GenericClearableStoreV2 { scenarios, results, comparisons, cases, briefs, site_profiles,
  agent_receipts, research, prompt_history, tool_replay, tool_aliases, tool_receipts,
  migrations, operation_receipts, quarantines }

record ScenarioStorePayloadV2 { draft: ScenarioDraftV2,
  immutableRefs: { resultSnapshotIds: Sha256[], evidenceSnapshotIds: Sha256[],
    briefSnapshotIds: Sha256[] } }
record PromptHistoryRecordV2 { promptId: opaque string,
  sanitizedPrompt: BoundedText <= 65_536 bytes,
  contextCategoryIds: controlled token[], createdAt: Instant, expiresAt: Instant }

enum ResearchFreshnessV2 { current, stale, unknown, future_invalid,
  forecast_valid, forecast_expired }

record ResearchCacheRecordV2 {
  researchRecordId: opaque string
  sanitizedQuery: BoundedText <= 65_536 bytes
  normalizedQueryHash: Sha256
  connectorId: ConnectorId
  destinationDisclosureAcceptanceHash: Sha256
  resultIds: opaque string[]
  resultEvidenceIds: EvidenceId[]
  resultFactIds: FactId[]
  candidateEvidenceRecords: EvidenceRecordV2[]
  candidateFacts: EvidenceFact[]
  sourceUrls: Url[]
  initialRetrievedAt: Instant
  retrievedAt: Instant
  lastRefreshedAt?: Instant
  refreshOfRecordId?: opaque string
  freshness: ResearchFreshnessV2
  querySchemaVersion: SemVer
  connectorSchemaVersion: SemVer
  resultSchemaVersion: SemVer
  schemaVersion: SemVer
  expiresAt: Instant
  recordHash: Sha256
}

union StoreRecordV2 =
  | { store: scenarios, payload: ScenarioStorePayloadV2 }
  | { store: results, payload: ResultSnapshotV2 }
  | { store: comparisons, payload: ComparisonSnapshotV2 }
  | { store: cases, payload: ProjectCaseV2 }
  | { store: briefs, payload: ImpactBriefV2 }
  | { store: site_profiles, payload: ConfirmedSiteProfile }
  | { store: agent_receipts, payload: AgentExecutionReceipt }
  | { store: research, payload: ResearchCacheRecordV2 }
  | { store: prompt_history, payload: PromptHistoryRecordV2 }
  | { store: tool_replay, payload: ToolReplayRecord }
  | { store: tool_aliases, payload: ToolCallAliasRecordV2 }
  | { store: tool_receipts, payload: CompleteToolReceiptV2 }
  | { store: connector_config, payload: SanitizedConnectorConfiguration }
  | { store: migrations, payload: MigrationReceipt }
  | { store: operation_receipts, payload: StorageReceipt }
  | { store: quarantines, payload: QuarantineRecord }

union RepositoryPutRecordV2 =
  | { store: results, payload: ResultSnapshotV2 }
  | { store: comparisons, payload: ComparisonSnapshotV2 }
  | { store: cases, payload: ProjectCaseV2 }
  | { store: briefs, payload: ImpactBriefV2 }
  | { store: site_profiles, payload: ConfirmedSiteProfile }
  | { store: agent_receipts, payload: AgentExecutionReceipt }
  | { store: research, payload: ResearchCacheRecordV2 }
  | { store: connector_config, payload: SanitizedConnectorConfiguration }

union StorageCommandV2 =
  | { action: create_scenario, operationId: OperationId, recordId: opaque string,
      expectedRevision: 0, payload: ScenarioStorePayloadV2 }
  | { action: update_scenario, operationId: OperationId, recordId: opaque string,
      expectedRevision: UInt64 > 0, payload: ScenarioStorePayloadV2 }
  | { action: create_prompt_history, operationId: OperationId, recordId: opaque string,
      expectedRevision: 0, payload: PromptHistoryRecordV2 }
  | { action: delete_user_record, operationId: OperationId,
      store: scenarios|results|comparisons|cases|briefs|site_profiles|research|prompt_history,
      recordId: opaque string, expectedRevision: UInt64 > 0 }
  | { action: request_clear_plan, operationId: OperationId, plan: ClearPlan }

union RepositoryMutationV2 =
  | { action: put_internal, operationId: OperationId, recordId: opaque string,
      expectedRevision: UInt64, record: RepositoryPutRecordV2 }
  | { action: tombstone_internal, operationId: OperationId, store: StorageStoreV2,
      recordId: opaque string, expectedRevision: UInt64 > 0 }
  | { action: append_tool_completion, operationId: OperationId,
      replay: ToolReplayRecord, alias: ToolCallAliasRecordV2,
      receipt: CompleteToolReceiptV2 }
  | { action: append_tool_alias, operationId: OperationId,
      alias: ToolCallAliasRecordV2, receipt: CompleteToolReceiptV2 }
  | { action: append_quarantine, operationId: OperationId, record: QuarantineRecord }
  | { action: append_migration_receipt, operationId: OperationId,
      record: MigrationReceipt }

union StoredEnvelopeV2 =
  | { state: live, recordId: opaque string, revision: UInt64,
      schemaVersion: SemVer, createdAt: Instant, updatedAt: Instant,
      payloadHash: Sha256, record: StoreRecordV2 }
  | { state: tombstone, store: StorageStoreV2, recordId: opaque string,
      revision: UInt64, schemaVersion: SemVer, createdAt: Instant,
      deletedAt: Instant, priorPayloadHash: Sha256 }

record StorageReceipt {
  operationId: OperationId
  commandHash: CommandHash
  store: StorageStoreV2
  recordId?: opaque string
  action: create|update|delete|append
  resultingRevision?: UInt64
  outcome: applied|revision_conflict|quota_rejected|blocked|failed|operation_id_conflict
  sanitizedError?: DomainError
  completedAt: Instant
  receiptHash: Sha256
}

union StorageCommandOutcomeV2 = StorageReceipt | ClearReceipt

record QuarantineRecord {
  quarantineId: opaque string
  originalStore: StorageStoreV2
  originalRecordId: opaque string
  originalSchemaVersion?: string
  rawHash: Sha256
  rawByteLength: UInt32
  reason: invalid_schema|unsupported_version|hash_mismatch|origin_proof_present|migration_failed
  quarantinedAt: Instant
  sanitizedPreview?: BoundedText <= 1024 bytes
}

record ConnectorVaultClearTargetV2 {
  connectorId: ConnectorId
  expectedConfigurationHash: Sha256
  credentialRecordCount: UInt8 in 0..2
  sensitiveRoutePolicyCount: UInt8 in 0..1
  targetHash: Sha256
}
record ConnectorRemovalJournalV2 {
  journalId: opaque string
  operationId: OperationId
  target: ConnectorVaultClearTargetV2
  phase: pending_vault|vault_cleared|configuration_removed|complete
  completedCredentialRecordCount: UInt8 in 0..2
  completedSensitiveRoutePolicyCount: UInt8 in 0..1
  journalHash: Sha256
}
union ClearPlan =
  | { scope: selected_application_data, clearPlanId: opaque string,
      stores: non-empty GenericClearableStoreV2[], includeVault: exactly false,
      requestedAt: Instant, confirmationHash: Sha256, commandHash: Sha256 }
  | { scope: all_application_and_connectors, clearPlanId: opaque string,
      stores: exactly [scenarios,results,comparisons,cases,briefs,site_profiles,
        agent_receipts,research,prompt_history,tool_replay,tool_aliases,tool_receipts,
        connector_config,migrations,operation_receipts,quarantines],
      includeVault: exactly true,
      connectorTargets: ConnectorVaultClearTargetV2[],
      requestedAt: Instant, confirmationHash: Sha256, commandHash: Sha256 }

record ClearReceipt {
  clearPlanId: opaque string
  completedStores: StorageStoreV2[]
  pendingStores: StorageStoreV2[]
  completedConnectorTargets: ConnectorId[]
  pendingConnectorTargets: ConnectorId[]
  vaultState: not_requested|pending|cleared
  resumable: Boolean
  completedAt?: Instant
}

record PromptHistoryPolicy {
  enabled: Boolean // default false
  maximumRecords: exactly 100
  maximumAgeDays: exactly 30
  clearControlId: clear_prompt_history
}

record ControlDatabaseRecord {
  database: gridlens_control
  record: ClearPlan | ClearReceipt | ConnectorRemovalJournalV2
  recordHash: Sha256
  retainedAfterClear: true
}
```

`sanitizedQuery` is the normalized inspectable user research query, not a prompt-history lookup. Before persistence it is checked against active secret equality and credential/key/authorization patterns; a match rejects the research/cache operation rather than storing a redacted query that could later change refresh meaning. Refresh creates a new revision, preserves `initialRetrievedAt`, and never mutates or relabels the expired prior revision.

For every research record, `resultEvidenceIds` equals exactly the IDs of `candidateEvidenceRecords`, `resultFactIds` equals exactly the IDs of `candidateFacts`, and every candidate fact resolves to an embedded candidate evidence record. Connector output cannot populate any of these fields. `recordHash` covers the canonical record with only `recordHash` omitted; the single research-store envelope plus repository receipt commits atomically.

The canonical public domain-command hash covers exact action, store, record, revision, payload hash and, for a clear, the complete canonical `ClearPlan` including scope, stores, connector targets, counts, confirmation and plan command hash. The repository-only `append_tool_completion` hash uses the acyclic construction defined above and therefore never hashes its own transaction receipt. Same operation ID/same command hash returns the byte-identical immutable original receipt with its original outcome (normally `applied`); it never synthesizes `already_applied`. Same ID/different hash returns a new non-persisted `operation_id_conflict` response and leaves the original receipt unchanged. Scenario saves persist the raw draft plus immutable snapshot references only. On every restore the analysis worker renormalizes draft values, unit conversions and origins under the current contract; stored `originProofs` are forbidden and quarantined.

A live brief is a dependent of every referenced result and case. Deleting a result/case with a live dependent brief is `blocked` and returns only sanitized dependent counts; a displayed clear plan that includes such a source must include all dependent briefs and delete briefs first. Deleting a brief never deletes its source snapshots. This dependency rule is recomputed from strict brief records on restore, so a crash or stale tab cannot create an orphan.

Hard v1 limits are: scenario 256 KiB/record and 200 live; result 2 MiB/record and 100; comparison 1 MiB/record and 50; case 4 MiB/record and 20; impact brief 2 MiB/record and 50; site profile 512 KiB/record and 50; agent receipt 256 KiB/record and 500; research 2 MiB/record, 50 records, 30-day expiry; prompt history 64 KiB/record, 100 records, 30-day expiry and disabled by default; tool replay 2 MiB/record, 100 records/request, 500 total and 30-day expiry; tool alias 64 KiB/record, 100 records/request, 2,000 total and 30-day expiry; tool receipt 64 KiB/record with exactly one per completed call alias and the same retention; connector configuration 64 KiB/record and 20; migration receipt 128 KiB/record and 200; operation receipt 64 KiB/record and 5,000; quarantine 64 KiB metadata/record and 200; and exactly 5,000 tombstones across all stores. Total application IndexedDB hard cap is 200 MiB with a visible prompt at 160 MiB. V1 never automatically compacts tombstones or operation receipts: when their cap is reached, mutation fails visibly with export/clear guidance. Quota estimates are advisory; an actual quota error is surfaced and never triggers silent deletion. Expired research, prompt history, tool replay and matching aliases/receipts can be deleted only through a displayed retention plan and resumable receipt.

Every clear plan/receipt is durably stored first in the separate `gridlens_control` IndexedDB database, which contains no user payload and is never among the stores being cleared. A `selected_application_data` plan cannot name `connector_config` or any vault target; one connector is removed only by the connector worker's `remove_connector_configuration` lifecycle command. An `all_application_and_connectors` plan displays the exact connector/configuration hashes plus credential and sensitive-route counts, freezes that complete target set in its confirmation hash, and can name no subset of stores. It destroys each target's vault records first and records that step before removing its connector configuration; failure before vault completion leaves configuration intact, while a crash after vault completion resumes by removing the now-disabled configuration. Other requested stores clear next, `operation_receipts` last, and only then is the control receipt complete. No per-connector action broadens to unrelated credentials. An interrupted clear resumes from the control receipt. The completed sanitized control receipt remains as proof of what was removed; only the browser's site-data action removes it.

`ConnectorVaultClearTargetV2.targetHash` omits only itself. `ClearPlan.commandHash` omits only
itself and covers the complete variant; `confirmationHash` covers the same displayed plan plus
the explicit user-confirm action. Duplicate connector IDs, mismatched counts/configuration hashes,
target drift or a changed plan hash reject before the control journal changes.
`ConnectorRemovalJournalV2.journalHash` omits only itself; count progress may advance only in
the declared phase order and never contains credential/route IDs or bytes.

### CTR-016A - conservative multi-client service-worker generations

```text
union UpdateGenerationState =
  | { state: discovered, generationId: Sha256, manifestHash: Sha256 }
  | { state: downloading, generationId: Sha256, completedAssetIds: AssetId[] }
  | { state: verified_waiting, generationId: Sha256, manifestHash: Sha256,
      previousGenerationId: Sha256, clientAcknowledgements: map<ClientId, ready|busy|unknown> }
  | { state: activating, generationId: Sha256, previousGenerationId: Sha256 }
  | { state: active, generationId: Sha256, activatedAt: Instant }
  | { state: failed, generationId: Sha256, priorActiveGenerationId: Sha256,
      error: DomainError }

record UpdateNotice { generationId: Sha256, kind: update_ready,
  userAction: reload_when_ready, activeOperationCount: UInt16 }
```

The service worker never calls `skipWaiting`. Only one candidate generation may download/verify at a time; a newer discovery is queued and rechecked after the current candidate terminalizes. Every controlled client receives `update_ready`. Activation occurs only after every old-generation client closes, navigates or explicitly reloads, so active operations are never forcibly terminated. A newly opened boot revalidates the release manifest before using a candidate. Candidate fetch, hash, schema, cache-quota or storage-pressure failure deletes only candidate-generation cache entries and preserves the prior active generation. Optional/on-demand caches include the generation ID in every cache key. Rollback means continue serving the last verified active generation; an activated corrupt generation is impossible because activation follows complete WebCrypto verification.

If BroadcastChannel is unavailable, service-worker `clients.matchAll()` plus `postMessage` is mandatory. If an operation is active, the UI disables immediate reload and offers reload after completion/cancel. Simultaneous tabs therefore converge by closure/reload, never by a lease timeout.

### CTR-018A - exact EMI staging and aggregation

```text
record EmiSourceSchemaV1 {
  schemaId: emi_dispatch_nodal_prices_and_volumes_csv
  version: 1
  businessPartitionFields: [TradingDate, IntervalDateTime, CaseTypeCode,
    PointOfConnectionCode, UnitCode]
  runPrecedenceFields: [RunDateTime descending, CaseID descending_lexicographic]
  exactSourceRowIdentityFields: [TradingDate, IntervalDateTime, CaseTypeCode,
    PointOfConnectionCode, UnitCode, RunDateTime, CaseID]
  acceptedCaseType: RTD
  runPrecedence: greatest RunDateTime, then greatest CaseID lexicographically
  inputTimezone: offset_required
  powerUnit: MW
  priceUnit: NZD_per_MWh
}

record NspEffectiveRowV1 {
  nspCompositeId: non-empty string // NSP column
  pocCode: non-empty string
  networkParticipant: non-empty string
  reconciliationType: GN|EN|other controlled token
  currentFlag: Boolean
  effectiveFrom: { date: LocalDate, tradingPeriod: UInt8 in 1..50 }
  effectiveUntil?: { date: LocalDate, tradingPeriod: UInt8 in 1..50 }
  nztmEasting?: RationalDecimal
  nztmNorthing?: RationalDecimal
  networkReportingRegionId?: non-empty string
  zone?: non-empty string
  island: NI|SI
  rowHash: Sha256
}

record EmiIntervalAggregateV1 {
  intervalUtc: Instant
  intervalNzLocal: ZonedDateTime
  utcOffsetMinutes: Int16
  dstFold: first|second|not_ambiguous
  statsGeographyId: GeographyId
  networkReportingRegionIds: string[] // separate electricity-network dimension; empty if source mapping omits it
  loadMw: RationalDecimal
  generationMw: RationalDecimal
  loadWeightedPriceNzdPerMwh?: RationalDecimal
  positiveLoadPriceDenominatorMw: RationalDecimal
  uniquePocCount: UInt32
  uniqueGenerationUnitCount: UInt32
  sourceTimePresent: Boolean
  capacityInferenceAllowed: false
}

record EmiCoverageV1 {
  expectedSourceInstants: UInt64
  observedSourceInstants: UInt64
  sourceTimeCompleteness: Confidence
  eligiblePocIntervalsNational: UInt64
  observedPocIntervalsNational: UInt64
  nationalPocIntervalCoverage: Confidence
  statsGeographyCoverage: map<GeographyId,{ eligiblePocIntervals: UInt64,
    observedPocIntervals: UInt64, coverage: Confidence }>
  excludedRows: map<controlled token,UInt64>
  excludedPocs: { pocCode: string, reason: no_effective_nsp|coordinate_conflict|
    stats_boundary_unmatched|invalid_coordinate|schema_failure }[]
}

record EmiQualityPolicyV1 {
  policyVersion: 1.0.0
  completeMinimumSourceTime: exactly 0.90
  completeMinimumNationalPocInterval: exactly 0.85
  completeMinimumPerPublishedGeography: exactly 0.70
  partialMinimumSourceTime: exactly 0.75
  partialMinimumNationalPocInterval: exactly 0.65
  partialMinimumPerPublishedGeography: exactly 0.50
  maximumBackwardSearchDays: exactly 45
  unconditionalFailures: [missing_or_unknown_required_schema, missing_or_unknown_unit,
    invalid_timestamp_or_offset_cadence, conflicting_canonical_row_values,
    source_checksum_mismatch, mapping_or_transform_version_mismatch,
    aggregate_conservation_or_recomputation_failure]
}

union EmiPublishOutcome =
  | { status: complete, aggregates: EmiIntervalAggregateV1[], coverage: EmiCoverageV1,
      selectedWindow: ObservationWindow, policyVersion: SemVer }
  | { status: partial, aggregates: EmiIntervalAggregateV1[], coverage: EmiCoverageV1,
      suppressedGeographyIds: GeographyId[], qualificationTextId: controlled token,
      selectedWindow: ObservationWindow, policyVersion: SemVer }
  | { status: not_published, reason: below_partial_threshold|unconditional_failure|
      no_window_within_search_horizon, coverage?: EmiCoverageV1, error?: DomainError }
```

For an interval, group accepted RTD rows by `businessPartitionFields`, then select greatest `RunDateTime` and greatest lexicographic `CaseID`. `exactSourceRowIdentityFields` is used only for exact duplicate/conflict detection after partitioning; byte-identical duplicates are counted/deduplicated, while the same exact identity with different business values is an unconditional failure. Load and price use one selected `UnitCode=N/A` POC row. Generation sums selected non-`N/A` unique `(POC,UnitCode)` rows. Then Stats-region load is the sum of unique POC loads; generation is the sum of unique units; price is the load-weighted mean over unique POCs with positive load and a present price, and is null when the denominator is zero. Load/generation never sum across time.

For every source interval, select NSP rows whose effective interval contains that NZ trading instant and whose current/effective flags are internally consistent. A coordinate is accepted only when an exact versioned authority rule names that row or all selected effective rows for the POC agree after exact NZTM parsing; otherwise the POC is excluded with a conflict. Transform accepted NZTM coordinates from EPSG:2193 to WGS84 using the pinned transform version, then assign `statsGeographyId` using the same inclusive Stats NZ polygon engine as `LOG-GEO-001`: no match is excluded, and a shared-boundary tie chooses lexicographically smallest GeographyId while recording `boundary_tie`. `networkReportingRegionId` from NSP is retained independently and never used as the Stats geography. Eligible POCs for national coverage are observed POCs with an effective non-conflicting NSP row; Stats-geography denominators include only POCs with a valid transformed coordinate and polygon assignment. Expected instants are derived in UTC from every NZ local trading day, preserving 23/25-hour DST days, offset, fold, raw units and no-capacity flag.

Bounded dry-run evidence captured 2026-08-06 from official public files for 2026-08-01 through 2026-08-05: daily source-time completeness `92.7083%, 88.1944%, 95.8333%, 96.5278%, 97.2222%`; daily national observed-POC interval coverage `89.3358%, 86.2301%, 92.6857%, 92.8230%, 93.6003%`; minimum mapped-region daily coverage `79.8611%, 76.7361%, 82.0312%, 81.6551%, 73.6111%`; no duplicate canonical keys or dead/disconnected rows in the sample. This is a bounded threshold calibration sample, not a 12-month completeness claim. The approved Balanced policy is recorded in ADR-010 and the test strategy.

### CTR-008A - prepared statements, locators, fixed sections and source counts

```text
union PageLocatorV2 =
  | { kind: page, pageNumber: UInt32 > 0, boundingBox?: [Decimal,Decimal,Decimal,Decimal] }
  | { kind: section, headingPath: non-empty BoundedText[] }
  | { kind: paragraph, paragraphIndex: UInt32, stableTextHash: Sha256 }
  | { kind: fallback, exactQuoteHash: Sha256, precedingTextHash?: Sha256,
      followingTextHash?: Sha256, reason: pagination_unavailable|structure_unavailable }

enum CaseSection { overview, timeline, people, planet, consent_regulation,
  community, company, comparables, alternatives, evidence }

union ExtractedStatement =
  | { status: candidate, statementId: StatementId, documentId: DocumentId,
      documentContentHash: Sha256, locator: PageLocatorV2, statementHash: Sha256,
      extractionMethod: deterministic_text|ocr|llm_candidate,
      extractionVersion: SemVer, proposedEvidenceType: SourceType,
      resultingEvidenceIds: [], resultingEdgeIds: [] }
  | { status: curator_verified, statementId: StatementId, documentId: DocumentId,
      documentContentHash: Sha256, locator: PageLocatorV2, statementHash: Sha256,
      extractionMethod: deterministic_text|ocr|llm_candidate,
      extractionVersion: SemVer, evidenceType: SourceType,
      verificationReceipt: { verifierRole: curator, action: accept|accept_with_correction,
        verifiedAt: Instant, inputHash: Sha256, outputHash: Sha256 },
      resultingEvidenceIds: non-empty EvidenceId[], resultingEdgeIds: EdgeId[] }
  | { status: rejected, statementId: StatementId, documentId: DocumentId,
      documentContentHash: Sha256, locator: PageLocatorV2, statementHash: Sha256,
      extractionMethod: deterministic_text|ocr|llm_candidate,
      extractionVersion: SemVer,
      verificationReceipt: { verifierRole: curator, action: reject,
        verifiedAt: Instant, inputHash: Sha256, reason: non_fact|incorrect|unsupported|duplicate },
      resultingEvidenceIds: [], resultingEdgeIds: [] }

union ProjectEventDateV2 =
  | { kind: exact, date: LocalDate, dateFactIds: non-empty FactId[] }
  | { kind: range, earliest: LocalDate, latestInclusive: LocalDate,
      qualification: approximate, dateFactIds: non-empty FactId[] }
  | { kind: disputed, candidateDates: non-empty (LocalDate|{earliest:LocalDate,latestInclusive:LocalDate})[],
      dateFactIds: non-empty FactId[], conflictIds: non-empty ConflictId[] }
  | { kind: undated, missing: non-empty MissingRecord[] }

record ProjectEventV2 {
  eventId: opaque string
  title: non-empty BoundedText
  date: ProjectEventDateV2
  eventType: controlled token
  evidenceIds: non-empty EvidenceId[]
}

record CaseSourceCounts {
  aiCandidate: UInt32
  developerClaim: UInt32
  staleOther: UInt32
  unknownOther: UInt32
  futureInvalidOther: UInt32
  forecastExpiredOther: UInt32
  nonqualifyingOther: UInt32
  currentOther: UInt32
  missing: UInt32
  conflicting: UInt32
  totalEvidenceRecords: UInt32
}

record ProjectCaseV2 {
  caseSnapshotId: Sha256
  projectId: ProjectId
  catalogRecord: ProjectCatalogRecordV2
  evidenceSnapshotId: Sha256
  evidenceGraph: EvidenceGraphSnapshotV2
  sectionStates: map<CaseSection, complete|partial|missing>
  events: ProjectEventV2[]
  extractedStatements: ExtractedStatement[]
  sourceCounts: CaseSourceCounts
  trustedStatements: TrustedStatementV2[]
  unresolvedQuestions: UnresolvedQuestionV2[]
  communityRecords: CommunityRecordV2[]
  manaWhenuaCommunityRecordIds: opaque string[]
  missingVoiceRecords: MissingVoiceRecordV2[]
  companyRecords: CompanyIdentityRecordV2[]
  companyClaimRecords: CompanyClaimRecordV2[]
  releaseId: opaque string
}
```

For prepared events, exact dates win only when all current qualifying date facts agree. A bounded date range is used when current qualifying facts overlap but do not identify one date. Disjoint current qualifying dates create a conflict and the timeline shows `date disputed`; stale/candidate facts never break a current tie. `CaseSection` has exactly the ten values above.

Source-count buckets over one immutable evidence snapshot are mutually exclusive in this order: AI candidate first; else developer claim; else temporal state and qualification. Only `current` and `forecast_valid` qualifying records enter `currentOther`; non-qualifying records in those two temporal states enter `nonqualifyingOther`; `stale`, `unknown`, `future_invalid`, and `forecast_expired` each enter their named non-current bucket. `totalEvidenceRecords` is the exact sum of all eight source/temporal buckets. `missing` counts required evidence slots without a record and `conflicting` counts conflict records; neither is included in total evidence records and both display separately. The embedded catalog record, graph, community records, events and statements must resolve wholly inside the named evidence snapshot/release and their hashes must recompute. `manaWhenuaCommunityRecordIds` equals exactly the embedded records whose stakeholder type is `mana_whenua`; each has `manaWhenuaDistinct=true`, while every other record has it false. `representative` quality requires a qualifying `RepresentativeMethodology`; `web_discourse` can never be representative. Mana whenua and missing-voice records stay distinct from general community aggregates.

### CTR-013A - cited visual annotations and complete execution provenance

```text
union VisualAnnotation =
  | { kind: trusted_data_point, text: BoundedText, dataPointId: opaque string,
      scalar: TypedScalar, lineage: non-empty LineageRef[] }
  | { kind: source_statement, text: BoundedText, citationIds: non-empty CitationId[],
      evidenceIds: non-empty EvidenceId[], lineage: non-empty LineageRef[] }
  | { kind: model_inference, text: BoundedText, label: model_inference,
      uncertainty: low|medium|high|unknown, basisDataIds: non-empty AssetId[],
      citationIds: CitationId[], lineage: non-empty LineageRef[] }
  | { kind: uncertainty, text: BoundedText, label: uncertainty,
      affectedSeriesIds: non-empty opaque string[], lineage: non-empty LineageRef[] }

record LineageRef { kind: asset|feature|evidence|fact|snapshot,
  id: opaque string, contentHash: Sha256 }

union VisualAnnotationSpecV2 =
  | { kind: trusted_data_point, text: BoundedText, dataPointId: opaque string }
  | { kind: source_statement, text: BoundedText, citationIds: non-empty CitationId[],
      evidenceIds: non-empty EvidenceId[] }
  | { kind: model_inference, text: BoundedText, label: model_inference,
      uncertainty: low|medium|high|unknown, basisDataIds: non-empty AssetId[],
      citationIds: CitationId[] }
  | { kind: uncertainty, text: BoundedText, label: uncertainty,
      affectedSeriesIds: non-empty opaque string[] }

enum VisualPrimitiveV2 { metric_grid, bar, line, stacked_area, scatter,
  map_points, map_choropleth, comparison_table, narrative_panel }

union NumericFilterScalarV2 = DecimalTypedScalarV2|IntegerTypedScalarV2
union EqualityFilterScalarV2 = DecimalTypedScalarV2|IntegerTypedScalarV2|
  BooleanTypedScalarV2|EnumTypedScalarV2|TextTypedScalarV2|LocalDateTypedScalarV2

union VisualFilterPredicateV2 =
  | { kind: equals, field: FieldPath, fieldSchemaHash: Sha256,
      value: EqualityFilterScalarV2 }
  | { kind: not_equals, field: FieldPath, fieldSchemaHash: Sha256,
      value: EqualityFilterScalarV2 }
  | { kind: numeric_compare, field: FieldPath, fieldSchemaHash: Sha256,
      operator: less_than|less_than_or_equal|greater_than|greater_than_or_equal,
      value: NumericFilterScalarV2 }
  | { kind: local_date_compare, field: FieldPath, fieldSchemaHash: Sha256,
      operator: before|on_or_before|after|on_or_after,
      value: LocalDateTypedScalarV2 }
  | { kind: enum_one_of, field: FieldPath, fieldSchemaHash: Sha256,
      values: non-empty EnumTypedScalarV2[1..100] }
  | { kind: numeric_range_lower, field: FieldPath, fieldSchemaHash: Sha256,
      minimum: NumericFilterScalarV2, minimumInclusive: Boolean }
  | { kind: numeric_range_upper, field: FieldPath, fieldSchemaHash: Sha256,
      maximum: NumericFilterScalarV2, maximumInclusive: Boolean }
  | { kind: numeric_range_both, field: FieldPath, fieldSchemaHash: Sha256,
      minimum: NumericFilterScalarV2, maximum: NumericFilterScalarV2,
      minimumInclusive: Boolean, maximumInclusive: Boolean }
  | { kind: local_date_range_lower, field: FieldPath, fieldSchemaHash: Sha256,
      minimum: LocalDateTypedScalarV2, minimumInclusive: Boolean }
  | { kind: local_date_range_upper, field: FieldPath, fieldSchemaHash: Sha256,
      maximum: LocalDateTypedScalarV2, maximumInclusive: Boolean }
  | { kind: local_date_range_both, field: FieldPath, fieldSchemaHash: Sha256,
      minimum: LocalDateTypedScalarV2, maximum: LocalDateTypedScalarV2,
      minimumInclusive: Boolean, maximumInclusive: Boolean }

record VisualFilterV2 {
  combine: all|any
  predicates: non-empty VisualFilterPredicateV2[1..20]
  depth: exactly 1
  nodeCount: UInt8 in 1..20 // exactly predicates.length
}

record VisualBindingV2 {
  seriesId: opaque string
  dataAssetId: AssetId
  xField: FieldPath
  yField: FieldPath
  unit: Unit
  filter?: VisualFilterV2
}

record NarrativeCitationBlockSpecV2 {
  blockId: opaque string
  text: non-empty BoundedText
  citationIds: non-empty CitationId[]
  evidenceIds: non-empty EvidenceId[]
}

union VisualSpecV2 =
  | { schemaVersion: 2, visualKind: data_visual, requestId: RequestId,
      title: non-empty BoundedText,
      primitive: metric_grid|bar|line|stacked_area|scatter|map_points|
        map_choropleth|comparison_table,
      bindings: non-empty VisualBindingV2[], annotations: VisualAnnotationSpecV2[],
      sourceIds: SourceId[], accessibleSummaryIntent: non-empty BoundedText }
  | { schemaVersion: 2, visualKind: narrative_panel, requestId: RequestId,
      title: non-empty BoundedText, primitive: narrative_panel,
      blocks: non-empty NarrativeCitationBlockSpecV2[],
      sourceIds: non-empty SourceId[], accessibleSummaryIntent: non-empty BoundedText }

record ResolvedNarrativeBlockV2 { blockId: opaque string, text: non-empty BoundedText,
  citations: non-empty CitationV2[], evidenceIds: non-empty EvidenceId[],
  lineage: non-empty LineageRef[] }

union ResolvedVisualModelV2 =
  | { visualKind: data_visual, specHash: Sha256,
      rendererKind: metric_grid|bar|line|stacked_area|scatter|map_points|
        map_choropleth|comparison_table,
      series: non-empty { seriesId: opaque string, unit: Unit,
        points: non-empty TypedScalar[][], lineage: non-empty LineageRef[] }[],
      annotations: VisualAnnotation[], accessibleEquivalent: AccessibleVisualEquivalent,
      modelHash: Sha256 }
  | { visualKind: narrative_panel, specHash: Sha256, rendererKind: narrative_panel,
      blocks: non-empty ResolvedNarrativeBlockV2[],
      accessibleEquivalent: AccessibleVisualEquivalent, modelHash: Sha256 }

record VisualExecutionReceipt {
  receiptId: Sha256
  requestId: RequestId
  operationId: OperationId
  generation: UInt64
  modelLabel: non-empty sanitized string
  endpointLabel: non-empty sanitized string
  visualSpecHash: Sha256
  contextProjectionHash: Sha256
  resultSnapshotIds: Sha256[]
  evidenceSnapshotId: Sha256
  releaseManifestHash: Sha256
  dataAssetIds: AssetId[] // empty only for a narrative_panel resolved solely from cited evidence
  sourceIds: SourceId[]
  startedAt: Instant
  finishedAt: Instant
  regenerationDisclaimerId: non-empty controlled token
}

record AccessibleVisualEquivalent {
  title: non-empty BoundedText
  modelAndSourceLabel: non-empty BoundedText
  summary: non-empty BoundedText
  table: { columns: non-empty BoundedText[], rows: non-empty TypedScalar[][] }
  sourceIds: SourceId[]
  disclaimerId: non-empty controlled token
  semanticHash: Sha256
}

union VisualOutcomeV2 =
  | { status: complete, model: ResolvedVisualModelV2,
      receipt: VisualExecutionReceipt, equivalent: AccessibleVisualEquivalent }
  | { status: failed, error: DomainError, trustedFallback: ResolvedVisualModelV2,
      equivalent: AccessibleVisualEquivalent }
```

Every rendered series and annotation has non-empty lineage. Unsupported factual annotation text is rejected, not downgraded to decoration. Screen, clipboard copy and export are generated from the same `AccessibleVisualEquivalent` and must have the same semantic hash; no channel can omit model label, sources, table/summary or regeneration disclaimer.

`VisualFilterV2` has exactly one combine node and 1..20 non-recursive predicates, so depth is exactly one and total nodes are exactly `1 + nodeCount` (maximum 21). The resolver binds `fieldSchemaHash`, requires equality operands to match the field's exact scalar kind and unit, permits ordering/range only for numeric or `local_date` fields, requires all `one_of` values to be enum/ordinal, and requires both range bounds to have the same kind/unit as the field. A two-sided numeric or date range rejects when minimum exceeds maximum or when equal bounds are not both inclusive. A row with a missing or null referenced field evaluates that predicate as `false`; null is not a filter literal, and normal `all|any` Boolean combination then applies. Unknown fields/hashes, empty ranges, coercion and unit conversion inside a filter are forbidden.

### CTR-019 - routes, restoration and guided education

```text
union AppRoute =
  | { route: map, geographyId?: GeographyId, featureId?: AssetId }
  | { route: scenario, scenarioDraftId?: opaque string, resultSnapshotId?: Sha256 }
  | { route: comparison, comparisonSnapshotId: Sha256 }
  | { route: project_case, caseSnapshotId: Sha256, section: CaseSection }
  | { route: evidence, evidenceSnapshotId: Sha256, factId?: FactId }
  | { route: site_screening, siteProfileId?: opaque string, candidateId?: opaque string }
  | { route: brief, briefSnapshotId: Sha256 }
  | { route: settings, panel: connectors|storage|accessibility|about }

record WorkflowState {
  version: SemVer
  route: AppRoute
  releaseManifestHash: Sha256
  immutableReferences: Sha256[]
  mutableDraftReference?: { storeId: opaque string, expectedRevision: UInt64 }
  serializedHash: Sha256
}

union RestorationOutcome =
  | { status: restored, workflow: WorkflowState }
  | { status: restored_with_version_notice, workflow: WorkflowState,
      changedReleaseHash: Sha256, immutableDataPreserved: true }
  | { status: missing_reference, routeFallback: AppRoute(map), missing: non-empty MissingRecord[] }
  | { status: unsupported_version, routeFallback: AppRoute(map), originalHash: Sha256 }

union GuidedEducationState =
  | { step: ask_relationship, answer?: resident|mana_whenua|developer|council|researcher|other|prefer_not_to_say }
  | { step: ask_location, relationship: controlled token, geographyId?: GeographyId,
      locationPrecision: region_only }
  | { step: ask_issue, relationship: controlled token, geographyId?: GeographyId,
      issue: electricity|water|resilience|economic|community|site|other }
  | { step: explain_raw_values, selectedIssue: controlled token,
      dataIds: non-empty AssetId[], explanationIds: non-empty StatementId[] }
  | { step: ask_unclear, selectedIssue: controlled token,
      response: understood|needs_example|needs_definition|skip }
  | { step: complete, selectedIssue: controlled token }
```

History stores only versioned route state and immutable IDs; never a whole mutable object. Back, forward and deep-link restore through `RestorationOutcome`. Version drift may change available live data but never mutates the immutable reference. Guided education persists neither relationship, location answer, issue answer, free text, identity nor opinion; it is session-memory UI state only. Raw values are shown before interpretation.

### CTR-020 - first-source registry oracle and platform capabilities

The first-source registry contains exactly these 17 entries. Its shipped state is exactly one of the five approved UI/manifest labels; retrieval mode is a separate field and cannot change the displayed state:

```text
Stats NZ; LINZ; Transpower; Electricity Authority/EMI; EM6; LAWA; NIWA; GeoNet;
Data.govt.nz; EECA; Ministry for the Environment; NZTA; NZ Legislation; NZBN;
Companies Office; EPA/council; Tavily
```

```text
enum ShippedSourceState { "enabled", "prepared-only", "link-only", "agent-only", "disabled" }
enum SourceRetrievalMode { build_time, direct_runtime, user_connector, external_link, none }
record SourceRegistryEntryV2 {
  sourceId: SourceId
  canonicalName: one of the exact 17 names
  owner: non-empty BoundedText
  authoritativePurposes: controlled token[]
  supportedFieldIds: controlled token[]
  routeOrAsset: non-empty sanitized string
  approvedOrigins: NormalizedOrigin[]
  allowedMethods: non-empty (GET|POST)[]
  authentication: none|api_key_header|bearer_header|key_query_secret|provider_managed
  expectedCors: required|not_applicable|unknown
  licenceId: non-empty controlled token
  attribution: non-empty BoundedText
  permittedPurpose: non-empty BoundedText
  quotaSummary?: BoundedText
  refreshCadence?: non-empty controlled ISO8601 duration
  spatialResolution?: BoundedText
  temporalResolution?: BoundedText
  fallback: prepared|external_link|provider_research|none
  shippedState: ShippedSourceState
  retrievalMode: SourceRetrievalMode
  adapterVersion?: SemVer
  freshnessPolicyId: opaque string
  lastSuccessfulCheck?: Instant
  reason: non-empty BoundedText
}
```

Legal combinations are: `enabled` with `direct_runtime`; `prepared-only` with `build_time`; `link-only` with `external_link`; `agent-only` with `user_connector`; and `disabled` with `none`. Any other combination fails the build. A direct-runtime source requires at least one approved origin, exact methods and `expectedCors=required`; a build-time or external-link source cannot claim runtime CORS; every authenticated route must name its exact placement and may contain no credential value. Each enabled pack source binding must resolve to one registry entry with the same source/licence and permitted purpose; attribution, supported fields, cadence, spatial/temporal resolution, quota and fallback are retained in release validation. Missing, duplicated, renamed or reasonless entries fail the release build. `EM6` may remain an anonymous direct-runtime contextual source where CORS and terms permit; it never overrides stronger EMI authority.

Release support is mandatory on current stable Chromium, Firefox and WebKit desktop engines, plus one mobile-equivalent WebKit viewport/touch suite and one real iOS Safari or Android Chrome device smoke for releases. Missing WebGL uses a keyboard-accessible list plus static bounded-geometry preview. Missing IndexedDB uses session-only drafts with export guidance. Inability to persist a non-extractable CryptoKey uses separately disclosed browser-local or session-memory vault mode. Missing BroadcastChannel uses service-worker client messaging. Missing Clipboard API uses selected-text/manual-copy fallback. Each fallback is release-tested, never conditional on developer machine support.

### CTR-021 - hard cross-system resource budgets

```text
record ResourceBudgetV1 {
  appShellCompressedBytes: 3_145_728
  corePackCompressedBytes: 20_971_520
  optionalPackCompressedBytesEach: 52_428_800
  retainedVerifiedGenerations: 2
  retainedOptionalPackCacheBytes: 314_572_800
  indexedDbHardCapBytes: 209_715_200
  compilerDownloadBytesPerSource: 5_368_709_120
  compilerRowsPerSource: 50_000_000
  compilerTotalExpandedBytes: 21_474_836_480
  analysisWorkerQueuedOperations: 8
  connectorWorkerQueuedOperations: 4
  concurrentConnectorNetworkRequests: 2
  agentContextBytes: 262_144
  agentResponseBytes: 1_048_576
  agentOutputTokens: 8_192
  agentPerNetworkCallTimeoutMs: 30_000
  agentTransientRetries: 1
  agentConcurrentTools: 2
  agentCitations: 50
  agentResearchItems: 50
  visualSpecBytes: 131_072
  visualRows: 2_000
  visualPoints: 5_000
}
```

Every cap is checked before allocation where knowable and during streaming otherwise. Exceeding compiler download/row/expanded caps aborts that source and records a failed-source ledger entry. Queue overflow rejects newest work visibly. Cache pressure removes only unpinned optional packs from the inactive generation; it never removes the active shell/core, immutable saved snapshots or vault. Storage behavior follows CTR-015A. No limit failure silently truncates data or changes a deterministic outcome.

### CTR-022 - effective exported V2 roots and type closure

The superseded pre-v0.8 root declarations are historical design inputs and are **not exported**. Shared closed scalars/records are retained only when a V2 root explicitly references them. Production schema generation, TypeScript declarations, runtime decoders, storage and worker protocols export only the V2 roots listed here and their resolved transitive dependencies. An implementation importing old `ResultSnapshot`, `AssessmentResult`, `CandidateScreening`, `ProjectCase`, `AgentRequest`, `VisualSpec`, `ResolvedVisualModel`, `WorkerEvent` or generic `StorageOperation<T>` fails the contract compile test.

```text
type SemVer = string matching `^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?$`
record ZonedDateTime { instant: Instant, zone: Pacific/Auckland,
  localDateTime: canonical ISO local datetime, utcOffsetMinutes: Int16, fold: first|second|not_ambiguous }
record NormalizedOrigin { scheme: https, asciiHost: non-empty string, port: UInt16, serialized: string }
type LayerId = opaque string
type MethodologyId = opaque string
type ConflictId = opaque string
type CitationId = opaque string
type EdgeId = opaque string
type ClientId = opaque string
type DocumentId = opaque string
type ProjectId = opaque string
type CompanyId = opaque string
type ScenarioId = opaque string
type PackId = opaque string
type SourceId = opaque string
enum SourceType { authoritative_dataset, official_document, developer_claim,
  independent_analysis, regulator_or_court_finding, news_report,
  community_submission, web_discourse_indicator, user_assumption,
  prepared_preset, calculation, ai_interpretation }

enum PackKindV2 { source_registry, geometry, catalog, regional_context,
  electricity, policy, project_case, document_index }
record PackSourceBindingV2 {
  sourceId: SourceId
  licenceId: non-empty controlled token
  attribution: non-empty BoundedText
  permittedPurposeIds: non-empty controlled token[]
  coverage: CoverageRecord[]
}
record DataPackManifestV2 {
  schemaVersion: exactly 2
  packId: PackId
  packKind: PackKindV2
  semanticVersion: SemVer
  createdAt: Instant
  asOf: Instant
  dependencyPackIds: PackId[]
  assetIds: non-empty AssetId[]
  assetHashes: non-empty map<AssetId,Sha256>
  geographyIds: GeographyId[]
  sourceBindings: non-empty PackSourceBindingV2[]
  byteLength: UInt64
  manifestHash: Sha256
}

enum EvidenceAuthorityClassV2 { qualifying_authoritative, official_context,
  independent_context, claim, discourse, ai, unknown }
enum EvidenceDerivationStateV2 { raw, extracted, normalized, calculated, aggregated,
  candidate, superseded }
enum EvidenceCategoryV2 { electricity, grid, water, resilience, employment, investment,
  community, cooling, planning, legislation, environment, company, consent, hazards,
  connectivity, population, project, price, carbon }
record EvidenceRecordV2 {
  evidenceId: EvidenceId
  title: non-empty BoundedText
  publisher: non-empty BoundedText
  publicationAt?: Instant
  observationStart?: Instant
  observationEnd?: Instant
  retrievedAt: Instant
  validUntil?: Instant
  sourceId: SourceId
  sourceUrl: Url
  resourceId?: non-empty BoundedText
  sourceType: SourceType
  authorityClass: EvidenceAuthorityClassV2
  derivationState: EvidenceDerivationStateV2
  category: EvidenceCategoryV2
  geographyIds: GeographyId[]
  geometryRef?: AssetId
  unit?: UnitCode
  relevantExtract?: BoundedText
  documentId?: DocumentId
  pageOrSection?: PageLocatorV2
  licenceId: non-empty controlled token
  permittedPurposeId: non-empty controlled token
  qualityMethodId: MethodologyId
  adapterVersion: SemVer
  parentEvidenceIds: EvidenceId[]
  contentHash: Sha256
}

union TrustedStatementBindingV2 =
  | { kind: scalar, value: TypedScalar }
  | { kind: evidence_id, value: EvidenceId }
  | { kind: fact_id, value: FactId }
  | { kind: asset_id, value: AssetId }
  | { kind: trusted_text, value: BoundedText }
enum TrustedStatementOriginV2 { calculation, assessment, prepared_evidence,
  required_disclaimer, limitation, system_guidance, unresolved_question,
  missing_voice, company_role }
record TrustedStatementV2 {
  statementId: StatementId
  templateId: non-empty controlled token
  language: en-NZ
  renderedText: non-empty BoundedText
  bindings: map<non-empty controlled token,TrustedStatementBindingV2>
  sourceEvidenceIds: EvidenceId[]
  sourceFactIds: FactId[]
  calculationTraceRefs: CalculationTraceRefV2[]
  origin: TrustedStatementOriginV2
  trustLabel: calculated|evidence_backed|required_notice|unresolved
  contentHash: Sha256
}

enum UnresolvedQuestionScopeV2 { map, case, evidence, company, site, brief }
union UnresolvedQuestionSubjectV2 =
  | { kind: project, id: ProjectId }
  | { kind: company, id: CompanyId }
  | { kind: geography, id: GeographyId }
  | { kind: evidence, id: EvidenceId }
  | { kind: statement, id: StatementId }
  | { kind: site_candidate, id: CandidateId }
record UnresolvedQuestionV2 {
  questionId: opaque string
  scope: UnresolvedQuestionScopeV2
  questionStatementId: StatementId
  questionStatement: TrustedStatementV2
  subjects: non-empty UnresolvedQuestionSubjectV2[]
  relatedEvidenceIds: EvidenceId[]
  reasonIds: non-empty controlled token[]
  state: open|deferred|evidence_gap
  contentHash: Sha256
}

The exact legal `scope -> subject.kind` matrix is closed as follows; every omitted pair rejects:

| Question scope | Legal subject kinds |
|---|---|
| `map` | `geography`, `project`, `company`, `site_candidate`, `evidence`, `statement` |
| `case` | `project`, `company`, `geography`, `site_candidate`, `evidence`, `statement` |
| `evidence` | `evidence`, `statement`, `project`, `company`, `geography` |
| `company` | `company`, `statement`, `evidence`, `project` |
| `site` | `site_candidate`, `geography`, `project`, `evidence`, `statement` |
| `brief` | `project`, `company`, `geography`, `site_candidate`, `evidence`, `statement` |

`brief` identifies the containing-product context, not an impact-brief subject. Current or older
brief hashes are not question subjects. A brief-scoped question binds only the stable underlying
IDs already embedded in that brief's immutable closure, so `briefSnapshotId` is computable in one
forward canonical-hash pass with no pre-hash identity or self-reference.
record MissingVoiceRecordV2 {
  missingVoiceId: opaque string
  projectId: ProjectId
  geographyIds: non-empty GeographyId[]
  stakeholderType: StakeholderTypeV2
  stakeholderLabel?: BoundedText
  manaWhenuaDistinct: Boolean
  need: position_not_evidenced|consultation_gap|response_outdated|response_unattributed
  needStatementId: StatementId
  needStatement: TrustedStatementV2
  searchedEvidenceIds: EvidenceId[]
  reasonIds: non-empty controlled token[]
  contentHash: Sha256
}

type NzbnV2 = ASCII string of exactly 13 decimal digits
union CompanyIdentityResolutionV2 =
  | { state: resolved, legalName: non-empty BoundedText,
      nzbn?: NzbnV2, companiesOfficeNumber?: non-empty controlled token,
      tradingNames: BoundedText[], officialEvidenceIds: non-empty EvidenceId[] }
  | { state: ambiguous, suppliedName: non-empty BoundedText,
      candidates: non-empty { legalName: non-empty BoundedText, nzbn?: NzbnV2,
        companiesOfficeNumber?: non-empty controlled token, evidenceIds: non-empty EvidenceId[] }[],
      reasonIds: non-empty controlled token[] }
  | { state: unresolved, suppliedName: non-empty BoundedText,
      reasonIds: non-empty controlled token[], searchedEvidenceIds: EvidenceId[] }
record CompanyIdentityRecordV2 {
  companyId: CompanyId
  resolution: CompanyIdentityResolutionV2
  contentHash: Sha256
}
enum CompanyClaimRoleV2 { identity_fact, company_claim, allegation, company_response,
  official_finding, unresolved_item }
record CompanyClaimRecordV2 {
  companyClaimRecordId: opaque string
  companyId: CompanyId
  role: CompanyClaimRoleV2
  statementId: StatementId
  statement: TrustedStatementV2
  eventDate: ProjectEventDateV2
  assertingPartyLabel?: BoundedText
  relatedClaimRecordIds: opaque string[]
  evidenceIds: non-empty EvidenceId[]
  authority: qualifying_authoritative|official_context|independent_context|claim|unresolved
  contentHash: Sha256
}

enum MapLayerCategoryV2 { project, electricity_grid, water, connectivity,
  population_community, environmental_hazard, consent, community_evidence,
  company_operator, evidence_coverage }
union MapLayerAvailabilityV2 =
  | { state: enabled }
  | { state: qualified, reasonId: non-empty controlled token,
      reasonStatementId: StatementId,
      qualificationStatementIds: non-empty StatementId[] }
  | { state: disabled, reasonId: non-empty controlled token,
      reasonStatementId: StatementId,
      missingSourceLicenceOrFieldIds: non-empty controlled token[] }
union MapLayerCoverageV2 =
  | { state: known, records: non-empty CoverageRecord[] }
  | { state: unavailable, reasonId: non-empty controlled token }
union MapLayerConfidenceV2 =
  | { state: known, value: Confidence }
  | { state: unavailable, reasonId: non-empty controlled token }
record MapLayerDescriptorV2 {
  layerId: LayerId
  category: MapLayerCategoryV2
  labelStatementId: StatementId
  availability: MapLayerAvailabilityV2
  statementRecords: non-empty TrustedStatementV2[]
  sourceIds: SourceId[]
  evidenceIds: EvidenceId[]
  licenceIds: controlled token[]
  dataAsOf?: Instant
  coverage: MapLayerCoverageV2
  confidence: MapLayerConfidenceV2
  geometryKinds: non-empty (point|line|area)[]
  minimumZoom: UInt8 in 0..24
  maximumZoom: UInt8 in 0..24
  contentHash: Sha256
}

enum ProjectStatusV2 { existing, proposed, candidate }
record ProjectPeoplePlanetSummaryV2 {
  peopleStatementIds: non-empty StatementId[]
  planetStatementIds: non-empty StatementId[]
  coverage: CoverageRecord[]
  missingStatementIds: StatementId[]
  statementRecords: non-empty TrustedStatementV2[]
}
record ProjectCatalogRecordV2 {
  projectId: ProjectId
  catalogVersion: SemVer
  mapFeatureId: AssetId
  name: non-empty BoundedText
  aliases: BoundedText[]
  status: ProjectStatusV2
  pointWgs84: { longitude: RationalDecimal in [-180,180],
    latitude: RationalDecimal in [-90,90] }
  geographyId?: GeographyId
  capacityMw?: Megawatts
  stage: concept|announced|application|consented|construction|operating|unknown
  ownerCompanyId?: CompanyId
  operatorCompanyId?: CompanyId
  companyRecords: CompanyIdentityRecordV2[]
  caseAssetId?: AssetId
  summary: ProjectPeoplePlanetSummaryV2
  sourceEvidenceIds: non-empty EvidenceId[]
  recordHash: Sha256
}
record ProjectSheetV2 {
  project: ProjectCatalogRecordV2
  availableActions: non-empty (open_case|edit_scenario|ask_agent|add_to_compare)[]
  evidenceCoverage: CoverageRecord[]
  trustedStatements: TrustedStatementV2[]
  companyClaimRecords: CompanyClaimRecordV2[]
  sheetHash: Sha256
}

enum EvidenceEdgeTypeV2 { claim_supported_by, claim_contradicted_by, supersedes,
  extracted_from, claim_publication_date, project_company, project_site,
  concern_stakeholder, concern_evidence, project_comparable, document_page,
  event_evidence, evidence_about_geography }
union EvidenceGraphNodeRefV2 =
  | { kind: project, id: ProjectId }
  | { kind: company, id: CompanyId }
  | { kind: site, id: AssetId }
  | { kind: evidence, id: EvidenceId }
  | { kind: fact, id: FactId }
  | { kind: statement, id: StatementId }
  | { kind: community_record, id: opaque string }
  | { kind: stakeholder, id: opaque string }
  | { kind: document, id: DocumentId }
  | { kind: document_page, documentId: DocumentId, locator: PageLocatorV2 }
  | { kind: project_event, id: opaque string }
  | { kind: geography, id: GeographyId }
  | { kind: observation_date, value: LocalDate }
  | { kind: concern, id: opaque string }
record EvidenceEdgeV2 {
  edgeId: EdgeId
  type: EvidenceEdgeTypeV2
  from: EvidenceGraphNodeRefV2
  to: EvidenceGraphNodeRefV2
  evidenceId: EvidenceId
  derivation: prepared_rule|manual_curated|ai_candidate
  state: accepted|candidate|rejected
  contentHash: Sha256
}
record EvidenceGraphSnapshotV2 {
  graphSnapshotId: Sha256
  evidenceSnapshotId: Sha256
  nodes: non-empty EvidenceGraphNodeRefV2[]
  edgeEntries: { edgeId: EdgeId, contentHash: Sha256 }[]
  edges: EvidenceEdgeV2[]
  statementRecords: TrustedStatementV2[]
  companyRecords: CompanyIdentityRecordV2[]
  companyClaimRecords: CompanyClaimRecordV2[]
  createdAt: Instant
}

enum CommunityStanceV2 { supportive, opposed, conditional, neutral_informational, unclear }
enum StakeholderTypeV2 { mana_whenua, resident, community_group, council, regulator,
  business, developer, worker, expert, media, unknown }
enum CommunityEvidenceQualityV2 { representative, formal_submission,
  official_consultation, attributed_statement, reported_statement,
  web_discourse, unknown }
record CommunityRecordV2 {
  communityRecordId: opaque string
  projectId?: ProjectId
  geographyIds: non-empty GeographyId[]
  stance: CommunityStanceV2
  themeIds: non-empty controlled token[]
  stakeholderType: StakeholderTypeV2
  stakeholderLabel?: BoundedText
  manaWhenuaDistinct: Boolean
  evidenceQuality: CommunityEvidenceQualityV2
  methodologyId?: MethodologyId
  temporal: { state: known, observedOrPublishedAt: Instant } |
    { state: unknown, reasonId: non-empty controlled token }
  evidenceIds: non-empty EvidenceId[]
  limitationIds: non-empty controlled token[]
  contentHash: Sha256
}

record ImpactBriefSectionV2 {
  sectionId: non-empty controlled token
  statementIds: non-empty StatementId[]
  tableAssetIds: AssetId[]
  visualModelHashes: Sha256[]
}
record ImpactBriefAiAppendixV2 {
  agentReceiptId: Sha256
  labelStatementId: StatementId
  claims: AgentClaimV2[]
  citations: CitationV2[]
}
record ImpactBriefV2 {
  briefSnapshotId: Sha256
  resultSnapshotIds: non-empty Sha256[1..20]
  projectCaseSnapshotIds: Sha256[]
  audience: public|decision_maker
  lens: people|planet|both
  sections: non-empty ImpactBriefSectionV2[]
  assumptionPaths: FieldPath[]
  conflictIds: ConflictId[]
  trustedStatements: non-empty TrustedStatementV2[]
  unresolvedQuestions: UnresolvedQuestionV2[]
  companyRecords: CompanyIdentityRecordV2[]
  companyClaimRecords: CompanyClaimRecordV2[]
  limitationStatementIds: non-empty StatementId[]
  sourceEvidenceIds: non-empty EvidenceId[]
  disclaimerStatementId: StatementId
  deterministicMarkdown: non-empty BoundedText <= 1_048_576 bytes
  deterministicSemanticHash: Sha256
  optionalAiAppendix?: ImpactBriefAiAppendixV2
  reproducibilityManifestHashes: non-empty Sha256[]
  createdAt: Instant
}
union ImpactBriefCopyOutcomeV2 =
  | { status: copied, briefSnapshotId: Sha256, format: plain_text|markdown,
      contentHash: Sha256, semanticHash: Sha256 }
  | { status: manual_copy_required, briefSnapshotId: Sha256,
      format: plain_text|markdown, selectableContent: non-empty BoundedText <= 1_048_576 bytes,
      contentHash: Sha256, semanticHash: Sha256, guidanceStatement: TrustedStatementV2 }

record DiagnosticEventV2 {
  schemaVersion: exactly 2
  eventId: opaque string
  occurredAt: Instant
  category: app|data|calculation|worker|storage|connector|visual|security|performance
  code: allowlisted controlled token
  severity: info|warning|error
  componentId: non-empty controlled token
  componentVersion: SemVer
  releaseId: opaque string
  correlationId: CorrelationId
  connectorOrSourceLabel?: non-empty sanitized string
  durationBucket?: lt_10ms|lt_100ms|lt_1s|lt_5s|lt_30s|gte_30s
  statusClass?: success|cancelled|timeout|auth|quota|cors|invalid|internal
  counts?: map<allowlisted controlled token,UInt32>
  eventHash: Sha256
}
type CryptoKeyHandle = structured-clone-only non-extractable WebCrypto CryptoKey handle
type BrowserLocalSecretHandle = vault-adapter-only opaque browser-local handle
type SessionSecretHandle = connector-worker-memory-only opaque handle

union LocationSelectionV2 =
  | { state: selected, geographyId: GeographyId, pointWgs84?: { longitude: RationalDecimal,
      latitude: RationalDecimal }, method: map_pointer|map_touch|map_keyboard|
      place_search|accessible_map_list|project, resolution: inside|boundary_tie,
      geometrySetHash: Sha256 }
  | { state: unresolved, pointWgs84?: { longitude: RationalDecimal,
      latitude: RationalDecimal }, resolution: outside_recognized_geometry|unresolved,
      geometrySetHash: Sha256 }

record ScenarioDraftV2 {
  scenarioId?: ScenarioId
  name: BoundedText
  location: LocationSelectionV2
  itCapacityMw: BoundedText
  workloadType: general|ai_training|ai_inference|mixed|custom
  workloadDescription?: BoundedText
  utilisationPercent: BoundedText
  pue: BoundedText
  coolingMethod: air|evaporative|water_cooled|hybrid|unknown|custom
  coolingDescription?: BoundedText
  flexibleWorkloadPercent: BoundedText
  backupGeneration: none|battery|diesel|gas|mixed|unknown|custom
  backupRestriction: unrestricted|emergency_only|time_limited|verified_restricted|unknown
  backupCapacityMw?: BoundedText
  backupDurationHours?: BoundedText
  demandResponse: none|claimed|verified|unknown
  stage: concept|announced|application|consented|construction|operating|unknown
  stagingDescription?: BoundedText
  ownershipType: owner_operator|colocation|public_private|unknown|custom
  constructionJobs?: BoundedText
  permanentJobs?: BoundedText
  investmentNzd?: BoundedText
  wasteHeatReuseClaim: none|claimed|committed_verified|unknown
  proposalId?: BoundedText
  companyId?: BoundedText
}

record OriginProofV2 {
  fieldPath: FieldPath
  origin: user_assumption|versioned_preset|proposal_claim|verified_evidence|calculated
  issuedBy: validation_engine|calculation_engine|active_preset|prepared_evidence_reference
  sourceId?: SourceId
  evidenceId?: EvidenceId
  packId?: PackId
  operationId: OperationId
}

record NormalizedScenarioV2 {
  schemaVersion: 2
  scenarioId: ScenarioId
  name: BoundedText
  location: LocationSelectionV2
  itCapacityMw: Megawatts
  workload: { kind: general|ai_training|ai_inference|mixed|custom, description?: BoundedText }
  utilisationRatio: RationalDecimal in [0,1]
  pue: RationalDecimal in [1,5]
  cooling: { kind: air|evaporative|water_cooled|hybrid|unknown|custom,
    description?: BoundedText }
  flexibleWorkloadRatio: RationalDecimal in [0,1]
  backup: { generation: none|battery|diesel|gas|mixed|unknown|custom,
    restriction: unrestricted|emergency_only|time_limited|verified_restricted|unknown,
    capacityMw?: Megawatts, durationHours?: RationalDecimal in [0,720] }
  demandResponse: { state: none|claimed|verified|unknown }
  stage: concept|announced|application|consented|construction|operating|unknown
  stagingDescription?: BoundedText
  ownershipType: owner_operator|colocation|public_private|unknown|custom
  constructionJobs?: UInt64
  permanentJobs?: UInt64
  investmentNzd?: RationalDecimal
  wasteHeatReuseClaim: none|claimed|committed_verified|unknown
  proposalId?: BoundedText
  companyId?: BoundedText
  originProofs: map<FieldPath,OriginProofV2>
}

record CalculationTraceRefV2 {
  outputId: opaque string
  algorithmVersion: SemVer
  normalizedInputHash: Sha256
  formulaOrConstraintHash: Sha256
  unroundedValueHash?: Sha256
  displayValueHash?: Sha256
}

union CalculationOutputV2 =
  | { status: complete, outputId: opaque string, value: TypedScalar|TypedScalar[],
      traceRef: CalculationTraceRefV2 }
  | { status: insufficient, outputId: opaque string, missing: non-empty MissingRecord[],
      traceRef?: CalculationTraceRefV2 }
  | { status: failed, outputId: opaque string, error: DomainError,
      traceRef?: CalculationTraceRefV2 }

record ReproducibilityManifestV2 {
  manifestVersion: 2
  normalizedScenarioHash: Sha256
  normalizedInputHashes: non-empty map<FieldPath,Sha256>
  calculationTraceHashes: non-empty map<opaque string,Sha256>
  releaseManifestHash: Sha256
  packHashes: map<PackId,Sha256>
  assetHashes: map<AssetId,Sha256>
  featureHashes: map<AssetId,Sha256>
  layerDescriptorHashes: map<LayerId,Sha256>
  evidenceRecordHashes: map<EvidenceId,Sha256>
  evidenceFactHashes: map<FactId,Sha256>
  trustedStatementHashes: map<StatementId,Sha256>
  unresolvedQuestionHashes: map<opaque string,Sha256>
  missingVoiceHashes: map<opaque string,Sha256>
  companyIdentityHashes: map<CompanyId,Sha256>
  companyClaimHashes: map<opaque string,Sha256>
  readOnlyToolRegistryHash?: Sha256
  evidenceSnapshotHash: Sha256
  policyHashes: non-empty map<opaque string,Sha256>
  geometryEngineHashes: map<opaque string,Sha256>
  geographyGeometryHashes: map<GeographyId,Sha256>
  sourceAdapterVersions: map<SourceId,SemVer>
  asOf: Instant
  manifestHash: Sha256
}

record ResultSnapshotV2 {
  resultSnapshotId: Sha256
  scenarioId: ScenarioId
  normalizedScenario: NormalizedScenarioV2
  evidenceSnapshotId: Sha256
  calculations: non-empty map<opaque string,CalculationOutputV2>
  flexibility: FlexibilityResultV2
  assessments: {
    electricity: CategoryAssessment,
    water: CategoryAssessment,
    resilience: CategoryAssessment,
    economic: CategoryAssessment,
    community: CategoryAssessment
  }
  trustedStatements: non-empty TrustedStatementV2[]
  calculationTraceRefs: non-empty CalculationTraceRefV2[]
  overall: OverallAssessmentV2
  reproducibility: ReproducibilityManifestV2
  createdAt: Instant
}

record ComparisonSnapshotV2 {
  comparisonSnapshotId: Sha256
  resultSnapshotIds: Sha256[2..20]
  metricChanges: TypedChange[]
  assessmentChanges: TypedChange[]
  evidenceCoverageChanges: TypedChange[]
  createdAt: Instant
  comparisonHash: Sha256
}

record SanitizedConnectorConfiguration {
  connectorId: ConnectorId
  connectorKind: openai_compatible|remote_mcp|tavily_rest
  displayLabel: non-empty sanitized string
  normalizedOrigin: NormalizedOrigin
  endpointRoute: SanitizedEndpointRouteV2
  endpointLabel: non-empty sanitized string // never includes query, userinfo, fragment or secret
  routeIds: non-empty controlled token[]
  selectedRouteId?: non-empty controlled token
  modelId?: non-empty sanitized string
  dialectPreference: auto|openai_chat_completions|openai_responses|
    mcp_streamable_http|tavily_rest
  selectedDialect?: openai_chat_completions|openai_responses|
    mcp_streamable_http|tavily_rest
  authorizationPlacement: header_authorization|header_x_api_key|body_declared_field|
    query_declared_secret_parameter
  optionalNonSecretHeaders: { name: AllowedNonSecretHeaderNameV2,
    value: non-empty sanitized string <= 1024 bytes }[]
  capabilityMatrix: ConnectorCapabilityMatrixV2
  persistenceMode: encrypted_persistent|disclosed_browser_local|session_memory
  containsSecretBytes: false
  configurationHash: Sha256
}

record MigrationReceipt {
  migrationId: opaque string
  fromVersion: SemVer
  toVersion: SemVer
  inputHash: Sha256
  outputHash?: Sha256
  outcome: migrated|quarantined|failed
  completedAt: Instant
}

record GridLensPublicContractV2 {
  schemaVersion: exactly 2
  workerCommand: schema<WorkerCommandV2<InertWorkerCommandPayloadV2>>
  workerEvent: schema<WorkerEventV2<WorkerEventPayloadV2>>
  releaseManifest: schema<ReleaseManifestV2>
  dataPackManifest: schema<DataPackManifestV2>
  sourceRegistryEntry: schema<SourceRegistryEntryV2>
  evidenceRecord: schema<EvidenceRecordV2>
  mapFeature: schema<MapFeature>
  mapLayerDescriptor: schema<MapLayerDescriptorV2>
  projectCatalogRecord: schema<ProjectCatalogRecordV2>
  projectSheet: schema<ProjectSheetV2>
  trustedStatement: schema<TrustedStatementV2>
  unresolvedQuestion: schema<UnresolvedQuestionV2>
  missingVoiceRecord: schema<MissingVoiceRecordV2>
  companyIdentityRecord: schema<CompanyIdentityRecordV2>
  companyClaimRecord: schema<CompanyClaimRecordV2>
  evidenceFact: schema<EvidenceFact>
  evidenceSnapshot: schema<EvidenceSnapshot>
  evidenceEdge: schema<EvidenceEdgeV2>
  evidenceGraphSnapshot: schema<EvidenceGraphSnapshotV2>
  evidenceGraphQueryResult: schema<EvidenceGraphQueryResultV2>
  communityRecord: schema<CommunityRecordV2>
  resultSnapshot: schema<ResultSnapshotV2>
  projectCase: schema<ProjectCaseV2>
  impactBrief: schema<ImpactBriefV2>
  impactBriefCopyOutcome: schema<ImpactBriefCopyOutcomeV2>
  proposedSiteProfile: schema<SiteProfileCandidateV2>
  siteScreening: schema<CandidateScreeningV2>
  sensitivityResult: schema<SensitivityResultV2>
  sitePresentation: schema<SitePresentationPolicyV2>
  agentRequest: schema<AgentRequestV2>
  externalDisclosure: schema<ExternalDisclosureV2>
  externalDisclosureAcceptance: schema<ExternalDisclosureAcceptanceV2>
  agentTerminal: schema<AgentTerminalResultV2>
  toolReplay: schema<ToolReplayRecord>
  readOnlyToolRegistry: schema<ReadOnlyToolRegistryV2>
  toolAlias: schema<ToolCallAliasRecordV2>
  toolReceipt: schema<CompleteToolReceiptV2>
  researchCache: schema<ResearchCacheRecordV2>
  visualSpec: schema<VisualSpecV2>
  visualOutcome: schema<VisualOutcomeV2>
  storageCommand: schema<StorageCommandV2>
  storageCommandOutcome: schema<StorageCommandOutcomeV2>
  storageReceipt: schema<StorageReceipt>
  storedEnvelope: schema<StoredEnvelopeV2>
  connectorConfiguration: schema<SanitizedConnectorConfiguration>
  clearPlan: schema<ClearPlan>
  clearReceipt: schema<ClearReceipt>
  connectorRemovalJournal: schema<ConnectorRemovalJournalV2>
  updateState: schema<UpdateGenerationState>
  emiOutcome: schema<EmiPublishOutcome>
  diagnosticEvent: schema<DiagnosticEventV2>
  routeState: schema<WorkflowState>
}

record GridLensStructuredCloneContractV2 {
  schemaVersion: exactly 2
  connectorControlCommand: WorkerCommandV2<ConnectorControlCommandPayloadV2>
  credentialRecord: CredentialRecordV2
}
```

The JSON Schema compiler resolves the entire `GridLensPublicContractV2` transitive graph and fails on an undeclared identifier, forward-incompatible open object, unknown enum member, old root import, or permissive `any`/`unknown` payload. It never imports `GridLensStructuredCloneContractV2`, credential records, secret buffers or handles. The separate clone-contract generator emits TypeScript plus runtime structured-clone guards for the exact connector-control union and rejects JSON/stringification of every secret-bearing member. `ReproducibilityManifestV2` is constructed from actual read tracking: every consumed asset, feature/layer, evidence record/fact, statement, question, missing voice, company/claim role, tool-registry version, policy, geometry engine and geography geometry hash is required; unused loaded records are omitted.

Every content-addressed V2 product record uses the same acyclic rule: its named content/hash field is the SHA-256 of the strict canonical record with only that field omitted. `ProjectCaseV2.caseSnapshotId`, `EvidenceGraphSnapshotV2.graphSnapshotId` and `ImpactBriefV2.briefSnapshotId` are the content hashes of their canonical remainders. A catalog record points to a case by stable `caseAssetId`, never by the case content hash embedded back into that catalog record. `ExternalDisclosureV2.disclosureHash` omits only itself; an acceptance requires `acceptedDisclosureHash == disclosure.disclosureHash`, and `acceptanceHash` omits only itself. `AgentOutboundContactReceiptV2.contactHash` omits only itself. A request's accepted set and its `AgentExecutionReceipt.acceptedDisclosureAcceptances` are byte-identical until acknowledged authorizations append new unique acceptances; every actual fetch instead has one exact `contactedNetworkAttempts` member resolving an acceptance hash from that set. `DiagnosticEventV2.eventHash`, evidence/statement/question/missing-voice/company/company-claim/layer/project/catalog/sheet/community/edge hashes and pack manifest hashes follow the same rule. Duplicate IDs with differing bytes fail release/load rather than selecting one.

A prepared case carries the stable `releaseId`, not `releaseManifestHash`; its asset hash is included by the later-built release manifest, and the loader attaches/verifies the active release-manifest hash in the runtime asset envelope. This avoids a release-manifest/asset hash cycle while preserving exact provenance.

An external disclosure has `promptHash` present exactly when `sendsPrompt=true`, and that hash plus the exact StageContext IDs, sorted categories and other send flags form `selectedContextHash`. `outboundContentHash` covers the exact canonical bytes sent before credential insertion, including every model continuation/repair body, a dynamic tool's sanitized arguments or a direct research query. The prompt/query/document text itself is never stored in a disclosure or receipt. Connector ID, current configuration hash, origin, route, operation kind/purpose, optional read-only tool ID, outbound content, prompt/context/category/send flags and request/operation/generation are all acceptance-bound; changing any one requires a new disclosure and explicit acceptance for that destination. No fetch may begin from a category-only or connector-only grant.

`readOnlyToolId` is present exactly for `agent_tool|direct_research` and absent for
`primary_model|connector_test`. `modelRequestPurpose` is present exactly for `primary_model`
and absent for the other operation kinds. Agent disclosures hash the exact StageContext selection;
direct-research disclosures hash the exact query projection; connector-test disclosures use
only the displayed connector/configuration/route capability and exact minimal test bytes.

Evidence edge endpoint kinds are closed: `claim_supported_by`/`claim_contradicted_by` are statement-or-fact to evidence; `supersedes` joins two nodes of the same evidence, statement or fact kind; `extracted_from` is statement-or-fact to document-page or evidence; `claim_publication_date` is statement-or-evidence to observation-date; `project_company` is project to company; `project_site` is project to site or geography; `concern_stakeholder` is concern to stakeholder or community-record; `concern_evidence` is concern to evidence; `project_comparable` is project to project; `document_page` is document to document-page; `event_evidence` is project-event to evidence; and `evidence_about_geography` is evidence to geography. Any other endpoint pair rejects before graph activation.

An evidence graph has unique canonical node references and unique edge IDs; `edgeEntries` is the exact ID/content-hash projection of `edges`, and every edge endpoint is present in `nodes`. Duplicate, orphaned or extra nodes/edges reject the complete graph snapshot.

`ProjectPeoplePlanetSummaryV2` and `ProjectSheetV2` have no score/rank field; strict unknown-field rejection makes an attempted suitability score invalid.

Every effective evidence/document boundary uses `PageLocatorV2`; the legacy all-optional `PageLocator` is unreachable from `GridLensPublicContractV2`. A page locator is valid only in one declared variant, and `{}` or a partial mixed variant rejects before evidence, graph, case or brief activation.
`EvidenceRecordV2.documentId` and `pageOrSection` are present together or absent together;
document-page graph nodes require both a known document and one valid locator.

For each `MapQueryV2.layerIds` value, `MapQueryResultV2.layerDescriptors` contains exactly one descriptor and no extra descriptor. Every returned feature's `layerId` resolves to that set. Enabled, qualified and disabled states are mutually exclusive; qualified/disabled reasons and every label resolve to the descriptor's `statementRecords` and the query's exact statement union. `maximumZoom >= minimumZoom`. Coverage and confidence use explicit known/unavailable variants; a disabled or unlicensed layer names the missing source, licence or field rather than supplying a fabricated zero/empty value.
Enabled/qualified layers require non-empty source/licence/evidence IDs plus known coverage and
confidence; disabled layers may carry retained known metadata or explicit unavailable variants.
`dataAsOf` is required whenever the source has a temporal observation and forbidden as a
fabricated date when no source bytes were activated.

Every statement ID in a result, catalog summary, layer descriptor, sheet, case, graph or brief resolves to exactly one byte-identical `TrustedStatementV2` in that record's embedded immutable closure. Summary `statementRecords` are the exact union of People, Planet and missing statement IDs. Case/graph/brief statement arrays contain no unused duplicate IDs. Each unresolved question, missing voice and company claim embeds its named statement byte-identically and that record also appears once in the containing product closure; IDs cannot stand in for text. The manual-copy outcome embeds its guidance statement so it has no external resolver dependency.

`ProjectSheetV2.trustedStatements` is the exact union of its project-summary and company-claim
statements. `MapQueryResultV2.trustedStatements` is the exact union needed by its returned layer
descriptors, catalog records and selected sheet. Graph statement records resolve every statement
node and claim; result/case/brief arrays resolve every statement ID they contain. Extras,
duplicates or byte-different copies reject the whole containing record.

A calculated statement has a non-empty calculation trace; an evidence-backed statement has a
non-empty evidence or fact reference; required notices/system guidance may have neither but use
only pinned templates. `trustLabel=unresolved` is mandatory for unresolved-question and
missing-voice text. Template/binding/rendered-text recomputation must reproduce `contentHash`;
editable or model text cannot instantiate a trusted statement.
Question, missing-voice and company-claim embedded statement IDs must equal their named ID fields;
their origins are respectively `unresolved_question`, `missing_voice` and `company_role`.
Every unresolved-question subject discriminant must be a legal member of the closed
scope-to-subject matrix above and resolve in the same containing snapshot/product; an opaque
free-form subject ID, any brief hash and any omitted matrix pair is invalid. Brief-scoped
questions resolve stable underlying records in the brief and never reference the current or an
older `briefSnapshotId`, preserving the one-pass acyclic hash rule.

Every owner/operator and graph company ID resolves to exactly one `CompanyIdentityRecordV2`. A `resolved` identity requires official evidence for its legal name and any NZBN/company number; ambiguous candidates remain visibly distinct and unresolved identities cannot be promoted by a model. Each company claim record resolves its statement/company/evidence IDs. `official_finding` requires qualifying regulator/court evidence; `company_response` is attributed to that company; `allegation` and `company_claim` remain claims; `unresolved_item` is never rendered as a finding. Project sheets, graphs, cases and briefs reject on an orphan, role mismatch or content-hash mutation.

Catalog `companyRecords` equal exactly the optional owner/operator IDs. A map result's company
set is the exact union for its catalogs/sheet; a graph's set equals its company nodes and claims;
case/brief sets equal every contained company reference. Company-claim IDs are unique, related
claim IDs resolve within the same closure, and no relationship changes a claim's role/authority.

`ReadOnlyToolRegistryV2` contains exactly one entry for each of the five `ReadOnlyToolIdV2` values and no other ID. Its compile-time adapter table fixes connector kind, route capability, exact argument/result variant, side-effect class, modes and stages. A remote MCP advertised name is inert until a known adapter maps its advertised input schema hash to one of these five entries; prompt text, server discovery and model output cannot add a tool. Each enabled registry entry resolves one and only one request-frozen `ToolRouteBindingV2`; zero, duplicate or same-kind ambiguous bindings reject before the first model dispatch. `ToolOperationV2.toolId` must equal `arguments.toolId`, and its destination connector kind/ID/route/configuration plus accepted disclosure must match that route binding, the registry entry and active connector. The operation and every receipt/replay hash cover that full binding.

`SanitizedConnectorConfiguration.configurationHash` covers connector kind, origin, endpoint-route visibility, the public base path only for a `public_path`, the random vault policy ID only for a `sensitive_vault_route`, route IDs, model ID, dialect preference, authorization placement, optional headers and persistence mode; it excludes selected route/dialect, capability matrix and itself. A sensitive endpoint's path, query, userinfo and fragment bytes never enter this hash or any public value. `ConnectorCapabilityMatrixV2.matrixHash` covers the matrix with only `matrixHash` omitted and must name that exact configuration hash. Selected route/dialect are usable only while the matrix is unexpired and still matches. Any covered configuration change immediately replaces the matrix with all `not_tested` states and clears the selected route/dialect.

For a sensitive endpoint, `vaultRoutePolicyId` is cryptographically random and every public `routeId` is either a fixed dialect capability token or a separately random opaque ID; none is a content hash, encoding, length bucket or other derivative of path/query bytes.

A sensitive endpoint label is generated only from its normalized origin or from separately entered sanitized label text that passes active-secret equality/pattern rejection; it is never derived from path, query, userinfo or fragment text.

### v0.10 closure matrix

| Review finding | Normative correction |
|---|---|
| LR3-001 | CTR-006A |
| LR3-002 | CTR-007A |
| LR3-003 | CTR-009A |
| LR3-004 | CTR-010A plus approved separate-group map policy |
| LR3-005 | CTR-001A/012A |
| LR3-006 | CTR-011A |
| LR3-007 | CTR-000A and CTR-002A/003A |
| LR3-008 | CTR-015A |
| LR3-009 | CTR-016A |
| LR3-010 | CTR-018A plus approved Balanced quality policy |
| LR3-011 | CTR-008A |
| LR3-012 | CTR-013A |
| LR3-013 | CTR-019 through CTR-021 |
| G3V05-001 | AssessmentInputRefV2, CategoryAssessment, OverallAssessmentV2 and ResultSnapshotV2 |
| G3V05-002 | SiteDomainOutcome, SitePresentationGroup, SiteProfileCandidateV2 and user-only confirmation |
| G3V05-003 | Closed WorkerCommandPayloadV2/WorkerEventPayloadV2 operation graph |
| G3V05-004 | SanitizedToolResultV2, VisualFilterV2, explicit terminal records and StorageCommandV2 |
| G3V05-005 | ToolReplayRecord + tool_receipts atomic repository-only completion |
| G3V05-006 | Inspectable ResearchCacheRecordV2 |
| G3V05-007 | Eight mutually exclusive CaseSourceCounts buckets |
| G3V05-008 | Discriminated data-visual/narrative-panel specifications and resolved models |
| G3V06-001 | Location/site-confirmation plus structured-clone connector-control command/event pairs |
| G3V06-002 | Restorable SanitizedConnectorConfiguration, capability matrix and exact vault encoding |
| G3V06-003 | Two-stage ResearchFetchResultV2 -> ResearchCompilationOutcomeV2 producer |
| G3V06-004 | MissingPolicy without failure and observed-value-only failure outcomes |
| G3V06-005 | ToolCallAliasRecordV2, child operation IDs and dependency-closed retention |
| G3V06-006 | Explicit TypedChange variants and separate JSON/structured-clone schema roots |
| G3V06-007 | Non-recursive bounded VisualFilterV2 with exact kind/unit/null semantics |
| G3V07-001 | Closed V2 pack/catalog/graph/community/brief/disclosure/diagnostic records and producer roots |
| G3V07-002 | SanitizedEndpointRouteV2 public/sensitive discrimination with vault-only sensitive route bytes |
| G3V07-003 | Exact cancellation target/acknowledgement and complete bounded AgentLimitsV2/receipt counters |
| G3V08-001 | Command-family cancellation terminal rule with zero-counter queued-agent receipt |
| G3V08-002 | Per-destination/content disclosure set, dynamic authorization handshake and exact five-tool read-only registry/binding |
| G3V08-003 | Generic connector-config exclusion plus resumable all-data/per-connector vault-first clear closure |
| G3V08-004 | Strict EvidenceRecordV2/PageLocatorV2 and resolvable layer/statement/question/missing-voice/company/claim-role roots |
| G3V09-001 | Shared per-outbound authorization transition, request-frozen tool routes and separate accepted/contacted receipt sets |
| G3V09-002 | Pre-allocation alias lookup with distinct request/replay/reject counters and one receipt per new logical call |
| G3V09-003 | Closed question scope/subject matrix with brief hashes removed from subject identity |

## Version 0.11 reconciliation — selectable regions and operator-managed providers

This section is normative. It replaces the browser credential vault, user connector configuration, direct-CORS model/Tavily/MCP routing, destination-acceptance, per-connector clear, and no-server-relay portions of earlier versions. Historical types remain documentation only and shall not be imported by production v0.11 code.

### CTR-023 — Pinned regional geometry

```text
type RegionIdV3 = "01"|"02"|"03"|"04"|"05"|"06"|"07"|"08"|"09"|
                  "12"|"13"|"14"|"15"|"16"|"17"|"18"|"99"

type RegionFeaturePropertiesV3 = exact {
  regionId: RegionIdV3
  name: NonEmptyString<=80
  sourceField: "REGC_code"
  sourceNameField: "REGC_name"
}

type RegionFeatureCollectionV3 = exact {
  type: "FeatureCollection"
  features: NonEmptyArray<GeoJsonPolygonOrMultiPolygon<RegionFeaturePropertiesV3>>
}

type RegionAssetManifestV1 = exact {
  schemaVersion: "gridlens.region-asset.v1"
  edition: "Stats NZ Regional Council 2023 (generalised), 12 nautical miles"
  sourceDatasetUrl: "https://datafinder.stats.govt.nz/layer/111182-regional-council-2023-generalised/"
  distributionUrl: "https://services.arcgis.com/XTtANUDT8Va4DLwI/arcgis/rest/services/Regional_Council_Boundary/FeatureServer/0"
  licence: NonEmptyString<=160
  generatedAt: Instant
  geometryPrecision: Integer[4..6]
  sha256: LowerHex64
  featureCount: 17
  regionIds: ExactSet<RegionIdV3>
}
```

Producer: build-time spatial preparation from the pinned Stats NZ dataset through the named Eagle Technology ArcGIS distribution. Consumers: map asset loader, selection resolver, accessible region index, package validator, QA. The preparation step normalizes the source `REGC_code` values `1`–`9` to canonical two-character IDs `01`–`09` and retains `12`–`18` and `99`; no other code transformation is permitted. The raw prepared GeoJSON byte hash must equal `sha256` before it becomes selectable. Feature IDs and `properties.regionId` are identical. Unknown, duplicate, empty, malformed, unclosed, non-polygon, missing-99, missing-main-region, or out-of-NZ-coordinate features reject the entire geometry generation; no nearest-region fallback is created.

### CTR-024 — Map load and canonical selection

```text
type AssetStateV1 =
  | { state:"idle" }
  | { state:"loading"; startedAt:Instant }
  | { state:"ready"; version:NonEmptyString; count:PositiveInteger; readyAt:Instant }
  | { state:"failed"; publicCode:MapPublicErrorCode; retryable:boolean }

type MapReadinessV1 = exact {
  basemap: AssetStateV1
  regions: AssetStateV1
  markers: AssetStateV1
  interactive: boolean
}

type SelectionSourceV3 = polygon_pointer|polygon_keyboard|marker_pointer|
                         marker_keyboard|accessible_list|search|coordinate|restore

type SelectRegionCommandV3 = exact {
  operationId: OperationId
  regionId: RegionIdV3
  source: SelectionSourceV3
  selectedSiteId?: SiteId
  candidatePoint?: Wgs84Point
}

type RegionSelectionV3 = exact {
  regionId: RegionIdV3
  source: SelectionSourceV3
  selectedSiteId?: SiteId
  candidatePoint?: Wgs84Point
  geometryEdition: NonEmptyString
  selectedAt: Instant
}
```

Producer: map controller or accessible list/search/coordinate adapter. Consumers: application selection store, MapLibre renderer, scenario panel, deterministic evaluator, prompt-context projector. All paths dispatch `SelectRegionCommandV3`; no UI path mutates selection independently. Marker activation sets both its `selectedSiteId` and owning `regionId`. Polygon activation clears a site selection unless the selected site remains inside the activated region. The latest operation generation wins; stale map events cannot replace a newer list/search selection.

`interactive=true` requires `regions.state=ready` and at least one canonical selection path. Basemap failure never sets `interactive=false`. Marker failure is visible and does not disable polygons/list. Region failure disables polygon/coordinate resolution but the static accessible index may still select a known RegionId with a qualified geometry-unavailable state.

### CTR-025 — Operator provider configuration (server-only)

```text
type SecretString = opaque server-only non-serializable string

type OperatorProviderConfigV1 = server-only exact {
  model: {
    baseUrl: FixedHttpsUrl
    apiKey: SecretString
    modelId: NonEmptyString<=160
    dialect: chat_completions
  }
  tavily?: {
    baseUrl: "https://api.tavily.com"
    apiKey: SecretString
  }
  mcp?: {
    baseUrl: FixedHttpsUrl
    credential?: SecretString
    allowedTools: ExactSubset<ReadOnlyToolIdV3>
  }
}

type ProviderClassV1 = openai_compatible|tavily|remote_mcp
type ProviderStateV1 = ready|limited|unavailable

type ProviderHealthResponseV1 = exact {
  schemaVersion: "gridlens.provider-health.v1"
  overall: ProviderStateV1
  providers: Array<=3<exact {
    providerClass: ProviderClassV1
    state: ProviderStateV1
    capabilities: ExactSet<analysis|web_search|web_research>
  }>
  checkedAt: Instant
  cacheSeconds: Integer[0..30]
}
```

Producer: Worker environment adapter. Consumers: server provider clients and sanitized health route. `OperatorProviderConfigV1`, `SecretString`, raw endpoint paths, model IDs and upstream error bodies are forbidden from React props, RSC payloads, structured-clone roots, browser storage, public errors, responses, telemetry, logs, exports, and generated visuals.

Local development may map ignored `TEST.md` into Worker bindings before the application environment starts. Only the Vite/Worker configuration boundary may read the file. Production client/server modules may read environment bindings but shall never import `TEST.md`, a TEST parser, or a value literal. Hosted configuration uses Sites runtime secrets.

### CTR-026 — Same-origin provider API

All API request/response objects are closed JSON objects. Unknown fields reject. Requests require `Content-Type: application/json`, a same-origin request context, and an active non-aborted request signal. No request schema includes a URL, endpoint, key, credential, header, HTTP method, model identifier, provider identifier, MCP endpoint, arbitrary tool name, or redirect policy.

```text
type PublicProviderErrorCodeV1 =
  invalid_request|payload_too_large|provider_unavailable|research_unavailable|
  rate_limited|upstream_timeout|upstream_rejected|invalid_upstream_response|
  cancelled|internal_error

type PublicApiErrorV1 = exact {
  schemaVersion: "gridlens.public-error.v1"
  error: exact {
    code: PublicProviderErrorCodeV1
    message: PublicSafeString<=240
    retryable: boolean
    correlationId: CorrelationId
  }
}

type ResearchRequestV1 = exact {
  schemaVersion: "gridlens.research-request.v1"
  requestId: RequestId
  query: TrimmedString[3..500]
  regionId: RegionIdV3
  scenarioId: ScenarioId
}

type ResearchCandidateV1 = exact {
  title: PlainText[1..240]
  url: PublicHttpUrl
  excerpt: PlainText<=900
  retrievedAt: Instant
  sourceClass: official|public_web
}

type ResearchResponseV1 = exact {
  schemaVersion: "gridlens.research-response.v1"
  requestId: RequestId
  candidates: Array<=4<ResearchCandidateV1>
  providerClass: tavily|remote_mcp
  partial: boolean
}

type AgentRequestV1 = exact {
  schemaVersion: "gridlens.agent-request.v1"
  requestId: RequestId
  prompt: TrimmedString[3..4000]
  context: DeterministicPromptContextV3<=49152_bytes
  research?: Array<=4<ResearchCandidateV1>
}

type AgentResponseV1 = exact {
  schemaVersion: "gridlens.agent-response.v1"
  requestId: RequestId
  answer: PlainText[1..32000]
  citations: Array<=12<exact { title:PlainText[1..240]; url:PublicHttpUrl }>
  providerClass: openai_compatible
  generatedAt: Instant
  partial: boolean
}
```

Route table:

| Method/path | Input | Success | Limits | Producer | Consumers |
|---|---|---|---|---|---|
| `GET /api/v1/providers/health` | none | `ProviderHealthResponseV1` | 30-second maximum public cache | Worker health adapter | AI status UI, E2E |
| `POST /api/v1/research` | `ResearchRequestV1` | `ResearchResponseV1` | 16 KiB body, 10 s upstream, max 4 results/24 KiB response | Worker Tavily/MCP adapter | Agent orchestration, evidence candidate UI |
| `POST /api/v1/agent` | `AgentRequestV1` | `AgentResponseV1` | 64 KiB body, 40 s total, 900 output tokens, 48 KiB response | Worker model adapter | Prompt workspace |

Redirects are rejected. Authentication, schema, cancellation, redirect, and non-idempotent failures are never retried. Research and model calls may receive one retry for 429/5xx only when the total deadline and request signal permit. Maximum in-flight provider operations per Worker isolate is four; excess work returns `rate_limited`. This concurrency guard is defense in depth, not a durable public rate limiter.

### CTR-027 — Fixed provider clients and sanitisation

`ModelProviderClientV1`, `TavilyProviderClientV1`, and `McpProviderClientV1` receive only server-owned `OperatorProviderConfigV1` plus validated operation inputs. URL construction is a pure function of fixed base URL and code-owned path. Authorization is added only at this boundary. User/body/model output cannot influence destination, header names, method, model, tool registry, or redirect behavior.

The model adapter accepts public assistant `content` only. Private reasoning channels and `<think>...</think>` blocks are discarded and never logged or returned. Tavily/MCP results are mapped field-by-field into `ResearchCandidateV1`; extra fields, raw content, provider usage data, and unsafe/non-public URLs are discarded. Public errors are created from status classes, never upstream body text.

### CTR-028 — v0.11 producer/consumer and retirement matrix

| Contract | Producer | Consumers | Version/failure rule |
|---|---|---|---|
| CTR-023 region asset | Spatial build step | Map loader, selection resolver, accessible index, packaging | Hash/shape/set mismatch rejects generation and release |
| CTR-024 map state/selection | Map/list/search/coordinate adapters | App store, renderer, scenario, evaluator, prompt context | Latest operation generation wins; scoped asset degradation |
| CTR-025 operator config/health | Worker env adapter | Provider clients; sanitized projection to UI | Secret type never crosses server boundary; missing config -> unavailable |
| CTR-026 provider API | Worker routes | Same-origin browser API client | Closed schema and stable public errors; no dynamic destination fields |
| CTR-027 fixed clients | Worker route orchestrator | Fixed upstream providers | No redirects; bounded retry/time/size; sanitized projection only |

Retired from production v0.11: `SanitizedConnectorConfigurationV2`, browser `EncryptedCredentialRecord`, connector capability/vault commands, destination/content acceptance for user-selected providers, credential clear/replace, raw connector routing, and any direct browser model/Tavily/MCP call. Device-local scenario/cache contracts remain valid after removing credential record variants.

### v0.11 traceability

| Requirements | Contracts |
|---|---|
| FR-LOC-001–004, FR-MAP-001–004 | CTR-023–024 plus existing scenario/site/evidence contracts |
| FR-CONN-001–008 | CTR-025–027 |
| FR-AGT-001–010, FR-VIZ-001–003 | CTR-026–027 plus existing deterministic context/visual contracts |
| FR-SAVE-001–002 | Existing scenario/cache storage contracts minus retired credential variants |
| NFR-PER-001, NFR-ACC-001 | CTR-023–024 load/selection/fallback limits |
| NFR-SEC-001–002, NFR-PRI-001, NFR-OBS-001 | CTR-025–027 secret boundary, validation, fixed routing, sanitisation, safe errors |
| NFR-DEP-001 | CTR-023–028 and single Sites Worker deployment |

## Version 0.12 reconciliation — closed effective contract graph

This section closes independent-review findings G3V11-001–012. It is normative. Production v0.12 generates and validates only `GridLensPublicContractV3` and its explicitly named deterministic imports. Retired V2 browser connector, credential, destination-acceptance, connector route, connector cache, and connector-clear roots are a compile-time error.

### Approved Gate 3 security decisions

- `g3v11-d01`: provider traffic may target only exact operator-approved public HTTPS origins. Private, loopback, link-local, reserved, IP-literal, userinfo, fragment, non-default-port unless explicitly pinned, redirect, and runtime/user/model-selected destinations are forbidden. The private hackathon Sites access boundary remains mandatory.
- `g3v11-d02`: research used by the agent is performed inside the same Worker operation and remains server-side until sanitized citations are returned. The agent request accepts no research candidate, URL, excerpt, source-class, provider, model, endpoint, header, method, or tool field.

### CTR-029 — Canonical scalar and encoding vocabulary

```text
type RegionId = "01"|"02"|"03"|"04"|"05"|"06"|"07"|"08"|"09"|
                "12"|"13"|"14"|"15"|"16"|"17"|"18"|"99"
type GeographyIdV3 = RegionId
type UUIDv7String = lowercase RFC-4122 UUID with version nibble 7 and legal variant
type OperationId = UUIDv7String
type RequestId = UUIDv7String
type CorrelationId = UUIDv7String
type ScenarioId = UUIDv7String | "current-demo"
type MarkerId = ASCII pattern ^(project|candidate):[a-z0-9][a-z0-9-]{0,111}$
type ProjectId = ASCII pattern ^project:[a-z0-9][a-z0-9-]{0,111}$
type CandidateId = ASCII pattern ^candidate:[a-z0-9][a-z0-9-]{0,109}$
type EvidenceId = ASCII pattern ^evidence:[a-z0-9][a-z0-9-]{0,108}$
type ClaimId = ASCII pattern ^claim:[a-z0-9][a-z0-9-]{0,111}$
type CitationId = ASCII pattern ^citation:[a-z0-9][a-z0-9-]{0,108}$
type Sha256 = exactly 64 lowercase hexadecimal characters
type Instant = RFC3339UtcString
type PlainText<N> = UTF8String[1..N bytes] with C0 controls except TAB/LF/CR forbidden
type PublicUrl = parsed absolute http|https URL; no userinfo; no fragment; <=2048 bytes
type Wgs84Point = exact { longitude:Number[-180..180]; latitude:Number[-90..90] }
type FiniteNumber = JSON number that is finite and does not encode negative zero
type SelectionGeneration = SafeInteger[1..9007199254740991]
type ExactSet<T,N> = JSON array[0..N] sorted by canonical UTF-8 value, unique
type ExactObject = JSON object whose decoder rejects every unknown or duplicate key
type ParsedHttpsOrigin = normalized ASCII `https://host` with port omitted because only 443 is legal
type NormalizedPath = ASCII path beginning `/`; dot segments, backslash and percent-encoded separators forbidden
type SecretBytes = server-only opaque Uint8Array[1..8192] with explicit zeroization and no serializer
```

All public JSON uses UTF-8, finite JSON numbers, canonical field names, exact arrays/objects, and duplicate-aware parsing before ordinary JSON decoding. `NaN`, infinity, prototype keys, duplicate keys, coercion, and unpaired surrogates reject. Public URL classification never grants evidence authority.

### CTR-030 — Generation-bound region asset and marker pack

The v0.12 region geometry graph is fully closed:

```text
type RegionFeaturePropertiesV3 = exact {
  regionId: RegionId
  name: PlainText<80>
  labelPoint: Wgs84Point
  sourceField: "REGC_code"
  sourceNameField: "REGC_name"
}

type PositionV3 = exact tuple [longitude:Number[-180..180], latitude:Number[-90..90]]
type LinearRingV3 = Array<4..20000,PositionV3> where first == last
type PolygonCoordinatesV3 = Array<1..2000,LinearRingV3>
type MultiPolygonCoordinatesV3 = Array<1..2000,PolygonCoordinatesV3>
type RegionFeatureV3 =
  | exact { type:"Feature"; id:RegionId; properties:RegionFeaturePropertiesV3;
            geometry:exact { type:"Polygon"; coordinates:PolygonCoordinatesV3 } }
  | exact { type:"Feature"; id:RegionId; properties:RegionFeaturePropertiesV3;
            geometry:exact { type:"MultiPolygon"; coordinates:MultiPolygonCoordinatesV3 } }
type RegionFeatureCollectionV3 = exact {
  type:"FeatureCollection"
  features:Array<17..17,RegionFeatureV3>
}

type RegionAssetManifestV2 = exact {
  schemaVersion: "gridlens.region-asset.v2"
  edition: "Stats NZ Regional Council 2023 (generalised), 12 nautical miles"
  sourceDatasetUrl: "https://datafinder.stats.govt.nz/layer/111182-regional-council-2023-generalised/"
  distributionUrl: "https://services.arcgis.com/XTtANUDT8Va4DLwI/arcgis/rest/services/Regional_Council_Boundary/FeatureServer/0"
  licence: "Creative Commons Attribution 4.0 International"
  attribution: "Stats NZ; distributed by Eagle Technology"
  generatedAt: Instant
  geometryPrecision: 5
  generalizationToleranceDegrees: 0.0005
  sha256: Sha256
  featureCount: 17
  regionIds: ExactSet<RegionId,17>
  releaseId: PlainText<80>
}

type MapMarkerV3 =
  | exact { kind:"existing_project"; markerId:MarkerId; projectId:ProjectId;
            name:PlainText<120>; regionId:RegionId; point:Wgs84Point;
            status:"operating"; sourceRecordId:EvidenceId }
  | exact { kind:"proposed_project"; markerId:MarkerId; projectId:ProjectId;
            name:PlainText<120>; regionId:RegionId; point:Wgs84Point;
            status:"proposed"|"consenting"|"construction"; sourceRecordId:EvidenceId }
  | exact { kind:"screened_candidate"; markerId:MarkerId; candidateId:CandidateId;
            name:PlainText<120>; regionId:RegionId; point:Wgs84Point;
            domainOutcome:"included"|"excluded"|"specialist_assessment_required"|
              "infrastructure_upgrade_required"|"insufficient_evidence";
            presentationGroup:"passes_declared_constraints"|"needs_investigation"|"excluded";
            sourceRecordId:EvidenceId }

type MarkerPackV3 = exact {
  schemaVersion:"gridlens.marker-pack.v3"
  releaseId:PlainText<80>
  sha256:Sha256
  markers:Array<0..5000,MapMarkerV3>
}
```

Region manifest, GeoJSON, and marker pack are immutable core release assets under the same release ID. Source codes `1`–`9` normalize once at build time to `01`–`09`; `12`–`18` and `99` remain byte-identical. The preparation build verifies source count, codes, names, geometry, label points, licence, and hashes. Active verified assets are cacheable and available offline; a failed candidate generation never replaces them.

### CTR-031 — Canonical selection intent, outcome, and receipt

```text
type SelectionSourceV3 = "polygon_pointer"|"polygon_keyboard"|"marker_pointer"|
  "marker_keyboard"|"accessible_list"|"search"|"coordinate"|"restore"

type RegionSelectionIntentV3 = exact {
  kind:"select_region"
  operationId:OperationId
  selectionGeneration:SelectionGeneration
  source:SelectionSourceV3
  requestedRegionId?:RegionId
  pointerPoint?:Wgs84Point
  markerId?:MarkerId
}

type CoordinateSelectionIntentV3 = exact {
  kind:"resolve_coordinate"
  operationId:OperationId
  selectionGeneration:SelectionGeneration
  source:"coordinate"
  point:Wgs84Point
}

type RegionSelectionV3 =
  | exact { kind:"selected_region"; regionId:RegionId; source:SelectionSourceV3;
            selectedMarkerId?:MarkerId; candidatePoint?:Wgs84Point;
            geometryEdition:PlainText<100>; selectedAt:Instant }
  | exact { kind:"unresolved_point"; point:Wgs84Point; source:"coordinate";
            reason:"outside_verified_regions"|"geometry_unavailable"; selectedAt:Instant }

type SelectionReceiptV3 = exact {
  schemaVersion:"gridlens.selection-receipt.v3"
  operationId:OperationId
  selectionGeneration:SelectionGeneration
  outcome:"accepted"|"stale_ignored"|"idempotent_replay"|"invalid"
  selection?:RegionSelectionV3
}
```

The selection store owns the monotonically increasing generation. Operation-ID replay returns the byte-identical receipt. Pointer/coordinate region IDs are derived by the pinned geometry engine from all matching polygons, with the lexicographically smallest `RegionId` winning shared-boundary ties; rendered feature order is never authority. Pointer intents require `pointerPoint` and forbid `requestedRegionId`; list/search/restore intents require `requestedRegionId`. Marker activation derives region from `MarkerPackV3`. Polygon/list/search selection always clears a selected marker. `GeographyIdV3` serializes exactly as `RegionId`; legacy opaque geography IDs migrate only through a frozen one-to-one table or quarantine.

### CTR-032 — Closed provider health and public route graph

```text
type ProviderClassV3 = "openai_compatible"|"tavily"|"remote_mcp"
type ProviderStateV3 = "ready"|"limited"|"unavailable"
type ProviderReasonV3 = "configured"|"not_configured"|"probe_timeout"|
  "authentication_rejected"|"quota_limited"|"invalid_response"|"policy_rejected"

type ProviderHealthEntryV3 = exact {
  providerClass:ProviderClassV3
  state:ProviderStateV3
  reason:ProviderReasonV3
  capabilities:ExactSet<"analysis"|"web_search"|"web_research",3>
}

type ProviderHealthResponseV3 = exact {
  schemaVersion:"gridlens.provider-health.v3"
  overall:ProviderStateV3
  providers:Array<1..3,ProviderHealthEntryV3>
  checkedAt:Instant
  cacheSeconds:SafeInteger[0..60]
}
```

There is exactly one entry per configured provider class in canonical class order. Legal capabilities are model -> analysis, Tavily -> web_search|web_research, MCP -> its pinned subset. `overall=ready` iff model is ready and every configured optional provider is ready; `limited` iff model is ready and any optional provider is limited/unavailable, or model is limited; otherwise unavailable.

`GET /api/v1/providers/health`, `POST /api/v1/research`, and `POST /api/v1/agent` are the only public provider routes. POST requires private Sites access plus exact browser `Origin` and `Sec-Fetch-Site:same-origin`; authorized local smoke clients use an explicit server-only test token and may omit browser headers. CORS is not enabled. Responses set `Cache-Control:no-store` except sanitized health (`private,max-age<=60`), `X-Content-Type-Options:nosniff`, `Referrer-Policy:no-referrer`, and a restrictive CSP on HTML.

### CTR-033 — Research, deterministic context, structured agent results

```text
type ResearchRequestV3 = exact {
  schemaVersion:"gridlens.research-request.v3"
  requestId:RequestId
  query:PlainText<500>
  regionId:RegionId
  scenarioId:ScenarioId
}

type ResearchCandidateV3 = exact {
  citationId:CitationId
  title:PlainText<240>
  url:PublicUrl
  excerpt:PlainText<900>
  retrievedAt:Instant
  sourceClass:"official_candidate"|"public_web_candidate"
}

type ResearchResponseV3 = exact {
  schemaVersion:"gridlens.research-response.v3"
  requestId:RequestId
  candidates:Array<0..4,ResearchCandidateV3>
  providerClass:"tavily"|"remote_mcp"
  partial:boolean
}

type DeterministicPromptContextV3 = exact {
  schemaVersion:"gridlens.prompt-context.v3"
  scenario:exact { scenarioId:ScenarioId; name:PlainText<120>; itCapacityMw:Number[0..10000];
    pue:Number[1..3]; utilizationRatio:Number[0..1]; concurrencyRatio:Number[0..1] }
  calculations:exact { addedPeakMw:Number[0..30000]; annualEnergyGwh:Number[0..300000];
    concurrentDemandMw:Number[0..30000]; maximumFlexibleLoadMw:Number[0..30000];
    formulaVersion:"gridlens-demo-1.0.0" }
  selection:RegionSelectionV3
  selectedCandidate?:exact { candidateId:CandidateId; domainOutcome:PlainText<80>;
    presentationGroup:PlainText<80>; reasons:Array<0..12,PlainText<320>> }
  trustedEvidenceIds:ExactSet<EvidenceId,64>
  contextFingerprint:Sha256
}

type AgentModeV3 = "analysis"|"site_profile"|"visual"|"guided_question"
type AgentRequestV3 = exact {
  schemaVersion:"gridlens.agent-request.v3"
  requestId:RequestId
  mode:AgentModeV3
  prompt:PlainText<4000>
  context:DeterministicPromptContextV3
  includeWebResearch:boolean
}

type AgentClaimV3 = exact {
  claimId:ClaimId
  kind:"source_statement"|"model_inference"|"uncertainty"|"recommendation"
  text:PlainText<1200>
  citationIds:ExactSet<CitationId,8>
}

type SiteProfileCandidateV3 = exact {
  kind:"site_profile_candidate"
  regionId:RegionId
  summary:PlainText<2000>
  strengths:Array<0..6,PlainText<300>>
  constraints:Array<0..6,PlainText<300>>
  missingEvidence:Array<0..8,PlainText<300>>
}

type VisualSpecCandidateV3 =
  | exact { kind:"bar_chart"|"line_chart"; title:PlainText<160>; xLabel:PlainText<80>;
            yLabel:PlainText<80>; series:Array<1..6,exact { name:PlainText<80>;
            values:Array<1..24,exact { label:PlainText<80>; value:FiniteNumber }> }>;
            sourceRecordIds:ExactSet<EvidenceId,32> }
  | exact { kind:"table"; title:PlainText<160>; columns:Array<1..8,PlainText<80>>;
            rows:Array<1..50,Array<1..8,PlainText<300>>>; sourceRecordIds:ExactSet<EvidenceId,32> }

type AgentResponseV3 = exact {
  schemaVersion:"gridlens.agent-response.v3"
  requestId:RequestId
  mode:AgentModeV3
  contextFingerprint:Sha256
  claims:Array<1..16,AgentClaimV3>
  citations:Array<0..12,ResearchCandidateV3>
  payload?:SiteProfileCandidateV3|VisualSpecCandidateV3
  providerClass:"openai_compatible"
  generatedAt:Instant
  partial:boolean
}
```

The Worker recomputes and validates `contextFingerprint`. When `includeWebResearch=true`, it performs the bounded research call inside the same operation, keeps raw candidates server-side, supplies only sanitized candidates to the model, and returns only citations actually referenced by structured claims. `/research` remains a standalone inspectable search surface; its candidates are never accepted by `/agent`. `official_candidate` is assigned only by a code-owned exact host registry and is still not verified evidence. The response must parse from the model's structured JSON into the exact requested mode; narrative text alone is invalid for `site_profile` or `visual`. A trusted client resolver independently validates visual values/lineage before rendering; no code/HTML/expression is legal.

### CTR-034 — Server-only provider policy, egress guard, and attempt budgets

```text
type AllowedProviderOriginV1 = server-only exact {
  providerClass:ProviderClassV3
  origin:ParsedHttpsOrigin
  basePath:NormalizedPath
  allowedPaths:ExactSet<NormalizedPath,8>
  allowedPort:443
  hostnamePolicy:"public_dns_name_only"
}

type PinnedMcpOperationV1 = server-only exact {
  publicOperation:"web_search"|"web_research"
  remoteToolName:PlainText<120>
  inputSchemaHash:Sha256
  outputSchemaHash:Sha256
}

type GridLensServerContractV1 = compile-time-only exact {
  model:AllowedProviderOriginV1 & { apiKey:SecretBytes; modelId:SecretBytes }
  tavily?:AllowedProviderOriginV1 & { apiKey:SecretBytes }
  mcp?:AllowedProviderOriginV1 & { credential?:SecretBytes;
    operations:Array<1..4,PinnedMcpOperationV1> }
  localSmokeToken?:SecretBytes
}
```

`GridLensServerContractV1`, secret bytes, endpoints, model IDs, request bodies, raw provider bodies, and reasoning are absent from every public schema/import graph. Config accepts only HTTPS DNS hostnames, rejects IP literals and known private/loopback/link-local/reserved host forms, userinfo, fragments, non-pinned ports, encoded-host ambiguity, and paths outside the exact path table. Deployment validation resolves approved hosts to public addresses; redirects are disabled. Because the Worker runtime does not expose the final socket address, the exact-origin allowlist plus deployment DNS validation is the accepted hackathon control; a provider hostname/DNS ownership change blocks redeployment and requires operator review.

Per public request there is one total outbound attempt per provider—no automatic POST retry and no reasoning retry—preventing double billing and ambiguous attempt accounting. Limits before allocation/while streaming are: research outbound request 16 KiB, raw research response 256 KiB, agent outbound request 96 KiB, raw model response 256 KiB, MCP request 16 KiB, raw MCP response 256 KiB. Timeouts are research/MCP 10 s and model 40 s. The isolate-wide in-flight cap is four; private access remains mandatory because this is not durable public rate limiting.

Before public serialization, the egress guard inspects every decoded leaf and the final serialized byte stream for every exact active secret, credential, model ID, full private endpoint, endpoint host/path/query component, authorization value, and declared credential-shaped pattern, including values split across adjacent fields/chunks. Any match discards the entire result and returns `invalid_upstream_response`; matches are never printed, logged, snapshotted, traced, redacted into partial output, or counted by value. The same guard covers health, research, agent, errors, diagnostics, screenshots, traces, and labels.

### CTR-035 — V3 registry, research cache, routes, and migration

```text
type RetrievalModeV3 = "prepared_asset"|"public_cors"|"server_provider"|"link_only"|"disabled"
type SourceRegistryEntryV3 = exact {
  sourceId:PlainText<80>
  label:PlainText<120>
  retrievalMode:RetrievalModeV3
  providerClass?:ProviderClassV3
  authorityPurpose:PlainText<240>
  licence:PlainText<200>
  attribution:PlainText<200>
}

type ResearchCacheRecordV3 = exact {
  schemaVersion:"gridlens.research-cache.v3"
  request:ResearchRequestV3
  response:ResearchResponseV3
  routeId:"server:tavily"|"server:mcp:web_search"|"server:mcp:web_research"
  responseHash:Sha256
  retrievedAt:Instant
  expiresAt:Instant
  refreshable:boolean
}

type WorkflowRouteV3 = "map"|"scenario"|"evaluation"|"evidence"|"agent"|"sources"

type PublicProviderErrorCodeV3 = "invalid_request"|"payload_too_large"|
  "provider_unavailable"|"research_unavailable"|"rate_limited"|
  "upstream_timeout"|"upstream_rejected"|"invalid_upstream_response"|
  "cancelled"|"internal_error"
type PublicApiErrorV3 = exact {
  schemaVersion:"gridlens.public-error.v3"
  error:exact { code:PublicProviderErrorCodeV3; message:PlainText<240>;
    retryable:boolean; correlationId:CorrelationId }
}
```

Tavily and remote MCP registry entries use `server_provider`; no V3 route or cache contains a connector ID, connector configuration, secret handle, destination acceptance, or connector-settings route. Migration deletes legacy credential/configuration material. A V2 research result may be retained only as `legacy_stale` inspectable content with refresh disabled and its former connector fields omitted; if its content/provenance cannot be proven without secret-bearing data it is quarantined. Scenario/result/preference records map legacy region identifiers through the frozen table or quarantine. New V3 cache records refresh only by reissuing their exact V3 request through the fixed server route.

### CTR-036 — Effective exported roots

```text
type GridLensPublicContractV3 = exact {
  regionManifest:RegionAssetManifestV2
  regionFeatures:RegionFeatureCollectionV3
  markerPack:MarkerPackV3
  selectionIntent:RegionSelectionIntentV3|CoordinateSelectionIntentV3
  selectionReceipt:SelectionReceiptV3
  providerHealth:ProviderHealthResponseV3
  researchRequest:ResearchRequestV3
  researchResponse:ResearchResponseV3
  agentRequest:AgentRequestV3
  agentResponse:AgentResponseV3
  publicError:PublicApiErrorV3
  sourceRegistryEntry:SourceRegistryEntryV3
  researchCache:ResearchCacheRecordV3
  workflowRoute:WorkflowRouteV3
}
```

Build-time TypeScript and strict JSON Schema generation starts at `GridLensPublicContractV3`, follows every transitive public reference, and rejects unresolved names, `any`, open objects/enums, ambiguous refinements, and every retired browser connector root. `GridLensServerContractV1` is checked by a separate server-only compile graph and is statically unreachable from React, RSC, client bundles, public schemas, structured-clone roots, and storage. Existing deterministic calculation, assessment, evidence, case, report, and trusted visual-resolution types are imported only through explicit adapter functions that use `RegionId` exactly and contain no connector types.

### v0.12 requirement trace

| Approved family | Effective contracts |
|---|---|
| FR-LOC-001–004, FR-MAP-001–004, AC-001/002/023 | CTR-029–031, CTR-036 |
| FR-CONN-001–008, AC-010–013 | CTR-032–036 |
| FR-AGT-001–011, AC-014/017/018/026 | CTR-033–036 plus explicit deterministic adapters |
| FR-VIZ-001–003, AC-015 | `VisualSpecCandidateV3`, trusted client resolver, CTR-036 |
| FR-SAVE-001–002, AC-020 | CTR-035 plus surviving non-secret storage adapters |
| NFR-PER-001, NFR-ACC-001 | CTR-030–031 load/selection/semantic fallback |
| NFR-SEC-001–002, NFR-PRI-001, NFR-OBS-001, AC-011/012/021 | CTR-032–036 exact origins, egress guard, closed schemas, safe logs |
| NFR-DEP-001, CON-004–007 | one private Sites Worker, generation-bound core assets, server-only graph |

## Version 0.12.1 blocker closure — effective full graph and exact refinements

This addendum is normative over CTR-029–036 and closes G3V12-001–006 without changing Gate 2 or ADR-013.

### CTR-037 — Complete deterministic graph and migration adapters

```text
type GridLensDeterministicContractV3 = exact {
  releaseManifest:ReleaseManifestV2
  dataPackManifest:DataPackManifestV2
  evidenceRecord:EvidenceRecordV2
  evidenceFact:EvidenceFact
  evidenceSnapshot:EvidenceSnapshot
  evidenceEdge:EvidenceEdgeV2
  evidenceGraphSnapshot:EvidenceGraphSnapshotV2
  projectCatalogRecord:ProjectCatalogRecordV2
  projectSheet:ProjectSheetV2
  trustedStatement:TrustedStatementV2
  unresolvedQuestion:UnresolvedQuestionV2
  missingVoiceRecord:MissingVoiceRecordV2
  companyIdentityRecord:CompanyIdentityRecordV2
  companyClaimRecord:CompanyClaimRecordV2
  communityRecord:CommunityRecordV2
  resultSnapshot:ResultSnapshotV2
  projectCase:ProjectCaseV2
  impactBrief:ImpactBriefV2
  impactBriefCopyOutcome:ImpactBriefCopyOutcomeV2
  siteProfile:SiteProfileCandidateV2
  siteScreening:CandidateScreeningV2
  sensitivityResult:SensitivityResultV2
  sitePresentation:SitePresentationPolicyV2
  trustedVisualSpec:VisualSpecV2
  trustedVisualOutcome:VisualOutcomeV2
  storedEnvelope:StoredEnvelopeV3
  updateState:UpdateGenerationState
  emiOutcome:EmiPublishOutcome
  diagnosticEvent:DiagnosticEventV2
}

type LegacyRegionIdentityV3 = RegionId | `region:${RegionId}` | `geo_${RegionId}`
type RegionIdentityMigrationV3 =
  | exact { outcome:"mapped"; input:LegacyRegionIdentityV3; regionId:RegionId }
  | exact { outcome:"quarantined"; inputHash:Sha256; reason:"unknown_geography_identity" }

type DeterministicAdapterReceiptV3 = exact {
  adapter:"result"|"evidence"|"case"|"brief"|"site_profile"|"screening"|
    "visual"|"route"|"storage"|"emi"
  inputSchemaVersion:SafeInteger
  outputSchemaVersion:3
  regionMigrations:Array<0..256,RegionIdentityMigrationV3>
  inputHash:Sha256
  outputHash?:Sha256
  outcome:"adapted"|"quarantined"
}
```

The V3 generator exports the complete `GridLensDeterministicContractV3` transitive closure alongside CTR-029–042. Each named adapter decodes its exact legacy input, replaces every geography occurrence only through `RegionIdentityMigrationV3`, validates all internal references/hashes again, and emits `DeterministicAdapterReceiptV3`. `RegionId`, `region:RegionId`, and `geo_RegionId` are the only mappable spellings; everything else quarantines the whole containing record. Unlisted V2 roots and all connector/credential/acceptance/tool-routing roots fail compilation. Current V3 records contain `RegionId` directly and never run a migration adapter.

`GridLensPublicContractV3` is amended with `deterministic:GridLensDeterministicContractV3` and `adapterReceipt:DeterministicAdapterReceiptV3`. `StoredEnvelopeV3` is the surviving V2 non-secret envelope with current payloads restricted to V3 deterministic/cache/route roots; it has no connector/configuration/secret variant.

### CTR-038 — Legal selection and marker unions

```text
type CallerSelectionIntentV3 =
  | exact { kind:"polygon_pointer"; operationId:OperationId; point:Wgs84Point }
  | exact { kind:"polygon_keyboard"; operationId:OperationId; regionId:RegionId }
  | exact { kind:"marker_pointer"; operationId:OperationId; markerId:MarkerId }
  | exact { kind:"marker_keyboard"; operationId:OperationId; markerId:MarkerId }
  | exact { kind:"accessible_list"; operationId:OperationId; regionId:RegionId }
  | exact { kind:"search"; operationId:OperationId; regionId:RegionId }
  | exact { kind:"restore"; operationId:OperationId; regionId:RegionId }
  | exact { kind:"coordinate"; operationId:OperationId; point:Wgs84Point }

type StampedSelectionCommandV3 = exact {
  intent:CallerSelectionIntentV3
  selectionGeneration:SelectionGeneration
  canonicalIntentHash:Sha256
}
```

Only the selection store can produce `StampedSelectionCommandV3`; it is not an API/UI input. `CallerSelectionIntentV3` replaces the CTR-031 option bag. Each marker pack is canonically sorted by `markerId`; `markerId`, `projectId`, and `candidateId` are unique in their applicable namespaces. Existing/proposed project variants require `markerId==projectId` and a `project:` prefix. Screened candidates require `markerId==candidateId` and a `candidate:` prefix. Every marker point resolves inside its declared `regionId` under the pinned geometry engine or the whole pack rejects.

### CTR-039 — Lossless agent context and trusted mode payloads

```text
type PromptStageV3 = "map"|"scenario"|"result"|"comparison"|"evidence"|
  "project_case"|"impact_brief"

type TrustedContextRecordV3 =
  | exact { kind:"deterministic_value"; recordId:EvidenceId; fieldPath:PlainText<160>;
      label:PlainText<120>; value:FiniteNumber|PlainText<1200>|boolean;
      unit?:PlainText<40>; origin:"user_input"|"prepared_data"|"calculation";
      authority:"deterministic"; freshness:PlainText<80>; snapshotHash:Sha256 }
  | exact { kind:"evidence_statement"; recordId:EvidenceId; title:PlainText<240>;
      text:PlainText<2400>; sourceUrl?:PublicClickableUrlV3;
      authority:PlainText<80>; freshness:PlainText<80>; origin:PlainText<80>;
      snapshotHash:Sha256 }
  | exact { kind:"required_disclaimer"; recordId:EvidenceId; text:PlainText<1200>;
      snapshotHash:Sha256 }

type ScenarioPromptSnapshotV3 = exact {
  scenarioId:ScenarioId
  name:PlainText<120>
  itCapacityMw:Number[0..100000]
  pue:Number[1..5]
  utilizationRatio:Number[0..1]
  flexibleWorkloadRatio:Number[0..1]
  concurrencyRatio:Number[0..1]
  addedPeakMw:Number[0..500000]
  annualEnergyGwh:Number[0..4380000]
  maximumFlexibleLoadMw:Number[0..500000]
  formulaVersion:PlainText<80>
}

type DeterministicPromptContextV4 = exact {
  schemaVersion:"gridlens.prompt-context.v4"
  stage:PromptStageV3
  scenario:ScenarioPromptSnapshotV3
  selection:RegionSelectionV3
  selectedResultId?:PlainText<120>
  selectedComparisonId?:PlainText<120>
  selectedCaseId?:PlainText<120>
  selectedBriefId?:PlainText<120>
  selectedCandidateId?:CandidateId
  assessmentOutcome?:PlainText<80>
  records:Array<1..128,TrustedContextRecordV3>
  contextFingerprint:Sha256
}

type AgentClaimKindV4 = "source_statement"|"model_inference"|"uncertainty"|
  "unresolved_conflict"|"unsupported"|"recommendation"

type ConfirmableSiteProfileV3 = exact {
  kind:"site_profile_candidate"
  profileVersion:"gridlens.site-profile.v3"
  facilityRequirements:Array<1..20,exact { criterionId:PlainText<80>;
    field:PlainText<120>; operator:"eq"|"lte"|"gte"|"one_of";
    value:FiniteNumber|PlainText<240>|boolean; unit?:PlainText<40> }>
  hardConstraints:Array<0..20,PlainText<80>>
  preferences:Array<0..20,PlainText<80>>
  peoplePlanetPriorities:Array<0..20,exact { criterionId:PlainText<80>;
    priority:SafeInteger[1..5] }>
  requiresUserConfirmation:true
}

type GuidedStateV3 = exact {
  kind:"guided_state"
  step:"relationship_location"|"issue"|"evidence_explanation"|"what_remains_unclear"|"complete"
  prompt:PlainText<600>
  supportedTopics:ExactSet<"electricity"|"water"|"jobs"|"environment"|"noise_air"|
    "ownership"|"uncertainty",7>
  storesPersonalFeedback:false
}

type TrustedVisualBindingV3 = exact {
  bindingId:PlainText<80>
  contextRecordId:EvidenceId
  fieldPath:PlainText<160>
  expectedSnapshotHash:Sha256
  unit?:PlainText<40>
}

type VisualSpecCandidateV4 = exact {
  kind:"bar_chart"|"line_chart"|"table"|"metric"|"narrative_panel"
  title:PlainText<160>
  bindings:Array<1..64,TrustedVisualBindingV3>
  layout:exact { xBindingIds:Array<0..24,PlainText<80>>;
    series:Array<0..8,exact { name:PlainText<80>; bindingIds:Array<1..24,PlainText<80>> }> }
  accessibleSummary:PlainText<1200>
}
```

`AgentRequestV3.context` is replaced by `DeterministicPromptContextV4`. Agent response claims use `AgentClaimKindV4`. Mode `site_profile` requires only `ConfirmableSiteProfileV3`; `guided_question` requires only `GuidedStateV3`; `visual` requires only `VisualSpecCandidateV4`; `analysis` forbids a payload. The model supplies bindings, never authoritative visual numbers. The trusted resolver loads each exact context record, verifies snapshot hash/field/unit, obtains the value, and rejects every missing, unrelated, or mutated binding before rendering. All context records and required disclaimers sent to the model are visible in the disclosure UI.

### CTR-040 — Full registry, route, cache, and migration state

```text
type SourceRegistryEntryV4 = exact {
  sourceId:PlainText<80>; exactShippedName:PlainText<160>; publisherAuthority:PlainText<160>
  shippedState:"enabled"|"prepared-only"|"link-only"|"agent-only"|"disabled"
  disabledReason?:PlainText<240>
  supportedFields:Array<0..128,PlainText<120>>
  retrievalMode:RetrievalModeV3; providerClass?:ProviderClassV3
  origin:PlainText<240>; method:"GET"|"POST"|"prepared"
  authentication:"none"|"operator_secret"|"subscription"
  cors:"required_pass"|"not_applicable"|"link_only"
  licence:PlainText<240>; attribution:PlainText<240>; permittedPurpose:PlainText<320>
  quota:PlainText<160>; refreshCadence:PlainText<160>
  spatialResolution:PlainText<160>; temporalResolution:PlainText<160>
  fallback:PlainText<320>; adapterVersion:PlainText<80>; freshnessPolicyId:PlainText<80>
}

type WorkflowRouteStateV3 =
  | exact { page:"map"; regionId?:RegionId; markerId?:MarkerId }
  | exact { page:"scenario"; scenarioId:ScenarioId; regionId?:RegionId }
  | exact { page:"evaluation"; resultSnapshotId:PlainText<120>; regionId:RegionId;
      candidateId?:CandidateId }
  | exact { page:"comparison"; comparisonSnapshotId:PlainText<120> }
  | exact { page:"evidence"; evidenceId:EvidenceId; snapshotHash:Sha256 }
  | exact { page:"project_case"; projectId:ProjectId; caseSnapshotId:Sha256;
      section:PlainText<80> }
  | exact { page:"impact_brief"; briefId:PlainText<120>; briefSnapshotId:Sha256 }
  | exact { page:"agent"; stage:PromptStageV3; contextFingerprint:Sha256 }
  | exact { page:"sources" }

type CurrentResearchCacheV4 = exact {
  kind:"current"; request:ResearchRequestV3; response:ResearchResponseV3
  routeId:"server:tavily"|"server:mcp:web_search"|"server:mcp:web_research"
  responseHash:Sha256; retrievedAt:Instant; expiresAt:Instant; refreshable:true
}
type LegacyResearchCacheV4 = exact {
  kind:"legacy_stale"; legacyRecordHash:Sha256; sanitizedQuery:PlainText<500>
  sanitizedCandidates:Array<0..4,ResearchCandidateV3>; retrievedAt:Instant
  refreshable:false; reason:"connector_retired"
}
type ResearchCacheRecordV4 = CurrentResearchCacheV4|LegacyResearchCacheV4
```

The registry compiler requires the exact approved 17 names and unique IDs; conditional legality ties `agent-only` to `server_provider`, `providerClass` to server-provider rows, and disabled reason to disabled state. A current cache route must match its response provider class; `responseHash` hashes the canonical response with no omitted field, and `retrievedAt < expiresAt`. Only current records refresh. `WorkflowRouteStateV3`, `ResearchCacheRecordV4`, and migration/quarantine receipts replace CTR-035's abbreviated variants and are exported from `GridLensPublicContractV3`.

### CTR-041 — Safe clickable public URL

```text
type PublicClickableUrlV3 = normalized absolute https URL with:
  DNS hostname only; port absent or 443; no userinfo/fragment;
  hostname not localhost and not `.localhost`, `.local`, `.internal` or home.arpa;
  no IPv4/IPv6 literal and no private/loopback/link-local/reserved hostname form;
  <=2048 UTF-8 bytes
```

Every research/citation/cache/DOM/copy/export URL uses `PublicClickableUrlV3`, not `PublicUrl`. Unsafe upstream URLs discard that candidate; if referenced by a claim, the whole structured response rejects. Browser links additionally use `rel="noopener noreferrer"`. URLs are never fetched by the browser or Worker merely because they are returned.

### CTR-042 — Content-addressed spatial release manifest

```text
type CoreAssetBindingV3 = exact {
  assetId:"regions.geojson"|"markers.json"
  schemaVersion:"gridlens.regions.v3"|"gridlens.markers.v3"
  byteLength:SafeInteger[1..2097152]
  sha256:Sha256
}
type SpatialReleaseManifestV3 = exact {
  schemaVersion:"gridlens.spatial-release.v3"
  releaseId:PlainText<80>
  regionSource:RegionAssetManifestV2 minus sha256 and releaseId
  assets:Array<2..2,CoreAssetBindingV3> canonically ordered by assetId
  manifestHash:Sha256
}
```

`manifestHash` hashes the canonical manifest with only `manifestHash` omitted. Asset hashes cover exact file bytes with no field omission; asset files do not self-declare trusted hashes or release IDs. Activation first verifies the manifest hash, then exact asset IDs/schema versions/lengths/hashes, then parses and cross-validates geometry/marker IDs. Only the manifest supplies release identity. Mixing individually valid assets from another release fails a manifest binding before activation; cached rollback stores the complete manifest plus both exact assets.

### CTR-043 — Exact non-secret current storage envelope

```text
type StoredPayloadV3 =
  | exact { store:"scenario"; value:ScenarioStorePayloadV2; regionMigrations:Array<0..64,RegionIdentityMigrationV3> }
  | exact { store:"result"; value:ResultSnapshotV2; regionMigrations:Array<0..64,RegionIdentityMigrationV3> }
  | exact { store:"comparison"; value:ComparisonSnapshotV2; regionMigrations:Array<0..128,RegionIdentityMigrationV3> }
  | exact { store:"evidence"; value:EvidenceSnapshot; regionMigrations:Array<0..64,RegionIdentityMigrationV3> }
  | exact { store:"project_case"; value:ProjectCaseV2; regionMigrations:Array<0..128,RegionIdentityMigrationV3> }
  | exact { store:"impact_brief"; value:ImpactBriefV2; regionMigrations:Array<0..128,RegionIdentityMigrationV3> }
  | exact { store:"site_profile"; value:ConfirmedSiteProfile; regionMigrations:Array<0..64,RegionIdentityMigrationV3> }
  | exact { store:"site_screening"; value:CandidateScreeningV2; regionMigrations:Array<0..64,RegionIdentityMigrationV3> }
  | exact { store:"trusted_visual"; value:VisualOutcomeV2; regionMigrations:Array<0..64,RegionIdentityMigrationV3> }
  | exact { store:"research_cache"; value:ResearchCacheRecordV4 }
  | exact { store:"route"; value:WorkflowRouteStateV3 }
  | exact { store:"prompt_history"; value:PromptHistoryRecordV2 }
  | exact { store:"migration_receipt"; value:MigrationReceipt }
  | exact { store:"operation_receipt"; value:StorageReceipt }
  | exact { store:"quarantine"; value:QuarantineRecord }
  | exact { store:"preference"; key:"audience"; value:"public"|"decision_maker" }
  | exact { store:"preference"; key:"lens"; value:"people"|"planet" }
  | exact { store:"preference"; key:"reduced_motion"; value:boolean }

type StoredEnvelopeV3 =
  | exact { schemaVersion:3; recordId:PlainText<160>; revision:SafeInteger[1..9007199254740991];
      createdAt:Instant; updatedAt:Instant; state:"live"; payload:StoredPayloadV3;
      payloadHash:Sha256 }
  | exact { schemaVersion:3; recordId:PlainText<160>; revision:SafeInteger[1..9007199254740991];
      store:"scenario"|"result"|"comparison"|"evidence"|"project_case"|"impact_brief"|
        "site_profile"|"site_screening"|"trusted_visual"|"research_cache"|"route"|
        "prompt_history"|"migration_receipt"|"operation_receipt"|"quarantine"|"preference";
      createdAt:Instant; updatedAt:Instant; state:"tombstone"; deletedAt:Instant;
      priorPayloadHash:Sha256 }
```

`payloadHash` is SHA-256 over the canonical `StoredPayloadV3` bytes. A live envelope has no deletion fields; a tombstone has no payload and retains the exact deleted store class. Store and payload discriminants must agree. Scenario bytes round-trip through `ScenarioStorePayloadV2`, results through their separate `ResultSnapshotV2` variant, and comparisons through the complete `ComparisonSnapshotV2`. Prompt history is legal only when its existing opt-in policy enables it. Provider configuration, credentials, endpoints, model IDs, connector/vault/acceptance records, server configuration, raw provider content, and arbitrary JSON have no legal variant. Legacy V2 records first pass their named CTR-037 adapter; only the validated adapter output and receipt can be wrapped as a current live envelope. Unknown geography or connector-bearing legacy payloads quarantine and never enter `StoredEnvelopeV3`.
