// すべてのレコードは uuid を主キーにし、関連は uuid で紐付ける（AGENTS.md §6）

export type Role = 'member' | 'leader' | 'admin';
export type Mode = Role; // 今表示している画面

export interface User {
  uuid: string;
  memberNo: string; // 会員番号（7桁）
  name: string;
  roles: Role[];
  leaderUuid: string | null; // 担当リーダー（users.uuid）
  calendarId: string | null; // リーダーの Google カレンダー ID
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

export interface Session {
  userUuid: string;
  mode: Mode;
}
