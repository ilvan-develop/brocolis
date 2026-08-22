# FACTOS — Bloco Mobile (F5 / F-DS mobile)

> Pesquisa oficial antes da fase mobile. Fontes: docs.expo.dev (auth, color-themes, router/color),
> nativewind.dev (dark-mode), 72technologies field guide 2026-06, github/react-native-passkeys,
> github/yeojz otplib. Auditado em 2026-08-20.

## 1. Biometria + Passkeys (F5 — login/recuperação)

### Factos
- **Biometria** (`expo-local-authentication`, já catalogado `^57.0.0`) **não autentica contra o servidor**:
  confirma "o dono do telemóvel". É um gate local sobre credenciais/token armazenados — NÃO é uma sessão.
  - Padrão recomendado (Pattern A — "biometric-gated token cache"): login inicial com password; guardar refresh token no **Keychain/Keystore** atrás de ACL biométrica (`expo-secure-store`); no arranque Face ID desbloqueia o token e faz swap por access token.
  - `LocalAuthentication.getEnrolledLevelAsync()`: `0=none, 1=passcode, 2=weak, 3=strong`. Exigir ≥2 para ações de alto valor.
  - Apple Review: precisa `NSFaceIDUsageDescription` com frase que nomeie a feature (não só "Authentication"); requer opt-out (password/passcode path sempre disponível).
  - Android: dados biométricos nunca saem do device (dizer "No" no poids Data Safety).
- **Passkeys (WebAuthn/FIDO2)**: caminho futuro; backend precisa endpoint WebAuthn (registration+assertion).
  - Lib RN: `react-native-passkeys` (npm, Expo module, iOS 16+/Android 14+) — precisa `compileSdkVersion ≥34` e asset links (config plugin).
  - No ecossistema do projeto (Better Auth), `@better-auth/expo` (catalogado ^1.2.0) + plugin passkey `expo-passkey` (community, iOS 16+/Android 10+) — alternativa a avaliar na F5.
  - WebAuthn exige HTTPS em produção.
- **otplib no mobile**: NÃO usar otplib no cliente (secreto 2FA é server-side). Para F5 app, 2FA é apartir de TOTP no servidor; no cliente apenas UI (digits) — o `web-authn`/passkeys cobre o caso mobile.

## 2. Dark mode / temas (F-DS mobile)

### Factos
- Expo: `app.json` → `expo.userInterfaceStyle: "automatic"` para seguir sistema (light/dark/automatic). Sem isto, NativeWind não segue o sistema.
- Ler tema: `useColorScheme()` do `react-native` (subscribe a mudanças); `Appearance.getColorScheme()` imperativo.
- **NativeWind dark mode**: `useColorScheme` + `colorScheme.set()` (importado de `nativewind`) implementa o `dark:` variant; `colorScheme.set('dark'|'light'|'system')` permite toggle manual persistido.
- Best practice: tokens por **papel** (background, surface, surfaceMuted, text, textMuted, border, primary, danger), não por cor-família.
- Status bar / nav bar Android: `expo-status-bar` (style light/dark) + `expo-navigation-bar`/`expo-system-ui` (`NavigationBar.setBackgroundColorAsync`; `SystemUI.setBackgroundColorAsync`) para evitar white flash no splash.
- Expo Router usa React Navigation: passar `DarkTheme`/`DefaultTheme` de `@react-navigation/native` ao provider para cabeçalhos/tabs acompanharem.
- Google Material 3 static/dynamic colors disponíveis via `Color` do `expo-router` (`Color.android.dynamic.*`, `Color.ios.*`).

## 3. Estado do catálogo apps/mobile (gaps)

### Catalogado (✓)
- `expo@^57.0.0`, `expo-router@^57.0.0`, `expo-camera`, `expo-file-system`, `expo-image`, `expo-image-picker`, `expo-local-authentication`, `expo-notifications`, `expo-secure-store` (todos ^57.0.0).
- `react-native@^0.83.0`, `react-native-reanimated@^4.0.0`.
- `@better-auth/expo@^1.2.0`.

### NÃO catalogado (gaps — adicionar antes de implementar mobile)
- `nativewind` (ver FACTOS F-DS: v4+tailwind v3 vs v5+tailwind v4 — decisão pendente).
- `react-native-safe-area-context` (peer NATIVEWIND/Expo obrigatório).
- `expo-status-bar`, `expo-system-ui`, `expo-navigation-bar` (dark mode/splash).
- `intl-pluralrules` (polyfill obrigatório — Hermes não tem `Intl.PluralRules`; localização pt-AO requer).
- `react-native-passkeys` OU `expo-passkey` (se passkeys em F5).
- `@react-navigation/native` `@react-navigation/bottom-tabs` / `@react-navigation/native-stack` (jest/Expo Router theming) — verificar se já vem com expo-router.

## Conclusão (checklist acção mobile)
1. Adicionar aos gaps do catálogo: nativewind, react-native-safe-area-context, expo-status-bar, expo-system-ui, expo-navigation-bar, intl-pluralrules (+ react-native-passkeys se F5 com passkeys).
2. Biometria via **Pattern A**: expo-secure-store + expo-local-authentication; nunca tratar biometria como sessão.
3. Dark mode: `userInterfaceStyle: automatic` + `useColorScheme` + NativeWind `dark:` + `colorScheme.set()` com toggle persistido ("System" sempre disponível).
4. Passkeys opcional na F5: avaliar `react-native-passkeys`/`expo-passkey` + endpoint WebAuthn no backend (§2FA); exigir HTTPS.