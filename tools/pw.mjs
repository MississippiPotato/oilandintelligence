import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),cache='D:/Node/node_cache/_npx';
const found=fs.existsSync(cache)?fs.readdirSync(cache).map(n=>path.join(cache,n,'node_modules/@playwright/cli/playwright-cli.js')).find(p=>fs.existsSync(p)):null;
const cli=process.env.S17_PLAYWRIGHT_CLI??found;if(!cli)throw Error('Use npx --package @playwright/cli playwright-cli, or set S17_PLAYWRIGHT_CLI to installed playwright-cli.js');
const [session='s17',...args]=process.argv.slice(2);const r=spawnSync(process.execPath,[cli,'-s='+session,...args],{cwd:root,encoding:'utf8',timeout:90000,windowsHide:true});
const log=path.join(root,'output/playwright/actions.log');fs.mkdirSync(path.dirname(log),{recursive:true});fs.appendFileSync(log,JSON.stringify({timestamp:new Date().toISOString(),session,command:args[0],args:args.slice(1),exitCode:r.status,stdout:r.stdout,stderr:r.stderr})+'\n');
const result=r.stdout?.match(/### Result\s*\n([\s\S]*?)(?:\n###|$)/);if(process.env.S17_REPORT&&result){try{const obj=JSON.parse(result[1].trim());fs.writeFileSync(path.resolve(root,process.env.S17_REPORT),JSON.stringify(obj,null,2));}catch{}}
process.stdout.write(r.stdout??'');process.stderr.write(r.stderr??'');if(r.error)console.error(r.error.message);process.exitCode=/### Error/.test(r.stdout??'')?1:r.status??1;
