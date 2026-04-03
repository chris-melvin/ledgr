import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  StyleSheet,
} from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/lib/theme/theme-context";
import { LedgrLogoIcon } from "@/components/brand/logo";

export default function SignUpScreen() {
  const { signUp, signInWithApple } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password);
    setIsLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Check your email to confirm your account");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <View className="flex-1 justify-center px-8">
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <LedgrLogoIcon size="lg" />
        </View>
        <Text style={[authStyles.title, { color: colors.textPrimary }]}>Create Account</Text>
        <Text style={[authStyles.subtitle, { color: colors.textSecondary }]}>
          Start tracking your expenses
        </Text>

        <TextInput
          style={[authStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Email"
          placeholderTextColor={colors.textTertiary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TextInput
          style={[authStyles.input, { marginBottom: 24, backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Password"
          placeholderTextColor={colors.textTertiary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />

        <TouchableOpacity
          onPress={handleSignUp}
          disabled={isLoading}
          style={authStyles.ctaButton}
        >
          <LinearGradient
            colors={isLoading ? ["#5CBCBC", "#3DA8A8"] : ["#1A9E9E", "#0F6B6B"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={authStyles.ctaText}>
            {isLoading ? "Creating account..." : "Sign Up"}
          </Text>
        </TouchableOpacity>

        {Platform.OS === "ios" && (
          <>
            <View style={authStyles.dividerContainer}>
              <View style={authStyles.dividerLine} />
              <Text style={authStyles.dividerText}>Or</Text>
              <View style={authStyles.dividerLine} />
            </View>

            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={14}
              style={{ width: "100%", height: 52 }}
              onPress={async () => {
                const { error } = await signInWithApple();
                if (error && (error as any).code !== "ERR_REQUEST_CANCELED") {
                  Alert.alert("Error", error.message);
                }
              }}
            />
          </>
        )}

        <View className="flex-row justify-center mt-6">
          <Text style={[authStyles.linkText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <Link href="/(auth)/login">
            <Text style={authStyles.linkAction}>Sign In</Text>
          </Link>
        </View>

        <Text style={[authStyles.legalFooter, { color: colors.textTertiary }]}>
          By signing up, you agree to our{" "}
          <Text style={authStyles.legalLink} onPress={() => Linking.openURL("https://ledgr.ink/terms")}>
            Terms
          </Text>
          {" "}and{" "}
          <Text style={authStyles.legalLink} onPress={() => Linking.openURL("https://ledgr.ink/privacy")}>
            Privacy Policy
          </Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const authStyles = StyleSheet.create({
  title: {
    fontFamily: "Lora_700Bold",
    fontSize: 28,
    color: "#1C1917",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#78716C",
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#292524",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  ctaButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#1A9E9E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  linkText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#78716C",
  },
  linkAction: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#1A9E9E",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E7E5E4",
  },
  dividerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#A8A29E",
    paddingHorizontal: 12,
    textTransform: "uppercase",
  },
  legalFooter: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
  legalLink: {
    color: "#1A9E9E",
    fontFamily: "Inter_500Medium",
  },
});
