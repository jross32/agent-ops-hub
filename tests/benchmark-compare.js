'use strict';

const path = require('path');
const { McpClient } = require('./lib/mcp-client');

function pct(delta, base) {
  if (!base) {
    return 0;
  }
  return Math.round((delta / base) * 100);
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const client = new McpClient(path.join(rootDir, 'mcp-server.js'));

  await client.start();

  try {
    const baseline = await client.callTool('benchmark_validation_gate', {
      cwd: rootDir,
      commands: ['node --version'],
      iterations: 3,
      timeoutMs: 120000,
    }, 140000);

    const extended = await client.callTool('benchmark_validation_gate', {
      cwd: rootDir,
      commands: ['node --version', 'npm --version', 'node -e "console.log(\'bench-check\')"'],
      iterations: 3,
      timeoutMs: 120000,
    }, 140000);

    if (!baseline.ok || !baseline.json || !baseline.json.metrics) {
      throw new Error(`baseline benchmark failed: ${baseline.error || 'unknown error'}`);
    }
    if (!extended.ok || !extended.json || !extended.json.metrics) {
      throw new Error(`extended benchmark failed: ${extended.error || 'unknown error'}`);
    }

    const baseAvg = baseline.json.metrics.avgDurationMs;
    const extAvg = extended.json.metrics.avgDurationMs;
    const delta = extAvg - baseAvg;
    const pctGain = pct(delta, baseAvg);
    const multiplier = baseAvg > 0 ? (extAvg / baseAvg).toFixed(2) : '0.00';

    process.stdout.write('Efficiency comparison complete.\n');
    process.stdout.write(`- Baseline avg: ${baseAvg} ms\n`);
    process.stdout.write(`- Extended avg: ${extAvg} ms\n`);
    process.stdout.write(`- Delta: ${delta} ms\n`);
    process.stdout.write(`- Change: ${pctGain}%\n`);
    process.stdout.write(`- Multiplier: ${multiplier}x\n`);
  } finally {
    await client.stop();
  }
}

main().catch((error) => {
  process.stderr.write(`Benchmark compare failed: ${error.message}\n`);
  process.exit(1);
});
