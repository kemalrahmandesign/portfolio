// Polaris MacBook shot for the montage: half spin, lid opens, then a push into the screen
// that ends with the screen exactly filling a 16:9 frame (so it can hand off to the flat screenshot).
const clamp=x=>Math.min(1,Math.max(0,x)),lerp=(a,b,t)=>a+(b-a)*t;
const outCubic=x=>1-Math.pow(1-x,3),inOutCubic=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2,inCubic=x=>x*x*x;
export const DUR=2.25;
const C={y:3.2039,z:-4.1143},N={y:0.34169,z:0.93981},D=9.6;
const FILL={cy:C.y+N.y*D,dist:C.z+N.z*D,ly:C.y,lz:C.z};
export function pose(t){
  const sp=outCubic(clamp(t/0.95));
  const op=inOutCubic(clamp((t-0.5)/0.95));
  const a=inOutCubic(clamp(t/1.55));
  let cam={dist:lerp(19,15.8,a),cy:lerp(8.5,4.6,a),ly:lerp(0.6,2.3,a),lz:0};
  const w=inCubic(clamp((t-1.55)/0.7));
  if(w>0)cam={dist:lerp(15.8,FILL.dist,w),cy:lerp(4.6,FILL.cy,w),ly:lerp(2.3,FILL.ly,w),lz:lerp(0,FILL.lz,w)};
  return {ry:lerp(-Math.PI,0,sp),rx:0,lid:lerp(1.93,0,op),glow:clamp((op-0.2)/0.55),py:0,...cam};
}
