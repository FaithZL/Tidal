import { readFile, writeFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const expected=await readFile('docs/ACCEPTANCE.md','utf8'),report=await readFile('docs/TEST_REPORT.md','utf8');
const ids=text=>[...text.matchAll(/^\| ([FCEVDP]\d{2}) \|/gm)].map(m=>m[1]);
const actual=ids(report);assert.equal(actual.length,49);assert.equal(new Set(actual).size,49);
assert.deepEqual([...actual].sort(),ids(expected).sort());
const statuses={},pending=[],failed=[];
for(const line of report.split('\n')){
  const row=line.match(/^\| ([FCEVDP]\d{2}) \|.*\| (pass|fail|manual_pending|blocked|not_run|waived_by_user) \|\s*$/);
  if(!row)continue;statuses[row[2]]=(statuses[row[2]]??0)+1;
  if(row[2]==='manual_pending')pending.push(row[1]);if(row[2]==='fail')failed.push(row[1]);
}
assert.deepEqual(statuses,{pass:33,manual_pending:15,fail:1});assert.deepEqual(failed,['P01']);
const evidence=['environment.json','npm-ci.log','assets-sync.log','assets-verify.log','verify.log','review.md',
  'calibration-review-red.log','calibration-review-green.log','carry-polling-race.json','carry-polling-green.log',
  'version-mismatch.log','ten-cycle-resources.json','subpath.json','production-auto-flow.json','production-auto-flow.log',
  'performance-probe.json','production-setup.png','production-running.png','production-results.png',
  'desktop-1280x720.png','desktop-1366x768.png','desktop-1920x1080.png'].map(name=>`artifacts/qa/t10/${name}`);
for(const file of evidence)await access(file);
const verification=await readFile('artifacts/qa/t10/verify.log','utf8');
assert.match(verification,/155 passed/);assert.match(verification,/35 passed/);assert.match(verification,/index-CFBWu24Q\.js/);
const production=JSON.parse(await readFile('artifacts/qa/t10/production-auto-flow.json','utf8'));
assert.equal(production.result,'pass');assert.equal(production.reset,'pass');assert.deepEqual(production.errors,[]);
assert.deepEqual(production.external,[]);assert.ok(production.rendering.spanMs>=60000);
assert.ok(!/最终验证及T11审查结果待|最终结果等待回归|仍在复测/.test(report));
const result={date:new Date().toISOString(),applicationCommit:execFileSync('git',['rev-parse','d4d086f'],{encoding:'utf8'}).trim(),
  reportSha256:createHash('sha256').update(report).digest('hex'),ids:actual.length,statuses,failed,pending,evidence,
  scope:'T11 documentation audit only. Reuses the verified T10 application; no new application changes or physical-camera evidence.',result:'pass'};
await writeFile('artifacts/qa/t11/report-audit.json',JSON.stringify(result,null,2)+'\n');console.log(result);
