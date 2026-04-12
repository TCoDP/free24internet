"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useCallback, useState } from "react";
import type { SiteMessages } from "@/lib/messages/types";
import { pathPrefix } from "@/lib/locale";

export function LoginForm({ messages }: { messages: SiteMessages }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const p = pathPrefix(messages.locale);
  const accountPath = `${p}/account`;
  const registerPath = `${p}/register`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { auth } = messages;

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (res?.error) {
          setError(auth.errors.credentials);
          return;
        }
        if (!res?.ok) {
          setError(auth.errors.server);
          return;
        }
        const nextRaw = searchParams.get("next");
        const nextOk =
          nextRaw &&
          nextRaw.startsWith("/") &&
          !nextRaw.startsWith("//") &&
          !nextRaw.includes("://");
        router.push(nextOk ? nextRaw : accountPath);
        router.refresh();
      } catch {
        setError(auth.errors.network);
      } finally {
        setLoading(false);
      }
    },
    [email, password, router, searchParams, accountPath, auth.errors],
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div>
        <label htmlFor="login-email" className="mb-2 block text-sm font-bold text-slate-700">
          {auth.email}
        </label>
        <input
          id="login-email"
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
        <label htmlFor="login-password" className="mb-2 block text-sm font-bold text-slate-700">
          {auth.password}
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
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
        {loading ? "…" : auth.submitLogin}
      </button>
      <p className="text-center text-sm text-slate-600">
        {auth.needAccount}{" "}
        <Link href={registerPath} className="font-bold text-primary hover:underline">
          {auth.needAccountLink}
        </Link>
      </p>
    </form>
  );
}
