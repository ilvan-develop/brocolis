# Incident Response Playbook — Brócolis

## Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| P1 | Service down, data loss risk | < 15 min | API 500, DB unreachable |
| P2 | Degraded service, partial outage | < 1 hr | Slow responses, auth failures |
| P3 | Non-critical issue | < 4 hr | Minor UI bug, rate limit spike |
| P4 | Cosmetic / low impact | Next business day | Typo, non-blocking warning |

---

## P1: API Down

### Detection
- Health check fails: `GET /api/health`
- Sentry alert fires
- User reports

### Response
1. **Acknowledge** in incident channel (Slack/Discord).
2. **Check** Redis, Postgres, MinIO connectivity.
3. **Check** Sentry for error spike and root cause.
4. **Rollback** if caused by recent deploy:
   ```bash
   git revert HEAD && git push
   ```
5. **Scale** if traffic spike: increase NestJS instances behind load balancer.

### Post-Incident
- Update `docs/runbooks/hardening-runbook.md` if new failure mode.
- Create changeset for fix.

---

## P2: Rate Limiting Abuse

### Detection
- Spike in 429 responses in Sentry/logs.
- Redis `throttle:block:*` keys growing fast.

### Response
1. **Identify** source IP(s): `redis-cli KEYS "throttle:*" | head -20`.
2. **Block** at CDN/WAF level if distributed attack.
3. **Increase** `THROTTLER_LIMIT` temporarily if false positives.
4. **Monitor** Redis memory: `redis-cli info memory`.

---

## P3: Sentry Errors Spike

### Detection
- Sentry alert: error rate > threshold.
- Dashboard shows new error type.

### Response
1. **Filter** Sentry by `environment` and `release`.
2. **Check** if correlated with deploy.
3. **Add** `@SentryExceptionCaptured()` to new exception filter if missing.
4. **Triage** — if P1/P2, escalate.

---

## P4: Lighthouse Score Drop

### Detection
- CI Lighthouse assertion fails.
- Performance regression PR comment.

### Response
1. **Run** `pnpm dlx @lhci/cli autorun` locally.
2. **Check** bundle size: `next build && du -sh .next/`.
3. **Review** `next.config.ts` transpilePackages.
4. **Fix** and add to changeset.

---

## Data Breach / Security Incident

### Immediate Actions
1. **Rotate** all secrets: `BETTER_AUTH_SECRET`, `FINPAY_API_KEY`, `SENTRY_AUTH_TOKEN`, DB password.
2. **Revoke** active sessions via Better Auth.
3. **Notify** team and affected users per LGPD requirements.
4. **Preserve** logs — do not delete or modify.
5. **Document** timeline in incident channel.

### Compliance
- Report to ANATC within 72 hours (LGPD Art. 48).
- File SAF-T audit trail for any data access.

---

## Communication Templates

### Internal (Slack/Discord)
```
🚨 [P1] Brócolis API unavailable
Impact: All users
Status: Investigating
Lead: @name
```

### External (Status Page)
```
We're experiencing service disruptions. Our team is actively working on a fix.
We'll provide updates every 30 minutes.
```

---

## Escalation Path

1. On-call engineer → investigates
2. Tech lead → if unresolved in 30 min
3. CTO → if P1 > 1 hour
4. External vendor (Sentry/Redis/DB) → if infrastructure issue
