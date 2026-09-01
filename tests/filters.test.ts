import { describe, it, expect } from "vitest";
import { parseAssetFilters, buildAssetWhere, parseBuyerFilters, buildBuyerWhere } from "@/lib/filters";


describe("parseAssetFilters", () => {
  it("keeps only known enum values", () => {
    const f = parseAssetFilters({ industry: ["TECHNOLOGY", "BANANA"] });
    expect(f.industries).toEqual(["TECHNOLOGY"]);
  });

  it("accepts a single value as well as an array", () => {
    expect(parseAssetFilters({ industry: "RETAIL" }).industries).toEqual(["RETAIL"]);
  });

  it("drops the upper bound when the range is reversed", () => {
    const f = parseAssetFilters({ minPrice: "5000000", maxPrice: "1000000" });
    expect(f.minPrice).toBe(5_000_000);
    expect(f.maxPrice).toBeNull();
  });

  it("keeps a valid range untouched", () => {
    const f = parseAssetFilters({ minPrice: "1000000", maxPrice: "5000000" });
    expect(f.maxPrice).toBe(5_000_000);
  });

  it("ignores non-numeric and negative prices", () => {
    expect(parseAssetFilters({ minPrice: "abc" }).minPrice).toBeNull();
    expect(parseAssetFilters({ minPrice: "-100" }).minPrice).toBeNull();
  });

  it("trims and caps the search query", () => {
    expect(parseAssetFilters({ q: "  logistics  " }).q).toBe("logistics");
    expect(parseAssetFilters({ q: "x".repeat(200) }).q).toHaveLength(100);
  });
});

describe("buildAssetWhere", () => {
  const empty = parseAssetFilters({});

  it("always hides assets of suspended sellers", () => {
    expect(buildAssetWhere(empty)).toMatchObject({
      status: "PUBLISHED",
      seller: { status: "ACTIVE" },
    });
  });

  it("keeps the visibility rules when filters are applied", () => {
    const where = buildAssetWhere(parseAssetFilters({ industry: "ENERGY", q: "solar" }));
    expect(where.status).toBe("PUBLISHED");
    expect(where.seller).toEqual({ status: "ACTIVE" });
  });

  it("omits a filter that was not requested", () => {
    expect(buildAssetWhere(empty).industry).toBeUndefined();
    expect(buildAssetWhere(empty).askingPrice).toBeUndefined();
  });

  it("searches both title and description", () => {
    const where = buildAssetWhere(parseAssetFilters({ q: "dairy" }));
    expect(where.OR).toHaveLength(2);
  });
});

describe("buildBuyerWhere", () => {
 
  it("treats the budget filter as a range overlap", () => {
    const where = buildBuyerWhere(parseBuyerFilters({ minBudget: "5000000" }));
    const profile = where.buyerProfile as { is: Record<string, unknown> };

    expect(profile.is.budgetMax).toEqual({ gte: 5_000_000 });
    expect(profile.is.budgetMin).toBeUndefined();
  });

  it("bounds both ends when both are given", () => {
    const where = buildBuyerWhere(
      parseBuyerFilters({ minBudget: "1000000", maxBudget: "8000000" })
    );
    const profile = where.buyerProfile as { is: Record<string, unknown> };

    expect(profile.is.budgetMax).toEqual({ gte: 1_000_000 });
    expect(profile.is.budgetMin).toEqual({ lte: 8_000_000 });
  });

  it("matches any of the selected industries, not all of them", () => {
    const where = buildBuyerWhere(
      parseBuyerFilters({ industry: ["RETAIL", "ENERGY"] })
    );
    const profile = where.buyerProfile as { is: Record<string, unknown> };

    expect(profile.is.industries).toEqual({ hasSome: ["RETAIL", "ENERGY"] });
  });

  it("only returns active buyers who have a profile", () => {
    const where = buildBuyerWhere(parseBuyerFilters({}));
    expect(where.role).toBe("BUYER");
    expect(where.status).toBe("ACTIVE");
    expect(where.buyerProfile).toBeDefined();
  });
});