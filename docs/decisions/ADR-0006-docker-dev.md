# ADR-0006: Infra de dev em docker-compose (Postgres 17 + Redis 8 + MinIO)

- **Estado:** Aceite
- **Data:** 2026-08-20

## Contexto

Dev/test precisam de Postgres, Redis e storage S3-compatible reproduzíveis.

## Decisão

`docker-compose.yml` na raiz (dev: Postgres 17, Redis 8-alpine, MinIO) e
`deploy/docker-compose.test.yml` (Postgres + Redis para integração em CI).
Ports default não padrão (15432/16379/19000) para evitar colisões.

## Consequências

Storage: MinIO em dev/test; Supabase Storage em staging/prod — a troca é
configuração (`STORAGE_DRIVER`), não código.