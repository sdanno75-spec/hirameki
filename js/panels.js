// 「なぜ楽になるか」と、書き換え演出
(function () {
  const $ = HK.$;

  HK.howPanel = function (ep, run) {
    const h = ep.how;
    return new Promise(async resolve => {
      const d = $('dock');
      d.innerHTML = `<div class="puzzle"><div class="pz-label">なぜ楽になる？</div>
        ${h.rows.map((r, i) => `<div class="how-row${i === 0 ? ' bad' : ''}"><span class="no">${i === 0 ? '旧' : i}</span><div class="tx"><b>${HK.esc(r[0])}</b><code>${r[1]}</code></div></div>`).join('')}
        <div class="how-note">${HK.esc(h.note)}</div>
        <div class="btnrow" id="br2"></div></div>`;
      for (const r of d.querySelectorAll('.how-row')) {
        await HK.sleep(900 * HK.speed);
        if (!HK.alive(run)) return;
        r.classList.add('on');
      }
      await HK.sleep(600 * HK.speed);
      d.querySelector('.how-note').classList.add('on');
      $('br2').innerHTML = `<button class="qr gold">${HK.esc(h.button || 'この方法に書き換える')}</button>`;
      $('br2').firstChild.onclick = () => { d.innerHTML = ''; resolve(); };
    });
  };

  HK.rewrite = async function (ep, run) {
    HK.monitor.stop();
    const rw = ep.rewrite;
    const t = $('ticker');
    t.className = 'code';
    t.innerHTML = `<div>${HK.esc(rw.head || '')}</div><div id="cl1"></div><div id="cl2" class="new"></div>`;
    $('cl1').textContent = '  ' + rw.before;
    await HK.sleep(700);
    if (!HK.alive(run)) return;
    $('cl1').classList.add('old');
    const target = '  ' + rw.after;
    for (let i = 1; i <= target.length; i++) {
      $('cl2').textContent = target.slice(0, i);
      await HK.sleep(38);
      if (!HK.alive(run)) return;
    }
    await HK.sleep(500);
    if (!HK.alive(run)) return;
    await HK.monitor.finish(ep);
  };
})();
