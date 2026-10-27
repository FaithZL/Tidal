import {UpperBodyPreparation} from '../pose/upperBody.js';
import type {PoseFrame} from '../pose/types.js';
import {setProperty} from './domUpdates.js';

/** In-memory preparation and instructions only; the browser owns permission to start a session. */
export class UpperBodyPreparationPanel{
 private readonly preparation=new UpperBodyPreparation(undefined,3000,true,2);
 private active=false;
 private startMessage='';
 private suspendNotice='';
 constructor(private readonly root:HTMLElement){this.render();}
 activate():void{this.active=true;this.startMessage='';this.suspendNotice='';this.preparation.reset('camera-start');this.render();}
 accept(frame:PoseFrame):void{if(this.active){this.preparation.accept(frame,performance.now());this.render();}}
 tick(nowMs:number):void{if(this.active){this.preparation.tick(nowMs);this.render();}}
 reset(close=false,reason='manual-reset'):void{this.preparation.reset(reason);this.startMessage='';this.suspendNotice='';if(close)this.active=false;this.render();}
 dispose():void{this.reset(true);}
 hasIncompleteCheckpoint():boolean{const step=this.preparation.getSnapshot().step;return this.active&&(step==='raised'||step==='hold');}
 setSuspendNotice(message:string):void{this.suspendNotice=message;this.render();}
 getSavedProfile(){return this.preparation.getSavedProfile();}
 hasSavedProfile():boolean{return this.getSavedProfile()!==null;}
 getTrackingState(){return this.preparation.getSnapshot();}
 suspendTracking(reason:string):void{this.preparation.suspendTracking(reason);this.startMessage='';this.suspendNotice=['window-blur','page-hidden','page-visible','visibility'].includes(reason)?'追踪已暂停，标定已保存；重新入镜后请手动继续。':'';this.render();}
 getProfile(){return this.preparation.getProfile();}
 startTraining():boolean{const started=this.preparation.startTraining();this.render();return started;}
 getFeedback(){return this.active?this.preparation.getFeedback():null;}
 setStartMessage(message:string):void{if(message===this.startMessage)return;this.startMessage=message;this.render();}
 private node<T extends HTMLElement>(id:string):T{const node=this.root.querySelector<T>(`#${id}`);if(!node)throw new Error(`Missing upper body preparation ${id}`);return node;}
 private render():void{
  const s=this.preparation.getSnapshot(),names={lowered:'放下双手',raised:'双手举起',hold:'双臂前举',complete:'准备完成'};
  const cues={lowered:'坐稳或站稳，双手停在肩下、胸腹前，手腕留在画面内，保持片刻。',raised:'双手举到舒适的肩上高度，手腕留在镜头内，保持片刻。',hold:'双手向前，保持舒适屈臂持姿；与刚才上举、放下姿态区分。',complete:'两步动作已保存，自动进入训练，无需点击开始；摄像头继续识别。'};
  const issues:Record<string,string>={'revalidating':'正在用新观测重新确认当前追踪','low-confidence':'肩、肘或手腕不够清晰，请让六个关节保持可见','out-of-frame':'请把双肩、双肘和双手都放进镜头','missing-points':'等待肩、肘和手腕入镜','person-moved':'机位或身体位置变化，请重新准备','gap':'采样断档，重新准备','stale':'视频没有新数据，请保持镜头有效','unstable':'姿态有变化，请保持片刻','not-lowered':'请将双手放下到肩膀下方，手腕仍留在画面内','insufficient-raise-range':'请将双手一起举到舒适的肩上高度，并与刚才放下的位置区分','hold-not-separable':'双臂前举持姿需与刚才举起、放下的位置区分','small-shoulders':'双肩距离过小，请调整机位让上半身清晰可见','degenerate-arm':'肩、肘或手腕重合，请调整手臂角度','visibility':'页面失焦或进入后台，当前不计次也不计时','window-blur':'窗口失焦，当前不计次也不计时','page-hidden':'页面进入后台，当前不计次也不计时','page-visible':'页面已返回，等待重新看清上半身','out-of-order':'关键点帧重复或乱序，请等待新数据重新准备','resized':'画面尺寸变化，请重新准备','future':'采集时间异常，请重新准备','invalid-data':'关键点或时间数据无效，请等待新数据'};
  setProperty(this.root.dataset,'step',s.step);
  setProperty(this.root.dataset,'recovering',String(s.recovering));
  setProperty(this.root.dataset,'ready',String(s.ready));
  setProperty(this.root.dataset,'revalidating',String(s.revalidating));
  setProperty(this.root.dataset,'training',String(s.training));
  setProperty(this.node('upperBodyStepCount'),'textContent',`已完成 ${s.completedSteps}/${s.totalSteps}`);
  setProperty(this.node('upperBodyStep'),'textContent',s.training?'本局标定已保存':s.revalidating?'标定已保存':names[s.step]);
  setProperty(this.node('upperBodyCue'),'textContent',s.training?'本局沿用已保存的动作，砍树、装车和拉车均按实际动作计数，无需重复两步准备。':s.revalidating?'请回到原位置和原距离，让肩、肘和双手入镜，稳定约1.2秒即可继续。需要更换位置时，可停止摄像头后重新开启准备。':s.step==='complete'&&this.startMessage?`两步动作已保存。${this.startMessage} 摄像头继续识别。`:cues[s.step]);
  setProperty(this.node('upperBodyProgress'),'hidden',s.training);
  setProperty(this.node<HTMLProgressElement>('upperBodyProgress'),'value',s.ready?1:s.progress);
  const issue=s.reason==='recovery-timeout'?'上半身数据中断超过3秒，请从放下双手重新准备':s.revalidating&&s.reason==='person-moved'?'肩部位置或距离与准备时不匹配，请回到原位置；两步标定已保留':s.reason?issues[s.reason]??'请按当前动作提示调整并保持稳定。':'';
  const runtimeIssues:Record<string,string>={...issues,'revalidating':'等待新的有效上半身关键点','person-moved':'请回到准备时的位置和距离','gap':'画面数据暂时中断，等待新画面','out-of-order':'画面数据重复或乱序，等待新画面','resized':'画面尺寸与准备时不一致，等待原尺寸画面','future':'采集时间异常，等待有效新画面'};
  const runtimeIssue=s.reason?runtimeIssues[s.reason]??'等待新的有效上半身关键点':'等待新的有效上半身关键点';
  setProperty(this.node('upperBodyReason'),'textContent',!this.active?'点击开启摄像头后，按提示自动采集，无需点击每一步。':s.training?s.ready?'本局标定已保存，继续按实际动作计数。':`${runtimeIssue}；本局标定已保存，当前不计次、不计时。有效画面恢复后即可继续，无需重复准备。`:s.revalidating?`${issue?`${issue}；`:''}标定已保存 2/2，追踪恢复 ${Math.round(s.progress*100)}%，当前不计次、不计时。`:s.recovering?`${issue}；已保留 ${s.completedSteps}/${s.totalSteps}，本步暂停（最多3秒），恢复后重新保持本步。`:issue||(!s.available?'等待上半身有效关键点；不要求腿部入镜。':s.step==='complete'?'准备期间不计次数。':`正在观察 · ${Math.round(s.progress*100)}% · 保持姿态即可自动采集`));
  this.renderDiagnostics();
 }

 private renderDiagnostics():void{
  const d=this.preparation.getDiagnostics(),total=this.preparation.getSnapshot().totalSteps;
  if(this.suspendNotice&&this.preparation.getSnapshot().completedSteps===0)this.suspendNotice='准备尚未完成，请按当前提示完成两步。';
  setProperty(this.node('upperBodySuspendNotice'),'textContent',this.suspendNotice);
  const reasons:Record<string,string>={'window-blur':'窗口失焦','page-hidden':'页面进入后台','page-visible':'页面返回前台','manual-reset':'手动重新准备','camera-start':'重新开启摄像头','camera-stop':'停止摄像头','camera-restart':'重新开启摄像头','exercise-mode-changed':'切换训练方案','render-error':'场景错误','tracking':'跟踪失效','source-error':'摄像头或推理中断','visibility':'页面失焦或进入后台','recovery-timeout':'有效数据中断超过3秒','person-moved':'身体或机位变化','resized':'画面尺寸变化','out-of-order':'帧重复或乱序','invalid-data':'数据异常','future':'采样时间异常','stale':'视频没有新数据','gap':'采样断档','low-confidence':'关节不清晰','out-of-frame':'关节出框','missing-points':'缺少关节','degenerate-arm':'关节重合'};
  const reset=this.node('upperBodyLastReset');
  setProperty(reset,'hidden',!d.lastReset);
  setProperty(reset,'textContent',d.lastReset?`最近重新准备：${reasons[d.lastReset.reason]??'准备条件失效'} · ${d.lastReset.completedSteps}/${total} → 0/${total}`:'');
  const quality:Record<string,string>={usable:'可用','low-confidence':'不清晰','out-of-frame':'出框',missing:'未检测到',invalid:'数据异常',stale:'等待新帧'};
  setProperty(this.node('upperBodyJointQuality'),'textContent',d.joints.map(j=>`${j.label}：${quality[j.state]}${j.confidence===null?'':` ${Math.round(j.confidence*100)}%`}`).join(' · '));
  const training=this.preparation.getSnapshot().training;
  setProperty(this.node('upperBodySampleStatus'),'textContent',training?'本局动作模板已保存，不再重复采集准备姿态。':`本步新样本 ${d.sampleCount} · 已观察 ${Math.round(d.observedMs)} / 1200 毫秒（至少12个样本）`);
  setProperty(this.node('upperBodyHoldGate'),'hidden',true);
  setProperty(this.node('upperBodyHoldGate'),'textContent','');
  setProperty(this.node('upperBodySampleRejection'),'hidden',training);
  const rejected=d.lastSampleRejection;
  setProperty(this.node('upperBodySampleRejection'),'textContent',rejected?`最近本步采集未通过：${rejected.reason==='unstable'?'姿态或机位不稳定':'持姿区分不足'}，${rejected.sampleCount}个样本 / ${Math.round(rejected.observedMs)}毫秒。${rejected.reason==='unstable'?'':`窗口变化半径 ${rejected.radius.toFixed(3)}，本次所需区分门槛 ${rejected.limit.toFixed(3)}。`}`:'');
 }
}
