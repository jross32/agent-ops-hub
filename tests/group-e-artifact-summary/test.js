'use strict';

const fs = require('fs');
const path = require('path');
const { assert } = require('../lib/assertions');

async function run(context) {
  const artifactDir = path.join(context.rootDir, 'tests', 'fixtures', 'artifact-summary');
  fs.mkdirSync(artifactDir, { recursive: true });

  const latestAi = {
    timestamp: new Date().toISOString(),
    suite: 'fixture-suite',
    summary: {
      total: 2,
      passed: 1,
      failed: 1,
      skipped: 0,
      durationMs: 321,
    },
    tests: [
      { name: 'ok test', status: 'pass' },
      { name: 'failed test', status: 'fail' },
    ],
  };

  fs.writeFileSync(path.join(artifactDir, 'latest_ai.json'), JSON.stringify(latestAi, null, 2));
  fs.writeFileSync(path.join(artifactDir, 'latest_human.md'), '# fixture human summary\n- one line\n');

  const resp = await context.client.callTool('summarize_test_artifacts', {
    artifactsPath: artifactDir,
  });

  assert(resp.ok, 'summarize_test_artifacts call failed');
  assert(resp.json && resp.json.summary && resp.json.summary.failed === 1, 'artifact summary failed count mismatch');
  assert(resp.json.firstFailedTest && resp.json.firstFailedTest.name === 'failed test', 'first failed test not detected');
  assert(resp.json.trend && typeof resp.json.trend.runsAnalyzed === 'number', 'trend field missing');

  return {
    notes: `artifact summary produced expected failed-test signal; trend.runsAnalyzed=${resp.json.trend.runsAnalyzed}`,
    details: {
      summary: resp.json.summary,
      firstFailedTest: resp.json.firstFailedTest,
    },
  };
}

module.exports = { run };
