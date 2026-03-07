import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-[#FDFBF7]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo size="md" />
          </Link>

          {/* Nav Actions */}
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              className="text-neutral-600 hover:text-neutral-900"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              asChild
              className="bg-teal-600 text-white shadow-sm hover:bg-teal-700"
            >
              <Link href="/signup">Start Free</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center">
                <Logo size="sm" />
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-neutral-500">
                Daily spending clarity.
                <br />
                Built for freedom, not restriction.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Product
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="#features"
                    className="text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#how-it-works"
                    className="text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Company
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:hello@ledgr.ink"
                    className="text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Legal
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/privacy"
                    className="text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/refund"
                    className="text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-8 md:flex-row">
            <p className="text-sm text-neutral-400">
              &copy; {new Date().getFullYear()} ledgr. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="https://twitter.com/ledgr_ink"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 transition-colors hover:text-teal-600"
                aria-label="Twitter"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
