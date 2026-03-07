"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/subscription";
import { PRICING_DISPLAY, SUBSCRIPTION_TIERS } from "@/lib/payments/config";
import { Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingContentProps {
  isLoggedIn: boolean;
  userEmail?: string;
}

export function PricingContent({ isLoggedIn }: PricingContentProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const pricing = PRICING_DISPLAY.pro;
  const currentPrice =
    billingCycle === "monthly" ? pricing.monthly : pricing.yearly;

  const handleBillingCycleChange = useCallback(
    (cycle: "monthly" | "yearly") => {
      setBillingCycle(cycle);
      posthog.capture("billing_cycle_changed", { billing_cycle: cycle });
    },
    []
  );

  return (
    <div className="relative">
      {/* Grid background */}
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(#E7E3DB 1px, transparent 1px),
            linear-gradient(90deg, #E7E3DB 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-[#FDFBF7]" />

      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-700 mb-3">
            Pricing
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-800 tracking-tight mb-4">
            Simple, honest pricing.
          </h1>
          <p className="text-lg text-stone-500 max-w-xl mx-auto">
            Start free, upgrade when you need more. No surprises.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="relative inline-flex items-center bg-stone-100 rounded-full p-1">
            <div
              className={cn(
                "absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-out",
                billingCycle === "yearly" && "translate-x-[calc(100%+4px)]"
              )}
            />
            <button
              onClick={() => handleBillingCycleChange("monthly")}
              className={cn(
                "relative z-10 px-5 py-2 text-sm font-medium rounded-full transition-colors duration-200",
                billingCycle === "monthly"
                  ? "text-stone-900"
                  : "text-stone-500 hover:text-stone-700"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => handleBillingCycleChange("yearly")}
              className={cn(
                "relative z-10 px-5 py-2 text-sm font-medium rounded-full transition-colors duration-200 flex items-center gap-2",
                billingCycle === "yearly"
                  ? "text-stone-900"
                  : "text-stone-500 hover:text-stone-700"
              )}
            >
              Yearly
              <span className="bg-teal-50 text-teal-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                Save {pricing.yearly.savingsPercent}%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white rounded-2xl border border-stone-200 p-8 hover:shadow-lg transition-all duration-300">
            <div className="mb-6">
              <h2 className="font-serif text-2xl font-bold text-stone-800 mb-2">
                Free
              </h2>
              <p className="text-stone-500 text-sm">
                Get started with the basics
              </p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-4xl font-bold text-stone-800">
                  {"\u20B1"}0
                </span>
                <span className="text-stone-500">/month</span>
              </div>
              <p className="text-sm text-stone-400 mt-1">Free forever</p>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="w-full mb-8 rounded-xl"
              asChild
            >
              <Link href={isLoggedIn ? "/dashboard" : "/signup"}>
                {isLoggedIn ? "Go to Dashboard" : "Get Started"}
              </Link>
            </Button>

            <div className="space-y-4">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                What&apos;s included
              </p>
              <ul className="space-y-3">
                {SUBSCRIPTION_TIERS.free.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                    <span className="text-stone-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pro Tier */}
          <div className="relative bg-white rounded-2xl border-2 border-teal-200 p-8 hover:shadow-lg transition-all duration-300">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="inline-flex items-center gap-1.5 bg-teal-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                Recommended
              </div>
            </div>

            <div className="mb-6 pt-2">
              <h2 className="font-serif text-2xl font-bold text-stone-800 mb-2">
                Pro
              </h2>
              <p className="text-stone-500 text-sm">For serious budgeters</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-4xl font-bold text-stone-800">
                  {currentPrice.formatted}
                </span>
                <span className="text-stone-500">/{currentPrice.period}</span>
              </div>
              {billingCycle === "yearly" && (
                <p className="text-sm text-teal-600 mt-1 font-medium">
                  {pricing.yearly.monthlyEquivalent}/month · Save{" "}
                  {pricing.yearly.savings}
                </p>
              )}
              {billingCycle === "monthly" && (
                <p className="text-sm text-stone-400 mt-1">Billed monthly</p>
              )}
            </div>

            <CheckoutButton
              billingCycle={billingCycle}
              isLoggedIn={isLoggedIn}
              size="lg"
              className="w-full mb-8 bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-all rounded-xl"
            >
              <Zap className="w-4 h-4" />
              Upgrade to Pro
            </CheckoutButton>

            <div className="space-y-4">
              <p className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">
                Everything in Free, plus
              </p>
              <ul className="space-y-3">
                {SUBSCRIPTION_TIERS.pro.features.slice(1).map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span className="text-stone-700 text-sm font-medium">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap justify-center gap-6">
            {["Cancel anytime", "Secure payments", "14-day money-back guarantee"].map(
              (item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600" />
                  <span className="text-sm text-stone-500">{item}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Refund + Contact */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-stone-500">
            See our{" "}
            <Link
              href="/refund"
              className="text-teal-600 hover:text-teal-700 font-medium underline underline-offset-4"
            >
              refund policy
            </Link>{" "}
            for details.
          </p>
          <p className="text-stone-500">
            Have questions?{" "}
            <a
              href="mailto:hello@ledgr.ink"
              className="text-teal-600 hover:text-teal-700 font-medium underline underline-offset-4"
            >
              Get in touch
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
