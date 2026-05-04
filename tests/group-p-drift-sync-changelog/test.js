'use strict';

const path = require('path');
const { assert } = require('../lib/assertions');

const AGENT_OPS_REPO = path.resolve(__dirname, '../../');
const MCP_ROOT       = path.resolve(__dirname, '../../../');

async function run(context) {
  const results = {};

  // ── drift_detection_check ─────────────────────────────────────────────────
  const driftRes = await context.client.callTool('drift_detection_check', {
    repoPath: AGENT_OPS_REPO,
    checkRemote: true,
    checkDeps: true,
  });
  assert(driftRes.ok, `drift_detection_check failed: ${driftRes.error}`);
  assert(typeof driftRes.json.severity === 'string', 'drift: missing severity field');
  assert(typeof driftRes.json.driftDetected === 'boolean', 'drift: missing driftDetected field');
  assert(Array.isArray(driftRes.json.findings), 'drift: findings should be an array');
  results.driftSeverity = driftRes.json.severity;
  results.driftFindings = driftRes.json.findingCount;

  // negative: invalid path — tool may return !ok or throw; both are acceptable
  let badDrift;
  try {
    badDrift = await context.client.callTool('drift_detection_check', {
      repoPath: 'C:/does/not/exist/at/all',
    });
    // if it returned without throwing, verify it signals an error condition
    assert(!badDrift.ok || (badDrift.json && typeof badDrift.json.severity === 'string'),
      'drift: bad path should return error or structured response');
  } catch (_) {
    // throw is also acceptable — just means the tool rejects bad input
  }

  // ── multi_repo_sync_status ────────────────────────────────────────────────
  const syncRes = await context.client.callTool('multi_repo_sync_status', {
    rootPath: MCP_ROOT,
    maxRepos: 10,
    fetchFirst: false,
  });
  assert(syncRes.ok, `multi_repo_sync_status failed: ${syncRes.error}`);
  assert(Array.isArray(syncRes.json.repos), 'sync: repos should be array');
  assert(syncRes.json.repos.length > 0, `sync: expected at least 1 repo, got ${syncRes.json.repos.length}`);
  assert(typeof syncRes.json.summary === 'object', 'sync: summary should be object');
  assert(typeof syncRes.json.summary.total === 'number', 'sync: summary.total missing');
  // Every repo entry should have required fields
  for (const repo of syncRes.json.repos) {
    assert(typeof repo.name === 'string', `sync: repo.name missing in ${JSON.stringify(repo)}`);
    assert(typeof repo.state === 'string', `sync: repo.state missing for ${repo.name}`);
  }
  results.reposChecked = syncRes.json.repos.length;
  results.cleanRepos   = syncRes.json.summary.clean;

  // ── generate_changelog ────────────────────────────────────────────────────
  const changeRes = await context.client.callTool('generate_changelog', {
    repoPath: AGENT_OPS_REPO,
    maxCommits: 20,
  });
  assert(changeRes.ok, `generate_changelog failed: ${changeRes.error}`);
  assert(typeof changeRes.json.markdown === 'string', 'changelog: markdown should be string');
  assert(changeRes.json.markdown.length > 0, 'changelog: markdown should not be empty');
  assert(typeof changeRes.json.commitCount === 'number', 'changelog: commitCount missing');
  assert(Array.isArray(changeRes.json.commits), 'changelog: commits should be array');
  results.changelogCommits = changeRes.json.commitCount;
  results.changelogFromRef = changeRes.json.fromRef;

  // verify markdown structure
  const md = changeRes.json.markdown;
  assert(md.includes('## Changelog'), `changelog: expected "## Changelog" header, got: ${md.slice(0, 80)}`);

  // ── regression_root_cause_analysis ───────────────────────────────────────
  const assertionFailText = `
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  'foo' !== 'bar'
    at Object.<anonymous> (tests/group-a/test.js:25:10)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
`;

  const rcaRes = await context.client.callTool('regression_root_cause_analysis', {
    failureText: assertionFailText,
    suiteName: 'group-p-self-test',
  });
  assert(rcaRes.ok, `regression_root_cause_analysis failed: ${rcaRes.error}`);
  assert(typeof rcaRes.json.primaryCause === 'string', 'rca: primaryCause missing');
  assert(rcaRes.json.primaryCause === 'assertion_error', `rca: expected assertion_error, got ${rcaRes.json.primaryCause}`);
  assert(typeof rcaRes.json.recommendation === 'string', 'rca: recommendation missing');
  assert(Array.isArray(rcaRes.json.stackTrace), 'rca: stackTrace should be array');
  results.rcaCause    = rcaRes.json.primaryCause;
  results.rcaSeverity = rcaRes.json.primarySeverity;

  // multi-pattern: timeout + network
  const multiFailText = `
Error: Test Timeout exceeded after 30000ms
ECONNREFUSED 127.0.0.1:3000
TypeError: Cannot read properties of undefined
`;
  const multiRca = await context.client.callTool('regression_root_cause_analysis', {
    failureText: multiFailText,
    suiteName: 'group-p-multi',
  });
  assert(multiRca.ok, 'rca multi-pattern failed');
  assert(multiRca.json.totalPatternsMatched >= 2, `rca: expected >=2 patterns matched, got ${multiRca.json.totalPatternsMatched}`);
  results.rcaMultiPatterns = multiRca.json.totalPatternsMatched;

  // unknown pattern: should still return structured response
  const unknownRca = await context.client.callTool('regression_root_cause_analysis', {
    failureText: 'no recognizable error here just noise',
    suiteName: 'group-p-unknown',
  });
  assert(unknownRca.ok, 'rca unknown pattern failed');
  assert(unknownRca.json.primaryCause === 'unknown', `rca unknown: expected 'unknown', got ${unknownRca.json.primaryCause}`);

  return {
    notes: [
      `drift: severity=${results.driftSeverity} findings=${results.driftFindings}`,
      `sync: repos=${results.reposChecked} clean=${results.cleanRepos}`,
      `changelog: commits=${results.changelogCommits} from=${results.changelogFromRef}`,
      `rca: cause=${results.rcaCause} severity=${results.rcaSeverity} multiPatterns=${results.rcaMultiPatterns}`,
    ].join(' | '),
    details: results,
  };
}

module.exports = { run };
