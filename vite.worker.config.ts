import { defineConfig } from 'vite';
// MediaPipe 0.10.32 uses importScripts: bundle a classic Worker for dev and build.
export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'public/worker', emptyOutDir: true,
    lib: { entry: 'src/pose/pose.worker.ts', formats: ['iife'], name: 'TidalPoseWorker', fileName: () => 'pose.js' },
  },
});
