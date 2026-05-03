# Agent Ops Hub Test Run
- Timestamp: 2026-05-03T15:31:47.588Z
- Node: v24.14.0
- Platform: win32 10.0.22631

## Summary
- Total: 9
- Passed: 9
- Failed: 0
- Skipped: 0
- Duration (ms): 6403

## Tests
- [PASS] group-a-capabilities (51 ms)
  - notes: discovered 11 tools and 4 local MCP folders
- [PASS] group-b-research (359 ms)
  - notes: research scanned 2 urls (success=2, errors=0)
- [PASS] group-c-runbooks (8 ms)
  - notes: runbook created at C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\runbooks-tests\quality-gate-demo-20260503_113141.json
- [PASS] group-d-validation-gates (2550 ms)
  - notes: validation gate: backward compat pass + severity-level warn-continues behavior verified
- [PASS] group-e-artifact-summary (9 ms)
  - notes: artifact summary produced expected failed-test signal; trend.runsAnalyzed=0
- [PASS] group-f-agent-mode (3151 ms)
  - notes: preflight=100, avgBenchmarkMs=1040
- [PASS] group-g-diff-plans (13 ms)
  - notes: diff found: +1 added, -1 removed, ~1 changed
- [PASS] group-h-scaffold (5 ms)
  - notes: scaffold generated (dry) and written to C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\scaffold-test\group-z-validation\test.js
- [PASS] group-i-compare-tools (7 ms)
  - notes: self: 12 tools identical; cross: +43 in os-bridge, -12 vs agent-ops-hub
