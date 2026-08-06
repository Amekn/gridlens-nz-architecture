import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  REGION_IDS,
  REGION_BY_ID,
  isRegionId,
  regionIdFromName,
  regionIdFromSourceCode,
} from "../src/map/regions";
import {
  pointInRegionFeature,
  resolveRegionAtPoint,
} from "../src/map/geometry";
import {
  candidateMarkersFromSites,
  markerHitTargetDiameter,
  presentationGroupForOutcome,
} from "../src/map/markers";
import {
  applySelectionIntent,
  type MapSelectionState,
} from "../src/map/selection";
import type {
  RegionFeature,
  RegionFeatureCollection,
} from "../src/map/contracts";

const square = (
  regionId: "01" | "02",
  name: string,
  west: number,
  east: number,
): RegionFeature => ({
  type: "Feature",
  id: regionId,
  properties: {
    regionId,
    name,
    labelPoint: { longitude: (west + east) / 2, latitude: 0.5 },
    sourceField: "REGC_code",
    sourceNameField: "REGC_name",
  },
  geometry: {
    type: "Polygon",
    coordinates: [[[west, 0], [east, 0], [east, 1], [west, 1], [west, 0]]],
  },
});

const adjacentRegions: RegionFeatureCollection = {
  type: "FeatureCollection",
  features: [
    square("02", "Auckland Region", 1, 2),
    square("01", "Northland Region", 0, 1),
  ],
};

describe("canonical New Zealand region identity", () => {
  it("defines the exact 17 two-character RegionIds", () => {
    assert.deepEqual(REGION_IDS, [
      "01", "02", "03", "04", "05", "06", "07", "08", "09",
      "12", "13", "14", "15", "16", "17", "18", "99",
    ]);
    assert.equal(new Set(REGION_IDS).size, 17);
    assert.equal(Object.keys(REGION_BY_ID).length, 17);
    assert.equal(isRegionId("01"), true);
    assert.equal(isRegionId("1"), false);
  });

  it("normalizes only the pinned Stats NZ source codes", () => {
    assert.equal(regionIdFromSourceCode("1"), "01");
    assert.equal(regionIdFromSourceCode("9"), "09");
    assert.equal(regionIdFromSourceCode("12"), "12");
    assert.equal(regionIdFromSourceCode("99"), "99");
    assert.equal(regionIdFromSourceCode("01"), undefined);
    assert.equal(regionIdFromSourceCode("10"), undefined);
    assert.equal(regionIdFromSourceCode(1), undefined);
  });

  it("maps exact source and demo display names without fuzzy fallback", () => {
    assert.equal(regionIdFromName("Northland Region"), "01");
    assert.equal(regionIdFromName("Northland"), "01");
    assert.equal(regionIdFromName("Manawatū-Whanganui"), "08");
    assert.equal(regionIdFromName("Area Outside Region"), "99");
    assert.equal(regionIdFromName("northland"), undefined);
    assert.equal(regionIdFromName("Unknown Region"), undefined);
  });
});

describe("canonical polygon selection", () => {
  it("covers polygon interiors and boundaries", () => {
    assert.equal(
      pointInRegionFeature({ longitude: 0.5, latitude: 0.5 }, adjacentRegions.features[1]),
      true,
    );
    assert.equal(
      pointInRegionFeature({ longitude: 1, latitude: 0.5 }, adjacentRegions.features[1]),
      true,
    );
  });

  it("uses lexical RegionId order on a shared edge independent of feature order", () => {
    const point = { longitude: 1, latitude: 0.5 };
    assert.equal(resolveRegionAtPoint(point, adjacentRegions), "01");
    assert.equal(
      resolveRegionAtPoint(point, {
        ...adjacentRegions,
        features: [...adjacentRegions.features].reverse(),
      }),
      "01",
    );
    assert.equal(
      resolveRegionAtPoint({ longitude: 5, latitude: 5 }, adjacentRegions),
      undefined,
    );
  });
});

describe("typed marker and selection model", () => {
  const markers = candidateMarkersFromSites([
    {
      id: "demo-northland-whangarei",
      name: "Whangārei demonstration zone",
      region: "Northland",
      latitude: -35.7251,
      longitude: 174.3237,
      presentationGroup: "needs investigation",
      domainOutcome: "specialist_assessment_required",
    },
  ]);

  it("creates a strict screened-candidate marker and a 24px target", () => {
    assert.equal(markers.length, 1);
    assert.equal(markers[0].kind, "screened_candidate");
    assert.equal(markers[0].markerId, "candidate:northland-whangarei");
    assert.equal(markers[0].candidateId, "candidate:northland-whangarei");
    assert.equal(markers[0].regionId, "01");
    assert.equal(markers[0].sourceRecordId, "evidence:prepared-demo-sites-2026-08-01");
    assert.equal(markerHitTargetDiameter, 24);
    assert.equal(
      presentationGroupForOutcome("infrastructure_upgrade_required"),
      "needs_investigation",
    );
  });

  it("rejects an outcome/group mismatch", () => {
    assert.throws(() => candidateMarkersFromSites([
      {
        id: "demo-waikato-ruakura",
        name: "Ruakura demonstration zone",
        region: "Waikato",
        latitude: -37.7782,
        longitude: 175.3206,
        presentationGroup: "passes declared constraints",
        domainOutcome: "excluded",
      },
    ]));
  });

  it("derives marker region and clears marker on list selection", () => {
    const initial: MapSelectionState = { generation: 0 };
    const markerResult = applySelectionIntent(initial, {
      kind: "marker",
      generation: 1,
      markerId: markers[0].markerId,
      source: "marker_pointer",
    }, adjacentRegions, markers);
    assert.equal(markerResult.outcome, "accepted");
    assert.deepEqual(markerResult.state, {
      generation: 1,
      regionId: "01",
      selectedMarkerId: markers[0].markerId,
    });

    const listResult = applySelectionIntent(markerResult.state, {
      kind: "region",
      generation: 2,
      regionId: "02",
      source: "accessible_list",
    }, adjacentRegions, markers);
    assert.equal(listResult.outcome, "accepted");
    assert.deepEqual(listResult.state, { generation: 2, regionId: "02" });

    const staleResult = applySelectionIntent(listResult.state, {
      kind: "region",
      generation: 1,
      regionId: "01",
      source: "restore",
    }, adjacentRegions, markers);
    assert.equal(staleResult.outcome, "stale_ignored");
    assert.equal(staleResult.state, listResult.state);
  });
});
