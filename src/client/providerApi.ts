export type RegionId =
  | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09"
  | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "99";

export type ProviderHealth = {
  schemaVersion: "gridlens.provider-health.v3";
  overall: "ready" | "limited" | "unavailable";
  providers: Array<{
    providerClass: "openai_compatible" | "tavily" | "remote_mcp";
    state: "ready" | "limited" | "unavailable";
    reason: string;
    capabilities: string[];
  }>;
  checkedAt: string;
  cacheSeconds: number;
};

export type ResearchCandidate = {
  citationId: string;
  title: string;
  url: string;
  excerpt: string;
  retrievedAt: string;
  sourceClass: "official_candidate" | "public_web_candidate";
};

export type AgentClaim = {
  claimId: string;
  kind: "source_statement" | "model_inference" | "uncertainty" | "recommendation";
  text: string;
  citationIds: string[];
};

export type AgentPayload =
  | {
      kind: "bar_chart" | "line_chart";
      title: string;
      xLabel: string;
      yLabel: string;
      series: Array<{ name: string; values: Array<{ label: string; value: number }> }>;
      sourceRecordIds: string[];
    }
  | {
      kind: "table";
      title: string;
      columns: string[];
      rows: string[][];
      sourceRecordIds: string[];
    }
  | {
      kind: "site_profile_candidate";
      regionId: string;
      summary: string;
      strengths: string[];
      constraints: string[];
      missingEvidence: string[];
    };

export type AgentResponse = {
  schemaVersion: "gridlens.agent-response.v3";
  requestId: string;
  mode: "analysis" | "site_profile" | "visual" | "guided_question";
  contextFingerprint: string;
  claims: AgentClaim[];
  citations: ResearchCandidate[];
  payload?: AgentPayload;
  providerClass: "openai_compatible";
  generatedAt: string;
  partial: boolean;
};

export type AgentContext = {
  schemaVersion: "gridlens.prompt-context.v3";
  scenario: {
    scenarioId: "current-demo";
    name: string;
    itCapacityMw: number;
    pue: number;
    utilizationRatio: number;
    concurrencyRatio: number;
  };
  calculations: {
    addedPeakMw: number;
    annualEnergyGwh: number;
    concurrentDemandMw: number;
    maximumFlexibleLoadMw: number;
    formulaVersion: "gridlens-demo-1.0.0";
  };
  selection: {
    kind: "selected_region";
    regionId: RegionId;
    source: "accessible_list";
    geometryEdition: string;
    selectedAt: string;
  };
  selectedCandidate?: {
    candidateId: string;
    domainOutcome: string;
    presentationGroup: string;
    reasons: string[];
  };
  trustedEvidenceIds: string[];
  contextFingerprint: string;
};

function uuidV7(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let timestamp = Date.now();
  for (let index = 0; index < 6; index += 1) {
    bytes[5 - index] = timestamp % 256;
    timestamp = Math.floor(timestamp / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }
  throw new TypeError("Unsupported deterministic context value");
}

async function decode<T>(response: Response): Promise<T> {
  const body = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message || "The provider request could not be completed.");
  return body;
}

export async function getProviderHealth(signal?: AbortSignal): Promise<ProviderHealth> {
  return decode<ProviderHealth>(await fetch("/api/v1/providers/health", {
    method: "GET",
    credentials: "same-origin",
    signal,
  }));
}

export async function runAgent(
  prompt: string,
  contextWithoutFingerprint: Omit<AgentContext, "contextFingerprint">,
  includeWebResearch: boolean,
  mode: AgentResponse["mode"] = "analysis",
  signal?: AbortSignal,
): Promise<AgentResponse> {
  const context: AgentContext = {
    ...contextWithoutFingerprint,
    contextFingerprint: await sha256(contextWithoutFingerprint),
  };
  return decode<AgentResponse>(await fetch("/api/v1/agent", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      schemaVersion: "gridlens.agent-request.v3",
      requestId: uuidV7(),
      mode,
      prompt,
      context,
      includeWebResearch,
    }),
    signal,
  }));
}
