import {expect,test,vi} from 'vitest';
import {AudioFeedback} from '../../src/ui/audioFeedback.js';
function audioHarness(){
  const oscillators:{start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>;disconnect:ReturnType<typeof vi.fn>;onended:(()=>void)|null}[]=[];
  const context={state:'suspended',currentTime:0,destination:{},resume:vi.fn(async()=>{context.state='running';}),close:vi.fn(async()=>{context.state='closed';}),
    createGain:vi.fn(()=>({connect:vi.fn(),disconnect:vi.fn(),gain:{setValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()}})),
    createOscillator:vi.fn(()=>{const node={type:'sine',frequency:{setValueAtTime:vi.fn()},connect:vi.fn(),start:vi.fn(),stop:vi.fn(),disconnect:vi.fn(),onended:null as (()=>void)|null};oscillators.push(node);return node;})};
  const factory=vi.fn(()=>context as unknown as AudioContext);return {context,factory,oscillators,audio:new AudioFeedback(factory)};
}
const impact={kind:'action-impact',sessionId:'s',task:'chop'} as const;
test('audio is silent and allocates no context until explicit user enable',async()=>{
  const h=audioHarness();h.audio.handle(impact);expect(h.factory).not.toHaveBeenCalled();expect(h.audio.enabled).toBe(false);
  expect(await h.audio.setEnabled(true)).toBe(true);h.audio.handle(impact);
  expect(h.context.resume).toHaveBeenCalledOnce();expect(h.oscillators).toHaveLength(1);expect(h.oscillators[0].start).toHaveBeenCalledOnce();
  h.oscillators[0].onended?.();expect(h.oscillators[0].disconnect).toHaveBeenCalledOnce();await h.audio.dispose();
});
test('mute stops active nodes, does not replay muted effects, dispose closes only once',async()=>{
  const h=audioHarness();await h.audio.setEnabled(true);h.audio.handle(impact);await h.audio.setEnabled(false);
  expect(h.oscillators).toHaveLength(1);expect(h.oscillators[0].stop).toHaveBeenCalled();expect(h.oscillators[0].disconnect).toHaveBeenCalledOnce();
  h.audio.handle(impact);expect(h.oscillators).toHaveLength(1);await h.audio.dispose();await h.audio.dispose();expect(h.context.close).toHaveBeenCalledOnce();
});
test('unavailable audio never throws into gameplay and can remain muted',async()=>{
  const audio=new AudioFeedback(()=>{throw new Error('no audio device');});
  expect(await audio.setEnabled(true)).toBe(false);expect(audio.error).toContain('音效');expect(()=>audio.handle(impact)).not.toThrow();await audio.dispose();
});
test('a late audio unlock cannot undo mute or disposal',async()=>{
  const h=audioHarness();let release!:()=>void;h.context.resume.mockImplementation(()=>new Promise(resolve=>{release=resolve;}));
  const enabling=h.audio.setEnabled(true);await h.audio.setEnabled(false);release();await enabling;expect(h.audio.enabled).toBe(false);h.audio.handle(impact);expect(h.oscillators).toHaveLength(0);
  await h.audio.dispose();expect(await h.audio.setEnabled(true)).toBe(false);
});
