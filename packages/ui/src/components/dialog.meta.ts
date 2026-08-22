export const meta = {
  category: "organism" as const,
  models: ["b2c", "b2b", "b2b2c"] as const,
  purpose:
    "Overlay modal para acções focadas (confirmar pedido, detalle de pagamento, receita) com focus trap.",
  variants: ["default"],
  props: {
    open: "controla o estado (uncontrolled por defeito)",
    onOpenChange: "(open: boolean) => void",
    content: "ReactNode — conteúdo do diálogo",
  },
  relationships: ["checkout", "payment", "prescription", "confirmation-dialog"],
  tokens: {
    overlay: "oklch(0 0 0 / 0.5)",
    background: "color.surface.background",
  },
  antiPatterns: [
    "usar Dialog para navegação entre páginas",
    "mais de um dialog aberto em simultâneo",
    "remover a label do botão fechar",
  ],
  accessibility: {
    keyboard: "Escape fecha; Tab preso no focus trap",
    focus: "foco movido para o dialog ao abrir e restaurado ao fechar",
    semantics: "role=dialog + aria-labelledby (DialogTitle) + aria-describedby",
  },
} as const;
