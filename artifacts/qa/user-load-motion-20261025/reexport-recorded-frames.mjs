/** Re-export the existing normal-load.webm. Never starts the application or re-records motion. */
import {readFile,writeFile,appendFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {decodeRecordedFrames} from './decode-recorded-frames.mjs';

const root=dirname(fileURLToPath(import.meta.url)),output=resolve(process.env.TIDAL_LOAD_QA_DIR??resolve(root,'production'));
const log=resolve(root,'frame-export.log'),videoPath=resolve(output,'normal-load.webm'),reportPath=resolve(output,'production.json');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const videoBytes=await readFile(videoPath),beforeSha=hash(videoBytes),report=JSON.parse(await readFile(reportPath,'utf8'));
const manifest=JSON.parse(await readFile(resolve(root,'iterations/first-frame-export/manifest.json'),'utf8'));
assert.equal(beforeSha,manifest.videoSha256,'Original recording changed before re-export');
await appendFile(log,JSON.stringify({operation:'re-export recorded frames with requestVideoFrameCallback',command:process.argv.join(' '),startedAt:new Date().toISOString(),videoSha256:beforeSha})+'\n');
let browser,context;
try{
 browser=await chromium.launch({channel:'chromium',headless:true});
 context=await browser.newContext({viewport:{width:640,height:480}});
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setContent('<!doctype html><html><body style="margin:0;background:#222"></body></html>');
 const selected=report.frames.map(({phase,sample,requestedVideoTime})=>({phase,sample,requestedVideoTime}));
 const decoded=await decodeRecordedFrames(page,videoBytes,selected,{fps:report.fpsRequested??30});
 assert.deepEqual(errors,[]);
 const frames=[];
 for(const frame of decoded){
  const {png,...metadata}=frame,file=`${frame.phase}.png`,image=Buffer.from(png,'base64');
  await writeFile(resolve(output,file),image);
  frames.push({...metadata,file,sha256:hash(image),sameBytesAsFirstExport:hash(image)===manifest.files.find(item=>item.file===file)?.sha256,
   source:'Actual normal-load.webm frame, after seeked and matching requestVideoFrameCallback presentation; no new 3D render'});
 }
 const afterSha=hash(await readFile(videoPath));assert.equal(afterSha,beforeSha,'Re-export must not alter the recording');
 report.frames=frames;
 report.frameExport={result:'pass',method:'seeked plus requestVideoFrameCallback registered before seek; matching presented mediaTime before drawImage',
  reexportedAt:new Date().toISOString(),browser:browser.version(),videoSha256:beforeSha,originals:'iterations/first-frame-export/',
  mediaTimeToleranceSeconds:1/(report.fpsRequested??30)+.025,pageErrors:errors,
  poseToVideoTimeAlignment:'not verified; requestVideoFrameCallback verifies the decoded video frame, not its wall-clock alignment to RAF hand telemetry',
  allPngBytesUnchangedFromFirstExport:frames.every(frame=>frame.sameBytesAsFirstExport)};
 await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
 const result={operation:'re-export recorded frames',result:'pass',videoUnchanged:true,videoSha256:afterSha,
  frames:frames.map(frame=>({phase:frame.phase,requestedVideoTime:frame.requestedVideoTime,mediaTime:frame.mediaTime,sha256:frame.sha256}))};
 await appendFile(log,JSON.stringify(result)+'\n');console.log(JSON.stringify(result,null,2));
}catch(error){await appendFile(log,JSON.stringify({operation:'re-export recorded frames',result:'fail',error:String(error)})+'\n');throw error;}
finally{await context?.close();await browser?.close();}
