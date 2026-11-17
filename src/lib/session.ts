'use client';
// ログイン状態（ダミー）。Firebase Auth 導入後はここを差し替える。

import { useSyncExternalStore } from 'react';
import type { Mode, Session } from './types';

const KEY = 'fd-guests-session';
const listeners = new Set<() => void>();
let cache: Session | null | undefined;

function read(): Session | null {
  if (cache !== undefined) return cache;
  if (typeof window === 'undefined') return null;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    cache = null;
  }
  return cache ?? null;
}

function write(s: Session | null) {
  cache = s;
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export function useSession() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => null,
  );
}

export const signIn = (userUuid: string, mode: Mode) => write({ userUuid, mode });
export const setMode = (mode: Mode) => {
  const s = read();
  if (s) write({ ...s, mode });
};
export const signOut = () => write(null);

export const HOME: Record<Mode, string> = { member: '/m/', leader: '/l/', admin: '/admin/' };
export const MODE_LABEL: Record<Mode, string> = { member: 'メンバー', leader: 'リーダー', admin: '事務局' };
