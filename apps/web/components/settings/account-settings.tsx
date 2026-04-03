"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { LogOut, Crown, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { signOut, deleteAccount } from "@/actions/auth";
import { getPortalUrl, cancelSubscription, resumeSubscription } from "@/actions/subscriptions";
import type { SubscriptionInfo } from "@/actions/subscriptions/get-subscription";

interface AccountSettingsProps {
  userEmail: string;
  subscription: SubscriptionInfo | null;
}

export function AccountSettings({ userEmail, subscription }: AccountSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  const handleManageSubscription = () => {
    startTransition(async () => {
      const result = await getPortalUrl();
      if (!result.success) {
        toast.error(
          result.error || "Unable to open billing portal. Please contact support if this persists."
        );
        return;
      }
      if (result.data?.portalUrl) {
        window.open(result.data.portalUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Unable to open billing portal. Please try again later.");
      }
    });
  };

  const handleCancelSubscription = () => {
    startTransition(async () => {
      const result = await cancelSubscription();
      if (result.success) {
        toast.success("Subscription cancelled. You'll retain access until the end of your billing period.");
      } else {
        toast.error(result.error ?? "Failed to cancel subscription");
      }
    });
  };

  const handleResumeSubscription = () => {
    startTransition(async () => {
      const result = await resumeSubscription();
      if (result.success) {
        toast.success("Subscription resumed!");
      } else {
        toast.error(result.error ?? "Failed to resume subscription");
      }
    });
  };

  const userInitial = userEmail.charAt(0).toUpperCase();
  const isPro = subscription?.tier === "pro" && subscription?.isSubscribed;
  const isCancelScheduled = subscription?.cancelAtPeriodEnd && subscription?.isSubscribed;

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-amber-100 text-amber-700 text-xl font-semibold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 truncate">
                {userEmail}
              </p>
              <p className="text-xs text-stone-500">
                Signed in with email
              </p>
            </div>
          </div>

          <Separator />

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              disabled
              className="bg-stone-50"
            />
            <p className="text-xs text-stone-500">
              Your email cannot be changed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Section */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Manage your subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-stone-50 border border-stone-200/60">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                isPro ? "bg-amber-100" : "bg-stone-200"
              )}>
                <Crown className={cn("w-5 h-5", isPro ? "text-amber-600" : "text-stone-500")} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-stone-900">
                    {isPro ? "Pro Plan" : "Free Plan"}
                  </p>
                  <Badge variant={isPro ? "default" : "secondary"}>
                    {isPro ? "pro" : "free"}
                  </Badge>
                </div>
                <p className="text-xs text-stone-500">
                  {isCancelScheduled && subscription?.periodEnd
                    ? `Cancels on ${new Date(subscription.periodEnd).toLocaleDateString()}`
                    : isPro && subscription?.periodEnd
                      ? `Renews on ${new Date(subscription.periodEnd).toLocaleDateString()}`
                      : "Upgrade to unlock all features"}
                </p>
              </div>
            </div>
          </div>

          {!isPro && (
            <Button className="w-full gap-2" asChild>
              <Link href="/pricing">
                <Crown className="w-4 h-4" />
                Upgrade to Pro
              </Link>
            </Button>
          )}

          {isPro && !isCancelScheduled && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleManageSubscription}
                disabled={isPending}
              >
                Manage Subscription
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={handleCancelSubscription}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          )}

          {isCancelScheduled && (
            <Button
              className="w-full gap-2"
              onClick={handleResumeSubscription}
              disabled={isPending}
            >
              Resume Subscription
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sign Out */}
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleSignOut}
            disabled={isPending}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>

          <Separator />

          {/* Danger Zone */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-sm font-medium">Danger Zone</p>
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isPending}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={(open) => {
        setShowDeleteDialog(open);
        if (!open) setDeleteConfirmation("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all your data including expenses,
              settings, and budget information. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              Type <span className="font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmation !== "DELETE" || isPending}
              onClick={() => {
                startTransition(async () => {
                  const result = await deleteAccount();
                  if (result.success) {
                    window.location.href = "/login";
                  } else {
                    toast.error(result.error ?? "Failed to delete account");
                    setShowDeleteDialog(false);
                  }
                });
              }}
            >
              {isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
