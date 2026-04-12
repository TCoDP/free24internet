import type { Metadata } from "next";
import { PublicPageBreadcrumbs } from "@/components/PublicPageBreadcrumbs";
import { SiteShell } from "@/components/SiteShell";
import { SITE_ORIGIN } from "@/lib/constants";
import { en } from "@/lib/messages/en";
import { getMessages } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: en.meta.description,
  openGraph: {
    title: "Privacy Policy — Free Internet",
    url: `${SITE_ORIGIN}/en/privacy`,
  },
  alternates: { canonical: `${SITE_ORIGIN}/en/privacy` },
};

export default async function PrivacyEnPage() {
  const messages = getMessages("en");
  return (
    <SiteShell messages={messages}>
      <main className="min-h-screen flex-grow px-4 pb-16 pt-32 md:px-8">
        <div className="mx-auto w-full max-w-[1000px]">
          <PublicPageBreadcrumbs messages={messages} />
          <h1 className="mb-8 text-center text-3xl font-extrabold text-dark md:text-4xl">
            Privacy Policy
          </h1>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
            <div className="prose max-w-none space-y-6 text-slate-600">
              <p>
                The Privacy Policy governs the collection, use, and protection of user information. Account
                identifiers, technical information, and interaction history may be collected. Data is used
                to operate the service, communicate with users, and for analysis. Disclosure to third
                parties is only where required by law or with user consent. Data is retained as needed and
                protected within reasonable limits. Users bear risks related to data transmission. The
                administration may update the Policy without notice; continued use constitutes acceptance.
              </p>
              <h3 className="mt-8 text-xl font-bold text-dark">1. General Provisions</h3>
              <p>
                1.1. This Privacy Policy (the &quot;Policy&quot;) governs how information provided by the
                User when using the service (the &quot;Service&quot;) is processed and protected.
              </p>
              <p>
                1.2. By using the Service, the User confirms their consent to the terms of the Policy. If
                the User does not agree with the terms, they must stop using the Service.
              </p>
              <h3 className="mt-8 text-xl font-bold text-dark">2. Information Collection</h3>
              <p>2.1. The Service may collect the following types of data:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>account identifiers (login, ID, nickname, etc.);</li>
                <li>
                  technical information (IP address, browser, device, and operating system data);
                </li>
                <li>interaction history with the Service.</li>
              </ul>
              <p>
                2.2. The Service does not require passport data, documents, photos, or other personal
                information beyond the minimum necessary for operation.
              </p>
              <h3 className="mt-8 text-xl font-bold text-dark">3. Information Usage</h3>
              <p>3.1. The Service may use the received information exclusively for:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>ensuring functionality;</li>
                <li>communication with the User (including notifications and support);</li>
                <li>analysis and improvement of the Service.</li>
              </ul>
              <h3 className="mt-8 text-xl font-bold text-dark">4. Transfer of Information to Third Parties</h3>
              <p>4.1. The Administration does not transfer data to third parties except:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>where required by law;</li>
                <li>where necessary to fulfill obligations to the User (e.g. payment systems);</li>
                <li>where the User has given consent.</li>
              </ul>
              <h3 className="mt-8 text-xl font-bold text-dark">5. Data Storage and Protection</h3>
              <p>5.1. Data is stored for the period necessary to achieve processing purposes.</p>
              <p>
                5.2. The Administration takes reasonable measures to protect data but does not guarantee
                absolute security of information transmitted over the internet.
              </p>
              <h3 className="mt-8 text-xl font-bold text-dark">6. Disclaimer</h3>
              <p>6.1. The User understands that data transmission over the internet involves risks.</p>
              <p>
                6.2. The Administration is not responsible for loss, theft, or disclosure of data caused
                by third parties or the User.
              </p>
              <h3 className="mt-8 text-xl font-bold text-dark">7. Changes to the Policy</h3>
              <p>7.1. The Administration may change the terms of the Policy without prior notice.</p>
              <p>
                7.2. Continued use of the Service after changes means the User agrees to the new version
                of the Policy.
              </p>
            </div>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
