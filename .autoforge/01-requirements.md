# GridLens NZ — Design 1 requirements

**Artifact version:** 0.3  
**Status:** Approved at Gate 1 v0.3 on 2026-08-06  
**Source:** [GridLens NZ requirements and example usage](https://drive.google.com/file/d/1pjhr1l5imWTPOK_E-YtKKIu_2hcuqGhO/view)

## Source authority

| Source | Authority in version 0.3 |
|---|---|
| `Shared/GridLens NZ.md` | **Sole normative source** for product scope, requirements, usage, architecture, software design, logic, and acceptance. |
| All other `Shared/` files | Non-authoritative background reference only; they cannot introduce or override requirements or design. |

This precedence was explicitly directed by the user. A trained forecasting model, global map, conversational Q&A assistant, and other broader ideas from earlier briefs are excluded unless independently required by `GridLens NZ.md` or added through a future requirements gate.

## Goals

- Deliver an accessible browser-first MVP for transparent early-stage regional impact exploration.
- Keep all engineering calculations deterministic, inspectable, versioned, and independently testable.
- Separate facts, proposal claims, user assumptions, presets, calculations, and AI interpretation.
- Provide useful results without a chatbot and degrade safely when evidence or AI is unavailable.
- Demonstrate the supplied Southland scenario and comparison workflow on OpenAI Sites.

## Functional requirements

| ID | Observable requirement | Source / rationale | Priority | Acceptance summary | Status |
|---|---|---|---|---|---|
| FR-LOC-001 | The system shall provide a New Zealand map and an equivalent supported-region list for selecting Southland, Waikato, or Auckland. | Source FR-LOC-001–003; map cannot be the only accessible control. | Must | Keyboard and pointer users can select a region and coordinates resolve to the same regional record. | Approved v0.3 |
| FR-LOC-002 | The system shall visibly classify a location as supported, limited, or unsupported and shall block detailed quantitative analysis for unsupported locations. | Source FR-LOC-004–006; prevents false precision. | Must | Unsupported selection displays the documented explanation and no detailed calculation action is enabled. | Approved v0.3 |
| FR-SCN-001 | Users shall configure IT capacity, utilisation, PUE, cooling method, flexible workload, backup generation, and permanent jobs, including 10/50/100 MW presets and custom capacity. | Source FR-SCN-001–009. | Must | Valid values can be entered using keyboard/touch; changing a preset updates the input without hiding it. | Approved v0.3 |
| FR-SCN-002 | Every input shall show its origin and a plain-language explanation; invalid, missing, suspicious, or out-of-range values shall receive actionable validation. | Source FR-SCN-010–012. | Must | Analysis cannot run with blocking errors; warning-only values remain editable and explain the concern. | Approved v0.3 |
| FR-SCN-003 | Input origins shall be assigned by trusted application actions rather than accepted from editable or locally stored user data. User edits become `User assumption`; presets require a versioned preset ID; proposal/verified origins require an immutable reference to a qualifying source record. | Independent logic review LR-004; enforces FR-SCN-010 and claim/fact separation. | Must | A modified draft or saved record cannot mark an employment value as verified or calculated without a valid trusted reference. | Approved v0.3 |
| FR-CAL-001 | Facility demand shall equal `IT capacity × PUE`; annual energy shall equal `facility MW × utilisation × 8,760 ÷ 1,000`. | Source FR-CAL-001–002. | Must | For 50 MW, PUE 1.3, utilisation 0.8, results are exactly 65 MW and 455.52 GWh before formatting. | Approved v0.3 |
| FR-CAL-002 | Flexible load shall be calculated from total facility demand, and the 24-hour simulation shall preserve total daily work unless curtailment is explicitly introduced later. | Proposed default resolving source FR-CAL-003 and FR-FLX-001–003. | Must | 65 MW at 30% flexibility gives a 19.5 MW upper bound; sum of baseline and shifted daily energy is equal within numeric tolerance. | Approved v0.3 |
| FR-CAL-003 | The simulator shall move eligible hourly work away from configured regional peak periods without exceeding flexible load, hourly destination headroom, destination-utilisation limits, the original combined peak, or the 24-hour window. | Source FR-FLX-006–010; clarified after LR-001. | Must | No hour exceeds any configured bound; impossible shifting remains unshifted and is explained. | Approved v0.3 |
| FR-CAL-007 | Within the approved simplified same-day constraints, the simulator shall minimise the maximum regional-plus-facility load using a deterministic minimax allocation; it shall not report zero reduction when a feasible lower peak exists. | Independent logic review LR-001; makes FR-FLX-002/008 testable. | Must | The frozen counterexample with a 100 MW regional peak and two 50 MW destinations shifts 25 MWh to each destination and reduces the combined peak from 150 MW to 125 MW. | Approved v0.3 |
| FR-CAL-004 | Water use shall be an indicative range derived from facility demand, utilisation, cooling method, and versioned factors; unknown cooling shall return insufficient evidence. | Source FR-CAL-005–006 and example 12.6. | Should | Air, evaporative, liquid, and hybrid options produce labelled ranges; unknown produces no fabricated estimate. | Approved v0.3 |
| FR-CAL-005 | Each result shall retain formula version, exact inputs, units, unrounded value, display value, assumptions, and every regional-profile, factor, threshold, geometry, evidence-bundle, simulation-algorithm, and assessment-policy version used. | Source FR-CAL-008–011 and NFR-EXP-001; LR-009 reproducibility correction. | Must | “Show calculation” exposes a complete reproducibility manifest for every key metric and partial result. | Approved v0.3 |
| FR-CAL-006 | A failure in one calculation shall identify the affected result and leave unaffected results visible, with a per-result status of `complete`, `insufficient evidence`, or `failed`. | Source FR-CAL-012; LR-009 partial-failure clarification. | Must | Invalid water factors do not remove electricity results; no placeholder number is substituted, and the failed water result retains its error and version context. | Approved v0.3 |
| FR-EVD-001 | The MVP shall retrieve evidence only from the bundled curated regional collection and return structured title, publisher, publication date, evidence category, source type, region, source reference, relevant text, location, retrieval date, quality, and optional `validUntil`. | Source FR-EVD-001–004; Design 1 constraint; freshness policy fields. | Must | A supported region displays at least one source-backed evidence item with a working reference and quality label. | Approved v0.3 |
| FR-EVD-002 | Evidence presentation shall distinguish developer claims, authoritative sources, news, community submissions, assumptions, and independently supported facts; each expected evidence category shall explicitly report `current`, `stale`, `unknown freshness`, or `missing`. | Source FR-EVD-005–008; approved freshness policy. | Must | Evidence selection returns items plus explicit status records; absence is not inferred from an empty list. | Approved v0.3 |
| FR-EVD-003 | Evidence freshness shall be evaluated against the regional bundle's pinned `as-of` date: 24 months for electricity, grid, water, resilience, employment, investment, and community/current-news evidence; 36 months for cooling technology, planning, and environmental evidence. A source `valid until` date overrides the category default. Missing publication date is `unknown freshness`. | User-approved g1-d05 policy. | Must | Tests cover the exact boundary day for each category, `valid until`, missing date, and reproducibility independent of the browser clock. | Approved v0.3 |
| FR-EVD-004 | Stale or unknown-freshness evidence shall remain visible as context but shall not satisfy evidence required for a low-concern assessment. Every supported region shall contain at least one qualifying current source-backed evidence record, and broken source links shall be detected during release verification or explicitly disclosed. | User-approved g1-d05 policy and AC-007 clarification. | Must | No low-concern outcome relies on stale/unknown evidence; a supported bundle with no qualifying evidence fails validation. | Approved v0.3 |
| FR-CRT-001 | The system shall run deterministic checks for missing fields, suspicious units, out-of-range values, and predefined unsupported claims; any AI criticism shall be supplementary and source-grounded. | Source FR-CRT-001–007. | Must | Demo results identify unresolved grid, cooling, water, generator, flexibility, staging, and employment questions without recommending approval/rejection. | Approved v0.3 |
| FR-ASM-001 | Electricity, water, resilience, economic contribution, and community categories shall use low concern, moderate concern, high concern, or insufficient evidence with reasons, exact deterministic inputs, and qualifying evidence links. | Source FR-ASM-001–007 plus approved conservative policy. | Must | Every non-insufficient outcome has the required current evidence and at least one traced reason; insufficient evidence is never converted to low concern. | Approved v0.3 |
| FR-ASM-002 | The system shall not calculate a single suitability score or issue formal approval/rejection; an overall narrative may be conditional and evidence-qualified. | Source FR-ASM-008–009 and out-of-scope rules. | Must | Search of UI/report reveals no numeric suitability score or definitive consent recommendation. | Approved v0.3 |
| FR-ASM-003 | Electricity concern shall use the facility's post-flexibility added combined peak divided by the regional peak: `≤5%` low, `>5% and ≤15%` moderate, and `>15%` high. Low concern additionally requires current authoritative regional demand and grid-capacity evidence. Missing required profile/evidence yields insufficient evidence. | User-approved g1-d04 policy. | Must | Tests cover exact 5%/15% boundaries, absence/staleness, and prove configured flexibility alone cannot lower concern. | Approved v0.3 |
| FR-ASM-004 | Water concern shall not be inferred from cooling efficiency alone. A low/moderate/high water outcome requires current authoritative regional water evidence and source-backed absolute annual/peak water thresholds in the regional bundle; otherwise the outcome is insufficient evidence. | User-approved g1-d04 policy. | Must | Even a low WUE factor with no regional threshold returns insufficient evidence; threshold comparisons use the conservative upper estimate. | Approved v0.3 |
| FR-ASM-005 | Low resilience concern requires verified battery or demand-response capacity, duration, and commitment. Fossil backup with verified restrictions may be moderate and without restrictions may be high; unknown/unspecified backup or missing decisive evidence is insufficient. | User-approved g1-d04 policy. | Must | A boolean demand-response toggle or battery label alone can never produce low concern. | Approved v0.3 |
| FR-ASM-006 | Economic contribution shall assess claim robustness: current independently verified jobs/investment evidence with role or basis detail may be low concern; unsupported user/developer claims are moderate; contradictory or implausible claims are high; absent material data is insufficient. | User-approved g1-d04 policy. | Must | One asserted job or forged origin cannot produce low concern. | Approved v0.3 |
| FR-ASM-007 | Community concern shall be insufficient without representative consultation evidence. Current source-backed concerns may support moderate/high outcomes, but the MVP shall not produce low community concern because it collects no representative feedback. | User-approved g1-d04 policy. | Must | An arbitrary planning/news item alone cannot produce low concern; no evidence produces insufficient. | Approved v0.3 |
| FR-ASM-008 | Overall narrative precedence shall be: any high concern → substantial issues require investigation; otherwise any insufficient evidence → evidence incomplete; otherwise any moderate concern → potentially suitable with conditions; all low → lower-concern scenario still requiring professional review. | User-approved g1-d04 policy. | Must | Every combination resolves deterministically without approval/rejection wording or a score. | Approved v0.3 |
| FR-CMP-001 | Users shall duplicate and compare baseline/improved scenarios, modify PUE, flexibility, cooling, demand response, generator restrictions, and staging, and see affected results immediately. | Source FR-CMP-001–006 and screen 3. | Should | The documented 100 MW baseline/improved example displays metric deltas, assumptions, and trade-offs. | Approved v0.3 |
| FR-RES-001 | The product shall provide four coherent stages: build scenario, review results, explore improvements, and impact brief. | Source UI sections 11.1–11.4. | Must | A user can move through all stages and back without losing the active scenario. | Approved v0.3 |
| FR-RES-002 | Results shall include metric cards, baseline/flexible demand visualisation, assessment categories, evidence/assumptions, missing information, and developer questions. | Source FR-RES-001–008. | Must | Chart has a text summary and accessible data table; units and appropriate precision appear everywhere. | Approved v0.3 |
| FR-RES-003 | Results shall use familiar, accessible comparisons for electricity and water without obscuring raw units or uncertainty. | Source FR-RES-005 and NFR-ACC-003–004. | Should | Each comparison retains the underlying value/unit/source and has equivalent text; imagery is never the only carrier of meaning. | Approved v0.3 |
| FR-RPT-001 | The application shall generate deterministic technical and plain-language impact briefs with sources, assumptions, unresolved questions, and the required professional-assessment disclaimer. | Source FR-RPT-001–008 and section 17. | Must | Both views remain usable when AI is disabled; every material claim links to a calculation/evidence record. | Approved v0.3 |
| FR-RPT-002 | Users shall be able to copy the impact brief as readable text/Markdown. | Source FR-RPT-009; PDF export deferred. | Should | Copy action reports success/failure and copied content contains the disclaimer and source list. | Approved v0.3 |
| FR-RPT-003 | Optional AI shall not author or paraphrase factual statements. It may only choose/reorder allowlisted deterministic statement IDs and fill non-factual connective slots; numbers, units, outcomes, claims, source metadata, unresolved questions, and the disclaimer are reconstructed deterministically. | ADR-002 clarification from LR-006. | Must | Malicious AI text cannot change `65 MW` to `650 MW`, change an outcome, add a claim, or survive a late/stale request-generation guard. | Approved v0.3 |
| FR-ERR-001 | Evidence or AI failure shall not delay, hide, or invalidate deterministic outputs and shall produce a visible, nontechnical recovery message. | Source FR-EVD-009, examples 12.7, NFR-REL-001–004. | Must | Injected evidence failure still shows calculations/formulas and marks evidence-dependent categories incomplete. | Approved v0.3 |
| FR-DAT-001 | Regional data, calculation factors, formulas, assessment rules, evidence bundles, and map geometry shall be independently versioned and replaceable without rewriting core calculation logic. | Source FR-ADM-001–006 and NFR-MNT-003; map clarification from LR-010. | Must | Build validation rejects missing units, invalid ranges, duplicate/cross-mismatched IDs, incompatible versions, invalid geometry, or missing named regions. | Approved v0.3 |
| FR-DAT-002 | The prepared deployment shall contain Southland, Waikato, and Auckland manifest entries plus pinned New Zealand regional geometry. Coordinate-to-region resolution shall use deterministic point-in-polygon rules, treat boundary points as belonging to the feature with the lexicographically smallest matching region ID, and never substitute the nearest supported region. | Source MVP regions and FR-LOC-003–005; LR-010 clarification. | Must | Map, pointer, coordinate, keyboard, and list selection resolve the same region/support status, including exact border fixtures. | Approved v0.3 |
| FR-LOCALSAVE-001 | Users may explicitly save/delete scenarios on the current device; the site shall not imply cloud sharing or cross-device persistence. | Proposed Design 1 default resolving persistence/authentication questions. | Could | Saved scenario survives reload on the same browser; delete removes it and clearing instructions are available. | Approved v0.3 |
| FR-LOCALSAVE-002 | Device-local persistence shall use transactional per-record updates that do not silently lose independent concurrent-tab saves or resurrect deleted records. It shall store every version needed for drift reporting, define supported sequential migrations, quarantine invalid records individually, and reconcile indeterminate committed writes by stable operation ID. | LR-007 technical correction preserving the approved local-only behavior. | Must when local save is enabled | Adversarial interleavings, crash-after-commit, migration, quarantine, restore, and delete tests pass without silent data loss. | Approved v0.3 |

## Quality requirements

| ID | Observable requirement | Acceptance summary | Status |
|---|---|---|---|
| NFR-PER-001 | Local deterministic recalculation should complete within 1 second under normal prototype conditions. | Performance test uses representative region and comparison scenarios on a supported desktop browser. | Approved v0.3 |
| NFR-PER-002 | Initial prepared-data analysis should be visible within 5 seconds; optional AI work shall never block it. | Timed end-to-end test with delayed/failed optional service. | Approved v0.3 |
| NFR-REL-001 | Identical normalized inputs and complete reproducibility manifest shall produce identical per-result outputs and statuses. | Golden and property tests prove deterministic complete and partial output. | Approved v0.3 |
| NFR-REL-002 | Errors shall fail visibly and remain scoped to the affected calculation, evidence item, or optional service. | Failure-injection tests prove partial-result retention. | Approved v0.3 |
| NFR-ACC-001 | Core journeys shall target WCAG 2.2 AA, be keyboard operable, avoid colour-only meaning, remain readable under common zoom, and provide chart alternatives. | Automated accessibility checks plus manual keyboard/zoom review. | Approved v0.3 |
| NFR-SEC-001 | All browser inputs and loaded datasets shall be schema-validated; no secret or privileged configuration shall ship to the client. | Invalid fixture and production-bundle secret scan pass. | Approved v0.3 |
| NFR-SEC-002 | Generated or retrieved text shall be rendered as data, not executable markup or application instructions. | Injection/XSS fixtures render inertly; no unsafe HTML path is required. | Approved v0.3 |
| NFR-PRI-001 | The core analysis shall require no identity or unnecessary personal information; local saves and any external AI processing shall be disclosed. | First run requires no sign-in; privacy notice and local-delete control are present. | Approved v0.3 |
| NFR-EXP-001 | Facts, claims, assumptions, presets, calculations, and AI interpretations shall be visually and semantically distinguishable. | Each representative output exposes a valid origin label and trace link. | Approved v0.3 |
| NFR-MNT-001 | Calculation, simulation, assessment, evidence, and explanation logic shall have separate public contracts and independent tests using consistent internal units. | Import/dependency checks and unit tests enforce module boundaries. | Approved v0.3 |
| NFR-MNT-002 | AI output, if enabled, shall be schema-validated before display and may only reference supplied statement IDs, ordering choices, and non-factual connective slots. | Contract tests reject unknown IDs, factual free text, missing provenance, malformed output, and stale request generations. | Approved v0.3 |
| NFR-DEP-001 | The application shall build and run as a Cloudflare Worker-compatible OpenAI Sites deployment in current major desktop/mobile browsers. | Sites production build succeeds and the hosted first-run journey passes. | Approved v0.3 |
| NFR-OBS-001 | Client diagnostics shall record non-sensitive error category, module/version, and correlation ID without scenario contents by default. | Error tests show useful diagnostics and no raw user content. | Approved v0.3 |

## Constraints

| ID | Constraint | Status |
|---|---|---|
| CON-001 | All Design 1 project files remain below `design-1-browser-first/`. | Approved by user direction |
| CON-002 | Arithmetic and authoritative assessment rules cannot depend on an LLM. | Source constraint |
| CON-003 | The first release uses prepared, versioned regional datasets; it does not perform unrestricted live-web research. | Approved v0.3 |
| CON-004 | The application is an anonymous browser-first site; no app-owned authentication or server database is included in this release. | Approved v0.3 |
| CON-005 | Proposal upload and community-feedback submission are deferred, so the first release processes no user documents or community personal data. | Approved v0.3 |
| CON-006 | OpenAI Sites is the target deployment and hosting surface. | User direction |
| CON-007 | `Shared/` is read-only common source material; only `Shared/GridLens NZ.md` is normative, and Design 1 may copy only derived, attributed data into its own directory. | User direction / parallel-work isolation |

## Explicit non-goals and deferred scope

- Formal engineering, legal, cultural, environmental, planning, or resource-consent determination.
- Precise household electricity-price prediction, detailed internet congestion, or nationwide validated analysis.
- A numeric overall suitability score, approval/rejection recommendation, or community referendum.
- Proposal PDF/DOCX upload and extraction, user accounts, server persistence/sharing, live data ingestion, community-feedback storage, and PDF export in this MVP.
- A trained electricity-demand forecasting model and conversational Q&A assistant unless the user promotes either at Gate 1.
- Treating developer statements or AI text as verified facts.

## Acceptance criteria

| ID | Criterion | Linked requirements |
|---|---|---|
| AC-001 | Select at least two prepared regions and clearly block unsupported detailed analysis. | FR-LOC-001, FR-LOC-002 |
| AC-002 | Configure all must-have scenario fields with validation, explanations, and origin labels. | FR-SCN-001, FR-SCN-002 |
| AC-003 | Southland demo returns 65 MW and 455.52 GWh before display rounding. | FR-CAL-001, FR-CAL-005 |
| AC-004 | Automated formula tests cover typical, boundary, invalid, conversion, and rounding cases. | NFR-MNT-001, NFR-REL-001 |
| AC-005 | Display accessible 24-hour baseline and flexible profiles. | FR-CAL-003, FR-RES-002, NFR-ACC-001 |
| AC-006 | Shifting preserves daily work, does not exceed 19.5 MW in the demo, and reports achieved peak reduction or none. | FR-CAL-002, FR-CAL-003 |
| AC-007 | At least one curated regional evidence item displays a source reference and quality/type classification. | FR-EVD-001, FR-EVD-002 |
| AC-008 | The UI distinguishes every material origin and supports formula/evidence inspection. | FR-CAL-005, NFR-EXP-001 |
| AC-009 | Predefined missing-information checks produce unresolved questions without an automatic rejection. | FR-CRT-001, FR-ASM-002 |
| AC-010 | Both technical and plain-language briefs work without chatbot interaction and include the disclaimer. | FR-RPT-001 |
| AC-011 | Evidence/AI failure leaves deterministic results visible and marks dependent results incomplete. | FR-ERR-001, NFR-REL-002 |
| AC-012 | The baseline/improved comparison shows metric deltas, changed assumptions, and trade-offs. | FR-CMP-001 |
| AC-013 | Production build, accessibility checks, unit/contract tests, and representative end-to-end journeys pass. | NFR-ACC-001, NFR-DEP-001, NFR-MNT-001 |
| AC-014 | No secret, unsafe generated markup, hidden fabricated estimate, or definitive approval/rejection appears in the production bundle or tested UI. | NFR-SEC-001, NFR-SEC-002, FR-ASM-002 |
| AC-015 | People/Planet views preserve raw values, sources, confidence, and accessible equivalents for every visual comparison. | FR-RES-003, NFR-ACC-001, NFR-EXP-001 |
| AC-016 | Exact 5% and 15% electricity boundaries, all water/resilience/economic/community branches, and overall precedence produce the approved evidence-qualified outcomes. | FR-ASM-003–008 |
| AC-017 | Evidence freshness uses the bundle `as-of` date, exact 24/36-month boundaries and `validUntil`; stale/unknown evidence remains visible but cannot support low concern. | FR-EVD-002–004 |
| AC-018 | The frozen 100/50/50 MW minimax counterexample produces a 125 MW post-flex combined peak by allocating 25 MWh to each destination, while all shifting invariants hold. | FR-CAL-002–003, FR-CAL-007 |
| AC-019 | Forged persisted origins, unsupported evidence references, and malicious or late AI responses cannot alter authoritative facts, calculations, assessments, or reports. | FR-SCN-003, FR-RPT-003, NFR-SEC-001–002, NFR-MNT-002 |
| AC-020 | Southland, Waikato, and Auckland resolve consistently through map, coordinates, pointer, keyboard, and list, including deterministic border fixtures. | FR-LOC-001, FR-DAT-001–002 |
| AC-021 | Concurrent-tab save/delete, crash-after-commit reconciliation, sequential migration, version drift, and per-record quarantine preserve valid local scenarios without silent loss. | FR-LOCALSAVE-001–002 |
| AC-022 | Every complete, insufficient, or failed result exposes all input, algorithm, factor, threshold, geometry, evidence, and policy versions needed to reproduce its status and value. | FR-CAL-005–006, NFR-REL-001 |

## Approved v0.2 defaults carried into v0.3

Gate 1 v0.2 approved these product defaults; Gate 1 v0.3 reapproval carries them forward:

1. Flexibility applies to total facility demand.
2. Demand profiles are prepared representative/synthetic 24-hour profiles and are labelled accordingly.
3. The MVP shifts work only within the current 24-hour window, preserves energy, and does not model curtailment.
4. Water estimates are versioned ranges by cooling method; unknown cooling is insufficient evidence.
5. Use is anonymous; optional scenario saves are device-local only.
6. Proposal upload, community feedback, user accounts, server storage/sharing, live web retrieval, and PDF export are deferred.
7. `GridLens NZ.md` is the sole normative basis for requirements and design; other shared files are background references only.
8. The first release uses prepared regional profiles rather than training a forecasting model.
9. The first release provides grounded technical/plain-language summaries but no conversational Q&A assistant.

## Resolved requirements decisions

These decisions are settled by the user's source-authority direction, prior selection of Design 1, and explicit policy approval:

| ID | Decision | Resolution |
|---|---|---|
| g1-d01 | Demand-profile basis | Use transparent, prepared, versioned representative/synthetic 24-hour regional profiles for Design 1; do not train a forecasting model in this MVP. |
| g1-d02 | Explanation interface | Deliver the technical and plain-language summaries required by `GridLens NZ.md`; do not add conversational Q&A to this MVP. |
| g1-d03 | Product/source authority | Use **GridLens NZ** and treat `Shared/GridLens NZ.md` as the sole normative scope and design source. Other shared documents are reference-only. |
| g1-d04 | Assessment policy | Use the conservative evidence-first category thresholds and deterministic overall precedence defined by FR-ASM-003–008. |
| g1-d05 | Evidence freshness | Use the pinned `as-of` date, 24/36-month category windows, `validUntil` override, explicit unknown freshness, and exclusion of stale/unknown evidence from low concern as defined by FR-EVD-002–004. |

Requirements version 0.3 and usage definition version 0.3 were explicitly approved at Gate 1 on 2026-08-06. Production implementation remains blocked until architecture is reapproved and the revised logic receives an independent validated verdict.
