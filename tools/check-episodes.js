// 台本の点検：node hirameki/tools/check-episodes.js
// 失敗があれば終了コード 1。画像が無いのは警告だけ。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const load = rel => vm.runInThisContext(fs.readFileSync(path.join(root, rel), 'utf8'), { filename: rel });

['js/core.js', 'js/judge.js', 'js/faq-common.js'].forEach(f => { if (fs.existsSync(path.join(root, f))) load(f); });
const epDir = path.join(root, 'episodes');
fs.readdirSync(epDir).filter(f => f.endsWith('.js')).sort().forEach(f => load('episodes/' + f));

const HK = globalThis.HK;
const errors = [];
const warns = [];
const err = (id, m) => errors.push(`[${id}] ${m}`);
const warn = (id, m) => warns.push(`[${id}] ${m}`);

for (const ep of HK.episodes.values()) {
  const id = ep.id;
  const faqs = (ep.faq || []).concat(HK.FAQ_COMMON || []);

  // 会話：any 以外は、正答のボタンがちょうど1つ
  for (const [tid, cfg] of Object.entries(ep.talks || {})) {
    if (cfg.any) continue;
    const oks = cfg.chips.filter(c => HK.judge(cfg, c.t, faqs).ok);
    if (oks.length !== 1) err(id, `talk "${tid}" の正答ボタンが ${oks.length} 個（1個にする）: ${oks.map(c => c.t).join(' / ')}`);
  }
  // 質問タイムのボタンは、どれも FAQ で答えが返る
  if ((ep.steps || []).some(s => s.t === 'qa')) {
    ((ep.qa && ep.qa.chips) || []).forEach(c => {
      const r = HK.judge(HK.QA_TALK, c.t, faqs);
      if (!r.faq) err(id, `質問ボタン「${c.t}」に答えがない`);
    });
  }

  // 必要な項目
  ['id', 'grade', 'unit', 'title', 'genre', 'person', 'photos', 'colleague', 'monitor', 'steps', 'win', 'epilogue'].forEach(k => { if (!ep[k]) err(id, `項目 ${k} がない`); });
  if (ep.person && !ep.person.img) warn(id, '肖像の画像が指定されていない');

  // パズル
  const pz = ep.puzzle;
  if (pz) {
    pz.answer.forEach(a => { if (!pz.blocks.includes(a)) err(id, `パズルの正解「${a}」がブロックにない`); });
    const eq = (f) => { const l = pz.check.left(f), r = pz.check.right(f); return Number.isFinite(l) && Number.isFinite(r) && Math.abs(l - r) < 1e-9; };
    if (!eq(pz.answer)) err(id, 'パズルの正解で試算の左右が一致しない');
    if (pz.bonus && !eq(pz.bonus.answer)) err(id, 'パズルのボーナスで試算の左右が一致しない');
  }

  // 人物ファイル
  const an = ep.epilogue && ep.epilogue.anecdotes;
  if (!an || an.length !== 2) err(id, 'エピソードは2つ');
  else an.forEach(a => { if (!['本当', '伝説'].includes(a.tag)) err(id, `エピソードの札が「本当／伝説」でない: ${a.tag}`); });

  // 場面の並び
  const steps = ep.steps || [];
  const enterAt = steps.findIndex(s => s.t === 'enter');
  const napAt = steps.findIndex(s => s.t === 'say' && s.who === 'nap');
  if (enterAt < 0) err(id, 'steps に enter がない');
  else if (napAt >= 0 && napAt < enterAt) err(id, '数学者が登場前にしゃべっている');
  steps.forEach((s, i) => {
    if (s.t === 'talk' && !(ep.talks || {})[s.id]) err(id, `steps[${i}] talk "${s.id}" が talks にない`);
    if (s.t === 'part' && !(ep.parts || {})[s.id]) err(id, `steps[${i}] part "${s.id}" が parts にない`);
  });

  // 画像（無ければ警告）
  const imgs = [ep.person && ep.person.img, ep.photos && ep.photos.crisis.src, ep.photos && ep.photos.solved.src].concat(steps.filter(s => s.t === 'photo').map(s => s.src)).filter(Boolean);
  imgs.forEach(p => { if (!fs.existsSync(path.join(root, p))) warn(id, `画像がまだ無い: ${p}`); });
}

// 全話共通の質問タイム
if (HK.QA_TALK) {
  const oks = HK.QA_TALK.chips.filter(c => HK.judge(HK.QA_TALK, c.t, HK.FAQ_COMMON).ok);
  if (oks.length !== 1) err('qa', `質問タイムの終わりボタンが ${oks.length} 個`);
}

warns.forEach(w => console.log('警告 ' + w));
errors.forEach(e => console.log('失敗 ' + e));
console.log(`${HK.episodes.size} episodes, ${errors.length} errors`);
process.exit(errors.length ? 1 : 0);
