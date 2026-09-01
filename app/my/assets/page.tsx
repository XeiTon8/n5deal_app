import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { INDUSTRY_LABELS, DEAL_TYPE_LABELS } from "@/lib/constants";

export default async function MyAssetsPage() {
  const user = await getCurrentUser();
  if (user?.role !== "SELLER") redirect("/assets");

  const assets = await prisma.asset.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">My assets</h1>
        <Link href="/my/assets/new" className="btn-primary">
          Publish asset
        </Link>
      </div>

      {assets.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-line p-8 text-center">
          <p className="text-sm text-muted">You have not published anything yet.</p>
          <Link href="/my/assets/new" className="mt-2 inline-block text-sm text-brand hover:underline">
            Publish your first asset
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {assets.map((a) => (
            <li key={a.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {a.status === "PUBLISHED" ? (
                    <Link
                      href={`/assets/${a.id}`}
                      className="font-semibold hover:underline"
                    >
                      {a.title}
                    </Link>
                  ) : (
                    <span className="font-semibold">{a.title}</span>
                  )}
                  <div className="mt-1 text-sm text-muted">
                    {INDUSTRY_LABELS[a.industry]} · {DEAL_TYPE_LABELS[a.dealType]} · $
                    {a.askingPrice.toLocaleString("en-US")}
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>

              {a.status === "SUSPENDED" && a.suspensionReason && (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  Suspended by the platform: {a.suspensionReason}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PUBLISHED: "border-green-300 bg-green-50 text-green-700",
    SUSPENDED: "border-amber-300 bg-amber-50 text-amber-800",
    DRAFT: "border-line bg-page text-muted",
  };

  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs ${styles[status]}`}
    >
      {status.toLowerCase()}
    </span>
  );
}
