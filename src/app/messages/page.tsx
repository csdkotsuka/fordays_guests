'use client';
import { ChevronLeft, MessageCircle, Send, Smile } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Avatar, Empty, PageTitle, Row } from '@/components/ui';
import { fmtDate, fmtTime } from '@/lib/date';
import { findUser, membersOf, messagesBetween, sendChatMessage, useDB } from '@/lib/store';
import type { User } from '@/lib/types';

// iPhone 標準に近いカテゴリ別絵文字セット
const EMOJI_CATS: { label: string; items: string[] }[] = [
  {
    label: 'よく使う',
    items: [
      '😊', '😄', '😁', '😆', '🥹', '🥰', '😍', '🤗', '🤭', '😉', '😌', '🙏',
      '👍', '👏', '🙌', '🤝', '💪', '✨', '🌸', '🌷', '☕️', '🍵', '🎉', '❤️',
    ],
  },
  {
    label: '表情・あいさつ',
    items: [
      '😀', '😃', '😂', '🤣', '😇', '🙂', '😋', '😛', '😜', '🤔', '😴', '😮',
      '😲', '😳', '🥺', '😢', '😭', '😓', '😣', '🙇‍♀️', '🙇‍♂️', '🙋‍♀️', '🙋‍♂️', '👋',
      '👌', '✌️', '🤞', '🤟', '🫶', '🫡', '🥳', '🤩',
    ],
  },
  {
    label: '食べ物・イベント',
    items: [
      '🍮', '🍰', '🧁', '🍩', '🍪', '🍓', '🍑', '🍊', '🍎', '🥗', '🍙', '🍱',
      '🫖', '🥛', '🥂', '🍻', '🎁', '🎈', '🎊', '🎵', '🎶', '🤸‍♀️', '🧘', '🚶‍♀️',
      '📅', '📍', '🗺️', '📞', '💌', '📝', '🏠', '🌙',
    ],
  },
  {
    label: 'ハート・季節',
    items: [
      '🩷', '🧡', '💛', '💚', '🩵', '💙', '💜', '🤍', '💕', '💞', '💓', '💗',
      '💖', '☀️', '🌤️', '🌈', '🌺', '🌻', '🌼', '🍀', '🍁', '❄️', '⭐', '🌟',
    ],
  },
];

export default function Page() {
  return (
    <AppShell>
      {({ user, mode }) => (
        <Suspense>
          <MessagesScreen user={user} isLeaderMode={mode === 'leader'} />
        </Suspense>
      )}
    </AppShell>
  );
}

function MessagesScreen({ user, isLeaderMode }: { user: User; isLeaderMode: boolean }) {
  const db = useDB();
  const router = useRouter();
  const searchParams = useSearchParams();
  const withParam = searchParams.get('with') || '';

  const partnerUuid = isLeaderMode ? withParam : withParam || user.leaderUuid || '';
  const partner = findUser(db, partnerUuid);

  // トーク相手一覧（リーダーモード、または相手未指定時）
  const candidates = useMemo(() => {
    const list: User[] = [];
    const seen = new Set<string>();
    const add = (u: User | null) => {
      if (u && u.uuid !== user.uuid && !seen.has(u.uuid)) {
        seen.add(u.uuid);
        list.push(u);
      }
    };
    if (user.leaderUuid) add(findUser(db, user.leaderUuid));
    for (const m of membersOf(db, user.uuid)) add(m);
    for (const msg of db.messages ?? []) {
      if (msg.leaderUuid === user.uuid) add(findUser(db, msg.memberUuid));
      if (msg.memberUuid === user.uuid) add(findUser(db, msg.leaderUuid));
    }
    return list;
  }, [db, user.uuid, user.leaderUuid]);

  if (!partner) {
    return (
      <>
        <PageTitle>メッセージ</PageTitle>
        {candidates.length === 0 ? (
          <Empty icon={MessageCircle} label="トーク相手がいません" />
        ) : (
          <div className="flex flex-col gap-3">
            {candidates.map((m) => {
              const msgs = messagesBetween(db, user.uuid, m.uuid);
              const last = msgs[msgs.length - 1];
              return (
                <Row
                  key={m.uuid}
                  onClick={() => router.push(`/messages/?with=${m.uuid}`)}
                  left={<Avatar name={m.name} src={m.avatarUrl} />}
                  title={m.name}
                  sub={last ? last.text : 'まだメッセージはありません'}
                  right={
                    last ? (
                      <span className="shrink-0 text-sm font-bold text-black/45">{fmtTime(last.createdAt)}</span>
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </>
    );
  }

  // leaderUuid / memberUuid はユーザー関係に基づいて一貫させる
  const leaderUuid = partner.leaderUuid === user.uuid ? user.uuid : user.leaderUuid === partner.uuid ? partner.uuid : isLeaderMode ? user.uuid : partner.uuid;
  const memberUuid = leaderUuid === user.uuid ? partner.uuid : user.uuid;

  return (
    <ChatRoom
      me={user}
      partner={partner}
      leaderUuid={leaderUuid}
      memberUuid={memberUuid}
      showBackToList={candidates.length > 1 || isLeaderMode}
    />
  );
}

function ChatRoom({
  me,
  partner,
  leaderUuid,
  memberUuid,
  showBackToList,
}: {
  me: User;
  partner: User;
  leaderUuid: string;
  memberUuid: string;
  showBackToList: boolean;
}) {
  const db = useDB();
  const msgs = messagesBetween(db, me.uuid, partner.uuid);
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false); // デフォルトは閉じておく
  const [emojiTab, setEmojiTab] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs.length]);

  const onSend = async () => {
    if (!text.trim()) return;
    const t = text;
    setText('');
    setShowEmoji(false);
    await sendChatMessage({
      leaderUuid,
      memberUuid,
      senderUuid: me.uuid,
      text: t,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* トークヘッダー */}
      <div className="glass sticky top-[86px] z-20 flex items-center gap-3 rounded-full px-3 py-2">
        {showBackToList && (
          <Link
            href="/messages/"
            aria-label="一覧へ戻る"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/80 active:scale-90"
          >
            <ChevronLeft size={26} />
          </Link>
        )}
        <Avatar name={partner.name} src={partner.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[1.15rem] font-bold">{partner.name}</div>
        </div>
      </div>

      {/* LINE風トークエリア（ページ全体のスクロールと自然に連動） */}
      <div
        className="glass flex min-h-[46dvh] flex-col gap-3 rounded-[28px] p-4"
        style={{ background: 'linear-gradient(180deg, rgba(226,238,248,0.65) 0%, rgba(255,255,255,0.75) 100%)' }}
      >
        {msgs.length === 0 ? (
          <div className="my-auto py-16 text-center text-base font-bold text-black/40">
            メッセージを送ってみましょう😊
          </div>
        ) : (
          msgs.map((m, idx) => {
            const isMine = m.senderUuid === me.uuid;
            const prev = msgs[idx - 1];
            const showDate = !prev || fmtDate(prev.createdAt) !== fmtDate(m.createdAt);
            return (
              <div key={m.uuid} className="flex flex-col gap-2">
                {showDate && (
                  <div className="my-1 self-center rounded-full bg-black/10 px-3 py-0.5 text-xs font-bold text-black/60">
                    {fmtDate(m.createdAt)}
                  </div>
                )}
                <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMine && <Avatar name={partner.name} src={partner.avatarUrl} size="sm" />}
                  <div
                    className={`max-w-[74%] whitespace-pre-wrap rounded-[22px] px-4 py-3 text-[1.05rem] leading-relaxed shadow-sm ${
                      isMine
                        ? 'rounded-br-md bg-[#06C755] font-medium text-white'
                        : 'rounded-bl-md bg-white text-[#231815]'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="shrink-0 pb-1 text-xs font-bold text-black/40">{fmtTime(m.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} className="scroll-mb-36" />
      </div>

      {/* 下部固定エリア（絵文字パレット＋入力バー） */}
      <div className="sticky bottom-3 z-20 flex flex-col gap-2">
        {showEmoji && (
          <div className="glass-strong flex flex-col gap-2 rounded-3xl p-3">
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
              {EMOJI_CATS.map((cat, idx) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setEmojiTab(idx)}
                  className={`chip !min-h-[36px] shrink-0 !px-3 !text-xs ${
                    emojiTab === idx ? 'bg-accent text-white' : 'bg-white/70 text-black/65'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="grid max-h-[190px] grid-cols-8 gap-1 overflow-y-auto">
              {EMOJI_CATS[emojiTab].items.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setText((prev) => prev + em)}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-white/70 text-2xl transition active:scale-90"
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          className="glass-strong flex items-center gap-2 rounded-full p-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
        >
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            aria-label="絵文字"
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-full transition ${
              showEmoji ? 'bg-accent text-white' : 'bg-white/80 text-black/60'
            }`}
          >
            <Smile size={26} />
          </button>
          <input
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[1.15rem] outline-none"
            placeholder="メッセージを入力"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="送信"
            className="bg-accent grid shrink-0 place-items-center rounded-full text-white shadow-md disabled:opacity-30"
            style={{ width: 52, height: 52 }}
          >
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
}
