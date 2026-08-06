import { DEMO_SITES, PREPARED_DEMO_EVIDENCE_NOTICE } from "../data/demo-sites";
import {
  assessSite,
  groupEvaluationsWithinPresentation,
} from "./assessment";
import { calculateScenario, normalizeScenario } from "./scenario";
import type { EvaluationResult, ScenarioInput, SiteCandidate } from "./types";

export { DEMO_SITES, PREPARED_DEMO_EVIDENCE_NOTICE } from "../data/demo-sites";
export {
  assessSite,
  groupEvaluationsWithinPresentation,
  presentationGroupFor,
} from "./assessment";
export { calculateScenario, normalizeScenario } from "./scenario";
export { buildImpactPlots } from "./impact-plots";
export type {
  ImpactPlotModel,
  ImpactPlotRow,
  ImpactPlotRowState,
  ImpactPlotStatus,
} from "./impact-plots";
export type {
  AssessmentReason,
  AssessmentReasonCode,
  CoolingMethod,
  EvaluationResult,
  EvidenceCoverage,
  EvidenceFreshness,
  GroupedSiteAssessments,
  NormalizedScenario,
  PreparedEvidenceStatus,
  ScenarioCalculations,
  ScenarioInput,
  SiteAssessment,
  SiteCandidate,
  SiteDomainOutcome,
  SitePresentationGroup,
} from "./types";

export const evaluateScenario = (
  input: ScenarioInput,
  sites: readonly SiteCandidate[] = DEMO_SITES,
): EvaluationResult => {
  const normalizedScenario = normalizeScenario(input);
  const calculations = calculateScenario(normalizedScenario);
  const assessments = Object.freeze(
    sites.map((candidate) => assessSite(candidate, calculations)),
  );

  return Object.freeze({
    kind: "prepared_demo_evaluation",
    normalizedScenario,
    calculations,
    assessments,
    groups: groupEvaluationsWithinPresentation(assessments),
    notices: Object.freeze([
      PREPARED_DEMO_EVIDENCE_NOTICE,
      "Presentation groups are separate. Ordering occurs within a group only and is not a national site ranking.",
    ]),
  });
};
