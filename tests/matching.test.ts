import { describe, it, expect } from "vitest";
import { scoreAsset, rankAssets } from "@/lib/matching";
import type { Asset, BuyerProfile } from "@/lib/generated/prisma/client";

const profile = {
  industries: ["TECHNOLOGY", "LOGISTICS"],
  dealTypes: ["MAJORITY_STAKE"],
  regions: ["UKRAINE"],
  budgetMin: 1_000_000,
  budgetMax: 5_000_000,
} as BuyerProfile;

function asset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "a1",
    industry: "TECHNOLOGY",
    dealType: "MAJORITY_STAKE",
    region: "UKRAINE",
    askingPrice: 2_000_000,
    ...overrides,
  } as Asset;
}

describe("scoreAsset", () => {
  it("gives a perfect score when everything matches", () => {
    expect(scoreAsset(asset(), profile).score).toBe(100);
  });

  it("gives zero when nothing matches", () => {
    const result = scoreAsset(
      asset({ industry: "ENERGY", dealType: "ASSET_PURCHASE", region: "ASIA", askingPrice: 50_000_000 }),
      profile
    );
    expect(result.score).toBe(0);
    expect(result.reasons).toHaveLength(0);
  });

  it("weights industry above deal type and region combined", () => {
    const industryOnly = scoreAsset(
      asset({ dealType: "ASSET_PURCHASE", region: "ASIA", askingPrice: 50_000_000 }),
      profile
    );
    const restOnly = scoreAsset(asset({ industry: "ENERGY", askingPrice: 50_000_000 }), profile);

    expect(industryOnly.score).toBeGreaterThan(restOnly.score);
  });

  it("counts a price exactly on the budget boundary as a match", () => {
    expect(scoreAsset(asset({ askingPrice: 5_000_000 }), profile).reasons).toContain(
      "Asking price is within your budget"
    );
    expect(scoreAsset(asset({ askingPrice: 5_000_001 }), profile).reasons).not.toContain(
      "Asking price is within your budget"
    );
  });

  it("returns one reason per matching signal", () => {
    expect(scoreAsset(asset(), profile).reasons).toHaveLength(4);
  });
});

describe("rankAssets", () => {
  it("drops assets that do not match the industry", () => {
    const weak = asset({ id: "weak", industry: "ENERGY", askingPrice: 50_000_000 });
    expect(rankAssets([weak], profile)).toHaveLength(0);
  });

  it("sorts by score, best first", () => {
    const perfect = asset({ id: "perfect" });
    const partial = asset({ id: "partial", region: "ASIA", askingPrice: 50_000_000 });

    const ranked = rankAssets([partial, perfect], profile);
    expect(ranked.map((r) => r.asset.id)).toEqual(["perfect", "partial"]);
  });

  it("breaks ties by the cheaper asking price", () => {
    const cheap = asset({ id: "cheap", askingPrice: 1_500_000 });
    const pricey = asset({ id: "pricey", askingPrice: 4_500_000 });

    const ranked = rankAssets([pricey, cheap], profile);
    expect(ranked.map((r) => r.asset.id)).toEqual(["cheap", "pricey"]);
  });

  it("respects the limit", () => {
    const many = Array.from({ length: 10 }, (_, i) => asset({ id: `a${i}` }));
    expect(rankAssets(many, profile)).toHaveLength(3);
  });
});