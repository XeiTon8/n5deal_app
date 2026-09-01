import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { INDUSTRY_LABELS, DEAL_TYPE_LABELS, REGION_LABELS } from "@/lib/constants";
import { BackLink } from "@/components/BackLink";

function money(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

export default async function AssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const asset = await prisma.asset.findFirst({
    where: {
      id,
      status: "PUBLISHED",
      seller: { status: "ACTIVE" },
    },
    include: {
      seller: { select: { id: true, name: true, companyName: true } },
    },
  });

  if (!asset) notFound();

  const financials = [
    { label: "Asking price", value: money(asset.askingPrice) },
    { label: "Annual revenue", value: asset.annualRevenue ? money(asset.annualRevenue) : null },
    { label: "EBITDA", value: asset.ebitda ? money(asset.ebitda) : null },
    { label: "Stake offered", value: asset.stakePercent ? `${asset.stakePercent}%` : null },
  ];

  return (
    <main className="mx-auto max-w-3xl p-8">
      <BackLink fallback="/assets" label="Back to assets" />

      <h1 className="mt-4 text-2xl font-semibold">{asset.title}</h1>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {[
          INDUSTRY_LABELS[asset.industry],
          DEAL_TYPE_LABELS[asset.dealType],
          REGION_LABELS[asset.region],
        ].map((label) => (
          <span key={label} className="rounded-full border px-2.5 py-0.5 text-xs text-gray-600">
            {label}
          </span>
        ))}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
        {financials.map((item) => (
          <div key={item.label}>
            <dt className="text-xs uppercase tracking-wide text-gray-500">{item.label}</dt>
            <dd className={`mt-1 text-sm ${item.value ? "font-medium" : "text-gray-400"}`}>
              {item.value ?? "Not disclosed"}
            </dd>
          </div>
        ))}
      </dl>

      <section className="mt-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">About</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{asset.description}</p>
      </section>

      <section className="mt-6 rounded-lg border p-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">Seller</h2>
        <p className="mt-1 font-medium">{asset.seller.companyName ?? asset.seller.name}</p>
        {asset.seller.companyName && (
          <p className="text-sm text-gray-600">{asset.seller.name}</p>
        )}
        <p className="mt-3 text-sm text-gray-400">Contact form comes on day 3.</p>
      </section>

      <p className="mt-6 text-xs text-gray-400">
        Listed {asset.createdAt.toLocaleDateString("en-GB", { dateStyle: "medium" })}
      </p>
    </main>
  );
}