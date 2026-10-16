import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve,join,sep} from 'node:path';
const base=resolve('artifacts/qa/t10');const temporary=await mkdtemp(join(base,'.version-check-'));
if(!resolve(temporary).startsWith(base+sep))throw new Error('Unexpected temporary path');
try{
  await mkdir(join(temporary,'node_modules/@mediapipe/tasks-vision'),{recursive:true});await mkdir(join(temporary,'public/mediapipe'),{recursive:true});
  await writeFile(join(temporary,'node_modules/@mediapipe/tasks-vision/package.json'),JSON.stringify({version:'0.10.32'}));
  await writeFile(join(temporary,'package.json'),JSON.stringify({dependencies:{'@mediapipe/tasks-vision':'0.10.32'}}));
  await writeFile(join(temporary,'public/mediapipe/manifest.json'),JSON.stringify({version:'0.10.31'}));
  let rejected=false;try{await promisify(execFile)(process.execPath,[resolve('scripts/verify-assets.mjs')],{cwd:temporary,windowsHide:true});}catch(e){rejected=e.code===1&&e.stderr.includes('MediaPipe JS/WASM version mismatch');}
  if(!rejected)throw new Error('Version mismatch was not rejected');console.log('PASS: mismatched 0.10.31 manifest vs 0.10.32 package rejected; isolated fixture, production assets unchanged');
}finally{await rm(temporary,{recursive:true,force:true});}
