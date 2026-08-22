import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { type ReactNode, useEffect, useState } from "react";
import { AppState } from "react-native";
import { createQueryClient, queryPersister } from "@/lib/query-client";
import { syncQueuedOrders } from "@/lib/order-queue";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    // Não há dependência de expo-network/NetInfo neste scaffold; usamos o
    // regresso da app ao primeiro plano como sinal prático de "pode haver
    // rede outra vez" para tentar sincronizar a fila de pedidos offline.
    void syncQueuedOrders();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void syncQueuedOrders();
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PersistQueryClientProvider>
  );
}
