import { z } from "zod";
import { INDUSTRIES, DEAL_TYPES, REGIONS } from "./constants";

const optionalMoney = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "Must be a positive number");

export const assetSchema = z
  .object({
    title: z.string().trim().min(5, "Title must be at least 5 characters").max(120),
    description: z
      .string()
      .trim()
      .min(40, "Describe the asset in at least 40 characters"),
    industry: z.enum(INDUSTRIES as [string, ...string[]]),
    dealType: z.enum(DEAL_TYPES as [string, ...string[]]),
    region: z.enum(REGIONS as [string, ...string[]]),
    askingPrice: z.coerce.number().positive("Asking price is required"),
    annualRevenue: optionalMoney,
    ebitda: optionalMoney,
    stakePercent: z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : Number(v)))
      .refine((v) => v === null || (v > 0 && v <= 100), "Stake must be between 1 and 100"),
  })
  .refine(
    (d) => d.ebitda === null || d.annualRevenue === null || d.ebitda <= d.annualRevenue,
    { message: "EBITDA cannot exceed annual revenue", path: ["ebitda"] }
  );

  export const buyerProfileSchema = z
  .object({
    headline: z.string().trim().min(10, "Headline must be at least 10 characters").max(140),
    description: z
      .string()
      .trim()
      .min(40, "Describe your investment thesis in at least 40 characters"),
    industries: z.array(z.enum(INDUSTRIES as [string, ...string[]])).min(1, "Pick at least one industry"),
    dealTypes: z.array(z.enum(DEAL_TYPES as [string, ...string[]])).min(1, "Pick at least one deal type"),
    regions: z.array(z.enum(REGIONS as [string, ...string[]])).min(1, "Pick at least one region"),
    budgetMin: z.coerce.number().min(0),
    budgetMax: z.coerce.number().positive("Upper budget is required"),
  })
  .refine((d) => d.budgetMax >= d.budgetMin, {
    message: "Upper budget must be greater than the lower one",
    path: ["budgetMax"],
  });

  export const inquirySchema = z.object({
  message: z
    .string()
    .trim()
    .min(20, "Message must be at least 20 characters")
    .max(2000),
});

export type AssetFormErrors = Record<string, string[]>;