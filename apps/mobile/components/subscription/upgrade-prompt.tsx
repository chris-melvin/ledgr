import { View, Text, TouchableOpacity, Modal } from "react-native";

interface UpgradePromptProps {
  visible: boolean;
  feature: string;
  onClose: () => void;
}

export function UpgradePrompt({ visible, feature, onClose }: UpgradePromptProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
          <Text className="text-lg font-bold text-center mb-2">
            Unlock {feature}
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Upgrade to Pro to access {feature.toLowerCase()} and all premium features.
          </Text>

          <TouchableOpacity
            className="bg-emerald-500 rounded-xl py-3.5 items-center mb-3"
            onPress={() => {
              // TODO: Integrate RevenueCat paywall
              onClose();
            }}
          >
            <Text className="text-white font-semibold">Upgrade to Pro</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            className="py-2 items-center"
          >
            <Text className="text-gray-400 text-sm">Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
