"use client";

import { useQuery } from "@tanstack/react-query";
import type { AuditEvent } from "./audit-fixtures";
import { DEMO_AUDIT_EVENTS } from "./audit-fixtures";

export type AuditEventsQuery = {
  events: AuditEvent[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

export function useAuditEvents(): AuditEventsQuery {
  const query = useQuery<AuditEvent[]>({
    queryKey: ["audit-events"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      return [...DEMO_AUDIT_EVENTS].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      );
    },
    staleTime: 60_000,
  });

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}
