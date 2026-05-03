'use strict';

const fs = require('fs');
const path = require('path');
const { assert } = require('../lib/assertions');

async function run(context) {
  // Test 1: return content only (no outputDir)
  const respDry = await context.client.callTool('generate_test_scaffold', {
    toolName: 'list_local_mcp_servers',
    groupLabel: 'group-z-generated',
    sampleArgs: { rootPath: 'C:/Users/justi/mcp-servers' },
  });

  assert(respDry.ok, 'generate_test_scaffold dry-run call failed');
  assert(typeof respDry.json.scaffold === 'string' && respDry.json.scaffold.length > 50, 'scaffold content too short');
  assert(respDry.json.writtenPath === null, 'writtenPath should be null when no outputDir given');
  assert(respDry.json.scaffold.includes('list_local_mcp_servers'), 'scaffold should mention the tool name');

  // Test 2: write to disk
  const outputDir = path.join(context.rootDir, 'artifacts', 'scaffold-test');
  const respWrite = await context.client.callTool('generate_test_scaffold', {
    toolName: 'run_validation_gate',
    groupLabel: 'group-z-validation',
    outputDir,
    sampleArgs: { commands: ['node --version'], cwd: process.cwd() },
  });

  assert(respWrite.ok, 'generate_test_scaffold write call failed');
  assert(typeof respWrite.json.writtenPath === 'string', 'writtenPath should be a string');
  assert(fs.existsSync(respWrite.json.writtenPath), `scaffold file not written to disk: ${respWrite.json.writtenPath}`);

  const content = fs.readFileSync(respWrite.json.writtenPath, 'utf8');
  assert(content.includes('run_validation_gate'), 'written scaffold does not mention the tool');

  return {
    notes: `scaffold generated (dry) and written to ${respWrite.json.writtenPath}`,
    details: { writtenPath: respWrite.json.writtenPath, scaffoldLen: content.length },
  };
}

module.exports = { run };
