"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { SiteMessages } from "@/lib/messages/types";
import { pickAccountError } from "@/lib/account/pick-account-error";
import { accountInputClass } from "@/components/account/account-input-styles";

export function AccountPasswordEditor({
  messages,
  hasPassword,
}: {
  messages: SiteMessages;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const { auth } = messages;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const save = useCallback(async () => {
    setError(null);
    setOk(false);
    if (newPassword !== confirmPassword) {
      setError(auth.errors.password_mismatch);
      return;
    }
    if (newPassword.length < 8) {
      setError(auth.errors.validation);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(pickAccountError(auth.errors, data.error));
        return;
      }
      setOk(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch {
      setError(auth.errors.network);
    } finally {
      setLoading(false);
    }
  }, [currentPassword, newPassword, confirmPassword, router, auth.errors]);

  if (!hasPassword) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-lg font-black text-dark">{auth.accountSectionSecurity}</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{auth.accountPasswordSetInitialBlurb}</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div>
            <label htmlFor="acc-init-new" className="mb-2 block text-sm font-bold text-slate-700">
              {auth.newPasswordLabel}
            </label>
            <input
              id="acc-init-new"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={accountInputClass}
            />
          </div>
          <div>
            <label htmlFor="acc-init-confirm" className="mb-2 block text-sm font-bold text-slate-700">
              {auth.confirmPasswordLabel}
            </label>
            <input
              id="acc-init-confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={accountInputClass}
            />
          </div>
          {error ? (
            <p className="text-sm font-semibold text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          {ok ? <p className="text-sm font-semibold text-emerald-700">{auth.passwordSaved}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all hover:from-slate-900 hover:to-black disabled:opacity-60 sm:w-auto"
          >
            {loading ? "…" : auth.savePassword}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
      <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50/40 to-white p-6 sm:p-8">
        <h3 className="text-lg font-black text-dark">{auth.accountSectionSecurity}</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{auth.accountPasswordHintEmail}</p>
      </div>
      <form
        className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="acc-cur-pw" className="mb-2 block text-sm font-bold text-slate-700">
              {auth.currentPasswordLabel}
            </label>
            <input
              id="acc-cur-pw"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={accountInputClass}
            />
          </div>
          <div>
            <label htmlFor="acc-new-pw" className="mb-2 block text-sm font-bold text-slate-700">
              {auth.newPasswordLabel}
            </label>
            <input
              id="acc-new-pw"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={accountInputClass}
            />
          </div>
          <div>
            <label htmlFor="acc-confirm-pw" className="mb-2 block text-sm font-bold text-slate-700">
              {auth.confirmPasswordLabel}
            </label>
            <input
              id="acc-confirm-pw"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={accountInputClass}
            />
          </div>
        </div>
        {error ? (
          <p className="mt-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {ok ? <p className="mt-4 text-sm font-semibold text-emerald-700">{auth.passwordSaved}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all hover:from-slate-900 hover:to-black disabled:opacity-60 sm:w-auto"
        >
          {loading ? "…" : auth.savePassword}
        </button>
      </form>
    </div>
  );
}
