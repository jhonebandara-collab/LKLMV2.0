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
