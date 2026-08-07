import { normalizeScenario } from "../domain/scenario";
import type {
  EvaluationResult,
  NormalizedScenario,
  ScenarioInput,
  SiteAssessment,
  SitePresentationGroup,
} from "../domain/types";
import type { RegionId } from "../map/contracts";
import { regionIdForName } from "../map/regions";

export const PROGRESS_STAGES = Object.freeze([
  "Collecting region information",
  "Calculating scenario impacts",
  "Synthesising evaluation",
] as const);

export const ASSESSMENT_PRESENTATION: Readonly<Record<
  SitePresentationGroup,
  { readonly label: string; readonly explanation: string }
>> = Object.freeze({
  passes_declared_constraints: Object.freeze({
    label: "Meets scenario",
    explanation: "No blocking issue appears in the current prepared evidence.",
  }),
  needs_investigation: Object.freeze({
    label: "More evidence needed",
    explanation: "A specialist check, infrastructure change, or evidence gap remains.",
  }),
  excluded: Object.freeze({
    label: "Does not meet scenario",
    explanation: "A declared constraint blocks this scenario in the current prepared evidence.",
  }),
});

export const NORMAL_STAGE_DELAY_MS = 520;
export const REDUCED_STAGE_DELAY_MS = 40;
export const STORED_EVALUATION_KEY = "gridlens.evaluation.v2";

const RELEASE_MANIFEST_HASH =
  "dceddef669d914a9b9ca32b2e413e2d8d4926c28ffbe6c94edeaac572364abfd";

export type ScenarioReadiness = {
  readonly ready: boolean;
  readonly normalized?: NormalizedScenario;
  readonly guidance?: string;
};

export function scenarioReadiness(input: ScenarioInput): ScenarioReadiness {
  if (!input.name?.trim()) return { ready: false, guidance: "Enter a scenario name." };
  if (!input.coolingMethod || input.coolingMethod === "unknown") {
    return { ready: false, guidance: "Choose a cooling method." };
  }
  const jobs = typeof input.permanentJobs === "string"
    ? Number(input.permanentJobs.trim())
    : input.permanentJobs;
  if (jobs !== undefined && (!Number.isInteger(jobs) || jobs < 0)) {
    return { ready: false, guidance: "Permanent jobs must be a whole number." };
  }
  try {
    return { ready: true, normalized: normalizeScenario(input) };
  } catch (error) {
    return {
      ready: false,
      guidance: error instanceof Error ? error.message : "Complete the scenario before evaluation.",
    };
  }
}

export type EvaluationRunCore = {
  readonly runId: number;
  readonly workflowGeneration: number;
  readonly scenarioFingerprint: string;
  readonly regionId: RegionId;
  readonly candidateId: string;
  readonly selectionGeneration: number;
  readonly screeningHash: string;
  readonly evidenceSnapshotId: string;
  readonly releaseManifestHash: string;
  readonly analysisAsOf: string;
};

export type EvaluationSnapshot = {
  readonly schemaVersion: "gridlens.shipped-result.v2";
  readonly normalizedScenario: NormalizedScenario;
  readonly scenarioFingerprint: string;
  readonly regionId: RegionId;
  readonly candidateId: string;
  readonly screeningHash: string;
  readonly evidenceSnapshotId: string;
  readonly releaseManifestHash: string;
  readonly calculations: EvaluationResult["calculations"];
  readonly assessment: {
    readonly domainOutcome: SiteAssessment["domainOutcome"];
    readonly presentationGroup: SiteAssessment["presentationGroup"];
    readonly capacityMarginMw: number;
    readonly reasons: SiteAssessment["reasons"];
  };
  readonly notices: readonly string[];
  readonly analysisAsOf: string;
  readonly resultSnapshotId: string;
};

export type EvaluationReceipt = {
  readonly schemaVersion: "gridlens.evaluation-receipt.v2";
  readonly run: EvaluationRunCore;
  readonly resultSnapshotId: string;
};

export type StoredEvaluation = {
  readonly schemaVersion: "gridlens.stored-evaluation.v2";
  readonly retainedInput: ScenarioInput;
  readonly receipt: EvaluationReceipt;
  readonly snapshot: EvaluationSnapshot;
  readonly payloadHash: string;
};

export type EvaluationWorkflowState =
  | { readonly kind: "scenario"; readonly workflowGeneration: number; readonly guidance?: string }
  | {
    readonly kind: "evaluating";
    readonly workflowGeneration: number;
    readonly run: EvaluationRunCore;
    readonly stage: 0 | 1 | 2;
    readonly analysis: { readonly status: "pending" } | {
      readonly status: "ready";
      readonly snapshot: EvaluationSnapshot;
    };
  }
  | {
    readonly kind: "results";
    readonly workflowGeneration: number;
    readonly receipt: EvaluationReceipt;
    readonly snapshot: EvaluationSnapshot;
  };

export type EvaluationWorkflowEvent =
  | { readonly type: "start"; readonly expectedGeneration: number; readonly run: EvaluationRunCore }
  | {
    readonly type: "stage";
    readonly workflowGeneration: number;
    readonly runId: number;
    readonly expectedStage: 0 | 1;
    readonly nextStage: 1 | 2;
  }
  | {
    readonly type: "analysis_terminal";
    readonly workflowGeneration: number;
    readonly runId: number;
    readonly outcome: { readonly status: "ready"; readonly snapshot: EvaluationSnapshot }
      | { readonly status: "failed"; readonly guidance: string }
      | { readonly status: "cancelled" };
  }
  | { readonly type: "finish"; readonly workflowGeneration: number; readonly runId: number }
  | {
    readonly type: "invalidate";
    readonly expectedGeneration: number;
    readonly invalidatedRunId?: number;
    readonly guidance?: string;
  }
  | {
    readonly type: "restore";
    readonly expectedGeneration: number;
    readonly receipt: EvaluationReceipt;
    readonly snapshot: EvaluationSnapshot;
  };

export const initialWorkflowState: EvaluationWorkflowState = Object.freeze({
  kind: "scenario",
  workflowGeneration: 0,
});

const activeRunId = (state: EvaluationWorkflowState): number | undefined =>
  state.kind === "evaluating" ? state.run.runId
    : state.kind === "results" ? state.receipt.run.runId : undefined;

export function workflowReducer(
  state: EvaluationWorkflowState,
  event: EvaluationWorkflowEvent,
): EvaluationWorkflowState {
  if (event.type === "start") {
    if (state.kind !== "scenario"
      || event.expectedGeneration !== state.workflowGeneration
      || event.run.workflowGeneration !== state.workflowGeneration) return state;
    return {
      kind: "evaluating",
      workflowGeneration: state.workflowGeneration,
      run: event.run,
      stage: 0,
      analysis: { status: "pending" },
    };
  }
  if (event.type === "invalidate") {
    if (event.expectedGeneration !== state.workflowGeneration) return state;
    if (event.invalidatedRunId !== undefined && event.invalidatedRunId !== activeRunId(state)) {
      return state;
    }
    return {
      kind: "scenario",
      workflowGeneration: state.workflowGeneration + 1,
      ...(event.guidance ? { guidance: event.guidance } : {}),
    };
  }
  if (event.type === "restore") {
    if (event.expectedGeneration !== state.workflowGeneration
      || event.receipt.resultSnapshotId !== event.snapshot.resultSnapshotId) return state;
    return {
      kind: "results",
      workflowGeneration: state.workflowGeneration,
      receipt: event.receipt,
      snapshot: event.snapshot,
    };
  }
  if (state.kind !== "evaluating"
    || event.workflowGeneration !== state.workflowGeneration
    || event.runId !== state.run.runId) return state;
  if (event.type === "stage") {
    if (event.expectedStage !== state.stage || event.nextStage !== state.stage + 1) return state;
    return { ...state, stage: event.nextStage };
  }
  if (event.type === "analysis_terminal") {
    if (event.outcome.status === "ready") {
      if (event.outcome.snapshot.scenarioFingerprint !== state.run.scenarioFingerprint
        || event.outcome.snapshot.regionId !== state.run.regionId
        || event.outcome.snapshot.candidateId !== state.run.candidateId
        || event.outcome.snapshot.screeningHash !== state.run.screeningHash
        || event.outcome.snapshot.evidenceSnapshotId !== state.run.evidenceSnapshotId
        || event.outcome.snapshot.releaseManifestHash !== state.run.releaseManifestHash
        || event.outcome.snapshot.analysisAsOf !== state.run.analysisAsOf) return state;
      return { ...state, analysis: { status: "ready", snapshot: event.outcome.snapshot } };
    }
    return {
      kind: "scenario",
      workflowGeneration: state.workflowGeneration + 1,
      ...(event.outcome.status === "failed" ? { guidance: event.outcome.guidance } : {}),
    };
  }
  if (state.stage !== 2 || state.analysis.status !== "ready") return state;
  return {
    kind: "results",
    workflowGeneration: state.workflowGeneration,
    receipt: {
      schemaVersion: "gridlens.evaluation-receipt.v2",
      run: state.run,
      resultSnapshotId: state.analysis.snapshot.resultSnapshotId,
    },
    snapshot: state.analysis.snapshot,
  };
}

const canonicalize = (value: unknown): string => {
  if (value === null || typeof value === "boolean" || typeof value === "number"
    || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (typeof value !== "object") return "null";
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).filter((key) => record[key] !== undefined).sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
};

const sha256 = async (value: unknown): Promise<string> => {
  const bytes = new TextEncoder().encode(canonicalize(value));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const canonicalInstant = (value: string): string => {
  const expanded = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+12:00` : value;
  const time = new Date(expanded).getTime();
  if (!Number.isFinite(time)) throw new RangeError("Evidence as-of time is invalid.");
  return new Date(time).toISOString();
};

type EvaluationIdentityInput = {
  readonly scenarioInput: ScenarioInput;
  readonly regionId: RegionId;
  readonly assessment: SiteAssessment;
  readonly evaluation: EvaluationResult;
};

type VerificationIdentityInput = EvaluationIdentityInput & {
  readonly selectionGeneration: number;
};

type CreateStoredEvaluationInput = EvaluationIdentityInput & {
  readonly runId: number;
  readonly workflowGeneration: number;
  readonly selectionGeneration: number;
};

export async function createStoredEvaluation(
  input: CreateStoredEvaluationInput,
): Promise<StoredEvaluation> {
  const readiness = scenarioReadiness(input.scenarioInput);
  if (!readiness.ready || !readiness.normalized) {
    throw new RangeError(readiness.guidance ?? "Scenario is incomplete.");
  }
  const regionMatches = input.evaluation.assessments.filter(
    ({ candidate }) => regionIdForName(candidate.region) === input.regionId,
  );
  if (regionMatches.length !== 1 || regionMatches[0].candidate.id !== input.assessment.candidate.id) {
    throw new RangeError("The selected region does not have one current prepared assessment.");
  }
  const analysisAsOf = canonicalInstant(input.assessment.candidate.evidence.asOf);
  const scenarioFingerprint = await sha256(readiness.normalized);
  const assessmentProjection = {
    domainOutcome: input.assessment.domainOutcome,
    presentationGroup: input.assessment.presentationGroup,
    capacityMarginMw: input.assessment.capacityMarginMw,
    reasons: input.assessment.reasons,
  } as const;
  const screeningHash = await sha256({
    candidateId: input.assessment.candidate.id,
    regionId: input.regionId,
    assessment: assessmentProjection,
  });
  const evidenceSnapshotId = await sha256(input.assessment.candidate.evidence);
  const snapshotWithoutId = {
    schemaVersion: "gridlens.shipped-result.v2" as const,
    normalizedScenario: readiness.normalized,
    scenarioFingerprint,
    regionId: input.regionId,
    candidateId: input.assessment.candidate.id,
    screeningHash,
    evidenceSnapshotId,
    releaseManifestHash: RELEASE_MANIFEST_HASH,
    calculations: input.evaluation.calculations,
    assessment: assessmentProjection,
    notices: input.evaluation.notices,
    analysisAsOf,
  };
  const snapshot: EvaluationSnapshot = {
    ...snapshotWithoutId,
    resultSnapshotId: await sha256(snapshotWithoutId),
  };
  const run: EvaluationRunCore = {
    runId: input.runId,
    workflowGeneration: input.workflowGeneration,
    scenarioFingerprint,
    regionId: input.regionId,
    candidateId: input.assessment.candidate.id,
    selectionGeneration: input.selectionGeneration,
    screeningHash,
    evidenceSnapshotId,
    releaseManifestHash: RELEASE_MANIFEST_HASH,
    analysisAsOf,
  };
  const receipt: EvaluationReceipt = {
    schemaVersion: "gridlens.evaluation-receipt.v2",
    run,
    resultSnapshotId: snapshot.resultSnapshotId,
  };
  const withoutHash = {
    schemaVersion: "gridlens.stored-evaluation.v2" as const,
    retainedInput: input.scenarioInput,
    receipt,
    snapshot,
  };
  return { ...withoutHash, payloadHash: await sha256(withoutHash) };
}

export async function verifyStoredEvaluation(
  stored: StoredEvaluation,
  current: VerificationIdentityInput,
): Promise<boolean> {
  try {
    if (stored.schemaVersion !== "gridlens.stored-evaluation.v2") return false;
    if (stored.receipt.run.selectionGeneration !== current.selectionGeneration) return false;
    const recreated = await createStoredEvaluation({
      ...current,
      runId: stored.receipt.run.runId,
      workflowGeneration: stored.receipt.run.workflowGeneration,
      selectionGeneration: current.selectionGeneration,
    });
    return stored.payloadHash === recreated.payloadHash
      && stored.snapshot.resultSnapshotId === recreated.snapshot.resultSnapshotId
      && stored.receipt.resultSnapshotId === recreated.receipt.resultSnapshotId;
  } catch {
    return false;
  }
}

export function parseStoredEvaluation(value: string | null): StoredEvaluation | undefined {
  if (!value || value.length > 100_000) return undefined;
  try {
    const parsed = JSON.parse(value) as Partial<StoredEvaluation>;
    if (parsed.schemaVersion !== "gridlens.stored-evaluation.v2"
      || typeof parsed.payloadHash !== "string"
      || parsed.receipt?.schemaVersion !== "gridlens.evaluation-receipt.v2"
      || parsed.snapshot?.schemaVersion !== "gridlens.shipped-result.v2"
      || !parsed.retainedInput) return undefined;
    return parsed as StoredEvaluation;
  } catch {
    return undefined;
  }
}
