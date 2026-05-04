# agent-ops-hub

**A self-evolving AI development organization engine built on MCP.**

agent-ops-hub is a [Model Context Protocol](https://modelcontextprotocol.io/) server that turns
any AI assistant into a self-orchestrating, self-improving development team. It does not call an
AI itself — it produces structured **prompt bundles** that the connected AI executes, making it
model-agnostic and infinitely composable.

> **The AI is the engine. agent-ops-hub is the transmission.**

Current version: **v0.9.1** — 55 tools · 19 prompts · 40 specialist roles · 17/17 tests passing.

---

## How It Works — The AI Sampling Model

The most important thing to understand: **this server never calls an AI. YOUR AI is the engine.**

```
Your AI (Claude / GPT / Gemini / Copilot / Ollama / any MCP client)
         |  calls tools via MCP protocol
   agent-ops-hub MCP server
         |  returns prompt BUNDLES — instructions FOR your AI, not AI responses
Your AI reads + executes those prompt bundles as a specialist role
         |  produces high-quality specialist output
   agent-ops-hub evaluates, scores, and synthesizes
         |  returns next cycle instructions
         ^  loop — each cycle smarter than the last
```

When `dispatch_specialist_task` returns a prompt bundle for `backend_architect`, YOUR AI reads
that bundle and executes it — reasoning and responding as a backend architect would. The server
is purely stateless infrastructure. All cognition happens in your AI.

**Works with any AI that supports MCP — zero code changes to switch providers:**
- Claude Desktop or API
- GPT-4o via OpenAI API
- GitHub Copilot
- Local models via Ollama
- Any other MCP-compatible client

---

## The Self-Evolution Loop

agent-ops-hub is designed to research and improve itself in a closed loop:

1. `research_improvement_ideas` — scrapes the web for new MCP/AI patterns and techniques
2. `orchestrate_continuous_improvement_loop` — plans which improvements to tackle next
3. `run_parallel_specialist_sprint` — dispatches a full team to design each improvement
4. `evaluate_sprint_output` — scores output quality on a 0–100 rubric (**live: 97/100 grade A**)
5. `synthesize_sprint_outputs` — merges specialist designs into a unified implementation plan
6. `specialist_work_log` — persists all progress across sessions
7. Repeat — each cycle produces better tools, better prompts, better specialists

The AI executes every step. The server provides scaffolding, evaluation criteria, and memory.

---

## Quick Start

### 1. Add to your MCP client config

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "agent-ops-hub": {
      "command": "node",
      "args": ["C:/Users/justi/mcp-servers/agent-ops-hub/mcp-server.js"]
    }
  }
}
```

**HTTP bridge** (for web-based or API AIs): `http://127.0.0.1:11200`

### 2. Start the server
```bash
npm start
```

### 3. Example — run a specialist sprint
Ask your AI:
> "Run a parallel specialist sprint with backend_architect, security_engineer, and
> qa_automation_engineer to design a rate-limiting system."

The AI calls `run_parallel_specialist_sprint`, receives prompt bundles per specialist, executes
each one, calls `evaluate_sprint_output`, and returns a scored synthesis.

---

## Tool Groups (55 Total)

| Group | # | What It Does |
|-------|---|-------------|
| Agent & MCP Ops | 6 | Preflight checks, server discovery, semantic tool search, health monitoring |
| Runbooks & Plans | 5 | Execution runbooks, plan diffs, test scaffolding, complexity estimates |
| Validation & Quality | 7 | Quality gates, complexity scans, refactor risk, regression root cause analysis |
| Project & Repo Mgmt | 9 | Changelogs, drift detection, multi-repo sync, roadmap tracking, task planning |
| Test & Artifact Mgmt | 4 | Artifact summaries, execution history, test coverage gaps, result tagging |
| Capability Discovery | 2 | Server capability matrices, cross-server comparisons |
| Specialist Orchestration | 10 | Dispatch, sprint, evaluate, synthesize, work log, roster, assignments |
| Research & Improvement | 7 | Web research, continuous improvement loop, loop state + control, quality eval |
| Media & Schema | 5 | SVG generation, image/video analysis, JSON schema validation, docs discovery |
| Skill Packs | 1 | Draft skill pack manifests |

---

## The 40 Specialist Roles

Each specialist has a unique `id`, `domain`, `title`, and `strengths[]` array.
When dispatched, your AI receives a prompt bundle tailored to that role and its domain.
**Your AI IS the specialist — it reasons and responds from inside that role.**

| Domain | Roles |
|--------|-------|
| UX | ux_ui_architect, product_designer, design_system_engineer, accessibility_specialist, usability_researcher, interaction_designer, brand_experience_designer |
| Frontend | frontend_performance_engineer, mobile_responsive_specialist |
| Backend | backend_architect, api_design_specialist, database_architect, caching_specialist, microservices_engineer |
| Quality | visual_regression_tester, qa_automation_engineer, test_strategy_architect, load_testing_engineer |
| Security | security_engineer, penetration_tester, compliance_specialist |
| Data | data_engineer, ml_pipeline_engineer, analytics_specialist |
| DevOps | devops_engineer, ci_cd_specialist, infrastructure_architect, monitoring_specialist |
| Architecture | systems_architect, integration_specialist, event_driven_architect |
| Docs | docs_information_architect, technical_writer, api_documentation_specialist |
| Research | research_analyst, competitive_intelligence_specialist, performance_profiler |

---

## Prompts (19 Total — AI-to-AI Personas)

Prompts are deep role-priming bundles your AI can request and then execute as that role.

**Operational Playbooks (9):**
`agent_ops_workflow`, `validation_strategy`, `specialist_team_blueprint`,
`continuous_research_loop`, `media_toolchain_blueprint`, `skill_pack_operating_model`,
`autonomous_loop_controller`, `release_prep_checklist`, `multi_repo_ops_playbook`

**Specialist Execution Personas (10):**
`specialist_sprint_briefing`, `code_review_specialist`, `security_audit_specialist`,
`test_strategy_specialist`, `architecture_review_specialist`, `performance_specialist`,
`debugging_specialist`, `documentation_specialist`, `refactoring_specialist`, `devops_specialist`

---

## Evaluation Rubric (0–100)

`evaluate_sprint_output` scores specialist output on 4 axes plus a domain keyword bonus:

| Axis | Max | How to Score Full Points |
|------|-----|--------------------------|
| Specificity | 25 | Reference concrete patterns, real file names, actual values |
| Actionability | 25 | 15+ action verbs AND 10+ bullet points |
| Coverage | 25 | All aspects of the assigned task addressed |
| Clarity | 25 | Clean structure, unambiguous language |
| Domain Keyword Bonus | +2 | Specialist domain terms present |

**Production proof:** 97/100 grade A on a live 5-specialist sprint (sprint-1777881114702-a04rwq).
Per-specialist: backend_architect 97, security_engineer 98, qa_automation_engineer 99,
docs_information_architect 97, performance_profiler 94.

---

## Architecture

```
mcp-server.js                  single-file MCP server (~5,700 lines)
  SPECIALIST_AGENT_CATALOG      40 specialist role definitions
  TOOLS array                   55 tool definitions + input schemas
  PROMPTS array                 19 prompt definitions
  runTool() / handleTool()      all tool execution logic
  buildPromptText()             prompt bundle construction
  HTTP bridge                   127.0.0.1:11200 for non-stdio AI clients

artifacts/                      persistent AI work output (runbooks, research, loop state)
logs/specialist-runs/           per-sprint specialist execution logs
logs/tool-usage.json            live tool call counters
tests/                          17 test groups (group-a through group-q)
```

---

## Testing

```bash
npm test              # all 17 test groups
npm run test:smoke    # fast sanity check (~5 seconds)
npm run verify        # syntax check + full test suite
```

17/17 groups passing as of v0.9.1. Test groups are organized by feature area:
`group-a` (capabilities) → `group-q` (specialist execution).

---

## Quality Gates (Before Every Release)

1. `node --check mcp-server.js` — syntax must be clean
2. `npm test` — all 17 groups must pass
3. `evaluate_sprint_output` on new specialist tools — must score ≥80/100
4. Version bump in `package.json` AND `serverInfo.version` in `mcp-server.js`
5. Commit format: `vX.Y.Z: {short description}`

See `RELEASE_CHECKLIST.md` for the full flow.

---

## Adding a Tool

1. Add entry to `TOOLS` array (`name`, `description`, `inputSchema`)
2. Add `case 'tool_name':` handler in `runTool()`
3. Write tests in `tests/group-*/test.js` (happy path + invalid args + failure path)
4. Run `npm run verify` — must pass clean
5. Commit with version bump

---

## Roadmap

See [`../ROADMAP.md`](../ROADMAP.md) for the 10 prioritized implementation ideas,
current state assessment, auto-mode operating guide, and version milestone targets.

---

## License

MIT
- Keep it orchestration-focused; do not duplicate separate MCP domains like web scraping.
