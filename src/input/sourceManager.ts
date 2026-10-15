import type { ActionSource } from './types.js';
import type { InputContext, ExerciseSignal, InputMode } from '../domain/types.js';
export class SourceManager {
  readonly usedModes=new Set<InputMode>();
  private current:ActionSource|null=null;
  private generation=0;
  private stopped:Promise<void>=Promise.resolve();
  async switchTo(source:ActionSource|null,context:InputContext|null,emit:(e:ExerciseSignal)=>void):Promise<void>{
    const generation=++this.generation,old=this.current;this.current=null;
    // Serialize resource stops, but never wait on a superseded start Promise.
    const stopping=this.stopped.then(()=>old?.stop());this.stopped=stopping.then(()=>{},()=>{});
    await stopping;
    if(generation!==this.generation||!source||!context)return;
    this.current=source;
    try{
      await source.start({...context},e=>{if(generation===this.generation&&this.current===source)emit(e);});
      if(generation===this.generation)this.usedModes.add(source.mode);
    }catch(error){
      if(generation!==this.generation)return;
      this.current=null;await source.stop();throw error;
    }
  }
  resetHistory():void{this.usedModes.clear();}
  async dispose():Promise<void>{await this.switchTo(null,null,()=>{});}
}
