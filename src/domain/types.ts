export type EvidenceFreshness = "prepared_current" | "prepared_stale" | "unknown";

export type EvidenceCoverage = "complete" | "partial" | "missing";

export type SiteDomainOutcome =
  | "excluded"
  | "specialist_assessment_required"
  | "infrastructure_upgrade_required"
  | "insufficient_evidence"
  | "included";

export type SitePresentationGroup =
  | "passes_declared_constraints"
  | "needs_investigation"
  | "excluded";

export interface PreparedEvidenceStatus {
  readonly kind: "prepared_demonstration_evidence";
  readonly asOf: string;
  readonly freshness: EvidenceFreshness;
  readonly coverage: EvidenceCoverage;
  readonly coveragePercent: number;
  readonly notice: string;
}

export interface SiteCandidate {
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly preparedConnectionCapacityMw: number;
  readonly evidence: PreparedEvidenceStatus;
  readonly signals: {
    readonly exclusion?: string;
    readonly specialistAssessment?: string;
  };
}

export type CoolingMethod =
  | "air"
  | "evaporative"
  | "direct_liquid"
  | "hybrid"
  | "unknown";

export interface ScenarioInput {
  readonly name?: string;
  readonly itCapacityMw: number | string;
  readonly pue: number | string;
  readonly utilizationRatio: number | string;
  readonly concurrencyRatio: number | string;
  readonly coolingMethod?: CoolingMethod;
  readonly targetNetworkGbps?: number | string;
  readonly permanentJobs?: number | string;
  readonly regionalInvestmentNzdM?: number | string;
}

export interface NormalizedScenario {
  readonly name: string;
  readonly itCapacityMw: number;
  readonly pue: number;
  readonly utilizationRatio: number;
  readonly concurrencyRatio: number;
  readonly coolingMethod: CoolingMethod;
  readonly targetNetworkGbps: number;
  readonly permanentJobs: number;
  readonly regionalInvestmentNzdM: number;
}

export interface ScenarioCalculations {
  readonly addedPeakMw: number;
  readonly annualEnergyGwh: number;
  readonly concurrentDemandMw: number;
  readonly maximumFlexibleLoadMw: number;
  readonly formulaVersion: "gridlens-demo-1.0.0";
}

export type AssessmentReasonCode =
  | "declared_exclusion_constraint"
  | "specialist_assessment_signal"
  | "prepared_capacity_below_added_peak"
  | "prepared_evidence_incomplete"
  | "declared_constraints_passed";

export interface AssessmentReason {
  readonly code: AssessmentReasonCode;
  readonly message: string;
}

export interface SiteAssessment {
  readonly candidate: SiteCandidate;
  readonly domainOutcome: SiteDomainOutcome;
  readonly presentationGroup: SitePresentationGroup;
  readonly capacityMarginMw: number;
  readonly reasons: readonly AssessmentReason[];
}

export interface GroupedSiteAssessments {
  readonly passes_declared_constraints: readonly SiteAssessment[];
  readonly needs_investigation: readonly SiteAssessment[];
  readonly excluded: readonly SiteAssessment[];
}

export interface EvaluationResult {
  readonly kind: "prepared_demo_evaluation";
  readonly normalizedScenario: NormalizedScenario;
  readonly calculations: ScenarioCalculations;
  readonly assessments: readonly SiteAssessment[];
  readonly groups: GroupedSiteAssessments;
  readonly notices: readonly string[];
}
