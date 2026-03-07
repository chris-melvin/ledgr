"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccessCheckResult } from "@/hooks/use-subscription";

interface UpgradePromptProps {
  accessResult: AccessCheckResult;
  variant?: "inline" | "card" | "banner";
  className?: string;
}

export function UpgradePrompt({
  accessResult,
  variant = "card",
  className,
}: UpgradePromptProps) {
  if (accessResult.hasAccess || !accessResult.upgradePrompt) {
    return null;
  }

  const { title, description, ctaText, ctaHref } = accessResult.upgradePrompt;
  const isCredits = accessResult.reason === "insufficient_credits";
  const Icon = isCredits ? Sparkles : Lock;

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "w-full py-3 px-4",
          "bg-gradient-to-r from-amber-50 to-amber-100/50",
          "border-b border-amber-200",
          className
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-sm text-amber-900">{description}</span>
          </div>
          <Link
            href={ctaHref}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-lg shrink-0",
              "bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
            )}
          >
            {ctaText}
          </Link>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg",
          "bg-amber-50 border border-amber-200",
          className
        )}
      >
        <Icon className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-900 truncate">{description}</p>
        </div>
        <Link
          href={ctaHref}
          className={cn(
            "flex items-center gap-1 px-3 py-1 rounded-md shrink-0",
            "bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
          )}
        >
          {ctaText}
        </Link>
      </div>
    );
  }

  // Card variant (default)
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        "bg-gradient-to-br from-stone-50 to-amber-50/30",
        "border border-stone-200/60 rounded-2xl",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-amber-600" />
      </div>

      <h3 className="text-lg font-semibold text-stone-900 mb-2">{title}</h3>
      <p className="text-sm text-stone-500 max-w-sm mb-6">{description}</p>

      <Link
        href={ctaHref}
        className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-xl",
          "bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
        )}
      >
        {ctaText}
      </Link>
    </div>
  );
}

/**
 * Simple lock icon overlay for locked features
 */
export function LockedOverlay({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        "bg-stone-900/5 backdrop-blur-[1px] rounded-lg cursor-pointer",
        "hover:bg-stone-900/10 transition-colors",
        className
      )}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 shadow-sm">
        <Lock className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-stone-600">Pro</span>
      </div>
    </div>
  );
}
