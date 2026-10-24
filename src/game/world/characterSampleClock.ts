export type SamplePhase='idle'|'prepare'|'strike'|'recover';
export interface CharacterSampleFrame{idleTime:number;chopTime:number|null;weight:number;phase:SamplePhase}
const smooth=(t:number)=>{const x=Math.max(0,Math.min(1,t));return Math.max(0,Math.min(1,x*x*x*(x*(x*6-15)+10)));};

/** An isolated art-review clock. It has no session, input, counting or reward interface. */
export class CharacterSampleClock{
 time=0;paused=false;rate:.5|1=1;idleOnly=false;
 constructor(private readonly clipDuration:number){}
 replay():void{this.time=0;this.idleOnly=false;this.paused=false;}
 advance(deltaMs:number):void{
  if(this.paused||!Number.isFinite(deltaMs)||deltaMs<=0||deltaMs>100)return;
  this.time+=deltaMs/1000*this.rate;
 }
 get frame():CharacterSampleFrame{
  const t=this.time%7.1,base={idleTime:this.time,chopTime:null,weight:0,phase:'idle' as const};
  if(this.idleOnly||t<2.4||t>=5.6)return base;
  // The source begins with raised hands: blend into that first pose for anticipation,
  // then play its actual downstroke (first quarter), instead of labeling recovery a hit.
  if(t<3.35)return{...base,chopTime:0,weight:smooth((t-2.4)/.95),phase:'prepare'};
  if(t<3.65)return{...base,chopTime:0,weight:1,phase:'prepare'};
  if(t<4.15)return{...base,chopTime:this.clipDuration*.25*smooth((t-3.65)/.5),weight:1,phase:'strike'};
  // Keep the source's low follow-through, then unload into the moving idle pose.
  // Its second half raises the tool for another loop and is not a recovery to rest.
  if(t<4.4)return{...base,chopTime:this.clipDuration*(.25+.07*smooth((t-4.15)/.25)),weight:1,phase:'recover'};
  const release=smooth((t-4.4)/1.2);
  return{...base,chopTime:this.clipDuration*(.32+.16*release),weight:1-release,phase:'recover'};
 }
}
