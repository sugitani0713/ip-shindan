/* 占いの計算（すべて端末内・外部通信なし）
   日干(算命学/四柱推命の日柱)・太陽星座・数秘術ライフパス・九星気学の本命星・名前の音 */
const Div = (() => {
  const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const STEM_EL = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
  const STEM_KW = [
    '大樹のようにまっすぐ', 'しなやかな草花のように粘り強い', '太陽のように周りを明るく照らす', '灯火のように静かに人を温める',
    '山のようにどっしり構える', '田畑のように人を育てる', '鉄のように鋭く決断する', '宝石のように繊細に光る',
    '大河のように大きく流れる', '雨露のようにじわじわ染み込む'];
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // 日柱: 1900-01-01 = 甲戌(index 10) を基準にした60干支
  function dayPillar(y, m, d) {
    const t = Date.UTC(y, m - 1, d), base = Date.UTC(1900, 0, 1);
    const days = Math.round((t - base) / 86400000);
    const idx = (((days + 10) % 60) + 60) % 60;
    return { idx, stem: idx % 10, branch: idx % 12, stemName: STEMS[idx % 10], branchName: BRANCHES[idx % 12], el: STEM_EL[idx % 10], yang: (idx % 10) % 2 === 0, kw: STEM_KW[idx % 10] };
  }

  const SIGN_START = [[1, 20, '水瓶座'], [2, 19, '魚座'], [3, 21, '牡羊座'], [4, 20, '牡牛座'], [5, 21, '双子座'], [6, 22, '蟹座'],
    [7, 23, '獅子座'], [8, 23, '乙女座'], [9, 23, '天秤座'], [10, 24, '蠍座'], [11, 23, '射手座'], [12, 22, '山羊座']];
  const SIGNS = {
    '牡羊座': { el: '火', kw: '先陣を切る行動力', mode: '活動' }, '牡牛座': { el: '地', kw: '五感を信じる粘り強さ', mode: '固定' },
    '双子座': { el: '風', kw: '軽やかな好奇心と言葉', mode: '柔軟' }, '蟹座': { el: '水', kw: '仲間を守る共感力', mode: '活動' },
    '獅子座': { el: '火', kw: '堂々とした表現力', mode: '固定' }, '乙女座': { el: '地', kw: '細部への誠実さ', mode: '柔軟' },
    '天秤座': { el: '風', kw: '調和とセンス', mode: '活動' }, '蠍座': { el: '水', kw: '深く潜る集中力', mode: '固定' },
    '射手座': { el: '火', kw: '自由と探究心', mode: '柔軟' }, '山羊座': { el: '地', kw: '積み上げる忍耐', mode: '活動' },
    '水瓶座': { el: '風', kw: '常識にとらわれない発想', mode: '固定' }, '魚座': { el: '水', kw: '想像力と包容力', mode: '柔軟' }
  };
  function sunSign(m, d) {
    let name = '山羊座';
    for (const [mm, dd, n] of SIGN_START) { if (m > mm || (m === mm && d >= dd)) name = n; }
    return { name, ...SIGNS[name] };
  }

  const LP = {
    1: ['開拓者', '自分で道を切り拓く'], 2: ['調和者', '人と人をやわらかくつなぐ'], 3: ['表現者', '楽しさを言葉や形にする'],
    4: ['構築者', '地道に積み上げて型をつくる'], 5: ['自由人', '変化と体験を取りに行く'], 6: ['愛情者', '面倒を見て、守る'],
    7: ['探究者', 'ひとりで深く潜って本質を掴む'], 8: ['実現者', '成果と影響力を形にする'], 9: ['理想家', '広く深く、惜しみなく与える'],
    11: ['直感の伝道師', '感じ取ったものを人に伝える'], 22: ['大きな構築者', '大きな仕組みを現実にする'], 33: ['無償の教師', '惜しみなく教え、癒す']
  };
  function reduce(n) { while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = String(n).split('').reduce((a, c) => a + (+c), 0); return n; }
  function lifePath(y, m, d) { const n = reduce(reduce(y) + reduce(m) + reduce(d)); return { n, name: LP[n][0], kw: LP[n][1] }; }

  // 九星気学（立春=2/4で年を切り替える簡易版）
  const NINE = [
    null,
    { n: '一白水星', h: 205, s: 50, l: 70, kw: '柔軟で、人に寄り添う', el: '水' },
    { n: '二黒土星', h: 255, s: 14, l: 36, kw: '黙々と支える', el: '土' },
    { n: '三碧木星', h: 172, s: 60, l: 46, kw: '勢いよく伸びる', el: '木' },
    { n: '四緑木星', h: 110, s: 42, l: 48, kw: '誠実に信頼を集める', el: '木' },
    { n: '五黄土星', h: 45, s: 85, l: 55, kw: '中心で場を動かす', el: '土' },
    { n: '六白金星', h: 215, s: 10, l: 76, kw: '筋を通して導く', el: '金' },
    { n: '七赤金星', h: 2, s: 72, l: 58, kw: '華やかに楽しませる', el: '金' },
    { n: '八白土星', h: 35, s: 30, l: 82, kw: '変化を見極め、蓄える', el: '土' },
    { n: '九紫火星', h: 272, s: 48, l: 56, kw: '閃きと美意識で魅せる', el: '火' }
  ];
  function nineStar(y, m, d) {
    const yy = (m < 2 || (m === 2 && d < 4)) ? y - 1 : y;
    let s = String(yy).split('').reduce((a, c) => a + (+c), 0);
    while (s > 9) s = String(s).split('').reduce((a, c) => a + (+c), 0);
    let k = 11 - s; while (k > 9) k -= 9; while (k < 1) k += 9;
    return { k, ...NINE[k] };
  }

  const PAST = [
    ['夜の港を守った灯台守', '暗いなかで、迷う人の目印になる力'], ['山あいで土をこねた陶工', '地味な作業を、美しい形に変える力'],
    ['旅から旅へ渡った薬売り', '行く先々で人の困りごとを聞き、役立てる力'], ['里の子に読み書きを教えた師匠', 'むずかしいことを、やさしく手渡す力'],
    ['星の動きを読んだ暦の役人', '遠い先の流れを、いまの言葉にする力'], ['異国の言葉をつないだ通訳', '違う世界の人どうしを橋渡しする力'],
    ['祭りを取り仕切った町の世話役', '場を盛り上げ、人を巻き込む力'], ['庭を育て続けた庭師', '時間をかけて、静かに美しさを育てる力'],
    ['辻に立って語った講釈師', '聞き手の心をつかむ、語りの間'], ['反物を染め上げた職人', '色と質感で、記憶に残るものをつくる力'],
    ['峠を守った関所の番人', '一度決めた約束を、守り抜く力'], ['夜道に灯りを運んだ飛脚', '必要な人へ、必要なものを確実に届ける力']
  ];

  // ---- 名前の音（ひらがな読み → 母音・音の質感）----
  const VOW = {
    a: 'あかさたなはまやらわがざだばぱぁゃ', i: 'いきしちにひみりぎじぢびぴぃ', u: 'うくすつぬふむゆるぐずづぶぷぅゅゔ',
    e: 'えけせてねへめれげぜでべぺぇ', o: 'おこそとのほもよろをごぞどぼぽぉょ'
  };
  const VOW_OF = {}; Object.keys(VOW).forEach(v => { for (const ch of VOW[v]) VOW_OF[ch] = v; });
  const VOWEL_INFO = {
    a: { label: 'ア段（開放）', kw: '明るく開けた声', bias: { e: 0.5, w: 0.3 } },
    i: { label: 'イ段（鋭敏）', kw: '細やかで鋭い感性', bias: { w: -0.3, q: 0.3, d: 0.2 } },
    u: { label: 'ウ段（内省）', kw: '内側へ潜る静けさ', bias: { e: -0.4, d: 0.4 } },
    e: { label: 'エ段（社交）', kw: '軽やかで人当たりがよい', bias: { h: 0.4, w: 0.3 } },
    o: { label: 'オ段（包容）', kw: '丸く包み込む安心感', bias: { w: 0.4, e: -0.2, h: -0.2 } }
  };
  const ROW_TEXTURE = [
    ['あいうえお', '開', 'まっすぐ開いた'], ['かきくけこがぎぐげご', '硬', '芯の通った'], ['さしすせそざじずぜぞ', '鋭', '切れ味のある'],
    ['たちつてとだぢづでど', '硬', '歯切れのよい'], ['なにぬねの', '柔', 'やわらかい'], ['はひふへほ', '軽', '息の抜けた軽い'],
    ['ばびぶべぼぱぴぷぺぽ', '軽', '弾むような'], ['まみむめも', '柔', '丸みのある'], ['やゆよ', '流', 'なめらかな'], ['らりるれろ', '流', '流れるような'], ['わをん', '流', 'ふんわりした']
  ];
  const TEX_BIAS = { '開': { e: 0.2 }, '硬': { e: 0.1, h: -0.1 }, '鋭': { w: -0.3 }, '柔': { w: 0.3, e: -0.1 }, '軽': { h: 0.3 }, '流': { q: 0.2, e: -0.1 } };

  function toHira(s) { return s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)); }
  function nameSound(raw) {
    if (!raw) return null;
    const s = toHira(raw.normalize('NFKC')).toLowerCase();
    const counts = { a: 0, i: 0, u: 0, e: 0, o: 0 };
    let last = null, mora = 0, first = null;
    for (const ch of s) {
      if (ch === 'ゃ' || ch === 'ゅ' || ch === 'ょ') { if (last) { counts[last]--; const v = VOW_OF[ch]; counts[v]++; last = v; } continue; }
      if (ch === 'ー') { if (last) { counts[last]++; mora++; } continue; }
      if (ch === 'っ' || ch === 'ん') { mora++; continue; }
      if (VOW_OF[ch]) { last = VOW_OF[ch]; counts[last]++; mora++; if (!first) first = ch; continue; }
      if (/[aiueo]/.test(ch)) { last = ch; counts[ch]++; mora++; if (!first) first = ch; }
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total < 1) return null;
    const dom = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    let tex = null;
    if (first) for (const [chars, t, label] of ROW_TEXTURE) if (chars.includes(first)) { tex = { t, label }; break; }
    return { counts, dom, mora, info: VOWEL_INFO[dom], tex };
  }

  function birth(y, m, d) {
    const day = dayPillar(y, m, d), sign = sunSign(m, d), lp = lifePath(y, m, d), star = nineStar(y, m, d);
    const past = PAST[day.branch];
    // 占いによる気質の傾き（-1〜1）
    const b = { w: 0, e: 0, h: 0, q: 0, d: 0 }; const add = o => { for (const k in o) b[k] += o[k]; };
    add({ e: day.yang ? 0.4 : -0.4 });
    add({ 木: { w: 0.3, d: 0.2 }, 火: { e: 0.5, h: 0.3 }, 土: { w: 0.4, h: -0.2, q: -0.2 }, 金: { w: -0.4, h: -0.4 }, 水: { d: 0.5, e: -0.3, q: 0.3 } }[day.el]);
    add({ 火: { e: 0.4, h: 0.1 }, 地: { h: -0.3, q: -0.3 }, 風: { h: 0.4, d: -0.3 }, 水: { w: 0.4, d: 0.3 } }[sign.el]);
    add({
      1: { e: 0.3, q: 0.3 }, 2: { w: 0.4, e: -0.2 }, 3: { h: 0.5, d: -0.2 }, 4: { h: -0.4, q: -0.3 }, 5: { q: 0.4, e: 0.4 }, 6: { w: 0.5, h: -0.2 },
      7: { d: 0.5, w: -0.3, e: -0.3 }, 8: { h: -0.3, e: 0.3 }, 9: { w: 0.3, d: 0.3 }, 11: { q: 0.4, d: 0.3 }, 22: { h: -0.3, d: 0.4 }, 33: { w: 0.5 }
    }[lp.n]);
    for (const k in b) b[k] = Math.tanh(b[k]);
    return { day, sign, lp, star, past, bias: b };
  }

  const out = { dayPillar, sunSign, lifePath, nineStar, nameSound, birth, STEMS, BRANCHES, VOWEL_INFO, TEX_BIAS, NINE };
  if (typeof module !== 'undefined') module.exports = out;
  return out;
})();
