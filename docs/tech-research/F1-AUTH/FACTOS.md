# FACTOS — Bloco F1 (Auth, 2FA, Rate Limiting)

> Pesquisa oficial antes de implementar F1. Fontes: hotjar/yeojz otplib docs (otplib.yeojz.dev),
> npmjs otplib, GitHub @nestjs/throttler, dev.to/throttler 2025-10. Auditado em 2026-08-20.
> Regra: "nenhuma stack sem pesquisa prévia" — este documento é a evidência.

## 1. otplib — TOTP para 2FA (Rótulo: `docs/auth`) e recuperação de conta

### Factos (v13, 2026-08)
- Versão atual: **otplib 13.4.1** (publicada há ~3 meses). TypeScript-first, multi-runtime (Node, Bun, Deno, Browser) via plugins.
- API atual: **Functional API recomendada** — `generateSecret`, `generate`, `verify`, `generateURI` (PRÁTICA atual é async, retorna Promise):
  ```ts
  import { generateSecret, generate, verify, generateURI } from "otplib";
  const secret = generateSecret({ length: 32 }); // Base32, 32 chars = 256 bits
  const token = await generate({ secret });      // TOTP. verify retorna VerifyResult, não boolean!
  const result = await verify({ secret, token });
  result.valid; // true | false
  const uri = generateURI({ issuer: "Brocolis", label: "user@example.com", secret });
  ```
  - `verify` (e `generate`) **NÃO retornam mais boolean**: `verify` retorna `VerifyResult { valid: boolean; delta?: number | null }`. (é importante para o contrato do service de auth 2FA).
  - Variantes sync `generateSync`/`verifySync` disponíveis com plugin crypto sync (NodeCryptoPlugin, NobleCryptoPlugin).
  - Secrets por defeito em **Base32** (compat Google Authenticator + otpauth:// URIs).
  - Plugins atuais (v12+): `@otplib/plugin-crypto-node`, `@otplib/plugin-crypto-noble`, `@otplib/plugin-base32-alt`; presets `browser`/`v11`.
  - TOTP default: SHA1, 6 dígitos, step 30s, window small. Opções: `algorithm: 'sha1'|'sha256'|'sha512'`, `digits`, `step`, `epoch`, `window` (número ou `[past, future]`).
  - Pode-se setar `step` e `window` para tolerância de clock-skew em produção.
- **Gap**: `otplib` **não está no catálogo** (`pnpm-workspace.yaml`). Adicionar `"otplib": "^13.4.1"` na fase F1 antes de implementar serviços de 2FA.
- NOTA de segurança: parity check — geração do QR code (`otpauth://`) feita server-side; nunca logar o secret.

## 2. @nestjs/throttler — Rate Limiting (Rótulo: `packages/db` + guards)

### Factos (v6.5, 2026-08)
- **`@nestjs/throttler@^6.5.0` JÁ está no catálogo** ✓ (`pnpm-workspace.yaml:18`).
- Config global:
  ```ts
  ThrottlerModule.forRoot({
    throttlers: [{
      name: "auth",            // nomear permite sobrepor por rota
      ttl: seconds(60),        // helpers seconds()/minutes() disponíveis
      limit: 10,
      blockDuration: seconds(60), // bloqueio temporário após exceder
    }],
    errorMessage: "too many requests",
  })
  ```
  - Bind global: `{ provide: APP_GUARD, useClass: ThrottlerGuard }` em providers.
  - Múltiplos throttlers simultâneos (ex.: "short" 1s, "medium" 10s, "long" 60s) — todos aplicam pela mesma rota guard.
  - `@Throttle({ default: { limit: 3, ttl: 60000 } })` para regras mais apertadas (auth); `@SkipThrottle()` para eximir (ex.: health).
  - Identificação por IP por default; atrás de proxy express usam `req.ip` com `trust proxy` ativo.
  - 429 Too Many Requests (ThrottlerException).
  - Storage é pluggable (in-memory default; há adaptadores Redis) — importante p/ escala; para F1 MVP in-memory ok.
  - Compat: Nest v11 ✓ (throttler v6 requer Nest ≥10/11).
- **Decisão**: registar ThrottlerModule global com throttlers nomeados: `auth` (login/register/otp: ttl 60s, limit ~10, blockDuration) e `general`. Aplicar `@Throttle` mais apertado em endpoints 2FA/password-reset na F1.

## Conclusão (checklist acção F1)
1. Adicionar `otplib@^13.4.1` ao catálogo em `pnpm-workspace.yaml` (gap detetado).
2. Services de 2FA usar **Functional API async** de otplib v13; contratos do `verify` devem refletir `VerifyResult`.
3. Throttler v6 já catalogado ↔ guards:
   - Global `APP_GUARD` `ThrottlerGuard`, throttlers nomeados (`auth`, `general`).
   - Endpoints sensíveis (login, mfa, password-reset, register) com `@Throttle` apertado ({ limit, ttl, blockDuration }).
   - Eximir `/health` com `@SkipThrottle()`.
4. Keys passToken: guardar `hash` (SHA-256) do otp secret em `pwdHash`-like — nunca plaintext — na DB (Audit trail).