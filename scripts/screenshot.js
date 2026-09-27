#!/usr/bin/env node
/**
 * scripts/screenshot.js — 📸 UI එකේ screenshot ගන්න (headless Chrome)
 *
 * පාවිච්චිය:
 *   node scripts/screenshot.js             # scan tab (කැමරාව වැහිලා)
 *   node scripts/screenshot.js open        # කැමරාව open වුනාට පස්සේ layout එක
 *   node scripts/screenshot.js result      # ප්රතිඵලයක් පෙන්නන විදිහ
 *   node scripts/screenshot.js mobile      # phone ප්රමාණයෙන්
 */

'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const net = require('net');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = process.env.SHOT_OUT || path.join(ROOT, 'screenshots');
const MODE = (process.argv[2] || 'closed').toLowerCase();
const MOBILE = MODE === 'mobile' || process.argv.includes('--mobile');

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); });
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

const CHROME = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium']
  .find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });

class Cdp {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener('message', ev => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? reject(new Error(m.error.message)) : resolve(m.result);
      }
    });
  }
  send(method, params, sessionId) {
    const id = ++this.id;
    const p = { id, method, params: params || {} };
    if (sessionId) p.sessionId = sessionId;
    this.ws.send(JSON.stringify(p));
    return new Promise((res, rej) => {
      this.pending.set(id, { resolve: res, reject: rej });
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('timeout ' + method)); } }, 30000);
    });
  }
}

async function main() {
  if (!CHROME) { console.log('⚠️ Chrome හම්බුනේ නෑ'); process.exit(0); }
  fs.mkdirSync(OUT, { recursive: true });

  const PORT = await freePort();
  const CDP = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'lkm-shot-'));

  const server = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    cwd: ROOT,
    env: Object.assign({}, process.env, {
      PORT: String(PORT), JWT_SECRET: 'shot-secret-0123456789abcdefghijklmnop',
      SCRAPE_MAX_AGE_HOURS: '9999',
    }),
    stdio: 'ignore',
  });
  const browser = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
    '--no-first-run', '--hide-scrollbars',
    '--user-data-dir=' + profile, '--remote-debugging-port=' + String(CDP), 'about:blank',
  ], { stdio: 'ignore' });

  const cleanup = () => {
    try { browser.kill('SIGKILL'); } catch (e) {}
    try { server.kill('SIGKILL'); } catch (e) {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  };
  process.on('exit', cleanup);

  try {
    for (let i = 0; i < 80; i++) {
      try { await fetch('http://127.0.0.1:' + CDP + '/json/version'); break; } catch (e) { await sleep(300); }
    }
    for (let i = 0; i < 60; i++) {
      try { const r = await fetch('http://127.0.0.1:' + PORT + '/api/health'); if (r.status === 200) break; }
      catch (e) { await sleep(400); }
    }
    const v = await (await fetch('http://127.0.0.1:' + CDP + '/json/version')).json();
    const ws = new WebSocket(v.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
    const cdp = new Cdp(ws);

    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: MOBILE ? 390 : 430,
      height: MOBILE ? 844 : 900,
      deviceScaleFactor: 2,
      mobile: MOBILE,
    }, sessionId);

    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/' }, sessionId);
    await sleep(4000);

    // disclaimer එක අයින් කරලා scan tab එකට යනවා
    await cdp.send('Runtime.evaluate', {
      expression: `(async () => {
        try { localStorage.setItem('lkm_disclaimer_seen', 'v1'); } catch (e) {}
        const m = document.getElementById('disclaimerModal');
        if (m) m.classList.remove('show');
        const t = document.querySelector('#tabs button[data-tab="scan"]');
        if (t) t.click();
        // 🔳 QR mode එකට
        const q = document.getElementById('modeQrBtn');
        if (q) q.click();
        if (${MODE === 'open' || MODE === 'mobile'}) {
          // කැමරාව open වුනාට පස්සේ layout එක බලන්න (device එකක් නැති නිසා simulate)
          const w = document.getElementById('camWrap');
          if (w) { w.style.display = 'block'; w.style.setProperty('--camw','420px'); }
          const ctl = document.getElementById('scanCamCtl');
          if (ctl) ctl.style.display = 'flex';
          const torch = document.getElementById('torchBtn');
          if (torch) torch.style.display = '';
          const z = document.getElementById('zoomWrap');
          if (z) z.style.display = 'flex';
          document.getElementById('zoomSlider').max = '4';
          document.getElementById('zoomSlider').value = '2.2';
          document.getElementById('zoomVal').textContent = '2.2x';
          const rf = document.getElementById('refocusBtn');
          if (rf) rf.style.display = 'flex';
          const st = document.getElementById('camStatus');
          if (st) st.textContent = '3840×2160 · focus: continuous';
        }
        if ('${MODE}' === 'result') {
          // ඇත්ත draw එකක් ගෙන ඒ අංක වලින්ම QR payload එකක් හදලා check කරනවා
          const latest = await fetch('/api/latest').then(r => r.json());
          const row = (latest.results || []).find(x => x.slug === 'mahajana-sampatha') || (latest.results || [])[0];
          const parts = ['MAHAJANA SAMPATHA', 'DRAW:' + row.drawNo, 'DATE:' + row.date];
          if (row.letter) parts.push('LETTER:' + row.letter);
          parts.push((row.numbers || []).join(' '));
          await window.__lkm.onQrDecoded(parts.join(' | '), 'jsqr', 120);
          await new Promise(r => setTimeout(r, 2200));
        }
        window.scrollTo(0, 0);
      })()`,
      awaitPromise: true,
    }, sessionId);
    await sleep(MODE === 'result' ? 2500 : 1200);

    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId);
    const file = path.join(OUT, 'scan-' + MODE + (MOBILE ? '-mobile' : '') + '.png');
    fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
    console.log('✓ ' + file);

    try { await cdp.send('Browser.close'); } catch (e) {}
  } catch (e) {
    console.log('✗ ' + e.message);
  } finally {
    cleanup();
  }
}

main();
