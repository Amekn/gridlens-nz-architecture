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
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  buildImpactPlots,
  evaluateScenario,
  type ImpactPlotModel,
  type ScenarioInput,
  type SiteAssessment,
  type SiteDomainOutcome,
  type SitePresentationGroup,
} from "@/src/domain";
import {
  getProviderHealth,
  runAgent,
  type AgentPayload,
  type ProviderHealth,
  type ResearchCandidate,
  type RegionId,
} from "@/src/client/providerApi";
import { REGION_BY_ID, regionIdForName } from "@/src/map/regions";
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

function AgentPayloadView({ payload }: { payload: AgentPayload }) {
  if (payload.kind === "table") {
    return <figure className="agent-visual">
      <figcaption>{payload.title}</figcaption>
      <div className="agent-table-wrap"><table><thead><tr>{payload.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{payload.rows.map((row, rowIndex) => <tr key={`${rowIndex}-${row.join("-")}`}>{row.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`}>{cell}</td>)}</tr>)}</tbody>
      </table></div>
    </figure>;
  }
  if (payload.kind === "site_profile_candidate") {
    return <figure className="agent-visual"><figcaption>Region profile candidate</figcaption><p>{payload.summary}</p></figure>;
  }
  const values = payload.series.flatMap((series) => series.values.map((entry) => entry.value));
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const span = maximum - minimum || 1;
  if (payload.kind === "line_chart") {
    return <figure className="agent-visual">
      <figcaption>{payload.title}</figcaption>
      <svg className="agent-line-chart" viewBox="0 0 100 100" role="img" aria-label={payload.title}>
        <path d="M8 8 V90 H96" className="chart-axis" />
        {payload.series.map((series, seriesIndex) => {
          const points = series.values.map((entry, index) => {
            const x = 10 + (index / Math.max(1, series.values.length - 1)) * 84;
            const y = 88 - ((entry.value - minimum) / span) * 76;
            return `${x},${y}`;
          }).join(" ");
          return <polyline key={series.name} points={points} className={`chart-series series-${seriesIndex % 3}`} />;
        })}
      </svg>
      <div className="chart-key">{payload.series.map((series) => <span key={series.name}>{series.name}</span>)}</div>
    </figure>;
  }
  const absoluteMaximum = Math.max(...values.map(Math.abs), 1);
  return <figure className="agent-visual">
    <figcaption>{payload.title}</figcaption>
    <div className="agent-bars">{payload.series.flatMap((series) => series.values.map((entry) => <div className="agent-bar" key={`${series.name}-${entry.label}`}>
      <span>{entry.label}</span><i><b style={{ width: `${Math.max(3, Math.abs(entry.value) / absoluteMaximum * 100)}%` }} /></i><strong>{entry.value.toLocaleString()}</strong>
    </div>))}</div>
  </figure>;
}

const IMPACT_PLOT_ICONS: Record<ImpactPlotModel["id"], typeof Zap> = {
  power: Zap,
  water: Droplets,
  broadband: Network,
  economic: CircleGauge,
};

function ImpactPlotDashboard({ plots }: { plots: readonly ImpactPlotModel[] }) {
  return <section className="panel-section impact-dashboard" aria-labelledby="impact-plots-title">
    <div className="section-heading">
      <div><span className="eyebrow">Deterministic evaluation plots</span><h2 id="impact-plots-title">Infrastructure &amp; benefit evidence</h2></div>
      <span>4</span>
    </div>
    <p className="impact-dashboard-intro">Calculated values and declared assumptions are plotted separately from missing evidence. No AI scoring is used.</p>
    <div className="impact-plot-grid">
      {plots.map((plot) => {
        const Icon = IMPACT_PLOT_ICONS[plot.id];
        return <article className={`impact-plot-card ${plot.status}`} key={plot.id}>
          <header>
            <div className="impact-plot-icon"><Icon size={17} /></div>
            <div><h3>{plot.title}</h3><p>{plot.summary}</p></div>
            <em>{plot.statusLabel}</em>
          </header>
          <div className="impact-plot-bars" role="img" aria-label={`${plot.title}: ${plot.rows.map((row) => `${row.label}, ${row.display}`).join("; ")}`}>
            {plot.rows.map((row) => {
              const width = row.value === undefined ? 0 : Math.max(3, Math.min(100, row.value / row.maximum * 100));
              return <div className={`impact-plot-row ${row.state}`} key={row.label}>
                <div><span>{row.label}</span><strong>{row.display}</strong></div>
                <i><b style={{ width: `${width}%` }} /></i>
              </div>;
            })}
          </div>
          <footer><span>{plot.note}</span><small>{plot.provenance}</small></footer>
        </article>;
      })}
    </div>
  </section>;
}

export function GridLensApp() {
  const [scenario, setScenario] = useState<ScenarioInput>({
    name: "AI compute campus",
    itCapacityMw: 65,
    pue: 1,
    utilizationRatio: 0.8,
    concurrencyRatio: 0.3,
    coolingMethod: "hybrid",
    targetNetworkGbps: 100,
    permanentJobs: 50,
    regionalInvestmentNzdM: 0,
  });
  const evaluation = useMemo(() => evaluateScenario(scenario), [scenario]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>("demo-southland-invercargill");
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId>("15");
  const [activeView, setActiveView] = useState<"scenario" | "results">("scenario");
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [providerHealth, setProviderHealth] = useState<ProviderHealth | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "cached" | "error">("testing");
  const [connectionMessage, setConnectionMessage] = useState("Checking built-in services…");
  const [prompt, setPrompt] = useState("Explain the main trade-offs for this site and suggest the next evidence to collect.");
  const [agentResponse, setAgentResponse] = useState("");
  const [agentMode, setAgentMode] = useState<"analysis" | "visual">("analysis");
  const [agentPayload, setAgentPayload] = useState<AgentPayload | undefined>();
  const [agentBusy, setAgentBusy] = useState(false);
  const [agentSources, setAgentSources] = useState<ResearchCandidate[]>([]);
  const [researchNotice, setResearchNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void getProviderHealth(controller.signal).then((health) => {
      setProviderHealth(health);
      const model = health.providers.find((provider) => provider.providerClass === "openai_compatible");
      setConnectionStatus(model?.state === "ready" ? "cached" : model?.state === "limited" ? "idle" : "error");
      setConnectionMessage(
        health.overall === "ready" ? "Built-in AI and research ready"
          : health.overall === "limited" ? "AI ready with limited research"
            : "AI services unavailable; deterministic evaluation remains ready",
      );
    }).catch(() => {
      setConnectionStatus("error");
      setConnectionMessage("AI services unavailable; deterministic evaluation remains ready");
    });
    return () => controller.abort();
  }, []);

  const selectedAssessment = selectedSiteId
    ? evaluation.assessments.find((entry) => entry.candidate.id === selectedSiteId)
    : undefined;
  const selectedRegionName = REGION_BY_ID[selectedRegionId].displayName;
  const categories = selectedAssessment ? categoryViews(selectedAssessment) : [];
  const impactPlots = buildImpactPlots(evaluation.normalizedScenario, evaluation.calculations, selectedAssessment);
  const groupCounts = {
    passes_declared_constraints: evaluation.groups.passes_declared_constraints.length,
    needs_investigation: evaluation.groups.needs_investigation.length,
    excluded: evaluation.groups.excluded.length,
  };

  const mapSites: MapSite[] = evaluation.assessments.map((entry) => ({
    id: entry.candidate.id,
    name: entry.candidate.name,
    region: entry.candidate.region,
    regionId: regionIdForName(entry.candidate.region),
    latitude: entry.candidate.latitude,
    longitude: entry.candidate.longitude,
    presentationGroup: GROUP_LABELS[entry.presentationGroup],
    domainOutcome: entry.domainOutcome,
  }));

  const filteredAssessments = evaluation.assessments.filter((entry) => {
    const haystack = `${entry.candidate.name} ${entry.candidate.region}`.toLowerCase();
    return haystack.includes(searchQuery.trim().toLowerCase());
  });

  function updateScenario(field: keyof ScenarioInput, value: string | number) {
    if (field === "name") {
      setScenario((current) => ({ ...current, name: String(value) }));
      return;
    }
    if (field === "coolingMethod") {
      setScenario((current) => ({ ...current, coolingMethod: String(value) as NonNullable<ScenarioInput["coolingMethod"]> }));
      return;
    }
    const parsed = typeof value === "number" ? value : Number(value.trim());
    type NumericScenarioField = Exclude<keyof ScenarioInput, "name" | "coolingMethod">;
    const numericField = field as NumericScenarioField;
    const bounds: Record<NumericScenarioField, readonly [number, number]> = {
      itCapacityMw: [1, 1000],
      pue: [1, 3],
      utilizationRatio: [0.1, 1],
      concurrencyRatio: [0.05, 1],
      targetNetworkGbps: [1, 100_000],
      permanentJobs: [0, 100_000],
      regionalInvestmentNzdM: [0, 1_000_000],
    };
    const [minimum, maximum] = bounds[numericField];
    if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
      setScenario((current) => ({ ...current }));
      return;
    }
    setScenario((current) => ({ ...current, [numericField]: parsed }));
  }

  function selectSite(siteId: string) {
    setSelectedSiteId(siteId);
    const assessment = evaluation.assessments.find((entry) => entry.candidate.id === siteId);
    const regionId = assessment ? regionIdForName(assessment.candidate.region) : undefined;
    if (regionId) setSelectedRegionId(regionId);
  }

  function selectRegion(regionId: RegionId, _source: string, selectedSite?: string) {
    setSelectedRegionId(regionId);
    setSelectedSiteId(selectedSite ?? null);
  }

  async function askAgent() {
    setAgentBusy(true);
    setAgentResponse("");
    setAgentPayload(undefined);
    setAgentSources([]);
    setResearchNotice("");
    try {
      const result = await runAgent(prompt, {
        schemaVersion: "gridlens.prompt-context.v3",
        scenario: {
          scenarioId: "current-demo",
          name: evaluation.normalizedScenario.name,
          itCapacityMw: evaluation.normalizedScenario.itCapacityMw,
          pue: evaluation.normalizedScenario.pue,
          utilizationRatio: evaluation.normalizedScenario.utilizationRatio,
          concurrencyRatio: evaluation.normalizedScenario.concurrencyRatio,
        },
        calculations: evaluation.calculations,
        selection: {
          kind: "selected_region",
          regionId: selectedRegionId,
          source: "accessible_list",
          geometryEdition: "Stats NZ Regional Council 2023 generalised",
          selectedAt: new Date().toISOString(),
        },
        ...(selectedAssessment ? {
          selectedCandidate: {
            candidateId: `candidate:${selectedAssessment.candidate.id}`,
            domainOutcome: selectedAssessment.domainOutcome,
            presentationGroup: selectedAssessment.presentationGroup,
            reasons: selectedAssessment.reasons.map((reason) => reason.message),
          },
        } : {}),
        trustedEvidenceIds: ["evidence:prepared-demo"],
      }, providerHealth?.providers.some(
        (provider) => provider.providerClass === "tavily" && provider.state === "ready",
      ) ?? false, agentMode);
      setAgentSources(result.citations);
      setResearchNotice(
        result.citations.length
          ? `${result.citations.length} current web evidence candidate${result.citations.length === 1 ? "" : "s"} included`
          : result.partial ? "Web index unavailable; analysis used prepared evidence" : "Analysis used prepared evidence",
      );
      setAgentResponse(result.claims.map((claim) => claim.text).join("\n\n"));
      setAgentPayload(result.payload);
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
            <Network size={16} /> Built-in AI <i className={`status-light ${connectionStatus}`} />
          </button>
        </nav>
      </header>

      <section className="workspace">
        <div className="map-column">
          <NzMap
            sites={mapSites}
            selectedSiteId={selectedSiteId ?? ""}
            selectedRegionId={selectedRegionId}
            onSelect={selectSite}
            onSelectRegion={selectRegion}
          />
          <div className="map-insight-card">
            <div className="insight-icon"><MapPin size={19} /></div>
            <div>
              <span className="eyebrow">{selectedAssessment ? "Selected candidate" : "Selected region"}</span>
              <strong>{selectedAssessment?.candidate.name ?? selectedRegionName}</strong>
              <p>{selectedAssessment
                ? `${selectedAssessment.candidate.region} • ${OUTCOME_LABELS[selectedAssessment.domainOutcome]}`
                : "Region-level view • Select a marker for site screening"}</p>
            </div>
            <div className={`group-pill ${selectedAssessment?.presentationGroup ?? "region-only"}`}>
              {selectedAssessment ? GROUP_LABELS[selectedAssessment.presentationGroup] : "region only"}
            </div>
            <button className="icon-button" onClick={() => setActiveView("results")} aria-label="Open selected region results"><ChevronRight /></button>
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
                <div className="field-grid">
                  <label className="field-label">Cooling method <span>prepared assumption</span>
                    <select aria-label="Cooling method" value={scenario.coolingMethod ?? "hybrid"} onChange={(event) => updateScenario("coolingMethod", event.target.value)}>
                      <option value="air">Air cooling</option>
                      <option value="evaporative">Evaporative cooling</option>
                      <option value="direct_liquid">Direct liquid cooling</option>
                      <option value="hybrid">Hybrid cooling</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </label>
                  <label className="field-label">Network target <span>Gbps</span>
                    <input type="number" min="1" max="100000" step="10" value={String(scenario.targetNetworkGbps ?? 100)} onChange={(event) => updateScenario("targetNetworkGbps", event.target.value)} />
                  </label>
                </div>
                <div className="field-grid">
                  <label className="field-label">Permanent jobs claim <span>roles</span>
                    <input type="number" min="0" max="100000" step="1" value={String(scenario.permanentJobs ?? 50)} onChange={(event) => updateScenario("permanentJobs", event.target.value)} />
                  </label>
                  <label className="field-label">Regional investment claim <span>NZD m</span>
                    <input type="number" min="0" max="1000000" step="10" value={String(scenario.regionalInvestmentNzdM ?? 0)} onChange={(event) => updateScenario("regionalInvestmentNzdM", event.target.value)} />
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
                    <button key={entry.candidate.id} className={entry.candidate.id === selectedSiteId ? "selected" : ""} onClick={() => selectSite(entry.candidate.id)}>
                      <i className={`site-status ${entry.presentationGroup}`} />
                      <span><strong>{entry.candidate.region}</strong><small>{OUTCOME_LABELS[entry.domainOutcome]}</small></span>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
              </section>

              <div className="panel-cta-wrap">
                <button className="primary-button" onClick={() => setActiveView("results")}>{selectedAssessment ? "Evaluate selected site" : "Explore selected region"} <ArrowRight size={17} /></button>
                <p>Deterministic rules • No AI scoring • Separate groups</p>
              </div>
            </div>
          ) : (
            <div className="panel-scroll">
              {selectedAssessment ? <>
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
              </> : <>
                <section className="panel-section result-hero">
                  <div className="result-kicker"><span className="site-status needs_investigation" />Region {selectedRegionId}</div>
                  <h1>{selectedRegionName}</h1>
                  <div className="outcome-banner needs_investigation">
                    <div><MapPin /></div>
                    <span><small>Region-level selection</small><strong>No candidate site selected</strong></span>
                  </div>
                  <p className="result-reason">Select a map marker to run deterministic site screening, or ask the agent a region-level research question below.</p>
                </section>
                <section className="metric-ribbon results">
                  <div><span>Added peak</span><strong>{evaluation.calculations.addedPeakMw.toFixed(1)} <small>MW</small></strong></div>
                  <div><span>Annual energy</span><strong>{evaluation.calculations.annualEnergyGwh.toFixed(2)} <small>GWh</small></strong></div>
                  <div><span>Flexible load</span><strong>{evaluation.calculations.maximumFlexibleLoadMw.toFixed(1)} <small>MW</small></strong></div>
                </section>
              </>}

              <ImpactPlotDashboard plots={impactPlots} />

              <section className="panel-section ai-zone">
                <div className="ai-heading"><div className="ai-mark"><Sparkles size={18} /></div><div><span className="eyebrow">Source-aware AI workspace</span><h2>Explore this result</h2></div></div>
                <div className="agent-mode-switch" role="group" aria-label="Agent output mode">
                  <button type="button" aria-pressed={agentMode === "analysis"} onClick={() => setAgentMode("analysis")}>Analysis</button>
                  <button type="button" aria-pressed={agentMode === "visual"} onClick={() => setAgentMode("visual")}>Visualization</button>
                </div>
                <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-label="Prompt the GridLens AI agent" />
                <div className="ai-actions">
                  <button className="primary-button ai" onClick={() => void askAgent()} disabled={agentBusy}>
                    {agentBusy ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
                    {connectionStatus === "cached" ? agentMode === "visual" ? "Create visualization" : "Generate insight" : connectionStatus === "testing" ? "Checking AI service" : "AI service unavailable"}
                  </button>
                  <span><Network size={14} />{providerHealth?.providers.some((provider) => provider.providerClass !== "openai_compatible" && provider.state === "ready") ? "Web research enabled" : "Prepared evidence only"}</span>
                </div>
                {agentResponse && <div className="agent-response">
                  <span>Agent analysis</span>
                  <p>{agentResponse}</p>
                  {researchNotice && <small>{researchNotice}</small>}
                  {agentPayload && <AgentPayloadView payload={agentPayload} />}
                  {agentSources.length > 0 && <div className="agent-sources" aria-label="Web evidence candidates">
                    {agentSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ExternalLink size={12} /></a>)}
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
            <button className="modal-close" onClick={() => setSettingsOpen(false)} aria-label="Close service status"><X /></button>
            <div className="modal-heading"><div className="modal-icon"><Network /></div><div><span className="eyebrow">Operator-managed services</span><h2 id="connector-title">AI & web research</h2><p>The demo is configured by its maintainer. Users never need API keys, endpoints, or model settings.</p></div></div>
            <div className="connector-status"><i className={connectionStatus} /><span><strong>{connectionStatus === "cached" ? "Ready" : connectionStatus === "testing" ? "Checking" : connectionStatus === "error" ? "Unavailable" : "Limited"}</strong><small>{connectionMessage}</small></span></div>
            <div className="source-list">
              {(providerHealth?.providers ?? []).map((provider) => (
                <div className="source-row" key={provider.providerClass}>
                  <div className="source-icon"><Network size={16} /></div>
                  <span><strong>{titleCase(provider.providerClass)}</strong><small>{provider.capabilities.map(titleCase).join(" • ") || "No public capability"}</small></span>
                  <em>{titleCase(provider.state)}</em>
                </div>
              ))}
            </div>
            <div className="privacy-callout"><ShieldCheck size={17} /><span><strong>Same-origin security boundary</strong><small>Provider credentials stay in the private Sites Worker. The browser receives only sanitized status, cited research, and labelled analysis.</small></span></div>
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
