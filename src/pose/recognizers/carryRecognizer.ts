import type { RecognitionProfile, RecognitionEvent, Recognizer } from './types.js';
import type { PoseFrame } from '../types.js';
import type { CalibrationExample } from '../calibrationSession.js';
import { extractFeatures, type PoseFeatures } from '../features.js';
import { FeatureStream } from './featureStream.js';
import { recognitionConfig, type RecognitionConfig } from '../../config/recognitionConfig.js';
const vector=(e:CalibrationExample)=>[e.wrist.x,e.wrist.y,e.elbowDeg/180,e.kneeDeg/180,e.hipHeight];
const rms=(a:readonly number[],b:readonly number[])=>Math.hypot(...a.map((v,i)=>v-b[i]))/Math.sqrt(a.length);
export class CarryRecognizer implements Recognizer {
  private readonly profile:RecognitionProfile;
  private readonly stream:FeatureStream;
  private readonly hold:number[];
  private readonly release:number[];
  private readonly separation:number;
  private candidate:number|null=null;
  private holding=false;
  private reason:string|null=null;
  constructor(profile:RecognitionProfile,private readonly config:RecognitionConfig=recognitionConfig){
    this.profile=structuredClone(profile);this.stream=new FeatureStream(this.profile.calibration,config);
    const hold=this.profile.examples['carry-hold'],release=this.profile.examples['carry-release'];
    if(!hold||!release)throw new Error('Missing Carry calibration');
    this.hold=vector(hold);this.release=vector(release);this.separation=rms(this.hold,this.release);
    const limit=Math.max(config.minPoseSeparation,config.minCarrySeparation/Math.sqrt(5),config.carryNoiseMultiplier*(hold.radius+release.radius)/Math.sqrt(5));
    if(![...this.hold,...this.release,hold.radius,release.radius].every(Number.isFinite)||hold.radius<0||release.radius<0||this.separation<=limit)throw new Error('Carry calibration is not separable');
  }
  private distances(f:PoseFeatures):{hold:number;release:number}{
    const s=f.sides[this.profile.calibration.primarySide]!;
    const v=vector({...s,hipHeight:f.hipHeight,radius:0});return {hold:rms(v,this.hold),release:rms(v,this.release)};
  }
  update(frame:PoseFrame,nowMs=frame.capturedAtMs):readonly RecognitionEvent[]{
    const f=this.stream.read(frame,nowMs);
    if(!f){this.holding=false;this.candidate=null;this.reason=this.stream.reason;return [
      {kind:'hold-sample',task:'carry',holding:false,valid:false},{kind:'tracking',status:'lost',message:this.reason??'invalid-pose'}];}
    const smooth=this.distances(f),raw=this.distances(extractFeatures(frame,this.profile.calibration,this.config)!);
    const inside=(d:typeof smooth,ratio:number)=>d.hold<=ratio*this.separation&&d.hold<d.release;
    if(this.holding){
      if(!inside(raw,this.config.holdExitRatio)||!inside(smooth,this.config.holdExitRatio)){this.holding=false;this.candidate=null;}
    }else if(inside(raw,this.config.holdEnterRatio)&&inside(smooth,this.config.holdEnterRatio)){
      this.candidate??=frame.capturedAtMs;
      if(frame.capturedAtMs-this.candidate>=this.config.holdConfirmMs)this.holding=true;
    }else this.candidate=null;
    this.reason=null;return [{kind:'tracking',status:'ready'},{kind:'hold-sample',task:'carry',holding:this.holding,valid:true}];
  }
  reset():void{this.stream.reset();this.holding=false;this.candidate=null;this.reason=null;}
  getDebug(){return {phase:this.holding?'holding':this.candidate===null?'released':'confirming',reason:this.reason};}
}
