// エピローグと人物ファイル
(function () {
  const $ = HK.$;

  // 決めぜりふの年数：100年以上は100の位、100年未満は10の位で切り捨て
  HK.catchYears = function (year, now) {
    const n = now - year;
    return n >= 100 ? Math.floor(n / 100) * 100 : Math.floor(n / 10) * 10;
  };

  HK.epilogue = function (ep, ctx) {
    const e = ep.epilogue;
    const p = ep.person;
    const years = HK.catchYears(e.year, new Date().getFullYear());
    let d = 0;
    const st = () => `style="animation-delay:${(d += 0.8).toFixed(1)}s"`;
    const bonus = ctx && ctx.bonus && ep.puzzle && ep.puzzle.bonus && ep.puzzle.bonus.card;
    HK.show('s-epi');
    $('epiWrap').innerHTML = `
      <div class="epi-top"><div class="holo">${HK.portrait(ep, 'bust')}</div></div>
      <div class="epi-lines">
        <p class="year" ${st()}>${e.year} ── ${HK.esc(e.place)}</p>
        ${e.lines.map(l => `<p ${st()}>${l}</p>`).join('')}
      </div>
      <div class="big" ${st()}>数学のひらめきは、<br>${years}年後の世界も救っている。</div>
      <div class="fcard" ${st()}>
        <div class="ttl">YOUR FORMULA</div>
        <div class="f">${e.card.formula}</div>
        ${bonus ? `<div class="f bonus">${bonus}　も発見</div>` : ''}
        <small>${e.card.note}</small>
      </div>
      <div class="pfile" ${st()}>
        <div class="pf-ttl">PERSON FILE</div>
        <div class="pf-head">
          <div class="pf-face">${HK.portrait(ep, 'face')}</div>
          <div><b>${HK.esc(p.name)}</b><span>${HK.esc(p.years)} ／ ${HK.esc(p.country)}</span><span>${HK.esc(p.role)}</span></div>
        </div>
        ${p.faceUnknown ? '<p class="pf-note">実際の顔はわかっていません。この姿は、当時の学者のイメージです。</p>' : ''}
        ${e.anecdotes.map(a => `<div class="pf-an"><span class="tag ${a.tag === '本当' ? 'true' : 'legend'}">${HK.esc(a.tag)}</span><p>${a.text}</p></div>`).join('')}
      </div>
      <div class="btns" ${st()}>
        <button class="ghostbtn" id="bOther">別の話を選ぶ</button>
        <button class="qr gold" id="bAgain">もう一度</button>
      </div>`;
    $('epiWrap').scrollTop = 0;
    $('bOther').onclick = () => { location.hash = 'list'; };
    $('bAgain').onclick = () => { HK.play(ep.id); };
  };
})();
