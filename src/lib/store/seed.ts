import type { DB } from './index';
import type { User } from '../types';

export const SEED_VERSION = 2;

// デモ用の初期データ（Firebase 接続後は Firestore 側へ初期投入）
export function createSeed(newId: () => string): DB {
  const t = new Date().toISOString();
  const mk = (
    memberNo: string,
    name: string,
    roles: User['roles'],
    leaderUuid: string | null,
    points = 0,
    phone = '',
  ): User => ({
    uuid: newId(),
    memberNo,
    name,
    phone,
    roles,
    leaderUuid,
    calendarId: null,
    points,
    createdAt: t,
  });

  const admin = mk('9000001', '事務局', ['admin'], null);
  const top = mk('1000000', '松山 太郎', ['member', 'leader'], null, 320, '089-000-0000');
  const leader = mk('1000001', '大塚 和宏', ['member', 'leader'], top.uuid, 180, '090-7549-8574');
  // 山田さんはすでにお友だちを紹介しているため、自動でリーダー画面も使える状態
  const m1 = mk('2000001', '山田 花子', ['member', 'leader'], leader.uuid, 120);
  const m2 = mk('2000002', '佐藤 幸子', ['member'], leader.uuid, 40);
  const m3 = mk('2000003', '鈴木 一郎', ['member'], leader.uuid, 10);

  const day = (d: number, h: number, m = 0) => {
    const x = new Date();
    x.setDate(x.getDate() + d);
    x.setHours(h, m, 0, 0);
    return x.toISOString();
  };

  const ev1 = {
    uuid: newId(),
    leaderUuid: leader.uuid,
    title: '核酸のおはなし＆季節のお茶会☕️',
    startAt: day(4, 13, 30),
    place: '松山市 コミュニティセンター 和室',
    note: '「核酸ってそもそも何？」を楽しくおしゃべりしながら、季節のお茶とお菓子でほっと一息つきましょう🍵 はじめての方も手ぶらでどうぞ！',
    createdAt: t,
  };
  const ev2 = {
    uuid: newId(),
    leaderUuid: leader.uuid,
    title: '100歳まで歩ける！らくらく体操＆ストレッチ🤸‍♀️',
    startAt: day(9, 10, 0),
    place: '松山市 総合福祉センター 軽運動室',
    note: '椅子に座ったままでもできるやさしい運動です。みんなで体をほぐしたあとは、冷たい核酸ドリンクで乾杯しましょう✨ 動きやすい服装でお越しください。',
    createdAt: t,
  };
  const ev3 = {
    uuid: newId(),
    leaderUuid: leader.uuid,
    title: '核酸コラーゲン入り♪ かんたん美肌お菓子作り🍮',
    startAt: day(15, 14, 0),
    place: '大塚サロン（松山市西石井）',
    note: '混ぜて冷やすだけ！罪悪感なしのぷるぷる美肌スイーツをみんなで作って試食します🍓 エプロンだけお持ちください。お友だちとの参加も大歓迎！',
    createdAt: t,
  };
  const ev4 = {
    uuid: newId(),
    leaderUuid: leader.uuid,
    title: 'おうちで参加OK！夜のゆるっとおしゃべり会🌙',
    startAt: day(21, 20, 0),
    place: 'オンライン（LINE通話 / Zoom）',
    note: 'ご自宅からパジャマのままでも参加OK！最近の体調の変化や、おすすめの飲み方・アレンジを気軽におしゃべりしましょう😊',
    createdAt: t,
  };

  const r1 = {
    uuid: newId(),
    referrerUuid: m1.uuid,
    leaderUuid: leader.uuid,
    name: '高橋 美代子',
    phone: '',
    memo: 'ご近所のお茶友だち',
    status: 'introduced' as const,
    createdAt: t,
  };
  const r2 = {
    uuid: newId(),
    referrerUuid: m1.uuid,
    leaderUuid: leader.uuid,
    name: '田中 和子',
    phone: '',
    memo: '体操教室のお仲間',
    status: 'joined' as const,
    createdAt: t,
  };

  const inv = (eventUuid: string, memberUuid: string, status: 'pending' | 'yes' | 'no', companionUuids: string[] = []) => ({
    uuid: newId(),
    eventUuid,
    leaderUuid: leader.uuid,
    memberUuid,
    status,
    companionUuids,
    respondedAt: status === 'pending' ? null : t,
    remindedAt: null,
    createdAt: t,
  });

  return {
    version: SEED_VERSION,
    users: [admin, top, leader, m1, m2, m3],
    referrals: [r1, r2],
    events: [ev1, ev2, ev3, ev4],
    invitations: [
      inv(ev1.uuid, m1.uuid, 'pending'),
      inv(ev1.uuid, m2.uuid, 'yes'),
      inv(ev1.uuid, m3.uuid, 'no'),
      inv(ev2.uuid, m1.uuid, 'yes', [r2.uuid]),
      inv(ev2.uuid, m2.uuid, 'pending'),
      inv(ev3.uuid, m1.uuid, 'pending'),
      inv(ev3.uuid, m2.uuid, 'pending'),
      inv(ev4.uuid, m1.uuid, 'pending'),
    ],
  };
}
