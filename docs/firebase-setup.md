# Firebase セットアップ手順（ふたりで共有機能）

「ふたりで共有」機能を使うために、一度だけ Firebase（Google の無料サービス）のプロジェクトを作ります。
ブラウザ操作のみで、所要 10 分程度です。**費用はかかりません**（無料の Spark プランのまま使います）。

## 1. プロジェクトを作る

1. https://console.firebase.google.com を開き、Google アカウントでログイン
2. 「プロジェクトを追加」をクリック
3. プロジェクト名: `nazuke`（何でも可）
4. **Google アナリティクスは「無効」** にして作成

## 2. Web アプリを登録して設定値を取得

1. プロジェクトの概要ページで **`</>`（ウェブ）** アイコンをクリック
2. アプリのニックネーム: `nazuke`（何でも可）。「Firebase Hosting」のチェックは **不要**
3. 「アプリを登録」を押すと `const firebaseConfig = { ... }` というコードが表示される
4. その **`{ ... }` の中身を丸ごとコピー** して控える（あとで `index.html` に貼り付けます）
   - ※ この設定値（apiKey など）は秘密情報ではありません。データの保護は次のセキュリティルールが担います

## 3. 匿名認証を有効化

1. 左メニュー「構築」→「Authentication」→「始める」
2. 「ログイン方法」タブ →「匿名」を選択 → 有効にして保存

## 4. Firestore データベースを作る

1. 左メニュー「構築」→「Firestore Database」→「データベースを作成」
2. ロケーション: **asia-northeast1（東京）** ※あとから変更できないので注意
3. **「本番環境モードで開始」** を選択して作成

## 5. セキュリティルールを設定

1. Firestore の「ルール」タブを開く
2. 中身をすべて消して、下の内容を貼り付け →「公開」

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ルームID(UUID)を知っていることが実質の認可。
    // ルーム一覧の列挙と部屋の削除は禁止。
    match /rooms/{roomId} {
      allow get, create: if request.auth != null;
      allow list, delete: if false;

      match /candidates/{candidateId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

## 6. 完了

手順 2 でコピーした `firebaseConfig` の中身を開発者（Claude）に渡してください。
`index.html` の `FIREBASE_CONFIG` に設定すれば共有機能が有効になります。

## 補足

- 料金プランは **Spark（無料）のまま** にしてください。カード未登録なら、万一使いすぎても課金ではなく停止になります（このアプリの規模では無料枠の 1% も使いません）
- 共有ルームの招待リンク（`#/pair/...` の URL）は**ふたり以外に教えないでください**。リンクを知っていることが合鍵の代わりです
