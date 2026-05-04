/**
 * AI Benchmark Runner — agent-ops-hub
 *
 * Measures system quality across 5 categories:
 *   tool_accuracy       — tools return structurally correct, populated responses
 *   test_suite_health   — pass rate from latest_ai.json
 *   sprint_output_quality — average eval scores from sprint history
 *   api_availability    — key HTTP endpoints respond correctly
 *   response_latency    — tool call response time (lower = better)
 *
 * Writes:
 *   tests/logs/ai-benchmarks.json         (append history)
 *   tests/logs/latest_ai_benchmark.json   (latest only, for dashboard)
 *
 * Usage:
 *   node tests/main-ai-tests/benchmark.js
 *   HUB_PORT=11200 node tests/main-ai-tests/benchmark.js
 */

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT      = parseInt(process.env.HUB_PORT || '11200', 10);
const LOGS_DIR  = path.join(__dirname, '..', 'logs');
const SPRINTS_DIR = path.join(__dirname, '..', '..', 'data', 'sprints');
const BENCHMARK_LOG = path.join(LOGS_DIR, 'ai-benchmarks.json');
const LATEST_LOG    = path.join(LOGS_DIR, 'latest_ai_benchmark.json');
const MODEL         = 'Claude Sonnet 4.6';
const VERSION       = '1.0';

// ── Helpers ──────────────────────────────────────────────────────────────────

function httpRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path: urlPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const start = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        const ms = Date.now() - start;
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(data), ms }); }
        catch { resolve({ statusCode: res.statusCode, body: data, ms }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(new Error('Request timed out')); });
    if (payload) req.write(payload);
    req.end();
  });
}

function callTool(name, args) {
  return httpRequest('POST', '/mcp', {
    jsonrpc: '2.0', id: 1, method: 'tools/call',
    params: { name, arguments: args || {} },
  });
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function score(v, max) { return Math.round(clamp(v / max, 0, 1) * 100); }

// ── Category runners ──────────────────────────────────────────────────────────

async function benchToolAccuracy() {
  const checks = [];

  // 1. export_tool_catalog — should return catalog with tool list
  try {
    const r = await callTool('export_tool_catalog', { format: 'json' });
    const b = r.body?.result?.content?.[0]?.text;
    const parsed = b ? JSON.parse(b) : null;
    const ok = parsed && (Array.isArray(parsed) || Array.isArray(parsed?.tools) || typeof parsed === 'object');
    checks.push({ tool: 'export_tool_catalog', ok, detail: ok ? 'ok' : 'bad shape' });
  } catch (e) { checks.push({ tool: 'export_tool_catalog', ok: false, detail: e.message }); }

  // 2. get_memory — should return object
  try {
    const r = await callTool('get_memory', { key: '__benchmark_probe__' });
    const ok = r.statusCode === 200;
    checks.push({ tool: 'get_memory', ok, detail: ok ? 'responded' : `status=${r.statusCode}` });
  } catch (e) { checks.push({ tool: 'get_memory', ok: false, detail: e.message }); }

  // 3. get_tool_metrics — should return structured metrics
  try {
    const r = await callTool('get_tool_metrics', {});
    const b = r.body?.result?.content?.[0]?.text;
    const parsed = b ? JSON.parse(b) : null;
    const ok = parsed && typeof parsed === 'object' && !Array.isArray(parsed);
    checks.push({ tool: 'get_tool_metrics', ok, detail: ok ? 'ok' : 'bad shape' });
  } catch (e) { checks.push({ tool: 'get_tool_metrics', ok: false, detail: e.message }); }

  // 4. list_loaded_skill_packs — should return array-like
  try {
    const r = await callTool('list_loaded_skill_packs', {});
    const b = r.body?.result?.content?.[0]?.text;
    const parsed = b ? JSON.parse(b) : null;
    const ok = parsed !== null && typeof parsed === 'object';
    checks.push({ tool: 'list_loaded_skill_packs', ok, detail: ok ? 'ok' : 'bad shape' });
  } catch (e) { checks.push({ tool: 'list_loaded_skill_packs', ok: false, detail: e.message }); }

  // 5. get_autonomous_loop_state — should return object or error (tool responds either way)
  try {
    const r = await callTool('get_autonomous_loop_state', {});
    const ok = r.statusCode === 200;
    checks.push({ tool: 'get_autonomous_loop_state', ok, detail: ok ? 'responded' : `status=${r.statusCode}` });
  } catch (e) { checks.push({ tool: 'get_autonomous_loop_state', ok: false, detail: e.message }); }

  const passed = checks.filter(c => c.ok).length;
  return {
    score: score(passed, checks.length),
    checks,
    passed,
    total: checks.length,
  };
}

async function benchTestSuiteHealth() {
  const logPath = path.join(LOGS_DIR, 'latest_ai.json');
  if (!fs.existsSync(logPath)) {
    return { score: 0, detail: 'No test log found — run the test suite first', passRate: 0 };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    const s = raw.summary || {};
    const total = s.total || 0;
    const passed = s.passed || 0;
    const passRate = total > 0 ? passed / total : 0;
    return {
      score: Math.round(passRate * 100),
      passRate: Math.round(passRate * 100),
      passed,
      total,
      failed: s.failed || 0,
      timestamp: raw.timestamp,
    };
  } catch (e) {
    return { score: 0, detail: 'Failed to parse test log: ' + e.message, passRate: 0 };
  }
}

async function benchSprintOutputQuality() {
  // Try to find sprint quality trend from get_sprint_quality_trend tool
  try {
    const r = await callTool('get_sprint_quality_trend', {});
    const b = r.body?.result?.content?.[0]?.text;
    const parsed = b ? JSON.parse(b) : null;
    const sprints = Array.isArray(parsed) ? parsed
      : (parsed?.sprints ? parsed.sprints : (parsed?.trend ? parsed.trend : []));

    if (sprints.length === 0) {
      return { score: 0, detail: 'No sprint history found', avgScore: null };
    }

    // Collect numeric scores from sprints
    const scores = sprints
      .map(s => {
        if (typeof s.avgScore === 'number') return s.avgScore;
        if (typeof s.score === 'number') return s.score;
        if (typeof s.grade === 'string') {
          // Convert letter grade to numeric
          const map = { 'A+': 100, A: 95, 'A-': 90, 'B+': 87, B: 83, 'B-': 80, 'C+': 77, C: 73, 'C-': 70 };
          return map[s.grade] || null;
        }
        return null;
      })
      .filter(v => typeof v === 'number');

    if (scores.length === 0) {
      return { score: 50, detail: 'Sprint history found but no numeric scores', sprintCount: sprints.length };
    }

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      score: Math.round(avg),
      avgScore: Math.round(avg * 10) / 10,
      sprintCount: sprints.length,
      scoredSprints: scores.length,
    };
  } catch (e) {
    return { score: 0, detail: 'Failed: ' + e.message };
  }
}

async function benchApiAvailability() {
  const endpoints = [
    { path: '/health', method: 'GET', expectedStatus: 200 },
    { path: '/api/test-results', method: 'GET', expectedStatus: 200 },
    { path: '/events/recent', method: 'GET', expectedStatus: 200 },
    { path: '/', method: 'GET', expectedStatus: 200 },
  ];

  const results = [];
  for (const ep of endpoints) {
    try {
      const r = await httpRequest(ep.method, ep.path, null);
      const ok = r.statusCode === ep.expectedStatus;
      results.push({ path: ep.path, ok, statusCode: r.statusCode, ms: r.ms });
    } catch (e) {
      results.push({ path: ep.path, ok: false, error: e.message });
    }
  }

  const passed = results.filter(r => r.ok).length;
  return {
    score: score(passed, results.length),
    endpoints: results,
    passed,
    total: results.length,
  };
}

async function benchResponseLatency() {
  const trials = [];
  const toolsToTime = ['export_tool_catalog', 'get_memory', 'get_tool_metrics'];

  for (const toolName of toolsToTime) {
    try {
      const start = Date.now();
      await callTool(toolName, {});
      const ms = Date.now() - start;
      trials.push({ tool: toolName, ms });
    } catch (e) {
      trials.push({ tool: toolName, ms: null, error: e.message });
    }
  }

  const valid = trials.filter(t => t.ms !== null);
  if (valid.length === 0) return { score: 0, detail: 'All latency checks failed', trials };

  const avg = valid.reduce((a, b) => a + b.ms, 0) / valid.length;
  const max = Math.max(...valid.map(t => t.ms));

  // Score based on avg latency:
  // <= 100ms = 100, <= 300ms = 90, <= 500ms = 75, <= 1000ms = 60, <= 2000ms = 40, > 2000ms = 20
  let latencyScore;
  if (avg <= 100)  latencyScore = 100;
  else if (avg <= 300)  latencyScore = 90;
  else if (avg <= 500)  latencyScore = 75;
  else if (avg <= 1000) latencyScore = 60;
  else if (avg <= 2000) latencyScore = 40;
  else latencyScore = 20;

  return {
    score: latencyScore,
    avgMs: Math.round(avg),
    maxMs: max,
    trials,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const timestamp = new Date().toISOString();
  console.log(`\n[benchmark] Starting AI benchmark run — ${timestamp}`);
  console.log(`[benchmark] Connecting to http://127.0.0.1:${PORT}\n`);

  // Verify hub is reachable
  try {
    const health = await httpRequest('GET', '/health', null);
    if (health.statusCode !== 200) throw new Error(`Status ${health.statusCode}`);
    console.log(`[benchmark] Hub healthy — ${JSON.stringify(health.body)}`);
  } catch (e) {
    console.error(`[benchmark] ERROR: Hub not reachable — ${e.message}`);
    console.error('[benchmark] Start agent-ops-hub first, then re-run.');
    process.exit(1);
  }

  console.log('\n[benchmark] Running 5 benchmark categories...');

  const [toolAccuracy, testHealth, sprintQuality, apiAvail, latency] = await Promise.all([
    benchToolAccuracy(),
    benchTestSuiteHealth(),
    benchSprintOutputQuality(),
    benchApiAvailability(),
    benchResponseLatency(),
  ]);

  const categories = {
    tool_accuracy:        { score: toolAccuracy.score,    details: toolAccuracy },
    test_suite_health:    { score: testHealth.score,      details: testHealth },
    sprint_output_quality:{ score: sprintQuality.score,   details: sprintQuality },
    api_availability:     { score: apiAvail.score,        details: apiAvail },
    response_latency:     { score: latency.score,         details: latency },
  };

  const scores = Object.values(categories).map(c => c.score);
  const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Grade
  const grade =
    overall >= 95 ? 'A+' :
    overall >= 90 ? 'A'  :
    overall >= 85 ? 'A-' :
    overall >= 80 ? 'B+' :
    overall >= 75 ? 'B'  :
    overall >= 70 ? 'B-' :
    overall >= 65 ? 'C+' :
    overall >= 60 ? 'C'  : 'D';

  const result = {
    timestamp,
    model: MODEL,
    version: VERSION,
    overall,
    grade,
    scores: Object.fromEntries(Object.entries(categories).map(([k, v]) => [k, v.score])),
    categories,
  };

  // Print summary
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║       AI Benchmark Results           ║');
  console.log('╠══════════════════════════════════════╣');
  for (const [cat, data] of Object.entries(categories)) {
    const bar = '█'.repeat(Math.floor(data.score / 10)) + '░'.repeat(10 - Math.floor(data.score / 10));
    console.log(`║ ${cat.padEnd(24)} ${bar} ${String(data.score).padStart(3)}% ║`);
  }
  console.log('╠══════════════════════════════════════╣');
  console.log(`║ OVERALL: ${grade.padEnd(3)} ${String(overall).padStart(3)}%                     ║`);
  console.log('╚══════════════════════════════════════╝\n');

  // Append to history log
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

  let history = [];
  if (fs.existsSync(BENCHMARK_LOG)) {
    try { history = JSON.parse(fs.readFileSync(BENCHMARK_LOG, 'utf8')); }
    catch { history = []; }
  }
  history.push(result);
  fs.writeFileSync(BENCHMARK_LOG, JSON.stringify(history, null, 2));
  fs.writeFileSync(LATEST_LOG, JSON.stringify(result, null, 2));

  console.log(`[benchmark] Results saved to ${BENCHMARK_LOG}`);
  console.log(`[benchmark] Latest snapshot: ${LATEST_LOG}`);

  return result;
}

main().catch(e => { console.error('[benchmark] Fatal:', e.message); process.exit(1); });
