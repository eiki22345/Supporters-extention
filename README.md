# 🌸 サポーターズチャレンジ エフェクト拡張

[サポーターズチャレンジ](https://geek.supporterz.jp/apps/supporterz-challenge)のスロット結果に応じて、画面いっぱいにエフェクトを表示する Chrome 拡張機能です。

## インストール方法

1. このリポジトリをクローン、または ZIP でダウンロードして展開する
   ```
   git clone https://github.com/eiki22345/Supporters-extention.git
   ```
2. Chrome で `chrome://extensions` を開く
3. 右上の **「デベロッパーモード」** を ON にする
4. **「パッケージ化されていない拡張機能を読み込む」** をクリック
5. ダウンロードしたフォルダ（`manifest.json` があるフォルダ）を選択

## 使い方

1. [サポーターズチャレンジ](https://geek.supporterz.jp/apps/supporterz-challenge) にアクセス
2. 「サポーターズチャレンジをする」ボタンを押してスロットを回す
3. 結果に応じたエフェクトが自動で表示される！

## ファイル構成

```
sakura-slot-extension/
├── manifest.json   … Chrome拡張の設定ファイル
├── content.js      … エフェクト表示のメインスクリプト
└── README.md       … このファイル
```

## プライバシーポリシー

この拡張機能はユーザーのデータを一切収集・送信・保存しません。

- 個人情報の収集：なし
- 外部サーバーへの通信：なし
- Cookieの使用：なし
- 閲覧履歴の取得：なし

この拡張機能は `geek.supporterz.jp` のページ上でのみ動作し、スロット結果にアニメーションとBGMを表示する機能のみを提供します。

## 技術メモ

- **MutationObserver** で `#gacha-result-area` の子要素追加を検知
- 各エフェクトは **Canvas API** または **CSS アニメーション**で描画
- すべてのオーバーレイは `pointer-events: none` でクリック透過
