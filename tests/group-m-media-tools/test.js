'use strict';

const path = require('path');
const fs = require('fs');
const { assert } = require('../lib/assertions');

async function run(context) {
  const outDir = path.resolve(__dirname, '../../artifacts/media-tests');
  const svgPath = path.join(outDir, 'agent-ops-card.svg');

  const genRes = await context.client.callTool('generate_svg_image', {
    outputPath: svgPath,
    width: 960,
    height: 540,
    title: 'Agent Ops Hub',
    subtitle: 'Media toolchain smoke test',
  });
  assert(genRes.ok, 'generate_svg_image call failed');
  assert(genRes.json.created === true, 'generate_svg_image should report created=true');
  assert(fs.existsSync(svgPath), `generated svg missing at ${svgPath}`);

  const imgRes = await context.client.callTool('analyze_image_file', {
    filePath: svgPath,
  });
  assert(imgRes.ok, 'analyze_image_file call failed');
  assert(imgRes.json.format === 'svg', `expected svg format, got ${imgRes.json.format}`);
  assert(imgRes.json.width === 960 && imgRes.json.height === 540, 'svg dimensions mismatch');
  assert(typeof imgRes.json.sha256 === 'string' && imgRes.json.sha256.length >= 32, 'sha256 missing');

  const fakeVideoPath = path.join(outDir, 'fake-video.mp4');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(fakeVideoPath, Buffer.from('not-a-real-video-file'));

  const vidRes = await context.client.callTool('analyze_video_file', {
    filePath: fakeVideoPath,
    timeoutMs: 8000,
  });
  assert(vidRes.ok, 'analyze_video_file call failed');
  assert(typeof vidRes.json.analysisMode === 'string', 'analysisMode missing');
  assert(typeof vidRes.json.sizeBytes === 'number' && vidRes.json.sizeBytes > 0, 'video sizeBytes missing');

  const promptRes = await context.client.request('prompts/get', {
    name: 'media_toolchain_blueprint',
    arguments: { goal: 'media automation for coding projects' },
  });
  const promptText = (((promptRes || {}).messages || [])[0] || {}).content
    ? (((promptRes || {}).messages || [])[0].content.text || '')
    : '';
  assert(promptText.includes('generate_svg_image'), 'media prompt should mention generate_svg_image');
  assert(promptText.includes('analyze_video_file'), 'media prompt should mention analyze_video_file');

  return {
    notes: `media: svg generated + analyzed, video mode=${vidRes.json.analysisMode}`,
    details: {
      svgPath,
      videoMode: vidRes.json.analysisMode,
      ffprobeAvailable: vidRes.json.ffprobeAvailable,
    },
  };
}

module.exports = { run };
