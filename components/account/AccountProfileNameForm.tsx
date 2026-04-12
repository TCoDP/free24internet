"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { SiteMessages } from "@/lib/messages/types";
import { pickAccountError } from "@/lib/account/pick-account-error";
import { accountInputClass } from "@/components/account/account-input-styles";

export function AccountProfileNameForm({
  messages,
  initialName,
}: {
  messages: SiteMessages;
  initialName: string;
}) {
  const router = useRouter();
  const { auth } = messages;
  const [name, setName] = useState(initialName);
  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const save = useCallback(async () => {
    setError(null);
    setOk(false);
    setLoading(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(pickAccountError(auth.errors, data.error));
        return;
      }
      setOk(true);
      router.refresh();
    } catch {
      setError(auth.errors.network);
    } finally {
      setLoading(false);
    }
  }, [name, router, auth.errors]);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50/50 to-white p-6 shadow-inner sm:p-8">
      <h3 className="mb-1 text-sm font-black uppercase tracking-wide text-primary">{auth.name}</h3>
      <p className="mb-5 text-sm text-slate-600">{auth.accountProfileNameBlurb}</p>
      <label htmlFor="acc-profile-name" className="mb-2 block text-sm font-bold text-slate-700">
        {auth.name}{" "}
        <span className="font-normal text-slate-400">({auth.nameHint})</span>
      </label>
      <input
        id="acc-profile-name"
        name="name"
        type="text"
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={accountInputClass}
      />
      {error ? (
        <p className="mt-3 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? <p className="mt-3 text-sm font-semibold text-emerald-700">{auth.profileSaved}</p> : null}
      <button
        type="button"
        disabled={loading}
        onClick={() => void save()}
        className="mt-5 rounded-xl bg-primary px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:shadow-primary/30 disabled:opacity-60"
      >
        {loading ? "…" : auth.saveProfile}
      </button>
    </div>
  );
}
