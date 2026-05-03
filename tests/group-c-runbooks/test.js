'use strict';

const fs = require('fs');
const path = require('path');
const { assert } = require('../lib/assertions');

async function run(context) {
  const outputDir = path.join(context.rootDir, 'artifacts', 'runbooks-tests');

  const resp = await context.client.callTool('create_execution_runbook', {
    name: 'quality-gate-demo',
    objective: 'Prove repeatable runbook generation in tests',
    outputDir,
    steps: [
      { id: 'preflight', title: 'Preflight', command: 'node --version' },
      { id: 'verify', title: 'Verify npm', command: 'npm --version' },
    ],
  });

  assert(resp.ok, 'create_execution_runbook call failed');
  assert(resp.json && resp.json.created === true, 'runbook create response did not indicate success');
  assert(resp.json.outputPath && fs.existsSync(resp.json.outputPath), 'runbook output file missing');

  const payload = JSON.parse(fs.readFileSync(resp.json.outputPath, 'utf8'));
  assert(Array.isArray(payload.steps) && payload.steps.length === 2, 'runbook steps malformed');

  return {
    notes: `runbook created at ${resp.json.outputPath}`,
    details: {
      outputPath: resp.json.outputPath,
      stepCount: payload.steps.length,
    },
  };
}

module.exports = { run };
