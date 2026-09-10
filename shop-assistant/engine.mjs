export const SAMPLE_REQUEST = 'Scharfer 100 W, PR Touch RGB+CCT i taśma COB RGB+CCT';
export const LIGHT_LABELS = {mono: 'MONO', cct: 'CCT', rgb: 'RGB', rgbw: 'RGBW', rgbcct: 'RGB+CCT'};
export const POWER_RESERVE = 1.2;

const normalize = text => String(text || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/ł/g, 'l').toLowerCase();
const decimal = value => Number(value.replace(',', '.'));

export function parseRequest(text, previous = {}) {
  let input = normalize(text).slice(0, 600).replace(/plus/g, '+');
  const words = {jeden: 1, dwa: 2, trzy: 3, cztery: 4, piec: 5, szesc: 6, siedem: 7, osiem: 8, dziewiec: 9, dziesiec: 10, sto: 100};
  input = input.replace(/\b(jeden|dwa|trzy|cztery|piec|szesc|siedem|osiem|dziewiec|dziesiec|sto)\b/g, word => words[word]);
  const intent = /od nowa|nowy zestaw|wyczysc/.test(input) ? {} : {...previous};
  const issues = [];
  let recognized = false;
  const length = input.match(/(-?\d+(?:[.,]\d+)?)\s*(?:metrow|metry|metra|metr|mb|m)(?![a-z])/);
  if (length) {
    recognized = true;
    const value = decimal(length[1]);
    if (value > 0 && value <= 100) intent.length = value;
    else issues.push('Podaj długość większą od 0 i nie większą niż 100 m.');
  }
  const power = input.match(/\b(\d+(?:[.,]\d+)?)\s*(?:watow|waty|wat|w)\b(?!\s*\/)/);
  if (power) {intent.power = decimal(power[1]); recognized = true;}
  if (/dobierz moc|dobierz zasilacz|automatyczn|moc do metrazu/.test(input)) {delete intent.power; recognized = true;}
  const voltage = input.match(/\b(\d+)\s*(?:v|volt|woltow)\b/);
  if (voltage) {intent.voltage = Number(voltage[1]); recognized = true;}
  const colors = [...new Set((input.match(/rgb\s*\+?\s*cct|rgb\s*\+?\s*w|rgb|cct|mono/g) || []).map(x => x.replace(/[\s+]/g, '')))];
  if (colors.length > 1) issues.push('W opisie są różne typy światła. Wybierz jeden typ taśmy i sterownika: MONO, CCT, RGB, RGBW lub RGB+CCT.');
  if (colors.length === 1) {intent.color = colors[0]; recognized = true;}
  const kelvin = input.match(/\b(\d{4})\s*k\b/);
  if (kelvin) {intent.kelvin = Number(kelvin[1]); intent.color = 'mono'; recognized = true;}
  if (/ciepl|neutral|zimn/.test(input) && !colors.length) {
    intent.color = 'mono'; intent.kelvin = /ciepl/.test(input) ? 3000 : /neutral/.test(input) ? 4000 : 6500; recognized = true;
  }
  if (/\bcob\b|bez kropek/.test(input)) {intent.technology = 'cob'; recognized = true;}
  else if (/\bsmd\b/.test(input)) {intent.technology = 'smd'; recognized = true;}
  if (/cyfrow|digital|spi|ic281/.test(input)) {intent.digital = true; recognized = true;}
  if (/analogow|bez cyfrow/.test(input)) {intent.digital = false; recognized = true;}
  if (/zewnatrz|ogrod|taras|prysznic|lazienk/.test(input)) {intent.wet = true; recognized = true;}
  if (/wewnatrz|suche|salon|sypialni|kuchni/.test(input)) {intent.wet = false; recognized = true;}
  if (/scharfer|pr\s*-?\s*touch|zestaw/.test(input)) recognized = true;
  if (!recognized) issues.push('Napisz np. „4 m COB RGB+CCT, Scharfer 100 W i PR Touch” albo doprecyzuj metraż lub napięcie.');
  return {intent, issues};
}

export function buildSet(catalog, intent, parseIssues = []) {
  const issues = [...parseIssues];
  const notes = [];
  const items = [];
  const voltage = intent.voltage || 24;
  const color = intent.color;
  const technology = intent.technology || 'cob';
  if (!color) return {intent, items, issues: [...issues, 'Jaki typ światła wybierasz: MONO, CCT, RGB, RGBW czy RGB+CCT?'], notes, ready: false};
  if (intent.digital) return {intent, items, issues: [...issues, 'Taśma cyfrowa wymaga sterownika cyfrowego. PR Touch 12A jest do taśm analogowych. Zmień wybór na analogowy lub skonsultuj zestaw cyfrowy.'], notes, ready: false};
  const tapes = catalog.filter(p => p.kind === 'tape' && p.voltage === voltage && p.color === color && p.technology === technology && !p.digital && (!intent.kelvin || p.kelvin === intent.kelvin));
  tapes.sort((a, b) => (b.id === 13118) - (a.id === 13118) || Number(!a.watts) - Number(!b.watts) || (a.packLength || 100) - (b.packLength || 100) || a.id - b.id);
  const tape = tapes[0];
  const control = catalog.find(p => p.kind === 'control' && p.color === color && p.voltageMin <= voltage && p.voltageMax >= voltage);
  if (!tape) issues.push(`Brak dokładnej taśmy ${technology.toUpperCase()} ${LIGHT_LABELS[color]} ${voltage} V${intent.kelvin ? ` ${intent.kelvin} K` : ''} w katalogu. Zmień jeden z parametrów.`);
  if (!control) issues.push(`Brak sterownika PR Touch ${LIGHT_LABELS[color]} zgodnego z napięciem ${voltage} V.`);
  let load = null;
  if (tape) {
    if (!tape.watts) issues.push('Brakuje potwierdzonej mocy tej taśmy. Dobór zasilacza wymaga uzupełnienia danych.');
    if (intent.wet && (!tape.ip || tape.ip < 65)) issues.push('Ta taśma nie ma potwierdzonej ochrony do wskazanego wilgotnego miejsca. Dobierz wykonanie i osłonę do miejsca montażu.');
    if (!intent.length) issues.push('Ile metrów taśmy chcesz zamontować? Podaj np. „4 m”, a sprawdzę moc zestawu.');
    if (!tape.byMeter && !tape.packLength) issues.push('Brakuje długości opakowania taśmy — trzeba ją potwierdzić przed zakupem.');
    if (intent.length && tape.watts) load = Math.round(intent.length * tape.watts * 100) / 100;
    const qty = intent.length ? (tape.byMeter ? intent.length : Math.ceil(intent.length / (tape.packLength || 1))) : 1;
    items.push({product: tape, quantity: qty, role: 'Taśma LED', detail: `${voltage} V · ${tape.watts ? `${tape.watts} W/m` : 'moc do sprawdzenia'} · ${tape.byMeter ? 'na metry' : `rolka ${tape.packLength || '?'} m`}`});
    if (intent.length && !tape.byMeter && tape.packLength) notes.push(`Montaż: ${intent.length} m. Zakup: ${qty} × rolka ${tape.packLength} m${qty * tape.packLength > intent.length ? `; pozostaje ${Math.round((qty * tape.packLength - intent.length) * 100) / 100} m` : ''}.`);
    if (tape.maxFeedLength && intent.length > tape.maxFeedLength) notes.push(`Karta taśmy podaje maks. ${tape.maxFeedLength} m odcinka zasilanego jednostronnie. Zaplanuj osobne odcinki zasilania.`);
  }
  const minimumPower = load === null ? null : Math.ceil(load * POWER_RESERVE * 100) / 100;
  const powers = catalog.filter(p => p.kind === 'power' && p.voltage === voltage).sort((a, b) => a.watts - b.watts);
  const power = intent.power ? powers.find(p => p.watts === intent.power) : powers.find(p => p.watts >= (minimumPower || 100));
  if (power) {
    items.push({product: power, quantity: 1, role: 'Zasilacz', detail: `${power.voltage} V DC · ${power.watts} W · Scharfer`});
    if (minimumPower && power.watts < minimumPower) issues.push(`Przy ${intent.length} m taśma pobiera ${load} W. Z przyjętym zapasem 20% potrzeba co najmniej ${minimumPower} W — wybrany zasilacz ${power.watts} W jest za mały dla tego założenia.`);
  } else issues.push(`Brak zasilacza Scharfer ${intent.power ? `${intent.power} W ` : 'o wymaganej mocy '}${voltage} V w katalogu.`);
  if (control) {
    items.push({product: control, quantity: 1, role: 'Sterowanie + pilot', detail: `PR Touch ${LIGHT_LABELS[color]} · ${control.maxAmps} A łącznie`});
    if (load && load > voltage * control.maxAmps) issues.push('Łączne obciążenie przekracza limit tego sterownika. Zestaw wymaga podziału na dodatkowe odbiorniki.');
    else if (load && load > voltage * control.channelAmps) issues.push('Dla tej długości trzeba potwierdzić obciążenie każdego kanału sterownika; samo sprawdzenie prądu łącznego nie wystarcza.');
  }
  const ready = items.length === 3 && !issues.length && load !== null;
  return {intent, items, issues, notes, ready, load, minimumPower, voltage, color, technology};
}

// Handoff contains IDs and quantities only. The shop resolves its own catalog.
export function makeHandoff(result) {
  if (!result.ready) throw new Error('Set needs clarification');
  return {version: 1, intent: result.intent, items: result.items.map(({product, quantity}) => ({id: product.id, qty: quantity}))};
}
