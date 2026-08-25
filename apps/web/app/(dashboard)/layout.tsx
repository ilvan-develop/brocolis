import type { ReactNode } from "react";
import { QueryProviders } from "@/components/providers";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <QueryProviders>{children}</QueryProviders>;
}
