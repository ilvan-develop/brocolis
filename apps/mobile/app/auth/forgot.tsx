import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/t";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    setSent(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-1 justify-center gap-6 p-6"
      >
        <View className="items-center gap-2">
          <Text className="text-2xl font-bold text-foreground">
            {t("auth.forgot.title")}
          </Text>
          <Text className="text-center text-sm text-muted-foreground">
            {t("auth.forgot.description")}
          </Text>
        </View>

        {!sent ? (
          <View className="gap-4">
            <TextInput
              className="h-12 rounded-xl border border-input bg-background px-4 text-base text-foreground"
              placeholder={t("auth.signin.email")}
              placeholderTextColor="hsl(var(--muted-foreground))"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              label={t("auth.forgot.submit")}
              onPress={handleSubmit}
              disabled={!email}
            />
          </View>
        ) : (
          <View className="items-center gap-4">
            <Text className="text-center text-sm text-primary">
              {t("auth.forgot.sent")}
            </Text>
            <Button
              label={t("auth.signup.linksignin")}
              variant="outline"
              onPress={() => router.push("/auth/sign-in")}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
