// 話の steps を順に実行する
(function () {
  const $ = HK.$;

  HK.stopAll = function () {
    HK.monitor.stop();
    HK.stage.reset();
  };

  const faqsOf = ep => (ep.faq || []).concat(HK.FAQ_COMMON || []);

  async function notYet(name, run) { await HK.say('sys', `（${name} は準備中）`, run); }

  async function step(ep, s, run, ctx) {
    switch (s.t) {
      case 'say': return HK.say(s.who, s.text, run);
      case 'photo': return HK.sayPhoto(s.who, s.src, s.text, run);
      case 'alarm': HK.monitor.alarm(); HK.stage.alarm(); return;
      case 'talk': return HK.talk(ep.talks[s.id], faqsOf(ep), run);
      case 'enter': return HK.stage.enter(ep, run);
      case 'part': {
        const f = HK.parts && HK.parts[s.kind];
        return f ? f(ep.parts[s.id], run) : notYet('体験パーツ', run);
      }
      case 'puzzle':
        if (!HK.puzzle) return notYet('パズル', run);
        ctx.bonus = (await HK.puzzle(ep.puzzle, run) || {}).bonus || false;
        $('dock').innerHTML = '';
        return;
      case 'how': return HK.howPanel ? HK.howPanel(ep, run) : notYet('なぜ楽になるか', run);
      case 'rewrite': return HK.rewrite ? HK.rewrite(ep, run) : HK.monitor.finish(ep);
      case 'solved':
        HK.stage.solved(ep);
        await HK.say('sys ok', ep.win.sys, run);
        return HK.say('col', ep.win.col, run);
      case 'qa': {
        const cfg = Object.assign({}, HK.QA_TALK, { chips: ((ep.qa && ep.qa.chips) || []).concat(HK.QA_TALK.chips) });
        return HK.talk(cfg, faqsOf(ep), run);
      }
      case 'leave': return HK.stage.leave();
      case 'end':
        await HK.ask('エピローグへ', true);
        if (!HK.alive(run)) return;
        if (HK.clear) HK.clear.mark(ep.id);
        HK.stopAll();
        return HK.epilogue ? HK.epilogue(ep, ctx) : HK.route();
      default:
        throw new Error('未知の場面: ' + s.t);
    }
  }

  HK.play = async function (id) {
    const ep = HK.episodes.get(id);
    if (!ep) return;
    const run = HK.newRun();
    HK.cur = ep;
    HK.stopAll();
    HK.show('s-play');
    $('chat').innerHTML = '';
    $('dock').innerHTML = '';
    $('hdTitle').textContent = ep.title;
    $('hdSys').textContent = ep.monitor.sys;
    await HK.stage.load(ep);
    if (!HK.alive(run)) return;
    HK.monitor.start(ep);
    const ctx = { bonus: false };
    for (const s of ep.steps) {
      try {
        await step(ep, s, run, ctx);
      } catch (e) {
        console.error('[play] ' + e.message + ' (' + JSON.stringify(s) + ')');
        HK.monitor.stop();
        return;
      }
      if (!HK.alive(run)) return;
    }
  };
})();
