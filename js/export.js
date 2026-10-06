/* 診断カード(PNG)・立ち絵(透過PNG)・SVG の書き出し。すべてブラウザ内で生成。 */
const Exporter = (() => {
  const FONT = "'Hiragino Sans','Hiragino Kaku Gothic ProN','Yu Gothic UI','Yu Gothic','Meiryo','Noto Sans JP',sans-serif";

  function card(P, vi, nameIdx) {
    const t = Engine.texts(P, vi, nameIdx), spec = P.designs[vi], C = spec.colors, A = P.archetype;
    const W = 1080, H = 1350, E = U.esc;
    const bars = DATA.axes.map((ax, i) => {
      const v = (P.axes[ax.k] + 1) / 2, x = 120, y = 1196 + i * 0; return { ax, v };
    });
    const chips = [];
    if (P.hasBirth) chips.push(P.birth.sign.name, `数秘${P.birth.lp.n}`, P.birth.star.n, `日干 ${P.birth.day.stemName}`);
    else chips.push(DATA.moods[P.tags.mood].label, A.name);
    const chipSvg = chips.slice(0, 4).map((c, i, arr) => {
      const w = Array.from(c).length * 26 + 44, gap = 16;
      const total = arr.reduce((s, x) => s + Array.from(x).length * 26 + 44, 0) + gap * (arr.length - 1);
      let x = (W - total) / 2; for (let k = 0; k < i; k++) x += Array.from(arr[k]).length * 26 + 44 + gap;
      return `<rect x="${x}" y="1166" width="${w}" height="52" rx="26" fill="#fff" opacity=".85"/><text x="${x + w / 2}" y="1201" text-anchor="middle" font-size="26" font-weight="700" fill="#3a3358">${E(c)}</text>`;
    }).join('');
    const tag = U.wrap(t.tagline, 20);
    const tagSvg = tag.map((l, i) => `<text x="540" y="${1100 + i * 44}" text-anchor="middle" font-size="36" font-weight="600" fill="#3a3358">${E(l)}</text>`).join('');
    const nameSize = Array.from(t.n).length > 4 ? 84 : 104;
    const g = Draw.group(spec, 'card');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.bg[0]}"/><stop offset="1" stop-color="${C.bg[1]}"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="540" cy="560" r="400" fill="#fff" opacity=".55"/>
  <circle cx="170" cy="190" r="70" fill="${C.accent}" opacity=".22"/><circle cx="930" cy="330" r="44" fill="${C.accent}" opacity=".28"/><circle cx="900" cy="860" r="96" fill="${C.body}" opacity=".2"/>
  <text x="540" y="92" text-anchor="middle" font-size="26" font-weight="700" letter-spacing="8" fill="#5b5380">YOUR  IP  CHARACTER</text>
  <text x="540" y="136" text-anchor="middle" font-size="30" font-weight="800" fill="#3a3358">あなたのためだけの、IPキャラ</text>
  <g transform="translate(222 150) scale(1.65)">${g}</g>
  <g transform="translate(900 120)"><circle r="72" fill="#fff" opacity=".92"/><text y="-8" text-anchor="middle" font-size="22" font-weight="700" fill="#6a6290">IP設計度</text><text y="42" text-anchor="middle" font-size="56" font-weight="900" fill="#3a3358">${P.score.total}</text></g>
  <text x="540" y="1040" text-anchor="middle" font-size="${nameSize}" font-weight="900" fill="#2b2540">${E(t.n)}</text>
  ${tagSvg}
  ${chipSvg}
  <text x="540" y="1300" text-anchor="middle" font-size="22" fill="#5b5380" opacity=".85">占い × アンケートで設計・世界に一人だけのYouTube用IPキャラ</text>
</svg>`;
  }

  function characterSvg(P, vi, transparent) {
    const spec = P.designs[vi];
    return Draw.svg(spec, { uid: 'ex', width: 800, height: 1040, bg: transparent ? null : '#ffffff' });
  }

  function toPng(svgStr, w, h, scale) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = Math.round(w * scale); c.height = Math.round(h * scale);
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => b ? res(b) : rej(new Error('blob')), 'image/png');
      };
      img.onerror = () => rej(new Error('画像の変換に失敗しました'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    });
  }
  function download(blobOrText, filename, type) {
    const blob = blobOrText instanceof Blob ? blobOrText : new Blob([blobOrText], { type: type || 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  return { card, characterSvg, toPng, download };
})();
