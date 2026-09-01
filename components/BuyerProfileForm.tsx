"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveBuyerProfile } from "@/app/actions/profile";
import type { FormState } from "@/app/actions/assets";
import {
  INDUSTRIES,
  DEAL_TYPES,
  REGIONS,
  INDUSTRY_LABELS,
  DEAL_TYPE_LABELS,
  REGION_LABELS,
} from "@/lib/constants";

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm";

type Initial = {
  headline: string;
  description: string;
  industries: string[];
  dealTypes: string[];
  regions: string[];
  budgetMin: number;
  budgetMax: number;
} | null;

function CheckboxGroup<T extends string>({
  name,
  title,
  options,
  labels,
  selected,
  errors,
}: {
  name: string;
  title: string;
  options: readonly T[];
  labels: Record<T, string>;
  selected: string[];
  errors?: string[];
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <label
            key={option}
            className="cursor-pointer rounded-full border border-line px-3 py-1 text-sm text-muted transition-colors has-checked:border-ink has-checked:bg-ink has-checked:text-white"
          >
            <input
              type="checkbox"
              name={name}
              value={option}
              defaultChecked={selected.includes(option)}
              className="sr-only"
            />
            {labels[option]}
          </label>
        ))}
      </div>
      {errors?.map((e) => (
        <p key={e} className="mt-1 text-xs text-red-600">
          {e}
        </p>
      ))}
    </div>
  );
}

function Submit({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Saving…" : isNew ? "Create profile" : "Save changes"}
    </button>
  );
}

export function BuyerProfileForm({ initial }: { initial: Initial }) {
  const [state, action] = useActionState<FormState, FormData>(saveBuyerProfile, {});
  const e = state.errors ?? {};

  return (
    <form action={action} className="card space-y-5 p-6">
      {state.message && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div>
        <label htmlFor="headline" className="mb-1.5 block text-sm font-medium">
          Headline
        </label>
        <input
          id="headline"
          name="headline"
          required
          defaultValue={initial?.headline ?? ""}
          placeholder="One line on what you are looking for"
          className={input}
        />
        {e.headline?.map((m) => (
          <p key={m} className="mt-1 text-xs text-red-600">
            {m}
          </p>
        ))}
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
          Investment thesis
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          required
          defaultValue={initial?.description ?? ""}
          className={input}
        />
        <p className="mt-1 text-xs text-muted">
          At least 40 characters. Sellers use this to decide whether to reach out.
        </p>
        {e.description?.map((m) => (
          <p key={m} className="mt-1 text-xs text-red-600">
            {m}
          </p>
        ))}
      </div>

      <CheckboxGroup
        name="industries"
        title="Industries of interest"
        options={INDUSTRIES}
        labels={INDUSTRY_LABELS}
        selected={initial?.industries ?? []}
        errors={e.industries}
      />

      <CheckboxGroup
        name="dealTypes"
        title="Deal types"
        options={DEAL_TYPES}
        labels={DEAL_TYPE_LABELS}
        selected={initial?.dealTypes ?? []}
        errors={e.dealTypes}
      />

      <CheckboxGroup
        name="regions"
        title="Regions"
        options={REGIONS}
        labels={REGION_LABELS}
        selected={initial?.regions ?? []}
        errors={e.regions}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="budgetMin" className="mb-1.5 block text-sm font-medium">
            Budget from, USD
          </label>
          <input
            id="budgetMin"
            name="budgetMin"
            type="number"
            min={0}
            required
            defaultValue={initial?.budgetMin ?? ""}
            className={input}
          />
          {e.budgetMin?.map((m) => (
            <p key={m} className="mt-1 text-xs text-red-600">
              {m}
            </p>
          ))}
        </div>

        <div>
          <label htmlFor="budgetMax" className="mb-1.5 block text-sm font-medium">
            Budget to, USD
          </label>
          <input
            id="budgetMax"
            name="budgetMax"
            type="number"
            min={1}
            required
            defaultValue={initial?.budgetMax ?? ""}
            className={input}
          />
          {e.budgetMax?.map((m) => (
            <p key={m} className="mt-1 text-xs text-red-600">
              {m}
            </p>
          ))}
        </div>
      </div>

      <Submit isNew={initial === null} />
    </form>
  );
}
