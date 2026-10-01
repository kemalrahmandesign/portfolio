// G-Force iPhone shot for the montage: 60fps, 1.75s, fast-to-slow pull-back with a roll.
import {chromium} from 'playwright';import fs from 'fs';
const [W,H,OUT]=[+process.argv[2],+process.argv[3],process.argv[4]];
const only=process.argv[5]?process.argv[5].split(',').map(Number):null;
const FPS=60,DUR=1.75,SUB=+(process.env.SUB||4),SHUTTER=0.5,VF=80;
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:W,height:H}});p.on('pageerror',e=>console.log('err',e));
await p.goto(`http://localhost:8123/iphone.html?w=${W}&h=${H}`);
await p.waitForFunction('window.ready',null,{timeout:120000});
fs.mkdirSync(OUT,{recursive:true});
const clamp=x=>Math.min(1,Math.max(0,x)),lerp=(a,b,t)=>a+(b-a)*t;
const outQuart=x=>1-Math.pow(1-x,4);
function pose(t){const u=outQuart(clamp(t/DUR));
  return {ry:lerp(-1.05,0,u),rx:lerp(0.12,0,u),rz:lerp(-0.16,0,u),py:0,dist:lerp(1.5,2.4,u)};}
const N=Math.round(FPS*DUR);
for(let i=0;i<N;i++){
  if(only&&!only.includes(i))continue;
  const f=`${OUT}/${String(i+1).padStart(4,'0')}.jpg`;if(!only&&fs.existsSync(f))continue;
  const cams=[];for(let k=0;k<SUB;k++)cams.push(pose(Math.max(0,(i+(k/SUB-0.5)*SHUTTER)/FPS)));
  const frame=Math.min(VF,Math.max(1,1+Math.floor(i/FPS*30*1.45)));
  const d=await p.evaluate(([f,c])=>window.renderBlur(f,c),[frame,cams]);
  fs.writeFileSync(f,Buffer.from(d.split(',')[1],'base64'));
}
await b.close();
