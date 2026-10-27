import type { PoseFrame } from './types.js';
import { recognitionConfig, type RecognitionConfig } from '../config/recognitionConfig.js';
import { landmarkConfidence } from './features.js';
import type { RecognitionFeedback } from './recognitionFeedback.js';
export interface UpperBodyVector { left: { x: number; y: number; elbowDeg: number }; right: { x: number; y: number; elbowDeg: number } }
export interface UpperBodyFeatures extends UpperBodyVector { frameId: number; capturedAtMs: number; width: number; height: number; center: { x: number; y: number }; scalePx: number }
export interface UpperBodyProfile { lowered: UpperBodyVector; raised: UpperBodyVector; hold: UpperBodyVector; reference: { width: number; height: number; center: { x: number; y: number }; scalePx: number } }
type Point = { x: number; y: number };
type Reference = UpperBodyProfile['reference'];
type PreparationStep = 'lowered' | 'raised' | 'hold' | 'complete';
type JointQuality = { index: number; label: string; confidence: number | null; state: 'usable' | 'low-confidence' | 'out-of-frame' | 'missing' | 'invalid' | 'stale' };
type HoldArmDiagnostic = { toLowered: number; toRaised: number; loweredLimit: number; raisedLimit: number };
export interface UpperBodyDiagnostics {
  sampleCount: number; observedMs: number; joints: JointQuality[];
  lastReset: null | { sequence: number; fromStep: PreparationStep; completedSteps: number; reason: string };
  lastSampleRejection: null | { step: string; reason: string; sampleCount: number; observedMs: number; radius: number; limit: number };
  hold: null | { left: HoldArmDiagnostic; right: HoldArmDiagnostic };
}
const jointLabels = ['左肩', '右肩', '左肘', '右肘', '左手腕', '右手腕'];
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const vector = (f: UpperBodyVector) => [f.left.x, f.left.y, f.left.elbowDeg / 180, f.right.x, f.right.y, f.right.elbowDeg / 180];
const vectorDistance = (a: UpperBodyVector, b: UpperBodyVector) => Math.hypot(...vector(a).map((value, i) => value - vector(b)[i]));
function elbow(a: Point, b: Point, c: Point): number | null {
  const ab = distance(a, b), cb = distance(c, b);
  if (ab < 1e-6 || cb < 1e-6) return null;
  return Math.acos(Math.max(-1, Math.min(1, ((a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y)) / (ab * cb)))) * 180 / Math.PI;
}
function referenceIssue(f: UpperBodyFeatures, reference: Reference, config: RecognitionConfig): string | null {
  if (f.width !== reference.width || f.height !== reference.height) return 'resized';
  return distance(f.center, reference.center) / reference.scalePx > config.centerJumpTorso ||
    Math.max(f.scalePx / reference.scalePx, reference.scalePx / f.scalePx) > config.maxScaleRatio ? 'person-moved' : null;
}
function average(samples: readonly UpperBodyFeatures[]): UpperBodyFeatures {
  const mean = (read: (f: UpperBodyFeatures) => number) => samples.reduce((sum, f) => sum + read(f), 0) / samples.length;
  const side = (name: 'left' | 'right') => ({ x: mean(f => f[name].x), y: mean(f => f[name].y), elbowDeg: mean(f => f[name].elbowDeg) });
  return { ...samples.at(-1)!, left: side('left'), right: side('right'),
    center: { x: mean(f => f.center.x), y: mean(f => f.center.y) }, scalePx: mean(f => f.scalePx) };
}
/** Six observed upper-body landmarks only; lower-body defaults are never reconstructed. */
export class UpperBodyStream {
  reason: string | null = null;
  private readonly reference?: Reference;
  private last: { time: number; id: number } | null = null;
  private previousRaw: UpperBodyFeatures | null = null;
  private previousSmooth: UpperBodyFeatures | null = null;
  constructor(private readonly config: RecognitionConfig = recognitionConfig, reference?: Reference) {
    if (reference && (![reference.width, reference.height, reference.scalePx].every(v => Number.isFinite(v) && v > 0) ||
      ![reference.center.x, reference.center.y].every(Number.isFinite))) throw new RangeError('Invalid upper-body reference');
    this.reference = reference ? structuredClone(reference) : undefined;
  }
  read(frame: PoseFrame, nowMs: number): { raw: UpperBodyFeatures; smooth: UpperBodyFeatures } | null {
    const fail = (reason: string) => { this.reason = reason;this.previousRaw = null;this.previousSmooth = null;return null; };
    if (!Number.isFinite(nowMs) || nowMs < 0 || !Number.isFinite(frame.capturedAtMs) || frame.capturedAtMs < 0 ||
      !Number.isSafeInteger(frame.frameId) || frame.frameId < 0) return fail('invalid-data');
    if (nowMs - frame.capturedAtMs > this.config.trackingMaxAgeMs) return fail('stale');
    if (frame.capturedAtMs - nowMs > this.config.futureToleranceMs) return fail('future');
    if (this.last && (frame.capturedAtMs <= this.last.time || frame.frameId <= this.last.id)) return fail('out-of-order');
    const gap = this.last && frame.capturedAtMs - this.last.time > this.config.maxPoseGapMs;
    this.last = { time: frame.capturedAtMs, id: frame.frameId };
    if (gap) return fail('gap');
    if (!frame.valid || ![frame.width, frame.height].every(v => Number.isFinite(v) && v > 0)) return fail('invalid-data');
    const indices = [11, 12, 13, 14, 15, 16], points: Point[] = [];
    for (const i of indices) {
      const p = frame.landmarks[i];
      if (!p || ![p.x, p.y, p.z].every(Number.isFinite)) return fail('missing-points');
      if (landmarkConfidence(p) < this.config.minConfidence) return fail('low-confidence');
      const margin = this.config.framingMargin;
      if (p.x < margin || p.x > 1 - margin || p.y < margin || p.y > 1 - margin) return fail('out-of-frame');
      points.push({ x: p.x * frame.width, y: p.y * frame.height });
    }
    const scalePx = distance(points[0], points[1]);
    if (scalePx < Math.min(frame.width, frame.height) * this.config.minTorsoHeightFraction) return fail('small-shoulders');
    const leftElbow = elbow(points[0], points[2], points[4]), rightElbow = elbow(points[1], points[3], points[5]);
    if (leftElbow === null || rightElbow === null) return fail('degenerate-arm');
    const raw: UpperBodyFeatures = {
      frameId: frame.frameId, capturedAtMs: frame.capturedAtMs, width: frame.width, height: frame.height,
      center: { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }, scalePx,
      left: { x: (points[4].x - points[0].x) / scalePx, y: (points[4].y - points[0].y) / scalePx, elbowDeg: leftElbow },
      right: { x: (points[5].x - points[1].x) / scalePx, y: (points[5].y - points[1].y) / scalePx, elbowDeg: rightElbow },
    };
    const issue = this.reference && referenceIssue(raw, this.reference, this.config) ||
      this.previousRaw && referenceIssue(raw, this.previousRaw, this.config);
    if (issue) return fail(issue);
    const previous = this.previousSmooth, alpha = previous ? 1 - Math.exp(-(raw.capturedAtMs - previous.capturedAtMs) / this.config.smoothingTauMs) : 1;
    const smooth = structuredClone(raw);
    if (previous) for (const side of ['left', 'right'] as const) for (const key of ['x', 'y', 'elbowDeg'] as const) {
      smooth[side][key] = previous[side][key] + alpha * (raw[side][key] - previous[side][key]);
    }
    this.previousRaw = structuredClone(raw);this.previousSmooth = structuredClone(smooth);this.reason = null;
    return { raw, smooth };
  }
  reset(): void { this.last = null;this.previousRaw = null;this.previousSmooth = null;this.reason = null; }
}
/** Automatic preparation uses observed sample intervals, never a wall-clock completion callback. */
export class UpperBodyPreparation {
  private readonly stream: UpperBodyStream;
  private step: PreparationStep = 'lowered';
  private samples: UpperBodyFeatures[] = [];
  private examples: Partial<Record<'lowered' | 'raised' | 'hold', UpperBodyVector>> = {};
  private radii: Partial<Record<'lowered' | 'raised' | 'hold', number>> = {};
  private reference: Reference | null = null;
  private available = false;
  private progress = 0;
  private reason: string | null = null;
  private latest: UpperBodyFeatures | null = null;
  private recoveryDeadline: number | null = null;
  private lastHeader: { time: number; id: number } | null = null;
  private jointQuality: JointQuality[] = jointLabels.map((label, i) => ({ index: 11 + i, label, confidence: null, state: 'missing' }));
  private qualityCapturedAt: number | null = null;
  private resetSequence = 0;
  private lastReset: UpperBodyDiagnostics['lastReset'] = null;
  private lastSampleRejection: UpperBodyDiagnostics['lastSampleRejection'] = null;
  private completedRevalidation = false;
  constructor(private readonly config: RecognitionConfig = recognitionConfig, private readonly recoveryWindowMs = 0,
    private readonly retainCompleted = false) {
    if (!Number.isFinite(recoveryWindowMs) || recoveryWindowMs < 0 || recoveryWindowMs > 3000) throw new RangeError('Invalid preparation recovery window');
    this.stream = new UpperBodyStream(config);
  }
  accept(frame: PoseFrame, nowMs: number): void {
    this.observeQuality(frame);
    if (this.recoveryWindowMs > 0 || this.retainCompleted) {
      if (this.expireRecovery(nowMs)) return;
      const hardIssue = this.recoveryHeaderIssue(frame, nowMs);
      if (hardIssue) {
        if (hardIssue === 'person-moved' && this.retainsCompleted()) {
          // The frame header is valid even though its anchor is not; do not permit a replay on return.
          this.lastHeader = { time: frame.capturedAtMs, id: frame.frameId };
          this.suspendTracking(hardIssue);
        } else this.invalidate(hardIssue);
        return;
      }
      this.lastHeader = { time: frame.capturedAtMs, id: frame.frameId };
    }
    const observed = this.stream.read(frame, nowMs);
    if (!observed) {
      // The worker's valid=false also means no person was detected; it is not a malformed header.
      this.rejectObservation(this.retainsCompleted() && !frame.valid ? 'missing-points' : this.stream.reason, nowMs);return;
    }
    const f = observed.raw;
    if (this.reference) {
      const issue = referenceIssue(f, this.reference, this.config);
      if (issue) { this.rejectObservation(issue, nowMs);return; }
    }
    this.recoveryDeadline = null;this.latest = f;
    if (this.step === 'complete' && this.completedRevalidation) { this.acceptCompletedRevalidation(f);return; }
    this.available = true;
    if (this.step === 'complete') return;
    const issue = this.poseIssue(f);
    if (issue) { this.samples = [];this.progress = 0;this.reason = issue;return; }
    this.samples.push(f);
    const mean = average(this.samples), radius = Math.max(...this.samples.map(sample => vectorDistance(sample, mean)));
    const scales = this.samples.map(sample => sample.scalePx);
    if (radius > this.config.stableFeatureRadius || Math.max(...scales) / Math.min(...scales) > this.config.stableScaleRatio ||
      this.samples.some(sample => distance(sample.center, this.samples[0].center) / mean.scalePx > this.config.stableCenterTorso)) {
      this.recordSampleRejection('unstable', radius, this.config.stableFeatureRadius);
      this.samples = [f];this.progress = 0;this.reason = 'unstable';return;
    }
    this.reason = null;
    const duration = f.capturedAtMs - this.samples[0].capturedAtMs, minSamples = Math.max(12, this.config.minStandingSamples);
    this.progress = Math.min(1, duration / 1200, this.samples.length / minSamples);
    if (duration < 1200 || this.samples.length < minSamples) return;
    if (this.step === 'hold' && this.holdIssue(mean, radius)) {
      const diagnostics = this.describeHold(mean, radius)!;
      const comparisons = [
        [diagnostics.left.toLowered, diagnostics.left.loweredLimit], [diagnostics.right.toLowered, diagnostics.right.loweredLimit],
        [diagnostics.left.toRaised, diagnostics.left.raisedLimit], [diagnostics.right.toRaised, diagnostics.right.raisedLimit],
      ];
      this.recordSampleRejection('hold-not-separable', radius, comparisons.find(([separation, limit]) => separation <= limit)![1]);
      this.samples = [];this.progress = 0;this.reason = 'hold-not-separable';return;
    }
    this.examples[this.step] = { left: { ...mean.left }, right: { ...mean.right } };this.radii[this.step] = radius;
    this.lastSampleRejection = null;
    if (this.step === 'lowered') this.reference = { width: mean.width, height: mean.height, center: { ...mean.center }, scalePx: mean.scalePx };
    this.step = this.step === 'lowered' ? 'raised' : this.step === 'raised' ? 'hold' : 'complete';
    this.samples = [];this.progress = this.step === 'complete' ? 1 : 0;
  }
  private poseIssue(f: UpperBodyVector): string | null {
    if (this.step === 'lowered') return f.left.y >= .25 && f.right.y >= .25 ? null : 'not-lowered';
    if (this.step === 'raised') {
      const lowered = this.examples.lowered!;
      return (['left', 'right'] as const).every(side => f[side].y <= 0 && lowered[side].y - f[side].y >= this.config.minPressTravelTorso) ? null : 'insufficient-raise-range';
    }
    return this.holdIssue(f, 0);
  }
  private holdIssue(f: UpperBodyVector, radius: number): string | null {
    return (['lowered', 'raised'] as const).some(step => (['left', 'right'] as const).some(side => {
      const target = this.examples[step]![side], current = f[side];
      const separation = Math.hypot(current.x - target.x, current.y - target.y, (current.elbowDeg - target.elbowDeg) / 180) / Math.sqrt(3);
      return separation <= Math.max(this.config.minPoseSeparation, this.config.minCarrySeparation / Math.sqrt(3),
        this.config.carryNoiseMultiplier * (radius + this.radii[step]!) / Math.sqrt(3));
    })) ? 'hold-not-separable' : null;
  }
  /** Recovery cannot hide hard header or reference faults behind a stale/gap classification. */
  private recoveryHeaderIssue(frame: PoseFrame, nowMs: number): string | null {
    if (!Number.isFinite(nowMs) || nowMs < 0 || !Number.isFinite(frame.capturedAtMs) || frame.capturedAtMs < 0 ||
      !Number.isSafeInteger(frame.frameId) || frame.frameId < 0 || !frame.valid && !this.retainsCompleted() ||
      ![frame.width, frame.height].every(value => Number.isFinite(value) && value > 0)) return 'invalid-data';
    if (frame.capturedAtMs - nowMs > this.config.futureToleranceMs) return 'future';
    if (this.lastHeader && (frame.capturedAtMs <= this.lastHeader.time || frame.frameId <= this.lastHeader.id)) return 'out-of-order';
    if (!this.reference) return null;
    if (frame.width !== this.reference.width || frame.height !== this.reference.height) return 'resized';
    const left = frame.landmarks[11], right = frame.landmarks[12];
    if (left && right && [left.x, left.y, right.x, right.y].every(Number.isFinite) &&
      landmarkConfidence(left) >= this.config.minConfidence && landmarkConfidence(right) >= this.config.minConfidence) {
      const a = { x: left.x * frame.width, y: left.y * frame.height }, b = { x: right.x * frame.width, y: right.y * frame.height };
      const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, scale = distance(a, b);
      if (distance(center, this.reference.center) / this.reference.scalePx > this.config.centerJumpTorso ||
        Math.max(scale / this.reference.scalePx, this.reference.scalePx / scale) > this.config.maxScaleRatio) return 'person-moved';
    }
    return null;
  }
  private rejectObservation(reason: string | null, nowMs: number): void {
    const recoverable = ['low-confidence', 'out-of-frame', 'missing-points', 'degenerate-arm', 'gap', 'stale'];
    if (this.retainsCompleted() && reason && (recoverable.includes(reason) || reason === 'person-moved')) {
      this.beginCompletedRevalidation(reason);return;
    }
    if (this.recoveryWindowMs <= 0 || !this.reference || this.step !== 'raised' && this.step !== 'hold' ||
      !reason || !recoverable.includes(reason)) { this.invalidate(reason);return; }
    const deadline = this.recoveryDeadline ?? (this.latest ? this.latest.capturedAtMs + this.recoveryWindowMs : null);
    if (deadline === null || nowMs > deadline) { this.invalidate('recovery-timeout');return; }
    this.recoveryDeadline = deadline;this.samples = [];this.progress = 0;this.available = false;this.latest = null;this.reason = reason;
  }
  private retainsCompleted(): boolean { return this.retainCompleted && this.step === 'complete' && this.reference !== null; }
  private beginCompletedRevalidation(reason: string): void {
    this.completedRevalidation = true;this.samples = [];this.progress = 0;this.available = false;
    this.latest = null;this.reason = reason;this.recoveryDeadline = null;
  }
  /** A saved template is restored only after a wholly new stable observation window; targets never drift. */
  private acceptCompletedRevalidation(f: UpperBodyFeatures): void {
    this.available = false;this.samples.push(f);
    const mean = average(this.samples), radius = Math.max(...this.samples.map(sample => vectorDistance(sample, mean)));
    const scales = this.samples.map(sample => sample.scalePx);
    if (radius > this.config.stableFeatureRadius || Math.max(...scales) / Math.min(...scales) > this.config.stableScaleRatio ||
      this.samples.some(sample => distance(sample.center, this.samples[0].center) / mean.scalePx > this.config.stableCenterTorso)) {
      this.recordSampleRejection('unstable', radius, this.config.stableFeatureRadius);
      this.samples = [f];this.progress = 0;this.reason = 'unstable';return;
    }
    const duration = f.capturedAtMs - this.samples[0].capturedAtMs, minSamples = Math.max(12, this.config.minStandingSamples);
    this.progress = Math.min(1, duration / 1200, this.samples.length / minSamples);this.reason = 'revalidating';
    if (duration < 1200 || this.samples.length < minSamples) return;
    this.completedRevalidation = false;this.available = true;this.progress = 1;this.reason = null;
    this.samples = [];this.lastSampleRejection = null;
  }
  private expireRecovery(nowMs: number): boolean {
    if (this.recoveryDeadline === null || !Number.isFinite(nowMs) || nowMs <= this.recoveryDeadline) return false;
    this.invalidate('recovery-timeout');return true;
  }
  tick(nowMs: number): void {
    if (this.qualityCapturedAt !== null && Number.isFinite(nowMs) && nowMs - this.qualityCapturedAt > this.config.trackingMaxAgeMs) {
      this.jointQuality = this.jointQuality.map(joint => ({ ...joint, state: 'stale' }));
    }
    if (!Number.isFinite(nowMs) || nowMs < 0) { this.invalidate('invalid-data');this.stream.reset(); }
    else if (this.expireRecovery(nowMs)) this.stream.reset();
    else if (this.latest && nowMs - this.latest.capturedAtMs > this.config.trackingMaxAgeMs) {
      this.rejectObservation('stale', nowMs);if (this.recoveryDeadline === null) this.stream.reset();
    }
  }
  private invalidate(reason: string | null, diagnosticReason = reason ?? 'unknown'): void {
    if (this.step !== 'lowered') this.lastReset = { sequence: ++this.resetSequence, fromStep: this.step,
      completedSteps: this.step === 'raised' ? 1 : this.step === 'hold' ? 2 : 3, reason: diagnosticReason };
    this.step = 'lowered';this.samples = [];this.examples = {};this.radii = {};this.reference = null;
    this.available = false;this.progress = 0;this.reason = reason;this.latest = null;this.recoveryDeadline = null;this.completedRevalidation = false;
  }
  reset(reason = 'manual-reset'): void { this.invalidate(null, reason);this.stream.reset();this.lastHeader = null; }
  /** Visibility or tracking suspension invalidates live readiness without erasing an opted-in completed template. */
  suspendTracking(reason: string): void {
    if (!this.retainsCompleted()) { this.reset(reason);return; }
    this.beginCompletedRevalidation(reason);this.stream.reset();
  }
  getSavedProfile(): UpperBodyProfile | null {
    return this.step === 'complete' && this.reference ? structuredClone({ lowered: this.examples.lowered!, raised: this.examples.raised!, hold: this.examples.hold!, reference: this.reference }) : null;
  }
  getProfile(): UpperBodyProfile | null { return this.available && !this.completedRevalidation ? this.getSavedProfile() : null; }
  /** Pose guidance only: reading feedback never collects samples or completes a step. */
  getFeedback(): RecognitionFeedback | null {
    if (!this.available || !this.latest) return null;
    if (this.step === 'complete') return { status: 'moving', message: '上半身准备完成', joints: {} };
    const joints: Partial<Record<number, 'matched' | 'adjust'>> = {};
    let matched = true;
    for (const side of ['left', 'right'] as const) {
      const current = this.latest[side];
      let acceptable: boolean;
      if (this.step === 'lowered') acceptable = current.y >= .25;
      else if (this.step === 'raised') acceptable = current.y <= 0 && this.examples.lowered![side].y - current.y >= this.config.minPressTravelTorso;
      else acceptable = (['lowered', 'raised'] as const).every(step => {
        const target = this.examples[step]![side];
        const separation = Math.hypot(current.x - target.x, current.y - target.y, (current.elbowDeg - target.elbowDeg) / 180) / Math.sqrt(3);
        return separation > Math.max(this.config.minPoseSeparation, this.config.minCarrySeparation / Math.sqrt(3),
          this.config.carryNoiseMultiplier * this.radii[step]! / Math.sqrt(3));
      });
      for (const index of side === 'left' ? [11, 13, 15] : [12, 14, 16]) joints[index] = acceptable ? 'matched' : 'adjust';
      matched &&= acceptable;
    }
    const target = this.step === 'lowered' ? '双手放下' : this.step === 'raised' ? '双手举起' : '双臂前举';
    return { status: matched ? 'matched' : 'adjust', message: matched ? `${target}匹配，保持片刻` : `请调整到${target}姿态`, joints };
  }
  /** In-memory scalar summaries only; no coordinates, image data or additional pose history. */
  getDiagnostics(): UpperBodyDiagnostics {
    return structuredClone({ sampleCount: this.samples.length, observedMs: this.observedSampleMs(), joints: this.jointQuality,
      lastReset: this.lastReset, lastSampleRejection: this.lastSampleRejection, hold: this.latest ? this.describeHold(this.latest, 0) : null });
  }
  private observedSampleMs(): number {
    return this.samples.length > 1 ? this.samples.at(-1)!.capturedAtMs - this.samples[0].capturedAtMs : 0;
  }
  private recordSampleRejection(reason: string, radius: number, limit: number): void {
    this.lastSampleRejection = { step: this.step, reason, sampleCount: this.samples.length, observedMs: this.observedSampleMs(), radius, limit };
  }
  private observeQuality(frame: PoseFrame): void {
    this.qualityCapturedAt = Number.isFinite(frame.capturedAtMs) && frame.capturedAtMs >= 0 ? frame.capturedAtMs : null;
    this.jointQuality = jointLabels.map((label, i): JointQuality => {
      const index = 11 + i, point = frame.landmarks[index];
      if (!point) return { index, label, confidence: null, state: 'missing' };
      const values = [point.visibility ?? 0, point.presence ?? 1];
      const validConfidence = values.every(value => Number.isFinite(value) && value >= 0 && value <= 1);
      const confidence = validConfidence ? Math.min(...values) : null, margin = this.config.framingMargin;
      const state = !validConfidence || ![point.x, point.y, point.z].every(Number.isFinite) ? 'invalid'
        : confidence! < this.config.minConfidence ? 'low-confidence'
          : point.x < margin || point.x > 1 - margin || point.y < margin || point.y > 1 - margin ? 'out-of-frame' : 'usable';
      return { index, label, confidence, state };
    });
  }
  private describeHold(f: UpperBodyVector, radius: number): UpperBodyDiagnostics['hold'] {
    if (!this.examples.lowered || !this.examples.raised) return null;
    const arm = (side: 'left' | 'right'): HoldArmDiagnostic => {
      const measure = (step: 'lowered' | 'raised') => {
        const target = this.examples[step]![side], current = f[side];
        return { separation: Math.hypot(current.x - target.x, current.y - target.y, (current.elbowDeg - target.elbowDeg) / 180) / Math.sqrt(3),
          limit: Math.max(this.config.minPoseSeparation, this.config.minCarrySeparation / Math.sqrt(3),
            this.config.carryNoiseMultiplier * (radius + this.radii[step]!) / Math.sqrt(3)) };
      };
      const lowered = measure('lowered'), raised = measure('raised');
      return { toLowered: lowered.separation, toRaised: raised.separation, loweredLimit: lowered.limit, raisedLimit: raised.limit };
    };
    return { left: arm('left'), right: arm('right') };
  }
  getSnapshot(): { step: PreparationStep; progress: number; available: boolean; reason: string | null; recovering: boolean; revalidating: boolean; ready: boolean; completedSteps: 0 | 1 | 2 | 3 } {
    return { step: this.step, progress: this.progress, available: this.available, reason: this.reason,
      recovering: this.recoveryDeadline !== null, revalidating: this.completedRevalidation,
      ready: this.step === 'complete' && this.available && !this.completedRevalidation,
      completedSteps: this.step === 'lowered' ? 0 : this.step === 'raised' ? 1 : this.step === 'hold' ? 2 : 3 };
  }
}
