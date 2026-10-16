import { createSessionController, inputContext } from '../../src/domain/sessionController.js';
import { createDemoConfig } from '../../src/config/demoConfig.js';
import type { ExerciseSignal, GameEffect } from '../../src/domain/types.js';
import type { RecognitionEvent } from '../../src/pose/recognizers/types.js';
export function sessionHarness(target=60000) {
  const clock={ms:0,nowMs(){return this.ms;}},config=createDemoConfig({treeCount:1,repsPerTree:1,initialLogs:0,startCountdownMs:1,restMs:1,carryTargetMs:target});
  const controller=createSessionController(config,clock),effects:GameEffect[]=[];let seq=0;
  controller.onEffect(e=>effects.push(e));
  function tick(ms:number){clock.ms+=ms;controller.tick(clock.ms);}
  function emit(event:RecognitionEvent){const ctx=inputContext(controller.getSnapshot());if(ctx)controller.accept({...ctx,...event,seq:++seq,capturedAtMs:clock.ms} as ExerciseSignal);}
  function begin(){controller.command({kind:'open-setup',mode:'keyboard'});controller.command({kind:'setup-ready'});tick(1);}
  function carry(){
    begin();
    for(const phase of ['ready','chop-down','chop-return'] as const)emit({kind:'phase',task:'chop',phase,repId:1,progress:1});
    emit({kind:'rep-completed',task:'chop',repId:1});tick(1);tick(1);
    for(const phase of ['ready','squat-down','stand-up','press-up','load-return'] as const)emit({kind:'phase',task:'load',phase,repId:1,progress:1});
    emit({kind:'rep-completed',task:'load',repId:1});tick(1);tick(1);
  }
  return {clock,config,controller,effects,tick,emit,begin,carry};
}
