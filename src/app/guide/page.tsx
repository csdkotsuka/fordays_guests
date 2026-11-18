'use client';
import { BookOpen } from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { PageTitle, Segmented } from '@/components/ui';
import { Sheet } from '@/components/ui/Sheet';
import type { Mode } from '@/lib/types';

interface StepItem {
  title: string;
  image: string;
  points: string[];
}

const MEMBER_STEPS: StepItem[] = [
  {
    title: '1. ホーム画面',
    image: '/guide/member-home.png',
    points: ['毎月17日の締め切りまでの日数を確認', '赤いボタンからイベントへお返事', '担当リーダーへLINE・電話で連絡'],
  },
  {
    title: '2. イベント確認・お返事',
    image: '/guide/member-events.png',
    points: ['日付をタップすると下の予定へ移動', '「参加」「不参加」を1タップで返答', '一緒に行くお友だちも選べます'],
  },
  {
    title: '3. お友だち紹介',
    image: '/guide/member-refer.png',
    points: ['「紹介する」からお名前を登録', '紹介するとリーダー画面も使えます'],
  },
  {
    title: '4. メッセージ・電話',
    image: '/guide/messages.png',
    points: ['担当リーダーとLINE風にやりとり', '右上の「電話」ボタンからすぐ発信'],
  },
];

const LEADER_STEPS: StepItem[] = [
  {
    title: '1. イベント管理・LINE案内',
    image: '/guide/leader-events.png',
    points: ['「新しいイベント」で予定を作成', '詳細画面からLINE案内文をコピー', '未返答のメンバーへ通知を送信'],
  },
  {
    title: '2. メンバー管理・招待リンク',
    image: '/guide/leader-members.png',
    points: ['「招待リンク」をLINEで送って新規登録', '名前をタップで定期契約・参加履歴を確認'],
  },
  {
    title: '3. メッセージ・電話',
    image: '/guide/messages.png',
    points: ['メンバーと個別にやりとり', '未読があると赤い数字バッジでお知らせ'],
  },
];

export default function Page() {
  return <AppShell>{({ mode }) => <Guide initialMode={mode} />}</AppShell>;
}

function Guide({ initialMode }: { initialMode: Mode }) {
  const [tab, setTab] = useState<'member' | 'leader'>(initialMode === 'leader' ? 'leader' : 'member');
  const [zoom, setZoom] = useState<StepItem | null>(null);
  const steps = tab === 'leader' ? LEADER_STEPS : MEMBER_STEPS;

  return (
    <>
      <PageTitle
        right={
          <span className="bg-accent-soft accent grid h-11 w-11 place-items-center rounded-full">
            <BookOpen size={22} />
          </span>
        }
      >
        使い方
      </PageTitle>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'member', label: 'メンバー用' },
          { value: 'leader', label: 'リーダー用' },
        ]}
      />

      <div className="flex flex-col gap-4">
        {steps.map((s) => (
          <section key={s.title} className="card flex flex-col gap-3">
            <h2 className="h2">{s.title}</h2>
            <div className="flex items-start gap-3.5">
              <button
                type="button"
                onClick={() => setZoom(s)}
                aria-label={`${s.title}を拡大`}
                className="w-[126px] shrink-0 overflow-hidden rounded-[20px] border-2 border-white bg-white shadow-md transition active:scale-95"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt={s.title} className="h-auto w-full object-cover" />
              </button>
              <ul className="flex flex-1 flex-col gap-2 pt-1 text-base font-bold leading-snug text-black/80">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-1.5">
                    <span className="accent shrink-0">●</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      <Sheet open={!!zoom} onClose={() => setZoom(null)} title={zoom?.title}>
        {zoom && (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoom.image}
              alt={zoom.title}
              className="w-full max-w-[300px] rounded-[24px] border-2 border-white shadow-lg"
            />
          </div>
        )}
      </Sheet>
    </>
  );
}
