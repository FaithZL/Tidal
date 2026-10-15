import type { RecognitionProfile } from './types.js';
import type { PoseFeatures } from '../features.js';
import type { LoadPhase } from '../../domain/types.js';
import { RepRecognizer } from './repRecognizer.js';
import { recognitionConfig, type RecognitionConfig } from '../../config/recognitionConfig.js';
export class LoadRecognizer extends RepRecognizer {
  private readonly stand;
  private readonly kneeTravel: number;
  private readonly hipTravel: number;
  private readonly pressTravel: number;
  constructor(profile: RecognitionProfile,config:RecognitionConfig=recognitionConfig){
    super(profile,config);this.stand=this.example('load-stand');const squat=this.example('load-squat');this.example('load-return');
    this.kneeTravel=this.stand.kneeDeg-squat.kneeDeg;this.hipTravel=this.stand.hipHeight-squat.hipHeight;
    this.pressTravel=this.stand.wrist.y-this.example('load-press').wrist.y;
    if(this.kneeTravel<config.minSquatFlexionDeg||this.hipTravel<config.minSquatHipTravel||this.pressTravel<config.minPressTravelTorso)throw new Error('Load calibration is not separable');
  }
  private transition(phase:LoadPhase,progress:number):void {this.phase=phase;this.events.push({kind:'phase',task:'load',repId:this.repId,phase,progress});}
  protected advance(f:PoseFeatures,time:number):void {
    if(this.expired(time,this.config.loadMaxCycleMs))return;
    const s=f.sides[this.profile.calibration.primarySide]!,c=this.config;
    const flex=(this.stand.kneeDeg-s.kneeDeg)/this.kneeTravel,hip=(this.stand.hipHeight-f.hipHeight)/this.hipTravel;
    const upright=flex<=c.repReturnRatio&&hip<=c.repReturnRatio;
    const rest=Math.hypot(s.wrist.x-this.stand.wrist.x,s.wrist.y-this.stand.wrist.y)<=c.returnWristTolerance;
    const overhead=(this.stand.wrist.y-s.wrist.y)/this.pressTravel>=c.repEnterRatio;
    if(this.phase==='unready'){
      if(this.confirm('ready',upright&&rest,time)){this.repId++;this.transition('ready',0);}
    }else if(this.phase==='ready'){
      if(this.confirm('squat',flex>=c.repEnterRatio&&hip>=c.repEnterRatio,time)){this.cycleStart=time;this.transition('squat-down',.25);}
    }else if(this.phase==='squat-down'){
      const pressConfirmed=this.confirm('press',upright&&overhead,time);
      if(!this.confirm('stand',upright,time))return;
      this.transition('stand-up',.5);
      // Overhead may already be true: retain legal order without a chest-height pause.
      if(pressConfirmed){this.transition('press-up',.75);this.events.push({kind:'impact',task:'load',repId:this.repId});}
    }else if(this.phase==='stand-up'){
      if(this.confirm('press',upright&&overhead,time)){this.transition('press-up',.75);this.events.push({kind:'impact',task:'load',repId:this.repId});}
    }else{
      if(this.phase==='press-up'&&upright&&rest)this.transition('load-return',1);
      if(this.confirm('return',upright&&rest,time)){
        if(time-this.cycleStart!>=c.loadMinCycleMs)this.events.push({kind:'rep-completed',task:'load',repId:this.repId});
        this.clearCycle();
      }
    }
  }
}
