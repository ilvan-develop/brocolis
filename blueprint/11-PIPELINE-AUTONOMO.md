# 11 — AI Software Delivery Pipeline (opencode)

> Aplica-se à **Fase 0** e a todas as fases seguintes. Define como o Brócolis v2 é construído **do zero, sem intervenção humana**, por agentes opencode em modo `--auto`, com retoma, gates e **rastreio de evidências**. Este documento é o spec do pipeline; os ficheiros reais (`opencode.json`, `.ai/`, `.opencode/`) são criados na F0.

---

## 1. Princípio

**OpenCode = AI Engineering Runtime.**
**Pipeline = Governance + State Machine.**
**GitHub Actions = Execution/CI.**
**MCP = acesso controlado a ferramentas.**
**AGENTS.md / skills = conhecimento operacional.**
**Tests + gates = autoridade de qualidade.**

O OpenCode **não é o pipeline inteiro**. Ele executa fases governadas por um pipeline com estado, gates e evidências. Um agente `brocolis-builder` executa F0→F-EX→F7 de forma **100% headless**: sem `ask`, política apenas `allow`/`deny`, e cada fase termina com gates verdes e evidência registada.

### Regras do modo auto

| Regra | Valor |
|-------|-------|
| Modo | `opencode run --auto` (aprova tudo não negado) |
| `--continue` | Reusa a sessão anterior; nada de começar contexto do zero |
| Policy | Só `allow`/`deny` — **nunca `ask`** |
| `question` tool | `deny` no agente builder (não pode perguntar) |
| `doom_loop` | `allow` (não reiniciar sessão à toa) |
| `CI=true` | Configuração estável em CI |
| Ramificação | Branch por fase: `feat/f0-foundation`, `feat/f-ds`, … |
| Merge | Nunca push directo para `main`; PR por fase |

---

## 2. Arquitectura do pipeline

```
                    ┌──────────────────────┐
                    │      PRODUCT        │
                    │ PRD / Issue / Spec  │
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
                    │    ORCHESTRATOR      │
                    │ OpenCode Agent Layer │
                    └──────────┬───────────┘
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
        ARCHITECT           PLANNER           DISCOVERY
             │                 │                 │
             └─────────────────┼─────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │     IMPLEMENTATION    │
                    │ Backend · Frontend ·  │
                    │ Mobile · Database ·   │
                    │ DevOps                │
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
                    │        QA GATE        │
                    │ typecheck · lint ·    │
                    │ unit · integration ·  │
                    │ e2e · security ·      │
                    │ architecture audit    │
                    └──────────┬───────────┘
                         PASS / FAIL
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
                 RELEASE                 FIX
                    │                     │
                    ▼                     │
              ┌───────────┐               │
              │   CI/CD   │◄──────────────┘
              └─────┬─────┘
                    ▼
             STAGING → PROD
```

---

## 3. Pipeline por fases (00–15)

| # | Fase |
|----|------|
| 00 | DISCOVERY |
| 01 | REQUIREMENTS |
| 02 | ARCHITECTURE |
| 03 | PLAN |
| 04 | IMPLEMENT |
| 05 | VERIFY |
| 06 | AUDIT |
| 07 | REVIEW |
| 08 | INTEGRATION |
| 09 | STAGING |
| 10 | E2E |
| 11 | SECURITY |
| 12 | RELEASE |
| 13 | PRODUCTION |
| 14 | OBSERVABILITY |
| 15 | FEEDBACK |

### Contrato de cada fase

Toda fase define:

```text
INPUT → AGENT → TOOLS → ARTIFACTS → VALIDATION → GATE → NEXT PHASE
```

Exemplo — IMPLEMENTATION:

```text
IMPLEMENTATION
Input:      PLAN.md
Agent:      backend-agent (ou frontend/mobile/database/devops)
Tools:      OpenCode, MCP, Context7, Git
Output:     source code, tests, migration, documentation
Validation: typecheck, lint, unit tests, integration tests
Gate:       PASS → VERIFY/AUDIT · FAIL → IMPLEMENTATION (fix)
```

---

## 4. Estrutura `.ai/`

```
.ai/
├── agents/
│   ├── orchestrator.md
│   ├── architect.md
│   ├── planner.md
│   ├── backend.md
│   ├── frontend.md
│   ├── mobile.md
│   ├── devops.md
│   ├── security.md
│   └── qa.md
├── skills/
│   ├── architecture/  backend/  frontend/  mobile/
│   ├── database/  testing/  security/  devops/
├── protocols/
│   ├── discovery.md
│   ├── implementation.md
│   ├── audit.md
│   ├── anti-patterns.md
│   ├── testing.md
│   └── release.md
├── pipeline/
│   ├── pipeline.yaml
│   ├── gates.yaml
│   └── policies.yaml
└── state/
    ├── current.json
    ├── execution.json
    └── evidence.json
```

E no projecto:

```
AGENTS.md          # regras de trabalho + gates (raiz)
ARCHITECTURE.md    # resumo da arquitectura (02)
DESIGN.md          # resumo do design system (04)
CONTRIBUTING.md    # como contribuir (08)
```

---

## 5. Evidence-Based Pipeline

O agente **não pode dizer simplesmente "feito"**. Cada etapa produz evidências que são gravadas em `state/evidence.json`.

```json
{
  "phase": "implementation",
  "status": "passed",
  "agent": "backend",
  "files_changed": 14,
  "tests": {
    "unit": 42,
    "integration": 18
  },
  "typecheck": "passed",
  "lint": "passed",
  "architecture_audit": "passed",
  "commit": "abc123",
  "timestamp": "2026-08-11T10:00:00Z"
}
```

Fluxo: **Agent → Action → Evidence → Gate → State Transition**, nunca **Agent → código → "parece funcionar"**.

### `state/evidence.json` (acumulado)

```json
{
  "milestone": "MVP_V1",
  "phases": {
    "F0": { "status": "done", "branch": "feat/f0-foundation", "evidence": ["..."] },
    "F-EX": { "status": "done", "branch": "feat/f-ex-experience", "evidence": ["..."] },
    "F-DS": { "status": "done", "branch": "feat/f-ds", "evidence": ["..."] }
  },
  "updatedAt": "2026-08-11T12:00:00Z"
}
```

---

## 6. Agentes

| Agente | Tipo | Responsabilidade |
|--------|------|------------------|
| `brocolis-builder` | primary | Executa a fase corrente de ponta a ponta, sem perguntar |
| `orchestrator` | subagent | Coordena fases e transições |
| `architect` | subagent | Decisões de arquitectura, ADRs, validação de contratos |
| `planner` | subagent | PLAN.md por fase |
| `backend` | subagent | Implementação backend (NestJS, oRPC, Prisma) |
| `frontend` | subagent | Implementação web (Next.js) |
| `mobile` | subagent | Implementação mobile (Expo SDK 57) |
| `database` | subagent | Schema, migrations, seed |
| `devops` | subagent | Docker, CI/CD, deploy |
| `security` | subagent | Threat model, hardening, secrets |
| `qa` | subagent | Testes unit/integração/contrato/E2E |

Regras do builder:
- Nunca invoca `question`. Se faltar informação, usa defaults do blueprint e regista `DECISION` no log.
- Cumpre as regras imutáveis do README (pesquisa antes de implementar; execução rápida).
- Fecha sempre com gates verdes + evidência em `state/evidence.json`.

---

## 7. `pipeline.yaml` / `gates.yaml` / `policies.yaml` (spec)

### `pipeline.yaml`

```yaml
# .ai/pipeline/pipeline.yaml (spec; versão real criada na F0)
pipeline:
  name: brocolis-delivery
  phases: [discovery, requirements, architecture, plan, implement, verify, audit, review, integration, staging, e2e, security, release, production, observability, feedback]
  state_file: .ai/state/current.json
  evidence_file: .ai/state/evidence.json
  continue: true          # --continue entre fases
  auto: true              # política allow/deny, nunca ask
```

### `gates.yaml`

```yaml
gates:
  - name: lint            # biome, 0 erros
  - name: typecheck       # 0 erros
  - name: build           # 0 erros
  - name: unit            # 100% pass
  - name: integration     # 100% pass (docker)
  - name: e2e             # jornadas verdes
  - name: coverage        # >=80%
  - name: security        # codeql + dependency-review
  - name: contract        # check:drift 0 drift
order: [lint, typecheck, build, unit, integration, e2e, coverage, security, contract]
```

### `policies.yaml`

```yaml
policies:
  mode: allow-deny
  deny: [ask, question]
  allow: [write, edit, bash, run, test, commit]
  branch: feat/*
  merge: via PR
  evidence_required: true
```

---

## 8. Servidor e sessão

```powershell
# Terminal 1 — servidor persistente
opencode serve --port 4096

# Terminal 2 — fase com reuso de sessão
opencode run --attach 4096 --auto --continue -m brocolis-builder `
  "Lê blueprint/11-PIPELINE-AUTONOMO.md e executa a fase corrente."
```

- `opencode serve` mantém a sessão e o custo entre fases.
- `--continue` evita rebuildar contexto.
- `opencode stats` regista custo por fase em `logs/`.

---

## 9. Estado e retoma (`state/current.json`)

```json
{
  "current": "F1",
  "milestone": "MVP_V1",
  "milestones": {
    "MVP_V1": {
      "phases": ["F0", "F-EX", "F-DS", "F1", "F2", "F3"],
      "status": "in_progress",
      "exit_criteria": "Checkout FinPay mock → entrega → admin verifica, em produção"
    },
    "V1_5": { "phases": ["F4"], "status": "pending" },
    "V2": { "phases": ["F5", "F6"], "status": "pending" }
  },
  "phases": {
    "F0": { "status": "done", "branch": "feat/f0-foundation", "cost": 0.42 },
    "F-EX": { "status": "done", "branch": "feat/f-ex-experience", "cost": 0.80 },
    "F-DS": { "status": "done", "branch": "feat/f-ds", "cost": 1.10 },
    "F1": { "status": "in_progress", "branch": "feat/f1-iam" }
  },
  "updatedAt": "2026-08-11T12:00:00Z"
}
```

- O script lê `state/current.json`; se `status != done`, retoma a fase.
- **Gate de milestone:** o builder avança fase a fase sem pular o gate. As fases fora do milestone corrente (ex.: F4/F5/F6 durante `MVP_V1`) ficam **bloqueadas**; só abrem quando `milestone.status = done`.
- Fase bloqueada (gate vermelho) permanece `in_progress` e o log indica o motivo.
- `run-pipeline.ps1 -Resume` salta fases `done`.

---

## 10. Rollback

- Gate vermelho → fase bloqueada; nunca avançar.
- Em `PRODUCTION`: rollback via tag revert + migrate reversa documentada (`08`).
- Em dev: fix em nova PR; a evidência de falha fica no log.

---

## 11. Skills do pipeline (criadas em F0)

`stack-research-gate`, `brocolis-docs-architecture`, `brocolis-experience-modules`, `brocolis-testing-patterns`, `brocolis-design-tokens`, `brocolis-journey-patterns`, `api-contract-drift`, `wcag-contrast-check`, `market-pack`.

> O `stack-research-gate` força a pesquisa antes de implementar: sem skill = pesquisar context7/docs antes de escrever código.

---

## 12. Anti-patterns do pipeline

| Anti-pattern | Correto |
|--------------|---------|
| `--auto` com `ask` na policy | Só `allow`/`deny` |
| Reiniciar contexto a cada fase | `--continue` + `opencode serve` |
| Merge direto para main | Branch `feat/*` + PR |
| Ignorar gate vermelho | Bloquear fase, registar em `state/current.json` |
| "Feito" sem evidência | Evidence em `state/evidence.json` |
| Evidência fabricada | Gates reexecutáveis; commit hash + timestamps |
| Fase sem artefacto | `ARTIFACTS` obrigatórios no contrato da fase |
| Testar contra FinPay real | `FinPayMockProvider` em dev/test |
| Avançar fase fora do milestone | Gate de milestone bloqueia F4/F5/F6 até `MVP_V1` done (09) |
