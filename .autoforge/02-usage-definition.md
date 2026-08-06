# GridLens NZ — Design 1 usage definition

**Artifact version:** 0.3  
**Status:** Approved at Gate 1 v0.3 on 2026-08-06  
**Companion requirements:** `01-requirements.md` version 0.3

## Actors and permissions

| Actor | Permissions in this MVP |
|---|---|
| Public user | Select regions, create/compare scenarios, inspect evidence and calculations, optionally save locally, and copy briefs. No identity required. |
| Dataset maintainer | Updates version-controlled regional/evidence data before deployment; there is no public in-app administration surface. |
| Site operator | Builds, publishes, rolls back, and removes the Sites deployment. Has no normal access to browser-local scenarios. |
| Optional explanation service | Receives only allowlisted deterministic statement IDs and non-factual connective choices. It may select or reorder those IDs but cannot author facts, numbers, outcomes, evidence metadata, unresolved questions, or the disclaimer. It has no calculation or assessment authority. |

## UJ-001 — First run and supported-region selection

- **Actor and goal:** Public user wants to start a transparent assessment.
- **Preconditions:** Site assets loaded; no account is required.
- **Trigger:** User opens the deployed URL.
- **Main path:** The page explains its indicative purpose; user selects Southland, Waikato, or Auckland on the map or equivalent list; map, coordinate, pointer, keyboard, and list paths resolve through the same pinned geometry and regional record; the selected region and complete dataset-version manifest appear; scenario controls become available.
- **Alternate path:** User uses keyboard-only navigation or bypasses the map with the list.
- **Invalid/boundary behavior:** Coordinates outside a prepared analysis area resolve to limited/unsupported status rather than the nearest supported dataset. A point on multiple feature boundaries resolves to the matching feature with the lexicographically smallest region ID.
- **Failure/recovery:** If one region bundle fails validation/loading, that region is unavailable with an explanation; other valid regions remain usable and retry is offered.
- **Outputs/audit:** Selected region ID, support status, geometry and regional-bundle versions, resolution method, and non-sensitive diagnostic correlation ID.
- **Postcondition:** A supported regional context is active, or detailed analysis remains blocked.
- **Traceability:** FR-LOC-001, FR-LOC-002, FR-DAT-001–002; AC-001, AC-020.

## UJ-002 — Build and analyse the Southland demonstration

- **Actor and goal:** Planner wants the documented 50 MW preliminary assessment.
- **Preconditions:** Southland bundle is valid.
- **Trigger:** User selects Southland and begins a scenario.
- **Main path:** Select Medium/50 MW; set utilisation 80%, PUE 1.3, air cooling, flexibility 30%, diesel backup, and 50 permanent jobs; preset actions carry a versioned preset ID and every user edit becomes a `User assumption`; select Analyse; deterministic results render immediately; curated evidence and optional statement ordering can enrich presentation afterward.
- **Alternate path:** A preset is replaced by a custom valid IT capacity; recalculation occurs on change after initial analysis.
- **Invalid/boundary behavior:** Empty/non-numeric fields, percentages outside 0–100%, invalid PUE/capacity, and suspicious values produce field-level guidance; blocking values prevent analysis while warnings do not silently rewrite input.
- **Failure/recovery:** A calculation-specific failure affects only its metric. Evidence/AI timeout shows a warning while formulas and deterministic assessments remain visible; retry affects only optional enrichment.
- **Outputs/audit:** 65 MW facility demand, 455.52 GWh annual energy, 19.5 MW maximum flexible load, a `complete`/`insufficient evidence`/`failed` status for each result, complete reproducibility manifest, profiles, evidence-qualified category outcomes, evidence, missing-information questions, and correlation ID.
- **Postcondition:** An active immutable result snapshot exists in memory; later edits create a new result snapshot.
- **Traceability:** FR-SCN-001–003, FR-CAL-001–007, FR-EVD-001–004, FR-CRT-001, FR-ASM-001–008, FR-ERR-001; AC-002–011, AC-016–019, AC-022.

## UJ-003 — Inspect transparency and accessibility alternatives

- **Actor and goal:** Community member wants to understand why each result exists without interpreting engineering reports.
- **Preconditions:** A result snapshot exists.
- **Trigger:** User opens a metric, assessment reason, evidence item, or “Sources and assumptions.”
- **Main path:** The interface displays origin badge, formula or source, exact inputs/units, complete versions, unrounded/display values, evidence quality, assumptions, and uncertainty. Every expected evidence category explicitly shows `current`, `stale`, `unknown freshness`, or `missing`, calculated against the bundle's pinned `as-of` date. Familiar comparisons never replace raw values. Chart and water-comparison text/table alternatives expose the same information.
- **Alternate path:** Screen reader, keyboard, zoom, reduced-motion, or high-contrast use does not hide information.
- **Invalid/boundary behavior:** Missing source IDs or incompatible evidence records are marked unavailable and cannot be cited by a narrative. Stale and unknown-freshness evidence stays visible as context but cannot support a low-concern assessment; exact 24/36-month dates and `validUntil` use the approved policy.
- **Failure/recovery:** Optional narrative failure falls back to deterministic templates assembled from structured records.
- **Outputs/audit:** No new personal data; user-visible provenance chain.
- **Postcondition:** Result snapshot is unchanged.
- **Traceability:** FR-CAL-005–006, FR-EVD-001–004, FR-RES-002–003, FR-RPT-001, NFR-ACC-001, NFR-EXP-001; AC-005, AC-008, AC-010, AC-015, AC-017, AC-022.

## UJ-004 — Simulate flexibility and explain infeasible shifting

- **Actor and goal:** Planner/developer wants to see potential peak-demand reduction.
- **Preconditions:** Supported regional profile and valid scenario.
- **Trigger:** Analysis or change to flexibility.
- **Main path:** System creates the baseline facility load, identifies configured peak periods, and deterministically finds the feasible same-day allocation that minimises the maximum regional-plus-facility load. It respects flexible-load, hourly headroom, destination-utilisation, original-combined-peak, and 24-hour bounds, preserves daily work, and displays original/shifted facility and combined profiles plus shifted energy and achieved peak reduction.
- **Alternate path:** Destination headroom is insufficient; only feasible work moves and the remainder stays at source hours.
- **Invalid/boundary behavior:** 0% flexibility yields identical profiles and zero reduction; 100% remains bounded by facility load/headroom/utilisation; negative/over-100 input is rejected. In the frozen 100 MW peak plus two 50 MW destination counterexample, 50 MWh of eligible work is split 25/25 so the combined peak falls from 150 MW to 125 MW.
- **Failure/recovery:** Incompatible profile units/version prevent simulation but retain non-profile calculations with an actionable dataset warning.
- **Outputs/audit:** Hourly series, moved-energy ledger, inflexible remainder, active constraints, optimal peak target, peak metrics, simplification disclosure, and simulation/profile/factor versions.
- **Postcondition:** Energy-conservation and maximum-flexibility invariants hold.
- **Traceability:** FR-CAL-002–003, FR-CAL-005, FR-CAL-007, NFR-REL-001; AC-005–006, AC-018, AC-022.

## UJ-005 — Compare a baseline and improved design

- **Actor and goal:** Developer wants to compare documented 100 MW conventional and improved scenarios.
- **Preconditions:** One valid active scenario.
- **Trigger:** User selects Compare and duplicates it.
- **Main path:** Change PUE 1.5→1.2, flexibility 10%→40%, cooling to a lower-water option, and construction to staged; both snapshots remain independently traceable; results show demand, energy, peak, flexible-load, water, category, assumption, and unresolved-evidence deltas.
- **Alternate path:** User edits either side or resets the comparison.
- **Invalid/boundary behavior:** Invalid edits preserve the last valid result but identify it as stale until recalculation succeeds.
- **Failure/recovery:** Failure in one optional narrative does not remove numeric comparison or the other scenario.
- **Outputs/audit:** Two versioned scenario snapshots and a deterministic delta record.
- **Postcondition:** Baseline values are never silently overwritten.
- **Traceability:** FR-CMP-001, FR-CAL-005, NFR-EXP-001; AC-012.

## UJ-006 — Handle cooling and insufficient water evidence

- **Actor and goal:** User wants valid electricity results despite missing water information.
- **Preconditions:** Other required scenario values are valid.
- **Trigger:** Cooling method is `Unknown`, or a supported cooling method lacks qualifying regional water evidence or source-backed absolute annual/peak thresholds.
- **Main path:** Electricity and flexibility calculations complete; the indicative water range is calculated only when a method and factor exist, while the water assessment remains `Insufficient evidence` unless current authoritative regional water evidence and source-backed absolute thresholds are both present. Missing cooling technology, annual/peak water, source, thresholds, or dry-period behavior appears as missing information.
- **Alternate path:** User later chooses a supported method and may obtain a versioned indicative range; a low/moderate/high assessment appears only after a valid bundle supplies the required evidence and thresholds.
- **Invalid/boundary behavior:** No zero-water or midpoint estimate is invented, and low WUE alone cannot produce low concern. Threshold comparison uses the conservative upper estimate.
- **Failure/recovery:** Missing water-factor data behaves the same way and identifies a dataset issue.
- **Outputs/audit:** Explicit insufficient-evidence result with reasons and missing fields.
- **Postcondition:** Other categories remain independently available.
- **Traceability:** FR-CAL-004, FR-CAL-006, FR-ASM-001, FR-ASM-004; AC-009, AC-014, AC-016–017.

## UJ-007 — Copy an impact brief

- **Actor and goal:** Planner/community member wants a standalone shareable summary.
- **Preconditions:** Active result snapshot.
- **Trigger:** Open Impact Brief and choose technical or plain-language view.
- **Main path:** Deterministic template assembles findings, calculations, evidence references, origin labels, assumptions, unresolved questions, limitations, and disclaimer; optional validated AI may select/reorder allowlisted statement IDs and choose non-factual connective slots; the application reconstructs every factual statement deterministically; user copies Markdown/text.
- **Alternate path:** Clipboard API unavailable; interface offers selectable content and explains manual copy.
- **Invalid/boundary behavior:** Missing evidence is stated, not omitted or replaced by an unsupported claim.
- **Failure/recovery:** AI unavailable/malformed response, unknown statement ID, factual free text, or response from an obsolete request generation is rejected and the deterministic brief remains complete.
- **Outputs/audit:** Copied brief; no server-side storage in this MVP.
- **Postcondition:** Scenario/result remains unchanged.
- **Traceability:** FR-RPT-001–003, FR-ERR-001, NFR-MNT-002; AC-010–011, AC-014, AC-019.

## UJ-008 — Save, restore, and delete a device-local scenario

- **Actor and goal:** Returning user wants convenience on the same device.
- **Preconditions:** Browser transactional storage is available; user explicitly chooses Save.
- **Trigger:** Save, restore, or delete action.
- **Main path:** Validate and transactionally store normalized scenario inputs, trusted-origin references, stable record/operation IDs, revision, schema version, and every source version required for drift reporting; list saved items as “on this device”; restore runs supported sequential migrations, reports version drift, revalidates, and recalculates against current versions; delete writes a monotonic tombstone so an older tab cannot resurrect the record.
- **Alternate path:** User exports nothing and uses session-only state.
- **Invalid/boundary behavior:** Corrupt or unsupported-version records are quarantined individually from execution and can be deleted; a valid sibling remains usable. Editable or persisted origin labels cannot elevate trust without a valid immutable reference.
- **Failure/recovery:** Storage unavailable/quota exceeded produces guidance and keeps the active in-memory scenario. After an indeterminate crash or tab close, retrying the same operation ID reconciles with the committed record without duplication. Revision conflicts are surfaced and merged only when independent record IDs permit it; no last-writer-wins overwrite is silent.
- **Outputs/audit:** Device-local scenario/tombstone record, operation outcome, migration/drift notice, and quarantine reason; no cloud identity or sharing link.
- **Postcondition:** The transactional local store reflects the explicit action once, or the user receives a scoped failure/conflict without loss of another tab's committed work.
- **Traceability:** FR-SCN-003, FR-LOCALSAVE-001–002, NFR-PRI-001, NFR-SEC-001; AC-019, AC-021.

## UJ-009 — Maintain and publish regional data

- **Actor and goal:** Dataset maintainer/operator wants to update prepared regional evidence safely.
- **Preconditions:** Authorized repository/deployment access outside the public app.
- **Trigger:** Version-controlled dataset/evidence change.
- **Main path:** Add/change schema-valid regional, profile, evidence, factor, threshold, and geometry records with provenance, pinned bundle `as-of` date, and independent versions; automated validation/tests run across Southland, Waikato, and Auckland; production build creates immutable assets; operator publishes a new Sites version after approval.
- **Alternate path:** Add a new unsupported/limited region record without a full analysis bundle.
- **Invalid/boundary behavior:** Missing units/provenance/dates, invalid ranges or geometry, incompatible schema, duplicate/cross-mismatched IDs, missing named regions, invalid thresholds, or broken references fail the build or are explicitly disclosed when external link availability cannot be guaranteed.
- **Failure/recovery:** Failed publish leaves prior deployment active; operator fixes or rolls back to the last known-good deployment.
- **Outputs/audit:** Version-control history, build/test evidence, deployment version, complete reproducibility manifest, link-check report, and dataset manifest.
- **Postcondition:** New sessions load a coherent bundle; existing saved scenarios recalculate with visibly updated versions.
- **Traceability:** FR-EVD-003–004, FR-DAT-001–002, NFR-DEP-001, NFR-MNT-001; AC-013, AC-017, AC-020, AC-022.

## UJ-010 — Installation, update, rollback, diagnostics, and removal

- **Actor and goal:** Site operator manages the hosted product lifecycle.
- **Preconditions:** Authorized Sites project access.
- **Trigger:** Initial release or later validated update.
- **Main path:** Publish built artifact; verify first run and representative Southland workflow; retain deployment/version metadata; update by publishing another validated version; roll back using the host’s deployment history if checks fail.
- **Alternate path:** User may install the PWA/browser shortcut when supported, but installation is not required.
- **Invalid/boundary behavior:** Deployment containing secrets, local absolute paths, failed tests, or incompatible output cannot pass release verification.
- **Failure/recovery:** Host/deployment failure retains or restores last known-good version; diagnostics use non-sensitive category/version/correlation data.
- **Outputs/audit:** Hosted URL, release metadata, checksums/report, and verification evidence.
- **Postcondition:** Production is on a verified version or rolled back. Removal deletes the hosted project; users clear optional device-local scenarios separately using the documented control/browser storage settings.
- **Traceability:** NFR-DEP-001, NFR-OBS-001, NFR-PRI-001; AC-013–014.

## UJ-011 — Review category assessments and the overall narrative

- **Actor and goal:** Planner or community member wants a cautious, explainable indication of material issues without a suitability score or consent recommendation.
- **Preconditions:** A result snapshot exists; each category has deterministic inputs, evidence statuses, and a complete policy/version manifest.
- **Trigger:** User opens the assessment panel or Impact Brief.
- **Main path:** Electricity compares post-flexibility added combined peak with regional peak at exact 5%/15% boundaries and requires current authoritative demand/grid evidence for low concern. Water requires current authoritative regional evidence plus source-backed absolute annual/peak thresholds. Resilience requires verified capacity, duration, and commitment for low concern. Economic contribution assesses independent support for jobs/investment claims. Community is never low in the MVP and is insufficient without representative consultation. Each category returns low, moderate, high, or insufficient evidence with traced reasons; overall precedence is high, then insufficient, then moderate, then all-low.
- **Alternate path:** Stale or unknown-freshness evidence remains visible as context and may explain uncertainty, but cannot satisfy a low-concern evidence precondition.
- **Invalid/boundary behavior:** Missing decisive inputs/evidence produces `Insufficient evidence`, never low by default. Unsupported or forged origins cannot become verified. No combination produces a numeric score, approval, rejection, or formal consent advice.
- **Failure/recovery:** If one category cannot be evaluated because its rule/data fails, that category is `failed`/unavailable with a scoped error, the remaining categories stay visible, and the overall narrative states evidence incomplete until recovery.
- **Outputs/audit:** Five category outcomes, ordered reason/trace records, exact thresholds and evidence IDs used, freshness states, deterministic overall narrative ID, policy/version manifest, and disclaimer.
- **Postcondition:** The immutable result snapshot is unchanged; opening the assessment does not trigger AI or alter authoritative outcomes.
- **Traceability:** FR-SCN-003, FR-EVD-002–004, FR-ASM-001–008, FR-RPT-003, NFR-REL-001, NFR-EXP-001; AC-016–019, AC-022.

## Deferred journeys

The following `GridLens NZ.md` stretch/open journeys are explicitly excluded from this artifact version and require a future requirements gate: proposal PDF/DOCX upload and extraction, community-feedback submission/thematic analysis, authenticated administration, cloud scenario sharing, live-web evidence ingestion, trained electricity-demand forecasting, conversational Q&A, and PDF generation. Ideas appearing only in other shared documents are not product journeys for this MVP.

## Usage acceptance summary

End-to-end acceptance requires successful execution of UJ-001 through UJ-011 where applicable, with automated coverage for deterministic, boundary, concurrency, migration, and failure behavior and manual evidence for accessibility, hosted first run, and lifecycle operations. Approval of this artifact confirms that the deferred journeys are not part of the Design 1 MVP.
