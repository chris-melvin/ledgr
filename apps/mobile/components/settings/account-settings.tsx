import { View, Text, TouchableOpacity, Alert, Linking, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/components/providers/auth-provider";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { useTheme } from "@/lib/theme/theme-context";
import { SettingsSection } from "./settings-section";

export function AccountSettings() {
  const { user, signOut } = useAuth();
  const { isPro } = useSettingsContext();
  const { colors } = useTheme();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
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

      <View style={{ marginTop: 20 }}>
        <TouchableOpacity onPress={handleSignOut} style={[styles.signOutButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
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
});
