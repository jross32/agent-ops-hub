# agent-ops-hub

BETA v0.0.0

Local MCP server for agent workflow operations: preflight checks, validation gates, runbook generation, and MCP comparison utilities.

## Local Runtime

This server runs locally over stdio JSON-RPC.

```powershell
npm start
```

## Quality Gates

Use these before every release:

```powershell
npm run check
npm test
```

or run:

```powershell
npm run verify
```

Use `RELEASE_CHECKLIST.md` for the full release flow.

## Tool Change Standard

When adding a new MCP tool, always do all of the following:

1. Add tool metadata in the `TOOLS` array (`name`, `description`, `inputSchema`).
2. Add a matching `case` in `runTool()` and implement the handler.
3. Add or update tests in `tests/group-*` that cover:
   - happy path
   - invalid arguments
   - failure path (timeout/error/not found)
4. Run `npm run check` and `npm test`.
5. Update version and commit notes in the commit message.

## Versioning + Commit Policy

- Version starts at `0.0.0`.
- Every meaningful change should include:
  - a version bump in `package.json`
  - commit notes (`Changed`, `Bugs fixed`, `Version bump`)

You can configure commit template support with:

```powershell
git config commit.template .gitmessage.txt
```

## Notes

- This server is client-agnostic (Claude, Copilot, Codex, or any MCP client).
- Keep it orchestration-focused; do not duplicate separate MCP domains like web scraping.
