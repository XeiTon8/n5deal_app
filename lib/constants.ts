import type { Industry, DealType, Region } from "./generated/prisma/client";

export const INDUSTRY_LABELS: Record<Industry, string> = {
  TECHNOLOGY: "Technology",
  MANUFACTURING: "Manufacturing",
  RETAIL: "Retail",
  HEALTHCARE: "Healthcare",
  LOGISTICS: "Logistics",
  AGRICULTURE: "Agriculture",
  ENERGY: "Energy",
  FINANCIAL_SERVICES: "Financial services",
};

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  FULL_ACQUISITION: "Full acquisition",
  MAJORITY_STAKE: "Majority stake",
  MINORITY_STAKE: "Minority stake",
  ASSET_PURCHASE: "Asset purchase",
};

export const REGION_LABELS: Record<Region, string> = {
  UKRAINE: "Ukraine",
  EUROPE: "Europe",
  UK: "United Kingdom",
  NORTH_AMERICA: "North America",
  MIDDLE_EAST: "Middle East",
  ASIA: "Asia",
};

export const INDUSTRIES = Object.keys(INDUSTRY_LABELS) as Industry[];
export const DEAL_TYPES = Object.keys(DEAL_TYPE_LABELS) as DealType[];
export const REGIONS = Object.keys(REGION_LABELS) as Region[];