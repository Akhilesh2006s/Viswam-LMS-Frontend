import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import { COMPANY_NAME, PRODUCT_NAME } from "@/lib/brand";

export default function Contact() {
  usePageTitle("Contact");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-3 sm:px-4 lg:px-6 py-12">
        <h1 className="text-2xl sm:text-3xl font-bold">Contact Us</h1>
        <p className="mt-3 text-slate-600">
          Get in touch with {COMPANY_NAME} for support, partnerships, or general
          inquiries about {PRODUCT_NAME}.
        </p>

        <section className="mt-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">Ways to reach us</h2>
          <ul className="list-disc space-y-2 pl-5 text-slate-700">
            <li>
              <a
                href="mailto:support@viswamedutech.com"
                className="text-blue-600 hover:text-blue-700"
              >
                support@viswamedutech.com
              </a>
            </li>
          </ul>
        </section>

        <p className="mt-10 text-sm text-slate-500">
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            ← Back to {PRODUCT_NAME}
          </Link>
        </p>
      </div>
    </main>
  );
}
