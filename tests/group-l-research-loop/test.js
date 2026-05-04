'use strict';

const path = require('path');
const fs = require('fs');
const { assert } = require('../lib/assertions');

async function run(context) {
  const pulseRes = await context.client.callTool('research_improvement_ideas', {
    urls: [
      'https://playwright.dev/docs/intro',
      'https://docs.github.com/en/copilot'
    ],
    keywords: ['agent', 'workflow', 'automation', 'quality', 'parallel'],
    timeoutMs: 12000,
    topIdeas: 8,
  }, 30000);

  assert(pulseRes.ok, 'research_improvement_ideas call failed');
  assert(typeof pulseRes.json.scanned === 'number' && pulseRes.json.scanned >= 2, 'expected scanned >= 2');
  assert(Array.isArray(pulseRes.json.scans), 'pulse scans missing');
  assert(Array.isArray(pulseRes.json.ideas), 'pulse ideas missing');

  const outputDir = path.resolve(__dirname, '../../artifacts/research-pulses-tests');
  const recordRes = await context.client.callTool('record_research_pulse', {
    pulse: pulseRes.json,
    outputDir,
    cadenceMinutes: 10,
  });

  assert(recordRes.ok, 'record_research_pulse call failed');
  assert(typeof recordRes.json.outputPath === 'string', 'record result missing outputPath');
  assert(fs.existsSync(recordRes.json.outputPath), `pulse file not found: ${recordRes.json.outputPath}`);
  assert(String(recordRes.json.nextSuggestedRunAt || '').length > 10, 'missing nextSuggestedRunAt');

  const promptRes = await context.client.request('prompts/get', {
    name: 'continuous_research_loop',
    arguments: {
      goal: 'nonstop improvement for MCP servers',
      cadenceMinutes: '10',
    },
  });
  const promptText = (((promptRes || {}).messages || [])[0] || {}).content
    ? (((promptRes || {}).messages || [])[0].content.text || '')
    : '';
  assert(promptText.includes('research_improvement_ideas'), 'prompt should mention research_improvement_ideas');
  assert(promptText.includes('record_research_pulse'), 'prompt should mention record_research_pulse');

  return {
    notes: `research pulse scanned=${pulseRes.json.scanned}, ideas=${pulseRes.json.ideas.length}, persisted=${recordRes.json.outputPath}`,
    details: {
      scanned: pulseRes.json.scanned,
      ideas: pulseRes.json.ideas.length,
      outputPath: recordRes.json.outputPath,
    },
  };
}

module.exports = { run };
