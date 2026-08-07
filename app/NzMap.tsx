"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  loadVerifiedRegionAssets,
  MapAssetError,
  type VerifiedRegionAssets,
} from "@/src/map/assets";
import type {
  MapAssetState,
  MapMarker,
  RegionFeatureCollection,
  RegionId,
  SelectionSource,
  SiteDomainOutcome,
} from "@/src/map/contracts";
import {
  candidateMarkersFromSites,
  markerFeatureCollection,
  markerHitTargetRadius,
  type CandidateSiteMarkerInput,
} from "@/src/map/markers";
import { REGION_BY_ID, REGION_INDEX, isRegionId } from "@/src/map/regions";
import {
  applySelectionIntent,
  type MapSelectionIntent,
  type MapSelectionRequest,
  type MapSelectionState,
} from "@/src/map/selection";

export type MapSite = Omit<CandidateSiteMarkerInput, "regionId" | "domainOutcome"> & {
  readonly regionId?: RegionId;
  readonly domainOutcome?: SiteDomainOutcome;
};

export type NzMapProps = {
  readonly sites: readonly MapSite[];
  readonly selectedSiteId: string;
  readonly selectedRegionId?: RegionId;
  readonly onSelect: (siteId: string) => void;
  readonly onSelectRegion?: (
    regionId: RegionId,
    source: SelectionSource,
    selectedSiteId?: string,
  ) => void;
};

type MapLibreMap = import("maplibre-gl").Map;

const EMPTY_REGIONS: RegionFeatureCollection = Object.freeze({
  type: "FeatureCollection",
  features: Object.freeze([]),
});

const regionRenderCollection = (
  collection: RegionFeatureCollection,
  selectedRegionId?: RegionId,
) => ({
  type: "FeatureCollection" as const,
  features: collection.features.map((feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      selected: feature.id === selectedRegionId ? 1 : 0,
    },
  })),
});

const syncMapLayers = (
  map: MapLibreMap,
  regions: RegionFeatureCollection,
  markers: readonly MapMarker[],
  selection: MapSelectionState,
) => {
  if (!map.isStyleLoaded()) return;
  const regionData = regionRenderCollection(regions, selection.regionId);
  const markerData = markerFeatureCollection(markers, selection.selectedMarkerId);

  const regionSource = map.getSource("verified-regions") as import("maplibre-gl").GeoJSONSource | undefined;
  if (regionSource) regionSource.setData(regionData as never);
  else map.addSource("verified-regions", { type: "geojson", data: regionData as never });

  const markerSource = map.getSource("typed-map-markers") as import("maplibre-gl").GeoJSONSource | undefined;
  if (markerSource) markerSource.setData(markerData as never);
  else map.addSource("typed-map-markers", { type: "geojson", data: markerData as never });

  if (!map.getLayer("region-fill")) {
    map.addLayer({
      id: "region-fill",
      type: "fill",
      source: "verified-regions",
      paint: {
        "fill-color": ["case", ["==", ["get", "selected"], 1], "#32d49b", "#82b9aa"],
        "fill-opacity": ["case", ["==", ["get", "selected"], 1], 0.44, 0.2],
      },
    });
  }
  if (!map.getLayer("region-boundary")) {
    map.addLayer({
      id: "region-boundary",
      type: "line",
      source: "verified-regions",
      paint: {
        "line-color": ["case", ["==", ["get", "selected"], 1], "#d9fff1", "#a7d8ca"],
        "line-opacity": 0.9,
        "line-width": ["case", ["==", ["get", "selected"], 1], 3, 1.1],
      },
    });
  }
  if (!map.getLayer("marker-hit-targets")) {
    map.addLayer({
      id: "marker-hit-targets",
      type: "circle",
      source: "typed-map-markers",
      paint: {
        "circle-radius": markerHitTargetRadius,
        "circle-color": "#ffffff",
        "circle-opacity": 0.01,
      },
    });
  }
  if (!map.getLayer("marker-halos")) {
    map.addLayer({
      id: "marker-halos",
      type: "circle",
      source: "typed-map-markers",
      paint: {
        "circle-radius": ["case", ["==", ["get", "selected"], 1], 15, 10],
        "circle-color": ["get", "colour"],
        "circle-opacity": 0.24,
        "circle-blur": 0.2,
      },
    });
  }
  if (!map.getLayer("marker-points")) {
    map.addLayer({
      id: "marker-points",
      type: "circle",
      source: "typed-map-markers",
      paint: {
        "circle-radius": ["case", ["==", ["get", "selected"], 1], 8, 6],
        "circle-color": ["get", "colour"],
        "circle-stroke-color": "#071616",
        "circle-stroke-width": ["case", ["==", ["get", "selected"], 1], 3, 1.5],
      },
    });
  }
};

const siteIdByMarkerId = (
  sites: readonly MapSite[],
  markers: readonly MapMarker[],
): ReadonlyMap<string, string> => new Map(
  markers.map((marker, index) => [marker.markerId, sites[index]?.id ?? ""]),
);

export function NzMap({
  sites,
  selectedSiteId,
  selectedRegionId,
  onSelect,
  onSelectRegion,
}: NzMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const onSelectRegionRef = useRef(onSelectRegion);
  const assetsRef = useRef<VerifiedRegionAssets | null>(null);
  const selectionRef = useRef<MapSelectionState>({ generation: 0 });
  const markersRef = useRef<readonly MapMarker[]>([]);
  const markerSiteIdsRef = useRef<ReadonlyMap<string, string>>(new Map());
  const [assets, setAssets] = useState<VerifiedRegionAssets | null>(null);
  const [assetState, setAssetState] = useState<MapAssetState>({ state: "loading" });
  const [retryGeneration, setRetryGeneration] = useState(0);
  const [basemapDegraded, setBasemapDegraded] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [selection, setSelection] = useState<MapSelectionState>({ generation: 0 });

  const markerBuild = useMemo(() => {
    try {
      const markers = candidateMarkersFromSites(sites);
      return { markers, error: undefined };
    } catch (error) {
      return {
        markers: Object.freeze([]) as readonly MapMarker[],
        error: error instanceof Error ? error.message : "Candidate markers are unavailable",
      };
    }
  }, [sites]);
  const markers = markerBuild.markers;
  const markerSiteIds = useMemo(() => siteIdByMarkerId(sites, markers), [sites, markers]);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onSelectRegionRef.current = onSelectRegion;
  }, [onSelect, onSelectRegion]);

  useEffect(() => {
    markersRef.current = markers;
    markerSiteIdsRef.current = markerSiteIds;
  }, [markerSiteIds, markers]);

  useEffect(() => {
    const controller = new AbortController();
    void loadVerifiedRegionAssets(fetch, controller.signal).then((verified) => {
      assetsRef.current = verified;
      setAssets(verified);
      setAssetState({ state: "ready" });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const assetError = error instanceof MapAssetError ? error : undefined;
      setAssetState({
        state: "failed",
        message: assetError?.message ?? "Verified region geometry is unavailable",
        retryable: assetError?.retryable ?? false,
      });
    });
    return () => controller.abort();
  }, [retryGeneration]);

  useEffect(() => {
    const selectedIndex = sites.findIndex(({ id }) => id === selectedSiteId);
    const selectedMarker = selectedIndex >= 0 ? markers[selectedIndex] : undefined;
    const controlledRegion = isRegionId(selectedRegionId) ? selectedRegionId : selectedMarker?.regionId;
    if (!controlledRegion) return;
    const next = {
      generation: selectionRef.current.generation + 1,
      regionId: controlledRegion,
      ...(selectedMarker && selectedMarker.regionId === controlledRegion
        ? { selectedMarkerId: selectedMarker.markerId }
        : {}),
    } satisfies MapSelectionState;
    selectionRef.current = next;
    setSelection(next);
  }, [markers, selectedRegionId, selectedSiteId, sites]);

  const dispatchSelection = useCallback((intent: MapSelectionRequest) => {
    const fullIntent = {
      ...intent,
      generation: selectionRef.current.generation + 1,
    } as MapSelectionIntent;
    const result = applySelectionIntent(
      selectionRef.current,
      fullIntent,
      assetsRef.current?.features ?? EMPTY_REGIONS,
      markersRef.current,
    );
    if (result.outcome !== "accepted" || !result.state.regionId) return;
    selectionRef.current = result.state;
    setSelection(result.state);
    const siteId = result.state.selectedMarkerId
      ? markerSiteIdsRef.current.get(result.state.selectedMarkerId)
      : undefined;
    onSelectRegionRef.current?.(result.state.regionId, result.source, siteId || undefined);
    if (siteId) onSelectRef.current(siteId);
  }, []);

  useEffect(() => {
    let disposed = false;
    if (!containerRef.current || mapRef.current) return;

    void import("maplibre-gl").then((maplibregl) => {
      if (disposed || !containerRef.current) return;
      try {
        const map = new maplibregl.Map({
          container: containerRef.current,
          center: [172.5, -41.3],
          zoom: 4.25,
          minZoom: 3.6,
          maxZoom: 12,
          attributionControl: false,
          style: {
            version: 8,
            sources: {
              osm: {
                type: "raster",
                tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                attribution: "© OpenStreetMap contributors",
              },
            },
            layers: [{
              id: "osm",
              type: "raster",
              source: "osm",
              paint: { "raster-saturation": -0.7, "raster-brightness-max": 0.72 },
            }],
          },
        });
        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-left");
        map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

        const install = () => syncMapLayers(
          map,
          assetsRef.current?.features ?? EMPTY_REGIONS,
          markersRef.current,
          selectionRef.current,
        );
        map.on("load", install);
        map.on("styledata", install);
        map.on("error", () => setBasemapDegraded(true));
        map.on("click", (event) => {
          if (map.getLayer("marker-hit-targets")) {
            const hit = map.queryRenderedFeatures(event.point, { layers: ["marker-hit-targets"] })[0];
            const markerId = hit?.properties?.markerId;
            if (typeof markerId === "string") {
              dispatchSelection({ kind: "marker", markerId, source: "marker_pointer" });
              return;
            }
          }
          if (!assetsRef.current) return;
          dispatchSelection({
            kind: "point",
            point: { longitude: event.lngLat.lng, latitude: event.lngLat.lat },
            source: "polygon_pointer",
          });
        });
        map.on("mousemove", (event) => {
          if (!map.getLayer("marker-hit-targets")) return;
          const overMarker = map.queryRenderedFeatures(event.point, { layers: ["marker-hit-targets"] }).length > 0;
          map.getCanvas().style.cursor = overMarker ? "pointer" : "";
        });
      } catch {
        setMapUnavailable(true);
      }
    }).catch(() => setMapUnavailable(true));

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [dispatchSelection]);

  useEffect(() => {
    assetsRef.current = assets;
    const map = mapRef.current;
    if (!map) return;
    syncMapLayers(map, assets?.features ?? EMPTY_REGIONS, markers, selection);
  }, [assets, markers, selection]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markers.find(({ markerId }) => markerId === selection.selectedMarkerId);
    if (!map || !marker || !map.isStyleLoaded()) return;
    map.easeTo({
      center: [marker.point.longitude, marker.point.latitude],
      zoom: Math.max(map.getZoom(), 5.5),
      duration: 550,
    });
  }, [markers, selection.selectedMarkerId]);

  const selectedRegionName = selection.regionId
    ? REGION_BY_ID[selection.regionId].displayName
    : undefined;
  const readinessMessage = assetState.state === "loading" || assetState.state === "idle"
    ? "Loading verified 17-region overlay…"
    : assetState.state === "failed"
      ? "Region geometry unavailable; use the verified region index."
      : selectedRegionName
        ? `${selectedRegionName} selected.`
        : "Verified 17-region overlay ready.";

  return (
    <div className="nz-map-shell">
      <div
        ref={containerRef}
        className="nz-map"
        role="region"
        aria-label="Selectable map of New Zealand regions and candidate sites"
        aria-describedby="nz-map-status"
      />
      <div className="map-wash" aria-hidden="true" />
      <div className="map-title-card">
        <span className="eyebrow">Aotearoa New Zealand</span>
        <strong>Candidate site atlas</strong>
        <span id="nz-map-status" role="status" aria-live="polite">{readinessMessage}</span>
        {basemapDegraded && assetState.state === "ready" && (
          <span role="status">Background map unavailable; verified regions remain selectable.</span>
        )}
        {mapUnavailable && <span role="status">Interactive map unavailable; use the region index.</span>}
        {markerBuild.error && <span role="status">Candidate markers unavailable: {markerBuild.error}</span>}
        {assetState.state === "failed" && assetState.retryable && (
          <button
            type="button"
            onClick={() => {
              setAssetState({ state: "loading" });
              setRetryGeneration((value) => value + 1);
            }}
          >
            Retry region map
          </button>
        )}
        <details>
          <summary>Choose a region ({REGION_INDEX.length})</summary>
          <div
            aria-label="Accessible New Zealand region index"
            style={{
              display: "grid",
              gap: 2,
              maxHeight: 220,
              marginTop: 8,
              overflowY: "auto",
            }}
          >
            {REGION_INDEX.map((region) => (
              <button
                key={region.regionId}
                type="button"
                aria-pressed={selection.regionId === region.regionId}
                onClick={() => dispatchSelection({
                  kind: "region",
                  regionId: region.regionId,
                  source: "accessible_list",
                })}
                style={{
                  minHeight: 30,
                  border: selection.regionId === region.regionId
                    ? "2px solid #32d49b"
                    : "1px solid rgba(255,255,255,.22)",
                  borderRadius: 6,
                  color: "#eff7f3",
                  background: "rgba(5,26,27,.92)",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {region.displayName}
              </button>
            ))}
          </div>
        </details>
      </div>
      <div className="map-legend" aria-label="Site assessment groups">
        <span title="No blocking issue appears in the current prepared evidence."><i className="legend-dot pass" />Meets scenario</span>
        <span title="A specialist check, infrastructure change, or evidence gap remains."><i className="legend-dot investigate" />More evidence needed</span>
        <span title="A declared constraint blocks this scenario in the current prepared evidence."><i className="legend-dot excluded" />Does not meet scenario</span>
      </div>
    </div>
  );
}
