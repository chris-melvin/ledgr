import { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Linking, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/lib/theme/theme-context";
import { SettingsSection } from "./settings-section";

export function AccountSettings() {
  const { user, signOut, deleteAccount } = useAuth();
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
              "All your expenses, settings, and data will be permanently removed.",
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
          </View>
        </View>
      </SettingsSection>

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
