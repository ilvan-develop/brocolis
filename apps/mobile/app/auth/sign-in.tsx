import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/t";
import { useAuth } from "@/providers/auth-provider";

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError(t("auth.error.required"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signIn(email, password);
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
            {t("auth.signin.title")}
          </Text>
        </View>

        <View className="gap-4">
          <TextInput
            className="h-12 rounded-xl border border-input bg-background px-4 text-base text-foreground"
            placeholder={t("auth.signin.email")}
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            className="h-12 rounded-xl border border-input bg-background px-4 text-base text-foreground"
            placeholder={t("auth.signin.password")}
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        {error && (
          <Text className="text-center text-sm text-destructive">{error}</Text>
        )}

        <Button
          label={loading ? "..." : t("auth.signin.submit")}
          onPress={handleSubmit}
          disabled={loading}
        />

        <View className="items-center gap-3">
          <Pressable onPress={() => router.push("/auth/forgot")}>
            <Text className="text-sm text-primary">
              {t("auth.signin.forgot")}
            </Text>
          </Pressable>
          <View className="flex-row items-center gap-1">
            <Text className="text-sm text-muted-foreground">
              {t("auth.signin.noaccount")}
            </Text>
            <Pressable onPress={() => router.push("/auth/sign-up")}>
              <Text className="text-sm font-semibold text-primary">
                {t("auth.signin.linksignup")}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
