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
4. Open **Built-in AI** to show that the operator-managed model and web-research services are ready.
5. Use **Generate insight**, then switch to **Visualization** to render a model-guided chart from deterministic scenario values.

## Trust boundaries

- Deterministic rules own site outcomes; the LLM cannot change them.
- Users never enter provider endpoints or credentials. The browser calls narrow same-origin routes and the Worker owns the model and research credentials.
- Local development reads the ignored `TEST.md` file at the server/config boundary only. Hosted deployments use protected Sites environment variables.
- The production Worker accepts only approved public HTTPS provider origins, applies strict request/response validation, and prevents configured secrets from reaching public responses.
- Tavily research is restricted to an allow-list of New Zealand public-sector and electricity-system domains.
- Demonstration values are illustrative, not live grid capacity offers or development approvals.

## Design record

The approved requirements, usage definition, selected architecture, contracts, logic map, test strategy, independent logic review, and implementation plan are under [`.autoforge`](.autoforge/).
