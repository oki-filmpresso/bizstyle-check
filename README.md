# AI BizStyle Check 👔

事業主のための即席AIファッション診断アプリ。

写真を撮るだけで1秒でTPO適合度・色合わせ・スタイルをチェックします。

## 機能

- 📷 カメラ撮影 or 画像アップロード
- ⚡ 1秒で即時診断（API不要・ルールベース）
- 🎯 TPO適合度スコア
- 🎨 色合わせ分析（写真から自動抽出）
- 📋 診断履歴の蓄積
- 📥 CSV出力（Googleスプレッドシート連携）

## セットアップ

```bash
npm install
npm run dev
```

## デプロイ

Vercel にデプロイする場合：

1. GitHubにリポジトリを作成してpush
2. [vercel.com](https://vercel.com) でGitHubアカウントでログイン
3. "Import Project" からリポジトリを選択
4. そのまま "Deploy" をクリック
5. URLが発行されます

## 技術スタック

- React 18 + Vite
- Canvas API（画像から色抽出）
- ルールベーススコアリング（API不要）
