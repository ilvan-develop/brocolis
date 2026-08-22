export const meta = {
  category: "atom" as const,
  models: ["b2c", "b2b", "b2b2c"] as const,
  purpose:
    "Captura texto (pesquisa, telefone, endereço, dados de pagamento) seguindo as regras do mercado.",
  variants: ["default"],
  props: {
    type: "text | email | tel | number | password | search",
    invalid: "aria-invalid para erros de formulário",
  },
  relationships: ["search", "forms", "cart", "checkout", "address"],
  tokens: {
    background: "components.input.bg",
    border: "components.input.border",
    focus: "components.input.focus.border",
  },
  antiPatterns: [
    "usar Input para selects ou textarea",
    "placeholder como label",
    "hardcode de cor (hex)",
  ],
  accessibility: {
    keyboard: "tab + typing",
    focus: "focus-visible ring (token --ring)",
    labels: "Label associado via htmlFor/id",
  },
} as const;
