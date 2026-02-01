"use client";

import { useState, useEffect } from "react";
import { History, Calendar, DollarSign, TrendingUp, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDebtPaymentHistory, getDebtPaymentStats } from "@/actions/bills/record-payment";
import type { DebtPayment, Debt, BudgetBucket } from "@repo/database";

interface PaymentHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  debt: Debt | null;
  buckets?: BudgetBucket[];
  currency: string;
}

export function PaymentHistoryDialog({
  open,
  onClose,
  debt,
  buckets = [],
  currency,
}: PaymentHistoryDialogProps) {
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [stats, setStats] = useState<{
    avg: number;
    min: number;
    max: number;
    count: number;
    total: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && debt) {
      loadData();
    }
  }, [open, debt]);

  const loadData = async () => {
    if (!debt) return;
    setIsLoading(true);
    try {
      const [historyResult, statsResult] = await Promise.all([
        getDebtPaymentHistory(debt.id),
        getDebtPaymentStats(debt.id),
      ]);
      if (historyResult.success) {
        setPayments(historyResult.data);
      }
      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error("Failed to load payment history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBucketName = (bucketId: string | null): string | null => {
    if (!bucketId) return null;
    const bucket = buckets.find((b) => b.id === bucketId);
    return bucket?.name ?? null;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!debt) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            Payment History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Debt Info */}
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
            <span className="text-2xl">{debt.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-stone-800">{debt.label}</p>
              <p className="text-sm text-stone-500">
                {debt.payment_mode === "auto_deduct" ? "Auto-deduct" : "Manual"} payment
              </p>
            </div>
          </div>

          {/* Stats */}
          {stats && stats.count > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-teal-50 rounded-lg text-center">
                <p className="text-xs text-teal-600 font-medium">Total Paid</p>
                <p className="text-lg font-bold text-teal-700">
                  {currency}{stats.total.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-stone-100 rounded-lg text-center">
                <p className="text-xs text-stone-500 font-medium">Payments</p>
                <p className="text-lg font-bold text-stone-700">{stats.count}</p>
              </div>
              <div className="p-3 bg-stone-100 rounded-lg text-center">
                <p className="text-xs text-stone-500 font-medium">Average</p>
                <p className="text-lg font-bold text-stone-700">
                  {currency}{Math.round(stats.avg).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Payment List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-stone-600 uppercase tracking-wider">
              Payment Records
            </h4>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full" />
              </div>
            ) : payments.length === 0 ? (
              <div className="py-8 text-center text-stone-400">
                <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No payments recorded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {payments.map((payment) => {
                  const bucketName = getBucketName(payment.source_bucket_id);
                  return (
                    <div
                      key={payment.id}
                      className="py-3 flex items-start gap-3"
                    >
                      {/* Date icon */}
                      <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-stone-500" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-stone-500">
                            {formatDate(payment.payment_timestamp)}
                          </span>
                          <span className="font-mono font-medium text-stone-800">
                            {currency}{payment.amount.toLocaleString()}
                          </span>
                        </div>
                        {(payment.notes || bucketName) && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-stone-400">
                            {bucketName && (
                              <span className="flex items-center gap-1">
                                <Wallet className="w-3 h-3" />
                                {bucketName}
                              </span>
                            )}
                            {payment.notes && (
                              <span className="truncate">{payment.notes}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Remaining Balance */}
          {debt.remaining_balance != null && (
            <div className="pt-3 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">Remaining Balance</span>
                <span className="font-mono text-lg font-bold text-stone-800">
                  {currency}{debt.remaining_balance.toLocaleString()}
                </span>
              </div>
              {debt.total_amount && debt.total_amount > 0 && (
                <div className="mt-2">
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 transition-all duration-300"
                      style={{
                        width: `${Math.max(0, Math.min(100, ((debt.total_amount - debt.remaining_balance) / debt.total_amount) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-stone-400 mt-1 text-right">
                    {Math.round(((debt.total_amount - debt.remaining_balance) / debt.total_amount) * 100)}% paid
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
