import type { DB } from './index';
import type { EventItem, Invitation, MessageItem, Referral, SubscriptionItem, User } from '../types';

export const SEED_VERSION = 4;

// 全端末で同じ UUID になるよう決定的な UUID を生成する
function fixedId(prefix: number, index: number): string {
  const p = String(prefix).padStart(8, '0');
  const i = String(index).padStart(12, '0');
  return `${p}-0000-4000-8000-${i}`;
}

// オフラインでも絶対にリンク切れしない、人物イラストの丸アイコン（Data URI）を生成
function makePortraitAvatar(index: number, isFemale: boolean): string {
  const bgs = ['#ffe4e6', '#e0f2fe', '#fef3c7', '#dcfce7', '#f3e8ff', '#ffedd5', '#fae8ff', '#e0e7ff'];
  const clothes = ['#f7323f', '#2e7d4f', '#0284c7', '#d97706', '#7c3aed', '#db2777', '#0d9488', '#4f46e5'];
  const hairs = ['#2d2422', '#4a3728', '#5c4033', '#6b5b53', '#3b2f2f', '#78716c'];
  const bg = bgs[index % bgs.length];
  const shirt = clothes[index % clothes.length];
  const hair = hairs[index % hairs.length];
  const glasses = index % 4 === 1;

  const hairBack = isFemale
    ? `<path d="M22 48 C22 20, 78 20, 78 48 L80 74 C65 78, 35 78, 20 74 Z" fill="${hair}"/>`
    : '';
  const hairTop = isFemale
    ? `<path d="M24 44 C26 22, 74 22, 76 44 C64 34, 48 34, 24 44 Z" fill="${hair}"/>`
    : `<path d="M25 44 C25 22, 75 22, 75 44 C65 32, 35 32, 25 44 Z" fill="${hair}"/>`;
  const glassesSvg = glasses
    ? `<g stroke="#333" stroke-width="2" fill="none"><circle cx="41" cy="49" r="6"/><circle cx="59" cy="49" r="6"/><line x1="47" y1="49" x2="53" y2="49"/></g>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="50" fill="${bg}"/>
    ${hairBack}
    <path d="M18 100 C20 74, 80 74, 82 100 Z" fill="${shirt}"/>
    <rect x="43" y="62" width="14" height="16" rx="6" fill="#f9d5bb"/>
    <circle cx="50" cy="48" r="22" fill="#fce2ce"/>
    ${hairTop}
    <circle cx="41" cy="49" r="2.6" fill="#231815"/>
    <circle cx="59" cy="49" r="2.6" fill="#231815"/>
    <circle cx="35" cy="55" r="4" fill="#fda4af" opacity="0.55"/>
    <circle cx="65" cy="55" r="4" fill="#fda4af" opacity="0.55"/>
    ${glassesSvg}
    <path d="M43 58 Q50 64 57 58" stroke="#c2410c" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

const SUB_CATALOG = [
  { id: 'prod-01-a45d9cef', name: '核酸ドリンク ナチュラル DNコラーゲン' },
  { id: 'prod-02-710ad85d', name: '核酸ドリンク フォーデイズの極み' },
  { id: 'prod-03-4eb9b199', name: 'ナチュラル RNA V+' },
  { id: 'prod-04-bc65fd83', name: 'アドバンス Ⅲ' },
  { id: 'prod-12-ed5d8242', name: 'ファイバーミックス Bio' },
  { id: 'prod-21-cb7d5fb0', name: 'ムーサ エッセンス ドリンク ステムブライト' },
  { id: 'prod-22-3ea99a10', name: '青汁 & ファイバーミックス フレッシュ' },
  { id: 'prod-30-6a98a427', name: 'ムーサ LU・セラム tia' },
];

function makeDummySubscriptions(idx: number, newId: () => string): SubscriptionItem[] {
  const active1 = SUB_CATALOG[idx % SUB_CATALOG.length];
  const active2 = idx % 2 === 0 ? SUB_CATALOG[(idx + 3) % SUB_CATALOG.length] : null;
  const past1 = SUB_CATALOG[(idx + 5) % SUB_CATALOG.length];
  const past2 = idx % 3 === 0 ? SUB_CATALOG[(idx + 2) % SUB_CATALOG.length] : null;

  const items: SubscriptionItem[] = [
    {
      id: newId(),
      productId: active1.id,
      productName: active1.name,
      startMonth: `2025-${String((idx % 9) + 1).padStart(2, '0')}`,
      endMonth: null,
    },
  ];
  if (active2 && active2.id !== active1.id) {
    items.push({
      id: newId(),
      productId: active2.id,
      productName: active2.name,
      startMonth: `2026-0${(idx % 6) + 1}`,
      endMonth: null,
    });
  }
  items.push({
    id: newId(),
    productId: past1.id,
    productName: past1.name,
    startMonth: `2023-${String((idx % 8) + 1).padStart(2, '0')}`,
    endMonth: `2024-${String((idx % 10) + 2).padStart(2, '0')}`,
  });
  if (past2 && past2.id !== past1.id) {
    items.push({
      id: newId(),
      productId: past2.id,
      productName: past2.name,
      startMonth: '2022-04',
      endMonth: '2023-03',
    });
  }
  return items;
}

// 7人のリーダー（重複なし）
const LEADER_DEFS = [
  { no: '1000001', name: '大塚 和宏', female: false, phone: '090-7549-8574', pts: 380 },
  { no: '1000002', name: '松山 太郎', female: false, phone: '089-900-1122', pts: 320 },
  { no: '1000003', name: '高橋 恵美', female: true, phone: '090-3311-2244', pts: 290 },
  { no: '1000004', name: '中村 健一', female: false, phone: '090-4455-6677', pts: 250 },
  { no: '1000005', name: '小林 由美子', female: true, phone: '080-5566-7788', pts: 230 },
  { no: '1000006', name: '吉田 誠', female: false, phone: '090-6677-8899', pts: 210 },
  { no: '1000007', name: '山本 香織', female: true, phone: '080-7788-9900', pts: 195 },
];

// 30人のメンバー（重複なし）
const MEMBER_DEFS: { name: string; female: boolean }[] = [
  { name: '山田 花子', female: true },
  { name: '佐藤 幸子', female: true },
  { name: '鈴木 一郎', female: false },
  { name: '伊藤 節子', female: true },
  { name: '渡辺 良子', female: true },
  { name: '田中 久美子', female: true },
  { name: '加藤 正雄', female: false },
  { name: '佐々木 洋子', female: true },
  { name: '山口 京子', female: true },
  { name: '松本 清', female: false },
  { name: '井上 明美', female: true },
  { name: '木村 裕子', female: true },
  { name: '林 茂', female: false },
  { name: '斎藤 智子', female: true },
  { name: '清水 順子', female: true },
  { name: '山崎 博', female: false },
  { name: '森 真由美', female: true },
  { name: '池田 恵子', female: true },
  { name: '橋本 隆', female: false },
  { name: '阿部 敏子', female: true },
  { name: '石川 典子', female: true },
  { name: '前田 勝', female: false },
  { name: '藤田 悦子', female: true },
  { name: '小川 弘子', female: true },
  { name: '岡田 浩二', female: false },
  { name: '後藤 直美', female: true },
  { name: '長谷川 千代', female: true },
  { name: '村上 修', female: false },
  { name: '近藤 静江', female: true },
  { name: '坂本 満子', female: true },
];

const gmap = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export function createSeed(_newId: () => string): DB {
  const t = new Date().toISOString();

  const admin: User = {
    uuid: fixedId(1, 1),
    memberNo: '9000001',
    name: 'サポートセンター',
    email: 'admin@fordays-partner.jp',
    emailVerified: true,
    privacyAcceptedAt: t,
    avatarUrl: makePortraitAvatar(0, false),
    roles: ['admin'],
    leaderUuid: null,
    calendarId: null,
    points: 0,
    createdAt: t,
  };

  const leaders: User[] = LEADER_DEFS.map((ld, idx) => ({
    uuid: fixedId(2, idx + 1),
    memberNo: ld.no,
    name: ld.name,
    email: `leader${idx + 1}@fordays-partner.jp`,
    emailVerified: true,
    privacyAcceptedAt: t,
    phone: ld.phone,
    avatarUrl: makePortraitAvatar(idx + 1, ld.female),
    subscriptions: makeDummySubscriptions(idx, () => fixedId(9, idx * 10 + Math.floor(Math.random() * 1000))),
    roles: ['leader'],
    leaderUuid: null,
    calendarId: null,
    points: ld.pts,
    createdAt: t,
  }));

  // 30人のメンバーを7人のリーダーへ割り当て（最初の6人は大塚リーダー配下、残りは各リーダーへ均等割り当て）
  const members: User[] = MEMBER_DEFS.map((md, idx) => {
    const leader = idx < 6 ? leaders[0] : leaders[(idx - 6) % leaders.length];
    const no = String(2000001 + idx);
    return {
      uuid: fixedId(3, idx + 1),
      memberNo: no,
      name: md.name,
      email: `member${idx + 1}@example.jp`,
      emailVerified: true,
      privacyAcceptedAt: t,
      phone: `090-${String(1000 + idx * 37).slice(0, 4)}-${String(2000 + idx * 53).slice(0, 4)}`,
      avatarUrl: makePortraitAvatar(idx + 10, md.female),
      subscriptions: makeDummySubscriptions(idx + 2, () => fixedId(8, idx * 10 + Math.floor(Math.random() * 1000))),
      roles: idx === 0 ? ['member', 'leader'] : ['member'],
      leaderUuid: leader.uuid,
      calendarId: null,
      points: 20 + ((idx * 35) % 260),
      createdAt: t,
    };
  });

  const day = (d: number, h: number, m = 0) => {
    const x = new Date();
    x.setDate(x.getDate() + d);
    x.setHours(h, m, 0, 0);
    return x.toISOString();
  };

  // イベント12件（過去4件＋今後8件、GoogleマップURL付き）
  const eventSpecs = [
    // 過去のイベント（4件）
    {
      leaderIdx: 0,
      offsetDays: -28,
      hour: 13,
      min: 30,
      title: '秋の核酸勉強会＆新米おにぎりランチ会🍙',
      place: '松山市 コミュニティセンター 調理室',
      note: '季節の変わり目に負けない体づくりのコツを学びながら、炊きたて新米おにぎりと豚汁をいただきました😋',
    },
    {
      leaderIdx: 1,
      offsetDays: -20,
      hour: 10,
      min: 0,
      title: '道後公園 朝のいきいきウォーキング🚶‍♀️',
      place: '松山市 道後公園 入口広場',
      note: '朝の澄んだ空気のなか、ゆっくり40分お散歩しました。ゴール後の冷たい核酸ドリンクが最高でした✨',
    },
    {
      leaderIdx: 2,
      offsetDays: -12,
      hour: 14,
      min: 0,
      title: '秋のうるおいハンドケア＆お茶会🫖',
      place: '松山市 総合福祉センター 第2会議室',
      note: 'ムーサの美容液を使ったしっとりハンドマッサージ体験。手がワントーン明るくなったと大好評でした🌸',
    },
    {
      leaderIdx: 0,
      offsetDays: -5,
      hour: 13,
      min: 0,
      title: 'かぼちゃと核酸コラーゲンのスイートポテト作り🍠',
      place: '大塚サロン（松山市西石井）',
      note: '混ぜて焼くだけの秋スイーツ作り。お土産分までたっぷり作って、みんなで楽しい時間を過ごしました😊',
    },
    // 今後のイベント（8件）
    {
      leaderIdx: 0,
      offsetDays: 3,
      hour: 13,
      min: 30,
      title: '核酸のおはなし＆季節のお茶会☕️',
      place: '松山市 コミュニティセンター 和室',
      note: '「核酸ってそもそも何？」を楽しくおしゃべりしながら、季節のお茶とお菓子でほっと一息つきましょう🍵 はじめての方も手ぶらでどうぞ！',
    },
    {
      leaderIdx: 0,
      offsetDays: 7,
      hour: 10,
      min: 0,
      title: '100歳まで歩ける！らくらく体操＆ストレッチ🤸‍♀️',
      place: '松山市 総合福祉センター 軽運動室',
      note: '椅子に座ったままでもできるやさしい運動です。みんなで体をほぐしたあとは、冷たい核酸ドリンクで乾杯しましょう✨ 動きやすい服装でお越しください。',
    },
    {
      leaderIdx: 1,
      offsetDays: 10,
      hour: 11,
      min: 0,
      title: '腸活ファイバー＆発酵ランチおしゃべり会🥗',
      place: '松山市 大街道 カフェ・ド・マルシェ',
      note: 'ファイバーミックスを使った簡単ドレッシングの試食と、お腹から元気になれる食事法を楽しく学びます🍅',
    },
    {
      leaderIdx: 2,
      offsetDays: 13,
      hour: 14,
      min: 0,
      title: '冬の乾燥知らず！ツヤ肌スキンケア体験会💄',
      place: 'アイテムえひめ 小展示室A',
      note: 'ムーサ LU・セラム tia をたっぷり使った泡洗顔＆保湿ケアを一緒に体験しましょう✨ すっぴんでもメイクの上からでもOKです！',
    },
    {
      leaderIdx: 0,
      offsetDays: 16,
      hour: 14,
      min: 0,
      title: '核酸コラーゲン入り♪ かんたん美肌お菓子作り🍮',
      place: '大塚サロン（松山市西石井）',
      note: '混ぜて冷やすだけ！罪悪感なしのぷるぷる美肌スイーツをみんなで作って試食します🍓 エプロンだけお持ちください。お友だちとの参加も大歓迎！',
    },
    {
      leaderIdx: 3,
      offsetDays: 19,
      hour: 10,
      min: 30,
      title: '姿勢スッキリ！肩こり解消ポールストレッチ🧘',
      place: '松山市 市民会館 リハーサル室',
      note: '深い呼吸で背中と肩まわりをじんわり伸ばします。運動が苦手な方やご年配の方も安心してご参加いただけます😊',
    },
    {
      leaderIdx: 4,
      offsetDays: 23,
      hour: 13,
      min: 30,
      title: 'はじめての方向け・やさしい核酸ミニ講座📖',
      place: '松山市 テクノプラザ愛媛 研修室',
      note: 'ご家族やお友だちに「どうして体にいいの？」をわかりやすく伝えられるようになる30分ミニ講座＋茶話会です☕️',
    },
    {
      leaderIdx: 5,
      offsetDays: 27,
      hour: 20,
      min: 0,
      title: 'おうちで参加OK！夜のゆるっとおしゃべり会🌙',
      place: 'オンライン（松山市・ご自宅から）',
      note: 'ご自宅からパジャマのままでも参加OK！最近の体調の変化や、おすすめの飲み方・アレンジを気軽におしゃべりしましょう😊',
    },
  ];

  const events: EventItem[] = eventSpecs.map((s, idx) => ({
    uuid: fixedId(4, idx + 1),
    leaderUuid: leaders[s.leaderIdx].uuid,
    title: s.title,
    startAt: day(s.offsetDays, s.hour, s.min),
    place: s.place,
    mapUrl: gmap(s.place),
    note: s.note,
    createdAt: t,
  }));

  // 紹介データ（お友だち）
  const referrals: Referral[] = [
    {
      uuid: fixedId(5, 1),
      referrerUuid: members[0].uuid,
      leaderUuid: leaders[0].uuid,
      name: '高橋 美代子',
      phone: '090-1122-3344',
      memo: 'ご近所のお茶友だち',
      status: 'introduced',
      createdAt: t,
    },
    {
      uuid: fixedId(5, 2),
      referrerUuid: members[0].uuid,
      leaderUuid: leaders[0].uuid,
      name: '田中 和子',
      phone: '090-2233-4455',
      memo: '体操教室のお仲間',
      status: 'joined',
      createdAt: t,
    },
    {
      uuid: fixedId(5, 3),
      referrerUuid: members[1].uuid,
      leaderUuid: leaders[0].uuid,
      name: '野村 節子',
      phone: '080-3344-5566',
      memo: 'お料理クラブ',
      status: 'introduced',
      createdAt: t,
    },
  ];

  // 各イベントに主催リーダー配下のメンバーを招待
  const invitations: Invitation[] = [];
  const statuses: ('yes' | 'pending' | 'no')[] = ['yes', 'pending', 'yes', 'no', 'pending', 'yes'];
  let invSeq = 1;
  events.forEach((ev, eIdx) => {
    const lMembers = members.filter((m) => m.leaderUuid === ev.leaderUuid);
    lMembers.forEach((m, mIdx) => {
      // 過去イベントは全員返答済み（参加/不参加）、今後のイベントは参加・未返答・不参加を混在
      const isPast = new Date(ev.startAt).getTime() < Date.now();
      const status = isPast ? (mIdx % 4 === 3 ? 'no' : 'yes') : statuses[(eIdx + mIdx) % statuses.length];
      const comps = status === 'yes' && m.uuid === members[0].uuid && eIdx % 2 === 1 ? [referrals[1].uuid] : [];
      invitations.push({
        uuid: fixedId(6, invSeq++),
        eventUuid: ev.uuid,
        leaderUuid: ev.leaderUuid,
        memberUuid: m.uuid,
        status,
        companionUuids: comps,
        respondedAt: status === 'pending' ? null : t,
        remindedAt: null,
        createdAt: t,
      });
    });
  });

  // 各メンバーと担当リーダーのLINE風ダミーやりとり（各2往復＝4通）
  const DIALOGUES: [boolean, string][][] = [
    [
      [false, 'こんにちは😊 今月のお茶会のご案内を送らせていただきました！ご都合いかがですか？☕️'],
      [true, '大塚さん、いつもありがとうございます🌸 ぜひ参加したいです！'],
      [false, '嬉しいです✨ お友だちの田中さんももしご一緒できそうならぜひお誘いくださいね😊'],
      [true, 'さっそく声をかけてみますね👍 楽しみにしています！'],
    ],
    [
      [false, 'こんにちは！先日のらくらく体操はいかがでしたか？🤸‍♀️'],
      [true, '椅子に座ってできたので膝が楽でした😊 帰ってからグッスリ眠れましたよ✨'],
      [false, 'それは良かったです！また来週もお菓子作りがありますので、気軽にお越しくださいね🍮'],
      [true, 'ありがとうございます🙏 エプロンを持って伺いますね！'],
    ],
    [
      [false, 'いつもありがとうございます😊 今月17日が定期購入の変更締め切りになります📅'],
      [true, 'お知らせ助かります！今回はファイバーミックスを1箱追加しようと思っています🍵'],
      [false, '承知しました！手順で分からないところがあれば、いつでもお電話くださいね📞'],
      [true, 'ありがとうございます😊 やってみますね！'],
    ],
  ];

  const messages: MessageItem[] = [];
  let msgSeq = 1;
  members.forEach((m, idx) => {
    if (!m.leaderUuid) return;
    const conv = DIALOGUES[idx % DIALOGUES.length];
    conv.forEach(([fromMember, text], stepIdx) => {
      const msgTime = new Date(Date.now() - (conv.length - stepIdx) * 3600 * 1000 * 6 - idx * 60000).toISOString();
      messages.push({
        uuid: fixedId(7, msgSeq++),
        leaderUuid: m.leaderUuid!,
        memberUuid: m.uuid,
        senderUuid: fromMember ? m.uuid : m.leaderUuid!,
        text: text.replace('大塚さん', `${leaders.find((l) => l.uuid === m.leaderUuid)?.name.split(' ')[0] ?? ''}さん`),
        createdAt: msgTime,
      });
    });
  });

  return {
    version: SEED_VERSION,
    users: [admin, ...leaders, ...members],
    referrals,
    events,
    invitations,
    messages,
  };
}
