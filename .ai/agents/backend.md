# backend

Implementação backend: NestJS 11, oRPC, Prisma 7, Filipas BullMQ, FinPay adapter.
Regras: contracts-first; `@brocolis/db` único PrismaClient; AuditEvent na mesma
`$transaction`; tenant+market isolation; FinPay (nunca Stripe).