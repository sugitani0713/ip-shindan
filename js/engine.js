/* 診断エンジン：回答＋占い → 気質5軸 → 原型・ギャップ・名前・デザイン・YouTube勝ち筋
   すべてブラウザ内で完結。APIキー・外部通信なし。 */
const Engine = (() => {
  const AX = ['w', 'e', 'h', 'q', 'd'];
  const AXIS_MEAN = { w: 0, e: 0, h: 0, q: 0, d: 0 };
  DATA.questions.filter(q => q.type === 'single').forEach(q => AX.forEach(k => { AXIS_MEAN[k] += q.opts.reduce((s, o) => s + (o.d[k] || 0), 0) / q.opts.length; }));
  const MOOD_EL = { sunrise: '火', night: '水', forest: '木', neon: '金', retro: '土', sea: '水' };

  const J = {
    body: { blob: 'まんまるの', egg: 'たまご型の', bean: 'すらりとした豆型の', drop: 'しずく型の', box: '四角くどっしりした', cloud: 'ふわふわ雲型の' },
    ears: { none: 'つるんとした頭', cat: 'ネコ耳風の三角の耳', round: 'まるい耳', long: 'ぴんと長い耳', horn: 'ちいさな角', antenna: '触角（アンテナ）', sprout: '頭の上の若葉', flame: '頭の炎' },
    eyes: { dot: 'つぶらな点の目', round: '大きく澄んだ目', sleepy: '眠たげな半目', sharp: '切れ長の鋭い目', sparkle: '星のきらめく目' },
    mouth: { smile: 'にっこり口', cat: 'ω（にゃん）口', flat: '一文字の口', open: '大きく開いた口', fang: '小さな牙の口', tiny: 'ちょこんとした口' },
    hat: { none: '', beret: 'ベレー帽', cap: 'キャップ', nightcap: 'ナイトキャップ', tophat: 'シルクハット', headphones: 'ヘッドホン', flower: '花飾り', ribbon: 'リボン' },
    neck: { none: '', scarf: 'マフラー', bowtie: '蝶ネクタイ', bell: '鈴つきの首輪風チョーカー' },
    glasses: { none: '', round: '丸メガネ', square: '四角いメガネ' },
    tail: { none: '', fluffy: 'ふわふわのしっぽ', curl: 'くるんとしたしっぽ', leaf: '葉っぱのしっぽ' },
    item: { magnifier: 'ルーペ', scroll: '巻物', coin: 'コイン', moon: '三日月', onigiri: 'おにぎり', controller: 'ゲームコントローラー', paw: '肉球マーク', lantern: 'ランタン', heart: 'ハート', key: '鍵', book: '本', compass: '方位磁針', mic: 'マイク', brush: '鉛筆', mug: 'マグカップ', bulb: '電球', dumbbell: 'ダンベル', planet: '輪っかのある惑星' },
    pattern: { none: '', belly: 'おなかの白い模様', spots: '水玉の斑点', stripes: 'ほおのしま模様', star: '星のマーク', wave: 'おなかの波模様' }
  };
  const EN = {
    body: { blob: 'a perfectly round plump blob body', egg: 'an egg-shaped body', bean: 'a tall slender bean-shaped body', drop: 'a teardrop-shaped body', box: 'a rounded-square squat body', cloud: 'a fluffy cloud-shaped body' },
    ears: { none: 'a smooth head with no ears', cat: 'pointed cat-like ears', round: 'small round ears', long: 'long upright ears', horn: 'small cream-colored horns', antenna: 'two bobbing antennae with round tips', sprout: 'a little green sprout on top of the head', flame: 'a small flame tuft on top of the head' },
    eyes: { dot: 'small shiny dot eyes', round: 'big round glossy eyes', sleepy: 'sleepy half-closed eyes', sharp: 'sharp narrow eyes', sparkle: 'star-shaped sparkling eyes' },
    mouth: { smile: 'a gentle smile', cat: 'a cat-like "w" mouth', flat: 'a flat straight mouth', open: 'a wide open mouth', fang: 'a smile with one tiny fang', tiny: 'a tiny round mouth' },
    hat: { none: '', beret: 'a beret', cap: 'a baseball cap', nightcap: 'a nightcap with a pom-pom', tophat: 'a small top hat', headphones: 'big headphones', flower: 'a flower hair ornament', ribbon: 'a ribbon bow' },
    neck: { none: '', scarf: 'a scarf', bowtie: 'a bow tie', bell: 'a collar with a small bell' },
    glasses: { none: '', round: 'round glasses', square: 'square glasses' },
    tail: { none: '', fluffy: 'a fluffy tail', curl: 'a curled tail', leaf: 'a leaf-shaped tail' },
    item: { magnifier: 'a magnifying glass', scroll: 'a scroll', coin: 'a gold coin', moon: 'a crescent moon', onigiri: 'a rice ball', controller: 'a game controller', paw: 'a paw-print token', lantern: 'a small lantern', heart: 'a heart', key: 'a golden key', book: 'a book', compass: 'a compass', mic: 'a microphone', brush: 'a pencil', mug: 'a steaming mug', bulb: 'a light bulb', dumbbell: 'a dumbbell', planet: 'a ringed planet' },
    pattern: { none: '', belly: 'a lighter belly patch', spots: 'soft spots', stripes: 'cheek stripes', star: 'small star marks', wave: 'wavy lines on the belly' }
  };
  const ARCH_EN = { guide: 'a gentle guide', buddy: 'a loyal buddy', healer: 'a calming guardian of rest', doctor: 'an eccentric professor', storyteller: 'a storyteller', trickster: 'a mischievous trickster', guardian: 'a calm sentinel', adventurer: 'an eager adventurer', artisan: 'a devoted craftsperson', critic: 'a sharp-tongued sidekick', senpai: 'a reliable senior friend', drifter: 'a quiet wanderer', muse: 'a star everyone wants to cheer for' };

  /* ---- 色ユーティリティ ---- */
  function hslToHex(h, s, l) {
    s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
  }
  function colorName(h, s, l) {
    h = ((h % 360) + 360) % 360;
    if (l > 90) return { ja: 'クリームホワイト', en: 'cream white' };
    if (s < 14) return l < 30 ? { ja: '墨色', en: 'charcoal' } : { ja: 'ライトグレー', en: 'soft gray' };
    const tbl = [[15, '赤', 'red'], [40, 'オレンジ', 'orange'], [65, '黄色', 'yellow'], [90, '黄緑', 'lime green'], [165, '緑', 'green'], [195, 'ターコイズ', 'turquoise'],
      [225, '空色', 'sky blue'], [255, '藍色', 'indigo'], [290, '紫', 'purple'], [335, 'ピンク', 'pink'], [361, '赤', 'red']];
    const [, ja, en] = tbl.find(r => h < r[0]);
    const tj = l > 74 ? 'やわらかな' : l < 40 ? '深い' : '', te = l > 74 ? 'pastel ' : l < 40 ? 'deep ' : '';
    return { ja: tj + ja, en: te + en };
  }

  /* ---- 分析 ---- */
  function analyze(input) {
    const { name = '', y, m, d, useDiv, answers, interests, free = {}, styleKind: skIn = 'auto', gender: gIn = 'n' } = input;
    const hasBirth = !!(useDiv && y && m && d);
    const sums = { w: 0, e: 0, h: 0, q: 0, d: 0 };
    DATA.questions.forEach(q => {
      const a = answers[q.key]; if (a == null) return;
      (Array.isArray(a) ? a : [a]).forEach(v => { const o = q.opts.find(o => o.v === v); if (o) for (const k in o.d) sums[k] += o.d[k]; });
    });
    // 設問に + 方向の選択肢が多い軸があるため、ランダム回答の期待値を引いて中心化する
    const quiz = {}; AX.forEach(k => { quiz[k] = Math.tanh((sums[k] - AXIS_MEAN[k]) / 3.2); });

    const birth = hasBirth ? Div.birth(y, m, d) : null;
    const ns = Div.nameSound(name);
    const bias = { w: 0, e: 0, h: 0, q: 0, d: 0 };
    if (birth) AX.forEach(k => { bias[k] += birth.bias[k]; });
    if (ns) {
      for (const k in ns.info.bias) bias[k] += ns.info.bias[k];
      if (ns.tex) for (const k in Div.TEX_BIAS[ns.tex.t]) bias[k] += Div.TEX_BIAS[ns.tex.t][k];
    }
    const wq = (birth || ns) ? (birth && ns ? 0.28 : 0.22) : 0;
    const axes = {}; AX.forEach(k => { axes[k] = U.clamp(quiz[k] * (1 - wq) + U.clamp(bias[k], -1, 1) * wq, -1, 1); });

    const cleanFree = {};
    ['said', 'love', 'vow'].forEach(k => { cleanFree[k] = (free[k] || '').replace(/[\r\n<>]/g, ' ').trim().slice(0, 40); });
    const ints = (interests && interests.length ? interests : ['trivia']).map(id => DATA.interests.find(i => i.id === id)).filter(Boolean);
    const tags = { goal: answers.goal || 'teach', bond: answers.bond || 'teacher', pace: answers.pace || 'often', voice: answers.voice || 'own', skill: answers.skill || '1', mood: answers.mood || 'sunrise', avoid: answers.avoid || [] };
    const seed = U.hash(JSON.stringify([name, hasBirth ? [y, m, d] : null, answers, ints.map(i => i.id), cleanFree]));
    const rnd = U.rng(seed);
    // 系統・性別の確定（人格の乱数とは別系統にして、系統を切り替えても性格・ギャップは変わらないようにする）
    const r2 = U.rng(seed ^ 0x5bd1e995);
    let styleKind = skIn;
    if (styleKind === 'auto') {
      const wt = { mascot: 0.8 + 0.4 * axes.w, anime: 1, vtuber: 0.6 + 0.5 * axes.e + (tags.voice === 'text' ? -0.3 : 0.3) + (tags.bond === 'idol' ? 0.5 : 0) };
      styleKind = U.wpick(['mascot', 'anime', 'vtuber'], k => wt[k], r2);
    }
    const gender = gIn === 'n' ? (r2() < 0.5 ? 'f' : 'm') : gIn;
    const element = birth ? birth.day.el : MOOD_EL[tags.mood];

    // 原型
    const scored = DATA.archetypes.map(a => {
      let dist = 0; AX.forEach(k => { dist += Math.pow(axes[k] - a.v[k], 2); });
      return { a, s: -Math.sqrt(dist) + (a.goal.includes(tags.goal) ? 0.5 : 0) + (a.bond.includes(tags.bond) ? 0.35 : 0) + rnd() * 0.04 };
    }).sort((x, y) => y.s - x.s);
    const archetype = scored[0].a, secondary = scored[1].a;

    // ギャップ（見た目の印象と"逆"を内面に置く）
    const gtype = axes.w > 0.2 ? 'soft' : axes.w < -0.2 ? 'sharp' : 'mid';
    const gap = U.pick(DATA.gaps[gtype], rnd);
    const flaw = U.pick(DATA.flaws, rnd);

    // 口調
    const voice = DATA.voices.map(v => { let s = rnd() * 0.15; for (const k in v.v) s += v.v[k] * axes[k]; return { v, s }; }).sort((a, b) => b.s - a.s)[0].v;

    const P = { styleKind, gender, autoStyle: skIn === 'auto', input, hasBirth, birth, ns, axes, quiz, wq, archetype, secondary, gap, flaw, voice, ints, tags, seed, element, free: cleanFree, name: name.trim() };
    P.seed = (seed ^ U.hash(styleKind + gender)) >>> 0; // 見た目・名前は系統ごとに変える
    P.names = makeNames(P);
    // 形が被らないよう、前の案を避けて3案を設計
    P.designs = []; for (let i = 0; i < 3; i++) P.designs.push(design(P, i, P.designs));
    P.format = pickFormat(P);
    P.score = makeScore(P);
    return P;
  }

  /* ---- 名前（音の質感を気質から選ぶ） ---- */
  const POOLS = {
    soft: { w: ['もち', 'ふわ', 'ぽん', 'まる', 'ころ', 'のん', 'ぬく', 'ほの', 'ゆら', 'みる', 'ぽわ', 'なご'], note: 'やわらかく、口に出すとほっとする音', s: a => a.w * 1.2 - a.e * 0.4 },
    sharp: { w: ['きり', 'しゅん', 'くろ', 'れい', 'ざく', 'せつ', 'かげ', 'すい', 'きら', 'ひゅう', 'しずく'], note: '短く鋭く、サムネでも目に刺さる音', s: a => -a.w * 1.1 + a.d * 0.2 },
    bright: { w: ['ぱち', 'ぴこ', 'ぽぽ', 'らん', 'てん', 'ぷる', 'わく', 'ぴょん', 'とろ', 'ぽこ'], note: '弾むような、つい呼びたくなる音', s: a => a.e * 1.1 + a.h * 0.6 },
    calm: { w: ['つき', 'ねむ', 'ほたる', 'ゆう', 'たゆ', 'かな', 'しろ', 'おぼろ', 'ひなた', 'しじま'], note: '静かで余韻の残る音', s: a => -a.e * 1.1 + a.d * 0.4 },
    earnest: { w: ['しるべ', 'ふみ', 'かなめ', 'ことは', 'ひびき', 'みち', 'こよみ', 'まこと'], note: '誠実で、信頼感のある音', s: a => -a.h * 1.0 + a.d * 0.4 - a.q * 0.3 },
    quirk: { w: ['ぬめ', 'むにゃ', 'ぐるる', 'にょろ', 'ぴゅる', 'ずん', 'もじゃ', 'ぺろ', 'けけ', 'ぷにゅ'], note: '一度聞いたら忘れない、ちょっと変な音', s: a => a.q * 1.3 + a.h * 0.3 }
  };
  const SUFFIX = ['', 'ん', 'まる', 'ぴ', 'る', 'すけ', 'こ'];
  const toKata = s => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
  const HN = {
    f: ['みお', 'ひなた', 'ゆい', 'りこ', 'ことは', 'あおい', 'しおん', 'のあ', 'つばき', 'るな', 'さくら', 'はる', 'ひかり', 'みれい', 'せな', 'すず', 'ねね', 'ゆず', 'まお', 'いろは'],
    m: ['れん', 'そう', 'かい', 'はやと', 'あきら', 'しゅん', 'ゆうと', 'りく', 'なぎ', 'ひびき', 'つばさ', 'れいじ', 'みなと', 'あさひ', 'いつき', 'かなた', 'ひいろ', 'らいと', 'ゆうせい', 'とうま']
  };
  const HN_COOL = ['れい', 'れいじ', 'かい', 'あきら', 'しおん', 'せな', 'るな', 'しゅん', 'つばさ', 'れん'];
  function makeHumanNames(P) {
    const rnd = U.rng(P.seed ^ 0x9e3779b9), dom = P.ns && P.ns.dom, cool = P.axes.w < -0.1;
    const sc = k => (dom ? hasVowel(k, dom) * 0.6 : 0) + (cool && HN_COOL.includes(k) ? 1 : 0) + rnd() * 2.2;
    const list = HN[P.gender].map(k => ({ k, s: sc(k) })).sort((a, b) => b.s - a.s).map(x => x.k);
    const note = P.gender === 'm' ? ['凛とした印象の名前', '覚えやすい短い響き', 'やわらかさと芯の両方がある音'] : ['華があり、呼びたくなる名前', '覚えやすい短い響き', 'やわらかく、親しみのある音'];
    return list.slice(0, 3).map((k, i) => ({ kana: k, kata: toKata(k), note: note[i] }));
  }
  function makeNames(P) {
    if (P.styleKind !== 'mascot') return makeHumanNames(P);
    const rnd = U.rng(P.seed ^ 0x9e3779b9);
    const pools = Object.entries(POOLS).map(([id, p]) => ({ id, p, s: p.s(P.axes) + rnd() * 0.25 })).sort((a, b) => b.s - a.s);
    const dom = P.ns && P.ns.dom;
    const prefer = (words) => dom ? words.slice().sort((a, b) => (hasVowel(b, dom) - hasVowel(a, dom)) + (rnd() - 0.5) * 0.6) : words.slice().sort(() => rnd() - 0.5);
    const mora = s => Array.from(s.replace(/[ゃゅょ]/g, '')).length;
    const out = [], seen = new Set();
    const push = (kana, note) => { if (!kana || seen.has(kana) || mora(kana) > 5 || mora(kana) < 2) return; seen.add(kana); out.push({ kana, kata: toKata(kana), note }); };
    const [p1, p2, p3] = [pools[0], pools[1], pools[2]];
    // 案1: 主音 + 接尾
    { const w = prefer(p1.p.w)[0]; const sfx = U.pick(SUFFIX.filter(s => !(s === 'ん' && w.endsWith('ん'))), rnd); push(w + sfx, p1.p.note); }
    // 案2: 重ね言葉
    { const w = prefer(p2.p.w).find(x => mora(x) <= 2) || p2.p.w[0]; push(w + w, p2.p.note + '（重ねて親しみを強化）'); }
    // 案3: 二つの音の合成
    { const a = prefer(p1.p.w).find(x => mora(x) <= 2) || p1.p.w[0]; const b = prefer(p3.p.w).find(x => mora(x) <= 2) || p3.p.w[0]; push(a + b, p1.p.note.split('、')[0] + '＋' + p3.p.note.split('、')[0].replace(/^.*?、/, '') ); }
    let g = 0; while (out.length < 3 && g++ < 20) { const p = U.pick(pools, rnd).p; push(U.pick(p.w, rnd) + U.pick(SUFFIX, rnd), p.note); }
    return out.slice(0, 3);
  }
  function hasVowel(word, v) {
    const map = { a: 'あかさたなはまやらわがざだばぱ', i: 'いきしちにひみりぎじびぴ', u: 'うくすつぬふむゆるぐずぶぷ', e: 'えけせてねへめれげぜべぺ', o: 'おこそとのほもよろをごぞどぼぽ' };
    let c = 0; for (const ch of word) if (map[v].includes(ch)) c++; return c;
  }

  /* ---- ビジュアル設計 ---- */
  function design(P, vi, prev) {
    if (P.styleKind !== 'mascot') return Human.design(P, vi, prev);
    const rnd = U.rng(P.seed + vi * 7919 + 13);
    const a = P.axes, el = P.element, T = P.tags, ints = P.ints.map(i => i.id);
    const usedBody = prev.map(p => p.body), usedEars = prev.map(p => p.ears);
    const W = (items, f, avoid) => U.wpick(items, it => f(it) * (avoid && avoid.includes(it) ? 0.04 : 1), rnd);

    const body = W(['blob', 'egg', 'bean', 'drop', 'box', 'cloud'], b => ({
      blob: 1.2 + 0.5 * a.w, egg: 1 - 0.3 * a.q + 0.2 * a.w, bean: 1 - 0.6 * a.w + 0.4 * a.d, drop: 0.8 + 0.7 * a.q + 0.3 * a.e,
      box: 0.7 - 0.6 * a.w - 0.4 * a.h, cloud: 0.8 - 0.6 * a.e + 0.4 * a.w + 0.3 * a.q + (el === '水' ? 0.3 : 0)
    }[b]), usedBody);

    let hat = W(['none', 'beret', 'cap', 'nightcap', 'tophat', 'headphones', 'flower', 'ribbon'], h => ({
      none: 2.8, beret: 0.5 + (T.mood === 'retro' ? 0.8 : 0) + (ints.includes('craft') ? 0.5 : 0), cap: 0.4 + 0.4 * a.e, nightcap: 0.3 + (T.goal === 'heal' ? 1.0 : 0) + (T.mood === 'night' ? 0.5 : 0),
      tophat: 0.3 - 0.4 * a.w + 0.3 * a.d + (ints.includes('horror') ? 0.4 : 0), headphones: 0.25 + (ints.includes('music') ? 1.6 : 0) + (ints.includes('game') ? 0.9 : 0) + (T.voice !== 'text' ? 0.1 : 0),
      flower: 0.3 + (T.mood === 'forest' ? 0.9 : 0) + 0.3 * a.w, ribbon: 0.3 + 0.4 * a.w
    }[h]));
    const eHas = { 木: 'sprout', 火: 'flame', 金: 'horn', 土: 'round', 水: 'long' }[el];
    const ears = hat !== 'none' ? 'none' : W(['none', 'cat', 'round', 'long', 'horn', 'sprout', 'antenna', 'flame'], x => ({
      none: 0.5 - 0.3 * a.q, cat: 0.9 + 0.3 * a.w, round: 0.9 + 0.4 * a.w, long: 0.7 + 0.4 * a.e + 0.3 * a.h, horn: 0.6 - 0.5 * a.w + 0.4 * a.q,
      sprout: 0.5 - 0.3 * a.e, antenna: 0.5 + 0.6 * a.q + (ints.includes('science') ? 0.9 : 0), flame: 0.45 + 0.4 * a.e
    }[x] + (x === eHas ? 0.9 : 0)), usedEars);

    const eyes = W(['dot', 'round', 'sleepy', 'sharp', 'sparkle'], x => ({
      dot: 0.8 - 0.3 * a.q, round: 0.9 + 0.6 * a.w, sleepy: 0.6 - 0.8 * a.e, sharp: 0.5 - 0.8 * a.w, sparkle: 0.4 + 0.5 * a.h + 0.4 * a.q
    }[x]));
    const brows = eyes === 'sharp' ? (rnd() < 0.7 ? 'strong' : 'none') : eyes === 'sleepy' ? (rnd() < 0.6 ? 'none' : 'soft') : W(['none', 'soft', 'strong', 'worried'], x => ({ none: 1, soft: 0.8 + 0.3 * a.w, strong: 0.3 - 0.3 * a.w + 0.3 * a.e, worried: 0.3 + 0.3 * a.h }[x]));
    const mouth = W(['smile', 'cat', 'flat', 'open', 'fang', 'tiny'], x => ({
      smile: 0.9 + 0.4 * a.w, cat: 0.6 + 0.4 * a.h + 0.2 * a.w, flat: 0.5 - 0.6 * a.h - 0.4 * a.w, open: 0.5 + 0.6 * a.e + 0.4 * a.h, fang: 0.4 + 0.5 * a.q - 0.3 * a.w, tiny: 0.5 - 0.4 * a.e
    }[x]));
    const cheeks = rnd() < 0.25 + 0.5 * (a.w + 1) / 2;
    let pattern = W(['none', 'belly', 'spots', 'stripes', 'star', 'wave'], x => ({
      none: 0.6, belly: 1.0, spots: 0.4 + 0.3 * a.q, stripes: 0.3 + 0.3 * a.e, star: 0.2 + 0.4 * a.q + (el === '金' ? 0.6 : 0), wave: 0.1 + (el === '水' ? 0.9 : 0)
    }[x]));
    let neck = W(['none', 'scarf', 'bowtie', 'bell'], x => ({ none: 1.2, scarf: 0.6 - 0.3 * a.e + (T.mood === 'night' ? 0.3 : 0), bowtie: 0.4 - 0.3 * a.w, bell: 0.3 + 0.4 * a.w }[x]));
    let glasses = W(['none', 'round', 'square'], x => ({ none: 1.8, round: 0.3 + 0.6 * a.d + (ints.includes('study') ? 0.6 : 0), square: 0.2 - 0.4 * a.w + 0.3 * a.d }[x]));
    let tail = W(['none', 'fluffy', 'curl', 'leaf'], x => ({ none: 1.2, fluffy: 0.6 + 0.3 * a.w, curl: 0.5, leaf: 0.3 + (el === '木' ? 1.0 : 0) }[x]));

    // 描きやすさ：制作スキルに応じて装飾数を制限
    const maxAcc = { '0': 2, '1': 3, '2': 5 }[T.skill] || 3;
    const acc = () => [tail !== 'none', pattern !== 'none' && pattern !== 'belly', glasses !== 'none', neck !== 'none', hat !== 'none'];
    const drop = [() => (tail = 'none'), () => (pattern = 'belly'), () => (glasses = 'none'), () => (neck = 'none'), () => (hat = 'none')];
    for (let i = 0; i < 5 && acc().filter(Boolean).length > maxAcc; i++) { if (acc()[i]) drop[i](); }

    const item = P.ints[0].item;
    const pose = (a.e > 0.2 && rnd() < 0.7) || rnd() < 0.2 ? 'wave' : 'down';

    // 色
    const m = DATA.moods[T.mood] || DATA.moods.sunrise;
    let h = m.h;
    if (el) { const diff = ((DATA.elementHue[el] - h + 540) % 360) - 180; h += diff * 0.12; }
    h += [0, 18, -18][vi]; const l = m.l + [0, 4, -3][vi], s = m.s;
    let acH, acS, acL;
    if (P.birth) { acH = P.birth.star.h; acS = P.birth.star.s; acL = P.birth.star.l; }
    else { acH = h + 160; acS = 70; acL = 58; }
    acS = Math.max(acS, 42); acL = U.clamp(acL, 44, 64);
    if (U.hslCircDist(acH, h) < 40 && Math.abs(acL - l) < 18) { acH = h + 170; acS = 70; acL = 56; }
    if (vi === 1) acH += 22; if (vi === 2) { acH = h + 180; acS = Math.max(acS, 60); }
    const colors = {
      body: Draw.hsl(h, s, l), shade: Draw.hsl(h, s + 6, l - 24), belly: Draw.hsl(h, Math.max(20, s - 12), Math.min(95, l + 24)), belly2: Draw.hsl(h, s, l - 6),
      inner: Draw.hsl(h - 12, Math.min(90, s + 12), Math.min(90, l + 20)), line: Draw.hsl(h, 38, 17), cheek: Draw.hsl(h - 14, 85, 74), accent: Draw.hsl(acH, acS, acL),
      horn: '#f1e3ba', flame: '#ff8a3d', bg: m.bg, hex: { body: hslToHex(h, s, l), accent: hslToHex(acH, acS, acL), line: hslToHex(h, 38, 17) },
      names: { body: colorName(h, s, l), accent: colorName(acH, acS, acL) }
    };
    // 体型の微調整：元気な人は縦に、穏やかな人は横に。個体差として±8%の揺らぎも加える
    const prop = { x: +(1 - 0.07 * a.e + (rnd() - 0.5) * 0.08).toFixed(3), y: +(1 + 0.07 * a.e + (rnd() - 0.5) * 0.08).toFixed(3) };
    return { body, ears, eyes, brows, mouth, cheeks, pattern, hat, neck, glasses, tail, item, pose, prop, colors, seed: P.seed + vi * 31 };
  }

  function describe(spec) {
    if (spec.kind === 'human') return Human.describe(spec);
    const ja = [], en = [];
    ja.push(`${J.body[spec.body]}からだ`); en.push(EN.body[spec.body]);
    ja.push(J.ears[spec.ears]); en.push(EN.ears[spec.ears]);
    ja.push(J.eyes[spec.eyes]); en.push(EN.eyes[spec.eyes]);
    ja.push(J.mouth[spec.mouth]); en.push(EN.mouth[spec.mouth]);
    ['hat', 'neck', 'glasses', 'tail'].forEach(k => { if (J[k][spec[k]]) { ja.push(J[k][spec[k]]); en.push(EN[k][spec[k]]); } });
    if (J.pattern[spec.pattern]) { ja.push(J.pattern[spec.pattern]); en.push(EN.pattern[spec.pattern]); }
    return { ja, en };
  }

  function pickFormat(P) {
    const pace = P.tags.pace, d = P.axes.d;
    if (pace === 'daily') return DATA.formats.shorts;
    if (pace === 'often') return d < 0 ? DATA.formats.shorts : DATA.formats.mid;
    if (pace === 'weekly') return d > 0.1 ? DATA.formats.long : DATA.formats.mid;
    return DATA.formats.long;
  }

  /* ---- 設計度スコア（成功の保証ではない） ---- */
  function makeScore(P) {
    const a = P.axes, T = P.tags, cl = (v, lo = 55, hi = 96) => Math.round(U.clamp(v, lo, hi));
    const free = ['said', 'love', 'vow'].filter(k => P.free[k]).length, sp = P.designs[0];
    const cont = 60 + ({ daily: -4, often: 4, weekly: 12, slow: 10 }[T.pace]) + (T.avoid.includes('grind') ? 6 : 0) + ({ '0': 8, '1': 4, '2': 0 }[T.skill]) + ((T.voice === 'text' || T.voice === 'tts') ? 5 : 0) + 4;
    const memo = 62 + 12 * Math.abs(a.q) + (sp.ears !== 'none' ? 8 : 0) + (sp.hat !== 'none' ? 4 : 0) + 6 + (sp.glasses !== 'none' ? 3 : 0);
    const warm = 58 + 18 * (a.w + 1) / 2 * 1.2 + ({ haven: 8, friend: 8, idol: 5, teacher: 3, mystery: 2 }[T.bond]) + 4;
    const axis = 58 + ({ 1: 14, 2: 10, 3: 4 }[P.ints.length] || 6) + 8 + free * 3 + (P.archetype.goal.includes(T.goal) ? 5 : 0);
    const uniq = 60 + free * 6 + 8 + 10 * Math.abs(a.q) + (P.hasBirth ? 4 : 0) + (P.ns ? 3 : 0);
    const parts = [
      { label: '続けやすさ', val: cl(cont), why: `投稿ペース「${DATA.paceLabel[T.pace]}」と制作スキルに合わせ、負担の少ない設計にしてあります。` },
      { label: '覚えやすさ', val: cl(memo), why: 'シルエットの特徴とアクセントカラーで、サムネの小ささでも識別できる強さを見ています。' },
      { label: '親しみやすさ', val: cl(warm), why: `視聴者に求める関係「${DATA.bondLabel[T.bond]}」と気質の温度から算出しています。` },
      { label: '企画の軸の明確さ', val: cl(axis), why: `「${P.ints.map(i => i.label).join('・')}」×「${DATA.goalLabel[T.goal]}」で、何のチャンネルか一言で言えるかを見ています。` },
      { label: '世界に一人だけ度', val: cl(uniq), why: 'ギャップ設定・あなた固有の言葉・占いの要素が、どれだけ反映されたかを見ています。' }
    ];
    const total = Math.round(parts.reduce((s, p) => s + p.val, 0) / parts.length);
    return { total: U.clamp(total, 62, 96), parts };
  }

  /* ---- 文章生成 ---- */
  function texts(P, vi = 0, nameIdx = 0) {
    const n = P.names[nameIdx] ? P.names[nameIdx].kana : 'ふわ';
    const A = P.archetype, G = P.gap, T = P.tags, i0 = P.ints[0], spec = P.designs[vi];
    const desc = describe(spec);
    const tagline = `${G.short}${A.name}`;
    const fmt = P.format;
    const concept = `${P.ints.map(i => i.label).join('・')}を、${tagline}の「${n}」が、${fmt.name.replace(/（.*$/, '')}で届けるチャンネル。`;

    const personal = [];
    if (P.free.said) personal.push(`あなたがよく言われる「${P.free.said}」は、${n}の口ぐせ・決め台詞の種になります。`);
    if (P.free.love) personal.push(`「${P.free.love}」が大好物。登場するたびに、ふとした場面でこの話題を持ち出してしまうのが${n}の癖です。`);
    if (P.free.vow) personal.push(`「${P.free.vow}」だけは絶対に譲らない。これがチャンネルの"芯"（視聴者との約束）になります。`);
    if (!personal.length) personal.push(`${n}は「${i0.label}」の話になると、目の色が変わります。`);

    const reasons = [];
    reasons.push(`【記憶に残る形】${(spec.kind === 'human' ? desc.ja.slice(1, 3) : desc.ja.slice(0, 2)).join('と')}、${spec.colors.names.accent.ja}のアクセント。サムネの小さな画面でも、シルエットとワンポイントの色で一瞬で識別できます。`);
    reasons.push(`【役割が明確】「${A.role}」という立ち位置が、「${P.ints.map(i => i.label).join('・')}」というテーマと直結しています。視聴者は「この人に何を頼めばいいか」を迷いません。`);
    reasons.push(`【続きを見たくなる理由】「${G.line}」というギャップが、2本目以降を見たくなるフックになります。`);
    reasons.push(`【続けられる設計】希望ペース「${DATA.paceLabel[T.pace]}」に合わせて、${fmt.name}を軸にしています。無理なく続くことが、いちばんの勝ち筋です。`);
    if (P.hasBirth) reasons.push(`【あなたらしさ】日干「${P.birth.day.stemName}」（${P.birth.day.kw}）、${P.birth.sign.name}（${P.birth.sign.kw}）、数秘${P.birth.lp.n}（${P.birth.lp.kw}）の気質を、キャラの話し方と見た目に反映しています。`);

    const traps = [];
    traps.push(`${A.name}が陥りやすい罠：${A.trap}。→ 対策：${A.cure}。`);
    T.avoid.forEach(k => traps.push(DATA.avoidAdvice[k]));
    traps.push(`このキャラの"愛される欠点"：${P.flaw}。直さず、動画のネタにしてしまうのがおすすめです。`);

    // 企画：興味ごとのネタを順に拾い、足りなければ目的別テンプレで補う（重複なし）
    const pool = []; for (let k = 0; k < 2; k++) P.ints.forEach(i => { if (i.ideas[k] && !pool.includes(i.ideas[k])) pool.push(i.ideas[k]); });
    DATA.goalIdeas[T.goal].forEach(g => { const s = g.replace('{i}', i0.label); if (!pool.includes(s)) pool.push(s); });
    const goalFill = DATA.goalIdeas[T.goal].map(g => g.replace('{i}', (P.ints[1] || i0).label));
    goalFill.forEach(s => { if (!pool.includes(s)) pool.push(s); });
    const first = [
      `はじめまして、${n}です。（キャラの誕生秘話＋チャンネルの約束を30秒で）`,
      pool[0], pool[1],
      `視聴者の質問に、${n}が答える（コメントを企画の材料にする回）`,
      pool[2],
      `【お約束シリーズ #1】${n}の決め台詞で締める、毎回同じ型の回`,
      `${n}、やらかす。（「${G.short.replace(/(な|の)$/, '')}」という設定を活かした失敗談）`,
      pool[3],
      `${i0.label}の「よくある誤解」を、${n}がひとつだけ正す`,
      `ここまでの10本を${n}が振り返る＋次の企画を視聴者に投票してもらう`
    ];

    const roadmap = [
      { t: '1〜30日', d: `まず10本。再生数は見ない期間です。${n}の声・口調・立ち絵3枚を「固定」して、ブレない土台をつくります。` },
      { t: '31〜60日', d: '反応の良かった上位2本の「型」を抽出し、シリーズ化。サムネとタイトルの見た目を統一します。' },
      { t: '61〜90日', d: 'コメントの言葉を、そのまま企画にします。視聴者が付けてくれた愛称・ツッコミを、キャラの設定として公式に採用しましょう。' }
    ];

    const palette = spec.kind === 'human' ? [
      { role: '髪', hex: spec.colors.hex.body, name: spec.colors.names.body.ja },
      { role: '服', hex: spec.colors.hex.outfit, name: spec.colors.names.outfit.ja },
      { role: 'アクセント', hex: spec.colors.hex.accent, name: spec.colors.names.accent.ja }
    ] : [
      { role: 'ベース', hex: spec.colors.hex.body, name: spec.colors.names.body.ja },
      { role: 'アクセント', hex: spec.colors.hex.accent, name: spec.colors.names.accent.ja },
      { role: 'ライン', hex: spec.colors.hex.line, name: '輪郭・文字に使う深い色' }
    ];
    const expressions = ['通常（口を閉じた状態）', P.voice.id === 'terse' ? 'ドヤ（片眉を上げる）' : 'にっこり', '驚き（目を大きく）'];

    const speech = { hello: P.voice.hello(n), closer: DATA.closers[P.voice.id][DATA.goalKind[T.goal]], style: P.voice.label, end: P.voice.end };

    return { n, tagline, concept, personal, reasons, traps, first, roadmap, palette, expressions, speech, desc, format: fmt, voiceAdvice: DATA.voiceAdvice[T.voice], skillAdvice: DATA.skillAdvice[T.skill] };
  }

  /* ---- 画像生成AI用プロンプト ---- */
  /* ---- ChatGPT（画像生成）向け 高密度プロンプト ---- */
  const STYLES = {
    flat: { label: 'フラット・ステッカー風', ja: 'フラットな2Dマスコット。太めで均一な輪郭線、シンプルなセル塗り、ステッカーのような見やすさ。', jq: 'グッズ化しても映える、シンプルで描き分けしやすい形。色数は絞り、ベタ塗り中心。',
      en: 'Flat 2D vector mascot, thick uniform outline, simple cel shading, sticker-like clarity', eq: 'Merchandise-ready, simple and easy to redraw, limited flat colors.' },
    anime: { label: 'アニメ調（美麗）', ja: 'アニメ調の美麗イラスト。クリーンな線画、繊細なセル塗り、やわらかなグラデーション。', jq: '商業イラスト級の完成度。瞳の奥行きと髪の艶を特に丁寧に描き込む。',
      en: 'Beautiful Japanese anime-style illustration, clean line art, refined cel shading with soft gradients', eq: 'Professional commercial-illustration quality; especially detailed eyes and glossy hair.' },
    live2d: { label: 'Vtuber立ち絵（Live2D向け）', ja: 'Vtuberの立ち絵（Live2D向け）。左右対称の正面バストアップ、クリアなセル塗り、髪（前髪・横髪・後ろ髪）・顔・服をパーツ分けしやすい形。口は閉じた基本表情。', jq: '配信モデルとして動かしても破綻しない、すっきりした塗り分け。',
      en: 'VTuber model-sheet style: symmetrical front-facing bust-up, clean cel shading, hair (front/side/back), face and outfit drawn as cleanly separable shapes (Live2D-ready), neutral closed-mouth default pose', eq: 'Clean shape separation that will not break when animated.' },
    picture: { label: '絵本・水彩風', ja: '絵本のような手描き水彩。紙のざらつき、にじみ、あたたかな色合い。', jq: '線は柔らかく、色の重なりに深みを持たせる。',
      en: 'Hand-painted picture-book watercolor, visible paper grain, soft bleeding edges, warm gentle colors', eq: 'Soft lines and layered translucent color.' },
    clay: { label: 'クレイ（粘土）風', ja: '粘土・ストップモーション風の3D。指紋のような手触り、やわらかなスタジオ照明。', jq: '素材の質感が伝わる、愛嬌のある立体感。',
      en: 'Cute 3D clay / plasticine stop-motion look with tactile fingerprint texture and soft studio lighting', eq: 'Charming sculpted volume that conveys the material.' }
  };

  const SKIN = { fair: ['透明感のある色白の肌', 'porcelain fair skin'], light: ['明るく健康的な肌色', 'light healthy skin tone'], tan: ['やや日に焼けた健康的な肌', 'warm tan skin'], deep: ['深みのある褐色の肌', 'deep brown skin'] };

  function promptCore(P, vi, nameIdx) {
    const t = texts(P, vi, nameIdx), spec = P.designs[vi], d = describe(spec), a = P.axes, A = P.archetype;
    const j = [], e = [];
    if (a.w > 0.25) { j.push('親しみやすく、見る人に安心感を与える柔らかな雰囲気'); e.push('warm, approachable and reassuring'); }
    else if (a.w < -0.25) { j.push('凛とした静かな自信と、知的で少し距離を感じる眼差し'); e.push('composed, intelligent, with a quietly confident gaze'); }
    else { j.push('自然体で穏やかな雰囲気'); e.push('natural and calm'); }
    if (a.e > 0.25) { j.push('生き生きとした躍動感'); e.push('lively and energetic'); } else if (a.e < -0.25) { j.push('落ち着いた静けさ'); e.push('serene and still'); }
    if (a.h > 0.25) { j.push('いたずらっぽい光が目に宿っている'); e.push('a playful glint in the eyes'); } else if (a.h < -0.25) { j.push('誠実でまっすぐな目つき'); e.push('sincere, straightforward eyes'); }
    if (a.q > 0.3) { j.push('一目で記憶に残る独特の個性'); e.push('a distinctive, instantly memorable individuality'); }
    return { t, spec, d, a, A, mood: { j: j.join('、'), e: e.join(', ') } };
  }

  /** 戻り値: { main, follow:[{label, desc, text}] } */
  function buildPrompts(P, vi, nameIdx, styleId, lang) {
    const { t, spec, d, a, A, mood } = promptCore(P, vi, nameIdx);
    const st = STYLES[styleId] || STYLES.anime, C = spec.colors, human = spec.kind === 'human', male = P.gender === 'm', isV = P.styleKind === 'vtuber';
    const ja = lang === 'ja', SIZE = 'OUTPUT SIZE: 1405 x 2000 px, portrait.';
    const lean = a.e > 0.25 ? ['カメラへほんの少し身を乗り出す', 'leaning slightly toward the camera'] : ['まっすぐこちらを見つめる', 'looking straight at the viewer'];
    const SAME = ja ? '【添付：直前に生成した決定版の画像】この画像と完全に同一のキャラクター（髪型・髪色・瞳・肌・服・小物・配色・顔立ち）として、一切の変更なしで描いてください。'
      : '[Attach: the final image generated just before] Draw EXACTLY the same character (hairstyle, hair color, eyes, skin, outfit, accessories, palette, facial features) with no changes.';
    const lines = [];
    const H = s => lines.push(ja ? `\n## ${s[0]}` : `\n## ${s[1]}`);
    const L = (x, y) => lines.push(ja ? x : y);

    if (human) {
      const who = ja ? (male ? '美少年・イケメン' : '美少女') : (male ? 'handsome young man' : 'cute young woman');
      L(`顔出しなしYouTubeチャンネルの「顔」になる、オリジナルの${who}キャラクターを、プロのイラストレーター品質の「決定版1枚」として描いてください。${isV ? 'Vtuberのアバターとして使う想定です。' : ''}`,
        `Create ONE definitive, professional-quality illustration of an ORIGINAL ${who} character who will be the face of a faceless YouTube channel.${isV ? ' It will be used as a VTuber avatar.' : ''}`);
      H(['キャラクター', 'Character']);
      L(`- 名前：${t.n}（※画像内に文字は入れません）`, `- Name: ${t.n} (do NOT render any text in the image)`);
      L(`- 役割：${A.name}（${A.role}）`, `- Role: ${ARCH_EN[A.id]}`);
      L(`- 雰囲気：${mood.j}`, `- Mood: ${mood.e}`);
      L(`- 内面のギャップ（目元・小物・仕草のどこかにさりげなく滲ませる）：${P.gap.line}`, `- Hidden contrast (hint at it subtly through the eyes, an accessory or a gesture): "${P.gap.line}" (translate the idea faithfully)`);
      H(['外見（この指定を厳守）', 'Appearance (follow strictly)']);
      L(`- 年齢の印象：20代前半の若者`, `- Apparent age: early twenties`);
      L(`- 髪：${C.names.body.ja}（${C.hex.body}）の${Human.JA.hairBack[spec.hairBack]}、${Human.JA.hairFront[spec.hairFront]}。毛先まで艶のあるハイライトと自然な透け感、毛束の流れが分かるまで描き込む${spec.ahoge ? '。頭頂にアホ毛を1本' : ''}`,
        `- Hair: ${C.names.body.en} (${C.hex.body}), ${Human.EN.hairBack[spec.hairBack]} with ${Human.EN.hairFront[spec.hairFront]}; glossy highlights, natural translucency at the tips, visible strand flow${spec.ahoge ? '; one ahoge strand on top' : ''}`);
      L(`- 瞳：${C.names.accent.ja}系（${C.hex.iris}）の${Human.JA.eyes[spec.eyes]}。虹彩に繊細なグラデーション、大小2〜3個のハイライトで奥行きを出す`,
        `- Eyes: ${C.names.accent.en}-toned iris (${C.hex.iris}), ${Human.EN.eyes[spec.eyes]}; delicate iris gradient with 2-3 highlights of different sizes for depth`);
      L(`- 肌：${SKIN[spec.skinKey][0]}。頬にほんのり血色、自然な陰影`, `- Skin: ${SKIN[spec.skinKey][1]}, a faint blush on the cheeks, natural shading`);
      L(`- 表情：${Human.JA.mouth[spec.mouth]}`, `- Expression: ${Human.EN.mouth[spec.mouth]}`);
      L(`- 服装：${Human.JA.outfit[spec.outfit]}。${C.names.outfit.ja}（${C.hex.outfit}）を基調に、差し色として${C.names.accent.ja}（${C.hex.accent}）。布の質感と縫い目まで丁寧に`,
        `- Outfit: ${Human.EN.outfit[spec.outfit]} in ${C.names.outfit.en} (${C.hex.outfit}), with ${C.names.accent.en} (${C.hex.accent}) as the accent color; render fabric texture and stitching carefully`);
      const acc = d.ja.filter(x => /メガネ|ヘッドセット|耳|リボン|ヘアピン|ピアス/.test(x)), accE = d.en.filter(x => /glasses|headset|ears|ribbon|clips|earrings/.test(x));
      if (acc.length) L(`- 装飾：${acc.join('、')}`, `- Accessories: ${accE.join(', ')}`);
      L(`- トレードマーク：${J.item[spec.item]}を、画面の端にさりげなく配置`, `- Signature motif: ${EN.item[spec.item]}, placed subtly at the edge of the frame`);
      H(['配色（3色に絞る）', 'Palette (3 colors only)']);
      L(`髪 ${C.names.body.ja}（${C.hex.body}）／服 ${C.names.outfit.ja}（${C.hex.outfit}）／差し色 ${C.names.accent.ja}（${C.hex.accent}）。サムネイルサイズでも一瞬で識別できる強いシルエットにする。`, `Hair ${C.names.body.en} ${C.hex.body} / outfit ${C.names.outfit.en} ${C.hex.outfit} / accent ${C.names.accent.en} ${C.hex.accent}. The silhouette must stay instantly recognizable at thumbnail size.`);
      H(['構図・ライティング', 'Composition & lighting']);
      L(`正面向きのバストアップ（胸から上）を画面中央に1体のみ。${lean[0]}。やわらかなスタジオ照明に、差し色（${C.hex.accent}）のリムライトを添える。背景は無地の白（切り抜きしやすく）。`,
        `A single front-facing bust-up (chest and above), centered, ${lean[1]}. Soft studio lighting with a rim light in the accent color (${C.hex.accent}). Plain white background for easy cut-out.`);
    } else {
      L(`顔出しなしYouTubeチャンネルの「顔」になる、オリジナルのマスコットキャラクターを、プロのイラストレーター品質の「決定版1枚」として描いてください。`,
        `Create ONE definitive, professional-quality illustration of an ORIGINAL mascot character who will be the face of a faceless YouTube channel.`);
      H(['キャラクター', 'Character']);
      L(`- 名前：${t.n}（※画像内に文字は入れません）`, `- Name: ${t.n} (do NOT render any text in the image)`);
      L(`- 役割：${A.name}（${A.role}）`, `- Role: ${ARCH_EN[A.id]}`);
      L(`- 雰囲気：${mood.j}`, `- Mood: ${mood.e}`);
      L(`- 内面のギャップ（表情や仕草にさりげなく）：${P.gap.line}`, `- Hidden contrast (hint at it subtly in expression or gesture): "${P.gap.line}" (translate the idea faithfully)`);
      H(['外見（この指定を厳守）', 'Appearance (follow strictly)']);
      L(`- ${d.ja.join('、')}`, `- ${d.en.join('; ')}`);
      L(`- 手に「${J.item[spec.item]}」を持つ（トレードマーク）`, `- Holding ${EN.item[spec.item]} as its signature item`);
      L(`- 顔のパーツは少なく、表情がはっきり伝わる。体は丸みのあるシンプルな形`, `- Few facial features but a clearly readable expression; a simple, rounded body shape`);
      H(['配色（3色に絞る）', 'Palette (3 colors only)']);
      L(`ベース ${C.hex.body}（${C.names.body.ja}）／アクセント ${C.hex.accent}（${C.names.accent.ja}）／輪郭 ${C.hex.line}。サムネイルサイズでも一瞬で識別できる強いシルエットにする。`,
        `Base ${C.hex.body} (${C.names.body.en}) / accent ${C.hex.accent} (${C.names.accent.en}) / outline ${C.hex.line}. The silhouette must stay instantly recognizable at thumbnail size.`);
      H(['構図・ライティング', 'Composition & lighting']);
      L(`正面向きの全身立ち絵を画面中央に1体のみ。${lean[0]}。やわらかなスタジオ照明、足元にやさしい影。背景は無地の白。`,
        `A single front-facing full-body standing view, centered, ${lean[1]}. Soft studio lighting, a gentle shadow at the feet. Plain white background.`);
    }
    H(['画風・品質', 'Style & quality']);
    L(`${st.ja}${st.jq}\n高解像度。線画は繊細で均一、質感（髪・瞳・布・肌）を丁寧に描き分ける。`, `${st.en}. ${st.eq}\nHigh resolution; refined, even line work; carefully differentiated textures (hair, eyes, fabric, skin).`);
    H(['禁止事項', 'Do NOT']);
    L(`・画像内に文字・ロゴ・透かしを入れない\n・余計な人物・小物・背景を描かない\n・顔や目の左右非対称な崩れ、不自然なパーツを避ける\n・指定した髪型・髪色・服・配色を勝手に変えない`,
      `- No text, logos or watermarks in the image\n- No extra characters, props or background elements\n- Avoid asymmetrical or malformed facial features\n- Do not alter the specified hairstyle, colors or outfit`);
    L(`\n（添付画像がある場合）添付した簡易画像は、配色・パーツ構成・シルエットの目安です。顔立ちや質感はこの文章を優先し、より美しく描き込んでください。`,
      `\n(If an image is attached) The attached simple image is only a guide for palette, parts and silhouette. Prioritize this text and render the face and textures far more beautifully.`);
    L(SIZE, SIZE);
    const main = lines.join('\n').trim();

    // ---- 追撃プロンプト（主役の決定版を生成したあとに続けて使う）----
    const f = [];
    f.push({ label: '表情差分シート（6種）', desc: '動画で使い回す表情をまとめて生成',
      text: ja ? `${SAME}\n表情差分シートを作ってください。${human ? 'バストアップ' : '全身'}6種を3×2で整然と配置：①通常 ②にっこり ③驚き ④困り顔 ⑤ドヤ顔 ⑥照れ。背景は無地の白、文字なし、各コマの画風と大きさを揃える。\n${SIZE}`
        : `${SAME}\nCreate an expression sheet: six ${human ? 'bust-up' : 'full-body'} poses neatly arranged in a 3x2 grid: neutral, smiling, surprised, troubled, smug, shy. Plain white background, no text, consistent style and scale.\n${SIZE}` });
    if (human) f.push({ label: '全身立ち絵', desc: '全身のバランス・服の全体像を確認',
      text: ja ? `${SAME}\n同一人物の全身立ち絵（正面・自然なポーズ・足先まで）を描いてください。服のデザインを全体が分かるように、背景は無地の白、文字なし。\n${SIZE}`
        : `${SAME}\nDraw a full-body standing view of the same character (front, natural pose, feet included) so the whole outfit design is clear. Plain white background, no text.\n${SIZE}` });
    else f.push({ label: '三面図（正面・横・背面）', desc: 'グッズ・アニメーション制作に使える設計図',
      text: ja ? `${SAME}\n同一キャラクターの三面図（正面・横・背面）を横並びで描いてください。大きさと線の太さを揃え、背景は無地の白、文字なし。\n${SIZE}`
        : `${SAME}\nDraw a turnaround sheet (front, side, back) of the same character side by side, same scale and line weight, plain white background, no text.\n${SIZE}` });
    f.push({ label: 'YouTubeサムネイル用（16:9）', desc: 'キャラを左に、右に文字用の余白',
      text: ja ? `${SAME}\nYouTubeサムネイル用の背景付きイラストを描いてください。16:9（1280×720px）。キャラは画面の左寄りに大きく配置し、右半分は後からタイトル文字を載せるための余白にする（文字は入れない）。背景は${DATA.moods[P.tags.mood].label}の雰囲気で、差し色（${C.hex.accent}）を活かしたシンプルなグラデーション。キャラの輪郭が背景から浮き立つよう縁取りと光を添える。`
        : `${SAME}\nDraw a YouTube thumbnail illustration, 16:9 (1280x720 px). Place the character large on the left; keep the right half empty for title text later (render no text). Background: a simple gradient in a "${DATA.moods[P.tags.mood].label}" mood using the accent color (${C.hex.accent}). Add a rim light/outline so the silhouette pops from the background.` });
    f.push({ label: 'アイコン用（顔アップ・1:1）', desc: 'チャンネルアイコン・SNSアイコン',
      text: ja ? `${SAME}\nチャンネルアイコン用に、顔と肩までのクローズアップを正方形（1:1）で描いてください。円形にトリミングしても顔が切れない余白を取り、背景は差し色（${C.hex.accent}）の単色。文字なし。`
        : `${SAME}\nDraw a square (1:1) close-up of the face and shoulders for a channel icon. Leave enough margin so a circular crop keeps the whole face; solid background in the accent color (${C.hex.accent}). No text.` });
    if (isV) f.push({ label: 'Live2D用パーツ分け参考', desc: 'Vtuberモデル制作を外注・自作する際の素材',
      text: ja ? `${SAME}\nLive2Dでモデル化することを想定して、左右対称の正面バストアップ、口を閉じた基本表情で描き直してください。髪（前髪・横髪・後ろ髪）、顔、目（白目・虹彩・まつ毛）、眉、口、首、体、服を、後からパーツ分けしやすい明確な塗り分けにする。背景は無地の白、文字なし。\n${SIZE}`
        : `${SAME}\nRedraw it for Live2D rigging: symmetrical front-facing bust-up with a neutral closed mouth. Make hair (front/side/back), face, eyes (sclera/iris/lashes), brows, mouth, neck, body and clothes clearly separable by distinct shading. Plain white background, no text.\n${SIZE}` });
    return { main, follow: f };
  }
  function makePrompt(P, vi, nameIdx, styleId, lang) { return buildPrompts(P, vi, nameIdx, styleId, lang).main; }

  function shareText(P, vi, nameIdx) {
    const t = texts(P, vi, nameIdx);
    return `私のIPキャラは「${t.n}」（${t.tagline}）。IP適合度${P.score.total}。\nあなたに合うYouTube用キャラも診断してみて！ #あなたのIPキャラ診断`;
  }

  const COMBOS = 955514880;
  const KIND_LABEL = (P) => P.styleKind === 'mascot' ? 'ゆるキャラ・マスコット' : P.styleKind === 'anime' ? (P.gender === 'm' ? '美少年・イケメン系' : '美少女系') + '（アニメ風）' : 'Vtuber風（' + (P.gender === 'm' ? '男性' : '女性') + '）';
  const STYLE_LIST = { mascot: ['flat', 'anime', 'picture', 'clay'], human: ['anime', 'live2d', 'picture', 'flat'] };
  return { buildPrompts, hslToHex, analyze, texts, describe, makePrompt, shareText, STYLES, STYLE_LIST, KIND_LABEL, J, EN, COMBOS, colorName };
})();
if (typeof module !== 'undefined') module.exports = Engine;
