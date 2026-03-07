import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - ledgr",
  description:
    "How ledgr protects your financial data in compliance with the Philippine Data Privacy Act.",
  robots: "index, follow",
};

export default function PrivacyPage() {
  return (
    <div className="py-16 px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-800 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-stone-500">
            Last updated: March 7, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-stone max-w-none">
          <h2>Introduction</h2>
          <p>
            useMargin, operating as ledgr (formerly known as useMargin) ("we," "us," or "our"),
            operates the ledgr daily budgeting application (the "Service"). This Privacy Policy
            explains how we collect, use, disclose, and protect your information when you use our
            Service.
          </p>
          <p>
            By using ledgr, you agree to the collection and use of information in accordance
            with this policy. We are committed to protecting your privacy and complying with the
            Data Privacy Act of 2012 (R.A. 10173) of the Republic of the Philippines.
          </p>

          <h2>Information We Collect</h2>
          <p>
            We collect several types of information to provide and improve our Service:
          </p>

          <h3>Account Information</h3>
          <ul>
            <li>Name and email address (provided through Google OAuth authentication)</li>
            <li>Profile picture (optional, from Google account)</li>
            <li>Account preferences and settings</li>
          </ul>

          <h3>Financial Data</h3>
          <ul>
            <li>Expenses and income entries you log</li>
            <li>Budget allocations and daily spending limits</li>
            <li>Bills, debts, and payment schedules</li>
            <li>Bucket configurations (Daily Spend, Flex, Savings)</li>
            <li>Categories and tags for transactions</li>
          </ul>

          <h3>Usage Data</h3>
          <ul>
            <li>App interactions and feature usage</li>
            <li>Session duration and frequency</li>
            <li>Device information (browser type, operating system)</li>
            <li>IP address and general location (for security purposes)</li>
          </ul>

          <h3>Payment Information</h3>
          <ul>
            <li>
              Subscription status (Free or Pro tier)
            </li>
            <li>
              Payment details are processed securely by{" "}
              <a
                href="https://www.paddle.com/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Paddle
              </a>
              , our payment processor
            </li>
            <li>We do not store your credit card information</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ol>
            <li>
              <strong>Provide and maintain our Service:</strong> Calculate your daily spending
              limits, track expenses, manage budgets, and deliver the core functionality of
              ledgr
            </li>
            <li>
              <strong>Auto-rebalance your budget:</strong> Adjust daily allowances based on your
              spending patterns and remaining balance
            </li>
            <li>
              <strong>Process payments and manage subscriptions:</strong> Handle Pro tier upgrades,
              renewals, and cancellations through Paddle
            </li>
            <li>
              <strong>Send transactional emails:</strong> Login confirmations, subscription updates,
              important account notifications
            </li>
            <li>
              <strong>Improve user experience:</strong> Analyze usage patterns to enhance features,
              fix bugs, and optimize performance
            </li>
            <li>
              <strong>Generate AI-powered insights:</strong> Use Google Gemini 2.5 Flash to provide
              spending analysis and budget recommendations (when you request them)
            </li>
            <li>
              <strong>Ensure security:</strong> Detect and prevent fraudulent activity, unauthorized
              access, and other security threats
            </li>
          </ol>

          <h2>Data Storage & Security</h2>
          <p>
            Your data is stored securely using{" "}
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Supabase
            </a>
            , a PostgreSQL-based database platform. We implement multiple layers of security:
          </p>
          <ul>
            <li>
              <strong>Encryption:</strong> All data is encrypted at rest and in transit using
              industry-standard TLS/SSL protocols
            </li>
            <li>
              <strong>Access controls:</strong> Strict authentication and authorization mechanisms
              ensure only you can access your data
            </li>
            <li>
              <strong>Regular security updates:</strong> We keep our systems up-to-date with the
              latest security patches
            </li>
            <li>
              <strong>Data backups:</strong> Regular backups protect against data loss
            </li>
          </ul>
          <p>
            While we take reasonable measures to protect your information, no method of transmission
            over the internet or electronic storage is 100% secure. We cannot guarantee absolute
            security.
          </p>

          <h2>Third-Party Services</h2>
          <p>
            ledgr integrates with the following third-party services. Each has its own privacy
            policy governing the use of your information:
          </p>
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Purpose</th>
                <th>Privacy Policy</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Paddle</td>
                <td>Payment processing for Pro subscriptions</td>
                <td>
                  <a
                    href="https://www.paddle.com/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Paddle Privacy Policy
                  </a>
                </td>
              </tr>
              <tr>
                <td>Google OAuth</td>
                <td>Secure authentication and account creation</td>
                <td>
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Privacy Policy
                  </a>
                </td>
              </tr>
              <tr>
                <td>Supabase</td>
                <td>Database hosting and authentication infrastructure</td>
                <td>
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Supabase Privacy Policy
                  </a>
                </td>
              </tr>
              <tr>
                <td>Google Gemini</td>
                <td>AI-powered spending insights and budget recommendations</td>
                <td>
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google AI Privacy Policy
                  </a>
                </td>
              </tr>
            </tbody>
          </table>

          <h2>Your Rights Under Philippine Law</h2>
          <p>
            Under the Data Privacy Act of 2012 (R.A. 10173), you have the following rights regarding
            your personal data:
          </p>
          <ul>
            <li>
              <strong>Right to access:</strong> Request a copy of all personal data we hold about
              you
            </li>
            <li>
              <strong>Right to correction:</strong> Update or correct inaccurate information
            </li>
            <li>
              <strong>Right to erasure:</strong> Request deletion of your personal data (subject to
              legal retention requirements)
            </li>
            <li>
              <strong>Right to data portability:</strong> Receive your data in a structured,
              commonly used format (CSV export available for Pro users)
            </li>
            <li>
              <strong>Right to object:</strong> Object to the processing of your personal data for
              specific purposes
            </li>
            <li>
              <strong>Right to lodge a complaint:</strong> File a complaint with the National
              Privacy Commission (NPC) if you believe your rights have been violated
            </li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at{" "}
            <a href="mailto:hello@ledgr.ink">hello@ledgr.ink</a>. We will respond to your
            request within 30 days.
          </p>
          <p>
            <strong>National Privacy Commission (NPC):</strong>
            <br />
            Website:{" "}
            <a
              href="https://www.privacy.gov.ph"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.privacy.gov.ph
            </a>
            <br />
            Email: info@privacy.gov.ph
          </p>

          <h2>Cookies & Tracking</h2>
          <p>
            ledgr uses cookies and similar tracking technologies to enhance your experience:
          </p>
          <ul>
            <li>
              <strong>Essential cookies:</strong> Required for login, session management, and core
              functionality
            </li>
            <li>
              <strong>Analytics cookies:</strong> Help us understand how you use the app
              (anonymized data)
            </li>
          </ul>
          <p>
            You can control cookies through your browser settings. Note that disabling essential
            cookies may affect the functionality of ledgr.
          </p>

          <h2>International Data Transfers</h2>
          <p>
            Your data may be transferred to and stored on servers located outside the Philippines,
            particularly in regions where Supabase and other service providers operate their data
            centers. We ensure that any international transfers comply with applicable data
            protection laws and that appropriate safeguards are in place.
          </p>

          <h2>Children's Privacy</h2>
          <p>
            ledgr is not intended for users under 18 years of age. We do not knowingly collect
            personal information from children. If you believe we have collected information from a
            minor, please contact us immediately at{" "}
            <a href="mailto:hello@ledgr.ink">hello@ledgr.ink</a>.
          </p>

          <h2>Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active or as needed to
            provide you with our Service. If you delete your account, we will delete or anonymize
            your data within 90 days, except where we are required to retain it for legal or
            regulatory purposes.
          </p>

          <h2>Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time to reflect changes in our practices
            or for legal, operational, or regulatory reasons. When we make significant changes,
            we will:
          </p>
          <ul>
            <li>Update the "Last updated" date at the top of this page</li>
            <li>Notify you via email or through an in-app notification</li>
            <li>Request your acceptance of the updated policy when necessary</li>
          </ul>
          <p>
            Your continued use of ledgr after any changes constitutes your acceptance of the
            updated Privacy Policy.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or how we
            handle your personal data, please contact us:
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <a href="mailto:hello@ledgr.ink">hello@ledgr.ink</a>
            <br />
            <strong>Data Protection Officer:</strong>{" "}
            <a href="mailto:hello@ledgr.ink">hello@ledgr.ink</a>
          </p>
          <p>We typically respond to inquiries within 24-48 hours.</p>

          <hr />

          <p className="text-sm text-stone-500">
            By using ledgr, you acknowledge that you have read and understood this Privacy
            Policy. For information about our terms of use, please see our{" "}
            <Link href="/terms" className="text-teal-600 hover:text-teal-700">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
