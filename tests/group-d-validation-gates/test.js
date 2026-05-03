'use strict';

const { assert, assertEq } = require('../lib/assertions');

async function run(context) {
  // Test 1: all pass (plain strings — backward compat)
  const resp = await context.client.callTool('run_validation_gate', {
    cwd: context.rootDir,
    commands: [
      'node --version',
      'npm --version',
      'node -e "console.log(\'validation-gate-ok\')"',
    ],
    timeoutMs: 120000,
  }, 140000);

  assert(resp.ok, 'run_validation_gate call failed');
  assert(resp.json, 'run_validation_gate missing json payload');
  assertEq(resp.json.passed, true, 'validation gate should pass');
  assertEq(resp.json.attempted, 3, 'validation gate did not execute all commands');

  // Test 2: warn-level failure should NOT abort the gate
  const severityResp = await context.client.callTool('run_validation_gate', {
    cwd: context.rootDir,
    commands: [
      { command: 'node --version', severity: 'error' },
      { command: 'node -e "process.exit(1)"', severity: 'warn' },  // fails but is warn
      { command: 'npm --version', severity: 'error' },
    ],
    timeoutMs: 120000,
  });

  assert(severityResp.ok, 'severity gate call failed');
  assertEq(severityResp.json.passed, true, 'gate should pass despite warn-level failure');
  assertEq(severityResp.json.warnFailures, 1, 'expected 1 warn failure');
  assertEq(severityResp.json.errorFailures, 0, 'expected 0 error failures');
  assertEq(severityResp.json.attempted, 3, 'all 3 commands should have been attempted');

  return {
    notes: 'validation gate: backward compat pass + severity-level warn-continues behavior verified',
    details: {
      plainGate: { attempted: resp.json.attempted, passed: resp.json.passed },
      severityGate: { attempted: severityResp.json.attempted, warnFails: severityResp.json.warnFailures },
    },
  };
}

module.exports = { run };
