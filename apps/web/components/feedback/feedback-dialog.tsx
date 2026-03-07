"use client";

import { useState, useTransition } from "react";
import { Bug, Lightbulb, Sparkles, HelpCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitFeedback } from "@/actions/feedback";
import { cn } from "@/lib/utils";
import type { FeedbackType } from "@repo/database";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const feedbackTypes: {
  type: FeedbackType;
  label: string;
  icon: typeof Bug;
  description: string;
}[] = [
  {
    type: "bug",
    label: "Bug",
    icon: Bug,
    description: "Something isn't working",
  },
  {
    type: "feature",
    label: "Feature",
    icon: Lightbulb,
    description: "New idea or functionality",
  },
  {
    type: "improvement",
    label: "Improvement",
    icon: Sparkles,
    description: "Enhance existing feature",
  },
  {
    type: "other",
    label: "Other",
    icon: HelpCircle,
    description: "General feedback",
  },
];

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedType, setSelectedType] = useState<FeedbackType>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setSelectedType("feature");
    setTitle("");
    setDescription("");
    setError(null);
    setSuccess(false);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    // Only close without resetting - preserve form values
    // Reset only happens on explicit cancel or successful submit
    if (!isOpen) {
      setError(null); // Clear error when closing, but keep form values
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.length < 3) {
      setError("Title must be at least 3 characters");
      return;
    }

    if (description.length < 10) {
      setError("Description must be at least 10 characters");
      return;
    }

    startTransition(async () => {
      const result = await submitFeedback({
        type: selectedType,
        title,
        description,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          resetForm();
          onOpenChange(false);
        }, 2000);
      } else {
        setError(result.error);
      }
    });
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Thank you!</DialogTitle>
            <DialogDescription>
              Your feedback has been submitted. We really appreciate you taking
              the time to help us improve.
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve ledgr. Your feedback is valuable to us.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-2">
            {feedbackTypes.map(({ type, label, icon: Icon, description }) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={cn(
                  "flex flex-col items-start p-3 rounded-lg border text-left transition-colors",
                  selectedType === type
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                    : "border-border hover:border-stone-300 dark:hover:border-stone-600"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      selectedType === type
                        ? "text-amber-600"
                        : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      selectedType === type && "text-amber-700 dark:text-amber-400"
                    )}
                  >
                    {label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {description}
                </span>
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="feedback-title">Title</Label>
            <Input
              id="feedback-title"
              placeholder="Brief summary of your feedback"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="feedback-description">Description</Label>
            <Textarea
              id="feedback-description"
              placeholder="Provide more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/2000
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending..." : "Send Feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
