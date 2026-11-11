// 体験パーツ3種：タイルを数える（count / stairs）、数直線で動かす、近づけて試す
(function () {
  const $ = HK.$;
  const W = ms => HK.sleep(ms * HK.speed);

  // 計算だけの関数（点検でも使う）
  const calc = {
    stairs: n => n * (n + 1) / 2,
    numberline: cfg => cfg.moves.reduce((p, m) => p + m.delta, cfg.start || 0),
    approach: cfg => cfg.candidates.map(x => x * x),
  };

  const doneBtn = (label, resolve) => {
    const br = $('pBtn');
    br.innerHTML = `<button class="qr gold">${HK.esc(label || '気づいた！')}</button>`;
    br.firstChild.onclick = () => { $('dock').innerHTML = ''; resolve(); };
  };
  const nextBtn = label => new Promise(res => {
    const br = $('pBtn');
    br.innerHTML = `<button class="qr">${HK.esc(label)}</button>`;
    br.firstChild.onclick = () => { br.innerHTML = ''; res(); };
  });
  const tile = (txt, cls, i) => `<span class="tile ${cls}" style="animation-delay:${i * .08}s">${txt}</span>`;
  const tiles = (n, cls, txt) => Array.from({ length: n }, (_, i) => tile(txt, cls, i)).join('<span class="op">×</span>');

  // ---------- タイルを数える ----------
  async function count(cfg, run, resolve) {
    const d = $('dock');
    const head = `<div class="pz-label">${HK.esc(cfg.head)}</div>`;
    for (const q of cfg.questions) {
      await new Promise(res => {
        d.innerHTML = `<div class="puzzle">${head}
          <div class="ins-q"><b>${HK.esc(q.num)}</b> は、${HK.esc(cfg.unitWord || '10')} を何個かけた数？</div>
          <div class="choices">${(cfg.choices || [1, 2, 3, 4]).map(n => `<button data-n="${n}">${n}</button>`).join('')}</div>
          <div class="tiles-row" id="tr"></div></div>`;
        d.querySelectorAll('.choices button').forEach(b => b.onclick = async () => {
          if (+b.dataset.n !== q.ans) { b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); return; }
          d.querySelectorAll('.choices button').forEach(x => x.disabled = true);
          $('tr').innerHTML = `<span class="op">${HK.esc(q.num)} =</span>` + tiles(q.ans, q.cls || 'a', cfg.unitWord || '10');
          await W(1300); res();
        });
      });
      if (!HK.alive(run)) return;
    }
    const [a, b] = cfg.questions;
    d.innerHTML = `<div class="puzzle">${head}
      <div class="ins-q">${cfg.mergeQ}</div>
      <div class="tiles-row" id="mg"><span class="grp a">${tiles(a.ans, 'a', cfg.unitWord || '10')}</span><span class="op x">×</span><span class="grp b">${tiles(b.ans, 'b', cfg.unitWord || '10')}</span></div>
      <div class="cnt" id="cnt"></div><div class="eqline" id="eql"></div><div class="btnrow" id="pBtn"></div></div>`;
    await nextBtn(cfg.mergeBtn || 'つなげて数える');
    $('mg').classList.add('merged');
    await W(700);
    $('cnt').innerHTML = cfg.result;
    await W(700);
    $('eql').innerHTML = cfg.summary;
    await W(900);
    doneBtn(cfg.done, resolve);
  }

  // ---------- 階段を逆さに重ねる ----------
  async function stairs(cfg, run, resolve) {
    const n = cfg.n;
    const d = $('dock');
    const col = (i, withB) => `<div class="st-col">${withB ? Array.from({ length: n + 1 - i }, () => '<i class="b"></i>').join('') : ''}${Array.from({ length: i }, () => '<i class="a"></i>').join('')}</div>`;
    const draw = withB => Array.from({ length: n }, (_, k) => col(k + 1, withB)).join('');
    d.innerHTML = `<div class="puzzle"><div class="pz-label">${HK.esc(cfg.head)}</div>
      <div class="ins-q">${cfg.q}</div>
      <div class="stairs" id="stw">${draw(false)}</div>
      <div class="cnt" id="cnt">${HK.esc(cfg.first || '')}</div><div class="eqline" id="eql"></div><div class="btnrow" id="pBtn"></div></div>`;
    await nextBtn(cfg.flipBtn || '同じ階段を、逆さにして重ねる');
    if (!HK.alive(run)) return;
    $('stw').innerHTML = draw(true);
    $('stw').classList.add('merged');
    await W(800);
    $('cnt').innerHTML = cfg.result;
    await W(800);
    $('eql').innerHTML = cfg.summary;
    await W(900);
    doneBtn(cfg.done, resolve);
  }

  // ---------- 数直線で動かす ----------
  async function numberline(cfg, run, resolve) {
    const d = $('dock');
    const span = cfg.max - cfg.min;
    const pos = v => ((v - cfg.min) / span * 100).toFixed(2) + '%';
    const ticks = [];
    for (let v = cfg.min; v <= cfg.max; v += cfg.step) ticks.push(`<span class="nl-tick${v === 0 ? ' zero' : ''}" style="left:${pos(v)}"><em>${v.toLocaleString('ja-JP')}</em></span>`);
    d.innerHTML = `<div class="puzzle"><div class="pz-label">${HK.esc(cfg.head)}</div>
      <div class="ins-q">${cfg.q}</div>
      <div class="nl"><div class="nl-line"></div>${ticks.join('')}<div class="nl-mark" id="nlm" style="left:${pos(cfg.start || 0)}"></div></div>
      <div class="cnt" id="cnt">いま：<b>${(cfg.start || 0).toLocaleString('ja-JP')}</b> ${HK.esc(cfg.unit || '')}</div>
      <div class="eqline" id="eql"></div><div class="btnrow" id="pBtn"></div></div>`;
    let v = cfg.start || 0;
    for (const m of cfg.moves) {
      await nextBtn(m.btn);
      if (!HK.alive(run)) return;
      v += m.delta;
      $('nlm').style.left = pos(v);
      $('nlm').classList.toggle('neg', v < 0);
      await W(700);
      $('cnt').innerHTML = `いま：<b>${v < 0 ? '0 より左の ' + Math.abs(v).toLocaleString('ja-JP') : v.toLocaleString('ja-JP')}</b> ${HK.esc(cfg.unit || '')}`;
    }
    await W(600);
    $('eql').innerHTML = cfg.summary;
    await W(900);
    doneBtn(cfg.done, resolve);
  }

  // ---------- 近づけて試す ----------
  async function approach(cfg, run, resolve) {
    const d = $('dock');
    const dec = x => (String(x).split('.')[1] || '').length;
    d.innerHTML = `<div class="puzzle"><div class="pz-label">${HK.esc(cfg.head)}</div>
      <div class="ins-q">${cfg.q}</div>
      <div class="ap-rows" id="apr"></div>
      <div class="eqline" id="eql"></div><div class="btnrow" id="pBtn"></div></div>`;
    for (const x of cfg.candidates) {
      await nextBtn(`一辺 ${x} で試す`);
      if (!HK.alive(run)) return;
      const sq = x * x;
      const s = sq.toFixed(dec(x) * 2);
      const diff = cfg.target - sq;
      const row = document.createElement('div');
      row.className = 'ap-row';
      row.innerHTML = `<code>${x} × ${x} = ${s}</code><span>${diff > 0 ? 'あと ' + diff.toFixed(dec(x) * 2).replace(/0+$/, '') + ' 足りない' : '行き過ぎ'}</span><i style="width:${Math.max(4, 100 - Math.abs(diff) * 400)}%"></i>`;
      $('apr').appendChild(row);
    }
    await W(600);
    $('eql').innerHTML = cfg.summary;
    await W(900);
    doneBtn(cfg.done, resolve);
  }

  const wrap = fn => (cfg, run) => new Promise(resolve => { fn(cfg, run, resolve); });
  HK.parts = {
    calc,
    tiles: wrap((cfg, run, resolve) => (cfg.mode === 'stairs' ? stairs : count)(cfg, run, resolve)),
    numberline: wrap(numberline),
    approach: wrap(approach),
  };
})();
