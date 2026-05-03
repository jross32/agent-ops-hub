'use strict';

const { assert, assertIncludes } = require('../lib/assertions');

async function run(context) {
  const tools = await context.client.listTools();
  const names = tools.map((t) => t.name);

  const expected = [
    'agent_mode_preflight',
    'list_local_mcp_servers',
    'research_agent_patterns',
    'create_execution_runbook',
    'run_validation_gate',
    'benchmark_validation_gate',
    'summarize_test_artifacts',
    'diff_execution_plans',
    'generate_test_scaffold',
    'compare_mcp_server_tools',
  ];

  for (const name of expected) {
    assertIncludes(names, name, `missing expected tool: ${name}`);
  }

  const listResp = await context.client.callTool('list_local_mcp_servers', {
    rootPath: 'C:/Users/justi/mcp-servers',
  });

  assert(listResp.ok, 'list_local_mcp_servers tool call failed');
  assert(listResp.json && typeof listResp.json.count === 'number', 'invalid list_local_mcp_servers response');

  return {
    notes: `discovered ${tools.length} tools and ${listResp.json.count} local MCP folders`,
    details: {
      toolsDiscovered: tools.length,
      localMcpFolderCount: listResp.json.count,
    },
  };
}

module.exports = { run };
