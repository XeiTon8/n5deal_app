import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseAssetFilters, buildAssetWhere, type SearchParams } from "@/lib/filters";
import { INDUSTRY_LABELS, DEAL_TYPE_LABELS, REGION_LABELS } from "@/lib/constants";
import { AssetFilters } from "@/components/AssetFilters";

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
      <h1 className="text-3xl font-semibold tracking-tight">Assets</h1>
      <p className="mt-1 text-sm text-muted">
        {assets.length} {assets.length === 1 ? "listing" : "listings"}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[280px_1fr]">
        <aside>
          <AssetFilters />
        </aside>

        {assets.length === 0 ? (
          <p className="text-sm text-muted">
            No assets match these filters. Try widening the price range or removing some
            criteria.
          </p>
        ) : (
          <ul className="space-y-3">
            {assets.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/assets/${a.id}`}
                  className="card block p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-semibold tracking-tight">{a.title}</h3>
                    <span className="shrink-0 text-xs text-accent">Listed</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <div className="field">
                      <span className="field-label">Industry</span>
                      <span className="field-value">{INDUSTRY_LABELS[a.industry]}</span>
                    </div>
                    <div className="field">
                      <span className="field-label">Deal type</span>
                      <span className="field-value">{DEAL_TYPE_LABELS[a.dealType]}</span>
                    </div>
                    <div className="field">
                      <span className="field-label">Region</span>
                      <span className="field-value">{REGION_LABELS[a.region]}</span>
                    </div>
                    <div className="field">
                      <span className="field-label">Asking price</span>
                      <span className="field-value text-brand">
                        ${a.askingPrice.toLocaleString("en-US")}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-2 text-sm text-muted">{a.description}</p>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <span className="text-sm text-muted">
                      {a.seller.companyName ?? a.seller.name}
                      {a.stakePercent !== null && ` · ${a.stakePercent}% stake`}
                    </span>
                    <span className="btn-secondary shrink-0">View asset</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}