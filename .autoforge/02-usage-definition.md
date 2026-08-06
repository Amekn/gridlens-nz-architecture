# GridLens NZ — Design 1 usage definition

**Artifact version:** 0.5 approved
**Status:** Approved at Gate 1
**Approval evidence:** User message, "Approve Gate 1 v0.5"
**Change source:** User messages requiring a zero-credential user journey, genuinely selectable map regions and visible markers, and near-production quality
**Companion requirements:** `01-requirements.md` version 0.5 approved

## Actors and authority

| Actor | Permissions and authority |
|---|---|
| Public/community user | Select any NZ geography, create/compare scenarios, inspect evidence and calculations, ask questions, generate safe visuals, save locally, and copy a brief. No identity required. The user’s entries remain assumptions unless backed by qualifying evidence. |
| Planner/decision-maker | Uses the same public app with a decision-maker presentation: legislation/consent context, timelines, conflicts, company/comparable-project records, missing evidence, and questions for the proponent. The app does not confer official decision authority. |
| Developer/proponent | Tests design, staging, cooling, flexibility, backup, and candidate-location alternatives. Proposal statements are claims, not verified facts. |
| Dataset maintainer | Curates schemas, source registry, prepared regional data, EMI aggregates, factors, thresholds, geometry, licences, and evidence before deployment. No public in-app administration surface is assumed. |
| Site operator | Configures and rotates server-only model/Tavily/MCP secrets, builds, publishes, verifies, rolls back, and removes the Sites deployment. Has no ordinary access to device-local scenarios, prompts, or cached research. |
| Operator-configured model endpoint | Produces untrusted, labelled research/analysis and safe visual specifications behind the same-origin adapter. It has no authority over calculations, assessments, provenance, evidence freshness, or formal decisions. |
| Operator-approved MCP/REST research connector | Performs allowlisted read-only search, extraction, crawl/map, or research behind the same-origin adapter. It cannot perform external writes or promote its output to verified evidence. |

## Shared usage invariants

- The authoritative result snapshot is deterministic and immutable.
- Every external request identifies the non-secret provider class and selected context; unrelated local records are excluded and provider secrets/endpoints remain server-only.
- Every evidence-dependent statement is typed and cited or explicitly unsupported.
- Public/decision-maker audience mode and People/Planet lens never alter underlying values or evidence.
- AI/MCP/live-data failure never blocks local calculations or the deterministic brief.
- Whole-NZ selection does not imply equal regional evidence depth, spare grid capacity, water allocation, parcel feasibility, consent status, or representative community support.

## UJ-001 — Explore New Zealand and select a place or project

- **Actor and goal:** Any user wants to find a place, existing/proposed project, or candidate-location context.
- **Preconditions:** Static application and pinned Stats NZ geometry are available; no account is required.
- **Trigger:** User opens the deployed URL.
- **Main path:** Read the indicative-use/privacy summary; see pinned Stats NZ region polygons and distinct project/candidate markers at the national starting view; select any regional polygon by clicking/tapping inside it, or select a visible marker/list item; observe the same selected region ID, highlight, label, summary, and scenario context across map and panel; toggle only genuinely available declared layers; continue to the scenario or Project Case File.
- **Alternate path:** Use the accessible keyboard/list equivalent, start from a saved scenario, enter coordinates, or place a candidate point directly.
- **Boundary/invalid behavior:** A border point uses the lexicographically smallest matching region ID. A point outside recognized geometry is retained as a coordinate but detailed region-dependent evidence is missing; the nearest region is never substituted.
- **Failure/recovery:** A failed basemap leaves the pinned regional polygons, markers, accessible region list, and selection usable. Invalid geometry disables only affected spatial functions and identifies its version/error; marker load failure is visible rather than silently rendering an empty map.
- **Outputs:** Selected region/project ID, optional WGS84 point, marker status, layer/source manifest, resolution method, geometry version, coverage matrix, compare-tray state, correlation ID.
- **Postcondition:** A location context exists; no suitability inference has occurred.
- **Traceability:** FR-MAP-001–004, FR-LOC-001–004, FR-EVD-010, FR-RES-001; AC-001–002, AC-023.

## UJ-002 — Use the operator-configured AI and research service

- **Actor and goal:** User wants the built-in AI research agent without managing technical credentials or endpoints.
- **Preconditions:** The site operator configured server-only model and optional Tavily/MCP secrets; deterministic features require no provider.
- **Trigger:** Open the app or enter a prompt from a supported context.
- **Main path:** The UI reads a sanitized same-origin health state; when ready, the user reviews the provider/privacy disclosure and submits a prompt; the browser sends only the prompt and selected context to the versioned same-origin route; the server validates and bounds the request, contacts only configured allowlisted providers, and returns sanitized typed analysis and cited evidence.
- **Alternate paths:** Use deterministic results while AI/research is limited or unavailable; use model-only commentary when Tavily is unavailable; cancel an in-flight request.
- **Boundary/invalid behavior:** User-supplied destinations, headers, models, keys, MCP endpoints/tools, oversized bodies, unknown fields, and cross-origin API calls are rejected. The UI has no credential form.
- **Failure/recovery:** Missing configuration, 401/403/429/5xx, timeout, malformed upstream output, and provider outage return a scoped public status. Operators rotate configuration outside the public UI; no client code change or browser storage repair is required.
- **Outputs:** Sanitized readiness/capability state, provider-class label, request receipt, typed response or structured failure; no secret, private endpoint, or upstream body diagnostics.
- **Postcondition:** A compatible operator-managed service is available or AI features remain visibly unavailable while deterministic features work.
- **Traceability:** FR-CONN-001–008, NFR-SEC-002, NFR-PRI-001; AC-010–013.

## UJ-003 — Build and analyse the 50 MW Southland fixture

- **Actor and goal:** Planner or developer wants the reference deterministic assessment.
- **Preconditions:** Southland is selected and its prepared profile/factor manifest validates.
- **Trigger:** Select 50 MW, 80% utilisation, PUE 1.3, air cooling, 30% flexibility, diesel backup, and 50 permanent jobs; choose Analyse.
- **Main path:** Validate and label inputs; calculate facility demand, annual energy, flexible-load bound, water range where supported, and 24-hour flexibility; combine with evidence statuses; run deterministic category policies; render results before optional live/AI enrichment.
- **Alternate path:** Replace any preset with a custom valid user assumption; compare after analysis.
- **Boundary/invalid behavior:** Blocking input errors stop snapshot creation. Suspicious but possible values warn without silent modification.
- **Failure/recovery:** A metric-specific failure leaves unaffected outputs. AI, live feed, or evidence failure adds a visible status and does not delay calculations.
- **Outputs:** Exactly 65 MW, 455.52 GWh, and 19.5 MW before formatting; immutable scenario/result IDs; per-result status; category outcomes; complete reproducibility manifest.
- **Postcondition:** An authoritative local result snapshot exists.
- **Traceability:** FR-SCN-001–003, FR-CAL-001–006, FR-ASM-001–008; AC-003–006.

## UJ-004 — Review a Project Case File through public and decision-maker views

- **Actor and goal:** A community member or planner wants information at the appropriate depth.
- **Preconditions:** A project/candidate and result/evidence snapshot exist; the deep demonstration case has prepared documents and evidence.
- **Trigger:** Open Project Case File, then switch audience and lens controls or navigate its trusted sections.
- **Main path:** Review overview, evidence counts, project facts/claims, documents, timeline, discrepancies, company/comparables, community evidence, sources, and unresolved questions. Public + People explains cost context, jobs, nearby population/services, noise/air, ownership/trust, community evidence/benefits, and participation limits in plain language. Public + Planet explains energy, carbon, water/cooling, resilience, land/ecology, hazards, and waste heat. Decision-maker modes add formulas, policies, consent/legislation context, evidence conflicts, source extracts, and questions for the proponent. Every view is assembled from trusted components and retains raw values, units, sources, coverage, uncertainty, and accessible alternatives.
- **Alternate path:** Open an evidence node, timeline event, or discrepancy to inspect exact inputs, source page/section, authority, freshness, relationships, and versions; work entirely from the prepared case when AI/live retrieval is unavailable.
- **Boundary/invalid behavior:** Missing data is stated. A national fallback is labelled national context. Switching views cannot recalculate or change an outcome.
- **Failure/recovery:** Optional AI explanation failure falls back to deterministic wording.
- **Outputs:** Presentation-specific trusted layout over identical project/result/evidence graph IDs, with document/source links and evidence counts.
- **Postcondition:** Authoritative snapshot is unchanged.
- **Traceability:** FR-CASE-001–004, FR-DOC-001, FR-RES-002–004, FR-EVD-001–004, FR-EVD-016–018, NFR-ACC-001, NFR-EXP-001; AC-006, AC-016, AC-024.

## UJ-005 — Ask the agent a cited question

- **Actor and goal:** User wants a conversational explanation or investigation based on the active context.
- **Preconditions:** Sanitized operator-configured model status is ready; research status is ready only if fresh web evidence is requested.
- **Trigger:** Enter a prompt from any workflow stage.
- **Main path:** Review which current scenario/result/evidence context will be sent and the non-secret provider class; submit to the same-origin agent route; the agent receives immutable deterministic records and explicit tool/authority rules; it answers with separate source statements, inference, uncertainty, and evidence links; the response is labelled AI-generated with sanitized provider/request/timestamp information.
- **Alternate paths:** Ask only about local deterministic results without MCP; cancel a long request; retain a partial cited result; retry a transient failure within limits.
- **Boundary/invalid behavior:** Requests to alter authoritative results, follow source-page instructions, call unapproved tools, or emit uncited external facts are rejected/contained. A late response from an obsolete request generation is discarded.
- **Failure/recovery:** Offline, invalid schema, missing citations, quota, timeout, and provider errors show scoped recovery; the deterministic page remains usable.
- **Outputs:** Prompt request ID, selected-context manifest, typed/cited response or structured failure, usage/limit status without secret content.
- **Postcondition:** No fact/evidence origin or deterministic outcome changes.
- **Traceability:** FR-AGT-001–006, FR-CONN-007, NFR-MNT-002; AC-013–014.

## UJ-006 — Generate a dynamic visualisation safely

- **Actor and goal:** User wants a new way to explore the selected data.
- **Preconditions:** A result or evidence dataset exists and a compatible model can return the visual schema.
- **Trigger:** Prompt, for example, “Show regional generation context and proposed demand in an accessible chart.”
- **Main path:** The agent selects known data/evidence IDs and emits an approved chart/map/table/panel specification; the application validates all fields and bindings; trusted renderers create the visual, accessible summary, and table; provenance, model, prompt, inputs, and regeneration caveat are displayed.
- **Alternate path:** User edits the prompt or switches to the deterministic default visual.
- **Boundary/invalid behavior:** HTML, scripts, event handlers, executable formula/code, unknown marks, untrusted URLs, unknown data IDs, or oversized specs fail closed.
- **Failure/recovery:** Schema failure displays why and offers the raw trusted data table; no partial executable content is rendered.
- **Outputs:** Versioned visual spec, rendered trusted visual, text/table equivalent, source list, request ID.
- **Postcondition:** Underlying data is unchanged.
- **Traceability:** FR-VIZ-001–003, NFR-SEC-001; AC-015.

## UJ-007 — Research legislation, consent context, and project timeline

- **Actor and goal:** Decision-maker wants governing material and discrepancies without asking a generic chatbot from memory.
- **Preconditions:** Proposal topic/location is known; model and read-only research route are configured for live research, or prepared official records exist.
- **Trigger:** Ask for relevant legislation, planning instruments, consent/application documents, or timeline review.
- **Main path:** Search official NZ Legislation, MfE, EPA, council, and other declared sources; capture official title, publisher, document/version date, applicability, URL, source extract, and retrieval time; compare proposal milestones/claims with cited records; label AI inference and unresolved applicability; generate questions for professional review.
- **Alternate path:** Open official source manually where API CORS prevents direct retrieval; use a prepared versioned legislation record.
- **Boundary/invalid behavior:** The agent cannot declare legal applicability, consent completeness, or likely approval. Search snippets are discovery evidence until the underlying official document is cited.
- **Failure/recovery:** Missing/no-national-consent API yields link-level or missing evidence, never silent scraping or an invented consent history.
- **Outputs:** Legislation/document cards, timeline with source IDs, discrepancy list, missing records, legal-advice disclaimer.
- **Postcondition:** Material is candidate/official evidence according to its type; assessment policy remains deterministic.
- **Traceability:** FR-AGT-002, FR-AGT-004, FR-AGT-008, FR-EVD-002, FR-EVD-006; AC-017.

## UJ-008 — Examine company record and comparable projects

- **Actor and goal:** Public user or decision-maker wants to understand the proponent and relevant precedent.
- **Preconditions:** A company/proponent name, NZBN, or proposal identifier is supplied.
- **Trigger:** Ask for company background, prior environmental/ethical issues, or comparable data centres.
- **Main path:** Resolve legal identity through NZBN/Companies Office when permitted; search primary company/regulator/court/government sources and clearly typed reporting; separate identity fact, company claim, allegation, company response, official finding, and unresolved item; construct comparable-project cards with location, scale, energy/water claims, dates, source type, and transferability caveat.
- **Alternate path:** User manually disambiguates two entities with similar names.
- **Boundary/invalid behavior:** Registration status is not conduct evidence. Absence of a search result is not proof of a clean record. No opaque ethics/reputation score is produced.
- **Failure/recovery:** Entity ambiguity stops synthesis and asks for a legal identifier; unavailable source remains missing.
- **Outputs:** Entity resolution record, typed claim/finding timeline, comparable cards, cited caveats.
- **Postcondition:** No allegation becomes a finding and no comparison becomes a forecast.
- **Traceability:** FR-AGT-002, FR-AGT-004, FR-AGT-008, FR-EVD-001–002; AC-017.

## UJ-009 — Explore public discourse without claiming representation

- **Actor and goal:** User wants to know which concerns are visible in public reporting or submissions.
- **Preconditions:** Region/project/topic and research connector are available, or curated submissions exist.
- **Trigger:** Ask, “What are people concerned about?” or open Community evidence.
- **Main path:** Retrieve time-bounded cited news, official submissions/consultation outputs, and public web sources; deduplicate and classify each evidence item with controlled stance, theme, stakeholder type, and evidence-quality values; show source mix, date range, counts, limitations, and examples; keep mana whenua interests/evidence distinct from generic community categories; label results as web/news discourse unless representative methodology is independently established.
- **Alternate path:** View only official consultation material.
- **Boundary/invalid behavior:** No demographic inference, individual profiling, community-wide percentage, referendum claim, or low community concern is derived from search results.
- **Failure/recovery:** Sparse/biased sources yield insufficient evidence and a methodology warning.
- **Outputs:** Cited stance/theme/stakeholder/evidence-quality cards, source/methodology summary, distinct mana whenua section/status, non-representative label, unresolved consultation needs.
- **Postcondition:** Deterministic community assessment follows its representative-evidence gate.
- **Traceability:** FR-AGT-007, FR-ASM-006, FR-EVD-002, FR-EVD-017; AC-005, AC-017, AC-025.

## UJ-010 — Refresh and reconcile live and prepared evidence

- **Actor and goal:** User wants current context without losing reproducibility.
- **Preconditions:** Prepared bundle is valid; one or more live connectors are enabled.
- **Trigger:** Open a result or choose Refresh evidence.
- **Main path:** Load prepared authoritative baselines immediately; fetch CORS-compatible live EM6/NIWA/GeoNet/other enabled sources; preserve observation/retrieval time, geography, unit, and source; map EM6 grid zones/nodes only through declared mappings; display conflict or precedence records instead of overwriting; cache research/evidence locally with its original retrieval time.
- **Alternate path:** Work from prepared data offline or manually refresh only one connector.
- **Boundary/invalid behavior:** A live value cannot imply long-term capacity. National data cannot be relabelled local. Stale cache cannot appear freshly retrieved.
- **Failure/recovery:** One feed’s failure marks only that source/category and exposes retry; previous data remains visibly stale/cached.
- **Outputs:** Updated evidence records, coverage/conflict matrix, cache entries, source/adapter versions.
- **Postcondition:** A new result may be explicitly recomputed against a new evidence snapshot; an existing immutable snapshot is not silently changed.
- **Traceability:** FR-EVD-003–012, FR-ERR equivalent in NFR-REL-002; AC-007–009, AC-020.

## UJ-011 — Build regional electricity context from EMI nodes

- **Actor and goal:** Dataset maintainer wants a reproducible NZ-wide electricity baseline without scraping report HTML.
- **Preconditions:** Network access during build; registered EMI source paths; pinned Stats NZ geometry; supported coordinate transform.
- **Trigger:** Scheduled/manual prepared-data refresh before release.
- **Main path:** Use the anonymous EMI Azure Blob REST list/file interface—or configured real-time dispatch API where appropriate—to select the latest complete rolling 12 months of daily `DispatchNodalPricesAndVolumes`; download the latest compatible current NSP CSV; retain raw URL, ETag/last-modified, checksum, schema and coverage; exact-join POC codes; convert valid NZTM easting/northing (`EPSG:2193`) to WGS84; point-in-polygon assign the Stats region; preserve the separate NSP network reporting region; filter/record dead, disconnected, duplicate-run, missing-interval, unmatched, and unmapped rows; aggregate interval load, modelled dispatch generation, and price context into compact region/node assets.
- **Alternate paths:** Use `Generation_MD` as a separately labelled legacy half-hourly plant/fuel cross-reference; use the subscribed real-time dispatch API for optional live data if CORS and user credentials permit.
- **Boundary/invalid behavior:** Handle NZ offsets and daylight-saving interval counts; keep MW and kWh distinct; do not guess missing coordinates, assign nearest nodes, equate generation with spare capacity, or infer regional self-sufficiency/headroom.
- **Failure/recovery:** Incomplete days/schema drift/unacceptable unmatched coverage fail the prepared bundle or publish it as incomplete under an explicit threshold decided at architecture/logic review; the last verified asset remains available.
- **Outputs:** Compact regional/node time series, raw manifest/checksums, source/coverage/quality report, excluded-row ledger, transform/geometry versions.
- **Postcondition:** Browser-loadable versioned electricity context exists and can be independently reproduced from official raw files.
- **Traceability:** FR-EVD-013–015, FR-DAT embodied by FR-EVD-005, NFR-REL-001, NFR-MNT-001; AC-007, AC-022.

## UJ-012 — Simulate flexibility and explain constraints

- **Actor and goal:** Planner/developer wants to see possible peak-demand reduction.
- **Preconditions:** Valid scenario and compatible prepared regional demand profile.
- **Trigger:** Analyse or change flexibility.
- **Main path:** Build baseline facility load, identify configured regional peaks, and deterministically allocate eligible same-day work to minimise maximum combined load while respecting all bounds; display original/shifted facility and combined profiles, shifted energy, achieved reduction, active constraints, and simplification warning.
- **Alternate path:** Insufficient headroom moves only feasible work; remainder stays at source hours with reason.
- **Boundary/invalid behavior:** 0% produces identical profiles; 100% remains bounded. The frozen counterexample produces the 25/25 MWh allocation and 125 MW peak.
- **Failure/recovery:** Profile incompatibility removes only simulation and retains non-profile calculations.
- **Outputs:** Hourly series, moved-energy ledger, invariants, optimal peak target, versions.
- **Postcondition:** Energy conservation and maximum-flexibility invariants hold.
- **Traceability:** FR-CAL-002–003, FR-CAL-005; AC-004.

## UJ-013 — Compare designs and candidate locations

- **Actor and goal:** Developer/planner wants trade-offs across an improved design or two sites.
- **Preconditions:** At least one valid scenario snapshot.
- **Trigger:** Duplicate for design comparison or add candidate B.
- **Main path:** Change PUE, flexibility, cooling, demand response, backup restrictions, staging, or location; select explicit comparison criteria and priorities; calculate deterministic metric/assessment/coverage deltas; optionally ask the agent to explain trade-offs and missing evidence using cited records.
- **Alternate path:** Describe site needs in the prompt workspace; the agent parses them into a typed requirement profile; the user reviews and confirms/corrects every constraint and priority; deterministic rules then exclude or classify candidate points and, if requested, order them by the visible confirmed priorities; the agent explains the resulting trade-offs and follow-up questions.
- **Boundary/invalid behavior:** Unconfirmed parsed constraints cannot affect candidates. Invalid edits retain the last valid result as visibly stale. Missing data remains missing. No hidden weights, overall score, objective “best site,” or approval language is produced.
- **Failure/recovery:** AI failure leaves the deterministic comparison complete.
- **Outputs:** Confirmed requirement profile, deterministic exclusion/classification ledger, optional visible priority order and sensitivity view, two or more immutable snapshots, delta record, evidence/coverage differences, and cited AI commentary if requested.
- **Postcondition:** Baseline is never silently overwritten.
- **Traceability:** FR-SCN-004, FR-AGT-009–010, FR-ASM-008, FR-LOC-003, FR-RES-004; AC-018, AC-026.

## UJ-014 — Handle water uncertainty independently

- **Actor and goal:** User wants useful electricity results despite inadequate water evidence.
- **Preconditions:** Other required inputs are valid.
- **Trigger:** Cooling is unknown, factor is absent, or qualifying regional water thresholds/evidence are unavailable.
- **Main path:** Complete electricity/flexibility results; calculate water range only with a valid method/factor; return insufficient water evidence unless current authoritative regional evidence and source-backed annual/peak thresholds exist; show missing cooling, use, allocation, dry-period, and source questions.
- **Alternate path:** A later scenario method/source yields a versioned range and qualifying assessment.
- **Boundary/invalid behavior:** No zero use, midpoint, or low concern is invented; conservative upper estimate is used for thresholds.
- **Failure/recovery:** Water-specific source/factor failure stays scoped.
- **Outputs:** Water range or no estimate, assessment/reasons, missing-evidence list, provenance.
- **Postcondition:** Other categories remain available.
- **Traceability:** FR-CAL-004, FR-CAL-006, FR-ASM-003; AC-005.

## UJ-015 — Produce and copy an impact brief

- **Actor and goal:** User wants a standalone technical or plain-language record.
- **Preconditions:** Active immutable result snapshot.
- **Trigger:** Open Impact Brief and select view/lens.
- **Main path:** Deterministic templates assemble values, outcomes, evidence, assumptions, conflicts, coverage, unresolved questions, limitations, and disclaimer; optional cited AI analysis appears in a separate labelled section; trusted records reconstruct all authoritative statements; copy Markdown/text.
- **Alternate path:** Clipboard unavailable exposes selectable content and manual-copy guidance.
- **Boundary/invalid behavior:** Missing evidence is stated. AI text cannot change facts/outcomes or remove disclaimer/source list.
- **Failure/recovery:** Malformed/late/uncited AI is omitted; deterministic brief remains complete.
- **Outputs:** Copied brief, snapshot/version/source manifest, AI appendix metadata if used.
- **Postcondition:** No server storage or share link is created.
- **Traceability:** FR-RPT-001–003, FR-RES-002; AC-019.

## UJ-016 — Save, restore, refresh, and clear local data

- **Actor and goal:** Returning user wants convenience and control on the same device.
- **Preconditions:** Browser transactional storage or session fallback.
- **Trigger:** Explicit save/delete/clear, reload, or restore.
- **Main path:** Store each scenario, comparison, non-secret UI preference, cache, and optional prompt-history record in its own schema; use stable IDs/revisions/operation IDs; restore with migrations, validation, quarantine, and source-version drift reporting; refresh cached research explicitly; clear a record class or all local data with an exact confirmation summary.
- **Alternate path:** Use session-only history while retaining saved scenarios; provider configuration is never part of browser storage.
- **Boundary/invalid behavior:** Corrupt records are quarantined individually. Persisted origins cannot elevate trust. Older tabs cannot resurrect tombstoned records.
- **Failure/recovery:** Quota/storage denial preserves in-memory work and shows guidance; crash-after-commit retry reconciles by operation ID; conflicts are visible.
- **Outputs:** Local records/tombstones, migration/drift/cache status, clear receipt; no cloud identity.
- **Postcondition:** The explicit operation occurs exactly once or reports a scoped failure without silent sibling-data loss.
- **Traceability:** FR-SAVE-001–002, FR-CONN-002–004, FR-EVD-012; AC-011, AC-020.

## UJ-017 — Maintain, publish, roll back, and remove

- **Actor and goal:** Dataset maintainer and site operator want a safe release lifecycle.
- **Preconditions:** Authorized repository/Sites access outside the public app.
- **Trigger:** Source/schema/factor/geometry/policy/application update.
- **Main path:** Update versioned assets/registry with provenance, licences, coverage and checksums; configure/rotate local ignored `TEST.md` values and hosted encrypted runtime secrets; run source, calculation, simulation, assessment, same-origin agent/research, map-polygon/marker, storage, accessibility, security/privacy, exact-secret scan, production build, and representative end-to-end tests; publish immutable Sites release; verify the catalog contains at least three existing/proposed/candidate records and one prepared deep Project Case File, plus whole-NZ polygon selection, visible markers, Southland fixture, Tavily, AI explanation, visual, EMI aggregate, and deterministic offline brief.
- **Alternate path:** Disable a source adapter with an explicit tested reason; roll back to last known-good release.
- **Boundary/invalid behavior:** Missing attribution/provenance/units, schema drift, invalid or non-selectable geometry, invisible markers, a secret/client endpoint canary, open-proxy behavior, absolute local path, unacceptable coverage, failing tests, or unsafe generated-content path blocks release.
- **Failure/recovery:** Failed publish leaves/returns to last known-good deployment. Removal deletes hosted release; users clear device-local data separately.
- **Outputs:** Version-control history, validation/coverage/link/licence reports, release manifest, hosted URL, rollback/removal evidence.
- **Postcondition:** Production is a verified release or last known-good rollback.
- **Traceability:** All NFRs, FR-MAP-001–004, FR-CASE-001–004, FR-DOC-001, FR-EVD-005, FR-EVD-013–018; AC-021–024.

## Stretch journey — local proposal/PDF review

If promoted later, a user may select a local proposal, consent, or supporting PDF/text document; browser-side code extracts text where possible; the app shows exactly which content will be sent to the chosen model/research provider; the user confirms or declines; extracted statements remain proposal claims; document instructions are inert; and removal clears the local document/chunks. This stretch journey does not block the core Gate 1 MVP.

## Stretch journey — direct public feedback

If promoted later, the product may collect structured public feedback only after a separate privacy, moderation, representation, retention, abuse, and governance design is approved. Until then, the core product can explain issues and participation routes but does not collect submissions, infer demographic representation, or present app interactions as consultation.

## Hackathon demonstration sequence

1. Start in Map Explorer, search or select one of at least three existing/proposed/candidate records, inspect layers/evidence confidence, and add two candidates to the compare tray.
2. Open the prepared deep Project Case File; switch Public/Decision-maker and People/Planet views while the evidence graph, values, sources, and statuses remain identical.
3. Run the Southland 50 MW deterministic fixture and inspect electricity, carbon, water, flexibility, community, and evidence-gap outputs.
4. Show the built-in provider status without a credential form, ask a cited Tavily-backed question through the configured same-origin service, and generate a safe schema-bound visual.
5. Describe site needs, confirm the parsed requirement profile, apply deterministic screening/ordering, compare candidates, and copy a complete deterministic impact brief with optional labelled AI commentary.
6. Disconnect live/AI services and prove the prepared map, deep case, deterministic calculations, evidence provenance, and impact brief still work.

## Usage acceptance summary

Core release acceptance requires UJ-001 through UJ-017 where applicable, excluding the explicitly labelled stretch journeys. Automated tests cover deterministic, boundary, schema, spatial, unit/DST, concurrency, migration, failure, prompt/tool injection, secret leakage, and reproducibility behavior. Manual evidence covers accessibility, privacy comprehension, map/case-file usability, hosted first run, source attribution, connector persistence, and release lifecycle.
