# Agent Ops Hub Test Run
- Timestamp: 2026-05-04T03:34:35.403Z
- Node: v24.14.0
- Platform: win32 10.0.22631

## Summary
- Total: 11
- Passed: 11
- Failed: 0
- Skipped: 0
- Duration (ms): 6975

## Tests
- [PASS] group-a-capabilities (211 ms)
  - notes: discovered 27 tools and 106 local MCP folders
- [PASS] group-b-research (569 ms)
  - notes: research scanned 2 urls (success=2, errors=0)
- [PASS] group-c-runbooks (9 ms)
  - notes: runbook created at C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\runbooks-tests\quality-gate-demo-20260503_233429.json
- [PASS] group-d-validation-gates (2695 ms)
  - notes: validation gate: backward compat pass + severity-level warn-continues behavior verified
- [PASS] group-e-artifact-summary (7 ms)
  - notes: artifact summary produced expected failed-test signal; trend.runsAnalyzed=0
- [PASS] group-f-agent-mode (2838 ms)
  - notes: preflight=100, avgBenchmarkMs=1088
- [PASS] group-g-diff-plans (12 ms)
  - notes: diff found: +1 added, -1 removed, ~1 changed
- [PASS] group-h-scaffold (6 ms)
  - notes: scaffold generated (dry) and written to C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\scaffold-test\group-z-validation\test.js
- [PASS] group-i-compare-tools (12 ms)
  - notes: self: 37 tools identical; cross: +69 in os-bridge, -36 vs agent-ops-hub
- [PASS] group-j-new-tools (263 ms)
  - notes: validate_json_schema ✓, find_missing_tests (total=37, missing=37), code_quality_gate score=65 allPassed=true, roadmap_tracker ✓, scan_coverage=0/37
- [PASS] group-k-specialist-team (9 ms)
  - notes: specialist roster=40, pods=4, waves=2
