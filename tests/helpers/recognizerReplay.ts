import { calibrate } from '../../src/pose/calibration.js';
import { extractFeatures } from '../../src/pose/features.js';
import type { RecognitionProfile, Recognizer, RecognitionEvent } from '../../src/pose/recognizers/types.js';
import { standingFrames, syntheticFrame, type SyntheticPose } from './syntheticPose.js';
export function syntheticProfile(): RecognitionProfile {
  const baseline = calibrate(standingFrames());if (!baseline.ok) throw new Error(baseline.reason);
  const examples: RecognitionProfile['examples'] = {};
  for (const [step, pose] of Object.entries({ 'chop-raised': 'raised', 'chop-down': 'down', 'load-squat': 'squat',
    'load-stand': 'standing', 'load-press': 'press', 'load-return': 'standing', 'carry-hold': 'hold', 'carry-release': 'standing' } as const)) {
    const f = extractFeatures(syntheticFrame(0, pose), baseline.calibration)!;const s = f.sides.right!;
    examples[step as keyof typeof examples] = { wrist: s.wrist, elbowDeg: s.elbowDeg, kneeDeg: s.kneeDeg, hipHeight: f.hipHeight, radius: 0 };
  }
  return { calibration: baseline.calibration, examples };
}
export class PoseReplay {
  time = 0;
  events: RecognitionEvent[] = [];
  constructor(readonly recognizer: Recognizer, readonly dt = 50) {}
  pose(pose: SyntheticPose, duration = 400): this {
    for (let elapsed = 0; elapsed < duration; elapsed += this.dt) {
      this.time += this.dt;this.events.push(...this.recognizer.update(syntheticFrame(this.time, pose), this.time));
    }
    return this;
  }
  get reps() { return this.events.filter(e => e.kind === 'rep-completed'); }
}
