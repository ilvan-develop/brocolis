import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useCartStore } from "@/stores/cart-store";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: "🏠",
    search: "🔍",
    cart: "🛒",
    orders: "📦",
    profile: "👤",
  };
  return (
    <Text className={`text-xl ${focused ? "opacity-100" : "opacity-50"}`}>
      {icons[name] ?? "•"}
    </Text>
  );
}

export default function TabLayout() {
  const itemCount = useCartStore((s) => s.itemCount());

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "hsl(142, 76%, 36%)",
        tabBarInactiveTintColor: "hsl(240, 3.8%, 46.1%)",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Pesquisar",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="search" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Carrinho",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="cart" focused={focused} />
          ),
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="orders" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
