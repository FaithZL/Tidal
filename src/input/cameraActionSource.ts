import type { ActionSource } from './types.js';
import type { InputContext, ExerciseSignal } from '../domain/types.js';
import type { PoseFrame } from '../pose/types.js';
import type { RecognitionProfile,Recognizer,RecognitionEvent } from '../pose/recognizers/types.js';
import {ChopRecognizer} from '../pose/recognizers/chopRecognizer.js';
import {LoadRecognizer} from '../pose/recognizers/loadRecognizer.js';
import {CarryRecognizer} from '../pose/recognizers/carryRecognizer.js';
import {UpperBodyRecognizer} from '../pose/recognizers/upperBodyRecognizer.js';
import type {UpperBodyProfile} from '../pose/upperBody.js';
import {createRecognitionConfig,recognitionConfig,type RecognitionConfig} from '../config/recognitionConfig.js';
export class CameraActionSource implements ActionSource {
  readonly mode='camera' as const;
  private profile:RecognitionProfile|null=null;
  private upperBodyProfile:UpperBodyProfile|null=null;
  private recognizer:Recognizer|null=null;
  private context:InputContext|null=null;
  private emit:((e:ExerciseSignal)=>void)|null=null;
  private seq=0;
  private startedAt=0;
  private lastFrameAt=0;
  private reason:string|null=null;
  private config:RecognitionConfig;
  constructor(private readonly now:()=>number=()=>performance.now(),config:RecognitionConfig=recognitionConfig){this.config=createRecognitionConfig(config);}
  setRecognitionConfig(config:RecognitionConfig):void{
    const next=createRecognitionConfig(config);
    if((Object.keys(next) as (keyof RecognitionConfig)[]).every(key=>next[key]===this.config[key]))return;
    this.clearProfile();this.config=next;
  }
  setProfile(profile:RecognitionProfile):void{
    this.clearProfile();
    // Validate every task before allowing a full camera session to start.
    new ChopRecognizer(profile,this.config);new LoadRecognizer(profile,this.config);new CarryRecognizer(profile,this.config);
    this.profile=structuredClone(profile);this.reason=null;
  }
  setUpperBodyProfile(profile:UpperBodyProfile):void{
    this.clearProfile();
    new UpperBodyRecognizer(profile,'chop',this.config);new UpperBodyRecognizer(profile,'load',this.config);new UpperBodyRecognizer(profile,'carry',this.config);
    this.upperBodyProfile=structuredClone(profile);this.reason=null;
  }
  clearProfile():void{this.profile=null;this.upperBodyProfile=null;void this.stop();}
  async start(context:InputContext,emit:(e:ExerciseSignal)=>void):Promise<void>{
    void this.stop();if(!this.profile&&!this.upperBodyProfile)throw new Error('需要完成有效标定后才能开始摄像头训练');
    this.context={...context};this.emit=emit;this.startedAt=this.now();this.lastFrameAt=this.startedAt;this.reason=null;
    this.recognizer=this.upperBodyProfile?new UpperBodyRecognizer(this.upperBodyProfile,context.task,this.config):
      context.task==='chop'?new ChopRecognizer(this.profile!,this.config):context.task==='load'?new LoadRecognizer(this.profile!,this.config):new CarryRecognizer(this.profile!,this.config);
  }
  private signal(event:RecognitionEvent,time:number):void{
    if(this.context&&this.emit)this.emit({...this.context,...event,seq:++this.seq,capturedAtMs:time} as ExerciseSignal);
  }
  accept(frame:PoseFrame,nowMs=this.now()):void{
    const context=this.context,r=this.recognizer;if(!context||!r||frame.capturedAtMs<this.startedAt)return;
    const events=r.update(frame,nowMs);this.lastFrameAt=frame.capturedAtMs;
    for(const event of events){
      if(this.context!==context)break;
      if(event.kind==='tracking'&&event.status!=='ready'){
        this.reason=event.message??'跟踪丢失，请重新标定';this.profile=null;this.upperBodyProfile=null;this.recognizer=null;
        // Invalid/future frame timestamps must not prevent the controller receiving the loss signal.
        this.signal(event,nowMs);
      }else this.signal(event,frame.capturedAtMs);
    }
  }
  tick(nowMs:number):void{
    if(!this.context||!this.recognizer||nowMs-this.lastFrameAt<=this.config.trackingMaxAgeMs)return;
    this.reason='关键点已过期，请重新标定';this.profile=null;this.upperBodyProfile=null;this.recognizer.reset();this.recognizer=null;
    this.signal({kind:'tracking',status:'lost',message:this.reason},nowMs);
  }
  async stop():Promise<void>{this.context=null;this.emit=null;this.seq=0;this.recognizer?.reset();this.recognizer=null;}
  async dispose():Promise<void>{this.clearProfile();}
  getDebug(){return this.recognizer?.getDebug()??{phase:'stopped',reason:this.reason};}
  getFeedback(){return this.recognizer?.getFeedback()??null;}
}
