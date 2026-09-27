/* ==========================================================================
 * offline.js — LK Lottery Master · Offline / PWA / Scan-Experience extras
 * ==========================================================================
 *
 * මේ file එකෙන් එකතු වෙන දේවල්:
 *
 *   1. 📴 **Offline cache** — app shell + ප්‍රතිඵල දත්ත (bundle) + API පිළිතුරු
 *   2. 🎟️ **Offline ticket check** — internet නැතුව QR scan කරලා දිනුම ගණනය
 *      (server එකේ එකම prize engine එකෙන්: `prize-engine.js`)
 *   3. 🚧 **Results-data gate** — ප්‍රතිඵල දත්ත නැත්නම් app එක භාවිතා කරන්න
 *      දෙන්නේ නෑ (දත්ත නැතුව වැරදි ප්‍රතිඵල පෙන්නන එක නරකයි)
 *   4. 🔆 **Torch (flash)** — අඳුරේ පොඩි QR එක කියවන්න
 *   5. ⏱️ **5-තත්පර ප්‍රතිඵල overlay** — ඊට පස්සේ තනියම අයින් වෙනවා,
 *      කැමරාව **නොනවත්තා** ඊළඟ ටිකට් එක scan කරන්න පුළුවන්
 *   6. 📳 **Vibration + ශබ්ද** — QR එක හඳුනාගත්තාම / දිනුමක් ඇති වුනාම
 *   7. 🔍 **QR වර්ග කිරීම** — "මේ ලොතරැයි QR එකක් නෙමෙයි" සහ
 *      "මේ draw එකේ ප්‍රතිඵල තවම නිකුත් වී නෑ" කියන පණිවිඩ
 *   8. 📄 **පහළ තොරතුරු tabs** — අප ගැන / රහස්‍යතා / මුදල් ආපසු / භාවිතය
 *
 * මේක `index.html` එකට පස්සේ load වෙනවා. index.html එකේ තියෙන
 * hooks (window.LKMExtras.*) හරහා app එකේ ඇතුළතට සම්බන්ධ වෙනවා.
 * ========================================================================== */

'use strict';

(function () {

  /* ====================================================================== */
  /* 0. Helpers                                                             */
  /* ====================================================================== */

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const LS = {
    bundle: 'lkm_offline_bundle',
    mirror: 'lkm_api_mirror',
    lastSync: 'lkm_last_sync',
    gate: 'lkm_gate_dismissed',
    sound: 'lkm_sound',
  };

  function lsGet(k, d) {
    try {
      const v = localStorage.getItem(k);
      return v == null ? d : JSON.parse(v);
    } catch (e) { return d; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) {
      // Quota පිරිලා නම් පරණ mirror එක අයින් කරලා ආයෙ try කරනවා
      try { localStorage.removeItem(LS.mirror); localStorage.setItem(k, JSON.stringify(v)); return true; }
      catch (e2) { return false; }
    }
  }
  function isOffline() { return navigator.onLine === false; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function curLang() { try { return localStorage.getItem('lkm_lang') || 'si'; } catch (e) { return 'si'; } }

  /* ====================================================================== */
  /* 1. භාෂා (සිංහල / English / தமிழ்)                                        */
  /* ====================================================================== */

  const STR = {
    'offline.badge': { si: '📴 Offline', en: '📴 Offline', ta: '📴 ஆஃப்லைன்' },
    'offline.cached': { si: 'Cache කරපු දත්ත', en: 'cached data', ta: 'சேமித்த தரவு' },
    'online.badge': { si: '🟢 Online', en: '🟢 Online', ta: '🟢 இணைப்பு' },
    'sync.last': { si: 'අවසන් යාවත්කාලීනය', en: 'Last updated', ta: 'கடைசி புதுப்பிப்பு' },
    'sync.now': { si: '🔄 දැන්ම', en: '🔄 Sync now', ta: '🔄 இப்போது' },
    'sync.done': { si: '✅ යාවත්කාලීන කළා', en: '✅ Updated', ta: '✅ புதுப்பிக்கப்பட்டது' },
    'update.ready': { si: '🔄 අලුත් version එකක් තියෙනවා — tap කරලා reload කරන්න',
      en: '🔄 New version ready — tap to reload', ta: '🔄 புதிய பதிப்பு தயார் — தட்டவும்' },

    'gate.title': { si: '📛 ප්‍රතිඵල දත්ත තවම ලැබිලා නෑ',
      en: '📛 Results data not available yet', ta: '📛 முடிவுத் தரவு இன்னும் இல்லை' },
    'gate.body': {
      si: 'මේ app එක වැඩ කරන්නේ නිල ප්‍රතිඵල දත්ත මතයි. දත්ත නැතුව භාවිතා කරන්න දෙනවා නම් ' +
          'වැරදි ප්‍රතිඵල පෙන්නන්න පුළුවන් — ඒක ඔබට හානියක්. දත්ත ලැබුනාම app එක තනියම විවෘත වෙනවා.',
      en: 'This app works on official results data. Without data it could show wrong results, ' +
          'which would harm you — so usage is paused until data arrives. It will unlock automatically.',
      ta: 'இந்த செயலி அதிகாரப்பூர்வ முடிவுத் தரவை சார்ந்தது. தரவு இல்லாமல் தவறான முடிவுகள் வரலாம் — ' +
          'எனவே தரவு வரும் வரை பயன்பாடு நிறுத்தப்பட்டுள்ளது. தானாக திறக்கும்.'
    },
    'gate.retry': { si: '🔄 නැවත උත්සාහ කරන්න', en: '🔄 Try again', ta: '🔄 மீண்டும் முயற்சி' },
    'gate.fetch': { si: '⬇️ දැන්ම ප්‍රතිඵල ලබාගන්න (Admin)', en: '⬇️ Fetch results now (Admin)',
      ta: '⬇️ முடிவுகளை இப்போது பெறு (Admin)' },
    'gate.wait': { si: '⏳ දත්ත ලබාගනිමින්…', en: '⏳ Fetching results…', ta: '⏳ பெறுகிறது…' },
    'gate.hint': { si: 'දත්ත දිනකට දෙපාරක් (09:30 සහ 21:30) ස්වයංක්‍රීයව යාවත්කාලීන වෙනවා.',
      en: 'Data refreshes automatically twice a day (09:30 and 21:30 Asia/Colombo).',
      ta: 'தரவு நாளுக்கு இருமுறை தானாக புதுப்பிக்கப்படும்.' },

    'qr.notLottery': { si: '❌ මේ ලොතරැයි QR එකක් නෙමෙයි',
      en: '❌ This is not a lottery QR code', ta: '❌ இது லாட்டரி QR இல்லை' },
    'qr.notLotteryBody': {
      si: 'මේ QR එකේ ලොතරැයි ටිකට් එකකට අදාළ තොරතුරු නෑ (ලොතරැයියක නම, draw අංකය හෝ ටිකට් අංක නෑ). ' +
          'කරුණාකර <strong>නිල ලොතරැයි ටිකට් එකේ QR එක</strong> scan කරන්න.',
      en: 'This QR does not contain lottery ticket data (no lottery name, draw number or ticket numbers). ' +
          'Please scan the QR printed on an official lottery ticket.',
      ta: 'இந்த QR இல் லாட்டரி டிக்கெட் தகவல் இல்லை. அதிகாரப்பூர்வ டிக்கெட்டின் QR ஐ ஸ்கேன் செய்யவும்.'
    },
    'qr.future': { si: '⏳ මේ draw එකේ ප්‍රතිඵල තවම නිකුත් වී නෑ',
      en: '⏳ Results for this draw are not released yet', ta: '⏳ இந்த டிராவின் முடிவுகள் இன்னும் வெளியாகவில்லை' },
    'qr.futureBody': {
      si: 'ඔබ scan කරපු ටිකට් එකේ draw අංකය <strong>%(draw)s</strong> — ඒත් අපේ ළඟ තියෙන අලුත්ම ' +
          'නිල draw එක <strong>%(latest)s</strong>. Draw එක පවත්වලා ප්‍රතිඵල නිකුත් වුනාට පස්සේ ' +
          '(සාමාන්‍යයෙන් එදා රෑ 9:30ට පස්සේ) ආයෙ scan කරන්න.',
      en: 'Your ticket is for draw <strong>%(draw)s</strong>, but the latest official draw we have is ' +
          '<strong>%(latest)s</strong>. Please scan again after the results are released ' +
          '(usually after 9:30 PM on draw day).',
      ta: 'உங்கள் டிக்கெட் டிரா <strong>%(draw)s</strong>, ஆனால் எங்களிடம் உள்ள சமீபத்திய ' +
          'டிரா <strong>%(latest)s</strong>. முடிவுகள் வெளியான பிறகு மீண்டும் ஸ்கேன் செய்யவும்.'
    },
    'qr.futureTry': { si: '🎟️ දැනට තියෙන අලුත්ම ප්‍රතිඵලය බලන්න', en: '🎟️ See the latest results',
      ta: '🎟️ சமீபத்திய முடிவுகளைப் பார்' },
    'qr.howScan': { si: 'ℹ️ නිවැරදිව scan කරන විදිය බලන්න', en: 'ℹ️ How to scan correctly',
      ta: 'ℹ️ சரியாக ஸ்கேன் செய்வது எப்படி' },

    'res.title': { si: 'ප්‍රතිඵලය', en: 'Result', ta: 'முடிவு' },
    'res.won': { si: '🎉 ඔබ දිනලා!', en: '🎉 You won!', ta: '🎉 நீங்கள் வென்றீர்கள்!' },
    'res.lost': { si: '😔 මේ වාරයේ නෑ — ආයෙ try කරන්න', en: '😔 No win this time — try again',
      ta: '😔 இந்த முறை இல்லை — மீண்டும் முயற்சிக்கவும்' },
    'res.unknown': { si: '❓ මේක check කරන්න බෑ', en: '❓ Cannot check', ta: '❓ சரிபார்க்க முடியாது' },
    'res.closingIn': { si: 'තත්පර %(s) කින් අයින් වෙනවා', en: 'closing in %(s)s',
      ta: '%(s) வினாடிகளில் மூடும்' },
    'res.nextHint': { si: '📷 ඊළඟ ටිකට් එක දැන්ම scan කරන්න — කැමරාව සූදානම්',
      en: '📷 Scan the next ticket now — camera is ready', ta: '📷 அடுத்த டிக்கெட்டை இப்போது ஸ்கேன் செய்யவும்' },
    'res.offline': { si: '📴 Offline — cache කරපු ප්‍රතිඵලවලින් ගණනය කළා',
      en: '📴 Offline — calculated from cached results', ta: '📴 ஆஃப்லைன் — சேமித்த தரவிலிருந்து' },
    'res.keepOn': { si: '⏸️ අයින් කරන්න', en: '⏸️ Dismiss', ta: '⏸️ நீக்கு' },

    'torch.on': { si: '🔆 කැමරා එළි', en: '🔆 Torch', ta: '🔆 டார்ச்' },

    'info.quick': { si: '📄 තොරතුරු සහ නීතිමය', en: '📄 Info & legal', ta: '📄 தகவல் & சட்டம்' },
  };

  function T(key, vars) {
    const row = STR[key];
    let s = row ? (row[curLang()] || row.si || row.en) : key;
    if (vars) for (const k in vars) s = s.replace(new RegExp('%\\(' + k + '\\)', 'g'), String(vars[k]));
    return s;
  }

  // App එකේ i18n dictionary එකටත් එකතු කරනවා (data-i18n attributes වලට)
  try {
    if (typeof I18N === 'object' && I18N) {
      Object.keys(STR).forEach(k => {
        if (!I18N['x.' + k]) I18N['x.' + k] = STR[k];
      });
    }
  } catch (e) { /* ignore */ }

  /* ====================================================================== */
  /* 2. CSS (inject)                                                        */
  /* ====================================================================== */

  const CSS = `
  .lkmBar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0 4px;
    padding:8px 10px;border-radius:12px;background:#141d28;border:1px solid #24313f;
    font-size:12.5px;color:#9fb0c5}
  .lkmBar .pill{padding:3px 9px;border-radius:999px;font-weight:700;background:#1d2a38;border:1px solid #2c3b4c}
  .lkmBar .pill.off{background:rgba(255,120,120,.14);border-color:rgba(255,120,120,.4);color:#ffb3b3}
  .lkmBar .pill.on{background:rgba(120,255,170,.12);border-color:rgba(120,255,170,.34);color:#a6f0c6}
  .lkmBar .pill.warn{background:rgba(241,196,15,.14);border-color:rgba(241,196,15,.4);color:#ffdf7e}
  .lkmBar button{margin-left:auto;padding:5px 10px;border-radius:9px;border:1px solid #2c3b4c;
    background:#1d2a38;color:#dbe7f5;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}

  .lkmUpdate{position:fixed;left:12px;right:12px;bottom:12px;z-index:9998;display:flex;gap:10px;
    align-items:center;padding:12px 14px;border-radius:14px;background:linear-gradient(135deg,#f1c40f,#ffd75e);
    color:#10161f;font-weight:800;box-shadow:0 10px 30px rgba(0,0,0,.4);cursor:pointer}
  .lkmUpdate button{margin-left:auto;border:0;background:#10161f;color:#ffd75e;border-radius:10px;
    padding:7px 12px;font:inherit;font-weight:800;cursor:pointer}

  .lkmGate{position:fixed;inset:0;z-index:9999;background:rgba(8,12,18,.96);
    display:flex;align-items:center;justify-content:center;padding:22px;overflow:auto}
  .lkmGate .box{max-width:460px;width:100%;text-align:center;color:#e8eef7}
  .lkmGate .ico{font-size:52px}
  .lkmGate h2{margin:12px 0 8px;font-size:20px}
  .lkmGate p{color:#9fb0c5;font-size:14px;line-height:1.7;margin:8px 0}
  .lkmGate button{width:100%;margin-top:12px;padding:14px;border:0;border-radius:12px;font:inherit;
    font-weight:800;cursor:pointer;background:linear-gradient(135deg,#f1c40f,#ffd75e);color:#10161f}
  .lkmGate button.sec{background:#1d2a38;color:#dbe7f5;border:1px solid #2c3b4c}
  .lkmGate .hint{font-size:12.5px;color:#7b8ca3;margin-top:14px}

  .lkmToast{position:fixed;left:10px;right:10px;bottom:10px;z-index:9997;max-width:520px;margin:0 auto;
    border-radius:16px;overflow:hidden;box-shadow:0 16px 44px rgba(0,0,0,.55);
    background:#141d28;border:1px solid #2c3b4c;animation:lkmUp .22s ease-out}
  @keyframes lkmUp{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
  .lkmToast .hd{display:flex;align-items:center;gap:8px;padding:12px 14px;font-weight:800;font-size:15px}
  .lkmToast.won .hd{background:linear-gradient(135deg,rgba(120,255,170,.18),rgba(120,255,170,.05));color:#a6f0c6}
  .lkmToast.lost .hd{background:linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,255,255,.02));color:#cbd8e8}
  .lkmToast.unknown .hd{background:linear-gradient(135deg,rgba(241,196,15,.16),rgba(241,196,15,.04));color:#ffdf7e}
  .lkmToast .bd{padding:11px 14px 13px;color:#dbe7f5;font-size:13.5px;line-height:1.6}
  .lkmToast .amt{font-size:22px;font-weight:900;color:#ffd75e;margin:2px 0 4px}
  .lkmToast .row{display:flex;align-items:center;gap:8px;color:#9fb0c5;font-size:12.5px}
  .lkmToast .bar{height:4px;background:#22303f;margin-top:11px;border-radius:999px;overflow:hidden}
  .lkmToast .bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#f1c40f,#ffd75e);
    transition:width 1s linear}
  .lkmToast .close{position:absolute;right:8px;top:8px;border:0;background:transparent;color:#9fb0c5;
    font-size:18px;cursor:pointer;padding:4px 8px}
  .lkmToast .nums{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
  .lkmToast .nums span{padding:4px 9px;border-radius:8px;background:#1d2a38;border:1px solid #2c3b4c;
    font-weight:800;font-size:13px}
  .lkmToast .nums span.hit{background:rgba(120,255,170,.16);border-color:rgba(120,255,170,.45);color:#a6f0c6}

  .lkmInfoBar{display:flex;gap:8px;overflow-x:auto;padding:10px 0 2px}
  .lkmInfoBar button{flex:0 0 auto;padding:9px 12px;border-radius:11px;border:1px solid #2c3b4c;
    background:#141d28;color:#cbd8e8;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
  .lkmInfoBar button:active{transform:translateY(1px)}
  `;

  function injectCss() {
    const s = document.createElement('style');
    s.id = 'lkmExtrasCss';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ====================================================================== */
  /* 3. Status bar (online/offline + අවසන් යාවත්කාලීනය)                        */
  /* ====================================================================== */

  let barEl = null;

  function fmtStamp(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function renderBar() {
    if (!barEl) return;
    const offline = isOffline();
    const b = getBundle();
    const last = lsGet(LS.lastSync, null) || (b && b.scrapedAt ? Date.parse(b.scrapedAt) : null);
    barEl.innerHTML =
      '<span class="pill ' + (offline ? 'off' : 'on') + '">' + T(offline ? 'offline.badge' : 'online.badge') + '</span>' +
      (offline ? '<span class="pill warn">' + T('offline.cached') + '</span>' : '') +
      '<span>' + T('sync.last') + ': <strong>' + esc(fmtStamp(last)) + '</strong></span>' +
      '<button type="button" id="lkmSyncBtn">' + T('sync.now') + '</button>';
    const btn = $('#lkmSyncBtn', barEl);
    if (btn) btn.addEventListener('click', () => syncBundle(true).then(() => {
      btn.textContent = T('sync.done');
      setTimeout(renderBar, 1400);
    }));
  }

  function injectBar() {
    const tabs = $('#tabs');
    if (!tabs) return;
    barEl = document.createElement('div');
    barEl.className = 'lkmBar';
    barEl.id = 'lkmStatusBar';
    tabs.insertAdjacentElement('afterend', barEl);
    renderBar();
  }

  /* ====================================================================== */
  /* 4. Offline bundle (draws cache)                                        */
  /* ====================================================================== */

  function getBundle() { return lsGet(LS.bundle, null); }

  function bundleFresh() {
    const b = getBundle();
    if (!b) return false;
    const t = Date.parse(b.generatedAt || '');
    if (!Number.isFinite(t)) return false;
    return (Date.now() - t) < 12 * 60 * 60 * 1000;   // පැය 12ක් වලංගු
  }

  async function syncBundle(force) {
    if (isOffline()) return false;
    if (!force && bundleFresh()) return true;
    try {
      const res = await fetch('/api/offline-bundle', { cache: 'no-store' });
      if (!res.ok) return false;
      const b = await res.json();
      if (!b || !Array.isArray(b.lotteries)) return false;
      const ok = lsSet(LS.bundle, b);
      lsSet(LS.lastSync, Date.now());
      renderBar();
      // Service worker එකෙනුත් cache කරන්න කියනවා
      try {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'PREFETCH_BUNDLE' });
        }
      } catch (e) {}
      return ok;
    } catch (e) {
      return false;
    }
  }

  function bundleHasDraws() {
    const b = getBundle();
    return !!(b && Array.isArray(b.lotteries) && b.lotteries.some(l => l.draws && l.draws.length));
  }

  /* ====================================================================== */
  /* 5. Offline API — bundle එකෙන් server පිළිතුරු ප්‍රතිනිර්මාණය කිරීම            */
  /* ====================================================================== */

  function bundleToLotteries(b) {
    return (b.lotteries || []).map(l => {
      const d0 = (l.draws && l.draws[0]) || null;
      return {
        provider: l.provider, slug: l.slug, name: l.name, nameSi: l.nameSi,
        hasLetter: !!l.hasLetter, hasZodiac: !!l.hasZodiac, hasSuperNumber: !!l.hasSuperNumber,
        numberCount: l.numberCount, digitWidth: l.digitWidth,
        latestDraw: d0 ? String(d0.drawNo) : null, latestDate: d0 ? d0.date : null,
        drawCount: l.drawCount || (l.draws ? l.draws.length : 0),
        hasPrizeTable: !!l.hasPrizeTable, prizeKind: l.prizeKind || null,
        positional: !!l.positional, subGames: l.subGames || null,
      };
    });
  }

  /** GET path එකක් bundle එකෙන් උත්තර දෙන්න පුළුවන් නම් ඒ පිළිතුර */
  function serveFromBundle(path) {
    const b = getBundle();
    if (!b || !Array.isArray(b.lotteries)) return null;
    const url = new URL(path, location.origin);
    const p = url.pathname;
    const scrapedAt = b.scrapedAt || null;

    if (p === '/api/lotteries') {
      return { scrapedAt, lotteries: bundleToLotteries(b), offline: true };
    }

    if (p === '/api/latest') {
      const results = [];
      for (const l of b.lotteries) {
        const d = (l.draws || [])[0];
        if (!d) continue;
        results.push(Object.assign({
          provider: l.provider, slug: l.slug, name: l.name, nameSi: l.nameSi || null,
        }, {
          drawNo: String(d.drawNo), date: d.date,
          letter: d.letter || null, zodiac: d.zodiac || null,
          superNumber: d.superNumber != null ? d.superNumber : null,
          numbers: d.numbers || [],
        }));
      }
      return { scrapedAt, results, offline: true };
    }

    if (p === '/api/results-by-date') {
      const date = url.searchParams.get('date') || '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
      const results = [];
      for (const l of b.lotteries) {
        const d = (l.draws || []).find(x => x.date === date);
        if (!d) continue;
        results.push({
          slug: l.slug, provider: l.provider, name: l.name, nameSi: l.nameSi || null,
          hasLetter: !!l.hasLetter, hasZodiac: !!l.hasZodiac, hasSuperNumber: !!l.hasSuperNumber,
          numberCount: l.numberCount, digitWidth: l.digitWidth,
          drawNo: String(d.drawNo), date: d.date,
          letter: d.letter || null, zodiac: d.zodiac || null,
          superNumber: d.superNumber != null ? d.superNumber : null, numbers: d.numbers || [],
        });
      }
      return { date, count: results.length, total: b.lotteries.length, results, offline: true };
    }

    if (p.startsWith('/api/draws/')) {
      const slug = decodeURIComponent(p.slice('/api/draws/'.length));
      const l = b.lotteries.find(x => x.slug === slug);
      if (!l) return null;
      const wantDate = url.searchParams.get('date');
      const lot = { slug: l.slug, name: l.name, nameSi: l.nameSi || null, provider: l.provider };
      if (wantDate) {
        const d = (l.draws || []).find(x => x.date === wantDate);
        return { lottery: lot, date: wantDate, draw: d || null, totalDraws: (l.draws || []).length, offline: true };
      }
      const limit = clamp(Number(url.searchParams.get('limit') || 90), 1, 400);
      const draws = l.draws || [];
      return {
        lottery: lot, numberCount: l.numberCount,
        dateFrom: draws.length ? draws[draws.length - 1].date : null,
        dateTo: draws.length ? draws[0].date : null,
        totalDraws: draws.length,
        draws: draws.slice(0, limit).map(d => ({ drawNo: String(d.drawNo), date: d.date })),
        offline: true,
      };
    }

    if (p.startsWith('/api/results/')) {
      const slug = decodeURIComponent(p.slice('/api/results/'.length));
      const l = b.lotteries.find(x => x.slug === slug);
      if (!l) return null;
      return {
        provider: l.provider, slug: l.slug, name: l.name, nameSi: l.nameSi || null,
        draws: (l.draws || []).map(d => Object.assign({ drawNo: String(d.drawNo) }, d)),
        scrapedAt, offline: true,
      };
    }

    return null;
  }

  /* ====================================================================== */
  /* 6. Offline ticket check (prize-engine.js)                              */
  /* ====================================================================== */

  function offlineCheck(body) {
    const b = getBundle();
    const P = window.LKMPrizes;
    if (!b || !P) return { error: 'offline_no_bundle', status: 503 };
    const lot = (b.lotteries || []).find(l => l.slug === body.slug);
    if (!lot) return { error: 'Lottery හම්බුනේ නෑ', status: 404 };

    let draw = null;
    if (body.drawNo) draw = (lot.draws || []).find(d => String(d.drawNo) === String(body.drawNo));
    else if (body.date) draw = (lot.draws || []).find(d => d.date === body.date);
    else draw = (lot.draws || [])[0];

    if (!draw) {
      return {
        error: 'Draw ' + body.drawNo + ' cache එකේ නෑ (offline)',
        status: 404, offlineNoDraw: true,
      };
    }

    const opts = Number.isInteger(body.subGameIndex) ? { subGameIndex: body.subGameIndex } : undefined;
    const ticket = {
      letter: body.letter || null,
      zodiac: body.zodiac || null,
      superNumber: body.superNumber != null ? body.superNumber : null,
      numbers: (body.numbers || []).map(String),
    };
    let result;
    try {
      result = P.evaluatePrize(lot.slug, draw, ticket, opts);
    } catch (e) {
      return { error: 'Offline ගණනය කිරීමේ දෝෂයක්: ' + e.message, status: 500 };
    }

    const view = (opts && draw.subGames && draw.subGames[opts.subGameIndex])
      ? draw.subGames[opts.subGameIndex] : draw;

    return {
      lottery: { provider: lot.provider, slug: lot.slug, name: lot.name },
      draw: {
        drawNo: String(draw.drawNo), date: draw.date,
        letter: view.letter || null, zodiac: view.zodiac || null,
        superNumber: view.superNumber != null ? view.superNumber : null,
        numbers: view.numbers || [],
      },
      ticket,
      engine: 'offline-prize-table',
      offline: true,
      cachedAt: b.scrapedAt || null,
      ...result,
      disclaimer: '📴 Offline: cache කරපු ප්‍රතිඵලවලින් ගණනය කළ ප්‍රතිඵලයකි. ' +
        'නිල ප්‍රතිඵලය නොවේ — NLB/DLB නිල වෙබ් අඩවියෙන් තහවුරු කරගන්න.',
    };
  }

  function friendlyOfflineError(path) {
    const e = new Error('📴 ඔබ දැන් offline. ' + (path.indexOf('/api/check') === 0
      ? 'මේ draw එකේ ප්‍රතිඵල cache එකේ නෑ — අලුත්ම ප්‍රතිඵලය පෙන්නන්න පුළුවන්.'
      : 'මේ තොරතුරු cache කරලා නෑ — app එක එක් වරක් internet සමඟ open කරන්න.'));
    e.offline = true;
    e.status = 0;
    return e;
  }

  /**
   * index.html එකේ `api()` එකෙන් කැඳවනු ලබන hook එක.
   * Offline එකේදී fetch එකක් නොකර cache/bundle එකෙන් උත්තර දෙනවා.
   * (උත්තර දෙන්න බැරි නම් `null` — එතකොට සාමාන්‍ය path එක තමයි.)
   */
  function routeOffline(path, o) {
    const method = String((o && o.method) || 'GET').toUpperCase();
    if (!isOffline()) return null;

    if (method === 'GET') {
      const b = serveFromBundle(path);
      if (b) return Promise.resolve(b);
      const m = mirrorGet(path);
      if (m !== undefined) return Promise.resolve(m);
      return null;
    }

    if (method === 'POST' && /\/api\/check$/.test(path)) {
      let body;
      try { body = JSON.parse((o && o.body) || '{}'); } catch (e) { return null; }
      const r = offlineCheck(body);
      if (r && r.error && r.status !== 404) return null;
      if (r && r.error) return Promise.reject(Object.assign(new Error(r.error), { status: r.status, offline: true }));
      return Promise.resolve(r);
    }

    return null;
  }

  /** fetch එකම fail වුනාම (offline detect වුනේ නැති වෙලාවට) — දෙවෙනි උපාය */
  async function networkFailed(path, o, err) {
    const method = String((o && o.method) || 'GET').toUpperCase();

    if (method === 'GET') {
      const b = serveFromBundle(path);
      if (b) { markOfflineUi(); return b; }
      const m = mirrorGet(path);
      if (m !== undefined) { markOfflineUi(); return m; }
      throw friendlyOfflineError(path);
    }

    if (method === 'POST' && /\/api\/check$/.test(path)) {
      let body;
      try { body = JSON.parse((o && o.body) || '{}'); } catch (e) { throw err; }
      const r = offlineCheck(body);
      if (r && r.error && r.status === 404) {
        throw Object.assign(new Error(r.error), { status: 404, offline: true });
      }
      if (r && r.error) throw friendlyOfflineError(path);
      markOfflineUi();
      return r;
    }

    throw err;
  }

  /* ====================================================================== */
  /* 7. API mirror (cache) — GET පිළිතුරු                                            */
  /* ====================================================================== */

  const MIRROR_MAX = 60;

  function mirrorGet(path) {
    const m = lsGet(LS.mirror, {});
    const row = m[path];
    return row ? row.data : undefined;
  }

  function remember(path, data) {
    try {
      const method = 'GET';
      if (!/^\/api\//.test(path)) return;
      const json = JSON.stringify(data);
      if (json.length > 400000) return;                 // ලොකු payload (bundle) වෙනම
      const m = lsGet(LS.mirror, {});
      m[path] = { t: Date.now(), data };
      const keys = Object.keys(m).sort((a, b) => (m[b].t || 0) - (m[a].t || 0));
      keys.slice(MIRROR_MAX).forEach(k => delete m[k]);
      lsSet(LS.mirror, m);
      lsSet(LS.lastSync, Date.now());
      renderBar();
    } catch (e) { /* ignore */ }
  }

  /* ====================================================================== */
  /* 8. Service worker                                                      */
  /* ====================================================================== */

  let waitingWorker = null;

  function showUpdateBar() {
    if ($('#lkmUpdateBar')) return;
    const bar = document.createElement('div');
    bar.className = 'lkmUpdate';
    bar.id = 'lkmUpdateBar';
    bar.innerHTML = '<span>' + T('update.ready') + '</span><button type="button">Reload</button>';
    bar.addEventListener('click', () => {
      if (waitingWorker) waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setTimeout(() => location.reload(), 400);
    });
    document.body.appendChild(bar);
  }

  function registerSw() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      // http:// (LAN IP) වල service worker වැඩ කරන්නේ නෑ — app එක එහෙමත් වැඩ කරනවා,
      // offline cache එක විතරයි නැති වෙන්නේ.
      return;
    }
    navigator.serviceWorker.register('/sw.js').then(reg => {
      if (reg.waiting) { waitingWorker = reg.waiting; showUpdateBar(); }
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            waitingWorker = sw;
            showUpdateBar();
          }
        });
      });
    }).catch(() => { /* Service worker නැතුවත් app එක වැඩ කරනවා */ });
  }

  /* ====================================================================== */
  /* 9. Data gate — ප්‍රතිඵල දත්ත නැත්නම් app එක භාවිතා කරන්න දෙන්නේ නෑ             */
  /* ====================================================================== */

  let gateEl = null;
  let gateTimer = null;
  let gateChecks = 0;

  function isAdmin() {
    try {
      const s = window.__lkm && window.__lkm.state ? window.__lkm.state() : null;
      return !!(s && s.user && s.user.isAdmin);
    } catch (e) { return false; }
  }

  function showGate(status) {
    if (gateEl) return;
    gateEl = document.createElement('div');
    gateEl.className = 'lkmGate';
    gateEl.id = 'lkmDataGate';
    gateEl.innerHTML =
      '<div class="box">' +
        '<div class="ico">📛</div>' +
        '<h2>' + T('gate.title') + '</h2>' +
        '<p>' + T('gate.body') + '</p>' +
        (status ? '<p>' + T('sync.last') + ': <strong>' + esc(fmtStamp(status.scrapedAt ? Date.parse(status.scrapedAt) : null)) + '</strong></p>' : '') +
        '<button type="button" id="lkmGateRetry">' + T('gate.retry') + '</button>' +
        (isAdmin() ? '<button type="button" class="sec" id="lkmGateFetch">' + T('gate.fetch') + '</button>' : '') +
        '<div class="hint">' + T('gate.hint') + '</div>' +
      '</div>';
    document.body.appendChild(gateEl);
    document.body.style.overflow = 'hidden';
    disableScan(true);

    $('#lkmGateRetry', gateEl).addEventListener('click', () => checkGate(true));
    const fetchBtn = $('#lkmGateFetch', gateEl);
    if (fetchBtn) fetchBtn.addEventListener('click', async () => {
      fetchBtn.disabled = true;
      fetchBtn.textContent = T('gate.wait');
      try {
        const token = localStorage.getItem('lkm_token');
        await fetch('/api/admin/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (token || '') },
        });
      } catch (e) {}
      setTimeout(() => checkGate(true), 2500);
    });

    // තනියම නැවත පරීක්ෂා කරනවා (තත්පර 40කට වරක්)
    clearInterval(gateTimer);
    gateTimer = setInterval(() => checkGate(false), 40000);
  }

  function hideGate() {
    if (gateEl) { gateEl.remove(); gateEl = null; }
    document.body.style.overflow = '';
    disableScan(false);
    clearInterval(gateTimer);
    gateTimer = null;
  }

  function disableScan(off) {
    ['#camStartBtn', '#nativeCamBtn', '#galleryBtn', '#shotBtn'].forEach(sel => {
      const b = $(sel);
      if (b) {
        b.disabled = !!off;
        b.style.opacity = off ? '0.45' : '';
        b.style.pointerEvents = off ? 'none' : '';
      }
    });
  }

  async function checkGate(manual) {
    if (bundleHasDraws()) { hideGate(); return true; }
    if (isOffline()) {
      // Offline + cache නෑ → gate එක පෙන්නනවා (තනියම online ආවම නැවත බලනවා)
      showGate(null);
      return false;
    }
    let status = null;
    try {
      const res = await fetch('/api/data-status', { cache: 'no-store' });
      if (res.ok) status = await res.json();
    } catch (e) { return false; }

    if (status && status.hasData) {
      hideGate();
      if (manual) syncBundle(true);
      else scheduleBundleSync();
      return true;
    }
    gateChecks++;
    showGate(status);
    return false;
  }

  /* ====================================================================== */
  /* 10. Bundle sync scheduler                                              */
  /* ====================================================================== */

  let firstSyncTimer = null;

  function scheduleBundleSync() {
    if (firstSyncTimer) return;
    const run = () => { if (!isOffline()) syncBundle(false); };
    firstSyncTimer = setTimeout(run, 1500);              // load එකට බාධා නොකරන්න
  }

  function markOfflineUi() { renderBar(); }

  /* ====================================================================== */
  /* 11. 🔆 Torch (කැමරා එළි) — අඳුරේ පොඩි QR එක කියවන්න                       */
  /* ====================================================================== */

  let torchTrack = null;
  let torchOn = false;

  async function setupTorch() {
    const adv = $('#advBox .advbody');
    const video = $('#cam');
    if (!adv || !video) return;
    if ($('#lkmTorchBtn')) {
      // camera එක restart වුනා නම් button එක අලුත් track එකට bind කරන්න ඕන
      const t = video.srcObject && video.srcObject.getVideoTracks
        ? video.srcObject.getVideoTracks()[0] : null;
      if (t && t === torchTrack) return;
      $('#lkmTorchBtn').remove();
      torchOn = false;
    }
    const track = video.srcObject && video.srcObject.getVideoTracks
      ? video.srcObject.getVideoTracks()[0] : null;
    if (!track || typeof track.getCapabilities !== 'function') return;

    let caps = null;
    try { caps = track.getCapabilities(); } catch (e) { return; }
    if (!caps || !caps.torch) return;      // මේ device/camera එකේ torch නෑ

    torchTrack = track;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.id = 'lkmTorchBtn';
    btn.style.marginBottom = '10px';
    btn.textContent = T('torch.on') + ': OFF';
    adv.insertBefore(btn, adv.firstChild);

    btn.addEventListener('click', async () => {
      torchOn = !torchOn;
      try {
        await torchTrack.applyConstraints({ advanced: [{ torch: torchOn }] });
      } catch (e) {
        torchOn = false;
      }
      btn.textContent = T('torch.on') + ': ' + (torchOn ? 'ON' : 'OFF');
      btn.classList.toggle('sec', torchOn);
    });
  }

  // Camera එක open වුනාම / restart වුනාම torch button එක සූදානම් කරනවා
  setInterval(() => {
    const wrap = $('#camWrap');
    if (wrap && wrap.style.display !== 'none') setupTorch();
  }, 1200);

  /* ====================================================================== */
  /* 12. 📳 Vibration · ⏱️ 5-තත්පර ප්‍රතිඵල overlay                              */
  /* ====================================================================== */

  const OVERLAY_SEC = 5;

  let qrArmedAt = 0;
  let overlayToken = 0;
  let overlayTick = null;

  function vibrate(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* iOS: නෑ */ }
  }

  /** QR එක හඳුනාගත්තාම overlay එක "arm" කරනවා (ප්‍රතිඵලය එනකම්) */
  function onQrHit() {
    qrArmedAt = Date.now();
    vibrate([45, 30, 45]);          // QR එක කියෙව්වා කියලා දන්වනවා
  }

  /** index.html එකේ renderResult() එකෙන් පස්සේ කැඳවනවා */
  function onResult(d, opts) {
    if (!qrArmedAt) return;
    if (Date.now() - qrArmedAt > 30000) { qrArmedAt = 0; return; }
    qrArmedAt = 0;
    showResultOverlay(d, opts);
  }

  function fmtRs(n) {
    const v = Number(n || 0);
    if (!v) return null;
    try { return 'Rs. ' + v.toLocaleString('en-LK'); } catch (e) { return 'Rs. ' + v; }
  }

  function numsRow(official, mine) {
    const mineSet = (mine || []).map(String);
    return (official || []).map(n =>
      '<span class="' + (mineSet.indexOf(String(n)) >= 0 ? 'hit' : '') + '">' + esc(n) + '</span>'
    ).join('');
  }

  function showResultOverlay(d, opts) {
    removeOverlay();
    const token = ++overlayToken;

    const unknown = d.unavailable === true;
    const kind = unknown ? 'unknown' : (d.won ? 'won' : 'lost');
    const verdict = unknown ? T('res.unknown') : d.won ? T('res.won') : T('res.lost');
    const label = d.prizeLabel || d.tier || null;
    const amount = d.won ? (d.prizeAmountFormatted || fmtRs(d.prizeAmountRs)) : null;
    const official = (d.draw && d.draw.numbers) || [];
    const mine = (d.ticket && d.ticket.numbers) || [];

    const t = document.createElement('div');
    t.className = 'lkmToast ' + kind;
    t.id = 'lkmToast';
    t.innerHTML =
      '<button class="close" type="button" aria-label="close">✕</button>' +
      '<div class="hd">' + verdict + (label ? ' · ' + esc(label) : '') + '</div>' +
      '<div class="bd">' +
        (amount ? '<div class="amt">' + esc(amount) + '</div>' : '') +
        (d.nonCash ? '<div class="amt" style="font-size:16px">' + esc(d.nonCash) + '</div>' : '') +
        '<div class="row">' +
          '<span>' + esc((d.lottery && (d.lottery.name || d.lottery.slug)) || '') + '</span>' +
          (d.draw ? '<span>· Draw ' + esc(d.draw.drawNo) + '</span><span>· ' + esc(d.draw.date) + '</span>' : '') +
        '</div>' +
        (official.length ? '<div class="nums">' + numsRow(official, mine) + '</div>' : '') +
        (d.offline ? '<div class="row" style="margin-top:9px">' + T('res.offline') + '</div>' : '') +
        (d.note ? '<div class="row" style="margin-top:8px">📌 ' + esc(d.note) + '</div>' : '') +
        '<div class="row" style="margin-top:9px">📷 ' + T('res.nextHint') + '</div>' +
        '<div class="row count" style="margin-top:6px">' + T('res.closingIn', { s: OVERLAY_SEC }) + '</div>' +
        '<div class="bar"><i style="width:100%"></i></div>' +
      '</div>';

    document.body.appendChild(t);

    $('.close', t).addEventListener('click', () => { removeOverlay(); resumeScan(); });

    // 📳 දිනුමක් නම් වෙනම pattern එකක්
    if (d.won) vibrate([70, 45, 70, 45, 180]);
    else if (!unknown) vibrate([40]);

    let left = OVERLAY_SEC;
    const lbl = $('.count', t);
    const bar = $('.bar i', t);
    overlayTick = setInterval(() => {
      if (token !== overlayToken) return;
      left--;
      if (lbl) lbl.textContent = T('res.closingIn', { s: Math.max(0, left) });
      if (bar) bar.style.width = Math.max(0, (left / OVERLAY_SEC) * 100) + '%';
      if (left <= 0) { removeOverlay(); resumeScan(); }
    }, 1000);
  }

  function removeOverlay() {
    if (overlayTick) { clearInterval(overlayTick); overlayTick = null; }
    const t = $('#lkmToast');
    if (t) t.remove();
  }

  /**
   * ⏱️ Overlay එක අයින් වුනාට පස්සේ **කැමරාව නොනවත්තා** ආයෙ QR loop එක
   * පටන් ගන්නවා — එතකොට user ට ඊළඟ ටිකට් එක එවලේම scan කරන්න පුළුවන්.
   */
  function resumeScan() {
    try {
      const st = (window.__lkm && window.__lkm.state) ? window.__lkm.state() : null;
      if (!st || !st.camStream) return;                     // කැමරාව වැහිලා නම් නවත්තනවා
      if (st.scanMode !== 'qr') return;                     // AI (total) mode එකේ manual
      if (typeof window.__lkm.startQrLoop === 'function') {
        window.__lkm.startQrLoop();
        const host = document.getElementById('scanStatus');
        if (host) {
          host.innerHTML = '<div class="msg info">📷 <strong>' + T('res.nextHint') + '</strong></div>';
        }
      }
    } catch (e) { /* ignore */ }
  }

  /* ====================================================================== */
  /* 13. 🔍 QR වර්ග කිරීම — "ලොතරැයි QR එකක් නෙමෙයි" / "ප්‍රතිඵල තවම නෑ"            */
  /* ====================================================================== */

  const LOTTERY_MARKER = /MAHAJ|GOVI|SASIRI|KOTIPATH|KAPRUKA|HANDAHANA|LAGNA|SHANIDA|SUPER\s?BALL|DHANA|JAYA\s?SAMPATH|SUPIRI|ADA\s?SAMPATH|LOTTERY|ලොතරැ|NLB|DLB|DRAW/i;

  /**
   * index.html එකේ onQrDecoded() එකෙන් කැඳවනවා.
   * @returns {null|{handled:true, html:string, after?:Function}}
   */
  function classifyQr(raw, parsed, lot) {
    const rawStr = String(raw || '');
    const p = parsed || {};

    // ---- (අ) draw එක තවම නිකුත් වී නැති (future) ටිකට් ----
    if (p.drawNo && lot) {
      const latest = Number(String(lot.latestDraw == null ? '' : lot.latestDraw).replace(/\D/g, ''));
      const mineNo = Number(String(p.drawNo).replace(/\D/g, ''));
      if (Number.isFinite(latest) && Number.isFinite(mineNo) && mineNo > latest && latest > 0) {
        return {
          handled: true,
          kind: 'future',
          html: '<strong>' + T('qr.future') + '</strong><br>' +
            T('qr.futureBody', { draw: String(p.drawNo), latest: String(lot.latestDraw) }),
          after: (host, box) => {
            const b = document.createElement('button');
            b.className = 'btn sec';
            b.type = 'button';
            b.style.marginTop = '12px';
            b.textContent = T('qr.futureTry');
            b.addEventListener('click', () => {
              const tab = document.querySelector('#tabs button[data-tab="results"]');
              if (tab) tab.click();
            });
            box.appendChild(b);
          },
        };
      }
    }

    // ---- (ආ) ලොතරැයි QR එකක්ම නොවන payload එකක් ----
    const structured = p.format === 'json' || p.format === 'url' || p.format === 'kv';
    const hasMarker = LOTTERY_MARKER.test(rawStr);
    const hasNumbers = Array.isArray(p.pairs) && p.pairs.length >= 2;

    if (!hasMarker && !structured && !(hasNumbers && lot && !p.slug && p.drawNo)) {
      return {
        handled: true,
        kind: 'not-lottery',
        html: '<strong>' + T('qr.notLottery') + '</strong><br>' + T('qr.notLotteryBody'),
        after: (host, box) => {
          const b = document.createElement('button');
          b.className = 'btn sec';
          b.type = 'button';
          b.style.marginTop = '12px';
            b.textContent = T('qr.howScan');
          b.addEventListener('click', () => {
            const tab = document.querySelector('#tabs button[data-tab="info"]');
            if (tab) tab.click();
          });
          box.appendChild(b);
        },
      };
    }

    return null;
  }

  /* ====================================================================== */
  /* 14. 📄 පහළ තොරතුරු quick bar (අප ගැන · රහස්‍යතා · මුදල් ආපසු · වගකීම්)      */
  /* ====================================================================== */

  const INFO_BTNS = [
    { info: 'how', label: { si: '📘 භාවිතා කරන විදිය', en: '📘 How to use', ta: '📘 பயன்படுத்தும் முறை' } },
    { info: 'about', label: { si: '🏢 අප ගැන', en: '🏢 About us', ta: '🏢 எங்களைப் பற்றி' } },
    { info: 'privacy', label: { si: '🔒 රහස්‍යතා ප්‍රතිපත්තිය', en: '🔒 Privacy policy', ta: '🔒 தனியுரிமை' } },
    { info: 'refund', label: { si: '💳 මුදල් ආපසු', en: '💳 Refund policy', ta: '💳 பணம் திரும்ப' } },
    { info: 'disclaimer', label: { si: '⚠️ වගකීම් ප්‍රතික්ෂේප කිරීම', en: '⚠️ Disclaimer', ta: '⚠️ பொறுப்புத் துறப்பு' } },
  ];

  function infoLabel(b) { return b.label[curLang()] || b.label.si; }

  function injectInfoBar() {
    if ($('#lkmInfoQuick')) return;
    const footer = document.querySelector('footer');
    const wrap = document.querySelector('.wrap');
    const sec = document.createElement('section');
    sec.id = 'lkmInfoQuick';
    sec.innerHTML =
      '<div class="card">' +
        '<h2>' + T('info.quick') + '</h2>' +
        '<div class="lkmInfoBar">' +
          INFO_BTNS.map(b => '<button type="button" data-lkminfo="' + b.info + '">' +
            esc(infoLabel(b)) + '</button>').join('') +
        '</div>' +
      '</div>';

    // App එකේ අන්තර්ගතයට යටින්ම, footer එකට උඩින්
    if (footer && footer.parentNode) footer.parentNode.insertBefore(sec, footer);
    else if (wrap) wrap.appendChild(sec);
    else document.body.appendChild(sec);

    $$('#lkmInfoQuick button[data-lkminfo]').forEach(btn => {
      btn.addEventListener('click', () => {
        const which = btn.dataset.lkminfo;
        if (which === 'disclaimer') {
          const m = document.getElementById('disclaimerModal');
          if (m) m.classList.add('show');
          return;
        }
        const tab = document.querySelector('#tabs button[data-tab="info"]');
        if (tab) tab.click();
        const link = document.querySelector('.infolink[data-info="' + which + '"]');
        if (link) link.click();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function refreshInfoBar() {
    const b = $('#lkmInfoQuick');
    if (!b) return;
    $$('#lkmInfoQuick button[data-lkminfo]').forEach(btn => {
      const row = INFO_BTNS.find(x => x.info === btn.dataset.lkminfo);
      if (row) btn.textContent = infoLabel(row);
    });
    const h = $('#lkmInfoQuick h2');
    if (h) h.textContent = T('info.quick');
  }

  /* ====================================================================== */
  /* 15. 🔌 index.html එකට දෙන hooks                                          */
  /* ====================================================================== */

  window.LKMExtras = {
    /* api() hook — offline fallback + cache */
    routeOffline,
    networkFailed,
    remember,

    /* QR / result hooks */
    onQrHit,
    onResult,
    classifyQr,

    /* UI */
    renderBar,
    refreshInfoBar,

    /* test සඳහා (browser console එකෙන්) */
    _debug: {
      offlineCheck,
      serveFromBundle,
      bundle: getBundle,
      bundleHasDraws,
      syncBundle,
      checkGate,
      showGate,
      hideGate,
      resumeScan,
      clearCache: () => {
        [LS.bundle, LS.mirror, LS.lastSync].forEach(k => localStorage.removeItem(k));
      },
      isOffline,
      overlaySec: OVERLAY_SEC,
    },
  };

  /* ====================================================================== */
  /* 16. Boot                                                               */
  /* ====================================================================== */

  function boot() {
    injectCss();
    injectBar();
    injectInfoBar();
    registerSw();
    renderBar();

    // ප්‍රතිඵල දත්ත තියෙනවද? නැත්නම් gate එක.
    // (App එකේම lottery list එක load වෙලා නම් gate එක අනවශ්‍යයි.)
    setTimeout(() => {
      const sel = document.getElementById('lotterySelect');
      const loaded = sel && sel.options && sel.options.length > 1;
      if (loaded || bundleHasDraws()) {
        hideGate();
        scheduleBundleSync();
      } else {
        checkGate(false);
      }
    }, 1500);
  }

  window.addEventListener('online', () => {
    renderBar();
    checkGate(false);
    syncBundle(true);
  });
  window.addEventListener('offline', () => renderBar());

  // භාෂාව මාරු වුනාම අපේ UI එකත් පරිවර්තනය කරනවා
  // (1) documentElement.lang attribute එක නිරීක්ෂණය කරනවා
  try {
    const mo = new MutationObserver(() => { renderBar(); refreshInfoBar(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  } catch (e) { /* ignore */ }
  // (2) language switch button එකට කෙලින්ම click listener එකක් (වේගවත් + නිරවද්‍ය)
  document.addEventListener('click', ev => {
    const b = ev.target && ev.target.closest ? ev.target.closest('#langSw button') : null;
    if (!b) return;
    setTimeout(() => { renderBar(); refreshInfoBar(); }, 0);
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
