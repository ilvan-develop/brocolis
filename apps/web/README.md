# apps/web

Frontend web do marketplace Brócolis, construído com **Next.js 16** (App Router) e **Tailwind CSS v4**. Inclui storefront B2C, dashboard de farmácia, portal B2B e módulos de compliance.

## Pré-requisitos

| Ferramenta | Versão mínima | Notas |
|---|---|---|
| Node.js | >= 20 | Recomendado: 24.x |
| pnpm | >= 11 | `corepack enable` ou `npm i -g pnpm@11` |
| API (`apps/api`) | — | A web consome a API em `http://localhost:4000` |

## Setup

```powershell
# Instalar dependências (na raiz do monorepo)
pnpm install

# Copiar variáveis de ambiente (se ainda não existir)
Copy-Item -Path "../../.env.example" -Destination "../../.env"

# Arrancar em modo desenvolvimento
pnpm dev
```

A aplicação fica disponível em `http://localhost:3000`.

## Scripts

| Comando | Descrição |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento com Turbopack (`next dev --turbopack`) |
| `pnpm build` | Build de produção (`next build`) |
| `pnpm start` | Servidor de produção (`next start`) |
| `pnpm test:unit` | Testes unitários (Vitest) |
| `pnpm lint` | Lint com Biome (`biome check app`) |
| `pnpm typecheck` | Verificação de tipos (`tsc --noEmit`) |

## Variáveis de ambiente

| Variável | Default | Descrição |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:4000` | URL da API (consumida pelo cliente Next.js) |
| `NEXT_PUBLIC_API_URL` | — | Alternativa para server-side fetch |
| `SENTRY_DSN` | — | DSN do Sentry (opcional) |
| `SENTRY_ENVIRONMENT` | `development` | Ambiente Sentry |
| `SENTRY_AUTH_TOKEN` | — | Token para upload de source maps |

> As variáveis `NEXT_PUBLIC_*` são expostas ao browser. Usar `EXPO_PUBLIC_API_URL` para compatibilidade cross-app.

## Estrutura de pastas

```
app/
├── layout.tsx                    # Root layout — ThemeProvider + SessionProvider
├── globals.css                   # Estilos globais + tokens Tailwind
├── (auth)/                       # Grupo de rotas de autenticação
│   ├── layout.tsx                # Layout com Badge + Card
│   ├── sign-in/                  # Login
│   ├── register/                 # Registo
│   ├── forgot-password/          # Recuperação de password
│   └── verify-email/             # Verificação de email
├── (dashboard)/                  # Dashboard autenticado
│   ├── layout.tsx                # Providers: QueryClient + Toaster
│   ├── audit/                    # Eventos de auditoria
│   ├── business/                 # Módulos B2B (aprovações, crédito, POs, RFQs, fornecedores)
│   ├── compliance/               # Conformidade fiscal
│   ├── network/                  # Rede de farmácias
│   ├── organizations/            # Gestão de organizações
│   ├── prescriptions/            # Prescrições
│   └── supplier/                 # Portal do fornecedor (catálogo, encomendas, cotações, RFQs)
├── (marketing)/                  # Páginas públicas
│   └── landing/                  # Landing page
├── (storefront)/                 # Loja B2C
│   ├── layout.tsx                # Layout da loja
│   ├── page.tsx                  # Página inicial da loja
│   ├── carrinho/                 # Carrinho
│   ├── checkout/                 # Checkout
│   └── producto/                 # Detalhe de produto
├── dashboard/
│   └── pharmacy/                 # Dashboard de farmácia
├── onboarding/                   # Fluxo de onboarding
└── portal/                       # Portal B2B
    ├── layout.tsx
    ├── business/                 # Purchase orders e RFQ
    ├── purchase-orders/          # Gestão de POs
    ├── rfq/                      # Request for Quotation
    └── supplier/                 # Detalhe de fornecedor
```

## Rotas principais

| Rota | Grupo | Descrição |
|---|---|---|
| `/` | `(marketing)` | Landing page |
| `/sign-in` | `(auth)` | Login |
| `/register` | `(auth)` | Registo de conta |
| `/` | `(storefront)` | Loja (após auth) |
| `/carrinho` | `(storefront)` | Carrinho de compras |
| `/checkout` | `(storefront)` | Finalizar compra |
| `/producto/[id]` | `(storefront)` | Detalhe de produto |
| `/dashboard/pharmacy` | `dashboard` | Painel da farmácia |
| `/audit` | `(dashboard)` | Auditoria |
| `/compliance` | `(dashboard)` | Conformidade |
| `/network` | `(dashboard)` | Rede de farmácias |
| `/prescriptions` | `(dashboard)` | Prescrições |
| `/business/*` | `(dashboard)` | Módulos B2B |
| `/supplier/*` | `(dashboard)` | Portal do fornecedor |
| `/portal/*` | `portal` | Portal B2B externo |
| `/onboarding` | `onboarding` | Onboarding de organização |

## Componentes partilhados

```
components/
├── auth/                 # Componentes de autenticação
├── cart/                 # Carrinho
├── checkout/             # Checkout
├── network/              # Rede de farmácias
├── orders/               # Encomendas
├── pharmacy/             # Farmácia
├── portal/               # Portal B2B
├── storefront/           # Loja
├── org-switcher.tsx      # Seletor de organização
├── session-provider.tsx  # Provider de sessão
└── theme-provider.tsx    # Provider de tema (next-themes)
```

## Hooks e libs

```
hooks/
├── use-session.ts        # Hook de sessão
└── use-simulated-load.ts # Simulação de carregamento

lib/
├── api.ts                # Cliente API (oRPC)
├── cart.ts               # Lógica de carrinho
├── catalog.ts            # Catálogo
├── checkout.ts           # Checkout
├── compliance-query.ts   # Queries de compliance
├── network-query.ts      # Queries de rede
├── onboarding.ts         # Lógica de onboarding
├── order-status.ts       # Estado de encomendas
├── payment-status.ts     # Estado de pagamentos
├── pharmacy-*.ts         # Módulos de farmácia
├── procurement.ts        # Compras B2B
├── query.ts              # QueryClient TanStack
├── routes.ts             # Definição de rotas
├── session-store.ts      # Store de sessão
├── storefront.ts         # Lógica da loja
└── validation.ts         # Validações Zod
```

## Troubleshooting

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Failed to fetch` à API | API offline ou `EXPO_PUBLIC_API_URL` errado | Verificar se `apps/api` está a correr |
| `Module not found: @brocolis/ui` | Workspace não linkado | `pnpm install` na raiz |
| Erro de Tailwind classes | `globals.css` não importado | Verificar `@import "tailwindcss"` |
| `Hydration mismatch` | Server/client state diferente | Verificar `useEffect` e `localStorage` |
| Build falha com `prisma` | `@brocolis/contracts` não compilado | `pnpm build` nos packages primeiro |
