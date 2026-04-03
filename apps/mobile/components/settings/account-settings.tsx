import { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Linking, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/components/providers/auth-provider";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { useTheme } from "@/lib/theme/theme-context";
import { SettingsSection } from "./settings-section";

export function AccountSettings() {
  const { user, signOut, deleteAccount } = useAuth();
  const { isPro } = useSettingsContext();
  const { colors } = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "All your expenses, settings, and data will be permanently removed. If you have an active Pro subscription, please cancel it first.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    setIsDeleting(true);
                    const { error } = await deleteAccount();
                    if (error) {
                      setIsDeleting(false);
                      Alert.alert(
                        "Error",
                        "Failed to delete account. Please check your internet connection and try again."
                      );
                    }
                    // On success, component unmounts via AuthGate — no state reset needed
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const initials = (user?.email?.[0] ?? "U").toUpperCase();

  return (
    <>
      <SettingsSection title="PROFILE">
        <View className="flex-row items-center">
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View className="ml-3 flex-1">
            <Text style={[styles.email, { color: colors.textPrimary }]}>{user?.email ?? "Not signed in"}</Text>
            <View style={[styles.badge, { backgroundColor: isPro ? "rgba(26,158,158,0.1)" : "#F5F5F4" }]}>
              {isPro && <Ionicons name="star" size={10} color="#1A9E9E" style={{ marginRight: 3 }} />}
              <Text style={[styles.badgeText, { color: isPro ? "#1A9E9E" : "#78716C" }]}>
                {isPro ? "Pro" : "Free"}
              </Text>
            </View>
          </View>
        </View>
      </SettingsSection>

      {isPro ? (
        <SettingsSection title="SUBSCRIPTION">
          <View style={styles.subCard}>
            <View className="flex-row items-center mb-2">
              <Ionicons name="star" size={16} color="#1A9E9E" />
              <Text style={styles.subTitle}>ledgr Pro</Text>
            </View>
            <Text style={[styles.subDescription, { color: colors.textSecondary }]}>
              Premium themes, materials, shader backgrounds, and more
            </Text>
          </View>
        </SettingsSection>
      ) : (
        <SettingsSection title="SUBSCRIPTION">
          <View style={styles.subCard}>
            <Text style={[styles.subDescription, { color: colors.textSecondary, marginBottom: 12 }]}>
              Unlock premium themes, materials, shader backgrounds, and more.
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL("https://ledgr.ink/pricing")}
              style={styles.upgradeButton}
            >
              <LinearGradient
                colors={["#1A9E9E", "#0F6B6B"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Ionicons name="star" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.upgradeText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          </View>
        </SettingsSection>
      )}

      <SettingsSection title="LEGAL">
        <TouchableOpacity
          onPress={() => Linking.openURL("https://ledgr.ink/privacy")}
          style={styles.legalRow}
        >
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.legalText, { color: colors.textPrimary }]}>Privacy Policy</Text>
          <Ionicons name="open-outline" size={14} color={colors.textTertiary} style={{ marginLeft: "auto" }} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <TouchableOpacity
          onPress={() => Linking.openURL("https://ledgr.ink/terms")}
          style={styles.legalRow}
        >
          <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.legalText, { color: colors.textPrimary }]}>Terms of Service</Text>
          <Ionicons name="open-outline" size={14} color={colors.textTertiary} style={{ marginLeft: "auto" }} />
        </TouchableOpacity>
      </SettingsSection>

      <View style={{ marginTop: 20 }}>
        <TouchableOpacity onPress={handleSignOut} style={[styles.signOutButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <SettingsSection title="DANGER ZONE">
        <TouchableOpacity
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          style={[styles.deleteButton, { opacity: isDeleting ? 0.6 : 1 }]}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#EF4444" style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.deleteText}>{isDeleting ? "Deleting..." : "Delete Account"}</Text>
        </TouchableOpacity>
      </SettingsSection>
    </>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(26,158,158,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#1A9E9E",
  },
  email: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: "#292524",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    marginTop: 4,
  },
  badgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  subCard: {
    paddingVertical: 4,
  },
  subTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#1A9E9E",
    marginLeft: 8,
  },
  subDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#78716C",
  },
  upgradeButton: {
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#1A9E9E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  legalText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E7E5E4",
  },
  signOutButton: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  signOutText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#EF4444",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(239,68,68,0.06)",
  },
  deleteText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#EF4444",
  },
});
