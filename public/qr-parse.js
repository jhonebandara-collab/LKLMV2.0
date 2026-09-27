/* ==========================================================================
 * qr-parse.js — ටිකට් QR එකේ දත්ත කියවන parser එක (ලොතරැයි format එකට අනුව)
 * ==========================================================================
 *
 * 🎯 ඇයි මේක වෙනම file එකක්?
 *    QR එකේ තියෙන දේ **හරියටම** කියවන එක තමයි මුළු app එකේම වැදගත්ම කොටස.
 *    ඒක index.html එකේ හංගලා තිබ්බොත් test කරන්න බෑ. ඒ නිසා මෙතන
 *    browser එකේත් (window.LKMQrParse), Node එකේත් (module.exports) වැඩ කරන
 *    පිරිසිදු function එකක් විදිහට තියෙනවා → unit test කරන්න පුළුවන්.
 *
 * ⚠️ **මුල් version එකේ තිබ්බ ලොකු වැරදි 4ක් මෙතන හදලා තියෙනවා:**
 *   1. දිනයේ ඉලක්කම් (2026-09-25 → "20","26","09","25") ටිකට් අංක විදිහට
 *      ගන්නවා → දැන් දිනය **වෙනම හඳුනාගෙන** ඒ පරාසය ඇතුළේ ඉලක්කම් අයින් කරනවා.
 *   2. ලග්නය (zodiac) කියවන්නේ JSON/URL වලින් විතරයි → දැන් සිංහල/English/
 *      Tamil නම් සහ ♈-♓ ලකුණු වලින් කියවනවා.
 *   3. Super/Special number එකත් JSON වලින් විතරයි → දැන් "SN", "SPECIAL",
 *      "විශේෂ" වගේ වචන වලින් + අවට තියෙන ඉලක්කම් වලින් හඳුනාගන්නවා.
 *   4. ලොතරැයියේ format එක බලන්නේ නෑ — ලොතරැයියකට ඉලක්කම් 6ක් තියෙනවා නම්
 *      (1 බැගින්) දැන් හරියටම 6ක් ගන්නවා; 4×2 එකකට 4ම. අඩු වුනොත්
 *      "කියවාගන්න බැරි උනා" කියලා කියනවා (වැරදි ප්‍රතිඵලයක් නොදී).
 *
 * ප්‍රධාන API:
 *   LKMQrParse.parse(rawText, lottery)  →  { pairs, drawNo, date, letter, zodiac,
 *                                            superNumber, serial, slug, format,
 *                                            confidence, missing[], notes[] }
 *   LKMQrParse.zodiacNormalize('මිථුන')  → 'GEMINI'
 *   LKMQrParse.ZODIAC                   → ලැයිස්තුව
 * ========================================================================== */

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;   // Node (test)
  if (typeof window !== 'undefined') window.LKMQrParse = api;               // Browser
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ====================================================================== */
  /* 1. ලග්න (Zodiac) — English · සිංහල · தமிழ் · ලකුණ                            */
  /* ====================================================================== */

  const ZODIAC = [
    { en: 'ARIES', si: 'මේෂ', ta: 'மேஷம்', sym: '♈', alt: ['MESH', 'MESHA', 'MESAM'] },
    { en: 'TAURUS', si: 'වෘෂභ', ta: 'ரிஷபம்', sym: '♉', alt: ['VRISHABHA', 'RISHABAM', 'වෘෂභය'] },
    { en: 'GEMINI', si: 'මිථුන', ta: 'மிதுனம்', sym: '♊', alt: ['MITHUNA', 'MITHUNAM', 'මිථුනය'] },
    { en: 'CANCER', si: 'කටක', ta: 'கடகம்', sym: '♋', alt: ['KATAKA', 'KADAKAM', 'කටකය'] },
    { en: 'LEO', si: 'සිංහ', ta: 'சிம்மம்', sym: '♌', alt: ['SIMHA', 'SIMHAM', 'සිංහය'] },
    { en: 'VIRGO', si: 'කන්‍යා', ta: 'கன்னி', sym: '♍', alt: ['KANYA', 'KANNI', 'කන්‍යාව', 'කන්‍‍යා'] },
    { en: 'LIBRA', si: 'තුලා', ta: 'துலாம்', sym: '♎', alt: ['THULA', 'THULAM', 'තුලාව'] },
    { en: 'SCORPIO', si: 'වෘශ්චික', ta: 'விருச்சிகம்', sym: '♏', alt: ['VRISCHIKA', 'VIRUCHIKAM', 'වෘශ්චිකය'] },
    { en: 'SAGITTARIUS', si: 'ධනු', ta: 'தனுசு', sym: '♐', alt: ['DHANU', 'DHANUS', 'THANUSU', 'ධනුව'] },
    { en: 'CAPRICORN', si: 'මකර', ta: 'மகரம்', sym: '♑', alt: ['MAKARA', 'MAKARAM', 'මකරය'] },
    { en: 'AQUARIUS', si: 'කුම්භ', ta: 'கும்பம்', sym: '♒', alt: ['KUMBHA', 'KUMBHAM', 'කුම්භය'] },
    { en: 'PISCES', si: 'මීන', ta: 'மீனம்', sym: '♓', alt: ['MEENA', 'MEENAM', 'මීනය'] },
  ];

  function zodiacNormalize(v) {
    if (!v) return null;
    const rawV = String(v);
    const s = rawV.trim().toUpperCase();
    if (!s) return null;
    for (const z of ZODIAC) {
      if (s === z.en) return z.en;
      if (z.alt.some(a => String(a).toUpperCase() === s)) return z.en;
      if (String(z.si) === rawV.trim()) return z.en;              // සිංහල අකුරු වෙනස් වෙන්න පුළුවන් නිසා කෙලින්ම
      if (String(z.ta) === rawV.trim()) return z.en;
      if (z.sym === rawV.trim()) return z.en;
    }
    // මුළු පෙළක් ඇතුළේ හොයනවා — English නම, aliases, සිංහල/தமிழ் නම් හැම එකක්ම
    for (const z of ZODIAC) {
      const names = [z.en].concat(z.alt, [z.si, z.ta]);
      for (const name of names) {
        const n = String(name);
        if (n.length >= 3 && (s.indexOf(n.toUpperCase()) >= 0 || rawV.indexOf(n) >= 0)) return z.en;
      }
      if (z.sym && rawV.indexOf(z.sym) >= 0) return z.en;
    }
    return null;
  }

  /* ====================================================================== */
  /* 2. ලොතරැයි හඳුනාගැනීම (payload එකේ තියෙන වචන වලින්)                        */
  /* ====================================================================== */

  const LOTTERY_HINTS = [
    { slug: 'mahajana-sampatha', keys: ['MAHAJANA', 'MAHAJAN', 'මහජන'] },
    { slug: 'govisetha', keys: ['GOVISETHA', 'GOVI', 'ගොවිසෙත', 'ගොවි'] },
    { slug: 'sasiri', keys: ['SASIRI', 'සසිරි'] },
    { slug: 'ada-kotipathi', keys: ['KOTIPATH', 'KOTIPATI', 'කෝටිපති', 'අද කෝටිපති'] },
    { slug: 'kapruka', keys: ['KAPRUKA', 'කප්රුක', 'කප්‍රුක'] },
    { slug: 'handahana', keys: ['HANDAHANA', 'හඳහන'] },
    { slug: 'lagna-wasana', keys: ['LAGNA', 'ලග්න'] },
    { slug: 'shanida', keys: ['SHANIDA', 'ශනිදා'] },
    { slug: 'super-ball', keys: ['SUPER BALL', 'SUPERBALL', 'සුපර් බෝල්'] },
    { slug: 'dhana-nidhanaya', keys: ['DHANA NIDHAN', 'DHANA-NIDHAN', 'NIDHAN', 'ධන නිධාන', 'ධනනිධාන'] },
    { slug: 'jaya-sampatha', keys: ['JAYA SAMPATH', 'JAYASAMPATH', 'ජය සම්පත්'] },
    { slug: 'supiri-dhana-sampatha', keys: ['SUPIRI', 'සුපිරි'] },
    { slug: 'ada-sampatha', keys: ['ADA SAMPATH', 'ADASAMPATH', 'අද සම්පත්'] },
    { slug: 'mega-power', keys: ['MEGA POWER', 'MEGAPOWER', 'මෙගා'] },
    { slug: 'nlb-jaya', keys: ['NLB JAYA', 'NLBJAYA', 'NLB-ජය'] },
    { slug: 'suba-dawasak', keys: ['SUBA DAWASAK', 'SUBA', 'සුබ දවසක්'] },
  ];

  function slugFromText(s) {
    const up = String(s || '').toUpperCase();
    let best = null;
    for (const h of LOTTERY_HINTS) {
      for (const k of h.keys) {
        if (up.indexOf(k.toUpperCase()) >= 0) {
          if (!best || k.length > best.k.length) best = { slug: h.slug, k };
        }
      }
    }
    return best ? best.slug : null;
  }

  /* ====================================================================== */
  /* 3. මූලික helpers                                                       */
  /* ====================================================================== */

  /** අංක වෙනත් භාෂා/ස්වරූප වලින් තිබ්බත් සාමාන්‍ය කරනවා (①→1, １２→12, ٠→0) */
  function normalizeDigits(s) {
    return String(s == null ? '' : s).replace(/[０-９٠-٩۰-۹]/g, c => {
      const code = c.charCodeAt(0);
      if (code >= 0xFF10 && code <= 0xFF19) return String(code - 0xFF10);
      if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
      if (code >= 0x06F0 && code <= 0x06F9) return String(code - 0x06F0);
      return c;
    });
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function validYmd(y, m, d) {
    y = Number(y); m = Number(m); d = Number(d);
    if (!(y >= 1990 && y <= 2100)) return null;
    if (!(m >= 1 && m <= 12)) return null;
    if (!(d >= 1 && d <= 31)) return null;
    return y + '-' + pad2(m) + '-' + pad2(d);
  }

  const MONTHS_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const MONTHS_SI = ['ජනවාරි', 'පෙබරවාරි', 'මාර්තු', 'අප්‍රේල්', 'මැයි', 'ජූනි', 'ජූලි', 'අගෝස්තු', 'සැප්තැම්බර්', 'ඔක්තෝබර්', 'නොවැම්බර්', 'දෙසැම්බර්'];

  /**
   * Text එකක තියෙන **දිනය** හඳුනාගන්නවා. (⚠️ මේක තමයි මුල් bug එකේ මුල.)
   * @returns {{date:string|null, start:number, end:number}} — date = 'YYYY-MM-DD'
   */
  function findDate(s) {
    const t = normalizeDigits(String(s || ''));

    // 1) 2026-09-25 · 2026/09/25 · 2026.09.25
    let m = t.match(/\b(19|20)\d{2}[-/.](\d{1,2})[-/.](\d{1,2})\b/);
    if (m) {
      const d = validYmd(t.substr(m.index, 4), m[2], m[3]);
      if (d) return { date: d, start: m.index, end: m.index + m[0].length };
    }

    // 2) 25-09-2026 · 25/09/2026 · 25.09.2026
    m = t.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.]((?:19|20)\d{2})\b/);
    if (m) {
      const d = validYmd(m[3], m[2], m[1]);
      if (d) return { date: d, start: m.index, end: m.index + m[0].length };
    }

    // 3) 20260925 (8 ඉලක්කම් එකට)
    m = t.match(/\b((?:19|20)\d{2})(\d{2})(\d{2})\b/);
    if (m) {
      const d = validYmd(m[1], m[2], m[3]);
      if (d) return { date: d, start: m.index, end: m.index + m[0].length };
    }

    // 4) 25 SEP 2026 / 25-SEP-2026
    m = t.match(/\b(\d{1,2})[\s\-]*([A-Z]{3})[A-Za-z]*[\s,\-]*((?:19|20)\d{2})\b/i);
    if (m) {
      const mi = MONTHS_EN.indexOf(String(m[2]).toUpperCase());
      if (mi >= 0) {
        const d = validYmd(m[3], mi + 1, m[1]);
        if (d) return { date: d, start: m.index, end: m.index + m[0].length };
      }
    }

    // 5) 25 සැප්තැම්බර් 2026 (සිංහල මාස නම්)
    for (let i = 0; i < MONTHS_SI.length; i++) {
      const mi = t.indexOf(MONTHS_SI[i]);
      if (mi < 0) continue;
      const around = t.slice(Math.max(0, mi - 6), mi + MONTHS_SI[i].length + 8);
      const mm = around.match(/(\d{1,2})/);
      const yy = around.match(/((?:19|20)\d{2})/);
      if (mm && yy) {
        const d = validYmd(yy[1], i + 1, mm[1]);
        if (d) return { date: d, start: Math.max(0, mi - 6), end: mi + MONTHS_SI[i].length + 8 };
      }
    }

    return { date: null, start: -1, end: -1 };
  }

  /** ඉලක්කම් token එකක් දිනයේ කොටසක්ද? */
  function insideSpan(tok, span) {
    if (!span || span.start < 0) return false;
    return tok.start >= span.start && tok.end <= span.end;
  }

  /* ====================================================================== */
  /* 4. Tokenize — ඉලක්කම් කැබලි + ඒවායේ තැන්                                    */
  /* ====================================================================== */

  function numTokens(s) {
    const t = normalizeDigits(String(s || ''));
    const out = [];
    const re = /\d+/g;
    let m;
    while ((m = re.exec(t)) !== null) {
      out.push({ v: m[0], start: m.index, end: m.index + m[0].length, len: m[0].length });
    }
    return out;
  }

  /** වචන (අකුරු) token — ලග්න/අකුරු හඳුනාගන්න */
  function wordTokens(s) {
    const t = String(s || '');
    const out = [];
    const re = /[A-Za-z\u0D80-\u0DFF\u0B80-\u0BFF]+/g;   // Latin + සිංහල + දෙමළ
    let m;
    while ((m = re.exec(t)) !== null) out.push({ v: m[0], up: m[0].toUpperCase(), start: m.index });
    return out;
  }

  /* ====================================================================== */
  /* 5. Keyword වලින් field එකක් හඳුනාගැනීම                                    */
  /* ====================================================================== */

  const KW = {
    draw: ['DRAW NO', 'DRAWNO', 'DRAW', 'DRAW NUMBER', 'DRAWN', 'අංකය', 'දුර', 'වාරය', 'වාර අංකය'],
    serial: ['SERIAL', 'SER', 'TICKET NO', 'TICKETNO', 'TICKET', 'SER NO', 'ටිකට්', 'අනුක්‍රම'],
    letter: ['LETTER', 'LTR', 'අකුර', 'අකුරු'],
    zodiac: ['ZODIAC', 'LAGNA', 'LAGNAM', 'RASHI', 'RASI', 'ලග්නය', 'ලග්න', 'රාශිය', 'ராசி', 'லக்னம்'],
    super: ['SUPER NUMBER', 'SUPER NO', 'SUPER', 'SPECIAL NUMBER', 'SPECIAL NO', 'SPECIAL', 'SN',
      'විශේෂ', 'සුපිරි', 'විශේෂ අංකය'],
    date: ['DATE', 'DRAW DATE', 'දිනය', 'தேதி'],
    numbers: ['NUMBERS', 'NUMBER', 'NUM', 'COMBO', 'අංක'],
  };

  function findKeywordValue(text, keys, wantNumeric) {
    const up = String(text || '').toUpperCase();
    for (const k of keys.sort((a, b) => b.length - a.length)) {
      const ku = k.toUpperCase();
      let from = 0;
      for (;;) {
        const i = up.indexOf(ku, from);
        if (i < 0) break;
        const after = text.slice(i + ku.length, i + ku.length + 24);
        // KW: VALUE  ·  KW=VALUE  ·  KW  VALUE
        const m = after.match(wantNumeric
          ? /^[\s:=#|,.\-]*(\d{1,8})/
          : /^[\s:=#|,.\-]*([A-Za-z\u0D80-\u0DFF\u0B80-\u0BFF]+|\d{1,4})/);
        if (m) return { value: m[1], idx: i };
        from = i + ku.length;
      }
    }
    return null;
  }

  /* ====================================================================== */
  /* 6. ලොතරැයියේ format එකට අනුව ඉලක්කම් තෝරාගැනීම                              */
  /* ====================================================================== */

  /**
   * ඉතුරු වුනු ඉලක්කම් token වලින් ටිකට් අංක ගන්නවා.
   * — ලොතරැයිය දන්නවා නම් digitWidth/numberCount ඒකට හරියටම.
   * — "12456789" / "986159" වගේ එකට ලියපු ඒවා කැබලි කරනවා.
   * — ලොතරැයියේ සංඛ්‍යාවට **හරියටම ගැලපෙන** කැබලි ගණනක් තෝරනවා (වැරදි එකක් නොගන්න).
   */
  function pickNumbers(tokens, lot) {
    const wantW = (lot && lot.digitWidth) || null;
    const wantC = (lot && lot.numberCount) || null;

    const two = tokens.filter(t => t.len === 2);
    const one = tokens.filter(t => t.len === 1);

    /** token එකක් w ප්‍රමාණයට කැබලි කරනවා */
    function splitToken(t, w) {
      const parts = [];
      for (let i = 0; i + w <= t.v.length; i += w) parts.push(t.v.substr(i, w));
      return parts;
    }

    /**
     * එකට ලියපු අංක හොයනවා — **හරියටම numberCount එකට ගැලපෙන** එක මුලින්ම.
     * (උදා: 6 ඕන වෙලාවට "986159" ✅ · "6321" ❌)
     */
    function bestSplit(list, w, need) {
      let best = null;
      for (const t of list) {
        if (t.len <= 2 || t.len % w !== 0) continue;
        const parts = splitToken(t, w);
        if (!need) { if (!best || parts.length > best.parts.length) best = { parts, t }; continue; }
        if (parts.length === need) return { parts, t, exact: true };      // හරියටම ගැලපෙනවා → වහාම
        if (parts.length > need) {
          const sub = parts.slice(-need);
          if (!best) best = { parts: sub, t, exact: true };
        } else if (parts.length >= 2) {
          if (!best || parts.length > best.parts.length) best = { parts, t, exact: false };
        }
      }
      return best;
    }

    /** එක ඉලක්කම් token ටික යාබදව එකතු කරලා 2-ඉලක්කම් අංක හදනවා ("1 2 4 5 6 7 8 9" → "12 45 67 89") */
    function pairSingletons(list) {
      const out = [];
      for (let i = 0; i + 1 < list.length; i += 2) out.push(list[i].v + list[i + 1].v);
      return out;
    }

    // --- ලොතරැයිය දන්නවා නම් ---
    if (wantW === 2 && wantC) {
      if (two.length >= wantC) return { pairs: two.slice(-wantC).map(t => t.v), width: 2, order: 'two' };
      const sp = bestSplit(tokens, 2, wantC);
      if (sp && sp.parts.length >= Math.min(wantC, 1)) {
        return { pairs: sp.parts.slice(-wantC), width: 2, order: 'split2', exact: !!sp.exact };
      }
      /* 🔁 QR එකේ ඉලක්කම් **1 බැගින්** තිබ්බත්, 2 බැගින් ඕන ලොතරැයියකට
         හරියටම ගානට හදන්න පුළුවන් නම් හදනවා (උදා: "1 2 4 5 6 7 8 9" → "12 45 67 89") */
      if (one.length >= wantC * 2) {
        const pr = pairSingletons(one.slice(-wantC * 2));
        if (pr.length === wantC) return { pairs: pr, width: 2, order: 'pair-auto', exact: true };
      }
      if (two.length) return { pairs: two.map(t => t.v), width: 2, order: 'two-partial' };
      return { pairs: [], width: 2, order: 'none' };
    }

    if (wantW === 1 && wantC) {
      if (one.length >= wantC) return { pairs: one.slice(-wantC).map(t => t.v), width: 1, order: 'one' };
      const sp = bestSplit(tokens, 1, wantC);
      if (sp && sp.parts.length >= Math.min(wantC, 1)) {
        return { pairs: sp.parts.slice(-wantC), width: 1, order: 'split1', exact: !!sp.exact };
      }
      /* 🔁 අනිත් පැත්ත: QR එකේ **2 බැගින්** තිබ්බත් 1 බැගින් ඕන ලොතරැයියකට
         (උදා: "12 45 67" → 1,2,4,5,6,7) — ගාන හරියටම ගැලපෙනවා නම් විතරයි */
      const twoForOne = tokens.filter(t => t.len === 2);
      if (twoForOne.length * 2 >= wantC) {
        const flat = twoForOne.slice(-Math.ceil(wantC / 2))
          .map(t => t.v.split('')).reduce((a, b) => a.concat(b), []);
        if (flat.length >= wantC) return { pairs: flat.slice(-wantC), width: 1, order: 'unpair-auto', exact: true };
      }
      if (one.length) return { pairs: one.map(t => t.v), width: 1, order: 'one-partial' };
      return { pairs: [], width: 1, order: 'none' };
    }

    // --- ලොතරැයිය දන්නේ නෑ → ඉලක්කම් වලින් අනුමාන කරනවා ---
    if (two.length >= 3) return { pairs: two.slice(-Math.min(4, two.length)).map(t => t.v), width: 2, order: 'two-guess' };
    if (one.length >= 4) return { pairs: one.slice(-Math.min(6, one.length)).map(t => t.v), width: 1, order: 'one-guess' };
    // ලොතරැයිය දන්නේ නැති වෙලාවට කැබලි කරන්නේ **පැහැදිලිවම ටිකට් අංක කාණ්ඩයක්**
    // වගේ පෙනෙන එකක් විතරයි (උදා: "abc123" → 1,2,3 ❌ · "12456789" → 4×2 ✓)
    const sp2 = bestSplit(tokens, 2, 4);
    const ok2 = sp2 && sp2.parts.length >= 3;
    if (ok2) return { pairs: sp2.parts, width: 2, order: 'split-guess', exact: !!sp2.exact };
    const sp1 = bestSplit(tokens, 1, 6);
    if (sp1 && sp1.parts.length >= 4) return { pairs: sp1.parts, width: 1, order: 'split-guess', exact: !!sp1.exact };
    if (two.length) return { pairs: two.map(t => t.v), width: 2, order: 'two-few' };
    return { pairs: [], width: null, order: 'none' };
  }

  /* ====================================================================== */
  /* 6b. Draw number එක අනුමාන කරගැනීම (keyword එකක් නැති වෙලාවට)                  */
  /* ====================================================================== */

  /**
   * ලංකාවේ ලොතරැයි draw අංක 3-5 ඉලක්කම් (උදා: 503 · 1029 · 3121 · 6321).
   * ඉලක්කම් 6+ නම් ඒවා serial/ticket code හෝ එකට ලියපු අංක.
   */
  function guessDrawNo(tokens, lot) {
    const w = (lot && lot.digitWidth) || 2;
    const c = (lot && lot.numberCount) || 0;
    const cand = [];
    for (const t of tokens) {
      if (t.len < 3 || t.len > 5) continue;
      // ඒ token එකම ටිකට් අංක කාණ්ඩය වෙන්න පුළුවන් නම් (උදා: 1 ඉලක්කම් 6ක් → "986159") එය draw නොවේ
      if (c && t.len === w * c) continue;
      cand.push(t);
    }
    if (!cand.length) return null;
    // අංක කාණ්ඩයට **කලින්** තියෙන එක මුලින්ම (සාමාන්‍යයෙන් draw අංකය ඉස්සෙල්ලා)
    return cand[0].v;
  }

  /* ====================================================================== */
  /* 6c. අකුර (letter) — ලොතරැයියේ නමේ අකුරු ගන්නේ නෑ                          */
  /* ====================================================================== */

  /** ලොතරැයියේ නමේ තියෙන වචන (ඒවා field එකක් විදිහට ගන්නේ නෑ) */
  function noiseWords(slug) {
    const set = new Set(['LOTTERY', 'DRAW', 'DATE', 'SERIAL', 'SER', 'TICKET', 'NUMBER', 'NUM',
      'COMBO', 'SPECIAL', 'SUPER', 'NO', 'LTR', 'LETTER', 'SN', 'NLB', 'DLB']);
    const h = LOTTERY_HINTS.find(x => x.slug === slug);
    if (h) h.keys.forEach(k => k.split(/[\s\-]+/).forEach(w => set.add(w.toUpperCase())));
    return set;
  }

  /**
   * අකුර තෝරනවා — **තනි අකුරක් විදිහට** තියෙන එකක් විතරයි (වචනයක කොටසක් නොවේ).
   * උදා: "… DRAW 3121 I 12 45 67 89" → I ✓ · "MAHAJANA" → ✗
   */
  /** ටිකට් එකේ තියෙන හැම "තනි අකුරක්ම" — [{ch, idx}] (ලොතරැයියේ නමේ අකුරු අයින් කරලා) */
  function allLetterCands(s, lot) {
    const noise = noiseWords(lot && lot.slug);
    const t = String(s || '');
    const re = /(^|[^A-Za-z0-9])([A-Za-z])(?![A-Za-z0-9])/g;
    const found = [];
    let m;
    while ((m = re.exec(t)) !== null) {
      const ch = m[2].toUpperCase();
      if (noise.has(ch)) continue;                 // LOTTERY/DRAW/S/N වගේ label අකුරු අයින්
      found.push({ ch: ch, idx: m.index + m[1].length });
    }
    return found;
  }

  function guessLetter(s, lot) {
    const t = String(s || '');
    const found = allLetterCands(s, lot);

    // labels (L / Z / N / D) — අපැහැදිලි නිසා පළමු වටයේදී අයින් කරනවා
    const labels = new Set(['L', 'Z', 'N', 'D']);
    let cand = found.filter(f => !labels.has(f.ch));
    if (!cand.length) cand = found.slice();
    if (!cand.length) return null;
    if (cand.length === 1) return cand[0].ch;

    /* (අ) "L Z SN 14 22 45 67 89" වගේ — special number එකට කලින් තියෙන අකුර */
    const up = t.toUpperCase();
    for (const marker of ['SN', 'SPECIAL', 'සුපිරි', 'විශේෂ']) {
      const ix = up.indexOf(marker);
      if (ix < 0) continue;
      const before = cand.filter(c => c.idx < ix);
      if (before.length) return before[before.length - 1].ch;
    }

    /* (ආ) ටිකට් අංක කාණ්ඩයට **කලින්** තියෙන අන්තිම අකුර
           (උදා: "SHANIDA 5456 2026-09-25 G 12 45 67 89" → G) */
    const nums = numTokens(t);
    let blockStart = -1;
    for (let i = 0; i < nums.length - 1; i++) {
      const a = nums[i], b = nums[i + 1];
      if (a.len <= 2 && b.len <= 2 && b.start - a.end <= 3) { blockStart = a.start; break; }
    }
    if (blockStart >= 0) {
      const before = cand.filter(c => c.idx < blockStart);
      if (before.length) return before[before.length - 1].ch;
    }

    /* (ඇ) අංකයකට ආසන්නම එක */
    if (nums.length) {
      let best = null;
      for (const c of cand) {
        for (const nt of nums) {
          const d = Math.abs(c.idx - nt.start);
          if (d <= 6 && (!best || d < best.d)) best = { c, d };
        }
      }
      if (best) return best.c.ch;
    }
    return cand[0].ch;
  }

  /* ====================================================================== */
  /* 7. ප්‍රධාන parse function                                              */
  /* ====================================================================== */

  /**
   * @param {string} raw  — QR එකේ raw text එක
   * @param {object} [lot] — දැනට තෝරාගෙන තියෙන ලොතරැයිය (CURRENT) — optional
   * @returns {object}
   */
  function parse(raw, lot) {
    const s = normalizeDigits(String(raw == null ? '' : raw)).trim();
    const out = {
      raw: s, format: 'unknown', slug: null,
      drawNo: null, date: null, letter: null, zodiac: null, superNumber: null, serial: null,
      // 🅰️ ටිකට් එකේ තියෙන **හැම තනි අකුරක්ම** + special letter එකක් තියෙනවා නම් ඒකත්
      letters: [], specialLetter: null,
      pairs: [], digitWidth: null, confidence: 'low', missing: [], notes: [],
      dateSpan: null,
    };
    if (!s) { out.missing.push('data'); return out; }

    let rest = s;                                  // field එකක් හම්බුනාම ඒ පරාසය '#' වලින් වහනවා
    const blank = (i, n) => { rest = rest.slice(0, i) + '#'.repeat(n) + rest.slice(i + n); };
    const blankKeyword = (i, n) => blank(i, n);

    /* ---------- (1) දිනය — මුලින්ම, මොකද මේකයි ලොකුම bug එක ---------- */
    const dt = findDate(s);
    if (dt.date) {
      out.date = dt.date;
      out.dateSpan = { start: dt.start, end: dt.end };
      blank(dt.start, dt.end - dt.start);
    }

    /* ---------- (2) JSON ---------- */
    try {
      const j = JSON.parse(s);
      if (j && typeof j === 'object' && !Array.isArray(j)) {
        const g = (...keys) => {
          for (const k of keys) {
            for (const kk of Object.keys(j)) {
              if (kk.toLowerCase().replace(/[^a-z]/g, '') === k.toLowerCase().replace(/[^a-z]/g, '')) return j[kk];
            }
          }
          return null;
        };
        const arr = g('numbers', 'nums', 'n', 'combo');
        if (Array.isArray(arr)) out.pairs = arr.map(x => String(x).trim()).filter(Boolean);
        out.drawNo = g('drawNo', 'draw', 'drawno', 'drawnumber', 'drawNumber');
        out.date = (g('date', 'drawDate') && String(g('date', 'drawDate'))) || out.date;
        out.letter = g('letter', 'ltr', 'char');
        out.zodiac = g('zodiac', 'lagna', 'rashi', 'rasi', 'sign');
        out.superNumber = g('superNumber', 'superNo', 'super', 'sn', 'special', 'specialNumber');
        out.serial = g('serial', 'ser', 'ticketNo', 'ticket');
        out.slug = slugFromText(String(g('lottery', 'lotterySlug', 'name', 'game') || ''));
        out.format = 'json';
        if (out.date) {
          const d2 = findDate(String(out.date));
          if (d2.date) out.date = d2.date;
        }
      }
    } catch (e) { /* JSON නෙවෙයි */ }

    /* ---------- (3) URL ---------- */
    if (out.format === 'unknown' && /^[a-z][a-z0-9+.\-]*:\/\//i.test(s)) {
      out.format = 'url';
      try {
        const qs = s.slice(s.indexOf('?') + 1).split('#')[0];
        const sp = new URLSearchParams(qs);
        const get = (...ks) => { for (const k of ks) { const v = sp.get(k); if (v) return v; } return null; };
        const nums = get('numbers', 'n', 'nums', 'combo');
        if (nums) out.pairs = String(nums).split(/[^0-9]+/).filter(Boolean);
        out.drawNo = get('drawNo', 'draw', 'd');
        const dv = get('date', 'drawDate', 'dt');
        const d3 = dv ? findDate(dv) : { date: null };
        if (d3.date) out.date = d3.date;
        out.letter = (get('letter', 'l', 'ltr') || '').toUpperCase() || null;
        out.zodiac = get('zodiac', 'lagna', 'z', 'sign');
        out.superNumber = get('superNumber', 'super', 'sn', 'special');
        out.serial = get('serial', 'ser', 'ticket', 't');
        out.slug = slugFromText(s);
        if (!out.pairs.length && out.drawNo) {
          const nm = get('n2');
          if (nm) out.pairs = String(nm).split(/[^0-9]+/).filter(Boolean);
        }
      } catch (e) { /* ignore */ }
    }

    /* ---------- (4) keyword: value ---------- */
    if (out.format === 'unknown') out.format = 'kv';

    const kwDraw = findKeywordValue(rest, KW.draw, true);
    if (kwDraw && !out.drawNo) {
      out.drawNo = kwDraw.value;
      blank(kwDraw.idx, kwDraw.value.length + 8);
    }
    const flat = () => rest.replace(/#/g, ' ');
    const kwSer = findKeywordValue(flat(), KW.serial, true);
    if (kwSer && !out.serial && String(kwSer.value).length >= 4) out.serial = kwSer.value;

    if (!out.letter) {
      const kwL = findKeywordValue(flat(), KW.letter, false);
      if (kwL && /^[A-Za-z]$/.test(kwL.value)) out.letter = kwL.value.toUpperCase();
    }
    if (!out.zodiac) {
      const kwZ = findKeywordValue(flat(), KW.zodiac, false);
      // ⚠️ keyword එකට පස්සේ තියෙන වචනය ලග්නයක් **නොවෙන්නත් පුළුවන්**
      //    (උදා: "LAGNA WASANA" → "WASANA" කියන්නේ ලොතරැයියේ නමේ කොටසක්)
      if (kwZ) {
        const zn = zodiacNormalize(kwZ.value);
        if (zn) out.zodiac = zn;
      }
    }
    if (!out.superNumber) {
      const kwS = findKeywordValue(flat(), KW.super, true);
      if (kwS) out.superNumber = kwS.value;
    }

    /* ---------- (5) ලග්නය — මුළු පෙළේම හොයනවා (සිංහල/English/Tamil/ලකුණ) ---------- */
    if (!out.zodiac) {
      const z = zodiacNormalize(s);
      if (z) out.zodiac = z;
      else {
        for (const zz of ZODIAC) {
          if (s.indexOf(zz.sym) >= 0) { out.zodiac = zz.en; break; }
        }
      }
    }

    /* ---------- (6) දිනය/serial අයින් කරලා ඉතුරු ඉලක්කම් ගන්නවා ---------- */
    if (!out.slug) out.slug = slugFromText(s);
    const lotCtx = lot || (out.slug ? { slug: out.slug } : null);

    let toks = numTokens(rest).filter(t => {
      if (t.v.indexOf('#') >= 0) return false;
      if (insideSpan(t, out.dateSpan)) return false;
      return true;
    });
    // දිනයේ කොටස් වෙනත් තැනක තිබ්බත් අයින් කරනවා
    // (⚠️ "9" වගේ තනි ඉලක්කම් **අයින් කරන්නේ නෑ** — 1-ඉලක්කම් ලොතරැයිවල
    //  ඒවා ඇත්ත ටිකට් අංක. දිනයේ "09" තියෙනවා නම් "09" විදිහටම විතරයි අයින් කරන්නේ.)
    if (out.date) {
      const [Y, M, D] = out.date.split('-');
      const dateNums = new Set([Y, M + D, D + M, Y + M + D, M + '-' + D, D + '-' + M]);
      if (toks.length > 6) dateNums.add(M);       // ගොඩක් ඉලක්කම් තියෙනවා නම් "09" වගේ ඒවාත් අයින් කරන්න
      toks = toks.filter(t => !dateNums.has(t.v));
    }
    // draw/serial අගයන් අයින් කරනවා
    if (out.drawNo) toks = toks.filter(t => t.v !== String(out.drawNo));
    if (out.serial) toks = toks.filter(t => t.v !== String(out.serial));

    // (6b) draw number එකක් keyword එකකින් හම්බුනේ නැත්නම් — **ලොතරැයි සන්දර්භයක්
    //      තියෙනවා නම් විතරයි** අනුමාන කරන්නේ. (නැත්නම් YouTube link එකක
    //      තියෙන "123" වගේ අංකයක් draw අංකයක් කියලා හිතනවා.)
    const hasLotteryCtx = !!lot || !!out.slug || LOTTERY_MARKER.test(s);
    if (!out.drawNo && hasLotteryCtx) {
      const g = guessDrawNo(toks, lotCtx);
      if (g) {
        out.drawNo = g;
        out.drawGuessed = true;
        toks = toks.filter(t => t.v !== String(g));
      }
    }

    // (6c) අංක නැති නමුත් payload එකේ 6+ ඉලක්කම් token එකක් නම් ඒක ටිකට් කේතයක් වෙන්න පුළුවන්
    //      (⚠️ ලොතරැයි සන්දර්භයක් තියෙනවා නම් විතරයි — WiFi QR එකේ "12345678" එක ටිකට් එකක් නෙවෙයි)
    if (!out.pairs.length && !out.serial && hasLotteryCtx) {
      const wC = lotCtx && lotCtx.digitWidth, cC = lotCtx && lotCtx.numberCount;
      const long = numTokens(s).find(t => {
        if (t.len < 6) return false;
        if (insideSpan(t, out.dateSpan)) return false;
        if (out.drawNo && t.v === String(out.drawNo)) return false;
        // ⚠️ මේ token එක **ටිකට් අංක කාණ්ඩය** වෙන්නත් පුළුවන් නම් (උදා: "12456789" = 4×2)
        //    ඒක serial එකක් විදිහට ගන්නේ නෑ.
        if (wC && cC && t.len === wC * cC) return false;
        return true;
      });
      if (long) out.serial = long.v;
    }
    // ⚠️ serial එකක් දැන් හම්බුනා නම් ඒක ටිකට් අංක ලැයිස්තුවෙන් අයින් කරන්න ඕන
    // (නැත්නම් "7712345" වගේ serial එකෙන් ඉලක්කම් අංක විදිහට ගන්නවා)
    if (out.serial) toks = toks.filter(t => t.v !== String(out.serial));

    // (6d) Super number: keyword එකක් නැත්නම්, අංක කාණ්ඩයට කලින් තියෙන 1-2 ඉලක්කම් එක
    if (!out.superNumber && lot && lot.hasSuperNumber && toks.length) {
      const w = lot.digitWidth || 2, c = lot.numberCount || 4;
      const same = toks.filter(t => t.len === w);
      if (same.length >= c) {
        const firstIdx = toks.indexOf(same[same.length - c]);
        for (let i = firstIdx - 1; i >= 0 && i >= firstIdx - 2; i--) {
          const cand = toks[i];
          if (cand && cand.len <= 2 && cand.len < w + 1) { out.superNumber = cand.v; break; }
        }
      }
    }
    if (out.superNumber) toks = toks.filter(t => t.v !== String(out.superNumber));

    // (6e) ඉතුරු ඉලක්කම් → ටිකට් අංක (ලොතරැයියේ format එකට හරියටම)
    const picked = pickNumbers(toks, lotCtx);
    out.pairs = picked.pairs;
    out.digitWidth = picked.width || (lotCtx && lotCtx.digitWidth) || null;
    out.numberCount = (lotCtx && lotCtx.numberCount) || null;

    /* ---------- (7) අකුර (letter) + confidence ---------- */
    if (!out.slug && lot) out.slug = lot.slug;

    // (7a) ටිකට් එකේ තියෙන හැම තනි අකුරක්ම (order එකට) — user ට පෙන්නන්න
    out.letters = allLetterCands(s, lot).map(c => c.ch);

    if (!out.letter && lot && lot.hasLetter) {
      const L = guessLetter(s, lot);
      if (L) out.letter = L;
    }
    if (out.letter) out.letter = String(out.letter).toUpperCase();

    /* (7b) 🅰️ Special letter — ලොතරැයියේ අකුර එකක් තියෙනවා නම්, තව අකුරක් තිබ්බොත්
       ඒක special letter එක විදිහට ගන්නවා. (උදා: "LETTER K SPECIAL LETTER X …"
       හෝ අකුරු 2ක් තියෙන ටිකට් වල.) — ලොතරැයියේ ඒ field එක නැත්නම් මේක
       පෙන්නන්නේ නෑ, ඒත් QR එකේ තියෙනවා නම් කියවලා තියාගන්නවා. */
    if (out.letter) {
      const others = allLetterCands(s, lot).filter(c => c.ch !== out.letter);
      if (others.length) out.specialLetter = others[others.length - 1].ch;
    }

    // --- confidence + missing ---
    if (out.zodiac) out.zodiac = zodiacNormalize(out.zodiac) || String(out.zodiac).toUpperCase();
    const needC = out.numberCount || 0;
    const haveC = out.pairs.length;
    if (lot) {
      if (lot.hasLetter && !out.letter) out.missing.push('letter');
      if (lot.hasZodiac && !out.zodiac) out.missing.push('zodiac');
      if (lot.hasSuperNumber && !out.superNumber) out.missing.push('superNumber');
    }
    if (needC && haveC < needC) out.missing.push('numbers');

    if (!haveC) out.confidence = 'low';
    else if (out.missing.indexOf('numbers') >= 0) out.confidence = 'low';      // අංක මදි → වැරදි ප්‍රතිඵලයක් එන්න පුළුවන්
    else if (out.missing.length) out.confidence = 'medium';
    else out.confidence = 'high';

    /* ⚠️ draw අංකය **අනුමාන කළා** නම් (keyword එකක් නැතුව) — 'high' නොකර 'medium'.
       හේතුව: වැරදි draw එකක් ගත්තොත් ඒක **වැරදි ප්‍රතිඵලයක්** දෙනවා. 'medium'
       නම් app එකෙන් user ට තහවුරු කරන්න කියනවා (වැරදි ප්‍රතිඵලයක් කෙලින්ම නොපෙන්නයි). */
    if (out.drawGuessed && out.confidence === 'high') out.confidence = 'medium';
    if (out.drawGuessed) out.notes.push('drawNo-guessed');

    return out;
  }

  /* ====================================================================== */
  /* 8. උපකාරක: QR එක ලොතරැයි එකක්ද?                                           */
  /* ====================================================================== */

  const LOTTERY_MARKER = new RegExp(
    LOTTERY_HINTS.reduce((acc, h) => acc.concat(h.keys), []).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') +
    '|LOTTERY|ලොතරැ|NLB|DLB|DRAW|DRAWNO|TI\\s?KAT|ටිකට්', 'i');

  /**
   * ⚠️ හුදෙක් "URL එකක්" හෝ "JSON එකක්" කියන එකෙන් ලොතරැයි QR එකක් කියලා
   * හිතන්න බෑ — YouTube link එකකුත් URL එකක්. ඒ නිසා **සාක්ෂි** ඕන.
   */
  function looksLikeLottery(raw, parsed) {
    const s = String(raw || '');
    if (LOTTERY_MARKER.test(s)) return true;
    if (!parsed) return false;

    if (parsed.slug || parsed.drawNo || parsed.zodiac || parsed.superNumber || parsed.serial) return true;

    const kw = /(DRAW|LOTTERY|TICKET|SERIAL|SPECIAL|NUMBERS|COMBO|ලොතරැ|ටිකට්)\s*[:=#|]/i.test(s);
    const pairs = (parsed.pairs || []).length;
    if (kw && pairs >= 2) return true;
    if (parsed.date && pairs >= 2) return true;
    if (/(json|url)/.test(parsed.format) && pairs >= 3) return true;
    return false;
  }

  return {
    parse: parse,
    zodiacNormalize: zodiacNormalize,
    ZODIAC: ZODIAC,
    slugFromText: slugFromText,
    looksLikeLottery: looksLikeLottery,
    findDate: findDate,
    version: '1.0.0',
  };
});
