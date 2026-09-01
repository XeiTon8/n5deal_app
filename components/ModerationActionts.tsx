"use client";

import { useState } from "react";

export function SuspendButton({
  id,
  action,
}: {
  id: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-full border border-amber-300 px-4 py-1.5 text-xs text-amber-800 transition-colors hover:bg-amber-50"
      >
        Suspend
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input
        name="reason"
        required
        minLength={5}
        autoFocus
        placeholder="Reason (visible to the participant)"
        className="w-64 rounded-lg border border-line px-3 py-1.5 text-xs"
      />
      <button
        type="submit"
        className="cursor-pointer rounded-full bg-amber-600 px-4 py-1.5 text-xs text-white transition-colors hover:bg-amber-700"
      >
        Confirm
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="cursor-pointer text-xs text-muted hover:text-ink"
      >
        Cancel
      </button>
    </form>
  );
}

export function RestoreButton({
  id,
  action,
}: {
  id: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="cursor-pointer rounded-full border border-green-300 px-4 py-1.5 text-xs text-green-700 transition-colors hover:bg-green-50"
      >
        Restore
      </button>
    </form>
  );
}
