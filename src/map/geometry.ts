import type {
  LinearRing,
  PolygonCoordinates,
  RegionFeature,
  RegionFeatureCollection,
  RegionId,
  Wgs84Point,
} from "./contracts";

const EPSILON = 1e-10;

const pointOnSegment = (
  point: Wgs84Point,
  left: readonly [number, number],
  right: readonly [number, number],
): boolean => {
  const cross = (point.latitude - left[1]) * (right[0] - left[0])
    - (point.longitude - left[0]) * (right[1] - left[1]);
  if (Math.abs(cross) > EPSILON) return false;
  return point.longitude >= Math.min(left[0], right[0]) - EPSILON
    && point.longitude <= Math.max(left[0], right[0]) + EPSILON
    && point.latitude >= Math.min(left[1], right[1]) - EPSILON
    && point.latitude <= Math.max(left[1], right[1]) + EPSILON;
};

const ringLocation = (point: Wgs84Point, ring: LinearRing): "inside" | "outside" | "boundary" => {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const left = ring[previous];
    const right = ring[index];
    if (pointOnSegment(point, left, right)) return "boundary";
    const crosses = (left[1] > point.latitude) !== (right[1] > point.latitude)
      && point.longitude < ((right[0] - left[0]) * (point.latitude - left[1]))
        / (right[1] - left[1]) + left[0];
    if (crosses) inside = !inside;
  }
  return inside ? "inside" : "outside";
};

const pointInPolygon = (point: Wgs84Point, polygon: PolygonCoordinates): boolean => {
  const exterior = ringLocation(point, polygon[0]);
  if (exterior === "outside") return false;
  if (exterior === "boundary") return true;
  for (const hole of polygon.slice(1)) {
    const location = ringLocation(point, hole);
    if (location === "boundary") return true;
    if (location === "inside") return false;
  }
  return true;
};

export const pointInRegionFeature = (
  point: Wgs84Point,
  feature: RegionFeature,
): boolean => feature.geometry.type === "Polygon"
  ? pointInPolygon(point, feature.geometry.coordinates)
  : feature.geometry.coordinates.some((polygon) => pointInPolygon(point, polygon));

export const resolveRegionAtPoint = (
  point: Wgs84Point,
  collection: RegionFeatureCollection,
): RegionId | undefined => collection.features
  .filter((feature) => pointInRegionFeature(point, feature))
  .map((feature) => feature.id)
  .sort()[0];
