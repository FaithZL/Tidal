import type { PoseFrame } from '../types.js';
import type { PoseFeatures } from '../features.js';
import type { CalibrationStep, CalibrationExample } from '../calibrationSession.js';
import type { RecognitionProfile, RecognitionEvent, Recognizer } from './types.js';
import { FeatureStream } from './featureStream.js';
import { recognitionConfig, type RecognitionConfig } from '../../config/recognitionConfig.js';
export abstract class RepRecognizer implements Recognizer {
  protected readonly profile: RecognitionProfile;
  private readonly stream: FeatureStream;
  protected phase = 'unready';
  protected repId = 0;
  protected cycleStart: number | null = null;
  protected reason: string | null = null;
  private readonly candidates = new Map<string,number>();
  protected events: RecognitionEvent[] = [];
  constructor(profile: RecognitionProfile, protected readonly config: RecognitionConfig = recognitionConfig) {
    this.profile = structuredClone(profile);this.stream = new FeatureStream(this.profile.calibration, config);
  }
  protected example(step: CalibrationStep): CalibrationExample {
    const e = this.profile.examples[step];
    if (!e || ![e.wrist.x,e.wrist.y,e.elbowDeg,e.kneeDeg,e.hipHeight,e.radius].every(Number.isFinite)) throw new Error(`Missing or invalid calibration: ${step}`);
    return e;
  }
  update(frame: PoseFrame, nowMs = frame.capturedAtMs): readonly RecognitionEvent[] {
    this.events = [];const f = this.stream.read(frame, nowMs);
    if (!f) { this.clearCycle();this.reason = this.stream.reason;return [{kind:'tracking',status:'lost',message:this.reason ?? 'invalid-pose'}]; }
    this.reason = null;this.events.push({kind:'tracking',status:'ready'});this.advance(f,frame.capturedAtMs);return this.events;
  }
  protected abstract advance(f: PoseFeatures, time: number): void;
  protected confirm(key: string, condition: boolean, time: number): boolean {
    if (!condition) { this.candidates.delete(key);return false; }
    if (!this.candidates.has(key)) this.candidates.set(key,time);
    if (time - this.candidates.get(key)! < this.config.phaseConfirmMs) return false;
    this.candidates.delete(key);return true;
  }
  protected expired(time: number, max: number): boolean {
    if (this.cycleStart === null || time - this.cycleStart <= max) return false;
    this.clearCycle();this.reason = 'cycle-timeout';return true;
  }
  protected clearCycle(): void { this.phase='unready';this.cycleStart=null;this.candidates.clear(); }
  reset(): void { this.clearCycle();this.stream.reset();this.reason=null; }
  getDebug() { return {phase:this.phase,reason:this.reason}; }
}
