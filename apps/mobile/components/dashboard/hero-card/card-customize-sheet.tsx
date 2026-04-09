import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, StyleSheet, Switch } from "react-native";
import { useTheme } from "@/lib/theme/theme-context";
import {
  THEME_PRESETS,
  type CardTheme,
  type CardPreferences,
  type BackgroundStyle,
  type CardMaterial,
} from "@repo/shared/card-theme";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { selection } from "@/lib/haptics";

interface CardCustomizeSheetProps {
  visible: boolean;
  onClose: () => void;
}

const BACKGROUND_OPTIONS: { key: BackgroundStyle; label: string }[] = [
  { key: "static", label: "Gradient" },
  { key: "mesh", label: "Layered" },
  { key: "grain", label: "Soft" },
];

const MATERIAL_OPTIONS: { key: CardMaterial; label: string }[] = [
  { key: "default", label: "Default" },
  { key: "glass", label: "Glass" },
  { key: "metallic", label: "Metal" },
  { key: "holo", label: "Holo" },
];

export function CardCustomizeSheet({ visible, onClose }: CardCustomizeSheetProps) {
  const { settings, updateSetting } = useSettingsContext();
  const { colors } = useTheme();

  let cardPrefs: CardPreferences = {};
  try {
    cardPrefs = JSON.parse(settings.card_preferences || "{}");
  } catch {
    // ignore parse errors
  }

  const currentTheme = cardPrefs.theme ?? "auto";
  const currentBg = cardPrefs.backgroundStyle ?? "static";
  const currentMaterial = cardPrefs.material ?? "default";
  const [displayName, setDisplayName] = useState(cardPrefs.displayName ?? "");
  const enableTilt = cardPrefs.enableTilt !== false;
  const enableGlare = cardPrefs.enableGlare !== false;

  const updatePrefs = async (updates: Partial<CardPreferences>) => {
    const updated = { ...cardPrefs, ...updates };
    await updateSetting("card_preferences", JSON.stringify(updated));
  };

  const handleThemeSelect = (theme: CardTheme) => {
    selection();
    updatePrefs({ theme });
  };

  const handleBgSelect = (bg: BackgroundStyle) => {
    selection();
    updatePrefs({ backgroundStyle: bg });
  };

  const handleMaterialSelect = (mat: CardMaterial) => {
    selection();
    updatePrefs({ material: mat });
  };

  const handleDisplayNameBlur = () => {
    updatePrefs({ displayName: displayName.trim() });
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
      <View style={[sheetStyles.container, { backgroundColor: colors.background, shadowColor: colors.textPrimary }]}>
        <View style={[sheetStyles.handle, { backgroundColor: colors.textMuted }]} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[sheetStyles.title, { color: colors.textPrimary }]}>Customize Card</Text>

          {/* Display Name */}
          <Text style={[sheetStyles.sectionLabel, { color: colors.textTertiary }]}>DISPLAY NAME</Text>
          <TextInput
            style={[sheetStyles.nameInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
            value={displayName}
            onChangeText={setDisplayName}
            onBlur={handleDisplayNameBlur}
            placeholder="Your name (optional)"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
          />

          {/* Theme */}
          <Text style={sheetStyles.sectionLabel}>THEME</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => handleThemeSelect("auto")}
              className="mr-3 items-center"
              style={{ opacity: currentTheme === "auto" ? 1 : 0.6 }}
            >
              <View style={[sheetStyles.swatch, { backgroundColor: "#F5F5F4" }, currentTheme === "auto" && sheetStyles.swatchSelected]} />
              <Text style={sheetStyles.swatchLabel}>Auto</Text>
            </TouchableOpacity>
            {allThemes.filter((t) => t.key !== "auto").map(({ key, theme }) => {
              const preset = THEME_PRESETS[theme as Exclude<CardTheme, "auto">];
              const isSelected = currentTheme === theme;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleThemeSelect(theme)}
                  className="mr-3 items-center"
                  style={{ opacity: isSelected ? 1 : 0.6 }}
                >
                  <View style={[sheetStyles.swatch, { backgroundColor: preset?.swatch }, isSelected && sheetStyles.swatchSelected]} />
                  <Text style={sheetStyles.swatchLabel}>{preset?.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Background Style */}
          <Text style={sheetStyles.sectionLabel}>BACKGROUND</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {BACKGROUND_OPTIONS.map((opt) => {
              const isSelected = currentBg === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => handleBgSelect(opt.key)}
                  className="mr-3 items-center"
                  style={{ opacity: isSelected ? 1 : 0.6 }}
                >
                  <View style={[sheetStyles.optionPill, isSelected && sheetStyles.optionPillActive]}>
                    <Text style={[sheetStyles.optionPillText, isSelected && sheetStyles.optionPillTextActive]}>
                      {opt.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Material */}
          <Text style={sheetStyles.sectionLabel}>MATERIAL</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {MATERIAL_OPTIONS.map((opt) => {
              const isSelected = currentMaterial === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => handleMaterialSelect(opt.key)}
                  className="mr-3 items-center"
                  style={{ opacity: isSelected ? 1 : 0.6 }}
                >
                  <View style={[sheetStyles.optionPill, isSelected && sheetStyles.optionPillActive]}>
                    <Text style={[sheetStyles.optionPillText, isSelected && sheetStyles.optionPillTextActive]}>
                      {opt.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Toggles */}
          <Text style={sheetStyles.sectionLabel}>EFFECTS</Text>
          <View style={sheetStyles.toggleRow}>
            <Text style={sheetStyles.toggleLabel}>Gyroscope Tilt</Text>
            <Switch
              value={enableTilt}
              onValueChange={(v) => { selection(); updatePrefs({ enableTilt: v }); }}
              trackColor={{ false: "#E7E5E4", true: "rgba(26,158,158,0.4)" }}
              thumbColor={enableTilt ? "#1A9E9E" : "#FAFAF9"}
              ios_backgroundColor="#E7E5E4"
            />
          </View>
          <View style={sheetStyles.toggleRow}>
            <Text style={sheetStyles.toggleLabel}>Glare Effect</Text>
            <Switch
              value={enableGlare}
              onValueChange={(v) => { selection(); updatePrefs({ enableGlare: v }); }}
              trackColor={{ false: "#E7E5E4", true: "rgba(26,158,158,0.4)" }}
              thumbColor={enableGlare ? "#1A9E9E" : "#FAFAF9"}
              ios_backgroundColor="#E7E5E4"
            />
          </View>

          <TouchableOpacity onPress={onClose} style={[sheetStyles.doneButton, { backgroundColor: colors.surface }]}>
            <Text style={[sheetStyles.doneButtonText, { color: colors.textSecondary }]}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  container: {
    backgroundColor: "#FDFBF7",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: "80%",
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D6D3D1",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#1C1917",
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#A8A29E",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  nameInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#292524",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#E7E5E4",
  },
  swatchSelected: {
    borderColor: "#1A9E9E",
    borderWidth: 2.5,
  },
  swatchLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: "#78716C",
    marginTop: 4,
  },
  optionPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    backgroundColor: "#FFFFFF",
  },
  optionPillActive: {
    backgroundColor: "#1A9E9E",
    borderColor: "#1A9E9E",
  },
  optionPillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#57534E",
  },
  optionPillTextActive: {
    color: "#FFFFFF",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 4,
  },
  toggleLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#57534E",
  },
  doneButton: {
    backgroundColor: "#F5F5F4",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  doneButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#57534E",
  },
});
