import { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useAuth } from "@/components/providers/auth-provider";

export function useCategories() {
  const db = useSQLiteContext();
  const { user } = useAuth();
  const [categories, setCategories] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const results = await db.getAllAsync<{ category: string }>(
      `SELECT DISTINCT category FROM expenses
       WHERE user_id = ? AND category IS NOT NULL AND category != '' AND deleted_at IS NULL
       ORDER BY category ASC`,
      [user.id]
    );
    setCategories(results.map((r) => r.category));
  }, [db, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { categories, refresh };
}
