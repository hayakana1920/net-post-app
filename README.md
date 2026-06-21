# つぶやきネタ帳

Vanilla HTML/CSS/JavaScript と Netlify Functions で動く、X投稿作成支援アプリです。

## できること

- ネタ出し
- リプライ案生成
- スケジュール保存
- X投稿画面を開く
- Google Apps Script への投稿予約送信
- 参考投稿の文章構造分析
- 分析プロフィール保存
- 自分の出来事・意見から10案生成
- 類似度、リスク、投稿スコア表示
- 投稿実績の手動保存

## Windows 11での準備

### 1. GitHubから取得

```bash
git clone https://github.com/hayakana1920/net-post-app.git
cd net-post-app
```

### 2. Node.jsを入れる

[Node.js公式サイト](https://nodejs.org/) から LTS 版をインストールします。

確認:

```bash
node -v
npm -v
```

### 3. テスト

```bash
npm test
```

### 4. Netlify CLIを入れる

```bash
npm install -g netlify-cli
```

### 5. APIキーを設定

PowerShellで一時的に設定する場合:

```powershell
$env:ANTHROPIC_API_KEY="あなたのAnthropic APIキー"
```

APIキーは `README`、HTML、JavaScript、GitHubへ書かないでください。

### 6. ローカル起動

```bash
netlify dev
```

表示されたURLをブラウザで開きます。

### 7. Netlifyへデプロイ

```bash
netlify deploy
```

本番へ反映する場合:

```bash
netlify deploy --prod
```

## トラブル確認

- `ANTHROPIC_API_KEY is not configured`
  - APIキーが設定されていません。
- `Content-Type must be application/json`
  - Netlify Functionへの呼び出し形式が不正です。
- 投稿生成が失敗する
  - Netlify Functionsのログを確認してください。
- 画面が古い
  - ブラウザの再読み込み、またはキャッシュ削除を試してください。

## 安全方針

参考投稿から学ぶのは、長さ、構成、フック、共感性、話題分類などの一般化可能な特徴だけです。
特定人物本人になりきらず、固有表現や文章をコピーしないよう、類似度チェックとリスクチェックを行います。
