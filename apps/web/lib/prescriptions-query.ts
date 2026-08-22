"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PharmacyPrescription } from "./pharmacy-prescriptions";
import {
  DEMO_PHARMACY_PRESCRIPTIONS,
  prescriptionCounts,
  respondToPrescription,
  totalPending,
} from "./pharmacy-prescriptions";

export type PrescriptionsQuery = {
  prescriptions: PharmacyPrescription[];
  counts: ReturnType<typeof prescriptionCounts>;
  totalPending: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  respond: (id: string, action: "APPROVED" | "REJECTED", notes: string | null) => void;
};

export function usePrescriptions(): PrescriptionsQuery {
  const queryClient = useQueryClient();

  const query = useQuery<PharmacyPrescription[]>({
    queryKey: ["dashboard-prescriptions"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      return [...DEMO_PHARMACY_PRESCRIPTIONS].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    },
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: async (input: {
      id: string;
      action: "APPROVED" | "REJECTED";
      notes: string | null;
    }) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return input;
    },
    onSuccess: (input) => {
      queryClient.setQueryData<PharmacyPrescription[]>(
        ["dashboard-prescriptions"],
        (previous) => {
          if (!previous) return previous;
          return previous.map((prescription) =>
            prescription.id === input.id
              ? respondToPrescription(prescription, input.action, input.notes)
              : prescription,
          );
        },
      );
    },
  });

  const prescriptions = query.data ?? [];
  const counts = prescriptionCounts(prescriptions);
  const pending = totalPending(counts);

  return {
    prescriptions,
    counts,
    totalPending: pending,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
    respond: (id, action, notes) => {
      mutation.mutate({ id, action, notes });
    },
  };
}
