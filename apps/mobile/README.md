# apps/mobile

Aplicação móvel do Brócolis, construída com **Expo** (React Native) e **Nativewind** (Tailwind CSS para React Native). Funcionalidades principais: catálogo, carrinho, checkout, prescrições e rastreio de encomendas.

## Pré-requisitos

| Ferramenta | Versão mínima | Notas |
|---|---|---|
| Node.js | >= 20 | Recomendado: 24.x |
| pnpm | >= 11 | `corepack enable` ou `npm i -g pnpm@11` |
| Expo CLI | latest | Incluído via `expo` package |
| EAS CLI | latest | `npm i -g eas-cli` (para builds de produção) |
| Android Studio | — | Para emulador Android |
| Xcode | — | Para emulador iOS (macOS apenas) |

## Setup

```powershell
# Instalar dependências (na raiz do monorepo)
pnpm install

# Instalar EAS CLI (para builds e submissão)
npm i -g eas-cli

# Login no Expo/EAS
eas login

# Arrancar o bundler Metro
pnpm dev
```

No terminal, pressiona:
- `a` → abre no emulador Android
- `i` → abre no simulador iOS (macOS)
- `w` → abre no browser (funcionalidade limitada)

## Scripts

| Comando | Descrição |
|---|---|
| `pnpm dev` | Arranca o Metro bundler (`expo start`) |
| `pnpm lint` | Lint com Biome (`biome check app`) |
| `pnpm typecheck` | Verificação de tipos (`tsc --noEmit`) |
| `pnpm test:unit` | Testes unitários (Jest + jest-expo) |
| `pnpm export` | Exporta bundle estático (`expo export`) |

### Builds EAS

```powershell
# Build de desenvolvimento
eas build --profile development

# Build de preview (staging)
eas build --profile preview

# Build de produção
eas build --profile production

# Submeter à App Store / Play Store
eas submit --platform all
```

## Variáveis de ambiente

| Variável | Default | Descrição |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:4000` | URL da API |
| `EAS_PROJECT_ID` | — | ID do projeto EAS |
| `EAS_CHANNEL` | `development` | Canal de update (`development`, `preview`, `production`) |
| `EXPO_TOKEN` | — | Token de CI (usar apenas em pipelines) |

> Em desenvolvimento no dispositivo físico, `EXPO_PUBLIC_API_URL` deve apontar para o IP da máquina (ex: `http://192.168.1.100:4000`), não `localhost`.

## Estrutura de pastas

```
app/
├── _layout.tsx              # Root layout — Stack navigator + providers
├── index.tsx                # Entrada — redirect para tabs ou auth
├── cart.tsx                 # Carrinho
├── checkout.tsx             # Checkout
├── prescription-upload.tsx  # Upload de prescrição
├── auth/
│   ├── sign-in.tsx          # Login
│   ├── sign-up.tsx          # Registo
│   └── forgot.tsx           # Recuperação de password
├── order/
│   └── [id].tsx             # Detalhe de encomenda
├── payment/
│   └── [orderId].tsx        # Pagamento
├── prescription/
│   └── [orderId].tsx        # Prescrição associada
├── product/
│   └── [id].tsx             # Detalhe de produto
└── tabs/
    ├── _layout.tsx          # Tab navigator layout
    ├── index.tsx            # Home / catálogo
    ├── search.tsx           # Pesquisa
    ├── cart.tsx             # Carrinho (tab)
    ├── orders.tsx           # Encomendas
    └── profile.tsx          # Perfil
```

```
components/
├── CartSummary.tsx           # Resumo do carrinho
├── OrderStatusTimeline.tsx   # Timeline de estado
├── OrderTimeline.tsx         # Timeline de eventos
├── PharmacyBadge.tsx         # Badge de farmácia
├── PharmacyCard.tsx          # Card de farmácia
├── ProductCard.tsx           # Card de produto
├── translation.tsx           # Componente de tradução
└── ui/                       # Componentes base (badge, button, card, input, etc.)
```

```
providers/
├── auth-provider.tsx         # Provider de autenticação
└── query-provider.tsx        # Provider TanStack Query
```

```
stores/
├── auth-store.ts             # Zustand store de auth
└── cart-store.ts             # Zustand store de carrinho
```

```
lib/
├── api.ts                    # Cliente API
├── auth.ts                   # Lógica de autenticação
├── i18n.ts                   # Internacionalização
├── offline.ts                # Lógica offline
├── order-queue.ts            # Fila de encomendas offline
├── query-client.ts           # Config QueryClient
├── t.ts                      # Helper de tradução
├── theme.ts                  # Tema Nativewind
└── utils.ts                  # Utilitários
```

## Troubleshooting

### Babel / Jest — `SyntaxError: Unexpected token`

O `jest-expo` usa `babel-jest` com `babel-preset-expo`. Se encontrares erros de parsing em ficheiros `.tsx`:

```powershell
# Limpar caches do Metro e Jest
npx expo start --clear
npx jest --clearCache
```

O `transformIgnorePatterns` no `jest.config.cjs` já está configurado para o layout `.pnpm` do pnpm. Se adicionares novas dependências que precisem de transform, adiciona-as à lista de exceções.

### `expo-secure-store` em testes

O `jest-setup.ts` inclui um mock de `expo-secure-store` com `Map` em memória. Se testes falharem com `secure_store not available`, verificar se o mock está a ser carregado (campo `setupFilesAfterEnv` no `jest.config.cjs`).

### Metro bundler não encontra packages do monorepo

O `tsconfig.json` mapeia `@brocolis/*` para `../packages/*/src`. Se o Metro não resolver:

```powershell
# Reiniciar com cache limpo
npx expo start --clear
```

### `EXPO_PUBLIC_API_URL` não atualiza

Variáveis `EXPO_PUBLIC_*` são injetadas em build time. Para mudar a URL:

1. Atualizar `.env`
2. Reiniciar o Metro: `npx expo start --clear`

### Build EAS falha com `duplicate resources`

```powershell
# Limpar node_modules e reinstalar
Remove-Item -Recurse -Force node_modules
pnpm install
```

### `passWithNoTests: true`

O `jest.config.cjs` tem `passWithNoTests: true` porque o `apps/mobile` é ainda um scaffold (F5/v2 fora do milestone MVP_V1). Sem testes próprios, o gate `test:unit` não deve reprovar. Quando adicionares testes, podes remover esta flag.

### Erro `intl-pluralrules`

O `jest-setup.ts` importa `intl-pluralrules` como polyfill. Se falhar em ambientes sem `Intl.PluralRules`, instalar:

```powershell
pnpm add -D intl-pluralrules
```
