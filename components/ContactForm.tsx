"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendInquiry } from "@/app/actions/inquiries";
import type { FormState } from "@/app/actions/assets";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="cursor-pointer rounded-md bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
    >
      {pending ? "Sending…" : "Send inquiry"}
    </button>
  );
}

export function ContactForm({
  assetId,
  buyerId,
  placeholder,
}: {
  assetId?: string;
  buyerId?: string;
  placeholder: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(sendInquiry, {});
  const sent = state.message === "Inquiry sent.";

  if (sent) {
    return (
      <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
        Inquiry sent. You can follow it up in My inquiries.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      {assetId && <input type="hidden" name="assetId" value={assetId} />}
      {buyerId && <input type="hidden" name="buyerId" value={buyerId} />}

      <textarea
        name="message"
        rows={4}
        required
        placeholder={placeholder}
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
      {state.errors?.message?.map((m) => (
        <p key={m} className="text-xs text-red-600">{m}</p>
      ))}
      {state.message && !sent && (
        <p className="text-sm text-amber-700">{state.message}</p>
      )}
      <Submit />
    </form>
  );
}