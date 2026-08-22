import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { type ReactNode, useState } from "react";
import { createQueryClient, queryPersister } from "@/lib/query-client";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PersistQueryClientProvider>
  );
}
