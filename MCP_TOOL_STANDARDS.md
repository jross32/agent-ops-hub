# MCP Tool Standards

Use this checklist for every new tool in this server.

## Required Changes

1. Define the tool in `TOOLS` with `name`, `description`, and strict `inputSchema`.
2. Add dispatch in `runTool(name, args)`.
3. Implement a dedicated function with explicit input validation and clear errors.
4. Keep tools deterministic and local-first unless network access is intentional.

## Testing Requirements

For each new tool, add tests that cover:

- success response shape and key fields
- invalid input handling (missing/invalid args)
- failure behavior (timeouts, missing files, process errors)

All tests must pass:

```powershell
npm run check
npm test
```

## Reliability Rules

- Always enforce timeouts for child process/network operations.
- Clip large output in responses where relevant.
- Return structured objects, not ambiguous strings.
- Do not break existing tool names or response contracts without a version bump.

## Versioning + Commits

- Bump `package.json` on each meaningful update.
- Use commit notes format:
  - Changed
  - Bugs fixed
  - Version bump
