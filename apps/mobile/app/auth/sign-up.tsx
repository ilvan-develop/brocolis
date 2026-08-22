import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/t";
import { useAuth } from "@/providers/auth-provider";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirm) {
      setError(t("auth.error.required"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.error.passwordShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.error.passwordMismatch"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signUp(name, email, password, "AO");
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-1 justify-center gap-6 p-6"
      >
        <View className="items-center gap-2">
          <Text className="text-2xl font-bold text-foreground">
            {t("auth.signup.title")}
          </Text>
        </View>

        <View className="gap-4">
          <TextInput
            className="h-12 rounded-xl border border-input bg-background px-4 text-base text-foreground"
            placeholder={t("auth.signup.name")}
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            className="h-12 rounded-xl border border-input bg-background px-4 text-base text-foreground"
            placeholder={t("auth.signup.email")}
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            className="h-12 rounded-xl border border-input bg-background px-4 text-base text-foreground"
            placeholder={t("auth.signup.password")}
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            className="h-12 rounded-xl border border-input bg-background px-4 text-base text-foreground"
            placeholder={t("auth.signup.confirm")}
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
        </View>

        {error && (
          <Text className="text-center text-sm text-destructive">{error}</Text>
        )}

        <Button
          label={loading ? "..." : t("auth.signup.submit")}
          onPress={handleSubmit}
          disabled={loading}
        />

        <View className="flex-row items-center justify-center gap-1">
          <Text className="text-sm text-muted-foreground">
            {t("auth.signup.haveaccount")}
          </Text>
          <Pressable onPress={() => router.push("/auth/sign-in")}>
            <Text className="text-sm font-semibold text-primary">
              {t("auth.signup.linksignin")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
