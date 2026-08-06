import type {
  GroupedSiteAssessments,
  ScenarioCalculations,
  SiteAssessment,
  SiteCandidate,
  SiteDomainOutcome,
  SitePresentationGroup,
} from "./types";

const round = (value: number, decimalPlaces = 6): number => {
  const scale = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * scale) / scale;
};

export const presentationGroupFor = (
  outcome: SiteDomainOutcome,
): SitePresentationGroup => {
  switch (outcome) {
    case "excluded":
      return "excluded";
    case "included":
      return "passes_declared_constraints";
    case "specialist_assessment_required":
    case "infrastructure_upgrade_required":
    case "insufficient_evidence":
      return "needs_investigation";
  }
};

export const assessSite = (
  candidate: SiteCandidate,
  calculations: ScenarioCalculations,
): SiteAssessment => {
  const capacityMarginMw = round(
    candidate.preparedConnectionCapacityMw - calculations.addedPeakMw,
  );

  let domainOutcome: SiteDomainOutcome;
  let reasons: SiteAssessment["reasons"];

  if (candidate.signals.exclusion) {
    domainOutcome = "excluded";
    reasons = [
      {
        code: "declared_exclusion_constraint",
        message: candidate.signals.exclusion,
      },
    ];
  } else if (candidate.signals.specialistAssessment) {
    domainOutcome = "specialist_assessment_required";
    reasons = [
      {
        code: "specialist_assessment_signal",
        message: candidate.signals.specialistAssessment,
      },
    ];
  } else if (capacityMarginMw < 0) {
    domainOutcome = "infrastructure_upgrade_required";
    reasons = [
      {
        code: "prepared_capacity_below_added_peak",
        message: `Prepared capacity envelope is ${Math.abs(capacityMarginMw)} MW below the scenario's added peak.`,
      },
    ];
  } else if (
    candidate.evidence.coverage !== "complete" ||
    candidate.evidence.freshness !== "prepared_current"
  ) {
    domainOutcome = "insufficient_evidence";
    reasons = [
      {
        code: "prepared_evidence_incomplete",
        message: `Prepared evidence is ${candidate.evidence.coverage} with ${candidate.evidence.freshness.replace("_", " ")} freshness.`,
      },
    ];
  } else {
    domainOutcome = "included";
    reasons = [
      {
        code: "declared_constraints_passed",
        message:
          "The candidate passes the declared demonstration constraints; this is not development approval or a live capacity offer.",
      },
    ];
  }

  return Object.freeze({
    candidate,
    domainOutcome,
    presentationGroup: presentationGroupFor(domainOutcome),
    capacityMarginMw,
    reasons: Object.freeze(reasons),
  });
};

const coverageOrder = { complete: 0, partial: 1, missing: 2 } as const;

const compareWithinGroup = (left: SiteAssessment, right: SiteAssessment): number => {
  const coverageDifference =
    coverageOrder[left.candidate.evidence.coverage] -
    coverageOrder[right.candidate.evidence.coverage];
  if (coverageDifference !== 0) {
    return coverageDifference;
  }

  const capacityDifference = right.capacityMarginMw - left.capacityMarginMw;
  if (capacityDifference !== 0) {
    return capacityDifference;
  }

  return left.candidate.id.localeCompare(right.candidate.id);
};

/**
 * Orders candidates only after classification, inside one presentation group.
 * The return type intentionally has no combined array or cross-group rank.
 */
export const groupEvaluationsWithinPresentation = (
  assessments: readonly SiteAssessment[],
): GroupedSiteAssessments => {
  const groups: Record<SitePresentationGroup, SiteAssessment[]> = {
    passes_declared_constraints: [],
    needs_investigation: [],
    excluded: [],
  };

  for (const assessment of assessments) {
    groups[assessment.presentationGroup].push(assessment);
  }

  return Object.freeze({
    passes_declared_constraints: Object.freeze(
      groups.passes_declared_constraints.sort(compareWithinGroup),
    ),
    needs_investigation: Object.freeze(
      groups.needs_investigation.sort(compareWithinGroup),
    ),
    excluded: Object.freeze(groups.excluded.sort(compareWithinGroup)),
  });
};
