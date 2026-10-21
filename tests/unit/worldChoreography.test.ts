import {expect,test} from 'vitest';
import {WorldChoreography} from '../../src/game/world/choreography.js';
import {createDemoConfig} from '../../src/config/demoConfig.js';
import type {SessionSnapshot,GameEffect} from '../../src/domain/types.js';
const config=createDemoConfig();
const base:SessionSnapshot={sessionId:'world',taskRunId:'run',sourceEpoch:1,phase:'active',task:'chop',inputMode:'keyboard',pauseReasons:[],remainingMs:0,chopReps:0,choppedTrees:0,loadReps:0,cartLogs:0,groundLogs:0,deliveredLogs:0,carryActiveMs:0,exerciseActiveMs:0,sessionElapsedMs:0,rewardsGranted:false,sessionStartedAtMs:0};
const state=(patch:Partial<SessionSnapshot>={})=>({...base,...patch});
const effect=(patch:Partial<GameEffect>={}):GameEffect=>({kind:'action-phase',sessionId:'world',taskRunId:'run',sourceEpoch:1,repId:1,task:'load',phase:'load-return',progress:1,...patch} as GameEffect);
function make(s=base){const w=new WorldChoreography(config);w.sync(s);return w;}
test('five distinct sections per tree and every visible ownership category conserves authority',()=>{
 for(let trees=0;trees<=3;trees++){
  const w=make(state({choppedTrees:trees,groundLogs:trees*5}));
  expect(w.frame.logs).toHaveLength(trees*5);expect(new Set(w.frame.logs.map(l=>l.id)).size).toBe(trees*5);
  expect(w.frame.logs.every(l=>l.location==='ground')).toBe(true);
  w.advance(10000);expect(w.frame.logs).toHaveLength(trees*5);
 }
});
test('push segment keeps person at the same handle offset as cart moves and presentation time cannot move it',()=>{
 const s=state({phase:'rest',task:'load',taskRunId:null,choppedTrees:3,groundLogs:15,remainingMs:10500});const w=make(s);
 const a=w.frame;expect(a.player.mode).toBe('push');expect(a.player.position.x-a.cart.x).toBeCloseTo(1.55);
 w.advance(9999);expect(w.frame.player).toEqual(a.player);expect(w.frame.cart).toEqual(a.cart);
 w.sync({...s,remainingMs:7500});const b=w.frame;
 expect(b.cart.x).toBeLessThan(a.cart.x);expect(b.player.position.x-a.player.position.x).toBeCloseTo(b.cart.x-a.cart.x);
});
test('throw starts at the actual hand anchor and never flashes back onto the ground during commit',()=>{
 const s=state({task:'load',choppedTrees:3,groundLogs:15});const w=make(s);const hand={x:-1.1,y:2.4,z:.1};
 w.setHandAnchor(hand);w.apply(effect({phase:'press-up'}));expect(w.frame.logs.filter(l=>l.location==='hand')).toHaveLength(1);
 w.apply(effect());const flying=w.frame.logs.find(l=>l.location==='flight')!;expect(flying.position).toEqual(hand);
 expect(w.frame.logs.filter(l=>l.location==='ground')).toHaveLength(14);
 w.advance(100);w.sync({...s,loadReps:1,groundLogs:14,cartLogs:1});w.apply(effect({kind:'log-loaded',cartLogs:1}));
 expect(w.frame.logs.find(l=>l.id===0)?.location).toBe('flight');expect(w.frame.logs).toHaveLength(15);
 w.advance(1000);expect(w.frame.logs.find(l=>l.id===0)?.location).toBe('cart');expect(w.frame.logs).toHaveLength(15);
});
test('pausing freezes throw and resuming a new epoch restores uncommitted timber without duplicates',()=>{
 const s=state({task:'load',choppedTrees:3,groundLogs:15});const w=make(s);w.setHandAnchor({x:1,y:2,z:3});w.apply(effect());w.advance(100);
 w.sync({...s,pauseReasons:['user']});const frozen=w.frame.logs;w.advance(5000);expect(w.frame.logs).toEqual(frozen);
 w.sync({...s,sourceEpoch:2});expect(w.frame.logs.filter(l=>l.location==='ground')).toHaveLength(15);expect(w.frame.logs).toHaveLength(15);
 w.apply(effect());expect(w.frame.logs.filter(l=>l.location==='flight')).toHaveLength(0);
});
test('last committed log survives transition to securing rest exactly once',()=>{
 const s=state({task:'load',choppedTrees:3,groundLogs:0,cartLogs:15,loadReps:15});const w=make(s);
 const loaded=effect({kind:'log-loaded',cartLogs:15});w.setHandAnchor({x:-1,y:2,z:0});w.apply(loaded);w.apply(loaded);
 w.sync({...s,task:'carry',taskRunId:null,phase:'rest',remainingMs:15000});expect(w.frame.logs).toHaveLength(15);
 expect(w.frame.logs.filter(l=>l.location==='flight')).toHaveLength(1);w.advance(1000);
 expect(w.frame.logs.filter(l=>l.location==='cart')).toHaveLength(15);
});
test('rope follows rest progress, is complete for carrying, and 40-unit route follows only valid snapshot time',()=>{
 const s=state({task:'carry',choppedTrees:3,groundLogs:0,cartLogs:15,phase:'rest',remainingMs:7500});const w=make(s);
 expect(w.frame.ropeProgress).toBe(.5);w.advance(90000);expect(w.frame.ropeProgress).toBe(.5);
 w.sync({...s,phase:'active',remainingMs:0,carryActiveMs:30000});expect(w.frame.cart.x).toBe(20);expect(w.frame.ropeProgress).toBe(1);
 const at=w.frame.cart;w.advance(99999);expect(w.frame.cart).toEqual(at);
 w.sync({...s,phase:'active',remainingMs:0,carryActiveMs:60000});expect(w.frame.cart.x).toBe(40);
});
test('reset and disposal release transient sections and old session effects cannot contaminate the new farm',()=>{
 const w=make(state({task:'load',choppedTrees:3,groundLogs:15}));w.apply(effect());
 w.sync(state({sessionId:'new',phase:'home',task:null,taskRunId:null}));w.apply(effect());expect(w.frame.logs).toEqual([]);
 w.dispose();w.sync(state({choppedTrees:3,groundLogs:15}));expect(w.frame.logs).toEqual([]);
});
test('duplicate committed effects remain ignored after a flight has finished',()=>{
 const w=make(state({task:'load',choppedTrees:3,groundLogs:14,cartLogs:1}));const e=effect({kind:'log-loaded',cartLogs:1});
 w.apply(e);w.advance(1000);w.apply(e);expect(w.frame.logs.filter(l=>l.location==='flight')).toHaveLength(0);
});
test('configured tree counts retain all tree sections in the world',()=>{
 const w=new WorldChoreography(createDemoConfig({treeCount:4}));w.sync(state({choppedTrees:4,groundLogs:20}));
 expect(w.frame.trees).toHaveLength(4);expect(w.frame.logs).toHaveLength(20);
});
