import type { PoseFrame } from '../../src/pose/types.js';
export interface ReplayFixture { source: 'synthetic'; description: string; frames: readonly PoseFrame[] }
export class ReplayPoseSource {
  private generation = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  constructor(private readonly fixture: ReplayFixture) {
    if (fixture.source !== 'synthetic' || !fixture.description || !fixture.frames.length) throw new Error('Replay needs explicit synthetic provenance');
    fixture.frames.forEach((f, i) => {
      const previous = fixture.frames[i - 1];
      if (!Number.isFinite(f.capturedAtMs) || f.capturedAtMs < 0 || (previous && (f.capturedAtMs <= previous.capturedAtMs || f.frameId <= previous.frameId))) throw new Error('Replay times and frame IDs must increase');
    });
  }
  start(emit: (frame: PoseFrame) => void, nowMs: number): void {
    this.stop();const generation = this.generation, origin = this.fixture.frames[0].capturedAtMs;
    if (!Number.isFinite(nowMs) || nowMs < 0) throw new Error('Invalid replay clock');
    this.timers = this.fixture.frames.map(frame => setTimeout(() => {
      if (generation === this.generation) emit({ ...structuredClone(frame), capturedAtMs: nowMs + frame.capturedAtMs - origin });
    }, frame.capturedAtMs - origin));
  }
  stop(): void { this.generation++;this.timers.forEach(clearTimeout);this.timers = []; }
}
