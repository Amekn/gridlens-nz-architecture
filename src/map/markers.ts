import type {
  MapMarker,
  ScreenedCandidateMarker,
  SiteDomainOutcome,
  SitePresentationGroup,
} from "./contracts";
import { isRegionId, regionIdForName } from "./regions";

export const markerHitTargetRadius = 12;
export const markerHitTargetDiameter = markerHitTargetRadius * 2;
export const PREPARED_SITE_EVIDENCE_ID = "evidence:prepared-demo-sites-2026-08-01";

export type CandidateSiteMarkerInput = {
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly regionId?: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly presentationGroup: string;
  readonly domainOutcome?: SiteDomainOutcome;
};

const GROUP_LABEL_TO_ID: Readonly<Record<string, SitePresentationGroup>> = {
  "passes declared constraints": "passes_declared_constraints",
  "needs investigation": "needs_investigation",
  excluded: "excluded",
  passes_declared_constraints: "passes_declared_constraints",
  needs_investigation: "needs_investigation",
};

export const presentationGroupForOutcome = (
  outcome: SiteDomainOutcome,
): SitePresentationGroup => {
  if (outcome === "included") return "passes_declared_constraints";
  if (outcome === "excluded") return "excluded";
  return "needs_investigation";
};

const fallbackOutcome = (group: SitePresentationGroup): SiteDomainOutcome => {
  if (group === "passes_declared_constraints") return "included";
  if (group === "excluded") return "excluded";
  return "insufficient_evidence";
};

const candidateSlug = (siteId: string): string => {
  const withoutPrefix = siteId.replace(/^candidate:/, "").replace(/^demo-/, "");
  const slug = withoutPrefix.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!/^[a-z0-9][a-z0-9-]{0,109}$/.test(slug)) {
    throw new Error(`Invalid candidate site id: ${siteId}`);
  }
  return slug;
};

export const candidateMarkersFromSites = (
  sites: readonly CandidateSiteMarkerInput[],
): readonly ScreenedCandidateMarker[] => {
  const seen = new Set<string>();
  return Object.freeze(sites.map((site) => {
    const regionId = isRegionId(site.regionId) ? site.regionId : regionIdForName(site.region);
    if (!regionId) throw new Error(`Unknown candidate region: ${site.region}`);
    if (!Number.isFinite(site.longitude) || site.longitude < -180 || site.longitude > 180
      || !Number.isFinite(site.latitude) || site.latitude < -90 || site.latitude > 90) {
      throw new Error(`Invalid candidate coordinates: ${site.id}`);
    }
    const presentationGroup = GROUP_LABEL_TO_ID[site.presentationGroup];
    if (!presentationGroup) throw new Error(`Unknown presentation group: ${site.presentationGroup}`);
    const domainOutcome = site.domainOutcome ?? fallbackOutcome(presentationGroup);
    if (presentationGroupForOutcome(domainOutcome) !== presentationGroup) {
      throw new Error(`Candidate outcome/group mismatch: ${site.id}`);
    }
    const candidateId = `candidate:${candidateSlug(site.id)}`;
    if (seen.has(candidateId)) throw new Error(`Duplicate candidate marker: ${candidateId}`);
    seen.add(candidateId);
    return Object.freeze({
      kind: "screened_candidate" as const,
      markerId: candidateId,
      candidateId,
      name: site.name,
      regionId,
      point: { longitude: site.longitude, latitude: site.latitude },
      domainOutcome,
      presentationGroup,
      sourceRecordId: PREPARED_SITE_EVIDENCE_ID,
    });
  }));
};

const GROUP_COLOURS: Record<SitePresentationGroup, string> = {
  passes_declared_constraints: "#32d49b",
  needs_investigation: "#f6b94b",
  excluded: "#ff6b6b",
};

export const markerFeatureCollection = (
  markers: readonly MapMarker[],
  selectedMarkerId?: string,
) => ({
  type: "FeatureCollection" as const,
  features: markers.map((marker) => ({
    type: "Feature" as const,
    id: marker.markerId,
    geometry: {
      type: "Point" as const,
      coordinates: [marker.point.longitude, marker.point.latitude] as [number, number],
    },
    properties: {
      markerId: marker.markerId,
      kind: marker.kind,
      name: marker.name,
      regionId: marker.regionId,
      colour: marker.kind === "screened_candidate"
        ? GROUP_COLOURS[marker.presentationGroup]
        : marker.kind === "existing_project" ? "#72b7ff" : "#d8a6ff",
      selected: marker.markerId === selectedMarkerId ? 1 : 0,
    },
  })),
});
