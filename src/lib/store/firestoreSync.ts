'use client';
import { getApps, initializeApp } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from '@/config/firebase';
import type { DB } from './index';

let firestoreInstance: Firestore | null = null;

export function getDbInstance(): Firestore | null {
  if (!isFirebaseConfigured || typeof window === 'undefined') return null;
  if (!firestoreInstance) {
    const app = getApps()[0] ?? initializeApp(firebaseConfig);
    firestoreInstance = getFirestore(app);
  }
  return firestoreInstance;
}

export async function putDoc<T extends { uuid: string }>(colName: keyof Omit<DB, 'version'>, item: T) {
  const fdb = getDbInstance();
  if (!fdb) return;
  await setDoc(doc(fdb, colName, item.uuid), item);
}

export async function removeDoc(colName: keyof Omit<DB, 'version'>, uuid: string) {
  const fdb = getDbInstance();
  if (!fdb) return;
  await deleteDoc(doc(fdb, colName, uuid));
}

/**
 * Firestore のリアルタイム購読を開始し、空なら初期データを自動投入する。
 */
export function startFirestoreSync(getInitialSeed: () => DB, onRemoteChange: (partial: Partial<DB>) => void) {
  const fdb = getDbInstance();
  if (!fdb) return () => {};

  // 初回：users コレクションが空ならシードデータを一括投入
  getDocs(collection(fdb, 'users'))
    .then(async (snap) => {
      if (!snap.empty) return;
      const seed = getInitialSeed();
      const batch = writeBatch(fdb);
      for (const u of seed.users) batch.set(doc(fdb, 'users', u.uuid), u);
      for (const r of seed.referrals) batch.set(doc(fdb, 'referrals', r.uuid), r);
      for (const e of seed.events) batch.set(doc(fdb, 'events', e.uuid), e);
      for (const i of seed.invitations) batch.set(doc(fdb, 'invitations', i.uuid), i);
      await batch.commit();
    })
    .catch(() => {});

  const cols: (keyof Omit<DB, 'version'>)[] = ['users', 'referrals', 'events', 'invitations'];
  const unsubs = cols.map((col) =>
    onSnapshot(collection(fdb, col), (snap) => {
      if (snap.empty && col === 'users') return;
      const items = snap.docs.map((d) => d.data());
      onRemoteChange({ [col]: items } as Partial<DB>);
    }),
  );

  return () => unsubs.forEach((u) => u());
}
