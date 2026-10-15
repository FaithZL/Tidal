import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
export const modelUrl = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
export const modelHash = '59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a';
export const hash = data => createHash('sha256').update(data).digest('hex');
export const packageJson = JSON.parse(await readFile('node_modules/@mediapipe/tasks-vision/package.json', 'utf8'));
