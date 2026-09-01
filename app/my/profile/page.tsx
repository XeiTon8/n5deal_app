import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { BuyerProfileForm } from "@/components/BuyerProfileForm";

export default async function MyProfilePage() {
  const user = await getCurrentUser();
  if (user?.role !== "BUYER") redirect("/buyers");

  const profile = await prisma.buyerProfile.findUnique({
    where: { userId: user.id },
  });

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">
        {profile ? "Edit your profile" : "Create your buyer profile"}
      </h1>
      <p className="mt-1 mb-6 text-sm text-gray-500">
        {profile
          ? "Changes appear in the buyer directory immediately."
          : "Until you publish a profile, sellers cannot find you in the directory."}
      </p>
      <BuyerProfileForm initial={profile} />
    </main>
  );
}