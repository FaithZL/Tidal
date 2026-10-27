import type { RecognitionProfile } from './types.js';
import type { PoseFeatures } from '../features.js';
import { RepRecognizer } from './repRecognizer.js';
import { recognitionConfig, type RecognitionConfig } from '../../config/recognitionConfig.js';
export class ChopRecognizer extends RepRecognizer {
  protected readonly feedbackTask = 'chop' as const;
  private readonly raisedY: number;
  private readonly travel: number;
  constructor(profile: RecognitionProfile, config: RecognitionConfig = recognitionConfig) {
    super(profile,config);this.raisedY=this.example('chop-raised').wrist.y;
    this.travel=this.example('chop-down').wrist.y-this.raisedY;
    if(this.travel<config.minChopTravelTorso)throw new Error('Chop calibration is not separable');
  }
  protected advance(f: PoseFeatures,time:number):void {
    if(this.expired(time,this.config.chopMaxCycleMs))return;
    const q=(f.sides[this.profile.calibration.primarySide]!.wrist.y-this.raisedY)/this.travel;
    const up=q<=this.config.repReturnRatio,down=q>=this.config.repEnterRatio;
    if(this.phase==='unready'){
      if(this.confirm('ready',up,time)){this.repId++;this.phase='ready';this.events.push({kind:'phase',task:'chop',repId:this.repId,phase:'ready',progress:0});}
    }else if(this.phase==='ready'){
      if(this.confirm('down',down,time)){
        this.phase='chop-down';this.cycleStart=time;
        this.events.push({kind:'phase',task:'chop',repId:this.repId,phase:'chop-down',progress:.5},{kind:'impact',task:'chop',repId:this.repId});
      }
    }else{
      if(this.phase==='chop-down'&&!down){this.phase='chop-return';this.events.push({kind:'phase',task:'chop',repId:this.repId,phase:'chop-return',progress:1});}
      if(this.confirm('return',up,time)){
        if(time-this.cycleStart!>=this.config.chopMinCycleMs)this.events.push({kind:'rep-completed',task:'chop',repId:this.repId});
        this.clearCycle();
      }
    }
  }
}
