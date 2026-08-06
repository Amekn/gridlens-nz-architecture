import type { RegionId } from "./contracts";

export type RegionIndexEntry = {
  readonly regionId: RegionId;
  readonly sourceCode: string;
  readonly sourceName: string;
  readonly displayName: string;
};

export const REGION_INDEX = Object.freeze([
  { regionId: "01", sourceCode: "1", sourceName: "Northland Region", displayName: "Northland" },
  { regionId: "02", sourceCode: "2", sourceName: "Auckland Region", displayName: "Auckland" },
  { regionId: "03", sourceCode: "3", sourceName: "Waikato Region", displayName: "Waikato" },
  { regionId: "04", sourceCode: "4", sourceName: "Bay of Plenty Region", displayName: "Bay of Plenty" },
  { regionId: "05", sourceCode: "5", sourceName: "Gisborne Region", displayName: "Gisborne" },
  { regionId: "06", sourceCode: "6", sourceName: "Hawke's Bay Region", displayName: "Hawke's Bay" },
  { regionId: "07", sourceCode: "7", sourceName: "Taranaki Region", displayName: "Taranaki" },
  { regionId: "08", sourceCode: "8", sourceName: "Manawatū-Whanganui Region", displayName: "Manawatū-Whanganui" },
  { regionId: "09", sourceCode: "9", sourceName: "Wellington Region", displayName: "Wellington" },
  { regionId: "12", sourceCode: "12", sourceName: "West Coast Region", displayName: "West Coast" },
  { regionId: "13", sourceCode: "13", sourceName: "Canterbury Region", displayName: "Canterbury" },
  { regionId: "14", sourceCode: "14", sourceName: "Otago Region", displayName: "Otago" },
  { regionId: "15", sourceCode: "15", sourceName: "Southland Region", displayName: "Southland" },
  { regionId: "16", sourceCode: "16", sourceName: "Tasman Region", displayName: "Tasman" },
  { regionId: "17", sourceCode: "17", sourceName: "Nelson Region", displayName: "Nelson" },
  { regionId: "18", sourceCode: "18", sourceName: "Marlborough Region", displayName: "Marlborough" },
  { regionId: "99", sourceCode: "99", sourceName: "Area Outside Region", displayName: "Chatham Islands / Area Outside Region" },
] as const satisfies readonly RegionIndexEntry[]);

export const REGION_IDS = Object.freeze(
  REGION_INDEX.map(({ regionId }) => regionId),
) as readonly RegionId[];

export const REGION_BY_ID = Object.freeze(
  Object.fromEntries(REGION_INDEX.map((entry) => [entry.regionId, entry])),
) as Readonly<Record<RegionId, RegionIndexEntry>>;

const REGION_ID_SET = new Set<string>(REGION_IDS);
const SOURCE_CODE_TO_ID = new Map<string, RegionId>(
  REGION_INDEX.map(({ sourceCode, regionId }) => [sourceCode, regionId]),
);
const NAME_TO_ID = new Map<string, RegionId>();
for (const entry of REGION_INDEX) {
  NAME_TO_ID.set(entry.sourceName, entry.regionId);
  NAME_TO_ID.set(entry.displayName, entry.regionId);
}
NAME_TO_ID.set("Area Outside Region", "99");

export const isRegionId = (value: unknown): value is RegionId =>
  typeof value === "string" && REGION_ID_SET.has(value);

export const regionIdFromSourceCode = (value: unknown): RegionId | undefined =>
  typeof value === "string" ? SOURCE_CODE_TO_ID.get(value) : undefined;

export const regionIdForName = (name: string): RegionId | undefined =>
  NAME_TO_ID.get(name.normalize("NFC"));

export const regionIdFromName = regionIdForName;
