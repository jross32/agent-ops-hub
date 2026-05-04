# Agent Ops Hub Test Run
- Timestamp: 2026-05-04T03:57:16.427Z
- Node: v24.14.0
- Platform: win32 10.0.22631

## Summary
- Total: 15
- Passed: 15
- Failed: 0
- Skipped: 0
- Duration (ms): 7528

## Tests
- [PASS] group-a-capabilities (154 ms)
  - notes: discovered 38 tools and 106 local MCP folders
- [PASS] group-b-research (442 ms)
  - notes: research scanned 2 urls (success=2, errors=0)
- [PASS] group-c-runbooks (11 ms)
  - notes: runbook created at C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\runbooks-tests\quality-gate-demo-20260503_235709.json
- [PASS] group-d-validation-gates (2915 ms)
  - notes: validation gate: backward compat pass + severity-level warn-continues behavior verified
- [PASS] group-e-artifact-summary (6 ms)
  - notes: artifact summary produced expected failed-test signal; trend.runsAnalyzed=0
- [PASS] group-f-agent-mode (2166 ms)
  - notes: preflight=100, avgBenchmarkMs=742
- [PASS] group-g-diff-plans (11 ms)
  - notes: diff found: +1 added, -1 removed, ~1 changed
- [PASS] group-h-scaffold (4 ms)
  - notes: scaffold generated (dry) and written to C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\scaffold-test\group-z-validation\test.js
- [PASS] group-i-compare-tools (11 ms)
  - notes: self: 52 tools identical; cross: +69 in os-bridge, -51 vs agent-ops-hub
- [PASS] group-j-new-tools (198 ms)
  - notes: validate_json_schema ✓, find_missing_tests (total=52, missing=52), code_quality_gate score=43 allPassed=true, roadmap_tracker ✓, scan_coverage=0/52
- [PASS] group-k-specialist-team (7 ms)
  - notes: specialist roster=40, pods=4, waves=2
- [PASS] group-l-research-loop (623 ms)
  - notes: research pulse scanned=2, ideas=3, persisted=C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\research-pulses-tests\research-pulse-20260503_235715.json, cyclePods=3
- [PASS] group-m-media-tools (71 ms)
  - notes: media: svg generated + analyzed, video mode=fallback
- [PASS] group-n-skill-pack (329 ms)
  - notes: skill-pack manifest skills=12, docsIndexUrls=106
- [PASS] group-o-loop-controller (262 ms)
  - notes: loop controller: cyclesRun=2, totalCycles=2, snapshots=2
