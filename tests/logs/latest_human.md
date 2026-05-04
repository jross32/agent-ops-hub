# Agent Ops Hub Test Run
- Timestamp: 2026-05-04T03:59:44.074Z
- Node: v24.14.0
- Platform: win32 10.0.22631

## Summary
- Total: 15
- Passed: 15
- Failed: 0
- Skipped: 0
- Duration (ms): 11993

## Tests
- [PASS] group-a-capabilities (195 ms)
  - notes: discovered 40 tools and 106 local MCP folders
- [PASS] group-b-research (363 ms)
  - notes: research scanned 2 urls (success=2, errors=0)
- [PASS] group-c-runbooks (16 ms)
  - notes: runbook created at C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\runbooks-tests\quality-gate-demo-20260503_235932.json
- [PASS] group-d-validation-gates (2862 ms)
  - notes: validation gate: backward compat pass + severity-level warn-continues behavior verified
- [PASS] group-e-artifact-summary (4 ms)
  - notes: artifact summary produced expected failed-test signal; trend.runsAnalyzed=0
- [PASS] group-f-agent-mode (2243 ms)
  - notes: preflight=100, avgBenchmarkMs=855
- [PASS] group-g-diff-plans (10 ms)
  - notes: diff found: +1 added, -1 removed, ~1 changed
- [PASS] group-h-scaffold (5 ms)
  - notes: scaffold generated (dry) and written to C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\scaffold-test\group-z-validation\test.js
- [PASS] group-i-compare-tools (10 ms)
  - notes: self: 54 tools identical; cross: +69 in os-bridge, -53 vs agent-ops-hub
- [PASS] group-j-new-tools (201 ms)
  - notes: validate_json_schema ✓, find_missing_tests (total=54, missing=54), code_quality_gate score=41 allPassed=true, roadmap_tracker ✓, scan_coverage=0/54
- [PASS] group-k-specialist-team (8 ms)
  - notes: specialist roster=40, pods=4, waves=2
- [PASS] group-l-research-loop (631 ms)
  - notes: research pulse scanned=2, ideas=3, persisted=C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\research-pulses-tests\research-pulse-20260503_235938.json, cyclePods=3
- [PASS] group-m-media-tools (171 ms)
  - notes: media: svg generated + analyzed, video mode=fallback
- [PASS] group-n-skill-pack (505 ms)
  - notes: skill-pack manifest skills=12, docsIndexUrls=106
- [PASS] group-o-loop-controller (4397 ms)
  - notes: loop controller: cyclesRun=2, totalCycles=2, snapshots=2, quality=77
