import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  REGION_ASSET_PATH,
  REGION_MANIFEST_PATH,
  validateRegionAssetBytes,
} from "../src/map/assets";
import { REGION_IDS } from "../src/map/regions";

const repoUrl = new URL("../", import.meta.url);

describe("pinned Stats NZ region assets", () => {
  it("ships one verified 17-region release", async () => {
    const manifestBytes = await readFile(fileURLToPath(new URL(`public${REGION_MANIFEST_PATH}`, repoUrl)));
    const geometryBytes = await readFile(fileURLToPath(new URL(`public${REGION_ASSET_PATH}`, repoUrl)));
    const verified = await validateRegionAssetBytes(manifestBytes, geometryBytes);

    assert.equal(verified.manifest.schemaVersion, "gridlens.region-asset.v2");
    assert.equal(verified.manifest.featureCount, 17);
    assert.deepEqual(verified.manifest.regionIds, REGION_IDS);
    assert.equal(verified.features.features.length, 17);
    assert.deepEqual(
      verified.features.features.map((feature) => feature.id).sort(),
      [...REGION_IDS],
    );
  });

  it("rejects a geometry checksum mutation", async () => {
    const manifestBytes = await readFile(fileURLToPath(new URL(`public${REGION_MANIFEST_PATH}`, repoUrl)));
    const geometryBytes = await readFile(fileURLToPath(new URL(`public${REGION_ASSET_PATH}`, repoUrl)));
    const changed = Buffer.concat([geometryBytes, Buffer.from(" ")]);
    await assert.rejects(() => validateRegionAssetBytes(manifestBytes, changed), /checksum/i);
  });
});
