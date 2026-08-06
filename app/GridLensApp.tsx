"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Check,
  ChevronRight,
  CircleGauge,
  Database,
  Droplets,
  ExternalLink,
  Leaf,
  LoaderCircle,
  MapPin,
  Network,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  evaluateScenario,
  type ScenarioInput,
  type SiteAssessment,
  type SiteDomainOutcome,
  type SitePresentationGroup,
} from "@/src/domain";
import {
  clearConnectorSettings,
  loadConnectorSettings,
  runOpenAiPrompt,
  saveConnectorSettings,
  searchTavily,
  testOpenAiConnection,
  type ConnectorSettings,
  type WebEvidence,
} from "@/src/connectors/browserVault";
import { NzMap, type MapSite } from "./NzMap";

const GROUP_LABELS: Record<SitePresentationGroup, string> = {
  passes_declared_constraints: "passes declared constraints",
  needs_investigation: "needs investigation",
  excluded: "excluded",
};

const OUTCOME_LABELS: Record<SiteDomainOutcome, string> = {
  included: "Included",
  specialist_assessment_required: "Specialist assessment required",
  infrastructure_upgrade_required: "Infrastructure upgrade required",
  insufficient_evidence: "Insufficient evidence",
  excluded: "Excluded",
};

const EMPTY_SETTINGS: ConnectorSettings = {
  endpoint: "",
  apiKey: "",
  model: "",
  tavilyApiKey: "",
  mcpEndpoint: "",
  mcpApiKey: "",
};

type CategoryStatus = "low" | "moderate" | "high" | "insufficient";

type CategoryView = {
  id: string;
  label: string;
  status: CategoryStatus;
  detail: string;
  icon: typeof Zap;
};

function categoryViews(assessment: SiteAssessment): CategoryView[] {
  const evidenceIncomplete = assessment.candidate.evidence.coverage !== "complete";
  const specialist = assessment.candidate.signals.specialistAssessment?.toLowerCase() ?? "";
  const excluded = assessment.domainOutcome === "excluded";
  const upgrade = assessment.domainOutcome === "infrastructure_upgrade_required";
  return [
    {
      id: "electricity",
      label: "Electricity",
      status: excluded || upgrade ? "high" : evidenceIncomplete ? "insufficient" : "low",
      detail: upgrade
        ? `${Math.abs(assessment.capacityMarginMw).toFixed(1)} MW prepared capacity gap`
        : `${assessment.capacityMarginMw.toFixed(1)} MW prepared capacity margin`,
      icon: Zap,
    },
    {
      id: "water",
      label: "Water",
      status: specialist.includes("water") ? "moderate" : evidenceIncomplete ? "insufficient" : "low",
      detail: specialist.includes("water") ? "Specialist availability review flagged" : "No hard constraint in prepared evidence",
      icon: Droplets,
    },
    {
      id: "resilience",
      label: "Resilience",
      status: excluded ? "high" : /seismic|coastal|hazard/.test(specialist) ? "moderate" : "low",
      detail: /seismic|coastal|hazard/.test(specialist)
        ? "Hazard assumptions need specialist review"
        : "Prepared constraints passed",
      icon: ShieldCheck,
    },
    {
      id: "economic",
      label: "Economic",
      status: upgrade ? "moderate" : "low",
      detail: upgrade ? "Network upgrade cost not yet priced" : "No deterministic cost blocker declared",
      icon: CircleGauge,
    },
    {
      id: "community",
      label: "Community",
      status: evidenceIncomplete ? "insufficient" : "moderate",
      detail: "Engagement evidence remains a distinct decision input",
      icon: Users,
    },
  ];
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function GridLensApp() {
  const [scenario, setScenario] = useState<ScenarioInput>({
    name: "AI compute campus",
    itCapacityMw: 65,
    pue: 1,
    utilizationRatio: 0.8,
    concurrencyRatio: 0.3,
  });
  const evaluation = useMemo(() => evaluateScenario(scenario), [scenario]);
  const [selectedSiteId, setSelectedSiteId] = useState("demo-southland-invercargill");
  const [activeView, setActiveView] = useState<"scenario" | "results">("scenario");
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [settings, setSettings] = useState<ConnectorSettings>(EMPTY_SETTINGS);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "cached" | "error">("idle");
  const [connectionMessage, setConnectionMessage] = useState("Not connected");
  const [prompt, setPrompt] = useState("Explain the main trade-offs for this site and suggest the next evidence to collect.");
  const [agentResponse, setAgentResponse] = useState("");
  const [agentBusy, setAgentBusy] = useState(false);
  const [agentSources, setAgentSources] = useState<WebEvidence[]>([]);
  const [researchNotice, setResearchNotice] = useState("");

  useEffect(() => {
    void loadConnectorSettings().then((cached) => {
      if (!cached) return;
      setSettings(cached);
      setConnectionStatus("cached");
      setConnectionMessage("Cached securely on this device");
    });
  }, []);

  const selectedAssessment =
    evaluation.assessments.find((entry) => entry.candidate.id === selectedSiteId) ?? evaluation.assessments[0];
  const categories = categoryViews(selectedAssessment);
  const groupCounts = {
    passes_declared_constraints: evaluation.groups.passes_declared_constraints.length,
    needs_investigation: evaluation.groups.needs_investigation.length,
    excluded: evaluation.groups.excluded.length,
  };

  const mapSites: MapSite[] = evaluation.assessments.map((entry) => ({
    id: entry.candidate.id,
    name: entry.candidate.name,
    region: entry.candidate.region,
    latitude: entry.candidate.latitude,
    longitude: entry.candidate.longitude,
    presentationGroup: GROUP_LABELS[entry.presentationGroup],
  }));

  const filteredAssessments = evaluation.assessments.filter((entry) => {
    const haystack = `${entry.candidate.name} ${entry.candidate.region}`.toLowerCase();
    return haystack.includes(searchQuery.trim().toLowerCase());
  });

  function updateScenario(field: keyof ScenarioInput, value: string | number) {
    setScenario((current) => ({ ...current, [field]: value }));
  }

  async function testAndCacheConnection() {
    setConnectionStatus("testing");
    setConnectionMessage("Testing direct browser connection…");
    try {
      const models = await testOpenAiConnection(settings);
      const resolved = { ...settings, model: settings.model || models[0] || "local-model" };
      await saveConnectorSettings(resolved);
      setSettings(resolved);
      setConnectionStatus("cached");
      setConnectionMessage(`Connected${models.length ? ` • ${models.length} model${models.length === 1 ? "" : "s"}` : ""}`);
    } catch (error) {
      setConnectionStatus("error");
      setConnectionMessage(error instanceof Error ? error.message : "Connection failed");
    }
  }

  async function clearConnection() {
    await clearConnectorSettings();
    setSettings(EMPTY_SETTINGS);
    setConnectionStatus("idle");
    setConnectionMessage("Local connector cache cleared");
  }

  async function askAgent() {
    if (connectionStatus !== "cached") {
      setSettingsOpen(true);
      return;
    }
    setAgentBusy(true);
    setAgentResponse("");
    setAgentSources([]);
    setResearchNotice("");
    try {
      let webEvidence: WebEvidence[] = [];
      if (settings.tavilyApiKey) {
        try {
          webEvidence = await searchTavily(
            settings.tavilyApiKey,
            `${prompt} ${selectedAssessment.candidate.name} ${selectedAssessment.candidate.region} New Zealand infrastructure`,
          );
          setAgentSources(webEvidence);
          setResearchNotice(
            webEvidence.length
              ? `${webEvidence.length} current web evidence candidate${webEvidence.length === 1 ? "" : "s"} included`
              : "No current web evidence candidates returned",
          );
        } catch {
          setResearchNotice("Web index unavailable; analysis used prepared evidence");
        }
      }
      const context = JSON.stringify({
        scenario: evaluation.normalizedScenario,
        calculations: evaluation.calculations,
        site: selectedAssessment.candidate.name,
        region: selectedAssessment.candidate.region,
        deterministicOutcome: selectedAssessment.domainOutcome,
        presentationGroup: selectedAssessment.presentationGroup,
        reasons: selectedAssessment.reasons,
        evidenceNotice: selectedAssessment.candidate.evidence.notice,
        webEvidence: webEvidence.map(({ title, url, content }) => ({ title, url, content })),
      });
      setAgentResponse(await runOpenAiPrompt(settings, prompt, context));
    } catch (error) {
      setAgentResponse(error instanceof Error ? error.message : "The agent request failed.");
    } finally {
      setAgentBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><Leaf size={20} strokeWidth={2.4} /></div>
          <div><strong>GridLens</strong><span>NZ</span></div>
        </div>
        <div className="topbar-context">
          <span className="prepared-badge"><i /> Prepared demo evidence</span>
          <span className="asof">As of 01 Aug 2026</span>
        </div>
        <nav className="top-actions" aria-label="Application tools">
          <button className="quiet-button" onClick={() => setSourcesOpen(true)}><Database size={16} /> Sources <span>17</span></button>
          <button className="quiet-button" onClick={() => setSettingsOpen(true)}>
            <Settings2 size={16} /> Connectors <i className={`status-light ${connectionStatus}`} />
          </button>
        </nav>
      </header>

      <section className="workspace">
        <div className="map-column">
          <NzMap sites={mapSites} selectedSiteId={selectedSiteId} onSelect={setSelectedSiteId} />
          <div className="map-insight-card">
            <div className="insight-icon"><MapPin size={19} /></div>
            <div>
              <span className="eyebrow">Selected candidate</span>
              <strong>{selectedAssessment.candidate.name}</strong>
              <p>{selectedAssessment.candidate.region} • {OUTCOME_LABELS[selectedAssessment.domainOutcome]}</p>
            </div>
            <div className={`group-pill ${selectedAssessment.presentationGroup}`}>
              {GROUP_LABELS[selectedAssessment.presentationGroup]}
            </div>
            <button className="icon-button" onClick={() => setActiveView("results")} aria-label="Open selected site results"><ChevronRight /></button>
          </div>
        </div>

        <aside className="control-panel">
          <div className="panel-tabs" role="tablist" aria-label="Scenario workspace">
            <button role="tab" aria-selected={activeView === "scenario"} className={activeView === "scenario" ? "active" : ""} onClick={() => setActiveView("scenario")}>Scenario</button>
            <button role="tab" aria-selected={activeView === "results"} className={activeView === "results" ? "active" : ""} onClick={() => setActiveView("results")}>Evaluation</button>
          </div>

          {activeView === "scenario" ? (
            <div className="panel-scroll">
              <section className="panel-section scenario-hero">
                <span className="eyebrow">Configure demand</span>
                <h1>Set the infrastructure scenario</h1>
                <p>Change the declared load, then select a site directly on the map. Results update deterministically.</p>
              </section>

              <section className="panel-section form-stack">
                <label className="field-label">Scenario name
                  <input value={String(scenario.name ?? "")} onChange={(event) => updateScenario("name", event.target.value)} />
                </label>
                <div className="field-grid">
                  <label className="field-label">IT capacity <span>MW</span>
                    <input type="number" min="1" max="1000" step="1" value={String(scenario.itCapacityMw)} onChange={(event) => updateScenario("itCapacityMw", event.target.value)} />
                  </label>
                  <label className="field-label">PUE <span>ratio</span>
                    <input type="number" min="1" max="3" step="0.05" value={String(scenario.pue)} onChange={(event) => updateScenario("pue", event.target.value)} />
                  </label>
                </div>
                <label className="range-field" htmlFor="scenario-utilisation">
                  <div><span>Annual utilisation</span><strong>{Math.round(Number(scenario.utilizationRatio) * 100)}%</strong></div>
                  <input id="scenario-utilisation" aria-label="Annual utilisation ratio" type="range" min="0.1" max="1" step="0.05" value={Number(scenario.utilizationRatio)} onChange={(event) => updateScenario("utilizationRatio", Number(event.target.value))} />
                </label>
                <label className="range-field" htmlFor="scenario-concurrency">
                  <div><span>Concurrent peak</span><strong>{Math.round(Number(scenario.concurrencyRatio) * 100)}%</strong></div>
                  <input id="scenario-concurrency" aria-label="Concurrent peak ratio" type="range" min="0.05" max="1" step="0.05" value={Number(scenario.concurrencyRatio)} onChange={(event) => updateScenario("concurrencyRatio", Number(event.target.value))} />
                </label>
              </section>

              <section className="metric-ribbon" aria-label="Calculated scenario demand">
                <div><span>Added peak</span><strong>{evaluation.calculations.addedPeakMw.toFixed(1)} <small>MW</small></strong></div>
                <div><span>Annual energy</span><strong>{evaluation.calculations.annualEnergyGwh.toFixed(2)} <small>GWh</small></strong></div>
                <div><span>Flexible load</span><strong>{evaluation.calculations.maximumFlexibleLoadMw.toFixed(1)} <small>MW</small></strong></div>
              </section>

              <section className="panel-section">
                <div className="section-heading"><div><span className="eyebrow">Whole-NZ map index</span><h2>Choose a candidate on the map</h2></div><span>{filteredAssessments.length}</span></div>
                <div className="search-box"><Search size={16} /><input aria-label="Search synchronized map list" placeholder="Focus the map by place…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></div>
                <div className="group-summary" aria-label="Separate site groups">
                  <span className="pass"><i />{groupCounts.passes_declared_constraints} pass</span>
                  <span className="investigate"><i />{groupCounts.needs_investigation} investigate</span>
                  <span className="excluded"><i />{groupCounts.excluded} excluded</span>
                </div>
                <div className="site-list" aria-label="Accessible candidate site list">
                  {filteredAssessments.slice(0, 7).map((entry) => (
                    <button key={entry.candidate.id} className={entry.candidate.id === selectedSiteId ? "selected" : ""} onClick={() => setSelectedSiteId(entry.candidate.id)}>
                      <i className={`site-status ${entry.presentationGroup}`} />
                      <span><strong>{entry.candidate.region}</strong><small>{OUTCOME_LABELS[entry.domainOutcome]}</small></span>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
              </section>

              <div className="panel-cta-wrap">
                <button className="primary-button" onClick={() => setActiveView("results")}>Evaluate selected site <ArrowRight size={17} /></button>
                <p>Deterministic rules • No AI scoring • Separate groups</p>
              </div>
            </div>
          ) : (
            <div className="panel-scroll">
              <section className="panel-section result-hero">
                <div className="result-kicker"><span className={`site-status ${selectedAssessment.presentationGroup}`} />{selectedAssessment.candidate.region}</div>
                <h1>{selectedAssessment.candidate.name}</h1>
                <div className={`outcome-banner ${selectedAssessment.presentationGroup}`}>
                  <div>{selectedAssessment.presentationGroup === "excluded" ? <Ban /> : selectedAssessment.presentationGroup === "needs_investigation" ? <AlertTriangle /> : <Check />}</div>
                  <span><small>Deterministic site outcome</small><strong>{OUTCOME_LABELS[selectedAssessment.domainOutcome]}</strong></span>
                </div>
                <p className="result-reason">{selectedAssessment.reasons[0]?.message}</p>
              </section>

              <section className="metric-ribbon results">
                <div><span>Capacity margin</span><strong>{selectedAssessment.capacityMarginMw.toFixed(1)} <small>MW</small></strong></div>
                <div><span>Evidence coverage</span><strong>{selectedAssessment.candidate.evidence.coveragePercent}<small>%</small></strong></div>
                <div><span>Added peak</span><strong>{evaluation.calculations.addedPeakMw.toFixed(1)} <small>MW</small></strong></div>
              </section>

              <section className="panel-section">
                <div className="section-heading"><div><span className="eyebrow">Five transparent lenses</span><h2>Impact assessment</h2></div><span>5</span></div>
                <div className="category-list">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return <div className="category-row" key={category.id}>
                      <div className={`category-icon ${category.status}`}><Icon size={17} /></div>
                      <span><strong>{category.label}</strong><small>{category.detail}</small></span>
                      <em className={category.status}>{titleCase(category.status)}</em>
                    </div>;
                  })}
                </div>
              </section>

              <section className="panel-section ai-zone">
                <div className="ai-heading"><div className="ai-mark"><Sparkles size={18} /></div><div><span className="eyebrow">Source-aware AI workspace</span><h2>Explore this result</h2></div></div>
                <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-label="Prompt the GridLens AI agent" />
                <div className="ai-actions">
                  <button className="primary-button ai" onClick={() => void askAgent()} disabled={agentBusy}>
                    {agentBusy ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
                    {connectionStatus === "cached" ? "Generate insight" : "Connect AI endpoint"}
                  </button>
                  <span><Network size={14} />{settings.tavilyApiKey || settings.mcpEndpoint ? "Web research enabled" : "Prepared evidence only"}</span>
                </div>
                {agentResponse && <div className="agent-response">
                  <span>Agent analysis</span>
                  <p>{agentResponse}</p>
                  {researchNotice && <small>{researchNotice}</small>}
                  {agentSources.length > 0 && <div className="agent-sources" aria-label="Web evidence candidates">
                    {agentSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ExternalLink size={12} /></a>)}
                  </div>}
                </div>}
              </section>

              <section className="panel-section trust-note"><ShieldCheck size={18} /><p><strong>What this result means</strong>This screening uses prepared demonstration evidence. It is not a live capacity offer, development approval, or substitute for specialist assessment.</p></section>
            </div>
          )}
        </aside>
      </section>

      {settingsOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-card connector-modal" role="dialog" aria-modal="true" aria-labelledby="connector-title">
            <button className="modal-close" onClick={() => setSettingsOpen(false)} aria-label="Close connector settings"><X /></button>
            <div className="modal-heading"><div className="modal-icon"><Network /></div><div><span className="eyebrow">Direct browser connections</span><h2 id="connector-title">AI & web research</h2><p>Credentials are encrypted on this device after the first successful connection.</p></div></div>
            <div className="connector-status"><i className={connectionStatus} /><span><strong>{connectionStatus === "cached" ? "Ready" : connectionStatus === "testing" ? "Testing" : connectionStatus === "error" ? "Needs attention" : "Not connected"}</strong><small>{connectionMessage}</small></span></div>
            <div className="connector-grid">
              <label className="field-label full">OpenAI-compatible endpoint<input type="url" placeholder="https://your-endpoint.example/v1" value={settings.endpoint} onChange={(event) => setSettings({ ...settings, endpoint: event.target.value })} /></label>
              <label className="field-label">API key<input type="password" autoComplete="off" placeholder="Stored after success" value={settings.apiKey} onChange={(event) => setSettings({ ...settings, apiKey: event.target.value })} /></label>
              <label className="field-label">Model ID<input placeholder="Selects first available model" value={settings.model} onChange={(event) => setSettings({ ...settings, model: event.target.value })} /></label>
              <label className="field-label full connector-divider"><span>Tavily API key <small>optional web index</small></span><input type="password" autoComplete="off" placeholder="Direct CORS research" value={settings.tavilyApiKey} onChange={(event) => setSettings({ ...settings, tavilyApiKey: event.target.value })} /></label>
              <label className="field-label">MCP server endpoint<input type="url" placeholder="https://…/mcp" value={settings.mcpEndpoint} onChange={(event) => setSettings({ ...settings, mcpEndpoint: event.target.value })} /></label>
              <label className="field-label">MCP credential<input type="password" autoComplete="off" placeholder="Optional bearer token" value={settings.mcpApiKey} onChange={(event) => setSettings({ ...settings, mcpApiKey: event.target.value })} /></label>
            </div>
            <div className="privacy-callout"><ShieldCheck size={17} /><span><strong>Browser-first privacy boundary</strong><small>No app relay. Only CORS-enabled endpoints can be contacted; keys never enter reports or URLs.</small></span></div>
            <div className="modal-actions"><button className="text-button danger" onClick={() => void clearConnection()}>Clear local cache</button><button className="primary-button" disabled={!settings.endpoint || connectionStatus === "testing"} onClick={() => void testAndCacheConnection()}>{connectionStatus === "testing" ? <LoaderCircle className="spin" /> : <Zap />} Test & cache securely</button></div>
          </section>
        </div>
      )}

      {sourcesOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-card sources-modal" role="dialog" aria-modal="true" aria-labelledby="sources-title">
            <button className="modal-close" onClick={() => setSourcesOpen(false)} aria-label="Close source register"><X /></button>
            <div className="modal-heading"><div className="modal-icon"><Database /></div><div><span className="eyebrow">Evidence register</span><h2 id="sources-title">17 source families</h2><p>Prepared, live-capable, link-only and agent-only sources stay visibly distinct.</p></div></div>
            <div className="source-list">
              {[
                ["Electricity Authority / EMI", "Prepared adapter", "Generation, demand, node mapping"],
                ["EM6", "Live-capable", "Grid and wind indicators"],
                ["LAWA", "Live-capable", "Freshwater and environmental observations"],
                ["Stats NZ + LINZ", "Prepared core", "Boundaries, population and geography"],
                ["Transpower", "Prepared core", "Network assets and context"],
                ["Tavily / remote MCP", "Agent-only", "Current web evidence candidates"],
              ].map(([name, status, detail]) => <div className="source-row" key={name}><div className="source-icon"><Database size={16} /></div><span><strong>{name}</strong><small>{detail}</small></span><em>{status}</em><ExternalLink size={14} /></div>)}
            </div>
            <div className="privacy-callout amber"><AlertTriangle size={17} /><span><strong>Demo evidence boundary</strong><small>Map values in this build are illustrative prepared fixtures, clearly separated from future live adapters.</small></span></div>
          </section>
        </div>
      )}
    </main>
  );
}
