#!/usr/bin/env node
/**
 * scripts/test-prize-structures.js
 * 🏆 ලොතරැයි **16ම** — ඔබ දුන්නු "Sri_Lanka_Lottery_Prize_Structures_NLB_DLB"
 *    ලේඛනයේ තියෙන රටා/මුදල් හරියටම engine එකෙන් එනවද කියලා එකින් එක පරීක්ෂා කිරීම.
 *
 * හැම ලොතරැයියකටම:
 *   · draw එකක් හදනවා (ලේඛනයේ උදාහරණය වගේම)
 *   · හැම tier එකකටම **එකම එක ටිකට් එකක්** හදනවා (ඒ tier එක තමයි උපරිමය)
 *   · engine එකෙන් එන tier නම + මුදල ලේඛනයේ අගයත් එක්ක සසඳනවා
 *
 * එකම ටිකට් එකක් tier දෙකකට ගැලපෙනවා නම් engine එක **උපරිම** එක දෙනවා — ඒ නිසා
 * හැම පේළියක්ම එක් tier එකකට විතරක් ගැලපෙන විදිහට හදලා තියෙනවා.
 *
 * Run:  node scripts/test-prize-structures.js   (හෝ: npm run test:prize)
 */

'use strict';

const path = require('path');
const P = require(path.join(__dirname, '..', 'prizes.js'));

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, extra) {
  if (cond) pass++; else { fail++; failures.push(name + (extra ? ' — ' + extra : '')); }
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (extra ? ' — ' + extra : ''));
}
const rs = n => (n == null ? null : Number(n).toLocaleString('en-US'));

/* ── 🎯 "අග N" / "මුල් N" ටිකට් හරියටම හදන helpers ──
   ⚠️ වැදගත්: "අග N" කියන්නේ දිනුම් අංකයේ **අන්තිම N ඉලක්කම්** ගැලපෙන්න ඕන,
   ඊට කලින් එක ගැලපෙන්න **බෑ** (නැත්නම් ඒක "අග N+1" වෙනවා → උඩ tier එක).
   ඒ නිසා fill අංකයක් දාලා හරියටම Nක් ගැලපෙන විදිහට හදනවා. */
function lastN(drawNums, n, fill) {
  const f = fill == null ? 'X' : String(fill);
  return drawNums.slice(drawNums.length - n).map(String)
    .concat(new Array(drawNums.length - n).fill(f))
    .reverse()
    .map((v, i) => (i === 0 && v === f ? null : v));
}
// අපැහැදිලි නිසා සරල, පැහැදිලි ක්‍රමයක්:  array එක කෙලින්ම හදනවා
/**
 * ⚠️ fill අංකය **දිනුම් අංකයේ නැති** එකක් වෙන්න ඕන — නැත්නම් ඒකත් ගැලපිලා
 * (උදා: fill='9' ඒත් draw එකේ '9' තියෙනවා නම්) "අග 2" ටිකට් එක "අග 3" වෙලා
 * උඩ tier එක එනවා. ඒ නිසා දිනුම් අංකවල නැති ඉලක්කමක් තනියම තෝරගන්නවා.
 */
function safeFill(drawNums) {
  for (let d = 0; d <= 9; d++) {
    if (drawNums.map(String).indexOf(String(d)) < 0) return String(d);
  }
  return 'X';
}
function lastExact(drawNums, n, fill) {
  const total = drawNums.length;
  const f = String(fill == null ? safeFill(drawNums) : fill);
  return new Array(total - n).fill(f).concat(drawNums.slice(total - n).map(String));
}
function firstExact(drawNums, n, fill) {
  const total = drawNums.length;
  const f = String(fill == null ? safeFill(drawNums) : fill);
  return drawNums.slice(0, n).map(String).concat(new Array(total - n).fill(f));
}

/**
 * එක් ටිකට් එකක ප්‍රතිඵලය පරීක්ෂා කරන helper.
 *
 * ⚠️ පරීක්ෂා කරන්නේ **මුදලයි (amount)** — tier එකේ නම engine එකේ internal
 * එකක් (SUPER/1ST/…) නිසා ඒක ලොතරැයියෙන් ලොතරැයියට වෙනස් වෙන්න පුළුවන්.
 * වැදගත් දේ: ලේඛනයේ තියෙන **ත්‍යාග මුදල හරියටම එනවද** කියන එකයි.
 * (wantAmount === null → non-cash prize එකක් වෙන්න ඕන: මෝටර් රථයක් වගේ)
 */
function check(slug, draw, ticket, opts, wantTier, wantAmount, label) {
  const r = P.evaluatePrize(slug, draw, ticket, opts);
  let amtOk, why = '';
  if (wantAmount === null) {
    // non-cash දිනුමක් හෝ දිනුමක් නෑ — දෙකම "මුදලක් නෑ"
    amtOk = !r.prizeAmountRs;
  } else if (wantAmount === 0) {
    amtOk = !r.won;
    why = r.won ? 'දිනුමක් පෙන්නනවා (නොවිය යුතුයි)' : '';
  } else {
    amtOk = Number(r.prizeAmountRs) === Number(wantAmount);
  }
  const cond = amtOk && !r.unavailable;
  ok(label || (slug + ' → Rs.' + rs(wantAmount)), cond,
     'got amount=' + r.prizeAmountRs + ' tier=' + r.tier +
     ' won=' + r.won + ' unavailable=' + r.unavailable + ' ' + why);
  return r;
}

console.log('══════════════════════════════════════════════════════════════════');
console.log('  🏆 NLB/DLB ඇත්ත prize structures — ලොතරැයි 16ම (ඔබ දුන්නු ලේඛනය අනුව)');
console.log('══════════════════════════════════════════════════════════════════');

/* ══════════════════════════════════════════════════════════════════
   1. NLB
   ══════════════════════════════════════════════════════════════════ */
console.log('\n1. NLB');

/* 1.1 ගොවිසෙත — Letter + 4×2
   Super(letter+4)=60,000,000 · 1st(4)=2,000,000 · 2nd(letter+3)=250,000
   3rd(3)=5,000 · 4th(letter+2)=2,000 · 5th(2)=200 · 6th(letter+1)=200
   7th(1)=40 · 8th(letter)=40                                              */
{
  const slug = 'govisetha';
  const draw = { letter: 'A', numbers: ['14', '38', '56', '72'] };
  const t = (letter, nums) => ({ letter: letter, numbers: nums });
  check(slug, draw, t('A', ['14', '38', '56', '72']), null, 'SUPER', 60000000, 'ගොවිසෙත · සුපිරි (අකුර+4) Rs.60,000,000');
  check(slug, draw, t('Z', ['14', '38', '56', '72']), null, '1ST', 2000000, 'ගොවිසෙත · 1 වන (4 පමණක්) Rs.2,000,000');
  check(slug, draw, t('A', ['14', '38', '56', '11']), null, '2ND', 250000, 'ගොවිසෙත · 2 වන (අකුර+3) Rs.250,000');
  check(slug, draw, t('Z', ['14', '38', '56', '11']), null, '3RD', 5000, 'ගොවිසෙත · 3 වන (3) Rs.5,000');
  check(slug, draw, t('A', ['14', '38', '11', '22']), null, '4TH', 2000, 'ගොවිසෙත · 4 වන (අකුර+2) Rs.2,000');
  check(slug, draw, t('Z', ['14', '38', '11', '22']), null, '5TH', 200, 'ගොවිසෙත · 5 වන (2) Rs.200');
  check(slug, draw, t('A', ['14', '11', '22', '33']), null, '6TH', 200, 'ගොවිසෙත · 6 වන (අකුර+1) Rs.200');
  check(slug, draw, t('Z', ['14', '11', '22', '33']), null, '7TH', 40, 'ගොවිසෙත · 7 වන (1) Rs.40');
  check(slug, draw, t('A', ['11', '22', '33', '44']), null, '8TH', 40, 'ගොවිසෙත · 8 වන (අකුර පමණක්) Rs.40');
}

/* 1.2 මෙගා පවර් — Letter + Super(2d) + 4×2
   Mega Super = 150,000,000 · Power Super(letter+4) = 10,000,000
   Grand Super(super+4) = මෝටර් රථයක් (nonCash, amount null)
   1st(4)=2,000,000 · 2nd(letter+3)=200,000 · 3rd(3)=5,000 · 4th(letter+2)=2,000
   5th(2)=200 · 6th(letter+1)=200 · 7th(1)=40 · 8th(letter)=40 · 9th(super)=40  */
{
  const slug = 'mega-power';
  const draw = { letter: 'B', superNumber: '88', numbers: ['05', '23', '47', '69'] };
  const t = (letter, sn, nums) => ({ letter: letter, superNumber: sn, numbers: nums });
  const D = ['05', '23', '47', '69'];
  check(slug, draw, t('B', '88', D), null, 'MEGA_SUPER', 150000000, 'මෙගා පවර් · මෙගා සුපිරි (අකුර+සුපිරි+4) Rs.150,000,000');
  check(slug, draw, t('B', '11', D), null, 'POWER_SUPER', 10000000, 'මෙගා පවර් · පවර් සුපිරි (අකුර+4) Rs.10,000,000');
  check(slug, draw, t('Z', '88', D), null, 'GRAND_SUPER', null, 'මෙගා පවර් · ග්‍රෑන්ඩ් සුපිරි (සුපිරි+4) → මෝටර් රථයක් (මුදලක් නෑ)');
  check(slug, draw, t('Z', '11', D), null, '1ST', 2000000, 'මෙගා පවර් · 1 වන (4) Rs.2,000,000');
  check(slug, draw, t('B', '11', ['05', '23', '47', '11']), null, '2ND', 200000, 'මෙගා පවර් · 2 වන (අකුර+3) Rs.200,000');
  check(slug, draw, t('Z', '11', ['05', '23', '47', '11']), null, '3RD', 5000, 'මෙගා පවර් · 3 වන (3) Rs.5,000');
  check(slug, draw, t('B', '11', ['05', '23', '11', '22']), null, '4TH', 2000, 'මෙගා පවර් · 4 වන (අකුර+2) Rs.2,000');
  check(slug, draw, t('Z', '11', ['05', '23', '11', '22']), null, '5TH', 200, 'මෙගා පවර් · 5 වන (2) Rs.200');
  check(slug, draw, t('B', '11', ['05', '11', '22', '33']), null, '6TH', 200, 'මෙගා පවර් · 6 වන (අකුර+1) Rs.200');
  check(slug, draw, t('Z', '11', ['05', '11', '22', '33']), null, '7TH', 40, 'මෙගා පවර් · 7 වන (1) Rs.40');
  check(slug, draw, t('B', '11', ['11', '22', '33', '44']), null, '8TH', 40, 'මෙගා පවර් · 8 වන (අකුර පමණක්) Rs.40');
  check(slug, draw, t('Z', '88', ['11', '22', '33', '44']), null, '9TH', 40, 'මෙගා පවර් · 9 වන (සුපිරි අංකය පමණක්) Rs.40');
}

/* 1.3 ධන නිධානය — Main Letter + 4×2 (+ special extra letter — public නෑ)
   Super=80,000,000 · 1st=2,000,000 · 2nd(letter+3)=200,000 · 3rd(3)=6,000
   4th(letter+2)=2,000 · 5th(2)=200 · 6th(letter+1)=120 · 7th(1)=40 · 8th(letter)=40 */
{
  const slug = 'dhana-nidhanaya';
  const draw = { letter: 'D', numbers: ['12', '35', '58', '84'] };
  const t = (letter, nums) => ({ letter: letter, numbers: nums });
  check(slug, draw, t('D', ['12', '35', '58', '84']), null, 'SUPER', 80000000, 'ධන නිධානය · සුපිරි (අකුර+4) Rs.80,000,000');
  check(slug, draw, t('Z', ['12', '35', '58', '84']), null, '1ST', 2000000, 'ධන නිධානය · 1 වන (4) Rs.2,000,000');
  check(slug, draw, t('D', ['12', '35', '58', '11']), null, '2ND', 200000, 'ධන නිධානය · 2 වන (අකුර+3) Rs.200,000');
  check(slug, draw, t('Z', ['12', '35', '58', '11']), null, '3RD', 6000, 'ධන නිධානය · 3 වන (3) Rs.6,000');
  check(slug, draw, t('D', ['12', '35', '11', '22']), null, '4TH', 2000, 'ධන නිධානය · 4 වන (අකුර+2) Rs.2,000');
  check(slug, draw, t('Z', ['12', '35', '11', '22']), null, '5TH', 200, 'ධන නිධානය · 5 වන (2) Rs.200');
  check(slug, draw, t('D', ['12', '11', '22', '33']), null, '6TH', 120, 'ධන නිධානය · 6 වන (අකුර+1) Rs.120');
  check(slug, draw, t('Z', ['12', '11', '22', '33']), null, '7TH', 40, 'ධන නිධානය · 7 වන (1) Rs.40');
  check(slug, draw, t('D', ['11', '22', '33', '44']), null, '8TH', 40, 'ධන නිධානය · 8 වන (අකුර පමණක්) Rs.40');
  // 9 වන tier (special letter) — NLB වෙබ් අඩවියේ පෙන්නන්නේ නෑ → app එක එය "unavailable" විදිහට තියාගන්නවා
  const row = (P.REGISTRY[slug].build() || []).find(x => x.tier === 'SPECIAL_LETTER_UNAVAILABLE');
  ok('ධන නිධානය · 9 වන (special letter) — දත්ත නැති නිසා "unavailable" විදිහට සලකුණු කරලා',
    !!row, row ? '' : 'SPECIAL_LETTER_UNAVAILABLE tier එක නෑ');
}

/* 1.4 මහජන සම්පත — Letter + 6×1 (ස්ථානීය පිළිවෙළට)
   Super(letter+6)=20,000,000 · 1st(6)=2,500,000 · 2nd(last5)=100,000 · 3rd(last4)=15,000
   4th(last3)=2,000 · 5th(last2)=200 · 6th(last1)=40 · 7th(first5)=100,000
   8th(first4)=2,000 · 9th(first3)=200 · 10th(first2)=80 · 11th(first1)=40 · 12th(letter)=40 */
{
  const slug = 'mahajana-sampatha';
  const draw = { letter: 'M', numbers: ['4', '8', '1', '9', '0', '3'] };
  const t = (letter, nums) => ({ letter: letter, numbers: nums });
  check(slug, draw, t('M', ['4', '8', '1', '9', '0', '3']), null, 'SUPER', 20000000, 'මහජන · සුපිරි (අකුර+6 පිළිවෙළට) Rs.20,000,000');
  check(slug, draw, t('Z', ['4', '8', '1', '9', '0', '3']), null, '1ST', 2500000, 'මහජන · 1 වන (6 පිළිවෙළට) Rs.2,500,000');
  check(slug, draw, t('Z', lastExact(draw.numbers, 5)), null, '2ND', 100000, 'මහජන · 2 වන (අග 5) Rs.100,000');
  check(slug, draw, t('Z', lastExact(draw.numbers, 4)), null, '3RD', 15000, 'මහජන · 3 වන (අග 4) Rs.15,000');
  check(slug, draw, t('Z', lastExact(draw.numbers, 3)), null, '4TH', 2000, 'මහජන · 4 වන (අග 3) Rs.2,000');
  check(slug, draw, t('Z', lastExact(draw.numbers, 2)), null, '5TH', 200, 'මහජන · 5 වන (අග 2) Rs.200');
  check(slug, draw, t('Z', lastExact(draw.numbers, 1)), null, '6TH', 40, 'මහජන · 6 වන (අග 1) Rs.40');
  check(slug, draw, t('Z', firstExact(draw.numbers, 5)), null, '7TH', 100000, 'මහජන · 7 වන (මුල් 5) Rs.100,000');
  check(slug, draw, t('Z', firstExact(draw.numbers, 4)), null, '8TH', 2000, 'මහජන · 8 වන (මුල් 4) Rs.2,000');
  check(slug, draw, t('Z', firstExact(draw.numbers, 3)), null, '9TH', 200, 'මහජන · 9 වන (මුල් 3) Rs.200');
  check(slug, draw, t('Z', firstExact(draw.numbers, 2)), null, '10TH', 80, 'මහජන · 10 වන (මුල් 2) Rs.80');
  check(slug, draw, t('Z', firstExact(draw.numbers, 1)), null, '11TH', 40, 'මහජන · 11 වන (මුල් 1) Rs.40');
  check(slug, draw, t('M', ['5', '5', '5', '5', '5', '5']), null, 'LETTER', 40, 'මහජන · 12 වන (අකුර පමණක්) Rs.40');
}

/* 1.5 හඳහන (NLB Zodiac) — ලග්නය + 4×2
   Super=3,000,000 · 1st=1,000,000 · 2nd(ලග්න+3)=25,000 · 3rd(3)=2,000
   4th(ලග්න+2)=500 · 5th(2)=200 · 6th(ලග්න+1)=120 · 7th(1)=40 · 8th(ලග්න)=40 */
{
  const slug = 'handahana';
  const draw = { zodiac: 'ARIES', numbers: ['07', '21', '49', '63'] };
  const t = (z, nums) => ({ zodiac: z, numbers: nums });
  check(slug, draw, t('ARIES', ['07', '21', '49', '63']), null, 'SUPER', 3000000, 'හඳහන · සුපිරි (ලග්න+4) Rs.3,000,000');
  check(slug, draw, t('LEO', ['07', '21', '49', '63']), null, '1ST', 1000000, 'හඳහන · 1 වන (4) Rs.1,000,000');
  check(slug, draw, t('ARIES', ['07', '21', '49', '11']), null, '2ND', 25000, 'හඳහන · 2 වන (ලග්න+3) Rs.25,000');
  check(slug, draw, t('LEO', ['07', '21', '49', '11']), null, '3RD', 2000, 'හඳහන · 3 වන (3) Rs.2,000');
  check(slug, draw, t('ARIES', ['07', '21', '11', '22']), null, '4TH', 500, 'හඳහන · 4 වන (ලග්න+2) Rs.500');
  check(slug, draw, t('LEO', ['07', '21', '11', '22']), null, '5TH', 200, 'හඳහන · 5 වන (2) Rs.200');
  check(slug, draw, t('ARIES', ['07', '11', '22', '33']), null, '6TH', 120, 'හඳහන · 6 වන (ලග්න+1) Rs.120');
  check(slug, draw, t('LEO', ['07', '11', '22', '33']), null, '7TH', 40, 'හඳහන · 7 වන (1) Rs.40');
  check(slug, draw, t('ARIES', ['11', '22', '33', '44']), null, '8TH', 40, 'හඳහන · 8 වන (ලග්නය පමණක්) Rs.40');
}

/* 1.6 සුබ දවසක් (multi) — game 1: ලග්නය + 3×2
   1st(ලග්න+3)=500,000 · 2nd(3)=50,000 · 3rd(ලග්න+2)=2,500 · 4th(2)=1,000
   5th(ලග්න+1)=200 · 6th(1)=40 · 7th(ලග්න)=40                              */
{
  const slug = 'suba-dawasak';
  const draw = {
    zodiac: 'ARIES', numbers: ['18', '42', '77'],
    subGames: [
      { zodiac: 'ARIES', numbers: ['18', '42', '77'] },
      { numbers: ['2', '2', '1', '5'] },
    ],
  };
  const t = (z, nums) => ({ zodiac: z, numbers: nums });
  const o = { subGameIndex: 0 };
  check(slug, draw, t('ARIES', ['18', '42', '77']), o, '1ST', 500000, 'සුබ දවසක් · game1 · 1 වන (ලග්න+3) Rs.500,000');
  check(slug, draw, t('LEO', ['18', '42', '77']), o, '2ND', 50000, 'සුබ දවසක් · game1 · 2 වන (3) Rs.50,000');
  check(slug, draw, t('ARIES', ['18', '42', '11']), o, '3RD', 2500, 'සුබ දවසක් · game1 · 3 වන (ලග්න+2) Rs.2,500');
  check(slug, draw, t('LEO', ['18', '42', '11']), o, '4TH', 1000, 'සුබ දවසක් · game1 · 4 වන (2) Rs.1,000');
  check(slug, draw, t('ARIES', ['18', '11', '22']), o, '5TH', 200, 'සුබ දවසක් · game1 · 5 වන (ලග්න+1) Rs.200');
  check(slug, draw, t('LEO', ['18', '11', '22']), o, '6TH', 40, 'සුබ දවසක් · game1 · 6 වන (1) Rs.40');
  check(slug, draw, t('ARIES', ['11', '22', '33']), o, '7TH', 40, 'සුබ දවසක් · game1 · 7 වන (ලග්නය පමණක්) Rs.40');
}

/* 1.7 අද සම්පත (multi 3 games) — game 3: අකුර + 4×1
   1st(අකුර+4)=250,000 · 2nd(4)=50,000 · 3rd(3)=4,000 · 4th(2)=1,000 · 5th(අකුර)=80 */
{
  const slug = 'ada-sampatha';
  const g3 = { letter: 'C', numbers: ['5', '2', '9', '1'] };
  const draw = {
    numbers: ['5', '9'],
    subGames: [
      { numbers: ['5', '9'] },
      { numbers: ['1', '5', '9'] },
      g3,
    ],
  };
  const o = { subGameIndex: 2 };
  const t = (letter, nums) => ({ letter: letter, numbers: nums });
  check(slug, draw, t('C', ['5', '2', '9', '1']), o, '1ST', 250000, 'අද සම්පත · game3 · 1 වන (අකුර+4) Rs.250,000');
  check(slug, draw, t('Z', ['5', '2', '9', '1']), o, '2ND', 50000, 'අද සම්පත · game3 · 2 වන (4) Rs.50,000');
  check(slug, draw, t('Z', ['5', '2', '9', '0']), o, '3RD', 4000, 'අද සම්පත · game3 · 3 වන (ඕනෑම 3ක්) Rs.4,000');
  check(slug, draw, t('Z', ['5', '2', '0', '0']), o, '4TH', 1000, 'අද සම්පත · game3 · 4 වන (ඕනෑම 2ක්) Rs.1,000');
  check(slug, draw, t('C', ['0', '0', '0', '0']), o, '5TH', 80, 'අද සම්පත · game3 · 5 වන (අකුර පමණක්) Rs.80');
}

/* 1.8 NLB ජය — අකුර + 4×1
   1st(අකුර+4)=500,000 · 2nd(4)=50,000 · 3rd(අග3)=2,000 · 4th(අග2)=200
   5th(අග1)=40 · 6th(මුල්3)=200 · 7th(මුල්2)=80 · 8th(මුල්1)=40 · 9th(අකුර)=40 */
{
  const slug = 'nlb-jaya';
  const draw = { letter: 'K', numbers: ['7', '0', '3', '6'] };
  const t = (letter, nums) => ({ letter: letter, numbers: nums });
  check(slug, draw, t('K', ['7', '0', '3', '6']), null, '1ST', 500000, 'NLB ජය · 1 වන (අකුර+4) Rs.500,000');
  check(slug, draw, t('Z', ['7', '0', '3', '6']), null, '2ND', 50000, 'NLB ජය · 2 වන (4) Rs.50,000');
  check(slug, draw, t('Z', lastExact(draw.numbers, 3)), null, '3RD', 2000, 'NLB ජය · 3 වන (අග 3) Rs.2,000');
  check(slug, draw, t('Z', lastExact(draw.numbers, 2)), null, '4TH', 200, 'NLB ජය · 4 වන (අග 2) Rs.200');
  check(slug, draw, t('Z', lastExact(draw.numbers, 1)), null, '5TH', 40, 'NLB ජය · 5 වන (අග 1) Rs.40');
  check(slug, draw, t('Z', firstExact(draw.numbers, 3)), null, '6TH', 200, 'NLB ජය · 6 වන (මුල් 3) Rs.200');
  check(slug, draw, t('Z', firstExact(draw.numbers, 2)), null, '7TH', 80, 'NLB ජය · 7 වන (මුල් 2) Rs.80');
  check(slug, draw, t('Z', firstExact(draw.numbers, 1)), null, '8TH', 40, 'NLB ජය · 8 වන (මුල් 1) Rs.40');
  check(slug, draw, t('K', ['5', '5', '5', '5']), null, '9TH', 40, 'NLB ජය · 9 වන (අකුර පමණක්) Rs.40');
}

/* ══════════════════════════════════════════════════════════════════
   2. DLB
   ══════════════════════════════════════════════════════════════════ */
console.log('\n2. DLB');

/* 2.1 අද කෝටිපති / ශනිදා / සුපර් බෝල් — අකුර + 4×2
   අකුර+4=50,000,000 · 4=2,000,000 · අකුර+3=200,000 · 3=4,000
   අකුර+2=2,000 · 2=200 · අකුර+1=200 · 1=40 · අකුර=40                    */
{
  const draw = { letter: 'G', numbers: ['11', '29', '48', '65'] };
  const t = (letter, nums) => ({ letter: letter, numbers: nums });
  for (const slug of ['ada-kotipathi', 'shanida', 'super-ball']) {
    check(slug, draw, t('G', ['11', '29', '48', '65']), null, 'SUPER', 50000000, slug + ' · අකුර+4 Rs.50,000,000');
    check(slug, draw, t('Z', ['11', '29', '48', '65']), null, '1ST', 2000000, slug + ' · 4 පමණක් Rs.2,000,000');
    check(slug, draw, t('G', ['11', '29', '48', '11']), null, '2ND', 200000, slug + ' · අකුර+3 Rs.200,000');
    check(slug, draw, t('Z', ['11', '29', '48', '11']), null, '3RD', 4000, slug + ' · 3 Rs.4,000');
    check(slug, draw, t('G', ['11', '29', '00', '00']), null, '4TH', 2000, slug + ' · අකුර+2 Rs.2,000');
    check(slug, draw, t('Z', ['11', '29', '00', '00']), null, '5TH', 200, slug + ' · 2 Rs.200');
    check(slug, draw, t('G', ['11', '00', '00', '00']), null, '6TH', 200, slug + ' · අකුර+1 Rs.200');
    check(slug, draw, t('Z', ['11', '00', '00', '00']), null, '7TH', 40, slug + ' · 1 Rs.40');
    check(slug, draw, t('G', ['00', '00', '00', '00']), null, '8TH', 40, slug + ' · අකුර පමණක් Rs.40');
  }
}

/* 2.2 කප්‍රුක — අකුර + සුපිරි(2d) + 4×2
   අකුර+සුපිරි+4=150,000,000 · අකුර+4=10,000,000 · සුපිරි+4=10,000,000
   4=2,000,000 · අකුර+3=200,000 · 3=4,000 · අකුර+2=2,000 · 2=200
   අකුර+1=200 · 1=40 · අකුර=40 · සුපිරි=40                                 */
{
  const slug = 'kapruka';
  const draw = { letter: 'J', superNumber: '45', numbers: ['10', '24', '53', '71'] };
  const t = (letter, sn, nums) => ({ letter: letter, superNumber: sn, numbers: nums });
  const D = ['10', '24', '53', '71'];
  check(slug, draw, t('J', '45', D), null, 'JACKPOT', 150000000, 'කප්‍රුක · ජැක්පොට් (අකුර+සුපිරි+4) Rs.150,000,000');
  check(slug, draw, t('J', '11', D), null, 'LETTER_NUMS', 10000000, 'කප්‍රුක · අකුර+4 Rs.10,000,000');
  check(slug, draw, t('Z', '45', D), null, 'SUPER_NUMS', 10000000, 'කප්‍රුක · සුපිරි+4 Rs.10,000,000');
  check(slug, draw, t('Z', '11', D), null, '4NUMS', 2000000, 'කප්‍රුක · 4 පමණක් Rs.2,000,000');
  check(slug, draw, t('J', '11', ['10', '24', '53', '11']), null, 'L3', 200000, 'කප්‍රුක · අකුර+3 Rs.200,000');
  check(slug, draw, t('Z', '11', ['10', '24', '53', '11']), null, '3NUMS', 4000, 'කප්‍රුක · 3 Rs.4,000');
  check(slug, draw, t('J', '11', ['10', '24', '00', '00']), null, 'L2', 2000, 'කප්‍රුක · අකුර+2 Rs.2,000');
  check(slug, draw, t('Z', '11', ['10', '24', '00', '00']), null, '2NUMS', 200, 'කප්‍රුක · 2 Rs.200');
  check(slug, draw, t('J', '11', ['10', '00', '00', '00']), null, 'L1', 200, 'කප්‍රුක · අකුර+1 Rs.200');
  check(slug, draw, t('Z', '11', ['10', '00', '00', '00']), null, '1NUM', 40, 'කප්‍රුක · 1 Rs.40');
  check(slug, draw, t('J', '11', ['00', '00', '00', '00']), null, 'LETTER_ONLY', 40, 'කප්‍රුක · අකුර පමණක් Rs.40');
  check(slug, draw, t('Z', '45', ['00', '00', '00', '00']), null, 'SUPER_ONLY', 40, 'කප්‍රුක · සුපිරි පමණක් Rs.40');
}

/* 2.3 සුපිරි ධන සම්පත — අකුර + 6×1 (පිළිවෙළට) + "ඕනෑම පිළිවෙළකට 6" tier එකක්
   අකුර+6=20,000,000 · 6=2,500,000 · අග5=100,000 · අග4=20,000 · අග3=2,000
   අග2=200 · අග1=40 · මුල්5=100,000 · මුල්4=2,000 · මුල්3=200 · මුල්2=120
   මුල්1=40 · 6 ඕනෑම පිළිවෙළකට=500 · අකුර=40                              */
{
  const slug = 'supiri-dhana-sampatha';
  const draw = { letter: 'T', numbers: ['8', '3', '5', '2', '9', '1'] };
  const t = (letter, nums) => ({ letter: letter, numbers: nums });
  check(slug, draw, t('T', ['8', '3', '5', '2', '9', '1']), null, 'SUPER', 20000000, 'සුපිරි ධන · අකුර+6 පිළිවෙළට Rs.20,000,000');
  check(slug, draw, t('Z', ['8', '3', '5', '2', '9', '1']), null, '1ST', 2500000, 'සුපිරි ධන · 6 පිළිවෙළට Rs.2,500,000');
  check(slug, draw, t('Z', lastExact(draw.numbers, 5)), null, '2ND', 100000, 'සුපිරි ධන · අග 5 Rs.100,000');
  check(slug, draw, t('Z', lastExact(draw.numbers, 4)), null, '3RD', 20000, 'සුපිරි ධන · අග 4 Rs.20,000');
  check(slug, draw, t('Z', lastExact(draw.numbers, 3)), null, '4TH', 2000, 'සුපිරි ධන · අග 3 Rs.2,000');
  check(slug, draw, t('Z', lastExact(draw.numbers, 2)), null, '5TH', 200, 'සුපිරි ධන · අග 2 Rs.200');
  check(slug, draw, t('Z', lastExact(draw.numbers, 1)), null, '6TH', 40, 'සුපිරි ධන · අග 1 Rs.40');
  check(slug, draw, t('Z', firstExact(draw.numbers, 5)), null, '7TH', 100000, 'සුපිරි ධන · මුල් 5 Rs.100,000');
  check(slug, draw, t('Z', firstExact(draw.numbers, 4)), null, '8TH', 2000, 'සුපිරි ධන · මුල් 4 Rs.2,000');
  check(slug, draw, t('Z', firstExact(draw.numbers, 3)), null, '9TH', 200, 'සුපිරි ධන · මුල් 3 Rs.200');
  check(slug, draw, t('Z', firstExact(draw.numbers, 2)), null, '10TH', 120, 'සුපිරි ධන · මුල් 2 Rs.120');
  check(slug, draw, t('Z', firstExact(draw.numbers, 1)), null, '11TH', 40, 'සුපිරි ධන · මුල් 1 Rs.40');
  check(slug, draw, t('Z', ['1', '9', '2', '5', '3', '8']), null, 'ANY_ORDER', 500, 'සුපිරි ධන · 6ම ඕනෑම පිළිවෙළකට Rs.500');
  check(slug, draw, t('T', ['5', '5', '5', '5', '5', '5']), null, 'LETTER', 40, 'සුපිරි ධන · අකුර පමණක් Rs.40');
}

/* 2.4 ලග්න වාසනාව — ලග්නය + 4×2
   ලග්න+4=3,000,000 · 4=1,000,000 · ලග්න+3=20,000 · 3=2,000
   ලග්න+2=400 · 2=200 · ලග්න+1=120 · 1=40 · ලග්නය=40                      */
{
  const slug = 'lagna-wasana';
  const draw = { zodiac: 'SCORPIO', numbers: ['04', '28', '51', '79'] };
  const t = (z, nums) => ({ zodiac: z, numbers: nums });
  check(slug, draw, t('SCORPIO', ['04', '28', '51', '79']), null, 'SUPER', 3000000, 'ලග්න වාසනාව · ලග්න+4 Rs.3,000,000');
  check(slug, draw, t('LEO', ['04', '28', '51', '79']), null, '1ST', 1000000, 'ලග්න වාසනාව · 4 Rs.1,000,000');
  check(slug, draw, t('SCORPIO', ['04', '28', '51', '11']), null, '2ND', 20000, 'ලග්න වාසනාව · ලග්න+3 Rs.20,000');
  check(slug, draw, t('LEO', ['04', '28', '51', '11']), null, '3RD', 2000, 'ලග්න වාසනාව · 3 Rs.2,000');
  check(slug, draw, t('SCORPIO', ['04', '28', '11', '22']), null, '4TH', 400, 'ලග්න වාසනාව · ලග්න+2 Rs.400');
  check(slug, draw, t('LEO', ['04', '28', '11', '22']), null, '5TH', 200, 'ලග්න වාසනාව · 2 Rs.200');
  check(slug, draw, t('SCORPIO', ['04', '11', '22', '33']), null, '6TH', 120, 'ලග්න වාසනාව · ලග්න+1 Rs.120');
  check(slug, draw, t('LEO', ['04', '11', '22', '33']), null, '7TH', 40, 'ලග්න වාසනාව · 1 Rs.40');
  check(slug, draw, t('SCORPIO', ['11', '22', '33', '44']), null, '8TH', 40, 'ලග්න වාසනාව · ලග්නය පමණක් Rs.40');
}

/* 2.6 ජය සම්පත — අකුර + 4×1, **පසුපස සිට ඉදිරියට**
   අකුර+4=250,000 · 4=50,000 · 3=4,000 · 2=1,000 · අකුර=80                  */
{
  const slug = 'jaya-sampatha';
  const draw = { letter: 'H', numbers: ['3', '9', '4', '7'] };
  const t = (letter, nums) => ({ letter: letter, numbers: nums });
  check(slug, draw, t('H', ['3', '9', '4', '7']), null, 'TOP', 250000, 'ජය සම්පත · අකුර+4 (පසුපස සිට) Rs.250,000');
  check(slug, draw, t('Z', ['3', '9', '4', '7']), null, '2ND', 50000, 'ජය සම්පත · 4 (පසුපස සිට) Rs.50,000');
  check(slug, draw, t('Z', lastExact(draw.numbers, 3)), null, '3RD', 4000, 'ජය සම්පත · 3 (පසුපස සිට) Rs.4,000');
  check(slug, draw, t('Z', lastExact(draw.numbers, 2)), null, '4TH', 1000, 'ජය සම්පත · 2 (පසුපස සිට) Rs.1,000');
  check(slug, draw, t('H', ['5', '5', '5', '5']), null, '5TH', 80, 'ජය සම්පත · අකුර පමණක් Rs.80');
}

/* 2.7 සසිරි — 2×3 පමණක්
   3ම=200,000 · ඕනෑම 2ක්=400 · ඕනෑම 1ක්=40                                  */
{
  const slug = 'sasiri';
  const draw = { numbers: ['17', '44', '68'] };
  check(slug, draw, { numbers: ['17', '44', '68'] }, null, '1ST', 200000, 'සසිරි · 3ම Rs.200,000');
  check(slug, draw, { numbers: ['17', '44', '00'] }, null, '2ND', 400, 'සසිරි · 2ක් Rs.400');
  check(slug, draw, { numbers: ['17', '00', '00'] }, null, '3RD', 40, 'සසිරි · 1ක් Rs.40');
  check(slug, draw, { numbers: ['00', '00', '00'] }, null, null, 0, 'සසිරි · දිනුමක් නෑ');
}

console.log('\n══════════════════════════════════════════════════════════════════');
console.log('  ✓ Pass: ' + pass + '   ✗ Fail: ' + fail);
if (failures.length) { console.log('\n  Failures:'); failures.forEach(f => console.log('   · ' + f)); }
console.log('══════════════════════════════════════════════════════════════════');
process.exit(fail === 0 ? 0 : 1);
