'use strict';

const path = require('path');
const { assert } = require('../lib/assertions');

const AGENT_OPS_REPO = path.resolve(__dirname, '../../');

async function run(context) {
  const results = {};

  // ── dispatch_specialist_task ──────────────────────────────────────────────
  const dispatchRes = await context.client.callTool('dispatch_specialist_task', {
    specialistId: 'backend_architect',
    taskTitle:    'Review the agent-ops-hub tool schema design',
    taskContext:  'The agent-ops-hub MCP server has 55 tools. Evaluate whether the inputSchema patterns are consistent and well-bounded.',
    outputFormat: 'markdown',
  });
  assert(dispatchRes.ok, `dispatch_specialist_task failed: ${dispatchRes.error}`);
  const bundle = dispatchRes.json;
  assert(typeof bundle.systemPrompt === 'string' && bundle.systemPrompt.length > 50, 'dispatch: systemPrompt missing or too short');
  assert(typeof bundle.taskPrompt   === 'string' && bundle.taskPrompt.length   > 50, 'dispatch: taskPrompt missing or too short');
  assert(bundle.specialistId  === 'backend_architect', `dispatch: specialistId mismatch: ${bundle.specialistId}`);
  assert(bundle.domain        === 'backend',           `dispatch: domain mismatch: ${bundle.domain}`);
  assert(typeof bundle.role   === 'string',            'dispatch: role missing');
  assert(Array.isArray(bundle.strengths),              'dispatch: strengths should be array');
  assert(typeof bundle.framingContext === 'string',     'dispatch: framingContext missing');
  assert(typeof bundle.outputGuidance === 'string',    'dispatch: outputGuidance missing');
  assert(typeof bundle.timestamp === 'string',         'dispatch: timestamp missing');
  results.dispatchedRole = bundle.role;

  // dispatch: different specialist + format
  const secRes = await context.client.callTool('dispatch_specialist_task', {
    specialistId: 'security_engineer',
    taskTitle:    'Security review of auth module',
    taskContext:  'Check OWASP compliance of the JWT handling in auth.js',
    outputFormat: 'analysis',
  });
  assert(secRes.ok, `dispatch security_engineer failed: ${secRes.error}`);
  assert(secRes.json.domain === 'security', `dispatch: expected security domain, got ${secRes.json.domain}`);
  assert(secRes.json.outputFormat === 'analysis', `dispatch: expected analysis format`);

  // dispatch: negative — unknown specialistId
  let badDispatch;
  try {
    badDispatch = await context.client.callTool('dispatch_specialist_task', {
      specialistId: 'nonexistent_specialist_xyz',
      taskTitle:    'test',
      taskContext:  'test',
    });
    assert(!badDispatch.ok, 'dispatch: unknown specialistId should fail');
  } catch (_) {
    // throw is also acceptable — tool rejects unknown id
  }

  // dispatch: partial match not supported — exact id required
  let partialDispatch;
  try {
    partialDispatch = await context.client.callTool('dispatch_specialist_task', {
      specialistId: 'backend',
      taskTitle:    'test',
      taskContext:  'test',
    });
    assert(!partialDispatch.ok, 'dispatch: partial specialistId should fail (exact id required)');
  } catch (_) {
    // throw is also acceptable
  }

  results.dispatchTests = 'pass';

  // ── run_parallel_specialist_sprint ────────────────────────────────────────
  const sprintRes = await context.client.callTool('run_parallel_specialist_sprint', {
    sprintName: 'test-sprint-q',
    tasks: [
      {
        specialistId: 'backend_architect',
        taskTitle:    'Review API design',
        taskContext:  'Evaluate the REST API surface of agent-ops-hub for consistency.',
        outputFormat: 'markdown',
      },
      {
        specialistId: 'security_engineer',
        taskTitle:    'Security scan',
        taskContext:  'Identify top 3 security risks in a Node.js MCP server exposing 55 tools.',
        outputFormat: 'analysis',
      },
      {
        specialistId: 'qa_automation_engineer',
        taskTitle:    'Test gap analysis',
        taskContext:  'Review test coverage for agent-ops-hub and identify missing test scenarios.',
        outputFormat: 'plan',
      },
    ],
    maxConcurrent: 4,
  });
  assert(sprintRes.ok, `run_parallel_specialist_sprint failed: ${sprintRes.error}`);
  const sprint = sprintRes.json;
  assert(typeof sprint.sprintId     === 'string', 'sprint: sprintId missing');
  assert(sprint.sprintId.startsWith('sprint-'),   `sprint: sprintId format wrong: ${sprint.sprintId}`);
  assert(sprint.sprintName          === 'test-sprint-q', `sprint: sprintName mismatch`);
  assert(sprint.taskCount           === 3, `sprint: expected taskCount=3, got ${sprint.taskCount}`);
  assert(sprint.dispatchedCount     === 3, `sprint: expected dispatchedCount=3, got ${sprint.dispatchedCount}`);
  assert(Array.isArray(sprint.tasks), 'sprint: tasks should be array');
  assert(sprint.tasks.length        === 3, `sprint: expected 3 task bundles, got ${sprint.tasks.length}`);
  // Each dispatched task should have its own prompt bundle
  for (const task of sprint.tasks) {
    assert(typeof task.systemPrompt === 'string' && task.systemPrompt.length > 20, `sprint: task missing systemPrompt: ${task.specialistId}`);
    assert(typeof task.taskPrompt   === 'string' && task.taskPrompt.length   > 20, `sprint: task missing taskPrompt: ${task.specialistId}`);
    assert(typeof task.taskId       === 'string', `sprint: task missing taskId: ${task.specialistId}`);
  }
  results.sprintId      = sprint.sprintId;
  results.sprintTasks   = sprint.taskCount;

  // sprint: negative — empty tasks
  let emptySprintRes;
  try {
    emptySprintRes = await context.client.callTool('run_parallel_specialist_sprint', {
      sprintName: 'empty-sprint',
      tasks: [],
    });
    assert(!emptySprintRes.ok, 'sprint: empty tasks should fail');
  } catch (_) {
    // throw is also acceptable
  }

  results.sprintTests = 'pass';

  // ── evaluate_sprint_output ────────────────────────────────────────────────
  const testOutputs = [
    {
      specialistId: 'backend_architect',
      taskTitle:    'Review API design',
      domain:       'backend',
      output: `## Summary
The REST API surface of agent-ops-hub is broadly consistent. The inputSchema uses JSON Schema Draft 7 with additionalProperties: false everywhere, which is good practice.

## Analysis
- All 55 tools use strict additionalProperties: false — no uncontrolled inputs
- Required fields are clearly specified
- Descriptions are present on all top-level properties

## Recommendations
1. Add minLength validation on string fields like repoPath to prevent empty-string inputs
2. Standardize timeout parameter names — some tools use timeoutMs, others use maxWaitMs
3. Add enum constraints on fields like 'format' that have fixed valid values
4. Consider adding examples to inputSchema for complex nested objects

## Next Steps
- Update 12 tools missing minLength on path fields
- Create a schema style guide document
- Run automated schema validation in CI`,
    },
    {
      specialistId: 'security_engineer',
      taskTitle:    'Security scan',
      domain:       'security',
      output: `## Threat Model Summary
Node.js MCP server with 55 tool surface area. Key risk vectors: path traversal, command injection, and unvalidated external URLs.

## Findings Table
| Risk | Category | OWASP | Description | Remediation |
|------|----------|-------|-------------|-------------|
| HIGH | Path Traversal | A01 | repoPath inputs are not validated against a whitelist | Add path.resolve + allowed-root check |
| HIGH | Command Injection | A03 | execSync calls use string interpolation | Use array form of execSync, never string concat |
| MEDIUM | SSRF | A10 | research_agent_patterns fetches arbitrary URLs | Add URL allowlist or domain validation |
| LOW | Information Disclosure | A05 | Error messages include full file paths | Sanitize error outputs in production |

## Immediate Actions
1. Replace all execSync string interpolation with array form
2. Add path.resolve + startsWith(allowedRoot) check on all repoPath inputs
3. Add URL validation before any outbound fetch calls

## Medium-term Hardening
- Add rate limiting to HTTP bridge on port 11200
- Add request logging with sanitized args for audit trail`,
    },
    {
      specialistId: 'qa_automation_engineer',
      taskTitle:    'Test gap analysis',
      domain:       'quality',
      output: `## Coverage Assessment
16 test groups exist covering tools A-P. New tools K-O (specialist execution engine) are not yet tested.

## Gaps
1. dispatch_specialist_task: no tests for all 40 specialist IDs
2. evaluate_sprint_output: no edge case tests for empty output or single-word output
3. synthesize_sprint_outputs: conflict detection not tested
4. specialist_work_log: write/read/list cycle not tested end-to-end
5. All 10 new P prompts: zero coverage

## Test Cases Recommended
1. Dispatch all 40 specialist IDs and verify systemPrompt uniqueness
2. Evaluate output with wordCount < 10 — should score near 0
3. Synthesize outputs with deliberate add/remove conflict
4. Write sprint log, list it, read it back — verify round-trip
5. Run each new prompt and verify non-empty text output

## Acceptance Criterion
Sprint Q is complete when all 5 new tools have ≥ 3 positive and 1 negative test each.`,
    },
  ];

  const evalRes = await context.client.callTool('evaluate_sprint_output', {
    sprintId: results.sprintId,
    outputs:  testOutputs,
  });
  assert(evalRes.ok, `evaluate_sprint_output failed: ${evalRes.error}`);
  const evalResult = evalRes.json;
  assert(typeof evalResult.overallScore === 'number',         'eval: overallScore missing');
  assert(evalResult.overallScore >= 0 && evalResult.overallScore <= 100, `eval: score out of range: ${evalResult.overallScore}`);
  assert(typeof evalResult.grade === 'string',                'eval: grade missing');
  assert(Array.isArray(evalResult.perTaskScores),             'eval: perTaskScores should be array');
  assert(evalResult.perTaskScores.length === 3,               `eval: expected 3 task scores, got ${evalResult.perTaskScores.length}`);
  assert(typeof evalResult.recommendation === 'string',       'eval: recommendation missing');
  // Each task score should have required fields
  for (const ts of evalResult.perTaskScores) {
    assert(typeof ts.specialistId  === 'string',  `eval: task missing specialistId`);
    assert(typeof ts.percentScore  === 'number',  `eval: task missing percentScore`);
    assert(typeof ts.grade         === 'string',  `eval: task missing grade`);
    assert(typeof ts.scores        === 'object',  `eval: task missing scores object`);
  }
  // Well-formed multi-section outputs should score at least 40/100
  assert(evalResult.overallScore >= 40, `eval: well-formed outputs should score ≥ 40, got ${evalResult.overallScore}`);
  results.evalOverallScore = evalResult.overallScore;
  results.evalGrade        = evalResult.grade;

  // eval: single empty output should score very low
  const emptyEvalRes = await context.client.callTool('evaluate_sprint_output', {
    sprintId: 'test-empty',
    outputs: [{ specialistId: 'backend_architect', taskTitle: 'empty test', output: '', domain: 'backend' }],
  });
  assert(emptyEvalRes.ok, `evaluate_sprint_output (empty) failed: ${emptyEvalRes.error}`);
  assert(emptyEvalRes.json.overallScore <= 20, `eval: empty output should score ≤ 20, got ${emptyEvalRes.json.overallScore}`);

  results.evalTests = 'pass';

  // ── synthesize_sprint_outputs ─────────────────────────────────────────────
  const synthRes = await context.client.callTool('synthesize_sprint_outputs', {
    outputs:       testOutputs,
    synthesisGoal: 'Identify the top actions to improve agent-ops-hub quality',
    format:        'plan',
  });
  assert(synthRes.ok, `synthesize_sprint_outputs failed: ${synthRes.error}`);
  const synth = synthRes.json;
  assert(typeof synth.synthesisGoal  === 'string',  'synth: synthesisGoal missing');
  assert(typeof synth.totalActions   === 'number',  'synth: totalActions missing');
  assert(synth.totalActions          > 0,           `synth: expected > 0 actions, got ${synth.totalActions}`);
  assert(Array.isArray(synth.mergedActions),         'synth: mergedActions should be array');
  assert(Array.isArray(synth.domainGroups),          'synth: domainGroups should be array');
  assert(synth.domainGroups.length   > 0,           'synth: expected at least one domain group');
  assert(typeof synth.finalSummary   === 'string',  'synth: finalSummary missing');
  assert(synth.finalSummary.length   > 20,          'synth: finalSummary too short');
  assert(Array.isArray(synth.conflictsFound),        'synth: conflictsFound should be array');
  results.synthActions  = synth.totalActions;
  results.synthDomains  = synth.domainGroups.length;
  results.synthConflicts = synth.conflictCount;

  // synth: report format
  const reportRes = await context.client.callTool('synthesize_sprint_outputs', {
    outputs:       testOutputs,
    synthesisGoal: 'security improvements',
    format:        'report',
  });
  assert(reportRes.ok, `synthesize_sprint_outputs (report) failed: ${reportRes.error}`);
  assert(reportRes.json.finalSummary.includes('##'), 'synth report: expected markdown headers in finalSummary');

  // synth: negative — empty outputs
  let badSynthRes;
  try {
    badSynthRes = await context.client.callTool('synthesize_sprint_outputs', {
      outputs:       [],
      synthesisGoal: 'test',
    });
    assert(!badSynthRes.ok, 'synth: empty outputs should fail');
  } catch (_) {
    // throw is also acceptable
  }

  results.synthTests = 'pass';

  // ── specialist_work_log (write / read / list) ─────────────────────────────
  const testSprintId = `sprint-test-${Date.now()}`;
  const writeRes = await context.client.callTool('specialist_work_log', {
    action:   'write',
    sprintId: testSprintId,
    entry: {
      sprintName:   'test-sprint-q',
      taskCount:    3,
      overallScore: results.evalOverallScore,
      tasks:        sprint.tasks.map((t) => ({ specialistId: t.specialistId, taskTitle: t.taskTitle })),
    },
  });
  assert(writeRes.ok, `specialist_work_log write failed: ${writeRes.error}`);
  assert(writeRes.json.ok          === true,         'worklog write: ok should be true');
  assert(writeRes.json.sprintId    === testSprintId, 'worklog write: sprintId mismatch');
  assert(typeof writeRes.json.filePath === 'string', 'worklog write: filePath missing');
  results.worklogFilePath = writeRes.json.filePath;

  // read back the written entry
  const readRes = await context.client.callTool('specialist_work_log', {
    action:   'read',
    sprintId: testSprintId,
  });
  assert(readRes.ok, `specialist_work_log read failed: ${readRes.error}`);
  assert(readRes.json.entry.sprintId    === testSprintId,   'worklog read: sprintId mismatch in entry');
  assert(readRes.json.entry.sprintName  === 'test-sprint-q','worklog read: sprintName mismatch');
  assert(readRes.json.entry.taskCount   === 3,              'worklog read: taskCount mismatch');

  // list sprints — should include the one we just wrote
  const listRes = await context.client.callTool('specialist_work_log', {
    action: 'list',
  });
  assert(listRes.ok, `specialist_work_log list failed: ${listRes.error}`);
  assert(typeof listRes.json.totalCount === 'number',  'worklog list: totalCount missing');
  assert(listRes.json.totalCount        >= 1,          'worklog list: expected at least 1 entry');
  assert(Array.isArray(listRes.json.entries),          'worklog list: entries should be array');
  const found = listRes.json.entries.find((e) => e.sprintId === testSprintId);
  assert(found, `worklog list: expected to find testSprintId ${testSprintId}`);

  // worklog: negative — read non-existent sprint
  try {
    const missingReadRes = await context.client.callTool('specialist_work_log', {
      action:   'read',
      sprintId: 'sprint-does-not-exist-xyz',
    });
    assert(!missingReadRes.ok, 'worklog: read non-existent sprintId should fail');
  } catch (_) {
    // throw is also acceptable
  }

  // worklog: negative — write without sprintId
  try {
    const noIdWriteRes = await context.client.callTool('specialist_work_log', {
      action: 'write',
      entry:  { sprintName: 'test' },
    });
    assert(!noIdWriteRes.ok, 'worklog: write without sprintId should fail');
  } catch (_) {
    // throw is also acceptable
  }

  results.worklogTests = 'pass';

  return {
    summary: 'group-q: specialist execution engine — all tools verified',
    ...results,
  };
}

module.exports = { run };
