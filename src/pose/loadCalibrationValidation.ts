import type { RecognitionConfig } from '../config/recognitionConfig.js';
interface LowerBodyExample { kneeDeg: number; hipHeight: number }
/** Shared by preparation and recognition so readiness guarantees the same entry gate. */
export function loadSquatIssue(stand: LowerBodyExample, squat: LowerBodyExample, config: RecognitionConfig): string | null {
  if (stand.kneeDeg - squat.kneeDeg < config.minSquatFlexionDeg) return 'insufficient-squat-range';
  if (stand.hipHeight - squat.hipHeight < config.minSquatHipTravel) return 'insufficient-hip-travel';
  return null;
}
