'use client';
// データ保存の窓口。画面からは必ずここを通す（AGENTS.md §6）。
// Firebase 設定があれば Firestore とリアルタイム同期し、未設定の間は localStorage で動作する。

import { useSyncExternalStore } from 'react';
import { isFirebaseConfigured } from '@/config/firebase';
import type { EventItem, Invitation, MessageItem, Referral, RsvpStatus, SubscriptionItem, User } from '../types';
import { putDoc, removeDoc, startFirestoreSync } from './firestoreSync';
import { SEED_VERSION, createSeed } from './seed';

export interface DB {
  version: number;
  users: User[];
  referrals: Referral[];
  events: EventItem[];
  invitations: Invitation[];
  messages: MessageItem[];
}

const KEY = 'fd-guests-db-v4';
const listeners = new Set<() => void>();
let cache: DB | null = null;
let syncStarted = false;

const now = () => new Date().toISOString();
export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

const EMPTY: DB = { version: SEED_VERSION, users: [], referrals: [], events: [], invitations: [], messages: [] };

function ensureFirestoreSync() {
  if (syncStarted || typeof window === 'undefined' || !isFirebaseConfigured) return;
  syncStarted = true;
  startFirestoreSync(
    () => load(),
    (partial) => {
      const cur = load();
      commit({ ...cur, ...partial });
    },
  );
}

function load(): DB {
  if (cache) return cache;
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as DB) : null;
    cache =
      parsed && parsed.version === SEED_VERSION && Array.isArray(parsed.messages)
        ? parsed
        : createSeed(newId);
    if (!parsed || parsed.version !== SEED_VERSION) {
      localStorage.setItem(KEY, JSON.stringify(cache));
    }
  } catch {
    cache = createSeed(newId);
  }
  ensureFirestoreSync();
  return cache;
}

function commit(next: DB) {
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  ensureFirestoreSync();
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
export const findUserByNo = (db: DB, memberNo: string) =>
  memberNo ? (db.users.find((u) => u.memberNo === memberNo) ?? null) : null;
export const findUserByEmail = (db: DB, email: string) =>
  email ? (db.users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase()) ?? null) : null;
export const membersOf = (db: DB, leaderUuid: string) =>
  db.users.filter((u) => u.leaderUuid === leaderUuid && u.roles.includes('member'));
export const referralsOf = (db: DB, memberUuid: string) => db.referrals.filter((r) => r.referrerUuid === memberUuid);
export const eventsOf = (db: DB, leaderUuid: string) =>
  db.events.filter((e) => e.leaderUuid === leaderUuid).sort((a, b) => a.startAt.localeCompare(b.startAt));
export const invitationsOfEvent = (db: DB, eventUuid: string) => db.invitations.filter((i) => i.eventUuid === eventUuid);
export const invitationsOfMember = (db: DB, memberUuid: string) =>
  db.invitations.filter((i) => i.memberUuid === memberUuid);
export const messagesBetween = (db: DB, userA: string, userB: string) =>
  (db.messages ?? [])
    .filter(
      (m) =>
        (m.leaderUuid === userA && m.memberUuid === userB) ||
        (m.leaderUuid === userB && m.memberUuid === userA),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

// ---------- 更新系（整合性チェックはここで行う） ----------
class IntegrityError extends Error {}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new IntegrityError(msg);
}

/**
 * 新規の人を紹介する。
 * 1人でも紹介したら紹介者本人に自動で 'leader' ロールが付与され、
 * ハンバーガーメニューから「リーダーの画面」へ切り替えられるようになる。
 */
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
  const updatedReferrer: User = referrer.roles.includes('leader')
    ? referrer
    : { ...referrer, roles: [...referrer.roles, 'leader'] };
  const nextUsers = db.users.map((u) => (u.uuid === referrer.uuid ? updatedReferrer : u));
  commit({ ...db, users: nextUsers, referrals: [...db.referrals, r] });
  await Promise.all([putDoc('referrals', r), putDoc('users', updatedReferrer)]);
  return r;
}

/**
 * メンバーを追加する（会員番号は空欄でも登録可）。
 */
export async function addMember(input: {
  leaderUuid: string;
  name: string;
  memberNo?: string;
  email?: string;
  avatarUrl?: string;
  subscriptions?: SubscriptionItem[];
}) {
  const db = load();
  const leader = findUser(db, input.leaderUuid);
  assert(leader && leader.roles.includes('leader'), 'リーダーが見つかりません');
  const no = (input.memberNo ?? '').trim();
  assert(no === '' || /^\d{7}$/.test(no), '会員番号は7桁の数字か空欄にしてください');
  if (no) assert(!findUserByNo(db, no), 'この会員番号は登録済みです');
  const u: User = {
    uuid: newId(),
    memberNo: no,
    name: input.name.trim(),
    email: input.email?.trim() || undefined,
    emailVerified: true,
    privacyAcceptedAt: now(),
    avatarUrl: input.avatarUrl,
    subscriptions: input.subscriptions ?? [],
    roles: ['member'],
    leaderUuid: leader.uuid,
    calendarId: null,
    points: 0,
    createdAt: now(),
  };
  commit({ ...db, users: [...db.users, u] });
  await putDoc('users', u);
  return u;
}

/**
 * 新規アカウント登録（個人情報保護同意＋メール認証フロー）
 */
export async function registerMemberAccount(input: {
  name: string;
  email: string;
  password?: string;
  memberNo?: string;
  leaderUuid?: string | null;
}) {
  const db = load();
  const email = input.email.trim().toLowerCase();
  assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), '正しいメールアドレスを入力してください');
  assert(!findUserByEmail(db, email), 'このメールアドレスは既に登録されています');
  const no = (input.memberNo ?? '').trim();
  assert(no === '' || /^\d{7}$/.test(no), '会員番号は7桁の数字か空欄にしてください');
  if (no) assert(!findUserByNo(db, no), 'この会員番号は既に登録されています');
  const leader = input.leaderUuid ? findUser(db, input.leaderUuid) : null;
  if (input.leaderUuid) {
    assert(leader && leader.roles.includes('leader'), '担当リーダーが見つかりません');
  }

  const t = now();
  const u: User = {
    uuid: newId(),
    memberNo: no,
    name: input.name.trim(),
    email,
    emailVerified: false, // メール内の確認リンク承認後に true になる
    password: input.password,
    privacyAcceptedAt: t,
    subscriptions: [],
    roles: ['member'],
    leaderUuid: leader ? leader.uuid : null,
    calendarId: null,
    points: 0,
    createdAt: t,
  };
  commit({ ...db, users: [...db.users, u] });
  await putDoc('users', u);
  return u;
}

export async function markEmailVerified(userUuid: string) {
  const db = load();
  const cur = findUser(db, userUuid);
  assert(cur, 'ユーザーが見つかりません');
  const next: User = { ...cur, emailVerified: true };
  commit({ ...db, users: db.users.map((u) => (u.uuid === userUuid ? next : u)) });
  await putDoc('users', next);
  return next;
}

export async function updateUser(
  uuid: string,
  patch: Partial<Pick<User, 'name' | 'calendarId' | 'phone' | 'avatarUrl' | 'subscriptions' | 'emailVerified' | 'password'>>,
) {
  const db = load();
  const cur = findUser(db, uuid);
  assert(cur, 'ユーザーが見つかりません');
  const next = { ...cur, ...patch };
  commit({ ...db, users: db.users.map((u) => (u.uuid === uuid ? next : u)) });
  await putDoc('users', next);
}

export async function changeUserPassword(uuid: string, currentPassword: string, newPassword: string) {
  const db = load();
  const cur = findUser(db, uuid);
  assert(cur, 'ユーザーが見つかりません');
  if (cur.password && cur.password !== currentPassword) {
    throw new IntegrityError('現在のパスワードが正しくありません');
  }
  assert(newPassword.length >= 6, '新しいパスワードは6文字以上にしてください');
  const next = { ...cur, password: newPassword };
  commit({ ...db, users: db.users.map((u) => (u.uuid === uuid ? next : u)) });
  await putDoc('users', next);
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
    await putDoc('events', next);
    return next;
  }
  const ev: EventItem = { ...input, uuid: newId(), createdAt: now() };
  commit({ ...db, events: [...db.events, ev] });
  await putDoc('events', ev);
  return ev;
}

export async function deleteEvent(leaderUuid: string, eventUuid: string) {
  const db = load();
  const ev = db.events.find((e) => e.uuid === eventUuid);
  assert(ev && ev.leaderUuid === leaderUuid, 'このイベントは削除できません');
  const targetInvs = db.invitations.filter((i) => i.eventUuid === eventUuid);
  commit({
    ...db,
    events: db.events.filter((e) => e.uuid !== eventUuid),
    invitations: db.invitations.filter((i) => i.eventUuid !== eventUuid),
  });
  await Promise.all([removeDoc('events', eventUuid), ...targetInvs.map((i) => removeDoc('invitations', i.uuid))]);
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
  await Promise.all(added.map((a) => putDoc('invitations', a)));
  return added.length;
}

export async function removeInvitation(leaderUuid: string, invitationUuid: string) {
  const db = load();
  const inv = db.invitations.find((i) => i.uuid === invitationUuid);
  assert(inv && inv.leaderUuid === leaderUuid, '削除できません');
  commit({ ...db, invitations: db.invitations.filter((i) => i.uuid !== invitationUuid) });
  await removeDoc('invitations', invitationUuid);
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
  await putDoc('invitations', next);
}

/**
 * LINE の案内リンクから開いた人が名前を選ぶ／入力するだけで出欠返答できるようにする。
 */
export async function respondByGuestName(
  eventUuid: string,
  name: string,
  status: Exclude<RsvpStatus, 'pending'>,
) {
  const db = load();
  const ev = db.events.find((e) => e.uuid === eventUuid);
  assert(ev, 'イベントが見つかりません');
  const trimmed = name.trim();
  assert(trimmed, 'お名前を入力してください');

  let member = db.users.find((u) => u.leaderUuid === ev.leaderUuid && u.name === trimmed) ?? null;
  let users = db.users;
  let createdMember = false;
  if (!member) {
    member = {
      uuid: newId(),
      memberNo: '',
      name: trimmed,
      roles: ['member'],
      leaderUuid: ev.leaderUuid,
      calendarId: null,
      points: 0,
      createdAt: now(),
    };
    users = [...db.users, member];
    createdMember = true;
  }

  const existing = db.invitations.find((i) => i.eventUuid === ev.uuid && i.memberUuid === member.uuid);
  const t = now();
  const targetInv: Invitation = existing
    ? { ...existing, status, respondedAt: t }
    : {
        uuid: newId(),
        eventUuid: ev.uuid,
        leaderUuid: ev.leaderUuid,
        memberUuid: member.uuid,
        status,
        companionUuids: [],
        respondedAt: t,
        remindedAt: null,
        createdAt: t,
      };
  const invitations = existing
    ? db.invitations.map((i) => (i.uuid === existing.uuid ? targetInv : i))
    : [...db.invitations, targetInv];

  commit({ ...db, users, invitations });
  await Promise.all([createdMember ? putDoc('users', member) : Promise.resolve(), putDoc('invitations', targetInv)]);
  return member;
}

/** 未返答者へのリマインド */
export async function remindPending(leaderUuid: string, eventUuid: string) {
  const db = load();
  const ev = db.events.find((e) => e.uuid === eventUuid);
  assert(ev && ev.leaderUuid === leaderUuid, 'このイベントは操作できません');
  const t = now();
  const updated: Invitation[] = [];
  const invitations = db.invitations.map((i) => {
    if (i.eventUuid === eventUuid && i.status === 'pending') {
      const next = { ...i, remindedAt: t };
      updated.push(next);
      return next;
    }
    return i;
  });
  commit({ ...db, invitations });
  await Promise.all(updated.map((u) => putDoc('invitations', u)));
  return updated.length;
}

/** LINE風メッセージ送信（Firebase Firestore にも保存） */
export async function sendChatMessage(input: {
  leaderUuid: string;
  memberUuid: string;
  senderUuid: string;
  text: string;
}) {
  const db = load();
  const trimmed = input.text.trim();
  assert(trimmed, 'メッセージを入力してください');
  assert(
    input.senderUuid === input.leaderUuid || input.senderUuid === input.memberUuid,
    '送信者が正しくありません',
  );
  const msg: MessageItem = {
    uuid: newId(),
    leaderUuid: input.leaderUuid,
    memberUuid: input.memberUuid,
    senderUuid: input.senderUuid,
    text: trimmed,
    createdAt: now(),
  };
  commit({ ...db, messages: [...(db.messages ?? []), msg] });
  await putDoc('messages', msg);
  return msg;
}
