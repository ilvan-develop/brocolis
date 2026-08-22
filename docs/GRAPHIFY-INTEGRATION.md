# Graphify Integration — Codebase Structural Intelligence

> Última validação: 2026-08-21 · `node scripts/graphify-health.mjs` → **HEALTHY**

## 1. Objetivo

O Graphify fornece **Codebase Structural Intelligence** ao OpenCode e aos agentes
(Architect, Planner, Backend, Frontend, QA): estrutura, relações, dependências,
caminhos, impacto e hubs arquiteturais, extraídos do repositório para um
knowledge graph consultável.

O Graphify **não é autoridade de decisão**. Autorização, risco, permissões e
policy decisions pertencem ao Governance existente (`.ai/state/`,
`scripts/quality-gate.mjs`, AGENTS.md).

## 2. Arquitetura

```text
OpenCode / Orchestrator
        │
        ├──────────────► GOVERNANCE (autoridade final)
        │
        ▼
     GRAPHIFY (evidência estrutural)
        │
  ┌─────┼─────┬──────────┬─────────┐
  ▼     ▼     ▼          ▼         ▼
QUERY PATH AFFECTED  EXPLAIN   GOD-NODES
        │
        ▼
GRAPH_INTELLIGENCE_GATE → ALLOW/BLOCK pelo Governance
```

Fluxo obrigatório antes de tarefas arquiteturais:

```text
TASK → GRAPH DISCOVERY → DEPENDENCY ANALYSIS → IMPACT ANALYSIS → GOVERNANCE → EXECUTION
```

## 3–4. Versões

| Componente | Versão | Evidência |
|---|---|---|
| Graphify CLI | 0.9.48 | `graphify --version` |
| OpenCode | instalado e ativo; versão não determinável via shell (`opencode.exe` bloqueado por Device Guard policy) | WARNING registado no health check |
| Plataforma | win32 · bash (Git for Windows) | env |

## 5–6. Instalação e configuração

Instalação já existente e validada — **não reinstalar**.

- Skill global em `~/.config/opencode/skills/graphify/`
- Plugin do projeto: `.opencode/plugins/graphify.js` — injeta lembrete
  `[graphify] …` na primeira chamada bash quando `graphify-out/graph.json` existe
- Registo: `.opencode/opencode.json` → `"plugin": [".opencode/plugins/graphify.js"]` (sem duplicados)
- Instruções de agente: secção *graphify* em `AGENTS.md`

## 7–8. Localização do grafo

- Grafo: `graphify-out/graph.json` — **5956 nós · 7914 edges** (2026-08-21)
- Relatórios: `graphify-out/GRAPH_REPORT.md`, `graph.html`, `GRAPH_TREE.html`
- Manifest incremental: `graphify-out/manifest.json`
- Backups datados: `graphify-out/<data>/`

## 9. Comandos suportados (validados)

```bash
graphify query "<pergunta>" [--budget N] [--context C]   # BFS no grafo
graphify path "A" "B"                                    # caminho entre nós
graphify affected "X" [--depth N]                        # travessia reversa (impacto)
graphify explain "X"                                     # nó + vizinhos
graphify god-nodes [--top N]                             # hubs arquiteturais
graphify diagnose multigraph [--json]                    # risco de colapso de edges
graphify update .                                        # re-extracção AST incremental (sem LLM)
graphify watch .                                         # rebuild contínuo (dev)
graphify hook install|status                             # hooks git
```

`doctor` não existe na 0.9.48 → INFO, não é erro.

## 10. Estratégia de atualização

- **Dev**: hook post-commit reconstrói o grafo automaticamente (AST-only,
  sem API). Para trabalho não commitado: `graphify update .` manual.
- **Regra**: depois de modificar código, correr `graphify update .` para manter o grafo atual.

## 11. Estratégia CI

Em CI, preferir `graphify update . --no-cluster` (determinístico, sem LLM) ou
`graphify extract . --code-only` para indexação inicial sem chaves de API.
Freshness pode ser verificado com `node scripts/graphify-health.mjs`.

## 12. Git hooks

Instalados via `graphify hook install` (2026-08-21):

- `.git/hooks/post-commit` — rebuild automático (`PYTHONHASHSEED=0`, workers=1 em Windows)
- `.git/hooks/post-checkout` — rebuild após branch switch
- Merge driver registado: `merge.graphify.driver` = union-merge de graph.json

Nota: `.husky/` existe mas estava inativo (`core.hooksPath` não definido); os
hooks ativos são os de `.git/hooks`. Não instalar hooks duplicados.

## 13. Integração com Orchestrator

Antes de paralelizar tarefas A, B, C: calcular `affected()` de cada uma.
Se `affected(A) ∩ affected(B) ≠ ∅` → conflito estrutural conhecido →
`PARALLEL_EXECUTION = BLOCKED`; caso contrário `ELIGIBLE`.
A decisão final continua no Orchestrator + Governance.

## 14. Integração com Governance

Gate conceptual **GRAPH_INTELLIGENCE_GATE** (implementado em
`scripts/graphify-health.mjs`, fail-closed exit 1):

```text
GRAPH_AVAILABLE · GRAPH_FRESH · GRAPH_QUERYABLE · GRAPH_STRUCTURALLY_VALID · IMPACT_ANALYSIS_AVAILABLE
```

Qualquer FAIL crítico → `UNHEALTHY` → tarefas que dependam de análise
estrutural devem bloquear (`REBUILD_REQUIRED`) até correção.

## 15. Critérios de freshness

Grafo é considerado fresco quando nenhum ficheiro fonte
(`apps/ packages/ docs/ scripts/ blueprint/ *.ts|tsx|js|mjs|prisma|md`)
é mais recente que `graph.json`. Se stale: `GRAPH_STALE` → correr
`graphify update .` antes de decisões arquiteturais críticas.

## 16. Troubleshooting

| Sintoma | Causa | Correção |
|---|---|---|
| `FRESHNESS FAIL` | ficheiros alterados pós-build | `graphify update .` |
| `PATH_NOT_FOUND` | nós sem relação dirigida | resultado vazio válido; testar `--undirected` |
| query devolve genérico | pergunta fora do corpus | refinar com nomes reais de nós/símbolos |
| comunidades renomeadas por hub | labels LLM desactualizados vs clusters novos | `graphify label --missing-only` (opcional) |
| `opencode --version` bloqueado | Device Guard na shell do agente | executar num terminal próprio; não é falha da integração |

## 17. Health check

```bash
node scripts/graphify-health.mjs
```

Valida: CLI, versões, AGENTS.md, plugin, registo, graph.json, nodes>0, edges>0,
god-nodes, query, path, affected, explain, freshness, infra de rebuild, git
hooks, integração estrutural do agente. Exit 1 se qualquer gate crítico falhar.

## 18. Evidências da validação (2026-08-21)

```text
GRAPHIFY_VERSION=0.9.48
OPENCODE_PLUGIN=PASS            (.opencode/plugins/graphify.js registado, sem duplicados)
GRAPH_EXISTS=PASS               graph.json válido
NODES_EDGES=PASS                5832→5938→5956 nós durante teste (ver abaixo)
DIAGNOSE_MULTIGRAPH=PASS        0 colapsos · 0 dangling · 0 self-loops · 0 duplicadas
GRAPH_QUERY=PASS                queries com entidades reais (OrdersService, cn(), etc.)
GRAPH_PATH=PASS                 path executado; PATH_NOT_FOUND tratado como vazio válido
GRAPH_AFFECTED=PASS             OrdersService → 22 dependentes reais (ficheiro+linha)
GRAPH_EXPLAIN=PASS              explicação baseada no grafo
GOD_NODES=PASS                  cn() 55 · InventoryService 32 · OrdersService 32 · nextCuid() 29
GRAPH_REBUILD=PASS              probe criada→detectada (5940n/7898e)→revertida (0 residual)
                                nota: delta permanente +106n/+4e = 302 ficheiros uncached
                                re-extraídos incrementalmente, não perda nem corrupção
FRESHNESS=PASS                  0 ficheiros mais recentes que graph.json (pós-update)
GIT_HOOKS=PASS                  post-commit + post-checkout + merge driver instalados
AGENT_INTEGRATION=PASS          sessão real: agente usou query/path/explain antes de
                                responder análise arquitetural (plugin→query→resultado→resposta)
IMPORT_CYCLES=0                 GRAPH_REPORT.md:421
HEALTH_CHECK=HEALTHY            node scripts/graphify-health.mjs (1 WARN ambiental: opencode CLI)
OVERALL=COMPLETE                com 1 WARNING ambiental (Device Guard) não-bloqueante
```
