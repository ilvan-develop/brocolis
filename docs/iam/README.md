# IAM + Tenants (Fase 1)

Documentação de módulo do backend — bounded contexts **Identity & Access**
(`auth`) e **Tenants & Organizations** (`tenants`). Ver também
`ADR-0010-iam-tenants.md`.

## Contratos (`@brocolis/contracts`)

| Ficheiro | Conteúdo |
|----------|----------|
| `src/iam.ts` | `userSchema`, `sessionSchema`, `signUpInputSchema`, `signInInputSchema`, `verifyEmailInputSchema`, `sessionInfoSchema`, `portalSchema` |
| `src/tenant.ts` | `organizationSchema`, `memberSchema`, `invitationSchema`, `inviteMemberInputSchema`, `acceptInvitationInputSchema`, `organizationSwitcherInputSchema` |

Regras: `organizationId` e `marketCode` obrigatórios em todo input scoped;
tipos derivados via `z.infer`.

## Schema (`@brocolis/db`)

Modelos IAM: `User`, `Session`, `Account`, `Verification`, `TwoFactor`, `Role`,
`Permission`, `RolePermission`. Modelos Tenants: `Organization`, `OrgSetting`,
`OrgFeatureFlag`, `Member`, `Invitation`, `WhiteLabelConfig`. Todos com
`@@map("snake_case")`; índices compostos `(organizationId, marketCode, createdAt)`.

## RBAC (`@brocolis/auth`)

- `RBAC_ROLES` — matriz por portal (Consumer, Pharmacy, Supplier, Business,
  Platform) com roles: OWNER, ADMIN, PHARMACIST, BUYER, FINANCE, INVENTORY,
  VIEWER (+ Supplier: SALES/LOGISTICS; Platform: OPERATIONS/COMPLIANCE/ANALYST/
  SUPPORT). OWNER/ADMIN = `"*"`.
- `can(role, action, resource)` e `hasRole(userRoles, required)` — puros.
- `createPasswordHash`/`verifyPassword` — scrypt `N=16384`, keylen 32, timing-safe.
- `createSessionToken()` — 32 bytes hex.

## API (`apps/api`)

```
src/auth/
  auth.module.ts        # módulo Nest
  auth.service.ts       # validateCredentials/issueSession/requireSession/revoke
  session.store.ts      # InMemorySessionStore (idle 30min; sliding)
  roles.guard.ts        # RolesGuard('PHARMACY') | { requiredRoles, requiredActions }
src/tenants/
  tenants.module.ts
  tenants.service.ts    # registerTenant/listMembers/switchOrganization (pure)
```

### Wiring futuro (pós-instalação de deps)

- `InMemorySessionStore` → `@brocolis/db` (Session) + Redis (throttle/revoke) —
  sessão server-side em 14-THREAT-MODEL.
- `wire()` de `@brocolis/auth` → Better Auth completo (MFA TOTP, invitations).
- `AuthService.users` (memória) → `User`/`Member` no Prisma.