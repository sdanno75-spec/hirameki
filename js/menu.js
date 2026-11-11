// 話の一覧、クリア印、会話の速さ
(function () {
  const $ = HK.$;
  const KEY_CLEAR = 'hirameki.clear';
  const KEY_SPEED = 'hirameki.speed';
  const GRADES = ['中1', '中2', '中3', '高1', '高2', '高3'];

  const read = (k, def) => { try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 保存できなくても遊べる */ } };

  HK.clear = {
    mark(id) { const s = read(KEY_CLEAR, []); if (!s.includes(id)) { s.push(id); write(KEY_CLEAR, s); } },
    has(id) { return read(KEY_CLEAR, []).includes(id); },
  };

  // 会話の速さ（保存してある値を復元）
  HK.speed = read(KEY_SPEED, 1) === 0.45 ? 0.45 : 1;
  function speedLabel() {
    const b = $('btnSpeed');
    b.textContent = HK.speed < 1 ? '会話：はやい' : '会話：ふつう';
    b.classList.toggle('on', HK.speed < 1);
  }
  $('btnSpeed').onclick = () => { HK.speed = HK.speed < 1 ? 1 : 0.45; write(KEY_SPEED, HK.speed); speedLabel(); };
  speedLabel();

  HK.menu = {
    renderList() {
      // 肖像の有無を確かめてから描き直す（初回だけ少し遅れて切り替わる）
      HK.checkPortraits().then(() => { if ($('s-list').classList.contains('active')) HK.menu.draw(); });
      HK.menu.draw();
    },
    draw() {
      const eps = [...HK.episodes.values()].filter(e => !e.id.startsWith('__'));
      const byGrade = GRADES.map(g => [g, eps.filter(e => e.grade === g).sort((a, b) => a.order - b.order)]).filter(([, l]) => l.length);
      $('epList').innerHTML = byGrade.map(([g, list]) => `
        <div class="grade">${g}</div>
        <div class="ep-cards">${list.map(e => `
          <button class="ep-card" data-id="${e.id}">
            <div class="ep-face">${HK.portrait(e, 'face')}</div>
            <div class="ep-txt">
              <span class="ep-unit">${HK.esc(e.subject ? e.subject + '・' : '')}${HK.esc(e.unit)}</span>
              <b>${HK.esc(e.title)}</b>
              <span>${HK.esc(e.person.name)} ／ ${HK.esc(e.genre)}</span>
            </div>
            ${HK.clear.has(e.id) ? '<span class="ep-clear">クリア</span>' : ''}
          </button>`).join('')}
        </div>`).join('') || '<p class="sub">話がまだありません。</p>';
      $('epList').querySelectorAll('.ep-card').forEach(b => b.onclick = () => { location.hash = b.dataset.id; });
    },
  };
})();
