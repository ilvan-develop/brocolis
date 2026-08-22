# Runbook — Mobile Release (EAS Build / Submit / Update)

> Fonte: `docs/tech-research/F7-LAUNCH/FACTOS.md` §2 (docs.expo.dev 2026-07/08) + blueprint 09 §Fase 7 (EAS Submit + Update canais).

## 1. Configuração base (uma vez)

```bash
cd apps/mobile
npx expo install expo-updates     # nativo — exige NOVA BUILD depois de instalar
npx eas update:configure          # cria runtimeVersion + projectId no app.json
```

`app.json` (policy recomendada):

```json
{
  "expo": {
    "runtimeVersion": { "policy": "appVersion" },
    "updates": {
      "url": "https://u.expo.dev/<project-id>"
    }
  }
}
```

- **runtimeVersion `appVersion`** (default recomendado): OTA só entrega quando a
  versão da app (`version`) coincide. Mudanças nativas ⇒ incrementar versão/build
  e publicar nova build. ("fingerprint" é o futuro, ainda não recomendado.)
- **OTA só funciona em release/preview builds** — nunca em Expo Go/debug.

## 2. Canais por perfil (`eas.json`)

| Perfil | Canal | Uso |
|---|---|---|
| `development` | development | dev client, internal distribution |
| `preview` | preview/staging | QA interna, beta |
| `production` | production | stores, auto-increment build number |

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal", "channel": "development" },
    "preview": { "distribution": "internal", "channel": "preview" },
    "production": { "autoIncrement": true, "channel": "production" }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "...", "ascAppId": "...", "appleTeamId": "..." },
      "android": { "serviceAccountKeyPath": "./pc-key.json", "track": "internal" }
    }
  }
}
```

O canal fica **embutido na build** e não muda depois; SDK 54+ permite "channel
surfing" em runtime via override API do expo-updates (≥0.29.0), com efeito após restart.

## 3. Fluxo de release

### 3.1 Build + Submit (stores)

```bash
eas build --platform all --profile production   # CI: também via workflow eas-build
eas submit --platform ios --latest
eas submit --platform android --latest
```

Android: track `internal` → teste interno → promoção para produção na Play Console.
iOS: TestFlight → revisão App Store.

### 3.2 OTA update (JS only)

```bash
# Staging primeiro, SEMPRE
eas update --channel preview --message "fix: checkout offline queue"

# Promover exactamente a mesma bundle a produção
eas update:republish --group <group-id> --destination-channel production
```

Regras:
- Nunca publicar OTA directo a produção sem passar pelo canal preview.
- Mensagem de update = PR/ticket referenciado.
- Code signing end-to-end activo (integridade do bundle).

## 4. Rollback

Ver `rollback.md` §3: `eas update:republish` do último grupo bom (instantâneo);
build nativa má ⇒ nova submissão às stores.

## 5. Sentry + source maps

Associar cada build/update a uma release Sentry (`@sentry/react-native`) com
sourcemaps upload no pipeline EAS (`SENTRY_AUTH_TOKEN` como secret EAS) — crash
reports simbolizados por versão da app.

## 6. Checklist de release mobile

- [ ] `version` incrementada se houve mudança nativa (runtimeVersion appVersion)
- [ ] Build production verde + submetida às stores
- [ ] OTA testado no canal preview antes de republish a produção
- [ ] Release Sentry criada com sourcemaps
- [ ] Notas de release nas stores actualizadas
