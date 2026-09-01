"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { inquirySchema } from "@/lib/validation";
import type { FormState } from "./assets";

export async function sendInquiry(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Select a demo user first." };

  const parsed = inquirySchema.safeParse({ message: formData.get("message") });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const assetId = formData.get("assetId");
  const buyerId = formData.get("buyerId");

  let recipientId: string;
  let linkedAssetId: string | null = null;

  if (typeof assetId === "string" && assetId) {

    if (user.role !== "BUYER") return { message: "Only buyers can contact sellers here." };

    const asset = await prisma.asset.findFirst({
      where: { id: assetId, status: "PUBLISHED", seller: { status: "ACTIVE" } },
      select: { id: true, sellerId: true },
    });
    if (!asset) return { message: "This listing is no longer available." };

    recipientId = asset.sellerId;
    linkedAssetId = asset.id;
  } else if (typeof buyerId === "string" && buyerId) {

    if (user.role !== "SELLER") return { message: "Only sellers can contact buyers here." };

    const buyer = await prisma.user.findFirst({
      where: { id: buyerId, role: "BUYER", status: "ACTIVE" },
      select: { id: true },
    });
    if (!buyer) return { message: "This buyer is no longer available." };

    recipientId = buyer.id;
  } else {
    return { message: "Nothing to contact." };
  }

  const existing = await prisma.inquiry.findFirst({
    where: { senderId: user.id, recipientId, assetId: linkedAssetId },
    select: { id: true },
  });
  if (existing) {
    return { message: "You have already sent an inquiry about this. Check My inquiries." };
  }

  await prisma.inquiry.create({
    data: { senderId: user.id, recipientId, assetId: linkedAssetId, message: parsed.data.message },
  });

  revalidatePath("/my/inquiries");
  return { message: "Inquiry sent." };
}