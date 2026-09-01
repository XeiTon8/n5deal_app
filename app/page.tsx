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
      <h1 className="text-4xl font-semibold tracking-tight">
        M&amp;A opportunities and financial assets
      </h1>
      <p className="mt-4 max-w-xl text-lg text-gray-600">
        A marketplace where sellers list businesses for sale and buyers publish what they
        are looking for.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/assets"
          className="rounded-md bg-gray-900 px-5 py-2.5 text-sm text-white"
        >
          Browse {assetCount} assets
        </Link>
        <Link href="/buyers" className="rounded-md border px-5 py-2.5 text-sm">
          Browse {buyerCount} buyers
        </Link>
      </div>

      {!user && (
        <div className="mt-12 rounded-lg border border-dashed p-6">
          <h2 className="text-sm font-medium">This is a prototype</h2>
          <p className="mt-2 text-sm text-gray-600">
            There is no sign-up. Pick a demo user in the header to act as a buyer, a seller
            or the platform manager — the available actions change with the role.
          </p>
        </div>
      )}
    </main>
  );
}