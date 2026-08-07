# GridLens NZ — Independent QA report

**QA agent:** `/root/final_qa` (independent; did not author the implementation)
**Date:** 2026-08-07, Pacific/Auckland
**Scope:** frozen v0.13 scenario-first amendment, AC-027–AC-029 and the applicable v0.13 invariants/contracts
**Source state:** Git HEAD `0d60d1f2fa15dbd8c73b6c1bf3cc3541c0ed47c2` plus the reviewed dirty worktree

## Verdict

**PASS — v0.13 amendment scope.** The two previously blocking defects are closed. No release-blocking defect remains within AC-027–AC-029 and the approved v0.13 scenario-first amendment.

This verdict is scoped to the amendment and does not claim completion of the broader full-product, packaging, hosted-deployment or cross-browser release matrix.

## Closure of prior blockers

### QA-V13-RB-001 — stale selection-generation receipt

**CLOSED.** `verifyStoredEvaluation` now requires `current.selectionGeneration`, rejects inequality before recreation, and recreates the receipt with the current value. Both reload and history restoration callers supply `selectionGenerationRef.current`.

The focused workflow test creates a receipt at generation `3`, proves the exact generation verifies, and proves otherwise-identical current generation `4` returns `false`. This closes the stale-selection-generation counterexample in AC-029, Option A restoration and `CONTRACT-RECEIPT-V13`.

### QA-V13-RB-002 — workflow heading focus

**CLOSED.** The scenario, progress and results `h1` elements share the workflow heading ref and are programmatically focusable with `tabIndex={-1}`. On each workflow-kind transition, the effect focuses the newly committed heading immediately, on the next animation frame and after a bounded 100 ms fallback. Restoration transitions through the same reducer/effect path.

Rebuilt production-browser evidence at `http://127.0.0.1:3000`:

| Journey point | Observed active element |
|---|---|
| Scenario → progress, sampled at +250 ms | `H1`, text `Southland`, `tabIndex=-1` |
| Results visible, sampled at +250 ms | `H1`, text `Southland`, `tabIndex=-1` |
| **Edit scenario**, sampled at +250 ms | `H1`, text `Set the infrastructure scenario`, `tabIndex=-1` |
| Reload completed `#evaluation`, result restored, sampled at +250 ms | `H1`, text `Southland`, `tabIndex=-1` |

The browser error log contained zero entries. This closes the focus and restored-result portion of `A11Y-PROGRESS-V13` and AC-029.

## Independent verification evidence

| Check | Result |
|---|---|
| `npm run test:workflow` | **PASS**, exit `0`: 4/4 tests, including selection-generation mismatch rejection. |
| `npm test` | **PASS**, exit `0` in 30.8 s: domain 6/6, map 11/11, workflow 4/4, provider 12/12, rendered HTML 2/2; total 35/35. TypeScript and production build are included. |
| `npm run lint` | **PASS**, exit `0`. |
| TypeScript | **PASS**, `tsc --noEmit`. |
| Production build | **PASS**. Vinext completed all five build phases. |
| Implementation inspection | **PASS**. Current generation is passed at both verification call sites; all three workflow headings carry the shared ref and `tabIndex=-1`; workflow-kind transitions invoke focus; restoration dispatches the same `restore` transition. |
| Rebuilt-app browser journey | **PASS**. Progress, results, edit-to-scenario and reload restoration placed focus on the expected heading; zero browser errors. |

## Amendment acceptance summary

- AC-027 passes: the top prepared-evidence/as-of banner and Scenario/Evaluation tabs are absent; reader-facing region surfaces use canonical names without demo suffixes, status suffixes or numeric-ID prefixes; the whole-NZ accessible picker remains present.
- AC-028 passes: internal groups map to the exact approved labels and explanations, and the mapping is asserted by automated tests.
- AC-029 passes: evaluation is gated by a complete scenario and one selected prepared regional assessment; progress advances through the three ordered states; current-run success is required; edits invalidate the result; exact stored-result restoration checks scenario, region, candidate, screening, evidence, release, result and selection generation; all four plots render; source counts share one collection; workflow focus reaches scenario, progress and results including reload restoration.
- Domain, canonical 17-region map, provider boundary, rendered HTML, TypeScript, lint and production-build regressions remain green.
- The prior credential canary remains unaffected: no test credential is present in production source.

## Residual non-blockers and limitations

- The QA task's browser-control backend remained unavailable. The QA agent therefore independently inspected the implementation and automated evidence, and reviewed the exact rebuilt-production-browser observations supplied from the primary browser run. A future CI component/E2E test should make focus and reload restoration independently repeatable without relying on a manual browser observation.
- The production build reports client chunks above 500 kB. This is unchanged and non-blocking for the v0.13 amendment, but should be measured against the full-product performance budget.
- The workflow suite still combines multiple restoration mutations in one test and does not automate the complete browser history, reduced-motion and live-region announcement matrix. The checked browser journey and reducer tests are sufficient for this amendment closure; the broader release matrix remains pending.
