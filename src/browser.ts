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
import {readDemoPreference,saveDemoPreference} from './ui/demoPreference.js';
import {setProperty,setAttribute,setClass} from './ui/domUpdates.js';
import {ExerciseTutorialPanel} from './ui/exerciseTutorialPanel.js';
import {MovementGuide} from './ui/movementGuide.js';
import {createLeniencyConfig,isRecognitionLeniency,recognitionLeniencyLabel} from './config/recognitionTolerance.js';
import {readRecognitionLeniency,saveRecognitionLeniency} from './ui/recognitionPreference.js';
import {UpperBodyPreparationPanel} from './ui/upperBodyPreparationPanel.js';
import type { SessionSnapshot, TaskKind } from './domain/types.js';

const elements=new Map<string,HTMLElement>();
const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const element = elements.get(id)??document.getElementById(id);
  if (!element) throw new Error(`Missing element ${id}`);
  elements.set(id,element);
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
const initialSessionId=controller.getSnapshot().sessionId;
const input = new KeyboardActionSource(isTestMode ? .085 : 1);
const autoInput = new AutoDemoSource(isTestMode ? .085 : 1);
let recognitionLeniency=readRecognitionLeniency();
let recognitionSettingMessage='';
const cameraInput = new CameraActionSource(()=>performance.now(),createLeniencyConfig(recognitionLeniency));
const sourceManager = new SourceManager();
const audio = new AudioFeedback();
const calibrationPanel = new CalibrationPanel($<HTMLDetailsElement>('calibrationPanel'));
const upperBodyPanel=new UpperBodyPreparationPanel($('upperBodyPreparation'));
let upperBodyMode=true,cameraEntryOwnsPause=false,cameraStartGeneration=0,cameraAutoReadyAt:number|null=null;
let cameraAutoStart:{sessionId:string;ownsUserPause:boolean}|null=null;
let cameraTrackingRecovery:{sessionId:string;sourceEpoch:number;returnToTraining:boolean;resumeTracking:boolean}|null=null;
let upperCalibrationWasSaved=false;
const cameraPreparationPanel={
 activate(){if(upperBodyMode){upperBodyPanel.activate();$('upperBodyPreparation').scrollIntoView({block:'center'});}else calibrationPanel.activate();},
 accept(frame:Parameters<CalibrationPanel['accept']>[0]){if(upperBodyMode)upperBodyPanel.accept(frame);else calibrationPanel.accept(frame);},
 tick(nowMs:number){if(upperBodyMode){upperBodyPanel.tick(nowMs);if(usingUpperBodyPreparation())updateCameraFeedback();}else calibrationPanel.tick(nowMs);},
 reset(close=false,reason='manual-reset'){
  if(!close&&upperBodyMode&&upperBodyPanel.hasSavedProfile()&&['window-blur','page-hidden','page-visible'].includes(reason)){
    upperBodyPanel.suspendTracking(reason);return;
  }
  if(keepVisiblePreparation(reason))return;
  clearCameraTrackingRecovery();upperCalibrationWasSaved=false;
  calibrationPanel.reset(close);upperBodyPanel.reset(close,reason);
 },
 dispose(){calibrationPanel.dispose();upperBodyPanel.dispose();},
};
const preview = new SyntheticPreview([
  { canvas: $<HTMLCanvasElement>('demoSetupCanvas'), label: $('demoSetupPhase') },
  { canvas: $<HTMLCanvasElement>('demoGameCanvas'), label: $('demoGamePhase') },
]);
const game = createGame($('worldCanvas'), controller, config,message=>{
  displayError=message;renderUnavailable=true;renderFailed=true;stopHold();cameraInput.clearProfile();cameraPreparationPanel.reset(false,'render-error');
  pauseForUser();void cameraPanel.stop();panel(controller.getSnapshot());
});
const cameraPanel = new SetupPanel($<HTMLVideoElement>('cameraVideo'), $<HTMLCanvasElement>('poseOverlay'),
  $('cameraStatus'), $('cameraMetrics'), $('cameraFrames'), $<HTMLButtonElement>('cameraStart'),
  cameraPreparationPanel, {
    onFrame: frame => {
      if(renderUnavailable)return;
      updateCameraButton();
      monitorUpperBodyTracking();
      if(current.inputMode==='camera'&&running(current)&&!cameraPreparation&&!cameraTrackingRecovery&&!hasCameraProfile())handleCameraTrackingLoss('跟踪或标定已失效，请重新准备',true);
      cameraInput.accept(frame);
      updateCameraFeedback();
    },
    onError: message => requireCameraPreparation(message,'source-error'),
    onSuspend: reason => {
      const keep=keepVisiblePreparation(reason),saved=canRecoverUpperBodyTracking();
      cancelCameraAutoStart();cameraInput.clearProfile();
      if(saved){
        beginCameraTrackingRecovery('页面失焦或进入后台；动作模板已保存，请恢复追踪后手动继续。');
        controller.command({kind:'pause',reason:'visibility'});
      }else if(keep)upperBodyPanel.setSuspendNotice('窗口失焦，保留准备进度；自动开始已取消，完成后请手动开始或继续。');
      else if(current.inputMode==='camera'&&running(current))requireCameraPreparation('页面失焦或进入后台，请重新标定','visibility');
    },
    onStop: () => {clearCameraTrackingRecovery();upperCalibrationWasSaved=false;cameraAutoStart=null;cameraAutoReadyAt=null;cameraInput.clearProfile();updateCameraButton();if(current.inputMode==='camera'&&running(current)&&!cameraPreparation)requireCameraPreparation('摄像头已停止，请重新准备','source-error');},
  });
const gamePreview=new GamePreview($('cameraPreview'),$<HTMLVideoElement>('cameraVideo'),$('setupPreviewHost'),$('gamePreviewHost'),message=>requireCameraPreparation(message,'source-error'));
cameraPanel.setUpperBodyEnabled(upperBodyMode);
let current = controller.getSnapshot();
let boundInputKey = '';
let heldKeyboard = false;
let heldPointer = false;
let displayError = '';
let renderUnavailable=!!game.ready;
let renderFailed=false;
let movementPhase='准备姿态';
let movementContext='';
let cameraPreparation = false;
let planDismissed = false;
let exitWasUserPaused = false;
let preferredDemo=readDemoPreference();
let demoEnabled = preferredDemo;
let demoUsed = false;
preview.setEnabled(demoEnabled);
const movementGuide=new MovementGuide($('movementGuide'));
let previousFrameMs=0,diagnosticAtMs=0;
const frameIntervals:number[]=[];
let tutorialOpened=false;
let animationsStopped=false,animationOwnsUserPause=false;
const animationStopButtons=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-animation-stop]'));
const tutorial=new ExerciseTutorialPanel($('tutorialModal'),{
  onOpen(){tutorialOpened=true;cancelCameraAutoStart();stopHold();if(running(current))pauseForUser();panel(current);},
  onClose(){
    panel(current);
    if(!$('setupModal').hidden)return $('setupTutorial');
    if(!$('planModal').hidden)return $('planTutorial');
    if(!$('resultsModal').hidden)return $('resultsTutorial');
    return $('tutorialOpen');
  },
});

const instructions: Record<TaskKind, string> = {
  chop: '空格触发一次“上举 → 下挥 → 复位”，完整循环后记数。',
  load: '空格触发“蹲下 → 站起 → 上举 → 复位”，装上一份木材。',
  carry: '按住空格或“按住拉车”按钮；松开即停止推进。',
};
function active(s: Readonly<SessionSnapshot>): boolean {
  return !renderUnavailable&&s.phase === 'active' && s.pauseReasons.length === 0 && s.inputMode === 'keyboard';
}
function stopHold(): void { heldKeyboard = false; heldPointer = false; input.holdEnd(); }
function running(s:Readonly<SessionSnapshot>):boolean{return ['countdown','active','rest'].includes(s.phase);}
function pauseForUser():void{
  // Another action now needs this pause, even if our stop added it first.
  cancelCameraAutoStart();cameraEntryOwnsPause=false;
  animationOwnsUserPause=false;controller.command({kind:'pause',reason:'user'});
}
function cancelCameraAutoStart():void{cameraAutoStart=null;cameraAutoReadyAt=null;cameraStartGeneration++;upperBodyPanel.setStartMessage('');}
function setAnimationsStopped(stopped:boolean):void{
  if(animationsStopped===stopped)return;
  animationsStopped=stopped;stopHold();
  if(stopped)cancelCameraAutoStart();
  game.setAnimationPaused(stopped);preview.setSuspended(stopped);tutorial.setSuspended(stopped);
  if(stopped){
    animationOwnsUserPause=running(current)&&!current.pauseReasons.includes('user');
    if(animationOwnsUserPause)controller.command({kind:'pause',reason:'user'});
  }else{
    const resume=animationOwnsUserPause;animationOwnsUserPause=false;
    if(resume)controller.command({kind:'resume',reason:'user'});
  }
  panel(controller.getSnapshot());
  if(!stopped)startDefaultDemo();
}
function updateCameraButton():void {
  const disabled=renderUnavailable||!hasCameraProfile();
  setProperty($<HTMLButtonElement>('beginCamera'),'disabled',disabled);
  setProperty($<HTMLButtonElement>('finishUpperPreparation'),'disabled',disabled);
  setProperty($('finishUpperPreparation'),'hidden',!upperBodyMode||!upperBodyPanel.hasSavedProfile());
}
function hasCameraProfile():boolean{return upperBodyMode?upperBodyPanel.getProfile()!==null:calibrationPanel.getProfile()!==null;}
function usingUpperBodyPreparation():boolean{return upperBodyMode&&current.inputMode==='camera'&&(current.phase==='setup'||cameraPreparation);}
function updateCameraFeedback():void{
  const preparing=usingUpperBodyPreparation(),feedback=preparing?upperBodyPanel.getFeedback():cameraInput.getFeedback();
  cameraPanel.setFeedback(feedback);
  if(preparing&&!feedback||canRecoverUpperBodyTracking()&&!hasCameraProfile())setProperty($('cameraFeedbackStatus'),'textContent',$('upperBodyReason').textContent);
}
function keepVisiblePreparation(reason?:string):boolean{
  return reason==='window-blur'&&!document.hidden&&upperBodyMode&&usingUpperBodyPreparation()&&upperBodyPanel.hasIncompleteCheckpoint();
}
function applyCameraProfile():boolean{
  if(upperBodyMode){const profile=upperBodyPanel.getProfile();if(!profile)return false;cameraInput.setUpperBodyProfile(profile);}
  else{const profile=calibrationPanel.getProfile();if(!profile)return false;cameraInput.setProfile(profile);}
  return true;
}
/** A saved personal template is separate from fresh observations and never authorizes input by itself. */
function canRecoverUpperBodyTracking():boolean{
  return upperBodyMode&&current.inputMode==='camera'&&upperBodyPanel.hasSavedProfile();
}
function setCameraTrackingStatus(message:string):void{
  setProperty($('cameraTrackingStatus'),'textContent',message);
  setProperty($('cameraTrackingStatus'),'hidden',!message);
}
function clearCameraTrackingRecovery():void{
  cameraTrackingRecovery=null;setCameraTrackingStatus('');
}
function beginCameraTrackingRecovery(message:string,trackingWasPaused=current.pauseReasons.includes('tracking')):void{
  if(!canRecoverUpperBodyTracking())return;
  cameraAutoReadyAt=null;
  if(!cameraTrackingRecovery){
    const returnToTraining=running(current)&&!cameraPreparation;
    cameraTrackingRecovery={sessionId:current.sessionId,sourceEpoch:current.sourceEpoch,returnToTraining,
      resumeTracking:returnToTraining&&!trackingWasPaused};
  }
  cameraInput.clearProfile();cameraPanel.setFeedback(null);
  displayError=message;
  setCameraTrackingStatus(`${message} 已保存3/3；当前动作不计次、持姿不计时，请回到镜头内保持稳定，无需重做三个姿态。`);
  controller.command({kind:'camera-readiness',ready:false});
  if(cameraTrackingRecovery.returnToTraining)controller.command({kind:'pause',reason:'tracking'});
  updateCameraButton();updateCameraFeedback();
}
function handleCameraTrackingLoss(message:string,preparationAlreadyInvalid=false,trackingWasPaused=current.pauseReasons.includes('tracking')):void{
  if(canRecoverUpperBodyTracking()){
    // A loss reported by the active source must also invalidate the readiness observation window.
    if(upperBodyPanel.getProfile())upperBodyPanel.suspendTracking(message==='关键点已过期，请重新标定'?'stale':message);
    beginCameraTrackingRecovery(message,trackingWasPaused);
  }else requireCameraPreparation(message,'tracking',preparationAlreadyInvalid);
}
function monitorUpperBodyTracking():void{
  if(!upperBodyMode||current.inputMode!=='camera')return;
  const saved=upperBodyPanel.hasSavedProfile();
  if(!saved){
    if(upperCalibrationWasSaved||cameraTrackingRecovery){
      upperCalibrationWasSaved=false;
      requireCameraPreparation('机位或标定条件已变化，请重新准备','tracking',true);
    }
    return;
  }
  upperCalibrationWasSaved=true;
  if(!upperBodyPanel.getProfile()){
    const reason=$('upperBodyReason').textContent?.trim()||'上半身追踪暂时中断。';
    if(!cameraTrackingRecovery)beginCameraTrackingRecovery(reason);
    else setCameraTrackingStatus(`${reason} 已保存3/3；当前动作不计次、持姿不计时，请回到镜头内保持稳定，无需重做三个姿态。`);
    return;
  }
  const recovery=cameraTrackingRecovery;
  if(!recovery)return;
  if(recovery.sessionId!==current.sessionId||recovery.sourceEpoch!==current.sourceEpoch){clearCameraTrackingRecovery();return;}
  try{
    if(!applyCameraProfile())return;
    cameraTrackingRecovery=null;
    if(recovery.returnToTraining)cameraPreparation=false;
    displayError='';
    controller.command({kind:'camera-readiness',ready:true});
    if(recovery.resumeTracking)controller.command({kind:'resume',reason:'tracking'});
    setCameraTrackingStatus(current.pauseReasons.length?'追踪已恢复，动作模板已保存；当前仍暂停，请手动开始或继续。':'追踪已恢复，动作模板已保存。');
    updateCameraButton();
  }catch(error){requireCameraPreparation(error instanceof Error?error.message:String(error),'source-error');}
}
function requireCameraPreparation(message:string,reason:'tracking'|'source-error'|'visibility'='tracking',preparationAlreadyInvalid=false):void{
  if(renderUnavailable)return;
  clearCameraTrackingRecovery();upperCalibrationWasSaved=false;
  cancelCameraAutoStart();cameraEntryOwnsPause=false;displayError=message;cameraInput.clearProfile();cameraPanel.setFeedback(null);
  if(current.inputMode==='camera'&&!running(current)&&upperBodyMode&&upperBodyPanel.hasSavedProfile())cameraPreparationPanel.reset(false,reason);
  if(current.inputMode==='camera'&&running(current)){
    cameraPreparation=true;if(!upperBodyMode||!preparationAlreadyInvalid)cameraPreparationPanel.reset(false,reason);
    controller.command({kind:'camera-readiness',ready:false});controller.command({kind:'pause',reason});
  }
  updateCameraButton();
}
async function syncSource(s: Readonly<SessionSnapshot>): Promise<void> {
  const context = !renderUnavailable&&s.phase==='active'&&!s.pauseReasons.length ? inputContext(s) : null;
  const key = context ? `${context.sessionId}:${context.taskRunId}:${context.sourceEpoch}:${s.inputMode}:${demoEnabled}` : '';
  if (key === boundInputKey) return;
  boundInputKey = key;
  if(!context)cameraPanel.setFeedback(null);
  if(context&&demoEnabled)demoUsed=true;
  try {
    await sourceManager.switchTo(context ? s.inputMode==='camera'?cameraInput:demoEnabled?autoInput:input : null,context,e=>{
      if(renderUnavailable)return;
      const trackingWasPaused=current.pauseReasons.includes('tracking');
      controller.accept(e);
      if(e.kind==='tracking'&&e.status!=='ready'&&s.inputMode==='camera')handleCameraTrackingLoss(e.message??'跟踪暂时中断',false,trackingWasPaused);
    });
  }catch(error){
    requireCameraPreparation(error instanceof Error?error.message:String(error),'source-error');
  }
}
function switchKeyboard():void{
  if(renderUnavailable)return;
  clearCameraTrackingRecovery();upperCalibrationWasSaved=false;
  cancelCameraAutoStart();cameraEntryOwnsPause=false;
  stopHold();if(running(current))pauseForUser();
  cameraPreparation=false;displayError='';controller.command({kind:'switch-source',mode:'keyboard'});
  controller.command({kind:'resume',reason:'tracking'});controller.command({kind:'resume',reason:'source-error'});
  void cameraPanel.stop();
}
function setDemo(enabled: boolean): void {
  if(renderUnavailable)return;
  preferredDemo=enabled;saveDemoPreference(enabled);
  if (demoEnabled === enabled) return;
  stopHold();
  // Cancel a partial cycle before changing source, then invalidate its context.
  if (['countdown', 'active', 'rest'].includes(current.phase)) pauseForUser();
  demoEnabled = enabled;preview.setEnabled(enabled);
  if(enabled||current.inputMode==='camera')switchKeyboard();
  else controller.command({ kind: 'switch-source', mode: 'keyboard' });
}
function openCameraPreparation():void{
  if(renderUnavailable||current.phase==='results')return;
  clearCameraTrackingRecovery();
  const ownsPause=running(current)&&!current.pauseReasons.includes('user')&&!animationsStopped;
  stopHold();if(running(current))pauseForUser();
  setDemo(false);
  if(current.phase==='home')controller.command({kind:'open-setup',mode:'camera'});
  else controller.command({kind:'switch-source',mode:'camera'});
  cameraPreparation=running(current);
  cameraEntryOwnsPause=ownsPause;
  recognitionSettingMessage=cameraPreparation?(ownsPause?'训练已暂停。准备完成后点击“结束准备，进入训练”即可继续。':'准备完成后可返回训练；保留你原有的暂停。'):'';
  restoreCameraProfile();panel(controller.getSnapshot());
}
function restoreCameraProfile():void{
  try{
    const ready=applyCameraProfile();if(!ready)cameraInput.clearProfile();
    if(current.inputMode==='camera')controller.command({kind:'camera-readiness',ready});
  }catch(error){
    cameraInput.clearProfile();controller.command({kind:'camera-readiness',ready:false});
    recognitionSettingMessage=`标定不可用，请重新采集：${error instanceof Error?error.message:String(error)}`;
  }
}
function applyRecognitionLeniency(level:number):void{
  if(!isRecognitionLeniency(level)||level===recognitionLeniency)return;
  clearCameraTrackingRecovery();
  cancelCameraAutoStart();
  stopHold();if(running(current))pauseForUser();
  if(current.inputMode==='camera')controller.command({kind:'switch-source',mode:'camera'});
  cameraInput.setRecognitionConfig(createLeniencyConfig(level));
  recognitionLeniency=level;
  const saved=saveRecognitionLeniency(level);
  recognitionSettingMessage=`已切换到第 ${level} 档 · ${recognitionLeniencyLabel(level)}${saved?'':'（本次有效，浏览器未能保存）'}。${running(current)?'半次动作已清除，返回训练后点击继续。':'完成个人标定后开始识别。'}`;
  restoreCameraProfile();panel(controller.getSnapshot());
}
function niceTask(task: TaskKind | null): string {
  return task === 'chop' ? '砍伐杉树' : task === 'load' ? '把木材装上手推车' : task === 'carry' ? '推车返回农场' : '农场计划';
}
function panel(s: Readonly<SessionSnapshot>): void {
  if(animationsStopped&&running(s)&&!s.pauseReasons.includes('user')){
    animationOwnsUserPause=true;controller.command({kind:'pause',reason:'user'});return;
  }
  current = s;
  const upperCamera=upperBodyMode&&s.inputMode==='camera';
  const trackingOnly=upperCamera&&!!cameraTrackingRecovery?.resumeTracking&&s.pauseReasons.length>0&&s.pauseReasons.every(reason=>reason==='tracking');
  tutorial.setUpperBodyEnabled(upperCamera);movementGuide.setUpperBodyEnabled(upperCamera);
  setProperty($('app').dataset,'cameraExercise',upperBodyMode?'upper-body':'full-body');
  setProperty($('upperBodyPreparation'),'hidden',!upperBodyMode);
  setProperty($('calibrationPanel'),'hidden',upperBodyMode);
  setProperty($('planChop'),'textContent',`${upperBodyMode?'举手放下':'挥砍'} ${config.repsPerTree} 次 × ${config.treeCount} 棵 · 共 ${config.chopRepTarget} 次`);
  setProperty($('planLoad'),'textContent',`${upperBodyMode?'举手放下':'深蹲推举'} ${config.loadRepTarget} 次 · 装车 ${config.loadRepTarget} 份木材`);
  setProperty($('planCarry'),'textContent',`${upperBodyMode?'双臂前举持姿':'持续持姿'} ${Math.ceil(config.carryTargetMs/1000)} 秒 · 返回农场`);
  for(const task of ['chop','load','carry'] as const){const label=$(`step-${task}`).querySelector('small');if(label)setProperty(label,'textContent',upperCamera?(task==='carry'?'双臂前举持姿':'双手举起放下'):task==='chop'?'壶铃挥砍':task==='load'?'深蹲推举':'持续持姿');}
  setProperty($('app').dataset,'animationsStopped',String(animationsStopped));
  for(const button of animationStopButtons){setProperty(button,'textContent',animationsStopped?'继续播放':'停止动画');setAttribute(button,'aria-pressed',String(animationsStopped));}
  movementGuide.sync(s,!renderUnavailable);
  setProperty($('audioToggle'),'textContent',audio.error||(audio.enabled?'音效：开 · 点击静音':'开启音效'));
  setAttribute($('audioToggle'),'aria-pressed',String(audio.enabled));
  void syncSource(s);
  const phase = s.phase;
  setProperty($('app').dataset,'phase',phase);
  const showCamera=s.inputMode==='camera'&&running(s)&&!cameraPreparation;
  setProperty($('livePreview'),'hidden',!(showCamera||demoEnabled&&running(s)));
  setProperty($('gamePreviewHost'),'hidden',!showCamera);
  gamePreview.setInGame(showCamera);
  const key=`${s.sessionId}/${s.taskRunId}/${s.sourceEpoch}`;
  const carryState=cameraInput.getDebug().phase;
  const feedback=showCamera&&phase==='active'&&!s.pauseReasons.length?cameraInput.getFeedback():null;
  setProperty($('liveSource'),'textContent',showCamera?`本机摄像头 · ${recognitionLeniencyLabel(recognitionLeniency)}`:'合成骨架 · 自动模拟');
  setProperty($('liveMovementState'),'textContent',s.pauseReasons.length?'已暂停 · 运动不计时':phase==='rest'?(s.task==='load'?'休息 · 推车与归拢':'休息 · 固定货物'):phase==='countdown'?'准备开始':s.task==='carry'?(showCamera?(carryState==='holding'?'有效持姿 · 持续前进':carryState==='confirming'?'正在确认持姿':'放下 / 等待持姿'):'模拟持姿 · 持续前进'):movementContext===key?movementPhase:'准备姿态');
  if(feedback)setProperty($('liveMovementState'),'textContent',feedback.message);
  setProperty($('liveMovementState').dataset,'feedback',feedback?.status??'unavailable');
  if(document.activeElement!==$('recognitionLeniency'))setProperty($<HTMLInputElement>('recognitionLeniency'),'value',String(recognitionLeniency));
  setProperty($('recognitionLeniencyValue'),'textContent',`第 ${recognitionLeniency} 档 · ${recognitionLeniencyLabel(recognitionLeniency)}`);
  setAttribute($('recognitionLeniency'),'aria-valuetext',`第 ${recognitionLeniency} 档，${recognitionLeniencyLabel(recognitionLeniency)}`);
  setProperty($('recognitionSettingStatus'),'textContent',recognitionSettingMessage);
  for(const button of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-leniency]')))setAttribute(button,'aria-pressed',String(Number(button.dataset.leniency)===recognitionLeniency));
  setProperty($<HTMLButtonElement>('cameraMode'),'disabled',renderUnavailable||phase==='results');
  setProperty($('cameraMode'),'textContent',s.inputMode==='camera'&&running(s)?'识别设置':'摄像头识别');
  setProperty($('livePrescription'),'textContent',s.task==='chop'?`挥砍 ${config.repsPerTree} 次 × ${config.treeCount} 棵 · 共 ${config.chopRepTarget} 次`:s.task==='load'?`深蹲 → 站起 → 推举 → 复位 · ${config.loadRepTarget} 次`:`有效持姿 ${Math.ceil(config.carryTargetMs/1000)} 秒 · 运送回家`);
  if(upperCamera)setProperty($('livePrescription'),'textContent',s.task==='carry'?`双臂前举持姿 · 有效 ${Math.ceil(config.carryTargetMs/1000)} 秒`:`放下 → 双手举起 → 完整放下 · ${s.task==='chop'?config.chopRepTarget:config.loadRepTarget} 次`);
  setProperty($<HTMLButtonElement>('acceptPlan'),'disabled',renderUnavailable);
  setProperty($<HTMLButtonElement>('viewCastle'),'disabled',renderUnavailable);
  setProperty($<HTMLButtonElement>('beginDemo'),'disabled',renderUnavailable);
  setProperty($<HTMLButtonElement>('cameraStart'),'disabled',renderUnavailable);
  setProperty($<HTMLButtonElement>('pauseBtn'),'disabled',renderUnavailable||animationsStopped);
  setProperty($('modeBadge'),'textContent',demoEnabled ? '▶ 自动模拟 · 非真实动作识别'
    : s.inputMode === 'camera' ? upperBodyMode?'📷 上半身识别 · 真机待验证':'📷 全身姿态代理 · 真机待验证' : '⌨ 键盘演示 · 非真实动作识别');
  for (const id of ['demoToggle', 'setupDemoToggle']) {
    setAttribute($(id),'aria-checked',String(demoEnabled));
    setProperty($(id),'textContent',`无摄像头测试：${demoEnabled ? '开' : '关'}`);
  }
  setProperty($('demoPreviewSetup'),'hidden',!demoEnabled);
  setProperty($('demoPreviewGame'),'hidden',!demoEnabled || !['countdown', 'active', 'rest'].includes(phase));
  setProperty($('rewardNote'),'hidden',!$('demoPreviewGame').hidden);
  setProperty($('cameraDiagnostics'),'hidden',demoEnabled);
  setProperty($('keyboardChoice'),'hidden',demoEnabled);
  setProperty($('cameraLimitNote'),'hidden',demoEnabled);
  setProperty($('cameraStop'),'hidden',demoEnabled);
  setProperty($('beginDemo'),'textContent',cameraPreparation?'关闭摄像头并切换键盘':demoEnabled?'开始自动模拟演示 →':'关闭摄像头并开始键盘演示 →');
  setProperty($('beginCamera'),'hidden',demoEnabled);
  setProperty($('beginCamera'),'textContent',cameraPreparation?'使用标定恢复摄像头训练':'完成标定后开始摄像头训练');
  if(upperBodyMode)setProperty($('beginCamera'),'textContent',hasCameraProfile()?'准备完成 · 手动开始 / 返回训练':'按提示准备，完成后自动开始');
  setProperty($('useKeyboard'),'hidden',s.inputMode!=='camera'||!running(s));
  setProperty($('recalibrate'),'hidden',s.inputMode!=='camera'||!running(s));
  updateCameraButton();
  setProperty($('chopValue'),'textContent',`${s.chopReps}/${config.chopRepTarget}`);
  setProperty($('loadValue'),'textContent',`${s.loadReps}/${config.loadRepTarget}`);
  setProperty($('carryValue'),'textContent',`${(s.carryActiveMs / 1000).toFixed(1)}/${Math.ceil(config.carryTargetMs / 1000)}s`);
  setProperty($('treeValue'),'textContent',`${s.choppedTrees}/${config.treeCount}`);
  setProperty($('stageTitle'),'textContent',phase === 'home' || phase === 'setup' ? '一座农场，等待你的第一步'
    : phase === 'results' ? '今天的收获已装满手推车'
    : niceTask(s.task));
  setProperty($('missionTitle'),'textContent',phase === 'results' ? '劳作完成！' : niceTask(s.task));
  setProperty($('missionText'),'textContent',phase === 'home' || phase === 'setup'
    ? '运动与经营结合的概念验证：把日常动作转化为农场资源。'
    : phase === 'results' ? '所有奖励均已结算。你可以返回首页重置并再次体验。'
    : demoEnabled ? '脚本自动完成动作循环，合成骨架同步展示阶段。进度和奖励均为演示数据。'
    : s.inputMode==='camera'?upperBodyMode?'电脑前可坐着做：双手举起再放下完成一次；拉车双臂前举保持。只识别肩肘腕。':'按照标定动作完成完整循环；拉车只检测姿态持续性，不能证明实际持握。'
    : s.task ? instructions[s.task] : '');
  setProperty($('sceneTag'),'textContent',phase === 'results' ? '今日收获 · 已完成' : '今日劳作 · 体验计划');
  setProperty($('planModal'),'hidden',phase !== 'home' || planDismissed);
  setProperty($('setupModal'),'hidden',phase !== 'setup'&&!cameraPreparation);
  setProperty($('resultsModal'),'hidden',phase !== 'results');
  game.setInteractionEnabled($('tutorialModal').hidden&&$('setupModal').hidden&&$('resultsModal').hidden&&$('exitModal').hidden&&!renderUnavailable);
  setProperty($('pauseBtn'),'hidden',!(['countdown', 'active', 'rest'] as string[]).includes(phase));
  setProperty($('pauseBtn'),'textContent',trackingOnly?'暂停':s.pauseReasons.length?'继续':'暂停');
  const status = s.pauseReasons.length ? '已暂停' : phase === 'home' ? '未开始'
    : phase === 'setup' ? '设备准备' : phase === 'active' ? '训练中'
    : phase === 'countdown' ? '倒计时' : phase === 'rest' ? '休息时间' : '已完成';
  setProperty($('statusTag'),'textContent',status);
  const usable = active(s) && !demoEnabled;
  const action = $('actionBtn') as HTMLButtonElement;
  setProperty(action,'disabled',renderUnavailable||!usable && !(phase === 'home' && planDismissed));
  setProperty(action,'textContent',s.inputMode==='camera'&&running(s)?'由摄像头姿态控制':demoEnabled&&phase!=='home'?'自动模拟已开启':phase === 'home' && planDismissed ? '查看今日计划' : s.task === 'carry' ? '按住拉车' : s.task === 'chop' ? '🪓 模拟一次挥砍' : s.task === 'load' ? '🪵 模拟一次装车' : '等待任务开始');
  setProperty($('actionPrompt'),'textContent',renderUnavailable?'3D画面不可用，请重新加载页面。':phase === 'countdown' ? `即将开始：${niceTask(s.task)}`
    : phase === 'rest' ? `休息 ${Math.ceil(s.remainingMs/1000)} 秒 · 下一个任务：${niceTask(s.task)}`
    : trackingOnly ? '标定已保存，重新入镜并保持稳定后自动继续。'
    : s.pauseReasons.length ? '当前已暂停，按继续按钮恢复。'
    : demoEnabled ? '自动演示中，可随时暂停或关闭无摄像头测试。'
    : usable && s.task ? instructions[s.task] : '准备开始今天的劳作。');
  setProperty($('keyboardHint'),'textContent',s.inputMode==='camera'&&running(s)?'Space不产生运动成果；可明确切换键盘':demoEnabled ? '关闭测试后点继续，即可使用键盘' : s.task === 'carry' ? '长按 Space 持续拉车，松开停止' : '按 Space 完成一次动作循环（禁用自动重复）');
  setProperty($('sceneHint'),'textContent',phase === 'rest' ? '农场机器人正在协助整理木材……'
    : s.pauseReasons.length ? '计时与运动进度均已暂停。'
    : phase === 'countdown' ? '即将进入下一轮挑战。'
    : phase === 'active' && demoEnabled ? '自动模拟正在演示农场劳作，非真实运动成果。'
    : phase === 'active' && s.inputMode==='camera'?'保持全身可见；停止持姿或跟踪失效时不推进。'
    : phase === 'active' && s.task ? instructions[s.task]
    : '从一件小事开始，让这座农场苏醒。');
  const countdown = $('countdown');
  setClass(countdown,'compact',phase === 'rest' || s.pauseReasons.length > 0);
  setProperty(countdown,'hidden',phase !== 'rest' && phase !== 'countdown' && !s.pauseReasons.length);
  if(renderUnavailable)setProperty(countdown,'innerHTML','画面不可用<small>请重新加载页面</small>');
  else if(trackingOnly)setProperty(countdown,'innerHTML','等待追踪<small>重新入镜后自动继续</small>');
  else if(s.pauseReasons.length) setProperty(countdown,'innerHTML','已暂停<small>点击继续后恢复</small>');
  else if(phase === 'rest') setProperty(countdown,'innerHTML',`${Math.ceil(s.remainingMs/1000)}s<small>休息 · ${s.task === 'load' ? '归拢木材' : '固定货物'}</small>`);
  else if(phase === 'countdown') setProperty(countdown,'innerHTML',`${Math.ceil(s.remainingMs/1000)}<small>做好准备，即将开始</small>`);
  const idx = s.task === 'chop' ? 0 : s.task === 'load' ? 1 : s.task === 'carry' ? 2 : phase === 'results' ? 3 : -1;
  (['chop','load','carry'] as TaskKind[]).forEach((t,i) => {
    const node = $(`step-${t}`);setClass(node,'current',idx===i);setClass(node,'done',idx>i);
  });
  const progress = s.task === 'chop' ? s.chopReps / config.chopRepTarget
    : s.task === 'load' ? s.loadReps / config.loadRepTarget
    : s.task === 'carry' ? s.carryActiveMs / config.carryTargetMs
    : phase === 'results' ? 1 : 0;
  setProperty($('scenePercent'),'textContent',`${Math.min(100,Math.floor(progress*100))}%`);
  setProperty($('progressFill').style,'width',`${Number(Math.max(0,Math.min(100,progress*100)).toFixed(3))}%`);
  setProperty($('rewardLogs'),'textContent',String(s.deliveredLogs));
  setProperty($('rewardCoins'),'textContent',String(s.rewardsGranted ? config.coinReward : 0));
  setProperty($('rewardStamina'),'textContent',String(s.rewardsGranted ? config.staminaReward : 0));
  const duration=(ms:number)=>`${Math.floor(ms/60000).toString().padStart(2,'0')}:${Math.floor(ms/1000%60).toString().padStart(2,'0')}`;
  setProperty($('resultChop'),'textContent',String(s.chopReps));setProperty($('resultLoad'),'textContent',String(s.loadReps));
  setProperty($('resultCarry'),'textContent',(s.carryActiveMs/1000).toFixed(1));setProperty($('resultActive'),'textContent',duration(s.exerciseActiveMs));setProperty($('resultElapsed'),'textContent',duration(s.sessionElapsedMs));
  const cameraUsed=sourceManager.usedModes.has('camera'),keyboardUsed=sourceManager.usedModes.has('keyboard');
  const provenance=cameraUsed?(keyboardUsed?`混合输入：摄像头姿态代理 + ${demoUsed?'自动模拟':'键盘演示输入'}`:'摄像头姿态代理（非负载/健康测量）'):demoUsed?'含自动模拟（复用键盘模拟协议）':'键盘模拟';
  setProperty($('actualMetrics'),'textContent',`挥砍 ${s.chopReps} 次 · 装车 ${s.loadReps} 次 · 有效持姿 ${(s.carryActiveMs / 1000).toFixed(1)} 秒 · 任务有效时间 ${(s.exerciseActiveMs / 1000).toFixed(1)} 秒 · 本局经过时间（含休息/暂停）${(s.sessionElapsedMs / 1000).toFixed(1)} 秒 · 输入：${provenance}`);
  setProperty($('systemStatus'),'textContent',displayError || `会话 ${s.sessionId} · ${status}`);
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
    clearCameraTrackingRecovery();upperCalibrationWasSaved=false;
    cancelCameraAutoStart();cameraEntryOwnsPause=false;
    cameraPreparation=false;displayError='';cameraInput.clearProfile();sourceManager.resetHistory();
    demoEnabled = preferredDemo;demoUsed = false;preview.setEnabled(demoEnabled);void autoInput.stop();
    planDismissed = false; $('exitModal').hidden = true; void cameraPanel.stop();
  }
  if(e.kind==='rewards-granted'){clearCameraTrackingRecovery();upperCalibrationWasSaved=false;cameraPreparation=false;void cameraPanel.stop();}
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
$('acceptPlan').addEventListener('click', () => {if(!renderUnavailable)controller.command({kind:'open-setup',mode:'keyboard'});});
$('viewLeft').addEventListener('click',()=>game.rotate(-1));$('viewRight').addEventListener('click',()=>game.rotate(1));$('viewReset').addEventListener('click',()=>game.resetView());
$('viewCastle').addEventListener('click',()=>game.focusCastle());
for(const id of ['tutorialOpen','planTutorial','setupTutorial','resultsTutorial'])$(id).addEventListener('click',()=>tutorial.open(current.task??'chop',running(current)));
$('audioToggle').addEventListener('click',async()=>{await audio.setEnabled(!audio.enabled);panel(controller.getSnapshot());});
$('backHome').addEventListener('click', () => controller.command({kind:'reset'}));
$('cameraMode').addEventListener('click',openCameraPreparation);
$('recognitionLeniency').addEventListener('change',()=>applyRecognitionLeniency(Number($<HTMLInputElement>('recognitionLeniency').value)));
for(const button of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-leniency]')))button.addEventListener('click',()=>applyRecognitionLeniency(Number(button.dataset.leniency)));
for (const id of ['demoToggle', 'setupDemoToggle']) $(id).addEventListener('click', () => setDemo(!demoEnabled));
$('cameraExerciseMode').addEventListener('change',()=>{
  clearCameraTrackingRecovery();upperCalibrationWasSaved=false;
  cancelCameraAutoStart();cameraEntryOwnsPause=false;if(running(current))pauseForUser();
  upperBodyMode=$<HTMLSelectElement>('cameraExerciseMode').value==='upper-body';cameraInput.clearProfile();cameraPreparationPanel.reset(true,'exercise-mode-changed');
  cameraPanel.setUpperBodyEnabled(upperBodyMode);
  if(current.inputMode==='camera'){controller.command({kind:'camera-readiness',ready:false});if(running(current))cameraPreparation=true;}
  void cameraPanel.stop();panel(controller.getSnapshot());
});
$('cameraStart').addEventListener('click',async()=>{
  if(renderUnavailable)return;clearCameraTrackingRecovery();upperCalibrationWasSaved=false;const ownsUserPause=cameraEntryOwnsPause;
  setDemo(false);controller.command({kind:'switch-source',mode:'camera'});
  const generation=++cameraStartGeneration,sessionId=current.sessionId;await cameraPanel.start();
  if(generation===cameraStartGeneration&&upperBodyMode&&current.sessionId===sessionId&&$<HTMLVideoElement>('cameraVideo').srcObject&&!animationsStopped){cameraAutoStart={sessionId,ownsUserPause};cameraAutoReadyAt=null;}
});
$('cameraStop').addEventListener('click', () => { cancelCameraAutoStart();void cameraPanel.stop(); });
$('beginDemo').addEventListener('click', () => {
  if(renderUnavailable)return;
  switchKeyboard();if(current.phase==='setup')controller.command({kind:'setup-ready'});
});
$('useKeyboard').addEventListener('click',switchKeyboard);
$('recalibrate').addEventListener('click',()=>requireCameraPreparation('请重新采集标定'));
function beginCameraTraining(automatic=false):void{
  if(renderUnavailable)return;
  const manualSetupStart=!automatic&&current.phase==='setup'&&!document.hidden;
  const permit=cameraAutoStart;
  const resumePreparationPause=!automatic&&cameraEntryOwnsPause&&!animationsStopped&&!tutorial.isOpen&&!document.hidden;
  if(automatic&&(!permit||permit.sessionId!==current.sessionId||current.inputMode!=='camera'||animationsStopped||tutorial.isOpen||document.hidden||current.pauseReasons.some(reason=>reason!=='user'||!permit.ownsUserPause)))return;
  if(!hasCameraProfile())return;
  try{
    if(!applyCameraProfile())return;clearCameraTrackingRecovery();cancelCameraAutoStart();cameraEntryOwnsPause=false;cameraPreparation=false;displayError='';
    controller.command({kind:'switch-source',mode:'camera'});
    controller.command({kind:'camera-readiness',ready:true});
    if(current.phase==='setup'){
      controller.command({kind:'setup-ready',calibrated:{chop:true,load:true,carry:true}});
      if(manualSetupStart)controller.command({kind:'resume',reason:'visibility'});
    }
    else{controller.command({kind:'resume',reason:'tracking'});controller.command({kind:'resume',reason:'source-error'});}
    if(automatic&&permit?.ownsUserPause||resumePreparationPause)controller.command({kind:'resume',reason:'user'});
  }catch(error){displayError=`标定不可用：${error instanceof Error?error.message:String(error)}。请重做标定或切换键盘。`;$('cameraStatus').textContent=displayError;}
}
for(const id of ['beginCamera','finishUpperPreparation'])$(id).addEventListener('click',()=>beginCameraTraining());
$('resetBtn').addEventListener('click', () => {stopHold();controller.command({kind:'reset'});});
for(const button of animationStopButtons)button.addEventListener('click',()=>setAnimationsStopped(!animationsStopped));
$('resultsHome').addEventListener('click',()=>{stopHold();controller.command({kind:'reset'});});
$('pauseBtn').addEventListener('click',()=>{
  if(renderUnavailable)return;
  stopHold();
  if (current.pauseReasons.includes('visibility')) controller.command({kind:'resume',reason:'visibility'});
  else if(current.pauseReasons.includes('user'))controller.command({kind:'resume',reason:'user'});
  else pauseForUser();
});
const actionBtn=$('actionBtn') as HTMLButtonElement;
$('cancelExit').addEventListener('click', () => {
  $('exitModal').hidden = true;
  game.setInteractionEnabled($('tutorialModal').hidden&&$('setupModal').hidden&&$('resultsModal').hidden&&!renderUnavailable);
  if (!renderUnavailable&&!exitWasUserPaused) controller.command({ kind: 'resume', reason: 'user' });
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
  const target=e.target;
  const editing=target instanceof HTMLElement&&(target.isContentEditable||target.matches('input, textarea, select'));
  if(e.code==='KeyP'&&e.shiftKey&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!e.repeat&&!editing){e.preventDefault();setAnimationsStopped(!animationsStopped);return;}
  if(tutorial.isOpen)return;
  if (e.code === 'Escape' && !e.repeat && ['active', 'countdown', 'rest'].includes(current.phase)) {
    e.preventDefault();
    if (!$('exitModal').hidden) return;
    exitWasUserPaused = current.pauseReasons.includes('user');
    stopHold();pauseForUser();
    $('exitModal').hidden = false;game.setInteractionEnabled(false); $('cancelExit').focus(); return;
  }
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
  if(renderUnavailable){requestAnimationFrame(animate);return;}
  // Readiness can expire without another frame, including during rest/countdown.
  monitorUpperBodyTracking();
  if(current.inputMode==='camera'&&running(current)&&!cameraPreparation&&!cameraTrackingRecovery&&!hasCameraProfile()){
    handleCameraTrackingLoss('关键点或标定已失效，请重新准备',true);
  }
  controller.tick(now);
  cameraInput.tick(now);
  if(cameraAutoStart){
    if(cameraAutoStart.sessionId!==current.sessionId||current.inputMode!=='camera'||!['setup','countdown','active','rest'].includes(current.phase))cancelCameraAutoStart();
    else if(!hasCameraProfile())cameraAutoReadyAt=null;
    else if(animationsStopped||tutorial.isOpen||document.hidden||current.pauseReasons.some(reason=>reason!=='user'||!cameraAutoStart?.ownsUserPause)){
      cancelCameraAutoStart();upperBodyPanel.setStartMessage('准备完成，保留当前暂停。请手动开始或继续。');
    }else{
      cameraAutoReadyAt??=now;upperBodyPanel.setStartMessage(`准备完成，${Math.max(0,Math.ceil((3000-now+cameraAutoReadyAt)/1000))} 秒后进入训练。`);
      if(now-cameraAutoReadyAt>=3000)beginCameraTraining(true);
    }
  }
  if(previousFrameMs&&now>previousFrameMs){frameIntervals.push(now-previousFrameMs);if(frameIntervals.length>120)frameIntervals.shift();}previousFrameMs=now;
  if(now-diagnosticAtMs>=500){
    diagnosticAtMs=now;const debug=cameraInput.getDebug(),sorted=[...frameIntervals].sort((a,b)=>a-b);
    const p95=sorted[Math.floor(sorted.length*.95)]??0;
    $('inputDebug').textContent=`${current.inputMode} · ${current.taskRunId??'无任务实例'} · epoch ${current.sourceEpoch} · ${debug.phase} · ${debug.reason??'等待/有效输入'}\n游戏帧间隔 p95 ${p95.toFixed(1)}ms（最近120帧，非端到端延迟）${current.inputMode==='camera'?`\n${$('cameraMetrics').textContent}\n${$('calibrationFeatures').textContent}`:''}`;
  }
  preview.update(now, current);
  movementGuide.update(now);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
window.addEventListener('pagehide', () => { movementGuide.dispose();tutorial.dispose();gamePreview.dispose();void audio.dispose();void sourceManager.dispose();void cameraInput.dispose();void cameraPanel.dispose(); void input.dispose(); void autoInput.dispose(); preview.dispose(); controller.dispose(); game.destroy(true); });
// Start once per page load. Reset/results return home without starting another run.
// Renderer initialization reports failure in an earlier microtask, before this gate.
const startDefaultDemo=()=>{
  if(tutorialOpened||animationsStopped||!demoEnabled||renderUnavailable||current.phase!=='home'||current.sessionId!==initialSessionId)return;
  controller.command({kind:'open-setup',mode:'keyboard'});
  controller.command({kind:'setup-ready'});
  if(document.hidden)controller.command({kind:'pause',reason:'visibility'});
};
if(game.ready){
 game.ready.then(()=>{if(renderFailed)return;renderUnavailable=false;panel(controller.getSnapshot());startDefaultDemo();})
  .catch(()=>{/* FarmWorld reports an explicit error; failed assets keep the start gate closed. */});
}else queueMicrotask(startDefaultDemo);
// A dynamic entry must not expose the static buttons before all handlers exist.
document.body.inert=false;document.body.dataset.boot='ready';
