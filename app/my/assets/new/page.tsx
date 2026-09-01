import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AssetForm } from "@/components/AssetForm";

export default async function NewAssetPage() {
  const user = await getCurrentUser();
  if (user?.role !== "SELLER") redirect("/assets");

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Publish an asset</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Listed as {user.companyName ?? user.name}.
      </p>
      <AssetForm />
    </main>
  );
}
