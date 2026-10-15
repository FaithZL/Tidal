import type {GameEffect} from '../domain/types.js';
export class AudioFeedback {
  enabled=false;
  error='';
  private context:AudioContext|null=null;
  private generation=0;
  private disposed=false;
  private readonly sounds=new Set<{osc:OscillatorNode;gain:GainNode}>();
  constructor(private readonly factory:()=>AudioContext=()=>new AudioContext()){}
  async setEnabled(value:boolean):Promise<boolean>{
    const generation=++this.generation;this.enabled=false;
    if(!value||this.disposed){this.silence();return false;}
    try{
      this.context??=this.factory();await this.context.resume();
      if(generation!==this.generation||this.disposed)return false;
      this.enabled=this.context.state==='running';
      this.error=this.enabled?'':'音效不可用，可继续无声演示';
    }catch{if(generation===this.generation)this.error='音效不可用，可继续无声演示';}
    return this.enabled;
  }
  private silence():void{
    for(const sound of this.sounds){sound.osc.onended=null;try{sound.osc.stop();}catch{/* Already stopped. */}sound.osc.disconnect();sound.gain.disconnect();}
    this.sounds.clear();
  }
  handle(effect:GameEffect):void{
    const context=this.context;if(!this.enabled||!context||context.state!=='running'||this.sounds.size>=8)return;
    const note=effect.kind==='action-impact'?180:effect.kind==='tree-felled'?110:effect.kind==='log-loaded'?330:effect.kind==='rewards-granted'?660:effect.kind==='task-changed'&&effect.phase==='active'?440:null;
    if(note===null)return;
    try{
      const osc=context.createOscillator(),gain=context.createGain(),sound={osc,gain};this.sounds.add(sound);
      osc.type='sine';osc.frequency.setValueAtTime(note,context.currentTime);osc.connect(gain);gain.connect(context.destination);
      gain.gain.setValueAtTime(.06,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.16);
      osc.onended=()=>{osc.disconnect();gain.disconnect();this.sounds.delete(sound);};osc.start();osc.stop(context.currentTime+.18);
    }catch{this.enabled=false;this.error='音效不可用，可继续无声演示';this.silence();}
  }
  async dispose():Promise<void>{
    if(this.disposed)return;this.disposed=true;this.generation++;this.enabled=false;this.silence();
    const context=this.context;this.context=null;try{await context?.close();}catch{/* Closing audio must not block game cleanup. */}
  }
}
