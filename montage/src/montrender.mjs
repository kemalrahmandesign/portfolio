// Render the reel frame by frame. Usage: node montrender.mjs OUTDIR [f1,f2,...]
import {chromium} from 'playwright';import fs from 'fs';
const OUT=process.argv[2],only=process.argv[3]?process.argv[3].split(',').map(Number):null;
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1920,height:1080}});
p.on('pageerror',e=>console.log('err',e));p.on('console',m=>{if(m.type()==='error')console.log('console',m.text());});
await p.goto('http://localhost:8123/montage.html');
await p.waitForFunction('window.ready',null,{timeout:120000});
console.log('fonts',JSON.stringify(await p.evaluate('window.fontsOK')));
const N=await p.evaluate('window.N');fs.mkdirSync(OUT,{recursive:true});
const list=only||Array.from({length:N},(_,i)=>i);const t0=Date.now();
for(const f of list){const fn=`${OUT}/${String(f).padStart(4,'0')}.jpg`;if(!only&&fs.existsSync(fn))continue;
  const d=await p.evaluate(f=>window.renderFrame(f),f);fs.writeFileSync(fn,Buffer.from(d.split(',')[1],'base64'));
  if(!only&&f%60===0)console.log(f,((Date.now()-t0)/1000).toFixed(0)+'s');}
await b.close();
