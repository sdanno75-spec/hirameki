// 左の写真パネル、数学者の肖像とホログラム
(function () {
  const $ = HK.$;
  const PHOTO_SVG = '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 17l-5-5-8 7"/></svg>';

  // 肖像：mode = 'bust'（上半身） / 'face'（顔だけ）
  HK.portrait = function (ep, mode) {
    const p = (ep && ep.person) || {};
    const cls = 'nap-ph' + (mode === 'face' ? ' face' : '');
    if (!p.img || p._noImg) return `<div class="${cls} init">${HK.esc((p.name || '?').slice(0, 1))}</div>`;
    const c = (mode === 'face' ? p.face : p.bust) || { pos: '50% 20%', size: '100%' };
    return `<div class="${cls}" style="background-image:url('${HK.esc(p.img)}');background-position:${c.pos};background-size:${c.size} auto;background-repeat:no-repeat"></div>`;
  };

  // 画像が読めるか確かめる
  const probe = src => new Promise(res => {
    if (!src) return res(false);
    const im = new Image();
    im.onload = () => res(true);
    im.onerror = () => res(false);
    im.src = src;
  });

  // 全話の肖像が読めるかを一度だけ確かめる（一覧で頭文字の丸に切り替えるため）
  let portraitsChecked = null;
  HK.checkPortraits = function () {
    if (!portraitsChecked) {
      portraitsChecked = Promise.all([...HK.episodes.values()].map(async ep => {
        if (ep.person) ep.person._noImg = !(await probe(ep.person.img));
      }));
    }
    return portraitsChecked;
  };

  function placeholder(cap) {
    return `<div class="ph-ph">${PHOTO_SVG}<b>${HK.esc(cap)}</b><small>（写真はあとで入ります）</small></div>`;
  }

  async function fill(layer, ph) {
    layer.innerHTML = '';
    layer.style.backgroundImage = '';
    if (await probe(ph.src)) layer.style.backgroundImage = `url('${ph.src}')`;
    else layer.innerHTML = placeholder(ph.caption);
  }

  HK.stage = {
    async load(ep) {
      HK.stage.reset();
      const ok = await probe(ep.person && ep.person.img);
      if (ep.person) ep.person._noImg = !ok;
      await Promise.all([fill($('phCrisis'), ep.photos.crisis), fill($('phSolved'), ep.photos.solved)]);
      $('phCrisis').classList.add('on');
      $('phCap').textContent = 'LIVE ─ ' + (ep.genre || '');
      $('holoBust').innerHTML = HK.portrait(ep, 'bust');
      $('hdHolo').innerHTML = HK.portrait(ep, 'face');
      $('npName').textContent = (ep.person && ep.person.name) || '';
      $('npSub').textContent = ep.person ? `${ep.person.years} ／ ${ep.person.country}` : '';
    },
    alarm() { $('phCap').className = 'ph-cap err'; },
    async enter(ep, run) {
      const ov = $('stOv');
      ov.className = 'st-ov on glitching';
      await HK.sleep(1300);
      if (!HK.alive(run)) return;
      ov.className = 'st-ov on reveal';
      await HK.sleep(2600);
      if (!HK.alive(run)) return;
      ov.className = 'st-ov on stay';
      $('hdHolo').classList.add('on');
    },
    solved() {
      $('phSolved').classList.add('on');
      $('phCrisis').classList.remove('on');
      $('phCap').className = 'ph-cap ok';
    },
    async leave() {
      const ov = $('stOv');
      ov.classList.add('leaving');
      $('hdHolo').classList.remove('on');
      await HK.sleep(1000);
      ov.className = 'st-ov';
    },
    reset() {
      $('stOv').className = 'st-ov';
      $('hdHolo').classList.remove('on');
      $('phCrisis').classList.remove('on');
      $('phSolved').classList.remove('on');
      $('phCap').className = 'ph-cap';
    },
  };
})();
