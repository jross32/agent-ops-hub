'use strict';

const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');
const { assert, assertEq } = require('../lib/assertions');
const { McpClient } = require('../lib/mcp-client');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpRequest(port, method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: urlPath,
      method,
      headers: payload ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      } : {},
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (_) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy(new Error('Request timed out')));
    if (payload) req.write(payload);
    req.end();
  });
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = address && typeof address === 'object' ? address.port : 0;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

async function waitForHealth(port) {
  let lastError = null;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await httpRequest(port, 'GET', '/health');
      if (response.statusCode === 200 && response.body && response.body.status === 'ok') {
        return response.body;
      }
      lastError = new Error(`Unexpected health response: ${response.statusCode}`);
    } catch (error) {
      lastError = error;
    }
    await wait(200);
  }
  throw lastError || new Error('Timed out waiting for health endpoint');
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (child.exitCode === null) child.kill('SIGKILL');
      resolve();
    }, 3000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function runDegradedChatCase(rootDir) {
  const port = await getFreePort();
  const scriptPath = path.join(rootDir, 'mcp-server.js');
  const child = spawn(process.execPath, [scriptPath], {
    cwd: rootDir,
    env: {
      ...process.env,
      HTTP_PORT: String(port),
      AGENT_OPS_CHAT_BACKEND_URL: 'http://127.0.0.1:18999/api/ai/chat',
      AGENT_OPS_CHAT_BACKEND_NAME: 'Claude2',
      AGENT_OPS_CHAT_BACKEND_TIMEOUT_MS: '1500',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const stderr = [];
  child.stderr.on('data', (chunk) => stderr.push(chunk.toString('utf8')));

  const chatId = `chat-http-test-${Date.now()}`;
  const histPath = path.join(rootDir, 'artifacts', 'chat-history', `${chatId}.json`);

  try {
    const health = await waitForHealth(port);
    assertEq(health.chatBackend.url, 'http://127.0.0.1:18999/api/ai/chat', 'Health should expose configured chat backend URL');
    assertEq(health.chatBackend.mode, 'http_proxy', 'Health should default to HTTP proxy mode without sampling client');

    const chatResponse = await httpRequest(port, 'POST', '/api/chat', { message: 'degraded mode probe', chatId });
    assertEq(chatResponse.statusCode, 200, 'Chat endpoint should return 200 in degraded mode');
    assert(chatResponse.body && chatResponse.body.degraded === true, 'Chat response should mark degraded mode');
    assertEq(chatResponse.body.code, 'chat_backend_unavailable', 'Chat response should classify unavailable backend');
    assert(String(chatResponse.body.reply || '').includes('backend is unavailable'), 'Chat reply should explain degraded backend state');

    const historyResponse = await httpRequest(port, 'GET', `/api/chat/history/${chatId}`);
    assertEq(historyResponse.statusCode, 200, 'Chat history should remain available in degraded mode');
    assertEq(historyResponse.body.count, 2, 'Chat history should store user and assistant turns');
    assert(historyResponse.body.messages[1].meta && historyResponse.body.messages[1].meta.degraded === true, 'Assistant history entry should mark degraded mode');

    return { port, chatId, mode: 'degraded' };
  } finally {
    if (fs.existsSync(histPath)) fs.unlinkSync(histPath);
    await stopServer(child);
    if (child.exitCode && child.exitCode !== 0) {
      throw new Error(`Test server exited unexpectedly: ${stderr.join('').trim()}`);
    }
  }
}

async function runSamplingChatCase(rootDir) {
  const port = await getFreePort();
  const scriptPath = path.join(rootDir, 'mcp-server.js');
  const samplingClient = new McpClient(scriptPath, {
    env: {
      HTTP_PORT: String(port),
      AGENT_OPS_CHAT_BACKEND_URL: 'http://127.0.0.1:18999/api/ai/chat',
      AGENT_OPS_CHAT_BACKEND_NAME: 'Claude2',
      AGENT_OPS_CHAT_BACKEND_TIMEOUT_MS: '1500',
    },
    clientCapabilities: { sampling: {} },
    clientInfo: { name: 'sampling-test-client', version: '1.0.0' },
    onRequest: async (request) => {
      assertEq(request.method, 'sampling/createMessage', 'Server should request MCP sampling for chat');
      const params = request.params || {};
      const messages = Array.isArray(params.messages) ? params.messages : [];
      assert(messages.length > 0, 'Sampling request should include conversation messages');
      const lastUser = [...messages].reverse().find((entry) => entry.role === 'user');
      const lastUserText = lastUser && lastUser.content ? String(lastUser.content.text || '') : '';
      return {
        role: 'assistant',
        model: 'sampling-test-model',
        content: { type: 'text', text: `Sampled reply: ${lastUserText}` },
        stopReason: 'endTurn',
      };
    },
  });

  const chatId = `chat-sampling-test-${Date.now()}`;
  const histPath = path.join(rootDir, 'artifacts', 'chat-history', `${chatId}.json`);

  await samplingClient.start();

  try {
    const health = await waitForHealth(port);
    assertEq(health.chatBackend.mode, 'mcp_sampling', 'Health should prefer MCP sampling when a capable client is connected');
    assertEq(health.chatBackend.url, 'mcp://sampling/createMessage', 'Health should expose MCP sampling endpoint metadata');

    const chatResponse = await httpRequest(port, 'POST', '/api/chat', { message: 'hello from sampling', chatId });
    assertEq(chatResponse.statusCode, 200, 'Sampling-backed chat should return 200');
    assert(chatResponse.body && chatResponse.body.degraded === false, 'Sampling-backed chat should return a real reply');
    assertEq(chatResponse.body.reply, 'Sampled reply: hello from sampling', 'Sampling-backed chat should return the sampled response text');
    assertEq(chatResponse.body.backend.mode, 'mcp_sampling', 'Chat response should report MCP sampling mode');
    assertEq(chatResponse.body.backend.model, 'sampling-test-model', 'Chat response should expose the sampled model');
    assert(samplingClient.receivedRequests.some((request) => request.method === 'sampling/createMessage'), 'Sampling client should receive a sampling request');

    const historyResponse = await httpRequest(port, 'GET', `/api/chat/history/${chatId}`);
    assertEq(historyResponse.statusCode, 200, 'Chat history should be available after sampling');
    assertEq(historyResponse.body.count, 2, 'Sampling-backed chat should persist user and assistant turns');
    assertEq(historyResponse.body.messages[1].meta.mode, 'mcp_sampling', 'Assistant history entry should record MCP sampling mode');

    return { port, chatId, mode: 'mcp_sampling' };
  } finally {
    if (fs.existsSync(histPath)) fs.unlinkSync(histPath);
    await samplingClient.stop();
  }
}

async function run(context) {
  const degraded = await runDegradedChatCase(context.rootDir);
  const sampling = await runSamplingChatCase(context.rootDir);

  return {
    notes: 'HTTP chat now degrades cleanly without Claude2 and returns real replies via MCP sampling when a capable client is connected',
    details: {
      degraded,
      sampling,
    },
  };
}

module.exports = { run };