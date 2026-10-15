/** Demo requirements are derived from one config; see docs/DEVELOPMENT_GUIDE.md §2. */
export interface DemoConfig {
  treeCount: number;
  repsPerTree: number;
  initialLogs: number;
  logsPerTree: number;
  startCountdownMs: number;
  restMs: number;
  carryTargetMs: number;
  trackingMaxAgeMs: number;
  maxPoseGapMs: number;
  staminaReward: number;
  coinReward: number;
  chopRepTarget: number;
  loadRepTarget: number;
}
const base = {
  treeCount: 3,
  repsPerTree: 5,
  initialLogs: 12,
  logsPerTree: 1,
  startCountdownMs: 5000,
  restMs: 15000,
  carryTargetMs: 60000,
  trackingMaxAgeMs: 300,
  maxPoseGapMs: 200,
  staminaReward: 100,
  coinReward: 100,
};
type ConfigOverrides = Partial<Omit<DemoConfig, 'chopRepTarget' | 'loadRepTarget'>>;
export function createDemoConfig(overrides: ConfigOverrides = {}): Readonly<DemoConfig> {
  const c = { ...base, ...overrides };
  const positive = ['treeCount', 'repsPerTree', 'logsPerTree', 'startCountdownMs', 'restMs', 'carryTargetMs', 'trackingMaxAgeMs', 'maxPoseGapMs'] as const;
  const nonnegative = ['initialLogs', 'staminaReward', 'coinReward'] as const;
  for (const key of positive) {
    if (!Number.isSafeInteger(c[key]) || c[key] <= 0) throw new RangeError(`Invalid ${key}`);
  }
  for (const key of nonnegative) {
    if (!Number.isSafeInteger(c[key]) || c[key] < 0) throw new RangeError(`Invalid ${key}`);
  }
  return Object.freeze({
    ...c,
    chopRepTarget: c.treeCount * c.repsPerTree,
    loadRepTarget: c.initialLogs + c.treeCount * c.logsPerTree,
  });
}
