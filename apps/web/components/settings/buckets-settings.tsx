"use client";

import { useState, useTransition, useOptimistic, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PiggyBank,
  Plus,
  Trash2,
  Star,
  GripVertical,
  Pencil,
  Check,
  X,
  Info,
  Wallet,
  ShoppingCart,
  Gamepad2,
  Car,
  Plane,
  Gift,
  Heart,
  GraduationCap,
  Home,
  Utensils,
  Film,
  Music,
  Dumbbell,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createBucket,
  updateBucket,
  deleteBucket,
  setDefaultBucket,
} from "@/actions/buckets";
import { BUCKET_COLORS, BUCKET_ICONS } from "@/lib/budget-setup";
import type { BudgetBucket } from "@repo/database";

// Map icon names to components
const ICON_MAP: Record<string, LucideIcon> = {
  Wallet,
  PiggyBank,
  ShoppingCart,
  Gamepad2,
  Car,
  Plane,
  Gift,
  Heart,
  GraduationCap,
  Home,
  Utensils,
  Film,
  Music,
  Dumbbell,
  Stethoscope,
};

interface BucketsSettingsProps {
  buckets: BudgetBucket[];
  currency: string;
  availableAmount?: number;
}

/**
 * Controls whether a bucket's expenses feed the trailing daily-spend averages.
 * Bills and other lumpy, non-daily spending should stay off so they don't
 * distort the daily number.
 */
function DailyAvgToggle({
  id,
  checked,
  onCheckedChange,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-stone-200 p-3">
      <div className="space-y-0.5">
        <Label htmlFor={id}>Counts toward daily spending</Label>
        <p className="text-xs text-stone-500">
          Expenses in this bucket feed your daily average and today&apos;s total.
          Turn off for bills and other non-daily spending.
        </p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function BucketsSettings({
  buckets: initialBuckets,
  currency,
  availableAmount = 0,
}: BucketsSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticBuckets, addOptimisticBucket] = useOptimistic(
    initialBuckets,
    (state, action: { type: string; bucket?: BudgetBucket; id?: string }) => {
      switch (action.type) {
        case "add":
          return action.bucket ? [...state, action.bucket] : state;
        case "delete":
          return state.filter((b) => b.id !== action.id);
        case "setDefault":
          return state.map((b) => ({ ...b, is_default: b.id === action.id }));
        default:
          return state;
      }
    }
  );

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Calculate total percentage
  const totalPercent = optimisticBuckets.reduce(
    (sum, b) => sum + (b.percentage ?? 0),
    0
  );

  const handleSetDefault = useCallback(
    (bucketId: string) => {
      startTransition(async () => {
        addOptimisticBucket({ type: "setDefault", id: bucketId });
        try {
          await setDefaultBucket(bucketId);
          toast.success("Default bucket updated");
          router.refresh();
        } catch (error) {
          toast.error("Failed to update default bucket");
        }
      });
    },
    [router, addOptimisticBucket]
  );

  const handleDelete = useCallback(
    (bucketId: string) => {
      const bucket = optimisticBuckets.find((b) => b.id === bucketId);
      if (bucket?.is_default) {
        toast.error("Cannot delete the default bucket. Set another bucket as default first.");
        return;
      }

      startTransition(async () => {
        addOptimisticBucket({ type: "delete", id: bucketId });
        try {
          await deleteBucket(bucketId);
          toast.success("Bucket deleted");
          router.refresh();
        } catch (error) {
          toast.error("Failed to delete bucket");
        }
      });
      setDeleteId(null);
    },
    [router, addOptimisticBucket, optimisticBuckets]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Spending Buckets
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-stone-400 hover:text-stone-600">
                      <Info className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Buckets are like envelopes for your money. Divide your budget
                      into categories for different purposes. The default bucket
                      (marked with a star) is where everyday expenses are tracked.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              Manage how your budget is allocated across spending categories
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Allocation Bar */}
        {optimisticBuckets.length > 0 && (
          <div className="space-y-1">
            <div className="flex h-6 overflow-hidden rounded-lg">
              {optimisticBuckets.map((bucket) => {
                const pct = bucket.percentage ?? 0;
                return (
                  <div
                    key={bucket.id}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: bucket.color ?? "#6b7280",
                    }}
                    className="flex items-center justify-center text-xs font-medium text-white transition-all"
                  >
                    {pct >= 15 && `${pct}%`}
                  </div>
                );
              })}
              {totalPercent < 100 && (
                <div
                  style={{ width: `${100 - totalPercent}%` }}
                  className="flex items-center justify-center bg-stone-200 text-xs font-medium text-stone-500"
                />
              )}
            </div>
            <p className="text-xs text-stone-500">
              {totalPercent === 100
                ? "100% allocated"
                : totalPercent < 100
                  ? `${(100 - totalPercent).toFixed(0)}% unallocated`
                  : `${(totalPercent - 100).toFixed(0)}% over allocated`}
            </p>
          </div>
        )}

        {/* Empty State */}
        {optimisticBuckets.length === 0 && (
          <div className="p-8 text-center border-2 border-dashed border-stone-200 rounded-lg">
            <PiggyBank className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600 font-medium mb-1">No spending buckets</p>
            <p className="text-sm text-stone-500 mb-4">
              Add buckets to organize your budget into categories
            </p>
            <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
              <Plus className="w-4 h-4" />
              Add Bucket
            </Button>
          </div>
        )}

        {/* Bucket List */}
        <div className="space-y-2">
          {optimisticBuckets.map((bucket) => {
            const Icon = ICON_MAP[bucket.icon ?? "Wallet"] || Wallet;
            const pct = bucket.percentage ?? 0;
            const allocatedAmount = availableAmount > 0
              ? Math.floor((availableAmount * pct) / 100)
              : null;

            return (
              <div
                key={bucket.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 border border-stone-100 group"
              >
                {/* Drag Handle */}
                <div className="text-stone-300 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${bucket.color ?? "#6b7280"}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: bucket.color ?? "#6b7280" }} />
                </div>

                {/* Name & Amount */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-stone-800 truncate">{bucket.name}</p>
                    {bucket.is_default && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full font-medium flex-shrink-0">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500">
                    {pct}%
                    {allocatedAmount !== null && (
                      <span className="text-stone-400">
                        {" "}
                        ({currency}
                        {allocatedAmount.toLocaleString()}/mo)
                      </span>
                    )}
                    {!bucket.include_in_daily_avg && (
                      <span className="text-stone-400">
                        {" · "}not in daily spending
                      </span>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleSetDefault(bucket.id)}
                          disabled={isPending || bucket.is_default}
                          className={`p-1.5 rounded-lg transition-colors ${
                            bucket.is_default
                              ? "bg-amber-100 text-amber-600"
                              : "text-stone-400 hover:bg-stone-100 hover:text-amber-500"
                          }`}
                        >
                          <Star
                            className="w-4 h-4"
                            fill={bucket.is_default ? "currentColor" : "none"}
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {bucket.is_default ? "Default bucket" : "Set as default"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <button
                    onClick={() => setEditingId(bucket.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteId(bucket.id)}
                    disabled={bucket.is_default}
                    className="p-1.5 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explanation */}
        <div className="p-3 bg-stone-50 rounded-lg">
          <p className="text-xs text-stone-500 leading-relaxed">
            <span className="font-medium">Tip:</span> The default bucket (marked
            with a star) is where your everyday expenses are tracked. Use other
            buckets to set aside money for specific purposes.
          </p>
        </div>
      </CardContent>

      {/* Add Bucket Dialog */}
      <AddBucketDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        existingSlugs={optimisticBuckets.map((b) => b.slug)}
        currency={currency}
      />

      {/* Edit Bucket Dialog */}
      {editingId && (
        <EditBucketDialog
          bucket={optimisticBuckets.find((b) => b.id === editingId) ?? null}
          onOpenChange={() => setEditingId(null)}
          currency={currency}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bucket</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bucket? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Add Bucket Dialog
function AddBucketDialog({
  open,
  onOpenChange,
  existingSlugs,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSlugs: string[];
  currency: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState(20);
  const [color, setColor] = useState(BUCKET_COLORS[0] ?? "#1A9E9E");
  const [icon, setIcon] = useState("Wallet");
  const [includeInDailyAvg, setIncludeInDailyAvg] = useState(true);

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slugExists = existingSlugs.includes(slug);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || slugExists) return;

    startTransition(async () => {
      try {
        await createBucket({
          name: name.trim(),
          slug,
          percentage,
          color,
          icon,
          isDefault: false,
          includeInDailyAvg,
        });
        toast.success("Bucket created");
        router.refresh();
        onOpenChange(false);
        // Reset form
        setName("");
        setPercentage(20);
        setColor(BUCKET_COLORS[0] ?? "#1A9E9E");
        setIcon("Wallet");
        setIncludeInDailyAvg(true);
      } catch (error) {
        toast.error("Failed to create bucket");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Bucket</DialogTitle>
            <DialogDescription>
              Create a new spending bucket to organize your budget
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div>
              <Label htmlFor="bucket-name">Name</Label>
              <Input
                id="bucket-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Entertainment, Travel"
                className="mt-1"
              />
              {slugExists && (
                <p className="mt-1 text-sm text-red-500">
                  A bucket with this name already exists
                </p>
              )}
            </div>

            {/* Percentage */}
            <div>
              <Label>Percentage</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={percentage}
                  onChange={(e) => setPercentage(parseInt(e.target.value))}
                  className="flex-1 accent-teal-500"
                />
                <span className="w-12 text-center font-medium text-stone-800">
                  {percentage}%
                </span>
              </div>
            </div>

            {/* Counts toward daily average */}
            <DailyAvgToggle
              id="add-bucket-daily-avg"
              checked={includeInDailyAvg}
              onCheckedChange={setIncludeInDailyAvg}
            />

            {/* Color */}
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {BUCKET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full transition-transform ${
                      color === c ? "scale-110 ring-2 ring-stone-800 ring-offset-2" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Icon */}
            <div>
              <Label>Icon</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {BUCKET_ICONS.map((iconName) => {
                  const IconComp = ICON_MAP[iconName] || Wallet;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={`flex h-10 items-center justify-center rounded-lg border transition-colors ${
                        icon === iconName
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-stone-200 text-stone-600 hover:border-stone-300"
                      }`}
                    >
                      <IconComp className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || slugExists || isPending}>
              {isPending ? "Creating..." : "Create Bucket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Bucket Dialog
function EditBucketDialog({
  bucket,
  onOpenChange,
  currency,
}: {
  bucket: BudgetBucket | null;
  onOpenChange: () => void;
  currency: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(bucket?.name ?? "");
  const [percentage, setPercentage] = useState(bucket?.percentage ?? 20);
  const [color, setColor] = useState(bucket?.color ?? BUCKET_COLORS[0] ?? "#1A9E9E");
  const [icon, setIcon] = useState(bucket?.icon ?? "Wallet");
  const [includeInDailyAvg, setIncludeInDailyAvg] = useState(
    bucket?.include_in_daily_avg ?? false
  );

  if (!bucket) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      try {
        await updateBucket(bucket.id, {
          name: name.trim(),
          percentage,
          color,
          icon,
          includeInDailyAvg,
        });
        toast.success("Bucket updated");
        router.refresh();
        onOpenChange();
      } catch (error) {
        toast.error("Failed to update bucket");
      }
    });
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Bucket</DialogTitle>
            <DialogDescription>Update this spending bucket</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div>
              <Label htmlFor="edit-bucket-name">Name</Label>
              <Input
                id="edit-bucket-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Percentage */}
            <div>
              <Label>Percentage</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={percentage ?? 20}
                  onChange={(e) => setPercentage(parseInt(e.target.value))}
                  className="flex-1 accent-teal-500"
                />
                <span className="w-12 text-center font-medium text-stone-800">
                  {percentage}%
                </span>
              </div>
            </div>

            {/* Counts toward daily average */}
            <DailyAvgToggle
              id="edit-bucket-daily-avg"
              checked={includeInDailyAvg}
              onCheckedChange={setIncludeInDailyAvg}
            />

            {/* Color */}
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {BUCKET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full transition-transform ${
                      color === c ? "scale-110 ring-2 ring-stone-800 ring-offset-2" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Icon */}
            <div>
              <Label>Icon</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {BUCKET_ICONS.map((iconName) => {
                  const IconComp = ICON_MAP[iconName] || Wallet;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={`flex h-10 items-center justify-center rounded-lg border transition-colors ${
                        icon === iconName
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-stone-200 text-stone-600 hover:border-stone-300"
                      }`}
                    >
                      <IconComp className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onOpenChange}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
