"use client";

import { useQuery } from "@tanstack/react-query";
import {
  demoBreachedTimeline,
  demoCompletedTimeline,
  demoInFlightTimeline,
} from "./network-fixtures";
import type { NetworkStage } from "./network-timeline";

export type NetworkTimelineQuery = {
  stages: NetworkStage[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

export function useNetworkTimeline(): NetworkTimelineQuery {
  const query = useQuery<NetworkStage[]>({
    queryKey: ["network-timeline"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const now = new Date("2026-08-20T12:00:00Z");
      const timelines = [
        demoCompletedTimeline(now),
        demoInFlightTimeline(now),
        demoBreachedTimeline(now),
      ];
      return timelines[Math.floor(Math.random() * timelines.length)] ?? [];
    },
    staleTime: 60_000,
  });

  return {
    stages: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}
