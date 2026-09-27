#!/usr/bin/env node
/**
 * scripts/build-prize-engine.js
 *
 * `prizes.js` (server එකේ ඇත්ත prize table engine එක) එකෙන් **browser**
 * version එකක් හදනවා → `public/prize-engine.js`.
 *
 * ඇයි මේක ඕන?
 *   Ticket එකේ QR එක scan කරද්දී internet නැති වුනත් දිනුම ගණනය කරන්න
 *   ඕන. Server එකට කතා කරන්න බැරි නිසා, **එකම prize table එකම**
 *   browser එකේ run කරනවා. ඒක වෙනම ලියනවා නම් දෙකක් වැරදියන්න පුළුවන්
 *   (server එකේ ප්‍රතිඵලය ≠ app එකේ ප්‍රතිඵලය) — ඒ නිසා ප්‍රභවය
 *   එකයි: `prizes.js`. මේ script එකෙන් ඒකම bundle කරනවා.
 *
 * `prizes.js` වෙනස් කළොත් ආයෙ run කරන්න:
 *   node scripts/build-prize-engine.js      (හෝ: npm run build:offline)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'prizes.js');
const OUT = path.join(ROOT, 'public', 'prize-engine.js');

function main() {
  const src = fs.readFileSync(SRC, 'utf8');

  const marker = 'module.exports';
  const idx = src.indexOf(marker);
  if (idx === -1) {
    console.error('✗ prizes.js එකේ `module.exports` හම්බුනේ නෑ — script එක අලුත් කරන්න ඕන.');
    process.exit(1);
  }

  // `module.exports = {...}` ට කලින් තියෙන කොටස (functions) විතරයි ගන්නේ
  const body = src.slice(0, idx).trimEnd();

  const out =
    '/* AUTO-GENERATED — `node scripts/build-prize-engine.js` එකෙන් හදන ලදී.\n' +
    ' * ප්‍රභවය: prizes.js  ·  අතින් edit කරන්න එපා (prizes.js එකයි edit කරන්නේ).\n' +
    ' *\n' +
    ' * Browser එකේ offline ticket check එකට server එකේ එකම prize engine එක.\n' +
    ' * Usage:  window.LKMPrizes.evaluatePrize(slug, draw, ticket, opts)\n' +
    ' */\n' +
    '(function (global) {\n' +
    "  'use strict';\n\n" +
    body + '\n\n' +
    '  global.LKMPrizes = {\n' +
    '    evaluatePrize: evaluatePrize,\n' +
    '    hasPrizeTable: hasPrizeTable,\n' +
    '    getLotteryKind: getLotteryKind,\n' +
    '    stats: typeof stats === "function" ? stats : null,\n' +
    '    REGISTRY: REGISTRY,\n' +
    '    version: ' + JSON.stringify(require('crypto').createHash('sha1').update(body).digest('hex').slice(0, 10)) + ',\n' +
    '  };\n' +
    '})(typeof window !== "undefined" ? window : globalThis);\n';

  fs.writeFileSync(OUT, out, 'utf8');
  const kb = (Buffer.byteLength(out, 'utf8') / 1024).toFixed(1);
  console.log('✓ public/prize-engine.js හදන ලදී (' + kb + ' KB)');
}

main();
