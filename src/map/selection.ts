import type {
  MapMarker,
  RegionFeatureCollection,
  RegionId,
  SelectionSource,
  Wgs84Point,
} from "./contracts";
import { resolveRegionAtPoint } from "./geometry";
import { isRegionId } from "./regions";

export type MapSelectionState = {
  readonly generation: number;
  readonly regionId?: RegionId;
  readonly selectedMarkerId?: string;
};

export type MapSelectionIntent =
  | {
    readonly kind: "point";
    readonly generation: number;
    readonly point: Wgs84Point;
    readonly source: "polygon_pointer" | "polygon_keyboard" | "coordinate";
  }
  | {
    readonly kind: "marker";
    readonly generation: number;
    readonly markerId: string;
    readonly source: "marker_pointer" | "marker_keyboard";
  }
  | {
    readonly kind: "region";
    readonly generation: number;
    readonly regionId: RegionId;
    readonly source: "accessible_list" | "search" | "restore";
  };

type WithoutGeneration<T> = T extends unknown ? Omit<T, "generation"> : never;
export type MapSelectionRequest = WithoutGeneration<MapSelectionIntent>;

export type MapSelectionResult = {
  readonly outcome: "accepted" | "stale_ignored" | "invalid";
  readonly state: MapSelectionState;
  readonly source: SelectionSource;
};

export const applySelectionIntent = (
  state: MapSelectionState,
  intent: MapSelectionIntent,
  regions: RegionFeatureCollection,
  markers: readonly MapMarker[],
): MapSelectionResult => {
  if (!Number.isSafeInteger(intent.generation) || intent.generation < 1) {
    return { outcome: "invalid", state, source: intent.source };
  }
  if (intent.generation <= state.generation) {
    return { outcome: "stale_ignored", state, source: intent.source };
  }
  if (intent.kind === "marker") {
    const marker = markers.find(({ markerId }) => markerId === intent.markerId);
    if (!marker) return { outcome: "invalid", state, source: intent.source };
    return {
      outcome: "accepted",
      state: {
        generation: intent.generation,
        regionId: marker.regionId,
        selectedMarkerId: marker.markerId,
      },
      source: intent.source,
    };
  }
  if (intent.kind === "region") {
    if (!isRegionId(intent.regionId)) {
      return { outcome: "invalid", state, source: intent.source };
    }
    return {
      outcome: "accepted",
      state: { generation: intent.generation, regionId: intent.regionId },
      source: intent.source,
    };
  }
  const regionId = resolveRegionAtPoint(intent.point, regions);
  if (!regionId) return { outcome: "invalid", state, source: intent.source };
  return {
    outcome: "accepted",
    state: { generation: intent.generation, regionId },
    source: intent.source,
  };
};
