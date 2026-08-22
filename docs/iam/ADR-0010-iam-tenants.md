# ADR-0010: IAM + Tenants na F1 (Better Auth wire, scrypt, RBAC por portal)

- **Estado:** Aceite
- **Data:** 2026-08-20
- **Fase:** F1 — IAM + Tenants (09-ROADMAP-FASES.md)

## Contexto

O monorepo precisa de autenticação multi-tenant, sessões server-side com idle
timeout de 30min, RBAC por portal (Consumer/Pharmacy/Supplier/Business/Platform)
e org-switcher — antes de qualquer rota de negócio. As dependências de runtime
(`@prisma/client`, `better-auth` completo) ainda não estão instaladas, pelo que a
F1 deve ser **dependency-safe**: código que corre já, com wiring do Prisma/Redis
adiado.

## Decisão

1. **Contracts-first:** todos os inputs IAM/Tenants em `@brocolis/contracts`
   (`iam.ts`, `tenant.ts`) com `organizationId` + `marketCode` obrigatórios onde
   o scope se aplica.
2. **Schema Prisma:** modelos User/Session/Account/Verification/TwoFactor/Role/
   Permission/RolePermission (IAM) e Organization/OrgSetting/OrgFeatureFlag/
   Member/Invitation/WhiteLabelConfig (Tenants), com `@@map` snake_case e índices
   `(organizationId, marketCode, createdAt)`.
3. **Senhas:** scrypt via `node:crypto` (`N=16384`, keylen 32, salt aleatório,
   comparação timing-safe) — sem novas dependências; alinhado com
   14-THREAT-MODEL §2.1.
4. **Sessões:** server-side, token de 32 bytes hex, idle timeout **30min** em
   `InMemorySessionStore` até ao wiring Redis/Prisma.
5. **RBAC:** matriz `RBAC_ROLES` por portal (05-REQUISITOS-JORNADAS.md §1) como
   fonte única; `can(role, action, resource)` e `hasRole` puros e testáveis;
   `RolesGuard` lê `request.user.roles` e devolve 401/403.
6. **Better Auth:** importado apenas como tipo na F1; `wire()` mantém contrato de
   arranque. A ligação completa é posterior (com deps instaladas).

## Alternativas

- bcrypt/argon2 externos: dependências novas sem necessidade na F1.
- Sessões JWT client-side: rejeitadas (14-THREAT-MODEL — sessão server-side,
  SameSite=Strict, revogação).
- Roles como string livre: tipadas por portal dentro de `@brocolis/auth`.

## Consequências

- Positivo: F1 testável hoje; RBAC e hashing são puros; zero deps novas.
- Negativo: `InMemorySessionStore` não escala para multi-instância — substituído
  por Prisma/Redis no F1 completo (documentado em `docs/iam/README.md`).