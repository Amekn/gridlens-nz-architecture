export type RegionId =
  | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09"
  | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "99";

export type Wgs84Point = {
  readonly longitude: number;
  readonly latitude: number;
};

export type Position = readonly [longitude: number, latitude: number];
export type LinearRing = readonly Position[];
export type PolygonCoordinates = readonly LinearRing[];
export type MultiPolygonCoordinates = readonly PolygonCoordinates[];

export type RegionFeatureProperties = {
  readonly regionId: RegionId;
  readonly name: string;
  readonly labelPoint: Wgs84Point;
  readonly sourceField: "REGC_code";
  readonly sourceNameField: "REGC_name";
};

export type RegionFeature = {
  readonly type: "Feature";
  readonly id: RegionId;
  readonly properties: RegionFeatureProperties;
  readonly geometry:
    | { readonly type: "Polygon"; readonly coordinates: PolygonCoordinates }
    | { readonly type: "MultiPolygon"; readonly coordinates: MultiPolygonCoordinates };
};

export type RegionFeatureCollection = {
  readonly type: "FeatureCollection";
  readonly features: readonly RegionFeature[];
};

export type RegionAssetManifest = {
  readonly schemaVersion: "gridlens.region-asset.v2";
  readonly edition: "Stats NZ Regional Council 2023 (generalised), 12 nautical miles";
  readonly sourceDatasetUrl: "https://datafinder.stats.govt.nz/layer/111182-regional-council-2023-generalised/";
  readonly distributionUrl: "https://services.arcgis.com/XTtANUDT8Va4DLwI/arcgis/rest/services/Regional_Council_Boundary/FeatureServer/0";
  readonly licence: "Creative Commons Attribution 4.0 International";
  readonly attribution: "Stats NZ; distributed by Eagle Technology";
  readonly generatedAt: string;
  readonly geometryPrecision: 5;
  readonly generalizationToleranceDegrees: 0.0005;
  readonly sha256: string;
  readonly featureCount: 17;
  readonly regionIds: readonly RegionId[];
  readonly releaseId: string;
};

export type SiteDomainOutcome =
  | "included"
  | "excluded"
  | "specialist_assessment_required"
  | "infrastructure_upgrade_required"
  | "insufficient_evidence";

export type SitePresentationGroup =
  | "passes_declared_constraints"
  | "needs_investigation"
  | "excluded";

type MarkerBase = {
  readonly markerId: string;
  readonly name: string;
  readonly regionId: RegionId;
  readonly point: Wgs84Point;
  readonly sourceRecordId: string;
};

export type ExistingProjectMarker = MarkerBase & {
  readonly kind: "existing_project";
  readonly projectId: string;
  readonly status: "operating";
};

export type ProposedProjectMarker = MarkerBase & {
  readonly kind: "proposed_project";
  readonly projectId: string;
  readonly status: "proposed" | "consenting" | "construction";
};

export type ScreenedCandidateMarker = MarkerBase & {
  readonly kind: "screened_candidate";
  readonly candidateId: string;
  readonly domainOutcome: SiteDomainOutcome;
  readonly presentationGroup: SitePresentationGroup;
};

export type MapMarker =
  | ExistingProjectMarker
  | ProposedProjectMarker
  | ScreenedCandidateMarker;

export type SelectionSource =
  | "polygon_pointer"
  | "polygon_keyboard"
  | "marker_pointer"
  | "marker_keyboard"
  | "accessible_list"
  | "search"
  | "coordinate"
  | "restore";

export type MapAssetState =
  | { readonly state: "idle" }
  | { readonly state: "loading" }
  | { readonly state: "ready" }
  | { readonly state: "failed"; readonly message: string; readonly retryable: boolean };
