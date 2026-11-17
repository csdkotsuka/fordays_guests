# Firebase（Firestore）接続について

現在は一時的にブラウザ（localStorage）に保存していますが、画面側のコードはすべて `src/lib/store/index.ts` を通す形になっているため、**以下の情報をいただければ、画面を作り直さずにそのまま Firestore 保存へ切り替えられます。**

---

## 1. いただきたい情報（Firebase 側）

Firebase コンソール（ https://console.firebase.google.com/ ）でプロジェクトを1つ作成し、以下を教えてください。

1. **ウェブアプリの設定値（`firebaseConfig`）**
   - プロジェクト設定 → 全般 → マイアプリ → ウェブ（`</>`）を追加すると表示される以下の6項目：
     - `apiKey`
     - `authDomain`
     - `projectId`
     - `storageBucket`
     - `messagingSenderId`
     - `appId`
2. **Cloud Firestore の有効化**
   - 左メニュー「構築 → Firestore Database」→「データベースの作成」→ ロケーション **`asia-northeast1`（東京）** を選択。
3. **Authentication（認証）の有効化**
   - 左メニュー「構築 → Authentication」→「始める」→「メール / パスワード」を有効化
     （会員番号7桁 `1234567` を内部的に `1234567@members.fordays.local` のような形式にして扱います。Passkey は WebAuthn で検証し、カスタムトークンを発行します）。
4. **Web Push 通知用の鍵（VAPID キー）**（通知をサーバーから自動送信する場合）
   - プロジェクト設定 → Cloud Messaging → ウェブ構成 →「鍵ペアを生成」で出る公開鍵。

> ご希望であれば、こちらから Firebase CLI でプロジェクト作成〜設定まで行うこともできます（その場合は Google アカウントでの CLI ログインだけお願いします）。

---

## 2. Firestore のテーブル（コレクション）構成と UUID 紐付け

名前や会員番号では一切紐付けず、**すべてドキュメントID（`uuid`）で紐付け**ます。

```
users/{userUuid}
  ├─ uuid: string              // 主キー（ドキュメントIDと同じ）
  ├─ memberNo: string          // 7桁の会員番号（ログイン検索用・一意）
  ├─ name: string
  ├─ roles: ('member'|'leader'|'admin')[]
  ├─ leaderUuid: string | null // 担当リーダーの users.uuid
  ├─ calendarId: string | null // Google カレンダー ID
  ├─ points: number
  └─ createdAt: timestamp

referrals/{referralUuid}
  ├─ uuid: string
  ├─ referrerUuid: string      // 紹介したメンバーの users.uuid
  ├─ leaderUuid: string | null // そのメンバーの担当リーダーの users.uuid
  ├─ name: string
  ├─ phone: string
  ├─ memo: string
  ├─ status: 'introduced' | 'joined' | 'registered'
  └─ createdAt: timestamp

events/{eventUuid}
  ├─ uuid: string
  ├─ leaderUuid: string        // 主催リーダーの users.uuid
  ├─ title: string
  ├─ startAt: timestamp
  ├─ place: string
  ├─ note: string
  └─ createdAt: timestamp

invitations/{invitationUuid}
  ├─ uuid: string
  ├─ eventUuid: string         // events.uuid
  ├─ leaderUuid: string        // events.leaderUuid と必ず一致
  ├─ memberUuid: string        // 招待されたメンバーの users.uuid（leaderUuid 配下のみ）
  ├─ status: 'pending' | 'yes' | 'no'
  ├─ companionUuids: string[]  // 同行する referrals.uuid（memberUuid 本人が紹介した人のみ）
  ├─ respondedAt: timestamp | null
  ├─ remindedAt: timestamp | null
  └─ createdAt: timestamp
```

### 誤った紐付けを防ぐ二重チェック
1. **アプリ側（`src/lib/store/index.ts`）**（実装済み）
   - イベントへの招待は、そのイベントの `leaderUuid` 配下のメンバー（`user.leaderUuid === event.leaderUuid`）だけ許可。
   - イベントの同行者は、返答する本人（`memberUuid`）が紹介した人（`referral.referrerUuid === memberUuid`）だけ許可。
2. **Firestore セキュリティルール側**（Firebase 接続時に設定）
   - 同じ条件を Firestore Rules にも書き、リーダーが他のリーダーのメンバーを読み書きできないようサーバー側でもブロックします。
