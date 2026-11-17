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
  try {
    await setDoc(doc(fdb, colName, item.uuid), item);
  } catch {}
}

export async function removeDoc(colName: keyof Omit<DB, 'version'>, uuid: string) {
  const fdb = getDbInstance();
  if (!fdb) return;
  try {
    await deleteDoc(doc(fdb, colName, uuid));
  } catch {}
}

async function seedFirestoreBatch(fdb: Firestore, seed: DB) {
  // Firestore writeBatch は最大500件まで対応
  const ops: [string, { uuid: string }][] = [
    ...seed.users.map((u): [string, { uuid: string }] => ['users', u]),
    ...seed.referrals.map((r): [string, { uuid: string }] => ['referrals', r]),
    ...seed.events.map((e): [string, { uuid: string }] => ['events', e]),
    ...seed.invitations.map((i): [string, { uuid: string }] => ['invitations', i]),
    ...seed.messages.map((m): [string, { uuid: string }] => ['messages', m]),
  ];
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(fdb);
    for (const [col, item] of ops.slice(i, i + 400)) {
      batch.set(doc(fdb, col, item.uuid), item);
    }
    await batch.commit();
  }
}

/**
 * Firestore のリアルタイム購読を開始し、空（または旧少数シード）なら初期データを自動投入する。
 */
export function startFirestoreSync(getInitialSeed: () => DB, onRemoteChange: (partial: Partial<DB>) => void) {
  const fdb = getDbInstance();
  if (!fdb) return () => {};

  getDocs(collection(fdb, 'users'))
    .then(async (snap) => {
      // 古い「事務局」データが残っている、または最新シード（kotsuka@creativesd.net）が無い場合は全コレクションを最新シードで入れ直す
      const hasOldAdmin = snap.docs.some((d) => d.data()?.name === '事務局');
      const hasKotsuka = snap.docs.some((d) => d.data()?.email === 'kotsuka@creativesd.net');
      if (!hasOldAdmin && hasKotsuka) return;

      if (hasOldAdmin) {
        const allCols: (keyof Omit<DB, 'version'>)[] = ['users', 'referrals', 'events', 'invitations', 'messages'];
        for (const colName of allCols) {
          const s = await getDocs(collection(fdb, colName));
          for (let i = 0; i < s.docs.length; i += 400) {
            const delBatch = writeBatch(fdb);
            for (const d of s.docs.slice(i, i + 400)) delBatch.delete(d.ref);
            await delBatch.commit();
          }
        }
      }

      const seed = getInitialSeed();
      await seedFirestoreBatch(fdb, seed);
    })
    .catch(() => {});

  const cols: (keyof Omit<DB, 'version'>)[] = ['users', 'referrals', 'events', 'invitations', 'messages'];
  const unsubs = cols.map((col) =>
    onSnapshot(
      collection(fdb, col),
      (snap) => {
        if (snap.empty) return;
        const items = snap.docs.map((d) => d.data());
        onRemoteChange({ [col]: items } as Partial<DB>);
      },
      () => {},
    ),
  );

  return () => unsubs.forEach((u) => u());
}
