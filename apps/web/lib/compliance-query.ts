"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  ComplianceDecision,
  CompliancePolicy,
  SaFTExport,
} from "./compliance-fixtures";
import {
  DEMO_COMPLIANCE_DECISIONS,
  DEMO_COMPLIANCE_POLICY,
  DEMO_SAFT_EXPORTS,
} from "./compliance-fixtures";

export type ComplianceDashboardData = {
  policy: CompliancePolicy;
  decisions: readonly ComplianceDecision[];
  saftExports: readonly SaFTExport[];
};

export function useComplianceDashboard() {
  return useQuery<ComplianceDashboardData>({
    queryKey: ["compliance-dashboard"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        policy: DEMO_COMPLIANCE_POLICY,
        decisions: DEMO_COMPLIANCE_DECISIONS,
        saftExports: DEMO_SAFT_EXPORTS,
      };
    },
    staleTime: 60_000,
  });
}
