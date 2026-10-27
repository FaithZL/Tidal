import { createRecognitionConfig, recognitionConfig, type RecognitionConfig } from './recognitionConfig.js';
export const defaultRecognitionLeniency = 3;
export function isRecognitionLeniency(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}
export function recognitionLeniencyLabel(level: number): string {
  if (!isRecognitionLeniency(level)) throw new RangeError('Invalid recognition leniency');
  return ['严格', '偏严格', '标准', '偏宽松', '宽松'][level - 1];
}
/** Experimental pose tolerances; observation quality, timing and calibration gates stay fixed. */
export function createLeniencyConfig(level: number): RecognitionConfig {
  if (!isRecognitionLeniency(level)) throw new RangeError('Invalid recognition leniency');
  if (level === defaultRecognitionLeniency) return recognitionConfig;
  const offset = level - defaultRecognitionLeniency;
  return createRecognitionConfig({
    repEnterRatio: .7 - offset * .04,
    repReturnRatio: .3 + offset * .04,
    returnWristTolerance: .3 + offset * .03,
    holdEnterRatio: .35 + offset * .04,
    holdExitRatio: .55 + offset * .04,
  });
}
