// チャット：発言の表示、入力欄＋自動入力ボタン、会話の進行
(function () {
  const $ = HK.$;
  HK.speed = 1; // 1=ふつう、0.45=はやい（menu.js が保存・復元する）
  const wait = ms => HK.sleep(ms * HK.speed);

  const SEND_SVG = '<svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-3-7z"/><path d="M11 13l9-9"/></svg>';

  function avatar(kind) {
    const ep = HK.cur || {};
    if (kind === 'nap') return HK.portrait ? HK.portrait(ep, 'face') : '';
    if (kind === 'me') return '自';
    return HK.esc((ep.colleague && ep.colleague.short) || '仲');
  }
  function whoName(kind) {
    const ep = HK.cur || {};
    if (kind === 'nap') return ((ep.person && ep.person.short) || (ep.person && ep.person.name) || '') + '（holo）';
    if (kind === 'me') return 'あなた';
    return (ep.colleague && ep.colleague.name) || '';
  }

  // who: col / me / nap / sys / 'sys warn' / 'sys err' / 'sys ok' / 'sys holo'
  HK.addMsg = function (who, text) {
    const chat = $('chat');
    const kind = who.split(' ')[0];
    const m = document.createElement('div');
    m.className = 'msg ' + who.replace('sys holo', 'sys holo-sys');
    if (kind === 'sys') {
      m.innerHTML = '<div class="bubble"></div>';
    } else {
      m.innerHTML = `<div class="av">${avatar(kind)}</div><div><div class="who"></div><div class="bubble"></div></div>`;
      m.querySelector('.who').textContent = whoName(kind);
    }
    m.querySelector('.bubble').textContent = text;
    chat.appendChild(m);
    chat.scrollTop = chat.scrollHeight;
    return m;
  };

  HK.say = async function (who, text, run) {
    if (!HK.alive(run)) return;
    const kind = who.split(' ')[0];
    if (kind !== 'sys') {
      const t = document.createElement('div');
      t.className = 'msg typing ' + kind;
      t.innerHTML = `<div class="av">${avatar(kind)}</div><div class="bubble"><i></i><i></i><i></i></div>`;
      $('chat').appendChild(t);
      $('chat').scrollTop = $('chat').scrollHeight;
      await wait(Math.min(1500, 450 + text.length * 14));
      t.remove();
    } else {
      await wait(450);
    }
    if (!HK.alive(run)) return;
    HK.addMsg(who, text);
    await wait(kind === 'sys' ? 550 : 650);
  };

  // ボタン1つで進む（エピローグへ、など）
  HK.ask = function (label, gold) {
    return new Promise(res => {
      const d = $('dock');
      d.innerHTML = '';
      const b = document.createElement('button');
      b.className = 'qr' + (gold ? ' gold' : '');
      b.textContent = label;
      b.onclick = () => { d.innerHTML = ''; res(); };
      d.appendChild(b);
    });
  };

  // 入力欄＋自動入力ボタン。送った文を返す
  HK.inputBox = function (chips, ph) {
    return new Promise(res => {
      const d = $('dock');
      d.innerHTML = `<div class="talk puzzle">
        <div class="talk-lb">あなたの番 ── ボタンで文が入ります。自分で打ってもOK</div>
        <div class="sugs">${chips.map((c, i) => `<button type="button" class="sug" data-i="${i}">${HK.esc(c.t)}</button>`).join('')}</div>
        <form class="inrow"><input id="tin" type="text" maxlength="100" autocomplete="off" placeholder="${HK.esc(ph || 'メッセージを入力')}"><button class="send" aria-label="送信" disabled>${SEND_SVG}</button></form></div>`;
      const inp = $('tin');
      const send = d.querySelector('.send');
      let typing = 0;
      let done = false;
      const upd = () => { send.disabled = !inp.value.trim(); };
      inp.addEventListener('input', () => { typing++; upd(); });
      d.querySelectorAll('.sug').forEach(b => b.onclick = async () => {
        const my = ++typing;
        const t = chips[+b.dataset.i].t;
        d.querySelectorAll('.sug').forEach(x => x.classList.toggle('on', x === b));
        send.classList.remove('ready');
        inp.value = '';
        for (let i = 1; i <= t.length; i++) {
          if (my !== typing || done) return;
          inp.value = t.slice(0, i); upd();
          await HK.sleep(26);
        }
        send.classList.add('ready');
      });
      d.querySelector('form').onsubmit = e => {
        e.preventDefault();
        if (done) return;
        typing++;
        const v = inp.value.trim();
        if (!v) return;
        done = true;
        d.innerHTML = '';
        res(v);
      };
    });
  };

  // 正答が出るまで会話を続ける。正答の文を返す
  HK.talk = async function (cfg, faqs, run) {
    let chips = [...cfg.chips];
    for (let n = 0; n < 40; n++) {
      const text = await HK.inputBox(chips, cfg.ph);
      if (!HK.alive(run)) return null;
      HK.addMsg('me', text);
      const r = HK.judge(cfg, text, faqs);
      await HK.sleep(250);
      for (const [who, s] of r.reply) { await HK.say(who, s, run); if (!HK.alive(run)) return null; }
      if (r.ok) return text;
      chips = chips.filter(c => c.t !== text || c.keep);
      const again = r.faq ? (cfg.again || cfg.reask) : cfg.again;
      if (again) await HK.say('nap', again, run);
      if (!HK.alive(run)) return null;
    }
    return null;
  };

  // 下の操作パネルが伸びても、最新の発言が見えるように
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => { const c = $('chat'); c.scrollTop = c.scrollHeight; }).observe($('chat'));
  }
})();
