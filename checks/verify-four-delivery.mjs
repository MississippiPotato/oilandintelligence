import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import vm from 'node:vm';import {execFileSync} from 'node:child_process';import {ROOT,REPORT,read,sha} from '../tools/four-exhibit-contract.mjs';
const json=p=>JSON.parse(read(p)),a=json(REPORT+'/accepted-files.json'),b=json(REPORT+'/before.json'),c=json(REPORT+'/completion.json'),h=json(REPORT+'/homepage-files.json');for(const f of [...a.files,...b.otherCaseFiles,...b.protectedFiles,...b.engineFiles,...b.sourceDataFiles,...h.files])assert.equal(sha(f.path),f.sha256,f.path);assert.equal(c.browser.failed,0);assert.equal(c.sourceAndContent.failed,0);assert.equal(c.numericAndProtocol.failed,0);assert.equal(c.otherRuntimeFilesUnchanged,285);assert.equal(c.browser.actualDownloads,12);
const ctx=vm.createContext({});for(const p of ['shared/math.js','case-src/m5/engine.js'])vm.runInContext(read(p),ctx);for(const d of c.actualEvidenceDownloads){assert.equal(sha(d.path),d.sha256);ctx.M5Core.validateEvidence(json(d.path));}
let archiveCount=0;if(!process.argv.includes('--skip-packages')&&fs.existsSync(path.join(ROOT,REPORT,'package-lock.json'))){const lock=json(REPORT+'/package-lock.json');for(const pack of lock.packages){assert.equal(sha(pack.path),pack.sha256,pack.path);for(const item of pack.entries)assert.equal(sha(item.path),item.sha256,'ZIP member source changed: '+item.path);execFileSync('python',['-c',`import sys,json,zipfile,hashlib
with zipfile.ZipFile(sys.argv[1]) as z:
 items=json.load(sys.stdin)
 assert z.testzip() is None
 assert set(z.namelist())==set(x['entry'] for x in items)
 for x in items:assert hashlib.sha256(z.read(x['entry'])).hexdigest()==x['sha256']
`,path.join(ROOT,pack.path)],{input:JSON.stringify(pack.entries),encoding:'utf8',windowsHide:true});archiveCount++;}}
console.log(JSON.stringify({passed:true,scope:'Saved actual Chrome evidence and current artifact integrity; does not operate browser',browser:c.browser.passed,source:c.sourceAndContent.passed,numeric:c.numericAndProtocol.passed,downloadSchemaChecks:12,boundFiles:a.files.length,otherRuntimeFiles:285,archivesCRCAndMembersVerified:archiveCount},null,2));
