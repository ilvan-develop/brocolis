# FACTOS — Docker Compose (Postgres/Redis/MinIO triad)

> Fase F0. Fontes: docs.docker.com/compose/how-tos/startup-order,
> stackharbor.dev docker-compose-healthchecks, toolsops.dev guide.

## Factos confirmados

1. Short form `depends_on: [a, b]` **só espera que o contentor arranque** — não espera readiness.
   Long form `condition: service_healthy` espera o healthcheck passar:
   ```yaml
   depends_on:
     db:
       condition: service_healthy
   ```
2. Healthcheck de dependência é **obrigatório** para `service_healthy`; sem ele, o compose falha
   (`service "db" is missing a healthcheck configuration`).
3. `start_period` curto demais → Postgres cold boot excede a janela e fica `unhealthy`;
   `retries` consecutivos falham o estado. Medir o pior caso real (imagem oficial postgres:17).
4. Volume nomeado do Postgres deve apontar a **`/var/lib/postgresql/data`** (PGDATA default);
   montar `/var/lib/postgresql` funciona mas é frágil.
5. Healthcheck padrão Postgres: `pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB` (o `$$` escapa
   para `${` dentro do container; essencial quando há env no blob).
   Redis: `redis-cli ping`; MinIO: `mc ready local` (na imagem minio).
6. `restart: true` no nó `depends_on` re-arranca o dependente quando a dependência é reiniciada.

## Aplicação ao Brócolis

- Root `docker-compose.yml`: corrigir volume postgres → `/var/lib/postgresql/data`.
- `deploy/docker-compose.test.yml`: manter apenas Postgres+Redis; usar long form quando um
  serviço dado depender deles (CI integration).
- MinIO: `MINIO_ROOT_USER/PASSWORD` e `healthcheck: mc ready local` estão corretos.

## Anti-patterns a evitar (blueprint 10)

- `version:` top-level antigo (deprecated) — remover.
- Secrets literais no ficheiro compose — usar `${VAR}` + `.env` não versionado.