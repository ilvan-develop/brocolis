import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "@/lib/t";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/providers/auth-provider";

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
        <Text className="text-xl font-bold text-foreground">
          {t("nav.signin").replace("Entrar", "Perfil")}
        </Text>

        {session && (
          <View className="gap-4 rounded-xl border border-border bg-card p-4">
            <View className="gap-1">
              <Text className="text-lg font-semibold text-foreground">
                {session.marketCode}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Portal: {session.portal}
              </Text>
            </View>
          </View>
        )}

        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">
            Aparência
          </Text>
          <View className="flex-row gap-2">
            {(["light", "dark", "system"] as const).map((option) => (
              <Pressable
                key={option}
                className={`flex-1 items-center rounded-xl border py-3 ${
                  theme === option
                    ? "border-primary bg-primary/10"
                    : "border-border"
                }`}
                onPress={() => setTheme(option)}
              >
                <Text
                  className={`text-sm font-medium ${
                    theme === option ? "text-primary" : "text-foreground"
                  }`}
                >
                  {option === "light"
                    ? "Claro"
                    : option === "dark"
                      ? "Escuro"
                      : "Sistema"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {!session && (
          <Pressable
            className="items-center rounded-xl border border-primary bg-primary/10 py-4"
            onPress={() => router.push("/auth/sign-in")}
          >
            <Text className="text-sm font-semibold text-primary">
              {t("nav.signin")}
            </Text>
          </Pressable>
        )}

        {session && (
          <Pressable
            className="items-center rounded-xl border border-destructive bg-destructive/10 py-4"
            onPress={() => signOut()}
          >
            <Text className="text-sm font-semibold text-destructive">
              {t("common.signout")}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
