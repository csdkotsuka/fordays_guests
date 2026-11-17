'use client';
import { CalendarDays, HeartHandshake, Users } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Avatar, PageTitle } from '@/components/ui';
import { MODE_LABEL } from '@/lib/session';
import { findUser, useDB } from '@/lib/store';

export default function Page() {
  return <AppShell mode="admin">{() => <Admin />}</AppShell>;
}

function Admin() {
  const db = useDB();
  const leaders = db.users.filter((u) => u.roles.includes('leader'));
  const members = db.users.filter((u) => u.roles.includes('member'));

  return (
    <>
      <PageTitle>事務局</PageTitle>

      <div className="mb-5 grid grid-cols-3 gap-3 text-center">
        <Box icon={<Users size={24} />} label="リーダー" value={leaders.length} />
        <Box icon={<HeartHandshake size={24} />} label="メンバー" value={members.length} />
        <Box icon={<CalendarDays size={24} />} label="イベント" value={db.events.length} />
      </div>

      <h2 className="h2 mb-3 px-1">登録一覧</h2>
      <ul className="flex flex-col gap-3">
        {db.users.map((u) => {
          const leader = findUser(db, u.leaderUuid);
          return (
            <li key={u.uuid} className="card flex items-center gap-3 !py-4">
              <Avatar name={u.name} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{u.name}</div>
                <div className="text-sm text-black/50">
                  {u.memberNo}
                  {leader ? ` ／ 担当: ${leader.name}` : ''}
                </div>
              </div>
              <div className="flex gap-1">
                {u.roles.map((r) => (
                  <span key={r} className="chip bg-black/5 !min-h-[34px] !px-3 !text-sm">
                    {MODE_LABEL[r]}
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Box({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card flex flex-col items-center gap-1 !p-4">
      <span className="accent">{icon}</span>
      <span className="text-sm font-bold text-black/55">{label}</span>
      <span className="text-[1.9rem] font-bold leading-none">{value}</span>
    </div>
  );
}
