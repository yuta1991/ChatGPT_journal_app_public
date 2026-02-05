# Journal Coach (MCP)

日記・Todo・週間タスク・簡易分析をまとめて扱う、MCPサーバー + ChatGPTウィジェットの試作プロジェクトです。  
サーバーはSQLiteに保存し、UIはビルド済みアセットをMCPリソースとして配信します。

## できること
- 日記の保存／取得（タグ最大5件）
- 日記本文からタグ候補を生成
- Todoの追加／完了切替／削除
- 週間タスクの追加／完了切替／削除（週の開始日は日曜）
- 期間（週／月）の簡易分析文を生成・保存

## 構成
- `server/` MCPサーバー（Node + TypeScript、SQLite）
- `ui/` ウィジェットUI（React + Vite）
- `shared/` 共通型定義
- `documents/` 設計・手順メモ

## 必要要件
- Node.js `20.19.0`
- npm

## セットアップ
```bash
npm install
```

Nodeのバージョンを合わせる場合:
```bash
nvm use 20.19.0
```

## UIのビルド
サーバーは `ui/dist/widget.js` と `ui/dist/ui.css` を読み込んで配信します。  
UIを変更したらビルドを実行してください。

```bash
npm -w ui run build
```

UIを単体で確認したい場合:
```bash
npm -w ui run dev
```

## サーバー起動
```bash
npm -w server run dev
```

別コマンドでもOK:
```bash
npm run dev:server
```

デフォルトは `http://localhost:8787/mcp` です。ポートは `PORT` で変更できます。

## ngrok（外部公開が必要な場合）
```bash
ngrok http 8787
```

`server/tools/index.ts` の `ORIGIN` を、発行されたngrokドメインに合わせて更新してください。  
この値はウィジェットのCSP許可に使われます。

## MCP Inspector
```bash
npx @modelcontextprotocol/inspector@latest http://localhost:8787/mcp
```

## 環境変数
- `PORT` サーバーの待ち受けポート（既定: `8787`）
- `DB_PATH` SQLiteファイルの保存先（既定: `server/data/journal.sqlite`）

## MCPツール一覧（主要）
- `load_dashboard`
- `get_diary_by_date`
- `save_diary`
- `generate_diary_tags`
- `add_todo`
- `set_todo_done`
- `delete_todo`
- `add_weekly_task`
- `set_weekly_task_done`
- `delete_weekly_task`
- `run_analysis`
- `save_analysis`

