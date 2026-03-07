"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  RefreshCw,
  Gift,
  Zap,
  LayoutGrid,
  Sparkles,
  ArrowRight,
  Check,
  X,
  HelpCircle,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";

// ============================================================================
// MARGINALIA DESIGN ELEMENTS
// ============================================================================

// Scribble underline SVG component
function ScribbleUnderline({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`absolute -bottom-1 left-0 w-full h-3 ${className}`}
      viewBox="0 0 200 12"
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M3 9C20 3 40 7 60 5C80 3 100 8 120 6C140 4 160 7 180 5C190 4 197 6 197 6"
        stroke="#1A9E9E"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="animate-draw-line"
        style={{ strokeDasharray: 300, strokeDashoffset: 300 }}
      />
    </svg>
  );
}

// Hand-drawn circle around numbers
function HandDrawnCircle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      {children}
      <svg
        className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)]"
        viewBox="0 0 100 60"
        fill="none"
        preserveAspectRatio="none"
      >
        <ellipse
          cx="50"
          cy="30"
          rx="45"
          ry="25"
          stroke="#1A9E9E"
          strokeWidth="2"
          strokeDasharray="4 3"
          fill="none"
          className="animate-draw-circle"
        />
      </svg>
    </span>
  );
}

// Margin note annotation
function MarginNote({
  children,
  position = "right",
  rotate = -3
}: {
  children: React.ReactNode;
  position?: "left" | "right";
  rotate?: number;
}) {
  return (
    <div
      className={`absolute ${position === "right" ? "left-full ml-4" : "right-full mr-4"} top-1/2 hidden lg:block pointer-events-none`}
      style={{ transform: `translateY(-50%) rotate(${rotate}deg)` }}
    >
      <div className="flex items-center gap-1 text-neutral-400 text-sm whitespace-nowrap font-handwriting">
        {position === "right" && <span className="text-teal-500">→</span>}
        {children}
        {position === "left" && <span className="text-teal-500">←</span>}
      </div>
    </div>
  );
}

// ============================================================================
// HERO SECTION - Daily Budget Mockup
// ============================================================================

function DailyBudgetMockup() {
  const remaining = 847;
  const total = 1200;
  const percentage = (remaining / total) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative">
      <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-teal-200/20 blur-3xl" />
      <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-emerald-200/20 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        {/* Paper texture overlay */}
        <div className="absolute inset-0 opacity-30 pointer-events-none bg-paper-texture" />

        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                Today&apos;s Limit
              </p>
              <p className="text-sm text-neutral-500">December 29, 2025</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            </div>
          </div>

          <div className="relative mx-auto mb-4 flex h-40 w-40 items-center justify-center">
            <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#E7E7E4" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#heroGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="animate-draw-ring"
              />
              <defs>
                <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-center">
              <p className="text-3xl font-light tabular-nums text-neutral-900">
                <span className="text-lg text-neutral-400">₱</span>{remaining}
              </p>
              <p className="text-xs text-neutral-500">remaining</p>
            </div>
          </div>

          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">On Track</span>
            </div>
          </div>

          <div className="space-y-1.5">
            {[
              { label: "Coffee", amount: 150, icon: "☕" },
              { label: "Lunch", amount: 350, icon: "🍜" },
              { label: "Groceries", amount: 800, icon: "🛒" },
            ].map((expense, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm animate-fade-in-up"
                style={{ animationDelay: `${0.5 + i * 0.1}s` }}
              >
                <div className="flex items-center gap-2">
                  <span>{expense.icon}</span>
                  <span className="text-neutral-600">{expense.label}</span>
                </div>
                <span className="font-medium tabular-nums text-neutral-800">
                  -₱{expense.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPARISON SECTION - Old Way vs ledgr
// ============================================================================

function ComparisonSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-medium uppercase tracking-wider text-teal-600 mb-3">
            The difference
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900">
            Two ways to budget
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* The Old Way */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-br from-rose-200/50 to-neutral-300/50 rounded-2xl blur-sm opacity-75" />
            <div className="relative bg-neutral-800 rounded-2xl p-6 md:p-8 border border-neutral-700">
              <div className="flex items-center gap-2 mb-6">
                <X className="h-5 w-5 text-rose-400" />
                <h3 className="text-lg font-semibold text-neutral-300">The Old Way</h3>
              </div>

              {/* Fake spreadsheet */}
              <div className="bg-neutral-900/80 rounded-lg p-3 font-mono text-xs mb-4 border border-neutral-700">
                <div className="grid grid-cols-4 gap-1 text-neutral-500 mb-2 pb-2 border-b border-neutral-700">
                  <span>Category</span>
                  <span>Budget</span>
                  <span>Spent</span>
                  <span>Left</span>
                </div>
                {[
                  { cat: "Food", budget: 8000, spent: 9500, left: -1500 },
                  { cat: "Transport", budget: 3000, spent: 2800, left: 200 },
                  { cat: "Entertainment", budget: 2000, spent: 3500, left: -1500 },
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-4 gap-1 py-1.5 text-neutral-400">
                    <span>{row.cat}</span>
                    <span>₱{row.budget}</span>
                    <span className={row.spent > row.budget ? "text-rose-400" : ""}>₱{row.spent}</span>
                    <span className={row.left < 0 ? "text-rose-400 font-bold" : "text-emerald-400"}>
                      {row.left < 0 ? `-₱${Math.abs(row.left)}` : `₱${row.left}`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2 text-neutral-400">
                  <HelpCircle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                  <span>&quot;Can I afford lunch today?&quot;</span>
                </div>
                <div className="flex items-start gap-2 text-neutral-400">
                  <TrendingDown className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                  <span>Overspend once, feel guilty all month</span>
                </div>
                <div className="flex items-start gap-2 text-neutral-400">
                  <AlertTriangle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                  <span>Complex categories to manage</span>
                </div>
              </div>
            </div>
          </div>

          {/* The ledgr Way */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-br from-emerald-200/50 to-teal-200/50 rounded-2xl blur-sm opacity-75" />
            <div className="relative bg-white rounded-2xl p-6 md:p-8 border border-neutral-200">
              <div className="absolute inset-0 bg-paper-texture opacity-20 rounded-2xl pointer-events-none" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-6">
                  <Check className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-neutral-800">The ledgr Way</h3>
                </div>

                {/* Simple daily view */}
                <div className="bg-neutral-50 rounded-xl p-4 mb-4 text-center">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Today you can spend</p>
                  <p className="text-4xl font-light text-neutral-900 tabular-nums">
                    <span className="text-xl text-teal-600">₱</span>470
                  </p>
                  <div className="inline-flex items-center gap-1 mt-2 bg-emerald-50 rounded-full px-2 py-0.5">
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-xs text-emerald-700">You&apos;re good</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2 text-neutral-600">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>One number. Your daily answer.</span>
                  </div>
                  <div className="flex items-start gap-2 text-neutral-600">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Overspend? Tomorrow auto-adjusts.</span>
                  </div>
                  <div className="flex items-start gap-2 text-neutral-600">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>No categories. No guilt. Just clarity.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// INTERACTIVE DEMO SECTION
// ============================================================================

const DEMO_SCENARIOS = [
  {
    id: 1,
    title: "Wake up knowing",
    annotation: "Your daily number, ready and waiting",
    state: "morning" as const,
  },
  {
    id: 2,
    title: "Log in 3 seconds",
    annotation: "Just type naturally. We figure it out.",
    state: "logging" as const,
  },
  {
    id: 3,
    title: "Life happens",
    annotation: "Tomorrow auto-adjusts. No guilt.",
    state: "recovery" as const,
  },
];

function InteractiveDemo() {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [showExpense, setShowExpense] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(500);
  const [isOverBudget, setIsOverBudget] = useState(false);
  const [showNextDay, setShowNextDay] = useState(false);

  // Auto-cycle through scenarios
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentScenario((prev) => (prev + 1) % DEMO_SCENARIOS.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused]);

  // Reset animations when scenario changes
  useEffect(() => {
    setTypedText("");
    setShowExpense(false);
    setBudgetAmount(500);
    setIsOverBudget(false);
    setShowNextDay(false);

    if (currentScenario === 1) {
      // Typing animation for scenario 2
      const text = "coffee 150";
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < text.length) {
          setTypedText(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            setShowExpense(true);
            setBudgetAmount(350);
          }, 300);
        }
      }, 100);
      return () => clearInterval(typeInterval);
    }

    if (currentScenario === 2) {
      // Recovery animation for scenario 3
      setTimeout(() => {
        setIsOverBudget(true);
        setBudgetAmount(-23);
      }, 500);
      setTimeout(() => {
        setShowNextDay(true);
      }, 2000);
      setTimeout(() => {
        setIsOverBudget(false);
        setBudgetAmount(477);
      }, 3000);
    }
  }, [currentScenario]);

  const handleDotClick = (index: number) => {
    setCurrentScenario(index);
  };

  const scenario = DEMO_SCENARIOS[currentScenario] ?? DEMO_SCENARIOS[0];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-neutral-50" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-medium uppercase tracking-wider text-teal-600 mb-3">
            See it in action
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            How ledgr works
          </h2>
          <p className="text-lg text-neutral-600 max-w-xl mx-auto">
            Set it up once. Get your answer every day.
          </p>
        </div>

        {/* Demo Container */}
        <div
          className="relative max-w-lg mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Annotation */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
            <div
              className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-2 text-sm text-teal-800 font-handwriting transform -rotate-1 shadow-sm transition-all duration-300"
              key={scenario?.id}
            >
              {scenario?.annotation}
            </div>
          </div>

          {/* Demo Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden">
            <div className="bg-paper-texture opacity-20 absolute inset-0 pointer-events-none" />

            {/* Demo Header */}
            <div className="border-b border-neutral-100 px-6 py-4 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-teal-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <p className="text-xs text-neutral-400 font-medium">
                {showNextDay ? "Tomorrow" : "Today"} • {scenario?.title}
              </p>
            </div>

            {/* Demo Content */}
            <div className="p-6 md:p-8 min-h-[320px] relative">
              {/* Scenario 1: Morning Check */}
              {currentScenario === 0 && (
                <div className="text-center animate-fade-in">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                    Today you can spend
                  </p>
                  <p className="text-6xl font-light text-neutral-900 tabular-nums animate-landing-count-up">
                    <span className="text-3xl text-emerald-600">₱</span>500
                  </p>
                  <div className="inline-flex items-center gap-1.5 mt-4 bg-emerald-50 rounded-full px-4 py-1.5 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">On Track</span>
                  </div>
                </div>
              )}

              {/* Scenario 2: Quick Log */}
              {currentScenario === 1 && (
                <div className="space-y-6 animate-fade-in">
                  {/* Input */}
                  <div className="bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-200">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400">+</span>
                      <span className="text-neutral-800">{typedText}</span>
                      <span className="w-0.5 h-5 bg-teal-500 animate-blink" />
                    </div>
                  </div>

                  {/* Budget display */}
                  <div className="text-center">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                      Remaining today
                    </p>
                    <p className="text-4xl font-light text-neutral-900 tabular-nums transition-all duration-500">
                      <span className="text-xl text-emerald-600">₱</span>
                      {budgetAmount}
                    </p>
                  </div>

                  {/* New expense */}
                  {showExpense && (
                    <div className="flex items-center justify-between rounded-xl bg-teal-50 px-4 py-3 animate-slide-in-right border border-teal-200">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">☕</span>
                        <span className="text-sm text-neutral-700">Coffee</span>
                      </div>
                      <span className="text-sm font-medium tabular-nums text-neutral-900">
                        -₱150
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Scenario 3: Recovery */}
              {currentScenario === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-center">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                      {showNextDay ? "Tomorrow you can spend" : "Today's budget"}
                    </p>
                    <p className={`text-5xl font-light tabular-nums transition-all duration-500 ${
                      isOverBudget && !showNextDay ? "text-rose-500" : "text-neutral-900"
                    }`}>
                      {isOverBudget && !showNextDay ? (
                        <>-<span className="text-3xl">₱</span>23</>
                      ) : showNextDay ? (
                        <><span className="text-3xl text-emerald-600">₱</span>{budgetAmount}</>
                      ) : (
                        <><span className="text-3xl text-emerald-600">₱</span>500</>
                      )}
                    </p>

                    {isOverBudget && !showNextDay && (
                      <div className="inline-flex items-center gap-1.5 mt-3 bg-rose-50 rounded-full px-4 py-1.5 animate-fade-in">
                        <X className="h-4 w-4 text-rose-500" />
                        <span className="text-sm font-medium text-rose-600">Over budget</span>
                      </div>
                    )}

                    {showNextDay && (
                      <div className="inline-flex items-center gap-1.5 mt-3 bg-emerald-50 rounded-full px-4 py-1.5 animate-fade-in">
                        <RefreshCw className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">Auto-adjusted</span>
                      </div>
                    )}
                  </div>

                  {showNextDay && (
                    <p className="text-center text-sm text-neutral-500 animate-fade-in font-handwriting text-base">
                      &quot;No guilt. Just math.&quot;
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-3 mt-6">
            {DEMO_SCENARIOS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => handleDotClick(i)}
                className={`relative h-2 rounded-full transition-all duration-300 ${
                  i === currentScenario ? "w-8 bg-teal-500" : "w-2 bg-neutral-300 hover:bg-neutral-400"
                }`}
                aria-label={`Go to scenario ${i + 1}`}
              >
                {i === currentScenario && !isPaused && (
                  <span className="absolute inset-0 bg-teal-400 rounded-full animate-progress-bar" />
                )}
              </button>
            ))}
          </div>

          {/* Step labels */}
          <div className="flex justify-between mt-4 px-4">
            {DEMO_SCENARIOS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => handleDotClick(i)}
                className={`text-xs transition-colors ${
                  i === currentScenario ? "text-teal-600 font-medium" : "text-neutral-400"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// BENTO GRID FEATURES
// ============================================================================

function BentoGrid() {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-medium uppercase tracking-wider text-teal-600 mb-3">
            Features
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Everything you need.{" "}
            <span className="relative inline-block">
              Nothing you don&apos;t.
              <ScribbleUnderline />
            </span>
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-5 overflow-visible">
          {/* Daily Limit - Large */}
          <div className="md:col-span-2 md:row-span-2 group relative">
            <div className="h-full bg-white rounded-2xl border border-neutral-200 p-6 lg:p-8 hover:border-teal-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-paper-texture opacity-10 pointer-events-none" />

              <div className="relative h-full flex flex-col">
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-teal-100 text-teal-600 mb-3">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">Daily Limit</h3>
                  <p className="text-sm text-neutral-500 mt-1">One number. Your daily answer.</p>
                </div>

                {/* Animated ring */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative w-32 h-32 lg:w-40 lg:h-40">
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#f5f5f4" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="url(#bentoGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={264}
                        strokeDashoffset={264 * 0.3}
                        className="animate-ring-fill group-hover:animate-none"
                        style={{ transition: "stroke-dashoffset 1s ease-out" }}
                      />
                      <defs>
                        <linearGradient id="bentoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl lg:text-3xl font-light tabular-nums text-neutral-900">
                          <span className="text-lg text-emerald-600">₱</span>847
                        </p>
                        <p className="text-xs text-neutral-500">today</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Margin note - positioned at bottom right of card */}
            <div className="absolute bottom-4 right-4 hidden lg:block pointer-events-none" style={{ transform: "rotate(-2deg)" }}>
              <div className="flex items-center gap-1 text-neutral-400 text-sm whitespace-nowrap font-handwriting">
                <span className="text-teal-500">→</span>
                my favorite feature
              </div>
            </div>
          </div>

          {/* Auto-Rebalance - Medium */}
          <div className="group relative">
            <div className="h-full bg-white rounded-2xl border border-neutral-200 p-5 hover:border-teal-200 hover:shadow-lg transition-all duration-300">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-100 text-blue-600 mb-3">
                <RefreshCw className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-neutral-900 text-sm">Auto-Rebalance</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-4">Zero guilt when you overspend.</p>

              {/* Animation: numbers shifting */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <div className="bg-rose-50 rounded px-2 py-1 text-rose-600 group-hover:animate-bounce-subtle">
                  -₱500
                </div>
                <span className="text-neutral-400">→</span>
                <div className="bg-emerald-50 rounded px-2 py-1 text-emerald-600 group-hover:animate-bounce-subtle" style={{ animationDelay: "0.1s" }}>
                  +₱500
                </div>
              </div>
            </div>
          </div>

          {/* Flex Bucket - Medium */}
          <div className="group relative">
            <div className="h-full bg-white rounded-2xl border border-neutral-200 p-5 hover:border-teal-200 hover:shadow-lg transition-all duration-300">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-violet-100 text-violet-600 mb-3 relative">
                <Gift className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-teal-400 rounded-full group-hover:animate-ping" />
              </div>
              <h3 className="font-semibold text-neutral-900 text-sm">Flex Bucket</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-4">Guilt-free splurge fund.</p>

              {/* Sparkle effect */}
              <div className="flex justify-center">
                <div className="relative">
                  <span className="text-2xl">🎁</span>
                  <Sparkles className="absolute -top-1 -right-2 h-3 w-3 text-teal-400 group-hover:animate-spin-slow" />
                </div>
              </div>
            </div>
          </div>

          {/* 3-Second Log - Small */}
          <div className="group">
            <div className="h-full bg-white rounded-2xl border border-neutral-200 p-5 hover:border-teal-200 hover:shadow-lg transition-all duration-300">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-teal-100 text-teal-600 mb-3">
                <Zap className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-neutral-900 text-sm">3-Second Log</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-3">Type naturally.</p>

              {/* Typing animation */}
              <div className="bg-neutral-50 rounded-lg px-3 py-2 text-xs">
                <span className="text-neutral-600 font-mono group-hover:animate-typing overflow-hidden whitespace-nowrap inline-block" style={{ width: "0ch" }}>
                  coffee 150
                </span>
                <span className="animate-blink">|</span>
              </div>
            </div>
          </div>

          {/* Smart Sort - Small */}
          <div className="group">
            <div className="h-full bg-white rounded-2xl border border-neutral-200 p-5 hover:border-teal-200 hover:shadow-lg transition-all duration-300">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 mb-3">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-neutral-900 text-sm">Smart Sort</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-3">AI categorization.</p>

              {/* Icons shuffling */}
              <div className="flex justify-center gap-1">
                {["☕", "🍜", "🚗"].map((icon, i) => (
                  <span
                    key={i}
                    className="text-lg group-hover:animate-shuffle"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {icon}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar View - Wide */}
          <div className="md:col-span-2 group">
            <div className="h-full bg-white rounded-2xl border border-neutral-200 p-5 hover:border-teal-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-rose-100 text-rose-600 mb-3">
                    <LayoutGrid className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 text-sm">Calendar View</h3>
                  <p className="text-xs text-neutral-500 mt-1">Your money month at a glance.</p>
                </div>
              </div>

              {/* Mini calendar */}
              <div className="grid grid-cols-7 gap-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <div key={i} className="text-[10px] text-neutral-400 text-center pb-1">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 31 }, (_, i) => {
                  const status = i < 15 ? (i % 5 === 0 ? "over" : "under") : (i % 7 === 0 ? "over" : i % 3 === 0 ? "near" : "under");
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded text-[10px] flex items-center justify-center transition-transform group-hover:scale-105 ${
                        status === "under" ? "bg-emerald-100 text-emerald-700" :
                        status === "near" ? "bg-teal-100 text-teal-700" :
                        "bg-rose-100 text-rose-700"
                      }`}
                      style={{ transitionDelay: `${i * 10}ms` }}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SOCIAL PROOF SECTION
// ============================================================================

function SocialProof() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-neutral-50" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="relative mx-auto max-w-5xl px-6">
        {/* Before/After */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="text-center p-8 rounded-2xl bg-white border border-neutral-200">
            <p className="text-sm text-neutral-500 uppercase tracking-wider mb-4">Before ledgr</p>
            <div className="flex justify-center gap-4 text-4xl mb-4">
              <span className="animate-bounce-subtle">😰</span>
              <span className="animate-bounce-subtle" style={{ animationDelay: "0.1s" }}>❓</span>
              <span className="animate-bounce-subtle" style={{ animationDelay: "0.2s" }}>📊</span>
            </div>
            <p className="text-neutral-600">&quot;Can I afford this...?&quot;</p>
          </div>

          <div className="text-center p-8 rounded-2xl bg-white border border-emerald-200">
            <div className="absolute inset-0 bg-paper-texture opacity-10 rounded-2xl pointer-events-none" />
            <p className="text-sm text-emerald-600 uppercase tracking-wider mb-4 relative">After ledgr</p>
            <div className="flex justify-center gap-4 text-4xl mb-4 relative">
              <span className="animate-bounce-subtle">😌</span>
              <span className="animate-bounce-subtle" style={{ animationDelay: "0.1s" }}>✅</span>
              <span className="animate-bounce-subtle" style={{ animationDelay: "0.2s" }}>💚</span>
            </div>
            <p className="text-neutral-600 relative">&quot;I know I&apos;m good.&quot;</p>
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative bg-white rounded-3xl border border-neutral-200 p-8 md:p-12 text-center shadow-lg">
          <div className="absolute inset-0 bg-paper-texture opacity-20 rounded-3xl pointer-events-none" />

          <div className="relative">
            <div className="text-5xl mb-6 text-teal-200">&ldquo;</div>
            <blockquote className="text-2xl md:text-3xl font-light text-neutral-700 leading-relaxed mb-6">
              Finally, a budget that doesn&apos;t make me feel{" "}
              <span className="relative inline-block">
                terrible.
                <ScribbleUnderline />
              </span>
            </blockquote>
            <footer className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-500" />
              <div className="text-left">
                <p className="font-medium text-neutral-900">Early User</p>
                <p className="text-sm text-neutral-500">Beta Tester, Philippines</p>
              </div>
            </footer>
          </div>
        </div>

        {/* Stats as margin notes */}
        <div className="grid grid-cols-3 gap-8 mt-12 text-center">
          {[
            { value: "3s", label: "to log expense" },
            { value: "0", label: "guilt factor" },
            { value: "100%", label: "free to start" },
          ].map((stat, i) => (
            <div key={i} className="relative">
              <HandDrawnCircle>
                <p className="text-3xl md:text-4xl font-bold text-neutral-900">{stat.value}</p>
              </HandDrawnCircle>
              <p className="text-sm text-neutral-500 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FINAL CTA SECTION
// ============================================================================

function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Notebook paper background */}
      <div className="absolute inset-0 bg-[#FDFCFB]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(transparent, transparent 31px, #e5e5e5 31px, #e5e5e5 32px),
            linear-gradient(90deg, transparent 60px, #fca5a5 60px, #fca5a5 62px, transparent 62px)
          `,
          backgroundSize: "100% 32px, 100% 100%",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-neutral-200 p-8 md:p-12 shadow-xl">
          <p className="text-sm font-medium uppercase tracking-wider text-teal-600 mb-4">
            Your daily page awaits
          </p>

          <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 mb-4">
            Start your{" "}
            <span className="relative inline-block">
              first day.
              <ScribbleUnderline className="animate-draw-line-delayed" />
            </span>
          </h2>

          <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto">
            Get your daily spending answer in under 2 minutes.
          </p>

          <div className="relative inline-block">
            {/* Highlight effect like marker */}
            <div className="absolute -inset-1 bg-teal-200/50 rounded-xl -rotate-1" />
            <Button
              asChild
              size="lg"
              className="relative h-14 bg-emerald-600 hover:bg-emerald-700 px-10 text-base font-semibold shadow-lg"
            >
              <Link href="/signup">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-neutral-500">
            No credit card required. Free forever for core features.
          </p>
        </div>

        {/* Decorative margin note */}
        <div className="absolute bottom-8 right-8 hidden lg:block transform rotate-3">
          <div className="font-handwriting text-neutral-400 text-sm">
            ← you&apos;ll love it!
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN LANDING PAGE
// ============================================================================

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 pb-20 pt-16 md:pb-28 md:pt-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-grid-pattern opacity-40" />
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-teal-100/40 to-transparent blur-3xl" />
          <div className="absolute right-0 top-1/3 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-gradient-to-bl from-emerald-100/30 to-transparent blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left column - Copy */}
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
                <Sparkles className="h-4 w-4" />
                <span>Calendar-first budgeting</span>
              </div>

              <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-neutral-900 md:text-5xl lg:text-6xl">
                Know exactly what you can spend{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-teal-500 to-teal-600 bg-clip-text text-transparent">
                    today.
                  </span>
                  <ScribbleUnderline />
                </span>
              </h1>

              <p className="mb-8 text-lg leading-relaxed text-neutral-600 md:text-xl">
                The budget that auto-adjusts when life happens.
                <br className="hidden md:block" />
                No guilt. No math. Just daily clarity.
              </p>

              <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="h-14 bg-emerald-600 px-8 text-base font-semibold shadow-lg shadow-emerald-200/50 transition-all hover:bg-emerald-700 hover:shadow-xl"
                >
                  <Link href="/signup">
                    Start Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-14 px-8 text-base text-neutral-600 hover:text-neutral-900"
                >
                  <a href="#how-it-works">See How It Works</a>
                </Button>
              </div>

              <p className="mt-6 text-sm text-neutral-400">
                Free forever. No credit card required.
              </p>
            </div>

            {/* Right column - Mockup */}
            <div className="relative lg:pl-8">
              <DailyBudgetMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <ComparisonSection />

      {/* Interactive Demo */}
      <InteractiveDemo />

      {/* Bento Grid Features */}
      <BentoGrid />

      {/* Social Proof */}
      <SocialProof />

      {/* Final CTA */}
      <FinalCTA />
    </div>
  );
}
