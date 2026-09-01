import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { UserSwitcher } from "./UserSwitcher";

export async function Header() {
  const [user, users] = await Promise.all([
    getCurrentUser(),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, companyName: true, role: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
  ]);

  const links =
    user?.role === "SELLER"
      ? [
          ["/buyers", "Buyers"],
          ["/my/assets", "My assets"],
          ["/my/inquiries", "My inquiries"],
        ]
      : user?.role === "BUYER"
      ? [
          ["/assets", "Assets"],
          ["/my/profile", "My profile"],
          ["/my/inquiries", "My inquiries"],
        ]
      : user?.role === "MANAGER"
      ? [
          ["/assets", "Assets"],
          ["/buyers", "Buyers"],
          ["/admin", "Admin"],
        ]
      : [
          ["/assets", "Assets"],
          ["/buyers", "Buyers"],
        ];

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-8 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            N5Deal
          </Link>
          <nav className="flex gap-4 text-sm">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className="text-gray-600 hover:text-gray-900">
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="text-xs uppercase tracking-wide text-gray-500">
              {user.role.toLowerCase()}
            </span>
          )}
          <UserSwitcher users={users} currentId={user?.id ?? null} />
        </div>
      </div>
    </header>
  );
}