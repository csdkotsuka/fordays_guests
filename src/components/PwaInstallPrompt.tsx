'use client';
import { Download, MoreVertical, PlusSquare, Share } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Sheet } from './ui/Sheet';

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const KEY = 'fd-pwa-dismissed-at';
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000; // 「あとで」から3日間は出さない

/** スマホで開いたとき、ホーム画面への追加を促す（iPhone / Android） */
export function PwaInstallPrompt() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
  const [bip, setBip] = useState<BIPEvent | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || (!isIOS && !isAndroid)) return;
    setPlatform(isIOS ? 'ios' : 'android');

    const last = Number(localStorage.getItem(KEY) || 0);
    const snoozed = Date.now() - last < SNOOZE_MS;
    const t = window.setTimeout(() => !snoozed && setOpen(true), 1200);

    const onBip = (e: Event) => {
      e.preventDefault();
      setBip(e as BIPEvent);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('beforeinstallprompt', onBip);
    };
  }, []);

  const close = () => {
    localStorage.setItem(KEY, String(Date.now()));
    setOpen(false);
  };

  const install = async () => {
    if (!bip) return;
    await bip.prompt();
    await bip.userChoice;
    setBip(null);
    setOpen(false);
  };

  return (
    <Sheet open={open} onClose={close} variant="center" title="ホーム画面に追加">
      <div className="flex flex-col items-center gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="h-24 w-24 rounded-[26px] shadow-lg" />

        {platform === 'ios' && (
          <ol className="w-full space-y-3">
            <Step n={1} icon={<Share size={28} />} text="共有ボタンをタップ" />
            <Step n={2} icon={<PlusSquare size={28} />} text="「ホーム画面に追加」" />
            <Step n={3} icon={<span className="text-lg font-bold">追加</span>} text="右上の「追加」" />
          </ol>
        )}

        {platform === 'android' &&
          (bip ? (
            <button className="btn-primary" onClick={install}>
              <Download size={26} /> 追加する
            </button>
          ) : (
            <ol className="w-full space-y-3">
              <Step n={1} icon={<MoreVertical size={28} />} text="右上のメニュー" />
              <Step n={2} icon={<PlusSquare size={28} />} text="「ホーム画面に追加」" />
            </ol>
          ))}

        <button className="btn-glass" onClick={close}>
          あとで
        </button>
      </div>
    </Sheet>
  );
}

function Step({ n, icon, text }: { n: number; icon: React.ReactNode; text: string }) {
  return (
    <li className="glass flex min-h-[68px] items-center gap-4 rounded-3xl px-4">
      <span className="bg-accent grid h-9 w-9 shrink-0 place-items-center rounded-full font-bold text-white">{n}</span>
      <span className="accent grid h-11 w-11 place-items-center">{icon}</span>
      <span className="text-[1.1rem] font-bold">{text}</span>
    </li>
  );
}
