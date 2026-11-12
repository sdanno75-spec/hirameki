# 話の骨組みをそろえる 設計図（2026-11-12）

ネイピア編 v1.2.2 の流れを「型」として、ほかの3話（負の数・平方根・ガウス）を同じ骨組みに書き直す。

## ねらい

- 「こんな計算をしないといけないのか…」を、**本物の式と本物の数**で見せる。
- 困っている様子は、機械の表示（ERROR・赤いアラート・流れる計算）ではなく、**仲間との会話と写真**で伝える。
- 生徒は早い段階で「どのくらい大変？」と聞かれ、自分で大変さを見積もる。

## やらないこと

- 上部モニター・`alarm`・`rewrite`・「sys warn / sys err」の表示は使わない。
- `sys` は「未知の接続を検出…」の1行だけに使う。

## 骨組み（全話共通）

| # | 場面 | 中身 | 使う部品 |
|---|------|------|----------|
| 1 | 導入 | 仲間の明るい、またはせかすひと言。何をしている場面かがわかる | say |
| 2 | 異変 | 予定どおりにいかなくなる出来事（計算機が止まる、など） | say |
| 3 | 本物の計算 | 仲間が「式はこれだ」と、実際の式と値を言う | say |
| 4 | 証拠の写真 | 仲間が「見てくれ、これだ」と、困っている紙や現場の写真を送る | **photo** |
| 5 | 大変さの見積もり | 「どのくらい大変？」と聞く。甘い答えには具体の数で言い返す | talk（正答1つ） |
| 6 | 大変さを数字で | 「1つ30分 × 80通り = 40時間」のように、所要時間などで見せる | say |
| 7 | どうする？ | 手分け・延期・ごまかしなど。どれを選んでも、仲間がだめな理由を返す | talk（any） |
| 8 | 登場 | 画面が光る → 接続表示 → 驚く仲間 → 名乗る → 「私も同じことで困っている」 | say / enter |
| 9 | 一緒に確かめる | 小さい数で手を動かす | part |
| 10 | 仲間の反応 | 「足し算なら10秒だ！」のような、希望が見える一言 | say |
| 11 | 名づけ | 「毎回言うのは長いな…」→ 名前をつける | talk |
| 12 | 広げる | 「待てよ、○○ならどうなる？」 | talk |
| 13 | 式にする | 公式を完成させる | puzzle |
| 14 | 現実に戻す | 仲間が、元の問題に当てはめたらどうなるかを言う | say |
| 15 | こう変わる | **3 と同じ本物の数**で、前と後を表にする | how |
| 16 | 解決 | 写真が解決後に変わる | solved |
| 17 | 説明する | 仲間に何をしたか説明する | talk |
| 18 | 小話 | 人物の本当の話を1つ、会話の中で（例：対数表に20年） | say |
| 19 | 質問タイム・退場 | いまのまま | qa / leave |

ルール
- 3 と 15 の数は同じものを使い、計算が正しいことを点検で確かめる。
- 5 のまちがいボタンには、必ず「具体の数で言い返す」返事をつける。
- 写真は話ごとに1枚追加する（現場の写真2枚と肖像はいまのまま）。
- 画像が無いあいだ、photo は飛ばして進む（実装済み）。

## 話ごとの中身

### ネイピア編（済み・型のお手本）
- 本物の計算：T = 2π × √(a × a × a ÷ GM)、a = 6,778,137、GM = 398,600,441,800,000
- 大変さ：1つ30分 × 80通り = 40時間（残り40分）
- 写真：handcalc.webp（済み）

### 負の数編（中1）
- 2 異変：売り切れて喜んでいたら、仕入れのレシートが 8,000円。
- 3 本物の計算：もうけ ＝ 売上 − 仕入れ ＝ 100円 × 50食 − 8,000円 ＝ 5,000 − 8,000
- 4 写真：帳簿のノート。「5,000 − 8,000 = 」のあとが書けずに消しゴムで何度も消した跡と、横にレシートの束。
- 5 見積もり：いまの「もうかった？損した？」をこの位置に。
- 6 数字で：「3,000円がどこにも書けない。報告書の合計が合わない」
- 15 こう変わる：(+5,000) + (−8,000) = −3,000 → あと 3,000円で 0（とんとん）
- 18 小話：0 を「数」として計算の決まりを書いた（本当）。

### 平方根編（中3）
- 2 異変：お客さんの注文は「正方形で、ぴったり 2㎡」。工場に送る寸法が決まらない。
- 3 本物の計算：一辺 × 一辺 ＝ 2。1.4 × 1.4 = 1.96、1.41 × 1.41 = 1.9881、1.42 × 1.42 = 2.0164
- 4 写真：設計用紙に「1.4² = 1.96」「1.41² = 1.9881」「1.414² = 1.999396」…と桁が増えていく試し計算、電卓に 1.41421356。
- 5 見積もり：「1.41m で作ればいいんじゃ？」→「それだと 1.9881㎡。0.0119㎡（はがき約 1 枚分）足りない」
- 6 数字で：「何桁まで書いても、ぴったり 2 にならない」
- 15 こう変わる：1.41 → 119 cm² 足りない／1.42 → 164 cm² はみ出す／√2 → ぴったり 2㎡
- 18 小話：√ の記号は r（radix）をくずした形から（伝説寄りなら札をつける）。

### ガウス編（高2 数B）
- 2 異変：開場 15 分前、チケット係の集計表がなくなり、ピラミッド型客席（1 列目 1 席 … 100 列目 100 席）の合計を出し直すことに。
- 3 本物の計算：1 + 2 + 3 + … + 100
- 4 写真：クリップボードの紙に 1+2=3, 3+3=6, 6+4=10… と続く足し算の列、途中で数字がずれて二重線で消した跡。
- 5 見積もり：「1 回 5 秒で足すと、何分？」→ 100 回で約 8 分、しかも途中で一度まちがえたら最初から。
- 6 数字で：「37 列目で合わなくなった。残り 63 列、開場まで 15 分」
- 15 こう変わる：(1 + 100) × 100 ÷ 2 = 5,050（計算 3 回）
- 18 小話：小学生のときに先生の出した問題を一瞬で解いた（伝説寄り、札は「伝説」）。
- 画像 9〜11（肖像・困った現場・解決）はまだ届いていない。

## 追加でお願いする写真

| 番号 | 話 | 保存先 |
|------|----|--------|
| 13 | 負の数 | img/negative/ledger.jpg |
| 14 | 平方根 | img/sqrt/trial.jpg |
| 15 | ガウス | img/gauss-sum/tally.jpg |

13（負の数）
```
A photorealistic close-up of a school festival stall table after closing. An open notebook used as an account ledger, handwritten in Japanese-style neat pencil: "売上 5,000円", "仕入れ 8,000円", and "もうけ = 5,000 − 8,000 =" followed by a blank space that has been erased many times, leaving grey smudges and a torn spot. Next to it a messy pile of receipts, a cash box with a few coins, a yakisoba spatula. Warm evening light, slightly worried mood. Landscape 4:3, no faces, no logos.
```

14（平方根）
```
A photorealistic close-up of a designer's desk at night. A sheet of drafting paper with a drawn square labeled "2 m²" and, beside it, handwritten trial calculations getting longer and longer: "1.4 × 1.4 = 1.96", "1.41 × 1.41 = 1.9881", "1.414 × 1.414 = 1.999396", "1.4142 × 1.4142 = 1.99996164 ...", each with a question mark. A calculator display shows "1.41421356". A few square tiles that do not quite fit the drawn square. Desk lamp lighting, frustrated mood. Landscape 4:3, no faces, no logos.
```

15（ガウス）
```
A photorealistic close-up of a clipboard on a concert hall staff desk backstage. The paper shows a long handwritten column of running additions: "1+2=3", "3+3=6", "6+4=10", "10+5=15" ... continuing down the page, with one line crossed out twice and the numbers drifting out of alignment, and "37?" circled near the bottom. A pen with a chewed cap, a staff lanyard, a stopwatch showing about 15 minutes. Blurry stage lights in the background. Rushed, stressed mood. Landscape 4:3, no faces, no logos.
```

## 進め方（承認後）

1. 負の数 → 平方根 → ガウスの順に、steps と talks を骨組みどおりに書き直す（1話ずつ GitHub へ）。
2. 点検（check-episodes.js）に次を足す：sys warn / err と alarm・rewrite を使っていたら失敗、photo が1つ以上あるか。
3. 使われなくなった monitor の項目は、話のデータから見出し（sys）だけ残して削る。
4. 版は話1つごとに上げる。
