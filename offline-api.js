/**
 * offline-api.js — Offline (PWA) සඳහා අවශ්‍ය server-side endpoints
 *
 * ═══════════════════════════════════════════════════════════════════
 * ඇයි මේක වෙනම module එකක්?
 *
 *   App එක **offline** වුනත් වැඩ කරන්න ඕන නිසා, client එකට එක පාරකින්
 *   සම්පූර්ණ දත්ත කට්ටලයක් (lottery structure + පසුගිය මාස 6ක draws)
 *   බාගන්න පුළුවන් endpoint එකක් ඕන. ඒක `data.json` එකෙන්
 *   **compact** කරලා හදනවා (server එකේ අනිත් වැඩවලට බාධා නොවෙන්න).
 *
 *   • GET /api/data-status     → දත්ත තියෙනවද / පරණයිද (app gate එකට)
 *   • GET /api/offline-bundle  → offline cache එකට සම්පූර්ණ bundle eka
 * ═══════════════════════════════════════════════════════════════════
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { describeLottery } = require('./lottery-meta');
const { hasPrizeTable } = require('./prizes');
const { isPositional } = require('./lottery-meta');

const DATA_FILE = path.join(__dirname, 'data.json');

/** Bundle එකට දාන ඉතිහාසය (මාස) — `.env` එකෙන් වෙනස් කරන්න පුළුවන් */
const BUNDLE_MONTHS = Number(process.env.OFFLINE_BUNDLE_MONTHS || 6);

/**
 * දත්ත "පරණ" විදිහට සලකන්න ඕන පැය ගණන.
 * Cron එක දවසට දෙපාරක් (09:30 + 21:30) run වෙන නිසා පැය 30ක්
 * ඇතුළත යාවත්කාලීනයක් බලාපොරොත්තු වෙනවා. ඊට වඩා පරණ නම්
 * (scrape එක fail වෙලා) UI එකේ අවවාදයක් පෙන්නනවා.
 */
const STALE_HOURS = Number(process.env.DATA_STALE_HOURS || 30);

/* --------------------------------------------------------------- */
/* data.json කියවීම (server.js එකේ loadData() එකට සමාන, cache සමඟ) */
/* --------------------------------------------------------------- */

let cache = { mtimeMs: 0, size: -1, value: null, hash: null };

function readData() {
  let stat;
  try {
    stat = fs.statSync(DATA_FILE);
  } catch (e) {
    return { raw: { lotteries: [] }, hash: 'empty' };
  }
  if (cache.value && cache.mtimeMs === stat.mtimeMs && cache.size === stat.size) {
    return { raw: cache.value, hash: cache.hash };
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return { raw: { lotteries: [] }, hash: 'corrupt' };
  }
  if (!parsed || !Array.isArray(parsed.lotteries)) parsed = { lotteries: [] };
  const hash = crypto.createHash('sha1')
    .update(String(stat.mtimeMs) + ':' + stat.size + ':' + (parsed.scrapedAt || ''))
    .digest('hex').slice(0, 12);
  cache = { mtimeMs: stat.mtimeMs, size: stat.size, value: parsed, hash };
  return { raw: parsed, hash };
}

/* --------------------------------------------------------------- */
/* Draw එකක් compact කිරීම — offline bundle එකේ byte ප්‍රමාණය අඩු කරන්න */
/* --------------------------------------------------------------- */

function compactDraw(d) {
  const out = {
    drawNo: String(d.drawNo == null ? '' : d.drawNo),
    date: d.date || null,
    numbers: Array.isArray(d.numbers) ? d.numbers.map(String) : [],
  };
  if (d.letter) out.letter = String(d.letter).toUpperCase();
  if (d.zodiac) out.zodiac = String(d.zodiac).toUpperCase();
  if (d.superNumber != null && d.superNumber !== '') out.superNumber = String(d.superNumber);
  // multi-game ලොතරැයි (Ada Sampatha / Suba Dawasak) — sub draw ටිකත් ඕන
  if (Array.isArray(d.subGames) && d.subGames.length) {
    out.subGames = d.subGames.map(g => {
      const s = { numbers: Array.isArray(g.numbers) ? g.numbers.map(String) : [] };
      if (g.letter) s.letter = String(g.letter).toUpperCase();
      if (g.zodiac) s.zodiac = String(g.zodiac).toUpperCase();
      if (g.superNumber != null && g.superNumber !== '') s.superNumber = String(g.superNumber);
      return s;
    });
  }
  return out;
}

/** YYYY-MM-DD (Asia/Colombo) — මාස Nකට කලින් දිනය */
function monthsAgoISO(months) {
  const now = new Date(Date.now() - months * 30.44 * 24 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

function isStale(scrapedAt) {
  if (!scrapedAt) return true;
  const t = Date.parse(scrapedAt);
  if (!Number.isFinite(t)) return true;
  return (Date.now() - t) > STALE_HOURS * 60 * 60 * 1000;
}

/* --------------------------------------------------------------- */
/* Bundle builder                                                   */
/* --------------------------------------------------------------- */

let bundleCache = { hash: null, months: null, value: null };

/**
 * Offline bundle එක හදනවා.
 * @param {number} months - කොච්චර කාලයක් ආපස්සට draws දාන්නද
 */
function buildBundle(months) {
  const m = Math.max(1, Math.min(24, Number(months) || BUNDLE_MONTHS));
  const { raw, hash } = readData();
  if (bundleCache.value && bundleCache.hash === hash && bundleCache.months === m) {
    return bundleCache.value;
  }

  const since = monthsAgoISO(m);
  let totalDraws = 0;
  let newest = null;

  const lotteries = [];
  for (const lot of raw.lotteries) {
    if (!lot || !lot.slug) continue;
    let meta = {};
    try {
      meta = describeLottery(lot) || {};
    } catch (e) {
      meta = {};
    }
    const all = Array.isArray(lot.draws) ? lot.draws : [];
    const draws = all
      .filter(d => d && d.date && String(d.date) >= since)
      .map(compactDraw);
    totalDraws += draws.length;
    for (const d of draws) if (!newest || d.date > newest) newest = d.date;

    lotteries.push({
      slug: lot.slug,
      provider: lot.provider || null,
      name: lot.name || lot.slug,
      nameSi: lot.nameSi || null,
      // 👇 offline client එකට prize engine එක තනියම run කරන්න ඕන ඒවා
      numberCount: meta.numberCount || (draws[0] ? draws[0].numbers.length : 0),
      digitWidth: meta.digitWidth || 2,
      hasLetter: !!meta.hasLetter,
      hasZodiac: !!meta.hasZodiac,
      hasSuperNumber: !!meta.hasSuperNumber,
      prizeKind: meta.prizeKind || null,
      subGames: meta.subGames || null,
      positional: typeof isPositional === 'function' ? !!isPositional(lot) : !!meta.positional,
      hasPrizeTable: hasPrizeTable(lot.slug),
      drawCount: all.length,
      draws,
    });
  }

  const value = {
    version: hash,
    generatedAt: new Date().toISOString(),
    scrapedAt: raw.scrapedAt || null,
    months: m,
    since,
    lotteries,
    totalDraws,
    newestDrawDate: newest,
  };
  bundleCache = { hash, months: m, value };
  return value;
}

/* --------------------------------------------------------------- */
/* Routes                                                          */
/* --------------------------------------------------------------- */

function registerOfflineRoutes(app) {
  /**
   * දත්ත තියෙනවද? පරණයිද? — app එකේ "gate" එකට සහ status badge එකට.
   * (සැහැල්ලු endpoint එකක් — bundle එක ගන්නේ නෑ.)
   */
  app.get('/api/data-status', (req, res) => {
    const { raw, hash } = readData();
    const lotteries = (raw.lotteries || []).filter(l => l && l.slug);
    const withDraws = lotteries.filter(l => Array.isArray(l.draws) && l.draws.length);
    const totalDraws = withDraws.reduce((n, l) => n + l.draws.length, 0);
    let newest = null;
    for (const l of withDraws) {
      const d = l.draws[0] && l.draws[0].date;
      if (d && (!newest || d > newest)) newest = d;
    }
    const scrapedAt = raw.scrapedAt || null;
    const stale = isStale(scrapedAt);

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      hasData: lotteries.length > 0 && totalDraws > 0,
      lotteries: lotteries.length,
      lotteriesWithDraws: withDraws.length,
      draws: totalDraws,
      newestDrawDate: newest,
      scrapedAt,
      stale,
      staleHours: STALE_HOURS,
      bundleVersion: hash,
      serverTime: new Date().toISOString(),
    });
  });

  /**
   * Offline cache එකට යන සම්පූර්ණ bundle එක.
   *
   * Client එක මේක එක පාරක් බාගෙන (දවසට දෙපාරක් cron එකට පස්සේ අලුත් වෙනවා)
   * localStorage එකේ තියාගන්නවා. එතකොට **internet නැතුව** වුනත්
   * — ටිකට් QR එක කියවන්න (browser jsQR, server ඕන නෑ)
   * — ඒ draw එකේ අංක cache එකෙන් ගන්න
   * — prize engine එකෙන් දිනුම ගණනය කරන්න පුළුවන්.
   */
  app.get('/api/offline-bundle', (req, res) => {
    const months = req.query.months ? Number(req.query.months) : BUNDLE_MONTHS;
    const bundle = buildBundle(months);
    const etag = 'W/"' + bundle.version + '-' + bundle.months + '"';
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=300');

    if (req.headers['if-none-match'] === etag && bundle.totalDraws > 0) {
      return res.status(304).end();
    }
    res.json(bundle);
  });

  /** Bundle එකේ ප්‍රමාණය (admin ට බලන්න පුළුවන්) */
  app.get('/api/offline-bundle/size', (req, res) => {
    const bundle = buildBundle(BUNDLE_MONTHS);
    const bytes = Buffer.byteLength(JSON.stringify(bundle), 'utf8');
    res.json({
      bytes, kb: Math.round(bytes / 1024), months: bundle.months,
      totalDraws: bundle.totalDraws, version: bundle.version,
      scrapedAt: bundle.scrapedAt, generatedAt: bundle.generatedAt,
    });
  });
}

module.exports = { registerOfflineRoutes, buildBundle, readData, compactDraw };
