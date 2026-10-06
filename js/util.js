/* 共通ユーティリティ（APIキー・外部通信なし） */
const U = {
  hash(str) {
    let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return (h1 ^ h2 ^ h3 ^ h4) >>> 0;
  },
  rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
  esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
  /** 重み付き抽選。items: 配列, wf: item→重み */
  wpick(items, wf, rnd) {
    const ws = items.map(it => Math.max(0.05, wf(it)));
    const sum = ws.reduce((a, b) => a + b, 0);
    let r = rnd() * sum;
    for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  },
  pick(items, rnd) { return items[Math.floor(rnd() * items.length)]; },
  /** 全角を考慮せず、文字数で折り返す（日本語向け） */
  wrap(text, n) {
    const out = []; let cur = '';
    for (const ch of Array.from(text)) {
      cur += ch;
      if (Array.from(cur).length >= n) { out.push(cur); cur = ''; }
    }
    if (cur) out.push(cur);
    return out;
  },
  hslCircDist(a, b) { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }
};
if (typeof module !== 'undefined') module.exports = U;
