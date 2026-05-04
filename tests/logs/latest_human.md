# agent-ops-hub v1.0.0 Full Tool Test Report
**Date:** 2026-05-04T11:23:46.307Z

## Summary
| Metric | Value |
|--------|-------|
| Total Tests | 74 |
| ✅ Passed | 74 |
| ❌ Failed | 0 |
| ⏭️ Skipped | 0 |
| Pass Rate | 100% |

## Results
✅ `check_server_health` — health check
✅ `list_local_mcp_servers` — list local servers
✅ `agent_mode_preflight` — agent mode preflight
✅ `semantic_tool_search` — semantic tool search
✅ `tool_dependency_graph` — tool dependency graph
✅ `code_complexity_scan` — code complexity scan
✅ `estimate_refactor_risk` — estimate refactor risk
✅ `compare_server_capabilities` — compare server capabilities
✅ `research_agent_patterns` — research agent patterns
✅ `research_improvement_ideas` — research improvement ideas
✅ `create_execution_runbook` — create execution runbook
✅ `run_validation_gate` — run validation gate
✅ `benchmark_validation_gate` — benchmark validation gate
✅ `summarize_test_artifacts` — summarize test artifacts
✅ `diff_execution_plans` — diff execution plans
✅ `generate_test_scaffold` — generate test scaffold
✅ `dispatch_specialist_task` — dispatch specialist task
✅ `dispatch_specialist_task` — dispatch — security_engineer
✅ `run_parallel_specialist_sprint` — run parallel sprint (design adversarial_review)
✅ `specialist_work_log` — specialist work log
✅ `get_sprint_quality_trend` — get sprint quality trend
✅ `set_memory` — set memory (roadmap.version)
✅ `get_memory` — get memory (roadmap.version)
✅ `append_memory` — append memory (roadmap.completedItems)
✅ `append_memory` — append memory (2nd item)
✅ `get_memory` — get memory (completedItems array)
✅ `set_memory` — set nested memory
✅ `get_memory` — get nested memory
✅ `get_memory` — get missing key
✅ `list_memory_keys` — list memory keys (top-level)
✅ `list_memory_keys` — list memory keys (prefix)
✅ `clear_memory` — clear memory (specific key)
✅ `get_memory` — get memory (after clear)
✅ `adversarial_review` — basic adversarial review
✅ `adversarial_review` — adversarial review — plan text
✅ `adversarial_review` — adversarial review — diff text
✅ `auto_implement_plan` — auto-implement dry run
✅ `auto_implement_plan` — auto-implement apply
✅ `auto_implement_plan` — file actually changed
✅ `auto_implement_plan` — auto-implement with bad find (no match)
✅ `auto_implement_plan` — nonexistent file errors
✅ `auto_implement_plan` — path traversal blocked
✅ `scrape_research_url` — scrape research url (example.com)
✅ `scrape_research_url` — scrape with save=true
✅ `scrape_research_url` — scrape bad url (should error)
✅ `register_tool` — register a dynamic tool
✅ `test_dynamic_tool` — call registered dynamic tool
✅ `register_tool` — duplicate rejected
✅ `register_tool` — bad syntax rejected
✅ `unregister_tool` — unregister dynamic tool
✅ `unregister_tool` — unregistered tool fails
✅ `unregister_tool` — core tool protected
✅ `execute_dependency_graph` — linear 2-node graph
✅ `execute_dependency_graph` — parallel 2-node graph (no edges)
✅ `execute_dependency_graph` — diamond graph (a→b, a→c, b→d, c→d)
✅ `execute_dependency_graph` — cycle detection (a→b, b→a)
✅ `execute_dependency_graph` — stopOnError=true halts on fail
✅ `load_skill_pack` — load skill pack
✅ `sp_greet` — call sp_greet from skill pack
✅ `sp_add` — call sp_add from skill pack
✅ `list_loaded_skill_packs` — list loaded skill packs
✅ `load_skill_pack` — duplicate pack rejected
✅ `unload_skill_pack` — unload skill pack
✅ `unload_skill_pack` — nonexistent pack errors
✅ `list_available_servers` — list available servers
✅ `list_available_servers` — list available servers (with health check)
✅ `delegate_to_server` — delegate to self (get_memory)
✅ `delegate_to_server` — bad server errors
✅ `spawn_child_server` — spawn child server
✅ `list_available_servers` — list available servers (child running)
✅ `stop_child_server` — stop child server
✅ `stop_child_server` — bad server stop errors
✅ `evaluate_sprint_output` — evaluate sprint output
✅ `synthesize_sprint_outputs` — synthesize sprint outputs