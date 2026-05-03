'use strict';

const path = require('path');
const { McpClient } = require('./lib/mcp-client');

function say(step, text) {
  const ts = new Date().toISOString();
  process.stdout.write(`[${ts}] [${step}] ${text}\n`);
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const client = new McpClient(path.join(rootDir, 'mcp-server.js'));

  await client.start();

  try {
    say('1/7', 'Running agent-mode preflight checks.');
    const preflight = await client.callTool('agent_mode_preflight', {
      mcpRootPath: 'C:/Users/justi/mcp-servers',
      timeoutMs: 45000,
    }, 50000);

    if (!preflight.ok || !preflight.json) {
      throw new Error(`agent_mode_preflight failed: ${preflight.error || 'unknown error'}`);
    }

    say('1/7', `Readiness score: ${preflight.json.readinessScore}/100.`);

    say('2/7', 'Listing local MCP servers.');
    const list = await client.callTool('list_local_mcp_servers', {
      rootPath: 'C:/Users/justi/mcp-servers',
    });

    if (!list.ok || !list.json) {
      throw new Error(`list_local_mcp_servers failed: ${list.error || 'unknown error'}`);
    }

    say('2/7', `Discovered ${list.json.count} local MCP folders.`);

    say('3/7', 'Running live research for agent/operator workflow terms.');
    const research = await client.callTool('research_agent_patterns', {
      urls: [
        'https://example.com',
        'https://platform.openai.com/docs/guides/agents',
      ],
      timeoutMs: 25000,
      maxBytes: 180000,
    }, 35000);

    if (!research.ok || !research.json) {
      throw new Error(`research_agent_patterns failed: ${research.error || 'unknown error'}`);
    }

    const hits = research.json.results.reduce((acc, r) => acc + (r.hitCount || 0), 0);
    say('3/7', `Research complete. Total keyword hits: ${hits}.`);

    say('4/7', 'Creating an execution runbook artifact.');
    const runbook = await client.callTool('create_execution_runbook', {
      name: 'visible-demo-runbook',
      objective: 'Show visible execution for research + validation gates',
      outputDir: path.join(rootDir, 'artifacts', 'runbooks-visible'),
      steps: [
        { id: 'list', title: 'List MCP servers', command: 'node --version' },
        { id: 'gate', title: 'Run validation', command: 'npm --version' },
      ],
    });

    if (!runbook.ok || !runbook.json || !runbook.json.outputPath) {
      throw new Error(`create_execution_runbook failed: ${runbook.error || 'unknown error'}`);
    }

    say('4/7', `Runbook written: ${runbook.json.outputPath}`);

    say('5/7', 'Executing validation gate commands.');
    const gate = await client.callTool('run_validation_gate', {
      cwd: rootDir,
      commands: ['node --version', 'npm --version', 'node -e "console.log(\'visible-gate-pass\')"'],
      timeoutMs: 120000,
    }, 140000);

    if (!gate.ok || !gate.json) {
      throw new Error(`run_validation_gate failed: ${gate.error || 'unknown error'}`);
    }

    say('5/7', `Validation gate passed=${gate.json.passed}, attempted=${gate.json.attempted}.`);

    say('6/7', 'Benchmarking validation gate for efficiency trend.');
    const benchmark = await client.callTool('benchmark_validation_gate', {
      cwd: rootDir,
      commands: ['node --version', 'npm --version'],
      iterations: 2,
      timeoutMs: 120000,
    }, 140000);

    if (!benchmark.ok || !benchmark.json || !benchmark.json.metrics) {
      throw new Error(`benchmark_validation_gate failed: ${benchmark.error || 'unknown error'}`);
    }

    say('6/7', `Benchmark avg=${benchmark.json.metrics.avgDurationMs}ms min=${benchmark.json.metrics.minDurationMs}ms max=${benchmark.json.metrics.maxDurationMs}ms.`);

    say('7/7', 'Summarizing current test artifacts.');
    const summary = await client.callTool('summarize_test_artifacts', {
      artifactsPath: path.join(rootDir, 'tests', 'logs'),
    });

    if (summary.ok && summary.json && summary.json.summary) {
      say('7/7', `Latest artifacts: total=${summary.json.summary.total}, failed=${summary.json.summary.failed}.`);
    } else {
      say('7/7', 'No previous test artifacts found yet (expected on first run).');
    }

    process.stdout.write('\nVisible data demo completed successfully.\n');
  } finally {
    await client.stop();
  }
}

main().catch((error) => {
  process.stderr.write(`Visible data demo failed: ${error.message}\n`);
  process.exit(1);
});
