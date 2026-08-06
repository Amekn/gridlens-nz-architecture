# GridLens NZ — Independent Gate 3 Logic Review

- **Artifact version:** 0.10
- **Review date:** 2026-08-07
- **Review type:** fresh independent Autoforge Gate 3 logic re-review
- **Reviewer:** `/root/logic_reviewer_v05`
- **Verdict:** `validated`

## Verdict

`validated`

The frozen v0.10 contracts, logic map and test strategy are materially complete and internally consistent with the approved requirements, usage definition and Architecture v0.3 Option A. The fresh review found no broken producer/consumer boundary, impossible state, unresolved owner decision, security-policy contradiction or requirement/acceptance-criterion omission.

G3V09-001 through G3V09-003 are closed. Every changed primary-model or tool payload now uses the same exact target-bound authorization transition; every enabled canonical tool has exactly one request-frozen connector/configuration/route binding; accepted disclosures and actual network contacts have separate exact receipt semantics; same-call replay has a satisfiable request/call/replay/reject accounting model before and after durable-index reconstruction; and unresolved questions use a closed scope/subject matrix that excludes brief hashes and permits one-pass brief hashing.

The two previously identified non-material cross-version labels are corrected. A bounded independent post-edit confirmation reconstructed each prior artifact by changing only its line 6 `version 0.10 draft` label back to `version 0.9 draft`; the reconstructed bytes and SHA-256 values matched the complete reviewed basis exactly. No contract, logic, test, requirement, architecture, policy or state-ledger semantic changed, and no new issue was introduced. No product-owner decision is required.

## Frozen review basis

| Artifact | Reviewed status | Bytes | SHA-256 |
|---|---|---:|---|
| `.autoforge/01-requirements.md` | v0.4, Gate 1 approved | 46,281 | `d9796b741e2322798ed0b8a8b1ab212ec670055c16660938e8edb475722ad5b2` |
| `.autoforge/02-usage-definition.md` | v0.4, Gate 1 approved | 31,835 | `04d2325936ba5b02f2597b3dd0f7c1ac2705f196ae5acd7582964370d617bcf6` |
| `.autoforge/04-selected-architecture.md` | v0.3 Option A, Gate 2 approved | 34,170 | `c29a9218229ab3434446fd231085496a49762fdb650ceb62404ab0d1ef8b04f3` |
| `.autoforge/05-contracts.md` | v0.10 | 213,430 | `bf0b8cc5295872f3bbfee6144c648ad43e9b17b8988c394681a6411b3039c98a` |
| `.autoforge/06-logic-map.md` | v0.10 | 134,320 | `6a417afc32803439f94dc968d343b7e72b0a09334de7027b43e95862adbc7749` |
| `.autoforge/07-test-strategy.md` | v0.10 | 87,481 | `77dd34890a87986bf27a2d1c5638dcebfbfc7bc4055bafd62195cb7f41a167b2` |
| `.autoforge/state.json` | Gate ledger | 22,568 | `d6c4b58df8b6c60f54f809425bb705637dd5a2d32604921c0ee19743957d28b4` |

The ledger records Gate 1 and Gate 2 approved, Gate 3 pending, both Gate 3 policy decisions resolved, and zero open decisions. Approved upstream hashes match the ledger and the supplied frozen hashes exactly.

## Structural and hygiene re-check

- Requirements source: 101 unique IDs — 81 functional requirements, 12 non-functional requirements and 8 constraints.
- Acceptance criteria: exactly `AC-001` through `AC-026`, with no gap or duplicate.
- Invariants: exactly `INV-001` through `INV-038`.
- Prior findings: exactly `LR3-001` through `LR3-013`, `G3V05-001` through `G3V05-008`, `G3V06-001` through `G3V06-007`, `G3V07-001` through `G3V07-003`, `G3V08-001` through `G3V08-004`, and `G3V09-001` through `G3V09-003` are named in downstream closure/test material.
- Public/clone graph scan: 425 declaration occurrences and 425 unique declaration names; 278 declarations are reachable from `GridLensPublicContractV2`, 32 from `GridLensStructuredCloneContractV2`; no candidate undeclared V2/ID/hash/scalar type was found in the public closure.
- Public secret isolation: `CredentialRecordV2`, `SecretIngressBufferV2` and `SensitiveEndpointIngressBufferV2` are clone-only; the public graph reaches none of them and does not reach the clone root. The clone graph does not reach the public root.
- Legacy-root isolation: legacy `EvidenceRecord`, `PageLocator`, `AssessmentResult`, `SiteProfile`, `AgentRequest`, `AgentResponse` and `StoredEnvelope` are absent from the effective public closure.
- New v0.10 reachability: `ToolRouteBindingV2`, `AgentOutboundContactReceiptV2` and `UnresolvedQuestionSubjectV2` are all reachable from the public root.
- Secret scan: three exact local `TEST.md` canaries were parsed without printing them; zero exact occurrences exist in `05`, `06`, `07` or `README.md`. `TEST.md` is ignored and untracked.
- Encoding/Markdown: all reviewed files strict-decode as UTF-8; replacement-character, NUL and common mojibake counts are zero; fenced-code delimiter counts are even.
- Git hygiene: `git diff --check` exits successfully. Existing modified/untracked architecture artifacts belong to the active design work; no unrelated file was altered by this reviewer. LF-to-CRLF notices are non-material working-tree warnings.

This is a design-time structural audit of the closed pseudo-schema graph. The generated TypeScript, strict JSON Schema, structured-clone guards and mutation fixtures remain correctly specified as release-blocking Phase 5 tests; no application scaffold exists yet from which to run those implementation suites.

## Independent enumeration of all 101 requirements

| Family | Exact approved IDs | Independent result |
|---|---|---|
| Location | `FR-LOC-001`–`FR-LOC-004` | Covered: whole-NZ selection, exact polygon/tie behavior, coordinate and outside-region outcomes. |
| Map | `FR-MAP-001`–`FR-MAP-004` | Covered: project/catalog/layer closure, map/list identity, statuses, qualifications and accessible synchronization. |
| Scenario | `FR-SCN-001`–`FR-SCN-004` | Covered: strict drafts, origin proofs, normalization, warnings and immutable revisions. |
| Case | `FR-CASE-001`–`FR-CASE-004` | Covered: fixed sections, evidence counts, timelines, discrepancy handling and strict product closure. |
| Calculation | `FR-CAL-001`–`FR-CAL-006` | Covered: exact decimal demand/energy/flexibility/water outputs, traceability and partial failure. |
| Assessment | `FR-ASM-001`–`FR-ASM-008` | Covered: total five-category unions, approved policy branches, decisive inputs and overall precedence. |
| Evidence | `FR-EVD-001`–`FR-EVD-018` | Covered: typed facts, authority/freshness/conflict, public-source packs, EMI, documents, graphs and community records. |
| Agent | `FR-AGT-001`–`FR-AGT-011` | Covered: all stages, deterministic authority boundary, exact disclosures, citations, limits, read-only tools, site proposal and visualization. |
| Visual | `FR-VIZ-001`–`FR-VIZ-003` | Covered: closed visual grammar, trusted lineage, rejection/fallback and semantic accessible equivalence. |
| Connector | `FR-CONN-001`–`FR-CONN-008` | Covered: user endpoint/key setup, direct CORS-only calls, capability tests, persistence, vault containment, exact routing and clearing. |
| Result experience | `FR-RES-001`–`FR-RES-004` | Covered: raw values, assumptions, sources, status, audience/lens parity and visible gaps. |
| Report | `FR-RPT-001`–`FR-RPT-003` | Covered: deterministic briefs, optional labelled AI appendix, copy fallback and acyclic persistence. |
| Save | `FR-SAVE-001`–`FR-SAVE-002` | Covered: local persistence, concurrency, migrations, receipts, quarantine and dependency-aware clearing. |
| Document | `FR-DOC-001`–`FR-DOC-002` | Covered: prepared document verification with strict locators; runtime upload/feedback remains absent. |
| Non-functional | `NFR-PER-001`, `NFR-REL-001`, `NFR-REL-002`, `NFR-ACC-001`, `NFR-SEC-001`, `NFR-SEC-002`, `NFR-PRI-001`, `NFR-EXP-001`, `NFR-MNT-001`, `NFR-MNT-002`, `NFR-DEP-001`, `NFR-OBS-001` | Covered by explicit resource ceilings, total unions, accessibility equivalents, trust boundaries, privacy, maintainability, Sites deployment and local diagnostics tests. |
| Constraints | `CON-001`–`CON-008` | Covered: isolated Design 1 tree, browser-first/Sites delivery, deterministic authority, direct-only network, read-only tools and forbidden product claims/routes. |

No requirement is weakened by the v0.10 reconciliation.

## AC-001 through AC-026 audit

| AC | Result |
|---|---|
| `AC-001` | Covered by whole-NZ geometry, map/list parity, boundary tie and outside-region fixtures. |
| `AC-002` | Covered by every-geography deterministic scenario/category coverage and explicit insufficiency. |
| `AC-003` | Covered by exact Southland `65 MW`, `455.52 GWh`, `19.5 MW` oracle. |
| `AC-004` | Covered by exact rational optimizer, conservation, continuous oracle and mutation tests. |
| `AC-005` | Covered by all assessment branches and approved fossil/economic/community policies. |
| `AC-006` | Covered by immutable snapshots, traces, values, sources, status and accessible outputs. |
| `AC-007` | Covered by exact source registry, licences, pack bindings, enabled/disabled states and fallbacks. |
| `AC-008` | Covered by definition/time/geography conflict retention and exact precedence. |
| `AC-009` | Covered by pinned `asOf`, inclusive validity and stale/unknown/future/forecast boundaries. |
| `AC-010` | Covered by endpoint/key setup, capability matrix, first-use persistence and refresh reuse. |
| `AC-011` | Covered by clone-only secret ingress, vault containment, exact canary scans and clearing. |
| `AC-012` | Covered by hard CORS failure and zero application relay. |
| `AC-013` | Covered by exact Tavily/MCP tool registry, frozen route, citations, limits, cancel and retry rules. |
| `AC-014` | Covered by every stage projection plus common authorization for all continued/repair calls. |
| `AC-015` | Covered by strict visual schema, malicious/oversize rejection, provenance and accessible fallback. |
| `AC-016` | Covered by exact underlying record parity across four audience/lens views. |
| `AC-017` | Covered by typed discourse/company/legislation roles and allegation/response/finding separation. |
| `AC-018` | Covered by confirmed criteria, five outcomes, three separate groups, within-group order and sensitivity. |
| `AC-019` | Covered by deterministic AI-independent briefs and separately validated/cited AI appendix. |
| `AC-020` | Covered by modelled multi-tab persistence, migration, quarantine, expiry, quota and clearing. |
| `AC-021` | Covered at design-gate level by the complete release-blocking QA matrix; execution remains Phase 5/6 work. |
| `AC-022` | Covered by exact EMI keys/joins, EPSG/Stats mapping, DST, units, coverage and no-capacity semantics. |
| `AC-023` | Covered by catalog/layer/marker/sheet/compare closure and synchronized accessible map path. |
| `AC-024` | Covered by offline prepared case sections, counts, events, discrepancy, strict locators and closures. |
| `AC-025` | Covered by controlled community taxonomy, method/limitations, missing voices and mana-whenua separation. |
| `AC-026` | Covered by proposal-only AI, explicit confirmation, deterministic screening/grouping/order and explanation-only AI. |

## INV-001 through INV-038 audit

| Invariant | Result |
|---|---|
| `INV-001` | Closed: raw drafts cannot enter calculation. |
| `INV-002` | Closed: deterministic outputs bind immutable approved inputs. |
| `INV-003` | Closed: deterministic calculations/assessments outrank AI text. |
| `INV-004` | Closed: evidence authority cannot be self-promoted. |
| `INV-005` | Closed: secrets remain outside public records and render/export paths. |
| `INV-006` | Closed: every external request has exact destination/content acceptance before fetch. |
| `INV-007` | Closed: external/model content remains inert. |
| `INV-008` | Closed: dynamic visuals resolve only trusted typed data. |
| `INV-009` | Closed: map/list views share stable IDs and state. |
| `INV-010` | Closed: selection uses exact geometry and deterministic ties. |
| `INV-011` | Closed: release/pack bytes and references are hash-verified before activation. |
| `INV-012` | Closed: candidate/optional pack failure cannot corrupt active core state. |
| `INV-013` | Closed: freshness uses pinned evidence time and exact boundary rules. |
| `INV-014` | Closed: stale/unknown inputs cannot silently support low concern. |
| `INV-015` | Closed: conflicts remain visible unless one exact authority rule resolves them. |
| `INV-016` | Closed: assessment outcomes are total typed variants with reasons/decisive inputs. |
| `INV-017` | Closed: overall precedence is exact and score-free. |
| `INV-018` | Closed: flexibility conserves energy and obeys all physical bounds. |
| `INV-019` | Closed: site screening is confirmation-bound and score-free. |
| `INV-020` | Closed: one failed metric/source does not erase unaffected deterministic results. |
| `INV-021` | Closed: tool completion/alias/replay persistence is atomic and idempotent. |
| `INV-022` | Closed: tombstones and operation hashes prevent resurrection/conflicting replay. |
| `INV-023` | Closed: prompt/research/credential persistence is explicit, bounded and separately clearable. |
| `INV-024` | Closed: updates never mix active/candidate generations. |
| `INV-025` | Closed: old clients retain their verified generation until lifecycle completion. |
| `INV-026` | Closed: diagnostics are allowlisted, bounded, local and content/secret-free. |
| `INV-027` | Closed: accessibility equivalents preserve the same semantic record set. |
| `INV-028` | Closed: cancellation/late-event rules yield exactly one terminal per original command family. |
| `INV-029` | Closed: exact rational primal/dual facts establish flexibility feasibility and optimality. |
| `INV-030` | Closed: assessments consume only closed decisive-input references. |
| `INV-031` | Closed: connector workers never call analysis workers and never follow redirects. |
| `INV-032` | Closed: same operation ID with a changed command hash is a conflict. |
| `INV-033` | Closed: no candidate worker activates while old-generation clients remain. |
| `INV-034` | Closed: every visual fact has lineage and screen/copy/export semantic parity. |
| `INV-035` | Closed: EMI outputs carry independent time, national-POC and Stats-geography coverage. |
| `INV-036` | Closed: all effective V2 records resolve in one retained generation; the question matrix is closed and brief-hash subjects are forbidden. |
| `INV-037` | Closed: sensitive endpoint paths/queries remain vault-only behind random opaque IDs. |
| `INV-038` | Closed: exact cancellation targets, destination/content acceptances, contacted-attempt receipts, frozen tool routes and all ceilings are enforced. |

## Prior-finding re-test

### LR3-001 through LR3-013

| Finding | Result |
|---|---|
| `LR3-001` | Closed by exact continuous flexibility contracts/logic/oracles. |
| `LR3-002` | Closed by typed evidence facts, authority matrix and immutable closure. |
| `LR3-003` | Closed by total assessment variants and approved branch policies. |
| `LR3-004` | Closed by confirmed site profiles, five domain outcomes and approved separate groups. |
| `LR3-005` | Closed by the coordinator-only worker graph, total agent limits and v0.10 authorization/replay semantics. |
| `LR3-006` | Closed by fail-closed connectors, clone-only secrets, vault routing and exact disclosures. |
| `LR3-007` | Closed by manifest/pack/public-schema closure and acyclic product hashes. |
| `LR3-008` | Closed by typed repository mutations, atomic receipts and resumable clear dependencies. |
| `LR3-009` | Closed by serialized no-`skipWaiting` multi-client generation updates. |
| `LR3-010` | Closed by exact EMI source keys, joins, aggregation, coverage and approved Balanced policy. |
| `LR3-011` | Closed by strict locators, curator verification, event semantics and case closure. |
| `LR3-012` | Closed by strict visual resolution, lineage and semantic accessible equivalence. |
| `LR3-013` | Closed by routes, registry, education, fallbacks, budgets and release tests. |

### G3V05-001 through G3V05-008

| Finding | Result |
|---|---|
| `G3V05-001` | Closed: category and overall assessment producers are total. |
| `G3V05-002` | Closed: site confirmation, five outcomes and three presentation groups are exact. |
| `G3V05-003` | Closed: worker graph, ownership and command-family terminals are closed. |
| `G3V05-004` | Closed: public unions and dispatch pairs are strict and reachable. |
| `G3V05-005` | Closed: tool replay/alias/receipt transactions and v0.10 counters are satisfiable. |
| `G3V05-006` | Closed: research fetch/compile/inspect/refresh ownership is explicit. |
| `G3V05-007` | Closed: source counts use eight mutually exclusive temporal/authority buckets. |
| `G3V05-008` | Closed: narrative and data visual variants are discriminated. |

### G3V06-001 through G3V06-007

| Finding | Result |
|---|---|
| `G3V06-001` | Closed: all coordinator commands and terminal families are paired. |
| `G3V06-002` | Closed: connector draft/commit/capability/persistence/restore lifecycle is complete. |
| `G3V06-003` | Closed: connectors fetch only; analysis assigns evidence/freshness and persists atomically. |
| `G3V06-004` | Closed: unavailable/partial site inputs never become exclusion/failure. |
| `G3V06-005` | Closed: aliases use unique children for new IDs and no child for same-ID replay. |
| `G3V06-006` | Closed: public JSON and structured-clone graphs are separate and guarded. |
| `G3V06-007` | Closed: visual filters have exact depth/node/scalar/null semantics. |

### G3V07-001 through G3V07-003

| Finding | Result |
|---|---|
| `G3V07-001` | Closed: effective V2 product roots and all referenced records are strict/reachable. |
| `G3V07-002` | Closed: sensitive path/query bytes cannot enter public hashes or values. |
| `G3V07-003` | Closed: exact cancellation targets and every agent ceiling/counter are present. |

### G3V08-001 through G3V08-004

| Finding | Result |
|---|---|
| `G3V08-001` | Closed: an agent original emits only an agent terminal; a non-agent original emits only `operation_cancelled`; the cancel command has its own acknowledgement. |
| `G3V08-002` | Closed: all model/research/tool destinations use exact disclosures and the five-entry read-only registry; v0.10 removes continuation and same-kind-routing ambiguity. |
| `G3V08-003` | Closed: selected-data clear excludes connector configuration; per-connector/all-data removal is vault-first, journaled and resumable. |
| `G3V08-004` | Closed: strict locators, layers, statements, questions, missing voices, companies and claim roles are in the effective product closure. |

## G3V09 targeted re-test

### G3V09-001 — common authorization, exact route selection, accepted/contacted semantics

**Result: closed.**

The initial request must contain exactly one current acceptance for the canonical initial primary-model bytes. For each later model request, `LOG-AGENT-001A` derives `initial`, `tool_result_continuation`, `format_repair` or `continued_reasoning`, builds the exact new disclosure, and invokes the same `authorizeOutbound` routine used by tools. A missing grant emits `destination_disclosure_required`, suspends the original tuple, accepts only a separately acknowledged target-bound authorization command, then resumes. Decline, expiry, substitution, cancellation and stale target perform zero fetches. `modelCallCount` increments only after authorization and before the first fetch.

Enabled tools require one and only one `ToolRouteBindingV2` per allowed scope and no extras. Each binding freezes exact tool ID, connector ID/kind, configuration hash, route ID/capability and endpoint label before first model dispatch. With two compatible Tavily or remote-MCP connectors, zero or two bindings reject; connector order, discovery and model output cannot select a route.

Receipt semantics are now disjoint and satisfiable:

- `acceptedDisclosureAcceptances` is the canonical unique set of request-preaccepted and later acknowledged grants, including unused grants.
- `contactedNetworkAttempts` is gap-free attempted order with exactly one record per started fetch/retry and none for an unused grant.
- Every contact resolves exactly one acceptance and `networkAttemptCount == contactedNetworkAttempts.length`.

The initial call, tool-result continuation, format repair and third continued-reasoning body may each differ by one bit and therefore require independent exact authorization. The same common path covers all four; no global/category-only grant survives a content/destination identity change.

### G3V09-002 — same-call replay, restart reconstruction and quota equality

**Result: closed.**

The state machine classifies every decoded model tool request exactly once:

1. Increment `toolRequestCount` subject to `maximumToolRequests`.
2. Strict-decode and route; an invalid or conflicting request increments `preallocationRejectCount` and creates no child/receipt/network.
3. Look up `(requestId, callId)` before disclosure, `toolCallCount` mutation or child allocation.
4. Same ID/same canonical arguments/tool/frozen route increments only `sameCallReplayCount`, returns stored result/receipt, appends nothing and performs no network.
5. Same ID/different arguments/tool/frozen route increments only `preallocationRejectCount` and rejects before disclosure/network.
6. A new ID consumes one `toolCallCount`, gets one unique child and produces exactly one terminal tool receipt. Same operation under a new ID creates a durable network-false alias/receipt; a new operation performs one bounded fetch.

Therefore the terminal equations are simultaneously satisfiable:

```text
toolRequestCount = toolCallCount + sameCallReplayCount + preallocationRejectCount
toolCallCount = toolReceipts.length
```

At `toolCallCount == maximumToolCalls`, an identical same-ID replay remains legal while `toolRequestCount < maximumToolRequests`; it creates no child/receipt/network. A new call at logical-call equality becomes one pre-allocation limit rejection. At request equality, the next request terminalizes without incrementing beyond the bound and without child/receipt/network. Alias and replay records reconstruct the same call/operation indexes after a crash/reload; audit/recovery simulation preserves one counted logical call per distinct alias and never synthesizes a second child/receipt. A real worker restart still terminalizes the old epoch and requires explicit user retry, so it does not silently resend credentials.

### G3V09-003 — closed question matrix and acyclic brief hashing

**Result: closed.**

The exact legal matrix is now normative and every omitted pair rejects:

| Scope | Legal subject kinds |
|---|---|
| `map` | `geography`, `project`, `company`, `site_candidate`, `evidence`, `statement` |
| `case` | `project`, `company`, `geography`, `site_candidate`, `evidence`, `statement` |
| `evidence` | `evidence`, `statement`, `project`, `company`, `geography` |
| `company` | `company`, `statement`, `evidence`, `project` |
| `site` | `site_candidate`, `geography`, `project`, `evidence`, `statement` |
| `brief` | `project`, `company`, `geography`, `site_candidate`, `evidence`, `statement` |

`UnresolvedQuestionSubjectV2` has no impact-brief/hash variant. `brief` is only containing-product context; a brief-scoped question may reference only stable underlying IDs already in the brief's immutable closure. Current and older brief hashes reject. `ImpactBriefV2.briefSnapshotId` is therefore the hash of its canonical remainder with only that field omitted and is computable in one forward pass. Mutation of any question, subject, embedded trusted statement or referenced closure hash changes or invalidates the brief deterministically.

## Boundary, trust and totality conclusion

- **Producer/consumer boundaries:** no broken boundary remains. Worker commands/events, product records, storage mutations, connector/vault operations and result variants have exact owners and consumers.
- **Trust:** deterministic calculations and assessments remain authoritative; LLM/MCP output is candidate/commentary/visual-spec input only and cannot promote evidence or alter frozen results.
- **Privacy/security:** every contacted destination is pre-authorized for exact bytes; tools are fixed read-only adapters; secrets and sensitive routes remain clone/vault-only; direct browser CORS-only behavior and no-relay failure are explicit.
- **Totality:** calculation, assessment, site, agent, connector, research, visual, storage, offline, EMI, case, brief, cancellation and restore paths all have complete/partial/insufficient/failed/cancelled variants as applicable.
- **Determinism/idempotency:** content hashes are one-pass and acyclic; duplicate operation IDs conflict on changed commands; tool and repository replays are atomic and bounded.
- **Testability:** equality/one-over, malformed, malicious, stale, retry, cancel, crash, restart and clone/public-secret boundary cases all have named release-blocking tests with independent oracles.

## Owner-decision audit

| Decision | Status |
|---|---|
| `g3-emi-quality` | Resolved: Balanced v1 thresholds, unconditional failures and 45-day backward search. |
| `g3-site-grouping` | Resolved: three separate whole-NZ presentation groups with ordering only within a group. |
| Additional material owner decision | None. |

## Post-edit confirmation

- `05-contracts.md` remains byte-identical at 213,430 bytes and `bf0b8cc5295872f3bbfee6144c648ad43e9b17b8988c394681a6411b3039c98a`.
- `06-logic-map.md` contains exactly one corrected v0.10 cross-reference on line 6. Replacing only that label with its prior v0.9 text reconstructs exactly 134,319 bytes and `1bd3da682760154829b0ce6f50bd07cb35a1309f3803bdc46f80352d5b9a1b33`.
- `07-test-strategy.md` contains exactly one corrected v0.10 cross-reference on line 6. Replacing only that label with its prior v0.9 text reconstructs exactly 87,480 bytes and `b187c8b7e9521484776361704a4feaa2c94eda72723242166a6d9f2ce916f752`.
- All three raw artifacts strict-decode as UTF-8 with zero replacement characters, NULs or common mojibake signatures; their Markdown fence counts remain even.
- `git diff --check` exits zero under the repository's active configuration. The emitted LF-to-CRLF notices are unchanged non-material working-tree warnings.

The prior full independent traversal is preserved above and remains applicable byte-for-byte except for the two proven metadata substitutions. Final Gate 3 review verdict: `validated`.
