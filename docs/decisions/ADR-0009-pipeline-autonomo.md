# ADR-0009: Pipeline autónomo evidence-based (.ai/)

- **Estado:** Aceite
- **Data:** 2026-08-20

## Contexto

O Brócolis é recriado por agentes opencode em modo `--auto`, fase a fase, sem
intervenção humana.

## Decisão

Pipeline em `.ai/` com estado (`state/current.json`), evidências
(`state/evidence.json`), gates (`pipeline/gates.yaml`) e policy `allow`/`deny`
(nunca `ask`). Branch por fase `feat/*` + PR. Fase só avança com gate verde +
eval ≥85.

## Consequências

F4..F6 bloqueadas até MVP_V1 `done`; rollback via tag + migrate reversa;
evidências reexecutáveis (hash+timestamp).