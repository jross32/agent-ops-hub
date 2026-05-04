# Agent Ops Hub Test Run
- Timestamp: 2026-05-04T03:45:28.115Z
- Node: v24.14.0
- Platform: win32 10.0.22631

## Summary
- Total: 14
- Passed: 14
- Failed: 0
- Skipped: 0
- Duration (ms): 8119

## Tests
- [PASS] group-a-capabilities (217 ms)
  - notes: discovered 35 tools and 106 local MCP folders
- [PASS] group-b-research (857 ms)
  - notes: research scanned 2 urls (success=2, errors=0)
- [PASS] group-c-runbooks (8 ms)
  - notes: runbook created at C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\runbooks-tests\quality-gate-demo-20260503_234521.json
- [PASS] group-d-validation-gates (2317 ms)
  - notes: validation gate: backward compat pass + severity-level warn-continues behavior verified
- [PASS] group-e-artifact-summary (5 ms)
  - notes: artifact summary produced expected failed-test signal; trend.runsAnalyzed=0
- [PASS] group-f-agent-mode (2154 ms)
  - notes: preflight=100, avgBenchmarkMs=637
- [PASS] group-g-diff-plans (8 ms)
  - notes: diff found: +1 added, -1 removed, ~1 changed
- [PASS] group-h-scaffold (3 ms)
  - notes: scaffold generated (dry) and written to C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\scaffold-test\group-z-validation\test.js
- [PASS] group-i-compare-tools (6 ms)
  - notes: self: 48 tools identical; cross: +69 in os-bridge, -47 vs agent-ops-hub
- [PASS] group-j-new-tools (141 ms)
  - notes: validate_json_schema ✓, find_missing_tests (total=48, missing=48), code_quality_gate score=49 allPassed=true, roadmap_tracker ✓, scan_coverage=0/48
- [PASS] group-k-specialist-team (6 ms)
  - notes: specialist roster=40, pods=4, waves=2
- [PASS] group-l-research-loop (1580 ms)
  - notes: research pulse scanned=2, ideas=3, persisted=C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\research-pulses-tests\research-pulse-20260503_234527.json, cyclePods=3
- [PASS] group-m-media-tools (82 ms)
  - notes: media: svg generated + analyzed, video mode=fallback
- [PASS] group-n-skill-pack (340 ms)
  - notes: skill-pack manifest skills=12, docsIndexUrls=106
