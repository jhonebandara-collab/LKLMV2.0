/* ==========================================================================
 * announce.js — 🔊 දිනුම් ප්‍රතිඵලය ශබ්දයෙන් දන්වන වාක්‍ය (grammar හරියටම)
 * ==========================================================================
 *
 * 🎯 ඇයි මේක ඕන?
 *   කලින් ශබ්දයෙන් කිව්වේ "You have won 40 Rupees! Congratulations!" —
 *   ඉලක්කම් ටික තනියම කියවද්දී ඇහෙන්නේ "forty" නෙවෙයි, "four zero" වගේ
 *   අවුල් එකක්. ඒ නිසා **මුදල වචන වලින්** කියනවා:
 *
 *     🏆 දිනුමක්  → "Congratulations! You have won forty rupees."
 *     🎉 ලොකු දිනුමක් → "Congratulations! You have won twenty million rupees."
 *     😔 දිනුමක් නෑ → "Sorry, you have lost this time. Try again."
 *     ❓ මුදල නොදන්නා විට → "Congratulations! You have won a prize.
 *                            Please check the official results."
 *
 * ⚠️ Grammar සටහන්:
 *   · "rupee" (රු. 1) / "rupees" (රු. 2+) — ඒක වෙන වෙනම හදනවා
 *   · "one hundred and fifty" · "two thousand and five" — British/SL රටාව
 *     (අන්තිම කොටසට කලින් "and" එකක් — ස්වභාවිකව ඇහෙන්න)
 *   · "You have lost" (not "You have lose") ✅
 *   · ටයර් එකක් තියෙනවා නම් දෙවෙනි වාක්‍යයක් විදිහට කියනවා
 *
 * API:
 *   LKMAnnounce.inWords(40)              → 'forty'
 *   LKMAnnounce.rupees(20000000)         → 'twenty million rupees'
 *   LKMAnnounce.winSentence(40, '3rd')   → 'Congratulations! You have won forty rupees. That is the 3rd prize.'
 *   LKMAnnounce.loseSentence()           → 'Sorry, you have lost this time. Try again.'
 *   LKMAnnounce.forResult(result, opts)  → වාක්‍ය + chime type
 * ========================================================================== */

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;      // Node (test)
  if (typeof window !== 'undefined') window.LKMAnnounce = api;                 // Browser
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
    'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const SCALES = ['', ' thousand', ' million', ' billion', ' trillion'];

  /** 0-999 වචන වලින් — "250" → "two hundred and fifty" (British/SL රටාව) */
  function below1000(n) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    let rest = '';
    if (r) {
      if (r < 20) rest = ONES[r];
      else {
        const t = Math.floor(r / 10), o = r % 10;
        rest = TENS[t] + (o ? ' ' + ONES[o] : '');
      }
    }
    if (!h) return rest;
    return ONES[h] + ' hundred' + (rest ? ' and ' + rest : '');
  }

  /**
   * පූර්ණ සංඛ්‍යාවක් වචන වලින් — "1,250" → "one thousand two hundred and fifty"
   * 📌 Sri Lankan / British රටාව: අන්තිම කොටසට කලින් "and" එකක්.
   */
  function inWords(value) {
    let n = Number(value);
    if (isNaN(n)) return '';
    if (!isFinite(n)) return '';
    const neg = n < 0;
    n = Math.abs(Math.round(n));
    if (n === 0) return 'zero';

    // කොටස් 3 බැගින් වෙන් කරනවා (thousand / million / billion)
    const groups = [];
    while (n > 0) { groups.push(n % 1000); n = Math.floor(n / 1000); }

    const chunks = [];
    for (let i = groups.length - 1; i >= 0; i--) {
      if (!groups[i]) continue;
      chunks.push({ text: below1000(groups[i]), scale: i });
    }

    /* කොටස් එකතු කරනවා. අන්තිම කොටස **100ට අඩු** නම් ඒකට කලින් "and" එකක් දානවා
       (British/SL රටාව):
        1,005 → "one thousand and five" ✅
        1,250 → "one thousand two hundred and fifty" ✅ (hundred එක ඇතුළේ "and" තියෙනවා)
        20,000,000 → "twenty million" ✅ */
    let out = '';
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const isLast = (i === chunks.length - 1);
      const needAnd = isLast && i > 0 && groups[c.scale] < 100;
      out += (out ? (needAnd ? ' and ' : ' ') : '') + c.text + SCALES[c.scale];
    }
    return (neg ? 'minus ' : '') + out;
  }

  /** "forty rupees" · "one rupee" (එකකට ඒක වචනය වෙනස්) */
  function rupees(amount) {
    const n = Number(amount);
    if (isNaN(n) || !isFinite(n)) return '';
    const abs = Math.abs(Math.round(n));
    return inWords(abs) + (abs === 1 ? ' rupee' : ' rupees');
  }

  /**
   * 🏆 දිනුම් වාක්‍යය.
   * @param {number} amount  මුදල (Rs). null/0 නම් "a prize" කියලා කියනවා
   * @param {string} [tier]  ටයර් එකේ නම (උදා: "3rd prize") — optional
   * @param {string} [lotteryName] ලොතරැයියේ නම — optional
   */
  function winSentence(amount, tier, lotteryName) {
    const amt = Number(amount);
    let base;
    if (!isNaN(amt) && amt > 0) {
      base = 'Congratulations! You have won ' + rupees(amt) + '.';
    } else {
      base = 'Congratulations! You have won a prize.';
    }
    // ටයර් එක තියෙනවා නම් (ඉලක්කම් නැති) සරල වාක්‍යයක් විදිහට
    /* ලොතරැයියේ නම **වාක්‍යය ඇතුළේ** කියනවා — "…won twenty million rupees in Mahajana Sampatha."
       (සිංහල/දෙමළ නම් කියවද්දී අවුල් යන නිසා ඉංග්‍රීසි අකුරු නම් විතරයි) */
    let lot = '';
    const nm = String(lotteryName || '').trim();
    if (nm && /^[\x20-\x7E]+$/.test(nm) && nm.length <= 32) lot = ' in ' + nm;

    /* ටයර් එක "3rd" / "1st prize" වගේ **ordinal** එකක් නම් විතරයි වාක්‍යයක් එකතු කරන්නේ.
       ("Last 4 Numbers Correct" වගේ විස්තර නම් audible වාක්‍යයට හරියන්නේ නෑ → skip) */
    let extra = '';
    const tiers = String(tier || '').trim().replace(/\s+/g, ' ');
    if (/^\d+\s*(st|nd|rd|th)(\s+prize)?$/i.test(tiers)) {
      // ශබ්දයෙන් කියද්දී "3RD" නරකට ඇහෙන නිසා පොඩි අකුරු වලට ("3rd")
      extra = ' That is the ' + tiers.replace(/\s+prize$/i, '').toLowerCase() + ' prize.';
    }

    if (!isNaN(amt) && amt > 0) return 'Congratulations! You have won ' + rupees(amt) + lot + '.' + extra;
    return base + extra + ' Please check the official results.';
  }

  /** 😔 පරාද වුනාම */
  function loseSentence() {
    return 'Sorry, you have lost this time. Try again.';
  }

  /** ❓ ප්‍රතිඵලය ගණනය කරන්න බැරි වුනාම (drawn නෑ / දත්ත නෑ) */
  function unknownSentence() {
    return 'The result for this ticket is not available yet. Please check again later.';
  }

  /**
   * ප්‍රතිඵලයේ object එකකින් කියන්න ඕන වාක්‍යය + ශබ්ද වර්ගය.
   * @param {object} d  server එකේ /api/check පිළිතුර (won, prizeAmountRs, prizeLabel, unavailable...)
   * @returns {{text:string, chime:'win'|'lose'|'none'}}
   */
  function forResult(d) {
    if (!d) return { text: unknownSentence(), chime: 'none' };
    if (d.unavailable) return { text: unknownSentence(), chime: 'none' };
    const lotteryName = (d.lottery && (d.lottery.name || d.lottery.nameSi)) || null;
    if (d.won) {
      return { text: winSentence(d.prizeAmountRs, d.prizeLabel || d.tier, lotteryName), chime: 'win' };
    }
    return { text: loseSentence(), chime: 'lose' };
  }

  return {
    inWords: inWords,
    rupees: rupees,
    winSentence: winSentence,
    loseSentence: loseSentence,
    unknownSentence: unknownSentence,
    forResult: forResult,
    version: '1.0.0',
  };
});
