'use client';
import { Check, Copy, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { copyText, lineShareUrl } from '@/lib/lineText';
import { useToast } from './ui';

/** 入力したテキストを一括コピー／LINE で送る */
export function CopyBox({ initial, rows = 10 }: { initial: string; rows?: number }) {
  const [text, setText] = useState(initial);
  const [done, setDone] = useState(false);
  const toast = useToast();
  useEffect(() => setText(initial), [initial]);

  return (
    <div className="flex flex-col gap-3">
      <textarea className="field !text-[1.05rem] leading-relaxed" rows={rows} value={text} onChange={(e) => setText(e.target.value)} />
      <button
        className="btn-primary"
        onClick={async () => {
          if (await copyText(text)) {
            setDone(true);
            toast('コピーしました');
            window.setTimeout(() => setDone(false), 2000);
          }
        }}
      >
        {done ? <Check size={26} /> : <Copy size={26} />} {done ? 'コピーしました' : 'まとめてコピー'}
      </button>
      <a href={lineShareUrl(text)} target="_blank" rel="noopener noreferrer" className="btn text-white" style={{ background: '#06C755' }}>
        <Send size={24} /> LINEで送る
      </a>
    </div>
  );
}
