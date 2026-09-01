"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { assetSchema } from "@/lib/validation";
import type { Industry, DealType, Region } from "@/lib/generated/prisma/client";

export type FormState = { errors?: Record<string, string[]>; message?: string };

export async function createAsset(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  let sellerId: string;
  try {
    const user = await requireUser("SELLER");
    sellerId = user.id;
  } catch {
    return { message: "Switch to a seller account to publish an asset." };
  }

  const parsed = assetSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;
  const asset = await prisma.asset.create({
    data: {
      sellerId,
      title: d.title,
      description: d.description,
      industry: d.industry as Industry,
      dealType: d.dealType as DealType,
      region: d.region as Region,
      askingPrice: d.askingPrice,
      annualRevenue: d.annualRevenue,
      ebitda: d.ebitda,
      stakePercent: d.stakePercent,
    },
  });

  revalidatePath("/assets");
  redirect(`/assets/${asset.id}`);
}