import { prisma } from "@/lib/prisma";
import { parseAssetFilters, buildAssetWhere, type SearchParams } from "@/lib/filters";
import { INDUSTRY_LABELS, DEAL_TYPE_LABELS, REGION_LABELS } from "@/lib/constants";
import { AssetFilters } from "@/components/AssetFilters";
import Link from "next/link";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = parseAssetFilters(sp);

  const assets = await prisma.asset.findMany({
    where: buildAssetWhere(filters),
    include: { seller: { select: { name: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-semibold">Assets</h1>
      <p className="mt-1 text-sm text-gray-500">
        {assets.length} {assets.length === 1 ? "listing" : "listings"}
      </p>


       <div className="mt-6 grid gap-6 md:grid-cols-[280px_1fr]">
        <aside>
          <AssetFilters />
        </aside>

         <ul className="mt-6 space-y-3">
        {assets.map((a) => (
          <li key={a.id} className="rounded-lg border p-4">
            <Link
                href={`/assets/${a.id}`}
                className="block rounded-lg 
                border p-4 transition-colors hover:border-gray-400">
                <div className="font-medium">{a.title}</div>
                    <div className="mt-1 text-sm text-gray-600">
                        {INDUSTRY_LABELS[a.industry]} · {DEAL_TYPE_LABELS[a.dealType]} ·{" "}
                        {REGION_LABELS[a.region]}
                    </div>
                    <div className="mt-2 text-sm">
                        ${a.askingPrice.toLocaleString("en-US")}
                        {a.stakePercent !== null && ` for ${a.stakePercent}%`}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                        {a.seller.companyName ?? a.seller.name}
                    </div>
            </Link>
          </li>
        ))}
      </ul>

      </div>
     
    </main>
  );
}