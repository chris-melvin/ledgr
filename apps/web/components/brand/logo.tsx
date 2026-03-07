"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "default" | "mono" | "white";
  className?: string;
}

const sizeMap = {
  sm: { iconSize: 20, lineH: 1.5, gap: "gap-1.5", text: "text-base" },
  md: { iconSize: 24, lineH: 2, gap: "gap-2", text: "text-lg" },
  lg: { iconSize: 30, lineH: 2.5, gap: "gap-2.5", text: "text-xl" },
  xl: { iconSize: 36, lineH: 3, gap: "gap-3", text: "text-2xl" },
};

const variantMap = {
  default: {
    lines: "bg-teal-600",
    accent: "bg-neutral-800",
    text: "text-neutral-800",
  },
  mono: {
    lines: "bg-neutral-600",
    accent: "bg-neutral-800",
    text: "text-neutral-800",
  },
  white: {
    lines: "bg-white/80",
    accent: "bg-white",
    text: "text-white",
  },
};

function LedgerLinesIcon({ size, variant }: { size: keyof typeof sizeMap; variant: keyof typeof variantMap }) {
  const s = sizeMap[size];
  const v = variantMap[variant];
  return (
    <div className="flex flex-col justify-center gap-[3px]" style={{ width: s.iconSize, height: s.iconSize, padding: s.iconSize * 0.15 }}>
      <div className={cn("rounded-full", v.lines)} style={{ height: s.lineH, width: "100%" }} />
      <div className={cn("rounded-full", v.lines)} style={{ height: s.lineH, width: "70%" }} />
      <div className={cn("rounded-full", v.lines)} style={{ height: s.lineH, width: "85%" }} />
      <div className={cn("rounded-full", v.accent)} style={{ height: s.lineH, width: "50%" }} />
    </div>
  );
}

export function Logo({
  size = "md",
  showText = true,
  variant = "default",
  className,
}: LogoProps) {
  const sizeStyles = sizeMap[size];
  const v = variantMap[variant];

  return (
    <div className={cn("flex items-center", sizeStyles.gap, className)}>
      <LedgerLinesIcon size={size} variant={variant} />
      {showText && (
        <span className={cn("font-sans font-bold tracking-tight", sizeStyles.text, v.text)}>
          ledgr
        </span>
      )}
    </div>
  );
}

export function LogoIcon({
  size = "md",
  variant = "default",
  className,
}: Omit<LogoProps, "showText">) {
  return (
    <Logo size={size} variant={variant} showText={false} className={className} />
  );
}
