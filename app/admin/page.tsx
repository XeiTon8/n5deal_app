import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { type SearchParams } from "@/lib/filters";
import { INDUSTRY_LABELS } from "@/lib/constants";
import { SuspendButton, RestoreButton } from "@/components/ModerationActionts";
import {
  suspendUser, restoreUser, suspendAsset, restoreAsset,
} from "@/app/actions/moderation";

const TABS = [
  ["buyers", "Buyers"],
  ["sellers", "Sellers"],
  ["assets", "Assets"],
] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "MANAGER") redirect("/assets");

  const sp = await searchParams;
  const tab = typeof sp.tab === "string" && TABS.some(([t]) => t === sp.tab) ? sp.tab : "buyers";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const onlySuspended = sp.status === "suspended";

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-semibold">Platform administration</h1>

      <nav className="mt-6 flex gap-1 border-b">
        {TABS.map(([value, label]) => (
          <Link
            key={value}
            href={`/admin?tab=${value}`}
            className={`px-4 py-2 text-sm ${
              tab === value
                ? "border-b-2 border-gray-900 font-medium"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <form className="mt-4 flex gap-2">
        <input type="hidden" name="tab" value={tab} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or title"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="status"
            value="suspended"
            defaultChecked={onlySuspended}
          />
          Suspended only
        </label>
        <button
          type="submit"
          className="cursor-pointer rounded-md border px-4 py-2 text-sm"
        >
          Apply
        </button>
      </form>

      <div className="mt-6">
        {tab === "assets" ? (
          <AssetsTab q={q} onlySuspended={onlySuspended} />
        ) : (
          <ParticipantsTab
            role={tab === "buyers" ? "BUYER" : "SELLER"}
            q={q}
            onlySuspended={onlySuspended}
          />
        )}
      </div>
    </main>
  );
}

async function ParticipantsTab({
  role, q, onlySuspended,
}: {
  role: "BUYER" | "SELLER";
  q: string;
  onlySuspended: boolean;
}) {
  const users = await prisma.user.findMany({
    where: {
      role,
      ...(onlySuspended ? { status: "SUSPENDED" } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { companyName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      buyerProfile: { select: { headline: true } },
      _count: { select: { assets: true } },
    },
    orderBy: [{ status: "desc" }, { name: "asc" }],
  });

  if (users.length === 0) {
    return <p className="text-sm text-gray-500">Nothing matches this search.</p>;
  }

  return (
    <ul className="space-y-2">
      {users.map((u) => (
        <li key={u.id} className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-medium">{u.companyName ?? u.name}</div>
              <div className="text-sm text-gray-600">
                {u.email}
                {role === "SELLER" && ` · ${u._count.assets} listings`}
              </div>
              {u.buyerProfile && (
                <div className="mt-1 text-sm text-gray-600">{u.buyerProfile.headline}</div>
              )}
            </div>

            <div className="shrink-0">
              {u.status === "ACTIVE" ? (
                <SuspendButton id={u.id} action={suspendUser} />
              ) : (
                <RestoreButton id={u.id} action={restoreUser} />
              )}
            </div>
          </div>

          {u.status === "SUSPENDED" && (
            <p className="mt-3 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
              Suspended{u.statusChangedAt && ` on ${u.statusChangedAt.toLocaleDateString("en-GB")}`}
              {u.suspensionReason && `: ${u.suspensionReason}`}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

async function AssetsTab({ q, onlySuspended }: { q: string; onlySuspended: boolean }) {
  const assets = await prisma.asset.findMany({
    where: {
      ...(onlySuspended ? { status: "SUSPENDED" } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    },
    include: { seller: { select: { name: true, companyName: true, status: true } } },
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
  });

  if (assets.length === 0) {
    return <p className="text-sm text-gray-500">Nothing matches this search.</p>;
  }

  return (
    <ul className="space-y-2">
      {assets.map((a) => (
        <li key={a.id} className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-gray-600">
                {INDUSTRY_LABELS[a.industry]} · ${a.askingPrice.toLocaleString("en-US")} ·{" "}
                {a.seller.companyName ?? a.seller.name}
              </div>
            </div>

            <div className="shrink-0">
              {a.status === "SUSPENDED" ? (
                <RestoreButton id={a.id} action={restoreAsset} />
              ) : (
                <SuspendButton id={a.id} action={suspendAsset} />
              )}
            </div>
          </div>

          {a.seller.status === "SUSPENDED" && a.status !== "SUSPENDED" && (
            <p className="mt-3 rounded-md bg-gray-100 p-2 text-xs text-gray-600">
              Hidden from the marketplace because the seller is suspended.
            </p>
          )}

          {a.status === "SUSPENDED" && a.suspensionReason && (
            <p className="mt-3 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
              Suspended: {a.suspensionReason}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}