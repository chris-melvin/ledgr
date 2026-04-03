import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSyncStatus } from "@/hooks/use-sync";
import { SettingsSection } from "./settings-section";
import { tapLight } from "@/lib/haptics";

export function DataSettings() {
  const { status, triggerSync } = useSyncStatus();

  const handleExport = () => {
    Alert.alert("Coming Soon", "CSV/JSON export will be available in a future update.");
  };

  const handleImport = () => {
    Alert.alert("Coming Soon", "CSV import will be available in a future update.");
  };

  return (
    <>
      {/* Sync */}
      <SettingsSection title="SYNC">
        <View className="flex-row justify-between items-center mb-3">
          <Text style={styles.label}>Status</Text>
          <View className="flex-row items-center">
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    status === "idle"
                      ? "#10B981"
                      : status === "syncing"
                        ? "#3B82F6"
                        : status === "offline"
                          ? "#F59E0B"
                          : "#EF4444",
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    status === "idle"
                      ? "#10B981"
                      : status === "syncing"
                        ? "#3B82F6"
                        : status === "offline"
                          ? "#F59E0B"
                          : "#EF4444",
                },
              ]}
            >
              {status}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => { tapLight(); triggerSync(); }}
          style={styles.syncButton}
        >
          <Text style={styles.syncButtonText}>Sync Now</Text>
        </TouchableOpacity>
      </SettingsSection>

      {/* Export / Import */}
      <SettingsSection title="EXPORT & IMPORT">
        <TouchableOpacity onPress={handleExport} style={styles.actionRow}>
          <Ionicons name="download-outline" size={18} color="#57534E" />
          <Text style={styles.actionLabel}>Export Data (CSV/JSON)</Text>
          <View className="flex-row items-center ml-auto">
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#A8A29E" />
          </View>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity onPress={handleImport} style={styles.actionRow}>
          <Ionicons name="cloud-upload-outline" size={18} color="#57534E" />
          <Text style={styles.actionLabel}>Import CSV</Text>
          <View className="flex-row items-center ml-auto">
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#A8A29E" />
          </View>
        </TouchableOpacity>
      </SettingsSection>

    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#57534E",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  syncButton: {
    backgroundColor: "rgba(26,158,158,0.08)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  syncButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#1A9E9E",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 10,
  },
  actionLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#57534E",
  },
  comingSoonBadge: {
    backgroundColor: "#F5F5F4",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
  },
  comingSoonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: "#A8A29E",
  },
  divider: {
    height: 1,
    backgroundColor: "#F5F5F4",
  },
});
