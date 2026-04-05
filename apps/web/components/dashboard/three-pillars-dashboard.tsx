"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Wallet, Target, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalCard, GoalsSummaryCard, EmptyGoalsState } from "@/components/savings-goals/goal-card";
import { AccountCard, AccountsSummaryCard, EmptyAccountsState } from "@/components/accounts/account-card";
import { BillCard, BillsSummaryCard, EmptyBillsState } from "@/components/bills/bill-card";
import { CreateGoalDialog, ContributeDialog } from "@/components/savings-goals/goal-dialogs";
import { CreateAccountDialog, UpdateBalanceDialog } from "@/components/accounts/account-dialogs";
import { formatCurrency } from "@/lib/utils";

// Import server actions
import {
  getSavingsGoals,
  createSavingsGoal,
  contributeToGoal,
  deleteSavingsGoal,
  type GoalWithProgress,
} from "@/actions/savings-goals";
import {
  getAssets,
  createAsset,
  updateAssetBalance,
  deleteAsset,
  type AccountWithType,
} from "@/actions/assets";
import { getDashboardSummary, type DashboardSummary } from "@/actions/dashboard";
import { createBill, markBillPaid } from "@/actions/bills";
import type { AssetType } from "@repo/database";

export function ThreePillarsDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [accounts, setAccounts] = useState<AccountWithType[]>([]);

  // Dialog states
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [contributeDialog, setContributeDialog] = useState<{
    open: boolean;
    goal: GoalWithProgress | null;
  }>({ open: false, goal: null });
  const [updateBalanceDialog, setUpdateBalanceDialog] = useState<{
    open: boolean;
    account: AccountWithType | null;
  }>({ open: false, account: null });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [summaryResult, goalsResult, accountsResult] = await Promise.all([
        getDashboardSummary(),
        getSavingsGoals(),
        getAssets(),
      ]);

      if (summaryResult.success) {
        setSummary(summaryResult.data);
      }
      if (goalsResult.success) {
        setGoals(goalsResult.data);
      }
      if (accountsResult.success) {
        setAccounts(accountsResult.data);
      }
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  // Goal handlers
  const handleCreateGoal = async (formData: {
    name: string;
    targetAmount: string;
    currentBalance?: string;
    targetDate?: string;
    icon?: string;
    color?: string;
  }) => {
    const result = await createSavingsGoal({
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentBalance: formData.currentBalance ? parseFloat(formData.currentBalance) : 0,
      targetDate: formData.targetDate || null,
      icon: formData.icon || "🎯",
      color: formData.color || "#3B82F6",
    });

    if (result.success) {
      toast.success("Goal created!");
      setCreateGoalOpen(false);
      loadData();
    } else {
      toast.error(result.error || "Failed to create goal");
    }
  };

  const handleContribute = async (amount: number, note?: string) => {
    if (!contributeDialog.goal) return;

    const result = await contributeToGoal(contributeDialog.goal.id, {
      amount,
      note: note || null,
    });

    if (result.success) {
      toast.success(`Contributed ${formatCurrency(amount)}!`);
      setContributeDialog({ open: false, goal: null });
      loadData();
    } else {
      toast.error(result.error || "Failed to contribute");
    }
  };

  // Account handlers
  const handleCreateAccount = async (formData: {
    name: string;
    type: AssetType;
    balance?: string;
    institution?: string;
    accountNumber?: string;
    notes?: string;
  }) => {
    const result = await createAsset({
      name: formData.name,
      type: formData.type,
      balance: formData.balance ? parseFloat(formData.balance) : 0,
      institution: formData.institution || null,
      accountNumber: formData.accountNumber || null,
      notes: formData.notes || null,
    });

    if (result.success) {
      toast.success("Account added!");
      setCreateAccountOpen(false);
      loadData();
    } else {
      toast.error(result.error || "Failed to add account");
    }
  };

  const handleUpdateBalance = async (newBalance: number) => {
    if (!updateBalanceDialog.account) return;

    const result = await updateAssetBalance(updateBalanceDialog.account.id, newBalance);

    if (result.success) {
      toast.success("Balance updated!");
      setUpdateBalanceDialog({ open: false, account: null });
      loadData();
    } else {
      toast.error(result.error || "Failed to update balance");
    }
  };

  // Bill handlers
  const handleMarkBillPaid = async (billId: string) => {
    const result = await markBillPaid(billId);
    if (result.success) {
      toast.success("Bill marked as paid!");
      loadData();
    } else {
      toast.error("Failed to mark bill as paid");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const hasData =
    goals.length > 0 || accounts.length > 0 || (summary?.upcomingBillsList.length || 0) > 0;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Finances</h1>
          <p className="text-muted-foreground">
            {summary && `Total Balance: ${formatCurrency(summary.totalBalance)}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCreateGoalOpen(true)}>
            <Target className="mr-2 h-4 w-4" />
            New Goal
          </Button>
          <Button onClick={() => setCreateAccountOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <GoalsSummaryCard
          totalSaved={summary?.totalSaved || 0}
          totalTarget={summary?.totalSaved || 0}
          activeGoals={summary?.activeGoals || 0}
          completedGoals={summary?.completedGoals || 0}
          onAddGoal={() => setCreateGoalOpen(true)}
        />

        <AccountsSummaryCard
          totalBalance={summary?.totalBalance || 0}
          liquidBalance={accounts
            .filter((a) => a.is_liquid)
            .reduce((sum, a) => sum + a.balance, 0)}
          investmentBalance={accounts
            .filter((a) => a.type === "investment" || a.type === "retirement")
            .reduce((sum, a) => sum + a.balance, 0)}
          accountCount={accounts.length}
          onAddAccount={() => setCreateAccountOpen(true)}
        />

        <BillsSummaryCard
          totalDueThisMonth={summary?.totalDueThisMonth || 0}
          upcomingCount={summary?.upcomingBills || 0}
          overdueCount={summary?.overdueBills || 0}
          paidCount={0} // TODO: Get from API
          onAddBill={() => {
            /* TODO: Navigate to bills page */
          }}
        />
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals ({goals.length})</TabsTrigger>
          <TabsTrigger value="accounts">Accounts ({accounts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Recent Goals */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Target className="h-5 w-5" />
              Recent Goals
            </h2>
            {goals.length === 0 ? (
              <EmptyGoalsState onAddGoal={() => setCreateGoalOpen(true)} />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {goals.slice(0, 3).map((goal) => (
                  <GoalCard
                    key={goal.id}
                    {...goal}
                    onContribute={(id) => {
                      const goal = goals.find((g) => g.id === id);
                      if (goal) setContributeDialog({ open: true, goal });
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Bills */}
          <div className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Receipt className="h-5 w-5" />
              Upcoming Bills
            </h2>
            {summary?.upcomingBillsList.length === 0 ? (
              <EmptyBillsState
                onAddBill={() => {
                  /* TODO */
                }}
              />
            ) : (
              <div className="space-y-3">
                {summary?.upcomingBillsList.slice(0, 5).map((bill) => (
                  <BillCard
                    key={bill.id}
                    {...bill}
                    onMarkPaid={handleMarkBillPaid}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Accounts */}
          <div className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Wallet className="h-5 w-5" />
              Your Accounts
            </h2>
            {accounts.length === 0 ? (
              <EmptyAccountsState onAddAccount={() => setCreateAccountOpen(true)} />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {accounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    {...account}
                    onClick={(id) => {
                      const account = accounts.find((a) => a.id === id);
                      if (account) setUpdateBalanceDialog({ open: true, account });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Goals</h2>
            <Button onClick={() => setCreateGoalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </div>

          {goals.length === 0 ? (
            <EmptyGoalsState onAddGoal={() => setCreateGoalOpen(true)} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  {...goal}
                  onContribute={(id) => {
                    const goal = goals.find((g) => g.id === id);
                    if (goal) setContributeDialog({ open: true, goal });
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Accounts</h2>
            <Button onClick={() => setCreateAccountOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </div>

          {accounts.length === 0 ? (
            <EmptyAccountsState onAddAccount={() => setCreateAccountOpen(true)} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  {...account}
                  onClick={(id) => {
                    const account = accounts.find((a) => a.id === id);
                    if (account) setUpdateBalanceDialog({ open: true, account });
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateGoalDialog
        open={createGoalOpen}
        onOpenChange={setCreateGoalOpen}
        onSubmit={handleCreateGoal}
      />

      <CreateAccountDialog
        open={createAccountOpen}
        onOpenChange={setCreateAccountOpen}
        onSubmit={handleCreateAccount}
      />

      {contributeDialog.goal && (
        <ContributeDialog
          open={contributeDialog.open}
          onOpenChange={(open) =>
            setContributeDialog({ open, goal: open ? contributeDialog.goal : null })
          }
          goalName={contributeDialog.goal.name}
          currentBalance={contributeDialog.goal.currentBalance}
          targetAmount={contributeDialog.goal.targetAmount}
          onSubmit={handleContribute}
        />
      )}

      {updateBalanceDialog.account && (
        <UpdateBalanceDialog
          open={updateBalanceDialog.open}
          onOpenChange={(open) =>
            setUpdateBalanceDialog({
              open,
              account: open ? updateBalanceDialog.account : null,
            })
          }
          accountName={updateBalanceDialog.account.name}
          currentBalance={updateBalanceDialog.account.balance}
          onSubmit={handleUpdateBalance}
        />
      )}
    </div>
  );
}
