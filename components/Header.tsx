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
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-8 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            N5<span className="text-brand">Deal</span>
          </Link>
          <nav className="flex gap-1 text-sm">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-page hover:text-ink"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden text-[11px] uppercase tracking-wide text-muted sm:block">
              {user.role.toLowerCase()}
            </span>
          )}
          <UserSwitcher users={users} currentId={user?.id ?? null} />
        </div>
      </div>
    </header>
  );
}