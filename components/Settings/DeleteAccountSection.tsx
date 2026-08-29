"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteAccountSection() {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const isConfirmed = confirmText === "DELETE";

  async function handleDelete() {
    if (!isConfirmed) return;
    setError("");
    setIsDeleting(true);

    const response = await fetch("/delete-account", { method: "POST" });
    const result = await response.json();

    if (!response.ok) {
      setIsDeleting(false);
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    // The account is gone server-side; clear the local session too and
    // send them home.
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <div className="border border-red-200 bg-red-50 rounded-lg p-6">
      <h2 className="font-logo text-lg font-bold text-brand-red mb-2">Delete your account</h2>
      <p className="text-sm text-gray-700 mb-4">
        Deleting your account is permanent and cannot be undone. Any notes you&apos;ve
        submitted will stay on the site, but will no longer be linked to your account.
      </p>

      <label htmlFor="delete-confirm" className="block text-sm font-medium text-gray-700 mb-2">
        Type <span className="font-mono font-bold">DELETE</span> to confirm
      </label>
      <input
        id="delete-confirm"
        type="text"
        value={confirmText}
        onChange={(event) => setConfirmText(event.target.value)}
        className="w-full bg-white border border-gray-300 rounded-md px-4 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-red/40"
        placeholder="DELETE"
      />

      {error && <p className="text-xs font-medium text-brand-red mb-4">{error}</p>}

      <button
        type="button"
        disabled={!isConfirmed || isDeleting}
        onClick={handleDelete}
        className="bg-brand-red text-white text-sm font-semibold px-6 py-2.5 rounded-md hover:bg-brand-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isDeleting ? "Deleting..." : "Delete my account"}
      </button>
    </div>
  );
}