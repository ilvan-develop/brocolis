import { QueryClient } from "@tanstack/react-query";
import { ExpoSecureStoreAdapter } from "./offline";

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 24 * 60 * 60 * 1000;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        retry: 2,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

export const queryPersister = new ExpoSecureStoreAdapter({
  key: "brocolis_query_cache",
  maxAge: GC_TIME,
});
