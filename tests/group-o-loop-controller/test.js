'use strict';

const path = require('path');
const fs = require('fs');
const { assert } = require('../lib/assertions');

async function run(context) {
  const stateDir = path.resolve(__dirname, '../../artifacts/loop-state-tests');
  fs.rmSync(stateDir, { recursive: true, force: true });

  const resumeRes = await context.client.callTool('set_autonomous_loop_control', {
    action: 'resume',
    stateDir,
    reason: 'test-initialize',
  });
  assert(resumeRes.ok, 'set_autonomous_loop_control resume failed');

  const runRes = await context.client.callTool('orchestrate_continuous_improvement_loop', {
    goal: 'Continuously improve MCP server quality and workflow speed',
    stateDir,
    maxCycles: 2,
    cadenceMinutes: 10,
    waitForCadence: false,
    urls: ['https://playwright.dev/docs/intro'],
    keywords: ['workflow', 'quality', 'automation', 'parallel']
  }, 90000);
  assert(runRes.ok, 'orchestrate_continuous_improvement_loop failed');
  assert(runRes.json.cyclesRun >= 1, `expected cyclesRun >= 1, got ${runRes.json.cyclesRun}`);

  const stateRes = await context.client.callTool('get_autonomous_loop_state', {
    stateDir,
    includeRecentCycles: true,
    recentLimit: 10,
  });
  assert(stateRes.ok, 'get_autonomous_loop_state failed');
  assert(stateRes.json.state && typeof stateRes.json.state.totalCycles === 'number', 'loop state missing totalCycles');
  assert(stateRes.json.state.totalCycles >= runRes.json.cyclesRun, 'totalCycles should be >= cyclesRun');
  assert(Array.isArray(stateRes.json.recentCycles) && stateRes.json.recentCycles.length >= 1, 'expected recent cycle snapshots');

  const pauseRes = await context.client.callTool('set_autonomous_loop_control', {
    action: 'pause',
    stateDir,
    reason: 'test-pause',
  });
  assert(pauseRes.ok, 'set_autonomous_loop_control pause failed');

  const pausedRun = await context.client.callTool('orchestrate_continuous_improvement_loop', {
    goal: 'Should not run while paused',
    stateDir,
    maxCycles: 1,
  }, 30000);
  assert(pausedRun.ok, 'paused orchestrate call failed');
  assert(pausedRun.json.status === 'paused', `expected status=paused, got ${pausedRun.json.status}`);

  const triggerRes = await context.client.callTool('set_autonomous_loop_control', {
    action: 'trigger_now',
    stateDir,
  });
  assert(triggerRes.ok, 'set_autonomous_loop_control trigger_now failed');
  assert(triggerRes.json.state.triggerNow === true, 'triggerNow flag should be true after trigger_now');

  return {
    notes: `loop controller: cyclesRun=${runRes.json.cyclesRun}, totalCycles=${stateRes.json.state.totalCycles}, snapshots=${stateRes.json.recentCycles.length}`,
    details: {
      cyclesRun: runRes.json.cyclesRun,
      totalCycles: stateRes.json.state.totalCycles,
      snapshots: stateRes.json.recentCycles.length,
      nextPulseAt: stateRes.json.state.nextPulseAt,
    },
  };
}

module.exports = { run };
