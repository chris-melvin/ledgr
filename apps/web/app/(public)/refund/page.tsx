import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy - ledgr",
  description:
    "Our straightforward refund policy for ledgr Pro subscriptions. 14-day money-back guarantee.",
  robots: "index, follow",
};

export default function RefundPage() {
  return (
    <div className="py-16 px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Refund Policy
          </h1>
          <p className="mt-4 text-sm text-stone-500">
            Last updated: January 17, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-stone max-w-none">
          <h2>Our Commitment</h2>
          <p>
            We want you to be completely satisfied with ledgr. If you're not happy with your Pro
            subscription, we offer a straightforward refund policy to ensure you feel confident
            trying our Service.
          </p>

          <h2>14-Day Money-Back Guarantee</h2>
          <p>
            If you upgrade to ledgr Pro and decide it's not the right fit for you, we'll refund
            your full payment if you request it within <strong>14 days</strong> of your initial
            purchase.
          </p>
          <p>This guarantee applies to:</p>
          <ul>
            <li>Your first Pro subscription purchase (monthly or yearly)</li>
            <li>Both new users and Free tier users upgrading to Pro</li>
          </ul>

          <h2>Free Tier</h2>
          <p>
            The Free tier is always free—no payment required, so no refunds needed! You can use
            ledgr's Free tier indefinitely at no cost. There are no trials or hidden charges.
          </p>

          <h2>Pro Subscription Refunds</h2>

          <h3>Initial Purchase - Full Refund Available</h3>
          <div className="bg-teal-50 border-l-4 border-teal-500 p-4 my-6 rounded">
            <p className="m-0">
              ✅ <strong>Full refund available</strong> within 14 days of your first Pro payment
            </p>
          </div>
          <p>
            When you first subscribe to ledgr Pro (₱250/month or ₱2,500/year), you have 14 days
            to try all Pro features risk-free. If you're not satisfied, we'll refund your entire
            payment—no questions asked.
          </p>

          <h3>Renewals - No Refunds (But You Can Cancel)</h3>
          <div className="bg-stone-100 border-l-4 border-stone-400 p-4 my-6 rounded">
            <p className="m-0">
              ❌ <strong>No refunds</strong> for renewal charges (monthly or yearly)
              <br />
              ✅ <strong>You can cancel</strong> anytime to stop future charges
            </p>
          </div>
          <p>
            After your initial 14-day period, subscription renewals are non-refundable. However, you
            can cancel your subscription at any time to prevent future charges. When you cancel,
            you'll retain access to Pro features until the end of your current billing period.
          </p>

          <h3>How to Request a Refund</h3>
          <p>If you're within the 14-day window and would like a refund, follow these steps:</p>
          <ol>
            <li>
              Email us at{" "}
              <a href="mailto:hello@ledgr.ink" className="text-teal-600 hover:text-teal-700">
                hello@ledgr.ink
              </a>
            </li>
            <li>
              Include:
              <ul>
                <li>Your account email address</li>
                <li>The date you subscribed to Pro</li>
                <li>
                  (Optional but helpful) A brief reason for the refund so we can improve our Service
                </li>
              </ul>
            </li>
            <li>We'll process your request within 2 business days</li>
            <li>
              Your refund will appear in your account within 5-10 business days via your original
              payment method
            </li>
          </ol>
          <p>
            We strive to make the refund process quick and hassle-free. You don't need to provide
            extensive justification—we trust you.
          </p>

          <h2>Cancellation Policy</h2>
          <p>
            Canceling your subscription is different from requesting a refund. Here's what each
            means:
          </p>
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>What Happens</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Cancel Subscription</strong>
                </td>
                <td>
                  Stops future billing. You keep Pro access until the end of your current billing
                  period (month or year). No refund for current period.
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Request Refund</strong>
                </td>
                <td>
                  Returns payment for the current period (if within 14 days of initial purchase).
                  Pro access ends immediately upon refund approval.
                </td>
              </tr>
            </tbody>
          </table>

          <h3>How to Cancel Your Subscription</h3>
          <p>You can cancel your Pro subscription at any time:</p>
          <ol>
            <li>Go to your Account Settings in the ledgr app</li>
            <li>Navigate to the Subscription section</li>
            <li>Click "Cancel Subscription"</li>
            <li>Confirm your cancellation</li>
          </ol>
          <p>
            Your Pro access will continue until the end of your current billing period, and you
            won't be charged again. You'll automatically revert to the Free tier when your
            subscription ends.
          </p>

          <h2>Non-Refundable Situations</h2>
          <p>We cannot issue refunds in the following situations:</p>
          <ul>
            <li>
              <strong>After the 14-day window:</strong> More than 14 days have passed since your
              initial Pro purchase
            </li>
            <li>
              <strong>Renewal charges:</strong> You're requesting a refund for a subscription
              renewal (you can cancel to avoid future charges)
            </li>
            <li>
              <strong>Terms of Service violations:</strong> Your account was terminated for
              violating our{" "}
              <Link href="/terms" className="text-teal-600 hover:text-teal-700">
                Terms of Service
              </Link>
            </li>
            <li>
              <strong>Fraudulent activity:</strong> We've detected fraudulent or abusive behavior on
              your account
            </li>
            <li>
              <strong>Already refunded:</strong> You've already received a refund for the same
              subscription period
            </li>
          </ul>
          <p>
            If you're outside the 14-day refund window but experiencing issues with the Service,
            please contact us at{" "}
            <a href="mailto:hello@ledgr.ink">hello@ledgr.ink</a>. We're happy to help
            troubleshoot or discuss your concerns.
          </p>

          <h2>Philippine Consumer Rights</h2>
          <p>
            Under the Consumer Act of the Philippines (Republic Act No. 7394), you have rights as a
            consumer. We are committed to fair and transparent business practices.
          </p>
          <p>
            If you have a complaint or concern that we haven't resolved to your satisfaction, you
            may contact:
          </p>
          <ul>
            <li>
              <strong>ledgr Support:</strong>{" "}
              <a href="mailto:hello@ledgr.ink">hello@ledgr.ink</a>
            </li>
            <li>
              <strong>Department of Trade and Industry (DTI):</strong>
              <br />
              Website:{" "}
              <a
                href="https://www.dti.gov.ph/complaints/"
                target="_blank"
                rel="noopener noreferrer"
              >
                www.dti.gov.ph/complaints/
              </a>
              <br />
              Hotline: 1-DTI (1-384)
            </li>
          </ul>

          <h2>Payment Processing</h2>
          <p>
            All payments and refunds are processed through{" "}
            <a
              href="https://www.paddle.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Paddle
            </a>
            , our secure payment processor. When we approve your refund, Paddle handles the actual
            transaction.
          </p>
          <p>Key points about refund processing:</p>
          <ul>
            <li>Refunds are issued to your original payment method (credit card, debit card, etc.)</li>
            <li>Processing time: 5-10 business days to appear in your account</li>
            <li>
              The exact timing depends on your bank or payment provider's processing schedule
            </li>
            <li>
              You'll receive a confirmation email from Paddle once the refund is processed
            </li>
          </ul>
          <p>
            If you don't see your refund after 10 business days, please check with your bank first,
            then contact us at{" "}
            <a href="mailto:hello@ledgr.ink">hello@ledgr.ink</a> for assistance.
          </p>

          <h2>Partial Refunds</h2>
          <p>
            We do not offer partial refunds or pro-rated refunds for yearly subscriptions. If you
            cancel a yearly subscription after the 14-day refund window, you'll retain access until
            the end of the year you paid for, but you won't receive a refund for unused months.
          </p>
          <p>
            <strong>Example:</strong> If you purchased a yearly Pro subscription (₱2,500/year) and
            cancel after 3 months, you'll keep Pro access for the remaining 9 months, but no refund
            will be issued.
          </p>

          <h2>Questions or Concerns?</h2>
          <p>
            We're here to help! If you have any questions about our refund policy, your
            subscription, or need assistance with anything else, please don't hesitate to reach out:
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <a href="mailto:hello@ledgr.ink" className="text-teal-600 hover:text-teal-700">
              hello@ledgr.ink
            </a>
            <br />
            <strong>Response Time:</strong> We typically respond within 24 hours
          </p>
          <p>
            We value your feedback and want to ensure you have the best experience possible with
            ledgr.
          </p>

          <hr />

          <p className="text-sm text-stone-500">
            For more information about how we handle your data and our terms of service, please see
            our{" "}
            <Link href="/privacy" className="text-teal-600 hover:text-teal-700">
              Privacy Policy
            </Link>{" "}
            and{" "}
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
