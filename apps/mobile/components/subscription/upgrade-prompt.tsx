import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/theme-context";

interface UpgradePromptProps {
  visible: boolean;
  feature: string;
  onClose: () => void;
}

export function UpgradePrompt({ visible, feature, onClose }: UpgradePromptProps) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View style={[promptStyles.card, { backgroundColor: colors.background, shadowColor: colors.textPrimary }]}>
          <View style={promptStyles.iconCircle}>
            <Ionicons name="star" size={24} color="#1A9E9E" />
          </View>

          <Text style={[promptStyles.title, { color: colors.textPrimary }]}>
            Unlock {feature}
          </Text>
          <Text style={[promptStyles.description, { color: colors.textSecondary }]}>
            Upgrade to Pro to access {feature.toLowerCase()} and all premium features.
          </Text>

          <TouchableOpacity onPress={onClose} style={promptStyles.laterButton}>
            <Text style={[promptStyles.laterText, { color: colors.textTertiary }]}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const promptStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FDFBF7",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(26,158,158,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    color: "#1C1917",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#78716C",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  laterButton: {
    paddingVertical: 8,
    alignItems: "center",
  },
  laterText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#A8A29E",
  },
});
