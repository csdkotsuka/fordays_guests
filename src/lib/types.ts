// すべてのレコードは uuid を主キーにし、関連は uuid で紐付ける（AGENTS.md §6）

export type Role = 'member' | 'leader' | 'admin';
export type Mode = Role; // 今表示している画面

export interface SubscriptionItem {
  id: string;
  productId: string;
  productName: string;
  startMonth: string; // 'YYYY-MM'（購買開始月）
  endMonth: string | null; // null = 現在も継続中、'YYYY-MM' = 過去の契約（購買終了月）
}

export interface User {
  uuid: string;
  memberNo: string; // 会員番号（7桁。イベント案内のみの方は空文字も可）
  name: string;
  email?: string; // メールアドレス（新規登録・認証用）
  emailVerified?: boolean; // メール認証済みフラグ
  password?: string; // ログイン用パスワード（変更可能）
  privacyAcceptedAt?: string; // 個人情報保護方針の承認日時
  phone?: string; // 電話番号（メンバーからリーダーへワンタップ電話用）
  avatarUrl?: string; // 顔写真（Data URL または画像 URL）
  subscriptions?: SubscriptionItem[]; // 定期契約商品（現在＋過去）
  roles: Role[];
  leaderUuid: string | null; // 担当リーダー（users.uuid）
  calendarId: string | null;
  points: number;
  createdAt: string;
}

export type ReferralStatus = 'introduced' | 'joined' | 'registered';

export interface Referral {
  uuid: string;
  referrerUuid: string; // 紹介したメンバー（users.uuid）
  leaderUuid: string | null; // 紹介者の担当リーダー（users.uuid）
  name: string;
  phone: string;
  memo: string;
  status: ReferralStatus;
  createdAt: string;
}

export interface EventItem {
  uuid: string;
  leaderUuid: string; // 主催リーダー（users.uuid）
  title: string;
  startAt: string; // ISO
  place: string;
  mapUrl?: string; // Google マップ URL
  note: string;
  createdAt: string;
}

export type RsvpStatus = 'pending' | 'yes' | 'no';

export interface Invitation {
  uuid: string;
  eventUuid: string; // events.uuid
  leaderUuid: string; // events.leaderUuid と一致
  memberUuid: string; // users.uuid（リーダー配下）
  status: RsvpStatus;
  companionUuids: string[]; // referrals.uuid（本人が紹介した人のみ）
  respondedAt: string | null;
  remindedAt: string | null;
  createdAt: string;
}

export interface MessageItem {
  uuid: string;
  leaderUuid: string; // やりとりのリーダー（users.uuid）
  memberUuid: string; // やりとりのメンバー（users.uuid）
  senderUuid: string; // 送信者（users.uuid）
  text: string;
  createdAt: string;
}

export interface Session {
  userUuid: string;
  mode: Mode;
}
