/** Only rendering density changes; input and session clocks are independent. */
export class AdaptiveResolution{
 private scale:number;private readonly minimum:number;private elapsed=0;private samples=0;private slowSamples=0;
 constructor(density:number){
  this.scale=Number.isFinite(density)&&density>0?Math.min(density,1.25):1;
  this.minimum=Math.min(.5,this.scale);
 }
 get ratio():number{return this.scale;}
 observe(deltaMs:number,drawing:boolean):number{
  // Ignore idle/paused frames and discontinuities, rather than attributing them to GPU cost.
  if(!drawing||!Number.isFinite(deltaMs)||deltaMs<=0||deltaMs>250){this.elapsed=this.samples=this.slowSamples=0;return this.scale;}
  this.elapsed+=deltaMs;this.samples++;if(deltaMs>17.5)this.slowSamples++;
  if(this.elapsed>=400){
   if(deltaMs>17.5&&this.elapsed/this.samples>17.5&&this.slowSamples>=Math.max(2,this.samples*.05))this.scale=Math.max(this.minimum,Math.round(this.scale*.8*1000)/1000);
   this.elapsed=this.samples=this.slowSamples=0;
  }
  // Retain the chosen level until reload; repeated upscale probes would cause visible oscillation.
  return this.scale;
 }
}
