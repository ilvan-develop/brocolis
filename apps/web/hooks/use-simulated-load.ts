"use client";

import { useEffect, useState } from "react";

export function useSimulatedLoad(delayMs = 450): boolean {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return loading;
}
