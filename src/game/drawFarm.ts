import type { DemoConfig } from '../config/demoConfig.js';
import type { SessionSnapshot } from '../domain/types.js';

export type VisualState = { action: string; impactUntil: number; lastEffect: string };
const W = 1200;
const H = 650;
function polygon(g: CanvasRenderingContext2D, pts: [number, number][], color: string): void {
  g.fillStyle = color; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.fill();
}
function circle(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  g.fillStyle = color; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
}
function line(g: CanvasRenderingContext2D, x: number, y: number, x1: number, y1: number, color: string, width = 3): void {
  g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.beginPath(); g.moveTo(x,y); g.lineTo(x1,y1); g.stroke();
}
function pine(g: CanvasRenderingContext2D, x: number, y: number, s: number, hue=0): void {
  g.save();g.translate(x, y);g.scale(s,s);
  g.fillStyle = '#765035';g.fillRect(-4,-7,8,30);
  polygon(g, [[0,-105],[-34,-36],[34,-36]], hue ? '#2b7967' : '#236b60');
  polygon(g, [[0,-80],[-42,-8],[42,-8]], hue ? '#3a9580' : '#2f8974');
  polygon(g, [[0,-56],[-48,18],[48,18]], hue ? '#51a789' : '#388d71');
  g.restore();
}
function treeStump(g: CanvasRenderingContext2D, x:number, y:number):void{
  g.fillStyle='#855339';g.fillRect(x-13,y-16,26,18);g.fillStyle='#dba469';g.beginPath();g.ellipse(x,y-17,13,5,0,0,Math.PI*2);g.fill();
}
function log(g: CanvasRenderingContext2D, x:number,y:number,scale=1):void{
  g.save();g.translate(x,y);g.scale(scale,scale);
  g.fillStyle='#a7663d';g.fillRect(-14,-7,43,16);g.fillStyle='#bc8052';g.fillRect(-14,-7,43,5);
  g.fillStyle='#e0b47b';g.beginPath();g.ellipse(-14,1,9,8,0,0,Math.PI*2);g.fill();
  circle(g,-14,1,4,'#b77e4d');g.restore();
}
function cloud(g:CanvasRenderingContext2D,x:number,y:number,s:number):void{
  g.save();g.globalAlpha=.6;circle(g,x,y,22*s,'#fff');circle(g,x+22*s,y-8*s,30*s,'#fff');circle(g,x+51*s,y,22*s,'#fff');g.restore();
}
function barn(g:CanvasRenderingContext2D,x:number,y:number,s=1):void{
  g.save();g.translate(x,y);g.scale(s,s);
  polygon(g,[[-100,0],[0,-54],[100,0],[100,105],[0,146],[-100,105]],'#ad614e');
  polygon(g,[[-114,-5],[0,-81],[114,-5],[98,16],[0,-47],[-98,16]],'#673f3d');
  polygon(g,[[5,15],[65,-13],[65,97],[5,127]],'#7c4b37');
  polygon(g,[[17,27],[53,10],[53,102],[17,118]],'#ddb17a');
  polygon(g,[[27,33],[44,25],[44,105],[27,112]],'#473e35');
  g.restore();
}
function avatar(g:CanvasRenderingContext2D,x:number,y:number,s=1,action='ready'):void{
  g.save();g.translate(x,y);g.scale(s,s);
  circle(g,0,-71,20,'#f4c59c');
  polygon(g,[[-25,-80],[-16,-103],[6,-105],[20,-89]],'#5e3e39');
  polygon(g,[[-22,-50],[24,-50],[35,1],[-30,1]],'#eab75c');
  line(g,-10,5,-19,54,'#433c47',14);line(g,10,5,22,53,'#433c47',14);
  if (action.includes('chop-down')) {
    line(g,22,-34,70,-1,'#f5c497',11);
    line(g,68,-2,98,25,'#68544b',6);
    polygon(g,[[96,21],[110,34],[126,12],[111,3]],'#d2dee0');
  } else if (action.includes('press-up') || action.includes('chop-return')) {
    line(g,20,-35,40,-104,'#f5c497',11);
    line(g,40,-104,60,-134,'#645047',6);
    polygon(g,[[56,-143],[79,-129],[64,-111],[49,-124]],'#d2dee0');
  } else if (action.includes('squat-down')) {
    line(g,-10,5,-36,27,'#433c47',14);line(g,10,5,37,27,'#433c47',14);
    line(g,20,-35,42,8,'#f5c497',11);
  } else {
    line(g,21,-32,36,1,'#f5c497',11);line(g,-22,-32,-36,-1,'#f5c497',11);
  }
  g.restore();
}
function robot(g:CanvasRenderingContext2D,x:number,y:number):void{
  g.save();g.translate(x,y);
  g.fillStyle='#648e83';g.fillRect(-19,-43,38,41);circle(g,0,-62,23,'#c3e8d9');
  circle(g,-8,-64,4,'#385b59');circle(g,8,-64,4,'#385b59');
  line(g,-19,-24,-30,-2,'#648e83',7);line(g,19,-24,30,-2,'#648e83',7);
  line(g,-10,-2,-13,24,'#648e83',8);line(g,10,-2,13,24,'#648e83',8);
  g.restore();
}
function cart(g:CanvasRenderingContext2D,x:number,y:number,items:number):void{
  g.save();g.translate(x,y);
  line(g,-100,20,-160,-15,'#80563e',9);
  polygon(g,[[-95,-22],[82,-22],[64,25],[-78,25]],'#c5814a');
  line(g,-92,-22,81,-22,'#734b35',6);
  for (let i=0;i<Math.min(items,15);i++) {
    const col=i%5, row=Math.floor(i/5);log(g,-55+col*27,-23-row*18,.8);
  }
  circle(g,-49,37,25,'#514b4b');circle(g,43,37,25,'#514b4b');
  circle(g,-49,37,11,'#ddbb81');circle(g,43,37,11,'#ddbb81');
  g.restore();
}
function label(g:CanvasRenderingContext2D,title:string,subtitle:string):void{
  g.fillStyle='rgba(16,40,43,.76)';g.beginPath();g.roundRect(35,30,460,92,17);g.fill();
  g.fillStyle='#fff1d2';g.font='bold 29px sans-serif';g.fillText(title,61,71);
  g.fillStyle='#cbe4d7';g.font='17px sans-serif';g.fillText(subtitle,61,102);
}
export function drawFarm(canvas:HTMLCanvasElement,s:Readonly<SessionSnapshot>,config:Readonly<DemoConfig>,v:VisualState):void{
  const g=canvas.getContext('2d');if(!g) return;
  const scale=Math.min(window.devicePixelRatio||1,2);
  const display=canvas.getBoundingClientRect();
  const pixelW=Math.max(1,Math.round(display.width*scale));const pixelH=Math.max(1,Math.round(display.height*scale));
  if(canvas.width!==pixelW||canvas.height!==pixelH){canvas.width=pixelW;canvas.height=pixelH;}
  g.setTransform(pixelW/W,0,0,pixelH/H,0,0);
  const sky=g.createLinearGradient(0,0,0,470);sky.addColorStop(0,'#a8d8d3');sky.addColorStop(1,'#eaf1cb');
  g.fillStyle=sky;g.fillRect(0,0,W,H);
  cloud(g,180,112,1.2);cloud(g,750,145,.85);cloud(g,1010,78,1);
  polygon(g,[[0,360],[110,235],[170,309],[300,170],[406,310],[520,233],[683,340],[804,205],[970,347],[1060,236],[1200,334],[1200,460],[0,460]],'#86aea1');
  polygon(g,[[0,389],[160,304],[330,389],[490,279],[700,420],[867,327],[1030,410],[1200,314],[1200,520],[0,520]],'#5da892');
  polygon(g,[[0,468],[200,406],[385,443],[604,394],[810,445],[1040,375],[1200,413],[1200,650],[0,650]],'#83bc87');
  g.fillStyle='#90c792';g.fillRect(0,505,W,145);
  g.beginPath();g.moveTo(482,650);g.bezierCurveTo(542,566,694,523,608,473);g.bezierCurveTo(520,418,680,385,799,366);
  g.strokeStyle='#d7b484';g.lineWidth=75;g.stroke();g.strokeStyle='#e8cd9c';g.lineWidth=58;g.stroke();
  for(let i=0;i<7;i++) pine(g,53+i*94,437+(i%2)*12,.64+(i%3)*.04,i%2);
  for(let i=0;i<6;i++) pine(g,666+i*94,392+(i%2)*14,.52+(i%3)*.07,i%2);
  barn(g,950,329,.87);
  for(let i=0;i<7;i++){line(g,853+i*48,502,853+i*48,546,'#e6d1a4',7);}
  line(g,853,516,1138,516,'#e6d1a4',8);
  for(let i=0;i<12;i++) circle(g,(i*113+67)%1200,545+(i%4)*24,4+(i%2)*3,'#e9df92');
  const task=s.task;
  const chopping=task==='chop'&&s.phase!=='home';
  if(chopping || s.phase==='home' || s.phase==='setup' || s.phase==='results'){
    const fallen=chopping?s.choppedTrees:(s.phase==='results'?config.treeCount:0);
    for(let i=0;i<config.treeCount;i++){
      const x=290+i*112;
      if(i<fallen){treeStump(g,x,453);log(g,x+17,475,.9);}else pine(g,x,457,1.18,i%2);
    }
  }
  if(task==='load'||task==='carry'||s.phase==='results'){
    const ground=task==='load'?s.groundLogs:0;
    for(let i=0;i<Math.min(ground,9);i++) log(g,340+(i%3)*40,528-Math.floor(i/3)*17,.8);
    if(s.phase==='results') cart(g,615,500,0);
    else {
      const travel=task==='carry'?Math.min(1,s.carryActiveMs/config.carryTargetMs):0;
      const x=task==='carry'?475+travel*400:700;
      cart(g,x,490,s.cartLogs);
    }
  }
  const travel=task==='carry'?Math.min(1,s.carryActiveMs/config.carryTargetMs):0;
  avatar(g, task==='carry'?300+travel*400:task==='load'?540:task==='chop'?150:560,510,1.05,v.action);
  robot(g,task==='chop'?85:task==='load'?245:888,540);
  if(performance.now()<v.impactUntil){
    const x=task==='load'?715:225;
    for(let i=0;i<14;i++){const a=i*2.4,r=12+(i%4)*13;circle(g,x+Math.cos(a)*r,420+Math.sin(a)*r,3+i%3,'#ffd180');}
  }
  if(s.phase==='home'||s.phase==='setup') label(g,'一座荒废农场，等待重获生机','你的每一次运动，都会改变这里。');
  else if(task==='chop') label(g,'森林 · 砍伐杉树',`挥砍 ${s.chopReps}/${config.chopRepTarget}  ·  已砍倒 ${s.choppedTrees} 棵`);
  else if(task==='load') label(g,'森林 · 木材装车',`装车 ${s.loadReps}/${config.loadRepTarget}  ·  地面余量 ${s.groundLogs}`);
  else if(task==='carry') label(g,'返程 · 推车回农场',`有效持姿 ${Math.floor(s.carryActiveMs/1000)} / ${Math.floor(config.carryTargetMs/1000)} 秒`);
  else if(s.phase==='results') label(g,'任务完成 · 丰收归来','坚持训练，收获看得见的成果。');
}
