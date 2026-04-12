"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useCallback, useMemo, useState } from "react";
import type { SiteMessages } from "@/lib/messages/types";
import { accountSectionPath } from "@/lib/account/paths";
import { pathPrefix } from "@/lib/locale";

type ErrKey = keyof SiteMessages["auth"]["errors"];

function pickError(
  errors: SiteMessages["auth"]["errors"],
  code: string | undefined,
): string {
  if (!code) return errors.server;
  if (code in errors) return errors[code as ErrKey];
  return errors.server;
}

export function RegisterForm({ messages }: { messages: SiteMessages }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralFromUrl = useMemo(() => {
    const r = searchParams.get("ref")?.trim();
    return r && r.length > 0 ? r : undefined;
  }, [searchParams]);

  const p = pathPrefix(messages.locale);
  const accountPath = accountSectionPath(messages.locale, "profile");
  const loginPath = `${p}/login`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { auth } = messages;

  const submit = useCallback(async () => {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      if (!trimmedEmail || trimmedPassword.length < 8) {
        setError(auth.errors.validation);
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: trimmedEmail,
            password: trimmedPassword,
            name: name.trim() || undefined,
            referralCode: referralFromUrl,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(pickError(auth.errors, data.error));
          return;
        }
        const signInRes = await signIn("credentials", {
          email: trimmedEmail,
          password: trimmedPassword,
          redirect: false,
        });
        if (signInRes?.error || !signInRes?.ok) {
          setError(auth.errors.server);
          return;
        }
        router.push(accountPath);
        router.refresh();
      } catch {
        setError(auth.errors.network);
      } finally {
        setLoading(false);
      }
    }, [email, password, name, referralFromUrl, router, accountPath, auth.errors]);

  return (
    <form
      method="post"
      className="flex flex-col gap-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void submit();
      }}
    >
      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div>
        <label htmlFor="reg-name" className="mb-2 block text-sm font-bold text-slate-700">
          {auth.name}{" "}
          <span className="font-normal text-slate-400">({auth.nameHint})</span>
        </label>
        <input
          id="reg-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-dark outline-none transition-colors focus:border-primary focus:bg-white"
        />
      </div>
      <div>
        <label htmlFor="reg-email" className="mb-2 block text-sm font-bold text-slate-700">
          {auth.email}
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-dark outline-none transition-colors focus:border-primary focus:bg-white"
        />
      </div>
      <div>
        <label htmlFor="reg-password" className="mb-2 block text-sm font-bold text-slate-700">
          {auth.password}
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-dark outline-none transition-colors focus:border-primary focus:bg-white"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-xl bg-primary py-4 text-lg font-extrabold text-white shadow-md transition-all hover:bg-primary-hover disabled:opacity-60"
      >
        {loading ? "…" : auth.submitRegister}
      </button>
      <p className="text-center text-sm text-slate-600">
        {auth.haveAccount}{" "}
        <Link href={loginPath} className="font-bold text-primary hover:underline">
          {auth.haveAccountLink}
        </Link>
      </p>
    </form>
  );
}
