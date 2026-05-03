'use strict';

const path = require('path');
const { assert } = require('../lib/assertions');

async function run(context) {
  const serverPath = path.join(context.rootDir, 'mcp-server.js');
  const osBridgePath = 'C:/Users/justi/mcp-servers/os-bridge/mcp-server.js';

  // Compare agent-ops-hub to itself (should be identical)
  const selfResp = await context.client.callTool('compare_mcp_server_tools', {
    baselineServerPath: serverPath,
    revisedServerPath:  serverPath,
  });

  assert(selfResp.ok, 'compare_mcp_server_tools self-compare failed');
  assert(selfResp.json.summary.identical === true, 'self-compare should be identical');
  assert(selfResp.json.baseline.toolCount >= 9, `expected at least 9 tools, got ${selfResp.json.baseline.toolCount}`);

  // Compare agent-ops-hub to os-bridge (should show differences)
  const crossResp = await context.client.callTool('compare_mcp_server_tools', {
    baselineServerPath: serverPath,
    revisedServerPath:  osBridgePath,
  });

  assert(crossResp.ok, 'cross-server compare failed');
  assert(crossResp.json.summary.identical === false, 'agent-ops-hub vs os-bridge should not be identical');
  assert(crossResp.json.diff.added.length > 0, 'os-bridge should have tools not in agent-ops-hub');

  return {
    notes: `self: ${selfResp.json.baseline.toolCount} tools identical; cross: +${crossResp.json.diff.added.length} in os-bridge, -${crossResp.json.diff.removed.length} vs agent-ops-hub`,
    details: {
      agentOpsHubTools: selfResp.json.baseline.toolCount,
      osBridgeAdded: crossResp.json.diff.added.length,
      shared: crossResp.json.diff.shared.length,
    },
  };
}

module.exports = { run };
