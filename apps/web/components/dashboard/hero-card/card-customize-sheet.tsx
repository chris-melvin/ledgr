"use client";

import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  type CardTheme,
  type BackgroundStyle,
  type GlareStyle,
  type CardPreferences,
  THEME_PRESETS,
} from "./card-theme";

const THEME_OPTIONS: { value: CardTheme; label: string; swatch?: string }[] = [
  { value: "auto", label: "Auto" },
  ...Object.entries(THEME_PRESETS).map(([key, preset]) => ({
    value: key as Exclude<CardTheme, "auto">,
    label: preset.label,
    swatch: preset.swatch,
  })),
];

const BG_OPTIONS: { value: BackgroundStyle; label: string; description: string }[] = [
  { value: "mesh", label: "Mesh", description: "Fluid gradient" },
  { value: "grain", label: "Grain", description: "Film texture" },
  { value: "static", label: "Static", description: "No animation" },
];

interface CardCustomizeSheetProps {
  prefs: Required<CardPreferences>;
  onUpdate: <K extends keyof CardPreferences>(key: K, value: CardPreferences[K]) => void;
}

export function CardCustomizeSheet({ prefs, onUpdate }: CardCustomizeSheetProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={cn(
            "absolute bottom-3 right-3 z-10",
            "flex items-center gap-1 px-2 py-1 rounded-full",
            "bg-white/60 backdrop-blur-sm border border-stone-200/60",
            "text-[10px] text-neutral-500 font-medium",
            "opacity-0 group-hover/hero:opacity-100 focus:opacity-100",
            "transition-opacity duration-200",
            "hover:bg-white/80 hover:text-neutral-700"
          )}
        >
          <Palette className="w-3 h-3" />
          Customize
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Card</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Theme */}
          <section>
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
              Theme
            </h4>
            <div className="flex flex-wrap gap-2">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onUpdate("theme", option.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all",
                    prefs.theme === option.value
                      ? "border-neutral-900 bg-neutral-50 font-medium"
                      : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  {option.swatch ? (
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: option.swatch }}
                    />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-emerald-300 via-amber-200 to-rose-300 border border-black/10" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
            {prefs.theme === "auto" && (
              <p className="text-[11px] text-neutral-400 mt-2">Changes with your budget status</p>
            )}
          </section>

          {/* Background Style */}
          <section>
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
              Background
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {BG_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onUpdate("backgroundStyle", option.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-sm transition-all",
                    prefs.backgroundStyle === option.value
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  <span className="font-medium text-xs">{option.label}</span>
                  <span className="text-[10px] text-neutral-400">{option.description}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Display Name */}
          <section>
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
              Your Name
            </h4>
            <input
              type="text"
              value={prefs.displayName}
              onChange={(e) => onUpdate("displayName", e.target.value)}
              placeholder="Enter your name for a greeting"
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300"
              maxLength={30}
            />
            {prefs.displayName && (
              <p className="text-[11px] text-neutral-400 mt-1.5">
                You&apos;ll see a personalized greeting on your card
              </p>
            )}
          </section>

          {/* Effects */}
          <section>
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
              Effects
            </h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">3D Tilt</span>
                <Switch
                  checked={prefs.enableTilt}
                  onCheckedChange={(v: boolean) => onUpdate("enableTilt", v)}
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">Glare Effect</span>
                <Switch
                  checked={prefs.enableGlare}
                  onCheckedChange={(v: boolean) => onUpdate("enableGlare", v)}
                />
              </label>
              {prefs.enableGlare && (
                <div className="flex gap-2 pl-1">
                  {(["standard", "holographic"] as GlareStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => onUpdate("glareStyle", style)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs capitalize transition-all",
                        prefs.glareStyle === style
                          ? "border-neutral-900 bg-neutral-50 font-medium"
                          : "border-neutral-200 hover:border-neutral-300"
                      )}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
