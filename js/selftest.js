// 画面内の自己点検：URL に ?test を付けると実行し、コンソールに結果を出す
(function () {
  if (!/[?&]test\b/.test(location.search)) return;
  const results = [];
  const t = (name, fn) => {
    try { const ok = fn(); results.push([name, ok === true]); }
    catch (e) { results.push([name + ' (' + e.message + ')', false]); }
  };

  // Task 1
  t('norm: 全角と空白', () => HK.norm('２は１０の 何乗') === '2は10の何乗');
  t('norm: 英字を小文字に', () => HK.norm('ＬＯＧ') === 'log');
  t('route/show がある', () => typeof HK.route === 'function' && typeof HK.show === 'function');

  // Task 3
  t('portrait: 画像なしは頭文字の丸', () => {
    const h = HK.portrait({ person: { name: 'テスト太郎' } }, 'face');
    return h.includes('init') && h.includes('テ');
  });

  // Task 4
  t('parseTemplate: 文字と空欄に分ける', () => {
    const p = HK.parseTemplate('log ( M {0} N ) = log M {1} log N');
    return p.length === 5 && p[1].slot === 0 && p[3].slot === 1 && typeof p[0].text === 'string';
  });

  // Task 5
  t('parts: 階段 n=10 の合計は 55', () => HK.parts.calc.stairs(10) === 55);
  t('parts: 数直線の最後は -3000', () => HK.parts.calc.numberline({ start: 0, moves: [{ delta: 5000 }, { delta: -8000 }] }) === -3000);
  t('parts: 近づけても 2 ちょうどにはならない', () => {
    const sq = HK.parts.calc.approach({ target: 2, candidates: [1.4, 1.41, 1.414, 1.4142] });
    return sq.length === 4 && sq[3] !== 2 && Math.abs(sq[3] - 2) < Math.abs(sq[0] - 2);
  });

  // Task 6
  t('catchYears: 1614→400', () => HK.catchYears(1614, 2026) === 400);
  t('catchYears: 628→1300', () => HK.catchYears(628, 2026) === 1300);
  t('catchYears: 1525→500', () => HK.catchYears(1525, 2026) === 500);
  t('catchYears: 100年未満は10の位', () => HK.catchYears(1950, 2026) === 70);

  (async () => {
    // Task 3：未知の場面はエラーを出して止まる（落ちない）
    const before = location.hash;
    HK.episode({ id: '__t', title: 't', person: { name: 'T' }, colleague: { name: 'c', short: 'c' },
      photos: { crisis: { src: '', caption: 'x' }, solved: { src: '', caption: 'y' } },
      monitor: { sys: 's', task: 't', label: 'l', stuckAt: 10, init: () => ({}), tick: () => ({ line: '.', value: null }), solvedValue: 'ok' },
      steps: [{ t: 'bogus' }], talks: {}, epilogue: { anecdotes: [] } });
    let logged = false;
    const ce = console.error;
    console.error = (...a) => { if (String(a[0]).includes('bogus')) logged = true; else ce(...a); };
    try { await HK.play('__t'); results.push(['play: 未知の場面で止まる', logged]); }
    catch (e) { results.push(['play: 未知の場面で止まる（例外 ' + e.message + '）', false]); }
    console.error = ce;
    HK.episodes.delete('__t');
    HK.newRun(); HK.stopAll && HK.stopAll();
    location.hash = before;
    HK.route();

    const ng = results.filter(r => !r[1]);
    ng.forEach(r => console.error('[selftest] NG ' + r[0]));
    console.log(ng.length ? `[selftest] NG ${ng.length}/${results.length}` : `[selftest] OK ${results.length}件`);
    window.__selftest = { total: results.length, ng: ng.map(r => r[0]) };
  })();
})();
