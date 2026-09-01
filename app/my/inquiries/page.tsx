import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function InquiriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/assets");

  const [received, sent] = await Promise.all([
    prisma.inquiry.findMany({
      where: { recipientId: user.id },
      include: {
        sender: { select: { name: true, companyName: true, role: true, id: true } },
        asset: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inquiry.findMany({
      where: { senderId: user.id },
      include: {
        recipient: { select: { name: true, companyName: true, role: true, id: true } },
        asset: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">My inquiries</h1>

      <Section title={`Received (${received.length})`} empty="No one has contacted you yet.">
        {received.map((i) => (
          <InquiryCard
            key={i.id}
            party={i.sender}
            partyLabel="From"
            asset={i.asset}
            message={i.message}
            createdAt={i.createdAt}
          />
        ))}
      </Section>

      <Section title={`Sent (${sent.length})`} empty="You have not contacted anyone yet.">
        {sent.map((i) => (
          <InquiryCard
            key={i.id}
            party={i.recipient}
            partyLabel="To"
            asset={i.asset}
            message={i.message}
            createdAt={i.createdAt}
          />
        ))}
      </Section>
    </main>
  );
}

function Section({
  title, empty, children,
}: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">{title}</h2>
      {children.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-3">{children}</ul>
      )}
    </section>
  );
}

function InquiryCard({
  party, partyLabel, asset, message, createdAt,
}: {
  party: { id: string; name: string; companyName: string | null; role: string };
  partyLabel: string;
  asset: { id: string; title: string } | null;
  message: string;
  createdAt: Date;
}) {
  const href = party.role === "BUYER" ? `/buyers/${party.id}` : null;
  const name = party.companyName ?? party.name;

  return (
    <li className="rounded-lg border p-4">
      <div className="flex items-baseline justify-between gap-4">
        <div className="text-sm">
          <span className="text-gray-500">{partyLabel} </span>
          {href ? (
            <Link href={href} className="font-medium hover:underline">{name}</Link>
          ) : (
            <span className="font-medium">{name}</span>
          )}
        </div>
        <time className="shrink-0 text-xs text-gray-500">
          {createdAt.toLocaleDateString("en-GB", { dateStyle: "medium" })}
        </time>
      </div>

      {asset && (
        <p className="mt-1 text-sm text-gray-600">
          Re: <Link href={`/assets/${asset.id}`} className="hover:underline">{asset.title}</Link>
        </p>
      )}

      <p className="mt-2 whitespace-pre-line text-sm">{message}</p>
    </li>
  );
}