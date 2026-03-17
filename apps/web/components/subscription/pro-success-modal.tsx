"use client";

import { useEffect, useState } from "react";
import { Crown, Sparkles, BarChart3, FileDown, Headphones } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProSuccessModalProps {
  open: boolean;
  onClose: () => void;
}

const PRO_FEATURES = [
  { icon: BarChart3, label: "Advanced analytics & visualizations" },
  { icon: FileDown, label: "Export to CSV & PDF" },
  { icon: Headphones, label: "Priority support" },
];

export function ProSuccessModal({ open, onClose }: ProSuccessModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setShowConfetti(true), 100);
      return () => clearTimeout(timer);
    }
    setShowConfetti(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md overflow-hidden"
      >
        {/* Gradient header */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-t-lg" />

        {/* Floating particles */}
        {showConfetti && (
          <div className="absolute inset-x-0 top-0 h-32 overflow-hidden pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <Sparkles
                key={i}
                className="absolute text-white/40 animate-pulse"
                style={{
                  width: 10 + Math.random() * 10,
                  height: 10 + Math.random() * 10,
                  left: `${8 + Math.random() * 84}%`,
                  top: `${10 + Math.random() * 60}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1.5 + Math.random() * 1.5}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Crown icon */}
        <div className="relative flex justify-center pt-6 pb-2">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center">
            <Crown className="w-8 h-8 text-amber-500" />
          </div>
        </div>

        <DialogHeader className="relative text-center sm:text-center pt-2">
          <DialogTitle className="text-xl font-bold text-stone-900">
            Welcome to Pro!
          </DialogTitle>
          <DialogDescription className="text-stone-500">
            Your subscription is now active. Here&apos;s what you&apos;ve
            unlocked:
          </DialogDescription>
        </DialogHeader>

        {/* Feature list */}
        <div className="relative space-y-3 py-2">
          {PRO_FEATURES.map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-50/60 border border-amber-100"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-stone-700">
                {feature.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="relative pt-2 pb-1">
          <Button
            onClick={onClose}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-5 rounded-xl"
          >
            Start Exploring
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
