'use client';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { CopyBox } from '@/components/CopyBox';
import { PageTitle } from '@/components/ui';
import { fmtDate, nextDeadline } from '@/lib/date';
import { eventLineText } from '@/lib/lineText';
import { eventsOf, useDB } from '@/lib/store';
import type { User } from '@/lib/types';

export default function Page() {
  return <AppShell mode="leader">{({ user }) => <Announce user={user} />}</AppShell>;
}

function Announce({ user }: { user: User }) {
  const db = useDB();
  const events = eventsOf(db, user.uuid);
  const deadline = fmtDate(nextDeadline());

  const deadlineTemplate = [
    'いつもありがとうございます😊',
    '',
    `今月の定期購入の変更締め切りは【${deadline}】です。`,
    '変更や休止をご希望の方は、締め切り前にお手続きください。',
    '',
    '分からないことがあればいつでもご連絡ください。',
    user.name,
  ].join('\n');

  const [text, setText] = useState(events[0] ? eventLineText(events[0], user.name) : deadlineTemplate);

  return (
    <>
      <PageTitle>LINE案内文</PageTitle>

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {events.map((ev) => (
          <button key={ev.uuid} onClick={() => setText(eventLineText(ev, user.name))} className="chip glass shrink-0">
            {ev.title}
          </button>
        ))}
        <button onClick={() => setText(deadlineTemplate)} className="chip glass shrink-0">
          締め切りのお知らせ
        </button>
      </div>

      <CopyBox initial={text} rows={11} />
    </>
  );
}
