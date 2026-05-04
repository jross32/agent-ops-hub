# agent-ops-hub — AI Tool Reference (DOCS.md)

Version: **0.3.0** | Port: **11200** (HTTP) + stdio | Tools: **29** | Prompts: **5**

> **For AI agents:** This is your primary orchestration server. Start here to plan tasks, validate work, compare server capabilities, track roadmaps, and analyze test artifacts. Use the prompts to get structured guidance before starting complex workflows.

---

## Quick Picks by Goal

| Goal | Tool to Use |
|------|-------------|
| Plan a complex task into steps | `agent_task_planner` |
| Check which tools a server has | `compare_mcp_server_tools` |
| Validate JSON against a schema | `validate_json_schema` |
| Run tests and get a pass/fail gate | `run_validation_gate` |
| Find tools with no tests | `find_missing_tests` |
| Generate a changelog from git | `generate_changelog_entry` |
| Track project roadmap tasks | `roadmap_tracker` |
| Build a 40-role specialist team plan | `plan_specialist_assignments` |
| Run recurring web intel pulse | `research_improvement_ideas` |
| Check JS file syntax quality | `code_quality_gate` |
| Get workflow guidance (prompt) | Prompt: `agent_ops_workflow` |

---

## All 29 Tools

### Orchestration & Intelligence

#### `agent_task_planner`
Decompose a high-level task into ordered steps with complexity estimates.
```json
{ "task": "Add 5 new tools to agent-ops-hub and write tests", "context": "Node.js MCP server" }
```
Returns: `{ steps: [{ id, title, complexity, notes }], estimatedTotal }` 

#### `agent_mode_preflight`
Run a preflight health check across multiple MCP servers before starting a multi-server workflow.
```json
{ "servers": ["C:/Users/justi/mcp-servers/agent-ops-hub", "C:/Users/justi/mcp-servers/os-bridge"], "timeoutMs": 45000 }
```
Returns: `{ score, results: [{ server, ok, toolCount, latencyMs }] }`

#### `research_agent_patterns`
Fetch and summarize agent design patterns from URLs.
```json
{ "urls": ["https://example.com/agent-patterns"], "maxCharsPerPage": 8000 }
```
Returns: `{ results: [{ url, title, summary, wordCount }] }`

---

### Validation & Testing

#### `run_validation_gate`
Execute a test script and enforce pass/fail/warn thresholds.
```json
{ "testScript": "node tests/run-all.js", "workingDir": "C:/Users/justi/mcp-servers/agent-ops-hub", "severityLevel": "error" }
```
Returns: `{ passed, exitCode, stdout, stderr, durationMs }`

#### `benchmark_validation_gate`
Run a validation gate N times and return timing statistics.
```json
{ "testScript": "node tests/run-all.js", "workingDir": "C:/Users/justi/mcp-servers/agent-ops-hub", "runs": 3 }
```
Returns: `{ avgMs, minMs, maxMs, allPassed, runs }`

#### `validate_json_schema`
Validate any JSON value against a JSON Schema — returns detailed per-field errors.
```json
{ "data": { "name": "alice", "age": 30 }, "schema": { "type": "object", "required": ["name","age"], "properties": { "name": { "type": "string" }, "age": { "type": "number" } } } }
```
Returns: `{ valid: true|false, errorCount, errors: [{ path, message }] }`

#### `code_quality_gate`
Run `node --check` on JS files and return a quality score (0–100).
```json
{ "files": ["C:/Users/justi/mcp-servers/agent-ops-hub/mcp-server.js"], "timeoutMs": 15000 }
```
Returns: `{ allPassed, avgScore, results: [{ file, syntaxOk, lineCount, score }] }`

#### `dependency_audit`
Run `npm outdated` and return a structured report of stale packages.
```json
{ "projectDir": "C:/Users/justi/mcp-servers/agent-ops-hub", "timeoutMs": 45000 }
```
Returns: `{ outdatedCount, packages: [{ name, current, wanted, latest, type }] }`

---

### Coverage & Analysis

#### `scan_tool_coverage`
Scan an MCP server's test directories and report which tools have test groups.
```json
{ "serverDir": "C:/Users/justi/mcp-servers/agent-ops-hub", "testsDir": "C:/Users/justi/mcp-servers/agent-ops-hub/tests" }
```
Returns: `{ toolCount, coveragePercent, covered: [...], uncovered: [...] }`

#### `find_missing_tests`
Find tool names in mcp-server.js that have no matching test group folder.
```json
{ "serverDir": "C:/Users/justi/mcp-servers/agent-ops-hub", "testsDir": "C:/Users/justi/mcp-servers/agent-ops-hub/tests" }
```
Returns: `{ toolCount, missingCount, missingTests: [...], coveragePercent }`

#### `estimate_tool_complexity`
Rank tools by schema complexity score to prioritize testing effort.
```json
{ "serverPath": "C:/Users/justi/mcp-servers/agent-ops-hub/mcp-server.js", "topN": 10 }
```
Returns: `{ tools: [{ name, score, schemaDepth, paramCount }] }`

#### `summarize_test_artifacts`
Parse `latest_ai.json` from a test run and produce a structured pass/fail summary with trends.
```json
{ "artifactsDir": "C:/Users/justi/mcp-servers/agent-ops-hub/tests/logs" }
```
Returns: `{ total, passed, failed, skipped, durationMs, trend }`

#### `execution_history_summary`
Scan a `runs/` directory for historical test results and compute pass rate trends.
```json
{ "runsDir": "C:/Users/justi/mcp-servers/agent-ops-hub/tests/logs/runs", "limit": 10 }
```
Returns: `{ runsAnalyzed, avgPassRate, trend: [{ stamp, passRate }] }`

#### `tag_test_results`
Save a tagged snapshot of `latest_ai.json` for milestone tracking.
```json
{ "logsDir": "C:/Users/justi/mcp-servers/agent-ops-hub/tests/logs", "tag": "v0.1.0-release", "outputDir": "C:/Users/justi/mcp-servers/agent-ops-hub/tests/logs/tagged" }
```
Returns: `{ tag, stamp, outputPath }`

---

### Server Comparison & Discovery

#### `list_local_mcp_servers`
List all MCP server directories under a root path.
```json
{ "rootPath": "C:/Users/justi/mcp-servers" }
```
Returns: `{ count, servers: [{ name, path, hasPackageJson, hasMcpServer }] }`

#### `compare_mcp_server_tools`
Diff the tool lists of two MCP servers — find additions, removals, shared tools.
```json
{ "serverA": "C:/Users/justi/mcp-servers/agent-ops-hub", "serverB": "C:/Users/justi/mcp-servers/os-bridge" }
```
Returns: `{ onlyInA: [...], onlyInB: [...], inBoth: [...] }`

#### `server_capability_matrix`
Compare tools, HTTP support, and prompts across multiple servers at once.
```json
{ "serverDirs": ["C:/Users/justi/mcp-servers/agent-ops-hub", "C:/Users/justi/mcp-servers/os-bridge"] }
```
Returns: `{ servers: [{ name, toolCount, hasHttp, promptCount }] }`

---

### Planning & Runbooks

#### `create_execution_runbook`
Generate a structured runbook JSON file for a multi-step agent workflow.
```json
{ "name": "quality-gate-demo", "steps": [{ "id": "s1", "action": "run_validation_gate", "params": {} }], "outputDir": "C:/Users/justi/mcp-servers/agent-ops-hub/artifacts/runbooks" }
```
Returns: `{ name, outputPath, stepCount }`

#### `diff_execution_plans`
Compare two runbook/plan JSON files and report structural differences.
```json
{ "planA": "C:/path/plan-v1.json", "planB": "C:/path/plan-v2.json" }
```
Returns: `{ added: [...], removed: [...], changed: [...] }`

#### `generate_test_scaffold`
Generate a test group folder with a `test.js` stub for a given tool name.
```json
{ "toolName": "my_new_tool", "outputDir": "C:/Users/justi/mcp-servers/agent-ops-hub/tests", "dryRun": false }
```
Returns: `{ toolName, outputPath, dryRun }`

#### `roadmap_tracker`
Read, write, or update tasks in a roadmap JSON file (phases → tasks structure).
```json
// Write a new roadmap:
{ "action": "write", "roadmapPath": "C:/path/roadmap.json", "roadmap": { "title": "...", "phases": [{ "id": "p1", "title": "Phase 1", "tasks": [{ "id": "t1", "title": "Task", "status": "pending" }] }] } }

// Read:
{ "action": "read", "roadmapPath": "C:/path/roadmap.json" }

// Update a task status:
{ "action": "update_task", "roadmapPath": "C:/path/roadmap.json", "phaseId": "p1", "taskId": "t1", "status": "done" }
```
Returns: `{ action, roadmapPath, totalTasks?, doneTasks?, completionPercent? }`

#### `generate_specialist_agent_roster`
Return a filtered roster from the built-in 40-role specialist catalog.
```json
{ "domains": ["ux", "quality", "security"], "includeStrengths": true, "maxRoles": 20 }
```
Returns: `{ totalCatalogRoles, selectedCount, byDomain, roles: [...] }`

#### `plan_specialist_assignments`
Build specialist pods for a goal and workstreams, with lead/support/reviewer assignments.
```json
{ "goal": "Improve UX and bug finding across MCP servers", "maxAgentsPerWorkstream": 4, "includeCrossReview": true }
```
Returns: `{ goal, podCount, pods: [{ podId, workstream, lead, support, reviewer, successCriteria }] }`

#### `build_collaboration_schedule`
Create a concurrent wave-based schedule from a specialist assignment plan.
```json
{ "plan": { "goal": "...", "pods": [] }, "sprintDays": 14, "maxParallelPods": 3 }
```
Returns: `{ waveCount, timeline: [...], handoffs: [...], recommendations: [...] }`

#### `research_improvement_ideas`
Run a web research pulse on MCP/AI/dev sources and extract ranked, actionable ideas.
```json
{ "urls": ["https://playwright.dev/docs/intro"], "keywords": ["agent", "workflow", "automation"], "topIdeas": 8 }
```
Returns: `{ scanned, scans: [...], ideas: [...], recommendations: [...] }`

#### `record_research_pulse`
Persist a research pulse snapshot and return suggested next run time.
```json
{ "pulse": { "scanned": 2, "ideas": [] }, "cadenceMinutes": 10 }
```
Returns: `{ outputPath, cadenceMinutes, nextSuggestedRunAt, topIdeaCount }`

---

### Release & Changelog

#### `generate_changelog_entry`
Run `git log` and generate a structured changelog entry for a version.
```json
{ "repoDir": "C:/Users/justi/mcp-servers/agent-ops-hub", "version": "0.1.0", "fromRef": "v0.0.1" }
```
Returns: `{ version, commitCount, changelog }`

#### `write_release_notes`
Generate release notes from git log, optionally writing to a file.
```json
{ "repoDir": "C:/Users/justi/mcp-servers/agent-ops-hub", "version": "0.1.0", "fromRef": "v0.0.1", "outputPath": "C:/Users/justi/mcp-servers/agent-ops-hub/RELEASE_NOTES.md" }
```
Returns: `{ version, date, commitCount, outputPath, notes }`

---

## 5 Prompts

### `agent_ops_workflow`
Get step-by-step guidance for using agent-ops-hub to orchestrate a complex goal.
```
Arguments: goal (optional) — describe your high-level objective
```

### `validation_strategy`  
Get recommended validation gate patterns, test ordering, and severity level guidance.
```
Arguments: serverName (optional) — name of the server being validated
```

### `specialist_team_blueprint`
Get a structured blueprint for running a software-company style specialist team (40-role catalog, pod planning, concurrent waves).
```
Arguments: goal (optional), teamSize (optional)
```

### `continuous_research_loop`
Get an operational playbook for nonstop improvement with recurring web research pulses and fast integration.
```
Arguments: goal (optional), cadenceMinutes (optional)
```

### `release_prep_checklist`
Full 10-step release preparation checklist: tests, changelog, version bump, tag, push.
```
Arguments: none required
```

---

## HTTP Endpoints (port 11200)

```
GET  http://127.0.0.1:11200/health  → { ok, version, tools, prompts, port }
POST http://127.0.0.1:11200/mcp     → same as stdio JSON-RPC; body: { jsonrpc, id, method, params }
```

---

## Running

```bash
cd agent-ops-hub
npm install
node mcp-server.js        # stdio mode
node tests/run-all.js     # run all 12 test groups
node --check mcp-server.js # syntax check
```
