# Hardening Runbook — Brócolis

## Rate Limiting

### Diagnostics
- **Redis connected?** Check `redis-cli -h localhost -p 16379 ping` → expects `PONG`.
- **Throttler keys** inspect: `redis-cli -p 16379 KEYS "throttle:*"` to see active counters.

### Tuning
- Default: 10 req/60s per IP. Auth: 5 req/60s.
- Env vars: `THROTTLER_TTL_MS` (default 60000), `THROTTLER_LIMIT` (default 10).
- Modify `rate-limit.module.ts` throttlers array for per-route overrides.

### Troubleshooting
- **429 Too Many Requests** returned to legitimate users → increase `THROTTLER_LIMIT` or add `@SkipThrottle()` to specific controllers.
- **Redis down** → Throttler falls back to in-memory (no distributed limiting). Check Redis logs.

### Emergency: Disable Rate Limiting
Comment out `RateLimitModule` import in `app.module.ts`. Restart API. **Never do in production without incident approval.**

---

## Sentry

### Verifying Sentry
1. Set `SENTRY_DSN` in `.env`.
2. Trigger test error: `GET /api/test-sentry` (create route if needed).
3. Check Sentry dashboard for the event.

### Sourcemap Upload (CI only)
Requires `SENTRY_AUTH_TOKEN` (not DSN). Add to CI:
```yaml
- run: npx @sentry/cli releases files $SENTRY_ORG upload-sourcemaps ./dist
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

### Sampling Tuning
- `SENTRY_TRACES_SAMPLE_RATE`: 0.1 (prod default), 1.0 (dev).
- Adjust in `sentry.ts` and `sentry.client.config.ts`.

### Disable Sentry
Remove `SENTRY_DSN` from env. Sentry SDK no-ops when DSN is absent.

---

## Security Headers

### Helmet (API)
- Configured in `apps/api/src/main.ts`.
- CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
- Modify via `helmet()` options.

### Next.js Headers (Web)
- Configured in `apps/web/next.config.ts` via `headers()`.
- CSP directives: review `cspDirectives` array.
- New origins (CDN, API) → add to `connect-src` / `script-src`.

### Verifying Headers
```bash
curl -I http://localhost:3000 | grep -i "strict-transport\|x-frame\|content-security"
curl -I http://localhost:4000/api/health | grep -i "strict-transport\|x-frame"
```

---

## Lighthouse CI

### Running Locally
```bash
pnpm dlx @lhci/cli autorun --config=apps/web/lighthouserc.json
```

### Budget Exceeded
- JS > 200KB → review bundle analyzer, lazy-load heavy modules.
- CSS > 50KB → purge unused Tailwind utilities.

### CI Integration
Add to `.github/workflows/ci.yml`:
```yaml
- name: Lighthouse CI
  run: pnpm dlx @lhci/cli autorun --config=apps/web/lighthouserc.json
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

---

## Changesets

### Creating a Changeset
```bash
pnpm changeset
# Select packages, bump type, summary
```

### Versioning
```bash
pnpm changeset version
# Updates CHANGELOG.md and package.json versions
```

### Publishing
```bash
pnpm changeset publish
```

---

## Secrets Scanning

### Running Gitleaks
```bash
gitleaks detect --source . --config .gitleaks.toml
```

### Pre-commit Hook
Already integrated via `lint-staged` + `husky`.

### False Positives
Add to `[[rules.allowlist]]` in `.gitleaks.toml` with regex or path patterns.
