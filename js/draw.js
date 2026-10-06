/* キャラクター描画エンジン：spec（部品の組み合わせ）→ SVG。画像生成APIは使わない。 */
const Draw = (() => {
  const hsl = (h, s, l) => `hsl(${Math.round(((h % 360) + 360) % 360)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
  const hsla = (h, s, l, a) => `hsla(${Math.round(((h % 360) + 360) % 360)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;

  /* ---- ボディ形状。座標系 400x520、地面 y≈445 ---- */
  const SHAPES = {
    blob: { top: 222, bottom: 438, ear: { dx: 70, y: 246 }, face: { cy: 318, w: 190 }, head: 118, arm: { sx: 104, y: 386 }, belly: { cy: 398, rx: 72, ry: 40 },
      draw: a => `<ellipse cx="200" cy="330" rx="118" ry="108" ${a}/>` },
    egg: { top: 200, bottom: 445, ear: { dx: 55, y: 232 }, face: { cy: 330, w: 170 }, head: 100, arm: { sx: 116, y: 392 }, belly: { cy: 410, rx: 72, ry: 38 },
      draw: a => `<path d="M200,200 C285,200 322,310 322,365 C322,425 270,445 200,445 C130,445 78,425 78,365 C78,310 115,200 200,200 Z" ${a}/>` },
    bean: { top: 170, bottom: 445, ear: { dx: 55, y: 192 }, face: { cy: 262, w: 150 }, head: 82, arm: { sx: 78, y: 372 }, belly: { cy: 392, rx: 54, ry: 52 },
      draw: a => `<rect x="118" y="170" width="164" height="275" rx="82" ${a}/>` },
    drop: { top: 165, bottom: 448, ear: { dx: 42, y: 224 }, face: { cy: 345, w: 190 }, head: 112, arm: { sx: 110, y: 392 }, belly: { cy: 420, rx: 66, ry: 34 },
      draw: a => `<path d="M200,165 C230,215 322,290 322,365 C322,425 270,448 200,448 C130,448 78,425 78,365 C78,290 170,215 200,165 Z" ${a}/>` },
    box: { top: 235, bottom: 445, ear: { dx: 62, y: 244 }, face: { cy: 330, w: 170 }, head: 105, arm: { sx: 104, y: 382 }, belly: { cy: 412, rx: 68, ry: 36 },
      draw: a => `<rect x="95" y="235" width="210" height="210" rx="64" ${a}/>` },
    cloud: { top: 208, bottom: 445, ear: { dx: 40, y: 224 }, face: { cy: 322, w: 190 }, head: 118, arm: { sx: 116, y: 376 }, belly: { cy: 412, rx: 64, ry: 34 }, noFeet: true,
      draw: a => [[200, 300, 86], [135, 345, 62], [265, 345, 62], [165, 275, 56], [238, 272, 58], [200, 385, 62], [150, 395, 48], [250, 395, 48]]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${a}/>`).join('') }
  };
  Object.values(SHAPES).forEach(S => { S.neck = S.face.cy + 58; });

  /* ---- 手に持つアイテム（原点中心・約56px） ---- */
  const ITEMS = {
    magnifier: (L, A) => `<circle cx="-4" cy="-6" r="20" fill="#e6f6ff" fill-opacity=".8" stroke="${L}" stroke-width="5"/><line x1="10" y1="10" x2="30" y2="30" stroke="${L}" stroke-width="10" stroke-linecap="round"/><line x1="10" y1="10" x2="30" y2="30" stroke="${A}" stroke-width="4" stroke-linecap="round"/>`,
    scroll: (L, A) => `<rect x="-22" y="-28" width="44" height="56" rx="5" fill="#fff6dc" stroke="${L}" stroke-width="4"/><rect x="-26" y="-32" width="52" height="9" rx="4.5" fill="${A}" stroke="${L}" stroke-width="3.5"/><rect x="-26" y="23" width="52" height="9" rx="4.5" fill="${A}" stroke="${L}" stroke-width="3.5"/><path d="M-12,-10 H12 M-12,0 H12 M-12,10 H4" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`,
    coin: (L) => `<circle r="26" fill="#ffd24a" stroke="${L}" stroke-width="4.5"/><circle r="18" fill="none" stroke="#d99a00" stroke-width="3"/><text x="0" y="9" text-anchor="middle" font-size="24" font-weight="800" fill="#b57a00" font-family="sans-serif">¥</text>`,
    moon: (L) => `<path d="M10,-28 A28,28 0 1 0 10,28 A22,22 0 1 1 10,-28 Z" fill="#ffe28a" stroke="${L}" stroke-width="4.5" stroke-linejoin="round"/>`,
    onigiri: (L) => `<path d="M0,-28 Q9,-28 28,18 Q31,30 20,30 L-20,30 Q-31,30 -28,18 Q-9,-28 0,-28 Z" fill="#fff" stroke="${L}" stroke-width="4.5" stroke-linejoin="round"/><path d="M-14,12 H14 L17,30 H-17 Z" fill="#2c3a30"/>`,
    controller: (L, A) => `<rect x="-30" y="-17" width="60" height="34" rx="16" fill="#6c7088" stroke="${L}" stroke-width="4.5"/><path d="M-17,-6 v12 M-23,0 h12" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="14" cy="-3" r="4.5" fill="${A}"/><circle cx="22" cy="5" r="4.5" fill="#fff"/>`,
    paw: (L, A) => `<ellipse cx="0" cy="9" rx="17" ry="14" fill="${A}" stroke="${L}" stroke-width="4"/>` + [[-19, -8], [-7, -20], [7, -20], [19, -8]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6.5" ry="8.5" fill="${A}" stroke="${L}" stroke-width="3.5"/>`).join(''),
    lantern: (L) => `<path d="M-10,-30 Q0,-42 10,-30" fill="none" stroke="${L}" stroke-width="4" stroke-linecap="round"/><rect x="-16" y="-28" width="32" height="8" rx="3" fill="${L}"/><rect x="-18" y="-20" width="36" height="42" rx="9" fill="#ffd460" stroke="${L}" stroke-width="4"/><ellipse cx="0" cy="2" rx="7" ry="11" fill="#fff6c8"/><rect x="-14" y="22" width="28" height="7" rx="3" fill="${L}"/>`,
    heart: (L) => `<path d="M0,26 C-36,0 -24,-28 -9,-22 C-3,-20 0,-13 0,-13 C0,-13 3,-20 9,-22 C24,-28 36,0 0,26 Z" fill="#ff6f91" stroke="${L}" stroke-width="4.5" stroke-linejoin="round"/>`,
    key: (L, A) => `<circle cx="-12" cy="-10" r="13" fill="#ffd24a" stroke="${L}" stroke-width="4.5"/><circle cx="-12" cy="-10" r="5" fill="${L}"/><path d="M-3,0 L24,26 M14,16 l7,-7 M21,23 l7,-7" stroke="${L}" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M-3,0 L24,26 M14,16 l7,-7 M21,23 l7,-7" stroke="#ffd24a" stroke-width="4" stroke-linecap="round" fill="none"/>`,
    book: (L, A) => `<rect x="-26" y="-24" width="52" height="46" rx="5" fill="${A}" stroke="${L}" stroke-width="4.5"/><rect x="-20" y="-18" width="40" height="34" rx="2" fill="#fff8e8"/><path d="M0,-18 V16" stroke="${L}" stroke-width="3"/><path d="M-14,-8 h8 M-14,0 h8 M6,-8 h8 M6,0 h8" stroke="${L}" stroke-width="2.6" stroke-linecap="round"/>`,
    compass: (L, A) => `<circle r="26" fill="#fff" stroke="${L}" stroke-width="4.5"/><g transform="rotate(35)"><path d="M0,-19 L7,0 L-7,0 Z" fill="${A}"/><path d="M0,19 L7,0 L-7,0 Z" fill="${L}" opacity=".75"/></g><circle r="3" fill="${L}"/>`,
    mic: (L) => `<circle cx="0" cy="-12" r="16" fill="#8f94ab" stroke="${L}" stroke-width="4.5"/><path d="M-10,-16 H10 M-11,-9 H11" stroke="#fff" stroke-width="2.4" opacity=".8"/><rect x="-6" y="3" width="12" height="28" rx="5" fill="${L}"/>`,
    brush: (L, A) => `<g transform="rotate(35)"><rect x="-8" y="-30" width="16" height="48" rx="3" fill="#ffd24a" stroke="${L}" stroke-width="4"/><rect x="-8" y="-30" width="16" height="9" rx="3" fill="${A}" stroke="${L}" stroke-width="3.5"/><path d="M-8,18 L0,32 L8,18 Z" fill="#f6d9ae" stroke="${L}" stroke-width="3.5" stroke-linejoin="round"/></g>`,
    mug: (L) => `<path d="M16,-4 h6 a9,9 0 0 1 0,18 h-6" fill="none" stroke="${L}" stroke-width="5"/><rect x="-20" y="-14" width="38" height="38" rx="8" fill="#fff" stroke="${L}" stroke-width="4.5"/><ellipse cx="-1" cy="-8" rx="15" ry="4" fill="#9a6a3e"/><path d="M-8,-22 q4,-6 0,-12 M4,-22 q4,-6 0,-12" stroke="${L}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`,
    bulb: (L) => `<circle cx="0" cy="-8" r="19" fill="#ffe86b" stroke="${L}" stroke-width="4.5"/><rect x="-9" y="9" width="18" height="14" rx="3" fill="#aeb2c4" stroke="${L}" stroke-width="3.5"/><path d="M-28,-8 h-5 M28,-8 h5 M-20,-28 l-4,-4 M20,-28 l4,-4" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`,
    dumbbell: (L, A) => `<rect x="-24" y="-5" width="48" height="10" rx="3" fill="#aab0c4" stroke="${L}" stroke-width="3.5"/><rect x="-32" y="-18" width="12" height="36" rx="4" fill="${A}" stroke="${L}" stroke-width="4"/><rect x="20" y="-18" width="12" height="36" rx="4" fill="${A}" stroke="${L}" stroke-width="4"/>`,
    planet: (L, A) => `<circle r="19" fill="${A}" stroke="${L}" stroke-width="4.5"/><ellipse rx="34" ry="9" transform="rotate(-22)" fill="none" stroke="${L}" stroke-width="4.5"/><ellipse rx="34" ry="9" transform="rotate(-22)" fill="none" stroke="#fff" stroke-width="1.8" opacity=".7"/>`
  };

  /* ---- 耳・頭上モチーフ ---- */
  function earsMarkup(spec, S, C) {
    const L = C.line, B = C.body, P = C.inner, A = C.accent, e = S.ear, ty = S.top;
    const right = (fn) => fn(200 + e.dx, e.y);
    const pair = (fn) => `${right(fn)}<g transform="translate(400,0) scale(-1,1)">${right(fn)}</g>`;
    const sw = `stroke="${L}" stroke-width="7" stroke-linejoin="round"`;
    switch (spec.ears) {
      case 'cat': return pair((ax, ay) => `<path d="M${ax - 30},${ay + 22} L${ax + 6},${ay - 60} L${ax + 40},${ay + 14} Z" fill="${B}" ${sw}/><path d="M${ax - 14},${ay + 10} L${ax + 8},${ay - 36} L${ax + 26},${ay + 8} Z" fill="${P}"/>`);
      case 'round': return pair((ax, ay) => `<circle cx="${ax + 12}" cy="${ay - 6}" r="32" fill="${B}" ${sw}/><circle cx="${ax + 12}" cy="${ay - 6}" r="17" fill="${P}"/>`);
      case 'long': return pair((ax, ay) => `<ellipse cx="${ax + 8}" cy="${ay - 62}" rx="22" ry="64" transform="rotate(10 ${ax + 8} ${ay - 62})" fill="${B}" ${sw}/><ellipse cx="${ax + 8}" cy="${ay - 58}" rx="10" ry="46" transform="rotate(10 ${ax + 8} ${ay - 58})" fill="${P}"/>`);
      case 'horn': return pair((ax, ay) => `<path d="M${ax - 16},${ay + 16} Q${ax + 2},${ay - 34} ${ax + 34},${ay - 54} Q${ax + 36},${ay - 6} ${ax + 22},${ay + 20} Z" fill="${C.horn}" ${sw}/>`);
      case 'antenna': return pair((ax, ay) => `<path d="M${ax - 6},${ay + 10} Q${ax + 4},${ay - 30} ${ax + 22},${ay - 58}" fill="none" stroke="${L}" stroke-width="11" stroke-linecap="round"/><path d="M${ax - 6},${ay + 10} Q${ax + 4},${ay - 30} ${ax + 22},${ay - 58}" fill="none" stroke="${B}" stroke-width="5" stroke-linecap="round"/><circle cx="${ax + 23}" cy="${ay - 62}" r="11" fill="${A}" stroke="${L}" stroke-width="6"/>`);
      case 'sprout': return `<path d="M200,${ty + 8} Q196,${ty - 14} 200,${ty - 34}" fill="none" stroke="${L}" stroke-width="12" stroke-linecap="round"/><path d="M200,${ty + 8} Q196,${ty - 14} 200,${ty - 34}" fill="none" stroke="#6bbf59" stroke-width="5.5" stroke-linecap="round"/><path d="M200,${ty - 30} Q232,${ty - 66} 262,${ty - 40} Q238,${ty - 18} 200,${ty - 30} Z" fill="#7cd36a" ${sw}/><path d="M200,${ty - 30} Q172,${ty - 62} 148,${ty - 42} Q168,${ty - 20} 200,${ty - 30} Z" fill="#8be07a" ${sw}/>`;
      case 'flame': return `<path d="M200,${ty + 10} C158,${ty - 4} 168,${ty - 40} 192,${ty - 62} C190,${ty - 40} 204,${ty - 40} 206,${ty - 70} C236,${ty - 44} 246,${ty - 6} 200,${ty + 10} Z" fill="${C.flame}" ${sw}/><path d="M200,${ty + 4} C180,${ty - 6} 188,${ty - 26} 200,${ty - 38} C214,${ty - 24} 220,${ty - 8} 200,${ty + 4} Z" fill="#ffe27a"/>`;
      default: return '';
    }
  }

  function tailMarkup(spec, S, C) {
    const L = C.line, B = C.body, sx = S.arm.sx, by = S.bottom;
    const sw = `stroke="${L}" stroke-width="7" stroke-linejoin="round"`;
    switch (spec.tail) {
      case 'fluffy': return `<g transform="rotate(-28 ${200 + sx + 16} ${by - 48})"><ellipse cx="${200 + sx + 24}" cy="${by - 48}" rx="42" ry="26" fill="${B}" ${sw}/><ellipse cx="${200 + sx + 50}" cy="${by - 48}" rx="16" ry="18" fill="${C.belly}"/></g>`;
      case 'curl': return `<path d="M${200 + sx - 6},${by - 20} C${200 + sx + 70},${by - 10} ${200 + sx + 70},${by - 110} ${200 + sx + 26},${by - 104}" fill="none" stroke="${L}" stroke-width="28" stroke-linecap="round"/><path d="M${200 + sx - 6},${by - 20} C${200 + sx + 70},${by - 10} ${200 + sx + 70},${by - 110} ${200 + sx + 26},${by - 104}" fill="none" stroke="${B}" stroke-width="15" stroke-linecap="round"/>`;
      case 'leaf': return `<g transform="rotate(-20 ${200 + sx} ${by - 30})"><path d="M${200 + sx - 10},${by - 30} Q${200 + sx + 36},${by - 100} ${200 + sx + 80},${by - 70} Q${200 + sx + 50},${by - 20} ${200 + sx - 10},${by - 30} Z" fill="#7cd36a" ${sw}/><path d="M${200 + sx},${by - 34} Q${200 + sx + 40},${by - 62} ${200 + sx + 68},${by - 68}" fill="none" stroke="${L}" stroke-width="3.5" stroke-linecap="round"/></g>`;
      default: return '';
    }
  }

  /* ---- 目・眉・口 ---- */
  function eye(kind, x, y, s, C) {
    const L = C.line, P = (dx, dy) => `${(x + s * dx).toFixed(1)},${(y + dy).toFixed(1)}`;
    switch (kind) {
      case 'round': return `<ellipse cx="${x}" cy="${y}" rx="15" ry="19" fill="${L}"/><circle cx="${x + 5}" cy="${y - 7}" r="6" fill="#fff"/><circle cx="${x - 4}" cy="${y + 7}" r="3" fill="#fff"/>`;
      case 'sleepy': return `<path d="M${P(-14, 0)} L${P(14, 0)} A14,14 0 0 ${s > 0 ? 1 : 0} ${P(-14, 0)} Z" fill="${L}"/><path d="M${P(-17, -1)} L${P(17, -1)}" stroke="${L}" stroke-width="5" stroke-linecap="round"/><circle cx="${x + 3}" cy="${y + 5}" r="2.6" fill="#fff"/>`;
      case 'sharp': return `<path d="M${P(-17, 5)} Q${P(0, -12)} ${P(17, -7)} Q${P(2, 12)} ${P(-17, 5)} Z" fill="${L}"/><circle cx="${x + 2}" cy="${y - 1}" r="3.6" fill="#fff"/>`;
      case 'sparkle': return `<path d="M${x},${y - 20} Q${x + 3},${y - 3} ${x + 20},${y} Q${x + 3},${y + 3} ${x},${y + 20} Q${x - 3},${y + 3} ${x - 20},${y} Q${x - 3},${y - 3} ${x},${y - 20} Z" fill="${L}"/><circle cx="${x}" cy="${y}" r="4.5" fill="#fff"/>`;
      default: return `<ellipse cx="${x}" cy="${y}" rx="9" ry="12" fill="${L}"/><circle cx="${x + 2.6}" cy="${y - 4.5}" r="3" fill="#fff"/>`;
    }
  }
  function brow(kind, x, y, s, C) {
    const L = C.line;
    if (kind === 'soft') return `<path d="M${x - 13},${y - 28} Q${x},${y - 36} ${x + 13},${y - 28}" fill="none" stroke="${L}" stroke-width="4.5" stroke-linecap="round"/>`;
    if (kind === 'strong') return `<path d="M${x - s * 12},${y - 25} L${x + s * 13},${y - 34}" stroke="${L}" stroke-width="5.5" stroke-linecap="round"/>`;
    if (kind === 'worried') return `<path d="M${x - s * 12},${y - 34} L${x + s * 13},${y - 26}" stroke="${L}" stroke-width="5" stroke-linecap="round"/>`;
    return '';
  }
  function mouth(kind, my, C) {
    const L = C.line, st = `fill="none" stroke="${L}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`;
    switch (kind) {
      case 'cat': return `<path d="M200,${my - 2} Q191,${my + 11} 182,${my + 1} M200,${my - 2} Q209,${my + 11} 218,${my + 1}" ${st}/>`;
      case 'flat': return `<path d="M189,${my + 4} L211,${my + 4}" ${st}/>`;
      case 'open': return `<path d="M185,${my - 3} Q200,${my + 28} 215,${my - 3} Z" fill="${L}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="200" cy="${my + 12}" rx="8" ry="5" fill="#ff8aa0"/>`;
      case 'fang': return `<path d="M186,${my} Q200,${my + 14} 214,${my}" ${st}/><path d="M203,${my + 6} L209,${my + 17} L213,${my + 3} Z" fill="#fff" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>`;
      case 'tiny': return `<ellipse cx="200" cy="${my + 4}" rx="5.5" ry="4.5" fill="${L}"/>`;
      default: return `<path d="M186,${my} Q200,${my + 15} 214,${my}" ${st}/>`;
    }
  }

  /* ---- 帽子・ヘッドギア ---- */
  function headgear(spec, S, C, defsId) {
    const L = C.line, A = C.accent, ty = S.top, k = spec.hat, sw = `stroke="${L}" stroke-width="6.5" stroke-linejoin="round"`;
    switch (k) {
      case 'beret': return `<g transform="rotate(-9 200 ${ty + 6})"><ellipse cx="204" cy="${ty + 6}" rx="76" ry="29" fill="${A}" ${sw}/><circle cx="207" cy="${ty - 22}" r="7" fill="${A}" ${sw}/></g>`;
      case 'cap': return `<path d="M${200 - 64},${ty + 34} Q200,${ty - 54} ${200 + 64},${ty + 34} Z" fill="${A}" ${sw}/><path d="M${200 + 8},${ty + 30} Q${200 + 92},${ty + 14} ${200 + 100},${ty + 36} L${200 + 8},${ty + 40} Z" fill="${A}" ${sw}/><circle cx="200" cy="${ty - 14}" r="5" fill="${L}"/>`;
      case 'nightcap': return `<path d="M${200 - 64},${ty + 38} Q${200 - 30},${ty - 52} ${200 + 70},${ty - 22} Q${200 + 112},${ty - 8} ${200 + 112},${ty + 18} Q${200 + 62},${ty + 8} ${200 + 64},${ty + 38} Z" fill="${A}" ${sw}/><circle cx="${200 + 116}" cy="${ty + 24}" r="14" fill="#fff" ${sw}/><path d="M${200 - 64},${ty + 38} Q200,${ty + 20} ${200 + 64},${ty + 38}" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/>`;
      case 'tophat': return `<rect x="${200 - 42}" y="${ty - 56}" width="84" height="78" rx="7" fill="${L}"/><rect x="${200 - 42}" y="${ty - 6}" width="84" height="16" fill="${A}"/><ellipse cx="200" cy="${ty + 22}" rx="74" ry="13" fill="${L}"/>`;
      case 'headphones': {
        const hw = S.head, cy = S.face.cy - 6, peak = ty - 12, yc = (peak - 0.25 * cy) / 0.75;
        return `<path d="M${200 - hw},${cy} C${200 - hw},${yc} ${200 + hw},${yc} ${200 + hw},${cy}" fill="none" stroke="${L}" stroke-width="15" stroke-linecap="round"/><path d="M${200 - hw},${cy} C${200 - hw},${yc} ${200 + hw},${yc} ${200 + hw},${cy}" fill="none" stroke="${A}" stroke-width="6" stroke-linecap="round"/><rect x="${200 - hw - 15}" y="${cy - 26}" width="30" height="52" rx="14" fill="${A}" ${sw}/><rect x="${200 + hw - 15}" y="${cy - 26}" width="30" height="52" rx="14" fill="${A}" ${sw}/>`;
      }
      case 'flower': { const fx = 200 + S.ear.dx * 0.9, fy = S.ear.y + 6;
        return `<g transform="translate(${fx} ${fy})">${[0, 72, 144, 216, 288].map(r => `<ellipse cx="0" cy="-13" rx="9" ry="13" transform="rotate(${r})" fill="${A}" stroke="${L}" stroke-width="4"/>`).join('')}<circle r="7.5" fill="#ffe27a" stroke="${L}" stroke-width="3.5"/></g>`; }
      case 'ribbon': { const rx = 200 + S.ear.dx * 0.95, ry = S.ear.y + 4;
        return `<g transform="translate(${rx} ${ry}) rotate(-12)"><path d="M0,0 L-34,-20 L-34,20 Z M0,0 L34,-20 L34,20 Z" fill="${A}" ${sw}/><circle r="9" fill="${A}" ${sw}/></g>`; }
      default: return '';
    }
  }

  function neckwear(spec, S, C) {
    const L = C.line, A = C.accent, ny = S.neck, sx = S.arm.sx;
    switch (spec.neck) {
      case 'scarf': return `<path d="M${200 - sx - 20},${ny} Q200,${ny + 36} ${200 + sx + 20},${ny}" fill="none" stroke="${L}" stroke-width="32" stroke-linecap="round"/><path d="M${200 - sx - 20},${ny} Q200,${ny + 36} ${200 + sx + 20},${ny}" fill="none" stroke="${A}" stroke-width="22" stroke-linecap="round"/><path d="M${200 + 22},${ny + 14} Q${200 + 40},${ny + 28} ${200 + 58},${ny + 16} L${200 + 68},${ny + 64} Q${200 + 50},${ny + 76} ${200 + 32},${ny + 68} Z" fill="${A}" stroke="${L}" stroke-width="6.5" stroke-linejoin="round"/>`;
      case 'bowtie': return `<path d="M200,${ny + 6} L162,${ny - 14} L162,${ny + 26} Z M200,${ny + 6} L238,${ny - 14} L238,${ny + 26} Z" fill="${A}" stroke="${L}" stroke-width="6" stroke-linejoin="round"/><circle cx="200" cy="${ny + 6}" r="9" fill="${A}" stroke="${L}" stroke-width="5.5"/>`;
      case 'bell': return `<path d="M${200 - 62},${ny - 2} Q200,${ny + 30} ${200 + 62},${ny - 2}" fill="none" stroke="${L}" stroke-width="15" stroke-linecap="round"/><path d="M${200 - 62},${ny - 2} Q200,${ny + 30} ${200 + 62},${ny - 2}" fill="none" stroke="${A}" stroke-width="8" stroke-linecap="round"/><circle cx="200" cy="${ny + 24}" r="12" fill="#ffd24a" stroke="${L}" stroke-width="5"/><path d="M193,${ny + 24} h14" stroke="${L}" stroke-width="3"/>`;
      default: return '';
    }
  }

  function glasses(spec, S, C, ex, ey) {
    const L = C.line; if (spec.glasses === 'none') return '';
    const stroke = `fill="#ffffff" fill-opacity=".22" stroke="${L}" stroke-width="5"`;
    if (spec.glasses === 'round') return `<circle cx="${200 - ex}" cy="${ey}" r="27" ${stroke}/><circle cx="${200 + ex}" cy="${ey}" r="27" ${stroke}/><path d="M${200 - ex + 27},${ey} Q200,${ey - 8} ${200 + ex - 27},${ey}" fill="none" stroke="${L}" stroke-width="5"/>`;
    return `<rect x="${200 - ex - 27}" y="${ey - 22}" width="54" height="44" rx="11" ${stroke}/><rect x="${200 + ex - 27}" y="${ey - 22}" width="54" height="44" rx="11" ${stroke}/><path d="M${200 - ex + 27},${ey - 6} H${200 + ex - 27}" stroke="${L}" stroke-width="5"/>`;
  }

  function pattern(spec, S, C, rnd) {
    const sh = C.shade, top = S.top, hw = S.head;
    switch (spec.pattern) {
      case 'spots': { let o = ''; for (let i = 0; i < 6; i++) { const x = 200 + (rnd() - 0.5) * hw * 1.9, y = S.bottom - 30 - rnd() * (S.bottom - top) * 0.55; o += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(7 + rnd() * 9).toFixed(0)}" fill="${sh}" opacity=".32"/>`; } return o; }
      case 'stripes': return [0, 1, 2].map(i => `<path d="M${200 - hw - 6},${top + 70 + i * 24} l46,${8}" stroke="${sh}" stroke-width="11" stroke-linecap="round" opacity=".38"/><path d="M${200 + hw + 6},${top + 70 + i * 24} l-46,${8}" stroke="${sh}" stroke-width="11" stroke-linecap="round" opacity=".38"/>`).join('');
      case 'star': { const st = (x, y, r) => `<path d="M${x},${y - r} L${x + r * 0.3},${y - r * 0.3} L${x + r},${y} L${x + r * 0.3},${y + r * 0.3} L${x},${y + r} L${x - r * 0.3},${y + r * 0.3} L${x - r},${y} L${x - r * 0.3},${y - r * 0.3} Z" fill="${C.accent}" opacity=".85"/>`; return st(200 - hw + 30, S.bottom - 70, 12) + st(200 + hw - 34, S.bottom - 96, 9) + st(200 - hw + 58, S.bottom - 38, 7); }
      case 'wave': return [0, 1, 2].map(i => `<path d="M${200 - 70},${S.belly.cy - 14 + i * 14} q17.5,-12 35,0 t35,0 t35,0 t35,0" fill="none" stroke="${C.belly2}" stroke-width="5" stroke-linecap="round" opacity=".9"/>`).join('');
      default: return '';
    }
  }

  /* ---- 本体組み立て ---- */
  function group(spec, uid) {
    if (spec.kind === 'human') return Human.group(spec, uid);
    const S = SHAPES[spec.body], C = spec.colors, L = C.line;
    const rnd = U.rng(spec.seed);
    const outline = `fill="${L}" stroke="${L}" stroke-width="13" stroke-linejoin="round"`;
    const ex = Math.round(S.face.w * 0.22), ey = S.face.cy - 4, my = S.face.cy + 32;
    const sx = S.arm.sx, ay = S.arm.y;
    const parts = [];
    const cp = `cp-${uid}`;

    parts.push(`<defs><clipPath id="${cp}">${S.draw('')}</clipPath></defs>`);
    parts.push(`<ellipse cx="200" cy="${S.bottom + 10}" rx="${sx + 22}" ry="13" fill="#000" opacity=".12"/>`);
    parts.push(tailMarkup(spec, S, C));
    parts.push(earsMarkup(spec, S, C));
    if (!S.noFeet) parts.push([-46, 46].map(dx => `<ellipse cx="${200 + dx}" cy="${S.bottom - 2}" rx="31" ry="17" fill="${C.body}" stroke="${L}" stroke-width="7"/>`).join(''));
    parts.push(S.draw(outline));
    parts.push(S.draw(`fill="${C.body}"`));
    // 陰影・ハイライト・おなか・模様（ボディ内にクリップ）
    parts.push(`<g clip-path="url(#${cp})">
      <ellipse cx="290" cy="${S.bottom + 10}" rx="170" ry="120" fill="${C.shade}" opacity=".30"/>
      ${spec.pattern === 'belly' || spec.pattern === 'wave' ? `<ellipse cx="200" cy="${S.belly.cy}" rx="${S.belly.rx}" ry="${S.belly.ry}" fill="${C.belly}"/>` : ''}
      ${pattern(spec, S, C, rnd)}
      <ellipse cx="${200 - S.head * 0.45}" cy="${S.top + 42}" rx="${S.head * 0.28}" ry="15" transform="rotate(-24 ${200 - S.head * 0.45} ${S.top + 42})" fill="#fff" opacity=".28"/>
    </g>`);
    // 腕（左：下げる or 手を振る）
    const wave = spec.pose === 'wave';
    parts.push(`<g transform="translate(${200 - sx},${ay}) rotate(${wave ? 150 : 20})"><ellipse cx="0" cy="22" rx="19" ry="31" fill="${C.body}" stroke="${L}" stroke-width="7"/></g>`);
    // 持ち物（右手）＋右腕
    const itemFn = ITEMS[spec.item];
    parts.push(`<g transform="translate(${200 + sx},${ay}) rotate(-20)"><ellipse cx="0" cy="22" rx="19" ry="31" fill="${C.body}" stroke="${L}" stroke-width="7"/></g>`);
    if (itemFn) parts.push(`<g transform="translate(${200 + sx + 24},${ay + 34}) rotate(-6)">${itemFn(L, C.accent)}</g><g transform="translate(${200 + sx},${ay}) rotate(-20)"><ellipse cx="0" cy="49" rx="13" ry="12" fill="${C.body}" stroke="${L}" stroke-width="6"/></g>`);
    // 首元
    if (spec.neck !== 'none') parts.push(`<g clip-path="url(#${cp})" style="isolation:isolate">${neckwear({ ...spec, neck: spec.neck === 'scarf' ? 'scarf' : 'none' }, S, C)}</g>`);
    if (spec.neck === 'bowtie' || spec.neck === 'bell') parts.push(neckwear(spec, S, C));
    // 顔
    parts.push(eye(spec.eyes, 200 - ex, ey, -1, C) + eye(spec.eyes, 200 + ex, ey, 1, C));
    parts.push(brow(spec.brows, 200 - ex, ey, -1, C) + brow(spec.brows, 200 + ex, ey, 1, C));
    if (spec.cheeks) parts.push(`<ellipse cx="${200 - ex - 22}" cy="${ey + 26}" rx="13" ry="8" fill="${C.cheek}" opacity=".7"/><ellipse cx="${200 + ex + 22}" cy="${ey + 26}" rx="13" ry="8" fill="${C.cheek}" opacity=".7"/>`);
    parts.push(mouth(spec.mouth, my, C));
    parts.push(glasses(spec, S, C, ex, ey));
    parts.push(headgear(spec, S, C));
    const pr = spec.prop || { x: 1, y: 1 };
    return `<g transform="translate(200 ${S.bottom}) scale(${pr.x} ${pr.y}) translate(-200 ${-S.bottom})">${parts.join('')}</g>`;
  }

  function svg(spec, o = {}) {
    const uid = o.uid || 'c' + Math.random().toString(36).slice(2, 7);
    const bg = o.bg ? `<rect width="400" height="520" fill="${o.bg}"/>` : '';
    const size = o.width ? ` width="${o.width}" height="${o.height || Math.round(o.width * 1.3)}"` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520"${size} role="img" aria-label="${U.esc(o.label || 'あなたのIPキャラクター')}">${bg}${group(spec, uid)}</svg>`;
  }

  return { svg, group, SHAPES, ITEMS, hsl, hsla };
})();
if (typeof module !== 'undefined') module.exports = Draw;
