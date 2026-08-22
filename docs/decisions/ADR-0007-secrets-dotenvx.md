# ADR-0007: Secrets via dotenvx com rejeição de placeholders

- **Estado:** Aceite
- **Data:** 2026-08-20

## Contexto

Secrets em repo são um risco crítico (Gitleaks no pre-commit, mas defesa por layers).

## Decisão

`@dotenvx/dotenvx` para gestão de env; `@brocolis/validation` rejeita valores
placeholder (`<trocar_obrigatoriamente>`) via `requiredSecretSchema`. `.env*`
ignorados no git; apenas `.env.example` comited.

## Consequências

Nunca comitar secrets; CI falha se um placeholder aparecer no schema.