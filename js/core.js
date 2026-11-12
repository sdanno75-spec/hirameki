// 共通の小道具と、画面の切り替え
(function (g) {
  const HK = g.HK = g.HK || {};
  HK.VERSION = '1.4.5';

  HK.$ = id => document.getElementById(id);
  HK.sleep = ms => new Promise(r => setTimeout(r, ms));
  HK.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // 全角→半角、空白を除く、小文字に（判定用）
  HK.norm = s => String(s).normalize('NFKC').replace(/\s/g, '').toLowerCase();

  // 実行ID：戻る・別の話へ移ったら、古い処理を止めるため
  HK.run = 0;
  HK.newRun = () => ++HK.run;
  HK.alive = r => r === HK.run;

  // 話の登録
  HK.episodes = new Map();
  HK.episode = def => { HK.episodes.set(def.id, def); };

  HK.show = sid => {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === sid));
  };

  // URL の #id で話を開く。無ければ一覧
  HK.route = () => {
    const id = decodeURIComponent((location.hash || '').slice(1));
    if (id && HK.episodes.has(id) && HK.play) { HK.play(id); return; }
    HK.newRun();
    if (HK.stopAll) HK.stopAll();
    if (id === 'list' && HK.menu) { HK.menu.renderList(); HK.show('s-list'); return; }
    HK.show('s-title');
  };
})(typeof window !== 'undefined' ? window : globalThis);
