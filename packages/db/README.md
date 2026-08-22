# @brocolis/db

Prisma 7 client + schema — **única fonte da verdade** da base de dados.

Regras (02-ARQUITETURA-CONTRATOS.md §6):
- Único ponto de instanciação do `PrismaClient` (regra AP-01).
- Driver adapter `PrismaPg` (Prisma 7, sem engine binário Node).
- `Decimal` para montantes, nunca float.
- `AuditEvent` e históricos de status append-only (mesma `$transaction` da mutação).