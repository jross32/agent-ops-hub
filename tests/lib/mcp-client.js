'use strict';

const { spawn } = require('child_process');

class McpClient {
  constructor(serverScriptPath) {
    this.serverScriptPath = serverScriptPath;
    this.proc = null;
    this.nextId = 1;
    this.pending = new Map();
    this.buffer = '';
  }

  async start() {
    this.proc = spawn('node', [this.serverScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    this.proc.stdout.on('data', (chunk) => this._onStdout(chunk));
    this.proc.stderr.on('data', () => {
      // Keep stderr attached without failing requests solely from logs.
    });

    this.proc.on('exit', (code) => {
      for (const [, req] of this.pending) {
        clearTimeout(req.timeout);
        req.reject(new Error(`MCP server exited before response. Exit code: ${code}`));
      }
      this.pending.clear();
    });

    await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'agent-ops-hub-tests', version: '1.0.0' },
    });
  }

  async stop() {
    if (!this.proc) {
      return;
    }

    const proc = this.proc;
    this.proc = null;

    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        try {
          proc.kill();
        } catch (_error) {
          // ignore
        }
        resolve();
      }, 3000);

      proc.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });

      try {
        proc.stdin.end();
      } catch (_error) {
        clearTimeout(timer);
        resolve();
      }
    });
  }

  async listTools() {
    const result = await this.request('tools/list', {});
    return result.tools || [];
  }

  async callTool(name, args = {}, timeoutMs = 20000) {
    const result = await this.request('tools/call', { name, arguments: args }, timeoutMs);
    const content = Array.isArray(result.content) ? result.content : [];
    const first = content[0] || {};
    const text = String(first.text || '');

    if (result.isError) {
      return { ok: false, error: text || 'Unknown tool error', raw: result };
    }

    let json = null;
    try {
      json = JSON.parse(text);
    } catch (_error) {
      json = null;
    }

    return {
      ok: true,
      text,
      json,
      raw: result,
    };
  }

  request(method, params, timeoutMs = 15000) {
    if (!this.proc || !this.proc.stdin.writable) {
      return Promise.reject(new Error('MCP server process is not running'));
    }

    const id = this.nextId++;
    const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timeout });

      this.proc.stdin.write(payload, (error) => {
        if (error) {
          clearTimeout(timeout);
          this.pending.delete(id);
          reject(error);
        }
      });
    });
  }

  _onStdout(chunk) {
    this.buffer += chunk.toString('utf8');
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      let msg;
      try {
        msg = JSON.parse(trimmed);
      } catch (_error) {
        continue;
      }

      if (msg.id == null) {
        continue;
      }

      const req = this.pending.get(msg.id);
      if (!req) {
        continue;
      }

      clearTimeout(req.timeout);
      this.pending.delete(msg.id);

      if (msg.error) {
        req.reject(new Error(msg.error.message || 'Unknown JSON-RPC error'));
      } else {
        req.resolve(msg.result);
      }
    }
  }
}

module.exports = { McpClient };
