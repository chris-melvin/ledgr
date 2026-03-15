import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - ledgr",
  description:
    "Terms and conditions for using ledgr, the daily budgeting app for Filipinos.",
  robots: "index, follow",
};

export default function TermsPage() {
  return (
    <div className="py-16 px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-800 sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-stone-500">
            Last updated: March 7, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-stone max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using ledgr, formerly known as useMargin (the "Service"), operated by
            useMargin ("Company", "we", "us", or "our"), you agree to be bound by these Terms of
            Service ("Terms") and our{" "}
            <Link href="/privacy" className="text-teal-600 hover:text-teal-700">
              Privacy Policy
            </Link>
            . If you do not agree to these Terms, you may not use the Service.
          </p>
          <p>
            You must be at least 18 years old and capable of forming a binding contract under the
            laws of the Republic of the Philippines to use ledgr. By using the Service, you
            represent and warrant that you meet these requirements.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            ledgr is a daily budgeting application designed to help you manage your finances
            with clarity and freedom. The Service provides:
          </p>
          <ul>
            <li>Daily spending limit calculations based on your income and expenses</li>
            <li>Automatic budget rebalancing when you overspend or underspend</li>
            <li>Expense and income tracking with natural language input</li>
            <li>Calendar-based visualization of your spending patterns</li>
            <li>Bill and debt management features</li>
            <li>Analytics and reporting (Pro tier only)</li>
          </ul>

          <h3>2.1 Free Tier</h3>
          <p>The Free tier includes the following features at no cost:</p>
          <ul>
            <li>Expense tracking</li>
            <li>Budget setup and management</li>
            <li>Income and bill tracking</li>
            <li>Basic dashboard and calendar view</li>
          </ul>

          <h3>2.2 Pro Tier</h3>
          <p>
            The Pro tier is available for $1.99 per month or $19.99 per year (16% savings). Pro
            subscribers receive all Free tier features plus:
          </p>
          <ul>
            <li>Advanced analytics and visualizations (cash flow, trends, heatmaps)</li>
            <li>Export your data to CSV and PDF formats</li>
            <li>Priority customer support</li>
            <li>Early access to new features</li>
          </ul>

          <h2>3. User Accounts</h2>
          <p>
            To use ledgr, you must create an account using Google OAuth. You agree to:
          </p>
          <ul>
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Not share your account with others</li>
            <li>Notify us immediately of any unauthorized access or security breach</li>
            <li>Use one account per person (no duplicate accounts)</li>
          </ul>
          <p>
            You are responsible for all activities that occur under your account. We reserve the
            right to suspend or terminate accounts that violate these Terms.
          </p>

          <h2>4. Subscription Terms</h2>

          <h3>4.1 Billing and Payments</h3>
          <p>
            Pro subscriptions are processed through{" "}
            <a
              href="https://www.paddle.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Paddle
            </a>
            , our payment processor. By subscribing to Pro, you authorize Paddle to charge your
            payment method on a recurring basis.
          </p>

          <h3>4.2 Auto-Renewal</h3>
          <p>
            Pro subscriptions automatically renew at the end of each billing cycle (monthly or
            yearly) unless you cancel before the renewal date. You will be charged the
            then-current subscription price, which we will communicate to you in advance if it
            changes.
          </p>

          <h3>4.3 Cancellation</h3>
          <p>
            You may cancel your Pro subscription at any time from your Account Settings. When you
            cancel:
          </p>
          <ul>
            <li>Your subscription will remain active until the end of your current billing period</li>
            <li>You will not be charged for the next billing cycle</li>
            <li>You will automatically revert to the Free tier when your subscription ends</li>
            <li>Your data will be preserved, but Pro features will no longer be accessible</li>
          </ul>

          <h3>4.4 Price Changes</h3>
          <p>
            We may change our subscription prices from time to time. If we increase the price of
            your subscription, we will notify you at least 30 days in advance. The new price will
            apply to your next billing cycle after the notice period.
          </p>

          <h3>4.5 Refunds</h3>
          <p>
            For information about refunds, please see our{" "}
            <Link href="/refund" className="text-teal-600 hover:text-teal-700">
              Refund Policy
            </Link>
            .
          </p>

          <h2>5. User Responsibilities</h2>
          <p>When using ledgr, you agree to:</p>
          <ul>
            <li>
              <strong>Provide accurate data:</strong> Enter your expenses, income, and budget
              information truthfully and accurately
            </li>
            <li>
              <strong>Use the Service lawfully:</strong> Comply with all applicable laws and
              regulations
            </li>
            <li>
              <strong>Respect the system:</strong> Do not attempt to hack, reverse engineer, or
              abuse the Service
            </li>
            <li>
              <strong>Protect your credentials:</strong> Keep your login information confidential
            </li>
            <li>
              <strong>Understand limitations:</strong> Recognize that ledgr is a tracking tool,
              not professional financial advice
            </li>
          </ul>

          <h3>Prohibited Activities</h3>
          <p>You may not:</p>
          <ul>
            <li>Use the Service for any illegal purpose</li>
            <li>Attempt to gain unauthorized access to other users' accounts or data</li>
            <li>Introduce viruses, malware, or harmful code</li>
            <li>Scrape or extract data from the Service using automated means</li>
            <li>Impersonate another person or entity</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Violate any intellectual property rights</li>
          </ul>

          <h2>6. Intellectual Property</h2>
          <p>
            ledgr and all related content, features, and functionality are owned by useMargin
            (operating as ledgr) and are protected by international copyright, trademark, and other
            intellectual property laws.
          </p>
          <ul>
            <li>
              <strong>We own the platform:</strong> The ledgr software, design, trademarks, and
              related materials belong to us
            </li>
            <li>
              <strong>You own your data:</strong> You retain all rights to the financial data you
              enter into ledgr
            </li>
            <li>
              <strong>License to use:</strong> We grant you a limited, non-exclusive,
              non-transferable license to use the Service for personal budgeting purposes
            </li>
            <li>
              <strong>License to process your data:</strong> You grant us a license to use your
              data solely to provide and improve the Service (e.g., calculate budgets, generate
              insights)
            </li>
          </ul>

          <h2>7. Disclaimers</h2>
          <p className="border-l-4 border-amber-500 pl-4 my-6 bg-amber-50 p-4 rounded">
            <strong>IMPORTANT:</strong> ledgr is a budgeting tool, not financial advice.
          </p>
          <p>You acknowledge and agree that:</p>
          <ul>
            <li>
              <strong>Not financial advice:</strong> ledgr does not provide financial, legal, or
              tax advice. We are not licensed financial advisors.
            </li>
            <li>
              <strong>Calculations depend on your input:</strong> Budget calculations and insights
              are based on the data you provide. Their accuracy depends on the completeness and
              correctness of your entries.
            </li>
            <li>
              <strong>No guarantees:</strong> We do not guarantee specific financial outcomes,
              savings, or results from using ledgr.
            </li>
            <li>
              <strong>Seek professional advice:</strong> For personalized financial guidance,
              consult a licensed financial advisor, accountant, or attorney.
            </li>
            <li>
              <strong>Your responsibility:</strong> All financial decisions you make are your sole
              responsibility.
            </li>
          </ul>

          <h2>8. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by Philippine law:
          </p>
          <ul>
            <li>
              <strong>Service "as is":</strong> ledgr is provided on an "as is" and "as
              available" basis without warranties of any kind, either express or implied.
            </li>
            <li>
              <strong>No liability for decisions:</strong> We are not liable for any financial
              decisions you make based on information or calculations provided by ledgr.
            </li>
            <li>
              <strong>No liability for damages:</strong> We shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of the
              Service.
            </li>
            <li>
              <strong>Maximum liability:</strong> Our total liability to you for any claims arising
              from these Terms or your use of the Service shall not exceed the amount you paid us in
              the 12 months preceding the claim.
            </li>
          </ul>
          <p>
            Some jurisdictions do not allow the exclusion of certain warranties or limitations of
            liability. In such cases, our liability will be limited to the maximum extent permitted
            by law.
          </p>

          <h2>9. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless useMargin (operating as ledgr), its officers, directors,
            employees, and agents from any claims, liabilities, damages, losses, costs, or expenses
            (including reasonable attorney's fees) arising from:
          </p>
          <ul>
            <li>Your use or misuse of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any third-party rights</li>
            <li>Any financial decisions you make based on ledgr</li>
          </ul>

          <h2>10. Termination</h2>

          <h3>10.1 Termination by You</h3>
          <p>
            You may terminate your account at any time by:
          </p>
          <ul>
            <li>Canceling your Pro subscription (if applicable)</li>
            <li>Requesting account deletion via Account Settings or by emailing us</li>
          </ul>
          <p>
            Upon termination, your data will be deleted or anonymized within 90 days in accordance
            with our{" "}
            <Link href="/privacy" className="text-teal-600 hover:text-teal-700">
              Privacy Policy
            </Link>
            .
          </p>

          <h3>10.2 Termination by Us</h3>
          <p>
            We reserve the right to suspend or terminate your account if:
          </p>
          <ul>
            <li>You violate these Terms of Service</li>
            <li>You engage in fraudulent or abusive activity</li>
            <li>We are required to do so by law</li>
            <li>We discontinue the Service (with reasonable notice)</li>
          </ul>
          <p>
            If we terminate your account for violations, you will not be entitled to a refund of any
            subscription fees.
          </p>

          <h2>11. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the
            Republic of the Philippines, without regard to its conflict of law provisions.
          </p>
          <p>
            Any disputes arising out of or relating to these Terms or the Service shall be resolved
            through:
          </p>
          <ol>
            <li>
              <strong>Good faith negotiation:</strong> We encourage you to contact us first at{" "}
              <a href="mailto:hello@ledgr.ink">hello@ledgr.ink</a> to resolve any issues
              informally.
            </li>
            <li>
              <strong>Philippine courts:</strong> If informal resolution fails, disputes shall be
              subject to the exclusive jurisdiction of the courts of the Republic of the
              Philippines.
            </li>
          </ol>

          <h2>12. Changes to These Terms</h2>
          <p>
            We may update these Terms of Service from time to time to reflect changes in our
            practices, legal requirements, or operational needs. When we make significant changes:
          </p>
          <ul>
            <li>We will update the "Last updated" date at the top of this page</li>
            <li>We will notify you via email or through an in-app notification</li>
            <li>We may require you to accept the updated Terms to continue using the Service</li>
          </ul>
          <p>
            Your continued use of ledgr after any changes become effective constitutes your
            acceptance of the updated Terms.
          </p>

          <h2>13. Miscellaneous</h2>

          <h3>Entire Agreement</h3>
          <p>
            These Terms, together with our Privacy Policy and Refund Policy, constitute the entire
            agreement between you and useMargin (operating as ledgr) regarding the Service.
          </p>

          <h3>Severability</h3>
          <p>
            If any provision of these Terms is found to be unenforceable, the remaining provisions
            will continue in full force and effect.
          </p>

          <h3>Waiver</h3>
          <p>
            Our failure to enforce any right or provision in these Terms shall not constitute a
            waiver of such right or provision.
          </p>

          <h3>Assignment</h3>
          <p>
            You may not assign or transfer these Terms or your account to any third party without
            our written consent. We may assign our rights and obligations under these Terms without
            restriction.
          </p>

          <h2>14. Contact Us</h2>
          <p>
            If you have any questions, concerns, or feedback about these Terms of Service, please
            contact us:
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <a href="mailto:hello@ledgr.ink">hello@ledgr.ink</a>
          </p>
          <p>We typically respond to inquiries within 24-48 hours.</p>

          <hr />

          <p className="text-sm text-stone-500">
            Thank you for using ledgr. We're here to help you budget with clarity and freedom.
          </p>
        </div>
      </div>
    </div>
  );
}
