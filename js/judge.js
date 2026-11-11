// 会話の判定（画面を使わない純粋な関数。Node の点検からも使う）
// 順番：その場面の決まり（上から）→ FAQ（話ごと＋共通）→ 該当なし
(function (g) {
  const HK = g.HK = g.HK || {};
  HK.judge = function (cfg, text, faqs) {
    const t = HK.norm(text);
    const rule = (cfg.rules || []).find(r => r.re.test(t));
    if (rule) return { ok: !!rule.ok, reply: rule.reply || [], faq: false };
    if (!cfg.noFaq) {
      const f = (faqs || []).find(r => r.re.test(t));
      if (f) return { ok: false, reply: [['nap', f.a]], faq: true };
    }
    if (cfg.any) return { ok: true, reply: [], faq: false };
    return { ok: false, reply: cfg.miss || [], faq: false };
  };
})(typeof window !== 'undefined' ? window : globalThis);
