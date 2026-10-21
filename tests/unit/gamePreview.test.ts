import {expect,test,vi} from 'vitest';
import {GamePreview} from '../../src/ui/gamePreview.js';
function fixture(){
 const setup={appendChild:vi.fn()},game={appendChild:vi.fn()},preview={} as HTMLElement;
 let reject!:(e:Error)=>void;const video={paused:true,srcObject:{},play:vi.fn(()=>new Promise<void>((_,fail)=>{reject=fail;}))};
 const error=vi.fn();const p=new GamePreview(preview,video as unknown as HTMLVideoElement,setup as unknown as HTMLElement,game as unknown as HTMLElement,error);
 return{p,setup,game,video,error,reject:()=>reject(new Error('late'))};
}
test('preview reuses the same node and does not repeatedly append or replay in one destination',()=>{
 const f=fixture();f.p.setInGame(true);f.p.setInGame(true);expect(f.game.appendChild).toHaveBeenCalledTimes(1);expect(f.video.play).toHaveBeenCalledTimes(1);
});
test('legitimate play failure is visible but an old source rejection cannot fail a newer stream',async()=>{
 const f=fixture();f.p.setInGame(true);f.video.srcObject={};f.reject();await Promise.resolve();expect(f.error).not.toHaveBeenCalled();
 const next=fixture();next.p.setInGame(true);next.reject();await Promise.resolve();expect(next.error).toHaveBeenCalledTimes(1);
});
test('disposing a preview invalidates an outstanding video play callback',async()=>{
 const f=fixture();f.p.setInGame(true);f.p.dispose();f.reject();await Promise.resolve();expect(f.error).not.toHaveBeenCalled();
});
