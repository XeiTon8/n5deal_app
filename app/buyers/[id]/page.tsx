import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BackLink } from "@/components/BackLink";
import { INDUSTRY_LABELS, DEAL_TYPE_LABELS, REGION_LABELS } from "@/lib/constants";

import { getCurrentUser } from "@/lib/session";
import { ContactForm } from "@/components/ContactForm";

export default async function BuyerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const buyer = await prisma.user.findFirst({
    where: { id, role: "BUYER", status: "ACTIVE", buyerProfile: { isNot: null } },
    include: { buyerProfile: true },
  });

  if (!buyer?.buyerProfile) notFound();

  const profile = buyer.buyerProfile;

  const interests = [
    { label: "Industries", values: profile.industries.map((v) => INDUSTRY_LABELS[v]) },
    { label: "Deal types", values: profile.dealTypes.map((v) => DEAL_TYPE_LABELS[v]) },
    { label: "Regions", values: profile.regions.map((v) => REGION_LABELS[v]) },
  ];

  return (
    <main className="mx-auto max-w-3xl p-8">
      <BackLink fallback="/buyers" label="Back to buyers" />

      <h1 className="mt-4 text-2xl font-semibold">{buyer.companyName ?? buyer.name}</h1>
      {buyer.companyName && <p className="text-sm text-gray-600">{buyer.name}</p>}

      <p className="mt-3 text-lg">{profile.headline}</p>

      <div className="mt-6 rounded-lg border p-4">
        <div className="text-xs uppercase tracking-wide text-gray-500">Budget range</div>
        <div className="mt-1 text-lg font-medium">
          ${profile.budgetMin.toLocaleString("en-US")} – $
          {profile.budgetMax.toLocaleString("en-US")}
        </div>
      </div>

      <section className="mt-6 space-y-4">
        {interests.map((group) => (
          <div key={group.label}>
            <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">
              {group.label}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.values.map((value) => (
                <span
                  key={value}
                  className="rounded-full border px-2.5 py-0.5 text-xs text-gray-600"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="text-xs uppercase tracking-wide text-gray-500">
          Investment thesis
        </h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
          {profile.description}
        </p>
      </section>

      <section className="mt-6 rounded-lg border p-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Contact
        </h2>
        {currentUser?.role === "SELLER" ? (
          <div className="mt-3">
            <ContactForm
              buyerId={buyer.id}
              placeholder="Describe the asset you think fits this mandate."
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            Switch to a seller account to contact this buyer.
          </p>
        )}
      </section>
    </main>
  );
}