# Agent Ops Hub Test Run
- Timestamp: 2026-05-04T03:37:21.295Z
- Node: v24.14.0
- Platform: win32 10.0.22631

## Summary
- Total: 12
- Passed: 12
- Failed: 0
- Skipped: 0
- Duration (ms): 7491

## Tests
- [PASS] group-a-capabilities (167 ms)
  - notes: discovered 29 tools and 106 local MCP folders
- [PASS] group-b-research (1029 ms)
  - notes: research scanned 2 urls (success=2, errors=0)
- [PASS] group-c-runbooks (9 ms)
  - notes: runbook created at C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\runbooks-tests\quality-gate-demo-20260503_233715.json
- [PASS] group-d-validation-gates (2581 ms)
  - notes: validation gate: backward compat pass + severity-level warn-continues behavior verified
- [PASS] group-e-artifact-summary (7 ms)
  - notes: artifact summary produced expected failed-test signal; trend.runsAnalyzed=0
- [PASS] group-f-agent-mode (2480 ms)
  - notes: preflight=100, avgBenchmarkMs=689
- [PASS] group-g-diff-plans (8 ms)
  - notes: diff found: +1 added, -1 removed, ~1 changed
- [PASS] group-h-scaffold (3 ms)
  - notes: scaffold generated (dry) and written to C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\scaffold-test\group-z-validation\test.js
- [PASS] group-i-compare-tools (5 ms)
  - notes: self: 40 tools identical; cross: +69 in os-bridge, -39 vs agent-ops-hub
- [PASS] group-j-new-tools (180 ms)
  - notes: validate_json_schema ✓, find_missing_tests (total=40, missing=40), code_quality_gate score=60 allPassed=true, roadmap_tracker ✓, scan_coverage=0/40
- [PASS] group-k-specialist-team (10 ms)
  - notes: specialist roster=40, pods=4, waves=2
- [PASS] group-l-research-loop (662 ms)
  - notes: research pulse scanned=2, ideas=3, persisted=C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\research-pulses-tests\research-pulse-20260503_233721.json
