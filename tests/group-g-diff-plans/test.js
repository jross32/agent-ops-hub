'use strict';

const fs = require('fs');
const path = require('path');
const { assert } = require('../lib/assertions');

async function run(context) {
  // Create two runbooks first, then diff them
  const outputDir = path.join(context.rootDir, 'artifacts', 'diff-test');

  const rb1 = await context.client.callTool('create_execution_runbook', {
    name: 'diff-base',
    objective: 'baseline plan',
    outputDir,
    steps: [
      { id: 'step-a', title: 'Step A', command: 'node --version' },
      { id: 'step-b', title: 'Step B', command: 'npm --version' },
    ],
  });
  assert(rb1.ok && rb1.json.created, 'baseline runbook creation failed');

  const rb2 = await context.client.callTool('create_execution_runbook', {
    name: 'diff-revised',
    objective: 'revised plan with changes',
    outputDir,
    steps: [
      { id: 'step-a', title: 'Step A Modified', command: 'node --version' },
      { id: 'step-c', title: 'Step C (new)', command: 'npm list --depth=0' },
    ],
  });
  assert(rb2.ok && rb2.json.created, 'revised runbook creation failed');

  // Now diff them
  const diffResp = await context.client.callTool('diff_execution_plans', {
    baselinePath: rb1.json.outputPath,
    revisedPath:  rb2.json.outputPath,
  });

  assert(diffResp.ok, 'diff_execution_plans call failed');
  const d = diffResp.json;

  assert(d.identical === false, 'diff should not be identical');
  assert(d.diff.added.length === 1, `expected 1 added step, got ${d.diff.added.length}`);
  assert(d.diff.removed.length === 1, `expected 1 removed step, got ${d.diff.removed.length}`);
  assert(d.diff.changed.length >= 1, `expected at least 1 changed step, got ${d.diff.changed.length}`);
  assert(typeof d.totalChanges === 'number' && d.totalChanges > 0, 'totalChanges should be > 0');

  return {
    notes: `diff found: +${d.diff.added.length} added, -${d.diff.removed.length} removed, ~${d.diff.changed.length} changed`,
    details: { totalChanges: d.totalChanges, diff: d.diff },
  };
}

module.exports = { run };
