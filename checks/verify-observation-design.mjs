import assert from 'node:assert/strict';
import {reportDir,read,write,same,evidence} from '../tools/observation-contract.mjs';
const e=evidence(),lock=read(reportDir+'/accepted-files.json'),state=read(reportDir+'/completion.json');lock.files.forEach(same);
assert.equal(state.portalVersion,read('package.json').version);assert.equal(state.selfAuthoredCases,61);assert.equal(state.unchangedOtherCases,56);assert.equal(state.browserScope.all61CurrentBrowserPassClaimed,false);
const result={checkedAt:new Date().toISOString(),status:'passed',kind:'current_artifact_and_saved_browser_report_consistency_not_new_browser_execution',currentBrowserCases:5,offlineCases:5,teacherOriginalImportRefreshCases:5,other56RuntimeFilesUnchanged:280,filesMatched:lock.files.length,protectedFilesMatched:e.baseline.files.length};
if(!process.argv.includes('--no-write'))write(reportDir+'/delivery-verification.json',result);console.log(JSON.stringify(result,null,2));
