"use client";

import { useMemo, lazy, Suspense } from "react";
import { Sparkles, TrendingDown, AlertCircle, Zap } from "lucide-react";
import { isSameDay, subDays } from "date-fns";
import { animated, to } from "@react-spring/web";
import { cn } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useShaderConfig } from "@/components/shaders/use-shader-config";
import { formatInTimezone } from "@/lib/utils/date";
import { useCardTilt } from "./hero-card/use-card-tilt";
import { CardGlareOverlay } from "./hero-card/card-glare-overlay";
import { CardDepthLayer } from "./hero-card/card-depth-layer";
import { CircularProgress } from "./hero-card/circular-progress";
import { CardCustomizeSheet } from "./hero-card/card-customize-sheet";
import { useCardCustomization } from "./hero-card/use-card-customization";
import {
  type CardPreferences,
  type BackgroundStyle,
  getThemeColors,
  getGreeting,
} from "./hero-card/card-theme";

const MeshGradient = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.MeshGradient }))
);

const GrainGradient = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.GrainGradient }))
);

interface ExpenseItem {
  label: string;
  amount: number;
}

interface HeroDailyCardProps {
  remaining: number;
  limit?: number;
  spent: number;
  expenses?: ExpenseItem[];
  date?: Date;
  timezone?: string;
  isBudgetMode?: boolean;
  cardPreferences?: CardPreferences;
}

type BudgetStatus = "safe" | "close" | "low" | "over";

function getBudgetStatus(remaining: number, limit: number): BudgetStatus {
  const percentRemaining = (remaining / limit) * 100;
  if (remaining < 0) return "over";
  if (percentRemaining < 20) return "low";
  if (percentRemaining < 50) return "close";
  return "safe";
}

const STATUS_CONFIG = {
  safe: {
    message: "You're on track. Keep it up!",
    icon: Sparkles,
    textColor: "text-emerald-600",
    accentBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    barColor: "bg-emerald-400",
    label: "On Track",
  },
  close: {
    message: "Getting close. Spend mindfully.",
    icon: Zap,
    textColor: "text-amber-600",
    accentBg: "bg-amber-50",
    iconColor: "text-amber-500",
    barColor: "bg-amber-400",
    label: "Watch It",
  },
  low: {
    message: "Almost at limit. Consider pausing.",
    icon: TrendingDown,
    textColor: "text-orange-600",
    accentBg: "bg-orange-50",
    iconColor: "text-orange-500",
    barColor: "bg-orange-400",
    label: "Low",
  },
  over: {
    message: "Over budget. Tomorrow is a fresh start.",
    icon: AlertCircle,
    textColor: "text-rose-600",
    accentBg: "bg-rose-50",
    iconColor: "text-rose-500",
    barColor: "bg-rose-400",
    label: "Over",
  },
};

function ShaderBackground({
  bgStyle,
  shaderColors,
  cssGradient,
  enabled,
  speed,
}: {
  bgStyle: BackgroundStyle;
  shaderColors: string[];
  cssGradient: string;
  enabled: boolean;
  speed: number;
}) {
  const fallback = <div className="w-full h-full" style={{ background: cssGradient }} />;

  if (!enabled || bgStyle === "static") {
    return fallback;
  }

  if (bgStyle === "grain") {
    return (
      <Suspense fallback={fallback}>
        <GrainGradient
          colors={shaderColors}
          speed={speed}
          width="100%"
          height="100%"
        />
      </Suspense>
    );
  }

  // Default: mesh
  return (
    <Suspense fallback={fallback}>
      <MeshGradient
        colors={shaderColors}
        speed={speed}
        distortion={0.25}
        swirl={0.1}
        grainOverlay={0.02}
        width="100%"
        height="100%"
      />
    </Suspense>
  );
}

export function HeroDailyCard({
  remaining,
  limit = 300,
  spent,
  expenses = [],
  date,
  timezone,
  isBudgetMode = false,
  cardPreferences,
}: HeroDailyCardProps) {
  const { prefs, update: updatePref } = useCardCustomization(cardPreferences);
  const status = useMemo(() => getBudgetStatus(remaining, limit), [remaining, limit]);
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const percentRemaining = Math.max(0, (remaining / limit) * 100);
  const { enabled: shadersEnabled, speed } = useShaderConfig();

  const { shaderColors, cssGradient } = useMemo(
    () => getThemeColors(prefs.theme, status, isBudgetMode),
    [prefs.theme, status, isBudgetMode]
  );

  const { rotateX, rotateY, scale, glareX, glareY, bind } = useCardTilt(prefs.enableTilt);

  const now = new Date();
  const displayDate = date ?? now;
  const isDateToday = isSameDay(displayDate, now);
  const isYesterday = isSameDay(displayDate, subDays(now, 1));

  const dayLabel = isDateToday ? "Today" : isYesterday ? "Yesterday" : (
    timezone
      ? formatInTimezone(displayDate, timezone, "EEEE")
      : displayDate.toLocaleDateString("en-US", { weekday: "long" })
  );

  const dateDisplay = timezone
    ? formatInTimezone(displayDate, timezone, "EEEE, MMMM d")
    : displayDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });

  const emptyText = isDateToday
    ? "No expenses yet today. Start fresh!"
    : isYesterday
      ? "No expenses recorded"
      : "No expenses yet";

  const expensesLabel = isDateToday ? "Today\u2019s Expenses" : "Expenses";

  const greeting = prefs.displayName ? getGreeting(prefs.displayName) : null;

  return (
    <animated.div
      {...bind}
      className="group/hero"
      style={{
        perspective: "800px",
        transform: to(
          [rotateX, rotateY, scale],
          (rx, ry, s) =>
            `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`
        ),
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      <div
        className={cn(
          "relative w-full max-w-md mx-auto overflow-hidden",
          "rounded-3xl border border-stone-200/60",
          "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]"
        )}
      >
        {/* Shader / gradient background — Layer 0 */}
        <div className="absolute inset-0">
          <ShaderBackground
            bgStyle={prefs.backgroundStyle}
            shaderColors={shaderColors}
            cssGradient={cssGradient}
            enabled={shadersEnabled}
            speed={speed}
          />
        </div>

        {/* Glare overlay — Layer 1 */}
        {prefs.enableGlare && (
          <CardGlareOverlay
            glareX={glareX}
            glareY={glareY}
            style={prefs.glareStyle}
          />
        )}

        <div className="relative p-6 sm:p-8" style={{ transformStyle: "preserve-3d" }}>
          {/* Greeting — above date header */}
          {greeting && (
            <CardDepthLayer rotateX={rotateX} rotateY={rotateY}>
              <p className="text-sm text-neutral-500 font-medium mb-3 animate-in fade-in duration-500">
                {greeting}
              </p>
            </CardDepthLayer>
          )}

          {/* Header — Layer 2 */}
          <CardDepthLayer rotateX={rotateX} rotateY={rotateY}>
            <div className="flex items-start justify-between mb-6">
              <div className="animate-in fade-in slide-in-from-left-2 duration-500">
                <p className="text-xs text-neutral-400 uppercase tracking-[0.2em] font-medium mb-1">
                  {dayLabel}
                </p>
                <h2 className="text-sm sm:text-base text-neutral-600 font-medium">{dateDisplay}</h2>
              </div>
              {isBudgetMode && (
                <div
                  className={cn(
                    "animate-in fade-in zoom-in duration-500 delay-100",
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                    config.accentBg
                  )}
                >
                  <StatusIcon className={cn("w-3.5 h-3.5", config.iconColor)} />
                  <span className={cn("text-xs font-medium", config.textColor)}>{config.label}</span>
                </div>
              )}
            </div>
          </CardDepthLayer>

          {isBudgetMode ? (
            <>
              {/* Budget mode: circular progress + remaining amount — Layer 3 */}
              <CardDepthLayer
                rotateX={rotateX}
                rotateY={rotateY}
                zOffset={10}
                parallax={0.5}
              >
                <div className="flex items-center gap-6 sm:gap-8 mb-6">
                  <div className="animate-in fade-in zoom-in duration-700 delay-200 flex-shrink-0">
                    <CircularProgress percent={percentRemaining} status={status} />
                  </div>

                  <div className="animate-in fade-in slide-in-from-right-4 duration-700 delay-300 flex-1 min-w-0">
                    <div className="mb-1">
                      <span
                        className={cn(
                          "text-4xl sm:text-5xl font-bold tracking-tight",
                          status === "over" ? "text-rose-600" : "text-neutral-900"
                        )}
                      >
                        {status === "over" && "-"}
                        {CURRENCY}
                        <AnimatedNumber value={Math.abs(remaining)} duration={600} />
                      </span>
                    </div>
                    <p className="text-sm text-neutral-400">
                      {status === "over" ? (
                        <>
                          over your {CURRENCY}
                          {limit.toLocaleString()} budget
                        </>
                      ) : (
                        <>
                          remaining of {CURRENCY}
                          {limit.toLocaleString()}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </CardDepthLayer>

              {/* Insight message — Layer 4 */}
              <CardDepthLayer
                rotateX={rotateX}
                rotateY={rotateY}
                zOffset={5}
                parallax={0.3}
              >
                <div
                  className={cn(
                    "animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400",
                    "flex items-center gap-2 px-4 py-3 rounded-2xl mb-4",
                    "bg-white/60 border border-stone-100"
                  )}
                >
                  <div className={cn("w-1 h-8 rounded-full", config.barColor)} />
                  <p className="text-sm text-neutral-600 font-medium">{config.message}</p>
                </div>
              </CardDepthLayer>
            </>
          ) : (
            /* Tracking mode: just total spent — Layer 3 */
            <CardDepthLayer
              rotateX={rotateX}
              rotateY={rotateY}
              zOffset={10}
              parallax={0.5}
            >
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 mb-6">
                <div className="mb-1">
                  <span className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900">
                    {CURRENCY}
                    <AnimatedNumber value={spent} duration={600} />
                  </span>
                </div>
                <p className="text-sm text-neutral-400">spent {dayLabel.toLowerCase()}</p>
              </div>
            </CardDepthLayer>
          )}

          {/* Today's expenses — Layer 5 */}
          {expenses.length > 0 && (
            <CardDepthLayer
              rotateX={rotateX}
              rotateY={rotateY}
              zOffset={15}
              parallax={0.8}
            >
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500">
                <p className="text-[10px] text-neutral-400 uppercase tracking-[0.15em] mb-2">
                  {expensesLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {expenses.map((expense, i) => (
                    <span
                      key={i}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                        "bg-white/80 border border-stone-100",
                        "text-xs text-neutral-600 font-medium",
                        "animate-in fade-in zoom-in duration-300"
                      )}
                      style={{ animationDelay: `${600 + i * 50}ms` }}
                    >
                      {expense.label}
                      <span className="text-neutral-400 tabular-nums">
                        {CURRENCY}
                        {expense.amount}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </CardDepthLayer>
          )}

          {/* Empty state */}
          {expenses.length === 0 && spent === 0 && (
            <div className="animate-in fade-in duration-500 delay-500 text-center py-2">
              <p className="text-xs text-neutral-400">{emptyText}</p>
            </div>
          )}
        </div>

        {/* Customize button */}
        <CardCustomizeSheet prefs={prefs} onUpdate={updatePref} />
      </div>
    </animated.div>
  );
}
