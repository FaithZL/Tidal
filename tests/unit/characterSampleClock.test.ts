import {describe,it,expect} from 'vitest';
import {CharacterSampleClock} from '../../src/game/world/characterSampleClock.js';

describe('isolated character preview clock',()=>{
 it('freezes paused and unobserved time, including long gaps',()=>{
  const clock=new CharacterSampleClock(1);clock.advance(50);const time=clock.time;
  clock.paused=true;clock.advance(50);expect(clock.time).toBe(time);
  clock.paused=false;
  for(const delta of [0,-1,NaN,Infinity,101,5000])clock.advance(delta);
  expect(clock.time).toBe(time);clock.advance(50);expect(clock.time).toBeCloseTo(.1);
 });
 it('replays exactly, supports half speed, and can hold the idle mode',()=>{
  const clock=new CharacterSampleClock(1);clock.rate=.5;clock.advance(100);expect(clock.time).toBeCloseTo(.05);
  clock.paused=true;clock.replay();expect(clock.paused).toBe(false);expect(clock.time).toBe(0);
  clock.idleOnly=true;for(let i=0;i<100;i++)clock.advance(100);
  expect(clock.frame.phase).toBe('idle');expect(clock.frame.weight).toBe(0);expect(clock.frame.chopTime).toBeNull();
 });
 it('runs a single windup, strike and recovery with continuous endpoints and an idle rest',()=>{
  const clock=new CharacterSampleClock(1);const phases=new Set<string>();
  for(let i=0;i<65;i++){clock.advance(100);phases.add(clock.frame.phase);expect(clock.frame.weight).toBeGreaterThanOrEqual(0);expect(clock.frame.weight).toBeLessThanOrEqual(1);}
  expect([...phases]).toEqual(['idle','prepare','strike','recover']);
  expect(clock.frame.phase).toBe('idle');expect(clock.frame.chopTime).toBeNull();
 });
 it('unloads the axe after impact instead of replaying the source loop into another overhead windup',()=>{
  const clock=new CharacterSampleClock(1);
  for(const time of[4.3,4.7,5.1,5.5]){
   clock.time=time;
   expect(clock.frame.phase).toBe('recover');
   expect(clock.frame.chopTime).toBeLessThan(.5);
  }
  clock.time=4.7;expect(clock.frame.weight).toBeLessThan(.9);
  clock.time=5.5;expect(clock.frame.weight).toBeLessThan(.01);
 });
 it('eases into and out of the actual downstroke without a velocity jump at the raised pose or impact',()=>{
  const clock=new CharacterSampleClock(1),step=.0001;
  const sourceAt=(time:number)=>{clock.time=time;return clock.frame.chopTime??0;};
  const startSpeed=(sourceAt(3.65+step)-sourceAt(3.65))/step;
  const impactSpeed=(sourceAt(4.15)-sourceAt(4.15-step))/step;
  const middleSpeed=(sourceAt(3.9+step)-sourceAt(3.9-step))/(2*step);
  expect(startSpeed).toBeLessThan(.01);expect(impactSpeed).toBeLessThan(.01);
  expect(middleSpeed).toBeGreaterThan(.8);
 });
 it('never accelerates the already fast source downstroke beyond its recorded playback rate',()=>{
  const clock=new CharacterSampleClock(.9666666388511658),step=.001;let peak=0;
  for(let time=3.65;time<4.15;time+=step){
   clock.time=time;const before=clock.frame.chopTime!;clock.time=time+step;
   peak=Math.max(peak,(clock.frame.chopTime!-before)/step);
  }
  expect(peak).toBeLessThanOrEqual(1);
 });
});
