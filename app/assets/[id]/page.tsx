import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { INDUSTRY_LABELS, DEAL_TYPE_LABELS, REGION_LABELS } from "@/lib/constants";
import { BackLink } from "@/components/BackLink";

import { getCurrentUser } from "@/lib/session";
import { ContactForm } from "@/components/ContactForm";

function money(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

export default async function AssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

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

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{asset.title}</h1>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {[
          INDUSTRY_LABELS[asset.industry],
          DEAL_TYPE_LABELS[asset.dealType],
          REGION_LABELS[asset.region],
        ].map((label) => (
          <span key={label} className="pill">
            {label}
          </span>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {financials.map((item) => (
          <div key={item.label} className="field bg-white">
            <span className="field-label">{item.label}</span>
            <span
              className={`field-value ${
                item.value
                  ? item.label === "Asking price"
                    ? "text-brand"
                    : ""
                  : "font-normal text-muted"
              }`}
            >
              {item.value ?? "Not disclosed"}
            </span>
          </div>
        ))}
      </div>

      <section className="card mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">About</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{asset.description}</p>
      </section>

      <section className="card mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">Seller</h2>
        <p className="mt-1 font-medium">{asset.seller.companyName ?? asset.seller.name}</p>
        {asset.seller.companyName && (
          <p className="text-sm text-gray-600">{asset.seller.name}</p>
        )}
          {currentUser?.role === "BUYER" ? (
            <div className="mt-4">
              <ContactForm
                assetId={asset.id}
                placeholder="Introduce yourself and say what you would like to know about this business."
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              Switch to a buyer account to contact this seller.
            </p>
        )}
      </section>

      <p className="mt-6 text-xs text-gray-400">
        Listed {asset.createdAt.toLocaleDateString("en-GB", { dateStyle: "medium" })}
      </p>
    </main>
  );
}