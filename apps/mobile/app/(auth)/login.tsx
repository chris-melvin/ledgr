import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/lib/theme/theme-context";
import { LedgrLogo } from "@/components/brand/logo";
import { supabase } from "@/lib/supabase/client";

export default function LoginScreen() {
  const { signIn, signInWithApple } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleForgotPassword = () => {
    if (Platform.OS === "ios") {
      Alert.prompt(
        "Reset Password",
        "Enter your email address and we'll send you a reset link.",
        async (inputEmail) => {
          if (!inputEmail) return;
          await supabase.auth.resetPasswordForEmail(inputEmail, {
            redirectTo: "https://ledgr.ink/reset-password",
          });
          Alert.alert(
            "Check Your Email",
            "If an account exists with that email, we've sent a password reset link."
          );
        },
        "plain-text",
        email,
        "email-address"
      );
    } else {
      // Android fallback — use the email already entered
      if (!email) {
        Alert.alert("Enter Email", "Please enter your email address first, then tap Forgot Password.");
        return;
      }
      Alert.alert(
        "Reset Password",
        `Send a password reset link to ${email}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Send",
            onPress: async () => {
              await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: "https://ledgr.ink/reset-password",
              });
              Alert.alert(
                "Check Your Email",
                "If an account exists with that email, we've sent a password reset link."
              );
            },
          },
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <View className="flex-1 justify-center px-8">
        <View style={{ alignItems: "center", marginBottom: 8 }}>
          <LedgrLogo size="lg" />
        </View>
        <Text style={[authStyles.subtitle, { color: colors.textSecondary }]}>
          Track your daily expenses
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
          style={[authStyles.input, { marginBottom: 12, backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Password"
          placeholderTextColor={colors.textTertiary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity
          onPress={handleForgotPassword}
          style={{ alignSelf: "flex-end", marginBottom: 24 }}
        >
          <Text style={authStyles.linkAction}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogin}
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
            {isLoading ? "Signing in..." : "Sign In"}
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
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
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
          <Text style={[authStyles.linkText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <Link href="/(auth)/signup">
            <Text style={authStyles.linkAction}>Sign Up</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const authStyles = StyleSheet.create({
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
});
