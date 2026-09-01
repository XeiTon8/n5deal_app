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
        className="cursor-pointer rounded-md border border-amber-300 px-3 py-1 text-xs text-amber-800 hover:bg-amber-50"
      >
        Suspend
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input
        name="reason"
        required
        minLength={5}
        autoFocus
        placeholder="Reason (visible to the participant)"
        className="w-64 rounded-md border px-2 py-1 text-xs"
      />
      <button
        type="submit"
        className="cursor-pointer rounded-md bg-amber-600 px-3 py-1 text-xs text-white"
      >
        Confirm
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="cursor-pointer text-xs text-gray-500"
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
        className="cursor-pointer rounded-md border border-green-300 px-3 py-1 text-xs text-green-700 hover:bg-green-50"
      >
        Restore
      </button>
    </form>
  );
}