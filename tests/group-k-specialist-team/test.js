'use strict';

const { assert } = require('../lib/assertions');

async function run(context) {
  const rosterRes = await context.client.callTool('generate_specialist_agent_roster', {
    includeStrengths: true,
  });
  assert(rosterRes.ok, 'generate_specialist_agent_roster call failed');
  assert(Array.isArray(rosterRes.json.roles), 'roster response missing roles array');
  assert(rosterRes.json.totalCatalogRoles === 40, `expected 40 catalog roles, got ${rosterRes.json.totalCatalogRoles}`);

  const planRes = await context.client.callTool('plan_specialist_assignments', {
    goal: 'Upgrade MCP servers with better UX, bug finding, and security hardening',
    workstreams: [
      'ux and frontend polish',
      'security and identity hardening',
      'quality engineering and bug hunting',
      'documentation and onboarding'
    ],
    maxAgentsPerWorkstream: 4,
    includeCrossReview: true,
  });
  assert(planRes.ok, 'plan_specialist_assignments call failed');
  assert(Array.isArray(planRes.json.pods) && planRes.json.pods.length >= 3, 'expected at least 3 specialist pods');
  assert(typeof planRes.json.pods[0].lead.id === 'string', 'pod lead id missing');

  const scheduleRes = await context.client.callTool('build_collaboration_schedule', {
    plan: planRes.json,
    sprintDays: 14,
    maxParallelPods: 2,
  });
  assert(scheduleRes.ok, 'build_collaboration_schedule call failed');
  assert(Array.isArray(scheduleRes.json.timeline), 'schedule timeline missing');
  assert(scheduleRes.json.waveCount >= 2, `expected >=2 waves, got ${scheduleRes.json.waveCount}`);

  const promptRes = await context.client.request('prompts/get', {
    name: 'specialist_team_blueprint',
    arguments: {
      goal: 'Run a 40-role software-company style delivery team',
      teamSize: '12',
    },
  });
  const promptText = (((promptRes || {}).messages || [])[0] || {}).content
    ? (((promptRes || {}).messages || [])[0].content.text || '')
    : '';
  assert(typeof promptText === 'string' && promptText.length > 20, 'specialist_team_blueprint should return text');
  assert(promptText.includes('generate_specialist_agent_roster'), 'specialist_team_blueprint should mention roster tool');

  return {
    notes: `specialist roster=${rosterRes.json.selectedCount}, pods=${planRes.json.podCount}, waves=${scheduleRes.json.waveCount}`,
    details: {
      roster: rosterRes.json.selectedCount,
      pods: planRes.json.podCount,
      waves: scheduleRes.json.waveCount,
    },
  };
}

module.exports = { run };
