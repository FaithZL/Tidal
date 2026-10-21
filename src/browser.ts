import { createDemoConfig } from './config/demoConfig.js';
import { createSessionController, inputContext } from './domain/sessionController.js';
import { KeyboardActionSource } from './input/keyboardActionSource.js';
import { AutoDemoSource } from './input/autoDemoSource.js';
import { CameraActionSource } from './input/cameraActionSource.js';
import { SourceManager } from './input/sourceManager.js';
import { createGame } from './game/createGame.js';
import { SetupPanel } from './ui/setupPanel.js';
import { CalibrationPanel } from './ui/calibrationPanel.js';
import { SyntheticPreview } from './ui/syntheticPreview.js';
import { AudioFeedback } from './ui/audioFeedback.js';
import {GamePreview} from './ui/gamePreview.js';
import type { SessionSnapshot, TaskKind } from './domain/types.js';

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element ${id}`);
  return element as T;
};
const isTestMode = import.meta.env.MODE === 'e2e' && new URLSearchParams(location.search).has('e2e') &&
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
const config = createDemoConfig(isTestMode ? {
  startCountdownMs: 180, restMs: 230, carryTargetMs: 1300,
} : {});
$('testModeBadge').hidden = !isTestMode;
$('planChop').textContent = `挥砍 ${config.repsPerTree} 次 × ${config.treeCount} 棵 · 共 ${config.chopRepTarget} 次`;
$('planLoad').textContent = `深蹲推举 ${config.loadRepTarget} 次 · 装车 ${config.loadRepTarget} 份木材`;
$('planCarry').textContent = `持续持姿 ${Math.ceil(config.carryTargetMs / 1000)} 秒 · 返回农场`;
const controller = createSessionController(config, { nowMs: () => performance.now() });
const input = new KeyboardActionSource(isTestMode ? .085 : 1);
const autoInput = new AutoDemoSource(isTestMode ? .085 : 1);
const cameraInput = new CameraActionSource();
const sourceManager = new SourceManager();
const audio = new AudioFeedback();
const calibrationPanel = new CalibrationPanel($<HTMLDetailsElement>('calibrationPanel'));
const preview = new SyntheticPreview([
  { canvas: $<HTMLCanvasElement>('demoSetupCanvas'), label: $('demoSetupPhase') },
  { canvas: $<HTMLCanvasElement>('demoGameCanvas'), label: $('demoGamePhase') },
]);
const game = createGame($('worldCanvas'), controller, config,message=>{
  displayError=message;renderUnavailable=true;stopHold();controller.command({kind:'pause',reason:'user'});panel(controller.getSnapshot());
});
const cameraPanel = new SetupPanel($<HTMLVideoElement>('cameraVideo'), $<HTMLCanvasElement>('poseOverlay'),
  $('cameraStatus'), $('cameraMetrics'), $('cameraFrames'), $<HTMLButtonElement>('cameraStart'),
  calibrationPanel, {
    onFrame: frame => {
      updateCameraButton();
      if(current.inputMode==='camera'&&running(current)&&!cameraPreparation&&!calibrationPanel.getProfile())requireCameraPreparation('跟踪或标定已失效，请重新准备');
      cameraInput.accept(frame);
    },
    onError: message => requireCameraPreparation(message,'source-error'),
    onSuspend: () => {cameraInput.clearProfile();if(current.inputMode==='camera'&&running(current))requireCameraPreparation('页面失焦或进入后台，请重新标定','visibility');},
    onStop: () => {cameraInput.clearProfile();updateCameraButton();if(current.inputMode==='camera'&&running(current)&&!cameraPreparation)requireCameraPreparation('摄像头已停止，请重新准备','source-error');},
  });
const gamePreview=new GamePreview($('cameraPreview'),$<HTMLVideoElement>('cameraVideo'),$('setupPreviewHost'),$('gamePreviewHost'),message=>requireCameraPreparation(message,'source-error'));
let current = controller.getSnapshot();
let boundInputKey = '';
let heldKeyboard = false;
let heldPointer = false;
let displayError = '';
let renderUnavailable=false;
let movementPhase='准备姿态';
let movementContext='';
let cameraPreparation = false;
let planDismissed = false;
let exitWasUserPaused = false;
let demoEnabled = false;
let demoUsed = false;
let previousFrameMs=0,diagnosticAtMs=0;
const frameIntervals:number[]=[];

const instructions: Record<TaskKind, string> = {
  chop: '空格触发一次“上举 → 下挥 → 复位”，完整循环后记数。',
  load: '空格触发“蹲下 → 站起 → 上举 → 复位”，装上一份木材。',
  carry: '按住空格或“按住拉车”按钮；松开即停止推进。',
};
function active(s: Readonly<SessionSnapshot>): boolean {
  return s.phase === 'active' && s.pauseReasons.length === 0 && s.inputMode === 'keyboard';
}
function stopHold(): void { heldKeyboard = false; heldPointer = false; input.holdEnd(); }
function running(s:Readonly<SessionSnapshot>):boolean{return ['countdown','active','rest'].includes(s.phase);}
function updateCameraButton():void {
  $<HTMLButtonElement>('beginCamera').disabled=renderUnavailable||calibrationPanel.getProfile()===null;
}
function requireCameraPreparation(message:string,reason:'tracking'|'source-error'|'visibility'='tracking'):void{
  displayError=message;cameraInput.clearProfile();
  if(current.inputMode==='camera'&&running(current)){
    cameraPreparation=true;calibrationPanel.reset();
    controller.command({kind:'camera-readiness',ready:false});controller.command({kind:'pause',reason});
  }
  updateCameraButton();
}
async function syncSource(s: Readonly<SessionSnapshot>): Promise<void> {
  const context = s.phase==='active'&&!s.pauseReasons.length ? inputContext(s) : null;
  const key = context ? `${context.sessionId}:${context.taskRunId}:${context.sourceEpoch}:${s.inputMode}:${demoEnabled}` : '';
  if (key === boundInputKey) return;
  boundInputKey = key;
  if(context&&demoEnabled)demoUsed=true;
  try {
    await sourceManager.switchTo(context ? s.inputMode==='camera'?cameraInput:demoEnabled?autoInput:input : null,context,e=>{
      controller.accept(e);
      if(e.kind==='tracking'&&e.status!=='ready'&&s.inputMode==='camera')requireCameraPreparation(e.message??'跟踪丢失，请重新准备');
    });
  }catch(error){
    requireCameraPreparation(error instanceof Error?error.message:String(error),'source-error');
  }
}
function switchKeyboard():void{
  stopHold();if(running(current))controller.command({kind:'pause',reason:'user'});
  cameraPreparation=false;displayError='';controller.command({kind:'switch-source',mode:'keyboard'});
  controller.command({kind:'resume',reason:'tracking'});controller.command({kind:'resume',reason:'source-error'});
  void cameraPanel.stop();
}
function setDemo(enabled: boolean): void {
  if (demoEnabled === enabled) return;
  stopHold();
  // Cancel a partial cycle before changing source, then invalidate its context.
  if (['countdown', 'active', 'rest'].includes(current.phase)) controller.command({ kind: 'pause', reason: 'user' });
  demoEnabled = enabled;preview.setEnabled(enabled);
  if(enabled||current.inputMode==='camera')switchKeyboard();
  else controller.command({ kind: 'switch-source', mode: 'keyboard' });
}
function niceTask(task: TaskKind | null): string {
  return task === 'chop' ? '砍伐杉树' : task === 'load' ? '把木材装上手推车' : task === 'carry' ? '推车返回农场' : '农场计划';
}
function panel(s: Readonly<SessionSnapshot>): void {
  current = s;
  $('audioToggle').textContent=audio.error||(audio.enabled?'音效：开 · 点击静音':'开启音效');
  $('audioToggle').setAttribute('aria-pressed',String(audio.enabled));
  void syncSource(s);
  const phase = s.phase;
  const showCamera=s.inputMode==='camera'&&running(s)&&!cameraPreparation;
  $('livePreview').hidden=!(showCamera||demoEnabled&&running(s));
  $('gamePreviewHost').hidden=!showCamera;
  gamePreview.setInGame(showCamera);
  const key=`${s.sessionId}/${s.taskRunId}/${s.sourceEpoch}`;
  const carryState=cameraInput.getDebug().phase;
  $('liveSource').textContent=showCamera?'本机摄像头 · 姿态代理':'合成骨架 · 自动模拟';
  $('liveMovementState').textContent=s.pauseReasons.length?'已暂停 · 运动不计时':phase==='rest'?(s.task==='load'?'休息 · 推车与归拢':'休息 · 固定货物'):phase==='countdown'?'准备开始':s.task==='carry'?(showCamera?(carryState==='holding'?'有效持姿 · 持续前进':carryState==='confirming'?'正在确认持姿':'放下 / 等待持姿'):'模拟持姿 · 持续前进'):movementContext===key?movementPhase:'准备姿态';
  $('livePrescription').textContent=s.task==='chop'?`挥砍 ${config.repsPerTree} 次 × ${config.treeCount} 棵 · 共 ${config.chopRepTarget} 次`:s.task==='load'?`深蹲 → 站起 → 推举 → 复位 · ${config.loadRepTarget} 次`:`有效持姿 ${Math.ceil(config.carryTargetMs/1000)} 秒 · 运送回家`;
  $<HTMLButtonElement>('acceptPlan').disabled=renderUnavailable;
  $<HTMLButtonElement>('beginDemo').disabled=renderUnavailable;
  $('modeBadge').textContent = demoEnabled ? '▶ 自动模拟 · 非真实动作识别'
    : s.inputMode === 'camera' ? '📷 摄像头姿态代理 · 真机待验证' : '⌨ 键盘演示 · 非真实动作识别';
  for (const id of ['demoToggle', 'setupDemoToggle']) {
    $(id).setAttribute('aria-checked', String(demoEnabled));
    $(id).textContent = `无摄像头测试：${demoEnabled ? '开' : '关'}`;
  }
  $('demoPreviewSetup').hidden = !demoEnabled;
  $('demoPreviewGame').hidden = !demoEnabled || !['countdown', 'active', 'rest'].includes(phase);
  $('rewardNote').hidden = !$('demoPreviewGame').hidden;
  $('cameraDiagnostics').hidden = demoEnabled;
  $('keyboardChoice').hidden = demoEnabled;
  $('cameraLimitNote').hidden = demoEnabled;
  $('cameraStop').hidden = demoEnabled;
  $('beginDemo').textContent = demoEnabled ? '开始自动模拟演示 →' : '关闭摄像头并开始键盘演示 →';
  if(cameraPreparation)$('beginDemo').textContent='关闭摄像头并切换键盘';
  $('beginCamera').hidden=demoEnabled;
  $('beginCamera').textContent=cameraPreparation?'使用标定恢复摄像头训练':'完成标定后开始摄像头训练';
  $('useKeyboard').hidden=$('recalibrate').hidden=s.inputMode!=='camera'||!running(s);
  updateCameraButton();
  $('chopValue').textContent = `${s.chopReps}/${config.chopRepTarget}`;
  $('loadValue').textContent = `${s.loadReps}/${config.loadRepTarget}`;
  $('carryValue').textContent = `${(s.carryActiveMs / 1000).toFixed(1)}/${Math.ceil(config.carryTargetMs / 1000)}s`;
  $('treeValue').textContent = `${s.choppedTrees}/${config.treeCount}`;
  $('stageTitle').textContent = phase === 'home' || phase === 'setup' ? '一座农场，等待你的第一步'
    : phase === 'results' ? '今天的收获已装满手推车'
    : niceTask(s.task);
  $('missionTitle').textContent = phase === 'results' ? '劳作完成！' : niceTask(s.task);
  $('missionText').textContent = phase === 'home' || phase === 'setup'
    ? '运动与经营结合的概念验证：把日常动作转化为农场资源。'
    : phase === 'results' ? '所有奖励均已结算。你可以返回首页重置并再次体验。'
    : demoEnabled ? '脚本自动完成动作循环，合成骨架同步展示阶段。进度和奖励均为演示数据。'
    : s.inputMode==='camera'?'按照标定动作完成完整循环；拉车只检测姿态持续性，不能证明实际持握。'
    : s.task ? instructions[s.task] : '';
  $('sceneTag').textContent = phase === 'results' ? '今日收获 · 已完成' : '今日劳作 · 体验计划';
  $('planModal').hidden = phase !== 'home' || planDismissed;
  $('setupModal').hidden = phase !== 'setup'&&!cameraPreparation;
  $('resultsModal').hidden = phase !== 'results';
  game.setInteractionEnabled($('setupModal').hidden&&$('resultsModal').hidden&&$('exitModal').hidden&&!renderUnavailable);
  $('pauseBtn').hidden = !(['countdown', 'active', 'rest'] as string[]).includes(phase);
  $('pauseBtn').textContent = s.pauseReasons.length ? '继续' : '暂停';
  const status = s.pauseReasons.length ? '已暂停' : phase === 'home' ? '未开始'
    : phase === 'setup' ? '设备准备' : phase === 'active' ? '训练中'
    : phase === 'countdown' ? '倒计时' : phase === 'rest' ? '休息时间' : '已完成';
  $('statusTag').textContent = status;
  const usable = active(s) && !demoEnabled;
  const action = $('actionBtn') as HTMLButtonElement;
  action.disabled = renderUnavailable||!usable && !(phase === 'home' && planDismissed);
  action.textContent = phase === 'home' && planDismissed ? '查看今日计划' : s.task === 'carry' ? '按住拉车' : s.task === 'chop' ? '🪓 模拟一次挥砍' : s.task === 'load' ? '🪵 模拟一次装车' : '等待任务开始';
  $('actionPrompt').textContent = phase === 'countdown' ? `即将开始：${niceTask(s.task)}`
    : phase === 'rest' ? `休息 ${Math.ceil(s.remainingMs/1000)} 秒 · 下一个任务：${niceTask(s.task)}`
    : s.pauseReasons.length ? '当前已暂停，按继续按钮恢复。'
    : demoEnabled ? '自动演示中，可随时暂停或关闭无摄像头测试。'
    : usable && s.task ? instructions[s.task] : '准备开始今天的劳作。';
  if (demoEnabled && phase !== 'home') action.textContent = '自动模拟已开启';
  if(s.inputMode==='camera'&&running(s))action.textContent='由摄像头姿态控制';
  $('keyboardHint').textContent = demoEnabled ? '关闭测试后点继续，即可使用键盘' : s.task === 'carry' ? '长按 Space 持续拉车，松开停止' : '按 Space 完成一次动作循环（禁用自动重复）';
  if(s.inputMode==='camera'&&running(s))$('keyboardHint').textContent='Space不产生运动成果；可明确切换键盘';
  $('sceneHint').textContent = phase === 'rest' ? '农场机器人正在协助整理木材……'
    : s.pauseReasons.length ? '计时与运动进度均已暂停。'
    : phase === 'countdown' ? '即将进入下一轮挑战。'
    : phase === 'active' && demoEnabled ? '自动模拟正在演示农场劳作，非真实运动成果。'
    : phase === 'active' && s.inputMode==='camera'?'保持全身可见；停止持姿或跟踪失效时不推进。'
    : phase === 'active' && s.task ? instructions[s.task]
    : '从一件小事开始，让这座农场苏醒。';
  const countdown = $('countdown');
  countdown.classList.toggle('compact', phase === 'rest' || s.pauseReasons.length > 0);
  countdown.hidden = phase !== 'rest' && phase !== 'countdown' && !s.pauseReasons.length;
  if(s.pauseReasons.length) countdown.innerHTML = '已暂停<small>点击继续后恢复</small>';
  else if(phase === 'rest') countdown.innerHTML = `${Math.ceil(s.remainingMs/1000)}s<small>休息 · ${s.task === 'load' ? '归拢木材' : '固定货物'}</small>`;
  else if(phase === 'countdown') countdown.innerHTML = `${Math.ceil(s.remainingMs/1000)}<small>做好准备，即将开始</small>`;
  const idx = s.task === 'chop' ? 0 : s.task === 'load' ? 1 : s.task === 'carry' ? 2 : phase === 'results' ? 3 : -1;
  (['chop','load','carry'] as TaskKind[]).forEach((t,i) => {
    const node = $(`step-${t}`);node.classList.toggle('current',idx===i);node.classList.toggle('done',idx>i);
  });
  const progress = s.task === 'chop' ? s.chopReps / config.chopRepTarget
    : s.task === 'load' ? s.loadReps / config.loadRepTarget
    : s.task === 'carry' ? s.carryActiveMs / config.carryTargetMs
    : phase === 'results' ? 1 : 0;
  $('scenePercent').textContent = `${Math.min(100,Math.floor(progress*100))}%`;
  $('progressFill').style.width = `${Math.max(0,Math.min(100,progress*100))}%`;
  $('rewardLogs').textContent = String(s.deliveredLogs);
  $('rewardCoins').textContent = String(s.rewardsGranted ? config.coinReward : 0);
  $('rewardStamina').textContent = String(s.rewardsGranted ? config.staminaReward : 0);
  const duration=(ms:number)=>`${Math.floor(ms/60000).toString().padStart(2,'0')}:${Math.floor(ms/1000%60).toString().padStart(2,'0')}`;
  $('resultChop').textContent=String(s.chopReps);$('resultLoad').textContent=String(s.loadReps);
  $('resultCarry').textContent=(s.carryActiveMs/1000).toFixed(1);$('resultActive').textContent=duration(s.exerciseActiveMs);$('resultElapsed').textContent=duration(s.sessionElapsedMs);
  const cameraUsed=sourceManager.usedModes.has('camera'),keyboardUsed=sourceManager.usedModes.has('keyboard');
  const provenance=cameraUsed?(keyboardUsed?`混合输入：摄像头姿态代理 + ${demoUsed?'自动模拟':'键盘演示输入'}`:'摄像头姿态代理（非负载/健康测量）'):demoUsed?'含自动模拟（复用键盘模拟协议）':'键盘模拟';
  $('actualMetrics').textContent = `挥砍 ${s.chopReps} 次 · 装车 ${s.loadReps} 次 · 有效持姿 ${(s.carryActiveMs / 1000).toFixed(1)} 秒 · 任务有效时间 ${(s.exerciseActiveMs / 1000).toFixed(1)} 秒 · 本局经过时间（含休息/暂停）${(s.sessionElapsedMs / 1000).toFixed(1)} 秒 · 输入：${provenance}`;
  $('systemStatus').textContent = displayError || `会话 ${s.sessionId} · ${status}`;
}
controller.subscribe(panel);
controller.onEffect(e => {
  // Effects precede subscriptions; resource callbacks must see the authoritative phase.
  current = controller.getSnapshot();
  audio.handle(e);
  preview.apply(e);
  if(e.kind==='action-phase'){
    movementContext=`${e.sessionId}/${e.taskRunId}/${e.sourceEpoch}`;
    const names={ready:'准备 · 稳定起始姿态','chop-down':'下挥 · 击中树干','chop-return':'复位 · 收回斧头','squat-down':'下蹲 · 拾起木材','stand-up':'站起 · 抬起木材','press-up':'推举 · 举过头顶','load-return':'抛出木材 · 完成复位'};
    movementPhase=names[e.phase];
  }
  if (e.kind === 'session-reset') {
    cameraPreparation=false;displayError='';cameraInput.clearProfile();sourceManager.resetHistory();
    demoEnabled = false;demoUsed = false;preview.setEnabled(false);void autoInput.stop();
    planDismissed = false; $('exitModal').hidden = true; void cameraPanel.stop();
  }
  if(e.kind==='rewards-granted'){cameraPreparation=false;void cameraPanel.stop();}
});
function doAction(): void {
  if (!active(current) || demoEnabled) return;
  if (current.task === 'carry') input.holdStart();
  else input.doRep();
}
$('cancelPlan').addEventListener('click', () => {
  planDismissed = true;
  panel(current);
});
$('acceptPlan').addEventListener('click', () => controller.command({kind:'open-setup',mode:'keyboard'}));
$('viewLeft').addEventListener('click',()=>game.rotate(-1));$('viewRight').addEventListener('click',()=>game.rotate(1));$('viewReset').addEventListener('click',()=>game.resetView());
$('audioToggle').addEventListener('click',async()=>{await audio.setEnabled(!audio.enabled);panel(controller.getSnapshot());});
$('backHome').addEventListener('click', () => controller.command({kind:'reset'}));
for (const id of ['demoToggle', 'setupDemoToggle']) $(id).addEventListener('click', () => setDemo(!demoEnabled));
$('cameraStart').addEventListener('click', () => { setDemo(false);controller.command({ kind: 'switch-source', mode: 'camera' }); void cameraPanel.start(); });
$('cameraStop').addEventListener('click', () => { void cameraPanel.stop(); });
$('beginDemo').addEventListener('click', () => {
  switchKeyboard();if(current.phase==='setup')controller.command({kind:'setup-ready'});
});
$('useKeyboard').addEventListener('click',switchKeyboard);
$('recalibrate').addEventListener('click',()=>requireCameraPreparation('请重新采集标定'));
$('beginCamera').addEventListener('click',()=>{
  const profile=calibrationPanel.getProfile();if(!profile)return;
  try{
    cameraInput.setProfile(profile);cameraPreparation=false;displayError='';
    controller.command({kind:'switch-source',mode:'camera'});
    controller.command({kind:'camera-readiness',ready:true});
    if(current.phase==='setup')controller.command({kind:'setup-ready',calibrated:{chop:true,load:true,carry:true}});
    else{controller.command({kind:'resume',reason:'tracking'});controller.command({kind:'resume',reason:'source-error'});}
  }catch(error){displayError=`标定不可用：${error instanceof Error?error.message:String(error)}。请重做标定或切换键盘。`;$('cameraStatus').textContent=displayError;}
});
$('resetBtn').addEventListener('click', () => {stopHold();controller.command({kind:'reset'});});
$('resultsHome').addEventListener('click',()=>{stopHold();controller.command({kind:'reset'});});
$('pauseBtn').addEventListener('click',()=>{
  stopHold();
  if (current.pauseReasons.includes('visibility')) controller.command({kind:'resume',reason:'visibility'});
  else controller.command(current.pauseReasons.includes('user')?{kind:'resume',reason:'user'}:{kind:'pause',reason:'user'});
});
const actionBtn=$('actionBtn') as HTMLButtonElement;
$('cancelExit').addEventListener('click', () => {
  $('exitModal').hidden = true;
  game.setInteractionEnabled($('setupModal').hidden&&$('resultsModal').hidden&&!renderUnavailable);
  if (!exitWasUserPaused) controller.command({ kind: 'resume', reason: 'user' });
  actionBtn.focus();
});
$('confirmExit').addEventListener('click', () => { stopHold(); controller.command({ kind: 'reset' }); });
actionBtn.addEventListener('click',()=>{
  if (current.phase === 'home' && planDismissed) { planDismissed = false; panel(current); return; }
  if(current.task !== 'carry') doAction();
});
actionBtn.addEventListener('pointerdown',e=>{
  if(e.button!==0||current.task!=='carry'||!active(current)||demoEnabled)return;
  heldPointer=true;actionBtn.setPointerCapture(e.pointerId);input.holdStart();
});
for(const eventName of ['pointerup','pointercancel','lostpointercapture']) {
  actionBtn.addEventListener(eventName,()=>{ if(heldPointer){heldPointer=false;input.holdEnd();} });
}
window.addEventListener('keydown',e=>{
  if (e.code === 'Escape' && !e.repeat && ['active', 'countdown', 'rest'].includes(current.phase)) {
    e.preventDefault();
    if (!$('exitModal').hidden) return;
    exitWasUserPaused = current.pauseReasons.includes('user');
    stopHold(); controller.command({ kind: 'pause', reason: 'user' });
    $('exitModal').hidden = false;game.setInteractionEnabled(false); $('cancelExit').focus(); return;
  }
  const target=e.target;
  if (!$('exitModal').hidden) return;
  if(target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select'))) return;
  if(e.code==='KeyP'&&!e.repeat&&(['active','countdown','rest'] as string[]).includes(current.phase)){
    e.preventDefault();($('pauseBtn') as HTMLButtonElement).click();return;
  }
  if(e.code!=='Space')return;
  if(target instanceof HTMLButtonElement && target !== actionBtn) return;
  if(e.repeat){ if(active(current)) e.preventDefault(); return; }
  if(!active(current))return;
  e.preventDefault();heldKeyboard=true;doAction();
});
window.addEventListener('keyup',e=>{
  if(e.code==='Space'&&heldKeyboard){e.preventDefault();heldKeyboard=false;if(!heldPointer)input.holdEnd();}
});
window.addEventListener('blur',()=>{stopHold();controller.command({kind:'pause',reason:'visibility'});});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){stopHold();controller.command({kind:'pause',reason:'visibility'});}
});
function animate(now:number):void {
  // Readiness can expire without another frame, including during rest/countdown.
  if(current.inputMode==='camera'&&running(current)&&!cameraPreparation&&!calibrationPanel.getProfile()){
    requireCameraPreparation('关键点或标定已失效，请重新准备');
  }
  controller.tick(now);
  cameraInput.tick(now);
  if(previousFrameMs&&now>previousFrameMs){frameIntervals.push(now-previousFrameMs);if(frameIntervals.length>120)frameIntervals.shift();}previousFrameMs=now;
  if(now-diagnosticAtMs>=500){
    diagnosticAtMs=now;const debug=cameraInput.getDebug(),sorted=[...frameIntervals].sort((a,b)=>a-b);
    const p95=sorted[Math.floor(sorted.length*.95)]??0;
    $('inputDebug').textContent=`${current.inputMode} · ${current.taskRunId??'无任务实例'} · epoch ${current.sourceEpoch} · ${debug.phase} · ${debug.reason??'等待/有效输入'}\n游戏帧间隔 p95 ${p95.toFixed(1)}ms（最近120帧，非端到端延迟）${current.inputMode==='camera'?`\n${$('cameraMetrics').textContent}\n${$('calibrationFeatures').textContent}`:''}`;
  }
  preview.update(now, current);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
window.addEventListener('pagehide', () => { gamePreview.dispose();void audio.dispose();void sourceManager.dispose();void cameraInput.dispose();void cameraPanel.dispose(); void input.dispose(); void autoInput.dispose(); preview.dispose(); controller.dispose(); game.destroy(true); });
