import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { SiteShell } from "@/components/SiteShell";
import { SITE_ORIGIN } from "@/lib/constants";
import { getMessages } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Create account",
  description: "Register",
  alternates: { canonical: `${SITE_ORIGIN}/en/register` },
};

export default async function EnRegisterPage() {
  const messages = getMessages("en");
  return (
    <SiteShell messages={messages}>
      <AuthCard messages={messages} title={messages.auth.registerTitle}>
        <Suspense fallback={<p className="text-center text-slate-500">…</p>}>
          <RegisterForm messages={messages} />
        </Suspense>
      </AuthCard>
    </SiteShell>
  );
}
