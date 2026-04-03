import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { SettingsSection } from "./settings-section";

export function BudgetSettings() {
  const { settings, updateSetting } = useSettingsContext();
  const currency = settings.currency === "PHP" ? "\u20B1" : settings.currency;
  const dailyLimit = settings.calculated_daily_limit ?? settings.default_daily_limit;

  const [incomeText, setIncomeText] = useState(
    String(settings.total_monthly_income ?? "")
  );
  const [fixedText, setFixedText] = useState(
    String(settings.total_fixed_expenses ?? "")
  );

  const handleIncomeBlur = () => {
    const num = parseFloat(incomeText);
    if (!isNaN(num) && num > 0) {
      updateSetting("total_monthly_income", num);
    }
  };

  const handleFixedBlur = () => {
    const num = parseFloat(fixedText);
    if (!isNaN(num) && num >= 0) {
      updateSetting("total_fixed_expenses", num);
    }
  };

  return (
    <>
      <SettingsSection title="INCOME">
        <View style={styles.inputRow}>
          <Text style={styles.label}>Monthly Income</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencyPrefix}>{currency}</Text>
            <TextInput
              style={styles.input}
              value={incomeText}
              onChangeText={setIncomeText}
              onBlur={handleIncomeBlur}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#D6D3D1"
            />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.inputRow}>
          <Text style={styles.label}>Fixed Expenses</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencyPrefix}>{currency}</Text>
            <TextInput
              style={styles.input}
              value={fixedText}
              onChangeText={setFixedText}
              onBlur={handleFixedBlur}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#D6D3D1"
            />
          </View>
        </View>
      </SettingsSection>

      <SettingsSection title="DAILY LIMIT">
        <View style={styles.limitCard}>
          <Text style={styles.limitLabel}>Calculated Daily Limit</Text>
          <Text style={styles.limitValue}>
            {currency}{dailyLimit.toLocaleString()}
          </Text>
          <Text style={styles.limitDescription}>
            Based on your income and fixed expenses
          </Text>
        </View>
      </SettingsSection>
    </>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#57534E",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  currencyPrefix: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#A8A29E",
    marginRight: 4,
  },
  input: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#292524",
    fontVariant: ["tabular-nums"],
    minWidth: 80,
    textAlign: "right",
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: "#F5F5F4",
  },
  limitCard: {
    alignItems: "center",
    paddingVertical: 8,
  },
  limitLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#A8A29E",
  },
  limitValue: {
    fontFamily: "Lora_700Bold",
    fontSize: 32,
    color: "#1A9E9E",
    fontVariant: ["tabular-nums"],
    marginVertical: 4,
  },
  limitDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#A8A29E",
  },
});
