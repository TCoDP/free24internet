import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { SiteShell } from "@/components/SiteShell";
import { SITE_ORIGIN } from "@/lib/constants";
import { getMessages } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your account",
  alternates: { canonical: `${SITE_ORIGIN}/en/login` },
};

export default async function EnLoginPage() {
  const messages = getMessages("en");
  return (
    <SiteShell messages={messages}>
      <AuthCard title={messages.auth.loginTitle}>
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
          <LoginForm messages={messages} />
        </Suspense>
      </AuthCard>
    </SiteShell>
  );
}
