import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base=process.env.BASE_URL||'http://127.0.0.1:4178/',out='output/configurator';
await fs.mkdir(out,{recursive:true});
const set=async(p,c)=>{
 await p.evaluate(c=>location.hash='config='+encodeURIComponent(JSON.stringify({...studioDebug.state,...c})),c);
 await p.waitForFunction(c=>Object.entries(c).every(([k,v])=>studioDebug.state[k]===v),c);
 await p.waitForFunction(()=>!studioDebug.inspect().cameraMoving);
};
function verifyGLB(buffer){
 assert.equal(buffer.readUInt32LE(0),0x46546c67);
 const n=buffer.readUInt32LE(12),gltf=JSON.parse(buffer.toString('utf8',20,20+n).trim()),binary=buffer.subarray(28+n);
 const values=id=>{const a=gltf.accessors[id],v=gltf.bufferViews[a.bufferView];assert.equal(a.componentType,5126);const offset=(v.byteOffset||0)+(a.byteOffset||0);return Array.from({length:a.count*({SCALAR:1,VEC3:3,VEC4:4}[a.type])},(_,i)=>binary.readFloatLE(offset+i*4));};
 const coverNodes=gltf.nodes.flatMap((node,i)=>node.extras?.coverFlex?[i]:[]);
 assert.ok(coverNodes.length>0,'GLB must contain flexible cover geometry');
 for(const i of coverNodes){
  const node=gltf.nodes[i],mesh=gltf.meshes[node.mesh];
  assert.ok(mesh.primitives.every(p=>p.targets?.length===1));
  const channel=gltf.animations[0].channels.find(c=>c.target.node===i&&c.target.path==='weights');
  assert.ok(channel,'Cover needs its own morph animation');
  const weights=values(gltf.animations[0].samplers[channel.sampler].output);
  assert.ok(Math.abs(weights[0]-.6)<1e-5);assert.equal(Math.max(...weights),1);assert.equal(weights.at(-1),0);
  assert.ok((node.weights||mesh.weights||[0]).every(w=>w===0),'Export opens with a straight, assembled cover');
 }
 const cap=gltf.nodes.findIndex(n=>n.name==='Montaz_akcesorium_2');
 if(cap>=0){const channel=gltf.animations[0].channels.find(c=>c.target.node===cap&&c.target.path==='translation');const positions=values(gltf.animations[0].samplers[channel.sampler].output);assert.ok(Math.abs(positions[0]-positions[92*3])<1e-6,'End caps must wait until the cover is straight');assert.ok(Math.abs(positions[0]-positions.at(-3))>.01);}
 const paper=gltf.nodes.findIndex(n=>n.name==='Podklad_od_srodka');
 assert.ok(paper>=0);assert.ok(gltf.animations[0].channels.some(c=>c.target.node===paper&&c.target.path==='weights'));
 return coverNodes.length;
}
for(const [engine,width]of [[chromium,1440],[webkit,390],[chromium,320]]){
 const browser=await engine.launch();try{
  const p=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:2}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await p.goto(new URL('konfigurator/',base).href);await p.locator('#start-configurator').click();
  await p.waitForFunction(()=>document.body.dataset.ready==='true');
  await set(p,{housing:'profile',strip:'slim',view:'assembly',assemblyAngle:'perspective',productScale:'detail',exploded:100,light:false,endcaps:true});
  for(const night of [false,true]){
   await set(p,{lightStudy:night});
   const header=await p.locator('.header').evaluate(h=>({loaded:[...h.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0),distributor:h.querySelector('.distributor-mark').getBoundingClientRect().right,brand:h.querySelector('.brand').getBoundingClientRect().left}));
   assert.ok(header.loaded&&header.distributor<header.brand);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   await p.locator('.header').screenshot({path:`${out}/distributor-${width}-${night?'night':'day'}.png`});
  }
  const families=width===1440?[['micro','hs-opal'],['stos','ka13-opal'],['alu45','hs11-opal'],['pds','lenso11'],['pikoo','piko7r-opal']]:[['micro','hs-opal']];
  for(const [profile,cover]of families){
   await set(p,{profile,cover,exploded:100});await p.locator('#reset-camera').click();await p.waitForFunction(()=>!studioDebug.inspect().cameraMoving);
   const camera=await p.evaluate(()=>{const d=studioDebug.inspect();return[d.camera,d.cameraTarget,d.cameraZoom]});
   for(const amount of [100,50,20,14,8,0]){
    await set(p,{exploded:amount});const d=await p.evaluate(()=>studioDebug.inspect());
    assert.deepEqual([d.camera,d.cameraTarget,d.cameraZoom],camera);
    if(amount<=50)assert.equal(d.assembly.pcbLiftMm,0);
    if(amount===20){assert.equal(d.assembly.coverLiftMm,0);assert.equal(d.assembly.coverBend,1);}
    if(amount===14)assert.ok(d.assembly.coverBend>0&&d.assembly.coverBend<1);
    if(amount<=8)assert.equal(d.assembly.coverBend,0);
    if(amount===0)assert.equal(d.assembly.capGap,0);
    if(amount===20||amount===0)await p.locator('#viewport').screenshot({path:`${out}/cover-flex-${width}-${profile}-${amount}.png`});
   }
  }
  await set(p,{profile:'micro',cover:'hs-opal',exploded:100});
  const play=width<781?'#mobile-assembly-play':'#play-mount';
  await p.evaluate(()=>{window.coverFrames=[];window.coverTimer=setInterval(()=>coverFrames.push({...studioDebug.inspect().assembly}),30)});
  await p.locator(play).click();await p.waitForFunction(()=>studioDebug.state.exploded===0,{},{timeout:12000});
  const frames=await p.evaluate(()=>{clearInterval(coverTimer);return coverFrames});
  assert.ok(frames.some(f=>f.coverBend>.9&&f.coverLiftMm===0));
  assert.ok(frames.every(f=>f.coverLift<1?f.pcbLiftMm===0:true));
  await p.locator(play).click();await p.waitForFunction(()=>studioDebug.state.exploded===100,{},{timeout:12000});
  if(width<781){
   await p.locator(play).click();await p.waitForFunction(()=>studioDebug.state.exploded<80);await p.locator(play).click();await p.waitForFunction(()=>studioDebug.state.exploded===100);
  }
  await p.emulateMedia({reducedMotion:'reduce'});await p.locator(play).click();assert.equal(await p.evaluate(()=>studioDebug.inspect().assembly.coverBend),0);
  if(width===1440){
   await set(p,{profile:'pds',cover:'hs11-opal',strip:'wcob',length:100});
   await p.locator('#export-open').click();const waiting=p.waitForEvent('download',{timeout:45000});await p.locator('#export-glb').click();const download=await waiting;
   await download.saveAs(`${out}/cover-flex.glb`);const count=verifyGLB(await fs.readFile(`${out}/cover-flex.glb`));console.log('PASS GLB cover morphs and preserved paper animation',count);
   await p.locator('#export-dialog .close').click();
  }
  await p.waitForTimeout(750);const frame=await p.evaluate(()=>studioDebug.inspect().renderCount);await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>studioDebug.inspect().renderCount),frame);
  assert.deepEqual(errors,[]);console.log('PASS distributor header / cover flex / playback',engine.name(),width);
 }finally{await browser.close()}
}
