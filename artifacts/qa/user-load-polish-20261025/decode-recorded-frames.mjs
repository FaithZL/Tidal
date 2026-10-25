/** Decode recorded pixels only. A seeked event alone does not guarantee the sought frame is presented. */
export async function decodeRecordedFrames(page,videoBytes,selected,{fps=30}={}){
 return page.evaluate(async({base64,selected,fps})=>{
  const binary=atob(base64),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  const objectUrl=URL.createObjectURL(new Blob([bytes],{type:'video/webm'})),video=document.createElement('video');
  video.muted=true;video.preload='auto';video.playsInline=true;
  // Paused videos need an actual compositor surface for requestVideoFrameCallback.
  video.style.cssText='position:fixed;left:0;top:0;width:320px;height:auto;z-index:2147483647;background:black';
  document.body.appendChild(video);
  try{
   if(typeof video.requestVideoFrameCallback!=='function')throw new Error('requestVideoFrameCallback is required for verified frame exports');
   await new Promise((yes,no)=>{
    const timer=setTimeout(()=>no(new Error('Recorded WebM decode timeout')),10000);
    video.onloadeddata=()=>{clearTimeout(timer);yes();};
    video.onerror=()=>{clearTimeout(timer);no(new Error('Recorded WebM decode failed'));};
    video.src=objectUrl;video.load();
   });
   video.pause();
   const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;
   const context=canvas.getContext('2d');if(!context)throw new Error('Recorded-frame export unavailable');
   const frames=[];
   for(const item of selected){
    const target=Math.max(0,item.requestedVideoTime);
    const presentation=await new Promise((yes,no)=>{
     let callback=0,seeked=false,presented=null,done=false;
     const clean=()=>{clearTimeout(timer);video.cancelVideoFrameCallback(callback);video.removeEventListener('seeked',onSeeked);video.removeEventListener('error',onError);};
     const finish=()=>{if(done||!seeked||!presented)return;done=true;clean();yes(presented);};
     const onError=()=>{if(done)return;done=true;clean();no(new Error(`Recorded frame decode failed: ${item.phase}`));};
     const onSeeked=()=>{seeked=true;finish();};
     const onFrame=(now,metadata)=>{
      if(done)return;
      // Reject an old callback still queued from the previous seek. A recorded
      // 30fps frame may precede the requested timestamp by one frame interval.
      if(Number.isFinite(metadata.mediaTime)&&Math.abs(metadata.mediaTime-target)<=1/fps+.025){
       presented={mediaTime:metadata.mediaTime,presentedFrames:metadata.presentedFrames,
        presentationTime:metadata.presentationTime,expectedDisplayTime:metadata.expectedDisplayTime,
        callbackTime:now,processingDuration:metadata.processingDuration};
      }
      finish();if(!done)callback=video.requestVideoFrameCallback(onFrame);
     };
     const timer=setTimeout(()=>{if(done)return;done=true;clean();no(new Error(`Presented frame timeout: ${item.phase} at ${target.toFixed(4)}s`));},10000);
     video.addEventListener('seeked',onSeeked);video.addEventListener('error',onError);
     // Registration must precede seeking, otherwise the sought presentation can be missed.
     callback=video.requestVideoFrameCallback(onFrame);video.currentTime=target;
    });
    context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(video,0,0);
    frames.push({...item,decodedVideoTime:video.currentTime,...presentation,width:canvas.width,height:canvas.height,
     png:canvas.toDataURL('image/png').split(',')[1]});
   }
   return frames;
  }finally{video.removeAttribute('src');video.load();video.remove();URL.revokeObjectURL(objectUrl);}
 },{base64:Buffer.from(videoBytes).toString('base64'),selected,fps});
}
