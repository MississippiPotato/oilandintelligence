import fs from 'node:fs';
import {ROOT,read,write,walk,record,protectedCheck} from './teaching-map-contract.mjs';
import {caseFolders} from './site-upgrade-contract.mjs';
process.chdir(ROOT);
const REPORT='handoff/teacher-update-2026-11-02';
if(protectedCheck().length)throw Error('Original/calculation files changed');
if(!fs.existsSync(REPORT+'/before.json'))write(REPORT+'/before.json',{
 capturedAt:new Date().toISOString(),baseCommit:'08aa2ac1939fde24f5cd2f4edf566999ddad37ae',
 protectedFiles:JSON.parse(read('handoff/teaching-map-2026-11-01/before.json')).protectedFiles,
 cases:caseFolders().map(folder=>({folder,files:walk(folder).map(record)})),
 historicalReports:walk('handoff/teaching-map-2026-11-01').map(record)
});
process.env.S17_REPORT_DIR=REPORT;process.env.S17_SITE_VERSION='1.13.1';process.env.S17_UPDATED='2026-11-02';
await import('./build-teaching-map.mjs');
