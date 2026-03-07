import { Slot, useRouter, useSegments } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/components/providers/auth-provider";
import { SyncProvider } from "@/components/providers/sync-provider";
import { TimezoneProvider } from "@/components/providers/timezone-provider";
import { runMigrations } from "@/lib/db/migrations";
import "../global.css";

function AuthGate() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="ledgr.db" onInit={runMigrations}>
      <AuthProvider>
        <SyncProvider>
          <TimezoneProvider>
            <StatusBar style="auto" />
            <AuthGate />
          </TimezoneProvider>
        </SyncProvider>
      </AuthProvider>
    </SQLiteProvider>
  );
}
