import type {
  CoolingMethod,
  NormalizedScenario,
  ScenarioCalculations,
  SiteAssessment,
} from "./types";

export type ImpactPlotStatus = "screened" | "indicative" | "concern" | "missing";
export type ImpactPlotRowState = "prepared" | "calculated" | "declared" | "missing";

export interface ImpactPlotRow {
  readonly label: string;
  readonly value?: number;
  readonly maximum: number;
  readonly display: string;
  readonly state: ImpactPlotRowState;
}

export interface ImpactPlotModel {
  readonly id: "power" | "water" | "broadband" | "economic";
  readonly title: string;
  readonly status: ImpactPlotStatus;
  readonly statusLabel: string;
  readonly summary: string;
  readonly rows: readonly ImpactPlotRow[];
  readonly note: string;
  readonly provenance: string;
}

const WATER_FACTORS_L_PER_KWH: Readonly<
  Record<Exclude<CoolingMethod, "unknown">, readonly [number, number]>
> = Object.freeze({
  air: [0.02, 0.1],
  evaporative: [0.7, 1.8],
  water_cooled: [0.1, 0.4],
  hybrid: [0.2, 0.9],
});

const coolingLabel = (method: CoolingMethod): string => ({
  air: "Air cooling",
  evaporative: "Evaporative cooling",
  water_cooled: "Water cooling",
  hybrid: "Hybrid cooling",
  unknown: "Unknown cooling",
})[method];

const rounded = (value: number, places = 1): number => {
  const scale = 10 ** places;
  return Math.round((value + Number.EPSILON) * scale) / scale;
};

const presentRow = (
  label: string,
  value: number,
  maximum: number,
  display: string,
  state: Exclude<ImpactPlotRowState, "missing">,
): ImpactPlotRow => ({ label, value, maximum: Math.max(maximum, 1), display, state });

const missingRow = (label: string, display = "Not supplied"): ImpactPlotRow => ({
  label,
  maximum: 1,
  display,
  state: "missing",
});

export function buildImpactPlots(
  scenario: NormalizedScenario,
  calculations: ScenarioCalculations,
  assessment?: SiteAssessment,
): readonly ImpactPlotModel[] {
  const powerValues = [
    assessment?.candidate.preparedConnectionCapacityMw,
    calculations.addedPeakMw,
    calculations.concurrentDemandMw,
  ].filter((value): value is number => value !== undefined);
  const powerMaximum = Math.max(...powerValues, 1) * 1.08;
  const powerRows: ImpactPlotRow[] = [
    assessment
      ? presentRow(
          "Prepared connection envelope",
          assessment.candidate.preparedConnectionCapacityMw,
          powerMaximum,
          `${assessment.candidate.preparedConnectionCapacityMw.toFixed(1)} MW`,
          "prepared",
        )
      : missingRow("Prepared connection envelope", "Select a region marker"),
    presentRow("Added facility peak", calculations.addedPeakMw, powerMaximum, `${calculations.addedPeakMw.toFixed(1)} MW`, "calculated"),
    presentRow("Concurrent demand", calculations.concurrentDemandMw, powerMaximum, `${calculations.concurrentDemandMw.toFixed(1)} MW`, "calculated"),
  ];
  const powerConcern = assessment && assessment.capacityMarginMw < 0;
  const powerMissing = !assessment || assessment.candidate.evidence.coverage !== "complete";

  const waterFactors = scenario.coolingMethod === "unknown"
    ? undefined
    : WATER_FACTORS_L_PER_KWH[scenario.coolingMethod];
  const waterLowMl = waterFactors ? rounded(calculations.annualEnergyGwh * waterFactors[0]) : undefined;
  const waterHighMl = waterFactors ? rounded(calculations.annualEnergyGwh * waterFactors[1]) : undefined;
  const waterMaximum = Math.max(waterHighMl ?? 1, 1);
  const waterRows: ImpactPlotRow[] = waterFactors && waterLowMl !== undefined && waterHighMl !== undefined
    ? [
        presentRow("Indicative annual low", waterLowMl, waterMaximum, `${waterLowMl.toLocaleString()} ML/yr`, "calculated"),
        presentRow("Indicative annual high", waterHighMl, waterMaximum, `${waterHighMl.toLocaleString()} ML/yr`, "calculated"),
      ]
    : [
        missingRow("Indicative annual low", "Cooling method required"),
        missingRow("Indicative annual high", "Cooling method required"),
      ];

  const jobs = scenario.permanentJobs;
  const investment = scenario.regionalInvestmentNzdM;
  const economicRows: ImpactPlotRow[] = [
    jobs > 0
      ? presentRow("Permanent jobs claim", jobs, jobs, jobs.toLocaleString(), "declared")
      : missingRow("Permanent jobs claim"),
    investment > 0
      ? presentRow("Regional investment claim", investment, investment, `$${investment.toLocaleString()}m NZD`, "declared")
      : missingRow("Regional investment claim"),
  ];

  return Object.freeze([
    {
      id: "power",
      title: "Power",
      status: powerConcern ? "concern" : powerMissing ? "missing" : "screened",
      statusLabel: powerConcern ? "Capacity gap" : powerMissing ? "Site evidence needed" : "Screened",
      summary: assessment
        ? `${assessment.capacityMarginMw.toFixed(1)} MW prepared margin after the declared facility peak.`
        : "Scenario demand is calculated; site connection evidence requires a marker selection.",
      rows: Object.freeze(powerRows),
      note: "Connection envelopes are prepared demo evidence, not live network offers.",
      provenance: "Scenario formula + prepared site envelope",
    },
    {
      id: "water",
      title: "Water",
      status: waterFactors ? "indicative" : "missing",
      statusLabel: waterFactors ? "Indicative range" : "Insufficient input",
      summary: waterFactors
        ? `${coolingLabel(scenario.coolingMethod)} using a prepared factor range.`
        : "A numeric estimate is withheld until a cooling method is selected.",
      rows: Object.freeze(waterRows),
      note: "Regional allocation and peak-day thresholds are not loaded, so this is not a water-availability finding.",
      provenance: "Scenario energy × prepared cooling-factor range",
    },
    {
      id: "broadband",
      title: "Broadband",
      status: "missing",
      statusLabel: "Evidence gap",
      summary: `${scenario.targetNetworkGbps.toLocaleString()} Gbps is the declared target; verified site capacity is not loaded.`,
      rows: Object.freeze([
        presentRow("Declared network target", scenario.targetNetworkGbps, scenario.targetNetworkGbps, `${scenario.targetNetworkGbps.toLocaleString()} Gbps`, "declared"),
        missingRow("Verified available capacity", "Provider evidence required"),
        missingRow("Independent fibre routes", "Route diversity required"),
      ]),
      note: "No licensed broadband-availability dataset is bundled; the app does not infer capacity from map proximity.",
      provenance: "User/preset target; capability evidence missing",
    },
    {
      id: "economic",
      title: "Economic benefit",
      status: jobs > 0 || investment > 0 ? "indicative" : "missing",
      statusLabel: jobs > 0 || investment > 0 ? "Declared claims" : "Evidence gap",
      summary: "Benefits are displayed only when supplied; they are not inferred from electrical demand.",
      rows: Object.freeze(economicRows),
      note: "Independent role, investment-basis and local-procurement evidence is required before judging benefit robustness.",
      provenance: "Scenario claims; no independent validation",
    },
  ] satisfies ImpactPlotModel[]);
}
