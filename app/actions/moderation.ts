"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

async function assertManager() {
  await requireUser("MANAGER");
}

export async function suspendUser(formData: FormData) {
  await assertManager();

  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id || reason.length < 5) return;

  await prisma.user.update({
    where: { id },
    data: { status: "SUSPENDED", suspensionReason: reason, statusChangedAt: new Date() },
  });

  revalidatePath("/admin");
  revalidatePath("/assets");
  revalidatePath("/buyers");
}

export async function restoreUser(formData: FormData) {
  await assertManager();

  const id = String(formData.get("id"));
  if (!id) return;

  await prisma.user.update({
    where: { id },
    data: { status: "ACTIVE", suspensionReason: null, statusChangedAt: new Date() },
  });

  revalidatePath("/admin");
  revalidatePath("/assets");
  revalidatePath("/buyers");
}

export async function suspendAsset(formData: FormData) {
  await assertManager();

  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id || reason.length < 5) return;

  await prisma.asset.update({
    where: { id },
    data: { status: "SUSPENDED", suspensionReason: reason, statusChangedAt: new Date() },
  });

  revalidatePath("/admin");
  revalidatePath("/assets");
}

export async function restoreAsset(formData: FormData) {
  await assertManager();

  const id = String(formData.get("id"));
  if (!id) return;

  await prisma.asset.update({
    where: { id },
    data: { status: "PUBLISHED", suspensionReason: null, statusChangedAt: new Date() },
  });

  revalidatePath("/admin");
  revalidatePath("/assets");
}