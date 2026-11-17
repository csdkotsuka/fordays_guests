// メンバーの成績と特典の段階
// TODO: 正式な特典内容を受け取ったら差し替える（現在は仮の値）

export interface RewardTier {
  name: string;
  referrals: number; // 必要な紹介人数
  points: number; // 必要なポイント
  reward: string;
}

export const REWARD_TIERS: RewardTier[] = [
  { name: 'ブロンズ', referrals: 1, points: 50, reward: 'サンプルセット' },
  { name: 'シルバー', referrals: 3, points: 150, reward: '製品1本プレゼント' },
  { name: 'ゴールド', referrals: 5, points: 300, reward: 'イベントご招待' },
  { name: 'プラチナ', referrals: 10, points: 600, reward: 'リーダー昇格' },
];

export function currentTier(referrals: number, points: number) {
  let cur: RewardTier | null = null;
  for (const t of REWARD_TIERS) if (referrals >= t.referrals && points >= t.points) cur = t;
  const next = REWARD_TIERS.find((t) => !(referrals >= t.referrals && points >= t.points)) ?? null;
  return { cur, next };
}
