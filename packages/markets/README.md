# @brocolis/markets

Country Packs — **Build Global. Configure Local.**

Cada mercado é um `Market` empacotado (country + region + language + currency +
regulation + payments + logistics). O Core **nunca** conhece detalhes de um país;
nunca usar `if (marketCode === "AO")` fora daqui.

- `ao/` — Market de referência (Angola), completo.
- `mz/`, `ke/`, `ng/` — seguem o mesmo contrato, por fase pós-MVP.