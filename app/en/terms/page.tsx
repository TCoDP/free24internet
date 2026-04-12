import type { Metadata } from "next";
import { PublicPageBreadcrumbs } from "@/components/PublicPageBreadcrumbs";
import { SiteShell } from "@/components/SiteShell";
import { SITE_ORIGIN } from "@/lib/constants";
import { en } from "@/lib/messages/en";
import { getMessages } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: en.meta.description,
  openGraph: {
    title: "Terms of Service — Free Internet",
    url: `${SITE_ORIGIN}/en/terms`,
  },
  alternates: { canonical: `${SITE_ORIGIN}/en/terms` },
};

export default async function TermsEnPage() {
  const messages = getMessages("en");
  return (
    <SiteShell messages={messages}>
      <main className="min-h-screen flex-grow px-4 pb-16 pt-32 md:px-8">
        <div className="mx-auto w-full max-w-[1000px]">
          <PublicPageBreadcrumbs messages={messages} />
          <h1 className="mb-8 text-center text-3xl font-extrabold text-dark md:text-4xl">
            Terms of Service
          </h1>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
            <div className="prose max-w-none space-y-6 text-slate-600">
              <h3 className="mt-4 text-xl font-bold text-dark">1. General Provisions</h3>
              <p>
                1.1. These Terms of Service (the &quot;Agreement&quot;) govern use of the online service
                (the &quot;Service&quot;) provided by the Administration.
              </p>
              <p>
                1.2. By using the Service, including launching the bot, registering, paying for services, or
                accessing materials, the User confirms that they have read this Agreement and accept it in
                full.
              </p>
              <p>1.3. If the User disagrees with the Agreement, they must stop using the Service.</p>
              <h3 className="mt-8 text-xl font-bold text-dark">2. Nature of Services and Digital Goods</h3>
              <p>
                2.1. The Service provides intangible digital goods and services including informational
                materials, training, consultations, digital products, and related services.
              </p>
              <p>2.2. Materials may include:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>information from open sources;</li>
                <li>copyright materials of the Administration and/or third parties;</li>
                <li>analytics, collections, recommendations, structured data.</li>
              </ul>
              <p>
                2.3. The User acknowledges that value lies in systematization, analysis, presentation,
                support, and updates—not in the exclusivity of individual fragments.
              </p>
              <p>
                2.4. The Service does not claim uniqueness or exclusivity of individual elements outside
                the Service.
              </p>
              <h3 className="mt-8 text-xl font-bold text-dark">3. Disclaimer of Warranties and Liability</h3>
              <p>3.1. The Service is provided on an &quot;AS IS&quot; basis.</p>
              <p>3.2. The Administration does not guarantee:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>that the Service will meet expectations;</li>
                <li>any financial, commercial, or professional results;</li>
                <li>uninterrupted or error-free operation.</li>
              </ul>
              <p>3.3. The Administration is not liable for:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>direct or indirect damages, including lost profits;</li>
                <li>consequences of applying materials received;</li>
                <li>actions or inaction of third parties;</li>
                <li>temporary failures or access restrictions.</li>
              </ul>
              <p>3.4. Decisions on applying materials and services are made by the User at their own risk.</p>
              <h3 className="mt-8 text-xl font-bold text-dark">4. Legality of Use</h3>
              <p>4.1. The Service is not intended to facilitate illegal activity.</p>
              <p>4.2. The User undertakes to comply with applicable law and third-party rules.</p>
              <p>4.3. The User is solely responsible for lawful use of materials and services.</p>
              <h3 className="mt-8 text-xl font-bold text-dark">5. Intellectual Property</h3>
              <p>5.1. Materials are protected by intellectual property laws.</p>
              <p>
                5.2. Copying, distribution, resale, or other use without permission of the rights holder is
                prohibited.
              </p>
              <p>5.3. Violations may result in access restriction without compensation.</p>
              <h3 className="mt-8 text-xl font-bold text-dark">6. Access Restriction</h3>
              <p>6.1. The Administration may suspend or restrict access if:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>the Agreement is violated;</li>
                <li>abuse is detected;</li>
                <li>required by law or payment providers.</li>
              </ul>
              <p>6.2. Restriction does not release the User from prior obligations.</p>
              <p>
                6.3. The Administration may refuse service where actions create elevated risk to the
                Service, providers, or third parties.
              </p>
              <h3 className="mt-8 text-xl font-bold text-dark">7. Payments and Refunds</h3>
              <p>7.1. Payment is made on the terms stated in the Service before payment.</p>
              <p>
                7.2. Due to the intangible nature of digital goods, refunds after access is granted are
                not provided except as below.
              </p>
              <p>7.3. Refunds are possible only if:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>the service was not provided due to a technical fault of the Service;</li>
                <li>access was not actually provided.</li>
              </ul>
              <p>7.4. Refund requests must be submitted to support within 24 hours of payment.</p>
              <p>7.5. Refund decisions are made individually by the Administration.</p>
              <p>
                7.6. The User agrees not to initiate chargebacks without first contacting Service support.
              </p>
              <h3 className="mt-8 text-xl font-bold text-dark">8. Privacy</h3>
              <p>8.1. Minimum necessary technical data may be collected to operate the Service.</p>
              <p>8.2. Reasonable security measures are used; absolute security is not guaranteed.</p>
              <h3 className="mt-8 text-xl font-bold text-dark">9. Change of Terms</h3>
              <p>9.1. The Administration may amend this Agreement.</p>
              <p>9.2. The current version is published in the Service.</p>
              <p>9.3. Continued use constitutes acceptance of updated terms.</p>
              <h3 className="mt-8 text-xl font-bold text-dark">10. Contact Information</h3>
              <p>10.1. For questions, contact support via the form in the bot.</p>
              <div className="mt-8 rounded-xl border border-slate-200 bg-light p-4">
                <p className="font-semibold text-dark">
                  By using the Service (including launching the bot and/or sending /start), the User
                  confirms that they have read this Agreement and accept it in full.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
