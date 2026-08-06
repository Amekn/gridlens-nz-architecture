import { createHash } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_DATASET_URL = "https://datafinder.stats.govt.nz/layer/111182-regional-council-2023-generalised/";
const DISTRIBUTION_URL = "https://services.arcgis.com/XTtANUDT8Va4DLwI/arcgis/rest/services/Regional_Council_Boundary/FeatureServer/0";
const EDITION = "Stats NZ Regional Council 2023 (generalised), 12 nautical miles";
const LICENCE = "Creative Commons Attribution 4.0 International";
const ATTRIBUTION = "Stats NZ; distributed by Eagle Technology";
const RELEASE_ID = "stats-nz-regional-council-2023-v1";
const PRECISION = 5;
const TOLERANCE = 0.0005;

const EXPECTED = Object.freeze([
  ["1", "01", "Northland Region"],
  ["2", "02", "Auckland Region"],
  ["3", "03", "Waikato Region"],
  ["4", "04", "Bay of Plenty Region"],
  ["5", "05", "Gisborne Region"],
  ["6", "06", "Hawke's Bay Region"],
  ["7", "07", "Taranaki Region"],
  ["8", "08", "Manawatū-Whanganui Region"],
  ["9", "09", "Wellington Region"],
  ["12", "12", "West Coast Region"],
  ["13", "13", "Canterbury Region"],
  ["14", "14", "Otago Region"],
  ["15", "15", "Southland Region"],
  ["16", "16", "Tasman Region"],
  ["17", "17", "Nelson Region"],
  ["18", "18", "Marlborough Region"],
  ["99", "99", "Area Outside Region"],
]);

const expectedBySourceCode = new Map(EXPECTED.map((entry) => [entry[0], entry]));
const regionIds = EXPECTED.map((entry) => entry[1]);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.resolve(scriptDirectory, "../public/data/regions");
const geometryPath = path.join(outputDirectory, "regions.geojson");
const manifestPath = path.join(outputDirectory, "manifest.json");

const fail = (message) => {
  throw new Error(`Region preparation failed: ${message}`);
};

const getJson = async (url) => {
  const response = await fetch(url, { redirect: "error" });
  if (!response.ok) fail(`${url.pathname} returned HTTP ${response.status}`);
  return response.json();
};

const round = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) fail("non-finite coordinate");
  const rounded = Number(value.toFixed(PRECISION));
  return Object.is(rounded, -0) ? 0 : rounded;
};

const normalizePosition = (value) => {
  if (!Array.isArray(value) || value.length < 2) fail("invalid coordinate position");
  const position = [round(value[0]), round(value[1])];
  if (position[0] < -180 || position[0] > 180 || position[1] < -90 || position[1] > 90) {
    fail("coordinate is outside WGS84 bounds");
  }
  return position;
};

const samePosition = (left, right) => left[0] === right[0] && left[1] === right[1];

const normalizeRing = (value) => {
  if (!Array.isArray(value)) fail("invalid linear ring");
  const ring = [];
  for (const rawPosition of value) {
    const position = normalizePosition(rawPosition);
    if (!ring.length || !samePosition(ring[ring.length - 1], position)) ring.push(position);
  }
  if (ring.length && !samePosition(ring[0], ring[ring.length - 1])) ring.push([...ring[0]]);
  if (ring.length < 4 || ring.length > 20_000) fail("linear ring is unclosed or outside its size bound");
  return ring;
};

const normalizePolygon = (value) => {
  if (!Array.isArray(value) || value.length < 1 || value.length > 2_000) fail("invalid polygon");
  return value.map(normalizeRing);
};

const normalizeGeometry = (geometry) => {
  if (!geometry || typeof geometry !== "object") fail("missing geometry");
  if (geometry.type === "Polygon") {
    return { type: "Polygon", coordinates: normalizePolygon(geometry.coordinates) };
  }
  if (geometry.type === "MultiPolygon") {
    if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 1
      || geometry.coordinates.length > 2_000) fail("invalid multipolygon");
    return { type: "MultiPolygon", coordinates: geometry.coordinates.map(normalizePolygon) };
  }
  fail(`unsupported geometry type ${String(geometry.type)}`);
};

const pointOnSegment = (point, left, right) => {
  const cross = (point.latitude - left[1]) * (right[0] - left[0])
    - (point.longitude - left[0]) * (right[1] - left[1]);
  if (Math.abs(cross) > 1e-10) return false;
  return point.longitude >= Math.min(left[0], right[0]) - 1e-10
    && point.longitude <= Math.max(left[0], right[0]) + 1e-10
    && point.latitude >= Math.min(left[1], right[1]) - 1e-10
    && point.latitude <= Math.max(left[1], right[1]) + 1e-10;
};

const ringLocation = (point, ring) => {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const left = ring[previous];
    const right = ring[index];
    if (pointOnSegment(point, left, right)) return "boundary";
    if ((left[1] > point.latitude) !== (right[1] > point.latitude)
      && point.longitude < ((right[0] - left[0]) * (point.latitude - left[1]))
        / (right[1] - left[1]) + left[0]) inside = !inside;
  }
  return inside ? "inside" : "outside";
};

const pointInPolygon = (point, polygon) => {
  const exterior = ringLocation(point, polygon[0]);
  if (exterior === "outside") return false;
  if (exterior === "boundary") return true;
  return polygon.slice(1).every((hole) => ringLocation(point, hole) !== "inside");
};

const signedArea = (ring) => {
  let sum = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    sum += ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1];
  }
  return sum / 2;
};

const ringCentroid = (ring) => {
  let crossSum = 0;
  let longitude = 0;
  let latitude = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const left = ring[index];
    const right = ring[index + 1];
    const cross = left[0] * right[1] - right[0] * left[1];
    crossSum += cross;
    longitude += (left[0] + right[0]) * cross;
    latitude += (left[1] + right[1]) * cross;
  }
  if (Math.abs(crossSum) < 1e-12) return undefined;
  return { longitude: longitude / (3 * crossSum), latitude: latitude / (3 * crossSum) };
};

const labelPointForGeometry = (geometry) => {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const ordered = [...polygons].sort((left, right) =>
    Math.abs(signedArea(right[0])) - Math.abs(signedArea(left[0])));
  for (const polygon of ordered) {
    const ring = polygon[0];
    const longitudes = ring.map((position) => position[0]);
    const latitudes = ring.map((position) => position[1]);
    const bounds = {
      west: Math.min(...longitudes), east: Math.max(...longitudes),
      south: Math.min(...latitudes), north: Math.max(...latitudes),
    };
    const candidates = [
      ringCentroid(ring),
      { longitude: (bounds.west + bounds.east) / 2, latitude: (bounds.south + bounds.north) / 2 },
    ].filter(Boolean);
    for (const candidate of candidates) {
      if (pointInPolygon(candidate, polygon)) {
        return { longitude: round(candidate.longitude), latitude: round(candidate.latitude) };
      }
    }
    for (let row = 1; row < 32; row += 1) {
      const latitude = bounds.south + (bounds.north - bounds.south) * row / 32;
      for (let column = 1; column < 32; column += 1) {
        const point = {
          longitude: round(bounds.west + (bounds.east - bounds.west) * column / 32),
          latitude: round(latitude),
        };
        if (pointInPolygon(point, polygon)) return point;
      }
    }
    const boundaryPoint = { longitude: ring[0][0], latitude: ring[0][1] };
    if (pointInPolygon(boundaryPoint, polygon)) return boundaryPoint;
  }
  fail("could not compute an in-geometry label point");
};

const prepare = async () => {
  const metadataUrl = new URL(DISTRIBUTION_URL);
  metadataUrl.searchParams.set("f", "json");
  const metadata = await getJson(metadataUrl);
  const fields = new Set(Array.isArray(metadata.fields) ? metadata.fields.map((field) => field.name) : []);
  if (metadata.name !== "NZ Regional Councils 12 nm"
    || metadata.geometryType !== "esriGeometryPolygon"
    || !fields.has("REGC_code") || !fields.has("REGC_name")) {
    fail("the pinned ArcGIS layer identity or field family changed");
  }

  const queryUrl = new URL(`${DISTRIBUTION_URL}/query`);
  queryUrl.searchParams.set("where", "1=1");
  queryUrl.searchParams.set("outFields", "REGC_code,REGC_name");
  queryUrl.searchParams.set("returnGeometry", "true");
  queryUrl.searchParams.set("outSR", "4326");
  queryUrl.searchParams.set("geometryPrecision", String(PRECISION));
  queryUrl.searchParams.set("maxAllowableOffset", String(TOLERANCE));
  queryUrl.searchParams.set("orderByFields", "REGC_code");
  queryUrl.searchParams.set("f", "geojson");
  const source = await getJson(queryUrl);
  if (source.type !== "FeatureCollection" || !Array.isArray(source.features)
    || source.features.length !== EXPECTED.length) fail("source does not contain exactly 17 regions");

  const seen = new Set();
  const features = source.features.map((rawFeature) => {
    const sourceCode = rawFeature?.properties?.REGC_code;
    const sourceName = rawFeature?.properties?.REGC_name;
    if (typeof sourceCode !== "string" || !expectedBySourceCode.has(sourceCode)) {
      fail(`unexpected REGC_code ${String(sourceCode)}`);
    }
    const [, regionId, expectedName] = expectedBySourceCode.get(sourceCode);
    if (sourceName !== expectedName || seen.has(regionId)) {
      fail(`unexpected or duplicate region ${sourceCode}/${String(sourceName)}`);
    }
    seen.add(regionId);
    const geometry = normalizeGeometry(rawFeature.geometry);
    return {
      type: "Feature",
      id: regionId,
      properties: {
        regionId,
        name: expectedName,
        labelPoint: labelPointForGeometry(geometry),
        sourceField: "REGC_code",
        sourceNameField: "REGC_name",
      },
      geometry,
    };
  }).sort((left, right) => left.id.localeCompare(right.id));

  if (regionIds.some((regionId) => !seen.has(regionId))) fail("the exact RegionId set is incomplete");
  const collection = { type: "FeatureCollection", features };
  const geometryBytes = Buffer.from(`${JSON.stringify(collection)}\n`, "utf8");
  const sha256 = createHash("sha256").update(geometryBytes).digest("hex");
  const manifest = {
    schemaVersion: "gridlens.region-asset.v2",
    edition: EDITION,
    sourceDatasetUrl: SOURCE_DATASET_URL,
    distributionUrl: DISTRIBUTION_URL,
    licence: LICENCE,
    attribution: ATTRIBUTION,
    generatedAt: new Date().toISOString(),
    geometryPrecision: PRECISION,
    generalizationToleranceDegrees: TOLERANCE,
    sha256,
    featureCount: 17,
    regionIds,
    releaseId: RELEASE_ID,
  };
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  await mkdir(outputDirectory, { recursive: true });
  const suffix = `.candidate-${process.pid}`;
  const geometryCandidate = `${geometryPath}${suffix}`;
  const manifestCandidate = `${manifestPath}${suffix}`;
  await writeFile(geometryCandidate, geometryBytes, { flag: "wx" });
  await writeFile(manifestCandidate, manifestBytes, { flag: "wx" });
  await rename(geometryCandidate, geometryPath);
  await rename(manifestCandidate, manifestPath);
  process.stdout.write(`Prepared ${features.length} regions (${geometryBytes.length} bytes, sha256 ${sha256}).\n`);
};

await prepare();
