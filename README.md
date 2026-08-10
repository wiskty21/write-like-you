# Tabelog Writer

本人が食べログへ投稿した口コミを収集し、過去の文体を参考に新しい口コミの下書きを生成する個人用アプリです。

- 画面：React、Vite、Tailwind CSS、daisyUI
- API：TypeScript、Hono、Cloudflare Workers
- 口コミ収集：Playwright、Cloudflare Browser Run
- 保存：ローカルJSON、Cloudflare D1
- 文章生成：Cloudflare Workers AI

## 口コミの取得項目

| 項目 | 型 | 内容 |
| --- | --- | --- |
| `id` | `string` | 口コミ詳細URL由来のID |
| `name` | `string` | 店舗名 |
| `url` | `string` | 店舗ページURL |
| `detailUrl` | `string` | 口コミ詳細URL |
| `title` | `string \| null` | 口コミタイトル |
| `body` | `string \| null` | 省略されていない口コミ本文 |
| `reviewDate` | `string` | 訪問年月。`YYYY-MM`形式 |
| `rating` | `number` | 投稿者が付けた点数 |
| `likeCount` | `number` | 口コミへのいいね数 |

食べログが公開している日付は訪問年月までのため、存在しない日を補完しません。

## スクレイピング構成

食べログの巡回・抽出処理は、ローカルとCloudflareで共通です。ブラウザーの起動方法と保存先だけをコンストラクタインジェクションで切り替えます。

```mermaid
flowchart LR
    L["ローカルコマンド"] --> LB["LocalBrowserProvider"]
    C["手動実行"] --> CB["CloudflareBrowserProvider"]
    LB --> S["TabelogReviewScraper"]
    CB --> S
    S --> R["RefreshReviews"]
    R --> J["JsonReviewRepository"]
    R --> D["D1ReviewRepository"]
```

| 実行環境 | ブラウザー | 保存先 | 口コミ一覧の参照先 |
| --- | --- | --- | --- |
| ローカル | ローカルChrome | `data/reviews.json` | `data/reviews.json` |
| 本番 | Browser Run | D1 | D1 |

口コミ一覧APIと文章生成の参考文は、`REVIEW_SOURCE`で参照先を切り替えます。

| `REVIEW_SOURCE` | 口コミ一覧・文章生成の参考文の参照先 |
| --- | --- |
| `json` | `data/reviews.json`と`data/reviews-meta.json` |
| `d1` | Cloudflare D1 |

`json`と`d1`以外を指定した場合は、設定ミスとしてエラーになります。

## セットアップ

```bash
npm install
```

`.dev.vars`を作成し、Workers AIをローカルから利用するための値を設定します。

```text
AI_TRANSPORT="rest"
REVIEW_SOURCE="json"
CLOUDFLARE_ACCOUNT_ID="CloudflareのAccount ID"
CLOUDFLARE_AI_API_TOKEN="Workers AI API Token"
```

本番では`wrangler.jsonc`の`REVIEW_SOURCE="d1"`が使用されます。

Browser Runは`wrangler.jsonc`でリモートバインディングとして設定されています。ローカルからBrowser Runを実行した場合もCloudflare側の利用量に加算されます。

## ローカルChromeで口コミを取得

```bash
npm run scrape
```

通常のChromeを起動して口コミを取得し、次のファイルへ保存します。

```text
data/reviews.json
data/reviews-meta.json
```

このコマンドはD1や本番環境を更新しません。

## アプリのローカル起動

先に口コミJSONを更新します。

```bash
npm run scrape
```

続けてアプリを起動します。

```bash
npm run dev
```

表示されたURLを開きます。口コミ一覧と文章生成の参考文は`data/reviews.json`から読み取るため、ローカルD1は使用しません。

## 本番D1の手動更新

本番D1を更新する場合は、Wranglerの開発サーバーを使用して手動で実行します。

```bash
npm run dev:worker
```

別のターミナルからScheduled Handlerを呼び出します。

```bash
curl "http://localhost:8787/cdn-cgi/handler/scheduled"
```

起動時のバインディング一覧で`env.DB`が`remote`になっていることを確認してください。`local`の場合は本番D1に反映されません。

この処理は次の順序で動作します。

1. Browser Runでブラウザーを起動する
2. 食べログの一覧と詳細ページを巡回する
3. 取得結果をD1のトランザクションで全件入れ替える
4. 最終更新日時を保存する

処理途中で失敗した場合、D1の既存口コミは置き換わりません。

## ビルドとデプロイ

初回またはマイグレーション追加時は、Workerより先にリモートD1へ適用します。

```bash
npx wrangler d1 migrations apply tabelog-writer-db --remote
npm run build
npm run deploy
```

デプロイ後も口コミは自動取得されません。リモートD1を更新する場合は、前述の手動更新を実行します。

## 主なファイル

```text
.
├── migrations/
│   ├── 0001_initial_schema.sql
│   └── 0002_scraped_reviews.sql
├── scripts/
│   └── scrape-tabelog.ts
├── src/
│   ├── local/
│   │   ├── local-browser-provider.ts
│   │   └── json-review-repository.ts
│   ├── scraping/
│   │   ├── browser-provider.ts
│   │   ├── review-repository.ts
│   │   ├── tabelog-review-scraper.ts
│   │   └── refresh-reviews.ts
│   ├── react-app/
│   └── worker/
│       ├── cloudflare-browser-provider.ts
│       ├── d1-review-repository.ts
│       ├── create-refresh-reviews.ts
│       └── index.ts
├── wrangler.jsonc
└── package.json
```

## エラーとして停止する条件

- ページ取得時のHTTPステータスが正常でない
- 一覧から口コミ情報を取得できない
- 訪問年月が`YYYY/MM 訪問`形式ではない
- 点数またはいいね数を数値へ変換できない
- 全投稿でいいね要素が見つからない
- D1への一括保存が失敗する

食べログ側のHTML構造変更を空データとして保存せず、既存データを維持するための条件です。

## 注意事項

- 食べログ側のHTML構造が変わると、CSSセレクターの修正が必要です。
- Browser RunからのアクセスはBotとして識別されます。対象サイトの判断により取得できなくなる可能性があります。
- 実行頻度、取得データの範囲、利用方法について対象サイトの利用条件を確認してください。
- Browser RunとWorkers AIの利用量はCloudflareダッシュボードで確認してください。
