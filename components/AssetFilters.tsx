"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  INDUSTRIES,
  DEAL_TYPES,
  REGIONS,
  INDUSTRY_LABELS,
  DEAL_TYPE_LABELS,
  REGION_LABELS,
} from "@/lib/constants";

export function AssetFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const apply = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (query === current) return;

    const timer = setTimeout(() => {
      apply((params) => {
        if (query) params.set("q", query);
        else params.delete("q");
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [query, searchParams, apply]);

  const toggle = (key: string, value: string) => {
    apply((params) => {
      const current = params.getAll(key);
      params.delete(key);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      next.forEach((v) => params.append(key, v));
    });
  };

  const setNumber = (key: string, value: string) => {
    apply((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  };

  const isActive = (key: string, value: string) =>
    searchParams.getAll(key).includes(value);

  const hasFilters = Array.from(searchParams.keys()).length > 0;

  return (
    <div
      className={`space-y-5 rounded-lg border p-4 transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search assets"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <FilterGroup
        title="Industry"
        options={INDUSTRIES}
        labels={INDUSTRY_LABELS}
        isActive={(v) => isActive("industry", v)}
        onToggle={(v) => toggle("industry", v)}
      />

      <FilterGroup
        title="Deal type"
        options={DEAL_TYPES}
        labels={DEAL_TYPE_LABELS}
        isActive={(v) => isActive("dealType", v)}
        onToggle={(v) => toggle("dealType", v)}
      />

      <FilterGroup
        title="Region"
        options={REGIONS}
        labels={REGION_LABELS}
        isActive={(v) => isActive("region", v)}
        onToggle={(v) => toggle("region", v)}
      />

      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          Asking price, USD
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            defaultValue={searchParams.get("minPrice") ?? ""}
            onBlur={(e) => setNumber("minPrice", e.target.value)}
            placeholder="From"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={0}
            defaultValue={searchParams.get("maxPrice") ?? ""}
            onBlur={(e) => setNumber("maxPrice", e.target.value)}
            placeholder="To"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={() => {
            setQuery("");
            startTransition(() => router.replace(pathname, { scroll: false }));
          }}
          className="text-sm text-gray-600 underline underline-offset-2 cursor-pointer"
        >
          Reset all
        </button>
      )}
    </div>
  );
}

function FilterGroup<T extends string>({
  title,
  options,
  labels,
  isActive,
  onToggle,
}: {
  title: string;
  options: readonly T[];
  labels: Record<T, string>;
  isActive: (value: T) => boolean;
  onToggle: (value: T) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = isActive(option);
          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1 text-sm transition-colors cursor-pointer ${
                active
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {labels[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}