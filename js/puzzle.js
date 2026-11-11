// 公式の空欄パズル（設定で式の形・ブロック・正解を決める）
(function () {
  const $ = HK.$;

  // 'log ( M {0} N )' → [{text:'log ( M '}, {slot:0}, {text:' N )'}]
  HK.parseTemplate = function (tpl) {
    return tpl.split(/(\{\d+\})/).filter(s => s !== '').map(s => {
      const m = s.match(/^\{(\d+)\}$/);
      return m ? { slot: +m[1] } : { text: s };
    });
  };

  // 式の文字を見た目用に：log などは立体、1文字の英字は斜体
  function styleText(s) {
    return s.split(/(\s+)/).map(w => {
      if (/^\s+$/.test(w)) return ' ';
      if (/^(log|sin|cos|tan)$/.test(w)) return `<span class="lg">${w}</span>`;
      if (/^[A-Za-z]$/.test(w)) return `<span class="v">${w}</span>`;
      return HK.esc(w);
    }).join('');
  }

  const fmt = v => v === null ? '?' : Number.isNaN(v) || !Number.isFinite(v) ? '計算できない'
    : (Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v).toLocaleString('ja-JP') : (+v.toFixed(3)).toLocaleString('ja-JP')).replace(/^-/, '−');
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

  HK.puzzle = function (cfg, run) {
    return new Promise(resolve => {
      const parts = HK.parseTemplate(cfg.template);
      const n = parts.filter(p => 'slot' in p).length;
      const d = $('dock');
      d.innerHTML = `<div class="puzzle">
        <div class="pz-label">${HK.esc(cfg.label || '公式を完成させよ')}</div>
        <div class="formula" id="fm">${parts.map(p => 'slot' in p ? `<span class="slot empty" data-s="${p.slot}"></span>` : styleText(p.text)).join('')}</div>
        <div class="tray">${cfg.blocks.map(b => `<div class="blk" data-op="${HK.esc(b)}">${HK.esc(b)}</div>`).join('')}</div>
        <div class="check" id="chk"></div>
        <div class="hint" id="hint">ブロックを空欄へドラッグ（タップでも可）</div>
      </div>`;
      const fill = Array(n).fill(null);
      let sel = null, miss = 0, bonus = false, locked = false;
      const slots = [...d.querySelectorAll('.slot')];
      const fm = $('fm');

      function render() {
        slots.forEach(s => {
          const i = +s.dataset.s;
          s.textContent = fill[i] || '';
          s.classList.toggle('empty', !fill[i]);
          s.classList.toggle('filled', !!fill[i]);
          s.classList.toggle('pick', !!sel && !fill[i]);
        });
        if (cfg.check) {
          const full = fill.every(Boolean);
          const l = cfg.check.left(fill), r = cfg.check.right(fill);
          let mark = '';
          if (full && l !== null && r !== null) mark = (Number.isFinite(l) && Number.isFinite(r) && Math.abs(l - r) < 1e-9) ? '<span class="ye">＝ 一致</span>' : '<span class="ne">≠ ずれ</span>';
          $('chk').innerHTML = `試算 ${HK.esc(cfg.check.label)}：　<span>左 <b>${fmt(l)}</b></span><span>右 <b>${fmt(r)}</b></span>${mark}`;
        }
      }
      function hint(t, gold) { const h = $('hint'); h.textContent = t; h.className = 'hint' + (gold ? ' gold' : ''); }
      function place(i, op) {
        if (locked) return;
        fill[i] = op; sel = null;
        d.querySelectorAll('.blk').forEach(b => b.classList.remove('sel'));
        render(); judge();
      }

      async function judge() {
        if (!fill.every(Boolean)) return;
        if (same(fill, cfg.answer)) {
          locked = true;
          fm.classList.add('win');
          hint(cfg.winText || 'FORMULA COMPLETE ── 公式が完成した。', true);
          await HK.sleep(1500);
          resolve({ bonus });
          return;
        }
        if (cfg.bonus && same(fill, cfg.bonus.answer)) {
          bonus = true;
          hint(cfg.bonus.hint, true);
          fm.classList.add('win');
          await HK.sleep(1400);
          fm.classList.remove('win');
          fill.fill(null); render();
          return;
        }
        miss++;
        fm.classList.remove('shake'); void fm.offsetWidth; fm.classList.add('shake');
        const h = (cfg.hints || []).find(x => x.when(fill));
        hint(miss >= 3 && cfg.hint3 ? cfg.hint3 : (h ? h.text : '試算の左右を見よ。そろう組み合わせがあるはずだ。'), miss >= 3);
        await HK.sleep(700);
        if (!locked && HK.alive(run)) { fill.fill(null); render(); }
      }

      slots.forEach(s => s.addEventListener('click', () => {
        if (locked) return;
        const i = +s.dataset.s;
        if (sel) place(i, sel);
        else if (fill[i]) { fill[i] = null; render(); }
      }));
      d.querySelectorAll('.blk').forEach(b => {
        b.addEventListener('pointerdown', e => {
          if (locked) return;
          e.preventDefault();
          const op = b.dataset.op, sx = e.clientX, sy = e.clientY;
          let ghost = null, over = null;
          const move = ev => {
            if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
              ghost = b.cloneNode(true); ghost.classList.add('ghost'); document.body.appendChild(ghost);
            }
            if (!ghost) return;
            ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
            const el = document.elementFromPoint(ev.clientX, ev.clientY);
            const sl = el && el.closest ? el.closest('.slot') : null;
            if (over && over !== sl) over.classList.remove('hover');
            over = sl; if (sl) sl.classList.add('hover');
          };
          const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
            if (ghost) { ghost.remove(); if (over) { over.classList.remove('hover'); place(+over.dataset.s, op); } return; }
            const was = b.classList.contains('sel');
            d.querySelectorAll('.blk').forEach(x => x.classList.remove('sel'));
            sel = was ? null : op;
            if (!was) b.classList.add('sel');
            if (sel) { const empty = fill.map((v, i) => v ? -1 : i).filter(i => i >= 0); if (empty.length === 1) { place(empty[0], sel); return; } }
            render();
          };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', up);
          window.addEventListener('pointercancel', up);
        });
      });
      render();
    });
  };
})();
