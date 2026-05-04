# Agent Ops Hub Test Run
- Timestamp: 2026-05-04T03:21:53.990Z
- Node: v24.14.0
- Platform: win32 10.0.22631

## Summary
- Total: 10
- Passed: 10
- Failed: 0
- Skipped: 0
- Duration (ms): 4862

## Tests
- [PASS] group-a-capabilities (125 ms)
  - notes: discovered 24 tools and 105 local MCP folders
- [PASS] group-b-research (485 ms)
  - notes: research scanned 2 urls (success=2, errors=0)
- [PASS] group-c-runbooks (7 ms)
  - notes: runbook created at C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\runbooks-tests\quality-gate-demo-20260503_232150.json
- [PASS] group-d-validation-gates (1733 ms)
  - notes: validation gate: backward compat pass + severity-level warn-continues behavior verified
- [PASS] group-e-artifact-summary (5 ms)
  - notes: artifact summary produced expected failed-test signal; trend.runsAnalyzed=0
- [PASS] group-f-agent-mode (1971 ms)
  - notes: preflight=100, avgBenchmarkMs=626
- [PASS] group-g-diff-plans (8 ms)
  - notes: diff found: +1 added, -1 removed, ~1 changed
- [PASS] group-h-scaffold (4 ms)
  - notes: scaffold generated (dry) and written to C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\scaffold-test\group-z-validation\test.js
- [PASS] group-i-compare-tools (6 ms)
  - notes: self: 30 tools identical; cross: +69 in os-bridge, -29 vs agent-ops-hub
- [PASS] group-j-new-tools (165 ms)
  - notes: validate_json_schema ✓, find_missing_tests (total=30, missing=30), code_quality_gate score=72 allPassed=true, roadmap_tracker ✓, scan_coverage=0/30
