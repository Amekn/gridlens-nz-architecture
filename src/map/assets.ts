import type {
  LinearRing,
  MultiPolygonCoordinates,
  PolygonCoordinates,
  Position,
  RegionAssetManifest,
  RegionFeature,
  RegionFeatureCollection,
  Wgs84Point,
} from "./contracts";
import { pointInRegionFeature } from "./geometry";
import { isRegionId, REGION_BY_ID, REGION_IDS } from "./regions";

export const REGION_MANIFEST_PATH = "/data/regions/manifest.json";
export const REGION_ASSET_PATH = "/data/regions/regions.geojson";

const MANIFEST_CONSTANTS = {
  schemaVersion: "gridlens.region-asset.v2",
  edition: "Stats NZ Regional Council 2023 (generalised), 12 nautical miles",
  sourceDatasetUrl: "https://datafinder.stats.govt.nz/layer/111182-regional-council-2023-generalised/",
  distributionUrl: "https://services.arcgis.com/XTtANUDT8Va4DLwI/arcgis/rest/services/Regional_Council_Boundary/FeatureServer/0",
  licence: "Creative Commons Attribution 4.0 International",
  attribution: "Stats NZ; distributed by Eagle Technology",
} as const;

type BinaryInput = ArrayBuffer | ArrayBufferView;

export class MapAssetError extends Error {
  readonly code: "network" | "checksum" | "schema";
  readonly retryable: boolean;

  constructor(code: MapAssetError["code"], message: string) {
    super(message);
    this.name = "MapAssetError";
    this.code = code;
    this.retryable = code === "network";
  }
}

const bytesFrom = (input: BinaryInput): Uint8Array => {
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
};
const decodeJson = (input: BinaryInput, label: string): unknown => {
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytesFrom(input)));
  } catch {
    throw new MapAssetError("schema", `${label} is not valid UTF-8 JSON`);
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const exactKeys = (value: Record<string, unknown>, expected: readonly string[]): boolean => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
};

const isFiniteInRange = (value: unknown, minimum: number, maximum: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0)
  && value >= minimum && value <= maximum;

const parsePoint = (value: unknown): Wgs84Point | undefined => {
  if (!isObject(value) || !exactKeys(value, ["longitude", "latitude"])) return undefined;
  if (!isFiniteInRange(value.longitude, -180, 180) || !isFiniteInRange(value.latitude, -90, 90)) {
    return undefined;
  }
  return { longitude: value.longitude, latitude: value.latitude };
};

const parsePosition = (value: unknown): Position | undefined => {
  if (!Array.isArray(value) || value.length !== 2
    || !isFiniteInRange(value[0], -180, 180)
    || !isFiniteInRange(value[1], -90, 90)) return undefined;
  return [value[0], value[1]];
};

const positionsEqual = (left: Position, right: Position): boolean =>
  left[0] === right[0] && left[1] === right[1];

const parseRing = (value: unknown): LinearRing | undefined => {
  if (!Array.isArray(value) || value.length < 4 || value.length > 20_000) return undefined;
  const positions = value.map(parsePosition);
  if (positions.some((position) => !position)) return undefined;
  const ring = positions as Position[];
  return positionsEqual(ring[0], ring[ring.length - 1]) ? ring : undefined;
};

const parsePolygon = (value: unknown): PolygonCoordinates | undefined => {
  if (!Array.isArray(value) || value.length < 1 || value.length > 2_000) return undefined;
  const rings = value.map(parseRing);
  return rings.some((ring) => !ring) ? undefined : rings as LinearRing[];
};

const parseMultiPolygon = (value: unknown): MultiPolygonCoordinates | undefined => {
  if (!Array.isArray(value) || value.length < 1 || value.length > 2_000) return undefined;
  const polygons = value.map(parsePolygon);
  return polygons.some((polygon) => !polygon) ? undefined : polygons as PolygonCoordinates[];
};

export const validateRegionFeatureCollection = (value: unknown): RegionFeatureCollection => {
  if (!isObject(value) || !exactKeys(value, ["type", "features"])
    || value.type !== "FeatureCollection" || !Array.isArray(value.features)
    || value.features.length !== 17) {
    throw new MapAssetError("schema", "Region geometry must contain exactly 17 features");
  }

  const seen = new Set<string>();
  const features: RegionFeature[] = value.features.map((rawFeature) => {
    if (!isObject(rawFeature) || !exactKeys(rawFeature, ["type", "id", "properties", "geometry"])
      || rawFeature.type !== "Feature" || !isRegionId(rawFeature.id)
      || seen.has(rawFeature.id)) {
      throw new MapAssetError("schema", "Region feature identity is invalid or duplicated");
    }
    seen.add(rawFeature.id);
    if (!isObject(rawFeature.properties)
      || !exactKeys(rawFeature.properties, ["regionId", "name", "labelPoint", "sourceField", "sourceNameField"])
      || rawFeature.properties.regionId !== rawFeature.id
      || rawFeature.properties.name !== REGION_BY_ID[rawFeature.id].sourceName
      || rawFeature.properties.sourceField !== "REGC_code"
      || rawFeature.properties.sourceNameField !== "REGC_name") {
      throw new MapAssetError("schema", `Region ${rawFeature.id} properties are invalid`);
    }
    const labelPoint = parsePoint(rawFeature.properties.labelPoint);
    if (!labelPoint || !isObject(rawFeature.geometry)
      || !exactKeys(rawFeature.geometry, ["type", "coordinates"])) {
      throw new MapAssetError("schema", `Region ${rawFeature.id} geometry is invalid`);
    }
    const coordinates = rawFeature.geometry.type === "Polygon"
      ? parsePolygon(rawFeature.geometry.coordinates)
      : rawFeature.geometry.type === "MultiPolygon"
        ? parseMultiPolygon(rawFeature.geometry.coordinates)
        : undefined;
    if (!coordinates) throw new MapAssetError("schema", `Region ${rawFeature.id} geometry is invalid`);
    const feature = {
      type: "Feature" as const,
      id: rawFeature.id,
      properties: {
        regionId: rawFeature.id,
        name: rawFeature.properties.name,
        labelPoint,
        sourceField: "REGC_code" as const,
        sourceNameField: "REGC_name" as const,
      },
      geometry: rawFeature.geometry.type === "Polygon"
        ? { type: "Polygon" as const, coordinates: coordinates as PolygonCoordinates }
        : { type: "MultiPolygon" as const, coordinates: coordinates as MultiPolygonCoordinates },
    } satisfies RegionFeature;
    if (!pointInRegionFeature(labelPoint, feature)) {
      throw new MapAssetError("schema", `Region ${rawFeature.id} label point is outside its geometry`);
    }
    return feature;
  });

  if (REGION_IDS.some((regionId) => !seen.has(regionId))) {
    throw new MapAssetError("schema", "Region geometry does not contain the exact RegionId set");
  }
  return Object.freeze({ type: "FeatureCollection", features: Object.freeze(features) });
};

export const validateRegionManifest = (value: unknown): RegionAssetManifest => {
  const keys = [
    "schemaVersion", "edition", "sourceDatasetUrl", "distributionUrl", "licence",
    "attribution", "generatedAt", "geometryPrecision", "generalizationToleranceDegrees",
    "sha256", "featureCount", "regionIds", "releaseId",
  ];
  if (!isObject(value) || !exactKeys(value, keys)) {
    throw new MapAssetError("schema", "Region manifest shape is invalid");
  }
  for (const [key, expected] of Object.entries(MANIFEST_CONSTANTS)) {
    if (value[key] !== expected) throw new MapAssetError("schema", `Region manifest ${key} is invalid`);
  }
  if (value.geometryPrecision !== 5 || value.generalizationToleranceDegrees !== 0.0005
    || value.featureCount !== 17 || !Array.isArray(value.regionIds)
    || value.regionIds.length !== REGION_IDS.length
    || !value.regionIds.every((id, index) => id === REGION_IDS[index])
    || typeof value.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.sha256)
    || typeof value.releaseId !== "string" || value.releaseId.length < 1 || value.releaseId.length > 80
    || typeof value.generatedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.generatedAt)) {
    throw new MapAssetError("schema", "Region manifest values are invalid");
  }
  return value as RegionAssetManifest;
};

export const sha256Hex = async (input: BinaryInput): Promise<string> => {
  const source = bytesFrom(input);
  const stableBytes = new Uint8Array(source.byteLength);
  stableBytes.set(source);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", stableBytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

export type VerifiedRegionAssets = {
  readonly manifest: RegionAssetManifest;
  readonly features: RegionFeatureCollection;
};

export const validateRegionAssetBytes = async (
  manifestBytes: BinaryInput,
  geometryBytes: BinaryInput,
): Promise<VerifiedRegionAssets> => {
  const manifest = validateRegionManifest(decodeJson(manifestBytes, "Region manifest"));
  const actualHash = await sha256Hex(geometryBytes);
  if (actualHash !== manifest.sha256) {
    throw new MapAssetError("checksum", "Region geometry checksum does not match its manifest");
  }
  const features = validateRegionFeatureCollection(decodeJson(geometryBytes, "Region geometry"));
  return Object.freeze({ manifest, features });
};

const fetchBytes = async (
  path: string,
  fetcher: typeof fetch,
  signal?: AbortSignal,
): Promise<ArrayBuffer> => {
  let response: Response;
  try {
    response = await fetcher(path, { signal, cache: path === REGION_MANIFEST_PATH ? "no-store" : "force-cache" });
  } catch {
    throw new MapAssetError("network", `Unable to load ${path}`);
  }
  if (!response.ok) throw new MapAssetError("network", `Unable to load ${path} (${response.status})`);
  return response.arrayBuffer();
};

export const loadVerifiedRegionAssets = async (
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<VerifiedRegionAssets> => {
  const manifestBytes = await fetchBytes(REGION_MANIFEST_PATH, fetcher, signal);
  const geometryBytes = await fetchBytes(REGION_ASSET_PATH, fetcher, signal);
  return validateRegionAssetBytes(manifestBytes, geometryBytes);
};
