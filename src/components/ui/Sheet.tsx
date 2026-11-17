'use client';
import { X } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDismiss } from './useDismiss';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** bottom: 下から出るシート（標準） / side: 右から出るメニュー / center: 中央ダイアログ */
  variant?: 'bottom' | 'side' | 'center';
}

/** フローティングウィンドウはすべてこれを使う（ESC・外側タップで閉じる） */
export function Sheet({ open, onClose, title, children, variant = 'bottom' }: Props) {
  useDismiss(open, onClose);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  const pos =
    variant === 'side'
      ? 'items-stretch justify-end p-3'
      : variant === 'center'
        ? 'items-center justify-center p-5'
        : 'items-end justify-center p-3 sm:items-center';
  const panel =
    variant === 'side'
      ? 'anim-side w-[min(88vw,380px)] h-full'
      : 'anim-sheet w-full max-w-[480px] max-h-[88dvh]';

  return createPortal(
    <div
      className={`anim-fade fixed inset-0 z-50 flex bg-black/25 ${pos}`}
      style={{ paddingTop: 'max(12px, var(--safe-top))', paddingBottom: 'max(12px, var(--safe-bottom))' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div role="dialog" aria-modal="true" className={`glass-strong ${panel} flex flex-col overflow-hidden rounded-[32px]`}>
        <div className="flex items-center gap-3 px-5 pb-2 pt-4">
          <div className="h2 min-w-0 flex-1 truncate">{title}</div>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="glass grid h-12 w-12 shrink-0 place-items-center rounded-full active:scale-90"
          >
            <X size={26} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
