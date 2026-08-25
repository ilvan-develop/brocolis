"use client";

import { Button } from "@brocolis/ui/components/button";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h2 className="text-2xl font-semibold tracking-tight">Erro na loja</h2>
      <p className="text-muted-foreground max-w-md text-sm">
        {error.message || "Ocorreu um erro inesperado. Tente novamente."}
      </p>
      <Button onClick={() => reset()}>Tentar novamente</Button>
    </div>
  );
}
