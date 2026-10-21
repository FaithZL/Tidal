import {expect,test} from 'vitest';
import {AdaptiveResolution} from '../../src/game/world/adaptiveResolution.js';

test('sustained slow rendered frames reduce raster cost with a bounded scale',()=>{
 const quality=new AdaptiveResolution(1);
 for(let i=0;i<40;i++)quality.observe(1000/30,true);
 expect(quality.ratio).toBeLessThan(1);
 for(let i=0;i<400;i++)quality.observe(1000/30,true);
 expect(quality.ratio).toBe(.5);
});

test('60fps and short spikes retain sharpness without resolution oscillation',()=>{
 const quality=new AdaptiveResolution(2);
 expect(quality.ratio).toBe(1.25);
 for(let i=0;i<240;i++)quality.observe(i===100?45:1000/60,true);
 expect(quality.ratio).toBe(1.25);
 for(let i=0;i<40;i++)quality.observe(1000/30,true);
 const reduced=quality.ratio;
 expect(reduced).toBeLessThan(1.25);
 for(let i=0;i<1200;i++)quality.observe(1000/60,true);
 expect(quality.ratio).toBe(reduced);
});

test('paused, static, hidden and invalid intervals cannot lower the scale or join slow bursts',()=>{
 const quality=new AdaptiveResolution(1);
 for(const gap of [0,-1,NaN,Infinity,5000]){
  for(let i=0;i<6;i++)quality.observe(1000/30,true);
  quality.observe(gap,true);
 }
 for(let i=0;i<600;i++)quality.observe(1000/30,false);
 for(let i=0;i<6;i++)quality.observe(1000/30,true);
 expect(quality.ratio).toBe(1);
});

test('a slow short chop animation can adapt before its idle gap clears observations',()=>{
 const quality=new AdaptiveResolution(1);
 for(let i=0;i<14;i++)quality.observe(1000/30,true);
 expect(quality.ratio).toBeLessThan(1);
 quality.observe(1000/60,false);
 const reduced=quality.ratio;
 for(let i=0;i<120;i++)quality.observe(1000/60,false);
 expect(quality.ratio).toBe(reduced);
});

test('sustained 55fps is still below the 60fps rendering target',()=>{
 const quality=new AdaptiveResolution(1);
 for(let i=0;i<90;i++)quality.observe(1000/55,true);
 expect(quality.ratio).toBeLessThan(1);
});

test('one isolated spike at the observation boundary does not reduce quality',()=>{
 const quality=new AdaptiveResolution(1);
 for(let i=0;i<23;i++)quality.observe(1000/60,true);
 quality.observe(45,true);
 expect(quality.ratio).toBe(1);
});

test('55fps caused by repeated missed refreshes still adapts, rather than looking like isolated spikes',()=>{
 const quality=new AdaptiveResolution(1);
 for(let i=0;i<80;i++)quality.observe(i%11===10?1000/30:1000/60,true);
 expect(quality.ratio).toBeLessThan(1);
});

test('low initial pixel density is never increased and invalid density has a safe default',()=>{
 const low=new AdaptiveResolution(.4);
 for(let i=0;i<100;i++)low.observe(1000/30,true);
 expect(low.ratio).toBe(.4);
 for(const density of [0,-1,NaN,Infinity])expect(new AdaptiveResolution(density).ratio).toBe(1);
});
