import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "demo_user_id";

export async function getCurrentUser() {
  const store = await cookies();
  const id = store.get(COOKIE_NAME)?.value;
  if (!id) return null;

  return prisma.user.findFirst({
    where: { id, status: "ACTIVE" },
    include: { buyerProfile: { select: { id: true } } },
  });
}

export async function requireUser(role?: "BUYER" | "SELLER" | "MANAGER") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  if (role && user.role !== role) throw new Error("Wrong role");
  return user;
}

export { COOKIE_NAME };