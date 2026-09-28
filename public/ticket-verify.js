/* ==========================================================================
 * ticket-verify.js — 🎟️ ටිකට් එකේ දත්ත ↔ දිනුම් ප්‍රතිඵලය **හරියටම** සැසඳීම
 * ==========================================================================
 *
 * 🎯 ඇයි මේක ඕන?
 *   QR එකේ තියෙන දේවල්: **ලොතරැයිය · date · draw අංකය · අකුර · ලග්නය ·
 *   special letter · special number · ටිකට් අංක (1-ඉලක්කම් හෝ 2-ඉලක්කම්)**.
 *   ඒ ඔක්කොම දිනුම් ප්‍රතිඵලයේ තියෙන දේවල් එක්ක ගැලපෙනවද කියලා **user ට
 *   ඇස් අතින්ම පේන්න** පෙන්නන එකයි මේ module එකේ වැඩේ.
 *
 *   එතකොට:
 *     ✅ ගැලපුනා   → ✅ හරි (කොළ පාට)
 *     ❌ ගැලපුනේ නෑ → ❌ වැරදි (රතු) — උදා: අකුර "K" ටිකට් එකේ, දිනුම් අකුර "G"
 *     ⚠️ දත්ත නෑ     → ⚠️ QR එකේ ඒක නෑ (වැරදි කියලා කියන්නේ නෑ)
 *
 *   "ප්‍රතිඵලය වැරදුනොත් ප්‍රශ්නයක්" — ඒ නිසා **මොනවද ගැලපුනේ, මොනවද
 *   ගැලපුනේ නැත්තේ** කියලා හැම field එකක්ම පෙන්නනවා. හංගන්නේ නෑ.
 *
 * API:
 *   LKMTicketVerify.verify(lot, draw, ticket, parsed, lang)
 *   LKMTicketVerify.html(lot, draw, ticket, parsed, lang)   → HTML string
 * ========================================================================== */

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;   // Node (test)
  if (typeof window !== 'undefined') window.LKMTicketVerify = api;          // Browser
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ===================== භාෂා ===================== */

  const T = {
    title: { si: '🎟️ ටිකට් එක ↔ දිනුම් ප්‍රතිඵලය', en: '🎟️ Ticket ↔ Draw result', ta: '🎟️ டிக்கெட் ↔ டிரா முடிவு' },
    yourTicket: { si: 'ඔබේ ටිකට් එක', en: 'Your ticket', ta: 'உங்கள் டிக்கெட்' },
    drawResult: { si: 'දිනුම් ප්‍රතිඵලය', en: 'Draw result', ta: 'டிரா முடிவு' },
    lottery: { si: 'ලොතරැයිය', en: 'Lottery', ta: 'லாட்டரி' },
    board: { si: 'පුවරුව (NLB/DLB)', en: 'Board', ta: 'வாரியம்' },
    ticketCode: { si: 'ටිකට් කේතය', en: 'Ticket code', ta: 'டிக்கெட் குறியீடு' },
    serial: { si: 'Serial අංකය', en: 'Serial no.', ta: 'வரிசை எண்' },
    drawNo: { si: 'Draw අංකය', en: 'Draw no.', ta: 'டிரா எண்' },
    date: { si: 'දිනය', en: 'Date', ta: 'தேதி' },
    letter: { si: 'අකුර', en: 'Letter', ta: 'எழுத்து' },
    zodiac: { si: 'රාශිය (ලග්නය)', en: 'Zodiac (lagna)', ta: 'ராசி' },
    superNumber: { si: 'Special / Super අංකය', en: 'Special / Super number', ta: 'சிறப்பு எண்' },
    specialLetter: { si: 'Special අකුර', en: 'Special letter', ta: 'சிறப்பு எழுத்து' },
    num: { si: 'අංක', en: 'Number', ta: 'எண்' },
    okTxt: { si: 'හරි', en: 'match', ta: 'சரி' },
    badTxt: { si: 'ගැලපෙන්නේ නෑ', en: 'mismatch', ta: 'பொருந்தவில்லை' },
    noneTxt: { si: 'QR එකේ නෑ', en: 'not in QR', ta: 'QR இல் இல்லை' },
    allOk: {
      si: '✅ QR එකේ තියෙන හැම දෙයක්ම දිනුම් ප්‍රතිඵලය එක්ක ගැලපුනා.',
      en: '✅ Everything on the QR matches the draw result.',
      ta: '✅ QR இல் உள்ள அனைத்தும் டிரா முடிவுடன் பொருந்துகிறது.',
    },
    someBad: {
      si: '❌ ගැලපෙන්නේ නැති දේවල් තියෙනවා — පහත රතු පාට ඒවා බලන්න.',
      en: '❌ Some fields do not match — see the red items below.',
      ta: '❌ சில பொருந்தவில்லை — கீழே சிவப்பு உருப்படிகளைப் பாருங்கள்.',
    },
    unknown: {
      si: '⚠️ QR එකේ සමහර දේවල් කියවාගන්න බැරි උනා — ඒ නිසා ප්‍රතිඵලය වැරදි වෙන්න පුළුවන්.',
      en: '⚠️ Some fields could not be read from the QR — the result may be incomplete.',
      ta: '⚠️ சில புலங்கள் வாசிக்க முடியவில்லை — முடிவு முழுமையாக இல்லாமல் இருக்கலாம்.',
    },
    inDraw: { si: 'දිනුම් අංක අතරේ තියෙනවා', en: 'found in the draw', ta: 'டிராவில் உள்ளது' },
    notInDraw: { si: 'දිනුම් අංක අතරේ නෑ', en: 'not in the draw', ta: 'டிராவில் இல்லை' },
  };

  function lang(l) { return (l === 'en' || l === 'ta') ? l : 'si'; }
  function t(key, l) { const r = T[key]; return r ? (r[lang(l)] || r.si) : key; }

  /* ===================== ලග්න නම් ===================== */

  const ZODIAC = [
    { en: 'ARIES', si: 'මේෂ', ta: 'மேஷம்' },
    { en: 'TAURUS', si: 'වෘෂභ', ta: 'ரிஷபம்' },
    { en: 'GEMINI', si: 'මිථුන', ta: 'மிதுனம்' },
    { en: 'CANCER', si: 'කටක', ta: 'கடகம்' },
    { en: 'LEO', si: 'සිංහ', ta: 'சிம்மம்' },
    { en: 'VIRGO', si: 'කන්‍යා', ta: 'கன்னி' },
    { en: 'LIBRA', si: 'තුලා', ta: 'துலாம்' },
    { en: 'SCORPIO', si: 'වෘශ්චික', ta: 'விருச்சிகம்' },
    { en: 'SAGITTARIUS', si: 'ධනු', ta: 'தனுசு' },
    { en: 'CAPRICORN', si: 'මකර', ta: 'மகரம்' },
    { en: 'AQUARIUS', si: 'කුම්භ', ta: 'கும்பம்' },
    { en: 'PISCES', si: 'මීන', ta: 'மீனம்' },
  ];

  function zodiacLabel(code, l) {
    if (!code) return null;
    const z = ZODIAC.find(x => x.en === String(code).toUpperCase());
    if (!z) return String(code);
    return z[lang(l)] || z.si;
  }

  /* ===================== helpers ===================== */

  function norm(v) {
    if (v == null) return null;
    const s = String(v).trim();
    return s === '' ? null : s;
  }

  /** අංක දෙකක් සමානද? ("07" සහ "7" එකම එක විදිහට ගන්නවා) */
  function sameNum(a, b) {
    const A = norm(a), B = norm(b);
    if (A === null && B === null) return true;
    if (A === null || B === null) return false;
    if (A === B) return true;
    const na = Number(A), nb = Number(B);
    if (!isNaN(na) && !isNaN(nb)) return na === nb;
    return false;
  }

  /* ===================== ප්‍රධාන verification ===================== */

  /**
   * @param {object} lot      ලොතරැයිය (hasLetter/hasZodiac/hasSuperNumber/numberCount/digitWidth/name/nameSi/slug)
   * @param {object} draw     දිනුම් ප්‍රතිඵලය (drawNo/date/letter/zodiac/superNumber/numbers[])
   * @param {object} ticket   ටිකට් එකේ දත්ත (letter/zodiac/superNumber/specialLetter/numbers[])
   * @param {object} parsed   QR parser එකේ ප්‍රතිඵලය (slug/date/drawNo — optional)
   * @param {string} l        භාෂාව
   */
  function verify(lot, draw, ticket, parsed, l) {
    lot = lot || {}; draw = draw || {}; ticket = ticket || {}; parsed = parsed || {};
    const rows = [];
    const add = (key, label, tval, dval, opts) => {
      const o = opts || {};
      const hasT = tval !== null && tval !== undefined && String(tval) !== '';
      const hasD = dval !== null && dval !== undefined && String(dval) !== '';
      let status;
      if (!hasT) status = 'unknown';                       // QR එකේ නෑ → වැරදි කියන්නේ නෑ
      else if (!hasD) status = 'unknown';
      else status = (o.numeric ? sameNum(tval, dval) : String(tval) === String(dval)) ? 'ok' : 'bad';
      rows.push({
        key: key, label: label,
        ticketText: hasT ? String(tval) : null,
        drawText: hasD ? String(dval) : null,
        status: status,
        showTicket: o.showTicket !== false,
        showDraw: o.showDraw !== false,
      });
    };

    /* ---- ලොතරැයිය (QR එකේ නම් තියෙනවා නම් විතරයි) ---- */
    const qrSlug = parsed.slug || null;
    if (qrSlug) {
      add('lottery', t('lottery', l), qrSlug, lot.slug || null,
        { showTicket: true, showDraw: true });
      const row = rows[rows.length - 1];
      row.ticketText = lotLabelName(qrSlug, l);
      row.drawText = lotLabelName(lot.slug, l);
    }

    /* ---- 🎫 ටිකට් අනන්‍යතාව (QR එකේ තිබ්බා නම්) — ℹ️ තොරතුරු පේළි විතරයි
       (දිනුම් ප්‍රතිඵලයේ මේවා නෑ, ඒ නිසා ✅/❌ කියන්නේ නෑ) ---- */
    const addInfo = (key, label, val) => {
      if (val == null || String(val) === '') return;
      rows.push({
        key: key, label: label, ticketText: String(val), drawText: null,
        status: 'info', showTicket: true, showDraw: false,
      });
    };
    addInfo('board', t('board', l), parsed.board);
    addInfo('ticketCode', t('ticketCode', l), parsed.lotteryCode);
    addInfo('serial', t('serial', l), parsed.serial);

    /* ---- draw අංකය + දිනය (QR එකේ තිබ්බා නම්) ---- */
    if (norm(parsed.drawNo)) {
      add('drawNo', t('drawNo', l), String(parsed.drawNo).replace(/\D/g, '').replace(/^0+(?=\d)/, ''),
        String(draw.drawNo || '').replace(/^0+(?=\d)/, ''), { numeric: true });
    }
    if (norm(parsed.date)) add('date', t('date', l), parsed.date, draw.date || null);

    /* ---- ලොතරැයියේ format එකට අනුව field එකින් එක ---- */
    if (lot.hasLetter) add('letter', t('letter', l), norm(ticket.letter), norm(draw.letter));
    if (lot.hasZodiac) {
      add('zodiac', t('zodiac', l), norm(ticket.zodiac), norm(draw.zodiac));
      const row = rows[rows.length - 1];
      if (row.ticketText) row.ticketText = zodiacLabel(row.ticketText, l);
      if (row.drawText) row.drawText = zodiacLabel(row.drawText, l);
    }
    if (lot.hasSuperNumber) add('superNumber', t('superNumber', l), norm(ticket.superNumber), norm(draw.superNumber), { numeric: true });
    if (lot.hasSpecialLetter && ticket.specialLetter) {
      add('specialLetter', t('specialLetter', l), norm(ticket.specialLetter), norm(draw.specialLetter));
    }

    /* ---- ටිකට් අංක ---- */
    const tNums = Array.isArray(ticket.numbers) ? ticket.numbers : [];
    const dNums = Array.isArray(draw.numbers) ? draw.numbers : [];
    const dSet = dNums.map(x => String(x).replace(/^0+(?=\d)/, ''));
    const numberRows = [];
    for (let i = 0; i < tNums.length; i++) {
      const tv = String(tNums[i]).replace(/^0+(?=\d)/, '');
      const inDraw = dSet.indexOf(tv) >= 0;
      numberRows.push({
        idx: i,
        label: t('num', l) + ' ' + (i + 1),
        ticketText: tv,
        inDraw: inDraw,
        status: inDraw ? 'ok' : 'bad',
      });
    }
    // අංක කීයක් ගැලපුනාද (winner badge)
    const hitCount = numberRows.filter(r => r.inDraw).length;

    /* ---- සමස්ත තත්ත්වය ---- */
    const bad = rows.filter(r => r.status === 'bad').length;
    const unknown = rows.filter(r => r.status === 'unknown').length;
    const allOk = bad === 0 && unknown === 0;
    const verdict = bad > 0 ? 'bad' : (unknown > 0 ? 'partial' : 'ok');

    return {
      rows: rows,
      numberRows: numberRows,
      hitCount: hitCount,
      badCount: bad,
      unknownCount: unknown,
      allOk: allOk,
      verdict: verdict,
      text: verdict === 'ok' ? t('allOk', l) : (verdict === 'bad' ? t('someBad', l) : t('unknown', l)),
      title: t('title', l),
      labels: {
        yourTicket: t('yourTicket', l),
        drawResult: t('drawResult', l),
        inDraw: t('inDraw', l),
        notInDraw: t('notInDraw', l),
        noneTxt: t('noneTxt', l),
        okTxt: t('okTxt', l),
        badTxt: t('badTxt', l),
      },
      lang: lang(l),
    };
  }

  /** slug එකකින් පෙන්නන නම (lottery-meta එකේ නම් නැති නම් slug එකම) */
  function lotLabelName(slug, l) {
    const MAP = {
      'mahajana-sampatha': { si: 'මහජන සම්පත්', en: 'Mahajana Sampatha', ta: 'மகஜன சம்பத்' },
      'govisetha': { si: 'ගොවිසෙත', en: 'Govisetha', ta: 'கோவிசெத' },
      'sasiri': { si: 'සසිරි', en: 'Sasiri', ta: 'சசிரி' },
      'ada-kotipathi': { si: 'අද කෝටිපති', en: 'Ada Kotipathi', ta: 'அத கோடிபதி' },
      'kapruka': { si: 'කප්‍රුක', en: 'Kapruka', ta: 'கப்ருக' },
      'handahana': { si: 'හඳහන', en: 'Handahana', ta: 'ஹந்தஹன' },
      'lagna-wasana': { si: 'ලග්න වාසනා', en: 'Lagna Wasana', ta: 'லக்ன வசன' },
      'shanida': { si: 'ශනිදා', en: 'Shanida', ta: 'ஷனிதா' },
      'super-ball': { si: 'සුපර් බෝල්', en: 'Super Ball', ta: 'சூப்பர் பால்' },
      'dhana-nidhanaya': { si: 'ධන නිධානය', en: 'Dhana Nidhanaya', ta: 'தன நிதானய' },
      'jaya-sampatha': { si: 'ජය සම්පත්', en: 'Jaya Sampatha', ta: 'ஜய சம்பத்' },
      'supiri-dhana-sampatha': { si: 'සුපිරි ධන සම්පත්', en: 'Supiri Dhana Sampatha', ta: 'சுபிரி தன சம்பத்' },
      'ada-sampatha': { si: 'අද සම්පත්', en: 'Ada Sampatha', ta: 'அத சம்பத்' },
      'mega-power': { si: 'මෙගා පවර්', en: 'Mega Power', ta: 'மெகா பவர்' },
      'nlb-jaya': { si: 'NLB ජය', en: 'NLB Jaya', ta: 'NLB ஜய' },
      'suba-dawasak': { si: 'සුබ දවසක්', en: 'Suba Dawasak', ta: 'சுப தவசக்' },
    };
    const m = MAP[slug];
    if (!m) return slug ? String(slug) : '—';
    return m[lang(l)] || m.si;
  }

  /* ===================== HTML එකට හරවනවා ===================== */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function icon(status) {
    if (status === 'ok') return '✅';
    if (status === 'bad') return '❌';
    if (status === 'info') return 'ℹ️';
    return '⚠️';
  }

  /**
   * සැසඳීමේ ටේබලය HTML විදිහට.
   * @param {object} v verify() එකේ ප්‍රතිඵලය
   */
  function html(v) {
    if (!v) return '';
    const L = v.labels;
    const rowHtml = r => {
      const tShow = r.ticketText != null ? esc(r.ticketText)
        : '<span class="cmp-none">' + esc(L.noneTxt) + '</span>';
      const dShow = r.drawText != null ? esc(r.drawText) : '—';
      const arrow = (r.status === 'ok') ? '=' : (r.status === 'bad' ? '≠' : '·');
      return '<div class="cmp-row ' + r.status + '">' +
        '<span class="cmp-k">' + esc(r.label) + '</span>' +
        '<span class="cmp-t">' + tShow + '</span>' +
        '<span class="cmp-arrow">' + arrow + '</span>' +
        '<span class="cmp-d">' + dShow + '</span>' +
        '<span class="cmp-s">' + icon(r.status) + '</span>' +
        '</div>';
    };

    let nums = '';
    if (v.numberRows.length) {
      nums = '<div class="cmp-nums">' + v.numberRows.map(r =>
        '<span class="cmp-chip ' + (r.inDraw ? 'ok' : 'bad') + '" title="' + esc(r.label) + '">' +
        esc(r.ticketText) + '</span>').join('') +
        '</div>' +
        '<div class="cmp-note">' + esc(L.inDraw) + ': <strong>' + v.hitCount + '</strong> / ' + v.numberRows.length + '</div>';
    }

    return '<div class="cmp ' + v.verdict + '">' +
      '<div class="cmp-hd"><strong>' + esc(v.title) + '</strong>' +
      '<span class="cmp-verdict">' + esc(v.text) + '</span></div>' +
      '<div class="cmp-head-row"><span class="cmp-k"></span>' +
      '<span class="cmp-t">' + esc(L.yourTicket) + '</span>' +
      '<span class="cmp-arrow"></span>' +
      '<span class="cmp-d">' + esc(L.drawResult) + '</span><span class="cmp-s"></span></div>' +
      v.rows.map(rowHtml).join('') +
      nums +
      '</div>';
  }

  return {
    verify: verify,
    html: html,
    zodiacLabel: zodiacLabel,
    lotLabelName: lotLabelName,
    ZODIAC: ZODIAC,
    version: '1.0.0',
  };
});
