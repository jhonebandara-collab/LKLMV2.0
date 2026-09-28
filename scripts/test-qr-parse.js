#!/usr/bin/env node
/**
 * scripts/test-qr-parse.js — 🔳 QR payload parser එකේ test suite එක
 *
 * ඇයි මේක වැදගත්?
 *   පරණ parser එක **දිනයේ ඉලක්කම් ටිකට් අංක විදිහට** ගන්නවා (2026-09-25 →
 *   "20","26","09","25"), ලග්නය/special number කියවන්නේ නෑ. ඒවා නිසා
 *   පෙන්නන ප්රතිඵලය වැරදි → "දිනුම් නෑ" කියලා පෙන්නනවා ඇත්තට දිනලා තියෙද්දී.
 *
 *   ඒ නිසා ලොතරැයි 16කම ඇත්ත format (numbers count / digit width / letter /
 *   lagna / special) එක්ක real-world payload 25+ක් මෙතන test කරනවා.
 *
 * Run:  node scripts/test-qr-parse.js     (හෝ: npm run test:qr)
 */

'use strict';

const path = require('path');
const P = require(path.join(__dirname, '..', 'public', 'qr-parse.js'));

let pass = 0, fail = 0;
const failures = [];

function ok(name, cond, extra) {
  if (cond) { pass++; }
  else { fail++; failures.push(name + (extra ? ' — ' + extra : '')); }
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (extra ? ' — ' + extra : ''));
}

/** ලොතරැයි 16ක ඇත්ත format (data.json එකෙන්) */
const LOTS = {
  'ada-kotipathi':        { provider: 'DLB', numberCount: 4, digitWidth: 2, hasLetter: 1, hasZodiac: 0, hasSuperNumber: 0 },
  'shanida':              { provider: 'DLB', numberCount: 4, digitWidth: 2, hasLetter: 1, hasZodiac: 0, hasSuperNumber: 0 },
  'lagna-wasana':         { provider: 'DLB', numberCount: 4, digitWidth: 2, hasLetter: 0, hasZodiac: 1, hasSuperNumber: 0 },
  'supiri-dhana-sampatha':{ provider: 'DLB', numberCount: 6, digitWidth: 1, hasLetter: 1, hasZodiac: 0, hasSuperNumber: 0 },
  'super-ball':           { provider: 'DLB', numberCount: 4, digitWidth: 2, hasLetter: 1, hasZodiac: 0, hasSuperNumber: 0 },
  'kapruka':              { provider: 'DLB', numberCount: 4, digitWidth: 2, hasLetter: 1, hasZodiac: 0, hasSuperNumber: 1 },
  'sasiri':               { provider: 'DLB', numberCount: 3, digitWidth: 2, hasLetter: 0, hasZodiac: 0, hasSuperNumber: 0 },
  'jaya-sampatha':        { provider: 'DLB', numberCount: 4, digitWidth: 1, hasLetter: 1, hasZodiac: 0, hasSuperNumber: 0 },
  'mahajana-sampatha':    { provider: 'NLB', numberCount: 6, digitWidth: 1, hasLetter: 1, hasZodiac: 0, hasSuperNumber: 0 },
  'govisetha':            { provider: 'NLB', numberCount: 4, digitWidth: 2, hasLetter: 1, hasZodiac: 0, hasSuperNumber: 0 },
  'dhana-nidhanaya':      { provider: 'NLB', numberCount: 4, digitWidth: 2, hasLetter: 1, hasZodiac: 0, hasSuperNumber: 0 },
  'mega-power':           { provider: 'NLB', numberCount: 4, digitWidth: 2, hasLetter: 1, hasZodiac: 0, hasSuperNumber: 1 },
  'handahana':            { provider: 'NLB', numberCount: 4, digitWidth: 2, hasLetter: 0, hasZodiac: 1, hasSuperNumber: 0 },
  'ada-sampatha':         { provider: 'NLB', numberCount: 2, digitWidth: 1, hasLetter: 0, hasZodiac: 0, hasSuperNumber: 0 },
  'nlb-jaya':             { provider: 'NLB', numberCount: 4, digitWidth: 1, hasLetter: 1, hasZodiac: 0, hasSuperNumber: 0 },
  'suba-dawasak':         { provider: 'NLB', numberCount: 3, digitWidth: 2, hasLetter: 0, hasZodiac: 1, hasSuperNumber: 0 },
};
const lot = slug => LOTS[slug];
const lotObj = slug => Object.assign({ slug }, lot(slug));

/** හරි උත්තරයක් පරීක්ෂා කරන helper */
function check(label, raw, slug, expect) {
  const r = P.parse(raw, lotObj(slug));
  const got = {
    slug: r.slug, drawNo: r.drawNo, date: r.date, letter: r.letter,
    zodiac: r.zodiac, superNumber: r.superNumber, pairs: r.pairs,
    confidence: r.confidence,
  };
  let okAll = true;
  const why = [];

  if (expect.pairs) {
    if (JSON.stringify(got.pairs) !== JSON.stringify(expect.pairs)) {
      okAll = false; why.push('pairs=' + JSON.stringify(got.pairs) + ' expect ' + JSON.stringify(expect.pairs));
    }
  }
  if (expect.pairsLen != null && got.pairs.length !== expect.pairsLen) {
    okAll = false; why.push('pairs.length=' + got.pairs.length + ' expect ' + expect.pairsLen);
  }
  for (const k of ['drawNo', 'date', 'letter', 'zodiac', 'superNumber']) {
    if (expect[k] !== undefined && String(got[k] || '') !== String(expect[k] || '')) {
      okAll = false; why.push(k + '=' + got[k] + ' expect ' + expect[k]);
    }
  }
  if (expect.confidence) {
    const rank = { low: 0, medium: 1, high: 2 };
    if (rank[got.confidence] < rank[expect.confidence]) {
      okAll = false; why.push('confidence=' + got.confidence + ' expect>=' + expect.confidence);
    }
  }
  // ⚠️ හැමවෙලාවෙම: දිනයේ ඉලක්කම් අංක විදිහට ආවොත් fail
  //    (1-ඉලක්කම් ලොතරැයිවල "9"/"5" වගේ ඇත්ත අංකයි දිනයේ ඉලක්කමුයි ගැටෙන නිසා
  //     ඒවායේ exact pairs test එකෙන් විතරයි බලන්නේ)
  if (r.date && expect.pairsLen !== 1 && r.digitWidth !== 1) {
    const [, Y, M, D] = r.date.match(/^(\d{4})-(\d{2})-(\d{2})$/) || [];
    const bad = r.pairs.filter(p => p === Y || p === M || p === D ||
      p === String(Number(M)) || p === String(Number(D)) || p === Y + M + D);
    // අංක 4ක් තියෙන ලොතරැයියක "09" වගේ අංකයක් ඇත්තටම තියෙන්න පුළුවන් නිසා
    // එකම අගය 1ක් විතරක් නම් fail කරන්නේ නෑ — දෙකක් හෝ වැඩි නම් fail.
    if (bad.length > 1) { okAll = false; why.push('දිනයේ ඉලක්කම් pairs වලට ආවා: ' + bad.join(',')); }
  }
  if (expect.notPairsAny) {
    const bad = got.pairs.filter(p => expect.notPairsAny.includes(p));
    if (bad.length) { okAll = false; why.push('මේවා ආවා නොවිය යුතුයි: ' + bad.join(',')); }
  }
  ok(label, okAll, why.join(' | '));
}

console.log('══════════════════════════════════════════════════════');
console.log('  🔳 QR payload parser tests');
console.log('══════════════════════════════════════════════════════');

/* ------------------------------------------------------------------ 1 */
console.log('\n1. 🟦 2-ඉලක්කම් අංක 4ක් + English අකුර (DLB/NLB සාමාන්‍ය)');
check('ada-kotipathi · kv + DATE + LETTER + SER',
  'DLB|ADA KOTIPATHI|DRAW:3121|DATE:2026-09-25|LETTER:I|SER:8842193|12 45 67 89',
  'ada-kotipathi',
  { slug: 'ada-kotipathi', drawNo: '3121', date: '2026-09-25', letter: 'I', pairs: ['12', '45', '67', '89'], confidence: 'high' });

check('ada-kotipathi · JSON',
  JSON.stringify({ lottery: 'Ada Kotipathi', drawNo: '3121', date: '2026-09-25', letter: 'I', numbers: ['12', '45', '67', '89'], serial: '8842193' }),
  'ada-kotipathi',
  { drawNo: '3121', date: '2026-09-25', letter: 'I', pairs: ['12', '45', '67', '89'], confidence: 'high' });

check('govisetha · URL params',
  'https://dlb.lk/verify?draw=4563&n=12,45,67,89&letter=T&date=2026-09-25',
  'govisetha',
  { drawNo: '4563', date: '2026-09-25', letter: 'T', pairs: ['12', '45', '67', '89'] });

check('super-ball · date පළමුවෙන් තියෙන payload',
  'DATE 2026-09-25 DRAW 3295 LETTER H NUMBER 12 45 67 89 SERIAL 9912345',
  'super-ball',
  { drawNo: '3295', date: '2026-09-25', letter: 'H', pairs: ['12', '45', '67', '89'] });

check('dhana-nidhanaya · අංක එකට (12456789)',
  'NLB DHANA NIDHANAYA DRAW 2351 2026-09-25 LETTER B 12456789',
  'dhana-nidhanaya',
  { drawNo: '2351', date: '2026-09-25', letter: 'B', pairs: ['12', '45', '67', '89'] });

/* ------------------------------------------------------------------ 2 */
console.log('\n2. 🟩 1-ඉලක්කම් අංක 6ක් + English අකුර (Mahajana / Supiri)');
check('mahajana-sampatha · kv',
  'MAHAJANA SAMPATHA DRAW:6321 DATE:2026-09-25 LETTER:S SER:7712345 9 8 6 1 5 9',
  'mahajana-sampatha',
  { drawNo: '6321', date: '2026-09-25', letter: 'S', pairs: ['9', '8', '6', '1', '5', '9'], confidence: 'high' });

check('mahajana-sampatha · අංක එකට (986159)',
  'MAHAJANA SAMPATHA 6321 2026-09-25 S 986159 SER 7712345',
  'mahajana-sampatha',
  { drawNo: '6321', date: '2026-09-25', letter: 'S', pairs: ['9', '8', '6', '1', '5', '9'] });

check('supiri-dhana-sampatha · 6×1',
  'SUPIRI DHANA SAMPATHA|DRAW 1029|DATE 2026-09-25|LETTER X|1 2 3 4 5 6|SER 5544332',
  'supiri-dhana-sampatha',
  { drawNo: '1029', date: '2026-09-25', letter: 'X', pairs: ['1', '2', '3', '4', '5', '6'], confidence: 'high' });

check('nlb-jaya · 4×1',
  'NLB JAYA DRAW:0589 DATE:2026-09-25 LETTER:B 1 2 3 4',
  'nlb-jaya',
  { drawNo: '0589', date: '2026-09-25', letter: 'B', pairs: ['1', '2', '3', '4'] });

/* ------------------------------------------------------------------ 3 */
console.log('\n3. 🟨 ලග්නය (zodiac) + 2-ඉලක්කම් අංක');
check('lagna-wasana · English lagna',
  'LAGNA WASANA DRAW:5007 DATE:2026-09-25 LAGNA:GEMINI 12 45 67 89 SER:1122334',
  'lagna-wasana',
  { drawNo: '5007', date: '2026-09-25', zodiac: 'GEMINI', pairs: ['12', '45', '67', '89'], confidence: 'high' });

check('lagna-wasana · සිංහල ලග්නය (මිථුන)',
  'ලග්න වාසනා | අංකය 5007 | දිනය 2026-09-25 | ලග්නය: මිථුන | 12 45 67 89',
  'lagna-wasana',
  { drawNo: '5007', date: '2026-09-25', zodiac: 'GEMINI', pairs: ['12', '45', '67', '89'] });

check('handahana · ලග්න ලකුණ (♊) + dd/mm/yyyy',
  'HANDAHANA 1630 25/09/2026 ♊ 12 45 67 89',
  'handahana',
  { drawNo: '1630', date: '2026-09-25', zodiac: 'GEMINI', pairs: ['12', '45', '67', '89'] });

check('suba-dawasak · Tamil lagna + 3×2',
  'SUBA DAWASAK 0437 2026-09-25 ரிஷபம் 12 45 67',
  'suba-dawasak',
  { drawNo: '0437', date: '2026-09-25', zodiac: 'TAURUS', pairs: ['12', '45', '67'] });

/* ------------------------------------------------------------------ 4 */
console.log('\n4. 🟧 Special / Super number + English අකුර');
check('kapruka · SN keyword',
  'KAPRUKA|DRAW:2471|DATE:2026-09-25|LETTER:K|SPECIAL:37|SER:7745123|12 45 67 89',
  'kapruka',
  { drawNo: '2471', date: '2026-09-25', letter: 'K', superNumber: '37', pairs: ['12', '45', '67', '89'], confidence: 'high' });

check('mega-power · SN අංක කාණ්ඩයට කලින් (14)',
  'MEGA POWER 2669 2026-09-25 L Z SN 14 22 45 67 89 SER 8823116',
  'mega-power',
  { drawNo: '2669', date: '2026-09-25', letter: 'Z', superNumber: '14', pairs: ['22', '45', '67', '89'] });

check('mega-power · JSON SN',
  JSON.stringify({ lottery: 'Mega Power', drawNo: '2669', date: '2026-09-25', letter: 'Z', superNumber: '14', numbers: ['22', '45', '67', '89'] }),
  'mega-power',
  { drawNo: '2669', letter: 'Z', superNumber: '14', pairs: ['22', '45', '67', '89'], confidence: 'high' });

/* ------------------------------------------------------------------ 5 */
console.log('\n5. ⚪ සරල ඒවා (අකුරක් නැති / අංක 3ක්)');
check('sasiri · 3×2 අකුරක් නෑ',
  'SASIRI DRAW:1125 DATE:2026-09-25 12 45 67 SER:6655443',
  'sasiri',
  { drawNo: '1125', date: '2026-09-25', pairs: ['12', '45', '67'], confidence: 'high' });

check('shanida · අංක 4ක්',
  'SHANIDA 5456 2026-09-25 G 12 45 67 89',
  'shanida',
  { drawNo: '5456', date: '2026-09-25', letter: 'G', pairs: ['12', '45', '67', '89'] });

check('ada-sampatha · multi 2×1',
  'ADA SAMPATHA 0896 2026-09-25 7 3 4455120',
  'ada-sampatha',
  { drawNo: '0896', date: '2026-09-25', pairs: ['7', '3'] });

/* ------------------------------------------------------------------ 6 */
console.log('\n6. 🚫 දිනය අංකයක් විදිහට නොගැනීම (මුල් bug එක)');
{
  const r = P.parse('3121 20260925 I 12 45 67 89 8842193', lotObj('ada-kotipathi'));
  ok('YYYYMMDD දිනය — pairs වලට "20","26","09","25" ආවේ නෑ',
    r.date === '2026-09-25' && JSON.stringify(r.pairs) === JSON.stringify(['12', '45', '67', '89']),
    'date=' + r.date + ' pairs=' + JSON.stringify(r.pairs));

  const r2 = P.parse('ADA KOTIPATHI 25-09-2026 3121 I 12 45 67 89', lotObj('ada-kotipathi'));
  ok('DD-MM-YYYY දිනය — දිනයේ අංක pairs වලට ආවේ නෑ',
    r2.date === '2026-09-25' && !r2.pairs.includes('25') && !r2.pairs.includes('09'),
    'date=' + r2.date + ' pairs=' + JSON.stringify(r2.pairs));

  const r3 = P.parse('MAHAJANA SAMPATHA DRAW 6321 2026/09/25 S 9 8 6 1 5 9 SER 7712345', lotObj('mahajana-sampatha'));
  ok('1-ඉලක්කම් 6ක් + දිනය — දිනය අංක වලට ආවේ නෑ',
    r3.date === '2026-09-25' && JSON.stringify(r3.pairs) === JSON.stringify(['9', '8', '6', '1', '5', '9']),
    'pairs=' + JSON.stringify(r3.pairs));

  const r4 = P.parse('KAPRUKA DRAW 2471 DATE 2026-09-25 LETTER K SPECIAL 37 SER 7745123 12 45 67 89', lotObj('kapruka'));
  ok('serial (7 ඉලක්කම්) අංක විදිහට ආවේ නෑ',
    !r4.pairs.includes('7745123') && r4.serial === '7745123',
    'pairs=' + JSON.stringify(r4.pairs) + ' serial=' + r4.serial);
}

/* ------------------------------------------------------------------ 7 */
console.log('\n7. ⚠️ අඩු දත්ත — වැරදි ප්‍රතිඵලයක් නොදෙන ලෙස confidence පහත');
{
  const r = P.parse('LAGNA WASANA DRAW 5007 2026-09-25 12 45 67 89', lotObj('lagna-wasana'));
  ok('ලග්නය නැති payload → missing වලට zodiac එකතු වුනා',
    r.missing.indexOf('zodiac') >= 0 && r.confidence !== 'high',
    'missing=' + JSON.stringify(r.missing) + ' conf=' + r.confidence);

  const r2 = P.parse('SHANIDA 5456 2026-09-25 12 45 67', lotObj('shanida'));
  ok('අංක 3ක් විතරයි (4ක් ඕන) → numbers missing + low',
    r2.missing.indexOf('numbers') >= 0 && r2.confidence === 'low',
    'missing=' + JSON.stringify(r2.missing) + ' conf=' + r2.confidence);

  const r3 = P.parse('KAPRUKA DRAW 2471 LETTER K 12 45 67 89', lotObj('kapruka'));
  ok('special number නැති නම් missing වලට superNumber',
    r3.missing.indexOf('superNumber') >= 0,
    'missing=' + JSON.stringify(r3.missing));
}

/* ------------------------------------------------------------------ 8 */
console.log('\n8. 🔍 ලොතරැයි QR එකක්ද නැද්ද (classification)');
{
  const wifi = P.parse('WIFI:S:MyHome;T:WPA;P:12345678;;', null);
  ok('WiFi QR → lottery නොවේ',
    P.looksLikeLottery('WIFI:S:MyHome;T:WPA;P:12345678;;', wifi) === false);

  const yt = P.parse('https://youtube.com/watch?v=abc123', null);
  ok('YouTube URL → lottery නොවේ',
    P.looksLikeLottery('https://youtube.com/watch?v=abc123', yt) === false);

  const good = P.parse('MAHAJANA SAMPATHA DRAW 6321 2026-09-25 S 9 8 6 1 5 9', null);
  ok('ඇත්ත lottery QR → lottery ✓',
    P.looksLikeLottery('MAHAJANA SAMPATHA DRAW 6321 2026-09-25 S 9 8 6 1 5 9', good) === true);
}

/* ------------------------------------------------------------------ 9 */
console.log('\n9. 🧠 ලොතරැයිය හඳුනාගැනීම (slug) — payload එකෙන් විතරයි');
{
  const cases = [
    ['MAHAJANA SAMPATHA 6321 9 8 6 1 5 9', 'mahajana-sampatha'],
    ['ගොවිසෙත DRAW 4563 T 12 45 67 89', 'govisetha'],
    ['ලග්න වාසනා 5007 මිථුන 12 45 67 89', 'lagna-wasana'],
    ['කප්‍රුක 2471 K 37 12 45 67 89', 'kapruka'],
    ['MEGA POWER 2669 Z 14 22 45 67 89', 'mega-power'],
    ['සුබ දවසක් 0437 රිෂබ 12 45 67', 'suba-dawasak'],
    ['ADA KOTIPATHI 3121 I 12 45 67 89', 'ada-kotipathi'],
  ];
  for (const [raw, slug] of cases) {
    const r = P.parse(raw, null);
    ok('"' + raw.slice(0, 26) + '…" → ' + slug + ' (' + (r.slug || 'හම්බුනේ නෑ') + ')',
      r.slug === slug, 'got=' + r.slug);
  }
}

/* ----------------------------------------------------------------- 10 */
console.log('\n10. 🔢 අංක 4ම ලොතරැයි 16ටම (regression — හැම format එකක්ම)');
{
  const cases = [
    ['ada-kotipathi', 'ADA KOTIPATHI DRAW 3121 DATE 2026-09-25 LETTER I 12 45 67 89', ['12', '45', '67', '89']],
    ['shanida', 'SHANIDA DRAW 5456 DATE 2026-09-25 LETTER G 12 45 67 89', ['12', '45', '67', '89']],
    ['lagna-wasana', 'LAGNA WASANA DRAW 5007 DATE 2026-09-25 LAGNA GEMINI 12 45 67 89', ['12', '45', '67', '89']],
    ['supiri-dhana-sampatha', 'SUPIRI DHANA SAMPATHA DRAW 1029 DATE 2026-09-25 LETTER X 1 2 3 4 5 6', ['1', '2', '3', '4', '5', '6']],
    ['super-ball', 'SUPER BALL DRAW 3295 DATE 2026-09-25 LETTER H 12 45 67 89', ['12', '45', '67', '89']],
    ['kapruka', 'KAPRUKA DRAW 2471 DATE 2026-09-25 LETTER K SPECIAL 37 12 45 67 89', ['12', '45', '67', '89']],
    ['sasiri', 'SASIRI DRAW 1125 DATE 2026-09-25 12 45 67', ['12', '45', '67']],
    ['jaya-sampatha', 'JAYA SAMPATHA DRAW 503 DATE 2026-09-25 LETTER X 1 2 3 4', ['1', '2', '3', '4']],
    ['mahajana-sampatha', 'MAHAJANA SAMPATHA DRAW 6321 DATE 2026-09-25 LETTER S 9 8 6 1 5 9', ['9', '8', '6', '1', '5', '9']],
    ['govisetha', 'GOVISETHA DRAW 4563 DATE 2026-09-25 LETTER T 12 45 67 89', ['12', '45', '67', '89']],
    ['dhana-nidhanaya', 'DHANA NIDHANAYA DRAW 2351 DATE 2026-09-25 LETTER B 12 45 67 89', ['12', '45', '67', '89']],
    ['mega-power', 'MEGA POWER DRAW 2669 DATE 2026-09-25 LETTER Z SPECIAL 14 22 45 67 89', ['22', '45', '67', '89']],
    ['handahana', 'HANDAHANA DRAW 1630 DATE 2026-09-25 LAGNA GEMINI 12 45 67 89', ['12', '45', '67', '89']],
    ['ada-sampatha', 'ADA SAMPATHA DRAW 0896 DATE 2026-09-25 7 3', ['7', '3']],
    ['nlb-jaya', 'NLB JAYA DRAW 0589 DATE 2026-09-25 LETTER B 1 2 3 4', ['1', '2', '3', '4']],
    ['suba-dawasak', 'SUBA DAWASAK DRAW 0437 DATE 2026-09-25 LAGNA ARIES 12 45 67', ['12', '45', '67']],
  ];
  for (const [slug, raw, pairs] of cases) {
    const r = P.parse(raw, lotObj(slug));
    ok(slug.padEnd(22) + ' → ' + JSON.stringify(r.pairs),
      JSON.stringify(r.pairs) === JSON.stringify(pairs) && r.date === '2026-09-25',
      'pairs=' + JSON.stringify(r.pairs) + ' date=' + r.date);
  }
}

/* ----------------------------------------------------------------- 11 */
console.log('\n11. 🅰️ අකුරු + special letter');
{
  const r = P.parse('KAPRUKA DRAW:2471 DATE:2026-09-25 LETTER:K SPECIAL LETTER:X SPECIAL NO:37 12 45 67 89', lotObj('kapruka'));
  ok('අකුර (K) + special letter (X) + special no (37) — තුනම කියවුනා',
    r.letter === 'K' && r.specialLetter === 'X' && String(r.superNumber) === '37',
    'letter=' + r.letter + ' specialLetter=' + r.specialLetter + ' sn=' + r.superNumber);
  ok('හැම තනි අකුරක්ම letters[] එකේ තියෙනවා',
    Array.isArray(r.letters) && r.letters.indexOf('K') >= 0,
    JSON.stringify(r.letters));

  const r2 = P.parse('MEGA POWER 2669 2026-09-25 L Z SN 14 22 45 67 89', lotObj('mega-power'));
  ok('Mega Power — අකුර Z, අගුල්ලන අකුරු ලැයිස්තුවේ',
    r2.letter === 'Z' && r2.letters.length >= 2,
    'letter=' + r2.letter + ' letters=' + JSON.stringify(r2.letters));

  const r3 = P.parse('GOVISETHA DRAW 4563 DATE 2026-09-25 LETTER T 12 45 67 89', lotObj('govisetha'));
  ok('අකුරු එකක් විතරයි නම් specialLetter null',
    r3.letter === 'T' && r3.specialLetter === null,
    'letter=' + r3.letter + ' special=' + r3.specialLetter);
}

/* ----------------------------------------------------------------- 12 */
console.log('\n12. 🔁 ඉලක්කම් 1/2 ආකාරය වෙනස් වුනත් හරියටම ගැලපෙනවා');
{
  // ලොතරැයිය 2 බැගින් ඕන (ගොවිසෙත 4×2) ඒත් QR එකේ ඉලක්කම් 1 බැගින්
  const r = P.parse('GOVISETHA DRAW 4563 DATE 2026-09-25 LETTER T 1 2 4 5 6 7 8 9', lotObj('govisetha'));
  ok('1 බැගින් තිබ්බත් 2 බැගින් හදලා ගත්තා ("12 45 67 89")',
    JSON.stringify(r.pairs) === JSON.stringify(['12', '45', '67', '89']),
    JSON.stringify(r.pairs) + ' order=' + r.order);

  // ලොතරැයිය 1 බැගින් ඕන (මහජන 6×1) ඒත් QR එකේ 2 බැගින්
  const r2 = P.parse('MAHAJANA SAMPATHA DRAW 6321 DATE 2026-09-25 LETTER S 98 61 59 7712345', lotObj('mahajana-sampatha'));
  ok('2 බැගින් තිබ්බත් 1 බැගින් 6ක් හදලා ගත්තා',
    JSON.stringify(r2.pairs) === JSON.stringify(['9', '8', '6', '1', '5', '9']),
    JSON.stringify(r2.pairs) + ' order=' + r2.order);

  // ගාන ගැලපෙන්නේ නැත්නම් බලෙන් හදන්නේ නෑ (වැරදි ප්‍රතිඵලයක් නොදෙන්න)
  const r3 = P.parse('GOVISETHA DRAW 4563 DATE 2026-09-25 LETTER T 1 2 4', lotObj('govisetha'));
  ok('ඉලක්කම් මදි නම් බලෙන් හදන්නේ නෑ (confidence පහත)',
    r3.pairs.length < 4 && r3.confidence !== 'high',
    JSON.stringify(r3.pairs) + ' conf=' + r3.confidence);
}

/* ----------------------------------------------------------------- 13 */
console.log('\n13. 🎫 ඇත්ත ටිකට් අනන්‍යතාව (NLB/DLB QR + barcode) — අංක QR එකේ නෑ');
{
  // NLB barcode: 3-ඉලක්කම් කේතය + 5-ඉලක්කම් draw (බිංදු පිරවූ) + 7-ඉලක්කම් serial
  const r1 = P.parse('085016050326004', null);
  ok('NLB ඉලක්කම් 15 → board/draw/serial හරියටම',
    r1.board === 'NLB' && r1.drawNo === '1605' && r1.serial === '0326004' && r1.lotteryCode === '085',
    JSON.stringify({ b: r1.board, d: r1.drawNo, s: r1.serial, c: r1.lotteryCode }));
  ok('🚫 IMPORTANT: ඒ ඉලක්කම් වලින් ටිකට් අංක හදන්නේ නෑ (කලින් හදනවා)',
    Array.isArray(r1.pairs) && r1.pairs.length === 0 && r1.identityOnly === true,
    JSON.stringify(r1.pairs) + ' ident=' + r1.identityOnly);

  // DLB hyphen: DRAW-SERIAL-CHECK-TERMINAL
  const r2 = P.parse('4993-500395754-7-04', null);
  ok('DLB "4993-500395754-7-04" → DLB/draw 4993/serial',
    r2.board === 'DLB' && r2.drawNo === '4993' && r2.serial === '500395754' && r2.identityOnly,
    JSON.stringify({ b: r2.board, d: r2.drawNo, s: r2.serial }));
  const r3 = P.parse('3112-140717518-5-04', null);
  ok('DLB "3112-140717518-5-04" → draw 3112', r3.drawNo === '3112' && r3.board === 'DLB', r3.drawNo);

  // URL QR
  const r4 = P.parse('https://www.nlb.lk/results/handahana/1605', null);
  ok('NLB URL → board NLB · draw 1605 · ලොතරැයිය handahana',
    r4.board === 'NLB' && r4.drawNo === '1605' && r4.slug === 'handahana' && r4.identityOnly,
    JSON.stringify({ b: r4.board, d: r4.drawNo, s: r4.slug }));
  const r5 = P.parse('https://www.dlb.lk/result/en?draw=3121', null);
  ok('DLB URL (?draw=) → draw 3121', r5.board === 'DLB' && r5.drawNo === '3121', r5.drawNo);

  // අංක QR එකේ ඇත්තටම තියෙන URL එකක් (කලාතුරකින්)
  const r6 = P.parse('https://dlb.lk/verify?draw=4563&n=12,45,67,89&letter=T', lotObj('govisetha'));
  ok('අංක තියෙන URL QR එකක් නම් අංකත් කියවනවා (identityOnly නොවේ)',
    r6.pairs.length === 4 && r6.letter === 'T' && r6.drawNo === '4563' && !r6.identityOnly,
    JSON.stringify({ p: r6.pairs, l: r6.letter, d: r6.drawNo, i: r6.identityOnly }));

  // Lottery-ness: ඇත්ත ටිකට් කේත ලොතරැයි QR විදිහට අඳුනගන්න ඕන
  ok('ලොතරැයි QR එකක් විදිහට අඳුනගන්නවා (NLB 15 · DLB hyphen · URL)',
    P.looksLikeLottery('085016050326004', r1) &&
    P.looksLikeLottery('4993-500395754-7-04', r2) &&
    P.looksLikeLottery('https://www.nlb.lk/results/handahana/1605', r4));

  // WIFI / YouTube තවම ලොතරැයි නොවේ
  ok('WIFI/YouTube QR තවමත් "ලොතරැයි QR නොවේ"',
    !P.looksLikeLottery('WIFI:S:Home;T:WPA;P:12345678;;', P.parse('WIFI:S:Home;T:WPA;P:12345678;;', null)) &&
    !P.looksLikeLottery('https://youtube.com/watch?v=abc123', P.parse('https://youtube.com/watch?v=abc123', null)));
}

/* ----------------------------------------------------------------- 14 */
console.log('\n14. 📣 ඔයා report කරපු ලොතරැයි 6 (දැන් හරි)');
{
  const L = {
    'lagna-wasana': { slug: 'lagna-wasana', provider: 'DLB', numberCount: 4, digitWidth: 2, hasZodiac: true },
    'handahana': { slug: 'handahana', provider: 'NLB', numberCount: 4, digitWidth: 2, hasZodiac: true },
    'mega-power': { slug: 'mega-power', provider: 'NLB', numberCount: 4, digitWidth: 2, hasLetter: true, hasSuperNumber: true },
    'shanida': { slug: 'shanida', provider: 'DLB', numberCount: 4, digitWidth: 2, hasLetter: true },
    'mahajana-sampatha': { slug: 'mahajana-sampatha', provider: 'NLB', numberCount: 6, digitWidth: 1, hasLetter: true },
    'ada-kotipathi': { slug: 'ada-kotipathi', provider: 'DLB', numberCount: 4, digitWidth: 2, hasLetter: true },
  };

  // ① ලග්න වාසනා — "අංක 4න් 2යි කියවුනේ" → දැන් 4ම
  const a = P.parse('DLB LAGNA WASANA 4993 LAGNA:5 12 45 67 89', L['lagna-wasana']);
  ok('ලග්න වාසනා: අංක **4ම** කියවුනා (කලින් 2යි)', a.pairs.length === 4, JSON.stringify(a.pairs));
  ok('ලග්න වාසනා: ලග්නය අංකයකින් (5 → LEO/සිංහ) කියවුනා', a.zodiac === 'LEO' && a.zodiacNumeric === 5,
    'zodiac=' + a.zodiac + ' n=' + a.zodiacNumeric);

  // ② හඳහන — "ලග්නය identify කරන්නේ නෑ"
  const b = P.parse('HADAHANA 1605 LAGNA GEMINI 12 45 67 89', L['handahana']);
  ok('හඳහන: ලග්නය (GEMINI) හඳුනාගත්තා', b.zodiac === 'GEMINI', 'zodiac=' + b.zodiac);
  ok('හඳහන: අංක 4ම', b.pairs.length === 4, JSON.stringify(b.pairs));

  // ③ මෙගා පවර් — "super no වැරදියට කියවනවා"
  const c = P.parse('MEGA POWER 2340 LETTER K SPECIAL 37 12 45 67 89', L['mega-power']);
  ok('මෙගා පවර්: super number = 37 (අංක 12,45,67,89 නෙවෙයි)',
    c.superNumber === '37', 'sn=' + c.superNumber + ' pairs=' + JSON.stringify(c.pairs));
  ok('මෙගා පවර්: අකුර K + අංක 4ම', c.letter === 'K' && c.pairs.length === 4,
    'letter=' + c.letter + ' pairs=' + JSON.stringify(c.pairs));

  // ④ ශනිදා — "කියවන අංක වැරදියි"
  const d = P.parse('SHANIDA 5456 G 12 45 67 89', L['shanida']);
  ok('ශනිදා: අකුර G + අංක 12,45,67,89 හරියටම',
    d.letter === 'G' && JSON.stringify(d.pairs) === JSON.stringify(['12', '45', '67', '89']),
    'letter=' + d.letter + ' pairs=' + JSON.stringify(d.pairs));

  // ⑤ අද කෝටිපති — "ප්‍රතිඵලය වැරදි"
  const e = P.parse('ADA KOTIPATHI 3121 2026-09-25 LETTER T 12 45 67 89', L['ada-kotipathi']);
  ok('අද කෝටිපති: අකුර T + අංක 4ම + දිනය අංක වලට ආවේ නෑ',
    e.letter === 'T' && JSON.stringify(e.pairs) === JSON.stringify(['12', '45', '67', '89']) && e.date === '2026-09-25',
    JSON.stringify({ letter: e.letter, pairs: e.pairs, date: e.date }));

  // ⑥ මහජන සම්පත — "සමහර ඒවාට ඉංග්‍රීසි අකුර read වෙන්නේ නෑ"
  const f1 = P.parse('MAHAJANA SAMPATHA 6321 S 9 8 6 1 5 9', L['mahajana-sampatha']);
  ok('මහජන: අකුර S (label නැතිව, තනි අකුර විදිහට) කියවුනා', f1.letter === 'S',
    'letter=' + f1.letter);
  const f2 = P.parse('MAHAJANA SAMPATHA 6321 2026-09-25 S 986159 SER 7712345', L['mahajana-sampatha']);
  ok('මහජන: අකුර + අංක 6ම (එකට ලියපු "986159" කැබලි කරලා)',
    f2.letter === 'S' && JSON.stringify(f2.pairs) === JSON.stringify(['9', '8', '6', '1', '5', '9']),
    JSON.stringify({ letter: f2.letter, pairs: f2.pairs }));
  const f3 = P.parse('MAHAJANA SAMPATHA 6321 986159 7712345', L['mahajana-sampatha']);
  ok('මහජන: අකුර නැති payload එකේත් අංක 6ම ගත්තා (වැරදි අංක නෑ)',
    JSON.stringify(f3.pairs) === JSON.stringify(['9', '8', '6', '1', '5', '9']),
    JSON.stringify(f3.pairs));

  // 🎫 අනන්‍යතාව විතරක් තියෙන QR වලින් **අංක හදන්නේම නෑ** (වැරදි ප්‍රතිඵල නෑ)
  const g1 = P.parse('085016050326004', L['handahana']);
  ok('NLB 15-ඉලක්කම් QR → අංක හදන්නේ නෑ (identityOnly)',
    g1.identityOnly === true && g1.pairs.length === 0, JSON.stringify(g1.pairs));
  const g2 = P.parse('4993-500395754-7-04', L['lagna-wasana']);
  ok('DLB hyphen QR → අංක හදන්නේ නෑ (identityOnly)',
    g2.identityOnly === true && g2.pairs.length === 0, JSON.stringify(g2.pairs));
}

console.log('\n══════════════════════════════════════════════════════');
console.log('  ✓ Pass: ' + pass + '   ✗ Fail: ' + fail);
if (failures.length) {
  console.log('\n  Failures:');
  failures.forEach(f => console.log('   · ' + f));
}
console.log('══════════════════════════════════════════════════════');
process.exit(fail === 0 ? 0 : 1);
