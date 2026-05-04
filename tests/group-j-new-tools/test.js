'use strict';

const path = require('path');
const fs = require('fs');
const { assert, assertIncludes } = require('../lib/assertions');

async function run(context) {
  const results = {};

  // ── validate_json_schema ──────────────────────────────────────────────────
  const validRes = await context.client.callTool('validate_json_schema', {
    data: { name: 'alice', age: 30 },
    schema: {
      type: 'object',
      required: ['name', 'age'],
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    },
  });
  assert(validRes.ok, 'validate_json_schema: valid value should return ok');
  assert(validRes.json.valid === true, `validate_json_schema: valid should be true, got ${validRes.json.valid}`);
  results.validatePass = true;

  const invalidRes = await context.client.callTool('validate_json_schema', {
    data: { name: 123 },
    schema: {
      type: 'object',
      required: ['name', 'age'],
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    },
  });
  assert(invalidRes.ok, 'validate_json_schema: invalid value call should not crash');
  assert(invalidRes.json.valid === false, 'validate_json_schema: should report invalid');
  assert(Array.isArray(invalidRes.json.errors) && invalidRes.json.errors.length > 0, 'validate_json_schema: should list errors');
  results.validateFail = true;

  // ── find_missing_tests ────────────────────────────────────────────────────
  const missingRes = await context.client.callTool('find_missing_tests', {
    serverDir: path.resolve(__dirname, '../..'),
    testsDir: path.resolve(__dirname, '..'),
  });
  assert(missingRes.ok, 'find_missing_tests: call should succeed');
  assert(typeof missingRes.json.toolCount === 'number', 'find_missing_tests: should return toolCount');
  assert(Array.isArray(missingRes.json.missingTests), 'find_missing_tests: should return missingTests array');
  results.findMissing = { total: missingRes.json.toolCount, missing: missingRes.json.missingCount };

  // ── code_quality_gate ─────────────────────────────────────────────────────
  const serverJsPath = path.resolve(__dirname, '../../mcp-server.js');
  const qualRes = await context.client.callTool('code_quality_gate', {
    files: [serverJsPath],
  });
  assert(qualRes.ok, 'code_quality_gate: call should succeed');
  assert(typeof qualRes.json.avgScore === 'number', 'code_quality_gate: should return numeric avgScore');
  assert(qualRes.json.avgScore >= 0 && qualRes.json.avgScore <= 100, `code_quality_gate: score out of range: ${qualRes.json.avgScore}`);
  results.qualityGate = { score: qualRes.json.avgScore, allPassed: qualRes.json.allPassed };

  // ── roadmap_tracker ───────────────────────────────────────────────────────
  const roadmapFilePath = path.resolve(__dirname, '../../artifacts/test-roadmap.json');
  // Ensure clean state
  if (fs.existsSync(roadmapFilePath)) fs.unlinkSync(roadmapFilePath);

  const roadmapData = {
    title: 'Test Roadmap',
    phases: [
      {
        id: 'p1',
        title: 'Phase 1',
        tasks: [
          { id: 't1', title: 'Add validate_json_schema', status: 'done' },
          { id: 't2', title: 'Add find_missing_tests', status: 'done' },
          { id: 't3', title: 'Add roadmap_tracker', status: 'in-progress' },
        ],
      },
    ],
  };

  const rtWrite = await context.client.callTool('roadmap_tracker', {
    action: 'write',
    roadmapPath: roadmapFilePath,
    roadmap: roadmapData,
  });
  assert(rtWrite.ok, 'roadmap_tracker write: should succeed');
  assert(rtWrite.json.written === true, 'roadmap_tracker write: written should be true');

  const rtRead = await context.client.callTool('roadmap_tracker', {
    action: 'read',
    roadmapPath: roadmapFilePath,
  });
  assert(rtRead.ok, 'roadmap_tracker read: should succeed');
  assert(typeof rtRead.json.totalTasks === 'number' && rtRead.json.totalTasks === 3, 'roadmap_tracker read: should return 3 total tasks');

  const rtUpdate = await context.client.callTool('roadmap_tracker', {
    action: 'update_task',
    roadmapPath: roadmapFilePath,
    phaseId: 'p1',
    taskId: 't3',
    status: 'done',
  });
  assert(rtUpdate.ok, 'roadmap_tracker update_task: should succeed');
  assert(rtUpdate.json.newStatus === 'done', 'roadmap_tracker update_task: newStatus should be done');
  results.roadmapTracker = { phaseId: rtUpdate.json.phaseId, taskId: rtUpdate.json.taskId };

  // ── scan_tool_coverage ────────────────────────────────────────────────────
  const scanRes = await context.client.callTool('scan_tool_coverage', {
    serverDir: path.resolve(__dirname, '../..'),
    testsDir: path.resolve(__dirname, '..'),
  });
  assert(scanRes.ok, 'scan_tool_coverage: call should succeed');
  assert(typeof scanRes.json.toolCount === 'number', 'scan_tool_coverage: should return toolCount');
  results.scanCoverage = { total: scanRes.json.toolCount, covered: scanRes.json.covered.length };

  return {
    notes: `validate_json_schema ✓, find_missing_tests (total=${results.findMissing.total}, missing=${results.findMissing.missing}), code_quality_gate score=${results.qualityGate.score} allPassed=${results.qualityGate.allPassed}, roadmap_tracker ✓, scan_coverage=${results.scanCoverage.covered}/${results.scanCoverage.total}`,
    details: results,
  };
}

module.exports = { run };
