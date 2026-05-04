# Agent Ops Hub Test Run
- Timestamp: 2026-05-04T03:43:22.020Z
- Node: v24.14.0
- Platform: win32 10.0.22631

## Summary
- Total: 13
- Passed: 13
- Failed: 0
- Skipped: 0
- Duration (ms): 7883

## Tests
- [PASS] group-a-capabilities (162 ms)
  - notes: discovered 33 tools and 106 local MCP folders
- [PASS] group-b-research (441 ms)
  - notes: research scanned 2 urls (success=2, errors=0)
- [PASS] group-c-runbooks (9 ms)
  - notes: runbook created at C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\runbooks-tests\quality-gate-demo-20260503_234315.json
- [PASS] group-d-validation-gates (2605 ms)
  - notes: validation gate: backward compat pass + severity-level warn-continues behavior verified
- [PASS] group-e-artifact-summary (4 ms)
  - notes: artifact summary produced expected failed-test signal; trend.runsAnalyzed=0
- [PASS] group-f-agent-mode (3167 ms)
  - notes: preflight=100, avgBenchmarkMs=1109
- [PASS] group-g-diff-plans (14 ms)
  - notes: diff found: +1 added, -1 removed, ~1 changed
- [PASS] group-h-scaffold (5 ms)
  - notes: scaffold generated (dry) and written to C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\scaffold-test\group-z-validation\test.js
- [PASS] group-i-compare-tools (10 ms)
  - notes: self: 45 tools identical; cross: +69 in os-bridge, -44 vs agent-ops-hub
- [PASS] group-j-new-tools (244 ms)
  - notes: validate_json_schema ✓, find_missing_tests (total=45, missing=45), code_quality_gate score=52 allPassed=true, roadmap_tracker ✓, scan_coverage=0/45
- [PASS] group-k-specialist-team (14 ms)
  - notes: specialist roster=40, pods=4, waves=2
- [PASS] group-l-research-loop (757 ms)
  - notes: research pulse scanned=2, ideas=3, persisted=C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\research-pulses-tests\research-pulse-20260503_234321.json, cyclePods=3
- [PASS] group-m-media-tools (110 ms)
  - notes: media: svg generated + analyzed, video mode=fallback
