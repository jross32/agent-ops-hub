#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { spawn } = require('child_process');

const DEFAULT_MCP_ROOT = 'C:/Users/justi/mcp-servers';
const DEFAULT_RUNBOOK_DIR = path.resolve(__dirname, 'artifacts', 'runbooks');

const TOOLS = [
  {
    name: 'agent_mode_preflight',
    description: 'Run local readiness checks for agent execution (node/npm, folder access, and MCP inventory)',
    inputSchema: {
      type: 'object',
      properties: {
        mcpRootPath: { type: 'string', description: 'Root folder containing local MCP servers' },
        timeoutMs: { type: 'number', minimum: 1000, maximum: 120000 }
      },
      additionalProperties: false
    }
  },
  {
    name: 'list_local_mcp_servers',
    description: 'List local MCP server folders and detect launch files',
    inputSchema: {
      type: 'object',
      properties: {
        rootPath: { type: 'string', description: 'Root folder that contains MCP server folders' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'research_agent_patterns',
    description: 'Fetch URLs and extract agent workflow patterns (interrupt/resume/approval/visibility terms)',
    inputSchema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 10
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 30
        },
        timeoutMs: { type: 'number', minimum: 1000, maximum: 60000 },
        maxBytes: { type: 'number', minimum: 1024, maximum: 500000 }
      },
      required: ['urls'],
      additionalProperties: false
    }
  },
  {
    name: 'create_execution_runbook',
    description: 'Create a structured runbook JSON for repeatable agent execution plans',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        objective: { type: 'string' },
        outputDir: { type: 'string' },
        steps: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              command: { type: 'string' },
              mustPass: { type: 'boolean' }
            },
            required: ['id', 'title', 'command'],
            additionalProperties: false
          }
        }
      },
      required: ['name', 'objective', 'steps'],
      additionalProperties: false
    }
  },
  {
    name: 'run_validation_gate',
    description: 'Run command gates sequentially and return pass/fail with command outputs. Commands can be plain strings or objects with { command, severity } where severity is error|warn|info (default: error). Only error-severity failures abort the gate.',
    inputSchema: {
      type: 'object',
      properties: {
        commands: {
          type: 'array',
          minItems: 1,
          items: {
            oneOf: [
              { type: 'string' },
              {
                type: 'object',
                properties: {
                  command:  { type: 'string' },
                  severity: { type: 'string', enum: ['error', 'warn', 'info'] }
                },
                required: ['command'],
                additionalProperties: false
              }
            ]
          }
        },
        cwd: { type: 'string' },
        timeoutMs: { type: 'number', minimum: 1000, maximum: 900000 }
      },
      required: ['commands'],
      additionalProperties: false
    }
  },
  {
    name: 'benchmark_validation_gate',
    description: 'Benchmark validation commands over multiple iterations for efficiency tracking',
    inputSchema: {
      type: 'object',
      properties: {
        commands: {
          type: 'array',
          minItems: 1,
          items: { type: 'string' }
        },
        iterations: { type: 'number', minimum: 1, maximum: 20 },
        cwd: { type: 'string' },
        timeoutMs: { type: 'number', minimum: 1000, maximum: 900000 }
      },
      required: ['commands'],
      additionalProperties: false
    }
  },
  {
    name: 'summarize_test_artifacts',
    description: 'Read latest test artifacts and produce a concise machine summary',
    inputSchema: {
      type: 'object',
      properties: {
        artifactsPath: { type: 'string' }
      },
      required: ['artifactsPath'],
      additionalProperties: false
    }
  },
  {
    name: 'diff_execution_plans',
    description: 'Compare two runbook JSON files and return a structured diff of added, removed, and changed steps',
    inputSchema: {
      type: 'object',
      properties: {
        baselinePath: { type: 'string', description: 'Path to the baseline runbook JSON file' },
        revisedPath:  { type: 'string', description: 'Path to the revised runbook JSON file' }
      },
      required: ['baselinePath', 'revisedPath'],
      additionalProperties: false
    }
  },
  {
    name: 'generate_test_scaffold',
    description: 'Generate a test file scaffold for a new MCP tool and optionally write it to disk',
    inputSchema: {
      type: 'object',
      properties: {
        toolName:    { type: 'string', description: 'Name of the MCP tool to scaffold a test for' },
        groupLabel:  { type: 'string', description: 'Short label used as the group folder name (e.g. group-h-my-tool)' },
        outputDir:   { type: 'string', description: 'Directory to write the scaffold file into (optional — omit to return content only)' },
        sampleArgs:  { type: 'object', description: 'Example args object for the tool call' }
      },
      required: ['toolName', 'groupLabel'],
      additionalProperties: false
    }
  },
  {
    name: 'check_server_health',
    description: 'Spawn a local MCP server, send initialize + tools/list, verify the response, and return tool count and health status. Kills the process when done.',
    inputSchema: {
      type: 'object',
      properties: {
        serverPath: { type: 'string', description: 'Absolute path to the mcp-server.js file to test' },
        timeoutMs:  { type: 'number', minimum: 1000, maximum: 30000, description: 'Max ms to wait for tools/list response (default 10000)' }
      },
      required: ['serverPath'],
      additionalProperties: false
    }
  },
  {
    name: 'compare_mcp_server_tools',
    description: 'Parse two MCP server JS files and compare their TOOLS arrays — showing which tools were added or removed',
    inputSchema: {
      type: 'object',
      properties: {
        baselineServerPath: { type: 'string', description: 'Path to the baseline mcp-server.js file' },
        revisedServerPath:  { type: 'string', description: 'Path to the revised mcp-server.js file' }
      },
      required: ['baselineServerPath', 'revisedServerPath'],
      additionalProperties: false
    }
  }
];

let inputBuffer = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  inputBuffer += chunk;
  processIncoming();
});

function processIncoming() {
  while (true) {
    const lineEnd = inputBuffer.indexOf('\n');
    if (lineEnd === -1) {
      return;
    }
    const line = inputBuffer.slice(0, lineEnd).trim();
    inputBuffer = inputBuffer.slice(lineEnd + 1);
    if (!line) {
      continue;
    }

    let message;
    try {
      message = JSON.parse(line);
    } catch (error) {
      sendError(null, -32700, `Parse error: ${error.message}`);
      continue;
    }

    handleMessage(message).catch((error) => {
      sendError(message.id || null, -32603, error.message || 'Internal error');
    });
  }
}

async function handleMessage(message) {
  const { id, method, params } = message;

  if (method === 'initialize') {
    return sendResult(id, {
      protocolVersion: '2024-11-05',
      serverInfo: {
        name: 'agent-ops-hub',
        version: '1.0.0'
      },
      capabilities: {
        tools: {}
      }
    });
  }

  if (method === 'tools/list') {
    return sendResult(id, { tools: TOOLS });
  }

  if (method === 'tools/call') {
    const toolName = params && params.name;
    const args = (params && params.arguments) || {};

    if (!toolName) {
      return sendError(id, -32602, 'Missing tool name');
    }

    const result = await runTool(toolName, args);
    return sendResult(id, {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    });
  }

  sendError(id || null, -32601, `Method not found: ${method}`);
}

async function runTool(name, args) {
  switch (name) {
    case 'agent_mode_preflight':
      return agentModePreflight(args);
    case 'list_local_mcp_servers':
      return listLocalMcpServers(args);
    case 'research_agent_patterns':
      return researchAgentPatterns(args);
    case 'create_execution_runbook':
      return createExecutionRunbook(args);
    case 'run_validation_gate':
      return runValidationGate(args);
    case 'benchmark_validation_gate':
      return benchmarkValidationGate(args);
    case 'summarize_test_artifacts':
      return summarizeTestArtifacts(args);
    case 'diff_execution_plans':
      return diffExecutionPlans(args);
    case 'generate_test_scaffold':
      return generateTestScaffold(args);
    case 'check_server_health':
      return checkServerHealth(args);
    case 'compare_mcp_server_tools':
      return compareMcpServerTools(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function agentModePreflight(args) {
  const timeoutMs = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 45000;
  const mcpRootPath = normalizeFsPath(args.mcpRootPath || DEFAULT_MCP_ROOT);

  const [nodeVersion, npmVersion] = await Promise.all([
    runShellCommand('node --version', process.cwd(), timeoutMs),
    runShellCommand('npm --version', process.cwd(), timeoutMs)
  ]);

  const mcpListing = listLocalMcpServers({ rootPath: mcpRootPath });
  const checks = [
    {
      id: 'node_available',
      passed: nodeVersion.exitCode === 0,
      details: clip(nodeVersion.stdout || nodeVersion.stderr, 200)
    },
    {
      id: 'npm_available',
      passed: npmVersion.exitCode === 0,
      details: clip(npmVersion.stdout || npmVersion.stderr, 200)
    },
    {
      id: 'mcp_root_readable',
      passed: mcpListing.count > 0,
      details: `mcp folders found: ${mcpListing.count}`
    }
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const readinessScore = Math.round((passedCount / checks.length) * 100);

  return {
    readinessScore,
    passedChecks: passedCount,
    totalChecks: checks.length,
    checks,
    mcpInventory: {
      rootPath: mcpListing.rootPath,
      count: mcpListing.count,
      sample: mcpListing.servers.slice(0, 10)
    }
  };
}

function listLocalMcpServers(args) {
  const rootPath = normalizeFsPath(args.rootPath || DEFAULT_MCP_ROOT);
  const entries = safeReadDir(rootPath);

  const servers = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(rootPath, entry.name);
      const packageJson = path.join(dir, 'package.json');
      const serverJs = path.join(dir, 'mcp-server.js');
      const indexJs = path.join(dir, 'index.js');

      let version = null;
      if (fs.existsSync(packageJson)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
          version = pkg.version || null;
        } catch (_error) {
          version = null;
        }
      }

      return {
        name: entry.name,
        path: dir,
        version,
        hasPackageJson: fs.existsSync(packageJson),
        hasMcpServerJs: fs.existsSync(serverJs),
        hasIndexJs: fs.existsSync(indexJs)
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    rootPath,
    count: servers.length,
    servers
  };
}

async function researchAgentPatterns(args) {
  const urls = args.urls || [];
  const timeoutMs = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 15000;
  const maxBytes = Number.isFinite(args.maxBytes) ? args.maxBytes : 120000;

  const defaultKeywords = [
    'agent',
    'operator',
    'approval',
    'checkpoint',
    'resume',
    'interrupt',
    'human-in-the-loop',
    'visibility',
    'guardrail',
    'risk'
  ];
  const keywords = Array.isArray(args.keywords) && args.keywords.length
    ? args.keywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean)
    : defaultKeywords;

  const results = [];
  const keywordCounts = Object.fromEntries(keywords.map((k) => [k, 0]));
  for (const url of urls) {
    try {
      const response = await fetchUrl(url, timeoutMs, maxBytes);
      const plain = htmlToText(response.body);
      const lower = plain.toLowerCase();
      const hits = [];

      for (const keyword of keywords) {
        const idx = lower.indexOf(keyword);
        if (idx >= 0) {
          keywordCounts[keyword] += 1;
          const start = Math.max(0, idx - 80);
          const end = Math.min(plain.length, idx + 160);
          hits.push({ keyword, excerpt: plain.slice(start, end).replace(/\s+/g, ' ').trim() });
        }
      }

      results.push({
        url,
        statusCode: response.statusCode,
        title: extractTitle(response.body),
        headings: extractHeadings(response.body).slice(0, 10),
        hitCount: hits.length,
        hits: hits.slice(0, 12)
      });
    } catch (error) {
      results.push({ url, error: error.message });
    }
  }

  return {
    scanned: urls.length,
    keywords,
    keywordCounts,
    results
  };
}

function createExecutionRunbook(args) {
  const now = new Date();
  const stamp = toStamp(now);
  const runbook = {
    id: `${slugify(args.name)}-${stamp}`,
    name: args.name,
    objective: args.objective,
    createdAt: now.toISOString(),
    steps: args.steps.map((step, index) => ({
      index: index + 1,
      id: step.id,
      title: step.title,
      command: step.command,
      mustPass: step.mustPass !== false
    })),
    policy: {
      stopOnFail: true,
      requiresValidation: true
    }
  };

  const outputDir = normalizeFsPath(args.outputDir || DEFAULT_RUNBOOK_DIR);
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${runbook.id}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(runbook, null, 2));

  return {
    created: true,
    outputPath,
    runbook
  };
}

async function runValidationGate(args) {
  const cwd = normalizeFsPath(args.cwd || process.cwd());
  const timeoutMs = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 180000;
  const rawCommands = args.commands || [];

  // Normalize: accept both plain strings and { command, severity } objects
  const commands = rawCommands.map((c) => {
    if (typeof c === 'string') return { command: c, severity: 'error' };
    return { command: String(c.command || ''), severity: c.severity || 'error' };
  });

  const results = [];
  for (const { command, severity } of commands) {
    const startedAt = Date.now();
    const result = await runShellCommand(command, cwd, timeoutMs);
    const durationMs = Date.now() - startedAt;
    const passed = result.exitCode === 0;

    results.push({
      command,
      severity,
      cwd,
      durationMs,
      exitCode: result.exitCode,
      stdout: clip(result.stdout, 10000),
      stderr: clip(result.stderr, 8000),
      passed
    });

    // Only abort on error-severity failures
    if (!passed && severity === 'error') {
      break;
    }
  }

  const errorFails  = results.filter((r) => !r.passed && r.severity === 'error');
  const warnFails   = results.filter((r) => !r.passed && r.severity === 'warn');
  const passed = errorFails.length === 0;

  return {
    passed,
    attempted: results.length,
    totalRequested: commands.length,
    errorFailures: errorFails.length,
    warnFailures: warnFails.length,
    results
  };
}

async function benchmarkValidationGate(args) {
  const commands = args.commands || [];
  const iterations = Number.isFinite(args.iterations) ? Math.floor(args.iterations) : 3;
  const cwd = normalizeFsPath(args.cwd || process.cwd());
  const timeoutMs = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 180000;

  const runs = [];
  for (let i = 0; i < iterations; i += 1) {
    const startedAt = Date.now();
    const gate = await runValidationGate({ commands, cwd, timeoutMs });
    const durationMs = Date.now() - startedAt;
    runs.push({
      iteration: i + 1,
      durationMs,
      passed: gate.passed,
      attempted: gate.attempted,
      totalRequested: gate.totalRequested
    });

    if (!gate.passed) {
      break;
    }
  }

  const durations = runs.map((r) => r.durationMs);
  const avgDurationMs = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const minDurationMs = durations.length ? Math.min(...durations) : 0;
  const maxDurationMs = durations.length ? Math.max(...durations) : 0;

  return {
    commands,
    iterationsRequested: iterations,
    iterationsCompleted: runs.length,
    passed: runs.every((r) => r.passed),
    metrics: {
      avgDurationMs,
      minDurationMs,
      maxDurationMs
    },
    runs
  };
}

function summarizeTestArtifacts(args) {
  const artifactsPath = normalizeFsPath(args.artifactsPath);
  const latestAiPath = path.join(artifactsPath, 'latest_ai.json');
  const latestHumanPath = path.join(artifactsPath, 'latest_human.md');

  if (!fs.existsSync(latestAiPath)) {
    throw new Error(`Missing artifact: ${latestAiPath}`);
  }

  const ai = JSON.parse(fs.readFileSync(latestAiPath, 'utf8'));
  const human = fs.existsSync(latestHumanPath)
    ? fs.readFileSync(latestHumanPath, 'utf8').split(/\r?\n/).slice(0, 20)
    : [];

  // Trend analysis: scan runs/ directory for past results
  const runsDir = path.join(artifactsPath, 'runs');
  const trend = [];
  if (fs.existsSync(runsDir)) {
    const runDirs = safeReadDir(runsDir)
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
      .slice(-10); // last 10 runs

    for (const runDir of runDirs) {
      const runAiPath = path.join(runsDir, runDir, 'ai.json');
      if (!fs.existsSync(runAiPath)) continue;
      try {
        const runData = JSON.parse(fs.readFileSync(runAiPath, 'utf8'));
        const s = runData.summary || {};
        if (typeof s.total === 'number' && s.total > 0) {
          trend.push({
            run: runDir,
            timestamp: runData.timestamp || null,
            passRate: Math.round((s.passed / s.total) * 100),
            passed: s.passed,
            failed: s.failed,
            total: s.total
          });
        }
      } catch (_err) {
        // skip unreadable runs
      }
    }
  }

  const avgPassRate = trend.length
    ? Math.round(trend.reduce((acc, r) => acc + r.passRate, 0) / trend.length)
    : null;

  return {
    artifactsPath,
    summary: ai.summary || null,
    suite: ai.suite || null,
    timestamp: ai.timestamp || null,
    firstFailedTest: (ai.tests || []).find((t) => t.status === 'fail') || null,
    humanPreview: human,
    trend: { runsAnalyzed: trend.length, avgPassRate, history: trend }
  };
}

function diffExecutionPlans(args) {
  const baselinePath = normalizeFsPath(args.baselinePath);
  const revisedPath  = normalizeFsPath(args.revisedPath);

  if (!fs.existsSync(baselinePath)) throw new Error(`Baseline not found: ${baselinePath}`);
  if (!fs.existsSync(revisedPath))  throw new Error(`Revised not found: ${revisedPath}`);

  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const revised  = JSON.parse(fs.readFileSync(revisedPath,  'utf8'));

  const baseSteps = Object.fromEntries((baseline.steps || []).map((s) => [s.id, s]));
  const revSteps  = Object.fromEntries((revised.steps  || []).map((s) => [s.id, s]));

  const added    = Object.keys(revSteps).filter((id) => !baseSteps[id]).map((id) => revSteps[id]);
  const removed  = Object.keys(baseSteps).filter((id) => !revSteps[id]).map((id) => baseSteps[id]);
  const changed  = [];

  for (const id of Object.keys(baseSteps)) {
    if (!revSteps[id]) continue;
    const b = baseSteps[id];
    const r = revSteps[id];
    const diffs = {};
    for (const key of new Set([...Object.keys(b), ...Object.keys(r)])) {
      if (JSON.stringify(b[key]) !== JSON.stringify(r[key])) {
        diffs[key] = { from: b[key], to: r[key] };
      }
    }
    if (Object.keys(diffs).length > 0) {
      changed.push({ id, diffs });
    }
  }

  const policyDiffs = {};
  const bp = baseline.policy || {};
  const rp = revised.policy  || {};
  for (const key of new Set([...Object.keys(bp), ...Object.keys(rp)])) {
    if (JSON.stringify(bp[key]) !== JSON.stringify(rp[key])) {
      policyDiffs[key] = { from: bp[key], to: rp[key] };
    }
  }

  const totalChanges = added.length + removed.length + changed.length + Object.keys(policyDiffs).length;

  return {
    identical: totalChanges === 0,
    totalChanges,
    baseline: { id: baseline.id, name: baseline.name, stepCount: (baseline.steps || []).length },
    revised:  { id: revised.id,  name: revised.name,  stepCount: (revised.steps  || []).length },
    diff: { added, removed, changed, policyDiffs }
  };
}

function generateTestScaffold(args) {
  const toolName   = String(args.toolName || '').trim();
  const groupLabel = String(args.groupLabel || '').trim();
  const sampleArgs = args.sampleArgs || {};

  if (!toolName)   throw new Error('toolName is required');
  if (!groupLabel) throw new Error('groupLabel is required');

  const argsJson = JSON.stringify(sampleArgs, null, 4).replace(/\n/g, '\n  ');

  const scaffold = `'use strict';

const { assert } = require('../lib/assertions');

async function run(context) {
  const resp = await context.client.callTool('${toolName}', ${argsJson});

  assert(resp.ok, '${toolName} call failed');
  assert(resp.json !== null && resp.json !== undefined, '${toolName} returned null response');

  return {
    notes: '${toolName} responded successfully',
    details: { response: resp.json },
  };
}

module.exports = { run };
`;

  let writtenPath = null;
  if (args.outputDir) {
    const dir = normalizeFsPath(path.join(args.outputDir, groupLabel));
    fs.mkdirSync(dir, { recursive: true });
    writtenPath = path.join(dir, 'test.js');
    fs.writeFileSync(writtenPath, scaffold);
  }

  return {
    toolName,
    groupLabel,
    writtenPath,
    scaffold
  };
}

async function checkServerHealth(args) {
  const serverPath = normalizeFsPath(args.serverPath);
  const timeoutMs  = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 10000;

  if (!fs.existsSync(serverPath)) {
    return { healthy: false, error: `Server file not found: ${serverPath}`, toolCount: 0, tools: [] };
  }

  const proc = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: path.dirname(serverPath),
  });

  let outputBuf = '';
  let errorBuf  = '';

  proc.stdout.on('data', (chunk) => { outputBuf += chunk.toString('utf8'); });
  proc.stderr.on('data', (chunk) => { errorBuf  += chunk.toString('utf8'); });

  function send(obj) {
    proc.stdin.write(JSON.stringify(obj) + '\n');
  }

  // Extract the first complete JSON line from the buffer
  function consumeLine() {
    const nl = outputBuf.indexOf('\n');
    if (nl === -1) return null;
    const line = outputBuf.slice(0, nl).trim();
    outputBuf = outputBuf.slice(nl + 1);
    return line ? JSON.parse(line) : null;
  }

  // Wait for a line that satisfies predicate, up to deadline
  function waitForLine(predicate, deadline) {
    return new Promise((resolve) => {
      function check() {
        const nl = outputBuf.indexOf('\n');
        if (nl !== -1) {
          const line = outputBuf.slice(0, nl).trim();
          outputBuf = outputBuf.slice(nl + 1);
          if (line) {
            let parsed;
            try { parsed = JSON.parse(line); } catch (_e) { parsed = null; }
            if (parsed && predicate(parsed)) return resolve(parsed);
          }
        }
        if (Date.now() >= deadline) return resolve(null);
        setTimeout(check, 50);
      }
      setTimeout(check, 50);
    });
  }

  const start    = Date.now();
  const deadline = start + timeoutMs;

  try {
    // Step 1: initialize
    send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'health-check', version: '1.0.0' },
      capabilities: {}
    }});

    const initResp = await waitForLine((m) => m.id === 1, deadline);
    if (!initResp) {
      return { healthy: false, error: 'No initialize response within timeout', toolCount: 0, tools: [], stderr: clip(errorBuf, 500) };
    }

    // Step 2: tools/list
    send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });

    const listResp = await waitForLine((m) => m.id === 2, deadline);
    if (!listResp) {
      return { healthy: false, error: 'No tools/list response within timeout', toolCount: 0, tools: [], stderr: clip(errorBuf, 500) };
    }

    const tools = (listResp.result && listResp.result.tools) || [];
    const toolNames = tools.map((t) => t.name);

    return {
      healthy:       true,
      serverPath,
      toolCount:     toolNames.length,
      tools:         toolNames,
      durationMs:    Date.now() - start,
      serverInfo:    (initResp.result && initResp.result.serverInfo) || null,
      stderr:        clip(errorBuf, 200) || null,
    };
  } finally {
    try { proc.kill(); } catch (_e) { /* already dead */ }
  }
}

function compareMcpServerTools(args) {
  const baselinePath = normalizeFsPath(args.baselineServerPath);
  const revisedPath  = normalizeFsPath(args.revisedServerPath);

  if (!fs.existsSync(baselinePath)) throw new Error(`Baseline not found: ${baselinePath}`);
  if (!fs.existsSync(revisedPath))  throw new Error(`Revised not found: ${revisedPath}`);

  function extractToolNames(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const names = [];
    // Match: name: 'tool_name' or name: "tool_name" inside a TOOLS-like array context
    const regex = /\bname:\s*['"]([a-z][a-z0-9_]{1,60})['"]/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      names.push(m[1]);
    }
    // Deduplicate and filter out likely non-tool names (very short or duplicated by server info)
    return [...new Set(names)].filter((n) => !['name'].includes(n));
  }

  const baselineTools = extractToolNames(baselinePath);
  const revisedTools  = extractToolNames(revisedPath);

  const baselineSet = new Set(baselineTools);
  const revisedSet  = new Set(revisedTools);

  const added   = revisedTools.filter((n) => !baselineSet.has(n));
  const removed = baselineTools.filter((n) => !revisedSet.has(n));
  const shared  = baselineTools.filter((n) => revisedSet.has(n));

  return {
    baseline: { path: baselinePath, toolCount: baselineTools.length, tools: baselineTools },
    revised:  { path: revisedPath,  toolCount: revisedTools.length,  tools: revisedTools  },
    diff: { added, removed, shared },
    summary: {
      added: added.length,
      removed: removed.length,
      shared: shared.length,
      identical: added.length === 0 && removed.length === 0
    }
  };
}

function fetchUrl(url, timeoutMs, maxBytes) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;
    const req = client.get(url, (res) => {
      let body = '';
      let received = 0;

      res.on('data', (chunk) => {
        received += chunk.length;
        if (received > maxBytes) {
          req.destroy(new Error(`Response exceeds maxBytes (${maxBytes})`));
          return;
        }
        body += chunk.toString('utf8');
      });

      res.on('end', () => {
        resolve({ statusCode: res.statusCode || 0, body });
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Timeout after ${timeoutMs}ms`));
    });

    req.on('error', reject);
  });
}

function runShellCommand(command, cwd, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';
    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) {
        child.kill('SIGTERM');
      }
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('close', (exitCode) => {
      finished = true;
      clearTimeout(timer);
      resolve({ exitCode: exitCode == null ? 1 : exitCode, stdout, stderr });
    });

    child.on('error', (error) => {
      finished = true;
      clearTimeout(timer);
      resolve({ exitCode: 1, stdout, stderr: `${stderr}\n${error.message}`.trim() });
    });
  });
}

function normalizeFsPath(p) {
  return path.resolve(String(p || '').replace(/\\/g, '/'));
}

function safeReadDir(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (_error) {
    return [];
  }
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1]).trim() : null;
}

function extractHeadings(html) {
  const headings = [];
  const regex = /<(h1|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push(decodeHtml(match[2]).replace(/\s+/g, ' ').trim());
  }
  return headings.filter(Boolean);
}

function htmlToText(html) {
  return decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));
}

function decodeHtml(text) {
  return String(text)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function toStamp(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function clip(text, limit) {
  const s = String(text || '');
  return s.length > limit ? `${s.slice(0, limit)}\n...[truncated]` : s;
}

function sendResult(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
}

function sendError(id, code, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } })}\n`);
}
