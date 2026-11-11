# 数学者のひらめき シリーズ 実装計画書

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** napier-log v1.4.0 を土台に、話（エピソード）を足していける「数学者のひらめき」シリーズを `hirameki/` に作り、最初の4話（ネイピア・負の数・平方根・数列の和）を遊べるようにする。

**Architecture:** 共通の仕組み（エンジン）と、話ごとのデータを分ける。話は「場面の並び（steps）」と「会話・パズル・エピローグの設定」を書いたデータで、エンジンがそれを順に実行する。会話の判定は純粋な関数にして、Node でも動かせるようにし、台本の点検を自動化する。

**Tech Stack:** HTML / CSS / JavaScript（ライブラリなし、ビルドなし、`<script>` を順に読む普通のスクリプト）。点検は Node（`node tools/…`）。表示確認は http-server（port 5194）とブラウザ。

**Spec:** `napier-log/docs/2026-11-11-series-design.md`（Task 1 で `hirameki/docs/` に移す）

## Global Constraints

- 置き場所は `C:\Users\sdann\Claude\hirameki\`。`napier-log/` には手を入れない（docs の移動を除く）。
- 生徒には GitHub Pages の URL で配る。一覧 `…/hirameki/` と各話 `…/hirameki/#<話のid>` の両方で開ける。
- 外部ライブラリ・外部の画像・ビルド手順は使わない。
- AI は使わない。生徒の入力を外部に送らない。保存するのは「クリア済み」の印だけ（localStorage、読み書きは try/catch で囲む）。
- 絵文字を使わない。アイコンは線の SVG。
- 画面：横向きは左半分が写真、右半分がチャット。縦向き（幅 < 高さ）は上に写真（高さの約3割）、下にチャット。
- 1話 5〜10分。ネイピア編は約10分。
- 数学者の画像・現場写真は持ち主が用意する。届くまでは仮の枠（何の写真かを書いた枠）を出す。こちらで人物の絵を描かない。
- 人物ファイルのエピソードは2つ、それぞれ「本当」か「伝説」の札。
- 会話の判定順：その場面の決まり（上から順）→ 話ごとの FAQ → 全話共通の FAQ → 該当なしの返事。
- 版番号はシリーズ全体で1つ。最初の公開は v1.0.0。以後、変更のたびに上げる。
- 色・雰囲気は napier-log v1.4.0 と同じ（暗い背景、`--cyan #3ce7ff` などのトークン）。

## Review Focus

1. 生徒が全角数字・全角英字・空白・句読点まじりで打つ（例「２は１０の何乗」）→ 半角で打ったときと同じ判定になる。（Task 2 の test-judge で固定）
2. 自動入力の途中で送信を押す、送信を連打する → 発言は1回だけ、文は途中までの内容で送られる。（Task 2 の画面確認で固定）
3. 話の途中で「戻る」を押してすぐ別の話を始める → 前の話の発言や演出が後から出てこない。（Task 3 の画面確認で固定）
4. 写真や肖像のファイルがまだ無い・読み込めない → 仮の枠が出て、最後まで遊べる。（Task 3 の画面確認、Task 7 の点検で警告）
5. タブレットを途中で回転させる → 左右分割と上下の並びが切り替わり、チャットと操作パネルが隠れない。（Task 1 の画面確認で固定）

---

## ファイルの構成

```
hirameki/
  index.html                 画面の器（タイトル・一覧・話・エピローグ）と script の読み込み順
  css/style.css              全スタイル（napier-log v1.4.0 から移植＋左右分割）
  js/core.js                 HK 名前空間、小道具（$, sleep, esc, norm）、実行ID、版番号、画面切替、URL の #id
  js/judge.js                会話の判定（純粋関数。Node からも読む）
  js/faq-common.js           全話共通の FAQ
  js/chat.js                 発言の表示、入力欄＋自動入力ボタン、talk()
  js/stage.js                左の写真パネル、ホログラム、写真の切替
  js/monitor.js              右上の進み具合と流れる計算
  js/puzzle.js               式の空欄パズル
  js/parts.js                体験パーツ3種（tiles / numberline / approach）
  js/panels.js               「なぜ楽になるか」と、書き換え演出
  js/epilogue.js             エピローグと人物ファイル
  js/menu.js                 タイトル・話の一覧・クリア印
  js/runner.js               話の steps を順に実行する
  js/selftest.js             画面内の自己点検（URL に ?test を付けたとき実行）
  episodes/napier.js         話のデータ（1話1ファイル）
  episodes/negative.js
  episodes/sqrt.js
  episodes/gauss-sum.js
  img/<話のid>/crisis.webp   困っている写真（持ち主が用意）
  img/<話のid>/solved.webp   解決した写真（持ち主が用意）
  img/<話のid>/portrait.webp 数学者の肖像（持ち主が用意）
  tools/test-judge.js        judge.js の単体テスト（node で実行）
  tools/check-episodes.js    全話の台本点検（node で実行）
  docs/                      設計図と計画書
```

`index.html` の script 読み込み順：core → judge → faq-common → chat → stage → monitor → puzzle → parts → panels → epilogue → menu → runner → episodes/*.js → selftest。

---

## 話のデータ形式（全タスク共通の約束）

各 `episodes/*.js` は `HK.episode({...})` を1回呼ぶ。Node の点検は `global.HK` を用意して同じファイルを読む。

```js
HK.episode({
  id: 'napier', order: 90, grade: '高2', subject: '数学II', unit: '対数', genre: '宇宙',
  title: '打ち上げ前：最終軌道計算',
  person: { name: 'ジョン・ネイピア', en: 'JOHN NAPIER', years: '1550 – 1617', country: 'スコットランド',
            role: '数学者・マーキストンの領主', faceUnknown: false,
            img: 'img/napier/portrait.webp',
            bust: { pos: '67% 23%', size: '160%' }, face: { pos: '59% 13.7%', size: '415%' } },
  photos: { crisis: { src: 'img/napier/crisis.webp', caption: '管制室で頭を抱える技術者たち' },
            solved: { src: 'img/napier/solved.webp', caption: '打ち上げに歓声を上げる管制室' } },
  colleague: { name: 'フライトディレクター', short: 'FD' },
  monitor: { sys: 'ORBIT SIMULATOR', task: '…', label: '計算の完了予想', stuckAt: 31,
             init: () => state, tick: (state, solved) => ({ line: 'html', value: 'text' | null }),
             solvedValue: '残り 0.8秒 ／ 打ち上げ GO' },
  steps: [ /* 下の「場面の種類」 */ ],
  talks: { plea: TalkCfg, name: TalkCfg, ... },
  faq: [ { re: /…/, a: '…' } ],
  parts: { tiles: {...} },               // steps の part が参照する設定
  puzzle: PuzzleCfg,
  how: { rows: [[見出し, 本文html], ...], note: '…' },   // rows[0] は「今まで」の行
  rewrite: { before: 'p = p * x　　 # 掛け算', after: 'L = L + log(x)　# 足し算' },
  win: { sys: '…', col: '…' },
  epilogue: { year: 1614, place: 'EDINBURGH', lines: ['…'], card: { formula: 'html', note: '…' },
              anecdotes: [ { tag: '本当' | '伝説', text: '…' }, { … } ] }
});
```

**場面の種類（steps の要素）**

| 書き方 | 動き |
|---|---|
| `{ t: 'say', who, text }` | who は `col` `me` `nap` `sys` `sys warn` `sys err` `sys ok` `sys holo` |
| `{ t: 'alarm' }` | 進み具合を赤くし、札を STALLED にする |
| `{ t: 'talk', id }` | `talks[id]` で入力欄を出し、正答まで続ける |
| `{ t: 'enter' }` | 左の写真の上に数学者が現れる。以後、右上に顔の小窓 |
| `{ t: 'part', kind, id }` | 体験パーツ。設定は `parts[id]` |
| `{ t: 'puzzle' }` | 公式パズル。ボーナスを見つけたかを記録 |
| `{ t: 'how' }` | 「なぜ楽になるか」 |
| `{ t: 'rewrite' }` | 書き換え演出から進み具合 100% |
| `{ t: 'solved' }` | 左の写真を解決写真に替え、win.sys と win.col を出す |
| `{ t: 'qa' }` | 質問タイム（全話共通の設定 + 話の faq） |
| `{ t: 'leave' }` | 数学者が去る |
| `{ t: 'end' }` | 「エピローグへ」ボタン → エピローグ |

**TalkCfg**（napier-log v1.4.0 の STEP と同じ形）：`{ ph, chips:[{t, keep?}], rules:[{re, ok, reply:[[who,text],...]}], any?, noFaq?, miss:[[who,text]], reask?, again? }`

**PuzzleCfg**：`{ label, template: 'log ( M {0} N ) = log M {1} log N', blocks: ['+','−','×','÷'], answer: ['×','+'], bonus: { answer: ['÷','−'], hint: '…', card: 'html' } | null, hints: [{ when: (fill) => bool, text }], hint3: '…', check: { label: 'M=100, N=1000', left: (fill) => number|NaN|null, right: (fill) => number|NaN|null } }`。`{n}` が空欄 n 番。

---

### Task 1: 土台（フォルダ・画面の器・左右分割・画面切替・点検の入口）

**Files:**
- Create: `hirameki/index.html`, `hirameki/css/style.css`, `hirameki/js/core.js`, `hirameki/js/selftest.js`, `hirameki/tools/check-episodes.js`
- Move: `napier-log/docs/2026-11-11-series-*.md` → `hirameki/docs/`
- Modify: `C:\Users\sdann\Claude\.claude\launch.json`（`hirameki`、port 5194、`npx -y http-server@14.1.1 hirameki -p 5194 -c-1`）

**Interfaces:**
- Produces: `window.HK`; `HK.$(id)`, `HK.sleep(ms)`, `HK.esc(s)`, `HK.norm(s)`（NFKC→空白除去→小文字）、`HK.VERSION = '1.0.0'`、`HK.run` と `HK.newRun(): number`、`HK.alive(run): boolean`、`HK.show(screenId)`、`HK.episodes: Map<id, Episode>`、`HK.episode(def)`（登録）、`HK.route()`（`location.hash` を読んで一覧か話へ）。画面の id は `s-title` `s-list` `s-play` `s-epi`。`s-play` の中は `#stage`（左）と `#pane`（右：`header` `#mon` `#chat` `#dock`）。

- [ ] **Step 1:** `tools/check-episodes.js` を書く。`global.HK` を用意し `js/core.js` と `episodes/*.js` を読み、`HK.episodes` の件数を表示する。この時点では話が0件で「0 episodes」と出る。
- [ ] **Step 2:** 実行して確かめる。Run: `node hirameki/tools/check-episodes.js` / Expected: `0 episodes` と表示、終了コード 0。
- [ ] **Step 3:** `index.html` と `style.css` を作る。napier-log v1.4.0 の CSS トークンと背景を移し、`s-play` を横向きは `grid-template-columns: 1fr 1fr`、`@media (orientation: portrait)` では写真 30vh を上・チャットを下にする。右の `#pane` の中身は napier-log の `#s-chat` と同じ並び。
- [ ] **Step 4:** `core.js` に上記の関数を実装。`HK.route()` は `#<id>` が登録済みなら話、なければ一覧を出す。`hashchange` でも呼ぶ。
- [ ] **Step 5:** `selftest.js`：`?test` のとき `HK.norm('２は１０の 何乗')==='2は10の何乗'` などを `console.assert` で確かめ、`[selftest] OK n件` を出す。
- [ ] **Step 6:** 画面確認。`preview_start hirameki` → 1280×800 と 800×1280 で `s-play` を仮表示し、左右分割と上下の並びが切り替わる。回転（サイズ変更）しても `#dock` が画面内にある。`?test` でコンソールに `[selftest] OK`。

### Task 2: 会話（判定・入力欄・自動入力ボタン・FAQ）

**Files:**
- Create: `hirameki/js/judge.js`, `hirameki/js/faq-common.js`, `hirameki/js/chat.js`, `hirameki/tools/test-judge.js`

**Interfaces:**
- Consumes: Task 1 の `HK.norm`, `HK.sleep`, `HK.esc`, `HK.alive`
- Produces:
  - `HK.judge(cfg: TalkCfg, text: string, faqs: Array<{re,a}>): { ok: boolean, reply: [who,text][], faq: boolean }` — 判定順は Global Constraints のとおり。`any` なら該当なしでも `ok:true`。`noFaq` なら FAQ を見ない。
  - `HK.FAQ_COMMON`（napier-log v1.4.0 の FAQ から、ネイピア個人の話を除いたもの：こんにちは／どこで使われているか、など）
  - `HK.say(who, text, run): Promise<void>`、`HK.addMsg(who, text)`、`HK.talk(cfg, faqs, run): Promise<string>`、`HK.ask(label, gold?): Promise<void>`
  - 会話の速さ：`HK.speed`（1 または 0.45）。`say` の待ち時間に掛ける。

- [ ] **Step 1:** `tools/test-judge.js` に失敗するテストを書く（`assert` を使う）。
  - `judge(name, '名前をつけたら便利じゃないですか？', []).ok === true`
  - `judge(name, '毎回、指で数えればいいと思います', []).ok === false` かつ reply が2行
  - `judge(frac, '２は１０の２乗？', []).ok === false`（全角でも誤答の決まりに当たる。正答の「乗」より先）
  - `judge(frac, '10の何乗かで表せない？', []).ok === true`
  - `judge(plea, 'なんでもいい', []).ok === true`（any）
  - `judge(qa, '割り算は？', faqs).faq === true`
  - `judge(qa, '好きな食べ物は？', faqs)` は miss の返事
  （name / frac / plea / qa は napier-log v1.4.0 の STEP をそのまま写したテスト用の設定）
- [ ] **Step 2:** Run: `node hirameki/tools/test-judge.js` / Expected: `HK.judge is not a function` で失敗。
- [ ] **Step 3:** `judge.js` に `HK.judge` を実装（Node では `module.exports` も出す）。
- [ ] **Step 4:** Run: `node hirameki/tools/test-judge.js` / Expected: `test-judge: 7 passed`。
- [ ] **Step 5:** `chat.js` に表示まわりを napier-log v1.4.0 から移植（`addMsg` / `say` / `inputBox` / `talk`）。入力欄は `maxlength=100`。自動入力中に送信したら、その時点の文で送り、以後の打ち込みを止める。送信後はすぐ入力欄を消して二重送信を防ぐ。
- [ ] **Step 6:** 画面確認：仮の会話で、自動入力の途中で送信 → 途中までの文が1回だけ出る。送信ボタン連打で発言は1回。全角入力でも誤答・正答が想定どおり。

### Task 3: 左の写真パネル・ホログラム・進み具合・実行の流れ

**Files:**
- Create: `hirameki/js/stage.js`, `hirameki/js/monitor.js`, `hirameki/js/runner.js`

**Interfaces:**
- Consumes: Task 1・2 の関数
- Produces:
  - `HK.stage.load(ep)`：困っている写真を出す。読み込めなければ仮の枠（`photos.crisis.caption` と写真のアイコン）
  - `HK.stage.enter(ep, run): Promise<void>`：写真の上でホログラムが現れる演出（napier-log の glitch → materialize を左パネル内に移す）。終わると右上の顔小窓を出す
  - `HK.stage.solved(ep)`：解決写真に切り替える（0.8秒でフェード）
  - `HK.stage.leave()`
  - 肖像の表示：`HK.portrait(ep, 'bust'|'face'): string`（napier-log v1.3.0 の `.nap-ph` 方式。`background-image` に `person.img`、位置と大きさは `person.bust/face`。画像が無いときは名前の頭文字の丸）
  - `HK.monitor.start(ep, run)`, `HK.monitor.alarm()`, `HK.monitor.finish(ep): Promise<void>`（100% まで一気に）
  - `HK.play(id): Promise<void>`：`HK.newRun()` で実行IDを取り、`steps` を順に実行。各 await の後で `HK.alive(run)` を確かめて止まる
- [ ] **Step 1:** `selftest.js` に追記：`HK.portrait` が画像なしの話で頭文字の丸を返す。`HK.play` に未知の `t` を渡すとコンソールにエラーを出して止まる（落ちない）。
- [ ] **Step 2:** `?test` で失敗を確認。
- [ ] **Step 3:** 3つのファイルを実装。steps の `talk` `part` `puzzle` `how` `rewrite` `qa` `end` は、この時点では「未実装」と sys 発言を出して次へ進む仮の処理にする。
- [ ] **Step 4:** `?test` で `[selftest] OK`。
- [ ] **Step 5:** 画面確認：say / alarm / enter / solved / leave だけの仮の話を登録して流す。写真が無い状態で仮の枠が出る。途中で戻る → すぐ別の仮の話を始める → 前の話の発言が出てこない。

### Task 4: 公式パズル・「なぜ楽になるか」・書き換え演出

**Files:**
- Create: `hirameki/js/puzzle.js`, `hirameki/js/panels.js`
- Modify: `hirameki/js/runner.js`（`puzzle` `how` `rewrite` をつなぐ）

**Interfaces:**
- Consumes: PuzzleCfg、`ep.how`、`ep.rewrite`
- Produces: `HK.puzzle(cfg, run): Promise<{ bonus: boolean }>`、`HK.howPanel(ep, run): Promise<void>`、`HK.rewrite(ep, run): Promise<void>`
- [ ] **Step 1:** `selftest.js` に追記：`HK.parseTemplate('log ( M {0} N ) = log M {1} log N')` が「文字・空欄0・文字・空欄1・文字」の5要素を返す。
- [ ] **Step 2:** `?test` で失敗を確認。
- [ ] **Step 3:** napier-log v1.4.0 の `buildPuzzle` を設定駆動に書き換える（ドラッグとタップ両対応、空欄が1つ残りならタップで自動ではめる、`hints` を上から調べる、3回まちがえたら `hint3`、`bonus` は褒めて空欄を空にする、試算表示は `check`）。`howPanel` と `rewrite` も設定駆動に。
- [ ] **Step 4:** `?test` で `[selftest] OK`。
- [ ] **Step 5:** 画面確認：対数の設定で、正解・ボーナス・誤答3回のヒントが出る。横 1280 と縦 800 の両方で式が1行に収まる。

### Task 5: 体験パーツ3種

**Files:**
- Create: `hirameki/js/parts.js`
- Modify: `hirameki/js/runner.js`（`part` をつなぐ）

**Interfaces:**
- Produces: `HK.parts.tiles(cfg, run)`, `HK.parts.numberline(cfg, run)`, `HK.parts.approach(cfg, run)`。どれも `Promise<void>`（最後のボタンで解決）。
  - `tiles`：`{ head, mode: 'count' | 'stairs', ... }`。`count` は napier-log の「10 をいくつ掛けた？」（問い `[{num:'100', ans:2}, {num:'1000', ans:3}]`、つなげて数える、まとめの文）。`stairs` は数列の和用（`n: 10`：1〜n の階段、逆さの階段を重ねると各列 n+1 の長方形になり、`n(n+1)` の半分を出す）
  - `numberline`：`{ head, start: 0, moves: [{label:'売上', delta: 5000}, {label:'仕入れ', delta: -8000}], unit: '円', min: -10000, max: 10000 }`。ボタンで順に動かし、最後の位置を大きく表示
  - `approach`：`{ head, target: 2, candidates: [1.4, 1.41, 1.414, 1.4142], format: (x) => 'x × x = …' }`。押すたびに2乗を表示し、目標との差が縮むがゼロにならないことを見せる
- [ ] **Step 1:** `selftest.js` に追記：`stairs` の n=10 の合計が 55、`numberline` の最終位置が −3000、`approach` の最後の2乗が 2 と等しくない。
- [ ] **Step 2:** `?test` で失敗を確認。
- [ ] **Step 3:** 実装。
- [ ] **Step 4:** `?test` で `[selftest] OK`。
- [ ] **Step 5:** 画面確認：3種とも、まちがったボタンを押しても先に進める。

### Task 6: エピローグ・人物ファイル・タイトル・一覧・クリア印

**Files:**
- Create: `hirameki/js/epilogue.js`, `hirameki/js/menu.js`
- Modify: `hirameki/js/runner.js`（`qa` `end` をつなぐ）

**Interfaces:**
- Produces: `HK.epilogue(ep, { bonus })`、`HK.catchYears(year, now): number`、`HK.menu.renderList()`、`HK.clear.mark(id)` / `HK.clear.has(id)`（localStorage、try/catch）
- `HK.catchYears(year, now)`：差が100年以上なら100の位で切り捨て（1614 → 2026年なら 400）、100年未満なら10の位で切り捨て。決めぜりふは「数学のひらめきは、{n}年後の世界も救っている。」
- [ ] **Step 1:** `selftest.js` に追記：`catchYears(1614, 2026) === 400`、`catchYears(628, 2026) === 1300`、`catchYears(1525, 2026) === 500`。
- [ ] **Step 2:** `?test` で失敗を確認。
- [ ] **Step 3:** 実装。人物ファイルは顔（`HK.portrait(ep,'face')`）、名前、生没年、国、肩書き、エピソード2つに「本当」「伝説」の札。`faceUnknown` なら「実際の顔はわかっていません」。一覧は学年の順にカードを並べ、クリア済みに印。タイトル下に `v` + `HK.VERSION`。速さ切替ボタンを一覧に置く。
- [ ] **Step 4:** `?test` で `[selftest] OK`。
- [ ] **Step 5:** 画面確認：クリア印が再読み込み後も残る。localStorage が使えない状態（シークレット等）でもエラーにならない。

### Task 7: ネイピア編（宇宙だけ）と台本点検

**Files:**
- Create: `hirameki/episodes/napier.js`
- Modify: `hirameki/tools/check-episodes.js`（点検を足す）
- 画像：`napier-log/assets/napier-source.webp` を `hirameki/img/napier/portrait.webp` にコピー。crisis / solved は持ち主待ち（仮の枠）

**Interfaces:**
- Consumes: すべての HK 関数
- Produces: 点検の決まり（以後の話にも効く）

- [ ] **Step 1:** `check-episodes.js` に点検を足す（失敗したら終了コード 1）：
  - 各 talk（`any` 以外）で、chips のうち `judge` が ok になるものがちょうど1つ
  - `puzzle.answer` の各要素が `blocks` にある。`check.left(answer)` と `check.right(answer)` が等しい。`bonus` があればそれも等しい
  - `epilogue.anecdotes` が2つで、tag は「本当」か「伝説」
  - steps に `enter` があり、最初の `nap` の発言より前にある
  - steps の `talk` / `part` が参照する id が存在する
  - 画像ファイルが無ければ「警告」として表示（失敗にはしない）
- [ ] **Step 2:** Run: `node hirameki/tools/check-episodes.js` / Expected: napier.js が無いので `0 episodes`。
- [ ] **Step 3:** `napier.js` を書く。napier-log v1.4.0 の宇宙シナリオ・SC.space・STEP・FAQ（ネイピア個人の話）・puzzle・how・rewrite を移す。人物ファイルは設計図 11-1 の2つ。
- [ ] **Step 4:** Run: `node hirameki/tools/check-episodes.js` / Expected: `1 episodes, 0 errors`（画像の警告2件は可）。
- [ ] **Step 5:** 画面確認：最初から最後まで通しで遊び、約10分で終わる。全部の誤答ボタンを1回ずつ押しても最後まで進める。

### Task 8: 負の数編（中1・ブラーマグプタ・お店）

**Files:** Create: `hirameki/episodes/negative.js`

- [ ] **Step 1:** 設計図 11-2 のとおりデータを書く。体験は `numberline`（start 0、+5000、−8000）。パズルは `'売上 5000 − 仕入れ 8000 = {0}{1}'`、blocks `['+','−','3000','13000']`、answer `['−','3000']`、check は「左＝5000−8000」「右＝符号と数から作った値」。名づけの talk は設計図の誤答2つを入れる。
- [ ] **Step 2:** Run: `node hirameki/tools/check-episodes.js` / Expected: `2 episodes, 0 errors`。
- [ ] **Step 3:** 画面確認：通しで 5〜10分、誤答ボタン全部で詰まらない。

### Task 9: 平方根編（中3・ルドルフ・建築）

**Files:** Create: `hirameki/episodes/sqrt.js`

- [ ] **Step 1:** 設計図 11-3 のとおり。体験は `approach`（target 2、候補 1.4 / 1.41 / 1.414 / 1.4142）。パズルは `'一辺 × 一辺 = 2　→　一辺 = {0}'`、blocks `['1','2','√2','2²']`、answer `['√2']`、check は「左＝選んだ数 × 選んだ数」「右＝2」。`faceUnknown: true`。
- [ ] **Step 2:** Run: `node hirameki/tools/check-episodes.js` / Expected: `3 episodes, 0 errors`。
- [ ] **Step 3:** 画面確認：通しで 5〜10分、誤答ボタン全部で詰まらない。

### Task 10: 数列の和編（高2・数学B・ガウス・音楽ライブ）

**Files:** Create: `hirameki/episodes/gauss-sum.js`

- [ ] **Step 1:** 設計図 11-4 のとおり。体験は `tiles` の `stairs`（n 10）。パズルは `'S = n × ( a {0} l ) {1} 2'`、blocks `['+','−','×','÷']`、answer `['+','÷']`、check は n=100, a=1, l=100 で「左＝1〜100 を足した 5050」「右＝式の値」。エピローグの歴史の文に「（言い伝え）」を入れる。
- [ ] **Step 2:** Run: `node hirameki/tools/check-episodes.js` / Expected: `4 episodes, 0 errors`。
- [ ] **Step 3:** 画面確認：通しで 5〜10分、誤答ボタン全部で詰まらない。

### Task 11: 全体の確認と、GitHub に上げる準備

**Files:** Create: `hirameki/README.md`（持ち主向け：話の足し方、画像の置き場所、点検の動かし方）

- [ ] **Step 1:** Run: `node hirameki/tools/test-judge.js` と `node hirameki/tools/check-episodes.js` / Expected: どちらも失敗0。
- [ ] **Step 2:** 画面確認：一覧から4話を開く。`#napier` などの直接 URL で開く。横 1280×800・縦 800×1280・スマホ 375×812 で崩れない。コンソールにエラーなし。
- [ ] **Step 3:** Review Focus の5項目を、もう一度まとめて確かめる。
- [ ] **Step 4:** 持ち主に、届いていない画像の一覧（ファイル名とプロンプトの番号）を伝える。
