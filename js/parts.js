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

  // ---------- 天秤（両側に同じ操作） ----------
  // cfg.left / cfg.right：皿にのせるもの [{id, t, sub, k:'x'|'w'}]
  // 正しい操作 {ok:true, left, right, msg}／まちがい {ok:false, left?, right?, tilt, msg}
  async function balance(cfg, run, resolve) {
    const d = $('dock');
    d.innerHTML = `<div class="puzzle"><div class="pz-label">${HK.esc(cfg.head)}</div>
      <div class="ins-q">${cfg.q}</div>
      <div class="bal2" id="bal">
        <div class="b2-beam" id="beam"><i class="b2-pin"></i></div>
        <div class="b2-side l" id="sideL"><svg class="b2-str" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="50" y1="0" x2="1" y2="100"/><line x1="50" y1="0" x2="99" y2="100"/></svg><div class="b2-items" id="panL"></div><div class="b2-dish"></div></div>
        <div class="b2-side r" id="sideR"><svg class="b2-str" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="50" y1="0" x2="1" y2="100"/><line x1="50" y1="0" x2="99" y2="100"/></svg><div class="b2-items" id="panR"></div><div class="b2-dish"></div></div>
        <div class="b2-post"></div><div class="b2-base"></div>
        <div class="b2-eq" id="beq"></div>
      </div>
      <div class="cnt" id="cnt"></div><div class="eqline" id="eql"></div><div class="btnrow ops" id="pBtn"></div></div>`;
    // n があれば、小さなかたまりを n 個（more:true なら「…」をつけて、まだ数がわからない形）
    const bricks = it => it.n ? `<div class="bk">${'<i></i>'.repeat(it.n)}${it.more ? '<em>…</em>' : ''}</div>` : '';
    const item = it => `<div class="b2-it ${it.k || 'w'}" data-id="${HK.esc(it.id)}">${bricks(it)}<b>${HK.esc(it.t)}</b>${it.sub ? `<small>${HK.esc(it.sub)}</small>` : ''}</div>`;
    const sideText = arr => arr.map(it => it.eq || it.t).join(' ＋ ');
    let cur = { left: cfg.left, right: cfg.right };
    // 皿の中身を入れ替える：消えるものはふわっと消し、新しいものは出てくる
    async function setPan(id, arr) {
      const box = $(id);
      const keep = new Set(arr.map(a => a.id));
      const gone = [...box.children].filter(e => !keep.has(e.dataset.id));
      gone.forEach(e => e.classList.add('out'));
      if (gone.length) await HK.sleep(450);
      const old = new Set([...box.children].map(e => e.dataset.id));
      box.innerHTML = arr.map(item).join('');
      [...box.children].forEach(e => { if (!old.has(e.dataset.id)) e.classList.add('in'); });
    }
    const tilt = deg => {
      $('beam').style.transform = `rotate(${deg}deg)`;
      const dy = Math.sin(deg * Math.PI / 180) * $('bal').clientWidth * 0.34;
      $('sideL').style.transform = `translateY(${-dy}px)`;
      $('sideR').style.transform = `translateY(${dy}px)`;
    };
    const eq = (l, r, ok) => { $('beq').innerHTML = `${HK.esc(sideText(l))} <em class="${ok ? 'ok' : 'ng'}">${ok ? '＝' : '≠'}</em> ${HK.esc(sideText(r))}`; };
    await setPan('panL', cur.left); await setPan('panR', cur.right);
    eq(cur.left, cur.right, true);
    for (const st of cfg.steps) {
      await new Promise(res => {
        const br = $('pBtn');
        br.innerHTML = st.choices.map((c, i) => `<button class="qr" data-i="${i}">${HK.esc(c.btn)}</button>`).join('');
        let busy = false;
        br.querySelectorAll('button').forEach(b => b.onclick = async () => {
          if (busy) return;
          busy = true;
          const c = st.choices[+b.dataset.i];
          br.querySelectorAll('button').forEach(x => x.disabled = true);
          if (!c.ok) {
            const l = c.left || cur.left, r = c.right || cur.right;
            await setPan('panL', l); await setPan('panR', r);
            tilt(c.tilt || 10);
            eq(l, r, false);
            $('cnt').innerHTML = `<span class="ng">${c.msg || '傾いた！'}</span>`;
            await HK.sleep(1800);
            if (!HK.alive(run)) return;
            tilt(0);
            await setPan('panL', cur.left); await setPan('panR', cur.right);
            eq(cur.left, cur.right, true);
            $('cnt').innerHTML = 'もとに戻した。もう一度やってみよう';
            br.querySelectorAll('button').forEach(x => x.disabled = false);
            busy = false;
            return;
          }
          br.innerHTML = '';
          await setPan('panL', c.left); await setPan('panR', c.right);
          cur = { left: c.left, right: c.right };
          eq(cur.left, cur.right, true);
          $('cnt').innerHTML = `<span class="ok">${c.msg || 'つり合ったまま！'}</span>`;
          await W(1000); res();
        });
      });
      if (!HK.alive(run)) return;
    }
    await W(500);
    $('eql').innerHTML = cfg.summary;
    await W(900);
    doneBtn(cfg.done, resolve);
  }

  // ---------- マス目で動かす ----------
  async function grid(cfg, run, resolve) {
    const d = $('dock');
    const n = cfg.half || 5;
    const cells = [];
    for (let y = n; y >= -n; y--) for (let x = -n; x <= n; x++) {
      const cls = [x === 0 && y === 0 ? 'o' : '', x === 0 ? 'ax' : '', y === 0 ? 'ay' : '', x === cfg.target.x && y === cfg.target.y ? 't' : ''].join(' ');
      cells.push(`<i class="${cls}" data-x="${x}" data-y="${y}"></i>`);
    }
    d.innerHTML = `<div class="puzzle"><div class="pz-label">${HK.esc(cfg.head)}</div>
      <div class="ins-q">${cfg.q}</div>
      <div class="gridmap" style="grid-template-columns:repeat(${2 * n + 1},1fr)" id="gm">${cells.join('')}</div>
      <div class="cnt" id="cnt"></div>
      <div class="btnrow ops" id="pBtn"><button class="qr" data-d="-1,0">← 左へ</button><button class="qr" data-d="1,0">右へ →</button><button class="qr" data-d="0,1">↑ 上へ</button><button class="qr" data-d="0,-1">↓ 下へ</button></div>
      <div class="eqline" id="eql"></div></div>`;
    let px = 0, py = 0;
    const word = (v, p, m) => v === 0 ? '' : (v > 0 ? p + ' ' + v : m + ' ' + -v);
    const draw = () => {
      d.querySelectorAll('#gm i.me').forEach(e => e.classList.remove('me'));
      const c = d.querySelector(`#gm i[data-x="${px}"][data-y="${py}"]`);
      if (c) c.classList.add('me');
      $('cnt').innerHTML = `${HK.esc(cfg.originWord || '0')} から：<b>${[word(px, '右へ', '左へ'), word(py, '上へ', '下へ')].filter(Boolean).join('、') || 'まだ動いていない'}</b>`;
    };
    draw();
    await new Promise(res => {
      $('pBtn').querySelectorAll('button').forEach(b => b.onclick = async () => {
        const [dx, dy] = b.dataset.d.split(',').map(Number);
        px = Math.max(-n, Math.min(n, px + dx)); py = Math.max(-n, Math.min(n, py + dy));
        draw();
        if (px === cfg.target.x && py === cfg.target.y) { $('pBtn').innerHTML = ''; await W(700); res(); }
      });
    });
    if (!HK.alive(run)) return;
    $('eql').innerHTML = cfg.summary;
    await W(900);
    doneBtn(cfg.done, resolve);
  }

  // ---------- 直角三角形の3辺に正方形 ----------
  async function squares(cfg, run, resolve) {
    const d = $('dock');
    const sq = (k, cls) => `<div class="sqbox ${cls}"><div class="sqg" style="grid-template-columns:repeat(${k},1fr);width:${k * 8}px">${'<i></i>'.repeat(k * k)}</div><b class="sqn"></b><em>${k} × ${k}</em></div>`;
    d.innerHTML = `<div class="puzzle"><div class="pz-label">${HK.esc(cfg.head)}</div>
      <div class="ins-q">${cfg.q}</div><div id="sqa"></div>
      <div class="cnt" id="cnt"></div><div class="eqline" id="eql"></div><div class="btnrow" id="pBtn"></div></div>`;
    for (const t of cfg.triangles) {
      $('sqa').innerHTML = `<div class="sqrow">${sq(t.a, 'a')}<span class="op">＋</span>${sq(t.b, 'b')}<span class="op">と</span>${sq(t.c, 'c')}</div>`;
      $('cnt').innerHTML = `直角をはさむ辺 ${t.a} と ${t.b}、斜めの辺 ${t.c}`;
      await nextBtn('正方形のタイルを数える');
      if (!HK.alive(run)) return;
      const bs = $('sqa').querySelectorAll('.sqn');
      for (const [i, k] of [t.a, t.b, t.c].entries()) { bs[i].textContent = k * k + ' 枚'; await W(500); }
      $('cnt').innerHTML = `<b>${t.a * t.a} ＋ ${t.b * t.b} ＝ ${t.a * t.a + t.b * t.b}</b>　斜めの辺の正方形も <b>${t.c * t.c}</b> 枚！`;
      await W(900);
    }
    $('eql').innerHTML = cfg.summary;
    await W(900);
    doneBtn(cfg.done, resolve);
  }

  // ---------- × i で回す（複素数平面） ----------
  // cfg.start: [x, y]、cfg.times: 回す回数
  async function rotate(cfg, run, resolve) {
    const d = $('dock');
    const R = 4, S = 26, C = R * S + 8, W2 = C * 2;
    const px = x => C + x * S, py = y => C - y * S;
    const fmt = (a, b) => {
      const re = a === 0 ? '' : String(a).replace('-', '−');
      if (b === 0) return re || '0';
      const im = (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'i';
      return re ? `${re} ${b < 0 ? '−' : '＋'} ${im}` : (b < 0 ? '−' : '') + im;
    };
    let lines = '';
    for (let k = -R; k <= R; k++) lines += `<line x1="${px(k)}" y1="${py(-R)}" x2="${px(k)}" y2="${py(R)}" class="${k === 0 ? 'ax' : ''}"/><line x1="${px(-R)}" y1="${py(k)}" x2="${px(R)}" y2="${py(k)}" class="${k === 0 ? 'ax' : ''}"/>`;
    const [x0, y0] = cfg.start;
    d.innerHTML = `<div class="puzzle"><div class="pz-label">${HK.esc(cfg.head)}</div>
      <div class="ins-q">${cfg.q}</div>
      <svg class="cpl" viewBox="0 0 ${W2} ${W2}">${lines}
        <text x="${px(R) - 4}" y="${py(0) - 6}" class="lb" text-anchor="end">実部</text><text x="${px(0) + 6}" y="${py(R) + 12}" class="lb">虚部 i</text>
        <g id="trail"></g>
        <g id="arm" style="transform-origin:${C}px ${C}px"><line x1="${C}" y1="${C}" x2="${px(x0)}" y2="${py(y0)}" class="arm"/><circle cx="${px(x0)}" cy="${py(y0)}" r="6" class="tip"/></g>
        <circle cx="${C}" cy="${C}" r="4" class="o"/></svg>
      <div class="cnt" id="cnt"></div><div class="eqline" id="eql"></div><div class="btnrow ops" id="pBtn"></div></div>`;
    let a = x0, b = y0, k = 0;
    const show = (prev) => { $('cnt').innerHTML = prev ? `(${fmt(prev[0], prev[1])}) × i ＝ <b>${fmt(a, b)}</b>　→　点 (${a}, ${b})` : `いまの点：<b>${fmt(a, b)}</b>　→　点 (${a}, ${b})`; };
    show();
    for (let t = 0; t < (cfg.times || 4); t++) {
      await nextBtn('× i する');
      if (!HK.alive(run)) return;
      const prev = [a, b];
      $('trail').insertAdjacentHTML('beforeend', `<circle cx="${px(a)}" cy="${py(b)}" r="4" class="ghost"/>`);
      [a, b] = [-b, a];
      k++;
      $('arm').style.transform = `rotate(${-90 * k}deg)`;
      await HK.sleep(750);
      show(prev);
    }
    await W(500);
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
    balance: wrap(balance),
    grid: wrap(grid),
    squares: wrap(squares),
    rotate: wrap(rotate),
  };
})();
