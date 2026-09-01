import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseBuyerFilters, buildBuyerWhere, type SearchParams } from "@/lib/filters";
import { INDUSTRY_LABELS } from "@/lib/constants";
import { BuyerFilters } from "@/components/BuyerFilters";

export default async function BuyersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = parseBuyerFilters(sp);

  const buyers = await prisma.user.findMany({
    where: buildBuyerWhere(filters),
    include: { buyerProfile: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-semibold">Buyers</h1>
      <p className="mt-1 text-sm text-gray-500">
        {buyers.length} {buyers.length === 1 ? "buyer" : "buyers"}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[280px_1fr]">
        <aside>
          <BuyerFilters />
        </aside>

        {buyers.length === 0 ? (
          <p className="text-sm text-gray-500">
            No buyers match these filters. Try widening the budget range or removing some
            interests.
          </p>
        ) : (
          <ul className="space-y-3">
            {buyers.map((buyer) => {
              const profile = buyer.buyerProfile!;
              return (
                <li key={buyer.id}>
                  <Link
                    href={`/buyers/${buyer.id}`}
                    className="block rounded-lg border p-4 transition-colors hover:border-gray-400"
                  >
                    <div className="font-medium">{buyer.companyName ?? buyer.name}</div>
                    <div className="mt-1 text-sm text-gray-600">{profile.headline}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {profile.industries.map((industry) => (
                        <span
                          key={industry}
                          className="rounded-full border px-2.5 py-0.5 text-xs text-gray-600"
                        >
                          {INDUSTRY_LABELS[industry]}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 text-sm">
                      ${profile.budgetMin.toLocaleString("en-US")} – $
                      {profile.budgetMax.toLocaleString("en-US")}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}