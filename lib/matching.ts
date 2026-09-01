import type { Asset, BuyerProfile } from "./generated/prisma/client";

export type MatchReason = string;

export type ScoredAsset<T extends Asset> = {
  asset: T;
  score: number;
  reasons: MatchReason[];
};

const WEIGHTS = {
  industry: 40,
  budget: 30,
  dealType: 20,
  region: 10,
} as const;

export function scoreAsset<T extends Asset>(
  asset: T,
  profile: BuyerProfile
): ScoredAsset<T> {
  let score = 0;
  const reasons: MatchReason[] = [];

  if (profile.industries.includes(asset.industry)) {
    score += WEIGHTS.industry;
    reasons.push("Matches an industry you follow");
  }

  if (asset.askingPrice >= profile.budgetMin && asset.askingPrice <= profile.budgetMax) {
    score += WEIGHTS.budget;
    reasons.push("Asking price is within your budget");
  }

  if (profile.dealTypes.includes(asset.dealType)) {
    score += WEIGHTS.dealType;
    reasons.push("Deal structure you are open to");
  }

  if (profile.regions.includes(asset.region)) {
    score += WEIGHTS.region;
    reasons.push("In a region you invest in");
  }

  return { asset, score, reasons };
}

export function rankAssets<T extends Asset>(
  assets: T[],
  profile: BuyerProfile,
  { limit = 3, minScore = WEIGHTS.industry } = {}
): ScoredAsset<T>[] {
  return assets
    .map((asset) => scoreAsset(asset, profile))
    .filter((scored) => scored.score >= minScore)
    .sort((a, b) => b.score - a.score || a.asset.askingPrice - b.asset.askingPrice)
    .slice(0, limit);
}