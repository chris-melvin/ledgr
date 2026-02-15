"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Loader2, ArrowUp, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";

interface ExpensePreview {
  amount: number;
  label: string;
  category?: string;
  bucketId?: string;
  bucketSlug?: string;
}

interface SmartInputBarProps {
  onAddExpenses: (expenses: ExpensePreview[]) => void;
  preview: ExpensePreview[];
  isParsing: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (value: string) => Promise<unknown>;
  onPreviewUpdate?: (index: number, updates: Partial<ExpensePreview>) => void;
}

// NLP syntax examples for power users
const SYNTAX_EXAMPLES = [
  { example: "coffee 120", desc: "Simple expense" },
  { example: "grab 180 and lunch", desc: "Multiple items" },
  { example: "@starbucks 200", desc: "Use a shortcut" },
  { example: "uber 180 #travel", desc: "Add category" },
];

export function SmartInputBar({
  preview,
  isParsing,
  onInputChange,
  onSubmit,
}: SmartInputBarProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktopModalOpen, setIsDesktopModalOpen] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const lastScrollY = useRef(0);

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const isMobile = window.innerWidth < 640;
        if (isMobile) {
          setIsExpanded(true);
        } else {
          setIsDesktopModalOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      if (isExpanded) return;
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current + 10) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 10) {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isExpanded]);

  // Focus inputs when opened
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => mobileInputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (isDesktopModalOpen) {
      setTimeout(() => desktopInputRef.current?.focus(), 100);
    }
  }, [isDesktopModalOpen]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onInputChange(newValue);
    },
    [onInputChange]
  );

  const handleSubmit = useCallback(() => {
    if (!value.trim() || isParsing) return;
    const input = value;
    // Close UI immediately (optimistic)
    setValue("");
    setIsExpanded(false);
    setIsDesktopModalOpen(false);
    // Fire async chain in background — catch prevents unhandled rejection
    Promise.resolve(onSubmit(input)).catch((err) => {
      console.error("[SmartInputBar] Submit failed:", err);
    });
  }, [value, isParsing, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape") {
        setValue("");
        onInputChange("");
        mobileInputRef.current?.blur();
        desktopInputRef.current?.blur();
        setIsExpanded(false);
        setIsDesktopModalOpen(false);
      }
    },
    [handleSubmit, onInputChange]
  );

  const clearInput = useCallback(() => {
    setValue("");
    onInputChange("");
    mobileInputRef.current?.focus();
    desktopInputRef.current?.focus();
  }, [onInputChange]);

  return (
    <>
      {/* Mobile FAB */}
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          "fixed bottom-6 right-4 z-50 sm:hidden",
          "w-14 h-14 rounded-2xl",
          "bg-gradient-to-br from-teal-500 to-teal-600",
          "shadow-lg shadow-teal-500/30",
          "flex items-center justify-center",
          "transition-all duration-300",
          "active:scale-90",
          isExpanded || !isVisible ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Desktop FAB */}
      <button
        onClick={() => setIsDesktopModalOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 hidden sm:flex",
          "w-14 h-14 rounded-2xl",
          "bg-gradient-to-br from-teal-500 to-teal-600",
          "shadow-lg shadow-teal-500/30",
          "items-center justify-center",
          "transition-all duration-300",
          "hover:scale-105 active:scale-95",
          isDesktopModalOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Mobile Expanded Input Sheet */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 sm:hidden" onClick={() => setIsExpanded(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 rounded-full bg-neutral-300" />
            </div>

            <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex gap-2 mb-4">
                <div
                  className={cn(
                    "flex-1 relative bg-neutral-50 border-2 border-neutral-200 rounded-2xl transition-all duration-300",
                    isFocused && "border-teal-400 bg-white"
                  )}
                >
                  <div className="flex items-center gap-2 p-3">
                    <Sparkles className="w-5 h-5 text-teal-500 flex-shrink-0" />
                    <input
                      ref={mobileInputRef}
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      value={value}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="coffee 120, grab and lunch..."
                      className="flex-1 min-w-0 bg-transparent text-neutral-800 text-base outline-none placeholder:text-neutral-400"
                    />
                    {preview.length > 0 && preview[0] && (
                      <div className="flex items-center gap-1 flex-shrink-0 animate-in fade-in duration-150">
                        <span className="text-xs font-medium text-teal-600">
                          {CURRENCY}
                          {preview[0].amount.toLocaleString()}
                        </span>
                        {preview.length > 1 && (
                          <span className="text-[10px] text-neutral-400">
                            +{preview.length - 1}
                          </span>
                        )}
                      </div>
                    )}
                    {value && (
                      <button onClick={clearInput} className="p-1 text-neutral-400 flex-shrink-0">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!value.trim() || isParsing}
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all flex-shrink-0",
                    value.trim() && !isParsing
                      ? "bg-neutral-900 text-white active:scale-95"
                      : "bg-neutral-200 text-neutral-400"
                  )}
                >
                  {isParsing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowUp className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Modal */}
      {isDesktopModalOpen && (
        <div
          className="fixed inset-0 z-50 hidden sm:flex items-center justify-center"
          onClick={() => setIsDesktopModalOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex gap-3 mb-5">
                <div
                  className={cn(
                    "flex-1 relative bg-neutral-50 border-2 border-neutral-200 rounded-xl transition-all duration-300",
                    isFocused && "border-teal-400 bg-white"
                  )}
                >
                  <div className="flex items-center gap-3 p-3">
                    <Sparkles className="w-5 h-5 text-teal-500 flex-shrink-0" />
                    <input
                      ref={desktopInputRef}
                      type="text"
                      autoComplete="off"
                      value={value}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="coffee 120, grab and lunch, @starbucks..."
                      className="flex-1 min-w-0 bg-transparent text-neutral-800 text-base outline-none placeholder:text-neutral-400"
                    />
                    {preview.length > 0 && preview[0] && (
                      <div className="flex items-center gap-1.5 flex-shrink-0 animate-in fade-in duration-150">
                        <span className="text-sm font-medium text-teal-600">
                          {CURRENCY}
                          {preview[0].amount.toLocaleString()}
                        </span>
                        {preview.length > 1 && (
                          <span className="text-xs text-neutral-400">
                            +{preview.length - 1}
                          </span>
                        )}
                      </div>
                    )}
                    {value && (
                      <button
                        onClick={clearInput}
                        className="p-1 text-neutral-400 hover:text-neutral-600 flex-shrink-0"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!value.trim() || isParsing}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                    value.trim() && !isParsing
                      ? "bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95"
                      : "bg-neutral-200 text-neutral-400"
                  )}
                >
                  {isParsing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowUp className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Syntax examples */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {SYNTAX_EXAMPLES.map((item) => (
                  <button
                    key={item.example}
                    onClick={() => {
                      setValue(item.example);
                      onInputChange(item.example);
                      desktopInputRef.current?.focus();
                    }}
                    className="text-left p-3 rounded-lg bg-neutral-50 border border-neutral-100 hover:bg-teal-50 hover:border-teal-200 transition-colors"
                  >
                    <code className="text-sm font-mono text-teal-600">{item.example}</code>
                    <p className="text-xs text-neutral-400 mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>

              {/* Keyboard hints */}
              <div className="flex items-center justify-center gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 font-mono text-neutral-500">
                    ↵
                  </kbd>
                  to add
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 font-mono text-neutral-500">
                    esc
                  </kbd>
                  to close
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
