import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About - ledgr",
  description:
    "Learn about ledgr's mission to bring daily spending clarity and financial freedom to Filipinos.",
  robots: "index, follow",
};

export default function AboutPage() {
  return (
    <div className="py-16 px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
            Budget with clarity, not restriction
          </h1>
          <p className="mt-6 text-lg text-stone-600 max-w-2xl mx-auto">
            ledgr is built for Filipinos who want to take control of their finances without the
            guilt, complexity, or overwhelm of traditional budgeting.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-stone max-w-none">
          <h2>Our Mission</h2>
          <p>
            Too many budgeting apps make you feel guilty when you overspend in a category. They're
            rigid, punishing, and designed for people who already have their finances figured out.
          </p>
          <p>
            <strong>ledgr is different.</strong> We believe budgeting should give you freedom,
            not restriction. Our mission is to give every Filipino one simple number each day:{" "}
            <em>"Here's what you can safely spend today."</em>
          </p>
          <p>
            No guilt. No judgment. Just clarity.
          </p>

          <h2>The Problem We're Solving</h2>
          <p>
            Traditional budgeting apps ask you to divide your money into categories (groceries,
            transportation, entertainment). But life doesn't work that way:
          </p>
          <ul>
            <li>You overspend on groceries one week, and suddenly feel like you've "failed"</li>
            <li>You underspend on transportation, but can't easily use that money elsewhere</li>
            <li>Monthly budgets don't help you answer: "Can I afford this coffee right now?"</li>
          </ul>
          <p>
            <strong>The result?</strong> You abandon the budget, feel guilty, and go back to winging
            it.
          </p>

          <h2>How ledgr Works</h2>
          <p>
            ledgr takes a different approach: <strong>daily allowance budgeting</strong>.
          </p>
          <ol>
            <li>
              <strong>Tell us your income and bills:</strong> We calculate how much you have left
              after fixed expenses
            </li>
            <li>
              <strong>Get your daily allowance:</strong> We divide your remaining money by the
              number of days left in the month
            </li>
            <li>
              <strong>Spend freely within your daily limit:</strong> No categories, no guilt—just
              one number to guide you
            </li>
            <li>
              <strong>Auto-rebalance every day:</strong> Overspent today? Tomorrow's budget adjusts
              automatically. Underspent? You get a little extra tomorrow.
            </li>
          </ol>
          <p>
            It's budgeting that works <em>with</em> you, not against you.
          </p>

          <h2>Built for Filipinos</h2>
          <p>
            ledgr was designed specifically for the Philippine market:
          </p>
          <ul>
            <li>
              <strong>Peso pricing:</strong> ₱250/month for Pro (not $9.99 with hidden conversion
              fees)
            </li>
            <li>
              <strong>Paycheck-to-paycheck friendly:</strong> Most budgeting advice assumes you have
              savings. We meet you where you are.
            </li>
            <li>
              <strong>Mobile-first:</strong> Track expenses on the go, right when you spend
            </li>
            <li>
              <strong>Natural language input:</strong> Just type "coffee 150 and grab 80" instead of
              filling out forms
            </li>
          </ul>

          <h2>Key Features</h2>

          <h3>Daily Spending Clarity</h3>
          <p>
            Wake up every day knowing exactly how much you can spend. No math, no guesswork—just
            open the app and see your number.
          </p>

          <h3>Auto-Rebalancing</h3>
          <p>
            Life happens. When you overspend, ledgr automatically adjusts tomorrow's budget. No
            guilt, no lectures—just a gentle nudge to balance things out.
          </p>

          <h3>Flex Bucket</h3>
          <p>
            Want to save for something big (a new phone, a weekend trip) without feeling guilty
            about "splurging"? The Flex Bucket lets you set aside money for larger purchases
            separately from your daily spend.
          </p>

          <h3>Calendar View</h3>
          <p>
            See your entire month at a glance. Color-coded days show you when you overspent (red),
            stayed on track (green), or had a light spending day. Patterns become obvious.
          </p>

          <h3>Income & Bills Tracking</h3>
          <p>
            Log your salary, side income, and freelance gigs. Mark bills as paid. ledgr factors
            everything into your daily allowance automatically.
          </p>

          <h3>Debt Snowball</h3>
          <p>
            Paying off debt? ledgr helps you allocate payments and track progress using the
            proven debt snowball method.
          </p>

          <h3>Analytics (Pro)</h3>
          <p>
            Pro users get advanced visualizations: cash flow diagrams, spending trends, category
            breakdowns, and more. See exactly where your money goes.
          </p>

          <h2>Who It's For</h2>
          <ul>
            <li>
              <strong>Paycheck-to-paycheck earners</strong> who need daily clarity, not monthly
              plans
            </li>
            <li>
              <strong>Freelancers</strong> with irregular income who struggle with traditional
              budgets
            </li>
            <li>
              <strong>Young professionals</strong> (25-35) starting their financial journey
            </li>
            <li>
              <strong>Couples and families</strong> who want to budget together without arguments
            </li>
            <li>
              <strong>Anyone tired of budgeting apps that make you feel guilty</strong>
            </li>
          </ul>

          <h2>Our Values</h2>

          <h3>Freedom Over Restriction</h3>
          <p>
            Budgeting should expand your choices, not limit them. We help you make informed
            decisions, not feel restricted.
          </p>

          <h3>Clarity Over Complexity</h3>
          <p>
            One number. That's all you need to know each day. No complicated spreadsheets, no
            20-category breakdowns.
          </p>

          <h3>Progress Over Perfection</h3>
          <p>
            You won't get it right every day, and that's okay. ledgr focuses on trends and
            progress, not perfect execution.
          </p>

          <h3>Privacy & Security</h3>
          <p>
            Your financial data is sensitive. We encrypt everything, never sell your data, and give
            you full control to export or delete your information anytime. Learn more in our{" "}
            <Link href="/privacy" className="text-teal-600 hover:text-teal-700">
              Privacy Policy
            </Link>
            .
          </p>

          <h2>Why "ledgr"?</h2>
          <p>
            A ledger is the oldest and most fundamental tool in finance—a record of what comes in
            and what goes out. We took that timeless concept and modernized it: ledgr is your
            financial record, simplified.
          </p>
          <p>
            The name reflects our philosophy: strip away the complexity, keep what matters. No
            unnecessary vowels, no unnecessary features. Just clarity about your money, every day.
          </p>

          <h2>Pricing</h2>
          <p>
            ledgr has two tiers:
          </p>
          <ul>
            <li>
              <strong>Free:</strong> All core features (expense tracking, budget setup, daily
              allowance calculations, calendar view)
            </li>
            <li>
              <strong>Pro (₱250/month or ₱2,500/year):</strong> Advanced analytics, CSV/PDF
              exports, priority support
            </li>
          </ul>
          <p>
            We believe everyone deserves access to good budgeting tools, which is why our Free tier
            is genuinely useful—not a limited trial. Upgrade to Pro when you're ready for deeper
            insights.
          </p>

          <div className="my-8 text-center">
            <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700">
              <Link href="/pricing">See Pricing Details</Link>
            </Button>
          </div>

          <h2>Get in Touch</h2>
          <p>
            Have questions? Want to share feedback? We'd love to hear from you.
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <a href="mailto:hello@ledgr.ink" className="text-teal-600 hover:text-teal-700">
              hello@ledgr.ink
            </a>
            <br />
            <strong>Twitter:</strong>{" "}
            <a
              href="https://twitter.com/ledgr_ink"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:text-teal-700"
            >
              @ledgr_ink
            </a>
          </p>

          <hr />

          <div className="text-center my-12">
            <h2 className="text-2xl font-semibold text-stone-900 mb-4">
              Ready to budget with clarity?
            </h2>
            <p className="text-stone-600 mb-6">
              Join Filipinos who've found financial freedom with ledgr.
            </p>
            <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700">
              <Link href="/signup">Start Free Today</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
