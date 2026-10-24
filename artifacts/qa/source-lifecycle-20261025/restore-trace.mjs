// Reassemble a losslessly split QA trace without overwriting an existing file.
import {readFile,open,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
const manifestPath=resolve(process.argv[2]??'trace.zip.parts.json');
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
const outputPath=resolve(dirname(manifestPath),manifest.original);
const output=await open(outputPath,'wx');
const full=createHash('sha256');let total=0;
try{
 for(const part of manifest.parts){
  const bytes=await readFile(resolve(dirname(manifestPath),part.file));
  if(bytes.length!==part.bytes||createHash('sha256').update(bytes).digest('hex')!==part.sha256)throw new Error(`Invalid part: ${part.file}`);
  await output.writeFile(bytes);full.update(bytes);total+=bytes.length;
 }
 if(total!==manifest.bytes||full.digest('hex')!==manifest.sha256)throw new Error('Reassembled trace checksum mismatch');
 await output.close();console.log(`Restored ${outputPath} (${total} bytes; SHA-256 verified)`);
}catch(error){await output.close();await unlink(outputPath);throw error;}
