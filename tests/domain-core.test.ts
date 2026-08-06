import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEMO_SITES,
  evaluateScenario,
  presentationGroupFor,
} from "../src/domain/index";
import type { SiteAssessment } from "../src/domain/index";

const southlandFixture = {
  name: "Southland 50 MW fixture",
  itCapacityMw: 50,
  pue: 1.3,
  utilizationRatio: 0.8,
  concurrencyRatio: 0.3,
} as const;

describe("deterministic GridLens domain core", () => {
  it("reproduces the frozen 65 MW scenario calculations", () => {
    const { calculations } = evaluateScenario(southlandFixture);

    assert.equal(calculations.addedPeakMw, 65);
    assert.equal(calculations.annualEnergyGwh, 455.52);
    assert.equal(calculations.concurrentDemandMw, 19.5);
    assert.equal(calculations.maximumFlexibleLoadMw, 19.5);
  });

  it("maps all five domain outcomes to the three exact presentation groups", () => {
    assert.equal(presentationGroupFor("included"), "passes_declared_constraints");
    assert.equal(presentationGroupFor("excluded"), "excluded");
    assert.equal(
      presentationGroupFor("specialist_assessment_required"),
      "needs_investigation",
    );
    assert.equal(
      presentationGroupFor("infrastructure_upgrade_required"),
      "needs_investigation",
    );
    assert.equal(
      presentationGroupFor("insufficient_evidence"),
      "needs_investigation",
    );
  });

  it("keeps candidates in separate groups with no cross-group rank", () => {
    const result = evaluateScenario(southlandFixture);
    const groupedIds = Object.values(result.groups)
      .flat()
      .map((assessment) => assessment.candidate.id);

    assert.equal(groupedIds.length, DEMO_SITES.length);
    assert.equal(new Set(groupedIds).size, DEMO_SITES.length);
    assert.ok(result.groups.passes_declared_constraints.length > 0);
    assert.ok(result.groups.needs_investigation.length > 0);
    assert.ok(result.groups.excluded.length > 0);
    assert.equal("rank" in result, false);
    assert.equal("overallOrder" in result.groups, false);
    for (const group of Object.values(result.groups)) {
      assert.equal(
        group.every((item: SiteAssessment) => "rank" in item === false),
        true,
      );
    }
  });

  it("returns a complete evaluation shape covering every exact outcome", () => {
    const result = evaluateScenario(southlandFixture);
    const outcomes = new Set(result.assessments.map((item) => item.domainOutcome));

    assert.equal(result.kind, "prepared_demo_evaluation");
    assert.equal(result.normalizedScenario.name, southlandFixture.name);
    assert.equal(result.assessments.length, 16);
    assert.deepEqual(
      [...outcomes].sort(),
      [
        "excluded",
        "included",
        "infrastructure_upgrade_required",
        "insufficient_evidence",
        "specialist_assessment_required",
      ].sort(),
    );
    assert.equal(
      result.assessments.every(
        (assessment) =>
          assessment.reasons.length > 0 &&
          assessment.candidate.evidence.kind === "prepared_demonstration_evidence",
      ),
      true,
    );
  });
});
