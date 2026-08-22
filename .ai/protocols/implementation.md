# IMPLEMENTATION

Input: PLAN.md. Output: source + tests + migrations + docs.
Validação: typecheck, lint, unit, integração.
Gate: PASS → VERIFY/AUDIT · FAIL → IMPLEMENTATION (fix).
Regras imutáveis aplicam-se (contracts-first, tenant isolation, AuditEvent, FinPay).