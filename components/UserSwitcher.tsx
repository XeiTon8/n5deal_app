"use client";

import { useTransition } from "react";
import { switchUser } from "@/app/actions/session";

type Option = { id: string; name: string; companyName: string | null; role: string };

export function UserSwitcher({
  users,
  currentId,
}: {
  users: Option[];
  currentId: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  const grouped = {
    BUYER: users.filter((u) => u.role === "BUYER"),
    SELLER: users.filter((u) => u.role === "SELLER"),
    MANAGER: users.filter((u) => u.role === "MANAGER"),
  };

  return (
    <select
      value={currentId ?? ""}
      disabled={isPending}
      onChange={(e) => startTransition(() => switchUser(e.target.value))}
      className="cursor-pointer rounded-full border border-line bg-white px-3 py-1.5 text-sm"
    >
      <option value="" disabled>
        Select a demo user
      </option>
      {Object.entries(grouped).map(([role, list]) => (
        <optgroup key={role} label={role.toLowerCase()}>
          {list.map((u) => (
            <option key={u.id} value={u.id}>
              {u.companyName ?? u.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}