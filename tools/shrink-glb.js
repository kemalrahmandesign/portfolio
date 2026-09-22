/* Re-encode a GLB's single texture smaller and rebuild the binary chunk.

   Every bufferView indexes into one shared buffer, so shrinking one of them
   moves every view after it. The buffer is therefore rebuilt from scratch:
   views sorted by offset, copied out, re-laid with 4-byte alignment, and
   their byteOffsets rewritten. Anything less would leave the file the same
   size or corrupt the offsets. */
const fs = require('fs');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const [, , inPath, outPath, maxDimArg, qArg] = process.argv;
const MAX = +(maxDimArg || 1024), Q = +(qArg || 0.82);

function readGlb(buf){
  if (buf.toString('ascii', 0, 4) !== 'glTF') throw new Error('not a glb');
  let o = 12, json = null, bin = null;
  while (o < buf.length){
    const len = buf.readUInt32LE(o), type = buf.toString('ascii', o + 4, o + 8);
    const body = buf.subarray(o + 8, o + 8 + len);
    if (type === 'JSON') json = JSON.parse(body.toString('utf8'));
    else bin = Buffer.from(body);
    o += 8 + len;
  }
  return { json, bin };
}
const pad4 = n => (n + 3) & ~3;

(async () => {
  const { json: J, bin } = readGlb(fs.readFileSync(inPath));
  if (!J.images || !J.images.length) throw new Error('no images');

  const b = await chromium.launch();
  const page = await b.newPage();

  for (const img of J.images){
    const bv = J.bufferViews[img.bufferView];
    const start = bv.byteOffset || 0;
    const bytes = bin.subarray(start, start + bv.byteLength);
    const out = await page.evaluate(async ([b64, mime, max, q]) => {
      const im = new Image();
      im.src = 'data:' + mime + ';base64,' + b64;
      await im.decode();
      const s = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(im.naturalWidth * s);
      c.height = Math.round(im.naturalHeight * s);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      return [c.toDataURL('image/jpeg', q).split(',')[1], im.naturalWidth, im.naturalHeight, c.width, c.height];
    }, [bytes.toString('base64'), img.mimeType || 'image/jpeg', MAX, Q]);
    img.__new = Buffer.from(out[0], 'base64');
    img.mimeType = 'image/jpeg';
    console.log(`  texture ${out[1]}x${out[2]} -> ${out[3]}x${out[4]}, ` +
                `${(bytes.length/1048576).toFixed(2)}MB -> ${(img.__new.length/1048576).toFixed(2)}MB`);
  }
  await b.close();

  // pull every view out, substituting the new image bytes
  const views = J.bufferViews.map((bv, i) => {
    const img = J.images.find(m => m.bufferView === i);
    return { i, bv, data: img ? img.__new : bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength) };
  });
  views.sort((a, c) => (a.bv.byteOffset || 0) - (c.bv.byteOffset || 0));

  const parts = []; let off = 0;
  for (const v of views){
    const padTo = pad4(off);
    if (padTo > off){ parts.push(Buffer.alloc(padTo - off)); off = padTo; }
    v.bv.byteOffset = off;
    v.bv.byteLength = v.data.length;
    parts.push(Buffer.from(v.data));
    off += v.data.length;
  }
  let newBin = Buffer.concat(parts);
  if (newBin.length % 4) newBin = Buffer.concat([newBin, Buffer.alloc(4 - newBin.length % 4)]);
  J.buffers[0].byteLength = newBin.length;
  delete J.buffers[0].uri;
  J.images.forEach(m => { delete m.__new; });

  let js = Buffer.from(JSON.stringify(J), 'utf8');
  if (js.length % 4) js = Buffer.concat([js, Buffer.alloc(4 - js.length % 4, 0x20)]);

  const head = Buffer.alloc(12);
  head.write('glTF', 0, 'ascii');
  head.writeUInt32LE(2, 4);
  head.writeUInt32LE(12 + 8 + js.length + 8 + newBin.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(js.length, 0); jh.write('JSON', 4, 'ascii');
  const bh = Buffer.alloc(8); bh.writeUInt32LE(newBin.length, 0); bh.write('BIN\0', 4, 'ascii');
  fs.writeFileSync(outPath, Buffer.concat([head, jh, js, bh, newBin]));
  console.log('  glb', (fs.statSync(inPath).size/1048576).toFixed(2) + 'MB ->',
              (fs.statSync(outPath).size/1048576).toFixed(2) + 'MB');
})();
