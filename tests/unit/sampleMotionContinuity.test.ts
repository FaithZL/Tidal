import {readFile} from 'node:fs/promises';
import {afterAll,afterEach,beforeAll,describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CharacterSampleClock,type CharacterSampleFrame} from '../../src/game/world/characterSampleClock.js';
import {SampleCharacter} from '../../src/game/world/sampleCharacter.js';
import {NprPalette} from '../../src/game/world/nprMaterials.js';
import {WorldResources} from '../../src/game/world/resources.js';

const directory=new URL('../../public/assets/character-motion/',import.meta.url);
let bodyText:string,idleBytes:ArrayBuffer,chopBytes:ArrayBuffer;
const cleanups:(()=>void)[]=[];
beforeAll(async()=>{
 const model=JSON.parse(await readFile(new URL('Male_Peasant.gltf',directory),'utf8'));
 const binary=await readFile(new URL('Male_Peasant.bin',directory));
 // Omit image decoding only: continuity uses the actual hierarchy, inverse binds, weights and clips.
 model.buffers[0].uri=`data:application/octet-stream;base64,${binary.toString('base64')}`;
 model.images=[];model.textures=[];model.materials=model.materials.map((material:{name:string})=>({name:material.name,pbrMetallicRoughness:{baseColorFactor:[.8,.7,.6,1]}}));
 bodyText=JSON.stringify(model);
 const idle=await readFile(new URL('idle.glb',directory)),chop=await readFile(new URL('tree-chopping.glb',directory));
 idleBytes=idle.buffer.slice(idle.byteOffset,idle.byteOffset+idle.byteLength);chopBytes=chop.buffer.slice(chop.byteOffset,chop.byteOffset+chop.byteLength);
 vi.stubGlobal('ProgressEvent',class ProgressEvent{constructor(public type:string,public init:unknown){}});
});
afterEach(()=>{cleanups.splice(0).forEach(cleanup=>cleanup());});
afterAll(()=>{vi.unstubAllGlobals();});

async function fixture():Promise<{actor:SampleCharacter;clock:CharacterSampleClock}>{
 const loader=new GLTFLoader(),body=await loader.parseAsync(bodyText,'');
 const idle=await loader.parseAsync(idleBytes.slice(0),''),chop=await loader.parseAsync(chopBytes.slice(0),'');
 const resources=new WorldResources(),actor=new SampleCharacter(resources,new NprPalette(resources),body,idle,chop);
 cleanups.push(()=>{actor.dispose();resources.dispose();});
 // Check world-space continuity after the caller has placed and rotated its actor.
 actor.root.position.set(3,.25,-2);actor.root.rotation.y=.4;
 return{actor,clock:new CharacterSampleClock(actor.clipDuration)};
}
function landmarks(actor:SampleCharacter,frame:CharacterSampleFrame):Record<string,T.Vector3>{
 actor.sample(frame.idleTime,frame.chopTime,frame.weight);
 const left=actor.root.getObjectByName('hand_l'),right=actor.root.getObjectByName('hand_r'),elbow=actor.root.getObjectByName('lowerarm_l');
 if(!left||!right||!elbow)throw new Error('The actual character fixture must retain both hands and the left elbow');
 return{
  leftElbow:elbow.getWorldPosition(new T.Vector3()),
  leftWrist:left.getWorldPosition(new T.Vector3()),rightWrist:right.getWorldPosition(new T.Vector3()),
  leftPalm:left.localToWorld(new T.Vector3(0,.065,0)),rightPalm:right.localToWorld(new T.Vector3(0,.065,0)),
  blade:actor.bladePosition(),
 };
}
function displacements(before:Record<string,T.Vector3>,after:Record<string,T.Vector3>):Record<string,number>{
 return Object.fromEntries(Object.entries(before).map(([name,point])=>[name,point.distanceTo(after[name])]));
}
function blendCutoff(clock:CharacterSampleClock,start:number,end:number):number{
 clock.time=start;const increasing=clock.frame.weight<.001;
 for(let i=0;i<50;i++){
  const middle=(start+end)/2;clock.time=middle;
  if((clock.frame.weight<.001)===increasing)start=middle;else end=middle;
 }
 return(start+end)/2;
}

describe('actual skinned sample motion transitions',()=>{
 // These are supplemental regressions for existing continuous behavior, not a claimed pre-fix RED.
 it.each([2.4,3.35,3.65,4.15,4.4,5.6,7.1])('keeps wrists, palms and blade continuous at %ss',async boundary=>{
  const {actor,clock}=await fixture(),epsilon=.00001;
  clock.time=boundary-epsilon;const before=landmarks(actor,clock.frame);
  clock.time=boundary+epsilon;const after=landmarks(actor,clock.frame);
  for(const [name,distance] of Object.entries(displacements(before,after))){
   expect(Number.isFinite(distance),`${name} at ${boundary}s`).toBe(true);
   expect(distance,`${name} jumps across ${boundary}s`).toBeLessThan(.0001);
  }
 });

 it.each([{phase:'prepare',start:2.4,end:3.35},{phase:'release',start:4.4,end:5.6}])('keeps the left elbow continuous when the contact correction switches during $phase',async({start,end})=>{
  const {actor,clock}=await fixture(),boundary=blendCutoff(clock,start,end),epsilon=.00001;
  clock.time=boundary-epsilon;const before=landmarks(actor,clock.frame);
  clock.time=boundary+epsilon;const after=landmarks(actor,clock.frame);
  for(const [name,distance] of Object.entries(displacements(before,after))){
   expect(Number.isFinite(distance),`${name} at blend cutoff ${boundary}s`).toBe(true);
   expect(distance,`${name} jumps at blend cutoff ${boundary}s`).toBeLessThan(.0001);
  }
 });

 it('detects the real-model jump that an immediate cut from the impact pose to idle would cause',async()=>{
  const {actor,clock}=await fixture();
  clock.time=4.15-.00001;const before=landmarks(actor,clock.frame);
  clock.time=4.15+.00001;
  // Negative control: remove the release blend from this input only; production code remains untouched.
  const after=landmarks(actor,{...clock.frame,chopTime:null,weight:0}),deltas=displacements(before,after);
  expect(deltas.leftWrist).toBeGreaterThan(.1);
  expect(deltas.blade).toBeGreaterThan(.1);
  expect(Object.values(deltas).some(distance=>distance>=.0001)).toBe(true);
 });
});
