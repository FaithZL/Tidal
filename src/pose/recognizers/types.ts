import type { ExerciseSignal, SignalMeta } from '../../domain/types.js';
import type { PoseFrame } from '../types.js';
import type { Calibration } from '../calibration.js';
import type { CalibrationSnapshot } from '../calibrationSession.js';
import type { RecognitionFeedback } from '../recognitionFeedback.js';
type Strip<T> = T extends unknown ? Omit<T, keyof SignalMeta> : never;
export type RecognitionEvent = Strip<ExerciseSignal>;
export interface RecognitionProfile { calibration: Calibration; examples: CalibrationSnapshot['examples'] }
export interface Recognizer {
  update(frame: PoseFrame, nowMs?: number): readonly RecognitionEvent[];
  reset(): void;
  getDebug(): { phase: string; reason: string | null };
  getFeedback(): RecognitionFeedback | null;
}
