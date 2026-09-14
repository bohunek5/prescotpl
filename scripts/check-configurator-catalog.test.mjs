import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {profiles,covers,normalize,specification,finishesFor,finishFor} from '../konfigurator/catalog.js';
import {accessoryKit,accessoryCapOptions} from '../konfigurator/accessory-data.js';
import {additionalProfiles,salesRegistry} from '../konfigurator/profile-library.js';

const inside=(x,y,points)=>{let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const[a,b]=points[i],[c,d]=points[j];if((b>y)!=(d>y)&&x<(c-a)*(y-b)/(d-b)+a)hit=!hit;}return hit;};
test('every sale profile has a real finish, a cover and a working bare-PCB configuration',()=>{
 assert.equal(profiles.length,72);assert.equal(new Set(profiles.map(p=>p.ref)).size,72);
 assert.equal(covers.length,42);assert.equal(new Set(covers.map(c=>c.ref)).size,42);
 for(const p of profiles){
  assert.ok(p.covers.length,p.name);assert.ok(finishesFor(p).length,p.name);
  assert.equal(specification(normalize({profile:p.id,strip:'slim'})).fitStatus,'compatible',p.name);
  for(const finish of finishesFor(p))assert.ok(salesRegistry[p.ref].variants.some(v=>v.ref.split('_')[0]===finishFor(p,finish).ref),p.name+' '+finish);
 }
});
test('all reviewed sections keep their dimensions and clear the actual PCB and LED envelope',()=>{
 for(const p of additionalProfiles){
  const outer=p.section.filter(q=>!q.hole);assert.equal(outer.length,1,p.name);
  const xs=outer[0].points.map(q=>q[0]),ys=outer[0].points.map(q=>q[1]);
  assert.ok(Math.abs(Math.max(...xs)-Math.min(...xs)-p.width)<.3,p.name+' width');
  assert.ok(Math.abs(Math.max(...ys)-Math.min(...ys)-p.height)<.3,p.name+' height');
  const a=(p.ledAngle||0)*Math.PI/180;
  const occupied=(x,y)=>inside(x,y,outer[0].points)&&!p.section.some(q=>q.hole&&inside(x,y,q.points));
  for(const width of [4,6,8,10,12]){
   if(width>p.channel)continue;
   for(let i=0;i<=80;i++)for(const h of [.22,.4]){
    const z=(i/80-.5)*width,x=-(p.ledZ||0)-h*Math.sin(a)-z*Math.cos(a),y=p.ledBase+h*Math.cos(a)-z*Math.sin(a);
    assert.equal(occupied(x,y),false,p.name+' '+width+' mm PCB');
   }
  }
  for(const z of [-1.75,0,1.75])for(const h of [.6,1.5,2])assert.equal(occupied(-(p.ledZ||0)-h*Math.sin(a)-z*Math.cos(a),p.ledBase+h*Math.cos(a)-z*Math.sin(a)),false,p.name+' LED package');
 }
});
test('end caps use exact left/right pairs and a wired cap replaces a closed one',()=>{
 for(const [id,expected] of [['micro30degkoz',['C24548C02','C24549C02']],['kopro30',['C24175C02','C24174C02']],['olis',['C24480C02','C24481C02']]]){
  const s=normalize({profile:id,endcaps:true}),kit=accessoryKit(specification(s).profile,s).filter(a=>a.selected&&a.kind.startsWith('endcap'));
  assert.deepEqual(kit.map(a=>a.ref),expected);assert.equal(kit.reduce((n,a)=>n+a.quantity,0),2);
 }
 const s=normalize({profile:'micro',endcaps:true,showCable:true}),kit=accessoryKit(specification(s).profile,s).filter(a=>a.selected);
 assert.equal(kit.reduce((n,a)=>n+(a.quantity||0),0),2);assert.ok(kit.some(a=>a.ref==='C24392C02TW'));
 const kopro=profiles.find(p=>p.id==='kopro');assert.ok(accessoryCapOptions(kopro).every(a=>a.ref.startsWith('C24117')));
});
test('accessory choices survive save/restore and do not leak to another profile',()=>{
 const p=profiles.find(p=>p.id==='kozus'),insert=accessoryKit(p,normalize({profile:p.id})).find(a=>a.kind==='protection'&&a.selected);
 assert.ok(insert);const s=normalize({profile:p.id,excludedAccessoryRefs:[insert.ref]});assert.equal(accessoryKit(p,s).find(a=>a.ref===insert.ref).selected,false);
 const extra=salesRegistry.A06367.accessories.find(a=>a.kind==='connector');assert.ok(extra);
 const selected=normalize({profile:'kopro',accessoryRefs:[extra.ref,extra.ref,'FAKE']});assert.deepEqual(selected.accessoryRefs,[extra.ref]);
 assert.deepEqual(normalize({...selected,profile:'tapo'}).accessoryRefs,[]);
 assert.equal(normalize({profile:'micro',endcapRef:'FAKE'}).endcapRef,null);
});
test('retired references migrate with a visible review requirement for a changed profile',()=>{
 assert.ok(!profiles.some(p=>p.id==='microk'));assert.ok(!covers.some(c=>['hs-opal','hs-clear','hs12-opal','hs12-clear','piko-opal'].includes(c.id)));
 assert.equal(normalize({cover:'hs-opal'}).cover,'hs11-opal');
 const migrated=normalize({profile:'microk'});assert.equal(migrated.profile,'micronk');assert.equal(specification(migrated).fitStatus,'pending');
 assert.ok(specification(migrated).issues.some(i=>i.code==='archived-profile'));
});
test('power and unverified cover clearances stay distinct from presentation controls',()=>{
 assert.ok(specification(normalize({profile:'tapo',strip:'premium-rgbw',dimmer:1})).issues.some(i=>i.code==='profile-power'));
 assert.ok(specification(normalize({profile:'hrslim',strip:'wcob'})).issues.some(i=>i.code==='cover-clearance'));
 for(const view of ['installation','mounting','zone'])assert.equal(normalize({profile:'kopro',view}).view,'assembly');
});
test('all published catalogue evidence points to actual local public documents',()=>{
 for(const p of profiles){
  for(const path of [p.source,p.instruction,...salesRegistry[p.ref].accessories.map(a=>a.source)])assert.ok(fs.existsSync(new URL('../konfigurator/'+path,import.meta.url)),p.name+' '+path);
  for(const a of salesRegistry[p.ref].accessories){assert.ok(a.row>=10);assert.ok(a.sheet.startsWith('Cennik'));assert.ok(!('price' in a));}
 }
});
