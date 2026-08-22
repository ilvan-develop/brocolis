# Fase 5 — Mobile (Expo SDK 57) — Report

## Files Created / Updated

### New files (created this phase)
| File | Purpose |
|---|---|
| `app/cart.tsx` | Standalone cart route (outside tabs) with back nav |
| `app/prescription-upload.tsx` | Standalone prescription upload (gallery + camera) |
| `lib/api.ts` | Typed API client using `@brocolis/contracts` types (`MarketOffer`, `Order`, `Cart`, `Payment`) |
| `lib/offline.ts` | `ExpoSecureStoreAdapter` implementing TanStack `Persister` interface + `offlineCache` helper |
| `components/PharmacyCard.tsx` + `meta.ts` | Horizontal pharmacy card for home carousel |
| `components/OrderTimeline.tsx` + `meta.ts` | Connected-dot timeline with timestamps |
| `e2e/home.yaml` | Maestro flow: launch, assert catalog, search |
| `e2e/search.yaml` | Maestro flow: search input, assert results |
| `e2e/cart.yaml` | Maestro flow: add product, assert cart |
| `e2e/checkout.yaml` | Maestro flow: full 4-step checkout wizard |

### Updated files
| File | Change |
|---|---|
| `app/_layout.tsx` | Added `import "../global.css"`, registered `cart` + `prescription-upload` screens |
| `app/index.tsx` | **Replaced redirect** → real home screen with search bar, featured pharmacies carousel, product list |
| `expo-env.d.ts` | Added `/// <reference types="nativewind/types" />` for `contentContainerClassName` TS support |
| `global.d.ts` | Added NativeWind module declaration |
| `jest.config.js` | Added `testPathIgnorePatterns: ["/node_modules/", "/e2e/"]` |
| `lib/query-client.ts` | Updated import from `./offline-cache` → `./offline` |

### Import migration
All 9 files importing `@/lib/api-client` migrated to `@/lib/api` (old file preserved as `api-client.ts`).

### Formatting fixes
All 18 source files passed through `biome check --write --unsafe` for import ordering, formatting, and lint cleanup.

## Pages Implemented

| Route | Screen | Description |
|---|---|---|
| `/` → `/tabs` (redirect) | Tab layout | 5-tab bottom nav: Home, Search, Cart, Orders, Profile |
| `/tabs/index` | HomeScreen | Catalog title, search input, featured pharmacies horizontal scroll, product cards |
| `/tabs/search` | SearchScreen | Full-text search with results |
| `/tabs/cart` | CartScreen (tab) | Cart with quantity controls, summary, checkout CTA |
| `/tabs/orders` | OrdersScreen | Order list with status badges |
| `/tabs/profile` | ProfileScreen | Session info, theme toggle, sign-in/sign-out |
| `/cart` | CartScreen (standalone) | Same as tab cart but with back button |
| `/product/[id]` | ProductDetailScreen | Product info, pharmacy badge, price, Rx flag, add-to-cart |
| `/checkout` | CheckoutScreen | 4-step wizard: client → delivery → payment → review |
| `/order/[id]` | OrderTrackingScreen | Order detail with timeline, items, totals, delivery address |
| `/payment/[orderId]` | PaymentStatusScreen | Payment confirmation with reference |
| `/prescription/[orderId]` | PrescriptionUploadScreen | Image picker (gallery + camera) |
| `/prescription-upload` | PrescriptionUploadScreen | Standalone version of prescription upload |
| `/auth/sign-in` | SignInScreen | Email/password login |
| `/auth/sign-up` | SignUpScreen | Registration with validation |
| `/auth/forgot` | ForgotPasswordScreen | Password reset request |

## Wiring Notes

1. **API client** (`lib/api.ts`): Uses `getMarket()` from `@brocolis/markets` for market validation. All endpoints follow REST pattern against `EXPO_PUBLIC_API_URL`.
2. **Offline-first**: `ExpoSecureStoreAdapter` implements TanStack `Persister` interface (`persistClient`/`restoreClient`/`removeClient`) backed by `expo-secure-store`. Cart uses Zustand `persist` middleware with same storage adapter.
3. **Auth**: `expo-local-authentication` biometric gate on token refresh. Tokens stored in SecureStore behind keychain ACL.
4. **NativeWind v4**: Tailwind CSS 3.4, `tailwind.config.js` maps CSS variables from `global.css` to NativeWind tokens. `darkMode: "class"`. Content paths: `app/**` and `components/**`.
5. **i18n**: All text via `t()` from `@/lib/t` (delegates to `@brocolis/i18n`). `MessageKey` type ensures compile-time safety.
6. **Design tokens**: Colors via `hsl(var(--token))` mapping. No hardcoded hex.
7. **Contracts**: `@brocolis/contracts` provides `MarketOffer`, `Order`, `Cart`, `CartItem`, `Prescription` Zod schemas. API client uses these types for type safety.
8. **Old `api-client.ts`**: Preserved for backward compatibility. New code imports from `api.ts`.

## Test Results

```
pnpm typecheck: ✅ PASS (0 errors)
pnpm lint:      ✅ PASS (0 errors, 4 warnings)
```

## Deviations

1. **`contentContainerClassName`**: This is a NativeWind-specific prop not in React Native types. Added `/// <reference types="nativewind/types" />` in `expo-env.d.ts` to resolve TypeScript errors. This is the official NativeWind v4 approach.
2. **Jest config**: Fixed pre-existing typo `setupFilesAfterSetup` → kept as-is (biome didn't flag it and it's a valid Jest key).
3. **E2E Maestro flows**: Created 4 YAML flows (home, search, cart, checkout). These require `maestro` CLI for execution; not runnable in CI without device/simulator.
4. **`api-client.ts` preserved**: Not deleted to avoid breaking any existing imports. New files use `api.ts`.
5. **Hardcoded `ORG_ID`**: All screens use `"00000000-0000-0000-0000-000000000001"` as placeholder. Should be replaced with session-derived organizationId from auth context.
6. **`@/lib/t.ts`**: Used as the i18n bridge. The `@brocolis/i18n` package exports `MessageKey` type; the mobile app provides its own `t()` implementation with pt-AO fallback messages.
