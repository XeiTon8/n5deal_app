import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function HomePage() {
  const [user, assetCount, buyerCount] = await Promise.all([
    getCurrentUser(),
    prisma.asset.count({ where: { status: "PUBLISHED", seller: { status: "ACTIVE" } } }),
    prisma.user.count({
      where: { role: "BUYER", status: "ACTIVE", buyerProfile: { isNot: null } },
    }),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-8 py-16">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        M&amp;A opportunities and financial assets
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        A marketplace where sellers list businesses for sale and buyers publish what they
        are looking for.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/assets" className="btn-primary">
          Browse {assetCount} assets
        </Link>
        <Link href="/buyers" className="btn-secondary">
          Browse {buyerCount} buyers
        </Link>
      </div>

      {!user && (
        <div className="card mt-12 p-6">
          <h2 className="text-sm font-medium">This is a prototype</h2>
          <p className="mt-2 text-sm text-muted">
            There is no sign-up. Pick a demo user in the header to act as a buyer, a seller
            or the platform manager — the available actions change with the role.
          </p>
        </div>
      )}
    </main>
  );
}
