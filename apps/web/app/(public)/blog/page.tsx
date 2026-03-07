import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog - ledgr",
  description:
    "Budgeting tips, financial advice, and product updates from the ledgr team.",
  robots: "index, follow",
};

export default function BlogPage() {
  return (
    <div className="py-16 px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-6">
            <BookOpen className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            The ledgr Blog
          </h1>
          <p className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto">
            Budgeting tips, financial insights, and product updates coming soon.
          </p>
        </div>

        {/* Coming Soon Content */}
        <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl border border-amber-200 p-8 sm:p-12 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md mb-6">
            <Sparkles className="w-4 h-4" />
            Coming Soon
          </div>

          <h2 className="text-2xl font-semibold text-stone-900 mb-4">
            We're working on something great
          </h2>
          <p className="text-stone-600 mb-8 max-w-xl mx-auto">
            Our blog will feature practical budgeting advice for Filipinos, success stories from
            ledgr users, product updates, and tips to help you make the most of your daily
            allowance.
          </p>

          <div className="bg-stone-50 rounded-xl p-6 mb-8 text-left max-w-lg mx-auto">
            <h3 className="font-semibold text-stone-900 mb-3">What to expect:</h3>
            <ul className="space-y-2 text-sm text-stone-600">
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-0.5">✓</span>
                <span>Practical money-saving tips for everyday Filipinos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-0.5">✓</span>
                <span>How to make the most of your daily spending allowance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-0.5">✓</span>
                <span>Success stories and budgeting wins from our community</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-0.5">✓</span>
                <span>Product updates and new feature announcements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-0.5">✓</span>
                <span>Debt payoff strategies and financial freedom guides</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-stone-500">
              In the meantime, follow us on Twitter for quick tips and updates
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                variant="outline"
                size="lg"
              >
                <a
                  href="https://twitter.com/ledgr_ink"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Follow on Twitter
                </a>
              </Button>
              <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700">
                <Link href="/signup">Try ledgr Free</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-stone-600">
            Have questions or want to contribute a guest post?{" "}
            <a
              href="mailto:hello@ledgr.ink"
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Get in touch
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
