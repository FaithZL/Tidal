import { afterEach, expect, test, vi } from 'vitest';
import { SetupPanel } from '../../src/ui/setupPanel.js';
import type { CalibrationPanel } from '../../src/ui/calibrationPanel.js';
import type { RecognitionFeedback } from '../../src/pose/recognitionFeedback.js';
import type { PoseFrame } from '../../src/pose/types.js';
import { replacePoint, syntheticFrame } from '../helpers/syntheticPose.js';
import { upperFrame } from '../helpers/upperBodyPose.js';

const green = '#77e3a0', red = '#ff6b69', gray = '#9baeb4';
interface Painted { color: string; points: number[] }
function fixture(feedback: RecognitionFeedback | null = null, unavailableMessage?:string) {
  const documentEvents = new EventTarget(), windowEvents = new EventTarget();
  const label = { textContent: '', style: { color: '' } }, preview = { dataset: {} as Record<string, string> };
  vi.stubGlobal('document', Object.assign(documentEvents, { getElementById: (id: string) => id === 'cameraFeedbackStatus' ? label : null }));
  vi.stubGlobal('window', windowEvents);vi.stubGlobal('location', { href: 'http://localhost/' });
  const strokes: Painted[] = [], fills: Painted[] = [];let points: number[] = [];
  const context = {
    strokeStyle: '', fillStyle: '', lineWidth: 0,
    clearRect() { strokes.length = 0;fills.length = 0; }, beginPath() { points = []; },
    moveTo(x: number, y: number) { points.push(x, y); }, lineTo(x: number, y: number) { points.push(x, y); },
    arc(x: number, y: number) { points.push(x, y); },
    stroke() { strokes.push({ color: this.strokeStyle, points: [...points] }); },
    fill() { fills.push({ color: this.fillStyle, points: [...points] }); },
  };
  const overlay = { width: 640, height: 480, parentElement: preview, getContext: () => context };
  const element = () => ({ textContent: '' });
  const video = { srcObject: null, pause() {} };
  const calibrationResets: { close: boolean | undefined; reason: string | undefined }[] = [];
  const suspensions: (string | undefined)[] = [];
  const calibration = { accept() {}, reset(close?: boolean, reason?: string) { calibrationResets.push({ close, reason }); }, tick() {}, activate() {}, dispose() {} };
  const panel = new SetupPanel(video as unknown as HTMLVideoElement, overlay as unknown as HTMLCanvasElement,
    element() as HTMLElement, element() as HTMLElement, element() as HTMLElement,
    { disabled: false } as HTMLButtonElement, calibration as unknown as CalibrationPanel,
    { onFrame() { panel.setFeedback(feedback);if(feedback===null&&unavailableMessage)label.textContent=unavailableMessage; }, onSuspend(reason?: string) { suspensions.push(reason); } });
  const draw = (frame = syntheticFrame(50, 'raised')) => (panel as unknown as { draw(frame: PoseFrame): void }).draw(frame);
  const point = (frame: PoseFrame, index: number) => [frame.landmarks[index].x * frame.width, frame.landmarks[index].y * frame.height];
  return { panel, draw, preview, label, strokes, fills, documentEvents, windowEvents, point, calibrationResets, suspensions };
}
afterEach(() => vi.unstubAllGlobals());

test('invalid preparation frame preserves its specific diagnostic when feedback is already unavailable',()=>{
 const f=fixture(null,'肩、肘或手腕不够清晰');f.panel.setUpperBodyEnabled(true);f.draw(replacePoint(upperFrame(50),16,{visibility:.1}));
 expect(f.preview.dataset.feedback).toBe('unavailable');expect(f.label.textContent).toBe('肩、肘或手腕不够清晰');expect([...f.fills,...f.strokes].every(item=>item.color===gray)).toBe(true);
});

test('feedback paints measured joints and uses both endpoints for each skeleton edge', () => {
  const f = fixture({ status: 'adjust', message: '主手回到上肩位置', joints: { 12: 'matched', 14: 'matched', 16: 'adjust' } });
  expect(typeof f.panel.setFeedback).toBe('function');
  const frame = syntheticFrame(50, 'raised');f.draw(frame);
  expect(f.preview.dataset.feedback).toBe('adjust');expect(f.label.textContent).toContain('主手');expect(f.label.style.color).toBe(red);
  expect(f.strokes.find(s => JSON.stringify(s.points) === JSON.stringify([...f.point(frame, 12), ...f.point(frame, 14)]))?.color).toBe(green);
  expect(f.strokes.find(s => JSON.stringify(s.points) === JSON.stringify([...f.point(frame, 14), ...f.point(frame, 16)]))?.color).toBe(red);
  expect(f.strokes.find(s => JSON.stringify(s.points) === JSON.stringify([...f.point(frame, 11), ...f.point(frame, 12)]))?.color).toBe(gray);
  expect(f.fills.find(s => JSON.stringify(s.points) === JSON.stringify(f.point(frame, 16)))?.color).toBe(red);
  expect(f.fills.find(s => JSON.stringify(s.points) === JSON.stringify(f.point(frame, 12)))?.color).toBe(green);
  expect(f.fills.find(s => JSON.stringify(s.points) === JSON.stringify(f.point(frame, 11)))?.color).toBe(gray);
});

test('neutral feedback and unavailable judgments never paint red or green', () => {
  const f = fixture();f.draw();
  expect(f.preview.dataset.feedback).toBe('unavailable');expect(f.fills.length).toBe(33);
  expect([...f.fills, ...f.strokes].every(item => item.color === gray)).toBe(true);
  f.panel.setFeedback({ status: 'moving', message: '动作过渡中', joints: {} });
  expect(f.preview.dataset.feedback).toBe('moving');expect(f.label.style.color).toBe(gray);
});

test.each(['invalid', 'non-finite'] as const)('%s input cannot retain or introduce colored judgments', kind => {
  const f = fixture({ status: 'matched', message: '上肩位置匹配', joints: { 12: 'matched', 14: 'matched', 16: 'matched' } });
  f.draw();expect(f.fills.some(item => item.color === green)).toBe(true);
  let frame = syntheticFrame(100, 'raised');
  if (kind === 'invalid') frame = { ...frame, valid: false };
  else frame = replacePoint(frame, 16, { x: NaN });
  f.draw(frame);expect(f.preview.dataset.feedback).toBe('unavailable');
  expect([...f.fills, ...f.strokes].every(item => item.color === gray)).toBe(true);
});

test.each(['stop', 'blur', 'visibility'] as const)('%s immediately clears the feedback marker and colored drawing', async kind => {
  const f = fixture({ status: 'adjust', message: '主手回到上肩位置', joints: { 16: 'adjust' } });f.draw();
  expect(f.fills.some(item => item.color === red)).toBe(true);
  if (kind === 'stop') await f.panel.stop();
  else if (kind === 'blur') f.windowEvents.dispatchEvent(new Event('blur'));
  else f.documentEvents.dispatchEvent(new Event('visibilitychange'));
  expect(f.preview.dataset.feedback).toBe('unavailable');expect(f.label.style.color).toBe(gray);
  expect(f.strokes).toEqual([]);expect(f.fills).toEqual([]);
});

test('clock-detected tracking loss clears colors immediately without another frame', () => {
  const f = fixture({ status: 'adjust', message: '主手回到上肩位置', joints: { 16: 'adjust' } });f.draw();
  expect(f.fills.some(item => item.color === red)).toBe(true);
  f.panel.setFeedback(null);
  expect(f.preview.dataset.feedback).toBe('unavailable');expect(f.strokes).toEqual([]);expect(f.fills).toEqual([]);
});

test.each([0, NaN, Infinity])('invalid video width %s clears the old drawing before returning', width => {
  const f = fixture({ status: 'matched', message: '上肩位置匹配', joints: { 12: 'matched', 14: 'matched', 16: 'matched' } });
  f.draw();expect(f.fills.some(item => item.color === green)).toBe(true);
  f.draw({ ...syntheticFrame(100, 'raised'), width });
  expect(f.preview.dataset.feedback).toBe('unavailable');expect(f.strokes).toEqual([]);expect(f.fills).toEqual([]);
});

test('feedback does not bypass the existing visibility threshold for a joint or its edges', () => {
  const f = fixture({ status: 'matched', message: '上肩位置匹配', joints: { 12: 'matched', 14: 'matched', 16: 'matched' } });
  const frame = replacePoint(syntheticFrame(50, 'raised'), 16, { visibility: .59 });f.draw(frame);
  expect(f.fills.some(item => JSON.stringify(item.points) === JSON.stringify(f.point(frame, 16)))).toBe(false);
  expect(f.strokes.some(item => JSON.stringify(item.points) === JSON.stringify([...f.point(frame, 14), ...f.point(frame, 16)]))).toBe(false);
});

test.each(['matched', 'adjust'] as const)('explicit upper mode keeps %s feedback when only shoulders/elbows/wrists are finite', status => {
  const f = fixture({ status, message: '双臂位置匹配', joints: { 11: 'matched', 13: 'matched', 15: 'matched', 12: 'matched', 14: 'matched', 16: status } });
  const setUpper = (f.panel as unknown as { setUpperBodyEnabled?: (enabled: boolean) => void }).setUpperBodyEnabled;
  setUpper?.call(f.panel, true);f.draw(upperFrame(50));
  expect(f.preview.dataset.feedback).toBe(status);expect(f.fills).toHaveLength(6);expect(f.strokes).toHaveLength(5);
  expect(f.fills.some(item => item.color === green)).toBe(true);
  if (status === 'adjust') expect(f.fills.some(item => item.color === red)).toBe(true);
  else expect([...f.fills, ...f.strokes].every(item => item.color === green)).toBe(true);
});

test('non-null six-joint feedback does not opt full-body mode into ignoring invalid legs', () => {
  const f = fixture({ status: 'matched', message: '双臂位置匹配', joints: { 11: 'matched', 13: 'matched', 15: 'matched', 12: 'matched', 14: 'matched', 16: 'matched' } });
  f.draw(upperFrame(50));expect(f.preview.dataset.feedback).toBe('unavailable');
  expect([...f.fills, ...f.strokes].every(item => item.color === gray)).toBe(true);
});

test('upper mode draws only the six measured joints even when the rest of the body has valid coordinates', () => {
  const f = fixture();f.panel.setUpperBodyEnabled(true);f.draw(syntheticFrame(50));
  expect(f.fills).toHaveLength(6);expect(f.strokes).toHaveLength(5);
});

test.each([11, 12, 13, 14, 15, 16])('upper mode never retains colors if required joint %s is low-confidence or non-finite', index => {
  for (const change of [{ visibility: .59 }, { presence: .59 }, { x: NaN }, { z: Infinity }]) {
    const f = fixture({ status: 'matched', message: '双臂位置匹配', joints: { 11: 'matched', 13: 'matched', 15: 'matched', 12: 'matched', 14: 'matched', 16: 'matched' } });
    f.panel.setUpperBodyEnabled(true);f.draw(upperFrame(50));expect(f.fills.some(item => item.color === green)).toBe(true);
    f.draw(replacePoint(upperFrame(100), index, change));
    expect(f.preview.dataset.feedback).toBe('unavailable');expect([...f.fills, ...f.strokes].every(item => item.color === gray)).toBe(true);
  }
});

test('switching drawing modes clears old feedback and restores the full-body observation guard', () => {
  const f = fixture({ status: 'matched', message: '双臂位置匹配', joints: { 11: 'matched', 13: 'matched', 15: 'matched', 12: 'matched', 14: 'matched', 16: 'matched' } });
  f.panel.setUpperBodyEnabled(true);f.draw(upperFrame(50));expect(f.preview.dataset.feedback).toBe('matched');
  f.panel.setUpperBodyEnabled(false);expect(f.preview.dataset.feedback).toBe('unavailable');expect(f.fills).toEqual([]);expect(f.strokes).toEqual([]);
  f.draw(upperFrame(100));expect(f.preview.dataset.feedback).toBe('unavailable');
});

test.each([
  ['window-blur', 'blur', false],
  ['page-hidden', 'visibilitychange', true],
  ['page-visible', 'visibilitychange', false],
] as const)('suspension forwards %s while retaining its calibration reset and feedback clearing', (reason, eventType, hidden) => {
  const f = fixture({ status: 'matched', message: '双臂位置匹配', joints: { 16: 'matched' } });f.draw();
  Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
  (eventType === 'blur' ? f.windowEvents : f.documentEvents).dispatchEvent(new Event(eventType));
  expect(f.calibrationResets).toEqual([{ close: false, reason }]);
  expect(f.preview.dataset.feedback).toBe('unavailable');expect(f.fills).toEqual([]);expect(f.strokes).toEqual([]);
});

test.each([undefined, 'source-dispose'] as const)('stopping forwards %s without dropping the close flag', async reason => {
  const f = fixture();await f.panel.stop(reason);
  expect(f.calibrationResets).toEqual([{ close: true, reason: reason ?? 'camera-stop' }]);
});

test('camera startup labels its initial stop as restart before an explicit fake-device failure', async () => {
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: async () => { throw new DOMException('Synthetic missing device', 'NotFoundError'); } } });
  const f = fixture();await f.panel.start();
  expect(f.calibrationResets).toEqual([{ close: true, reason: 'camera-restart' }, { close: true, reason: 'camera-stop' }]);
});

test.each([
  ['window-blur', 'blur', false],
  ['page-hidden', 'visibilitychange', true],
  ['page-visible', 'visibilitychange', false],
] as const)('suspension event callback receives %s for the same reset', (reason, eventType, hidden) => {
  const f = fixture();Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
  (eventType === 'blur' ? f.windowEvents : f.documentEvents).dispatchEvent(new Event(eventType));
  expect(f.suspensions).toEqual([reason]);
  expect(f.calibrationResets).toEqual([{ close: false, reason }]);
});
