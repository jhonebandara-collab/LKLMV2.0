#!/usr/bin/env node
/**
 * scripts/test-verify-announce.js
 *
 *   1. 🎟️ ticket-verify — QR එකේ දත්ත ↔ දිනුම් ප්‍රතිඵලය සැසඳීම
 *   2. 🔊 announce — මුදල වචන වලින් + හරි grammar වාක්‍ය
 *
 * Run:  node scripts/test-verify-announce.js   (හෝ: npm run test:verify)
 */

'use strict';

const path = require('path');
const V = require(path.join(__dirname, '..', 'public', 'ticket-verify.js'));
const A = require(path.join(__dirname, '..', 'public', 'announce.js'));

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, extra) {
  if (cond) pass++; else { fail++; failures.push(name + (extra ? ' — ' + extra : '')); }
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (extra ? ' — ' + extra : ''));
}

console.log('══════════════════════════════════════════════════════');
console.log('  🔊 announce — මුදල වචන වලින් (grammar)');
console.log('══════════════════════════════════════════════════════');

const wordCases = [
  [1, 'one rupee'],
  [2, 'two rupees'],
  [40, 'forty rupees'],
  [150, 'one hundred and fifty rupees'],
  [1005, 'one thousand and five rupees'],
  [1250, 'one thousand two hundred and fifty rupees'],
  [15000, 'fifteen thousand rupees'],
  [100000, 'one hundred thousand rupees'],
  [2500000, 'two million five hundred thousand rupees'],
  [20000000, 'twenty million rupees'],
];
for (const [n, want] of wordCases) {
  ok(String(n).padStart(10) + ' → "' + want + '"', A.rupees(n) === want, 'got "' + A.rupees(n) + '"');
}
ok('එක වචනය එක විදිහට — "one rupee" (rupees නොවේ)',
  A.rupees(1) === 'one rupee' && A.rupees(2) === 'two rupees');

const winCases = [
  [40, null, null, 'Congratulations! You have won forty rupees.'],
  [20000000, null, 'Mahajana Sampatha',
    'Congratulations! You have won twenty million rupees in Mahajana Sampatha.'],
  [null, null, null, 'Congratulations! You have won a prize. Please check the official results.'],
];
for (const [amt, tier, nm, want] of winCases) {
  ok('win(' + amt + (nm ? ', ' + nm : '') + ')', A.winSentence(amt, tier, nm) === want,
    'got "' + A.winSentence(amt, tier, nm) + '"');
}
ok('ටයර් එක "3rd" නම් → "That is the 3rd prize." (grammar හරි)',
  A.winSentence(40, '3rd') === 'Congratulations! You have won forty rupees. That is the 3rd prize.',
  A.winSentence(40, '3rd'));
ok('ටයර් එක "Last 4 Numbers Correct" වගේ නම් ඒක කියන්නේ නෑ (වාක්‍යයට හරියන්නේ නෑ)',
  A.winSentence(15000, 'Last 4 Numbers Correct') === 'Congratulations! You have won fifteen thousand rupees.',
  A.winSentence(15000, 'Last 4 Numbers Correct'));
ok('පරාද වුනාම: "Sorry, you have lost this time. Try again."',
  A.loseSentence() === 'Sorry, you have lost this time. Try again.', A.loseSentence());

const rl = A.forResult({
  won: false,
  lottery: { name: 'Govisetha' },
});
ok('forResult(lose) → lose වාක්‍යය', rl.text === A.loseSentence() && rl.chime === 'lose');
const rw = A.forResult({
  won: true, prizeAmountRs: 40, prizeLabel: '3RD', lottery: { name: 'Govisetha' },
});
ok('forResult(win 40) → "…forty rupees…" + win chime',
  rw.text.indexOf('forty rupees') > 0 && rw.chime === 'win', rw.text);
const ru = A.forResult({ unavailable: true });
ok('forResult(unavailable) → "not available yet" (+ chime නෑ)',
  /not available yet/.test(ru.text) && ru.chime === 'none', ru.text);

console.log('\n══════════════════════════════════════════════════════');
console.log('  🎟️ ticket-verify — ටිකට් ↔ දිනුම් ප්‍රතිඵලය සැසඳීම');
console.log('══════════════════════════════════════════════════════');

const lotMaha = { slug: 'mahajana-sampatha', hasLetter: 1, hasZodiac: 0, hasSuperNumber: 0, numberCount: 6, digitWidth: 1 };
const drawMaha = { drawNo: '6321', date: '2026-09-25', letter: 'S', numbers: ['9', '8', '6', '1', '5', '9'] };

/* (1) හරියටම ගැලපෙන ටිකට් */
{
  const v = V.verify(lotMaha, drawMaha,
    { letter: 'S', numbers: ['9', '8', '6', '1', '5', '9'] },
    { slug: 'mahajana-sampatha', drawNo: '6321', date: '2026-09-25' });
  ok('හරි ටිකට් → verdict = ok', v.verdict === 'ok', v.verdict);
  ok('අංක 6ම දිනුම් අංක අතරේ → hitCount = 6', v.hitCount === 6, 'hit=' + v.hitCount);
  ok('allOk = true', v.allOk === true);
  ok('draw අංකය + දිනයත් පේළි වලට ඇතුළත්',
    v.rows.some(r => r.key === 'drawNo' && r.status === 'ok') &&
    v.rows.some(r => r.key === 'date' && r.status === 'ok'));
}

/* (2) අකුර ගැලපෙන්නේ නෑ */
{
  const v = V.verify(lotMaha, drawMaha,
    { letter: 'K', numbers: ['9', '8', '6', '1', '5', '9'] }, null);
  const row = v.rows.find(r => r.key === 'letter');
  ok('අකුර K (ටිකට්) ≠ S (දිනුම) → row status = bad', row && row.status === 'bad',
    row ? row.ticketText + ' vs ' + row.drawText : 'no row');
  ok('verdict = bad / badCount = 1', v.verdict === 'bad' && v.badCount === 1, v.verdict + '/' + v.badCount);
}

/* (3) ලග්නය QR එකෙන් කියවාගන්න බැරි උනා */
{
  const lotLag = { slug: 'lagna-wasana', hasLetter: 0, hasZodiac: 1, hasSuperNumber: 0, numberCount: 4, digitWidth: 2 };
  const drawLag = { drawNo: '5007', date: '2026-09-25', zodiac: 'GEMINI', numbers: ['12', '45', '67', '89'] };
  const v = V.verify(lotLag, drawLag, { zodiac: null, numbers: ['12', '45', '67', '89'] }, null);
  const row = v.rows.find(r => r.key === 'zodiac');
  ok('ලග්නය නොදන්නා විට → status = unknown (වැරදි කියන්නේ නෑ)', row && row.status === 'unknown',
    row ? row.status : 'no row');
  ok('verdict = partial (සම්පූර්ණ නොවේ)', v.verdict === 'partial', v.verdict);
  ok('allOk = false', v.allOk === false);
}

/* (4) ලග්නය ගැලපෙනවා + සිංහල නම පෙන්නනවා */
{
  const lotLag = { slug: 'lagna-wasana', hasLetter: 0, hasZodiac: 1, hasSuperNumber: 0, numberCount: 4, digitWidth: 2 };
  const drawLag = { drawNo: '5007', date: '2026-09-25', zodiac: 'GEMINI', numbers: ['12', '45', '67', '89'] };
  const v = V.verify(lotLag, drawLag, { zodiac: 'GEMINI', numbers: ['12', '45', '67', '89'] }, null, 'si');
  const row = v.rows.find(r => r.key === 'zodiac');
  ok('ලග්නය GEMINI → සිංහල "මිථුන" විදිහට පෙන්නනවා', row && row.ticketText === 'මිථුන',
    row ? row.ticketText : 'no row');
  ok('ලග්නය ගැලපුනා → verdict ok', v.verdict === 'ok', v.verdict);
}

/* (5) Special / Super number + special letter */
{
  const lotKap = { slug: 'kapruka', hasLetter: 1, hasZodiac: 0, hasSuperNumber: 1, numberCount: 4, digitWidth: 2 };
  const drawKap = { drawNo: '2471', date: '2026-09-25', letter: 'K', superNumber: '37', numbers: ['12', '45', '67', '89'] };
  const v1 = V.verify(lotKap, drawKap, { letter: 'K', superNumber: '37', numbers: ['12', '45', '67', '89'] }, null);
  ok('Special number 37 = 37 → ok', v1.verdict === 'ok', v1.verdict);
  const v2 = V.verify(lotKap, drawKap, { letter: 'K', superNumber: '14', numbers: ['12', '45', '67', '89'] }, null);
  const snRow = v2.rows.find(r => r.key === 'superNumber');
  ok('Special number 14 ≠ 37 → bad', snRow && snRow.status === 'bad' && v2.verdict === 'bad',
    snRow ? snRow.status : 'no row');
}

/* (6) අංක කිහිපයක් ගැලපෙන අවස්ථාව (hitCount) */
{
  const lot = { slug: 'ada-kotipathi', hasLetter: 1, hasZodiac: 0, hasSuperNumber: 0, numberCount: 4, digitWidth: 2 };
  const draw = { drawNo: '3121', date: '2026-09-25', letter: 'I', numbers: ['12', '45', '67', '89'] };
  const v = V.verify(lot, draw, { letter: 'I', numbers: ['12', '45', '99', '00'] }, null);
  ok('අංක 4න් 2ක් ගැලපුනා → hitCount = 2', v.hitCount === 2, 'hit=' + v.hitCount);
  ok('ගැලපෙන අංක ✅ / නොගැලපෙන ඒවා ❌',
    v.numberRows.filter(r => r.status === 'ok').length === 2 &&
    v.numberRows.filter(r => r.status === 'bad').length === 2);
}

/* (7) වැරදි draw අංකයක් QR එකේ තිබ්බොත් (2026-09-25 වෙනුවට වෙන දිනක්) */
{
  const v = V.verify(lotMaha, drawMaha,
    { letter: 'S', numbers: ['9', '8', '6', '1', '5', '9'] },
    { slug: 'mahajana-sampatha', drawNo: '6300', date: '2026-09-20' });
  ok('QR එකේ draw 6300 ≠ පරීක්ෂා කරපු 6321 → drawNo row bad',
    v.rows.find(r => r.key === 'drawNo').status === 'bad');
  ok('QR එකේ දිනය ≠ ප්‍රතිඵලයේ දිනය → date row bad',
    v.rows.find(r => r.key === 'date').status === 'bad');
}

/* (8) HTML එක හදනවාද + XSS ආරක්ෂණය */
{
  const v = V.verify(lotMaha, drawMaha, { letter: 'S', numbers: ['9', '8', '6', '1', '5', '9'] }, null);
  const h = V.html(v);
  const rowCount = (h.match(/class="cmp-row /g) || []).length;
  ok('HTML ටේබලයේ පේළි ගණන = field ගණන (' + v.rows.length + ')',
    rowCount === v.rows.length && rowCount >= 1, 'rows=' + rowCount);
  ok('HTML එකේ verdict + ටිකට්/ප්‍රතිඵල ශීර්ෂ තියෙනවා',
    h.indexOf('cmp-hd') > 0 && h.indexOf('ඔබේ ටිකට් එක') > 0 && h.indexOf('දිනුම් ප්‍රතිඵලය') > 0);
  const v4 = V.verify(lotMaha, drawMaha,
    { letter: 'S', numbers: ['9', '8', '6', '1', '5', '9'] },
    { slug: 'mahajana-sampatha', drawNo: '6321', date: '2026-09-25' });
  const h4 = V.html(v4);
  ok('draw/date/slug ත් එකතු වුනාම පේළි 4ක් (letter + drawNo + date + lottery)',
    (h4.match(/class="cmp-row /g) || []).length === 4,
    'rows=' + (h4.match(/class="cmp-row /g) || []).length);
  const evil = V.verify(lotMaha, drawMaha, { letter: '<img src=x onerror=alert(1)>', numbers: ['1'] }, null);
  const eh = V.html(evil);
  ok('අන්තර්ගතය escape වෙනවා (XSS නෑ)', eh.indexOf('<img') < 0 && eh.indexOf('&lt;img') >= 0);
}

/* (9) ලොතරැයියේ නම + භාෂා 3ම */
{
  ok('si: මහජන සම්පත්', V.lotLabelName('mahajana-sampatha', 'si') === 'මහජන සම්පත්');
  ok('en: Mahajana Sampatha', V.lotLabelName('mahajana-sampatha', 'en') === 'Mahajana Sampatha');
  ok('ta: மகஜன சம்பத்', V.lotLabelName('mahajana-sampatha', 'ta') === 'மகஜன சம்பத்');
  ok('ලග්න නම si/en/ta',
    V.zodiacLabel('GEMINI', 'si') === 'මිථුන' && V.zodiacLabel('GEMINI', 'en') === 'GEMINI' &&
    V.zodiacLabel('GEMINI', 'ta') === 'மிதுனம்');
}

console.log('\n══════════════════════════════════════════════════════');
console.log('  ✓ Pass: ' + pass + '   ✗ Fail: ' + fail);
if (failures.length) { console.log('\n  Failures:'); failures.forEach(f => console.log('   · ' + f)); }
console.log('══════════════════════════════════════════════════════');
process.exit(fail === 0 ? 0 : 1);
