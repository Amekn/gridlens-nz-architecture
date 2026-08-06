# GridLens NZ — Design 1 idea brief

**Artifact version:** 0.5 draft
**Status:** Awaiting Gate 1 approval
**Prepared:** 2026-08-06 (Pacific/Auckland)

## Product intent

GridLens NZ is a browser-first decision-support and public-information application for exploring the likely People and Planet impacts of proposed data centres in Aotearoa New Zealand. It combines transparent deterministic calculations with source-grounded AI research, a whole-of-New-Zealand map, scenario comparison, and accessible explanations.

It is an early-stage investigation tool, not a consent decision, engineering study, legal opinion, environmental impact assessment, cultural impact assessment, or substitute for engagement with mana whenua and affected communities.

## Source authority and this reset

The product has been re-framed from the beginning because the user materially expanded the previously approved three-region, prepared-data-only MVP.

| Precedence | Source | Role in version 0.5 |
|---:|---|---|
| 1 | Current explicit user directions | Normative. They require a working near-production-quality prototype: visible and clickable whole-NZ region geometry and markers, operator-managed demo credentials with no end-user key/endpoint workflow, real OpenAI-compatible and Tavily-backed operations, a prompt workspace, and safe dynamic visualisations. |
| 2 | `Shared/GridLens NZ.md` | Normative foundation for the core product, deterministic calculations, assessments, traceability, and eventual architecture/software design. |
| 3 | `C:/Users/kang/Downloads/GridLens_NZ_Hackathon_Transcript.md` | Approved additive product input from Daniel: People/Planet framing, public and decision-maker perspectives, legislation/consent research, comparable projects, company track record, public discourse, conversational education, alternative-site exploration, and refreshable research. It does not override deterministic rules or select the architecture. |
| 4 | `C:/Users/kang/Downloads/Description.md` | User-supplied elaboration to borrow from selectively. Adopted product patterns are recorded below; proposed backend/model-training choices remain non-binding until their gates. |
| 5 | Other files under `Shared/` | Background reference only. `Compute Impact Atlas — Hackathon Project Brief.docx` is not normative. |

Earlier Gate 1, Gate 2, and Gate 3 artifacts remain historical context only. All gates were reset; this draft must receive a new Gate 1 approval before architecture is selected again.

## The problem

Data-centre proposals are difficult to assess early because project claims, engineering assumptions, market data, regional constraints, legislation, media reporting, and community concerns are scattered across incompatible sources. The same source can also be current for one question and inadequate for another.

Different audiences need different presentations of the same traceable record:

- communities want plain-language answers about electricity costs, water, jobs, the environment, and how to have a voice;
- planners and decision-makers want the governing instruments, consent context, evidence gaps, timelines, contradictions, comparable projects, and questions to ask the proponent;
- developers want to compare design choices, flexibility, cooling, staging, backup generation, and candidate locations;
- researchers and curators need a reproducible evidence trail with freshness, licensing, spatial coverage, and version history.

A generic chatbot alone cannot safely provide this. GridLens NZ therefore keeps calculations and assessment policy deterministic while letting an operator-configured LLM/MCP agent search, explain, compare, question, and propose visualisations around those authoritative results.

## Product principles

1. **One evidence record, multiple views.** Public/decision-maker audience modes and People/Planet lenses change presentation, not facts.
2. **Deterministic authority.** Formula outputs, category outcomes, provenance states, and warnings are computed by validated application logic. AI cannot overwrite them.
3. **AI is broad but visibly interpretive.** The agent is available throughout the workflow for research, extraction, explanation, comparison, question generation, and visualisation, with citations and an AI label.
4. **Whole-NZ selection without false uniformity.** Pinned regional polygons and visible markers make all 16 regional council areas plus Chatham Islands / Stats NZ “Area Outside Region” genuinely selectable by map and accessible list. Each data category reports its real coverage; national fallback context is labelled rather than presented as local fact.
5. **People and Planet.** People covers price/cost context, employment, community concerns, public services, legislation, and consent process. Planet covers energy, carbon, water, cooling, resilience, land, and environmental context.
6. **No hidden overall score.** The product presents evidence-qualified category outcomes and trade-offs, never a single suitability number or automated approval/rejection.
7. **Zero-credential user experience with a narrow server boundary.** Ordinary users never enter or receive provider credentials/endpoints. The browser uses versioned same-origin routes; the server contacts only operator-configured allowlisted AI/research providers and is not a general proxy.
8. **Local persistence is disclosed.** User-saved scenarios, preferences, caches, and optional prompt history may survive refresh on the same browser, but provider credentials are never browser state and user data is not cloud-synced.
9. **Safe visual generation.** The LLM may produce a validated chart/map/table specification; it cannot inject executable HTML, JavaScript, or arbitrary styling.
10. **Source terms matter.** Attribution, licence, access limits, permitted purpose, update cadence, and publisher authority are stored with each source adapter and evidence item.

## Intended experience

The application has two primary surfaces built on one evidence base:

1. **Map Explorer:** a full-screen whole-New-Zealand working map for searching existing/proposed projects, exploring contextual layers, configuring candidate scenarios, selecting suggested locations, and comparing places.
2. **Project Case File:** a document-centred workspace for one proposal, with overview, timeline, People, Planet, consent, community, company, comparables, alternatives, evidence, and a contextual AI drawer.

The public/planner audience toggle changes language, density, and controls inside both surfaces; it never creates a different truth. A user may choose a region and optional candidate point, configure a data-centre scenario, and receive deterministic electricity, energy, flexibility, water-range, resilience, economic-claim, and community-evidence outputs.

Two independent presentation controls apply to the same scenario:

- **Audience:** Public or Decision-maker.
- **Lens:** People or Planet.

A persistent prompt workspace lets the user ask questions such as:

- “How could this affect regional peak electricity demand?”
- “What water evidence is missing for this proposal?”
- “Find the current legislation and planning instruments relevant to this issue.”
- “Compare this company’s claims with cited data-centre projects in New Zealand and overseas.”
- “Show the electricity and water trade-off as an accessible chart.”
- “Which candidate locations fit these explicit constraints, and what evidence is still missing?”

The agent answers from the current scenario, deterministic result snapshot, selected evidence, and permitted web research. Generated analysis never silently becomes a verified fact or authoritative assessment.

## Daniel transcript integration

The following ideas from the supplied transcript are promoted into the new product definition:

| Transcript idea | Product interpretation |
|---|---|
| Two views for public and decision-makers | Explicit audience modes over one traceable data model. |
| People and Planet | First-class lenses with raw units, sources, uncertainty, and accessible equivalents. |
| Dynamic document/chat view | A prompt workspace beside the map/results; the response can include safe schema-driven charts, maps, tables, or narrative panels. |
| Legislation and consent review | Source-grounded decision-maker research with official links, version dates, applicability caveats, and no legal advice. |
| Company behaviour and previous environmental/ethical record | Entity-resolved, citation-backed claims separated into verified identity, reported allegation, response, regulator finding, and unresolved claim; no opaque “ethics score.” |
| Public sentiment | Web/news discourse indicators and cited themes, explicitly not representative consultation or a referendum. |
| Comparable data centres | Structured comparable-project cards with location, scale, energy/water claims, source type, date, and transferability caveats. |
| Suggest other sites | Multi-candidate exploration against user-declared constraints and trade-offs; no single automated “best site” or consent recommendation. |
| Initial context finding, caching, and updates | Device-local research cache with source URL, retrieval time, freshness, query, and explicit refresh; stale items remain visible. |
| PDF parsing and resource-consent documents | A stretch journey for local document ingestion with clear external-processing consent; not required for the core whole-NZ demo. |
| Codex app server | Retained as architecture inspiration only. The user selected isolated Design 1 and the architecture will be reconsidered after Gate 1. |

## Description.md integration

The following context is borrowed from the additional product description:

- The map is the primary discovery surface, with a place/project search, project markers, layer controls, selected-project sheet, evidence confidence, and compare tray.
- Existing, proposed, and AI-suggested candidate locations have visibly distinct marker semantics. Approximate/incomplete layers are visibly dashed or otherwise qualified.
- The Project Case File is the primary depth surface. It renders a trusted component document from structured findings, timelines, evidence cards, charts, comparisons, source links, and questions; it never renders unrestricted model-authored HTML.
- A typed evidence graph connects claim → source → date, project → company → site, concern → stakeholder, and project → comparable project. Page/section references are retained for documents.
- Community material is classified by stance, theme, stakeholder context, and evidence quality. Mana whenua evidence is a distinct category and is never merged into a public-sentiment percentage.
- Public education can be guided and conversational, but direct feedback submission and personal-data collection remain stretch scope.
- Alternative-site exploration uses a hybrid flow: the LLM parses requirements; the user confirms structured hard constraints and priorities; deterministic rules classify/exclude/flag candidates; any ordering uses a visible rule and explicit user priorities; the LLM explains evidence and uncertainty.
- The hackathon demonstration should show at least three proposed/candidate locations and one deeply researched case file, while the deterministic electricity simulation remains a supporting evidence layer rather than the entire experience.
- The visual language should feel like a calm research terminal: neutral canvas, muted basemap, thin borders, restrained teal/green selection accent, amber/red reserved for concerns, compact provenance badges, a strong reading column, and a narrow contextual AI drawer.

The following suggestions are not promoted to core requirements: unrestricted Codex server tools, an app-owned research backend, opaque site/sustainability scoring, treating fibre provider maps as licensed research data without verification, a trained/fine-tuned sentiment classifier, user-uploaded documents, or direct public-feedback storage. They may be reconsidered at later gates.

## Public-data source survey

Research was limited to primary/official documentation where possible. “Free” means no per-request charge at the documented entry tier; registration, keys, quotas, licence conditions, and attribution may still apply. Runtime adoption remains conditional on terms and a real browser CORS probe.

| Source | Intended use | Access and current Design 1 treatment |
|---|---|---|
| [Stats NZ Geographic Data Service](https://datafinder.stats.govt.nz/) and [regional council FeatureServer](https://services2.arcgis.com/vKb0s8tBIA3bdocZ/arcgis/rest/services/Regional_Council_2025/FeatureServer) | Definitive regional geometry, including 16 regions and Chatham Islands in Area Outside Region | Anonymous ArcGIS REST/GeoJSON; observed CORS support. Pin geometry/version for reproducibility. |
| [LINZ Basemaps](https://www.linz.govt.nz/guidance/data-service/linz-basemaps-guide/get-started-linz-basemaps) | National basemap tiles | Free key modes and attribution obligations; observed CORS support. Use an operator/site-restricted key or a user key according to the chosen deployment design. |
| [Transpower maps and GIS data](https://www.transpower.co.nz/our-work/industry/our-grid/maps-and-gis-data) | Transmission lines, substations, and national-grid spatial context | Open ArcGIS data; observed portal CORS support. Asset proximity is contextual and is not proof of available connection capacity. |
| [Electricity Authority tools and APIs](https://www.ea.govt.nz/data-and-insights/tools-and-apis/), [daily nodal prices/volumes](https://www.emi.ea.govt.nz/Wholesale/Datasets/DispatchAndPricing/NodalPricesAndVolumes), and [NSP mapping](https://www.emi.ea.govt.nz/Wholesale/Datasets/MappingsAndGeospatial/NetworkSupplyPointsTable) | Authoritative historical/near-real-time dispatch, node load/generation/price, POC mapping, and prepared regional baselines | Prefer the subscribed real-time dispatch API when a user key and CORS test succeed. Otherwise use EMI's anonymous Azure Blob REST interface at build time—no report-page scraping. Build a compact latest-complete-12-month aggregate from daily five-minute nodal files and the latest compatible NSP table, retaining raw URLs/checksums/coverage. The Blob response did not expose browser CORS in testing. |
| [EM6 API Integration Guide](https://www.ems.co.nz/em6-api-integration-guide/) | Anonymous live regional price, free 24-hour prices, reserve prices, carbon intensity, and aggregated intermittent-generation forecast | Keep as low-friction live context. Anonymous production feeds observed with CORS. EM6 grid zones/nodes require an explicit mapping and do not replace administrative-region baselines. |
| [LAWA downloads](https://www.lawa.org.nz/download-data) | Water quantity/quality, groundwater, rivers, lakes, air, land cover, and environmental context | Use licensed, versioned downloads with per-dataset attribution/licence. No documented general public JSON API was found; do not scrape the runtime website. |
| [NIWA developer APIs](https://developer.niwa.co.nz/) | Observation, forecast, climate/model, tide, and solar context | Free daily allowance with user API key; observed credentialed CORS preflight behavior. Only task-relevant APIs and permitted licences may be enabled. |
| [GeoNet API](https://api.geonet.org.nz/) and [WFS](https://wfs.geonet.org.nz/) | Earthquake, intensity, volcano, and natural-hazard context | Anonymous GeoJSON/WFS; observed CORS on GET. Current events are context, not site-specific engineering conclusions. |
| [Data.govt.nz APIs](https://www.data.govt.nz/catalogue-guide/using-data-govt-nz-apis/about-data-govt-nz-apis) | Discover public datasets and retrieve CKAN/DataStore metadata | Anonymous CKAN API with observed CORS. It is a discovery catalogue; publisher, licence, schema, and freshness must be assessed per dataset. |
| [Stats NZ API Portal](https://portal.apis.stats.govt.nz/) and published CSVs | Regional population, employment, earnings, census, and economic baselines | Free subscription key for API, or versioned published downloads. Use for independently sourced regional context, not to validate a developer’s specific jobs claim by itself. |
| [EECA Energy End Use Database](https://www.eeca.govt.nz/insights/data-tools/energy-end-use-database/) and [TIMES-NZ](https://www.eeca.govt.nz/insights/data-tools/new-zealand-energy-scenarios-times-nz/) | National energy-use context, flexible-demand and future-scenario reference, comparable assumptions | Open CSV/source data with stated licences; use as prepared context, not a live regional grid-capacity feed. |
| [MfE Measuring Emissions Guide](https://environment.govt.nz/what-you-can-do/calculate-your-emissions/measuring-emissions-guide/) | Versioned NZ emissions factors and methodology | Annual prepared import with exact edition/factor provenance. |
| [NZTA open data and APIs](https://nzta.govt.nz/about-us/our-data-and-official-information/use-our-data) | State-highway access, traffic counts, events, and transport/logistics context | Anonymous open APIs/ArcGIS data; observed portal CORS. Transport context does not prove construction feasibility. |
| [New Zealand Legislation developer API](https://www.legislation.govt.nz/learn-more/legislation-data/developer-api/) | Current Acts, Bills, versions, and official XML/PDF/HTML links | Free API key on request and 10,000-request daily default documented. No browser CORS was observed, so use prepared records or provider-side read-only research unless this changes. Always link to official text and show version date. |
| [NZBN API](https://www.nzbn.govt.nz/using-the-nzbn/nzbn-services/api/) | Resolve a New Zealand business’s legal identity and primary business data | Free subscription. Identity data cannot establish environmental or ethical performance; adoption requires terms and CORS verification. |
| [Companies Office APIs](https://www.companiesoffice.govt.nz/data-services/ways-to-get-our-data/using-our-data-through-apis/) | Company/register facts and selected compliance records | Most APIs have no usage charge but require setup/credentials. Use only supported public fields and do not infer conduct from registration status. |
| [EPA application databases](https://www.epa.govt.nz/database-search/eez-applications/) and council portals | Proposal, application, consent, decision, and submission documents | Discovery/link/document source; no uniform national resource-consent API was found. Use official document links or source-grounded agent research, never silent scraping. |
| [Tavily REST API](https://docs.tavily.com/documentation/api-reference/introduction) and [remote MCP](https://docs.tavily.com/documentation/mcp) | Web search, extraction, crawl/map, and deep research for the LLM agent | User-supplied credential; documented free monthly credits and observed REST CORS. Prefer Authorization headers. If a key is embedded in an MCP URL, treat and redact the entire credential-bearing URL as a secret. |

### Sources not adopted as free research inputs

- Broadband Map NZ has a useful location API, but its published terms state that the availability API cannot be used for research and sustained access is paid. It is not a GridLens evidence source under the current purpose.
- A web page, search result, AI summary, or data catalogue entry is not automatically authoritative. Authority belongs to the underlying publisher and specific dataset.
- Asset proximity, current price, current weather, current carbon intensity, or recent news cannot alone establish long-term site suitability.

## Success measures for the revised MVP

1. Pinned Stats NZ regional polygons and visible project/candidate markers render at the national starting view; every one of the 16 regional council areas and Chatham Islands / Area Outside Region can be selected by polygon click/tap, marker, and accessible list.
2. Deterministic scenario calculations work for every selected geography; evidence-dependent categories expose `complete`, `partial`, `stale`, `missing`, or `failed` coverage without fabricated local precision.
3. The Southland 50 MW demonstration still produces exactly 65 MW facility demand, 455.52 GWh annual energy, and 19.5 MW maximum flexible load before display rounding.
4. The local hackathon demo derives operator configuration from ignored `TEST.md`; the hosted demo uses Sites runtime secrets; no ordinary user enters a key or endpoint and exact secret canaries never reach source, client bundles, responses, browser storage, logs, or exports.
5. Same-origin agent/research routes accept only bounded typed operations and contact only fixed operator-configured HTTPS providers; arbitrary endpoints, methods, headers, models, and tools are rejected.
6. Deterministic results remain fully usable without AI, MCP, or live data.
7. The agent can answer a cited question from the current scenario, perform Tavily-backed research when configured, and generate at least one accessible schema-validated visualisation without executing model-authored code.
8. Public and decision-maker audience modes and People/Planet lenses preserve the same underlying values, evidence, provenance, and uncertainty.
9. A company, legislation, comparable-project, public-discourse, or alternative-site claim is visibly typed and cited; no AI claim is promoted to verified fact merely because it sounds plausible.
10. The deployed app passes keyboard, screen-reader alternative, zoom, secret-leak, prompt-injection, CORS-failure, offline/AI-failure, and reproducibility tests.
11. An EMI ingestion proof joins exact POC codes, transforms NSP NZTM coordinates to WGS84, assigns them through pinned Stats NZ point-in-polygon geometry, and produces a source-labelled regional time-series aggregate without treating local generation as spare capacity.
12. The hackathon journey shows a searchable Map Explorer with at least three existing/proposed/candidate records and opens one prepared Project Case File containing a timeline, consent/document evidence, a discrepancy, community themes, company/comparable context, alternatives, and evidence-gap counts.

## Constraints carried into architecture

- All Design 1 files remain under `design-1-browser-first/`; `Shared/` remains read-only.
- OpenAI Sites remains the target hosting surface.
- Design 1 retains a map-first browser experience with no user database; privileged behavior is limited to a narrow same-origin AI/research adapter backed by operator-managed runtime secrets.
- Browser public-data calls remain explicit/CORS-compatible or use pinned assets. Provider calls occur only server-side to fixed HTTPS destinations.
- The custom model endpoint may implement Responses API, Chat Completions, both, or neither; capabilities must be tested rather than assumed.
- Remote MCP use is read-only and allowlisted. No external write/action tool is part of this MVP.
- AI output is untrusted data. It cannot execute code, mutate deterministic results, change evidence authority, or issue a formal recommendation.
- All public-source use must comply with its licence, attribution, rate, freshness, and permitted-purpose conditions.

## Gate 1 scope boundary

The core Gate 1 scope includes the whole-NZ polygon-and-marker Map Explorer, a prepared Project Case File, scenario calculations, data-coverage reporting, People/Planet and audience views, operator-managed model/Tavily/MCP configuration, same-origin agent/research routes, conversational prompting, safe dynamic visualisation, comparisons, evidence traceability, and impact brief.

Local proposal/PDF ingestion, representative community-feedback collection, authenticated cloud collaboration, app-owned server persistence, and PDF export are stretch/deferred capabilities unless separately promoted at a later gate.
