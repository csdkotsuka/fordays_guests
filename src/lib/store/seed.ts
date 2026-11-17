import type { DB } from './index';
import type { User } from '../types';

// デモ用の初期データ（Firebase 接続後は不要）
export function createSeed(newId: () => string): DB {
  const t = new Date().toISOString();
  const mk = (memberNo: string, name: string, roles: User['roles'], leaderUuid: string | null, points = 0): User => ({
    uuid: newId(),
    memberNo,
    name,
    roles,
    leaderUuid,
    calendarId: null,
    points,
    createdAt: t,
  });

  const admin = mk('9000001', '事務局', ['admin'], null);
  const top = mk('1000000', '松山 太郎', ['member', 'leader'], null, 320);
  const leader = mk('1000001', '大塚 和宏', ['member', 'leader'], top.uuid, 180);
  const m1 = mk('2000001', '山田 花子', ['member'], leader.uuid, 120);
  const m2 = mk('2000002', '佐藤 幸子', ['member'], leader.uuid, 40);
  const m3 = mk('2000003', '鈴木 一郎', ['member'], leader.uuid, 10);

  const day = (d: number, h: number) => {
    const x = new Date();
    x.setDate(x.getDate() + d);
    x.setHours(h, 0, 0, 0);
    return x.toISOString();
  };

  const ev1 = { uuid: newId(), leaderUuid: leader.uuid, title: '健康おしゃべり会', startAt: day(5, 13), place: '松山市 コミュニティセンター', note: '参加費無料・お友だち歓迎', createdAt: t };
  const ev2 = { uuid: newId(), leaderUuid: leader.uuid, title: '新製品お試し会', startAt: day(16, 10), place: 'オンライン（Zoom）', note: '', createdAt: t };

  const r1 = { uuid: newId(), referrerUuid: m1.uuid, leaderUuid: leader.uuid, name: '高橋 美代子', phone: '', memo: 'ご近所', status: 'introduced' as const, createdAt: t };
  const r2 = { uuid: newId(), referrerUuid: m1.uuid, leaderUuid: leader.uuid, name: '田中 和子', phone: '', memo: '', status: 'joined' as const, createdAt: t };

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
    version: 1,
    users: [admin, top, leader, m1, m2, m3],
    referrals: [r1, r2],
    events: [ev1, ev2],
    invitations: [
      inv(ev1.uuid, m1.uuid, 'pending'),
      inv(ev1.uuid, m2.uuid, 'yes'),
      inv(ev1.uuid, m3.uuid, 'no'),
      inv(ev2.uuid, m1.uuid, 'pending'),
    ],
  };
}
