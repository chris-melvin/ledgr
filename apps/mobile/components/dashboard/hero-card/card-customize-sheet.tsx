import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import {
  THEME_PRESETS,
  PRO_THEMES,
  isProFeature,
  type CardTheme,
  type CardPreferences,
} from "@repo/shared/card-theme";
import { useSettingsContext } from "@/components/providers/settings-provider";

interface CardCustomizeSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function CardCustomizeSheet({ visible, onClose }: CardCustomizeSheetProps) {
  const { settings, updateSetting, isPro } = useSettingsContext();

  let cardPrefs: CardPreferences = {};
  try {
    cardPrefs = JSON.parse(settings.card_preferences || "{}");
  } catch {
    // ignore parse errors
  }

  const currentTheme = cardPrefs.theme ?? "auto";

  const handleThemeSelect = async (theme: CardTheme) => {
    if (!isPro && isProFeature("theme", theme)) return;
    const updated = { ...cardPrefs, theme };
    await updateSetting("card_preferences", JSON.stringify(updated));
  };

  const allThemes: { key: string; theme: CardTheme }[] = [
    { key: "auto", theme: "auto" },
    ...Object.keys(THEME_PRESETS).map((key) => ({
      key,
      theme: key as CardTheme,
    })),
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
      <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-lg">
        <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-6" />
        <Text className="text-lg font-semibold mb-4">Customize Card</Text>

        <Text className="text-xs text-gray-400 uppercase tracking-wider mb-3">
          Theme
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6"
        >
          {/* Auto (status-based) */}
          <TouchableOpacity
            onPress={() => handleThemeSelect("auto")}
            className={`mr-3 items-center ${currentTheme === "auto" ? "opacity-100" : "opacity-60"}`}
          >
            <View
              className={`w-12 h-12 rounded-full border-2 bg-gray-100 ${
                currentTheme === "auto" ? "border-emerald-500" : "border-gray-200"
              }`}
            />
            <Text className="text-[10px] text-gray-500 mt-1">Auto</Text>
          </TouchableOpacity>

          {allThemes
            .filter((t) => t.key !== "auto")
            .map(({ key, theme }) => {
              const preset = THEME_PRESETS[theme as Exclude<CardTheme, "auto">];
              const isLocked = !isPro && PRO_THEMES.includes(theme);
              const isSelected = currentTheme === theme;

              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleThemeSelect(theme)}
                  className={`mr-3 items-center ${isSelected ? "opacity-100" : "opacity-60"}`}
                >
                  <View
                    className={`w-12 h-12 rounded-full border-2 ${
                      isSelected ? "border-emerald-500" : "border-gray-200"
                    }`}
                    style={{ backgroundColor: preset?.swatch }}
                  >
                    {isLocked && (
                      <View className="absolute inset-0 items-center justify-center">
                        <Text className="text-[10px]">🔒</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-[10px] text-gray-500 mt-1">
                    {preset?.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </ScrollView>

        <TouchableOpacity
          onPress={onClose}
          className="bg-gray-100 rounded-xl py-3 items-center"
        >
          <Text className="text-gray-600 font-medium">Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
