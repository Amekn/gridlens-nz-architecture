# GridLens NZ — Design 1 idea brief

**Artifact version:** 0.2  
**Status:** Requirements approved at Gate 1  
**Prepared:** 2026-08-06 (Pacific/Auckland)

## Problem

Early-stage discussions about proposed New Zealand data centres mix engineering calculations, developer claims, regional evidence, assumptions, and AI-generated interpretation. GridLens NZ should let planners, communities, iwi and hapū, developers, and data curators explore impacts without implying that the result replaces formal engineering, environmental, planning, legal, cultural, or resource-consent advice.

## Source and user direction

- Product source: [GridLens NZ — Software Requirements and Example Usage](https://drive.google.com/file/d/1pjhr1l5imWTPOK_E-YtKKIu_2hcuqGhO/view).
- `Shared/GridLens NZ.md` is the sole normative product, architecture, and software-design source.
- Other files in `Shared/`, including `Compute Impact Atlas — Hackathon Project Brief.docx`, are non-authoritative background references only. They cannot add, remove, or override scope, behavior, constraints, acceptance criteria, or architecture.
- The user selected the previously proposed **Design 1: browser-first static application**.
- The user explicitly requested that Design 1 be isolated from parallel Design 2 work. Its repository root is `design-1-browser-first/`.
- The delivery surface is an OpenAI Sites-hosted web application.

## Intended users and jobs

| User | Primary job |
|---|---|
| Council or regional planner | Perform a transparent preliminary assessment and identify questions requiring professional investigation. |
| Community member | Understand likely impacts in plain language and distinguish facts, claims, assumptions, calculations, and uncertainty. |
| Data-centre developer | Compare facility efficiency, flexibility, cooling, demand-response, and staging scenarios. |
| Data curator | Maintain prepared regional datasets, provenance, quality labels, and version history through controlled project updates. |

## Proposed product shape

An anonymous, responsive browser application provides a four-stage experience: build a scenario, review results, explore improvements, and copy an impact brief. Deterministic and versioned application code performs calculations and workload-shifting simulation. Versioned regional data is shipped as curated static assets. Evidence retrieval and AI-generated explanations are optional, isolated capabilities; their failure cannot hide or invalidate deterministic results.

## Value

- Fast, accessible exploration without requiring a chatbot.
- Reproducible formulas with inspectable inputs, units, versions, and assumptions.
- Honest handling of unsupported regions, uncertainty, missing evidence, and service failures.
- A low-operations hackathon deployment that can later migrate into an API-backed modular monolith.

## Success measures

1. The Southland 50 MW demonstration returns 65 MW facility demand and 455.52 GWh annual energy before display rounding.
2. At least Southland and one other prepared region can be analysed; Auckland, Waikato, and Southland are the target bundle.
3. Baseline and flexible 24-hour profiles preserve total work and never shift more than the configured flexible load.
4. A first-time user can complete the core five-step workflow without external documentation.
5. Deterministic results appear within one second locally and remain usable if evidence or AI services fail.
6. Each material output is labelled and traceable to a calculation, regional source, claim, preset, or user assumption.
7. The deployed application builds successfully, supports keyboard use, and presents text/table alternatives for charts.

## Alternatives already considered

1. API-backed modular monolith — stronger persistence and curation; being explored separately as Design 2.
2. Event-driven serverless pipeline — better asynchronous isolation at higher implementation complexity.
3. Evidence-centric data platform — strongest governance but excessive for a three-region hackathon MVP.
4. Privacy-first local/council deployment — strongest offline control but harder distribution and support.

## Constraints

- Deterministic application code, not an LLM, is authoritative for arithmetic and assessment rules.
- AI output must be grounded in structured results/evidence and validated against a schema.
- Unsupported regions must not receive detailed quantitative findings.
- Uploaded content, if later added, is untrusted and cannot act as application instructions.
- Secrets and privileged configuration cannot be exposed to the browser.
- Design 1 owns only files below `design-1-browser-first/`.
- Sites compatibility and Cloudflare Worker-compatible ESM output are required.

## Proposed MVP defaults awaiting Gate 1 approval

- Flexible-workload percentage applies to **total facility demand**, matching the documented 19.5 MW example.
- Prepared representative/synthetic 24-hour regional profiles are used and visibly labelled as such.
- Shifting stays within the displayed 24-hour window, preserves daily energy, and uses configured hourly headroom.
- Water results use cooling-method ranges; `Unknown` produces `Insufficient evidence`.
- Public use is anonymous; scenarios are stored only in browser-local storage when the user chooses to save them.
- Proposal upload, community-feedback collection, user accounts, server persistence, and PDF export are deferred.
- Evidence uses a curated static collection for the first release; optional AI converts structured results into summaries but is not required for a complete deterministic brief.
- `GridLens NZ.md` is the sole normative scope authority; other shared documents may be consulted only for non-binding background or inspiration.
- A trained electricity-demand forecast and conversational Q&A assistant are deferred from the first release; the MVP uses prepared regional profiles and structured technical/plain-language summaries.

## Remaining uncertainty

The product requirements are unusually complete. The user resolved source precedence in favour of `GridLens NZ.md`; therefore a trained forecasting model and conversational Q&A from earlier briefs are not Design 1 MVP requirements. Architecture-specific technology choices will be documented only after Gate 1.
