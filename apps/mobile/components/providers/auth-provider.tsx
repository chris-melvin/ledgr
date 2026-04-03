import React, { createContext, useContext, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { supabase } from "@/lib/supabase/client";
import { signInWithApple as appleSignIn } from "@/lib/auth/apple";
import { storage } from "@/lib/storage/mmkv";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  };

  const signInWithApple = async () => {
    try {
      await appleSignIn();
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const deleteAccount = async () => {
    let rpcSucceeded = false;
    try {
      // 1. Delete remote account (cascades all server data)
      const { error: rpcError } = await supabase.rpc("delete_own_account");
      if (rpcError) throw rpcError;
      rpcSucceeded = true;

      // 2. Clear local SQLite tables atomically
      await db.withTransactionAsync(async () => {
        await db.execAsync("DELETE FROM expenses");
        await db.execAsync("DELETE FROM sync_queue");
        await db.execAsync("DELETE FROM sync_metadata");
        await db.execAsync("DELETE FROM user_settings");
        await db.execAsync("DELETE FROM categories");
        await db.execAsync("DELETE FROM budget_buckets");
        await db.execAsync("DELETE FROM shortcuts");
        await db.execAsync("DELETE FROM incomes");
        await db.execAsync("DELETE FROM subscriptions");
      });

      // 3. Clear cached data
      storage.delete("subscription_info");
      storage.delete("user_settings");

      return { error: null };
    } catch (e) {
      return { error: e as Error };
    } finally {
      // Always sign out if remote deletion succeeded — session is invalid
      if (rpcSucceeded) {
        await supabase.auth.signOut();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, isLoading, signIn, signUp, signInWithApple, signOut, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
