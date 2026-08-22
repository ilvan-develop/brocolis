# @brocolis/observability

Fonte única de logging e tipos de auditoria (regra AP-06). Tipos `AuditEvent`
consumidos por `@brocolis/db` e pelas mutações críticas. O motor real (pino +
OpenTelemetry + prom-client) é ligado no endurecimento (F7).