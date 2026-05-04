# Agent Ops Hub Test Run
- Timestamp: 2026-05-04T07:22:42.374Z
- Node: v24.14.0
- Platform: win32 10.0.22631

## Summary
- Total: 16
- Passed: 16
- Failed: 0
- Skipped: 0
- Duration (ms): 13466

## Tests
- [PASS] group-a-capabilities (181 ms)
  - notes: discovered 44 tools and 106 local MCP folders
- [PASS] group-b-research (282 ms)
  - notes: research scanned 2 urls (success=2, errors=0)
- [PASS] group-c-runbooks (9 ms)
  - notes: runbook created at C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\runbooks-tests\quality-gate-demo-20260504_032229.json
- [PASS] group-d-validation-gates (2361 ms)
  - notes: validation gate: backward compat pass + severity-level warn-continues behavior verified
- [PASS] group-e-artifact-summary (5 ms)
  - notes: artifact summary produced expected failed-test signal; trend.runsAnalyzed=0
- [PASS] group-f-agent-mode (3572 ms)
  - notes: preflight=100, avgBenchmarkMs=908
- [PASS] group-g-diff-plans (8 ms)
  - notes: diff found: +1 added, -1 removed, ~1 changed
- [PASS] group-h-scaffold (4 ms)
  - notes: scaffold generated (dry) and written to C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\scaffold-test\group-z-validation\test.js
- [PASS] group-i-compare-tools (10 ms)
  - notes: self: 58 tools identical; cross: +69 in os-bridge, -57 vs agent-ops-hub
- [PASS] group-j-new-tools (318 ms)
  - notes: validate_json_schema ✓, find_missing_tests (total=58, missing=58), code_quality_gate score=33 allPassed=true, roadmap_tracker ✓, scan_coverage=0/58
- [PASS] group-k-specialist-team (9 ms)
  - notes: specialist roster=40, pods=4, waves=2
- [PASS] group-l-research-loop (488 ms)
  - notes: research pulse scanned=2, ideas=3, persisted=C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\research-pulses-tests\research-pulse-20260504_032236.json, cyclePods=3
- [PASS] group-m-media-tools (123 ms)
  - notes: media: svg generated + analyzed, video mode=fallback
- [PASS] group-n-skill-pack (222 ms)
  - notes: skill-pack manifest skills=12, docsIndexUrls=106
- [PASS] group-o-loop-controller (3490 ms)
  - notes: loop controller: cyclesRun=2, totalCycles=2, snapshots=2, quality=77
- [PASS] group-p-drift-sync-changelog (2048 ms)
  - notes: drift: severity=warning findings=1 | sync: repos=2 clean=1 | changelog: commits=10 from=(beginning) | rca: cause=assertion_error severity=high multiPatterns=3
