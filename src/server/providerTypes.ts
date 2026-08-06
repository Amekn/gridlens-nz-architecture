export interface Env {
  GRIDLENS_MODEL_ENDPOINT?: string;
  GRIDLENS_MODEL_API_KEY?: string;
  GRIDLENS_MODEL_ID?: string;
  GRIDLENS_TAVILY_API_KEY?: string;
  GRIDLENS_MCP_ENDPOINT?: string;
  GRIDLENS_MCP_KEY?: string;
  GRIDLENS_LOCAL_SMOKE_TOKEN?: string;
}

export type ProviderClass = "openai_compatible" | "tavily" | "remote_mcp";
export type ProviderState = "ready" | "limited" | "unavailable";
export type ProviderReason =
  | "configured"
  | "not_configured"
  | "probe_timeout"
  | "authentication_rejected"
  | "quota_limited"
  | "invalid_response"
  | "policy_rejected";

export interface ProviderHealthEntry {
  providerClass: ProviderClass;
  state: ProviderState;
  reason: ProviderReason;
  capabilities: Array<"analysis" | "web_search" | "web_research">;
}

export interface ProviderHealthResponse {
  schemaVersion: "gridlens.provider-health.v3";
  overall: ProviderState;
  providers: ProviderHealthEntry[];
  checkedAt: string;
  cacheSeconds: number;
}

export interface ResearchRequest {
  schemaVersion: "gridlens.research-request.v3";
  requestId: string;
  query: string;
  regionId: string;
  scenarioId: string;
}

export interface ResearchCandidate {
  citationId: string;
  title: string;
  url: string;
  excerpt: string;
  retrievedAt: string;
  sourceClass: "official_candidate" | "public_web_candidate";
}

export interface ResearchResponse {
  schemaVersion: "gridlens.research-response.v3";
  requestId: string;
  candidates: ResearchCandidate[];
  providerClass: "tavily" | "remote_mcp";
  partial: boolean;
}

export type RegionSelection =
  | {
      kind: "selected_region";
      regionId: string;
      source:
        | "polygon_pointer"
        | "polygon_keyboard"
        | "marker_pointer"
        | "marker_keyboard"
        | "accessible_list"
        | "search"
        | "coordinate"
        | "restore";
      selectedMarkerId?: string;
      candidatePoint?: { longitude: number; latitude: number };
      geometryEdition: string;
      selectedAt: string;
    }
  | {
      kind: "unresolved_point";
      point: { longitude: number; latitude: number };
      source: "coordinate";
      reason: "outside_verified_regions" | "geometry_unavailable";
      selectedAt: string;
    };

export interface PromptContextInput {
  schemaVersion: "gridlens.prompt-context.v3";
  scenario: {
    scenarioId: string;
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
  selection: RegionSelection;
  selectedCandidate?: {
    candidateId: string;
    domainOutcome: string;
    presentationGroup: string;
    reasons: string[];
  };
  trustedEvidenceIds: string[];
}

export interface DeterministicPromptContext extends PromptContextInput {
  contextFingerprint: string;
}

export type AgentMode = "analysis" | "site_profile" | "visual" | "guided_question";

export interface AgentRequest {
  schemaVersion: "gridlens.agent-request.v3";
  requestId: string;
  mode: AgentMode;
  prompt: string;
  context: DeterministicPromptContext;
  includeWebResearch: boolean;
}

export interface AgentClaim {
  claimId: string;
  kind: "source_statement" | "model_inference" | "uncertainty" | "recommendation";
  text: string;
  citationIds: string[];
}

export type AgentPayload =
  | {
      kind: "site_profile_candidate";
      regionId: string;
      summary: string;
      strengths: string[];
      constraints: string[];
      missingEvidence: string[];
    }
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
    };

export interface AgentResponse {
  schemaVersion: "gridlens.agent-response.v3";
  requestId: string;
  mode: AgentMode;
  contextFingerprint: string;
  claims: AgentClaim[];
  citations: ResearchCandidate[];
  payload?: AgentPayload;
  providerClass: "openai_compatible";
  generatedAt: string;
  partial: boolean;
}

export type PublicErrorCode =
  | "invalid_request"
  | "payload_too_large"
  | "provider_unavailable"
  | "research_unavailable"
  | "rate_limited"
  | "upstream_timeout"
  | "upstream_rejected"
  | "invalid_upstream_response"
  | "cancelled"
  | "internal_error";

export interface PublicApiError {
  schemaVersion: "gridlens.public-error.v3";
  error: {
    code: PublicErrorCode;
    message: string;
    retryable: boolean;
    correlationId: string;
  };
}

export interface ModelConfig {
  origin: string;
  chatUrl: string;
  modelsUrl: string;
  apiKey: string;
  modelId?: string;
}

export interface TavilyConfig {
  origin: "https://api.tavily.com";
  searchUrl: "https://api.tavily.com/search";
  apiKey: string;
}

export interface McpConfig {
  origin: string;
  endpointUrl: string;
  credential?: string;
}

export interface ConfiguredProvider<T> {
  reason: ProviderReason;
  config?: T;
}

export interface ResolvedProviderConfig {
  model: ConfiguredProvider<ModelConfig>;
  tavily?: ConfiguredProvider<TavilyConfig>;
  mcp?: ConfiguredProvider<McpConfig>;
  localSmokeToken?: string;
}

export interface ProviderRouterOptions {
  fetch?: typeof fetch;
  now?: () => Date;
}
