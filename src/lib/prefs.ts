'use client';
import { useSyncExternalStore } from 'react';

// 文字の大きさ（端末ごとの表示設定なのでブラウザ保存でよい）
export type FontScale = 'normal' | 'large' | 'xlarge';
export const FONT_PX: Record<FontScale, number> = { normal: 18, large: 20, xlarge: 22 };
export const FONT_LABEL: Record<FontScale, string> = { normal: '標準', large: '大', xlarge: '特大' };

const KEY = 'fd-font-scale';
const listeners = new Set<() => void>();

const read = (): FontScale => {
  if (typeof window === 'undefined') return 'normal';
  return (localStorage.getItem(KEY) as FontScale) || 'normal';
};

export function applyFontScale(s: FontScale = read()) {
  document.documentElement.style.fontSize = `${FONT_PX[s]}px`;
}

export function setFontScale(s: FontScale) {
  localStorage.setItem(KEY, s);
  applyFontScale(s);
  listeners.forEach((l) => l());
}

export function useFontScale() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => 'normal' as FontScale,
  );
}
