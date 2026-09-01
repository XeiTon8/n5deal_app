import { describe, it, expect } from "vitest";
import { assetSchema, buyerProfileSchema } from "@/lib/validation";

const validAsset = {
  title: "Regional cold storage network",
  description: "A profitable cold storage business with documented financials and a clean cap table.",
  industry: "LOGISTICS",
  dealType: "FULL_ACQUISITION",
  region: "UKRAINE",
  askingPrice: "5800000",
  annualRevenue: "2100000",
  ebitda: "640000",
  stakePercent: "100",
};

describe("assetSchema", () => {
  it("rejects EBITDA above annual revenue", () => {
    const result = assetSchema.safeParse({
      ...validAsset,
      annualRevenue: "500000",
      ebitda: "900000",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.ebitda).toBeDefined();
    }
  });

  it("allows EBITDA when annual revenue is not disclosed", () => {
    const result = assetSchema.safeParse({
      ...validAsset,
      annualRevenue: "",
      ebitda: "640000",
    });

    expect(result.success).toBe(true);
  });

  it("turns empty optional money fields into null, not zero", () => {
    const result = assetSchema.safeParse({
      ...validAsset,
      annualRevenue: "",
      ebitda: "",
      stakePercent: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.annualRevenue).toBeNull();
      expect(result.data.ebitda).toBeNull();
      expect(result.data.stakePercent).toBeNull();
    }
  });

  it("rejects a stake outside 1 to 100", () => {
    expect(assetSchema.safeParse({ ...validAsset, stakePercent: "150" }).success).toBe(false);
    expect(assetSchema.safeParse({ ...validAsset, stakePercent: "0" }).success).toBe(false);
    expect(assetSchema.safeParse({ ...validAsset, stakePercent: "100" }).success).toBe(true);
  });
});

describe("buyerProfileSchema", () => {
  const validProfile = {
    headline: "Mid-market buyouts in Ukrainian industrials",
    description: "We acquire cash-generative businesses and hold them for the long term.",
    industries: ["MANUFACTURING"],
    dealTypes: ["FULL_ACQUISITION"],
    regions: ["UKRAINE"],
    budgetMin: "1000000",
    budgetMax: "8000000",
  };

  it("rejects an upper budget below the lower one", () => {
    const result = buyerProfileSchema.safeParse({
      ...validProfile,
      budgetMin: "8000000",
      budgetMax: "1000000",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.budgetMax).toBeDefined();
    }
  });

  it("allows a single-value budget range", () => {
    const result = buyerProfileSchema.safeParse({
      ...validProfile,
      budgetMin: "3000000",
      budgetMax: "3000000",
    });

    expect(result.success).toBe(true);
  });

  it("requires at least one industry, deal type and region", () => {
    expect(buyerProfileSchema.safeParse({ ...validProfile, industries: [] }).success).toBe(false);
    expect(buyerProfileSchema.safeParse({ ...validProfile, dealTypes: [] }).success).toBe(false);
    expect(buyerProfileSchema.safeParse({ ...validProfile, regions: [] }).success).toBe(false);
  });
});