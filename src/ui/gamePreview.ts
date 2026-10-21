/** Relocate one existing video; never creates a stream, camera session or worker. */
export class GamePreview{
 private target:HTMLElement|null=null;
 private generation=0;
 private disposed=false;
 constructor(private readonly preview:HTMLElement,private readonly video:HTMLVideoElement,private readonly setup:HTMLElement,private readonly game:HTMLElement,private readonly onError:(message:string)=>void){}
 setInGame(inGame:boolean):void{
  const host=inGame?this.game:this.setup;if(this.disposed||this.target===host)return;this.target=host;host.appendChild(this.preview);
  const generation=++this.generation,stream=this.video.srcObject;
  if(stream&&this.video.paused)void this.video.play().catch(()=>{if(!this.disposed&&generation===this.generation&&this.video.srcObject===stream)this.onError('摄像头预览无法继续播放，请停止并重试');});
 }
 dispose():void{this.disposed=true;this.generation++;this.target=null;}
}
