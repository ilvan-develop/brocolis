# 13 — Análise da Concorrência (Appy Saúde) e Estratégia de Crescimento

> Aplica-se a **todas as fases**. Análise do principal concorrente no mercado angolano (Appy Saúde) com foco em **crescer e concorrer**, não em copiar. Separa as lições que entram no **MVP v1** das que ficam no **backlog pós-MVP**. Atualizar sempre que o mercado mudar.

---

## 1. Perfil do concorrente — Appy Saúde (Appy People, Lda)

| Aspecto | Dado |
|---------|------|
| Posicionamento | Marketplace de saúde e bem-estar, "maior rede de farmácias de Angola" |
| Produto | App mobile (Android/iOS) + storefront web (Next.js SPA) |
| Fundação | 2017 (iOS), Pedro Beirão (CEO) |
| Downloads | 100k+ (Google Play); rating 3,8★ (≈401 avaliações) |
| Catálogo | 18.000+ produtos (medicamentos, cosmética, nutrição, bem-estar, bebé) |
| Estabelecimentos | 1.800+ (farmácias, hospitais, clínicas) |
| Entrega | Em todo o país; **logística centralizada** ("a Appy trata das entregas") |
| Pagamentos | **AppyPay** (gateway próprio: débito directo, GPO, mobile money Unitel, referências) |
| Seguros | Integração com **Unisaúde** (filtro "Seguradora" + fluxo de utente segurado) |
| Lealdade | Cashback em compras + descontos exclusivos |
| Suporte | Chat online + WhatsApp |
| i18n | pt / en |
| Prémios | AppsAfrica 2019 · ITU/VDW 2020 · JICA Top 10 2021 · MTN 2022 · CNN 2025 |
| Cobertura media | CNN (2025), ANGOTIC (2025/2026) |

### Modelo de negócio observado

- **B2C** multi-farmácia: mesmo produto com preço/disponibilidade por farmácia (valida o nosso modelo GlobalProduct → MarketOffer).
- **Onboarding parceiro assistido**: formulário → validação → integração → vender (até 10 dias). Portal de parceiros com dashboard de vendas/stock.
- **Logística centralizada**: a plataforma gere a entrega; o parceiro só disponibiliza produto.
- **Vertical integrado**: AppyPay no grupo controla o money movement.

---

## 2. Fraquezas do concorrente (oportunidades)

| Fraqueza | Evidência | Oportunidade Brócolis |
|----------|-----------|------------------------|
| Auth/login frágil | Reviews: "bad request", OTP que não chega | Better Auth + contract-first + E2E de auth; OTP redundante (email+WhatsApp) |
| Performance fraca | "Muitos loadings", "parece site convertido em apk" | NFRs: P95 < 300ms, offline-first, Lighthouse ≥ 90 |
| Mapas em webview | "mapa baseado em webview, credenciais erradas" | Mapas nativos (expo-maps/Leaflet) com fallback offline |
| Zona de entrega só no fim | Review top: não sabe se entrega na zona antes do checkout | RF-24 (filtro zona) + RF-33 (zona de serviço) → **zona antes do checkout** no MVP |
| Só B2C | Sem procurement B2B, sem receitas digitais | B2B (v1.5), e-prescription (v2), B2B2C (v2) |
| Só Angola | Sem multi-market | `Market` abstraction + Country Packs (MZ, KE, NG) |
| Logística central cara | Modelo próprio é pesado | Logística descentralizada por farmácia (MVP) — mais leve e escalável |
| Onboarding assistido lento | 10 dias para começar a vender | Wizard self-service 10 passos + aprovação 1-3 dias (MVP) |

---

## 3. Análise SWOT do Brócolis

| | Favorável | Desfavorável |
|---|---|---|
| **Interno** | Contracts-first, Market abstraction, Design System AI-ready, pipeline evidence-based, FinPay (processadora nativa) | Sem produto vivo; sem marca; time pequeno; FinPay depende de F4 dela |
| **Externo** | Mercado angolano carente de B2B digital; e-prescription vazio; multi-market africano aberto | Appy com 8+ anos, 100k downloads, marca e prémios; custo de captação |

### Estratégia resultante

1. **Não competir de frente no B2C genérico.** Entrar com MVP B2C sólido (web+PWA, rápido, confiável) + diferenciação por **qualidade técnica** (Appy é fraca em auth/perf).
2. **Abrir onde a Appy não está:** procurement B2B (v1.5), receitas digitais (v2), B2B2C (v2), multi-market (v2.x).
3. **Logística descentralizada** como vantagem estrutural vs centralizada da Appy.
4. **FinPay em vez de AppyPay**: independência de gateway; o contrato/adapter protege de lock-in.

---

## 4. Lições a aplicar no MVP v1

| Lição | Onde entra |
|-------|------------|
| Auth contract-first + E2E (login "bad request") | F1, 06-TESTES, 10 |
| OTP redundante (email + WhatsApp) | 05 RF-01/03, 03 §22 |
| Mapas nativos, não webview | F2/F3, 03 §15 |
| Zona de entrega antes do checkout | RF-24 + RF-33 (já no blueprint; reforçar) |
| Performance/offline como vantagem | NFRs + 03 §24 |

## 5. Backlog pós-MVP (v1.5 / v2 / v2.x)

| Item | Release | Dependência |
|------|---------|-------------|
| Procurement B2B (Supplier + Business) | v1.5 | F4 |
| Mobile (Expo) | v2 | F5 |
| B2B2C + Receitas digitais | v2 | F6 |
| Seguros (Unisaúde etc.) | v2.x | F6 + rede credenciada |
| Cashback / loyalty | v2.x | F2+ (earn) → F3 (resgate) |

> **Regra:** nenhum item deste backlog pode atrasar o MVP v1. O MVP v1 é F0→F-EX→F-DS→F1→F2→F3.

---

## 6. KPIs de mercado (benchmark)

| Métrica | Appy Saúde | Meta Brócolis MVP v1 |
|---------|-----------|----------------------|
| Download app | 100k+ | — (web-first) |
| Produtos catálogo | 18.000+ | 5.000+ no Market AO |
| Estabelecimentos | 1.800+ | 100+ farmácias verificadas |
| Rating app | 3,8★ | ≥ 4,2★ (qualidade técnica) |
| Onboarding parceiro | até 10 dias | 1-3 dias |

---

*Atualizar este documento quando houver novos dados de mercado, novos concorrentes ou mudanças na Appy.*
