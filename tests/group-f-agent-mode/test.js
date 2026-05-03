'use strict';

const { assert } = require('../lib/assertions');

async function run(context) {
  const preflight = await context.client.callTool('agent_mode_preflight', {
    mcpRootPath: 'C:/Users/justi/mcp-servers',
    timeoutMs: 45000,
  }, 50000);

  assert(preflight.ok, 'agent_mode_preflight call failed');
  assert(preflight.json && typeof preflight.json.readinessScore === 'number', 'invalid preflight payload');
  assert(preflight.json.readinessScore >= 66, `readiness score too low: ${preflight.json.readinessScore}`);

  const benchmark = await context.client.callTool('benchmark_validation_gate', {
    cwd: context.rootDir,
    commands: ['node --version', 'npm --version'],
    iterations: 2,
    timeoutMs: 120000,
  }, 140000);

  assert(benchmark.ok, 'benchmark_validation_gate call failed');
  assert(benchmark.json && benchmark.json.metrics, 'benchmark payload missing metrics');
  assert(benchmark.json.iterationsCompleted >= 1, 'benchmark iterations did not execute');

  return {
    notes: `preflight=${preflight.json.readinessScore}, avgBenchmarkMs=${benchmark.json.metrics.avgDurationMs}`,
    details: {
      readinessScore: preflight.json.readinessScore,
      benchmark: benchmark.json.metrics,
    },
  };
}

module.exports = { run };
