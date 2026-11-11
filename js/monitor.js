// 右上の進み具合と、流れる計算
(function () {
  const $ = HK.$;
  let timer = null;
  let pct = 0;
  let state = {};

  function setPct(p) { pct = p; $('mBar').style.width = p + '%'; $('mPct').textContent = Math.floor(p) + '%'; }
  function push(html) {
    const t = $('ticker');
    const d = document.createElement('div');
    d.innerHTML = html;
    t.appendChild(d);
    while (t.children.length > 3) t.removeChild(t.firstChild);
  }
  function tick(ep, solved) {
    const r = ep.monitor.tick(state, solved) || {};
    if (r.line) push(r.line);
    if (r.value != null) $('mVal').textContent = r.value;
  }

  HK.monitor = {
    start(ep) {
      HK.monitor.stop();
      const m = ep.monitor;
      state = m.init ? m.init() : {};
      $('mon').className = 'monitor';
      $('ticker').className = 'ticker';
      $('ticker').innerHTML = '';
      $('mTask').textContent = m.task;
      $('mLabel').textContent = m.label;
      $('mVal').textContent = '—';
      $('chip').className = 'chip run';
      $('chip').textContent = 'RUNNING';
      setPct(0);
      timer = setInterval(() => {
        tick(ep, false);
        if (pct < m.stuckAt) setPct(Math.min(m.stuckAt, pct + (pct < m.stuckAt * 0.7 ? 2 + Math.random() * 2 : 0.3)));
      }, 420);
    },
    alarm() {
      $('mon').className = 'monitor alarm';
      $('chip').className = 'chip err';
      $('chip').textContent = 'STALLED';
    },
    // 書き換えのあと、一気に 100% へ
    async finish(ep) {
      HK.monitor.stop();
      const t = $('ticker');
      t.className = 'ticker';
      t.innerHTML = '';
      $('mon').className = 'monitor';
      $('chip').className = 'chip run';
      $('chip').textContent = 'NEW MODE';
      timer = setInterval(() => tick(ep, true), 90);
      const from = pct;
      const t0 = performance.now();
      // requestAnimationFrame は画面が隠れていると止まるので、タイマーで動かす
      await new Promise(r => {
        const step = () => {
          const k = Math.min(1, (performance.now() - t0) / 900);
          setPct(from + (100 - from) * (1 - Math.pow(1 - k, 3)));
          k < 1 ? setTimeout(step, 16) : r();
        };
        step();
      });
      HK.monitor.stop();
      $('mon').className = 'monitor done';
      $('chip').className = 'chip ok';
      $('chip').textContent = 'COMPLETE';
      $('mLabel').textContent = '結果';
      $('mVal').textContent = ep.monitor.solvedValue;
    },
    stop() { clearInterval(timer); timer = null; },
  };
})();
