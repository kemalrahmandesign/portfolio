import {chromium} from 'playwright';import fs from 'fs';import {pose,DUR} from './pmanim.mjs';
const [W,H,OUT]=[+process.argv[2],+process.argv[3],process.argv[4]];const FPS=60,SUB=+(process.env.SUB||5),SHUTTER=0.5;
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:W,height:H}});p.on('pageerror',e=>console.log('err',e));
await p.goto(`http://localhost:8123/mbp.html?w=${W}&h=${H}&img=./polaris.png`);
await p.waitForFunction('window.ready',null,{timeout:120000});
fs.mkdirSync(OUT,{recursive:true});
const N=135, k=DUR/(N-1);   // last frame lands exactly on the screen-fill pose
for(let i=0;i<N;i++){const f=`${OUT}/${String(i+1).padStart(4,'0')}.jpg`;if(fs.existsSync(f))continue;
  const cams=[];for(let s=0;s<SUB;s++)cams.push(pose(Math.min(DUR,Math.max(0,(i+(s/SUB-0.5)*SHUTTER)*k))));
  const d=await p.evaluate(c=>window.renderBlur(c),cams);fs.writeFileSync(f,Buffer.from(d.split(',')[1],'base64'));}
await b.close();
