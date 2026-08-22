"use client";

import * as React from "react";
import { SessionContext } from "@/components/session-provider";

export function useSession() {
  const context = React.useContext(SessionContext);
  if (context === null) {
    throw new Error("useSession deve ser usado dentro de <SessionProvider>");
  }
  return context;
}
