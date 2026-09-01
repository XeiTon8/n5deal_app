import type { Prisma, Industry, DealType, Region } from "./generated/prisma/client";
import { INDUSTRIES, DEAL_TYPES, REGIONS } from "./constants";

export type SearchParams = Record<string, string | string[] | undefined>;

export type AssetFilters = {
  q: string;
  industries: Industry[];
  dealTypes: DealType[];
  regions: Region[];
  minPrice: number | null;
  maxPrice: number | null;
};

export type BuyerFilters = {
  q: string;
  industries: Industry[];
  dealTypes: DealType[];
  regions: Region[];
  minBudget: number | null;
  maxBudget: number | null;
};

function readMany<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[]
): T[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw.filter((v): v is T => (allowed as readonly string[]).includes(v));
}

function readNumber(value: string | string[] | undefined): number | null {
  if (typeof value !== "string") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseAssetFilters(sp: SearchParams): AssetFilters {
  const minPrice = readNumber(sp.minPrice);
  const maxPrice = readNumber(sp.maxPrice);

  return {
    q: typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "",
    industries: readMany(sp.industry, INDUSTRIES),
    dealTypes: readMany(sp.dealType, DEAL_TYPES),
    regions: readMany(sp.region, REGIONS),
    minPrice,
    maxPrice:
      minPrice !== null && maxPrice !== null && maxPrice < minPrice ? null : maxPrice,
  };
}

export function buildAssetWhere(f: AssetFilters): Prisma.AssetWhereInput {
  return {
    status: "PUBLISHED",
    seller: { status: "ACTIVE" },
    ...(f.industries.length ? { industry: { in: f.industries } } : {}),
    ...(f.dealTypes.length ? { dealType: { in: f.dealTypes } } : {}),
    ...(f.regions.length ? { region: { in: f.regions } } : {}),
    ...(f.minPrice !== null || f.maxPrice !== null
      ? {
          askingPrice: {
            ...(f.minPrice !== null ? { gte: f.minPrice } : {}),
            ...(f.maxPrice !== null ? { lte: f.maxPrice } : {}),
          },
        }
      : {}),
    ...(f.q
      ? {
          OR: [
            { title: { contains: f.q, mode: "insensitive" } },
            { description: { contains: f.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export function parseBuyerFilters(sp: SearchParams): BuyerFilters {
  const minBudget = readNumber(sp.minBudget);
  const maxBudget = readNumber(sp.maxBudget);

  return {
    q: typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "",
    industries: readMany(sp.industry, INDUSTRIES),
    dealTypes: readMany(sp.dealType, DEAL_TYPES),
    regions: readMany(sp.region, REGIONS),
    minBudget,
    maxBudget:
      minBudget !== null && maxBudget !== null && maxBudget < minBudget ? null : maxBudget,
  };
}

export function buildBuyerWhere(f: BuyerFilters): Prisma.UserWhereInput {
  const profile: Prisma.BuyerProfileWhereInput = {
    ...(f.industries.length ? { industries: { hasSome: f.industries } } : {}),
    ...(f.dealTypes.length ? { dealTypes: { hasSome: f.dealTypes } } : {}),
    ...(f.regions.length ? { regions: { hasSome: f.regions } } : {}),
    ...(f.maxBudget !== null ? { budgetMin: { lte: f.maxBudget } } : {}),
    ...(f.minBudget !== null ? { budgetMax: { gte: f.minBudget } } : {}),
    ...(f.q
      ? {
          OR: [
            { headline: { contains: f.q, mode: "insensitive" } },
            { description: { contains: f.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return {
    role: "BUYER",
    status: "ACTIVE",
    buyerProfile: { is: profile },
  };
}