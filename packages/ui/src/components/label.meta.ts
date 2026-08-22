export const meta = {
  category: "atom" as const,
  models: ["b2c", "b2b", "b2b2c"] as const,
  purpose:
    "Rótulo associado a inputs de formulário (nome, telefone, endereço, dados de pagamento).",
  variants: ["default"],
  props: {
    htmlFor: "id do input associado",
    children: "texto do rótulo (via t())",
  },
  relationships: ["forms", "input", "checkbox", "radio"],
  tokens: {
    text: "color.text.primary",
  },
  antiPatterns: [
    "usar Label sem input associado",
    "texto hardcoded (usar t())",
  ],
  accessibility: {
    keyboard: "n/a",
    focus: "clicar no label foca o input associado",
    semantics: "associar sempre com htmlFor",
  },
} as const;
