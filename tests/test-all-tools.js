'use strict';
/**
 * Comprehensive test of every tool in agent-ops-hub v1.0.0
 * Calls every tool via HTTP, reports pass/fail, logs results.
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:11200';
const LOG_DIR = path.resolve(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

let passCount = 0;
let failCount = 0;
let skipCount = 0;
const results = [];

async function callTool(name, args = {}) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } });
    const req = http.request({
      hostname: '127.0.0.1', port: 11200, path: '/mcp', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        try {
          const r = JSON.parse(d);
          if (r.error) {
            resolve({ ok: false, error: r.error.message || JSON.stringify(r.error), raw: r });
            return;
          }
          // MCP wraps: result.content[0].text = JSON stringified tool output, OR result.isError=true
          const rr = r.result || {};
          if (rr.isError) {
            const errText = Array.isArray(rr.content) && rr.content[0] ? rr.content[0].text : 'tool error';
            resolve({ ok: false, error: errText, raw: r });
            return;
          }
          // Unwrap content array
          let toolResult = rr;
          if (Array.isArray(rr.content) && rr.content.length > 0 && rr.content[0].type === 'text') {
            try { toolResult = JSON.parse(rr.content[0].text); }
            catch (_) { toolResult = rr.content[0].text; }
          }
          resolve({ ok: true, result: toolResult, raw: r });
        } catch (e) {
          resolve({ ok: false, error: `JSON parse error: ${e.message}` });
        }
      });
    });
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.setTimeout(30000, () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
    req.write(body);
    req.end();
  });
}

async function test(name, toolName, args, assertFn) {
  const t0 = Date.now();
  let status, error, result;
  try {
    const r = await callTool(toolName, args);
    if (!r.ok) {
      status = 'FAIL';
      error = r.error;
    } else {
      if (assertFn) {
        const msg = assertFn(r.result);
        if (msg) { status = 'FAIL'; error = msg; }
        else status = 'PASS';
      } else {
        status = 'PASS';
      }
      result = r.result;
    }
  } catch (e) {
    status = 'FAIL';
    error = e.message;
  }
  const durationMs = Date.now() - t0;
  const emoji = status === 'PASS' ? '✅' : status === 'SKIP' ? '⏭️' : '❌';
  console.log(`${emoji} [${String(durationMs).padStart(5)}ms] ${toolName} — ${name}${error ? '\n     ERROR: ' + error : ''}`);
  if (status === 'PASS') passCount++;
  else if (status === 'SKIP') skipCount++;
  else failCount++;
  results.push({ name, toolName, status, durationMs, error: error || null });
}

async function skip(name, toolName, reason) {
  console.log(`⏭️  [    -] ${toolName} — ${name} (skipped: ${reason})`);
  skipCount++;
  results.push({ name, toolName, status: 'SKIP', durationMs: 0, error: reason });
}

// ─── Run all tests ────────────────────────────────────────────────────────────

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  agent-ops-hub v1.0.0 — Full Tool Test Suite');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ── Basic / Infrastructure ────────────────────────────────────────────────
  console.log('── Infrastructure & Discovery ──────────────────────────────');
  await test('health check', 'check_server_health', { serverPath: path.resolve(__dirname, '..') },
    r => r.healthy !== undefined ? null : 'missing healthy field');
  await test('list local servers', 'list_local_mcp_servers', {},
    r => Array.isArray(r.servers) ? null : 'missing servers array');
  await test('agent mode preflight', 'agent_mode_preflight', { mcpRootPath: path.resolve(__dirname, '../..') },
    r => r.checks ? null : 'missing checks field');
  await test('semantic tool search', 'semantic_tool_search', { query: 'sprint specialist' },
    r => Array.isArray(r.results) ? null : 'missing results');
  await test('tool dependency graph', 'tool_dependency_graph', {},
    r => typeof r.totalFunctions === 'number' ? null : 'missing totalFunctions');
  await test('code complexity scan', 'code_complexity_scan', { filePath: path.resolve(__dirname, '../mcp-server.js') },
    r => typeof r.totalLines === 'number' ? null : 'missing totalLines');
  await test('estimate refactor risk', 'estimate_refactor_risk', { filePath: path.resolve(__dirname, '../mcp-server.js') },
    r => r.riskScore !== undefined || r.riskLevel !== undefined ? null : 'missing risk score field');
  await test('compare server capabilities', 'compare_server_capabilities', { serverPathA: path.resolve(__dirname, '../mcp-server.js') },
    r => r.serverA !== undefined ? null : 'missing serverA field');

  // ── Research & Patterns ───────────────────────────────────────────────────
  console.log('\n── Research & Patterns ──────────────────────────────────────');
  await test('research agent patterns', 'research_agent_patterns', { topic: 'MCP tool orchestration' },
    r => Array.isArray(r.keywords) ? null : 'missing keywords array');
  await test('research improvement ideas', 'research_improvement_ideas', { area: 'sprint quality' },
    r => typeof r.scanned === 'number' ? null : 'missing scanned field');

  // ── Runbook & Validation ──────────────────────────────────────────────────
  console.log('\n── Runbook & Validation ─────────────────────────────────────');
  await test('create execution runbook', 'create_execution_runbook', {
    name: 'test-plan',
    objective: 'Implement adversarial review gate',
    steps: ['Implement handler', 'Write tests', 'Verify syntax']
  }, r => {
    if (!r.created) return 'created not true';
    if (r.runbook && r.runbook.id && r.runbook.id.startsWith('undefined')) return 'runbook id starts with undefined';
    return null;
  });
  await test('run validation gate', 'run_validation_gate', {
    checkId: 'syntax_ok',
    command: 'node --check mcp-server.js',
    cwd: path.resolve(__dirname, '..')
  }, r => r.passed !== undefined ? null : 'missing passed field');
  await test('benchmark validation gate', 'benchmark_validation_gate', {
    commands: [{ id: 'syntax', command: 'node --check mcp-server.js', cwd: path.resolve(__dirname, '..') }],
    iterations: 2
  }, r => r.iterationsCompleted !== undefined ? null : 'missing iterationsCompleted');

  // ── Artifact & Diff ───────────────────────────────────────────────────────
  console.log('\n── Artifact & Diff ──────────────────────────────────────────');
  await test('summarize test artifacts', 'summarize_test_artifacts', {
    artifactsPath: path.resolve(__dirname, 'logs')
  }, r => r.summary !== undefined || r.fileCount !== undefined ? null : 'missing summary/fileCount: ' + JSON.stringify(r).slice(0,120));
  // Create fixture JSON files for diff test (tool needs {id, steps:[{id,...}]} format)
  const diffFixA = path.join(path.resolve(__dirname, 'fixtures'), 'plan-a.json');
  const diffFixB = path.join(path.resolve(__dirname, 'fixtures'), 'plan-b.json');
  fs.writeFileSync(diffFixA, JSON.stringify({ id: 'plan-a', name: 'Baseline', steps: [{ id: 's1', action: 'lint' }, { id: 's2', action: 'test' }] }, null, 2));
  fs.writeFileSync(diffFixB, JSON.stringify({ id: 'plan-b', name: 'Revised', steps: [{ id: 's1', action: 'lint' }, { id: 's2', action: 'test' }, { id: 's3', action: 'deploy' }] }, null, 2));
  await test('diff execution plans', 'diff_execution_plans', {
    baselinePath: diffFixA,
    revisedPath: diffFixB
  }, r => r.diff !== undefined ? null : 'missing diff: ' + JSON.stringify(r).slice(0,100));

  // ── Scaffold & Test Generation ────────────────────────────────────────────
  console.log('\n── Scaffold & Test Generation ───────────────────────────────');
  await test('generate test scaffold', 'generate_test_scaffold', {
    toolName: 'adversarial_review',
    groupLabel: 'v-adversarial',
    testType: 'unit'
  }, r => typeof r.scaffold === 'string' && r.scaffold.length > 20 ? null : 'scaffold missing/short');

  // ── Specialist Dispatch ────────────────────────────────────────────────────
  console.log('\n── Specialist Dispatch ──────────────────────────────────────');
  // Note: get_agent_loop_state, list_loop_iterations, list_specialists do not exist in this server version
  await test('dispatch specialist task', 'dispatch_specialist_task', {
    specialistId: 'backend_architect',
    taskTitle: 'Review adversarial_review implementation',
    taskContext: 'New tool in agent-ops-hub that builds adversarial prompt bundles',
    outputFormat: 'analysis'
  }, r => r.specialistId === 'backend_architect' ? null : 'wrong specialistId in response');
  await test('dispatch — security_engineer', 'dispatch_specialist_task', {
    specialistId: 'security_engineer',
    taskTitle: 'Security audit of register_tool',
    taskContext: 'Dynamic tool registration with vm.compileFunction sandbox check',
    outputFormat: 'markdown'
  }, r => r.domain === 'security' ? null : `expected security domain, got ${r.domain}`);

  // ── Sprint Execution ───────────────────────────────────────────────────────
  console.log('\n── Sprint Execution ─────────────────────────────────────────');
  await test('run parallel sprint (design adversarial_review)', 'run_parallel_specialist_sprint', {
    sprintName: 'ROADMAP v1.0.0 Design Review',
    tasks: [
      { specialistId: 'backend_architect', taskTitle: 'Review adversarial_review design', taskContext: 'ROADMAP #5 tool for building adversarial prompt bundles' },
      { specialistId: 'systems_architect', taskTitle: 'Validate dependency graph design', taskContext: 'ROADMAP #8 Kahn topological sort + parallel wave execution' },
      { specialistId: 'security_engineer', taskTitle: 'Audit register_tool sandboxing', taskContext: 'ROADMAP #7 vm.compileFunction based dynamic tool registration' }
    ]
  }, r => r.sprintId ? null : 'missing sprintId');

  await test('specialist work log', 'specialist_work_log', {
    action: 'write',
    sprintId: 'test-' + Date.now(),
    entry: {
      sprintName: 'test-run',
      taskCount: 3,
      overallScore: 85,
      grade: 'B',
      perTaskScores: [
        { specialistId: 'backend_architect', taskTitle: 'Tool design', wordCount: 300, totalScore: 79, grade: 'C' }
      ]
    }
  }, r => r.ok === true ? null : 'work log write failed: ' + JSON.stringify(r).slice(0,120));

  // ── Quality Trend ──────────────────────────────────────────────────────────
  console.log('\n── Quality Trend ────────────────────────────────────────────');
  await test('get sprint quality trend', 'get_sprint_quality_trend', { lookbackDays: 30 },
    r => Array.isArray(r.specialists) ? null : 'missing specialists');

  // ── Memory Store ───────────────────────────────────────────────────────────
  console.log('\n── Memory Store ─────────────────────────────────────────────');
  await test('set memory (roadmap.version)', 'set_memory', { key: 'roadmap.version', value: '1.0.0' },
    r => r.ok ? null : 'set_memory returned not ok');
  await test('get memory (roadmap.version)', 'get_memory', { key: 'roadmap.version' },
    r => r.value === '1.0.0' ? null : `expected "1.0.0", got ${r.value}`);
  await test('append memory (roadmap.completedItems)', 'append_memory', { key: 'roadmap.completedItems', item: 'adversarial-review' },
    r => r.ok ? null : 'append_memory returned not ok');
  await test('append memory (2nd item)', 'append_memory', { key: 'roadmap.completedItems', item: 'auto-implement' },
    r => r.newLength >= 2 ? null : `expected length >=2, got ${r.newLength}`);
  await test('get memory (completedItems array)', 'get_memory', { key: 'roadmap.completedItems' },
    r => Array.isArray(r.value) ? null : 'expected array');
  await test('set nested memory', 'set_memory', { key: 'test.nested.deep', value: 42 },
    r => r.ok ? null : 'failed');
  await test('get nested memory', 'get_memory', { key: 'test.nested.deep' },
    r => r.value === 42 ? null : `expected 42, got ${r.value}`);
  await test('get missing key', 'get_memory', { key: 'does.not.exist' },
    r => r.found === false ? null : 'expected found=false for missing key');
  await test('list memory keys (top-level)', 'list_memory_keys', {},
    r => Array.isArray(r.keys) ? null : `expected keys array, got: ${JSON.stringify(r).slice(0,80)}`);
  await test('list memory keys (prefix)', 'list_memory_keys', { prefix: 'roadmap' },
    r => Array.isArray(r.keys) && r.keys.length >= 1 ? null : `expected >=1 key under roadmap, got: ${JSON.stringify(r).slice(0,80)}`);
  await test('clear memory (specific key)', 'clear_memory', { key: 'test.nested.deep' },
    r => r.cleared === true ? null : `expected cleared=true, got: ${JSON.stringify(r).slice(0,80)}`);
  await test('get memory (after clear)', 'get_memory', { key: 'test.nested.deep' },
    r => r.found === false ? null : `expected found=false after clear, got found=${r.found}`);

  // ── ROADMAP #5: Adversarial Review ─────────────────────────────────────────
  console.log('\n── Adversarial Review ───────────────────────────────────────');
  await test('basic adversarial review', 'adversarial_review', {
    content: 'function deleteUser(id) { db.query("DELETE FROM users WHERE id=" + id); }',
    context: 'User management API',
    focusAreas: ['security', 'edge-cases']
  }, r => r.systemPrompt && r.taskPrompt ? null : 'missing prompt bundle');
  await test('adversarial review — plan text', 'adversarial_review', {
    content: 'Step 1: Load all user data. Step 2: Run sort. Step 3: Write back to DB.',
    minObjections: 5
  }, r => r.minObjections === 5 ? null : 'minObjections not reflected');
  await test('adversarial review — diff text', 'adversarial_review', {
    content: '- const port = 8080;\n+ const port = parseInt(process.env.PORT);',
    focusAreas: ['edge-cases', 'breaking-changes']
  }, r => r.focusAreas.includes('edge-cases') ? null : 'focusAreas not preserved');

  // ── ROADMAP #3: Auto-Implement Plan ────────────────────────────────────────
  console.log('\n── Auto-Implement Plan ──────────────────────────────────────');
  // Create a test fixture file
  const fixtureDir = path.resolve(__dirname, 'fixtures');
  if (!fs.existsSync(fixtureDir)) fs.mkdirSync(fixtureDir, { recursive: true });
  const testFixture = path.join(fixtureDir, 'test-auto-implement.js');
  fs.writeFileSync(testFixture, "'use strict';\nconst VERSION = '0.0.1';\nmodule.exports = { VERSION };\n");

  await test('auto-implement dry run', 'auto_implement_plan', {
    targetFile: testFixture,
    edits: [{ find: "'0.0.1'", replace: "'0.0.2'" }],
    dryRun: true
  }, r => r.dryRun === true && r.appliedCount >= 0 ? null : 'dry run failed');

  await test('auto-implement apply', 'auto_implement_plan', {
    targetFile: testFixture,
    edits: [{ find: "'0.0.1'", replace: "'0.0.2'" }],
    dryRun: false
  }, r => r.dryRun === false && r.syntaxOk === true ? null : `apply failed: ${r.message}`);

  // Verify file was changed
  const content = fs.readFileSync(testFixture, 'utf8');
  if (!content.includes("'0.0.2'")) {
    results.push({ name: 'file actually changed', toolName: 'auto_implement_plan', status: 'FAIL', durationMs: 0, error: 'File content not updated' });
    failCount++; console.log("❌ [    -] auto_implement_plan — file actually changed\n     ERROR: File content not updated");
  } else {
    results.push({ name: 'file actually changed', toolName: 'auto_implement_plan', status: 'PASS', durationMs: 0, error: null });
    passCount++; console.log("✅ [    -] auto_implement_plan — file actually changed");
  }

  await test('auto-implement with bad find (no match)', 'auto_implement_plan', {
    targetFile: testFixture,
    edits: [{ find: 'THIS_DOES_NOT_EXIST', replace: 'something' }],
    dryRun: true
  }, r => r.failedCount >= 1 ? null : 'expected failedCount>=1 for no-match edit');

  // Nonexistent file — expect error
  const badFileRes = await callTool('auto_implement_plan', { targetFile: path.join(fixtureDir, 'not-a-real-file.js'), dryRun: true });
  if (!badFileRes.ok) { passCount++; console.log('✅ [    -] auto_implement_plan — nonexistent file correctly errors'); results.push({ name: 'nonexistent file errors', toolName: 'auto_implement_plan', status: 'PASS', durationMs: 0, error: null }); }
  else { failCount++; console.log('❌ [    -] auto_implement_plan — expected error for nonexistent file'); results.push({ name: 'nonexistent file errors', toolName: 'auto_implement_plan', status: 'FAIL', durationMs: 0, error: 'Should have thrown' }); }

  // Path traversal — expect error
  const traversalRes = await callTool('auto_implement_plan', { targetFile: '../../etc/passwd', dryRun: true });
  if (!traversalRes.ok) { passCount++; console.log('✅ [    -] auto_implement_plan — path traversal correctly blocked'); results.push({ name: 'path traversal blocked', toolName: 'auto_implement_plan', status: 'PASS', durationMs: 0, error: null }); }
  else { failCount++; console.log('❌ [    -] auto_implement_plan — path traversal should have been rejected'); results.push({ name: 'path traversal blocked', toolName: 'auto_implement_plan', status: 'FAIL', durationMs: 0, error: 'Path traversal not blocked' }); }

  // ── ROADMAP #4: Research Scraper ────────────────────────────────────────────
  console.log('\n── Scrape Research URL ──────────────────────────────────────');
  await test('scrape research url (example.com)', 'scrape_research_url', {
    url: 'http://example.com',
    topic: 'web scraping research',
    maxChars: 500,
    saveInsight: false
  }, r => r.url === 'http://example.com' && r.charCount > 0 ? null : 'missing charCount');
  await test('scrape with save=true', 'scrape_research_url', {
    url: 'http://example.com',
    topic: 'test topic',
    saveInsight: true
  }, r => r.url === 'http://example.com' ? null : 'wrong url');
  // Bad URL — expect error (port 99999 is invalid, URL rejected before network call)
  const badUrlRes = await callTool('scrape_research_url', { url: 'http://127.0.0.1:99999/nothing', topic: 'test', saveInsight: false });
  if (!badUrlRes.ok) { passCount++; console.log('✅ [    -] scrape_research_url — bad url correctly errors'); results.push({ name: 'scrape bad url (should error)', toolName: 'scrape_research_url', status: 'PASS', durationMs: 0, error: null }); }
  else { failCount++; console.log('❌ [    -] scrape_research_url — bad url should have errored'); results.push({ name: 'scrape bad url (should error)', toolName: 'scrape_research_url', status: 'FAIL', durationMs: 0, error: 'Expected error for invalid URL' }); }

  // ── ROADMAP #7: Register / Unregister ──────────────────────────────────────
  console.log('\n── Tool Self-Registration ───────────────────────────────────');
  await test('register a dynamic tool', 'register_tool', {
    name: 'test_dynamic_tool',
    description: 'A test dynamic tool that adds two numbers',
    inputSchema: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } } },
    handlerCode: 'return { sum: (args.a || 0) + (args.b || 0), ok: true };'
  }, r => r.registered === true ? null : 'registered not true');
  await test('call registered dynamic tool', 'test_dynamic_tool', { a: 7, b: 5 },
    r => r.sum === 12 ? null : `expected sum=12, got ${r.sum}`);
  // Duplicate register — must error
  const dupRes = await callTool('register_tool', { name: 'test_dynamic_tool', description: 'dup', handlerCode: 'return {};' });
  if (!dupRes.ok) { passCount++; console.log('✅ [    -] register_tool — duplicate correctly rejected'); results.push({ name: 'duplicate rejected', toolName: 'register_tool', status: 'PASS', durationMs: 0, error: null }); }
  else { failCount++; console.log('❌ [    -] register_tool — duplicate should have been rejected'); results.push({ name: 'duplicate rejected', toolName: 'register_tool', status: 'FAIL', durationMs: 0, error: 'Should have thrown' }); }

  // Syntax error in handler — must error
  const syntaxBadRes = await callTool('register_tool', { name: 'broken_tool', description: 'broken', handlerCode: 'return { { invalid {{(' });
  if (!syntaxBadRes.ok) { passCount++; console.log('✅ [    -] register_tool — bad syntax correctly rejected'); results.push({ name: 'bad syntax rejected', toolName: 'register_tool', status: 'PASS', durationMs: 0, error: null }); }
  else { failCount++; console.log('❌ [    -] register_tool — bad syntax should be rejected'); results.push({ name: 'bad syntax rejected', toolName: 'register_tool', status: 'FAIL', durationMs: 0, error: 'Should have rejected bad syntax' }); }

  await test('unregister dynamic tool', 'unregister_tool', { name: 'test_dynamic_tool' },
    r => r.unregistered === true ? null : 'unregistered not true');

  // Unregistered tool must fail
  const unregRes = await callTool('test_dynamic_tool', { a: 1, b: 2 });
  if (!unregRes.ok) { passCount++; console.log('✅ [    -] unregister_tool — unregistered tool correctly fails'); results.push({ name: 'unregistered tool fails', toolName: 'unregister_tool', status: 'PASS', durationMs: 0, error: null }); }
  else { failCount++; console.log('❌ [    -] unregister_tool — unregistered tool should fail'); results.push({ name: 'unregistered tool fails', toolName: 'unregister_tool', status: 'FAIL', durationMs: 0, error: 'Should have thrown' }); }

  // Core tool must be protected
  const coreUnregRes = await callTool('unregister_tool', { name: 'get_memory' });
  if (!coreUnregRes.ok) { passCount++; console.log('✅ [    -] unregister_tool — core tool correctly protected'); results.push({ name: 'core tool protected', toolName: 'unregister_tool', status: 'PASS', durationMs: 0, error: null }); }
  else { failCount++; console.log('❌ [    -] unregister_tool — core tool should be protected'); results.push({ name: 'core tool protected', toolName: 'unregister_tool', status: 'FAIL', durationMs: 0, error: 'Should not unregister core tools' }); }

  // ── ROADMAP #8: Dependency Graph ────────────────────────────────────────────
  console.log('\n── Dependency Graph Execution ───────────────────────────────');
  await test('linear 2-node graph', 'execute_dependency_graph', {
    nodes: [
      { id: 'n1', toolName: 'get_memory', args: { key: 'roadmap.version' }, label: 'Get version' },
      { id: 'n2', toolName: 'get_memory', args: { key: 'roadmap.completedItems' }, label: 'Get completed' }
    ],
    edges: [{ from: 'n1', to: 'n2' }]
  }, r => r.results && r.results.n1 && r.results.n2 ? null : 'missing results nodes');

  await test('parallel 2-node graph (no edges)', 'execute_dependency_graph', {
    nodes: [
      { id: 'a', toolName: 'get_memory', args: { key: 'roadmap.version' } },
      { id: 'b', toolName: 'get_memory', args: { key: 'test.nested.deep' } }
    ],
    edges: []
  }, r => r.waveCount === 1 ? null : `expected 1 wave, got ${r.waveCount}`);

  await test('diamond graph (a→b, a→c, b→d, c→d)', 'execute_dependency_graph', {
    nodes: [
      { id: 'a', toolName: 'get_memory', args: { key: 'roadmap.version' } },
      { id: 'b', toolName: 'get_memory', args: { key: 'roadmap.version' } },
      { id: 'c', toolName: 'get_memory', args: { key: 'test.nested.deep' } },
      { id: 'd', toolName: 'get_memory', args: { key: 'roadmap.completedItems' } }
    ],
    edges: [{ from: 'a', to: 'b' }, { from: 'a', to: 'c' }, { from: 'b', to: 'd' }, { from: 'c', to: 'd' }]
  }, r => r.waveCount === 3 ? null : `expected 3 waves, got ${r.waveCount}`);

  // Cycle detection — expect error
  const cycleArgs = { nodes: [{ id: 'a', toolName: 'get_memory', args: { key: 'x' } }, { id: 'b', toolName: 'get_memory', args: { key: 'x' } }], edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }] };
  const cycleRes = await callTool('execute_dependency_graph', cycleArgs);
  if (!cycleRes.ok) { passCount++; console.log('✅ [    -] execute_dependency_graph — cycle correctly detected'); results.push({ name: 'cycle detection (a→b, b→a)', toolName: 'execute_dependency_graph', status: 'PASS', durationMs: 0, error: null }); }
  else { failCount++; console.log('❌ [    -] execute_dependency_graph — cycle should error'); results.push({ name: 'cycle detection (a→b, b→a)', toolName: 'execute_dependency_graph', status: 'FAIL', durationMs: 0, error: 'Should detect cycle' }); }

  await test('stopOnError=true halts on fail', 'execute_dependency_graph', {
    nodes: [
      { id: 'ok', toolName: 'get_memory', args: { key: 'roadmap.version' } },
      { id: 'bad', toolName: 'nonexistent_tool_xyz', args: {} }
    ],
    edges: [{ from: 'ok', to: 'bad' }],
    stopOnError: true
  }, r => r.aborted === true ? null : 'expected aborted=true, got: ' + JSON.stringify(r).slice(0,120));

  // ── ROADMAP #9: Skill Pack Runtime ─────────────────────────────────────────
  console.log('\n── Skill Pack Runtime ───────────────────────────────────────');
  const packDir = path.resolve(__dirname, '../artifacts/skill-packs');
  if (!fs.existsSync(packDir)) fs.mkdirSync(packDir, { recursive: true });

  const manifest1 = {
    id: 'test-pack-1',
    name: 'Test Skill Pack 1',
    version: '0.1.0',
    tools: [
      {
        name: 'sp_greet',
        description: 'Returns a greeting',
        inputSchema: { type: 'object', properties: { name: { type: 'string' } } },
        handlerCode: 'return { greeting: "Hello, " + (args.name || "world") + "!" };'
      },
      {
        name: 'sp_add',
        description: 'Adds two numbers',
        inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } } },
        handlerCode: 'return { result: (args.x || 0) + (args.y || 0) };'
      }
    ]
  };
  const manifest1Path = path.join(packDir, 'test-pack-1.json');
  fs.writeFileSync(manifest1Path, JSON.stringify(manifest1, null, 2));

  await test('load skill pack', 'load_skill_pack', { manifestPath: manifest1Path },
    r => r.packId === 'test-pack-1' && r.loadedTools.length === 2 ? null : `expected 2 tools, got ${r.loadedTools?.length}`);
  await test('call sp_greet from skill pack', 'sp_greet', { name: 'agent-ops-hub' },
    r => r.greeting && r.greeting.includes('agent-ops-hub') ? null : `bad greeting: ${r.greeting}`);
  await test('call sp_add from skill pack', 'sp_add', { x: 10, y: 32 },
    r => r.result === 42 ? null : `expected 42, got ${r.result}`);
  await test('list loaded skill packs', 'list_loaded_skill_packs', {},
    r => r.packCount >= 1 ? null : `expected >=1 pack, got ${r.packCount}`);
  // Duplicate pack — expect error (manual pattern)
  const dupPackRes2 = await callTool('load_skill_pack', { manifestPath: manifest1Path });
  if (!dupPackRes2.ok) { passCount++; console.log('✅ [    -] load_skill_pack — duplicate pack correctly rejected'); results.push({ name: 'duplicate pack rejected', toolName: 'load_skill_pack', status: 'PASS', durationMs: 0, error: null }); }
  else { failCount++; console.log('❌ [    -] load_skill_pack — duplicate pack should be rejected'); results.push({ name: 'duplicate pack rejected', toolName: 'load_skill_pack', status: 'FAIL', durationMs: 0, error: 'Should reject duplicate pack' }); }

  await test('unload skill pack', 'unload_skill_pack', { id: 'test-pack-1' },
    r => r.packId === 'test-pack-1' && r.unloaded.length === 2 ? null : `expected 2 unloaded, got ${r.unloaded?.length}`);
  // Nonexistent pack — expect error (manual pattern)
  const noPackRes2 = await callTool('unload_skill_pack', { id: 'does-not-exist' });
  if (!noPackRes2.ok) { passCount++; console.log('✅ [    -] unload_skill_pack — nonexistent pack correctly errors'); results.push({ name: 'nonexistent pack errors', toolName: 'unload_skill_pack', status: 'PASS', durationMs: 0, error: null }); }
  else { failCount++; console.log('❌ [    -] unload_skill_pack — nonexistent pack should error'); results.push({ name: 'nonexistent pack errors', toolName: 'unload_skill_pack', status: 'FAIL', durationMs: 0, error: 'Should error' }); }

  // ── ROADMAP #10: Multi-Server Orchestration ─────────────────────────────────
  console.log('\n── Multi-Server Orchestration ───────────────────────────────');
  await test('list available servers', 'list_available_servers', {},
    r => typeof r.serverCount === 'number' ? null : 'missing serverCount');
  await test('list available servers (with health check)', 'list_available_servers', { checkHealth: true },
    r => r.runningCount >= 1 ? null : `expected >=1 running server, got ${r.runningCount}`);
  await test('delegate to self (get_memory)', 'delegate_to_server', {
    serverUrl: 'http://127.0.0.1:11200',
    toolName: 'get_memory',
    args: { key: 'roadmap.version' }
  }, r => {
    // delegate_to_server wraps result as {result: {content:[{type:'text',text:'{...}'}]}}
    if (!r.result) return 'missing r.result';
    const inner = Array.isArray(r.result.content) ? (() => { try { return JSON.parse(r.result.content[0].text); } catch(_) { return null; } })() : r.result;
    if (!inner) return 'cannot parse inner result';
    return inner.value === '1.0.0' ? null : `expected value=1.0.0, got ${inner.value}`;
  });
  // Delegate to bad server — expect error (manual pattern)
  const badDelegRes2 = await callTool('delegate_to_server', { serverUrl: 'http://127.0.0.1:19999', toolName: 'get_memory', args: { key: 'x' }, timeoutMs: 1000 });
  if (!badDelegRes2.ok) { passCount++; console.log('✅ [    -] delegate_to_server — bad server correctly errors'); results.push({ name: 'bad server errors', toolName: 'delegate_to_server', status: 'PASS', durationMs: 0, error: null }); }
  else { failCount++; console.log('❌ [    -] delegate_to_server — bad server should error'); results.push({ name: 'bad server errors', toolName: 'delegate_to_server', status: 'FAIL', durationMs: 0, error: 'Should error on bad server' }); }

  // Spawn child server and capture serverId for the stop test
  const firstSpawnRes = await callTool('spawn_child_server', {
    serverPath: path.resolve(__dirname, '..'),
    port: 11350,
    label: 'test-child'
  });
  const childId = firstSpawnRes.ok ? firstSpawnRes.result.serverId : null;
  if (firstSpawnRes.ok && childId) {
    passCount++;
    const pid = firstSpawnRes.result.pid;
    console.log(`✅ [    -] spawn_child_server — spawn child server (id=${childId}, pid=${pid})`);
    results.push({ name: 'spawn child server', toolName: 'spawn_child_server', status: 'PASS', durationMs: 0, error: null });
  } else {
    failCount++;
    console.log('❌ [    -] spawn_child_server — spawn child server FAILED: ' + (firstSpawnRes.error || 'unknown'));
    results.push({ name: 'spawn child server', toolName: 'spawn_child_server', status: 'FAIL', durationMs: 0, error: firstSpawnRes.error || 'spawn failed' });
  }

  // Wait a moment for child to start
  await new Promise(r => setTimeout(r, 2000));

  await test('list available servers (child running)', 'list_available_servers', { checkHealth: true },
    r => r.runningCount >= 1 ? null : 'expected servers running');

  // Stop the child we spawned above
  if (childId) {
    await test('stop child server', 'stop_child_server', { serverId: childId },
      r => r.stopped === true ? null : 'stopped not true');
  } else {
    skipCount++;
    console.log('⏭️  [    -] stop_child_server — skip (no child spawned)');
    results.push({ name: 'stop child server', toolName: 'stop_child_server', status: 'SKIP', durationMs: 0, error: 'spawn failed' });
  }
  // Stop nonexistent child — expect error (manual pattern, id has no child- prefix)
  const badStopRes2 = await callTool('stop_child_server', { serverId: 'fake-9999' });
  if (!badStopRes2.ok) { passCount++; console.log('✅ [    -] stop_child_server — nonexistent server correctly errors'); results.push({ name: 'bad server stop errors', toolName: 'stop_child_server', status: 'PASS', durationMs: 0, error: null }); }
  else { failCount++; console.log('❌ [    -] stop_child_server — nonexistent server should error'); results.push({ name: 'bad server stop errors', toolName: 'stop_child_server', status: 'FAIL', durationMs: 0, error: 'Should error' }); }

  // ── Remaining catalog tools ─────────────────────────────────────────────────
  console.log('\n── Additional Tools ─────────────────────────────────────────');
  await test('evaluate sprint output', 'evaluate_sprint_output', {
    sprintId: 'eval-test-' + Date.now(),
    outputs: [
      {
        specialistId: 'backend_architect',
        domain: 'backend',
        output: `## Database Throughput Improvements\n\n### Actions\n- Implement connection pooling with a pool size of 20 to reduce latency by ~40ms\n- Add Redis cache layer for frequently accessed API endpoints\n- Replace N+1 queries with batch loading (implement DataLoader pattern)\n- Add database indexes on foreign keys: user_id, org_id, created_at\n- Configure query timeout to 5000ms to prevent runaway queries\n\n### Conflicts\n- Connection pool size increase requires infra change (max_connections=200)\n- Redis cache invalidation strategy needed before deploy\n\n### Score\nImpact: high | Complexity: medium | Risk: low`
      },
      {
        specialistId: 'security_engineer',
        domain: 'security',
        output: `## API Security Hardening\n\n### Actions\n- Add input validation middleware at all API boundaries to prevent injection attacks\n- Implement rate limiting (100 req/min per IP) using sliding window algorithm\n- Replace Bearer token with short-lived JWTs (15min expiry + refresh token)\n- Add OWASP CSP headers to all responses\n- Enforce HTTPS redirect for all HTTP traffic\n\n### Conflicts\n- JWT rotation may break existing mobile clients — needs migration period\n\n### Score\nImpact: critical | Complexity: medium | Risk: low`
      }
    ]
  }, r => {
    if (typeof r.overallScore !== 'number') return 'missing overallScore';
    if (r.overallScore < 50) return `score too low: ${r.overallScore}/100 (expected >=50)`;
    return null;
  });
  await test('synthesize sprint outputs', 'synthesize_sprint_outputs', {
    sprintId: 'synth-test-' + Date.now(),
    outputs: [
      { specialistId: 'backend_architect', output: 'Implement caching layer using Redis for frequently accessed data. Add connection pooling with size 20.' },
      { specialistId: 'systems_architect', output: 'Add circuit breaker pattern for external service calls. Use exponential backoff with jitter.' }
    ]
  }, r => r.synthesizedAt ? null : 'missing synthesizedAt field');

  // ── Final Summary ───────────────────────────────────────────────────────────
  const total = passCount + failCount + skipCount;
  const pct = total > 0 ? Math.round(passCount / total * 100) : 0;
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passCount} passed / ${failCount} failed / ${skipCount} skipped`);
  console.log(`  TOTAL: ${total} tests — ${pct}% pass rate`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Write logs
  const aiLog = {
    timestamp: new Date().toISOString(),
    suite: 'full-tool-test-v1.0.0',
    version: '1.0.0',
    tests: results.map((r, i) => ({ id: i + 1, ...r })),
    summary: { total, passed: passCount, failed: failCount, skipped: skipCount, passRate: pct }
  };
  fs.writeFileSync(path.join(LOG_DIR, 'latest_ai.json'), JSON.stringify(aiLog, null, 2));

  const md = [
    '# agent-ops-hub v1.0.0 Full Tool Test Report',
    `**Date:** ${new Date().toISOString()}`,
    '',
    `## Summary`,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total Tests | ${total} |`,
    `| ✅ Passed | ${passCount} |`,
    `| ❌ Failed | ${failCount} |`,
    `| ⏭️ Skipped | ${skipCount} |`,
    `| Pass Rate | ${pct}% |`,
    '',
    '## Results',
    ...results.map((r) => {
      const e = r.status === 'PASS' ? '✅' : r.status === 'SKIP' ? '⏭️' : '❌';
      return `${e} \`${r.toolName}\` — ${r.name}${r.error ? `\n   > Error: \`${r.error}\`` : ''}`;
    })
  ].join('\n');
  fs.writeFileSync(path.join(LOG_DIR, 'latest_human.md'), md);

  console.log(`Logs written to:\n  ${path.join(LOG_DIR, 'latest_ai.json')}\n  ${path.join(LOG_DIR, 'latest_human.md')}`);

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(2); });
