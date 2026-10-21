import {readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='artifacts/qa/3d/';
const report=await readFile('docs/TEST_REPORT.md','utf8'),criteria=await readFile('docs/ACCEPTANCE.md','utf8');
const ids=text=>[...text.matchAll(/^\| ([FCEVDP]\d{2}) \|/gm)].map(m=>m[1]);
assert.equal(ids(report).length,49);assert.equal(new Set(ids(report)).size,49);
assert.deepEqual(ids(report).sort(),ids(criteria).sort());
const statuses={},pending=[],failed=[];
for(const line of report.split('\n')){
 const row=line.match(/^\| ([FCEVDP]\d{2}) \|.*\| (pass|fail|manual_pending) \|\s*$/);
 if(!row)continue;statuses[row[2]]=(statuses[row[2]]??0)+1;
 if(row[2]==='manual_pending')pending.push(row[1]);if(row[2]==='fail')failed.push(row[1]);
}
assert.equal(Object.values(statuses).reduce((a,b)=>a+b,0),49);assert.equal(statuses.manual_pending,15);
assert.deepEqual(failed,report.includes('| P01 |')&&/\| P01 \|.*\| fail \|/.test(report)?['P01']:[]);
const verification=await readFile(root+'verify-final.log','utf8');
assert.match(verification,/170 passed/);assert.match(verification,/42 passed/);
const production=JSON.parse(await readFile(root+'production-auto-flow.json','utf8'));
assert.equal(production.result,'pass');assert.equal(production.reset,'pass');
assert.deepEqual(production.errors,[]);assert.deepEqual(production.external,[]);assert.deepEqual(production.poseRequests,[]);
assert.ok(production.rendering.spanMs>=60000);assert.match(production.renderer,/^Three\.js/);
assert.ok(production.gpu);assert.ok(verification.includes(production.bundles[0].split('/').at(-1)));
const evidence=['environment.json','npm-ci.log','assets-sync.log','assets-verify-final.log','verify.log','verify-final.log','review.md',
 'review-unit-red.log','review-unit-green.log','review-browser-red.log','review-browser-green.log',
 'home.png','orbit.png','camera-pip-synthetic.png','results.png','production-home.png','production-auto-flow.json','production-auto-flow.log',
 'production-setup.png','production-running.png','production-results.png',
 'replay/visual-replay.json','deployment/ten-cycle-resources.json','deployment/subpath.json',
 'deployment/desktop-1280x720.png','deployment/desktop-1366x768.png','deployment/desktop-1920x1080.png'].map(f=>root+f);
for(const file of evidence)await access(file);
assert.ok(!/正在执行|待收尾|待运行|not_run/.test(report));
const result={date:new Date().toISOString(),applicationCommit:execFileSync('git',['rev-parse','03e249a'],{encoding:'utf8'}).trim(),
 reportSha256:createHash('sha256').update(report).digest('hex'),ids:49,statuses,failed,pending,evidence,
 scope:'Current true 3D software evidence only; no physical-camera, hardware GPU or product acceptance claim.',result:'pass'};
await writeFile(root+'report-audit.json',JSON.stringify(result,null,2)+'\n');console.log(result);
