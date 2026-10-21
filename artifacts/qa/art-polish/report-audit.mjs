// Mechanical document/evidence audit only; not camera, hardware or product acceptance.
import assert from 'node:assert/strict';
import {readFile,access,writeFile} from 'node:fs/promises';
const dir='artifacts/qa/art-polish';
const report=await readFile('docs/TEST_REPORT.md','utf8'),acceptance=await readFile('docs/ACCEPTANCE.md','utf8');
const rows=report.split('\n').filter(line=>/^\| [FCEVDP]\d{2} \|/.test(line));
const ids=rows.map(line=>line.split('|')[1].trim());
const expected=[...acceptance.matchAll(/^\| ([FCEVDP]\d{2}) \|/gm)].map(match=>match[1]);
assert.equal(ids.length,49);assert.equal(new Set(ids).size,49);assert.deepEqual([...ids].sort(),[...new Set(expected)].sort());
const states={pass:0,fail:0,manual_pending:0};
for(const row of rows){const state=row.split('|').at(-2).trim();assert.ok(Object.hasOwn(states,state));states[state]++;}
assert.deepEqual(states,{pass:33,fail:1,manual_pending:15});
const files=['baseline.log','verify-final.log','material-final.log','restored-build.log','review.md',
 'delivered-capture.json','delivered-home.png','delivered-hero.png','final-profile.json',
 'production-auto-flow.json','production-auto-flow.log','production-setup.png','production-running.png','production-carry.png','production-results.png',
 'replay/visual-replay.json','replay/11-log-flight.png','full-suite/deployment/subpath.json','full-suite/deployment/ten-cycle-resources.json'];
for(const file of files)await access(`${dir}/${file}`);
const flow=JSON.parse(await readFile(`${dir}/production-auto-flow.json`,'utf8'));
assert.equal(flow.result,'pass');assert.equal(flow.reset,'pass');assert.deepEqual(flow.errors,[]);assert.deepEqual(flow.external,[]);assert.deepEqual(flow.poseRequests,[]);
assert.ok(flow.bundles[0].endsWith('/index-CYPYbaQo.js'));assert.ok(flow.rendering.spanMs>=60000);
const result={date:new Date().toISOString(),scope:'Mechanical unique-ID/status and local evidence existence audit; P01 remains fail. Not physical-camera/hardware/product approval.',
 ids:ids.length,states,files,productionBundle:flow.bundles[0],result:'pass'};
await writeFile(`${dir}/report-audit.json`,JSON.stringify(result,null,2)+'\n');console.log(result);
