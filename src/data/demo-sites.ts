import type { SiteCandidate } from "../domain/types";

export const PREPARED_DEMO_EVIDENCE_NOTICE =
  "Prepared demonstration evidence only. Values are illustrative, are not live grid headroom, and must not be used as an authoritative siting decision.";

const evidence = (
  freshness: SiteCandidate["evidence"]["freshness"],
  coverage: SiteCandidate["evidence"]["coverage"],
  coveragePercent: number,
): SiteCandidate["evidence"] => ({
  kind: "prepared_demonstration_evidence",
  asOf: "2026-07-31T12:00:00.000Z",
  freshness,
  coverage,
  coveragePercent,
  notice: PREPARED_DEMO_EVIDENCE_NOTICE,
});

/**
 * Whole-NZ map fixtures. Names, coordinates, capacity envelopes and signals are
 * prepared demonstration inputs, not claims about available sites or networks.
 */
export const DEMO_SITES: readonly SiteCandidate[] = Object.freeze([
  {
    id: "demo-northland-whangarei",
    name: "Whangārei demonstration zone",
    region: "Northland",
    latitude: -35.7251,
    longitude: 174.3237,
    preparedConnectionCapacityMw: 92,
    evidence: evidence("prepared_current", "complete", 92),
    signals: {
      specialistAssessment:
        "Prepared flag: local environmental and mana whenua assessment is required.",
    },
  },
  {
    id: "demo-auckland-south",
    name: "Auckland South demonstration zone",
    region: "Auckland",
    latitude: -37.0016,
    longitude: 174.8568,
    preparedConnectionCapacityMw: 140,
    evidence: evidence("prepared_current", "complete", 95),
    signals: {
      exclusion:
        "Prepared flag: the demonstration parcel intersects a declared exclusion constraint.",
    },
  },
  {
    id: "demo-waikato-ruakura",
    name: "Ruakura demonstration zone",
    region: "Waikato",
    latitude: -37.7782,
    longitude: 175.3206,
    preparedConnectionCapacityMw: 118,
    evidence: evidence("prepared_current", "complete", 96),
    signals: {},
  },
  {
    id: "demo-bop-tauranga",
    name: "Tauranga demonstration zone",
    region: "Bay of Plenty",
    latitude: -37.6878,
    longitude: 176.1651,
    preparedConnectionCapacityMw: 88,
    evidence: evidence("prepared_current", "complete", 91),
    signals: {
      specialistAssessment:
        "Prepared flag: water availability and coastal resilience need specialist review.",
    },
  },
  {
    id: "demo-gisborne",
    name: "Gisborne demonstration zone",
    region: "Gisborne",
    latitude: -38.6623,
    longitude: 178.0176,
    preparedConnectionCapacityMw: 44,
    evidence: evidence("prepared_current", "complete", 89),
    signals: {},
  },
  {
    id: "demo-hawkes-bay-napier",
    name: "Napier demonstration zone",
    region: "Hawke's Bay",
    latitude: -39.4928,
    longitude: 176.912,
    preparedConnectionCapacityMw: 76,
    evidence: evidence("prepared_stale", "partial", 68),
    signals: {},
  },
  {
    id: "demo-taranaki-new-plymouth",
    name: "New Plymouth demonstration zone",
    region: "Taranaki",
    latitude: -39.0556,
    longitude: 174.0752,
    preparedConnectionCapacityMw: 105,
    evidence: evidence("prepared_current", "complete", 94),
    signals: {},
  },
  {
    id: "demo-manawatu-palmerston-north",
    name: "Palmerston North demonstration zone",
    region: "Manawatū-Whanganui",
    latitude: -40.3564,
    longitude: 175.6111,
    preparedConnectionCapacityMw: 58,
    evidence: evidence("prepared_current", "complete", 90),
    signals: {},
  },
  {
    id: "demo-wellington-seaview",
    name: "Seaview demonstration zone",
    region: "Wellington",
    latitude: -41.235,
    longitude: 174.9104,
    preparedConnectionCapacityMw: 82,
    evidence: evidence("prepared_current", "complete", 93),
    signals: {
      specialistAssessment:
        "Prepared flag: seismic and coastal-hazard assumptions need specialist review.",
    },
  },
  {
    id: "demo-tasman-richmond",
    name: "Richmond demonstration zone",
    region: "Tasman",
    latitude: -41.3397,
    longitude: 173.1854,
    preparedConnectionCapacityMw: 71,
    evidence: evidence("unknown", "missing", 42),
    signals: {},
  },
  {
    id: "demo-nelson",
    name: "Nelson demonstration zone",
    region: "Nelson",
    latitude: -41.2706,
    longitude: 173.284,
    preparedConnectionCapacityMw: 63,
    evidence: evidence("prepared_current", "complete", 88),
    signals: {},
  },
  {
    id: "demo-marlborough-blenheim",
    name: "Blenheim demonstration zone",
    region: "Marlborough",
    latitude: -41.5134,
    longitude: 173.9612,
    preparedConnectionCapacityMw: 84,
    evidence: evidence("prepared_current", "complete", 91),
    signals: {},
  },
  {
    id: "demo-west-coast-greymouth",
    name: "Greymouth demonstration zone",
    region: "West Coast",
    latitude: -42.4504,
    longitude: 171.2108,
    preparedConnectionCapacityMw: 69,
    evidence: evidence("prepared_current", "complete", 87),
    signals: {
      exclusion:
        "Prepared flag: the demonstration parcel intersects a declared hazard exclusion.",
    },
  },
  {
    id: "demo-canterbury-christchurch-west",
    name: "Christchurch West demonstration zone",
    region: "Canterbury",
    latitude: -43.5209,
    longitude: 172.5432,
    preparedConnectionCapacityMw: 132,
    evidence: evidence("prepared_current", "complete", 97),
    signals: {},
  },
  {
    id: "demo-otago-mosgiel",
    name: "Mosgiel demonstration zone",
    region: "Otago",
    latitude: -45.875,
    longitude: 170.3489,
    preparedConnectionCapacityMw: 61,
    evidence: evidence("prepared_current", "complete", 90),
    signals: {},
  },
  {
    id: "demo-southland-invercargill",
    name: "Invercargill demonstration zone",
    region: "Southland",
    latitude: -46.4132,
    longitude: 168.3538,
    preparedConnectionCapacityMw: 110,
    evidence: evidence("prepared_current", "complete", 96),
    signals: {},
  },
]);
