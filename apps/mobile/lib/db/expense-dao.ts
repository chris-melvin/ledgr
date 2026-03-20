import type { SQLiteDatabase } from "expo-sqlite";
import uuid from "react-native-uuid";

export interface LocalExpense {
  id: string;
  user_id: string;
  amount: number;
  label: string;
  category: string | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_synced: number;
  last_synced_at: string | null;
}

export interface CreateExpenseInput {
  user_id: string;
  amount: number;
  label: string;
  category?: string;
  occurred_at: string;
}

export interface UpdateExpenseInput {
  amount?: number;
  label?: string;
  category?: string;
  occurred_at?: string;
}

export class ExpenseDao {
  constructor(private db: SQLiteDatabase) {}

  async create(input: CreateExpenseInput): Promise<LocalExpense> {
    const id = uuid.v4() as string;
    const now = new Date().toISOString();
    const expense: LocalExpense = {
      id,
      user_id: input.user_id,
      amount: input.amount,
      label: input.label,
      category: input.category ?? null,
      occurred_at: input.occurred_at,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      is_synced: 0,
      last_synced_at: null,
    };

    await this.db.runAsync(
      `INSERT INTO expenses (id, user_id, amount, label, category, occurred_at, created_at, updated_at, deleted_at, is_synced, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expense.id,
        expense.user_id,
        expense.amount,
        expense.label,
        expense.category,
        expense.occurred_at,
        expense.created_at,
        expense.updated_at,
        expense.deleted_at,
        expense.is_synced,
        expense.last_synced_at,
      ]
    );

    await this.enqueueSync("expenses", id, "create", expense);
    return expense;
  }

  async update(id: string, input: UpdateExpenseInput): Promise<void> {
    const now = new Date().toISOString();
    const sets: string[] = ["updated_at = ?", "is_synced = 0"];
    const values: (string | number | null)[] = [now, 0];

    if (input.amount !== undefined) {
      sets.push("amount = ?");
      values.push(input.amount);
    }
    if (input.label !== undefined) {
      sets.push("label = ?");
      values.push(input.label);
    }
    if (input.category !== undefined) {
      sets.push("category = ?");
      values.push(input.category);
    }
    if (input.occurred_at !== undefined) {
      sets.push("occurred_at = ?");
      values.push(input.occurred_at);
    }

    values.push(id);
    await this.db.runAsync(
      `UPDATE expenses SET ${sets.join(", ")} WHERE id = ?`,
      values
    );

    const updated = await this.findById(id);
    if (updated) {
      await this.enqueueSync("expenses", id, "update", updated);
    }
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      `UPDATE expenses SET deleted_at = ?, updated_at = ?, is_synced = 0 WHERE id = ?`,
      [now, now, id]
    );
    await this.enqueueSync("expenses", id, "delete", null);
  }

  async findById(id: string): Promise<LocalExpense | null> {
    return await this.db.getFirstAsync<LocalExpense>(
      `SELECT * FROM expenses WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
  }

  async findByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<LocalExpense[]> {
    return await this.db.getAllAsync<LocalExpense>(
      `SELECT * FROM expenses
       WHERE user_id = ?
         AND occurred_at >= ?
         AND occurred_at < ?
         AND deleted_at IS NULL
       ORDER BY occurred_at DESC`,
      [userId, startDate, endDate]
    );
  }

  async findAll(userId: string): Promise<LocalExpense[]> {
    return await this.db.getAllAsync<LocalExpense>(
      `SELECT * FROM expenses
       WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY occurred_at DESC`,
      [userId]
    );
  }

  async findDatesWithExpenses(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<string[]> {
    const results = await this.db.getAllAsync<{ day: string }>(
      `SELECT DISTINCT date(occurred_at) as day FROM expenses
       WHERE user_id = ?
         AND occurred_at >= ?
         AND occurred_at < ?
         AND deleted_at IS NULL
       ORDER BY day`,
      [userId, startDate, endDate]
    );
    return results.map((r) => r.day);
  }

  async getUnsyncedCount(): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM expenses WHERE is_synced = 0`
    );
    return result?.count ?? 0;
  }

  async markSynced(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      `UPDATE expenses SET is_synced = 1, last_synced_at = ? WHERE id = ?`,
      [now, id]
    );
  }

  async upsertFromRemote(expense: {
    id: string;
    user_id: string;
    amount: number;
    label: string;
    category: string | null;
    occurred_at: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      `INSERT INTO expenses (id, user_id, amount, label, category, occurred_at, created_at, updated_at, deleted_at, is_synced, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
       ON CONFLICT(id) DO UPDATE SET
         amount = excluded.amount,
         label = excluded.label,
         category = excluded.category,
         occurred_at = excluded.occurred_at,
         updated_at = excluded.updated_at,
         deleted_at = excluded.deleted_at,
         is_synced = 1,
         last_synced_at = ?`,
      [
        expense.id,
        expense.user_id,
        expense.amount,
        expense.label,
        expense.category,
        expense.occurred_at,
        expense.created_at,
        expense.updated_at,
        expense.deleted_at,
        now,
        now,
      ]
    );
  }

  private async enqueueSync(
    entityType: string,
    entityId: string,
    operation: string,
    payload: unknown
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      `INSERT INTO sync_queue (entity_type, entity_id, operation, payload, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(entity_type, entity_id, operation) DO UPDATE SET
         payload = excluded.payload,
         created_at = excluded.created_at,
         retry_count = 0`,
      [entityType, entityId, operation, payload ? JSON.stringify(payload) : null, now]
    );
  }
}
