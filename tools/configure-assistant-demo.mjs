// Demonstration obfuscation: the browser intentionally receives the decryption key.
// Read the API key through hidden TTY input; never accept it in command arguments.
import fs from 'node:fs';
import path from 'node:path';
import {webcrypto} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
if(!process.stdin.isTTY)throw Error('Use an interactive terminal for hidden key input');
process.stdin.setRawMode(true);process.stdin.resume();
process.stdout.write('Ready for API key on hidden stdin.\n');
let input='';
const secret=await new Promise(resolve=>{const receive=bytes=>{for(const c of bytes.toString()){if(c==='\r'||c==='\n'){process.stdin.off('data',receive);process.stdin.setRawMode(false);process.stdin.pause();resolve(input.trim());input='';return;}if(c==='\u0003')process.exit(1);if(c==='\u007f'||c==='\b')input=input.slice(0,-1);else input+=c;}};process.stdin.on('data',receive);});
if(!secret)throw Error('No API key supplied');
const crypto=webcrypto,key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']),iv=crypto.getRandomValues(new Uint8Array(12)),aad=new TextEncoder().encode('jingjian-demo-key-v1');
const plain=new TextEncoder().encode(secret),encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},key,plain),raw=await crypto.subtle.exportKey('raw',key);
const verified=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},key,encrypted));
if(verified!==secret)throw Error('Encryption round trip failed');
const config={mode:'demo-encrypted',model:'doubao-seed-2-0-mini-260428',endpoint:'https://ark.cn-beijing.volces.com/api/v3/responses',demoKey:{version:1,algorithm:'AES-GCM',key:Buffer.from(raw).toString('base64'),iv:Buffer.from(iv).toString('base64'),ciphertext:Buffer.from(encrypted).toString('base64')}};
const output='// Teaching demo obfuscation. The included browser key makes this envelope recoverable.\nwindow.S17AssistantConfig='+JSON.stringify(config)+';\n';
if(output.includes(secret))throw Error('Plaintext must not appear in the generated configuration');
fs.writeFileSync(path.join(root,'portal/assets/s17-assistant-config.js'),output);
plain.fill(0);new Uint8Array(raw).fill(0);
console.log(JSON.stringify({configured:true,algorithm:'AES-256-GCM',plaintextWritten:false,roundTripVerified:true,publicDecryptionMaterial:true}));
