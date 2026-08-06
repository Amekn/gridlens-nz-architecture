import { canonicalJson, sha256Hex, utf8Length } from "./providerJson";
import type {
  AgentClaim,
  AgentMode,
  AgentPayload,
  AgentRequest,
  PromptContextInput,
  ResearchRequest,
} from "./providerTypes";

const REGION_IDS = new Set(["01", "02", "03", "04", "05", "06", "07", "08", "09", "12", "13", "14", "15", "16", "17", "18", "99"]);
const SELECTION_SOURCES = new Set(["polygon_pointer", "polygon_keyboard", "marker_pointer", "marker_keyboard", "accessible_list", "search", "coordinate", "restore"]);
const AGENT_MODES = new Set<AgentMode>(["analysis", "site_profile", "visual", "guided_question"]);
const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA256 = /^[0-9a-f]{64}$/;

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exact(value: unknown, required: readonly string[], optional: readonly string[] = []): value is Record<string, unknown> {
  if (!record(value)) return false;
  const keys = Object.keys(value);
  return required.every((key) => keys.includes(key)) && keys.every((key) => required.includes(key) || optional.includes(key));
}

function plain(value: unknown, maxBytes: number, allowEmpty = false): value is string {
  if (typeof value !== "string" || (!allowEmpty && value.length === 0) || utf8Length(value) > maxBytes) return false;
  return [...value].every((character) => {
    const code = character.charCodeAt(0);
    return !(code <= 0x08 || code === 0x0b || code === 0x0c || (code >= 0x0e && code <= 0x1f) || code === 0x7f);
  });
}

function finite(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0) && value >= min && value <= max;
}

function instant(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) && Number.isFinite(Date.parse(value));
}

function scenarioId(value: unknown): value is string {
  return value === "current-demo" || (typeof value === "string" && UUID_V7.test(value));
}

function sortedUniqueStrings(value: unknown, max: number, pattern: RegExp): value is string[] {
  if (!Array.isArray(value) || value.length > max || !value.every((item) => typeof item === "string" && pattern.test(item))) return false;
  return value.every((item, index) => index === 0 || value[index - 1] < item);
}

function point(value: unknown): boolean {
  return exact(value, ["longitude", "latitude"]) && finite(value.longitude, -180, 180) && finite(value.latitude, -90, 90);
}

function validateSelection(value: unknown): boolean {
  if (!record(value) || value.kind === "selected_region") {
    if (!exact(value, ["kind", "regionId", "source", "geometryEdition", "selectedAt"], ["selectedMarkerId", "candidatePoint"])) return false;
    return value.kind === "selected_region" && typeof value.regionId === "string" && REGION_IDS.has(value.regionId) &&
      typeof value.source === "string" && SELECTION_SOURCES.has(value.source) && plain(value.geometryEdition, 100) && instant(value.selectedAt) &&
      (value.selectedMarkerId === undefined || (typeof value.selectedMarkerId === "string" && /^(?:project|candidate):[a-z0-9][a-z0-9-]{0,111}$/.test(value.selectedMarkerId))) &&
      (value.candidatePoint === undefined || point(value.candidatePoint));
  }
  if (!exact(value, ["kind", "point", "source", "reason", "selectedAt"])) return false;
  return value.kind === "unresolved_point" && point(value.point) && value.source === "coordinate" &&
    (value.reason === "outside_verified_regions" || value.reason === "geometry_unavailable") && instant(value.selectedAt);
}

function validateContext(value: unknown, fingerprintRequired: boolean): value is Record<string, unknown> {
  const required = ["schemaVersion", "scenario", "calculations", "selection", "trustedEvidenceIds", ...(fingerprintRequired ? ["contextFingerprint"] : [])];
  if (!exact(value, required, ["selectedCandidate"])) return false;
  if (value.schemaVersion !== "gridlens.prompt-context.v3") return false;
  if (!exact(value.scenario, ["scenarioId", "name", "itCapacityMw", "pue", "utilizationRatio", "concurrencyRatio"])) return false;
  const scenario = value.scenario;
  if (!scenarioId(scenario.scenarioId) || !plain(scenario.name, 120) || !finite(scenario.itCapacityMw, 0, 10000) ||
      !finite(scenario.pue, 1, 3) || !finite(scenario.utilizationRatio, 0, 1) || !finite(scenario.concurrencyRatio, 0, 1)) return false;
  if (!exact(value.calculations, ["addedPeakMw", "annualEnergyGwh", "concurrentDemandMw", "maximumFlexibleLoadMw", "formulaVersion"])) return false;
  const calculations = value.calculations;
  if (!finite(calculations.addedPeakMw, 0, 30000) || !finite(calculations.annualEnergyGwh, 0, 300000) ||
      !finite(calculations.concurrentDemandMw, 0, 30000) || !finite(calculations.maximumFlexibleLoadMw, 0, 30000) ||
      calculations.formulaVersion !== "gridlens-demo-1.0.0") return false;
  if (!validateSelection(value.selection) || !sortedUniqueStrings(value.trustedEvidenceIds, 64, /^evidence:[a-z0-9][a-z0-9-]{0,108}$/)) return false;
  if (fingerprintRequired && (typeof value.contextFingerprint !== "string" || !SHA256.test(value.contextFingerprint))) return false;
  if (value.selectedCandidate !== undefined) {
    if (!exact(value.selectedCandidate, ["candidateId", "domainOutcome", "presentationGroup", "reasons"])) return false;
    const candidate = value.selectedCandidate;
    if (typeof candidate.candidateId !== "string" || !/^candidate:[a-z0-9][a-z0-9-]{0,109}$/.test(candidate.candidateId) ||
      !plain(candidate.domainOutcome, 80) || !plain(candidate.presentationGroup, 80) || !Array.isArray(candidate.reasons) ||
      candidate.reasons.length > 12 || !candidate.reasons.every((reason) => plain(reason, 320))) return false;
  }
  return true;
}

export async function fingerprintPromptContext(context: PromptContextInput): Promise<string> {
  if (!validateContext(context, false)) throw new Error("Invalid deterministic context");
  return sha256Hex(canonicalJson(context));
}

export function validateResearchRequest(value: unknown): ResearchRequest | null {
  if (!exact(value, ["schemaVersion", "requestId", "query", "regionId", "scenarioId"])) return null;
  if (value.schemaVersion !== "gridlens.research-request.v3" || typeof value.requestId !== "string" || !UUID_V7.test(value.requestId) ||
      !plain(value.query, 500) || !value.query.trim() || typeof value.regionId !== "string" || !REGION_IDS.has(value.regionId) || !scenarioId(value.scenarioId)) return null;
  return value as unknown as ResearchRequest;
}

export async function validateAgentRequest(value: unknown): Promise<AgentRequest | null> {
  if (!exact(value, ["schemaVersion", "requestId", "mode", "prompt", "context", "includeWebResearch"])) return null;
  if (value.schemaVersion !== "gridlens.agent-request.v3" || typeof value.requestId !== "string" || !UUID_V7.test(value.requestId) ||
      typeof value.mode !== "string" || !AGENT_MODES.has(value.mode as AgentMode) || !plain(value.prompt, 4000) || !value.prompt.trim() ||
      typeof value.includeWebResearch !== "boolean" || !validateContext(value.context, true)) return null;
  const context = value.context;
  const { contextFingerprint, ...input } = context;
  if (await fingerprintPromptContext(input as unknown as PromptContextInput) !== contextFingerprint) return null;
  return value as unknown as AgentRequest;
}

function validateClaims(value: unknown, citations: Set<string>): AgentClaim[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 16) return null;
  const claims: AgentClaim[] = [];
  const claimIds = new Set<string>();
  for (const item of value) {
    if (!exact(item, ["claimId", "kind", "text", "citationIds"]) || typeof item.claimId !== "string" ||
      !/^claim:[a-z0-9][a-z0-9-]{0,111}$/.test(item.claimId) || claimIds.has(item.claimId) ||
      !["source_statement", "model_inference", "uncertainty", "recommendation"].includes(String(item.kind)) ||
      !plain(item.text, 1200) || !sortedUniqueStrings(item.citationIds, 8, /^citation:[a-z0-9][a-z0-9-]{0,108}$/) ||
      item.citationIds.some((id) => !citations.has(id)) || (item.kind === "source_statement" && item.citationIds.length === 0)) return null;
    claimIds.add(item.claimId);
    claims.push(item as unknown as AgentClaim);
  }
  return claims;
}

function strings(value: unknown, maxItems: number, maxBytes: number): value is string[] {
  return Array.isArray(value) && value.length <= maxItems && value.every((item) => plain(item, maxBytes));
}

function validatePayload(value: unknown, mode: AgentMode): AgentPayload | undefined | null {
  if (value === undefined) return mode === "site_profile" || mode === "visual" ? null : undefined;
  if (!record(value) || typeof value.kind !== "string") return null;
  if (mode === "site_profile") {
    if (!exact(value, ["kind", "regionId", "summary", "strengths", "constraints", "missingEvidence"]) || value.kind !== "site_profile_candidate" ||
      typeof value.regionId !== "string" || !REGION_IDS.has(value.regionId) || !plain(value.summary, 2000) || !strings(value.strengths, 6, 300) ||
      !strings(value.constraints, 6, 300) || !strings(value.missingEvidence, 8, 300)) return null;
    return value as AgentPayload;
  }
  if (mode !== "visual") return null;
  if (value.kind === "table") {
    if (!exact(value, ["kind", "title", "columns", "rows", "sourceRecordIds"]) || !plain(value.title, 160) ||
      !strings(value.columns, 8, 80) || value.columns.length < 1 || !Array.isArray(value.rows) || value.rows.length < 1 || value.rows.length > 50) return null;
    const columnCount = value.columns.length;
    if (!value.rows.every((row) => strings(row, 8, 300) && row.length === columnCount) ||
      !sortedUniqueStrings(value.sourceRecordIds, 32, /^evidence:[a-z0-9][a-z0-9-]{0,108}$/)) return null;
    return value as AgentPayload;
  }
  if (value.kind !== "bar_chart" && value.kind !== "line_chart") return null;
  if (!exact(value, ["kind", "title", "xLabel", "yLabel", "series", "sourceRecordIds"]) || !plain(value.title, 160) ||
    !plain(value.xLabel, 80) || !plain(value.yLabel, 80) || !Array.isArray(value.series) || value.series.length < 1 || value.series.length > 6 ||
    !value.series.every((series) => exact(series, ["name", "values"]) && plain(series.name, 80) && Array.isArray(series.values) &&
      series.values.length >= 1 && series.values.length <= 24 && series.values.every((entry) => exact(entry, ["label", "value"]) && plain(entry.label, 80) && finite(entry.value, -Number.MAX_VALUE, Number.MAX_VALUE))) ||
    !sortedUniqueStrings(value.sourceRecordIds, 32, /^evidence:[a-z0-9][a-z0-9-]{0,108}$/)) return null;
  return value as AgentPayload;
}

export function validateModelResult(value: unknown, mode: AgentMode, citationIds: Set<string>): { claims: AgentClaim[]; payload?: AgentPayload } | null {
  if (!exact(value, ["claims"], ["payload"])) return null;
  const claims = validateClaims(value.claims, citationIds);
  if (!claims) return null;
  const payload = validatePayload(value.payload, mode);
  if (payload === null) return null;
  return { claims, ...(payload ? { payload } : {}) };
}
