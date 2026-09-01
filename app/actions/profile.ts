"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { buyerProfileSchema } from "@/lib/validation";
import type { Industry, DealType, Region } from "@/lib/generated/prisma/client";
import type { FormState } from "./assets";

export async function saveBuyerProfile(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  let userId: string;
  try {
    const user = await requireUser("BUYER");
    userId = user.id;
  } catch {
    return { message: "Switch to a buyer account to edit a profile." };
  }

  const parsed = buyerProfileSchema.safeParse({
    headline: formData.get("headline"),
    description: formData.get("description"),
    industries: formData.getAll("industries"),
    dealTypes: formData.getAll("dealTypes"),
    regions: formData.getAll("regions"),
    budgetMin: formData.get("budgetMin"),
    budgetMax: formData.get("budgetMax"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;
  const payload = {
    headline: d.headline,
    description: d.description,
    industries: d.industries as Industry[],
    dealTypes: d.dealTypes as DealType[],
    regions: d.regions as Region[],
    budgetMin: d.budgetMin,
    budgetMax: d.budgetMax,
  };

  await prisma.buyerProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });

  revalidatePath("/buyers");
  redirect(`/buyers/${userId}`);
}