import type {
  NormalizedScenario,
  ScenarioCalculations,
  ScenarioInput,
} from "./types";

const parseFiniteNumber = (value: number | string, field: string): number => {
  const normalized = typeof value === "string" ? value.trim() : value;
  if (normalized === "") {
    throw new RangeError(`${field} is required.`);
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new RangeError(`${field} must be a finite number.`);
  }
  return parsed;
};

const assertRange = (
  value: number,
  field: string,
  minimum: number,
  maximum: number,
  minimumInclusive = true,
): void => {
  const belowMinimum = minimumInclusive ? value < minimum : value <= minimum;
  if (belowMinimum || value > maximum) {
    const lower = minimumInclusive ? "at least" : "greater than";
    throw new RangeError(`${field} must be ${lower} ${minimum} and at most ${maximum}.`);
  }
};

const round = (value: number, decimalPlaces = 6): number => {
  const scale = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * scale) / scale;
};

export const normalizeScenario = (input: ScenarioInput): NormalizedScenario => {
  const itCapacityMw = parseFiniteNumber(input.itCapacityMw, "itCapacityMw");
  const pue = parseFiniteNumber(input.pue, "pue");
  const utilizationRatio = parseFiniteNumber(
    input.utilizationRatio,
    "utilizationRatio",
  );
  const concurrencyRatio = parseFiniteNumber(
    input.concurrencyRatio,
    "concurrencyRatio",
  );

  assertRange(itCapacityMw, "itCapacityMw", 0, 100_000, false);
  assertRange(pue, "pue", 1, 5);
  assertRange(utilizationRatio, "utilizationRatio", 0, 1);
  assertRange(concurrencyRatio, "concurrencyRatio", 0, 1);

  return Object.freeze({
    name: input.name?.trim() || "Untitled scenario",
    itCapacityMw: round(itCapacityMw),
    pue: round(pue),
    utilizationRatio: round(utilizationRatio),
    concurrencyRatio: round(concurrencyRatio),
  });
};

export const calculateScenario = (
  scenario: NormalizedScenario,
): ScenarioCalculations => {
  const addedPeakMw = round(scenario.itCapacityMw * scenario.pue);
  const concurrentDemandMw = round(addedPeakMw * scenario.concurrencyRatio);

  return Object.freeze({
    addedPeakMw,
    annualEnergyGwh: round(
      (addedPeakMw * scenario.utilizationRatio * 8_760) / 1_000,
    ),
    concurrentDemandMw,
    maximumFlexibleLoadMw: concurrentDemandMw,
    formulaVersion: "gridlens-demo-1.0.0",
  });
};
