'use strict';

const { assert } = require('../lib/assertions');

async function run(context) {
  const idxRes = await context.client.callTool('discover_mcp_docs_index', {
    indexUrl: 'https://modelcontextprotocol.io/llms.txt',
    timeoutMs: 12000,
    maxUrls: 120,
  }, 30000);
  assert(idxRes.ok, 'discover_mcp_docs_index call failed');
  assert(typeof idxRes.json.discoveredUrlCount === 'number', 'docs index discoveredUrlCount missing');

  const manifestRes = await context.client.callTool('draft_skill_pack_manifest', {
    goal: 'Create specialist skill packs for autonomous app delivery',
    maxSkills: 12,
  });
  assert(manifestRes.ok, 'draft_skill_pack_manifest call failed');
  assert(typeof manifestRes.json.skillCount === 'number' && manifestRes.json.skillCount > 0, 'skillCount missing/invalid');
  assert(Array.isArray(manifestRes.json.skills), 'skills array missing');
  assert(Array.isArray(manifestRes.json.operatingRules) && manifestRes.json.operatingRules.length >= 2, 'operatingRules missing');

  const promptRes = await context.client.request('prompts/get', {
    name: 'skill_pack_operating_model',
    arguments: { goal: 'professional autonomous coding rigor' },
  });
  const promptText = (((promptRes || {}).messages || [])[0] || {}).content
    ? (((promptRes || {}).messages || [])[0].content.text || '')
    : '';
  assert(promptText.includes('draft_skill_pack_manifest'), 'skill prompt should mention draft_skill_pack_manifest');
  assert(promptText.includes('discover_mcp_docs_index'), 'skill prompt should mention discover_mcp_docs_index');

  return {
    notes: `skill-pack manifest skills=${manifestRes.json.skillCount}, docsIndexUrls=${idxRes.json.discoveredUrlCount}`,
    details: {
      skillCount: manifestRes.json.skillCount,
      docsIndexUrls: idxRes.json.discoveredUrlCount,
    },
  };
}

module.exports = { run };
