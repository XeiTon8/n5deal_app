import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { BackLink } from "@/components/BackLink";
import { ContactForm } from "@/components/ContactForm";
import { INDUSTRY_LABELS, DEAL_TYPE_LABELS, REGION_LABELS } from "@/lib/constants";
import { rankAssets } from "@/lib/matching";
import Link from 'next/link'

export default async function BuyerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [buyer, currentUser] = await Promise.all([
    prisma.user.findFirst({
      where: { id, role: "BUYER", status: "ACTIVE", buyerProfile: { isNot: null } },
      include: { buyerProfile: true },
    }),
    getCurrentUser(),
  ]);

  if (!buyer?.buyerProfile) notFound();

  const profile = buyer.buyerProfile;

  const candidates = await prisma.asset.findMany({
    where: { status: "PUBLISHED", seller: { status: "ACTIVE" } },
  });

  const matches = rankAssets(candidates, profile);

  const interests = [
    { label: "Industries", values: profile.industries.map((v) => INDUSTRY_LABELS[v]) },
    { label: "Deal types", values: profile.dealTypes.map((v) => DEAL_TYPE_LABELS[v]) },
    { label: "Regions", values: profile.regions.map((v) => REGION_LABELS[v]) },
  ];

  return (
    <main className="mx-auto max-w-3xl p-8">
      <BackLink fallback="/buyers" label="Back to buyers" />

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        {buyer.companyName ?? buyer.name}
      </h1>
      {buyer.companyName && <p className="text-sm text-muted">{buyer.name}</p>}

      <p className="mt-3 text-lg">{profile.headline}</p>

      <div className="field mt-6 bg-white">
        <span className="field-label">Budget range</span>
        <span className="field-value text-brand">
          ${profile.budgetMin.toLocaleString("en-US")} – $
          {profile.budgetMax.toLocaleString("en-US")}
        </span>
      </div>

      <section className="card mt-6 space-y-4 p-5">
        {interests.map((group) => (
          <div key={group.label}>
            <div className="mb-2 text-[11px] uppercase tracking-wide text-muted">
              {group.label}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.values.map((value) => (
                <span key={value} className="pill">
                  {value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="card mt-6 p-5">
        <h2 className="text-[11px] uppercase tracking-wide text-muted">
          Investment thesis
        </h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
          {profile.description}
        </p>
      </section>

       {matches.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[11px] uppercase tracking-wide text-muted">
            Suggested assets
          </h2>
          <p className="mt-1 text-sm text-muted">
            Ranked by how well each listing matches this mandate.
          </p>

          <ul className="mt-3 space-y-2">
            {matches.map(({ asset, score, reasons }) => (
              <li key={asset.id}>
                <Link
                  href={`/assets/${asset.id}`}
                  className="card block p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-semibold">{asset.title}</span>
                    <span className="shrink-0 text-xs text-muted">{score}% match</span>
                  </div>

                  <div className="mt-1 text-sm text-muted">
                    {INDUSTRY_LABELS[asset.industry]} ·{" "}
                    {DEAL_TYPE_LABELS[asset.dealType]} · $
                    {asset.askingPrice.toLocaleString("en-US")}
                  </div>

                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {reasons.map((reason) => (
                      <li key={reason} className="pill">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card mt-6 p-5">
        <h2 className="text-[11px] uppercase tracking-wide text-muted">Contact</h2>
        {currentUser?.role === "SELLER" ? (
          <div className="mt-3">
            <ContactForm
              buyerId={buyer.id}
              placeholder="Describe the asset you think fits this mandate."
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Switch to a seller account to contact this buyer.
          </p>
        )}
      </section>
    </main>
  );
}
