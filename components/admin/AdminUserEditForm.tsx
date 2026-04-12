"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { userIsSitePayEligible } from "@/lib/account/site-pay-eligible";
import { isProtectedSuperadminUserId } from "@/lib/auth/admin-access";
import type { UserRow } from "@/lib/auth/types";
import type { SiteMessages } from "@/lib/messages/types";

function toInputDateTime(d: Date | null | undefined): string {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  return x.toISOString().slice(0, 16);
}

export function AdminUserEditForm({
  user,
  messages,
}: {
  user: UserRow;
  messages: SiteMessages;
}) {
  const a = messages.adminPanel;
  const router = useRouter();
  const [name, setName] = useState(user.name?.trim() ?? "");
  const [language, setLanguage] = useState(user.language === "en" ? "en" : user.language === "ru" ? "ru" : "");
  const [isTheir, setIsTheir] = useState(userIsSitePayEligible(user));
  const [isAdmin, setIsAdmin] = useState(Boolean(Number(user.is_admin)));
  const [subUntil, setSubUntil] = useState(toInputDateTime(user.subscription_until));
  const [trialUntil, setTrialUntil] = useState(toInputDateTime(user.trial_ends_at));
  const [refCode, setRefCode] = useState(user.referral_code?.trim() ?? "");
  const [referredBy, setReferredBy] = useState(
    user.referred_by_user_id != null ? String(user.referred_by_user_id) : "",
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const superLock = isProtectedSuperadminUserId(user.id);

  const save = useCallback(async () => {
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          language: language === "ru" || language === "en" ? language : null,
          is_their: isTheir,
          is_admin: superLock ? true : isAdmin,
          subscription_until: subUntil || null,
          trial_ends_at: trialUntil || null,
          referral_code: refCode.trim() || null,
          referred_by_user_id: referredBy.trim() === "" ? null : Number(referredBy),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        if (data.error === "referral_taken") setMsg(a.errors.referralTaken);
        else setMsg(a.errors.saveFailed);
        return;
      }
      setMsg(a.userSaved);
      router.refresh();
    } catch {
      setMsg(a.errors.saveFailed);
    } finally {
      setLoading(false);
    }
  }, [
    user.id,
    name,
    language,
    isTheir,
    isAdmin,
    superLock,
    subUntil,
    trialUntil,
    refCode,
    referredBy,
    a,
    router,
  ]);

  const labelClass = "mb-1 block text-sm font-bold text-dark";

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <p className="font-mono text-sm text-slate-500">ID {user.id}</p>
      <p className="text-sm text-slate-600">
        {a.userEmailReadonly}: <span className="font-semibold">{user.email ?? "—"}</span>
      </p>

      <div>
        <label className={labelClass} htmlFor="adm-name">
          {a.userFieldName}
        </label>
        <input
          id="adm-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="adm-lang">
          {a.userFieldLanguage}
        </label>
        <select
          id="adm-lang"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
        >
          <option value="">—</option>
          <option value="ru">ru</option>
          <option value="en">en</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={isTheir} onChange={(e) => setIsTheir(e.target.checked)} />
        {a.userFieldIsTheir}
      </label>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={superLock ? true : isAdmin}
          disabled={superLock}
          onChange={(e) => setIsAdmin(e.target.checked)}
        />
        {a.userFieldIsAdmin}
        {superLock ? (
          <span className="text-xs font-normal text-slate-500">{a.userSuperadminNote}</span>
        ) : null}
      </label>

      <div>
        <label className={labelClass} htmlFor="adm-sub">
          {a.userFieldSubUntil}
        </label>
        <input
          id="adm-sub"
          type="datetime-local"
          value={subUntil}
          onChange={(e) => setSubUntil(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 font-mono text-sm"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="adm-trial">
          {a.userFieldTrialUntil}
        </label>
        <input
          id="adm-trial"
          type="datetime-local"
          value={trialUntil}
          onChange={(e) => setTrialUntil(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 font-mono text-sm"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="adm-ref">
          {a.userFieldReferralCode}
        </label>
        <input
          id="adm-ref"
          value={refCode}
          onChange={(e) => setRefCode(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 font-mono text-sm uppercase"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="adm-referrer">
          {a.userFieldReferredBy}
        </label>
        <input
          id="adm-referrer"
          type="number"
          min={0}
          value={referredBy}
          onChange={(e) => setReferredBy(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 font-mono text-sm"
        />
      </div>

      {msg ? (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            msg === a.userSaved ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800"
          }`}
        >
          {msg}
        </p>
      ) : null}

      <button
        type="button"
        disabled={loading}
        onClick={() => void save()}
        className="rounded-xl bg-dark px-8 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "…" : a.userSave}
      </button>
    </div>
  );
}
