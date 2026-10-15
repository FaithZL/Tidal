import { createDemoConfig } from './demoConfig.js';
const timing = createDemoConfig();
/** Experimental fixed-view defaults; NOT validated exercise/medical thresholds. */
const defaults = {
  minConfidence: .6, framingMargin: .02, minTorsoHeightFraction: .06,
  smoothingTauMs: 60, maxPoseGapMs: timing.maxPoseGapMs, trackingMaxAgeMs: timing.trackingMaxAgeMs,
  futureToleranceMs: 50, centerJumpTorso: .75, maxScaleRatio: 1.5,
  standingDurationMs: 2000, exampleDurationMs: 600, carryDurationMs: 2000,
  minStandingSamples: 12, stableCenterTorso: .15, stableScaleRatio: 1.12,
  stableKneeSpreadDeg: 8, stableFeatureRadius: .15,
  minChopTravelTorso: .35, minSquatFlexionDeg: 15, standToleranceDeg: 12,
  minPressTravelTorso: .3, returnWristTolerance: .3, minCarrySeparation: .2, carryNoiseMultiplier: 3,
};
export type RecognitionConfig = Readonly<typeof defaults>;
export function createRecognitionConfig(overrides: Partial<RecognitionConfig> = {}): RecognitionConfig {
  const config = { ...defaults, ...overrides };
  for (const [key, value] of Object.entries(config)) {
    if (!Number.isFinite(value) || value <= 0) throw new RangeError(`Invalid recognition parameter: ${key}`);
  }
  if (config.minConfidence > 1 || config.framingMargin >= .5 || config.minTorsoHeightFraction >= 1 ||
      config.maxScaleRatio <= 1 || config.stableScaleRatio <= 1 || !Number.isSafeInteger(config.minStandingSamples) || config.minStandingSamples < 2) {
    throw new RangeError('Invalid recognition range');
  }
  return Object.freeze(config);
}
export const recognitionConfig = createRecognitionConfig();
