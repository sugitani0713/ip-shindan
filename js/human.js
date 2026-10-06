/* 人型キャラ（アニメ風／美少女／美少年・イケメン／Vtuber風）の設計と描画。
   Picrew型の「パーツ重ね」方式を、診断結果から自動で組み立てる。すべて自前SVG＝ライセンスの心配なし。 */
const Human = (() => {
  const hsl = (h, s, l) => `hsl(${Math.round(((h % 360) + 360) % 360)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
  const SKINS = { fair: ['#ffe6d6', '#f2c4ad'], light: ['#fcd9c0', '#e8b496'], tan: ['#efc19b', '#d19a74'], deep: ['#d9a37c', '#b57c58'] };
  const NATURAL_HAIR = [[232, 18, 14, '黒'], [24, 36, 22, '焦げ茶'], [28, 46, 40, '栗色'], [44, 78, 68, '金髪'], [215, 8, 82, '銀髪']];

  const JA = {
    hairBack: { long: 'ロングヘア', twin: 'ツインテール', pony: 'ポニーテール', bob: 'ボブ', short: 'ショート', wolf: 'ウルフカット' },
    hairFront: { straight: 'ぱっつん前髪', parted: 'センター分け', side: '流し前髪', messy: 'ラフな毛先' },
    eyes: { round: 'ぱっちりした丸い目', tsuri: '凛としたつり目', tare: 'やさしいたれ目', narrow: '切れ長のクールな目' },
    mouth: { smile: 'やわらかな笑み', open: '明るく開いた口', cat: 'ω口', flat: '落ち着いた口元', smirk: '不敵な笑み' },
    outfit: { blazer: 'ブレザー', hoodie: 'パーカー', sweater: 'タートルネックのセーター', sailor: 'セーラー風の制服', kimono: '和装', jacket: 'ストリート系ジャケット' }
  };
  const EN = {
    hairBack: { long: 'long hair', twin: 'twin tails', pony: 'a ponytail', bob: 'a bob cut', short: 'short hair', wolf: 'a layered wolf cut' },
    hairFront: { straight: 'straight blunt bangs', parted: 'center-parted bangs', side: 'side-swept bangs', messy: 'tousled bangs' },
    eyes: { round: 'large round sparkling eyes', tsuri: 'sharp upturned eyes', tare: 'gentle droopy eyes', narrow: 'narrow cool eyes' },
    mouth: { smile: 'a soft smile', open: 'a bright open-mouth smile', cat: 'a playful cat-like smile', flat: 'a calm closed mouth', smirk: 'a confident smirk' },
    outfit: { blazer: 'a blazer with a ribbon or tie', hoodie: 'a hoodie', sweater: 'a turtleneck sweater', sailor: 'a sailor-style uniform', kimono: 'a modern Japanese kimono-style outfit', jacket: 'a streetwear jacket' }
  };

  /* ================= 設計 ================= */
  function design(P, vi, prev) {
    const rnd = U.rng(P.seed + vi * 7919 + 99);
    const a = P.axes, T = P.tags, ints = P.ints.map(i => i.id), g = P.gender, isV = P.styleKind === 'vtuber', male = g === 'm';
    const W = (items, f, avoid) => U.wpick(items, it => f(it) * (avoid && avoid.includes(it) ? 0.05 : 1), rnd);

    const hairBack = W(['long', 'twin', 'pony', 'bob', 'short', 'wolf'], k => (male
      ? { long: 0.3, twin: 0.02, pony: 0.35, bob: 0.4, short: 1.3, wolf: 0.7 + 0.4 * a.q }
      : { long: 1.2, twin: 0.6 + 0.5 * a.e + (isV ? 0.4 : 0), pony: 0.8, bob: 0.8, short: 0.35, wolf: 0.15 })[k], prev.map(p => p.hairBack));
    const hairFront = W(['straight', 'parted', 'side', 'messy'], k => (male
      ? { straight: 0.3, parted: 1, side: 0.8, messy: 0.9 + 0.3 * a.e }
      : { straight: 0.9 + 0.3 * a.w, parted: 1, side: 0.8 + 0.4 * a.q, messy: 0.2 + 0.3 * a.e })[k], prev.map(p => p.hairFront));
    const ahoge = rnd() < 0.2 + 0.2 * a.e + (isV ? 0.15 : 0);

    const eyes = W(['round', 'tsuri', 'tare', 'narrow'], k => ({
      round: (male ? 0.4 : 0.9) + 0.6 * a.w, tsuri: 0.5 - 0.6 * a.w + 0.3 * a.e, tare: 0.5 - 0.5 * a.e + 0.3 * a.w, narrow: 0.3 - 0.5 * a.w - 0.3 * a.h + (male ? 0.5 : 0)
    })[k]);
    const brows = eyes === 'tsuri' || eyes === 'narrow' ? 'straight' : eyes === 'tare' ? 'soft' : (rnd() < 0.5 ? 'soft' : 'straight');
    const mouth = W(['smile', 'open', 'cat', 'flat', 'smirk'], k => ({
      smile: 0.9 + 0.4 * a.w, open: 0.5 + 0.6 * a.e + 0.4 * a.h, cat: 0.4 + 0.4 * a.h, flat: 0.5 - 0.6 * a.h - 0.4 * a.w, smirk: 0.3 - 0.4 * a.w + 0.3 * a.q + (male ? 0.3 : 0)
    })[k]);
    const outfit = W(['blazer', 'hoodie', 'sweater', 'sailor', 'kimono', 'jacket'], k => ({
      blazer: 1 - 0.2 * a.e, hoodie: 0.8 + 0.3 * a.e + (isV ? 0.2 : 0), sweater: 0.8 - 0.3 * a.e, sailor: male ? 0.02 : 0.6,
      kimono: 0.3 + 0.4 * a.q + (ints.includes('history') ? 0.8 : 0), jacket: isV ? 1.3 : 0.4
    })[k]);

    // 小物（描きやすさのため制作スキルで上限）
    const acc = { glasses: 'none', headset: false, animalEars: 'none', ribbon: false, clip: false, earring: false };
    const cand = [];
    if (rnd() < 0.2 + 0.4 * Math.max(0, a.d) + (ints.includes('study') ? 0.25 : 0)) cand.push(['glasses', rnd() < 0.5 ? 'round' : 'square']);
    if (rnd() < (isV ? 0.8 : 0.1 + (ints.includes('music') || ints.includes('game') ? 0.4 : 0))) cand.push(['headset', true]);
    if (rnd() < (isV ? 0.35 : 0.12) + 0.15 * Math.max(0, a.q)) cand.push(['animalEars', rnd() < 0.6 ? 'cat' : 'fox']);
    if (rnd() < (male ? 0.04 : 0.4)) cand.push(['ribbon', true]);
    if (rnd() < 0.25) cand.push(['clip', true]);
    if (rnd() < 0.2) cand.push(['earring', true]);
    const maxAcc = { '0': 2, '1': 3, '2': 4 }[T.skill] || 3;
    cand.sort(() => rnd() - 0.5).slice(0, maxAcc).forEach(([k, v]) => { acc[k] = v; });

    // 色
    const m = DATA.moods[T.mood] || DATA.moods.sunrise, el = P.element;
    let h = m.h; if (el) { const diff = ((DATA.elementHue[el] - h + 540) % 360) - 180; h += diff * 0.12; }
    let acH, acS, acL;
    if (P.birth) { acH = P.birth.star.h; acS = Math.max(P.birth.star.s, 45); acL = P.birth.star.l; } else { acH = h + 160; acS = 70; acL = 58; }
    acL = U.clamp(acL, 44, 64);
    if (U.hslCircDist(acH, h) < 40) acH = h + 170;
    if (vi === 1) acH += 25; if (vi === 2) acH = h + 180;
    const natural = a.q < -0.05 ? true : (vi === 2 && a.q < 0.5);
    let hair, hairName;
    if (natural && vi !== 1) { const n = U.pick(NATURAL_HAIR, rnd); hair = [n[0], n[1], n[2]]; hairName = n[3]; }
    else { const hh = h + (vi === 1 ? 35 : 0); hair = [hh, Math.min(88, m.s + 8), m.l - 6]; hairName = null; }
    const skinKey = W(['fair', 'light', 'tan', 'deep'], k => ({ fair: 0.4, light: 0.35, tan: 0.15, deep: 0.1 })[k]);
    const [skin, skinShade] = SKINS[skinKey];
    const OUTFITS = [[h, 32, 32], [225, 38, 28], [240, 8, 27], [38, 38, 80], [350, 40, 34], [100, 22, 34], [0, 0, 93], [200, 30, 36]];
    const oc = U.pick(OUTFITS.filter(o => !(o[1] > 15 && U.hslCircDist(o[0], hair[0]) < 40 && hair[1] > 30)), rnd);
    const outH = oc[0], outS = oc[1], outL = oc[2], lightOut = outL > 70;
    const C = {
      skin, skinShade, hair: hsl(hair[0], hair[1], hair[2]), hairShade: hsl(hair[0], hair[1] + 4, Math.max(8, hair[2] - 14)), hairHi: hsl(hair[0], Math.max(10, hair[1] - 6), Math.min(92, hair[2] + 18)),
      iris: hsl(acH, Math.max(acS, 50), 52), irisDark: hsl(acH, Math.max(acS, 50), 30), outfit: hsl(outH, outS, outL), outfitShade: hsl(outH, outS, outL - 14), outfitLight: lightOut ? '#ffffff' : hsl(outH, Math.max(outS, 20), 88),
      accent: hsl(acH, acS, acL), line: hsl(hair[0], 30, 14), cheek: '#ff8fa3', bg: m.bg
    };
    C.hex = { iris: Engine.hslToHex(acH, Math.max(acS, 50), 52), body: Engine.hslToHex(hair[0], hair[1], hair[2]), accent: Engine.hslToHex(acH, acS, acL), line: Engine.hslToHex(hair[0], 30, 14), outfit: Engine.hslToHex(outH, outS, outL) };
    C.names = { body: hairName ? { ja: hairName, en: hairName === '黒' ? 'black' : hairName === '焦げ茶' ? 'dark brown' : hairName === '栗色' ? 'chestnut brown' : hairName === '金髪' ? 'blonde' : 'silver' } : Engine.colorName(hair[0], hair[1], hair[2]), accent: Engine.colorName(acH, acS, acL), outfit: Engine.colorName(outH, outS, outL) };

    return {
      kind: 'human', style: P.styleKind, gender: g, skinKey, hairBack, hairFront, ahoge, eyes, brows, mouth, outfit, ...acc, item: P.ints[0].item, colors: C,
      // 他ロジックとの互換
      body: 'human', ears: acc.animalEars, hat: acc.headset ? 'headphones' : acc.ribbon ? 'ribbon' : 'none', neck: 'none', tail: 'none', pattern: 'none', pose: 'down', seed: P.seed + vi * 31
    };
  }

  function describe(s) {
    const C = s.colors, ja = [], en = [];
    const who = s.gender === 'm' ? ['男性キャラ', 'a young man'] : ['女性キャラ', 'a young woman'];
    const hairJa = `${C.names.body.ja}の${JA.hairBack[s.hairBack]}（${JA.hairFront[s.hairFront]}）`;
    ja.push(who[0], hairJa, JA.eyes[s.eyes], JA.mouth[s.mouth], JA.outfit[s.outfit]);
    en.push(who[1], `${C.names.body.en} ${EN.hairBack[s.hairBack]} with ${EN.hairFront[s.hairFront]}`, EN.eyes[s.eyes], EN.mouth[s.mouth], `wearing ${EN.outfit[s.outfit]}`);
    if (s.glasses !== 'none') { ja.push(s.glasses === 'round' ? '丸メガネ' : '四角いメガネ'); en.push(`${s.glasses} glasses`); }
    if (s.headset) { ja.push('ヘッドセット（マイク付き）'); en.push('a headset with a boom microphone'); }
    if (s.animalEars !== 'none') { ja.push(s.animalEars === 'cat' ? 'ネコ耳' : 'キツネ耳'); en.push(`${s.animalEars} ears on the head`); }
    if (s.ribbon) { ja.push('髪のリボン'); en.push('a hair ribbon'); }
    if (s.clip) { ja.push('ヘアピン'); en.push('hair clips'); }
    if (s.earring) { ja.push('ピアス'); en.push('earrings'); }
    if (s.ahoge) { ja.push('ぴょんと立つアホ毛'); en.push('a single ahoge strand'); }
    return { ja, en };
  }

  /* ================= 描画 ================= */
  function hairPaths(s, male) {
    const back = {
      long: `M128,150 C98,250 96,380 118,500 L282,500 C304,380 302,250 272,150 Z`,
      bob: `M128,160 C116,240 124,290 156,300 L244,300 C276,290 284,240 272,160 Z`,
      short: `M132,170 C130,220 140,238 150,244 L250,244 C260,238 270,220 268,170 Z`,
      wolf: `M126,150 C106,230 110,300 136,336 L168,300 L190,342 L212,300 L240,340 L264,300 C292,260 296,210 274,150 Z`,
      pony: `M132,160 C130,200 140,232 150,244 L250,244 C260,232 270,200 268,160 Z M262,124 C340,132 356,262 322,356 C302,292 288,222 262,184 Z`,
      twin: `M132,160 C130,200 140,232 150,244 L250,244 C260,232 270,200 268,160 Z M128,150 C74,172 60,300 90,424 C112,342 128,272 142,210 Z M272,150 C326,172 340,300 310,424 C288,342 272,272 258,210 Z`
    }[s.hairBack];
    const L = 142, R = 258;
    const edge = {
      straight: `L${R},160 Q240,178 222,158 Q200,182 178,158 Q160,178 ${L},160`,
      parted: `L${R},172 Q236,140 200,114 Q164,140 ${L},172`,
      side: `L${R},178 Q212,172 172,126 Q150,150 ${L},174`,
      messy: `L${R},170 L246,176 L238,150 L224,178 L210,144 L196,176 L180,148 L168,178 L154,150 L${L},170`
    }[s.hairFront];
    const front = `M130,202 C116,100 164,72 200,72 C236,72 284,100 270,202 L${R},202 ${edge} L${L},202 Z`;
    const sideLocks = (['long', 'twin', 'bob'].includes(s.hairBack) && !male) || s.hairBack === 'wolf'
      ? `M130,176 C122,224 124,268 138,${s.hairBack === 'bob' ? 296 : 316} C148,276 150,230 146,184 Z M270,176 C278,224 276,268 262,${s.hairBack === 'bob' ? 296 : 316} C252,276 250,230 254,184 Z` : '';
    return { back, front, sideLocks };
  }

  function eye(kind, cx, cy, s, C, male) {
    const P = (dx, dy) => `${(cx + s * dx).toFixed(1)},${(cy + dy).toFixed(1)}`;
    const rx = male ? 11 : 13.5, ry = { round: 17, tsuri: 14, tare: 16, narrow: 12 }[kind] * (male ? 0.92 : 1);
    const outer = { round: -3, tsuri: -11, tare: 3, narrow: -7 }[kind];
    const lid = `M${P(-18, -1)} Q${P(-9, -19)} ${P(7, -18)} Q${P(19, -15)} ${P(22, outer)} Q${P(11, -11)} ${P(-2, -10)} Q${P(-12, -8)} ${P(-18, -1)} Z`;
    return `<ellipse cx="${cx + s}" cy="${cy + 3}" rx="${rx}" ry="${ry}" fill="${C.iris}"/>
      <ellipse cx="${cx + s}" cy="${cy + 6}" rx="${rx * 0.62}" ry="${ry * 0.62}" fill="${C.irisDark}"/>
      <ellipse cx="${cx + s}" cy="${cy - ry * 0.35}" rx="${rx * 0.9}" ry="${ry * 0.35}" fill="#000" opacity=".12"/>
      <circle cx="${cx + s * 5}" cy="${cy - 4}" r="${male ? 3.4 : 4.4}" fill="#fff"/><circle cx="${cx - s * 4}" cy="${cy + 8}" r="2.1" fill="#fff"/>
      <path d="${lid}" fill="${C.line}"/>
      <path d="M${P(-16, 12)} Q${P(0, 20)} ${P(14, 12)}" fill="none" stroke="${C.line}" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>`;
  }
  function brow(kind, cx, cy, s, C) {
    const P = (dx, dy) => `${(cx + s * dx).toFixed(1)},${(cy + dy).toFixed(1)}`;
    const d = kind === 'straight' ? `M${P(-13, -30)} L${P(14, -34)}` : `M${P(-13, -30)} Q${P(0, -38)} ${P(14, -32)}`;
    return `<path d="${d}" fill="none" stroke="${C.hairShade}" stroke-width="3.6" stroke-linecap="round"/>`;
  }
  function mouth(kind, y, C) {
    const st = `fill="none" stroke="${C.line}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"`;
    switch (kind) {
      case 'open': return `<path d="M188,${y - 2} Q200,${y + 18} 212,${y - 2} Z" fill="#7a2f3b" stroke="${C.line}" stroke-width="2.4" stroke-linejoin="round"/><path d="M192,${y + 6} Q200,${y + 13} 208,${y + 6}" fill="#ff8aa0"/>`;
      case 'cat': return `<path d="M200,${y - 2} Q193,${y + 8} 186,${y} M200,${y - 2} Q207,${y + 8} 214,${y}" ${st}/>`;
      case 'flat': return `<path d="M191,${y + 2} L209,${y + 2}" ${st}/>`;
      case 'smirk': return `<path d="M190,${y + 2} Q202,${y + 4} 213,${y - 3}" ${st}/>`;
      default: return `<path d="M189,${y - 1} Q200,${y + 10} 211,${y - 1}" ${st}/>`;
    }
  }

  function outfitMarkup(s, male, C, torsoD, tc) {
    const L = C.line, O = C.outfit, OS = C.outfitShade, A = C.accent, W = C.outfitLight;
    const sw = `stroke="${L}" stroke-width="4" stroke-linejoin="round"`;
    let inner = '';
    switch (s.outfit) {
      case 'blazer':
        inner = `<path d="M168,336 L200,432 L232,336 Z" fill="#fff" ${sw}/>
          <path d="M168,336 L200,432 L150,420 Q140,380 150,346 Z M232,336 L200,432 L250,420 Q260,380 250,346 Z" fill="${OS}" ${sw}/>
          ${male ? `<path d="M193,352 L207,352 L211,420 L200,436 L189,420 Z" fill="${A}" ${sw}/><path d="M192,350 L208,350 L205,358 L195,358 Z" fill="${A}" ${sw}/>`
          : `<path d="M200,364 L172,350 L172,380 Z M200,364 L228,350 L228,380 Z" fill="${A}" ${sw}/><circle cx="200" cy="364" r="7" fill="${A}" ${sw}/><path d="M194,372 L186,410 L198,402 Z M206,372 L214,410 L202,402 Z" fill="${A}" ${sw}/>`}`; break;
      case 'hoodie':
        inner = `<path d="M146,356 Q200,296 254,356 L246,382 Q200,344 154,382 Z" fill="${OS}" ${sw}/>
          <path d="M184,368 L182,438 M216,368 L218,438" stroke="${W}" stroke-width="4" stroke-linecap="round"/><circle cx="182" cy="442" r="5" fill="${A}"/><circle cx="218" cy="442" r="5" fill="${A}"/>
          <path d="M150,470 Q200,452 250,470 L260,520 L140,520 Z" fill="${OS}" opacity=".6"/>`; break;
      case 'sweater':
        inner = `<path d="M166,314 Q200,328 234,314 L238,350 Q200,366 162,350 Z" fill="${OS}" ${sw}/>
          <path d="M174,326 L172,352 M188,330 L187,358 M202,331 L202,360 M216,330 L217,358 M230,326 L231,352" stroke="${L}" stroke-width="1.6" opacity=".4"/>
          <path d="M140,430 H260 M138,440 H262" stroke="${W}" stroke-width="5" opacity=".5"/>`; break;
      case 'sailor':
        inner = `<path d="M150,346 L200,424 L250,346 L238,334 L200,380 L162,334 Z" fill="${OS}" ${sw}/><path d="M158,350 L200,414 M242,350 L200,414" stroke="#fff" stroke-width="3" fill="none"/>
          <path d="M200,392 L176,380 L176,408 Z M200,392 L224,380 L224,408 Z" fill="${A}" ${sw}/><circle cx="200" cy="392" r="6.5" fill="${A}" ${sw}/>`; break;
      case 'kimono':
        inner = `<path d="M172,336 L214,470 M228,336 L192,470" stroke="${W}" stroke-width="15" stroke-linecap="round" fill="none"/><path d="M172,336 L214,470 M228,336 L192,470" stroke="${L}" stroke-width="2.5" fill="none" opacity=".5"/>
          <rect x="60" y="468" width="280" height="60" fill="${A}" ${sw}/><path d="M60,484 H340" stroke="${W}" stroke-width="3" opacity=".6"/>`; break;
      default: // jacket
        inner = `<path d="M170,330 L200,360 L230,330 L246,344 L228,386 L200,372 L172,386 L154,344 Z" fill="${W}" ${sw}/>
          <path d="M200,372 V520" stroke="${L}" stroke-width="4"/><path d="M200,372 V520" stroke="${A}" stroke-width="2" stroke-dasharray="6 5"/>
          <path d="M104,420 L136,400 M296,420 L264,400 M100,440 L134,420 M300,440 L266,420" stroke="${A}" stroke-width="7" stroke-linecap="round"/>`;
    }
    return `<path d="${torsoD}" fill="${O}" stroke="${L}" stroke-width="5" stroke-linejoin="round"/><g clip-path="url(#${tc})">${inner}</g>`;
  }

  function group(s, uid) {
    const C = s.colors, L = C.line, male = s.gender === 'm', isV = s.style === 'vtuber';
    const tc = `tc-${uid}`, fc = `fc-${uid}`;
    const torsoD = male ? `M86,540 C86,408 126,346 200,334 C274,346 314,408 314,540 Z` : `M110,540 C108,410 138,346 200,334 C262,346 292,410 290,540 Z`;
    const faceD = male
      ? `M139,178 C139,126 168,104 200,104 C232,104 261,126 261,178 C261,232 248,266 226,282 Q200,292 174,282 C152,266 139,232 139,178 Z`
      : `M140,180 C140,128 168,104 200,104 C232,104 260,128 260,180 C260,226 244,262 218,278 Q200,288 182,278 C156,262 140,226 140,180 Z`;
    const H = hairPaths(s, male), hs = `stroke="${L}" stroke-width="4.5" stroke-linejoin="round"`;
    const eyeY = male ? 216 : 214, ex = male ? 35 : 36;
    const o = [];
    o.push(`<defs><clipPath id="${tc}"><path d="${torsoD}"/></clipPath><clipPath id="${fc}"><path d="${faceD}"/></clipPath></defs>`);
    if (isV) o.push(`<circle cx="200" cy="270" r="196" fill="${C.accent}" opacity=".12"/><circle cx="200" cy="270" r="196" fill="none" stroke="${C.accent}" stroke-width="3" opacity=".35" stroke-dasharray="3 9" stroke-linecap="round"/>`);
    // 猫耳/狐耳（髪の後ろ）
    if (s.animalEars !== 'none') {
      const ear = (sx) => `<g transform="${sx < 0 ? 'translate(400,0) scale(-1,1)' : ''}"><path d="M140,120 L${s.animalEars === 'fox' ? 122 : 134},54 L${s.animalEars === 'fox' ? 186 : 182},92 Z" fill="${C.hair}" ${hs}/><path d="M146,112 L${s.animalEars === 'fox' ? 134 : 140},72 L172,96 Z" fill="${C.accent}" opacity=".85"/></g>`;
      o.push(ear(1) + ear(-1));
    }
    o.push(`<path d="${H.back}" fill="${C.hair}" ${hs}/>`);
    // 首・体
    o.push(`<rect x="183" y="256" width="34" height="84" rx="8" fill="${C.skin}" stroke="${L}" stroke-width="4"/>`);
    o.push(`<ellipse cx="200" cy="296" rx="26" ry="14" fill="${C.skinShade}" opacity=".6"/>`);
    o.push(`<g transform="translate(0 -20)">${outfitMarkup(s, male, C, torsoD, tc)}</g>`);
    // 耳・顔
    o.push(`<ellipse cx="139" cy="204" rx="9" ry="14" fill="${C.skin}" stroke="${L}" stroke-width="4"/><ellipse cx="261" cy="204" rx="9" ry="14" fill="${C.skin}" stroke="${L}" stroke-width="4"/>`);
    if (s.earring) o.push(`<circle cx="138" cy="224" r="5" fill="${C.accent}" stroke="${L}" stroke-width="2.5"/><circle cx="262" cy="224" r="5" fill="${C.accent}" stroke="${L}" stroke-width="2.5"/>`);
    o.push(`<path d="${faceD}" fill="${C.skin}" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>`);
    o.push(`<g clip-path="url(#${fc})"><ellipse cx="200" cy="150" rx="70" ry="30" fill="${C.skinShade}" opacity=".5"/><ellipse cx="248" cy="250" rx="40" ry="46" fill="${C.skinShade}" opacity=".25"/></g>`);
    if (!male || s.mouth === 'open') o.push(`<ellipse cx="${200 - 49}" cy="240" rx="14" ry="7" fill="${C.cheek}" opacity="${male ? 0.25 : 0.5}"/><ellipse cx="${200 + 49}" cy="240" rx="14" ry="7" fill="${C.cheek}" opacity="${male ? 0.25 : 0.5}"/>`);
    const es = male ? 1.12 : 1.26, eg = (x, y, sgn) => `<g transform="translate(${x} ${y}) scale(${es}) translate(${-x} ${-y})">${eye(s.eyes, x, y, sgn, C, male)}</g>`;
    o.push(eg(200 - ex, eyeY + 2, -1) + eg(200 + ex, eyeY + 2, 1));
    o.push(brow(s.brows, 200 - ex, eyeY - 6, -1, C) + brow(s.brows, 200 + ex, eyeY - 6, 1, C));
    o.push(`<path d="M198,241 q2,3 5,0" fill="none" stroke="${C.skinShade}" stroke-width="2.6" stroke-linecap="round"/>`);
    o.push(mouth(s.mouth, 259, C));
    // 髪（前）
    o.push(`<path d="${H.front}" fill="${C.hair}" ${hs}/>`);
    if (H.sideLocks) o.push(`<path d="${H.sideLocks}" fill="${C.hair}" ${hs}/>`);
    o.push(`<path d="M150,108 C172,88 220,86 246,108" fill="none" stroke="${C.hairHi}" stroke-width="8" stroke-linecap="round" opacity=".55"/>`);
    if (s.ahoge) o.push(`<path d="M198,76 C190,46 220,38 226,56 C216,52 208,60 210,80 Z" fill="${C.hair}" ${hs}/>`);
    // 小物
    if (s.glasses !== 'none') {
      const f = `fill="#fff" fill-opacity=".18" stroke="${L}" stroke-width="3.6"`;
      o.push(s.glasses === 'round' ? `<circle cx="${200 - ex}" cy="${eyeY + 3}" r="29" ${f}/><circle cx="${200 + ex}" cy="${eyeY + 3}" r="29" ${f}/><path d="M${200 - ex + 29},${eyeY} Q200,${eyeY - 6} ${200 + ex - 29},${eyeY}" fill="none" stroke="${L}" stroke-width="3.6"/>`
        : `<rect x="${200 - ex - 29}" y="${eyeY - 22}" width="58" height="46" rx="10" ${f}/><rect x="${200 + ex - 29}" y="${eyeY - 22}" width="58" height="46" rx="10" ${f}/><path d="M${200 - ex + 29},${eyeY - 6} H${200 + ex - 29}" stroke="${L}" stroke-width="3.6"/>`);
    }
    if (s.ribbon) o.push(`<g transform="translate(246 100) rotate(-14)"><path d="M0,0 L-26,-16 L-26,16 Z M0,0 L26,-16 L26,16 Z" fill="${C.accent}" ${hs}/><circle r="7" fill="${C.accent}" ${hs}/></g>`);
    if (s.clip) o.push(`<g transform="translate(158 140) rotate(-30)"><rect x="-13" y="-3.5" width="26" height="7" rx="3" fill="${C.accent}" stroke="${L}" stroke-width="2.4"/><rect x="-13" y="-3.5" width="26" height="7" rx="3" fill="${C.accent}" stroke="${L}" stroke-width="2.4" transform="rotate(60)"/></g>`);
    if (s.headset) o.push(`<path d="M127,182 C124,52 276,52 273,182" fill="none" stroke="${L}" stroke-width="11" stroke-linecap="round"/><path d="M127,182 C124,52 276,52 273,182" fill="none" stroke="${C.accent}" stroke-width="5" stroke-linecap="round"/>
      <rect x="112" y="178" width="24" height="46" rx="11" fill="${C.accent}" stroke="${L}" stroke-width="4.5"/><rect x="264" y="178" width="24" height="46" rx="11" fill="${C.accent}" stroke="${L}" stroke-width="4.5"/>
      <path d="M118,222 Q118,270 160,272" fill="none" stroke="${L}" stroke-width="5" stroke-linecap="round"/><circle cx="163" cy="272" r="8" fill="#555" stroke="${L}" stroke-width="3.5"/>`);
    // 持ち物バッジ
    const item = Draw.ITEMS[s.item];
    if (item) o.push(`<g transform="translate(332 452)"><circle r="46" fill="#fff" opacity=".92" stroke="${L}" stroke-width="3.5"/><g transform="scale(1.05)">${item(L, C.accent)}</g></g>`);
    return o.join('');
  }

  const out = { design, describe, group, JA, EN };
  if (typeof module !== 'undefined') module.exports = out;
  return out;
})();
