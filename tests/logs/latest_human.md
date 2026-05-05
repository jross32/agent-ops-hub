# Agent Ops Hub Test Run
- Timestamp: 2026-05-05T10:36:34.695Z
- Node: v24.14.0
- Platform: win32 10.0.22631

## Summary
- Total: 18
- Passed: 18
- Failed: 0
- Skipped: 0
- Duration (ms): 18291

## Tests
- [PASS] group-a-capabilities (237 ms)
  - notes: discovered 81 tools and 106 local MCP folders
- [PASS] group-b-research (391 ms)
  - notes: research scanned 2 urls (success=2, errors=0)
- [PASS] group-c-runbooks (9 ms)
  - notes: runbook created at C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\runbooks-tests\quality-gate-demo-20260505_063617.json
- [PASS] group-d-validation-gates (3080 ms)
  - notes: validation gate: backward compat pass + severity-level warn-continues behavior verified
- [PASS] group-e-artifact-summary (4 ms)
  - notes: artifact summary produced expected failed-test signal; trend.runsAnalyzed=0
- [PASS] group-f-agent-mode (3258 ms)
  - notes: preflight=100, avgBenchmarkMs=1291
- [PASS] group-g-diff-plans (13 ms)
  - notes: diff found: +1 added, -1 removed, ~1 changed
- [PASS] group-h-scaffold (5 ms)
  - notes: scaffold generated (dry) and written to C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\scaffold-test\group-z-validation\test.js
- [PASS] group-i-compare-tools (19 ms)
  - notes: self: 115 tools identical; cross: +69 in os-bridge, -114 vs agent-ops-hub
- [PASS] group-j-new-tools (321 ms)
  - notes: validate_json_schema ✓, find_missing_tests (total=115, missing=115), code_quality_gate score=0 allPassed=true, roadmap_tracker ✓, scan_coverage=0/115
- [PASS] group-k-specialist-team (11 ms)
  - notes: specialist roster=40, pods=4, waves=2
- [PASS] group-l-research-loop (1126 ms)
  - notes: research pulse scanned=2, ideas=3, persisted=C:\Users\justi\mcp-servers\agent-ops-hub\artifacts\research-pulses-tests\research-pulse-20260505_063625.json, cyclePods=3
- [PASS] group-m-media-tools (162 ms)
  - notes: media: svg generated + analyzed, video mode=fallback
- [PASS] group-n-skill-pack (353 ms)
  - notes: skill-pack manifest skills=12, docsIndexUrls=106
- [PASS] group-o-loop-controller (3235 ms)
  - notes: loop controller: cyclesRun=2, totalCycles=2, snapshots=2, quality=77
- [PASS] group-p-drift-sync-changelog (2017 ms)
  - notes: drift: severity=warning findings=1 | sync: repos=2 clean=1 | changelog: commits=20 from=(beginning) | rca: cause=assertion_error severity=high multiPatterns=3
- [PASS] group-q-specialist-execution (27 ms)
- [PASS] group-r-http-chat (3615 ms)
  - notes: HTTP chat now degrades cleanly without Claude2 and returns real replies via MCP sampling when a capable client is connected
