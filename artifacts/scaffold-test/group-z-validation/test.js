'use strict';

const { assert } = require('../lib/assertions');

async function run(context) {
  const resp = await context.client.callTool('run_validation_gate', {
      "commands": [
          "node --version"
      ],
      "cwd": "C:\\Users\\justi\\mcp-servers\\agent-ops-hub"
  });

  assert(resp.ok, 'run_validation_gate call failed');
  assert(resp.json !== null && resp.json !== undefined, 'run_validation_gate returned null response');

  return {
    notes: 'run_validation_gate responded successfully',
    details: { response: resp.json },
  };
}

module.exports = { run };
