import { tutorialLessons } from './exerciseTutorialModel.js';
import type { TutorialFrame, TutorialJoint, TutorialPoint } from './exerciseTutorialModel.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const palette = {
  cream: '#fff9e9',
  forest: '#294d3b',
  sage: '#8eac87',
  trousers: '#50735a',
  skin: '#edc49a',
  hair: '#5e4937',
  gold: '#c88a1e',
  goldLight: '#ffdf83',
  ground: '#d6dfc8',
};
const jointNames: Readonly<Record<TutorialJoint, string>> = {
  head: '头部', neck: '颈部',
  leftShoulder: '左肩', leftElbow: '左肘', leftWrist: '左手腕',
  rightShoulder: '右肩', rightElbow: '右肘', rightWrist: '右手腕',
  leftHip: '左髋', rightHip: '右髋',
  leftKnee: '左膝', leftAnkle: '左脚踝', rightKnee: '右膝', rightAnkle: '右脚踝',
};
const joints = Object.keys(jointNames) as TutorialJoint[];
let figureSequence = 0;

function attributes(element: SVGElement, values: Record<string, string | number>): void {
  for (const [name, value] of Object.entries(values)) element.setAttribute(name, String(value));
}

function plot(point: TutorialPoint): TutorialPoint {
  return { x: 40 + point.x * 280, y: 35 + point.y * 350 };
}

function position(point: TutorialPoint): string { return `${point.x.toFixed(3)} ${point.y.toFixed(3)}`; }

interface Segment {
  border: SVGPathElement;
  fill: SVGPathElement;
}

/** Original SVG teaching illustration. It only consumes presentation frames. */
export class TutorialFigure {
  private readonly root: SVGGElement;
  private readonly title: SVGTitleElement;
  private readonly description: SVGDescElement;
  private readonly torso: SVGPathElement;
  private readonly neckline: SVGPathElement;
  private readonly neck: Segment;
  private readonly limbs: ReadonlyArray<{
    from: TutorialJoint;
    to: TutorialJoint;
    segment: Segment;
  }>;
  private readonly shoes: ReadonlyArray<{ joint: TutorialJoint; shape: SVGPathElement; direction: number }>;
  private readonly hands: ReadonlyArray<{ joint: TutorialJoint; shape: SVGCircleElement }>;
  private readonly headDetails: SVGGElement;
  private readonly jointDots = new Map<TutorialJoint, SVGCircleElement>();
  private readonly jointHalos = new Map<TutorialJoint, SVGCircleElement>();
  private disposed = false;

  constructor(private readonly svg: SVGSVGElement) {
    const id = `tutorial-figure-${++figureSequence}`;
    const make = <K extends keyof SVGElementTagNameMap>(tag: K, values: Record<string, string | number> = {}): SVGElementTagNameMap[K] => {
      const element = svg.ownerDocument.createElementNS(SVG_NS, tag);
      attributes(element, values);
      return element;
    };
    const segment = (parent: SVGGElement, width: number, fill: string): Segment => {
      const border = make('path', { fill: 'none', stroke: palette.forest, 'stroke-width': width + 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      const body = make('path', { fill: 'none', stroke: fill, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      parent.append(border, body);
      return { border, fill: body };
    };

    attributes(svg, { viewBox: '0 0 360 430', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-labelledby': `${id}-title ${id}-description`, focusable: 'false' });
    this.title = make('title', { id: `${id}-title` });
    this.description = make('desc', { id: `${id}-description` });
    this.root = make('g', { 'data-tutorial-illustration': '', 'font-family': 'system-ui, sans-serif' });
    svg.replaceChildren(this.title, this.description, this.root);

    this.root.append(make('rect', { x: 8, y: 8, width: 344, height: 414, rx: 26, fill: palette.cream }));
    const heading = make('text', { x: 26, y: 34, fill: palette.forest, 'font-size': 12, 'font-weight': 650 });
    heading.textContent = '人体动作示意';
    const source = make('text', { x: 334, y: 34, fill: palette.forest, 'font-size': 11, 'text-anchor': 'end' });
    source.textContent = '不计训练成果';
    this.root.append(heading, source);

    this.root.append(make('ellipse', { cx: 180, cy: 374, rx: 97, ry: 8, fill: palette.ground, opacity: .65 }));
    this.root.append(make('path', { d: 'M 49 374 H 311', fill: 'none', stroke: '#8b9d7f', 'stroke-width': 1.5, 'stroke-dasharray': '4 6' }));

    const body = make('g', { 'aria-hidden': 'true' });
    this.root.append(body);
    const legLayer = make('g');
    const upperLayer = make('g');
    const armLayer = make('g');
    body.append(legLayer, upperLayer, armLayer);
    this.limbs = [
      { from: 'leftHip', to: 'leftKnee', segment: segment(legLayer, 24, palette.trousers) },
      { from: 'leftKnee', to: 'leftAnkle', segment: segment(legLayer, 20, palette.trousers) },
      { from: 'rightHip', to: 'rightKnee', segment: segment(legLayer, 24, palette.trousers) },
      { from: 'rightKnee', to: 'rightAnkle', segment: segment(legLayer, 20, palette.trousers) },
      { from: 'leftShoulder', to: 'leftElbow', segment: segment(armLayer, 20, palette.sage) },
      { from: 'leftElbow', to: 'leftWrist', segment: segment(armLayer, 15, palette.skin) },
      { from: 'rightShoulder', to: 'rightElbow', segment: segment(armLayer, 20, palette.sage) },
      { from: 'rightElbow', to: 'rightWrist', segment: segment(armLayer, 15, palette.skin) },
    ];
    this.shoes = [
      { joint: 'leftAnkle', shape: make('path'), direction: -1 },
      { joint: 'rightAnkle', shape: make('path'), direction: 1 },
    ];
    for (const shoe of this.shoes) {
      attributes(shoe.shape, { fill: palette.forest, stroke: palette.forest, 'stroke-width': 2, 'stroke-linejoin': 'round' });
      legLayer.append(shoe.shape);
    }

    this.neck = segment(upperLayer, 14, palette.skin);
    this.torso = make('path', { fill: palette.sage, stroke: palette.forest, 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
    this.neckline = make('path', { fill: 'none', stroke: palette.forest, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: .75 });
    upperLayer.append(this.torso, this.neckline);
    this.hands = [
      { joint: 'leftWrist', shape: make('circle') },
      { joint: 'rightWrist', shape: make('circle') },
    ];
    for (const hand of this.hands) {
      attributes(hand.shape, { r: 9, fill: palette.skin, stroke: palette.forest, 'stroke-width': 1.8 });
      armLayer.append(hand.shape);
    }

    const head = make('circle', { 'data-joint': 'head', fill: palette.skin });
    this.jointDots.set('head', head);
    this.root.append(head);
    this.headDetails = make('g', { 'aria-hidden': 'true' });
    const hair = make('path', { d: 'M -21 -2 C -27 -25 6 -31 21 -13 L 21 -1 L 15 -8 C 6 -6 -1 -12 -7 -13 C -10 -7 -17 -6 -21 -2 Z', fill: palette.hair });
    const leftEye = make('circle', { cx: -7, cy: 2, r: 1.6, fill: palette.forest });
    const rightEye = make('circle', { cx: 7, cy: 2, r: 1.6, fill: palette.forest });
    const smile = make('path', { d: 'M -5 11 Q 0 14 5 11', fill: 'none', stroke: palette.forest, 'stroke-width': 1.5, 'stroke-linecap': 'round' });
    this.headDetails.append(hair, leftEye, rightEye, smile);
    this.root.append(this.headDetails);

    const markers = make('g');
    this.root.append(markers);
    for (const joint of joints) {
      const halo = make('circle', { fill: 'none', stroke: palette.gold, 'stroke-width': 1.5, 'pointer-events': 'none' });
      this.jointHalos.set(joint, halo);
      markers.append(halo);
      if (joint === 'head') continue;
      const dot = make('circle', { 'data-joint': joint });
      const name = make('title');
      name.textContent = jointNames[joint];
      dot.append(name);
      this.jointDots.set(joint, dot);
      markers.append(dot);
    }

    this.root.append(make('circle', { cx: 71, cy: 403, r: 8, fill: 'none', stroke: palette.gold, 'stroke-width': 1.5 }));
    this.root.append(make('circle', { cx: 71, cy: 403, r: 4.5, fill: palette.goldLight, stroke: palette.forest, 'stroke-width': 1.5 }));
    const legend = make('text', { x: 88, y: 407, fill: palette.forest, 'font-size': 12 });
    legend.textContent = '金色双圈：本步关注的关节';
    this.root.append(legend);
  }

  draw(frame: TutorialFrame): void {
    if (this.disposed) return;
    const lesson = tutorialLessons[frame.task];
    const step = lesson.steps[frame.stepIndex];
    this.title.textContent = `${lesson.title}：${step.title}，人体动作示意`;
    this.description.textContent = `原创人体示意，展示本应用的动作阶段，不计训练成果。${step.cue} 金色双圈与较大的关节点表示本步关注：${frame.highlight.map(joint => jointNames[joint]).join('、')}。`;
    attributes(this.svg, { 'data-tutorial-task': frame.task, 'data-tutorial-step': frame.stepIndex });

    const points = new Map<TutorialJoint, TutorialPoint>();
    for (const joint of joints) points.set(joint, plot(frame.points[joint]));
    const point = (joint: TutorialJoint): TutorialPoint => points.get(joint) ?? plot(frame.points[joint]);
    for (const { from, to, segment } of this.limbs) {
      const path = `M ${position(point(from))} L ${position(point(to))}`;
      segment.border.setAttribute('d', path);
      segment.fill.setAttribute('d', path);
    }
    for (const { joint, shape, direction } of this.shoes) {
      const ankle = point(joint);
      shape.setAttribute('d', `M ${ankle.x - 9} ${ankle.y - 3} Q ${ankle.x} ${ankle.y - 7} ${ankle.x + 9} ${ankle.y - 3} L ${ankle.x + 9 + Math.max(0, direction * 9)} ${ankle.y + 8} L ${ankle.x - 9 + Math.min(0, direction * 9)} ${ankle.y + 8} Q ${ankle.x - 12} ${ankle.y + 4} ${ankle.x - 9} ${ankle.y - 3} Z`);
    }
    for (const { joint, shape } of this.hands) attributes(shape, { cx: point(joint).x, cy: point(joint).y });

    const head = point('head'), neck = point('neck');
    const neckPath = `M ${head.x} ${head.y + 15} L ${position(neck)}`;
    this.neck.border.setAttribute('d', neckPath);
    this.neck.fill.setAttribute('d', neckPath);
    const leftShoulder = point('leftShoulder'), rightShoulder = point('rightShoulder');
    const leftHip = point('leftHip'), rightHip = point('rightHip');
    this.torso.setAttribute('d', `M ${position(leftShoulder)} Q ${neck.x} ${neck.y - 2} ${position(rightShoulder)} C ${rightShoulder.x + 8} ${rightShoulder.y + 29} ${rightHip.x + 7} ${rightHip.y - 21} ${rightHip.x + 10} ${rightHip.y + 5} Q ${(leftHip.x + rightHip.x) / 2} ${Math.max(leftHip.y, rightHip.y) + 14} ${leftHip.x - 10} ${leftHip.y + 5} C ${leftHip.x - 7} ${leftHip.y - 21} ${leftShoulder.x - 8} ${leftShoulder.y + 29} ${position(leftShoulder)} Z`);
    this.neckline.setAttribute('d', `M ${neck.x - 11} ${neck.y + 8} Q ${neck.x} ${neck.y + 20} ${neck.x + 11} ${neck.y + 8}`);
    this.headDetails.setAttribute('transform', `translate(${head.x} ${head.y})`);

    const highlighted = new Set(frame.highlight);
    for (const joint of joints) {
      const current = point(joint), active = highlighted.has(joint);
      const dot = this.jointDots.get(joint), halo = this.jointHalos.get(joint);
      if (dot) attributes(dot, {
        cx: current.x, cy: current.y,
        r: joint === 'head' ? active ? 23.5 : 22 : active ? 6.5 : 3.5,
        fill: joint === 'head' ? palette.skin : active ? palette.goldLight : palette.cream,
        stroke: active ? palette.gold : palette.forest,
        'stroke-width': active ? 3 : 1.5,
        'data-highlighted': String(active),
      });
      if (halo) attributes(halo, { cx: current.x, cy: current.y, r: joint === 'head' ? 28.5 : 11, visibility: active ? 'visible' : 'hidden' });
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.root.remove();
    this.title.remove();
    this.description.remove();
    this.jointDots.clear();
    this.jointHalos.clear();
  }
}
