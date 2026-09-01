"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createAsset, type FormState } from "@/app/actions/assets";
import {
  INDUSTRIES,
  DEAL_TYPES,
  REGIONS,
  INDUSTRY_LABELS,
  DEAL_TYPE_LABELS,
  REGION_LABELS,
} from "@/lib/constants";

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm";

function Field({
  label,
  name,
  errors,
  children,
  hint,
}: {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !errors && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {errors?.map((e) => (
        <p key={e} className="mt-1 text-xs text-red-600">
          {e}
        </p>
      ))}
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Publishing…" : "Publish asset"}
    </button>
  );
}

export function AssetForm() {
  const [state, action] = useActionState<FormState, FormData>(createAsset, {});
  const v = state.values ?? {};
  const e = state.errors ?? {};

  return (
    <form action={action} className="card space-y-5 p-6">
      {state.message && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <Field label="Title" name="title" errors={e.title}>
        <input id="title" name="title" required defaultValue={v.title ?? ""} className={input} />
      </Field>

      <Field
        label="Description"
        name="description"
        errors={e.description}
        hint="At least 40 characters."
      >
        <textarea
          id="description"
          name="description"
          rows={5}
          required
          defaultValue={v.description ?? ""}
          className={input}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Industry" name="industry" errors={e.industry}>
          <select id="industry" name="industry" required defaultValue={v.industry ?? ""} className={`${input} cursor-pointer`}>
            <option value="" disabled>
              Select industry
            </option>
            {INDUSTRIES.map((option) => (
              <option key={option} value={option}>
                {INDUSTRY_LABELS[option]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Deal type" name="dealType" errors={e.dealType}>
          <select id="dealType" name="dealType" required defaultValue={v.dealType ?? ""} className={`${input} cursor-pointer`}>
            {DEAL_TYPES.map((option) => (
              <option key={option} value={option}>
                {DEAL_TYPE_LABELS[option]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Region" name="region" errors={e.region}>
          <select id="region" name="region" required defaultValue={v.region ?? ""} className={`${input} cursor-pointer`}>
            {REGIONS.map((option) => (
              <option key={option} value={option}>
                {REGION_LABELS[option]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Asking price, USD" name="askingPrice" errors={e.askingPrice}>
          <input
            id="askingPrice"
            name="askingPrice"
            type="number"
            min={1}
            required
            defaultValue={v.askingPrice ?? ""}
            className={input}
          />
        </Field>

        <Field
          label="Stake offered, %"
          name="stakePercent"
          errors={e.stakePercent}
          hint="Leave empty for asset purchases."
        >
          <input
            id="stakePercent"
            name="stakePercent"
            type="number"
            defaultValue={v.stakePercent ?? ""}
            min={1}
            max={100}
            className={input}
          />
        </Field>

        <Field
          label="Annual revenue, USD"
          name="annualRevenue"
          errors={e.annualRevenue}
          hint="Optional."
        >
          <input
            id="annualRevenue"
            name="annualRevenue"
            type="number"
            defaultValue={v.annualRevenue ?? ""}
            min={0}
            className={input}
          />
        </Field>

        <Field label="EBITDA, USD" name="ebitda" errors={e.ebitda} hint="Optional.">
          <input id="ebitda" name="ebitda" type="number" defaultValue={v.ebitda ?? ""} min={0} className={input} />
        </Field>
      </div>

      <Submit />
    </form>
  );
}
