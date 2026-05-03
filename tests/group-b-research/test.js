'use strict';

const { assert } = require('../lib/assertions');

async function run(context) {
  const resp = await context.client.callTool('research_agent_patterns', {
    urls: [
      'https://example.com',
      'https://platform.openai.com/docs/guides/agents',
    ],
    keywords: ['agent', 'approval', 'resume', 'guardrail'],
    timeoutMs: 20000,
    maxBytes: 180000,
  }, 30000);

  assert(resp.ok, 'research_agent_patterns call failed');
  assert(resp.json && Array.isArray(resp.json.results), 'invalid research_agent_patterns response structure');
  assert(resp.json.results.length === 2, `expected 2 results, got ${resp.json.results.length}`);
  assert(resp.json.keywordCounts && typeof resp.json.keywordCounts === 'object', 'keywordCounts missing');

  const errorCount = resp.json.results.filter((r) => r.error).length;
  const successCount = resp.json.results.length - errorCount;

  return {
    notes: `research scanned 2 urls (success=${successCount}, errors=${errorCount})`,
    details: {
      scanned: resp.json.scanned,
      successCount,
      errorCount,
    },
  };
}

module.exports = { run };
