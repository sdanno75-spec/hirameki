// 会話の判定の単体テスト：node hirameki/tools/test-judge.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
['js/core.js', 'js/judge.js'].forEach(f => vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f }));
const HK = globalThis.HK;

// napier-log v1.4.0 の STEP を写したテスト用の設定
const name = {
  chips: [{ t: '毎回、指で数えればいいと思います' }, { t: '名前をつけたら便利じゃないですか？' }, { t: '全部、掛け算に戻しましょう' }],
  rules: [
    { re: /名前|名づけ|名付け|呼び名|記号|ネーミング|呼ぶ|あだ名/, ok: true, reply: [['nap', 'うむ、いい考えだ！']] },
    { re: /数え|指/, ok: false, reply: [['nap', '何万回も数えるのか？'], ['nap', '短く言える工夫は？']] },
    { re: /戻/, ok: false, reply: [['nap', '台無しだ。']] },
  ],
  miss: [['nap', 'ふむ…。']],
};
const frac = {
  chips: [],
  rules: [
    { re: /10の2乗|2乗/, ok: false, reply: [['nap', '10 の 2 乗は 100 だぞ。']] },
    { re: /使えない|無理|できない/, ok: false, reply: [['nap', 'あきらめるのは早い。']] },
    { re: /何乗|乗|指数|間|0\.3|小数/, ok: true, reply: [['nap', 'それだ！']] },
  ],
  miss: [['nap', 'ヒントだ。']],
};
const plea = { any: true, noFaq: true, chips: [], rules: [{ re: /徹夜/, ok: true, reply: [['col', '一生かかる']] }] };
const qa = { chips: [], rules: [{ re: /大丈夫|ありがと/, ok: true, reply: [] }], miss: [['nap', 'それは難問だ。']] };
const faqs = [{ re: /割り|わり|÷/, a: '割り算は引き算になる。' }];

const cases = [
  ['正答ボタン', () => assert.strictEqual(HK.judge(name, '名前をつけたら便利じゃないですか？', []).ok, true)],
  ['誤答ボタンは2行の返事', () => { const r = HK.judge(name, '毎回、指で数えればいいと思います', []); assert.strictEqual(r.ok, false); assert.strictEqual(r.reply.length, 2); }],
  ['全角でも誤答の決まりが先', () => assert.strictEqual(HK.judge(frac, '２は１０の２乗？', []).ok, false)],
  ['正答（自由入力）', () => assert.strictEqual(HK.judge(frac, '10の何乗かで表せない？', []).ok, true)],
  ['any は何でも進む', () => { const r = HK.judge(plea, 'なんでもいい', []); assert.strictEqual(r.ok, true); assert.deepStrictEqual(r.reply, []); }],
  ['FAQ に当たる', () => { const r = HK.judge(qa, '割り算は？', faqs); assert.strictEqual(r.faq, true); assert.strictEqual(r.ok, false); assert.strictEqual(r.reply[0][1], '割り算は引き算になる。'); }],
  ['どれにも当たらない', () => { const r = HK.judge(qa, '好きな食べ物は？', faqs); assert.strictEqual(r.ok, false); assert.strictEqual(r.faq, false); assert.strictEqual(r.reply[0][1], 'それは難問だ。'); }],
  ['noFaq は FAQ を見ない', () => assert.strictEqual(HK.judge({ ...plea, any: false, miss: [['nap', 'x']] }, '割り算', faqs).faq, false)],
];

let pass = 0;
for (const [n, f] of cases) {
  try { f(); pass++; } catch (e) { console.log('NG ' + n + ': ' + e.message); }
}
console.log(`test-judge: ${pass} passed, ${cases.length - pass} failed`);
process.exit(pass === cases.length ? 0 : 1);
