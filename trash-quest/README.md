# TrashQuest

片付け前の写真をGeminiで解析し、検出した片付け対象を宝箱として表示するNext.jsアプリです。
プロジェクトルートはリポジトリ直下ではなく **`trash-quest/`** です。

## ローカル起動

Node.js 22.18以上（推奨24 LTS）を使います。テストはNode.jsのTypeScript実行機能を使用します。

```bash
cd trash-quest
npm ci
npm run dev
```

`trash-quest/.env.local`を自分のエディターで作成し、以下を設定してサーバーを再起動します。
リポジトリ直下の`.env`は、このNext.jsアプリの設定には使いません。

| 環境変数 | 内容 |
| --- | --- |
| `GEMINI_API_KEY` | Google AI Studioで発行したAPIキー。必須、サーバー専用 |
| `GEMINI_MODEL` | 任意。未設定・空文字なら`gemini-3.5-flash-lite` |

モデル名にはGoogleのモデルIDを指定します（`models/`は付けません）。モデルの利用可否・割当・課金設定は使用するGoogleプロジェクトで確認してください。別モデルへ自動的に切り替えることはありません。

APIキーに`NEXT_PUBLIC_`を付けたり、`next.config.ts`の`env`へ書いたりしないでください。
`.env*`はGit追跡対象外です。キーをソース、コミット、コマンド引数、スクリーンショット、ログへ含めないでください。

[http://localhost:3000/clean](http://localhost:3000/clean)を開き、以下を確認します。

1. 通常モードで片付け前のJPEG・PNG・WebP画像を選ぶ。画像はGeminiへ送信されます。
2. 解析中表示の後、実際の検出件数と位置に宝箱が出ることを確認する。
3. 片付け後の写真を選ぶ。既存の回収演出と経験値・アイテム報酬へ進む。
4. 失敗時は表示されたエラーを確認し、「画像解析を再試行」または写真の選び直しを行う。

画像はブラウザで向きを揃え、長辺1600px以下のJPEGへ変換します。プレビューと送信に同じ変換を使います。
元画像は20 MiB以下、APIへ送る画像は4 MiB以下です。HEICはJPEGへ変換してください。
サーバーはmultipart全体のサイズ、MIMEとファイル署名も確認します。画像保存やPython処理は使いません。

## デモと報酬

最初の画面で「固定の検出結果でデモを試す」を選ぶと、従来の`api/detections.json`を使います。
デモ中はGemini APIを呼びません。通常モードでAPIが失敗しても固定JSONには切り替わりません。
デモの報酬は従来どおり同じブラウザのプレイヤー情報に反映されます。

通常モードはサーバーで検証した`{ detections: [{ name, box_2d, level }] }`を受け取り、クライアントでも再検証します。
`box_2d`は`[ymin, xmin, ymax, xmax]`の順、0〜1000の有限数で、幅・高さが正である必要があります。
空白名・80文字超の名前・不明な難易度・100件超・不正な座標がある応答は全体を拒否します。
途中終了やブロックされた応答も報酬へ渡しません。

検出0件は正常結果として表示し、写真の選び直しができます。報酬画面には進みません。
経験値の`lv1=25 / lv2=50 / lv3=100 / lv4=200`、抽選アイテム、レベルアップ、localStorageへの保存は既存のままです。

**片付け前後の画像比較による自動成功判定はありません。**
片付け後の写真を選ぶと、片付け前に検出した対象をすべて回収したものとして扱います。
今回の統合は片付け前の検出だけをGeminiへ接続しています。

## Vercel Preview

1. GitHubリポジトリをVercelの既存プロジェクトへ接続する。Framework Presetは **Next.js**、Root Directoryは **`trash-quest`**、Node.jsは **24.x** にする。
2. Install Commandは`npm ci`、Build Commandは`npm run build`、Output DirectoryはNext.jsの既定値にする。
3. Project Settings → Environment Variablesで`GEMINI_API_KEY`を **Preview** に設定する。必要なら`GEMINI_MODEL`も設定する。Productionだけの設定ではPreviewに渡らない。変更したら再デプロイする。
4. 作業ブランチ`feature/gemini-image-inspection`をpushする。Production Branchは`main`のままにし、生成されたPreviewを開く。mainへ自動マージしない。
5. Previewの`/clean`でデモをOFFにし、実際の写真で検出→片付け後写真→報酬→ホームへの反映を確認する。別の写真でも試し、固定JSONの配置になっていないことを確認する。
6. ブラウザのNetworkで`POST /api/inspect`が成功することを確認する。リクエストには画像だけが含まれ、APIキーが含まれないことを確認する。レスポンスの検出件数・位置・難易度が画面と一致することを確認する。
7. 検証専用Previewでキー未設定・無効モデルも試し、エラー表示と再試行、報酬が付かないことを確認する。実際の429を起こすための連続送信は不要（自動テストで検証）。設定を戻したら再デプロイする。
8. VercelのFunctions画面で`/api/inspect`がNode.jsとして認識され、タイムアウトが60秒になっていることを確認する。キーや画像、生のGemini応答をログへ追加しない。

API Routeは`runtime = "nodejs"`、`maxDuration = 60`、Geminiへのリクエストは45秒で打ち切ります。
ブラウザは55秒で打ち切り、同時送信を防ぎます。自動リトライは行わず、画面から手動で再試行します。
Vercelの[リクエスト上限](https://vercel.com/docs/functions/limitations#request-body-size)を超えないよう、multipartで画像バイナリを送り、サーバー内でのみBase64にします。
Geminiには[REST API](https://ai.google.dev/api/generate-content)のJSON形式指定とスキーマを使用します。

| 状況 | HTTP / 画面の対応 |
| --- | --- |
| 画像なし・不正なmultipart | 400 / 写真を選び直す |
| サイズ超過 | 413 / 画像を縮小する |
| 非対応形式・署名不一致 | 415 / JPEG・PNG・WebPを使う |
| キー未設定・モデル名の書式不正 | 503 / サーバー設定を確認する |
| Geminiの429 | 429 / 利用制限の案内、時間をおいて再試行 |
| Geminiの認証・モデル・権限エラー | 502 / キー・モデル・権限を確認する |
| 接続エラー・不正応答・解析未完了 | 502 / 再試行または別の写真を使う |
| Geminiのタイムアウト | 504 / 再試行する |

プレイヤー・報酬は従来どおりブラウザ保存です。PreviewはVercelのDeployment Protectionで検証対象者に限定できます。

## 検証コマンド

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
npm start
```

自動テストはGeminiをモックし、画像バイトの送信、モデル切り替え、入力制限、429・タイムアウト・不正応答、秘密情報を返さないこと、検出結果から既存報酬への接続を確認します。
実APIの精度・割当・モデル利用権限、スマートフォンの撮影画像、Vercelでの動作はPreviewで別途確認してください。

## 調査した既存実装

- 起点: `main`の`f0204b7`（2026-11-17時点のGitHub上のmainと一致）。`app/clean/page.tsx`が固定JSONを直接使用していた。
- `Feat/Upload-image-to-process`の`afbba2a`: `app/api/inspect/route.ts`と独立した`/game`画面を追加。プロンプト、multipart、サーバー側ヘッダー認証の方式を必要な部分だけ移植した。ブランチ全体のマージや旧`/game`の復活はしていない。
- 旧Routeはモデル固定、タイムアウト・画像サイズ制限なし、不正要素を黙って除外、座標の範囲・向きの確認なし、生のAPIエラーをログに出す構造だった。これらを今回修正した。旧Vercelデプロイのログは確認できていないため、当時の直接の障害原因は断定しない。
- mainに残る`api/run.py`・`api/utils.py`は今回の経路から呼ばない。作業ディレクトリへJSON・画像を書く旧Python処理に依存しない。
- `QuestResult → applyQuestReward → savePlayer`の既存報酬処理に検出結果の難易度を渡す。前後画像の自動比較は既存画面にも旧Routeにも実装されていなかった。
