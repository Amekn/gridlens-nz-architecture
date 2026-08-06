"use client";

import { useEffect, useRef } from "react";

export type MapSite = {
  id: string;
  name: string;
  region: string;
  longitude: number;
  latitude: number;
  presentationGroup: string;
};

type NzMapProps = {
  sites: readonly MapSite[];
  selectedSiteId: string;
  onSelect: (siteId: string) => void;
};

type MapLibreMap = import("maplibre-gl").Map;

const GROUP_COLOURS: Record<string, string> = {
  "passes declared constraints": "#32d49b",
  "needs investigation": "#f6b94b",
  excluded: "#ff6b6b",
};

function featureCollection(sites: readonly MapSite[], selectedSiteId: string) {
  return {
    type: "FeatureCollection" as const,
    features: sites.map((site) => ({
      type: "Feature" as const,
      id: site.id,
      geometry: { type: "Point" as const, coordinates: [site.longitude, site.latitude] },
      properties: {
        id: site.id,
        name: site.name,
        region: site.region,
        group: site.presentationGroup,
        colour: GROUP_COLOURS[site.presentationGroup],
        selected: site.id === selectedSiteId ? 1 : 0,
      },
    })),
  };
}

export function NzMap({ sites, selectedSiteId, onSelect }: NzMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const sitesRef = useRef(sites);
  const selectedSiteIdRef = useRef(selectedSiteId);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    sitesRef.current = sites;
    selectedSiteIdRef.current = selectedSiteId;
  }, [sites, selectedSiteId]);

  useEffect(() => {
    let disposed = false;
    if (!containerRef.current || mapRef.current) return;

    void import("maplibre-gl").then((maplibregl) => {
      if (disposed || !containerRef.current) return;
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
          layers: [
            { id: "osm", type: "raster", source: "osm", paint: { "raster-saturation": -0.7, "raster-brightness-max": 0.72 } },
          ],
        },
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-left");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", () => {
        map.addSource("candidate-sites", {
          type: "geojson",
          data: featureCollection(sitesRef.current, selectedSiteIdRef.current),
        });
        map.addLayer({
          id: "site-halos",
          type: "circle",
          source: "candidate-sites",
          paint: {
            "circle-radius": ["case", ["==", ["get", "selected"], 1], 17, 11],
            "circle-color": ["get", "colour"],
            "circle-opacity": 0.22,
            "circle-blur": 0.25,
          },
        });
        map.addLayer({
          id: "site-points",
          type: "circle",
          source: "candidate-sites",
          paint: {
            "circle-radius": ["case", ["==", ["get", "selected"], 1], 8, 5.5],
            "circle-color": ["get", "colour"],
            "circle-stroke-color": "#071616",
            "circle-stroke-width": ["case", ["==", ["get", "selected"], 1], 3, 1.5],
          },
        });
        map.on("click", "site-points", (event) => {
          const id = event.features?.[0]?.properties?.id;
          if (typeof id === "string") onSelectRef.current(id);
        });
        map.on("mouseenter", "site-points", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "site-points", () => {
          map.getCanvas().style.cursor = "";
        });
      });
    });

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const source = map.getSource("candidate-sites") as import("maplibre-gl").GeoJSONSource | undefined;
    source?.setData(featureCollection(sites, selectedSiteId));
  }, [sites, selectedSiteId]);

  useEffect(() => {
    const map = mapRef.current;
    const site = sites.find((candidate) => candidate.id === selectedSiteId);
    if (!map || !site || !map.isStyleLoaded()) return;
    map.easeTo({ center: [site.longitude, site.latitude], zoom: Math.max(map.getZoom(), 5.5), duration: 700 });
  }, [selectedSiteId, sites]);

  return (
    <div className="nz-map-shell">
      <div ref={containerRef} className="nz-map" role="application" aria-label="Selectable map of New Zealand candidate sites" />
      <div className="map-wash" aria-hidden="true" />
      <div className="map-title-card">
        <span className="eyebrow">Aotearoa New Zealand</span>
        <strong>Candidate site atlas</strong>
        <span>Select a marker to inspect a region</span>
      </div>
      <div className="map-legend" aria-label="Site assessment groups">
        <span><i className="legend-dot pass" />Passes declared constraints</span>
        <span><i className="legend-dot investigate" />Needs investigation</span>
        <span><i className="legend-dot excluded" />Excluded</span>
      </div>
    </div>
  );
}
