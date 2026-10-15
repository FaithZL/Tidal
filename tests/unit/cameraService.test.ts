import { test, expect, vi } from 'vitest';
import { CameraService } from '../../src/pose/cameraService.js';

test('camera requests video only and releases a stream arriving after cancel', async () => {
  let resolve!: (stream: MediaStream) => void;
  const track = { stop: vi.fn() };
  const stream = { getTracks: () => [track] } as unknown as MediaStream;
  const getUserMedia = vi.fn(() => new Promise<MediaStream>(r => { resolve = r; }));
  const video = { srcObject: null, pause: vi.fn(), play: vi.fn(async () => {}) } as unknown as HTMLVideoElement;
  const camera = new CameraService(video, getUserMedia);
  const pending = camera.start(); const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(getUserMedia).toHaveBeenCalledWith({ audio: false, video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } });
  camera.stop(); resolve(stream); await rejected;
  expect(track.stop).toHaveBeenCalledTimes(1); expect(video.srcObject).toBeNull();
});
