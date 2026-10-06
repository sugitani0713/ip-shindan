/* UI制御 */
(() => {
  const $ = s => document.querySelector(s), E = U.esc;
  const screens = ['start', 'profile', 'quiz', 'free', 'loading', 'result'];
  const state = { styleKind: 'auto', gender: 'n', lastInput: null, name: '', birth: null, useDiv: false, answers: {}, interests: [], free: {}, qi: 0, P: null, vi: 0, ni: 0, style: 'flat', lang: 'ja' };

  // 設問リスト：通常12問＋興味(複数)
  const QUESTIONS = DATA.questions.concat([{
    key: 'interest', type: 'multi', max: 3, text: '発信したいテーマに近いものは？（3つまで）',
    opts: DATA.interests.map(i => ({ v: i.id, t: i.label, d: {} })), chips: true
  }]);

  function show(id) {
    screens.forEach(s => $('#s-' + s).classList.toggle('active', s === id));
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  /* ---- プロフィール ---- */
  document.querySelectorAll('#segKind button').forEach(b => b.onclick = () => { state.styleKind = b.dataset.k; document.querySelectorAll('#segKind button').forEach(x => x.classList.toggle('on', x === b)); });
  document.querySelectorAll('#segGender button').forEach(b => b.onclick = () => { state.gender = b.dataset.g; document.querySelectorAll('#segGender button').forEach(x => x.classList.toggle('on', x === b)); });
  $('#startBtn').onclick = () => show('profile');
  $('#brandBtn').onclick = () => show('start');
  $('#aboutBtn').onclick = () => $('#aboutDlg').showModal();
  $('#profBack').onclick = () => show('start');
  function readProfile(skip) {
    state.name = $('#inName').value.trim();
    const b = $('#inBirth').value;
    state.birth = null; state.useDiv = false;
    if (!skip && b) {
      const [y, m, d] = b.split('-').map(Number);
      if (y >= 1900 && m && d) { state.birth = { y, m, d }; state.useDiv = true; }
    }
    if (skip) state.name = state.name; // 名前は残す
    const msg = $('#profileMsg');
    if (!skip && state.name && !Div.nameSound(state.name)) msg.textContent = '※ 名前の“音”を読み取れませんでした（ひらがな・カタカナで入力すると反映されます）。このまま進めても大丈夫です。';
    else msg.textContent = '';
  }
  $('#profNext').onclick = () => { readProfile(false); startQuiz(); };
  $('#skipDiv').onclick = () => { readProfile(true); startQuiz(); };

  /* ---- アンケート ---- */
  function startQuiz() { state.qi = Math.min(state.qi, QUESTIONS.length - 1); renderQ(); show('quiz'); }
  function renderQ() {
    const q = QUESTIONS[state.qi];
    $('#quizStep').textContent = `STEP 2 / 3　質問 ${state.qi + 1} / ${QUESTIONS.length}`;
    $('#progBar').style.width = `${(state.qi / QUESTIONS.length) * 100}%`;
    $('#quizQ').textContent = q.text;
    $('#quizHint').textContent = q.type === 'multi' ? `当てはまるものを選んでください（最大${q.max}つ・1つ以上）` : '';
    const cur = q.key === 'interest' ? state.interests : state.answers[q.key];
    const box = $('#quizOpts'); box.innerHTML = ''; box.classList.toggle('chips', !!q.chips);
    q.opts.forEach(o => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'opt'; b.textContent = o.t;
      const on = Array.isArray(cur) ? cur.includes(o.v) : cur === o.v;
      b.setAttribute('aria-pressed', on ? 'true' : 'false'); if (on) b.classList.add('on');
      b.onclick = () => pick(q, o.v);
      box.appendChild(b);
    });
    $('#quizNext').style.visibility = q.type === 'multi' ? 'visible' : 'hidden';
    $('#quizNext').textContent = state.qi === QUESTIONS.length - 1 ? '次へ（最後のステップ）' : '次へ';
    updateNext(q);
  }
  function pick(q, v) {
    if (q.type === 'single') {
      state.answers[q.key] = v; renderQ();
      setTimeout(() => next(), 180);
      return;
    }
    const arr = q.key === 'interest' ? state.interests : (state.answers[q.key] = state.answers[q.key] || []);
    const i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1); else { if (arr.length >= q.max) arr.shift(); arr.push(v); }
    renderQ();
  }
  function updateNext(q) {
    const cur = q.key === 'interest' ? state.interests : state.answers[q.key];
    const ok = q.type === 'multi' ? (q.key === 'interest' ? cur.length >= 1 : true) : cur != null;
    $('#quizNext').disabled = !ok;
  }
  function next() {
    if (state.qi < QUESTIONS.length - 1) { state.qi++; renderQ(); }
    else show('free');
  }
  $('#quizNext').onclick = next;
  $('#quizBack').onclick = () => { if (state.qi > 0) { state.qi--; renderQ(); } else show('profile'); };
  $('#freeBack').onclick = () => { state.qi = QUESTIONS.length - 1; renderQ(); show('quiz'); };

  /* ---- 診断実行 ---- */
  const LOAD = ['気質を5つの軸に整理しています…', '名前の音を数えています…', '星と干支を読み解いています…', 'あなたの原型を探しています…', '世界に一人だけの見た目を組み立てています…', '勝ち筋を書き出しています…'];
  $('#freeGo').onclick = () => {
    state.free = { said: $('#fSaid').value, love: $('#fLove').value, vow: $('#fVow').value };
    show('loading');
    let i = 0; const el = $('#loadMsg'); el.textContent = LOAD[0];
    const iv = setInterval(() => { i++; if (i < LOAD.length) el.textContent = LOAD[i]; }, 420);
    setTimeout(() => {
      clearInterval(iv);
      try {
        const b = state.birth || {};
        state.lastInput = { name: state.name, y: b.y, m: b.m, d: b.d, useDiv: state.useDiv, answers: state.answers, interests: state.interests, free: state.free };
        state.P = Engine.analyze({ ...state.lastInput, styleKind: state.styleKind, gender: state.gender });
        state.vi = 0; state.ni = 0; state.style = (state.P.styleKind === 'vtuber' ? 'live2d' : Engine.STYLE_LIST[state.P.styleKind === 'mascot' ? 'mascot' : 'human'][0]); renderResult(); show('result');
      } catch (e) { console.error(e); el.textContent = 'エラーが発生しました。もう一度お試しください。'; setTimeout(() => show('free'), 1800); }
    }, 420 * LOAD.length + 200);
  };

  /* ---- 結果 ---- */
  const bar = (v) => `<div class="bar"><i style="width:${Math.round(v)}%"></i></div>`;
  function renderResult() {
    const P = state.P, t = Engine.texts(P, state.vi, state.ni), spec = P.designs[state.vi], A = P.archetype, S = P.secondary;
    const svg = Draw.svg(spec, { uid: 'hero' });
    const chips = [];
    if (P.hasBirth) chips.push(P.birth.sign.name, `数秘 ${P.birth.lp.n}`, P.birth.star.n, `日干 ${P.birth.day.stemName}（${P.birth.day.el}）`);
    if (P.ns) chips.push(`名前の音：${P.ns.info.label}`);
    chips.unshift(Engine.KIND_LABEL(P));
    chips.push(`世界観：${DATA.moods[P.tags.mood].label}`);

    const variants = P.designs.map((d, i) => `<button type="button" class="vbtn ${i === state.vi ? 'on' : ''}" data-v="${i}" aria-label="デザイン案${i + 1}">${Draw.svg(d, { uid: 'v' + i, width: 84, height: 109 })}<span>案${i + 1}${i === 0 ? '（本命）' : ''}</span></button>`).join('');
    const nameBtns = P.names.map((n, i) => `<button type="button" class="nbtn ${i === state.ni ? 'on' : ''}" data-n="${i}">${E(n.kana)}<small>${E(n.kata)}</small></button>`).join('');

    const axes = DATA.axes.map(ax => { const v = (P.axes[ax.k] + 1) * 50; return `<div class="axis"><span class="l">${ax.neg}</span>${bar(v)}<span class="r">${ax.pos}</span><em>${ax.label}</em></div>`; }).join('');
    const scoreRows = P.score.parts.map(p => `<div class="score-row"><div class="sr-top"><b>${p.label}</b><span>${p.val}</span></div>${bar(p.val)}<p>${E(p.why)}</p></div>`).join('');

    const basis = [];
    if (P.hasBirth) {
      const B = P.birth;
      basis.push(['日干（算命学・四柱推命）', `${B.day.stemName}${B.day.branchName}の日。日干は「${B.day.stemName}」＝${B.day.kw}。五行は「${B.day.el}」、${B.day.yang ? '陽' : '陰'}の気。→ ${B.day.yang ? '動のエネルギーを少し強めに' : '静のエネルギーを少し強めに'}、モチーフ・形に反映。`]);
      basis.push(['太陽星座（西洋占星術）', `${B.sign.name}（${B.sign.el}のエレメント）＝${B.sign.kw}。→ 気質の傾きに反映。`]);
      basis.push(['数秘術 ライフパス', `${B.lp.n}「${B.lp.name}」＝${B.lp.kw}。→ 役割と気質に反映。`]);
      basis.push(['九星気学 本命星', `${B.star.n}＝${B.star.kw}。→ キャラの“アクセントカラー”に採用。（※立春＝2月4日で年を切り替える簡易計算）`]);
      basis.push(['前世のイメージ（遊び）', `あなたの魂のどこかには「${B.past[0]}」がいるかも。${B.past[1]}を、このキャラは受け継いでいます。`]);
    }
    if (P.ns) basis.push(['名前の音', `母音は「${P.ns.info.label}」が優位（${P.ns.info.kw}）${P.ns.tex ? `、出だしは${P.ns.tex.label}音` : ''}。→ 気質の傾きと、キャラ名の音選びに反映。`]);
    basis.push(['アンケート（13問）', `上のレーダー（5軸）が気質の中心。占いの影響は${Math.round(P.wq * 100)}%に抑え、あなたの回答を主役にしています。`]);
    const basisHtml = basis.map(([h, b]) => `<div class="basis"><b>${E(h)}</b><p>${E(b)}</p></div>`).join('');

    const idx = (arr) => arr.map(x => `<li>${E(x)}</li>`).join('');
    const pal = t.palette.map(p => `<div class="sw"><i style="background:${p.hex}"></i><b>${E(p.role)}</b><span>${E(p.name)}</span><code>${p.hex}</code></div>`).join('');
    const PR = Engine.buildPrompts(P, state.vi, state.ni, state.style, state.lang);
    const followHtml = PR.follow.map((f, i) => `<details class="fu"><summary><b>${E(f.label)}</b><span>${E(f.desc)}</span></summary><textarea readonly rows="7" id="fu${i}">${E(f.text)}</textarea><button class="btn" data-act="copyfu" data-i="${i}" type="button">このプロンプトをコピー</button></details>`).join('');

    $('#result').innerHTML = `
<div class="res-hero" style="--bg1:${spec.colors.bg[0]};--bg2:${spec.colors.bg[1]}">
  <div class="score-badge"><small>IP設計度</small><b>${P.score.total}</b></div>
  <h2 class="dir-title">キャラの方向性</h2>
  <p class="dir-note">これは<b>完成形ではなく、画像の元（設計図）</b>です。下の「ChatGPTで美麗な決定版に仕上げる」で、同じ方向性のまま描き込んだ最終画像を作れます。</p>
  <div class="hero-char" id="heroChar">${svg}</div>
  <p class="eyebrow">診断された、あなたのIPキャラ</p>
  <h2 class="cname">${E(t.n)}</h2>
  <p class="ctag">${E(t.tagline)}</p>
  <div class="chips">${chips.map(c => `<span>${E(c)}</span>`).join('')}</div>
</div>

<div class="card"><h3>キャラの系統を切り替える</h3>
  <p class="muted">診断した性格・ギャップ・口調はそのまま、見た目だけを入れ替えます。自分と違う性別の架空キャラもOKです。</p>
  <div class="seg" id="rKind" role="group" aria-label="系統">${[['mascot', 'ゆるキャラ'], ['anime', 'アニメキャラ風'], ['vtuber', 'Vtuber風']].map(([k, l]) => `<button type="button" data-rk="${k}" class="${P.styleKind === k ? 'on' : ''}">${l}</button>`).join('')}</div>
  <div class="seg small ${P.styleKind === 'mascot' ? 'dim' : ''}" id="rGender" role="group" aria-label="性別">${[['f', '女性（美少女系）'], ['m', '男性（美少年・イケメン系）']].map(([k, l]) => `<button type="button" data-rg="${k}" class="${P.gender === k ? 'on' : ''}">${l}</button>`).join('')}</div>
</div>

<div class="card"><h3>デザイン案を選ぶ</h3><div class="variants">${variants}</div>
  <h3 class="sub">キャラ名の候補</h3><div class="names">${nameBtns}</div>
  <p class="fine">音の印象：${E(P.names[state.ni].note)}</p></div>

<div class="card save">
  <h3>画像を保存・共有</h3>
  <div class="btns">
    <button class="btn primary" data-act="card" type="button">診断カードを保存（PNG）</button>
    <button class="btn" data-act="char" type="button">キャラ単体を保存（透過PNG）</button>
    <button class="btn" data-act="svg" type="button">SVGで保存</button>
    <button class="btn" data-act="share" type="button">Xでシェア</button>
    <button class="btn" data-act="copytxt" type="button">結果をテキストでコピー</button>
  </div>
  <p class="fine" id="saveMsg" role="status"></p>
</div>

<div class="card gpt">
  <h3>ChatGPTで“美麗な決定版”に仕上げる</h3>
  <p class="muted">上の絵は設計図（簡易画像）です。下のプロンプトをChatGPTに貼ると、同じ設計のまま描き込まれた完成度の高い1枚が作れます。</p>
  <ol class="steps">
    <li><b>簡易画像を保存</b><button class="btn" data-act="char" type="button">簡易画像をPNG保存</button></li>
    <li><b>ChatGPTを開き、簡易画像を添付</b>して、下の「決定版プロンプト」を貼り付けて送信</li>
    <li>気に入った1枚が出たら、<b>その画像を添付して</b>「追撃プロンプト」を送ると、表情差分・全身・サムネ用などが同じ顔のまま作れます</li>
  </ol>
  <div class="seg" role="group" aria-label="画風">${Engine.STYLE_LIST[P.styleKind === 'mascot' ? 'mascot' : 'human'].map(k => `<button type="button" data-style="${k}" class="${state.style === k ? 'on' : ''}">${E(Engine.STYLES[k].label)}</button>`).join('')}</div>
  <div class="seg small" role="group" aria-label="言語"><button type="button" data-lang="ja" class="${state.lang === 'ja' ? 'on' : ''}">日本語（ChatGPT向け推奨）</button><button type="button" data-lang="en" class="${state.lang === 'en' ? 'on' : ''}">English</button></div>
  <h3 class="sub">① 決定版プロンプト</h3>
  <textarea id="promptBox" readonly rows="14">${E(PR.main)}</textarea>
  <button class="btn primary" data-act="copyprompt" type="button">決定版プロンプトをコピー</button>
  <h3 class="sub">② 追撃プロンプト（決定版の画像を添付して使う）</h3>
  ${followHtml}
  <p class="fine">出力サイズ指定（1405×2000px）入り。ChatGPTが指定通りのサイズにしない場合は「縦長（2:3）で」と一言添えてください。</p>
</div>

<div class="card"><h3>このキャラはどんな存在？</h3>
  <div class="kv"><b>原型</b><span>${E(A.name)}（副属性：${E(S.name)}）</span></div>
  <div class="kv"><b>チャンネルでの役割</b><span>${E(A.role)}</span></div>
  <div class="kv"><b>視聴者が得るもの</b><span>${E(A.gain)}</span></div>
  <div class="kv"><b>ギャップ（愛される理由）</b><span>${E(P.gap.line)}</span></div>
  <div class="kv"><b>愛される欠点</b><span>${E(P.flaw)}</span></div>
  <div class="kv"><b>見た目の特徴</b><span>${E(t.desc.ja.join('、'))}。トレードマークは${E(Engine.J.item[spec.item])}。</span></div>
  <h3 class="sub">あなた固有の設定</h3><ul class="list">${idx(t.personal)}</ul>
  <h3 class="sub">話し方・決め台詞（${E(t.speech.style)}／${E(t.speech.end)}）</h3>
  <blockquote>${E(t.speech.hello)}</blockquote><blockquote>${E(t.speech.closer)}</blockquote>
  <h3 class="sub">カラーパレット（3色ルール）</h3><div class="swatches">${pal}</div>
  <h3 class="sub">サムネイル視認性チェック</h3>
  <div class="thumbs">
    ${[[132, '#ffffff'], [72, '#f1f1f1'], [44, '#0f0f0f'], [72, spec.colors.bg[1]]].map(([w, bg]) => `<div class="tb" style="background:${bg}">${Draw.svg(spec, { uid: 't' + w + bg.slice(1), width: w, height: Math.round(w * 1.3) })}</div>`).join('')}
  </div>
  <p class="fine">YouTubeのスマホ一覧では、キャラは親指ほどの大きさになります。小さくしても「耳・帽子などのシルエット」と「アクセントカラー」で見分けがつけば合格です。</p>
  <p class="fine">表情差分は最低3枚：${E(t.expressions.join(' ／ '))}。この3枚があれば、動画は成立します。</p>
</div>

<div class="card"><h3>設計度スコアの内訳</h3>${scoreRows}
  <p class="fine">※スコアは「続けやすく、覚えられやすい設計になっているか」の指標です。再生数や収益を予測するものではありません。</p></div>

<div class="card"><h3>YouTubeでの勝ち筋</h3>
  <div class="concept"><small>チャンネルコンセプト</small>${E(t.concept)}</div>
  <h3 class="sub">このキャラが勝てる理由</h3><ul class="list">${idx(t.reasons)}</ul>
  <h3 class="sub">おすすめの形式</h3>
  <div class="kv"><b>${E(t.format.name)}</b><span>頻度の目安：${E(t.format.cadence)}<br>${E(t.format.flow)}</span></div>
  <p>${E(t.voiceAdvice)}</p><p>${E(t.skillAdvice)}</p>
  <h3 class="sub">最初の10本の企画</h3><ol class="list num">${idx(t.first)}</ol>
  <h3 class="sub">陥りやすい罠と対策</h3><ul class="list">${idx(t.traps)}</ul>
  <h3 class="sub">90日ロードマップ</h3>${t.roadmap.map(r => `<div class="kv"><b>${E(r.t)}</b><span>${E(r.d)}</span></div>`).join('')}
</div>

<div class="card"><h3>診断の根拠</h3>
  <div class="axes">${axes}</div>${basisHtml}
  <p class="fine">${E(DATA.disclaimer)}</p>
  <p class="fine">このキャラは、約${(Engine.COMBOS / 1e8).toFixed(0)}億通り以上の部品の組み合わせの中から、あなたの回答に合わせて選ばれました。</p></div>

<div class="again"><button class="btn ghost" id="redo" type="button">もう一度診断する</button></div>`;
    bindResult();
  }

  function bindResult() {
    const R = $('#result'), P = state.P;
    const reKind = (k, g) => {
      state.styleKind = k || state.styleKind; state.gender = g || (state.gender === 'n' ? P.gender : state.gender);
      if (k === 'mascot') state.gender = P.gender;
      state.P = Engine.analyze({ ...state.lastInput, styleKind: state.styleKind, gender: state.gender });
      state.vi = 0; state.ni = 0; state.style = (state.P.styleKind === 'vtuber' ? 'live2d' : Engine.STYLE_LIST[state.P.styleKind === 'mascot' ? 'mascot' : 'human'][0]);
      keepScroll(renderResult);
    };
    R.querySelectorAll('[data-rk]').forEach(b => b.onclick = () => reKind(b.dataset.rk, null));
    R.querySelectorAll('[data-rg]').forEach(b => b.onclick = () => reKind(P.styleKind === 'mascot' ? 'anime' : P.styleKind, b.dataset.rg));
    R.querySelectorAll('.vbtn').forEach(b => b.onclick = () => { state.vi = +b.dataset.v; keepScroll(renderResult); });
    R.querySelectorAll('.nbtn').forEach(b => b.onclick = () => { state.ni = +b.dataset.n; keepScroll(renderResult); });
    R.querySelectorAll('[data-style]').forEach(b => b.onclick = () => { state.style = b.dataset.style; keepScroll(renderResult); });
    R.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => { state.lang = b.dataset.lang; keepScroll(renderResult); });
    $('#redo').onclick = () => { state.styleKind = 'auto'; state.gender = 'n'; document.querySelectorAll('#segKind button').forEach(x => x.classList.toggle('on', x.dataset.k === 'auto')); document.querySelectorAll('#segGender button').forEach(x => x.classList.toggle('on', x.dataset.g === 'n')); state.answers = {}; state.interests = []; state.qi = 0; $('#fSaid').value = $('#fLove').value = $('#fVow').value = ''; show('start'); };
    const msg = t => { const m = $('#saveMsg'); if (m) m.textContent = t; };
    R.querySelectorAll('[data-act]').forEach(b => b.onclick = async () => {
      const act = b.dataset.act, t = Engine.texts(P, state.vi, state.ni), safe = t.n.replace(/[^\wぁ-んァ-ヶー一-龠]/g, '') || 'ip';
      try {
        if (act === 'card') { msg('画像を作成中…'); const blob = await Exporter.toPng(Exporter.card(P, state.vi, state.ni), 1080, 1350, 1.5); Exporter.download(blob, `IPキャラ_${safe}_カード.png`); msg('保存しました（1620×2025px）。'); }
        if (act === 'char') { msg('画像を作成中…'); const blob = await Exporter.toPng(Exporter.characterSvg(P, state.vi, true), 800, 1040, 2); Exporter.download(blob, `IPキャラ_${safe}_立ち絵.png`); msg('保存しました（1600×2080px・背景透過）。'); }
        if (act === 'svg') { Exporter.download(Exporter.characterSvg(P, state.vi, true), `IPキャラ_${safe}.svg`, 'image/svg+xml'); msg('SVGを保存しました（拡大しても劣化しません）。'); }
        if (act === 'share') window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(Engine.shareText(P, state.vi, state.ni)) + '&url=' + encodeURIComponent(siteUrl()), '_blank', 'noopener');
        if (act === 'copytxt') { await copy(summaryText(P, t)); msg('診断結果をコピーしました。'); }
        if (act === 'copyfu') { await copy($('#fu' + b.dataset.i).value); b.textContent = 'コピーしました ✓'; setTimeout(() => (b.textContent = 'このプロンプトをコピー'), 1600); }
        if (act === 'copyprompt') { await copy($('#promptBox').value); b.textContent = 'コピーしました ✓'; setTimeout(() => (b.textContent = '決定版プロンプトをコピー'), 1600); }
      } catch (e) { console.error(e); msg('うまくいきませんでした。ブラウザを変えてお試しください。'); }
    });
  }
  const CANON = 'https://sugitani0713.github.io/ip-shindan/';
  function siteUrl() { return /^https?:/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname) ? location.origin + location.pathname : CANON; }
  function keepScroll(fn) { const y = window.scrollY; fn(); window.scrollTo(0, y); }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
  }
  function summaryText(P, t) {
    return [`【あなたのIPキャラ】${t.n}（${t.tagline}）`, `IP設計度：${P.score.total}`, `原型：${P.archetype.name}／副属性：${P.secondary.name}`, `ギャップ：${P.gap.line}`,
      `コンセプト：${t.concept}`, `決め台詞：${t.speech.hello}／${t.speech.closer}`, `診断はこちら（無料）：${siteUrl()}`, '', '▼最初の10本', ...t.first.map((x, i) => `${i + 1}. ${x}`)].join('\n');
  }

  // 戻る時の確認用：ブラウザバック対策は不要（単一ページ）
  window.__ipState = state; // デバッグ用
})();
