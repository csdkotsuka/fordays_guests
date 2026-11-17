'use client';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';

/** 大きなタイル型のリンク（ホーム画面用） */
export function Tile({
  href,
  icon: Icon,
  label,
  badge,
  external,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number | string;
  external?: boolean;
}) {
  const inner = (
    <>
      <span className="bg-accent-soft accent grid h-14 w-14 place-items-center rounded-2xl">
        <Icon size={30} strokeWidth={2.2} />
      </span>
      <span className="text-[1.1rem] font-bold leading-tight">{label}</span>
      {badge ? (
        <span className="bg-accent absolute right-3 top-3 grid min-h-8 min-w-8 place-items-center rounded-full px-2 text-base font-bold text-white">
          {badge}
        </span>
      ) : null}
    </>
  );
  const cls = 'card relative flex min-h-[140px] flex-col items-start justify-between gap-3 active:scale-[0.97] transition';
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

/** 一覧の1行 */
export function Row({
  onClick,
  href,
  left,
  title,
  sub,
  right,
}: {
  onClick?: () => void;
  href?: string;
  left?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}) {
  const body = (
    <>
      {left}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[1.15rem] font-bold">{title}</span>
        {sub ? <span className="block truncate text-base text-black/55">{sub}</span> : null}
      </span>
      {right ?? <ChevronRight className="shrink-0 text-black/30" size={26} />}
    </>
  );
  const cls = 'card flex w-full items-center gap-4 text-left active:scale-[0.98] transition min-h-[80px] !py-4';
  if (href)
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  return (
    <button onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

/** 顔写真対応の丸アイコン */
export function Avatar({
  name,
  src,
  size = 'md',
}: {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim = size === 'lg' ? 'h-20 w-20 text-2xl' : size === 'sm' ? 'h-10 w-10 text-base' : 'h-13 w-13 text-lg';
  const px = size === 'lg' ? 80 : size === 'sm' ? 40 : 52;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={px}
        height={px}
        style={{ width: px, height: px }}
        className="shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
      />
    );
  }
  return (
    <span
      style={{ width: px, height: px }}
      className={`bg-accent-soft accent grid shrink-0 place-items-center rounded-full border-2 border-white font-bold shadow-sm ${dim}`}
    >
      {name.slice(0, 1)}
    </span>
  );
}

/** 画像ファイルを正方形（160×160）の Data URL に縮小変換する */
export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('画像の変換に失敗しました'));
      img.onload = () => {
        const size = 160;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(String(reader.result));
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function PageTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 mt-1 flex items-center gap-3">
      <h1 className="h1 flex-1">{children}</h1>
      {right}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="glass mb-4 flex rounded-full p-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-[52px] flex-1 rounded-full text-[1.05rem] font-bold transition ${
            value === o.value ? 'bg-white text-[var(--accent-deep)] shadow-md' : 'text-black/55'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="card flex flex-col items-center gap-3 py-10 text-black/40">
      <Icon size={44} />
      <span className="text-lg font-bold">{label}</span>
    </div>
  );
}

// ---------- トースト ----------
const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 2200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg ? (
        <div
          className="anim-sheet pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-6"
          style={{ bottom: 'calc(24px + var(--safe-bottom))' }}
        >
          <div className="rounded-full bg-[#231815]/90 px-6 py-4 text-lg font-bold text-white shadow-xl backdrop-blur">
            {msg}
          </div>
        </div>
      ) : null}
    </ToastCtx.Provider>
  );
}
