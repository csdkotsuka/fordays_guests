'use client';
// データ保存の窓口。画面からは必ずここを通す（AGENTS.md §6）。
// 現在は localStorage 実装。Firebase の設定が揃ったら、この中身だけを Firestore 実装に差し替える。

import { useSyncExternalStore } from 'react';
import type { EventItem, Invitation, Referral, RsvpStatus, User } from '../types';
import { createSeed } from './seed';

export interface DB {
  version: number;
  users: User[];
  referrals: Referral[];
  events: EventItem[];
  invitations: Invitation[];
}

const KEY = 'fd-guests-db-v1';
const listeners = new Set<() => void>();
let cache: DB | null = null;

const now = () => new Date().toISOString();
export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

const EMPTY: DB = { version: 1, users: [], referrals: [], events: [], invitations: [] };

function load(): DB {
  if (cache) return cache;
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as DB) : createSeed(newId);
    if (!raw) localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    cache = createSeed(newId);
  }
  return cache;
}

function commit(next: DB) {
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', onStorage);
  };
}

/** DB 全体を購読する React フック */
export function useDB(): DB {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

export function getDB(): DB {
  return load();
}

export function resetDemoData() {
  commit(createSeed(newId));
}

// ---------- 参照系 ----------
export const findUser = (db: DB, uuid: string | null | undefined) => db.users.find((u) => u.uuid === uuid) ?? null;
export const findUserByNo = (db: DB, memberNo: string) => db.users.find((u) => u.memberNo === memberNo) ?? null;
export const membersOf = (db: DB, leaderUuid: string) =>
  db.users.filter((u) => u.leaderUuid === leaderUuid && u.roles.includes('member'));
export const referralsOf = (db: DB, memberUuid: string) => db.referrals.filter((r) => r.referrerUuid === memberUuid);
export const eventsOf = (db: DB, leaderUuid: string) =>
  db.events.filter((e) => e.leaderUuid === leaderUuid).sort((a, b) => a.startAt.localeCompare(b.startAt));
export const invitationsOfEvent = (db: DB, eventUuid: string) => db.invitations.filter((i) => i.eventUuid === eventUuid);
export const invitationsOfMember = (db: DB, memberUuid: string) =>
  db.invitations.filter((i) => i.memberUuid === memberUuid);

// ---------- 更新系（整合性チェックはここで行う） ----------
class IntegrityError extends Error {}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new IntegrityError(msg);
}

export async function addReferral(input: { referrerUuid: string; name: string; phone?: string; memo?: string }) {
  const db = load();
  const referrer = findUser(db, input.referrerUuid);
  assert(referrer, '紹介者が見つかりません');
  const r: Referral = {
    uuid: newId(),
    referrerUuid: referrer.uuid,
    leaderUuid: referrer.leaderUuid,
    name: input.name.trim(),
    phone: input.phone?.trim() ?? '',
    memo: input.memo?.trim() ?? '',
    status: 'introduced',
    createdAt: now(),
  };
  commit({ ...db, referrals: [...db.referrals, r] });
  return r;
}

export async function addMember(input: { leaderUuid: string; name: string; memberNo: string }) {
  const db = load();
  const leader = findUser(db, input.leaderUuid);
  assert(leader && leader.roles.includes('leader'), 'リーダーが見つかりません');
  assert(/^\d{7}$/.test(input.memberNo), '会員番号は7桁');
  assert(!findUserByNo(db, input.memberNo), 'この会員番号は登録済みです');
  const u: User = {
    uuid: newId(),
    memberNo: input.memberNo,
    name: input.name.trim(),
    roles: ['member'],
    leaderUuid: leader.uuid,
    calendarId: null,
    points: 0,
    createdAt: now(),
  };
  commit({ ...db, users: [...db.users, u] });
  return u;
}

export async function updateUser(uuid: string, patch: Partial<Pick<User, 'name' | 'calendarId'>>) {
  const db = load();
  assert(findUser(db, uuid), 'ユーザーが見つかりません');
  commit({ ...db, users: db.users.map((u) => (u.uuid === uuid ? { ...u, ...patch } : u)) });
}

export async function saveEvent(input: Omit<EventItem, 'uuid' | 'createdAt'> & { uuid?: string }) {
  const db = load();
  const leader = findUser(db, input.leaderUuid);
  assert(leader && leader.roles.includes('leader'), 'リーダーが見つかりません');
  if (input.uuid) {
    const cur = db.events.find((e) => e.uuid === input.uuid);
    assert(cur && cur.leaderUuid === leader.uuid, 'このイベントは編集できません');
    const next = { ...cur, ...input, uuid: cur.uuid, leaderUuid: cur.leaderUuid };
    commit({ ...db, events: db.events.map((e) => (e.uuid === cur.uuid ? next : e)) });
    return next;
  }
  const ev: EventItem = { ...input, uuid: newId(), createdAt: now() };
  commit({ ...db, events: [...db.events, ev] });
  return ev;
}

export async function deleteEvent(leaderUuid: string, eventUuid: string) {
  const db = load();
  const ev = db.events.find((e) => e.uuid === eventUuid);
  assert(ev && ev.leaderUuid === leaderUuid, 'このイベントは削除できません');
  commit({
    ...db,
    events: db.events.filter((e) => e.uuid !== eventUuid),
    invitations: db.invitations.filter((i) => i.eventUuid !== eventUuid),
  });
}

/** 招待を追加：イベントのリーダー配下のメンバーだけ招待できる */
export async function inviteMembers(leaderUuid: string, eventUuid: string, memberUuids: string[]) {
  const db = load();
  const ev = db.events.find((e) => e.uuid === eventUuid);
  assert(ev && ev.leaderUuid === leaderUuid, 'このイベントには招待できません');
  const already = new Set(invitationsOfEvent(db, eventUuid).map((i) => i.memberUuid));
  const added: Invitation[] = [];
  for (const mu of memberUuids) {
    const m = findUser(db, mu);
    assert(m && m.leaderUuid === leaderUuid, '担当外のメンバーは招待できません');
    if (already.has(mu)) continue;
    added.push({
      uuid: newId(),
      eventUuid,
      leaderUuid,
      memberUuid: mu,
      status: 'pending',
      companionUuids: [],
      respondedAt: null,
      remindedAt: null,
      createdAt: now(),
    });
  }
  commit({ ...db, invitations: [...db.invitations, ...added] });
  return added.length;
}

export async function removeInvitation(leaderUuid: string, invitationUuid: string) {
  const db = load();
  const inv = db.invitations.find((i) => i.uuid === invitationUuid);
  assert(inv && inv.leaderUuid === leaderUuid, '削除できません');
  commit({ ...db, invitations: db.invitations.filter((i) => i.uuid !== invitationUuid) });
}

/** 返答：本人の招待だけ。同行者は本人が紹介した人だけ */
export async function respondInvitation(
  memberUuid: string,
  invitationUuid: string,
  status: Exclude<RsvpStatus, 'pending'>,
  companionUuids: string[],
) {
  const db = load();
  const inv = db.invitations.find((i) => i.uuid === invitationUuid);
  assert(inv && inv.memberUuid === memberUuid, 'この招待には返答できません');
  const mine = new Set(referralsOf(db, memberUuid).map((r) => r.uuid));
  assert(companionUuids.every((c) => mine.has(c)), '同行者が正しくありません');
  const next: Invitation = {
    ...inv,
    status,
    companionUuids: status === 'yes' ? companionUuids : [],
    respondedAt: now(),
  };
  commit({ ...db, invitations: db.invitations.map((i) => (i.uuid === inv.uuid ? next : i)) });
}

/** 未返答者へのリマインド（現在は記録のみ。プッシュ送信は後日サーバー側で実装） */
export async function remindPending(leaderUuid: string, eventUuid: string) {
  const db = load();
  const ev = db.events.find((e) => e.uuid === eventUuid);
  assert(ev && ev.leaderUuid === leaderUuid, 'このイベントは操作できません');
  const t = now();
  let count = 0;
  const invitations = db.invitations.map((i) => {
    if (i.eventUuid === eventUuid && i.status === 'pending') {
      count++;
      return { ...i, remindedAt: t };
    }
    return i;
  });
  commit({ ...db, invitations });
  return count;
}
