import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateScenario, type ScenarioInput } from "../src/domain/index";
import {
  ASSESSMENT_PRESENTATION,
  createStoredEvaluation,
  initialWorkflowState,
  PROGRESS_STAGES,
  scenarioReadiness,
  verifyStoredEvaluation,
  workflowReducer,
  type EvaluationRunCore,
} from "../src/client/evaluationWorkflow";

const validScenario: ScenarioInput = {
  name: "AI compute campus",
  itCapacityMw: 65,
  pue: 1.2,
  utilizationRatio: 0.8,
  concurrencyRatio: 0.3,
  coolingMethod: "hybrid",
  targetNetworkGbps: 100,
  permanentJobs: 50,
  regionalInvestmentNzdM: 200,
};

describe("scenario-first evaluation workflow", () => {
  it("uses authoritative normalization and requires explicit scenario declarations", () => {
    assert.equal(scenarioReadiness(validScenario).ready, true);
    assert.match(scenarioReadiness({ ...validScenario, name: " " }).guidance ?? "", /name/i);
    assert.match(scenarioReadiness({ ...validScenario, coolingMethod: "unknown" }).guidance ?? "", /cooling/i);
    assert.match(scenarioReadiness({ ...validScenario, permanentJobs: 12.5 }).guidance ?? "", /whole number/i);
    assert.match(scenarioReadiness({ ...validScenario, pue: 9 }).guidance ?? "", /pue/i);
  });

  it("maps the three internal groups to fixed plain-language explanations", () => {
    assert.deepEqual(ASSESSMENT_PRESENTATION, {
      passes_declared_constraints: {
        label: "Meets scenario",
        explanation: "No blocking issue appears in the current prepared evidence.",
      },
      needs_investigation: {
        label: "More evidence needed",
        explanation: "A specialist check, infrastructure change, or evidence gap remains.",
      },
      excluded: {
        label: "Does not meet scenario",
        explanation: "A declared constraint blocks this scenario in the current prepared evidence.",
      },
    });
    assert.deepEqual(PROGRESS_STAGES, [
      "Collecting region information",
      "Calculating scenario impacts",
      "Synthesising evaluation",
    ]);
  });

  it("rejects stale stages, requires analysis success, and recovers from failure", () => {
    const run: EvaluationRunCore = {
      runId: 1,
      workflowGeneration: 0,
      scenarioFingerprint: "a".repeat(64),
      regionId: "15",
      candidateId: "demo-southland-invercargill",
      selectionGeneration: 1,
      screeningHash: "b".repeat(64),
      evidenceSnapshotId: "c".repeat(64),
      releaseManifestHash: "d".repeat(64),
      analysisAsOf: "2026-07-31T12:00:00.000Z",
    };

    const started = workflowReducer(initialWorkflowState, {
      type: "start",
      expectedGeneration: 0,
      run,
    });
    assert.equal(started.kind, "evaluating");
    assert.equal(workflowReducer(started, {
      type: "stage",
      workflowGeneration: 0,
      runId: 999,
      expectedStage: 0,
      nextStage: 1,
    }), started);

    const stageOne = workflowReducer(started, {
      type: "stage",
      workflowGeneration: 0,
      runId: 1,
      expectedStage: 0,
      nextStage: 1,
    });
    const premature = workflowReducer(stageOne, {
      type: "finish",
      workflowGeneration: 0,
      runId: 1,
    });
    assert.equal(premature, stageOne);

    const failed = workflowReducer(stageOne, {
      type: "analysis_terminal",
      workflowGeneration: 0,
      runId: 1,
      outcome: { status: "failed", guidance: "Evaluation could not be completed." },
    });
    assert.deepEqual(failed, {
      kind: "scenario",
      workflowGeneration: 1,
      guidance: "Evaluation could not be completed.",
    });
    assert.equal(workflowReducer(failed, {
      type: "invalidate",
      expectedGeneration: 0,
    }), failed);
  });

  it("restores only a receipt matching the exact scenario and prepared result", async () => {
    const evaluation = evaluateScenario(validScenario);
    const assessment = evaluation.assessments.find(({ candidate }) => candidate.region === "Southland");
    assert.ok(assessment);
    const stored = await createStoredEvaluation({
      runId: 7,
      workflowGeneration: 2,
      selectionGeneration: 3,
      scenarioInput: validScenario,
      regionId: "15",
      assessment,
      evaluation,
    });

    assert.equal(await verifyStoredEvaluation(stored, {
      scenarioInput: validScenario,
      regionId: "15",
      selectionGeneration: 3,
      assessment,
      evaluation,
    }), true);
    assert.equal(await verifyStoredEvaluation(stored, {
      scenarioInput: { ...validScenario, itCapacityMw: 66 },
      regionId: "15",
      selectionGeneration: 3,
      assessment: evaluateScenario({ ...validScenario, itCapacityMw: 66 }).assessments.at(-1)!,
      evaluation: evaluateScenario({ ...validScenario, itCapacityMw: 66 }),
    }), false);
    assert.equal(await verifyStoredEvaluation({ ...stored, payloadHash: "0".repeat(64) }, {
      scenarioInput: validScenario,
      regionId: "15",
      selectionGeneration: 3,
      assessment,
      evaluation,
    }), false);
    assert.equal(await verifyStoredEvaluation(stored, {
      scenarioInput: validScenario,
      regionId: "15",
      selectionGeneration: 4,
      assessment,
      evaluation,
    }), false);
  });
});
