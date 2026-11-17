'use client';
import { useEffect } from 'react';

/**
 * フローティングウィンドウ共通：ESC キーで閉じる（AGENTS.md §4）
 * 外側クリック／タップは Sheet のオーバーレイで処理する。
 */
export function useDismiss(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
}
