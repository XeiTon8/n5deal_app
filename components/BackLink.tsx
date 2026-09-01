"use client";

import { useRouter } from "next/navigation";

export function BackLink({ fallback, label }: { fallback: string; label: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="cursor-pointer text-sm text-gray-500 hover:text-blue-500"
    >
      {label}
    </button>
  );
}