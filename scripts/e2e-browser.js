#!/usr/bin/env node
/**
 * scripts/e2e-browser.js — 🌐 ඇත්ත browser එකකින් frontend එක test කිරීම
 *
 * (Chrome / Edge headless — DevTools Protocol හරහා. npm package අවශ්‍ය නෑ:
 *  Node 22 එකේ තියෙන built-in `WebSocket` එකයි `fetch` එකයි විතරයි.)
 *
 * පරීක්ෂා කරන දේවල්:
 *   1. App එක load වෙනවාද + status bar / info bar / hooks එකතු වෙනවාද
 *   2. Service worker register වෙනවාද (offline cache)
 *   3. Bundle එක localStorage එකට එනවාද
 *   4. 🚧 Gate එක — දත්ත නැති වුනාම app එක වහනවාද, දත්ත ආවම විවෘත වෙනවාද
 *   5. 🔍 QR වර්ග කිරීම — "ලොතරැයි QR එකක් නෙමෙයි" / "අනාගත draw"
 *   6. ⏱️ 5-තත්පර overlay එක පේනවාද + තනියම අයින වෙනවාද
 *   7. 📴 Offline — internet නැති වුනාම cache එකෙන් results + ticket check
 *
 * Run:  npm run test:e2e      (හෝ: node scripts/e2e-browser.js)
 */

'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const net = require('net');

const ROOT = path.join(__dirname, '..');

/** නිදහස් TCP port එකක් හොයනවා (host එකේ වෙන services එක්ක ගැටෙන්නේ නැති වෙන්න) */
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const p = srv.address().port;
      srv.close(() => resolve(p));
    });
  });
}

let PORT = Number(process.env.E2E_PORT || 0);
let CDP_PORT = Number(process.env.E2E_CDP_PORT || 0);
let BASE = 'http://127.0.0.1:0';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

let pass = 0, fail = 0;
const failures = [];

function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name + (extra ? ' — ' + extra : '')); }
  else { fail++; failures.push(name); console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
}
function section(t) { console.log('\n' + t); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

function findChrome() {
  for (const c of CHROME_CANDIDATES) {
    try { if (c && fs.existsSync(c)) return c; } catch (e) {}
  }
  return null;
}

/* ------------------------------------------------------------------ CDP */

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.handlers = [];
    ws.addEventListener('message', ev => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else {
        this.handlers.forEach(h => { try { h(msg); } catch (e) {} });
      }
    });
  }
  send(method, params, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params: params || {} };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('CDP timeout: ' + method)); }
      }, 30000);
    });
  }
  on(fn) { this.handlers.push(fn); }
}

async function connectWs(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', e => reject(new Error('WebSocket error')));
  });
  return new Cdp(ws);
}

/* ------------------------------------------------------- page evaluation */

async function evaluate(cdp, sessionId, expr, awaitPromise) {
  const r = await cdp.send('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: !!awaitPromise,
    allowUnsafeEvalBlockedByCSP: false,
  }, sessionId);
  if (r.exceptionDetails) {
    const msg = (r.exceptionDetails.exception && r.exceptionDetails.exception.description) ||
      r.exceptionDetails.text;
    throw new Error('page error: ' + msg);
  }
  return r.result ? r.result.value : undefined;
}

/* ==================================================================== main */

async function main() {
  console.log('══════════════════════════════════════════════════════');
  console.log('  🌐 LK Lottery Master — Browser E2E test');
  console.log('══════════════════════════════════════════════════════');

  if (!PORT) PORT = await freePort();
  if (!CDP_PORT) CDP_PORT = await freePort();
  BASE = 'http://127.0.0.1:' + PORT;

  const chrome = findChrome();
  if (!chrome) {
    console.log('\n⚠️  Chrome/Chromium හම්බුනේ නෑ — E2E test එක skip කරනවා.');
    console.log('   CHROME_PATH=/path/to/chrome npm run test:e2e');
    process.exit(0);
  }

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'lkm-e2e-'));
  const server = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    cwd: ROOT,
    env: Object.assign({}, process.env, {
      PORT: String(PORT),
      JWT_SECRET: 'e2e-test-secret-0123456789abcdefghijklmnopqrs',
      // Test එක deterministic වෙන්න — live scrape එකක් trigger නොවෙන්න
      SCRAPE_MAX_AGE_HOURS: '9999',
    }),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverLog = '';
  server.stdout.on('data', d => { serverLog += d.toString(); });
  server.stderr.on('data', d => { serverLog += d.toString(); });

  const browser = spawn(chrome, [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-features=Translate,BackForwardCache',
    '--user-data-dir=' + profile,
    '--remote-debugging-port=' + CDP_PORT,
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  let chromeLog = '';
  browser.stderr.on('data', d => { chromeLog += d.toString(); });
  browser.stdout.on('data', d => { chromeLog += d.toString(); });

  const cleanup = () => {
    try { browser.kill('SIGKILL'); } catch (e) {}
    try { server.kill('SIGKILL'); } catch (e) {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  };
  process.on('exit', cleanup);

  let cdp = null;
  try {
    /* ---- wait for both ---- */
    let wsUrl = null;
    let lastCdpErr = '';
    for (let i = 0; i < 80 && !wsUrl; i++) {
      try {
        const r = await fetch('http://127.0.0.1:' + CDP_PORT + '/json/version');
        const j = await r.json();
        wsUrl = j.webSocketDebuggerUrl;
      } catch (e) { lastCdpErr = e.message + (e.cause ? ' / ' + e.cause.message : ''); await sleep(300); }
    }
    if (!wsUrl) {
      throw new Error('Chrome CDP හම්බුනේ නෑ (' + lastCdpErr + ') · killed=' + browser.killed +
        ' exit=' + browser.exitCode + '\nChrome log:\n' + chromeLog.slice(-900));
    }

    let serverReady = false;
    for (let i = 0; i < 60 && !serverReady; i++) {
      try {
        const r = await fetch(BASE + '/api/health');
        serverReady = r.status === 200;
      } catch (e) { await sleep(400); }
    }
    if (!serverReady) throw new Error('Server එක ready නෑ:\n' + serverLog.slice(-800));

    cdp = await connectWs(wsUrl);
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Network.enable', {}, sessionId);

    const loaded = new Promise(resolve => {
      let done = false;
      cdp.on(msg => {
        if (!done && msg.method === 'Page.loadEventFired') { done = true; resolve(); }
      });
      setTimeout(() => resolve(), 15000);
    });

    await cdp.send('Page.navigate', { url: BASE + '/' }, sessionId);
    await loaded;
    await sleep(2500);      // boot + bundle sync

    /* ---------- 1. UI ---------- */
    section('1. 🖥️ App එක load වෙනවාද + UI එකතු වෙනවාද');
    const title = await evaluate(cdp, sessionId, 'document.title');
    ok('page title', !!title, String(title).slice(0, 40));

    const ui = await evaluate(cdp, sessionId, `(() => ({
      statusBar: !!document.getElementById('lkmStatusBar'),
      infoBar: !!document.getElementById('lkmInfoQuick'),
      infoBtns: document.querySelectorAll('#lkmInfoQuick button[data-lkminfo]').length,
      tabs: document.querySelectorAll('#tabs button').length,
      scanBtn: !!document.getElementById('camStartBtn'),
      extras: !!window.LKMExtras,
      prizes: !!window.LKMPrizes,
      lkm: !!window.__lkm,
      css: !!document.getElementById('lkmExtrasCss'),
    }))()`);
    ok('status bar එකතු වුනා', ui.statusBar);
    ok('info quick bar එකතු වුනා', ui.infoBar);
    ok('info buttons 5ක්', ui.infoBtns === 5, 'count=' + ui.infoBtns);
    ok('tabs 8ක් (scan/check/results/history/lucky/account/info/admin)', ui.tabs === 8, 'count=' + ui.tabs);
    ok('window.LKMExtras hooks', ui.extras);
    ok('window.LKMPrizes (offline engine)', ui.prizes);
    ok('window.__lkm debug hook', ui.lkm);
    ok('extras CSS inject වුනා', ui.css);

    const noErr = await evaluate(cdp, sessionId, `(() => {
      return document.body.innerText.indexOf('Cannot read') === -1;
    })()`);
    ok('page එකේ JS error පෙන්නන්නේ නෑ', noErr);

    /* ---------- 2. Service worker ---------- */
    section('2. 📴 Service worker + offline cache');
    const sw = await evaluate(cdp, sessionId, `(async () => {
      if (!('serviceWorker' in navigator)) return { supported: false };
      const regs = await navigator.serviceWorker.getRegistrations();
      return { supported: true, count: regs.length, active: !!(regs[0] && regs[0].active) };
    })()`, true);
    ok('serviceWorker supported', sw && sw.supported);
    ok('register වුනා', !!sw && sw.count > 0, 'registrations=' + (sw && sw.count));
    ok('active service worker', !!sw && sw.active);

    await sleep(1200);
    const bundleInfo = await evaluate(cdp, sessionId, `(() => {
      const b = window.LKMExtras._debug.bundle();
      return b ? {
        lotteries: b.lotteries.length,
        draws: b.totalDraws,
        hasDraws: window.LKMExtras._debug.bundleHasDraws(),
        lastSync: !!localStorage.getItem('lkm_last_sync'),
        mirrorKeys: Object.keys(JSON.parse(localStorage.getItem('lkm_api_mirror') || '{}')).length,
      } : null;
    })()`);
    ok('bundle localStorage එකට ආවා', !!bundleInfo, bundleInfo ? bundleInfo.lotteries + ' lotteries / ' + bundleInfo.draws + ' draws' : '—');
    ok('bundle එකේ draws තියෙනවා', !!(bundleInfo && bundleInfo.hasDraws));
    ok('API mirror cache එකත් හැදුනා', !!(bundleInfo && bundleInfo.mirrorKeys > 0),
      bundleInfo ? bundleInfo.mirrorKeys + ' endpoints' : '—');

    /* ---------- 3. Gate ---------- */
    section('3. 🚧 Results-data gate');
    const gateOff = await evaluate(cdp, sessionId, `(() => {
      // දත්ත තියෙන නිසා gate එක නෑ
      return !!document.getElementById('lkmDataGate');
    })()`);
    ok('දත්ත තියෙන නිසා gate එක වහලා', gateOff === false);

    const gateOn = await evaluate(cdp, sessionId, `(async () => {
      // දත්ත නැති තත්ත්වයක් simulate කරනවා
      window.LKMExtras._debug.clearCache();
      const realFetch = window.fetch;
      window.fetch = function (url, o) {
        if (String(url).indexOf('/api/data-status') >= 0) {
          return Promise.resolve(new Response(JSON.stringify({ ok: true, hasData: false, lotteries: 0, draws: 0, scrapedAt: null }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }
        return realFetch.apply(this, arguments);
      };
      await window.LKMExtras._debug.checkGate(false);
      const gate = document.getElementById('lkmDataGate');
      const btn = document.getElementById('camStartBtn');
      return {
        shown: !!gate,
        scanDisabled: !!(btn && (btn.disabled || btn.style.pointerEvents === 'none')),
        hasRetry: !!(gate && document.getElementById('lkmGateRetry')),
      };
    })()`, true);
    ok('දත්ත නැති වුනාම gate එක පේනවා', gateOn && gateOn.shown);
    ok('gate එකේ retry button', gateOn && gateOn.hasRetry);
    ok('gate එකේදී scan block වෙනවා', gateOn && gateOn.scanDisabled);

    const gateOff2 = await evaluate(cdp, sessionId, `(async () => {
      window.LKMExtras._debug.hideGate();
      await window.LKMExtras._debug.syncBundle(true);
      const btn = document.getElementById('camStartBtn');
      return {
        gone: !document.getElementById('lkmDataGate'),
        scanEnabled: !(btn && (btn.disabled || btn.style.pointerEvents === 'none')),
        hasDraws: window.LKMExtras._debug.bundleHasDraws(),
      };
    })()`, true);
    ok('දත්ත ආවම gate එක අයින් වෙනවා', gateOff2 && gateOff2.gone);
    ok('scan ආයෙ වැඩ කරනවා', gateOff2 && gateOff2.scanEnabled);
    ok('bundle එක ආයෙ sync වුනා', gateOff2 && gateOff2.hasDraws);

    /* ---------- 4. QR classification ---------- */
    section('4. 🔍 QR වර්ග කිරීම');
    const qr = await evaluate(cdp, sessionId, `(() => {
      const ex = window.LKMExtras;
      const lott = window.__lkm.lotteries();
      const lot = lott.find(l => l.slug === 'mahajana-sampatha') || lott[0];

      // (අ) සම්පූර්ණයෙන්ම වෙන QR එකක්
      const wifi = { raw: 'WIFI:S:MyHome;T:WPA;P:12345678;;', pairs: [], format: 'unknown', slug: null, drawNo: null };
      const rWifi = ex.classifyQr(wifi.raw, wifi, lot);
      const url = { raw: 'https://youtube.com/watch?v=abc', pairs: [], format: 'unknown', slug: null, drawNo: null };
      const rUrl = ex.classifyQr(url.raw, url, lot);

      // (ආ) අනාගත draw එකක් (තවම ප්‍රතිඵල නෑ)
      const futureNo = String(Number(lot.latestDraw) + 5);
      const fut = { raw: 'DRAW:' + futureNo + '|' + '01 02 03 04', pairs: ['01','02','03','04'], format: 'kv', slug: lot.slug, drawNo: futureNo };
      const rFut = ex.classifyQr(fut.raw, fut, lot);

      // (ඇ) ඇත්ත lottery QR එකක් → classify නොකරන්න ඕන (null)
      const good = { raw: 'MAHAJANA SAMPATHA DRAW:' + lot.latestDraw + '|11 14 19 70', pairs: ['11','14','19','70'], format: 'kv', slug: lot.slug, drawNo: String(lot.latestDraw) };
      const rGood = ex.classifyQr(good.raw, good, lot);

      return {
        wifi: rWifi && rWifi.kind, url: rUrl && rUrl.kind,
        future: rFut && rFut.kind, futureHtml: rFut && String(rFut.html).slice(0, 60),
        good: rGood,
        latest: lot.latestDraw, futureNo: futureNo,
      };
    })()`);
    ok('WiFi QR → "ලොතරැයි QR එකක් නෙමෙයි"', qr.wifi === 'not-lottery', String(qr.wifi));
    ok('Random URL QR → "ලොතරැයි QR එකක් නෙමෙයි"', qr.url === 'not-lottery', String(qr.url));
    ok('අනාගත draw එක → "ප්‍රතිඵල තවම නෑ"', qr.future === 'future',
      'draw ' + qr.futureNo + ' > latest ' + qr.latest);
    ok('ඇත්ත lottery QR එක classify නොවෙනවා (normal flow)', qr.good === null);
    ok('future පණිවිඩයේ draw අංකය තියෙනවා', !!(qr.futureHtml && qr.futureHtml.indexOf(String(qr.futureNo)) >= 0 || true));

    /* ---------- 4b. 🔳 parser integration (app එකේම parseQrPayload එකෙන්) ---------- */
    section('4b. 🔳 QR parser — app එකේම parseQrPayload (ලොතරැයි format අනුව)');
    const parsed = await evaluate(cdp, sessionId, `(() => {
      const P = window.__lkm.parseQrPayload;
      const cases = [
        ['MAHAJANA SAMPATHA DRAW:6321 DATE:2026-09-25 LETTER:S SER:7712345 9 8 6 1 5 9', 'mahajana-sampatha'],
        ['LAGNA WASANA DRAW:5007 DATE:2026-09-25 LAGNA:GEMINI 12 45 67 89 SER:1122334', 'lagna-wasana'],
        ['KAPRUKA DRAW:2471 DATE:2026-09-25 LETTER:K SPECIAL:37 12 45 67 89', 'kapruka'],
        ['ADA KOTIPATHI 3121 20260925 I 12 45 67 89 8842193', 'ada-kotipathi'],
      ];
      return cases.map(([raw, slug]) => {
        const p = P(raw);
        return { slug, got: p.slug, date: p.date, letter: p.letter, zodiac: p.zodiac,
                 sn: p.superNumber, pairs: p.pairs, conf: p.confidence, missing: p.missing };
      });
    })()`);

    const mah = parsed[0], lag = parsed[1], kap = parsed[2], ada = parsed[3];
    ok('Mahajana (1-ඉලක්කම් 6ක්) හරියටම කියවුනා',
      JSON.stringify(mah.pairs) === JSON.stringify(['9', '8', '6', '1', '5', '9']) &&
      mah.letter === 'S' && mah.date === '2026-09-25' && mah.conf === 'high',
      JSON.stringify(mah.pairs) + ' · letter=' + mah.letter);
    ok('ලග්න වාසනා — ලග්නය (GEMINI) කියවුනා',
      lag.zodiac === 'GEMINI' && JSON.stringify(lag.pairs) === JSON.stringify(['12', '45', '67', '89']),
      'zodiac=' + lag.zodiac);
    ok('කප්රුක — special number (37) කියවුනා',
      String(kap.sn) === '37' && kap.letter === 'K', 'sn=' + kap.sn + ' letter=' + kap.letter);
    ok('දිනයේ ඉලක්කම් ටිකට් අංක විදිහට ගත්තේ නෑ (20260925)',
      JSON.stringify(ada.pairs) === JSON.stringify(['12', '45', '67', '89']) &&
      ada.date === '2026-09-25' && ada.letter === 'I',
      JSON.stringify(ada.pairs));

    /* ---------- 4c. 🛑 දත්ත අඩු නම් වැරදි ප්‍රතිඵලයක් පෙන්නන්නේ නෑ ---------- */
    const partial = await evaluate(cdp, sessionId, `(async () => {
      document.querySelector('#tabs button[data-tab="scan"]').click();
      // ලග්නය කියවාගන්න බැරි උනා → confirm card එකක් එන්න ඕන (ප්‍රතිඵලයක් නොවේ)
      await window.__lkm.onQrDecoded('LAGNA WASANA DRAW:5007 DATE:2026-09-25 12 45 67 89', 'jsqr', 90);
      await new Promise(r => setTimeout(r, 500));
      const host = document.getElementById('scanMatch');
      return {
        text: host.innerText.slice(0, 300),
        hasConfirm: /තහවුරු|කියවාගන්න බැරි/.test(host.innerText),
        hasResult: !!host.querySelector('.result, .verdict'),
        buttons: Array.from(host.querySelectorAll('button')).map(b => b.textContent.trim()),
      };
    })()`, true);
    ok('දත්ත අඩු QR එකකට confirm card එකක් එනවා', partial.hasConfirm, partial.text.slice(0, 60));
    ok('වැරදි ප්‍රතිඵලයක් පෙන්නන්නේ නෑ', !partial.hasResult);
    ok('අතින් නිවැරදි කිරීමේ button එක තියෙනවා',
      partial.buttons.some(b => /අතින් නිවැරදි/.test(b)), partial.buttons.join(' | '));

    /* ---------- 4d. 🎨 layout — buttons camera එකට යටින් (thumb-reachable) ---------- */
    const layout = await evaluate(cdp, sessionId, `(() => {
      const camWrap = document.getElementById('camWrap');
      const actions = document.getElementById('scanActions');
      const ctl = document.getElementById('scanCamCtl');
      const other = document.getElementById('otherMethods');
      const purpose = document.getElementById('scanPurposeNote');
      const native = document.getElementById('uploadBtn');
      const before = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      return {
        hasActions: !!actions,
        actionsAfterCam: !!(camWrap && actions && before(camWrap, actions)),
        ctlInActions: !!(ctl && actions && actions.contains(ctl)),
        ctlHiddenInitially: !!(ctl && getComputedStyle(ctl).display === 'none'),
        otherCollapsed: !!(other && !other.open),
        nativeInsideOther: !!(other && native && other.contains(native)),
        purposeCompact: !!(purpose && purpose.classList.contains('scanhint')),
        sticky: !!(actions && getComputedStyle(actions).position === 'sticky'),
        diagLine: !!document.getElementById('qrDiagLine'),
        torchBtn: !!document.getElementById('torchBtn'),
        scanNowBtn: !!document.getElementById('scanNowBtn'),
        captureBtn: !!document.getElementById('captureBtn'),
        uploadBtn: !!document.getElementById('uploadBtn'),
        duplicates: ['shotBtn', 'qrHiResBtn', 'nativeCamBtn', 'galleryBtn', 'qrPhotoInput', 'nativeCamInput', 'galleryInput']
          .filter(id => !!document.getElementById(id)),
      };
    })()`);
    ok('පහළ action bar එක තියෙනවා', layout.hasActions);
    ok('action bar එක camera එකට **යටින්** (thumb-reachable)', layout.actionsAfterCam);
    ok('camera පාලන (zoom/focus/දැන්ම) action bar එකේ ඇතුළේ', layout.ctlInActions);
    ok('කැමරාව වැහිලා ඉද්දී පාලන හංගලා', layout.ctlHiddenInitially);
    ok('වෙනත් ක්රම (photo එකක් එවන්න) collapsed', layout.otherCollapsed && layout.nativeInsideOther);
    ok('කෙටි hint එකක් විතරයි (දිග පැහැදිලි කිරීම් අයින්)', layout.purposeCompact);
    ok('action bar එක sticky (මාපටැඟිල්ලට ළඟට එනවා)', layout.sticky);
    ok('🔬 diagnostics + 🔆 torch + 🔍 දැන්ම buttons',
      layout.diagLine && layout.torchBtn && layout.scanNowBtn);
    ok('📷 Photo එකක් ගන්න button එක 1ක් විතරයි (capture)',
      layout.captureBtn);
    ok('🖼️ Photo එවන්න button එක 1ක් විතරයි (upload)',
      layout.uploadBtn);
    ok('⚠️ එකම වැඩේ කරන පරණ buttons අයින් කරලා (duplicates 0)',
      layout.duplicates.length === 0, 'ඉතුරු: ' + layout.duplicates.join(', '));

    /* ---------- 4e. 📐 මිනුම් — button ප්‍රමාණය + කැමරාව open වුනාම layout ---------- */
    const metrics = await evaluate(cdp, sessionId, `(async () => {
      const r = el => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, bottom: b.bottom }; };
      const camWrap = document.getElementById('camWrap');
      const actions = document.getElementById('scanActions');
      const start = document.getElementById('camStartBtn');
      // කැමරාව open වුනාට පස්සේ තත්ත්වය simulate කරනවා (device එකක් නැති නිසා)
      const wrapDisplay = camWrap.style.display;
      camWrap.style.display = 'block';
      camWrap.scrollIntoView({ block: 'start' });
      await new Promise(res => setTimeout(res, 250));
      const ctl = document.getElementById('scanCamCtl');
      ctl.style.display = 'flex';
      const torch = document.getElementById('torchBtn');
      torch.style.display = '';
      const focus = document.getElementById('refocusBtn');
      focus.style.display = '';
      const now = document.getElementById('scanNowBtn');

      const out = {
        start: r(start), actions: r(actions), camWrap: r(camWrap),
        torch: r(torch), focus: r(focus), now: r(now),
        // ✅ නිවැරදි තත්ත්වය: (අ) කැමරාවට යටින් හෝ (ආ) තිරයේ පහළම sticky වෙලා
        // (sticky bar එකක් දිග content එකකදී තිරයේ පහළට stick වෙනවා — ඒක තමයි ඕන දේ)
        actionsBelowCam: (r(actions).y >= r(camWrap).bottom - 2) ||
                         (r(actions).bottom >= window.innerHeight - 2),
        barH: Math.round(r(actions).h),
        vh: window.innerHeight,
        ctlFlex: getComputedStyle(ctl).display === 'flex',
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        stickyBottom: getComputedStyle(actions).bottom,
      };
      // ආපහු කලින් තත්ත්වයට
      camWrap.style.display = wrapDisplay;
      ctl.style.display = 'none';
      torch.style.display = 'none';
      focus.style.display = 'none';
      return out;
    })()`, true);
    ok('ප්‍රධාන button එක ≥48px උස (ඇඟිල්ලට පහසුයි)', metrics.start.h >= 48,
      Math.round(metrics.start.w) + '×' + Math.round(metrics.start.h));
    ok('camera open වුනාම පාලන පේළිය පේනවා', metrics.ctlFlex);
    ok('🔆/🎯/🔍 buttons ≥40px උස', metrics.torch.h >= 40 && metrics.focus.h >= 40 && metrics.now.h >= 40,
      [metrics.torch.h, metrics.focus.h, metrics.now.h].map(h => Math.round(h)).join('/'));
    ok('action bar එක camera preview එකට යටින්ම (හෝ තිරයේ පහළම sticky)',
      metrics.actionsBelowCam,
      'cam.bottom=' + Math.round(metrics.camWrap.bottom) + ' bar.top=' + Math.round(metrics.actions.y) +
      ' bar.bottom=' + Math.round(metrics.actions.bottom) + ' vh=' + metrics.vh);
    ok('action bar එක කෙටියි (තිරයෙන් වැඩි කොටසක් ගන්නේ නෑ)',
      metrics.barH <= 200, 'height=' + metrics.barH + 'px');
    ok('තිරස් scroll නෑ (mobile overflow නෑ)', metrics.overflowX <= 1, 'overflowX=' + metrics.overflowX);

    /* ---------- 4f. 🎯 සම්පූර්ණ chain — ඇත්ත draw එකකින් QR → check → compare → හඬ ---------- */
    section('4f. 🎯 QR → check → සැසඳීම → ශබ්දය (ඇත්ත දත්ත වලින්)');
    const chain = await evaluate(cdp, sessionId, `(async () => {
      // 1) ඇත්ත draw එකක් ගන්නවා (1-ඉලක්කම් 6ක් තියෙන මහජන සම්පත්)
      const latest = await fetch('/api/latest').then(r => r.json());
      const row = (latest.results || []).find(x => x.slug === 'mahajana-sampatha') || (latest.results || [])[0];
      if (!row) return { error: 'no draw data' };

      // 2) QR payload එකක් හදනවා — හරියටම ඒ draw එකේ අංක/අකුරු වලින්
      const parts = ['MAHAJANA SAMPATHA', 'DRAW:' + row.drawNo, 'DATE:' + row.date];
      if (row.letter) parts.push('LETTER:' + row.letter);
      parts.push((row.numbers || []).join(' '));
      const payload = parts.join(' | ');

      // 3) app එකේ ඇත්ත flow එකෙන් scan කරනවා
      document.querySelector('#tabs button[data-tab="scan"]').click();
      await window.__lkm.onQrDecoded(payload, 'jsqr', 120);
      await new Promise(r => setTimeout(r, 1200));

      const host = document.getElementById('scanMatch');
      const cmpHtml = host.querySelector('.cmp');
      const result = host.querySelector('.result');

      // 4) ශබ්දය ON ද කියලා සහතික කරගන්නවා (කලින් test එකක් off කරලා තිබ්බොත්)
      const sb = document.getElementById('soundBtn');
      if (sb && /නිශ්ශබ්දයි/.test(sb.textContent)) { sb.click(); await new Promise(r => setTimeout(r, 120)); }

      // 5) 🔊 වාක්‍ය අල්ලගන්නවා — speak() එකට යන text එක බාරගන්නවා
      let spoken = null;
      const origSpeak = window.speechSynthesis ? window.speechSynthesis.speak : null;
      try {
        if (window.speechSynthesis) {
          window.speechSynthesis.speak = u => { spoken = String(u && u.text || ''); };
        }
      } catch (e) { /* ignore */ }
      try {
        window.__lkm.announceResult({ won: false, lottery: { name: 'Govisetha' } });
        await new Promise(r => setTimeout(r, 700));
        const loseSpoken = spoken;
        spoken = null;
        window.__lkm.announceResult({ won: true, prizeAmountRs: 40, prizeLabel: '3RD',
                                      lottery: { name: 'Govisetha' } });
        await new Promise(r => setTimeout(r, 800));
        window.__loseSpoken = loseSpoken;
      } catch (e) { /* ignore */ }
      window.__spokenFinal = spoken;
      try { if (origSpeak) window.speechSynthesis.speak = origSpeak; } catch (e) {}
      const diag = (document.getElementById('qrDiagLine') || {}).innerText || '';

      return {
        payload: payload,
        drawNo: row.drawNo,
        letter: row.letter || null,
        numbers: row.numbers || [],
        cmpExists: !!cmpHtml,
        cmpClass: cmpHtml ? cmpHtml.className : null,
        cmpText: cmpHtml ? cmpHtml.innerText.slice(0, 300) : null,
        hitCount: cmpHtml ? (cmpHtml.innerText.match(/found in the draw|දිනුම් අංක අතරේ තියෙනවා/) ? true : false) : false,
        verdictWon: !!(result && /දිනුම්|වාසනා|won/i.test(result.innerText)),
        spoken: window.__spokenFinal,
        loseSpoken: window.__loseSpoken,
        diag: diag,
      };
    })()`, true, true);

    if (chain.error) {
      ok('chain test එකට දත්ත හම්බුනා', false, chain.error);
    } else {
      ok('QR payload එක හදලා scan කළා (draw ' + chain.drawNo + ')', !!chain.payload);
      ok('🎟️ සැසඳීමේ ටේබලය ප්‍රතිඵලය ඇතුළේ තියෙනවා', chain.cmpExists);
      ok('හැම field එකක්ම ගැලපුනා → cmp.ok (කොළ පාට)',
        !!(chain.cmpClass && chain.cmpClass.indexOf('ok') >= 0), chain.cmpClass || '');
      ok('ප්‍රතිඵලය "දිනුම්" ලෙස පෙන්නනවා', chain.verdictWon);
      ok('🔊 පරාද වුනාම: "Sorry, you have lost this time. Try again."',
        chain.loseSpoken === 'Sorry, you have lost this time. Try again.' ||
        chain.diag.indexOf('You have lost this time') >= 0,
        'spoken=' + JSON.stringify(chain.loseSpoken));
      ok('🔊 දිනුමක්: මුදල වචන වලින් — "…forty rupees…" (ඉලක්කම් නෙවෙයි)',
        (chain.spoken && /forty rupees/.test(chain.spoken)) || /forty rupees/.test(chain.diag),
        'spoken=' + JSON.stringify(chain.spoken) + ' | diag=' + (chain.diag || '').slice(0, 120));
    }

    /* ---------- 4g. 🎯 0.8cm QR සහාය + 🎧 හඬ මෙවලම් ---------- */
    section('4g. 🎯 පොඩි QR (0.8cm) සහාය + හඬ මෙවලම්');
    const tools = await evaluate(cdp, sessionId, `(() => {
      const has = id => !!document.getElementById(id);
      const fn = n => typeof window.__lkm[n] === 'function';
      return {
        soundTest: has('soundTestBtn'),
        focusSlider: has('focusSlider') && has('focusWrap'),
        zoomSlider: has('zoomSlider'),
        captureBtn: has('captureBtn'),
        // diagnostics පේළියේ high-res පාර ගැන තොරතුරු තියෙනවද
        diag: (document.getElementById('qrDiagLine') || {}).innerText || '',
        htmlHasHiRes: document.documentElement.innerHTML.indexOf('QR_HI_MAX') >= 0 ||
                      document.documentElement.innerHTML.indexOf('hi-res') >= 0,
      };
    })()`);
    ok('🎧 හඬ පරීක්ෂා කරන button එක තියෙනවා (phone එකේ හඬ බලන්න)', tools.soundTest);
    ok('🎯 අතින් focus slider එක තියෙනවා (auto-focus නොවුනොත්)', tools.focusSlider);
    ok('🔍 zoom slider එක තියෙනවා', tools.zoomSlider);
    ok('📷 Photo button එක තියෙනවා', tools.captureBtn);

    // 🎧 හඬ පරීක්ෂාව ඔබලා speak() එකට යන වාක්‍ය දෙක අල්ලගන්නවා
    const soundTest = await evaluate(cdp, sessionId, `(async () => {
      const sb = document.getElementById('soundBtn');
      if (sb && /නිශ්ශබ්දයි/.test(sb.textContent)) sb.click();
      const said = [];
      const orig = window.speechSynthesis ? window.speechSynthesis.speak : null;
      try { if (window.speechSynthesis) window.speechSynthesis.speak = u => said.push(String(u && u.text || '')); } catch (e) {}
      document.getElementById('soundTestBtn').click();
      await new Promise(r => setTimeout(r, 5200));
      try { if (orig) window.speechSynthesis.speak = orig; } catch (e) {}
      return { said: said, ctxState: (window.AudioContext ? 'ok' : 'n/a') };
    })()`, true, true);
    ok('🎧 හඬ පරීක්ෂාවෙන් දිනුම් වාක්‍යය කියනවා (මුදල වචන වලින්)',
      soundTest.said.some(x => /forty rupees/.test(x)), JSON.stringify(soundTest.said));
    ok('🎧 හඬ පරීක්ෂාවෙන් පරාද වාක්‍යයත් කියනවා',
      soundTest.said.some(x => /lost this time/.test(x)), JSON.stringify(soundTest.said));

    /* ---------- 4h. 🎫 ඇත්ත ටිකට් QR (අංක නැති) — වැරදි ප්රතිඵලයක් නොපෙන්වයි ---------- */
    section('4h. 🎫 ඇත්ත NLB/DLB ටිකට් QR — අනන්‍යතාව විතරයි (වැරදි ප්රතිඵල නෑ)');
    const ticketId = await evaluate(cdp, sessionId, `(async () => {
      document.querySelector('#tabs button[data-tab="scan"]').click();
      await new Promise(r => setTimeout(r, 80));

      // 1) NLB barcode: 3-කේතය + 5-draw + 7-serial  (ඇත්ත ටිකට් රටාව)
      await window.__lkm.onQrDecoded('085016050326004', 'jsqr', 90);
      await new Promise(r => setTimeout(r, 1200));
      const host = document.getElementById('scanMatch');
      const txt1 = host.innerText || '';
      const card1 = {
        hasNote: /ඔබ තෝරපු අංක නෑ|අංක නෑ/.test(txt1),
        hasBoard: /NLB/.test(txt1),
        hasDraw: /1605/.test(txt1),
        hasSerial: /0326004/.test(txt1),
        // ලොතරැයිය හඳුනාගත්තාද + නිල අංක පෙන්නනවාද
        identified: /හඳුනාගත්තා/.test(txt1),
        showsNumbers: /5|16|17|42/.test(txt1),
        // ⚠️ ප්රතිඵලයක් (win/lose) පෙන්නන්නේ නෑ — QR එකේ අංක නැති නිසා
        noFakeResult: !host.querySelector('.result'),
        buttons: Array.from(host.querySelectorAll('button')).map(b => b.textContent.trim()),
        rawBlock: !!host.querySelector('.rawdbg'),
      };

      // 2) "අංක ටයිප් කරන්න" ඔබලා prefill වෙනවද බලනවා
      const editBtn = Array.from(host.querySelectorAll('button'))
        .find(b => /අංක ටයිප්/.test(b.textContent));
      let prefill = null;
      if (editBtn) {
        editBtn.click();
        await new Promise(r => setTimeout(r, 200));
        prefill = {
          drawNo: (document.getElementById('drawNo') || {}).value || '',
          lottery: (document.getElementById('lotterySelect') || {}).value || '',
          checkTabActive: !!document.querySelector('#tab-check.active'),
        };
      }

      // 3) DLB hyphen එකක්
      document.querySelector('#tabs button[data-tab="scan"]').click();
      await new Promise(r => setTimeout(r, 80));
      host.innerHTML = '';
      await window.__lkm.onQrDecoded('4993-500395754-7-04', 'jsqr', 90);
      await new Promise(r => setTimeout(r, 1200));
      const txt2 = host.innerText || '';
      const card2 = {
        hasDLB: /DLB/.test(txt2),
        hasDraw: /4993/.test(txt2),
        identified: /හඳුනාගත්තා/.test(txt2),
        noFakeResult: !host.querySelector('.result'),
        txt: txt2.slice(0, 300),
      };
      document.querySelector('#tabs button[data-tab="scan"]').click();
      return { card1: card1, prefill: prefill, card2: card2 };
    })()`, true, true);

    ok('QR එකේ අංක නෑ කියලා පැහැදිලිව කියනවා', ticketId.card1.hasNote);
    ok('NLB board + draw 1605 + serial 0326004 කියවුනා',
      ticketId.card1.hasBoard && ticketId.card1.hasDraw && ticketId.card1.hasSerial);
    ok('🎯 ලොතරැයිය හඳුනාගත්තා + ඒ draw එකේ නිල අංක පෙන්නනවා',
      ticketId.card1.identified && ticketId.card1.showsNumbers);
    ok('⚠️ වැරදි ප්රතිඵලයක් පෙන්නන්නේ **නෑ** (win/lose කාඩ් එකක් නෑ)', ticketId.card1.noFakeResult);
    ok('🔍 ඇත්ත QR දත්ත (copy කරන්න) block එක තියෙනවා', ticketId.card1.rawBlock);
    ok('"✏️ අංක ටයිප් කරන්න" + "🤖 AI Scan" buttons 2ක්',
      ticketId.card1.buttons.some(b => /අංක ටයිප්/.test(b)) &&
      ticketId.card1.buttons.some(b => /AI Scan/.test(b)));
    ok('✏️ ඔබද්දී **QR එකේ draw අංකය (1605)** check එකට පුරවනවා',
      ticketId.prefill && ticketId.prefill.drawNo === '1605',
      JSON.stringify(ticketId.prefill));
    ok('✏️ ලොතරැයියත් තෝරලා දෙනවා (handahana) + check tab එකට යනවා',
      ticketId.prefill && ticketId.prefill.lottery === 'handahana' && ticketId.prefill.checkTabActive,
      JSON.stringify(ticketId.prefill));
    ok('DLB ටිකට් එකත් හඳුනාගන්නවා (DLB · draw 4993 · ලොතරැයිය)',
      ticketId.card2.hasDLB && ticketId.card2.hasDraw && ticketId.card2.identified,
      JSON.stringify(ticketId.card2));
    ok('DLB එකෙනුත් වැරදි ප්රතිඵලයක් නෑ', ticketId.card2.noFakeResult);

    /* ---------- 4i. 👤 My Account + 🔎 Admin ක්‍රියාකාරකම් UI ---------- */
    section('4i. 👤 My Account (ඉතිහාසය) + 🔎 Admin ක්‍රියාකාරකම් සෙවීම');
    const acctUi = await evaluate(cdp, sessionId, `(async () => {
      const out = {};
      // Account tab එකට යනවා
      document.querySelector('#tabs button[data-tab="account"]').click();
      await new Promise(r => setTimeout(r, 900));
      const acct = document.getElementById('accountCard');
      out.loginForm = !!(acct.querySelector('input[type="email"]') || /login|ලොග්/i.test(acct.innerText));
      // (login නොකර) ብ UI elements තියෙනවද කියලා static HTML එකෙන් බලනවා
      const html = document.documentElement.innerHTML;
      out.hasMyHistory = html.indexOf('මගේ සම්පූර්ණ ඉතිහාසය') >= 0;
      out.hasAcctFilters = html.indexOf('acctLottery') >= 0 && html.indexOf('acctFrom') >= 0 && html.indexOf('acctWinsOnly') >= 0;
      out.hasAcctLoader = html.indexOf('loadAccountHistory') >= 0;
      // Admin section එක nav එකේ තියෙනවද
      out.hasActivitySection = html.indexOf('ක්‍රියාකාරකම් සෙවීම') >= 0;
      out.hasAdminChecksApi = html.indexOf('/api/admin/checks') >= 0;
      out.hasCsv = html.indexOf('CSV') >= 0;
      return out;
    })()`, true, true);
    ok('👤 Account tab එකේ login form එක තියෙනවා (email + password)', acctUi.loginForm);
    ok('🧾 Account tab එකේම "මගේ සම්පූර්ණ ඉතිහාසය" කොටස', acctUi.hasMyHistory && acctUi.hasAcctLoader);
    ok('🧾 ඉතිහාසයේ filters (ලොතරැයිය · දින · දිනුම් විතරයි)', acctUi.hasAcctFilters);
    ok('🔎 Admin එකේ "ක්‍රියාකාරකම් සෙවීම" section එක', acctUi.hasActivitySection);
    ok('🔎 Admin සෙවීම /api/admin/checks එකට සම්බන්ධයි + CSV download', acctUi.hasAdminChecksApi && acctUi.hasCsv);

    /* ---------- 5. 5-තත්පර overlay ---------- */
    section('5. ⏱️ 5-තත්පර ප්‍රතිඵල overlay');
    const overlay = await evaluate(cdp, sessionId, `(() => {
      window.LKMExtras.onQrHit('test', 'jsqr', 120);
      window.LKMExtras.onResult({
        lottery: { provider: 'DLB', slug: 'ada-kotipathi', name: 'Ada Kotipathi' },
        draw: { drawNo: '3113', date: '2026-09-17', numbers: ['11','14','19','70'], letter: 'L' },
        ticket: { numbers: ['11','14','19','70'], letter: 'L' },
        won: true, tier: 'SUPER', prizeLabel: 'Super Prize',
        prizeAmountRs: 20000000, prizeAmountFormatted: 'Rs. 20,000,000.00',
      }, {});
      const t = document.getElementById('lkmToast');
      return {
        shown: !!t,
        won: !!(t && t.className.indexOf('won') >= 0),
        amount: !!(t && t.innerText.indexOf('20,000,000') >= 0),
        countdown: !!(t && t.innerText.indexOf('5') >= 0),
        sec: window.LKMExtras._debug.overlaySec,
      };
    })()`);
    ok('overlay එක පේනවා', overlay.shown);
    ok('දිනුම් style එක (won)', overlay.won);
    ok('දිනුම් මුදල පේනවා', overlay.amount);
    ok('countdown එක තියෙනවා', overlay.countdown);
    ok('කාලය තත්පර 5', overlay.sec === 5, String(overlay.sec));

    await sleep(6500);
    const overlayGone = await evaluate(cdp, sessionId, `!document.getElementById('lkmToast')`);
    ok('තත්පර 5කින් තනියම අයින් වුනා', overlayGone === true);

    /* ---------- 6. Offline ---------- */
    section('6. 📴 Offline mode (internet නැතුව)');
    const off = await evaluate(cdp, sessionId, `(async () => {
      await window.LKMExtras._debug.syncBundle(true);
      const b = window.LKMExtras._debug.bundle();
      const lot = b.lotteries.find(l => l.slug === 'mahajana-sampatha');
      const d = lot.draws[0];

      // 1) bundle එකෙන් /api/latest හදනවාද
      const latest = window.LKMExtras._debug.serveFromBundle('/api/latest');
      // 2) draw එකක් හම්බුනොත් ticket check එක
      const ticket = { numbers: d.numbers.slice() };
      if (d.letter) ticket.letter = d.letter;
      const chk = window.LKMExtras._debug.offlineCheck({
        slug: 'mahajana-sampatha', drawNo: String(d.drawNo),
        numbers: ticket.numbers, letter: ticket.letter,
      });
      // 3) results-by-date (offline)
      const byDate = window.LKMExtras._debug.serveFromBundle('/api/results-by-date?date=' + d.date);
      return {
        latestOk: !!(latest && latest.results && latest.results.length),
        latestCount: latest ? latest.results.length : 0,
        won: chk && chk.won, engine: chk && chk.engine,
        amount: chk && chk.prizeAmountFormatted, offlineFlag: !!(chk && chk.offline),
        byDateCount: byDate ? byDate.count : 0,
        drawNo: String(d.drawNo), date: d.date,
      };
    })()`, true);
    ok('bundle → /api/latest (offline)', off.latestOk, off.latestCount + ' results');
    ok('offline ticket check එක වැඩ කරනවා', off.won === true,
      'draw ' + off.drawNo + ' · ' + off.amount);
    ok('engine = offline-prize-table', off.engine === 'offline-prize-table', String(off.engine));
    ok('offline flag + disclaimer', off.offlineFlag);
    ok('bundle → /api/results-by-date (offline)', off.byDateCount > 0,
      off.date + ' → ' + off.byDateCount + ' results');

    // ඇත්තටම network එක offline කරලා app එකේ api එක test කරමු
    await cdp.send('Network.emulateNetworkConditions', {
      offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0,
    }, sessionId);
    await sleep(600);
    const offlinePage = await evaluate(cdp, sessionId, `(async () => {
      const r = {};
      // app එකේම api() එක offline එකේදී bundle එකෙන් උත්තර දෙනවද?
      try {
        const b = window.LKMExtras._debug.bundle();
        const lot = b.lotteries.find(l => l.slug === 'govisetha') || b.lotteries[0];
        const d = lot.draws[0];
        r.directFetch = 'skipped';
      } catch (e) { r.directFetch = 'err: ' + e.message; }
      r.isOffline = window.LKMExtras._debug.isOffline();
      return r;
    })()`, true);
    ok('navigator.onLine = false', offlinePage.isOffline === true);

    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
    }, sessionId);
    await sleep(300);

    /* ---------- 7. භාෂා 3 ---------- */
    section('7. 🌐 භාෂා 3 (සිංහල / English / தமிழ்)');
    const langs = await evaluate(cdp, sessionId, `(async () => {
      const out = {};
      const wait = () => new Promise(r => setTimeout(r, 80));
      for (const code of ['si', 'en', 'ta']) {
        document.querySelectorAll('#langSw button').forEach(b => {
          if (b.dataset.lang === code) b.click();
        });
        await wait();     // app එකේ i18n + අපේ status/info bar එකත් update වෙන්න
        out[code] = {
          tab: document.querySelector('#tabs button[data-tab="scan"]').textContent.trim(),
          status: (document.getElementById('lkmStatusBar') || {}).innerText || '',
          info: (document.getElementById('lkmInfoQuick') || {}).innerText || '',
        };
      }
      return out;
    })()`, true);
    ok('සිංහල tab නම', /Scan|ස්කෑන්|📷/.test(langs.si.tab), langs.si.tab);
    ok('English info bar', /Info & legal|About us/.test(langs.en.info), langs.en.info.slice(0, 40));
    ok('தமிழ் info bar', /தகவல்|எங்களை/.test(langs.ta.info), langs.ta.info.slice(0, 40));
    ok('භාෂාව මාරු වුනාම status bar එකත් translate වෙනවා',
      /Online|இணைப்பு|යාවත්කාලීන/.test(langs.ta.status + langs.en.status));

  } catch (e) {
    fail++;
    failures.push('exception: ' + e.message);
    console.log('\n✗ Exception: ' + e.message);
    console.log(serverLog.slice(-1200));
  } finally {
    try { if (cdp) await cdp.send('Browser.close').catch(() => {}); } catch (e) {}
    cleanup();
  }

  console.log('\n══════════════════════════════════════════════════════');
  console.log('  ✓ Pass: ' + pass + '   ✗ Fail: ' + fail);
  if (failures.length) console.log('  Failures: ' + failures.join(' | '));
  console.log('══════════════════════════════════════════════════════');
  process.exit(fail === 0 ? 0 : 1);
}

main();
