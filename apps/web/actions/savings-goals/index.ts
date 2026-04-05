"use server";

import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import {
  savingsGoalRepository,
  savingsTransactionRepository,
} from "@/lib/repositories";
import type { SavingsGoal, SavingsTransaction } from "@repo/database";

export interface GoalWithProgress {
  id: string;
  name: string;
  targetAmount: number;
  currentBalance: number;
  targetTimestamp: string | null;
  icon: string | null;
  color: string | null;
  isHidden: boolean;
  progressPercentage: number;
  isCompleted: boolean;
  remainingAmount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all savings goals for the current user
 */
export async function getSavingsGoals(): Promise<ActionResult<GoalWithProgress[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const goals = await savingsGoalRepository.findActive(supabase, userId);

    const goalsWithProgress: GoalWithProgress[] = goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      targetAmount: Number(goal.target_amount),
      currentBalance: Number(goal.current_balance),
      targetTimestamp: goal.target_timestamp,
      icon: goal.icon,
      color: goal.color,
      isHidden: goal.is_hidden,
      progressPercentage: savingsGoalRepository.getProgressPercentage(goal),
      isCompleted: savingsGoalRepository.isCompleted(goal),
      remainingAmount: Math.max(0, Number(goal.target_amount) - Number(goal.current_balance)),
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
    }));

    return success(goalsWithProgress);
  } catch (err) {
    console.error("Failed to get savings goals:", err);
    return error("Failed to get savings goals", "DATABASE_ERROR");
  }
}

/**
 * Get a single savings goal by ID
 */
export async function getSavingsGoal(
  goalId: string
): Promise<ActionResult<GoalWithProgress>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const goal = await savingsGoalRepository.findById(supabase, goalId, userId);
    if (!goal) {
      return error("Savings goal not found", "NOT_FOUND");
    }

    return success({
      id: goal.id,
      name: goal.name,
      targetAmount: Number(goal.target_amount),
      currentBalance: Number(goal.current_balance),
      targetTimestamp: goal.target_timestamp,
      icon: goal.icon,
      color: goal.color,
      isHidden: goal.is_hidden,
      progressPercentage: savingsGoalRepository.getProgressPercentage(goal),
      isCompleted: savingsGoalRepository.isCompleted(goal),
      remainingAmount: Math.max(0, Number(goal.target_amount) - Number(goal.current_balance)),
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
    });
  } catch (err) {
    console.error("Failed to get savings goal:", err);
    return error("Failed to get savings goal", "DATABASE_ERROR");
  }
}

export interface CreateGoalInput {
  name: string;
  targetAmount: number;
  currentBalance?: number;
  targetDate?: string | null;
  icon?: string | null;
  color?: string | null;
}

/**
 * Create a new savings goal
 */
export async function createSavingsGoal(
  input: CreateGoalInput
): Promise<ActionResult<SavingsGoal>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  // Validation
  if (!input.name?.trim()) {
    return error("Goal name is required", "VALIDATION_ERROR");
  }
  if (input.targetAmount <= 0) {
    return error("Target amount must be greater than 0", "VALIDATION_ERROR");
  }

  try {
    const goal = await savingsGoalRepository.create(supabase, {
      user_id: userId,
      name: input.name.trim(),
      target_amount: input.targetAmount,
      current_balance: input.currentBalance ?? 0,
      target_timestamp: input.targetDate ?? null,
      icon: input.icon ?? "🎯",
      color: input.color ?? "#3B82F6",
      is_hidden: false,
    });

    return success(goal);
  } catch (err) {
    console.error("Failed to create savings goal:", err);
    return error("Failed to create savings goal", "DATABASE_ERROR");
  }
}

export interface UpdateGoalInput {
  name?: string;
  targetAmount?: number;
  targetDate?: string | null;
  icon?: string | null;
  color?: string | null;
}

/**
 * Update a savings goal
 */
export async function updateSavingsGoal(
  goalId: string,
  input: UpdateGoalInput
): Promise<ActionResult<SavingsGoal>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const existing = await savingsGoalRepository.findById(supabase, goalId, userId);
    if (!existing) {
      return error("Savings goal not found", "NOT_FOUND");
    }

    const update: Record<string, unknown> = {};
    if (input.name !== undefined) update.name = input.name.trim();
    if (input.targetAmount !== undefined) update.target_amount = input.targetAmount;
    if (input.targetDate !== undefined) update.target_timestamp = input.targetDate;
    if (input.icon !== undefined) update.icon = input.icon;
    if (input.color !== undefined) update.color = input.color;

    const goal = await savingsGoalRepository.update(supabase, goalId, userId, update);
    return success(goal);
  } catch (err) {
    console.error("Failed to update savings goal:", err);
    return error("Failed to update savings goal", "DATABASE_ERROR");
  }
}

export interface ContributeInput {
  amount: number;
  note?: string | null;
}

/**
 * Contribute to a savings goal
 */
export async function contributeToGoal(
  goalId: string,
  input: ContributeInput
): Promise<ActionResult<SavingsGoal>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  if (input.amount <= 0) {
    return error("Contribution amount must be greater than 0", "VALIDATION_ERROR");
  }

  try {
    // Check goal exists
    const goal = await savingsGoalRepository.findById(supabase, goalId, userId);
    if (!goal) {
      return error("Savings goal not found", "NOT_FOUND");
    }

    // Update goal balance
    const updatedGoal = await savingsGoalRepository.contribute(
      supabase,
      goalId,
      userId,
      input.amount
    );

    // Record transaction
    await savingsTransactionRepository.create(supabase, {
      user_id: userId,
      savings_goal_id: goalId,
      amount: input.amount,
      type: "contribution",
      notes: input.note ?? null,
      transaction_timestamp: new Date().toISOString(),
    });

    return success(updatedGoal);
  } catch (err) {
    console.error("Failed to contribute to goal:", err);
    return error("Failed to contribute to goal", "DATABASE_ERROR");
  }
}

export interface WithdrawInput {
  amount: number;
  note?: string | null;
}

/**
 * Withdraw from a savings goal
 */
export async function withdrawFromGoal(
  goalId: string,
  input: WithdrawInput
): Promise<ActionResult<SavingsGoal>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  if (input.amount <= 0) {
    return error("Withdrawal amount must be greater than 0", "VALIDATION_ERROR");
  }

  try {
    // Check goal exists and has enough balance
    const goal = await savingsGoalRepository.findById(supabase, goalId, userId);
    if (!goal) {
      return error("Savings goal not found", "NOT_FOUND");
    }

    if (Number(goal.current_balance) < input.amount) {
      return error("Insufficient funds in goal", "VALIDATION_ERROR");
    }

    // Update goal balance
    const updatedGoal = await savingsGoalRepository.withdraw(
      supabase,
      goalId,
      userId,
      input.amount
    );

    // Record transaction
    await savingsTransactionRepository.create(supabase, {
      user_id: userId,
      savings_goal_id: goalId,
      amount: -input.amount,
      type: "withdrawal",
      notes: input.note ?? null,
      transaction_timestamp: new Date().toISOString(),
    });

    return success(updatedGoal);
  } catch (err) {
    console.error("Failed to withdraw from goal:", err);
    return error("Failed to withdraw from goal", "DATABASE_ERROR");
  }
}

/**
 * Get transaction history for a goal
 */
export async function getGoalTransactions(
  goalId: string,
  limit = 20
): Promise<ActionResult<SavingsTransaction[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const transactions = await savingsTransactionRepository.findByGoal(
      supabase,
      goalId,
      userId,
      { limit }
    );
    return success(transactions);
  } catch (err) {
    console.error("Failed to get goal transactions:", err);
    return error("Failed to get goal transactions", "DATABASE_ERROR");
  }
}

/**
 * Delete (hide) a savings goal
 */
export async function deleteSavingsGoal(
  goalId: string
): Promise<ActionResult<void>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const existing = await savingsGoalRepository.findById(supabase, goalId, userId);
    if (!existing) {
      return error("Savings goal not found", "NOT_FOUND");
    }

    await savingsGoalRepository.hide(supabase, goalId, userId);
    return success(undefined);
  } catch (err) {
    console.error("Failed to delete savings goal:", err);
    return error("Failed to delete savings goal", "DATABASE_ERROR");
  }
}

/**
 * Get savings summary for dashboard
 */
export async function getSavingsSummary(): Promise<
  ActionResult<{
    totalSaved: number;
    totalTarget: number;
    overallProgress: number;
    activeGoals: number;
    completedGoals: number;
  }>
> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const goals = await savingsGoalRepository.findActive(supabase, userId);

    const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_balance), 0);
    const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);
    const completedGoals = goals.filter((g) =>
      savingsGoalRepository.isCompleted(g)
    ).length;

    return success({
      totalSaved,
      totalTarget,
      overallProgress: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0,
      activeGoals: goals.length,
      completedGoals,
    });
  } catch (err) {
    console.error("Failed to get savings summary:", err);
    return error("Failed to get savings summary", "DATABASE_ERROR");
  }
}
