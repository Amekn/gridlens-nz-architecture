# GridLens NZ — Infrastructure impact atlas

GridLens NZ is a map-first decision-support prototype for exploring the infrastructure impact of large compute loads across Aotearoa New Zealand. Users define a scenario, select a candidate directly on the map, inspect deterministic screening results, and optionally ask a source-aware AI agent to explain trade-offs.

This directory contains Architecture 1 only: the approved browser-first hybrid design.

## Run the demo

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

For a production check:

```powershell
npm test
```

## Two-minute presentation path

1. Change the 65 MW scenario and show the annual-energy and flexible-load calculations update.
2. Select Auckland, Waikato, then a purple candidate directly on the whole-NZ map to show the three separate assessment groups.
3. Open **Evaluation** to explain the five transparent impact lenses and the prepared-evidence disclaimer.
4. Open **Connectors**, enter an OpenAI-compatible endpoint and optional Tavily key, then use **Generate insight**.
5. Refresh the page and show that encrypted connector settings remain available on the same device.

## Trust boundaries

- Deterministic rules own site outcomes; the LLM cannot change them.
- Credentials are encrypted in IndexedDB with a non-extractable device key and are cached only after a successful endpoint test.
- Requests go directly from the browser to CORS-enabled endpoints; no application relay receives the keys.
- Tavily research is restricted to an allow-list of New Zealand public-sector and electricity-system domains.
- Demonstration values are illustrative, not live grid capacity offers or development approvals.

## Design record

The approved requirements, usage definition, selected architecture, contracts, logic map, test strategy, independent logic review, and implementation plan are under [`.autoforge`](.autoforge/).
