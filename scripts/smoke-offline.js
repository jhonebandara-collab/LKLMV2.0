#!/usr/bin/env node
/**
 * scripts/smoke-offline.js — 📴 Offline (PWA) layer smoke test
 *
 * මේකෙන් පරීක්ෂා කරන දේවල්:
 *   1. Server එක start වෙනවද + offline endpoints වැඩ කරනවද
 *   2. `/api/offline-bundle` එකේ ඇත්ත draws තියෙනවද (මාස 6)
 *   3. PWA files (sw.js · offline.js · prize-engine.js · offline.html) serve වෙනවද
 *   4. index.html එකේ hooks ටික තියෙනවද
 *   5. ⚠️ වැදගත්ම දේ: **server එකේ ප්‍රතිඵලය = browser (offline) එකේ ප්‍රතිඵලය**
 *      — ඇත්ත draw එකකින් හදපු ටිකට් එකක් දෙකේම එකම දිනුම/tier/මුදල දෙනවද
 *
 * Run:  npm run test:offline      (හෝ: node scripts/smoke-offline.js)
 */

'use strict';

const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.SMOKE_PORT || 3987);
const BASE = 'http://127.0.0.1:' + PORT;

let pass = 0, fail = 0;
const failures = [];

function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name + (extra ? ' — ' + extra : '')); }
  else { fail++; failures.push(name); console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
}
function section(t) { console.log('\n' + t); }

async function getJson(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}
  return { status: res.status, json, text };
}

/** Server එක ready වෙනකම් ඉන්නවා (උපරිම තත්පර 30) */
async function waitReady() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await getJson(BASE + '/api/health');
      if (r.status === 200) return true;
    } catch (e) { /* තවම නෑ */ }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

/** Browser එකේ වගේ `window` එකක් හදලා prize-engine.js load කරනවා */
function loadBrowserPrizeEngine() {
  const fs = require('fs');
  const src = fs.readFileSync(path.join(ROOT, 'public', 'prize-engine.js'), 'utf8');
  const fakeWindow = {};
  // eslint-disable-next-line no-new-func
  new Function('window', 'globalThis', src + '\nreturn window.LKMPrizes;')(fakeWindow, fakeWindow);
  return fakeWindow.LKMPrizes;
}

/** Ticket එකක් official draw එකෙන් හදනවා (ගැලපෙන එකක්) */
function ticketFrom(draw, sub) {
  const d = sub || draw;
  const t = { numbers: (d.numbers || []).map(String) };
  if (d.letter) t.letter = String(d.letter).toUpperCase();
  if (d.zodiac) t.zodiac = String(d.zodiac).toUpperCase();
  if (d.superNumber != null && d.superNumber !== '') t.superNumber = d.superNumber;
  return t;
}

async function main() {
  console.log('══════════════════════════════════════════════════════');
  console.log('  📴 LK Lottery Master — Offline layer smoke test');
  console.log('══════════════════════════════════════════════════════');

  const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    cwd: ROOT,
    env: Object.assign({}, process.env, {
      PORT: String(PORT),
      JWT_SECRET: process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
        ? process.env.JWT_SECRET
        : 'smoke-test-secret-0123456789abcdefghijklmnop',
      // Test එක deterministic වෙන්න — live scrape එකක් trigger නොවෙන්න
      // (data.json එකේ mtime/scrapedAt පරණ උනොත් server එක තනියම බාගන්නවා)
      SCRAPE_MAX_AGE_HOURS: '9999',
    }),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverLog = '';
  child.stdout.on('data', d => { serverLog += d.toString(); });
  child.stderr.on('data', d => { serverLog += d.toString(); });

  const cleanup = () => { try { child.kill('SIGKILL'); } catch (e) {} };
  process.on('exit', cleanup);

  try {
    const ready = await waitReady();
    if (!ready) {
      console.log('\n✗ Server එක start වුනේ නෑ. Log:\n' + serverLog.slice(-1500));
      process.exit(1);
    }
    console.log('\n✓ Server ready: ' + BASE);

    /* ---------- 1. data-status ---------- */
    section('1. 📊 /api/data-status (gate එකට ඕන දත්ත)');
    const ds = await getJson(BASE + '/api/data-status');
    ok('status 200', ds.status === 200);
    ok('hasData = true', !!(ds.json && ds.json.hasData), ds.json && ('lotteries ' + ds.json.lotteries + ' · draws ' + ds.json.draws));
    ok('draws > 0', !!(ds.json && ds.json.draws > 0), ds.json && String(ds.json.draws));
    ok('scrapedAt තියෙනවා', !!(ds.json && ds.json.scrapedAt), ds.json && ds.json.scrapedAt);

    /* ---------- 2. offline bundle ---------- */
    section('2. 📦 /api/offline-bundle (offline cache එක)');
    const ob = await getJson(BASE + '/api/offline-bundle');
    ok('status 200', ob.status === 200);
    const b = ob.json || {};
    ok('lotteries >= 10', Array.isArray(b.lotteries) && b.lotteries.length >= 10,
      b.lotteries ? b.lotteries.length + ' lotteries' : '—');
    ok('totalDraws > 100', b.totalDraws > 100, String(b.totalDraws));
    ok('හැම lottery එකකටම draws තියෙනවා',
      Array.isArray(b.lotteries) && b.lotteries.every(l => Array.isArray(l.draws) && l.draws.length > 0));
    ok('draw එකකට drawNo + date + numbers තියෙනවා',
      Array.isArray(b.lotteries) && b.lotteries.every(l => l.draws.every(d =>
        d.drawNo != null && /^\d{4}-\d{2}-\d{2}$/.test(String(d.date)) &&
        Array.isArray(d.numbers) && d.numbers.length > 0)));
    ok('මාස 6ක පරාසයක් (since තියෙනවා)', !!b.since, b.since);
    const size = await getJson(BASE + '/api/offline-bundle/size');
    ok('bundle size < 2MB (localStorage එකට ගැලපෙනවා)',
      !!(size.json && size.json.kb < 2048), size.json && (size.json.kb + ' KB'));

    /* ---------- 3. PWA files ---------- */
    section('3. 🗂️ PWA files serve වෙනවාද');
    for (const f of ['sw.js', 'offline.js', 'prize-engine.js', 'offline.html', 'manifest.webmanifest']) {
      const r = await fetch(BASE + '/' + f);
      ok('/' + f, r.status === 200, 'HTTP ' + r.status);
    }

    /* ---------- 4. index.html hooks ---------- */
    section('4. 🔌 index.html hooks');
    const html = await (await fetch(BASE + '/')).text();
    ok('prize-engine.js script tag', html.includes('src="/prize-engine.js"'));
    ok('offline.js script tag', html.includes('src="/offline.js"'));
    ok('api() offline hook', html.includes('LKMExtras.routeOffline'));
    ok('network fail fallback hook', html.includes('LKMExtras.networkFailed'));
    ok('result overlay hook', html.includes('LKMExtras.onResult'));
    ok('QR classify hook', html.includes('LKMExtras.classifyQr'));
    ok('__lkm.startQrLoop expose කරලා', html.includes('startQrLoop, stopQrLoop'));

    /* ---------- 5. engine parity (වැදගත්ම) ---------- */
    section('5. ⚖️ Server engine = Browser (offline) engine');
    const P = loadBrowserPrizeEngine();
    ok('browser engine load වුනා', !!(P && typeof P.evaluatePrize === 'function'));

    let compared = 0, mismatches = 0;
    const detail = [];

    for (const lot of (b.lotteries || [])) {
      const draw = (lot.draws || [])[0];
      if (!draw) continue;

      let subGameIndex = null;
      let official = draw;
      if (lot.prizeKind === 'multi' && Array.isArray(draw.subGames) && draw.subGames.length) {
        subGameIndex = 0;
        official = draw.subGames[0];
      }
      const ticket = ticketFrom(draw, subGameIndex == null ? null : official);

      const body = {
        slug: lot.slug,
        drawNo: String(draw.drawNo),
        numbers: ticket.numbers,
      };
      if (ticket.letter) body.letter = ticket.letter;
      if (ticket.zodiac) body.zodiac = ticket.zodiac;
      if (ticket.superNumber != null) body.superNumber = ticket.superNumber;
      if (subGameIndex != null) body.subGameIndex = subGameIndex;

      // --- server ---
      const srv = await getJson(BASE + '/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (srv.status !== 200) { detail.push(lot.slug + ': server HTTP ' + srv.status); continue; }

      // --- browser (offline) ---
      const localDraw = {
        drawNo: String(draw.drawNo), date: draw.date,
        letter: draw.letter || null, zodiac: draw.zodiac || null,
        superNumber: draw.superNumber != null ? draw.superNumber : null,
        numbers: (draw.numbers || []).map(String),
      };
      if (draw.subGames) localDraw.subGames = draw.subGames;
      const local = P.evaluatePrize(lot.slug, localDraw, ticket,
        subGameIndex != null ? { subGameIndex } : undefined);

      compared++;
      const same = (!!srv.json.won === !!local.won) &&
        (String(srv.json.tier || '') === String(local.tier || '')) &&
        (Number(srv.json.prizeAmountRs || 0) === Number(local.prizeAmountRs || 0));

      if (!same) {
        mismatches++;
        detail.push(lot.slug + ': server=' + JSON.stringify({
          won: srv.json.won, tier: srv.json.tier, amt: srv.json.prizeAmountRs,
        }) + ' offline=' + JSON.stringify({
          won: local.won, tier: local.tier, amt: local.prizeAmountRs,
        }));
      }
    }

    ok('ටිකට් ' + compared + 'ක් සසඳා බැලුවා', compared >= 10, compared + ' lotteries');
    ok('ප්‍රතිඵල 100% සමානයි', mismatches === 0,
      mismatches ? mismatches + ' mismatch' : '0 mismatch');
    if (detail.length) detail.slice(0, 6).forEach(d => console.log('      · ' + d));

    /* ---------- 6. වැරදි ටිකට් එකක් (නොදිනන) ---------- */
    section('6. 🎯 නොදිනන ටිකට් එකක් — දෙකේම එකම උත්තරද');
    const lot0 = (b.lotteries || []).find(l => l.slug === 'mahajana-sampatha') || (b.lotteries || [])[0];
    const d0 = (lot0.draws || [])[0];
    const bad = ['99', '98', '97', '96'];
    const srvBad = await getJson(BASE + '/api/check', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: lot0.slug, drawNo: String(d0.drawNo), numbers: bad }),
    });
    const localBad = P.evaluatePrize(lot0.slug, {
      drawNo: String(d0.drawNo), date: d0.date, letter: d0.letter || null,
      zodiac: d0.zodiac || null, superNumber: d0.superNumber != null ? d0.superNumber : null,
      numbers: (d0.numbers || []).map(String), subGames: d0.subGames,
    }, { numbers: bad });
    ok('දෙකේම won = false', srvBad.json && srvBad.json.won === false && localBad.won === false,
      lot0.slug + ' · draw ' + d0.drawNo);

    /* ---------- 7. offline GET rebuild (bundle → API shape) ---------- */
    section('7. 🔁 Bundle එකෙන් API පිළිතුරු හදනවාද (offline mode)');
    const latest = await getJson(BASE + '/api/latest');
    ok('/api/latest එකේ results තියෙනවා',
      !!(latest.json && Array.isArray(latest.json.results) && latest.json.results.length));
    const day = latest.json.results[0].date;
    const byDate = await getJson(BASE + '/api/results-by-date?date=' + day);
    ok('/api/results-by-date (' + day + ') හම්බුනා', !!(byDate.json && byDate.json.count > 0),
      byDate.json && (byDate.json.count + ' results'));
    const bundleDay = (b.lotteries || []).reduce((n, l) => n + l.draws.filter(x => x.date === day).length, 0);
    ok('bundle එකේත් ඒ දවසේ draws තියෙනවා', bundleDay === byDate.json.count,
      'bundle=' + bundleDay + ' server=' + byDate.json.count);

  } catch (e) {
    fail++;
    failures.push('exception: ' + e.message);
    console.log('\n✗ Exception: ' + e.message);
    console.log(serverLog.slice(-1200));
  } finally {
    cleanup();
  }

  console.log('\n══════════════════════════════════════════════════════');
  console.log('  ✓ Pass: ' + pass + '   ✗ Fail: ' + fail);
  if (failures.length) console.log('  Failures: ' + failures.join(' | '));
  console.log('══════════════════════════════════════════════════════');
  process.exit(fail === 0 ? 0 : 1);
}

main();
