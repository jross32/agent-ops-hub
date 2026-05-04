# Agent Ops Hub Test Run
- Timestamp: 2026-05-04T07:46:26.872Z
- Node: v24.14.0
- Platform: win32 10.0.22631

## Summary
- Total: 17
- Passed: 17
- Failed: 0
- Skipped: 0
- Duration (ms): 9368

## Tests
- [PASS] group-a-capabilities (166 ms)
  - notes: discovered 55 tools and 106 local MCP folders
- [PASS] group-b-research (310 ms)
  - notes: research scanned 2 urls (success=2, errors=0)
- [PASS] group-c-runbooks (6 ms)
  - notes: runbook created at C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\runbooks-tests\quality-gate-demo-20260504_034618.json
- [PASS] group-d-validation-gates (1454 ms)
  - notes: validation gate: backward compat pass + severity-level warn-continues behavior verified
- [PASS] group-e-artifact-summary (4 ms)
  - notes: artifact summary produced expected failed-test signal; trend.runsAnalyzed=0
- [PASS] group-f-agent-mode (2276 ms)
  - notes: preflight=100, avgBenchmarkMs=783
- [PASS] group-g-diff-plans (9 ms)
  - notes: diff found: +1 added, -1 removed, ~1 changed
- [PASS] group-h-scaffold (4 ms)
  - notes: scaffold generated (dry) and written to C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\scaffold-test\group-z-validation\test.js
- [PASS] group-i-compare-tools (12 ms)
  - notes: self: 90 tools identical; cross: +69 in os-bridge, -89 vs agent-ops-hub
- [PASS] group-j-new-tools (210 ms)
  - notes: validate_json_schema ✓, find_missing_tests (total=90, missing=90), code_quality_gate score=2 allPassed=true, roadmap_tracker ✓, scan_coverage=0/90
- [PASS] group-k-specialist-team (10 ms)
  - notes: specialist roster=40, pods=4, waves=2
- [PASS] group-l-research-loop (507 ms)
  - notes: research pulse scanned=2, ideas=3, persisted=C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\research-pulses-tests\research-pulse-20260504_034622.json, cyclePods=3
- [PASS] group-m-media-tools (60 ms)
  - notes: media: svg generated + analyzed, video mode=fallback
- [PASS] group-n-skill-pack (236 ms)
  - notes: skill-pack manifest skills=12, docsIndexUrls=106
- [PASS] group-o-loop-controller (2222 ms)
  - notes: loop controller: cyclesRun=2, totalCycles=2, snapshots=2, quality=77
- [PASS] group-p-drift-sync-changelog (1483 ms)
  - notes: drift: severity=warning findings=1 | sync: repos=2 clean=1 | changelog: commits=20 from=(beginning) | rca: cause=assertion_error severity=high multiPatterns=3
- [PASS] group-q-specialist-execution (20 ms)
