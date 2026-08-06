# GridLens NZ — Independent QA report

**QA agent:** `/root/final_qa` (independent; did not author production implementation)
**Date:** 2026-08-07, Pacific/Auckland
**Source state:** Git HEAD `b2c9f1c1000aa89d7e361c0bce44488601c83496` plus the reviewed dirty worktree; 57-file QA source manifest SHA-256 `c8d94ecb90ef48c25063954870049d5c7ef29a7e1ad1195a9fbc982f2c91198f` (excludes `TEST.md`, ignored logs, dependencies, build output, and this report).
**Environment:** Windows 11 Pro x64 `10.0.26200`; Node.js `v24.19.0`; npm `11.17.0`; checked-in `package-lock.json`; existing dependency tree.

## Verdict

- **Hackathon/private-demo release: PASSED.** The deterministic scenario core, verified 17-region map assets and selection model, typed candidate markers, server-owned provider boundary, real Tavily research, real OpenAI-compatible analysis and visualisation, production build, and exact-secret controls passed the checks below. This source state is suitable for a private, operator-managed hackathon demonstration.
- **Formal Autoforge release QA gate: BLOCKED.** The current artifact is a working prototype, not the complete v0.5 product/release described by all 101 requirements and AC-001–AC-026. Do not record the Autoforge `qa` gate as `passed` or describe this build as a full-production release until the concrete blockers below are closed.

## Verification evidence

| Check | Result |
|---|---|
| `npm test` | Exit `0` in 19.458 s: domain 4/4, map 10/10, provider 12/12, rendered HTML 2/2; TypeScript and production build included. |
| `npm run lint` | Exit `0`. |
| `git diff --check` and conflict-marker scan | Exit `0`; no conflict markers. |
| Real local `GET /api/v1/providers/health` using ignored `TEST.md` bindings | HTTP 200; schema `gridlens.provider-health.v3`; model and Tavily both `ready/configured`; no configuration value returned. |
| Real local `POST /api/v1/research` | HTTP 200; schema `gridlens.research-response.v3`; Tavily returned four bounded candidates. |
| Real local same-origin `POST /api/v1/agent` with in-operation web research | HTTP 200 in 5.043 s; schema `gridlens.agent-response.v3`; five structured claims, three referenced citations, `partial=false`, returned context fingerprint matched. No response body or credential value was logged in this report. |
| Exact `TEST.md` value canary scan | Three values parsed in memory; zero exact matches in production source, tests/docs, `dist`, and temporary logs. |
| Browser-facing bundle scan | Zero matches for server binding names, `TEST.md`, developer absolute path, or credential labels in `dist/client`. |
| Credential file status | `TEST.md` is ignored and untracked. Temporary demo logs are ignored by `.tmp-*.log`. |

The first live agent smoke reproduced an `invalid_upstream_response` when the model emitted an uncited `source_statement`. The integrator added deterministic claim normalization that removes unknown citations, downgrades an uncited source statement to `model_inference`, and regenerates safe claim IDs without fabricating citations or retrying. The focused provider test and the real live smoke both passed afterward.

The QA review also found and the integrator closed two map/scenario blockers before the final suite: pure region selection now clears the candidate and omits `selectedCandidate` from the agent context (including Region `99`), and invalid/transient-empty numeric edits preserve the last valid scenario instead of throwing during render.

## Addendum — dynamic visualisation closure

### QA-RB-001 — CLOSED

The UI now exposes explicit Analysis and Visualization modes. The same-origin provider validates bar-chart, line-chart, and table payload contracts; if the model supplies claims but omits or malforms a visual payload, the server creates a deterministic bar chart from the already validated scenario context without inventing evidence. The UI renders tables, labelled bars, or SVG lines without HTML/code execution.

Independent closure evidence:

- Focused provider suite: 12/12 passed, including deterministic visual fallback when the model omits a payload.
- Full regression: 28/28 passed plus typecheck and production build; lint passed.
- Real `TEST.md`-backed visual request: HTTP 200 in 5.779 s, schema `gridlens.agent-response.v3`, mode `visual`, three claims, one evidence source ID, and a validated `bar_chart` containing the deterministic MW values `65`, `19.5`, and `19.5`.
- The integrator also browser-verified the Visualization mode control and rendered chart in the private demo UI. Exact-secret and browser-bundle scans remained at zero after the change.

The private-demo blocker is therefore closed.

## Full-product release blockers

### QA-RB-002 — The complete approved product surface is not in this prototype

The current implementation does not provide the approved deep Project Case File and deterministic impact brief, device save/restore/compare lifecycle, generation-safe offline/update path, or complete prepared EMI/NSP/Balanced-quality pipeline. Those are explicit remaining S5/S9/S10/S11 blockers in `09-implementation-plan.md`, and their mapped acceptance criteria have no executable evidence in this worktree. Either implement and test those slices or formally reduce/reapprove the release scope before claiming full requirements completion.

### QA-RB-003 — Clean-target and platform release evidence is pending

QA ran from the existing Windows dependency tree and did not perform a clean clone/`npm ci`, current Chromium/Firefox/WebKit and mobile matrix, manual keyboard/screen-reader protocol, performance budgets, hosted private-Sites smoke, deployment DNS validation, offline/update/rollback, or removal verification. These checks remain mandatory before the Autoforge QA/delivery gates can pass.
