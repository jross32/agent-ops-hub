const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.resolve(__dirname, '..', 'mcp-server.js');
const child = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'inherit'] });

let buffer = '';
let nextId = 1;
const pending = new Map();

child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  buffer += chunk;
  while (true) {
    const idx = buffer.indexOf('\n');
    if (idx === -1) {
      break;
    }
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) {
      continue;
    }
    const msg = JSON.parse(line);
    if (msg.id && pending.has(msg.id)) {
      const resolve = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg);
    }
  }
});

function rpc(method, params) {
  const id = nextId++;
  const payload = { jsonrpc: '2.0', id, method, params };
  child.stdin.write(`${JSON.stringify(payload)}\n`);
  return new Promise((resolve) => pending.set(id, resolve));
}

async function main() {
  const init = await rpc('initialize', {});
  if (!init.result || !init.result.serverInfo) {
    throw new Error('initialize failed');
  }

  const tools = await rpc('tools/list', {});
  const names = (tools.result.tools || []).map((t) => t.name);
  const required = [
    'list_local_mcp_servers',
    'research_agent_patterns',
    'create_execution_runbook',
    'run_validation_gate',
    'summarize_test_artifacts'
  ];

  for (const name of required) {
    if (!names.includes(name)) {
      throw new Error(`missing tool: ${name}`);
    }
  }

  const gate = await rpc('tools/call', {
    name: 'run_validation_gate',
    arguments: {
      commands: ['node --version']
    }
  });

  if (!gate.result || !gate.result.content || !gate.result.content[0]) {
    throw new Error('gate tool returned invalid structure');
  }

  child.kill();
  process.stdout.write('agent-ops-hub smoke test passed\n');
}

main().catch((error) => {
  child.kill();
  console.error(error.message || error);
  process.exit(1);
});
