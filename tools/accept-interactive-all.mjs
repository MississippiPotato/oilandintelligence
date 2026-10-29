import {spawnSync}from'node:child_process';import{ROOT}from'./interactive-course-contract.mjs';
function run(args){const r=spawnSync(process.execPath,args,{cwd:ROOT,encoding:'utf8',windowsHide:true,timeout:600000});process.stdout.write(r.stdout??'');process.stderr.write(r.stderr??'');if(r.error||r.status)throw r.error??Error(args.join(' ')+' failed');}
for(const mode of ['core','mobile','offline','import','portal','navigation']){run(['tools/accept-interactive-course.mjs',mode,'course-interactive','--open']);run(['tools/pw.mjs','course-interactive','close']);}
const groups={geology:'g1,g2,g3,g4',seismic:'s1,s2,s3,s4,s5','drilling-welllog':'d1,d2,d3,d4,d5,w1,w2,w3,w4,w5','cement-completion':'c1,c2,c3,c4,co1,co2,co3,co4','perforation-production':'p1,p2,p3,p4,pr1,pr2,pr3,pr4,pr5','workover-eor':'wo1,wo2,wo3,wo4,wo5,e1,e2,e3,e4,e5',transport:'t1,t2,t3,t4,t5',refining:'r1,r2,r3,r4,r5'};
for(const[name,scenes]of Object.entries(groups)){run(['tools/accept-course-concepts.mjs',scenes,'course-all-concepts','integrated-'+name]);run(['tools/pw.mjs','course-all-concepts','close']);}
run(['checks/verify-interactive-course.mjs']);
