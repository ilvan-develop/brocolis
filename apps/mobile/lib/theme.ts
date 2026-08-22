import * as SystemUI from "expo-system-ui";
import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

type Theme = "light" | "dark" | "system";

export function useTheme() {
  const systemScheme = useRNColorScheme();
  const [userTheme, setUserTheme] = useState<Theme>("system");

  const resolved: "light" | "dark" =
    userTheme === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : userTheme;

  useEffect(() => {
    const bg = resolved === "dark" ? "#0f172a" : "#ffffff";
    SystemUI.setBackgroundColorAsync(bg).catch(() => {});
  }, [resolved]);

  return {
    theme: userTheme,
    resolved,
    isDark: resolved === "dark",
    setTheme: setUserTheme,
  };
}
