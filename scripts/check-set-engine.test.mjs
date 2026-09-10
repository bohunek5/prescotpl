import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseRequest, buildSet, makeHandoff, SAMPLE_REQUEST} from '../shop-assistant/engine.mjs';
const catalog = JSON.parse(fs.readFileSync(new URL('../shop-assistant/catalog.json', import.meta.url))).products;
const request = (text, previous) => {const parsed = parseRequest(text, previous); return buildSet(catalog, parsed.intent, parsed.issues);};

test('requested models are selected and 100 W never becomes a length', () => {
  const result = request(SAMPLE_REQUEST);
  assert.equal(result.intent.length, undefined);
  assert.deepEqual(result.items.map(i => i.product.id), [13118, 9447, 19003]);
  assert.equal(result.ready, false);
  assert.throws(() => makeHandoff(result));
});
test('four metres use one five-metre roll and 80 W installed load', () => {
  const result = request('4 m', request(SAMPLE_REQUEST).intent);
  assert.equal(result.ready, true);
  assert.equal(result.load, 80);
  assert.equal(result.minimumPower, 96);
  assert.equal(result.items[0].quantity, 1);
  assert.equal(makeHandoff(result).items[0].id, 13118);
});
test('five metres preserve requested 100 W and offer an explicit correction', () => {
  const tooSmall = request(`${SAMPLE_REQUEST}, 5 m`);
  assert.equal(tooSmall.ready, false);
  assert.equal(tooSmall.items[1].product.watts, 100);
  assert.equal(tooSmall.minimumPower, 120);
  const corrected = request('Dobierz moc do metrażu', tooSmall.intent);
  assert.equal(corrected.ready, true);
  assert.equal(corrected.items[1].product.watts, 150);
});
test('light types remain distinct', () => {
  for (const color of ['CCT', 'RGB', 'RGBW', 'RGB+CCT', 'RGBCCT']) {
    const result = request(`3m COB ${color}, Scharfer, PR Touch`);
    assert.equal(result.color, color.toLowerCase().replace('+', ''));
    assert.ok(result.items.every(i => !i.product.color || i.product.color === result.color));
  }
  assert.equal(request('Sterownik RGBW, taśma RGB+CCT COB 3m').ready, false);
});
test('unsupported voltage and digital tape never form a false compatible kit', () => {
  assert.equal(request('3m COB RGB+CCT 12V').ready, false);
  assert.equal(request('3m cyfrowa COB RGB+CCT, PR Touch').ready, false);
  assert.equal(request('3m COB RGB 48V').ready, false);
});
test('decimal metres and Polish dictation', () => {
  assert.equal(request(`${SAMPLE_REQUEST}, cztery metry`).load, 80);
  assert.equal(request('4,5 metra COB RGB+CCT dobierz moc').load, 90);
  const result = request('4,5 m COB RGB+CCT dobierz moc');
  assert.equal(result.load, 90);
  assert.equal(result.items[0].quantity, 1);
  assert.equal(result.ready, true);
});
test('unknown, zero and negative lengths do not approve a set', () => {
  for (const text of ['0m', '-4m', '101m', 'banana']) assert.equal(request(text, request(SAMPLE_REQUEST).intent).ready, false);
});
test('missing power data and wet installation are reported', () => {
  const intent = request(`${SAMPLE_REQUEST}, 4m`).intent;
  const altered = catalog.map(p => p.id === 13118 ? {...p, watts: null} : p);
  assert.equal(buildSet(altered, intent).ready, false);
  assert.equal(request(`${SAMPLE_REQUEST}, 4m na zewnątrz`).ready, false);
});
test('controller channel limit also constrains longer installations', () => {
  const result = request('10m COB RGB+CCT, PR Touch, dobierz moc');
  assert.equal(result.ready, false);
  assert.ok(result.issues.some(i => i.includes('kanału')));
  assert.ok(result.notes.some(i => i.includes('odcinki')));
});
test('unlisted supply power is not silently replaced', () => {
  const result = request('4m COB RGB+CCT Scharfer 120W PR Touch');
  assert.equal(result.ready, false);
  assert.equal(result.items.some(i => i.product.kind === 'power'), false);
});
