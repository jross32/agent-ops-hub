#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { spawn } = require('child_process');

const DEFAULT_MCP_ROOT = 'C:/Users/justi/mcp-servers';
const DEFAULT_RUNBOOK_DIR = path.resolve(__dirname, 'artifacts', 'runbooks');
const DEFAULT_RESEARCH_DIR = path.resolve(__dirname, 'artifacts', 'research-pulses');
const DEFAULT_LOOP_STATE_DIR = path.resolve(__dirname, 'artifacts', 'loop-state');
const DEFAULT_RESEARCH_URLS = [
  'https://modelcontextprotocol.io/',
  'https://github.blog/changelog/',
  'https://platform.openai.com/docs/overview',
  'https://docs.github.com/en/copilot',
  'https://playwright.dev/docs/intro'
];
const DEFAULT_RESEARCH_KEYWORDS = [
  'mcp',
  'agent',
  'workflow',
  'orchestration',
  'automation',
  'prompt',
  'evaluation',
  'benchmark',
  'security',
  'parallel'
];

const SPECIALIST_AGENT_CATALOG = [
  { id: 'ux_ui_architect', domain: 'ux', title: 'UX/UI Architect', strengths: ['ux', 'ui', 'interaction', 'layout'] },
  { id: 'product_designer', domain: 'ux', title: 'Product Designer', strengths: ['flows', 'wireframes', 'feature-design'] },
  { id: 'design_system_engineer', domain: 'ux', title: 'Design System Engineer', strengths: ['tokens', 'components', 'consistency'] },
  { id: 'accessibility_specialist', domain: 'ux', title: 'Accessibility Specialist', strengths: ['a11y', 'wcag', 'screen-reader'] },
  { id: 'frontend_performance_engineer', domain: 'frontend', title: 'Frontend Performance Engineer', strengths: ['rendering', 'bundle-size', 'web-vitals'] },
  { id: 'visual_regression_tester', domain: 'quality', title: 'Visual Regression Tester', strengths: ['snapshots', 'pixel-diff', 'ui-regression'] },
  { id: 'usability_researcher', domain: 'ux', title: 'Usability Researcher', strengths: ['testing', 'interviews', 'journeys'] },
  { id: 'interaction_designer', domain: 'ux', title: 'Interaction Designer', strengths: ['micro-interactions', 'motion', 'state'] },
  { id: 'brand_experience_designer', domain: 'ux', title: 'Brand Experience Designer', strengths: ['visual-language', 'voice', 'identity'] },
  { id: 'mobile_responsive_specialist', domain: 'frontend', title: 'Mobile Responsive Specialist', strengths: ['breakpoints', 'touch', 'layout-adaptation'] },

  { id: 'backend_architect', domain: 'backend', title: 'Backend Architect', strengths: ['services', 'boundaries', 'scalability'] },
  { id: 'api_designer', domain: 'backend', title: 'API Designer', strengths: ['contracts', 'rest', 'graphql'] },
  { id: 'database_engineer', domain: 'data', title: 'Database Engineer', strengths: ['schema', 'queries', 'migrations'] },
  { id: 'distributed_systems_engineer', domain: 'backend', title: 'Distributed Systems Engineer', strengths: ['queues', 'consistency', 'fault-tolerance'] },
  { id: 'reliability_engineer', domain: 'platform', title: 'Reliability Engineer', strengths: ['slo', 'resilience', 'stability'] },
  { id: 'security_engineer', domain: 'security', title: 'Security Engineer', strengths: ['threat-modeling', 'hardening', 'vuln-fixes'] },
  { id: 'auth_identity_engineer', domain: 'security', title: 'Auth & Identity Engineer', strengths: ['oauth', 'oidc', 'session-security'] },
  { id: 'devops_release_engineer', domain: 'platform', title: 'DevOps Release Engineer', strengths: ['deployments', 'rollbacks', 'release-gates'] },
  { id: 'qa_automation_engineer', domain: 'quality', title: 'QA Automation Engineer', strengths: ['e2e', 'api-tests', 'automation'] },
  { id: 'test_strategy_lead', domain: 'quality', title: 'Test Strategy Lead', strengths: ['coverage', 'risk-based-testing', 'test-design'] },

  { id: 'bug_hunter', domain: 'quality', title: 'Bug Hunter', strengths: ['repro', 'edge-cases', 'root-cause'] },
  { id: 'static_analysis_specialist', domain: 'quality', title: 'Static Analysis Specialist', strengths: ['linters', 'code-smells', 'type-safety'] },
  { id: 'performance_profiler', domain: 'performance', title: 'Performance Profiler', strengths: ['cpu', 'memory', 'latency'] },
  { id: 'observability_engineer', domain: 'platform', title: 'Observability Engineer', strengths: ['logs', 'metrics', 'tracing'] },
  { id: 'data_engineer', domain: 'data', title: 'Data Engineer', strengths: ['etl', 'pipelines', 'integrity'] },
  { id: 'ml_engineer', domain: 'ai', title: 'ML Engineer', strengths: ['modeling', 'evaluation', 'serving'] },
  { id: 'prompt_engineer', domain: 'ai', title: 'Prompt Engineer', strengths: ['prompt-design', 'evals', 'agent-behavior'] },
  { id: 'mcp_protocol_engineer', domain: 'ai', title: 'MCP Protocol Engineer', strengths: ['tool-schema', 'json-rpc', 'capabilities'] },
  { id: 'tooling_integration_engineer', domain: 'platform', title: 'Tooling Integration Engineer', strengths: ['pipelines', 'integrations', 'automation'] },
  { id: 'docs_information_architect', domain: 'docs', title: 'Docs Information Architect', strengths: ['structure', 'discoverability', 'navigation'] },

  { id: 'technical_writer', domain: 'docs', title: 'Technical Writer', strengths: ['guides', 'references', 'examples'] },
  { id: 'developer_experience_engineer', domain: 'platform', title: 'Developer Experience Engineer', strengths: ['onboarding', 'scripts', 'dev-flow'] },
  { id: 'build_system_engineer', domain: 'platform', title: 'Build System Engineer', strengths: ['build-graph', 'caching', 'toolchains'] },
  { id: 'ci_cd_engineer', domain: 'platform', title: 'CI/CD Engineer', strengths: ['workflows', 'gates', 'release-automation'] },
  { id: 'incident_commander', domain: 'operations', title: 'Incident Commander', strengths: ['triage', 'coordination', 'mitigation'] },
  { id: 'project_manager', domain: 'product', title: 'Project Manager', strengths: ['roadmaps', 'milestones', 'dependencies'] },
  { id: 'scrum_facilitator', domain: 'product', title: 'Scrum Facilitator', strengths: ['cadence', 'retros', 'delivery-rhythm'] },
  { id: 'business_analyst', domain: 'product', title: 'Business Analyst', strengths: ['requirements', 'prioritization', 'value'] },
  { id: 'growth_experimentation_lead', domain: 'product', title: 'Growth Experimentation Lead', strengths: ['experiments', 'funnel', 'adoption'] },
  { id: 'customer_support_analyst', domain: 'operations', title: 'Customer Support Analyst', strengths: ['feedback', 'issue-patterns', 'triage-data'] }
];

// ── Live Dashboard SSE Infrastructure ────────────────────────────────────────
const sseClients     = new Set();
const eventRingBuffer = [];
const EVENT_RING_MAX  = 200;
let toolCallCount     = 0;
const serverStartTime = Date.now();

function emitHub(type, data) {
  const evt     = { type, data: { ...data, ts: Date.now() } };
  eventRingBuffer.push(evt);
  if (eventRingBuffer.length > EVENT_RING_MAX) eventRingBuffer.shift();
  const payload = `event: ${type}\ndata: ${JSON.stringify(evt.data)}\n\n`;
  for (const client of Array.from(sseClients)) {
    try { client.write(payload); } catch (_) { sseClients.delete(client); }
  }
}

function buildArgsSummary(toolName, args) {
  if (toolName === 'run_parallel_specialist_sprint') return `${args.sprintName || '?'} (${(args.tasks || []).length} tasks)`;
  if (toolName === 'evaluate_sprint_output')         return `${args.sprintId || '?'} (${(args.outputs || []).length} outputs)`;
  if (toolName === 'dispatch_specialist_task')       return `${args.specialistId || '?'}: ${(args.taskTitle || '').slice(0, 40)}`;
  return Object.keys(args).slice(0, 3).map((k) => `${k}=${JSON.stringify(args[k]).slice(0, 20)}`).join(', ');
}

const TOOLS = [
  {
    name: 'agent_mode_preflight',
    description: 'Run local readiness checks for agent execution (node/npm, folder access, and MCP inventory)',
    inputSchema: {
      type: 'object',
      properties: {
        mcpRootPath: { type: 'string', description: 'Root folder containing local MCP servers' },
        timeoutMs: { type: 'number', minimum: 1000, maximum: 120000 }
      },
      additionalProperties: false
    }
  },
  {
    name: 'list_local_mcp_servers',
    description: 'List local MCP server folders and detect launch files',
    inputSchema: {
      type: 'object',
      properties: {
        rootPath: { type: 'string', description: 'Root folder that contains MCP server folders' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'research_agent_patterns',
    description: 'Fetch URLs and extract agent workflow patterns (interrupt/resume/approval/visibility terms)',
    inputSchema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 10
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 30
        },
        timeoutMs: { type: 'number', minimum: 1000, maximum: 60000 },
        maxBytes: { type: 'number', minimum: 1024, maximum: 500000 }
      },
      required: ['urls'],
      additionalProperties: false
    }
  },
  {
    name: 'create_execution_runbook',
    description: 'Create a structured runbook JSON for repeatable agent execution plans',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        objective: { type: 'string' },
        outputDir: { type: 'string' },
        steps: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              command: { type: 'string' },
              mustPass: { type: 'boolean' }
            },
            required: ['id', 'title', 'command'],
            additionalProperties: false
          }
        }
      },
      required: ['name', 'objective', 'steps'],
      additionalProperties: false
    }
  },
  {
    name: 'run_validation_gate',
    description: 'Run command gates sequentially and return pass/fail with command outputs. Commands can be plain strings or objects with { command, severity } where severity is error|warn|info (default: error). Only error-severity failures abort the gate.',
    inputSchema: {
      type: 'object',
      properties: {
        commands: {
          type: 'array',
          minItems: 1,
          items: {
            oneOf: [
              { type: 'string' },
              {
                type: 'object',
                properties: {
                  command:  { type: 'string' },
                  severity: { type: 'string', enum: ['error', 'warn', 'info'] }
                },
                required: ['command'],
                additionalProperties: false
              }
            ]
          }
        },
        cwd: { type: 'string' },
        timeoutMs: { type: 'number', minimum: 1000, maximum: 900000 }
      },
      required: ['commands'],
      additionalProperties: false
    }
  },
  {
    name: 'benchmark_validation_gate',
    description: 'Benchmark validation commands over multiple iterations for efficiency tracking',
    inputSchema: {
      type: 'object',
      properties: {
        commands: {
          type: 'array',
          minItems: 1,
          items: { type: 'string' }
        },
        iterations: { type: 'number', minimum: 1, maximum: 20 },
        cwd: { type: 'string' },
        timeoutMs: { type: 'number', minimum: 1000, maximum: 900000 }
      },
      required: ['commands'],
      additionalProperties: false
    }
  },
  {
    name: 'summarize_test_artifacts',
    description: 'Read latest test artifacts and produce a concise machine summary',
    inputSchema: {
      type: 'object',
      properties: {
        artifactsPath: { type: 'string' }
      },
      required: ['artifactsPath'],
      additionalProperties: false
    }
  },
  {
    name: 'diff_execution_plans',
    description: 'Compare two runbook JSON files and return a structured diff of added, removed, and changed steps',
    inputSchema: {
      type: 'object',
      properties: {
        baselinePath: { type: 'string', description: 'Path to the baseline runbook JSON file' },
        revisedPath:  { type: 'string', description: 'Path to the revised runbook JSON file' }
      },
      required: ['baselinePath', 'revisedPath'],
      additionalProperties: false
    }
  },
  {
    name: 'generate_test_scaffold',
    description: 'Generate a test file scaffold for a new MCP tool and optionally write it to disk',
    inputSchema: {
      type: 'object',
      properties: {
        toolName:    { type: 'string', description: 'Name of the MCP tool to scaffold a test for' },
        groupLabel:  { type: 'string', description: 'Short label used as the group folder name (e.g. group-h-my-tool)' },
        outputDir:   { type: 'string', description: 'Directory to write the scaffold file into (optional — omit to return content only)' },
        sampleArgs:  { type: 'object', description: 'Example args object for the tool call' }
      },
      required: ['toolName', 'groupLabel'],
      additionalProperties: false
    }
  },
  {
    name: 'check_server_health',
    description: 'Spawn a local MCP server, send initialize + tools/list, verify the response, and return tool count and health status. Kills the process when done.',
    inputSchema: {
      type: 'object',
      properties: {
        serverPath: { type: 'string', description: 'Absolute path to the mcp-server.js file to test' },
        timeoutMs:  { type: 'number', minimum: 1000, maximum: 30000, description: 'Max ms to wait for tools/list response (default 10000)' }
      },
      required: ['serverPath'],
      additionalProperties: false
    }
  },
  {
    name: 'compare_mcp_server_tools',
    description: 'Parse two MCP server JS files and compare their TOOLS arrays — showing which tools were added or removed',
    inputSchema: {
      type: 'object',
      properties: {
        baselineServerPath: { type: 'string', description: 'Path to the baseline mcp-server.js file' },
        revisedServerPath:  { type: 'string', description: 'Path to the revised mcp-server.js file' }
      },
      required: ['baselineServerPath', 'revisedServerPath'],
      additionalProperties: false
    }
  },
  {
    name: 'scan_tool_coverage',
    description: 'Scan a local MCP server directory and its tests/ folder to report which tools have test coverage and which are missing tests',
    inputSchema: {
      type: 'object',
      properties: {
        serverDir: { type: 'string', description: 'Absolute path to the MCP server directory (must contain mcp-server.js and tests/)' }
      },
      required: ['serverDir'],
      additionalProperties: false
    }
  },
  {
    name: 'estimate_tool_complexity',
    description: 'Parse a mcp-server.js file and rank its tools by schema complexity (property count, required fields, nested depth)',
    inputSchema: {
      type: 'object',
      properties: {
        serverPath: { type: 'string', description: 'Absolute path to mcp-server.js' },
        topN:       { type: 'number', minimum: 1, maximum: 100, description: 'How many top tools to return (default: all)' }
      },
      required: ['serverPath'],
      additionalProperties: false
    }
  },
  {
    name: 'generate_changelog_entry',
    description: 'Run git log on a repo directory and generate a structured CHANGELOG entry from recent commits',
    inputSchema: {
      type: 'object',
      properties: {
        repoDir:    { type: 'string', description: 'Absolute path to the git repository' },
        sinceTag:   { type: 'string', description: 'Git tag or SHA to generate log from (e.g. v0.0.9). Defaults to last 20 commits' },
        version:    { type: 'string', description: 'Version string for this changelog entry (e.g. v0.1.0)' },
        timeoutMs:  { type: 'number', minimum: 1000, maximum: 30000 }
      },
      required: ['repoDir'],
      additionalProperties: false
    }
  },
  {
    name: 'code_quality_gate',
    description: 'Run node --check on one or more JS files and report syntax validity, line count, and a quality score',
    inputSchema: {
      type: 'object',
      properties: {
        files:     { type: 'array', items: { type: 'string' }, minItems: 1, description: 'Absolute paths to JS files to check' },
        timeoutMs: { type: 'number', minimum: 1000, maximum: 30000 }
      },
      required: ['files'],
      additionalProperties: false
    }
  },
  {
    name: 'dependency_audit',
    description: 'Run npm outdated in a project directory and return a structured report of outdated packages',
    inputSchema: {
      type: 'object',
      properties: {
        projectDir: { type: 'string', description: 'Absolute path to the npm project directory' },
        timeoutMs:  { type: 'number', minimum: 1000, maximum: 60000 }
      },
      required: ['projectDir'],
      additionalProperties: false
    }
  },
  {
    name: 'server_capability_matrix',
    description: 'Compare tools and capabilities across multiple MCP server directories and produce a feature matrix',
    inputSchema: {
      type: 'object',
      properties: {
        serverDirs: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          maxItems: 20,
          description: 'List of absolute paths to MCP server directories'
        }
      },
      required: ['serverDirs'],
      additionalProperties: false
    }
  },
  {
    name: 'roadmap_tracker',
    description: 'Read or write a roadmap JSON file tracking phases, tasks, and completion status',
    inputSchema: {
      type: 'object',
      properties: {
        action:      { type: 'string', enum: ['read', 'write', 'update_task'], description: 'read: return current roadmap; write: create/replace; update_task: update a single task status' },
        roadmapPath: { type: 'string', description: 'Absolute path to the roadmap JSON file' },
        roadmap:     { type: 'object', description: 'Full roadmap object (required for write action)' },
        phaseId:     { type: 'string', description: 'Phase ID (required for update_task)' },
        taskId:      { type: 'string', description: 'Task ID within the phase (required for update_task)' },
        status:      { type: 'string', enum: ['pending', 'in-progress', 'done', 'blocked'], description: 'New status (required for update_task)' }
      },
      required: ['action', 'roadmapPath'],
      additionalProperties: false
    }
  },
  {
    name: 'write_release_notes',
    description: 'Generate formatted release notes from git log between two refs and optionally write to a file',
    inputSchema: {
      type: 'object',
      properties: {
        repoDir:    { type: 'string', description: 'Absolute path to the git repository' },
        fromRef:    { type: 'string', description: 'Starting ref (tag/SHA). Omit to use last 30 commits' },
        toRef:      { type: 'string', description: 'Ending ref (default: HEAD)' },
        version:    { type: 'string', description: 'Release version label (e.g. v0.1.0)' },
        outputPath: { type: 'string', description: 'If provided, write release notes to this file path' },
        timeoutMs:  { type: 'number', minimum: 1000, maximum: 30000 }
      },
      required: ['repoDir'],
      additionalProperties: false
    }
  },
  {
    name: 'agent_task_planner',
    description: 'Break a high-level task description into an ordered list of actionable steps with complexity estimates',
    inputSchema: {
      type: 'object',
      properties: {
        task:        { type: 'string', description: 'High-level task or goal to decompose' },
        context:     { type: 'string', description: 'Optional context about the environment or constraints' },
        maxSteps:    { type: 'number', minimum: 1, maximum: 50, description: 'Maximum number of steps to generate (default: 10)' },
        outputPath:  { type: 'string', description: 'If provided, write the plan JSON to this file' }
      },
      required: ['task'],
      additionalProperties: false
    }
  },
  {
    name: 'execution_history_summary',
    description: 'Scan a logs/runs directory and produce a trend summary of pass rates, durations, and failure patterns across past runs',
    inputSchema: {
      type: 'object',
      properties: {
        runsDir:  { type: 'string', description: 'Absolute path to a runs/ directory containing timestamped run subdirectories' },
        lastN:    { type: 'number', minimum: 1, maximum: 200, description: 'How many most-recent runs to analyze (default: 20)' }
      },
      required: ['runsDir'],
      additionalProperties: false
    }
  },
  {
    name: 'find_missing_tests',
    description: 'Given a MCP server directory, identify tools defined in mcp-server.js that have no corresponding test group folder in tests/',
    inputSchema: {
      type: 'object',
      properties: {
        serverDir: { type: 'string', description: 'Absolute path to the MCP server directory' }
      },
      required: ['serverDir'],
      additionalProperties: false
    }
  },
  {
    name: 'tag_test_results',
    description: 'Read the latest test results from a logs directory and save a tagged snapshot with a custom label',
    inputSchema: {
      type: 'object',
      properties: {
        logsDir:   { type: 'string', description: 'Absolute path to the logs directory containing latest_ai.json' },
        tag:       { type: 'string', description: 'Label to attach to this snapshot (e.g. pre-release, post-refactor)' },
        outputDir: { type: 'string', description: 'Directory to write the tagged snapshot (defaults to logsDir/tagged/)' }
      },
      required: ['logsDir', 'tag'],
      additionalProperties: false
    }
  },
  {
    name: 'generate_specialist_agent_roster',
    description: 'Generate a roster of specialist agents (40-role catalog) filtered by domain and priorities',
    inputSchema: {
      type: 'object',
      properties: {
        domains: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 20,
          description: 'Optional domain filters (ux, frontend, backend, quality, security, data, ai, docs, platform, operations, product)'
        },
        includeStrengths: { type: 'boolean', description: 'Include each role strengths list (default true)' },
        maxRoles: { type: 'number', minimum: 1, maximum: 200, description: 'Maximum number of roles to return (default all)' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'plan_specialist_assignments',
    description: 'Plan specialist pod assignments for a project goal using the role catalog and workstream mapping',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'Project goal to staff with specialist agents' },
        workstreams: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 30,
          description: 'Optional explicit workstreams (if omitted, inferred from goal)'
        },
        maxAgentsPerWorkstream: { type: 'number', minimum: 1, maximum: 10, description: 'Max specialists assigned to each workstream (default 4)' },
        includeCrossReview: { type: 'boolean', description: 'Assign a cross-reviewer from quality/security (default true)' }
      },
      required: ['goal'],
      additionalProperties: false
    }
  },
  {
    name: 'build_collaboration_schedule',
    description: 'Build a concurrent collaboration schedule from specialist assignments with waves, dependencies, and handoffs',
    inputSchema: {
      type: 'object',
      properties: {
        plan: { type: 'object', description: 'Output object from plan_specialist_assignments' },
        sprintDays: { type: 'number', minimum: 3, maximum: 60, description: 'Total sprint length in days (default 14)' },
        maxParallelPods: { type: 'number', minimum: 1, maximum: 10, description: 'Maximum pods running in parallel per wave (default 3)' }
      },
      required: ['plan'],
      additionalProperties: false
    }
  },
  {
    name: 'research_improvement_ideas',
    description: 'Run a web research pulse over selected URLs, score signal by keywords, and extract actionable improvement ideas',
    inputSchema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 20,
          description: 'Target URLs to scan (defaults to MCP/AI/dev tooling sources)'
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 50,
          description: 'Signal keywords used for idea scoring'
        },
        timeoutMs: { type: 'number', minimum: 1000, maximum: 90000 },
        maxBytes: { type: 'number', minimum: 4096, maximum: 500000 },
        topIdeas: { type: 'number', minimum: 1, maximum: 50, description: 'Maximum ideas to return (default 12)' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'record_research_pulse',
    description: 'Persist a research pulse result to disk and return recommendations for next scan timing',
    inputSchema: {
      type: 'object',
      properties: {
        pulse: { type: 'object', description: 'Object returned by research_improvement_ideas' },
        outputDir: { type: 'string', description: 'Directory where pulse snapshot JSON should be stored' },
        cadenceMinutes: { type: 'number', minimum: 5, maximum: 1440, description: 'Recommended recurrence interval in minutes (default 10)' }
      },
      required: ['pulse'],
      additionalProperties: false
    }
  },
  {
    name: 'run_autonomous_improvement_cycle',
    description: 'Run a full improvement cycle: web pulse -> task plan -> specialist assignments -> collaboration schedule',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'Top-level improvement goal' },
        urls: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 20 },
        keywords: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 50 },
        maxIdeas: { type: 'number', minimum: 1, maximum: 30, description: 'How many top ideas to use for planning (default 5)' },
        sprintDays: { type: 'number', minimum: 3, maximum: 60, description: 'Schedule length in days (default 14)' },
        maxParallelPods: { type: 'number', minimum: 1, maximum: 10, description: 'Concurrent pods per wave (default 3)' }
      },
      required: ['goal'],
      additionalProperties: false
    }
  },
  {
    name: 'orchestrate_continuous_improvement_loop',
    description: 'Run autonomous improvement cycles continuously with persisted state, checkpoints, and control flags',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'Loop objective that should be continuously improved' },
        maxCycles: { type: 'number', minimum: 1, maximum: 500, description: 'How many cycles to execute for this invocation (default 3)' },
        cadenceMinutes: { type: 'number', minimum: 5, maximum: 1440, description: 'Research pulse cadence between cycles (default 10)' },
        stateDir: { type: 'string', description: 'Optional directory for loop state and cycle snapshots' },
        waitForCadence: { type: 'boolean', description: 'If true, waits for next pulse time before each cycle (default false)' },
        urls: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 20 },
        keywords: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 50 }
      },
      required: ['goal'],
      additionalProperties: false
    }
  },
  {
    name: 'get_autonomous_loop_state',
    description: 'Get persisted state for the continuous improvement loop and recent cycle snapshots',
    inputSchema: {
      type: 'object',
      properties: {
        stateDir: { type: 'string', description: 'Optional directory for loop state and cycle snapshots' },
        includeRecentCycles: { type: 'boolean', description: 'Include recent cycle filenames (default true)' },
        recentLimit: { type: 'number', minimum: 1, maximum: 100, description: 'How many recent cycles to include (default 10)' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'set_autonomous_loop_control',
    description: 'Control the continuous improvement loop: pause, resume, or trigger an immediate pulse',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['pause', 'resume', 'trigger_now'], description: 'Control action to apply' },
        stateDir: { type: 'string', description: 'Optional directory for loop state and cycle snapshots' },
        reason: { type: 'string', description: 'Optional reason for pause/resume actions' }
      },
      required: ['action'],
      additionalProperties: false
    }
  },
  {
    name: 'resume_interrupted_cycle',
    description: 'Resume autonomous execution from persisted state and run additional cycles',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'Goal to continue improving (falls back to state goal if omitted)' },
        stateDir: { type: 'string', description: 'Optional directory for loop state and cycle snapshots' },
        cycles: { type: 'number', minimum: 1, maximum: 200, description: 'How many additional cycles to run (default 1)' },
        cadenceMinutes: { type: 'number', minimum: 5, maximum: 1440, description: 'Cadence for subsequent cycles (default from state or 10)' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'evaluate_autonomous_loop_quality',
    description: 'Evaluate loop quality over persisted cycle snapshots (cadence adherence, output volume, and trend indicators)',
    inputSchema: {
      type: 'object',
      properties: {
        stateDir: { type: 'string', description: 'Optional directory for loop state and cycle snapshots' },
        lastN: { type: 'number', minimum: 1, maximum: 500, description: 'How many most recent cycles to evaluate (default 20)' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'generate_svg_image',
    description: 'Generate a clean SVG image asset (banner/card/placeholder) for docs, UI mocks, or reports',
    inputSchema: {
      type: 'object',
      properties: {
        outputPath: { type: 'string', description: 'Output SVG file path (optional)' },
        width: { type: 'number', minimum: 64, maximum: 4096, description: 'Image width (default 1280)' },
        height: { type: 'number', minimum: 64, maximum: 4096, description: 'Image height (default 720)' },
        title: { type: 'string', description: 'Primary title text rendered in the image' },
        subtitle: { type: 'string', description: 'Secondary subtitle text' },
        bgStart: { type: 'string', description: 'Gradient start color (default #0f172a)' },
        bgEnd: { type: 'string', description: 'Gradient end color (default #1d4ed8)' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'analyze_image_file',
    description: 'Analyze an image file and return format, dimensions, size, hash, and metadata',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Absolute path to an image file (png/jpg/gif/bmp/webp/svg)' }
      },
      required: ['filePath'],
      additionalProperties: false
    }
  },
  {
    name: 'analyze_video_file',
    description: 'Analyze a video file using ffprobe when available, with graceful fallback metadata when ffprobe is missing',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Absolute path to a video file' },
        timeoutMs: { type: 'number', minimum: 1000, maximum: 120000 }
      },
      required: ['filePath'],
      additionalProperties: false
    }
  },
  {
    name: 'discover_mcp_docs_index',
    description: 'Fetch MCP docs index (llms.txt style) and extract canonical documentation URLs for grounded research pulses',
    inputSchema: {
      type: 'object',
      properties: {
        indexUrl: { type: 'string', description: 'URL of docs index text file (default MCP llms.txt)' },
        timeoutMs: { type: 'number', minimum: 1000, maximum: 90000 },
        maxBytes: { type: 'number', minimum: 4096, maximum: 500000 },
        maxUrls: { type: 'number', minimum: 1, maximum: 500, description: 'Maximum urls to return (default 200)' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'draft_skill_pack_manifest',
    description: 'Generate a reusable agent skill-pack manifest mapping specialist roles to skill files and operating contracts',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'Primary objective for the skill pack' },
        includeRoles: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 80,
          description: 'Optional specialist role IDs to include'
        },
        basePath: { type: 'string', description: 'Suggested skill root path (default .github/skills)' },
        maxSkills: { type: 'number', minimum: 1, maximum: 80, description: 'Maximum skills to include (default 20)' }
      },
      required: ['goal'],
      additionalProperties: false
    }
  },
  {
    name: 'validate_json_schema',
    description: 'Validate a JSON object against a JSON Schema definition and return a structured pass/fail report with detailed errors',
    inputSchema: {
      type: 'object',
      properties: {
        schema: { type: 'object', description: 'JSON Schema object to validate against' },
        data:   { description: 'JSON value to validate (any type)' }
      },
      required: ['schema', 'data'],
      additionalProperties: false
    }
  },
  {
    name: 'drift_detection_check',
    description: 'Detect drift in a repository: uncommitted changes, untracked files, divergence from remote, and stale package-lock. Returns a severity-ranked drift report.',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Absolute path to the git repository to inspect' },
        checkRemote: { type: 'boolean', description: 'Whether to fetch and compare with remote HEAD (default true)' },
        checkDeps: { type: 'boolean', description: 'Whether to check if node_modules is stale vs package.json (default true)' }
      },
      required: ['repoPath'],
      additionalProperties: false
    }
  },
  {
    name: 'multi_repo_sync_status',
    description: 'Check git sync status (ahead/behind/dirty) across all MCP server repos in a root directory. Returns a summary table with per-repo state.',
    inputSchema: {
      type: 'object',
      properties: {
        rootPath: { type: 'string', description: 'Root directory containing multiple git repos (default: MCP_ROOT)' },
        maxRepos: { type: 'number', minimum: 1, maximum: 50, description: 'Max repos to check (default 20)' },
        fetchFirst: { type: 'boolean', description: 'Run git fetch --all before status checks (default false — uses cached remote refs)' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'generate_changelog',
    description: 'Generate a structured CHANGELOG for a git repo between two refs (or from the last tag to HEAD). Returns Markdown-formatted entries grouped by type (feat/fix/chore).',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Absolute path to the git repository' },
        fromRef:  { type: 'string', description: 'Starting git ref (tag, SHA, or branch). Defaults to last tag.' },
        toRef:    { type: 'string', description: 'Ending git ref (default HEAD)' },
        maxCommits: { type: 'number', minimum: 1, maximum: 500, description: 'Maximum commits to include (default 100)' }
      },
      required: ['repoPath'],
      additionalProperties: false
    }
  },
  {
    name: 'regression_root_cause_analysis',
    description: 'Analyze test failure output (stdout/stderr text) and classify root causes into structured categories: assertion errors, missing modules, timeouts, auth failures, network issues, and more.',
    inputSchema: {
      type: 'object',
      properties: {
        failureText: { type: 'string', description: 'Full test output text (stdout + stderr) from a failed test run', maxLength: 50000 },
        suiteName:   { type: 'string', description: 'Optional name of the test suite for context' },
        repoPath:    { type: 'string', description: 'Optional repo path — used to enrich analysis with recent git changes' }
      },
      required: ['failureText'],
      additionalProperties: false
    }
  },
  {
    name: 'code_complexity_scan',
    description: 'Scan a JavaScript file and return static complexity metrics: total line count, function count, max nesting depth, average function length, and a list of long functions that may need refactoring.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath:          { type: 'string', description: 'Absolute path to the JS file to analyze' },
        longFunctionLines: { type: 'number', description: 'Functions with more lines than this are flagged as long (default 50)' },
        maxNestingWarn:    { type: 'number', description: 'Nesting depth at which to emit a warning (default 4)' }
      },
      required: ['filePath'],
      additionalProperties: false
    }
  },
  {
    name: 'estimate_refactor_risk',
    description: 'Score a file or directory for refactoring risk based on size, complexity, and git churn frequency. Returns a 0–100 risk score with contributing factors and a recommendation.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath:   { type: 'string', description: 'Absolute path to the file (or directory) to score' },
        repoPath:   { type: 'string', description: 'Git repo root to use for churn analysis (defaults to filePath parent)' },
        churnLookback: { type: 'number', description: 'How many days of git history to scan for churn (default 90)' }
      },
      required: ['filePath'],
      additionalProperties: false
    }
  },
  {
    name: 'semantic_tool_search',
    description: 'Fuzzy full-text search across all tool names and descriptions in a running MCP server. Returns ranked matches with relevance scores — useful for discovering which tool to use for a given task.',
    inputSchema: {
      type: 'object',
      properties: {
        query:      { type: 'string', description: 'Natural language query or keywords to search for (e.g. "git churn", "scrape page", "run tests")' },
        serverPath: { type: 'string', description: 'Absolute path to an mcp-server.js file to search (defaults to this server)' },
        maxResults: { type: 'number', description: 'Max results to return (default 10)' }
      },
      required: ['query'],
      additionalProperties: false
    }
  },
  {
    name: 'tool_dependency_graph',
    description: 'Statically analyze an mcp-server.js file to map which tool handler cases call which internal implementation functions, and which functions call each other. Returns a dependency graph useful for understanding change impact before edits.',
    inputSchema: {
      type: 'object',
      properties: {
        serverPath: { type: 'string', description: 'Absolute path to the mcp-server.js file to analyze (defaults to this server)' },
        toolName:   { type: 'string', description: 'If given, return only the graph for this specific tool (partial match)' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'compare_server_capabilities',
    description: 'Diff two MCP server files by tool names and descriptions. Returns lists of added, removed, and changed tools — useful for auditing upgrades, merges, or diverging server versions.',
    inputSchema: {
      type: 'object',
      properties: {
        serverPathA: { type: 'string', description: 'Absolute path to the first mcp-server.js (baseline/old version)' },
        serverPathB: { type: 'string', description: 'Absolute path to the second mcp-server.js (new version). Defaults to this server.' }
      },
      required: ['serverPathA'],
      additionalProperties: false
    }
  },
  {
    name: 'auto_remediate_drift',
    description: 'Automatically apply targeted fixes for common drift conditions detected by drift_detection_check: stash uncommitted changes, run npm install for missing deps, fetch/pull for remote divergence. Safe by default — uses dryRun mode unless explicitly disabled.',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath:   { type: 'string', description: 'Absolute path to the repo to remediate' },
        driftTypes: { type: 'array', items: { type: 'string' }, description: 'List of drift types to fix: "uncommitted_changes", "missing_deps", "remote_behind". Fixes all detected if omitted.' },
        dryRun:     { type: 'boolean', description: 'If true (default), describe what would be done without executing. Set to false to apply.' }
      },
      required: ['repoPath'],
      additionalProperties: false
    }
  },
  {
    name: 'dispatch_specialist_task',
    description: 'Build a fully-formed AI-to-AI prompt bundle for a specialist from the 40-role catalog. The returned systemPrompt + taskPrompt can be dropped directly into any LLM. Each specialist gets a persona, domain framing, behavioral directives, and output guidance tailored to their role.',
    inputSchema: {
      type: 'object',
      properties: {
        specialistId: { type: 'string', description: 'Specialist id from the catalog (e.g. "backend_architect", "security_engineer", "prompt_engineer")' },
        taskTitle:    { type: 'string', description: 'Short title for the task this specialist is being asked to perform' },
        taskContext:  { type: 'string', description: 'Full context, background, constraints, and any artifacts the specialist needs to do their job' },
        outputFormat: { type: 'string', enum: ['json', 'markdown', 'code', 'analysis', 'plan'], description: 'Expected output format (default: markdown)' }
      },
      required: ['specialistId', 'taskTitle', 'taskContext'],
      additionalProperties: false
    }
  },
  {
    name: 'run_parallel_specialist_sprint',
    description: 'Dispatch multiple specialist tasks at once, each producing a fully-formed AI-to-AI prompt bundle. Returns a sprint package with a unique sprintId — hand all bundles to your LLM runner in parallel for simultaneous specialist execution.',
    inputSchema: {
      type: 'object',
      properties: {
        sprintName:     { type: 'string', description: 'Short name for this sprint (e.g. "design-review-pass", "security-audit-wave-1")' },
        tasks:          { type: 'array', minItems: 1, maxItems: 40, items: { type: 'object', required: ['specialistId', 'taskTitle', 'taskContext'], properties: { specialistId: { type: 'string' }, taskTitle: { type: 'string' }, taskContext: { type: 'string' }, outputFormat: { type: 'string' } } }, description: 'Array of specialist task assignments' },
        maxConcurrent:  { type: 'number', description: 'Max tasks to run in one parallel batch (default 8)' }
      },
      required: ['sprintName', 'tasks'],
      additionalProperties: false
    }
  },
  {
    name: 'evaluate_sprint_output',
    description: 'Score specialist sprint outputs on a 4-axis quality rubric (specificity, actionability, coverage, clarity — 0-25 each = 0-100 total). Uses heuristic scoring: token count, structured section headers, domain keyword density. Returns per-task scores + overall sprint score + improvement recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        sprintId:  { type: 'string', description: 'Sprint ID from run_parallel_specialist_sprint (used for logging context)' },
        outputs:   { type: 'array', minItems: 1, items: { type: 'object', required: ['specialistId', 'taskTitle', 'output'], properties: { specialistId: { type: 'string' }, taskTitle: { type: 'string' }, output: { type: 'string' }, domain: { type: 'string' } } }, description: 'Array of specialist outputs to score' },
        rubric:    { type: 'object', description: 'Optional override for max points per axis: { specificity, actionability, coverage, clarity }' }
      },
      required: ['sprintId', 'outputs'],
      additionalProperties: false
    }
  },
  {
    name: 'synthesize_sprint_outputs',
    description: 'Merge and deduplicate parallel specialist outputs into a coherent artifact. Groups by specialist domain, finds common themes, surfaces conflicts, and produces a single ordered action list. Output formats: report (narrative), plan (numbered steps), code_brief (technical spec).',
    inputSchema: {
      type: 'object',
      properties: {
        outputs:        { type: 'array', minItems: 1, items: { type: 'object', required: ['specialistId', 'taskTitle', 'output'], properties: { specialistId: { type: 'string' }, taskTitle: { type: 'string' }, output: { type: 'string' }, domain: { type: 'string' } } }, description: 'Array of specialist outputs to synthesize' },
        synthesisGoal:  { type: 'string', description: 'What question or objective this synthesis should answer' },
        format:         { type: 'string', enum: ['report', 'plan', 'code_brief'], description: 'Output format (default: plan)' }
      },
      required: ['outputs', 'synthesisGoal'],
      additionalProperties: false
    }
  },
  {
    name: 'specialist_work_log',
    description: 'Persistent evidence log for specialist sprint runs. Write sprint results (prompt bundles + scores) to logs/specialist-runs/, read them back by sprintId, or list all recorded sprints. Provides a complete audit trail for evaluating org quality over time.',
    inputSchema: {
      type: 'object',
      properties: {
        action:   { type: 'string', enum: ['write', 'read', 'list'], description: 'Operation to perform' },
        sprintId: { type: 'string', description: 'Sprint ID (required for write and read actions)' },
        entry:    { type: 'object', description: 'Sprint data to persist (required for write action): { sprintName, taskCount, tasks[], scores?, timestamp? }' }
      },
      required: ['action'],
      additionalProperties: false
    }
  },
  {
    name: 'get_sprint_quality_trend',
    description: 'Analyze all logged specialist sprint runs to produce a quality trend report. Computes per-specialist average scores, score deltas over time, rubric axes that consistently underperform, and recommended prompt adjustments. Use this to guide decisions about which specialists or rubric areas need improvement.',
    inputSchema: {
      type: 'object',
      properties: {
        lookbackDays: { type: 'number', description: 'How many days of history to include (default: 30, max: 365)' },
        specialistId: { type: 'string', description: 'Filter to a single specialist ID (optional — omit for all specialists)' },
        minSprints:   { type: 'number', description: 'Minimum number of sprints a specialist must appear in to be included (default: 1)' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'get_memory',
    description: 'Read a value from the persistent session memory store (artifacts/memory/session-state.json). Returns the stored value for a key, or null if the key does not exist. Use this at the start of a session to recover roadmap position, active sprint IDs, quality scores, and other stateful context.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'The key to retrieve. Use dot-notation for nested keys (e.g. "roadmap.currentItem")' }
      },
      required: ['key'],
      additionalProperties: false
    }
  },
  {
    name: 'set_memory',
    description: 'Write or overwrite a value in the persistent session memory store (artifacts/memory/session-state.json). Use this to checkpoint roadmap progress, record sprint IDs, note quality scores, and persist any context that should survive server restarts.',
    inputSchema: {
      type: 'object',
      properties: {
        key:   { type: 'string', description: 'The key to write. Use dot-notation for nested keys (e.g. "roadmap.currentItem")' },
        value: { description: 'The value to store (any JSON-serializable type: string, number, boolean, array, object)' }
      },
      required: ['key', 'value'],
      additionalProperties: false
    }
  },
  {
    name: 'append_memory',
    description: 'Append an item to an array value in the persistent session memory store. If the key does not exist, creates a new array with the item. If the key exists but is not an array, throws an error. Use for growing lists like sprint history, completed roadmap items, or research pulses.',
    inputSchema: {
      type: 'object',
      properties: {
        key:  { type: 'string', description: 'The key of the array to append to. Use dot-notation for nested keys.' },
        item: { description: 'The item to append (any JSON-serializable type)' }
      },
      required: ['key', 'item'],
      additionalProperties: false
    }
  },
  {
    name: 'list_memory_keys',
    description: 'List all top-level keys (or all keys under a dot-notation prefix) in the persistent session memory store. Use to discover what is stored without needing to know key names upfront.',
    inputSchema: {
      type: 'object',
      properties: {
        prefix: { type: 'string', description: 'Optional dot-notation prefix to scope the listing (e.g. "roadmap" returns keys under roadmap)' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'clear_memory',
    description: 'Delete a key (or all keys under a dot-notation prefix) from the persistent session memory store. Use to remove stale context or reset a namespace.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'The key to delete. Use dot-notation for nested keys (e.g. "roadmap.currentItem"). To delete all keys pass "__all__".' }
      },
      required: ['key'],
      additionalProperties: false
    }
  },
  {
    name: 'adversarial_review',
    description: 'Adversarial review gate — given any plan, code snippet, or diff, builds a structured prompt bundle that forces an AI to act as a hostile critic. Returns ≥3 specific objections covering security holes, logic errors, edge cases, and breaking changes. Use before auto-implementing any plan.',
    inputSchema: {
      type: 'object',
      properties: {
        content:     { type: 'string', description: 'The plan, code, diff, or design to review adversarially' },
        context:     { type: 'string', description: 'Optional: background context — what the content is trying to accomplish' },
        focusAreas:  { type: 'array', items: { type: 'string' }, description: 'Optional: specific risk areas to emphasize (e.g. ["security","performance","edge-cases"])' },
        minObjections: { type: 'number', description: 'Minimum number of objections to surface (default: 3)' }
      },
      required: ['content'],
      additionalProperties: false
    }
  },

  // ── ROADMAP #3: Auto-Commit Pipeline ─────────────────────────────────────
  {
    name: 'auto_implement_plan',
    description: 'Auto-implement a natural-language plan against a target file. Parses the plan into discrete string-replacement edits, applies them surgically, runs node --check, and optionally runs npm test + git commit+push. Use dryRun=true to preview edits before applying.',
    inputSchema: {
      type: 'object',
      properties: {
        plan:        { type: 'string', description: 'Natural-language plan describing changes: edits to make, patterns to find and replace' },
        targetFile:  { type: 'string', description: 'Absolute path to the JS file to edit' },
        edits:       { type: 'array', description: 'Explicit edit list (overrides plan parsing). Each item: { find: string, replace: string }', items: { type: 'object', properties: { find: { type: 'string' }, replace: { type: 'string' } }, required: ['find', 'replace'] } },
        commitMessage: { type: 'string', description: 'Git commit message to use if committing' },
        dryRun:      { type: 'boolean', description: 'If true (default), preview edits without applying or committing' },
        runTests:    { type: 'boolean', description: 'If true, run npm test after applying edits (before committing)' }
      },
      required: ['targetFile'],
      additionalProperties: false
    }
  },

  // ── ROADMAP #4: Live Web Scraping Research Feed ───────────────────────────
  {
    name: 'scrape_research_url',
    description: 'Fetch a URL, extract meaningful text from the HTML, score relevance to the current roadmap context, deduplicate against prior research, and persist a structured insight to artifacts/research-pulses/. Returns extracted insights with relevance score.',
    inputSchema: {
      type: 'object',
      properties: {
        url:          { type: 'string', description: 'URL to scrape for research' },
        topic:        { type: 'string', description: 'Topic or question to score relevance against' },
        maxChars:     { type: 'number', description: 'Max characters of extracted text to return (default 3000)' },
        saveInsight:  { type: 'boolean', description: 'If true (default), persist insight to artifacts/research-pulses/' }
      },
      required: ['url'],
      additionalProperties: false
    }
  },

  // ── ROADMAP #7: Tool Self-Registration API ────────────────────────────────
  {
    name: 'register_tool',
    description: 'Dynamically register a new tool at runtime. The tool is added to the TOOLS array and a handler stub is persisted to artifacts/registered-tools.json so it survives restarts. Handler code is validated for syntax before registration.',
    inputSchema: {
      type: 'object',
      properties: {
        name:        { type: 'string', description: 'Unique tool name (snake_case)' },
        description: { type: 'string', description: 'Tool description' },
        inputSchema: { type: 'object', description: 'JSON Schema object for the tool inputs' },
        handlerCode: { type: 'string', description: 'JavaScript function body string: receives (args) and should return a plain object. Will be wrapped as: function handler(args) { <handlerCode> }' },
        packId:      { type: 'string', description: 'Optional skill pack ID this tool belongs to' }
      },
      required: ['name', 'description', 'handlerCode'],
      additionalProperties: false
    }
  },
  {
    name: 'unregister_tool',
    description: 'Unregister a previously registered dynamic tool. Removes it from the runtime TOOLS array and from artifacts/registered-tools.json.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the tool to unregister' }
      },
      required: ['name'],
      additionalProperties: false
    }
  },

  // ── ROADMAP #8: Dependency Graph Execution Engine ────────────────────────
  {
    name: 'execute_dependency_graph',
    description: 'Execute a DAG of tool calls. Nodes declare which tool to call and with what args; edges declare dependencies. Performs topological sort (Kahn\'s algorithm), executes independent waves in parallel, and returns a unified result tree.',
    inputSchema: {
      type: 'object',
      properties: {
        nodes: {
          type: 'array',
          description: 'List of execution nodes',
          items: {
            type: 'object',
            properties: {
              id:       { type: 'string', description: 'Unique node ID' },
              toolName: { type: 'string', description: 'Tool name to call' },
              args:     { type: 'object', description: 'Args to pass to the tool' },
              label:    { type: 'string', description: 'Human-readable label' }
            },
            required: ['id', 'toolName']
          }
        },
        edges: {
          type: 'array',
          description: 'Dependency edges: { from: nodeId, to: nodeId } means "to" depends on "from"',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to:   { type: 'string' }
            },
            required: ['from', 'to']
          }
        },
        stopOnError: { type: 'boolean', description: 'If true, abort execution on first failure (default false)' }
      },
      required: ['nodes'],
      additionalProperties: false
    }
  },

  // ── ROADMAP #9: Skill Pack Runtime ───────────────────────────────────────
  {
    name: 'load_skill_pack',
    description: 'Load a skill pack from a manifest file. The manifest defines a set of tools with names, descriptions, schemas, and handler code. Each tool is registered via register_tool.',
    inputSchema: {
      type: 'object',
      properties: {
        manifestPath: { type: 'string', description: 'Absolute path to a skill pack manifest JSON file. Schema: { id, name, version, tools: [{ name, description, inputSchema, handlerCode }] }' }
      },
      required: ['manifestPath'],
      additionalProperties: false
    }
  },
  {
    name: 'list_loaded_skill_packs',
    description: 'List all currently loaded skill packs and the tools each pack has registered.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'unload_skill_pack',
    description: 'Unload a skill pack by ID. Unregisters all tools that were loaded from that pack.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Skill pack ID to unload' }
      },
      required: ['id'],
      additionalProperties: false
    }
  },

  // ── ROADMAP #10: Multi-Server Orchestration Hub ───────────────────────────
  {
    name: 'list_available_servers',
    description: 'Scan the MCP servers root directory for peer servers. Returns each server\'s path, package.json metadata, whether it appears to be running (port check), and its health if reachable.',
    inputSchema: {
      type: 'object',
      properties: {
        rootPath:    { type: 'string', description: 'Root directory to scan (default: C:\\Users\\justi\\mcp-servers)' },
        checkHealth: { type: 'boolean', description: 'If true, attempt health check on each discovered server (default true)' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'delegate_to_server',
    description: 'Delegate a tool call to a peer MCP server via its HTTP bridge. Sends a JSON-RPC tools/call request and returns the result. Supports optional timeout and retry with exponential back-off.',
    inputSchema: {
      type: 'object',
      properties: {
        serverUrl: { type: 'string', description: 'Base URL of the peer server HTTP bridge (e.g. http://127.0.0.1:11201)' },
        toolName:  { type: 'string', description: 'Tool name to call on the peer server' },
        args:      { type: 'object', description: 'Arguments to pass to the tool' },
        timeoutMs: { type: 'number', description: 'HTTP timeout per attempt in ms (default 30000)' },
        retries:   { type: 'number', description: 'Number of retry attempts on failure (0–5, default 0). Uses 200ms*attempt back-off.' }
      },
      required: ['serverUrl', 'toolName'],
      additionalProperties: false
    }
  },
  {
    name: 'spawn_child_server',
    description: 'Spawn a peer MCP server as a managed child process. Returns a serverId that can be used with stop_child_server and delegate_to_server. Use waitForReady=true to block until the child HTTP health endpoint responds.',
    inputSchema: {
      type: 'object',
      properties: {
        serverPath:    { type: 'string', description: 'Absolute path to the server directory containing mcp-server.js' },
        port:          { type: 'number', description: 'Port the child server should listen on (passed as HTTP_PORT env var)' },
        label:         { type: 'string', description: 'Human-readable label for this server instance' },
        waitForReady:  { type: 'boolean', description: 'If true, poll /health until ready (up to readyTimeoutMs). Requires port.' },
        readyTimeoutMs: { type: 'number', description: 'Max ms to wait for health endpoint when waitForReady=true (default 5000)' }
      },
      required: ['serverPath'],
      additionalProperties: false
    }
  },
  {
    name: 'stop_child_server',
    description: 'Stop a previously spawned child MCP server by its serverId.',
    inputSchema: {
      type: 'object',
      properties: {
        serverId: { type: 'string', description: 'Server ID returned by spawn_child_server' }
      },
      required: ['serverId'],
      additionalProperties: false
    }
  },
  {
    name: 'get_tool_metrics',
    description: 'Return per-tool call counts and latency percentiles (p50/p95/p99) from the rolling in-memory histogram. Shows the top-N most-called tools since server start.',
    inputSchema: {
      type: 'object',
      properties: {
        topN: { type: 'number', description: 'Number of tools to return, sorted by call count (default 10, max 75)' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'explain_tool',
    description: 'Return a human-readable explanation of a single tool — its purpose, parameters, return shape, and a usage example. Helpful for AI agents exploring the catalog.',
    inputSchema: {
      type: 'object',
      properties: {
        toolName: { type: 'string', description: 'Exact name of the tool to explain' }
      },
      required: ['toolName'],
      additionalProperties: false
    }
  },
  {
    name: 'export_tool_catalog',
    description: 'Export the full MCP tool catalog as a structured JSON or Markdown document. Useful for documentation, onboarding, and agent self-discovery.',
    inputSchema: {
      type: 'object',
      properties: {
        format:        { type: 'string', enum: ['json', 'markdown'], description: 'Output format (default "markdown")' },
        includeSchema: { type: 'boolean', description: 'Include full inputSchema per tool (default false)' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'run_eval_loop',
    description: 'Run a continuous evaluation loop: call a target tool with each test case N times, collect pass/fail and latency stats. Returns a report with pass rate and p95 latency. Useful for regression and soak testing.',
    inputSchema: {
      type: 'object',
      properties: {
        toolName:   { type: 'string', description: 'Tool to exercise in the loop' },
        testCases:  { type: 'array',  description: 'Array of { args, expectKey, expectValue } test case objects', items: { type: 'object' } },
        iterations: { type: 'number', description: 'Number of full passes through testCases (default 3, max 20)' },
        stopOnFail: { type: 'boolean', description: 'Halt after first failure (default false)' }
      },
      required: ['toolName', 'testCases'],
      additionalProperties: false
    }
  },
  {
    name: 'replay_last_sprint',
    description: 'Re-run the most recent parallel specialist sprint from saved log artifacts, optionally filtering to a subset of specialists. Returns fresh specialist outputs alongside the original for comparison.',
    inputSchema: {
      type: 'object',
      properties: {
        sprintId:            { type: 'string', description: 'Sprint ID to replay (omit to use the most recent)' },
        specialistFilter:    { type: 'array',  description: 'Only re-run these specialistIds (omit for all)', items: { type: 'string' } },
        compareWithOriginal: { type: 'boolean', description: 'Include original outputs in response for side-by-side comparison (default true)' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'run_ai_benchmark',
    description: 'Run a structured AI benchmark across 5 quality categories (tool_accuracy, test_suite_health, sprint_output_quality, api_availability, response_latency) and save results to tests/logs/ai-benchmarks.json',
    inputSchema: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: { type: 'string', enum: ['tool_accuracy', 'test_suite_health', 'sprint_output_quality', 'api_availability', 'response_latency'] },
          description: 'Limit to specific categories (default: all 5)'
        },
        saveResults: {
          type: 'boolean',
          description: 'Whether to persist results to ai-benchmarks.json (default true)'
        }
      },
      additionalProperties: false
    }
  }
];

const PROMPTS = [
  {
    name: 'agent_ops_workflow',
    description: 'Step-by-step guide for using agent-ops-hub to orchestrate complex multi-server agent operations',
    arguments: [
      { name: 'goal', description: 'High-level goal or task you want to accomplish', required: false }
    ]
  },
  {
    name: 'validation_strategy',
    description: 'Recommended validation gate strategy for MCP server development — test setup, gate ordering, and severity levels',
    arguments: [
      { name: 'serverName', description: 'Name of the MCP server being validated', required: false }
    ]
  },
  {
    name: 'specialist_team_blueprint',
    description: 'Blueprint for running a 40-role specialist agent team with pod collaboration and continuous improvement loops',
    arguments: [
      { name: 'goal', description: 'Project goal for the specialist team', required: false },
      { name: 'teamSize', description: 'Desired active specialists to start with', required: false }
    ]
  },
  {
    name: 'continuous_research_loop',
    description: 'How to run a nonstop build-improve cycle with web research pulses every 10 minutes and fast integration of new ideas',
    arguments: [
      { name: 'goal', description: 'What system should be continuously improved', required: false },
      { name: 'cadenceMinutes', description: 'Research pulse cadence in minutes', required: false }
    ]
  },
  {
    name: 'media_toolchain_blueprint',
    description: 'Practical blueprint for using built-in media tools to generate images and analyze image/video assets in coding workflows',
    arguments: [
      { name: 'goal', description: 'Media workflow goal (UI mocks, QA evidence, video inspection)', required: false }
    ]
  },
  {
    name: 'skill_pack_operating_model',
    description: 'How to operationalize specialist roles as skill packs for repeatable, rigorous auto-coding behavior',
    arguments: [
      { name: 'goal', description: 'What your skill-pack system should optimize for', required: false }
    ]
  },
  {
    name: 'autonomous_loop_controller',
    description: 'Operational playbook for nonstop auto-mode: loop orchestration, controls, checkpoints, and resume behavior',
    arguments: [
      { name: 'goal', description: 'Continuous improvement objective for the loop', required: false }
    ]
  },
  {
    name: 'release_prep_checklist',
    description: 'Full release preparation checklist for an MCP server: tests, changelog, version bump, tag, and push',
    arguments: [
      { name: 'serverDir', description: 'Path to the MCP server directory being released', required: false },
      { name: 'version',   description: 'Target version string (e.g. v0.1.0)', required: false }
    ]
  },
  {
    name: 'multi_repo_ops_playbook',
    description: 'Step-by-step operational playbook for managing changes, drift checks, changelogs, and releases across multiple MCP server repos simultaneously.',
    arguments: [
      { name: 'reposRoot', description: 'Root directory containing all repos (e.g. /path/to/mcp-servers)', required: false },
      { name: 'goal',      description: 'What you are trying to accomplish across the repos', required: false }
    ]
  },

  // ── P: Specialist Execution Prompts (AI-to-AI optimized) ─────────────────
  {
    name: 'specialist_sprint_briefing',
    description: 'AI orchestrator kick-off brief for a parallel specialist sprint. Provides assignment routing, behavioral contract, and quality expectations in a terse AI-ready format. Use before calling run_parallel_specialist_sprint.',
    arguments: [
      { name: 'sprintGoal',     description: 'What the sprint is trying to achieve', required: true },
      { name: 'specialistList', description: 'Comma-separated list of specialist IDs being dispatched', required: false },
      { name: 'outputFormat',   description: 'Expected output format for all tasks (default: markdown)', required: false }
    ]
  },
  {
    name: 'code_review_specialist',
    description: 'AI-to-AI code review persona. SOLID/DRY/YAGNI focused. Surfaces bugs, coupling issues, security anti-patterns, and maintainability debt. Returns structured findings with severity ratings.',
    arguments: [
      { name: 'codeContext', description: 'The code or module description to review', required: true },
      { name: 'language',   description: 'Programming language or framework (default: JavaScript)', required: false }
    ]
  },
  {
    name: 'security_audit_specialist',
    description: 'AI-to-AI security audit persona. OWASP Top 10 threat modeling. Input validation, auth flows, secret hygiene, injection vectors, and dependency risks. Outputs risk-classified finding list.',
    arguments: [
      { name: 'target',   description: 'What to audit: endpoint name, module, or feature area', required: true },
      { name: 'context',  description: 'Relevant code, config, or architecture details', required: false }
    ]
  },
  {
    name: 'test_strategy_specialist',
    description: 'AI-to-AI test strategy persona. TDD-first, risk-based coverage design. Outputs a test plan: unit/integration/e2e breakdown, edge cases, chaos injection points, and coverage targets per module.',
    arguments: [
      { name: 'feature',     description: 'Feature, module, or system to design tests for', required: true },
      { name: 'existingTests', description: 'Brief description of tests that already exist', required: false }
    ]
  },
  {
    name: 'architecture_review_specialist',
    description: 'AI-to-AI architecture review persona. Coupling/cohesion analysis, boundary violations, scalability ceilings, and consistency of design decisions. Outputs findings + architectural decision records (ADRs) where warranted.',
    arguments: [
      { name: 'systemDescription', description: 'Description of the system, components, and boundaries to review', required: true },
      { name: 'concerns',          description: 'Specific concerns or trade-offs to examine', required: false }
    ]
  },
  {
    name: 'performance_specialist',
    description: 'AI-to-AI performance specialist persona. Profiling-first methodology. Identifies Big-O problems, DB query cost, render blocking, and memory pressure. Every recommendation requires a before/after measurement criterion.',
    arguments: [
      { name: 'target',   description: 'System, function, or flow with the performance concern', required: true },
      { name: 'symptoms', description: 'Observed symptoms: slow queries, high CPU, latency spikes, etc.', required: false }
    ]
  },
  {
    name: 'debugging_specialist',
    description: 'AI-to-AI debugging specialist persona. Root cause analysis via minimal reproduction. Bisect-style fault isolation, stack trace interpretation, side-effect mapping. Output: reproducible steps + verified fix.',
    arguments: [
      { name: 'bugDescription', description: 'What is broken, what was expected, what actually happens', required: true },
      { name: 'errorOutput',    description: 'Error messages, stack traces, or logs', required: false }
    ]
  },
  {
    name: 'documentation_specialist',
    description: 'AI-to-AI docs specialist persona. Audience-first writing. Produces: API reference, README sections, inline comments, and usage examples. Output follows a structure: purpose → usage → reference → examples.',
    arguments: [
      { name: 'subject',   description: 'What to document: module, API, feature, or concept', required: true },
      { name: 'audience',  description: 'Target reader: end user, developer, AI agent, operator (default: developer)', required: false }
    ]
  },
  {
    name: 'refactoring_specialist',
    description: 'AI-to-AI refactoring specialist persona. Code smell detection + safe incremental refactoring. Strangler fig, extract-transform-load, and decompose conditional patterns. Each step must be independently deployable.',
    arguments: [
      { name: 'codeTarget',  description: 'Code, module, or pattern to refactor', required: true },
      { name: 'constraints', description: 'What must NOT change (interface contract, API, behavior)', required: false }
    ]
  },
  {
    name: 'devops_specialist',
    description: 'AI-to-AI DevOps specialist persona. CI/CD pipeline design, deployment strategies (blue-green, canary, feature flags), monitoring hookup, and rollback procedures. Every deployment plan includes a revert path.',
    arguments: [
      { name: 'deployTarget', description: 'What is being deployed: service, config, infra change', required: true },
      { name: 'environment',  description: 'Target environment details: cloud, on-prem, containers, VMs', required: false }
    ]
  }
];

function readPositiveIntEnv(name, fallback) {
  const raw = process.env[name];
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const HTTP_PORT = readPositiveIntEnv('HTTP_PORT', 11200);
const MCP_CLIENT_REQUEST_TIMEOUT_MS = readPositiveIntEnv('AGENT_OPS_CLIENT_REQUEST_TIMEOUT_MS', 45000);

let inputBuffer = '';
const pendingClientRequests = new Map();
const mcpClientSession = {
  initialized: false,
  lastSeenAt: null,
  clientInfo: null,
  capabilities: {},
};
const lastChatTransportState = {
  mode: 'http_proxy',
  available: null,
  degraded: false,
  code: null,
  error: null,
  updatedAt: null,
};
let nextClientRequestId = 100000;

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  inputBuffer += chunk;
  processIncoming();
});

function processIncoming() {
  while (true) {
    const lineEnd = inputBuffer.indexOf('\n');
    if (lineEnd === -1) {
      return;
    }
    const line = inputBuffer.slice(0, lineEnd).trim();
    inputBuffer = inputBuffer.slice(lineEnd + 1);
    if (!line) {
      continue;
    }

    let message;
    try {
      message = JSON.parse(line);
    } catch (error) {
      sendError(null, -32700, `Parse error: ${error.message}`);
      continue;
    }

    if (isPendingClientResponse(message)) {
      settlePendingClientResponse(message);
      continue;
    }

    handleMessage(message).catch((error) => {
      sendError(message.id || null, -32603, error.message || 'Internal error');
    });
  }
}

function isPendingClientResponse(message) {
  return !!(
    message
    && Object.prototype.hasOwnProperty.call(message, 'id')
    && !Object.prototype.hasOwnProperty.call(message, 'method')
    && pendingClientRequests.has(message.id)
  );
}

function settlePendingClientResponse(message) {
  const pending = pendingClientRequests.get(message.id);
  if (!pending) {
    return;
  }
  clearTimeout(pending.timeout);
  pendingClientRequests.delete(message.id);
  if (message.error) {
    pending.reject(new Error(message.error.message || `Client request failed: ${pending.method}`));
    return;
  }
  pending.resolve(message.result);
}

async function handleMessage(message) {
  const { id, method, params } = message;

  if (method === 'initialize') {
    rememberMcpClient(params);
    return sendResult(id, {
      protocolVersion: '2024-11-05',
      serverInfo: {
        name: 'agent-ops-hub',
        version: '0.9.1'
      },
      capabilities: {
        tools: {},
        prompts: {}
      }
    });
  }

  if (method === 'notifications/initialized') {
    mcpClientSession.lastSeenAt = Date.now();
    return;
  }

  if (method === 'tools/list') {
    return sendResult(id, { tools: TOOLS });
  }

  if (method === 'prompts/list') {
    return sendResult(id, { prompts: PROMPTS });
  }

  if (method === 'prompts/get') {
    const promptName = params && params.name;
    const promptArgs = (params && params.arguments) || {};
    const prompt = PROMPTS.find((p) => p.name === promptName);
    if (!prompt) return sendError(id, -32602, `Unknown prompt: ${promptName}`);
    return sendResult(id, { description: prompt.description, messages: [{ role: 'user', content: { type: 'text', text: buildPromptText(promptName, promptArgs) } }] });
  }

  if (method === 'tools/call') {
    const toolName = params && params.name;
    const args = (params && params.arguments) || {};

    if (!toolName) {
      return sendError(id, -32602, 'Missing tool name');
    }

    toolCallCount++;
    const _callStart    = Date.now();
    const _argsSummary  = buildArgsSummary(toolName, args);
    emitHub('tool_call', { toolName, argsSummary: _argsSummary, phase: 'start' });
    let _toolResult;
    try {
      _toolResult = await runTool(toolName, args);
    } catch (err) {
      emitHub('tool_call', { toolName, phase: 'error', error: err.message, durationMs: Date.now() - _callStart });
      throw err;
    }
    emitHub('tool_call', { toolName, phase: 'end', durationMs: Date.now() - _callStart });
    return sendResult(id, {
      content: [
        {
          type: 'text',
          text: JSON.stringify(_toolResult, null, 2)
        }
      ]
    });
  }

  if (!id && typeof method === 'string' && method.startsWith('notifications/')) {
    return;
  }

  sendError(id || null, -32601, `Method not found: ${method}`);
}

function rememberMcpClient(params) {
  mcpClientSession.initialized = true;
  mcpClientSession.lastSeenAt = Date.now();
  mcpClientSession.clientInfo = params && params.clientInfo ? params.clientInfo : null;
  mcpClientSession.capabilities = params && params.capabilities && typeof params.capabilities === 'object'
    ? params.capabilities
    : {};

  if (clientSupportsSampling()) {
    updateChatTransportState({
      mode: 'mcp_sampling',
      available: true,
      degraded: false,
      code: null,
      error: null,
    });
  }
}

async function runTool(name, args) {
  const _t0 = Date.now();
  let _result;
  try {
    _result = await _dispatchTool(name, args);
  } finally {
    _recordToolLatency(name, Date.now() - _t0);
  }
  return _result;
}

async function _dispatchTool(name, args) {
  switch (name) {
    case 'agent_mode_preflight':
      return agentModePreflight(args);
    case 'list_local_mcp_servers':
      return listLocalMcpServers(args);
    case 'research_agent_patterns':
      return researchAgentPatterns(args);
    case 'create_execution_runbook':
      return createExecutionRunbook(args);
    case 'run_validation_gate':
      return runValidationGate(args);
    case 'benchmark_validation_gate':
      return benchmarkValidationGate(args);
    case 'summarize_test_artifacts':
      return summarizeTestArtifacts(args);
    case 'diff_execution_plans':
      return diffExecutionPlans(args);
    case 'generate_test_scaffold':
      return generateTestScaffold(args);
    case 'check_server_health':
      return checkServerHealth(args);
    case 'compare_mcp_server_tools':
      return compareMcpServerTools(args);
    case 'scan_tool_coverage':
      return scanToolCoverage(args);
    case 'estimate_tool_complexity':
      return estimateToolComplexity(args);
    case 'generate_changelog_entry':
      return generateChangelogEntry(args);
    case 'code_quality_gate':
      return codeQualityGate(args);
    case 'dependency_audit':
      return dependencyAudit(args);
    case 'server_capability_matrix':
      return serverCapabilityMatrix(args);
    case 'roadmap_tracker':
      return roadmapTracker(args);
    case 'write_release_notes':
      return writeReleaseNotes(args);
    case 'agent_task_planner':
      return agentTaskPlanner(args);
    case 'execution_history_summary':
      return executionHistorySummary(args);
    case 'find_missing_tests':
      return findMissingTests(args);
    case 'tag_test_results':
      return tagTestResults(args);
    case 'generate_specialist_agent_roster':
      return generateSpecialistAgentRoster(args);
    case 'plan_specialist_assignments':
      return planSpecialistAssignments(args);
    case 'build_collaboration_schedule':
      return buildCollaborationSchedule(args);
    case 'research_improvement_ideas':
      return researchImprovementIdeas(args);
    case 'record_research_pulse':
      return recordResearchPulse(args);
    case 'run_autonomous_improvement_cycle':
      return runAutonomousImprovementCycle(args);
    case 'orchestrate_continuous_improvement_loop':
      return orchestrateContinuousImprovementLoop(args);
    case 'get_autonomous_loop_state':
      return getAutonomousLoopState(args);
    case 'set_autonomous_loop_control':
      return setAutonomousLoopControl(args);
    case 'resume_interrupted_cycle':
      return resumeInterruptedCycle(args);
    case 'evaluate_autonomous_loop_quality':
      return evaluateAutonomousLoopQuality(args);
    case 'generate_svg_image':
      return generateSvgImage(args);
    case 'analyze_image_file':
      return analyzeImageFile(args);
    case 'analyze_video_file':
      return analyzeVideoFile(args);
    case 'discover_mcp_docs_index':
      return discoverMcpDocsIndex(args);
    case 'draft_skill_pack_manifest':
      return draftSkillPackManifest(args);
    case 'validate_json_schema':
      return validateJsonSchema(args);
    case 'drift_detection_check':
      return driftDetectionCheck(args);
    case 'multi_repo_sync_status':
      return multiRepoSyncStatus(args);
    case 'generate_changelog':
      return generateChangelog(args);
    case 'regression_root_cause_analysis':
      return regressionRootCauseAnalysis(args);
    case 'code_complexity_scan':
      return codeComplexityScan(args);
    case 'estimate_refactor_risk':
      return estimateRefactorRisk(args);
    case 'semantic_tool_search':
      return semanticToolSearch(args);
    case 'tool_dependency_graph':
      return toolDependencyGraph(args);
    case 'compare_server_capabilities':
      return compareServerCapabilities(args);
    case 'auto_remediate_drift':
      return autoRemediateDrift(args);
    case 'dispatch_specialist_task':
      return dispatchSpecialistTask(args);
    case 'run_parallel_specialist_sprint':
      return runParallelSpecialistSprint(args);
    case 'evaluate_sprint_output':
      return evaluateSprintOutput(args);
    case 'synthesize_sprint_outputs':
      return synthesizeSprintOutputs(args);
    case 'specialist_work_log':
      return specialistWorkLog(args);
    case 'get_sprint_quality_trend':
      return getSprintQualityTrend(args);
    case 'get_memory':
      return getMemory(args);
    case 'set_memory':
      return setMemory(args);
    case 'append_memory':
      return appendMemory(args);
    case 'list_memory_keys':
      return listMemoryKeys(args);
    case 'clear_memory':
      return clearMemory(args);
    case 'adversarial_review':
      return adversarialReview(args);
    case 'auto_implement_plan':
      return await autoImplementPlan(args);
    case 'scrape_research_url':
      return await scrapeResearchUrl(args);
    case 'register_tool':
      return registerTool(args);
    case 'unregister_tool':
      return unregisterTool(args);
    case 'execute_dependency_graph':
      return await executeDependencyGraph(args);
    case 'load_skill_pack':
      return loadSkillPack(args);
    case 'list_loaded_skill_packs':
      return listLoadedSkillPacks();
    case 'unload_skill_pack':
      return unloadSkillPack(args);
    case 'list_available_servers':
      return await listAvailableServers(args);
    case 'delegate_to_server':
      return await delegateToServer(args);
    case 'spawn_child_server':
      return await spawnChildServer(args);
    case 'stop_child_server':
      return stopChildServer(args);
    case 'get_tool_metrics':
      return getToolMetrics(args);
    case 'explain_tool':
      return explainTool(args);
    case 'export_tool_catalog':
      return exportToolCatalog(args);
    case 'run_eval_loop':
      return await runEvalLoop(args);
    case 'replay_last_sprint':
      return await replayLastSprint(args);
    case 'run_ai_benchmark':
      return await runAiBenchmark(args);
    default: {
      // Fallback: check dynamically registered tools
      const dynHandler = _dynamicHandlers.get(name);
      if (dynHandler) return dynHandler(args);
      throw new Error(`Unknown tool: ${name}`);
    }
  }
}

async function agentModePreflight(args) {
  const timeoutMs = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 45000;
  const mcpRootPath = normalizeFsPath(args.mcpRootPath || DEFAULT_MCP_ROOT);

  const [nodeVersion, npmVersion] = await Promise.all([
    runShellCommand('node --version', process.cwd(), timeoutMs),
    runShellCommand('npm --version', process.cwd(), timeoutMs)
  ]);

  const mcpListing = listLocalMcpServers({ rootPath: mcpRootPath });
  const checks = [
    {
      id: 'node_available',
      passed: nodeVersion.exitCode === 0,
      details: clip(nodeVersion.stdout || nodeVersion.stderr, 200)
    },
    {
      id: 'npm_available',
      passed: npmVersion.exitCode === 0,
      details: clip(npmVersion.stdout || npmVersion.stderr, 200)
    },
    {
      id: 'mcp_root_readable',
      passed: mcpListing.count > 0,
      details: `mcp folders found: ${mcpListing.count}`
    }
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const readinessScore = Math.round((passedCount / checks.length) * 100);

  return {
    readinessScore,
    passedChecks: passedCount,
    totalChecks: checks.length,
    checks,
    mcpInventory: {
      rootPath: mcpListing.rootPath,
      count: mcpListing.count,
      sample: mcpListing.servers.slice(0, 10)
    }
  };
}

function listLocalMcpServers(args) {
  const rootPath = normalizeFsPath(args.rootPath || DEFAULT_MCP_ROOT);
  const entries = safeReadDir(rootPath);

  const servers = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(rootPath, entry.name);
      const packageJson = path.join(dir, 'package.json');
      const serverJs = path.join(dir, 'mcp-server.js');
      const indexJs = path.join(dir, 'index.js');

      let version = null;
      if (fs.existsSync(packageJson)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
          version = pkg.version || null;
        } catch (_error) {
          version = null;
        }
      }

      return {
        name: entry.name,
        path: dir,
        version,
        hasPackageJson: fs.existsSync(packageJson),
        hasMcpServerJs: fs.existsSync(serverJs),
        hasIndexJs: fs.existsSync(indexJs)
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    rootPath,
    count: servers.length,
    servers
  };
}

async function researchAgentPatterns(args) {
  const urls = args.urls || [];
  const timeoutMs = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 15000;
  const maxBytes = Number.isFinite(args.maxBytes) ? args.maxBytes : 120000;

  const defaultKeywords = [
    'agent',
    'operator',
    'approval',
    'checkpoint',
    'resume',
    'interrupt',
    'human-in-the-loop',
    'visibility',
    'guardrail',
    'risk'
  ];
  const keywords = Array.isArray(args.keywords) && args.keywords.length
    ? args.keywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean)
    : defaultKeywords;

  const results = [];
  const keywordCounts = Object.fromEntries(keywords.map((k) => [k, 0]));
  for (const url of urls) {
    try {
      const response = await fetchUrl(url, timeoutMs, maxBytes);
      const plain = htmlToText(response.body);
      const lower = plain.toLowerCase();
      const hits = [];

      for (const keyword of keywords) {
        const idx = lower.indexOf(keyword);
        if (idx >= 0) {
          keywordCounts[keyword] += 1;
          const start = Math.max(0, idx - 80);
          const end = Math.min(plain.length, idx + 160);
          hits.push({ keyword, excerpt: plain.slice(start, end).replace(/\s+/g, ' ').trim() });
        }
      }

      results.push({
        url,
        statusCode: response.statusCode,
        title: extractTitle(response.body),
        headings: extractHeadings(response.body).slice(0, 10),
        hitCount: hits.length,
        hits: hits.slice(0, 12)
      });
    } catch (error) {
      results.push({ url, error: error.message });
    }
  }

  return {
    scanned: urls.length,
    keywords,
    keywordCounts,
    results
  };
}

function createExecutionRunbook(args) {
  const name = args.name || 'runbook';
  const now = new Date();
  const stamp = toStamp(now);
  const runbook = {
    id: `${slugify(name)}-${stamp}`,
    name: name,
    objective: args.objective,
    createdAt: now.toISOString(),
    steps: args.steps.map((step, index) => ({
      index: index + 1,
      id: step.id,
      title: step.title,
      command: step.command,
      mustPass: step.mustPass !== false
    })),
    policy: {
      stopOnFail: true,
      requiresValidation: true
    }
  };

  const outputDir = normalizeFsPath(args.outputDir || DEFAULT_RUNBOOK_DIR);
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${runbook.id}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(runbook, null, 2));

  return {
    created: true,
    outputPath,
    runbook
  };
}

async function runValidationGate(args) {
  const cwd = normalizeFsPath(args.cwd || process.cwd());
  const timeoutMs = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 180000;
  const rawCommands = args.commands || [];

  // Normalize: accept both plain strings and { command, severity } objects
  const commands = rawCommands.map((c) => {
    if (typeof c === 'string') return { command: c, severity: 'error' };
    return { command: String(c.command || ''), severity: c.severity || 'error' };
  });

  const results = [];
  for (const { command, severity } of commands) {
    const startedAt = Date.now();
    const result = await runShellCommand(command, cwd, timeoutMs);
    const durationMs = Date.now() - startedAt;
    const passed = result.exitCode === 0;

    results.push({
      command,
      severity,
      cwd,
      durationMs,
      exitCode: result.exitCode,
      stdout: clip(result.stdout, 10000),
      stderr: clip(result.stderr, 8000),
      passed
    });

    // Only abort on error-severity failures
    if (!passed && severity === 'error') {
      break;
    }
  }

  const errorFails  = results.filter((r) => !r.passed && r.severity === 'error');
  const warnFails   = results.filter((r) => !r.passed && r.severity === 'warn');
  const passed = errorFails.length === 0;

  return {
    passed,
    attempted: results.length,
    totalRequested: commands.length,
    errorFailures: errorFails.length,
    warnFailures: warnFails.length,
    results
  };
}

async function benchmarkValidationGate(args) {
  const commands = args.commands || [];
  const iterations = Number.isFinite(args.iterations) ? Math.floor(args.iterations) : 3;
  const cwd = normalizeFsPath(args.cwd || process.cwd());
  const timeoutMs = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 180000;

  const runs = [];
  for (let i = 0; i < iterations; i += 1) {
    const startedAt = Date.now();
    const gate = await runValidationGate({ commands, cwd, timeoutMs });
    const durationMs = Date.now() - startedAt;
    runs.push({
      iteration: i + 1,
      durationMs,
      passed: gate.passed,
      attempted: gate.attempted,
      totalRequested: gate.totalRequested
    });

    if (!gate.passed) {
      break;
    }
  }

  const durations = runs.map((r) => r.durationMs);
  const avgDurationMs = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const minDurationMs = durations.length ? Math.min(...durations) : 0;
  const maxDurationMs = durations.length ? Math.max(...durations) : 0;

  return {
    commands,
    iterationsRequested: iterations,
    iterationsCompleted: runs.length,
    passed: runs.every((r) => r.passed),
    metrics: {
      avgDurationMs,
      minDurationMs,
      maxDurationMs
    },
    runs
  };
}

function summarizeTestArtifacts(args) {
  const artifactsPath = normalizeFsPath(args.artifactsPath);
  const latestAiPath = path.join(artifactsPath, 'latest_ai.json');
  const latestHumanPath = path.join(artifactsPath, 'latest_human.md');

  if (!fs.existsSync(latestAiPath)) {
    throw new Error(`Missing artifact: ${latestAiPath}`);
  }

  const ai = JSON.parse(fs.readFileSync(latestAiPath, 'utf8'));
  const human = fs.existsSync(latestHumanPath)
    ? fs.readFileSync(latestHumanPath, 'utf8').split(/\r?\n/).slice(0, 20)
    : [];

  // Trend analysis: scan runs/ directory for past results
  const runsDir = path.join(artifactsPath, 'runs');
  const trend = [];
  if (fs.existsSync(runsDir)) {
    const runDirs = safeReadDir(runsDir)
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
      .slice(-10); // last 10 runs

    for (const runDir of runDirs) {
      const runAiPath = path.join(runsDir, runDir, 'ai.json');
      if (!fs.existsSync(runAiPath)) continue;
      try {
        const runData = JSON.parse(fs.readFileSync(runAiPath, 'utf8'));
        const s = runData.summary || {};
        if (typeof s.total === 'number' && s.total > 0) {
          trend.push({
            run: runDir,
            timestamp: runData.timestamp || null,
            passRate: Math.round((s.passed / s.total) * 100),
            passed: s.passed,
            failed: s.failed,
            total: s.total
          });
        }
      } catch (_err) {
        // skip unreadable runs
      }
    }
  }

  const avgPassRate = trend.length
    ? Math.round(trend.reduce((acc, r) => acc + r.passRate, 0) / trend.length)
    : null;

  return {
    artifactsPath,
    summary: ai.summary || null,
    suite: ai.suite || null,
    timestamp: ai.timestamp || null,
    firstFailedTest: (ai.tests || []).find((t) => t.status === 'fail') || null,
    humanPreview: human,
    trend: { runsAnalyzed: trend.length, avgPassRate, history: trend }
  };
}

function diffExecutionPlans(args) {
  const baselinePath = normalizeFsPath(args.baselinePath);
  const revisedPath  = normalizeFsPath(args.revisedPath);

  if (!fs.existsSync(baselinePath)) throw new Error(`Baseline not found: ${baselinePath}`);
  if (!fs.existsSync(revisedPath))  throw new Error(`Revised not found: ${revisedPath}`);

  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const revised  = JSON.parse(fs.readFileSync(revisedPath,  'utf8'));

  const baseSteps = Object.fromEntries((baseline.steps || []).map((s) => [s.id, s]));
  const revSteps  = Object.fromEntries((revised.steps  || []).map((s) => [s.id, s]));

  const added    = Object.keys(revSteps).filter((id) => !baseSteps[id]).map((id) => revSteps[id]);
  const removed  = Object.keys(baseSteps).filter((id) => !revSteps[id]).map((id) => baseSteps[id]);
  const changed  = [];

  for (const id of Object.keys(baseSteps)) {
    if (!revSteps[id]) continue;
    const b = baseSteps[id];
    const r = revSteps[id];
    const diffs = {};
    for (const key of new Set([...Object.keys(b), ...Object.keys(r)])) {
      if (JSON.stringify(b[key]) !== JSON.stringify(r[key])) {
        diffs[key] = { from: b[key], to: r[key] };
      }
    }
    if (Object.keys(diffs).length > 0) {
      changed.push({ id, diffs });
    }
  }

  const policyDiffs = {};
  const bp = baseline.policy || {};
  const rp = revised.policy  || {};
  for (const key of new Set([...Object.keys(bp), ...Object.keys(rp)])) {
    if (JSON.stringify(bp[key]) !== JSON.stringify(rp[key])) {
      policyDiffs[key] = { from: bp[key], to: rp[key] };
    }
  }

  const totalChanges = added.length + removed.length + changed.length + Object.keys(policyDiffs).length;

  return {
    identical: totalChanges === 0,
    totalChanges,
    baseline: { id: baseline.id, name: baseline.name, stepCount: (baseline.steps || []).length },
    revised:  { id: revised.id,  name: revised.name,  stepCount: (revised.steps  || []).length },
    diff: { added, removed, changed, policyDiffs }
  };
}

function generateTestScaffold(args) {
  const toolName   = String(args.toolName || '').trim();
  const groupLabel = String(args.groupLabel || '').trim();
  const sampleArgs = args.sampleArgs || {};

  if (!toolName)   throw new Error('toolName is required');
  if (!groupLabel) throw new Error('groupLabel is required');

  const argsJson = JSON.stringify(sampleArgs, null, 4).replace(/\n/g, '\n  ');

  const scaffold = `'use strict';

const { assert } = require('../lib/assertions');

async function run(context) {
  const resp = await context.client.callTool('${toolName}', ${argsJson});

  assert(resp.ok, '${toolName} call failed');
  assert(resp.json !== null && resp.json !== undefined, '${toolName} returned null response');

  return {
    notes: '${toolName} responded successfully',
    details: { response: resp.json },
  };
}

module.exports = { run };
`;

  let writtenPath = null;
  if (args.outputDir) {
    const dir = normalizeFsPath(path.join(args.outputDir, groupLabel));
    fs.mkdirSync(dir, { recursive: true });
    writtenPath = path.join(dir, 'test.js');
    fs.writeFileSync(writtenPath, scaffold);
  }

  return {
    toolName,
    groupLabel,
    writtenPath,
    scaffold
  };
}

async function checkServerHealth(args) {
  const serverPath = normalizeFsPath(args.serverPath);
  const timeoutMs  = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 10000;

  if (!fs.existsSync(serverPath)) {
    return { healthy: false, error: `Server file not found: ${serverPath}`, toolCount: 0, tools: [] };
  }

  const proc = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: path.dirname(serverPath),
  });

  let outputBuf = '';
  let errorBuf  = '';

  proc.stdout.on('data', (chunk) => { outputBuf += chunk.toString('utf8'); });
  proc.stderr.on('data', (chunk) => { errorBuf  += chunk.toString('utf8'); });

  function send(obj) {
    proc.stdin.write(JSON.stringify(obj) + '\n');
  }

  // Extract the first complete JSON line from the buffer
  function consumeLine() {
    const nl = outputBuf.indexOf('\n');
    if (nl === -1) return null;
    const line = outputBuf.slice(0, nl).trim();
    outputBuf = outputBuf.slice(nl + 1);
    return line ? JSON.parse(line) : null;
  }

  // Wait for a line that satisfies predicate, up to deadline
  function waitForLine(predicate, deadline) {
    return new Promise((resolve) => {
      function check() {
        const nl = outputBuf.indexOf('\n');
        if (nl !== -1) {
          const line = outputBuf.slice(0, nl).trim();
          outputBuf = outputBuf.slice(nl + 1);
          if (line) {
            let parsed;
            try { parsed = JSON.parse(line); } catch (_e) { parsed = null; }
            if (parsed && predicate(parsed)) return resolve(parsed);
          }
        }
        if (Date.now() >= deadline) return resolve(null);
        setTimeout(check, 50);
      }
      setTimeout(check, 50);
    });
  }

  const start    = Date.now();
  const deadline = start + timeoutMs;

  try {
    // Step 1: initialize
    send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'health-check', version: '1.0.0' },
      capabilities: {}
    }});

    const initResp = await waitForLine((m) => m.id === 1, deadline);
    if (!initResp) {
      return { healthy: false, error: 'No initialize response within timeout', toolCount: 0, tools: [], stderr: clip(errorBuf, 500) };
    }

    // Step 2: tools/list
    send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });

    const listResp = await waitForLine((m) => m.id === 2, deadline);
    if (!listResp) {
      return { healthy: false, error: 'No tools/list response within timeout', toolCount: 0, tools: [], stderr: clip(errorBuf, 500) };
    }

    const tools = (listResp.result && listResp.result.tools) || [];
    const toolNames = tools.map((t) => t.name);

    return {
      healthy:       true,
      serverPath,
      toolCount:     toolNames.length,
      tools:         toolNames,
      durationMs:    Date.now() - start,
      serverInfo:    (initResp.result && initResp.result.serverInfo) || null,
      stderr:        clip(errorBuf, 200) || null,
    };
  } finally {
    try { proc.kill(); } catch (_e) { /* already dead */ }
  }
}

function compareMcpServerTools(args) {
  const baselinePath = normalizeFsPath(args.baselineServerPath);
  const revisedPath  = normalizeFsPath(args.revisedServerPath);

  if (!fs.existsSync(baselinePath)) throw new Error(`Baseline not found: ${baselinePath}`);
  if (!fs.existsSync(revisedPath))  throw new Error(`Revised not found: ${revisedPath}`);

  function extractToolNames(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const names = [];
    // Match: name: 'tool_name' or name: "tool_name" inside a TOOLS-like array context
    const regex = /\bname:\s*['"]([a-z][a-z0-9_]{1,60})['"]/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      names.push(m[1]);
    }
    // Deduplicate and filter out likely non-tool names (very short or duplicated by server info)
    return [...new Set(names)].filter((n) => !['name'].includes(n));
  }

  const baselineTools = extractToolNames(baselinePath);
  const revisedTools  = extractToolNames(revisedPath);

  const baselineSet = new Set(baselineTools);
  const revisedSet  = new Set(revisedTools);

  const added   = revisedTools.filter((n) => !baselineSet.has(n));
  const removed = baselineTools.filter((n) => !revisedSet.has(n));
  const shared  = baselineTools.filter((n) => revisedSet.has(n));

  return {
    baseline: { path: baselinePath, toolCount: baselineTools.length, tools: baselineTools },
    revised:  { path: revisedPath,  toolCount: revisedTools.length,  tools: revisedTools  },
    diff: { added, removed, shared },
    summary: {
      added: added.length,
      removed: removed.length,
      shared: shared.length,
      identical: added.length === 0 && removed.length === 0
    }
  };
}

function fetchUrl(url, timeoutMs, maxBytes) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;
    const req = client.get(url, (res) => {
      let body = '';
      let received = 0;

      res.on('data', (chunk) => {
        received += chunk.length;
        if (received > maxBytes) {
          req.destroy(new Error(`Response exceeds maxBytes (${maxBytes})`));
          return;
        }
        body += chunk.toString('utf8');
      });

      res.on('end', () => {
        resolve({ statusCode: res.statusCode || 0, body });
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Timeout after ${timeoutMs}ms`));
    });

    req.on('error', reject);
  });
}

function runShellCommand(command, cwd, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';
    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) {
        child.kill('SIGTERM');
      }
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('close', (exitCode) => {
      finished = true;
      clearTimeout(timer);
      resolve({ exitCode: exitCode == null ? 1 : exitCode, stdout, stderr });
    });

    child.on('error', (error) => {
      finished = true;
      clearTimeout(timer);
      resolve({ exitCode: 1, stdout, stderr: `${stderr}\n${error.message}`.trim() });
    });
  });
}

function normalizeFsPath(p) {
  return path.resolve(String(p || '').replace(/\\/g, '/'));
}

function safeReadDir(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (_error) {
    return [];
  }
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1]).trim() : null;
}

function extractHeadings(html) {
  const headings = [];
  const regex = /<(h1|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push(decodeHtml(match[2]).replace(/\s+/g, ' ').trim());
  }
  return headings.filter(Boolean);
}

function htmlToText(html) {
  return decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));
}

function decodeHtml(text) {
  return String(text)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function toStamp(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function clip(text, limit) {
  const s = String(text || '');
  return s.length > limit ? `${s.slice(0, limit)}\n...[truncated]` : s;
}

function sendResult(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
}

// ── New tool implementations (v0.6.0) ────────────────────────────────────

function scanToolCoverage(args) {
  const serverDir = normalizeFsPath(args.serverDir);
  const serverJs  = path.join(serverDir, 'mcp-server.js');
  const testsDir  = path.join(serverDir, 'tests');

  if (!fs.existsSync(serverJs)) throw new Error(`mcp-server.js not found in: ${serverDir}`);

  const content  = fs.readFileSync(serverJs, 'utf8');
  const toolRegex = /name:\s*['"]([a-z][a-z0-9_]{1,60})['"]/g;
  const toolNames = [];
  let m;
  while ((m = toolRegex.exec(content)) !== null) {
    if (!toolNames.includes(m[1])) toolNames.push(m[1]);
  }

  const testGroups = fs.existsSync(testsDir)
    ? safeReadDir(testsDir).filter((e) => e.isDirectory()).map((e) => e.name)
    : [];

  const covered = [];
  const uncovered = [];

  for (const tool of toolNames) {
    const slug = tool.replace(/_/g, '-');
    const hasTest = testGroups.some((g) => g.includes(slug) || g.includes(tool));
    if (hasTest) covered.push(tool);
    else uncovered.push(tool);
  }

  return {
    serverDir,
    toolCount: toolNames.length,
    coveragePercent: toolNames.length ? Math.round((covered.length / toolNames.length) * 100) : 0,
    covered,
    uncovered,
    testGroups
  };
}

function estimateToolComplexity(args) {
  const serverPath = normalizeFsPath(args.serverPath);
  const topN = Number.isFinite(args.topN) ? Math.floor(args.topN) : 9999;

  if (!fs.existsSync(serverPath)) throw new Error(`Not found: ${serverPath}`);
  const content = fs.readFileSync(serverPath, 'utf8');

  function schemaDepth(obj, depth = 0) {
    if (typeof obj !== 'object' || obj === null) return depth;
    let max = depth;
    for (const v of Object.values(obj)) {
      const d = schemaDepth(v, depth + 1);
      if (d > max) max = d;
    }
    return max;
  }

  // Extract tool blocks heuristically
  const toolRegex = /\{\s*name:\s*['"]([a-z][a-z0-9_]{1,60})['"]/g;
  const tools = [];
  let match;
  while ((match = toolRegex.exec(content)) !== null) {
    const toolName = match[1];
    // Grab the next ~800 chars as the schema region
    const region = content.slice(match.index, match.index + 800);
    const propCount = (region.match(/\btype:\s*['"][a-z]+['"]/g) || []).length;
    const reqCount  = (region.match(/required:/g) || []).length;
    const depth     = region.split('{').length - 1;
    const score     = propCount * 2 + reqCount * 3 + depth;
    tools.push({ tool: toolName, score, propCount, reqCount, nestDepth: depth });
  }

  tools.sort((a, b) => b.score - a.score);
  return { serverPath, analyzed: tools.length, tools: tools.slice(0, topN) };
}

async function generateChangelogEntry(args) {
  const repoDir  = normalizeFsPath(args.repoDir);
  const version  = args.version || 'Unreleased';
  const timeoutMs = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 15000;

  const logCmd = args.sinceTag
    ? `git log ${args.sinceTag}..HEAD --oneline --no-decorate`
    : 'git log -20 --oneline --no-decorate';

  const result = await runShellCommand(logCmd, repoDir, timeoutMs);
  if (result.exitCode !== 0) throw new Error(`git log failed: ${clip(result.stderr, 300)}`);

  const lines = result.stdout.split(/\r?\n/).filter(Boolean);
  const date  = new Date().toISOString().slice(0, 10);

  const categories = { Added: [], Changed: [], Fixed: [], Other: [] };
  for (const line of lines) {
    const msg = line.replace(/^[a-f0-9]+ /, '').trim();
    if (/\badd(ed)?\b/i.test(msg))        categories.Added.push(msg);
    else if (/\bfix(ed)?\b/i.test(msg))   categories.Fixed.push(msg);
    else if (/\bupdate|change|refactor/i.test(msg)) categories.Changed.push(msg);
    else                                   categories.Other.push(msg);
  }

  let entry = `## [${version}] — ${date}\n\n`;
  for (const [cat, items] of Object.entries(categories)) {
    if (items.length) {
      entry += `### ${cat}\n${items.map((i) => `- ${i}`).join('\n')}\n\n`;
    }
  }

  return { version, date, commitCount: lines.length, entry: entry.trim(), categories };
}

async function codeQualityGate(args) {
  const files     = (args.files || []).map(normalizeFsPath);
  const timeoutMs = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 15000;

  const results = [];
  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
      results.push({ file: filePath, exists: false, syntaxOk: false, lineCount: 0, score: 0 });
      continue;
    }
    const content   = fs.readFileSync(filePath, 'utf8');
    const lineCount = content.split('\n').length;
    const result    = await runShellCommand(`node --check "${filePath}"`, path.dirname(filePath), timeoutMs);
    const syntaxOk  = result.exitCode === 0;
    const score     = syntaxOk ? Math.max(0, Math.min(100, Math.round(100 - Math.max(0, lineCount - 500) / 50))) : 0;
    results.push({
      file: filePath,
      exists: true,
      syntaxOk,
      lineCount,
      score,
      error: syntaxOk ? null : clip(result.stderr, 500)
    });
  }

  const allPassed = results.every((r) => r.syntaxOk);
  const avgScore  = results.length ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0;

  return { allPassed, avgScore, results };
}

async function dependencyAudit(args) {
  const projectDir = normalizeFsPath(args.projectDir);
  const timeoutMs  = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 45000;

  if (!fs.existsSync(path.join(projectDir, 'package.json'))) {
    throw new Error(`No package.json found in: ${projectDir}`);
  }

  const result = await runShellCommand('npm outdated --json', projectDir, timeoutMs);
  // npm outdated exits with 1 if any packages are outdated — that's normal
  let outdated = {};
  try {
    outdated = JSON.parse(result.stdout || '{}');
  } catch (_e) {
    outdated = {};
  }

  const packages = Object.entries(outdated).map(([name, info]) => ({
    name,
    current: info.current || null,
    wanted:  info.wanted  || null,
    latest:  info.latest  || null,
    type:    info.type    || 'dependencies'
  }));

  return {
    projectDir,
    outdatedCount: packages.length,
    clean: packages.length === 0,
    packages
  };
}

function serverCapabilityMatrix(args) {
  const serverDirs = (args.serverDirs || []).map(normalizeFsPath);
  const matrix     = [];

  for (const dir of serverDirs) {
    const serverJs = path.join(dir, 'mcp-server.js');
    const pkgJson  = path.join(dir, 'package.json');

    let version   = null;
    let toolCount = 0;
    let toolNames = [];
    let hasPrompts = false;
    let hasHttp    = false;

    if (fs.existsSync(pkgJson)) {
      try { version = JSON.parse(fs.readFileSync(pkgJson, 'utf8')).version || null; } catch (_e) { /* skip */ }
    }

    if (fs.existsSync(serverJs)) {
      const content = fs.readFileSync(serverJs, 'utf8');
      const regex = /name:\s*['"]([a-z][a-z0-9_]{1,60})['"]/g;
      let m;
      while ((m = regex.exec(content)) !== null) {
        if (!toolNames.includes(m[1])) toolNames.push(m[1]);
      }
      toolCount  = toolNames.length;
      hasPrompts = content.includes('PROMPTS') || content.includes("'prompts/list'");
      hasHttp    = content.includes('http.createServer') || content.includes('createServer');
    }

    matrix.push({
      name: path.basename(dir),
      path: dir,
      version,
      toolCount,
      hasPrompts,
      hasHttp,
      toolNames
    });
  }

  matrix.sort((a, b) => b.toolCount - a.toolCount);
  const totalTools     = matrix.reduce((s, r) => s + r.toolCount, 0);
  const withHttp       = matrix.filter((r) => r.hasHttp).length;
  const withPrompts    = matrix.filter((r) => r.hasPrompts).length;

  return { serverCount: matrix.length, totalTools, withHttp, withPrompts, matrix };
}

function roadmapTracker(args) {
  const roadmapPath = normalizeFsPath(args.roadmapPath);

  if (args.action === 'read') {
    if (!fs.existsSync(roadmapPath)) throw new Error(`Roadmap not found: ${roadmapPath}`);
    const data = JSON.parse(fs.readFileSync(roadmapPath, 'utf8'));
    const phases = data.phases || [];
    const totalTasks  = phases.reduce((s, p) => s + (p.tasks || []).length, 0);
    const doneTasks   = phases.reduce((s, p) => s + (p.tasks || []).filter((t) => t.status === 'done').length, 0);
    return { action: 'read', roadmapPath, roadmap: data, totalTasks, doneTasks, completionPercent: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0 };
  }

  if (args.action === 'write') {
    if (!args.roadmap) throw new Error('roadmap object required for write action');
    fs.mkdirSync(path.dirname(roadmapPath), { recursive: true });
    fs.writeFileSync(roadmapPath, JSON.stringify(args.roadmap, null, 2));
    return { action: 'write', roadmapPath, written: true };
  }

  if (args.action === 'update_task') {
    if (!args.phaseId || !args.taskId || !args.status) throw new Error('phaseId, taskId, and status required for update_task');
    if (!fs.existsSync(roadmapPath)) throw new Error(`Roadmap not found: ${roadmapPath}`);
    const data = JSON.parse(fs.readFileSync(roadmapPath, 'utf8'));
    const phase = (data.phases || []).find((p) => p.id === args.phaseId);
    if (!phase) throw new Error(`Phase not found: ${args.phaseId}`);
    const task = (phase.tasks || []).find((t) => t.id === args.taskId);
    if (!task) throw new Error(`Task not found: ${args.taskId} in phase ${args.phaseId}`);
    const oldStatus = task.status;
    task.status = args.status;
    fs.writeFileSync(roadmapPath, JSON.stringify(data, null, 2));
    return { action: 'update_task', phaseId: args.phaseId, taskId: args.taskId, oldStatus, newStatus: args.status };
  }

  throw new Error(`Unknown action: ${args.action}`);
}

async function writeReleaseNotes(args) {
  const repoDir   = normalizeFsPath(args.repoDir);
  const version   = args.version || 'Unreleased';
  const toRef     = args.toRef   || 'HEAD';
  const timeoutMs = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 15000;

  const logCmd = args.fromRef
    ? `git log ${args.fromRef}..${toRef} --pretty=format:"%h %s" --no-decorate`
    : `git log -30 ${toRef} --pretty=format:"%h %s" --no-decorate`;

  const result = await runShellCommand(logCmd, repoDir, timeoutMs);
  if (result.exitCode !== 0) throw new Error(`git log failed: ${clip(result.stderr, 300)}`);

  const commits = result.stdout.split(/\r?\n/).filter(Boolean);
  const date    = new Date().toISOString().slice(0, 10);

  let notes = `# Release Notes — ${version} (${date})\n\n`;
  notes += `## Changes (${commits.length} commits)\n\n`;
  for (const c of commits) {
    notes += `- ${c}\n`;
  }

  if (args.outputPath) {
    const outPath = normalizeFsPath(args.outputPath);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, notes);
    return { version, date, commitCount: commits.length, outputPath: outPath, notes };
  }

  return { version, date, commitCount: commits.length, outputPath: null, notes };
}

function agentTaskPlanner(args) {
  const task     = String(args.task || '').trim();
  const context  = String(args.context || '').trim();
  const maxSteps = Number.isFinite(args.maxSteps) ? Math.floor(args.maxSteps) : 10;

  if (!task) throw new Error('task is required');

  // Heuristic decomposition using keyword patterns
  const keywords = task.toLowerCase();
  const steps = [];

  const patterns = [
    { trigger: /audit|scan|analyze|inspect/, title: 'Audit and inventory current state', complexity: 'low' },
    { trigger: /test|verify|validate|check/, title: 'Run validation and test suite', complexity: 'medium' },
    { trigger: /add|create|build|implement/, title: 'Implement core functionality', complexity: 'high' },
    { trigger: /update|upgrade|refactor|improve/, title: 'Apply targeted improvements', complexity: 'medium' },
    { trigger: /deploy|release|publish|ship/, title: 'Prepare and execute release', complexity: 'medium' },
    { trigger: /doc|readme|changelog|notes/, title: 'Write documentation and release notes', complexity: 'low' },
    { trigger: /fix|debug|resolve|patch/, title: 'Diagnose and fix identified issues', complexity: 'high' },
    { trigger: /perf|optim|benchmark|speed/, title: 'Profile and optimize performance', complexity: 'high' },
    { trigger: /clean|remove|delete|prune/, title: 'Clean up and remove obsolete items', complexity: 'low' },
  ];

  const used = new Set();
  for (const p of patterns) {
    if (p.trigger.test(keywords) && !used.has(p.title) && steps.length < maxSteps) {
      steps.push({ id: `step-${steps.length + 1}`, title: p.title, complexity: p.complexity, status: 'pending' });
      used.add(p.title);
    }
  }

  // Always add a final review step
  if (steps.length < maxSteps) {
    steps.push({ id: `step-${steps.length + 1}`, title: 'Review results and confirm completion', complexity: 'low', status: 'pending' });
  }

  const plan = {
    id: `plan-${toStamp(new Date())}`,
    task,
    context: context || null,
    createdAt: new Date().toISOString(),
    stepCount: steps.length,
    steps
  };

  if (args.outputPath) {
    const outPath = normalizeFsPath(args.outputPath);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(plan, null, 2));
    plan.outputPath = outPath;
  }

  return plan;
}

function executionHistorySummary(args) {
  const runsDir = normalizeFsPath(args.runsDir);
  const lastN   = Number.isFinite(args.lastN) ? Math.floor(args.lastN) : 20;

  if (!fs.existsSync(runsDir)) throw new Error(`Runs directory not found: ${runsDir}`);

  const runDirs = safeReadDir(runsDir)
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
    .slice(-lastN);

  const runs = [];
  for (const dir of runDirs) {
    // Try both naming conventions: ai.json and results.json
    const candidates = ['ai.json', 'results.json', 'latest_ai.json'];
    let data = null;
    for (const fname of candidates) {
      const p = path.join(runsDir, dir, fname);
      if (fs.existsSync(p)) {
        try { data = JSON.parse(fs.readFileSync(p, 'utf8')); break; } catch (_e) { /* skip */ }
      }
    }
    if (!data) continue;

    const s = data.summary || {};
    const tests = data.tests || data.results || [];
    const failedTests = tests.filter((t) => t.status === 'fail' || t.passed === false).map((t) => t.name || t.group || 'unknown');

    runs.push({
      run: dir,
      timestamp: data.timestamp || null,
      total: s.total || tests.length || 0,
      passed: s.passed || tests.filter((t) => t.status === 'pass' || t.passed === true).length,
      failed: s.failed || failedTests.length,
      durationMs: s.duration_ms || s.durationMs || null,
      failedTests
    });
  }

  const passRates  = runs.filter((r) => r.total > 0).map((r) => r.passed / r.total * 100);
  const avgPassRate = passRates.length ? Math.round(passRates.reduce((a, b) => a + b, 0) / passRates.length) : null;
  const trend = passRates.length >= 2 ? (passRates[passRates.length - 1] >= passRates[0] ? 'improving' : 'declining') : 'stable';

  const failureCounts = {};
  for (const r of runs) {
    for (const t of r.failedTests) {
      failureCounts[t] = (failureCounts[t] || 0) + 1;
    }
  }
  const topFailures = Object.entries(failureCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([test, count]) => ({ test, count }));

  return { runsDir, runsAnalyzed: runs.length, avgPassRate, trend, topFailures, runs };
}

function findMissingTests(args) {
  const serverDir = normalizeFsPath(args.serverDir);
  const serverJs  = path.join(serverDir, 'mcp-server.js');
  const testsDir  = path.join(serverDir, 'tests');

  if (!fs.existsSync(serverJs)) throw new Error(`mcp-server.js not found in: ${serverDir}`);

  const content = fs.readFileSync(serverJs, 'utf8');
  const toolRegex = /name:\s*['"]([a-z][a-z0-9_]{1,60})['"]/g;
  const toolNames = [];
  let m;
  while ((m = toolRegex.exec(content)) !== null) {
    if (!toolNames.includes(m[1])) toolNames.push(m[1]);
  }

  const testGroups = fs.existsSync(testsDir)
    ? safeReadDir(testsDir).filter((e) => e.isDirectory()).map((e) => e.name)
    : [];

  const missing = toolNames.filter((tool) => {
    const slug = tool.replace(/_/g, '-');
    return !testGroups.some((g) => g.includes(slug) || g.includes(tool));
  });

  return {
    serverDir,
    toolCount: toolNames.length,
    missingCount: missing.length,
    coveragePercent: toolNames.length ? Math.round(((toolNames.length - missing.length) / toolNames.length) * 100) : 0,
    missingTests: missing,
    testGroups
  };
}

function tagTestResults(args) {
  const logsDir  = normalizeFsPath(args.logsDir);
  const tag      = String(args.tag || '').trim();
  const outputDir = args.outputDir ? normalizeFsPath(args.outputDir) : path.join(logsDir, 'tagged');

  if (!tag) throw new Error('tag is required');

  const latestAiPath = path.join(logsDir, 'latest_ai.json');
  if (!fs.existsSync(latestAiPath)) throw new Error(`latest_ai.json not found in: ${logsDir}`);

  const data    = JSON.parse(fs.readFileSync(latestAiPath, 'utf8'));
  const stamp   = toStamp(new Date());
  const tagSlug = slugify(tag);
  const filename = `${stamp}_${tagSlug}.json`;

  const snapshot = {
    tag,
    taggedAt: new Date().toISOString(),
    source: latestAiPath,
    ...data
  };

  fs.mkdirSync(outputDir, { recursive: true });
  const outPath = path.join(outputDir, filename);
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2));

  return {
    tag,
    stamp,
    outputPath: outPath,
    summary: data.summary || null
  };
}

function generateSpecialistAgentRoster(args) {
  const domains = Array.isArray(args.domains)
    ? args.domains.map((d) => String(d || '').trim().toLowerCase()).filter(Boolean)
    : [];
  const includeStrengths = args.includeStrengths !== false;
  const maxRoles = Number.isFinite(args.maxRoles) ? Math.floor(args.maxRoles) : SPECIALIST_AGENT_CATALOG.length;

  let roles = SPECIALIST_AGENT_CATALOG.slice();
  if (domains.length) {
    const domainSet = new Set(domains);
    roles = roles.filter((r) => domainSet.has(r.domain));
  }

  roles = roles.slice(0, maxRoles).map((r) => {
    if (includeStrengths) return { ...r };
    return { id: r.id, domain: r.domain, title: r.title };
  });

  const byDomain = {};
  for (const role of roles) {
    byDomain[role.domain] = (byDomain[role.domain] || 0) + 1;
  }

  return {
    totalCatalogRoles: SPECIALIST_AGENT_CATALOG.length,
    selectedCount: roles.length,
    filters: { domains: domains.length ? domains : null, includeStrengths, maxRoles },
    byDomain,
    roles
  };
}

function planSpecialistAssignments(args) {
  const goal = String(args.goal || '').trim();
  if (!goal) throw new Error('goal is required');

  const maxAgentsPerWorkstream = Number.isFinite(args.maxAgentsPerWorkstream)
    ? Math.max(1, Math.floor(args.maxAgentsPerWorkstream))
    : 4;
  const includeCrossReview = args.includeCrossReview !== false;

  const workstreams = Array.isArray(args.workstreams) && args.workstreams.length
    ? args.workstreams.map((w) => String(w || '').trim()).filter(Boolean)
    : inferWorkstreamsFromGoal(goal);

  const pods = workstreams.map((workstream, index) => {
    const domain = classifyWorkstreamDomain(workstream);
    const rolePool = SPECIALIST_AGENT_CATALOG.filter((r) => r.domain === domain);
    const fallbackPool = SPECIALIST_AGENT_CATALOG.filter((r) => ['platform', 'quality', 'product'].includes(r.domain));
    const selected = (rolePool.length ? rolePool : fallbackPool).slice(0, maxAgentsPerWorkstream);

    const lead = selected[0] || SPECIALIST_AGENT_CATALOG[0];
    const support = selected.slice(1);
    let reviewer = null;
    if (includeCrossReview) {
      reviewer = SPECIALIST_AGENT_CATALOG.find((r) => r.domain === 'quality') || null;
      if (domain !== 'security' && !reviewer) reviewer = SPECIALIST_AGENT_CATALOG.find((r) => r.domain === 'security') || null;
    }

    return {
      podId: `pod-${index + 1}`,
      workstream,
      domain,
      lead: { id: lead.id, title: lead.title },
      support: support.map((r) => ({ id: r.id, title: r.title })),
      reviewer: reviewer ? { id: reviewer.id, title: reviewer.title } : null,
      parallelizable: domain !== 'release',
      successCriteria: suggestSuccessCriteria(domain)
    };
  });

  const utilization = {};
  for (const pod of pods) {
    const roleIds = [pod.lead.id, ...pod.support.map((s) => s.id), ...(pod.reviewer ? [pod.reviewer.id] : [])];
    for (const id of roleIds) utilization[id] = (utilization[id] || 0) + 1;
  }

  return {
    goal,
    generatedAt: new Date().toISOString(),
    podCount: pods.length,
    maxAgentsPerWorkstream,
    includeCrossReview,
    pods,
    utilization
  };
}

function buildCollaborationSchedule(args) {
  const plan = args.plan;
  if (!plan || typeof plan !== 'object') throw new Error('plan must be an object');
  const pods = Array.isArray(plan.pods) ? plan.pods : [];
  if (!pods.length) throw new Error('plan.pods must contain at least one pod');

  const sprintDays = Number.isFinite(args.sprintDays) ? Math.floor(args.sprintDays) : 14;
  const maxParallelPods = Number.isFinite(args.maxParallelPods) ? Math.floor(args.maxParallelPods) : 3;

  const waves = [];
  for (let i = 0; i < pods.length; i += maxParallelPods) {
    const slice = pods.slice(i, i + maxParallelPods);
    waves.push(slice);
  }

  const timeline = [];
  let dayCursor = 1;
  const waveSpan = Math.max(2, Math.floor(sprintDays / waves.length));

  waves.forEach((podsInWave, idx) => {
    const waveStart = dayCursor;
    const waveEnd = Math.min(sprintDays, dayCursor + waveSpan - 1);
    timeline.push({
      wave: idx + 1,
      dayStart: waveStart,
      dayEnd: waveEnd,
      pods: podsInWave.map((p) => ({
        podId: p.podId,
        workstream: p.workstream,
        lead: p.lead,
        phases: [
          { name: 'discover', dayStart: waveStart, dayEnd: Math.min(waveEnd, waveStart + 1) },
          { name: 'implement', dayStart: Math.min(waveEnd, waveStart + 2), dayEnd: Math.min(waveEnd, waveStart + Math.max(2, waveSpan - 3)) },
          { name: 'validate', dayStart: Math.min(waveEnd, waveEnd - 1), dayEnd: waveEnd }
        ]
      }))
    });
    dayCursor = waveEnd + 1;
  });

  const handoffs = [];
  for (let i = 0; i < pods.length - 1; i += 1) {
    handoffs.push({ fromPod: pods[i].podId, toPod: pods[i + 1].podId, reason: 'dependency-or-integration' });
  }

  return {
    goal: plan.goal || null,
    sprintDays,
    maxParallelPods,
    waveCount: waves.length,
    timeline,
    handoffs,
    recommendations: [
      'Run daily pod syncs with lead + reviewer from each active pod.',
      'Run cross-pod integration checks at each wave boundary.',
      'Keep one quality-focused pod active in every wave to reduce late regressions.'
    ]
  };
}

async function researchImprovementIdeas(args) {
  const urls = Array.isArray(args.urls) && args.urls.length ? args.urls : DEFAULT_RESEARCH_URLS;
  const keywords = Array.isArray(args.keywords) && args.keywords.length
    ? args.keywords.map((k) => String(k || '').trim().toLowerCase()).filter(Boolean)
    : DEFAULT_RESEARCH_KEYWORDS;
  const timeoutMs = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 12000;
  const maxBytes = Number.isFinite(args.maxBytes) ? args.maxBytes : 120000;
  const topIdeas = Number.isFinite(args.topIdeas) ? Math.floor(args.topIdeas) : 12;

  const scans = [];
  const ideas = [];
  const keywordCoverage = Object.fromEntries(keywords.map((k) => [k, 0]));

  for (const url of urls) {
    try {
      const resp = await fetchUrl(url, timeoutMs, maxBytes);
      const plain = htmlToText(resp.body);
      const summary = compressText(plain, 1400);
      const lower = summary.toLowerCase();

      let score = 0;
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          keywordCoverage[keyword] += 1;
          score += 1;
        }
      }

      scans.push({
        url,
        statusCode: resp.statusCode,
        title: extractTitle(resp.body),
        keywordScore: score
      });

      ideas.push(...extractActionableIdeas(url, summary, keywords));
    } catch (error) {
      scans.push({ url, error: error.message, keywordScore: 0 });
    }
  }

  ideas.sort((a, b) => b.score - a.score);
  const selectedIdeas = ideas.slice(0, topIdeas).map((idea, index) => ({ rank: index + 1, ...idea }));

  return {
    scanned: scans.length,
    scannedAt: new Date().toISOString(),
    keywords,
    keywordCoverage,
    scans,
    ideas: selectedIdeas,
    recommendations: selectedIdeas.slice(0, 5).map((idea) => idea.action)
  };
}

function recordResearchPulse(args) {
  const pulse = args.pulse;
  if (!pulse || typeof pulse !== 'object') throw new Error('pulse must be an object');

  const outputDir = normalizeFsPath(args.outputDir || DEFAULT_RESEARCH_DIR);
  const cadenceMinutes = Number.isFinite(args.cadenceMinutes) ? Math.floor(args.cadenceMinutes) : 10;
  const stamp = toStamp(new Date());

  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `research-pulse-${stamp}.json`);

  const payload = {
    ...pulse,
    persistedAt: new Date().toISOString(),
    cadenceMinutes,
    nextSuggestedRunAt: new Date(Date.now() + cadenceMinutes * 60 * 1000).toISOString()
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));

  return {
    outputPath,
    cadenceMinutes,
    nextSuggestedRunAt: payload.nextSuggestedRunAt,
    topIdeaCount: Array.isArray(pulse.ideas) ? pulse.ideas.length : 0
  };
}

async function runAutonomousImprovementCycle(args) {
  const goal = String(args.goal || '').trim();
  if (!goal) throw new Error('goal is required');

  const maxIdeas = Number.isFinite(args.maxIdeas) ? Math.floor(args.maxIdeas) : 5;
  const sprintDays = Number.isFinite(args.sprintDays) ? Math.floor(args.sprintDays) : 14;
  const maxParallelPods = Number.isFinite(args.maxParallelPods) ? Math.floor(args.maxParallelPods) : 3;

  const pulse = await researchImprovementIdeas({
    urls: args.urls,
    keywords: args.keywords,
    topIdeas: Math.max(maxIdeas, 8)
  });

  const topActions = pulse.ideas.slice(0, maxIdeas).map((idea) => idea.action);
  const planningText = [goal, ...topActions].join('. ');
  const plan = agentTaskPlanner({ task: planningText, context: 'autonomous-improvement-cycle', maxSteps: 12 });

  const workstreams = pulse.ideas.slice(0, maxIdeas).map((idea) => idea.title);
  const assignments = planSpecialistAssignments({
    goal,
    workstreams,
    maxAgentsPerWorkstream: 4,
    includeCrossReview: true
  });

  const schedule = buildCollaborationSchedule({
    plan: assignments,
    sprintDays,
    maxParallelPods
  });

  return {
    goal,
    generatedAt: new Date().toISOString(),
    pulseSummary: {
      scanned: pulse.scanned,
      ideas: pulse.ideas.length,
      topRecommendations: pulse.recommendations.slice(0, maxIdeas)
    },
    executionPlan: plan,
    assignments,
    schedule
  };
}

async function orchestrateContinuousImprovementLoop(args) {
  const goal = String(args.goal || '').trim();
  if (!goal) throw new Error('goal is required');

  const stateDir = normalizeFsPath(args.stateDir || DEFAULT_LOOP_STATE_DIR);
  const maxCycles = Number.isFinite(args.maxCycles) ? Math.floor(args.maxCycles) : 3;
  const cadenceMinutes = Number.isFinite(args.cadenceMinutes) ? Math.floor(args.cadenceMinutes) : 10;
  const waitForCadence = args.waitForCadence === true;

  let state = readAutonomousLoopState(stateDir);
  if (state.control === 'paused') {
    return {
      status: 'paused',
      reason: state.pauseReason || 'loop is paused',
      stateDir,
      state
    };
  }

  state.status = 'running';
  state.goal = goal;
  state.cadenceMinutes = cadenceMinutes;
  state.lastStartedAt = new Date().toISOString();
  writeAutonomousLoopState(stateDir, state);

  const cycles = [];
  for (let i = 0; i < maxCycles; i += 1) {
    state = readAutonomousLoopState(stateDir);
    if (state.control === 'paused') {
      break;
    }

    const nowMs = Date.now();
    const nextPulseMs = state.nextPulseAt ? Date.parse(state.nextPulseAt) : null;
    const shouldWait = waitForCadence && !state.triggerNow && Number.isFinite(nextPulseMs) && nextPulseMs > nowMs;
    if (shouldWait) {
      await sleep(Math.min(nextPulseMs - nowMs, 120000));
    }

    const cycleNumber = Number.isFinite(state.totalCycles) ? state.totalCycles + 1 : 1;
    const cycleStartedAt = new Date().toISOString();

    const cycleResult = await runAutonomousImprovementCycle({
      goal,
      urls: args.urls,
      keywords: args.keywords,
      maxIdeas: 5,
      sprintDays: 14,
      maxParallelPods: 3
    });

    const pulse = await researchImprovementIdeas({
      urls: args.urls,
      keywords: args.keywords,
      topIdeas: 12
    });
    const pulseSaved = recordResearchPulse({ pulse, outputDir: DEFAULT_RESEARCH_DIR, cadenceMinutes });

    const cycleSnapshot = {
      cycleNumber,
      cycleStartedAt,
      cycleCompletedAt: new Date().toISOString(),
      goal,
      result: cycleResult,
      pulseSaved
    };
    const cyclePath = writeLoopCycleSnapshot(stateDir, cycleSnapshot);

    state = readAutonomousLoopState(stateDir);
    state.status = 'running';
    state.control = state.control || 'running';
    state.totalCycles = cycleNumber;
    state.lastCyclePath = cyclePath;
    state.lastCycleCompletedAt = cycleSnapshot.cycleCompletedAt;
    state.nextPulseAt = new Date(Date.now() + cadenceMinutes * 60 * 1000).toISOString();
    state.triggerNow = false;
    writeAutonomousLoopState(stateDir, state);

    cycles.push({
      cycleNumber,
      cyclePath,
      ideas: cycleResult.pulseSummary.ideas,
      nextPulseAt: state.nextPulseAt
    });
  }

  state = readAutonomousLoopState(stateDir);
  if (state.control !== 'paused') {
    state.status = 'idle';
    writeAutonomousLoopState(stateDir, state);
  }

  return {
    status: state.control === 'paused' ? 'paused' : 'ok',
    goal,
    stateDir,
    cyclesRun: cycles.length,
    totalCycles: state.totalCycles || 0,
    nextPulseAt: state.nextPulseAt || null,
    cycles
  };
}

function getAutonomousLoopState(args) {
  const stateDir = normalizeFsPath(args.stateDir || DEFAULT_LOOP_STATE_DIR);
  const includeRecentCycles = args.includeRecentCycles !== false;
  const recentLimit = Number.isFinite(args.recentLimit) ? Math.floor(args.recentLimit) : 10;

  const state = readAutonomousLoopState(stateDir);
  const recentCycles = includeRecentCycles
    ? listLoopCycleSnapshots(stateDir).slice(-recentLimit)
    : [];

  return {
    stateDir,
    state,
    recentCycles,
    snapshotCount: listLoopCycleSnapshots(stateDir).length
  };
}

function setAutonomousLoopControl(args) {
  const action = String(args.action || '').trim();
  const stateDir = normalizeFsPath(args.stateDir || DEFAULT_LOOP_STATE_DIR);
  const reason = String(args.reason || '').trim() || null;

  const state = readAutonomousLoopState(stateDir);

  if (action === 'pause') {
    state.control = 'paused';
    state.pauseReason = reason || 'manual pause';
    state.status = 'paused';
  } else if (action === 'resume') {
    state.control = 'running';
    state.pauseReason = null;
    state.status = 'idle';
  } else if (action === 'trigger_now') {
    state.triggerNow = true;
    state.nextPulseAt = new Date().toISOString();
  } else {
    throw new Error(`Unknown action: ${action}`);
  }

  state.updatedAt = new Date().toISOString();
  writeAutonomousLoopState(stateDir, state);

  return {
    action,
    stateDir,
    state
  };
}

async function resumeInterruptedCycle(args) {
  const stateDir = normalizeFsPath(args.stateDir || DEFAULT_LOOP_STATE_DIR);
  const cycles = Number.isFinite(args.cycles) ? Math.floor(args.cycles) : 1;
  const state = readAutonomousLoopState(stateDir);
  const goal = String(args.goal || state.goal || '').trim();
  if (!goal) throw new Error('goal is required (either pass goal or ensure state has one)');

  setAutonomousLoopControl({ action: 'resume', stateDir, reason: 'resume_interrupted_cycle' });

  return orchestrateContinuousImprovementLoop({
    goal,
    stateDir,
    maxCycles: cycles,
    cadenceMinutes: Number.isFinite(args.cadenceMinutes) ? Math.floor(args.cadenceMinutes) : (state.cadenceMinutes || 10),
    waitForCadence: false
  });
}

function evaluateAutonomousLoopQuality(args) {
  const stateDir = normalizeFsPath(args.stateDir || DEFAULT_LOOP_STATE_DIR);
  const lastN = Number.isFinite(args.lastN) ? Math.floor(args.lastN) : 20;

  const cycles = listLoopCycleSnapshots(stateDir).slice(-lastN);
  const loaded = cycles.map((p) => {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (_err) {
      return null;
    }
  }).filter(Boolean);

  if (!loaded.length) {
    return {
      stateDir,
      cyclesAnalyzed: 0,
      qualityScore: 0,
      warnings: ['No cycle snapshots available for evaluation.']
    };
  }

  const ideasPerCycle = loaded.map((c) => safeNumber((c.result && c.result.pulseSummary && c.result.pulseSummary.ideas) || 0) || 0);
  const avgIdeasPerCycle = Math.round((ideasPerCycle.reduce((a, b) => a + b, 0) / ideasPerCycle.length) * 100) / 100;

  const intervals = [];
  for (let i = 1; i < loaded.length; i += 1) {
    const prev = Date.parse(loaded[i - 1].cycleCompletedAt || '');
    const curr = Date.parse(loaded[i].cycleCompletedAt || '');
    if (Number.isFinite(prev) && Number.isFinite(curr) && curr > prev) {
      intervals.push(Math.round((curr - prev) / 1000));
    }
  }
  const avgIntervalSec = intervals.length
    ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
    : null;

  const state = readAutonomousLoopState(stateDir);
  const warnings = [];
  if (avgIdeasPerCycle < 1) warnings.push('Very low idea generation per cycle.');
  if (state.control === 'paused') warnings.push(`Loop is paused${state.pauseReason ? `: ${state.pauseReason}` : ''}.`);
  if (intervals.length >= 2 && Math.max(...intervals) > Math.min(...intervals) * 3) warnings.push('Cycle interval variance is high.');

  const qualityScore = Math.max(0, Math.min(100,
    Math.round(
      40 +
      Math.min(30, avgIdeasPerCycle * 5) +
      (warnings.length === 0 ? 20 : Math.max(0, 20 - warnings.length * 8)) +
      (loaded.length >= 3 ? 10 : 0)
    )
  ));

  return {
    stateDir,
    cyclesAnalyzed: loaded.length,
    avgIdeasPerCycle,
    avgIntervalSec,
    qualityScore,
    warnings,
    lastCycle: loaded[loaded.length - 1]
      ? {
          cycleNumber: loaded[loaded.length - 1].cycleNumber,
          completedAt: loaded[loaded.length - 1].cycleCompletedAt
        }
      : null
  };
}

function generateSvgImage(args) {
  const width = Number.isFinite(args.width) ? Math.floor(args.width) : 1280;
  const height = Number.isFinite(args.height) ? Math.floor(args.height) : 720;
  const title = String(args.title || 'Agent Ops Visual').trim();
  const subtitle = String(args.subtitle || 'Generated by generate_svg_image').trim();
  const bgStart = String(args.bgStart || '#0f172a').trim();
  const bgEnd = String(args.bgEnd || '#1d4ed8').trim();

  const outputPath = normalizeFsPath(args.outputPath || path.join(__dirname, 'artifacts', 'images', `image-${toStamp(new Date())}.svg`));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${safeTitle}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bgStart}" />
      <stop offset="100%" stop-color="${bgEnd}" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity="0.35" />
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  <rect x="${Math.floor(width * 0.07)}" y="${Math.floor(height * 0.2)}" width="${Math.floor(width * 0.86)}" height="${Math.floor(height * 0.56)}" rx="28" fill="#ffffff" fill-opacity="0.12" filter="url(#shadow)" />
  <text x="50%" y="46%" text-anchor="middle" fill="#f8fafc" font-size="${Math.max(28, Math.floor(width / 20))}" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${safeTitle}</text>
  <text x="50%" y="56%" text-anchor="middle" fill="#cbd5e1" font-size="${Math.max(14, Math.floor(width / 48))}" font-family="Segoe UI, Arial, sans-serif">${safeSubtitle}</text>
</svg>`;

  fs.writeFileSync(outputPath, svg, 'utf8');
  const bytes = Buffer.byteLength(svg, 'utf8');

  return { created: true, outputPath, width, height, bytes };
}

function analyzeImageFile(args) {
  const filePath = normalizeFsPath(args.filePath);
  if (!fs.existsSync(filePath)) throw new Error(`Image file not found: ${filePath}`);

  const stat = fs.statSync(filePath);
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const hash = sha256(buf);

  let format = 'unknown';
  let width = null;
  let height = null;

  if (ext === '.svg' || isLikelySvg(buf)) {
    format = 'svg';
    const txt = buf.toString('utf8');
    const parsed = parseSvgDimensions(txt);
    width = parsed.width;
    height = parsed.height;
  } else if (buf.length >= 24 && buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
    format = 'png';
    width = buf.readUInt32BE(16);
    height = buf.readUInt32BE(20);
  } else if (buf.length >= 10 && (buf.slice(0, 6).toString('ascii') === 'GIF89a' || buf.slice(0, 6).toString('ascii') === 'GIF87a')) {
    format = 'gif';
    width = buf.readUInt16LE(6);
    height = buf.readUInt16LE(8);
  } else if (buf.length >= 30 && buf.slice(0, 2).toString('ascii') === 'BM') {
    format = 'bmp';
    width = buf.readInt32LE(18);
    height = Math.abs(buf.readInt32LE(22));
  } else if (isJpeg(buf)) {
    format = 'jpeg';
    const dim = parseJpegDimensions(buf);
    width = dim.width;
    height = dim.height;
  } else if (isWebp(buf)) {
    format = 'webp';
    const dim = parseWebpDimensions(buf);
    width = dim.width;
    height = dim.height;
  }

  return {
    filePath,
    format,
    width,
    height,
    sizeBytes: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    sha256: hash
  };
}

async function analyzeVideoFile(args) {
  const filePath = normalizeFsPath(args.filePath);
  if (!fs.existsSync(filePath)) throw new Error(`Video file not found: ${filePath}`);

  const timeoutMs = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 20000;
  const stat = fs.statSync(filePath);

  const probeCheck = await runShellCommand('ffprobe -version', process.cwd(), Math.min(5000, timeoutMs));
  const ffprobeAvailable = probeCheck.exitCode === 0;

  if (!ffprobeAvailable) {
    return {
      filePath,
      analysisMode: 'fallback',
      ffprobeAvailable: false,
      extension: path.extname(filePath).toLowerCase(),
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      note: 'ffprobe not found in PATH; install ffmpeg/ffprobe for deep metadata.'
    };
  }

  const probeCmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
  const probe = await runShellCommand(probeCmd, process.cwd(), timeoutMs);
  if (probe.exitCode !== 0) {
    return {
      filePath,
      analysisMode: 'ffprobe_error',
      ffprobeAvailable: true,
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      error: clip(probe.stderr, 400)
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(probe.stdout || '{}');
  } catch (_err) {
    parsed = {};
  }

  const streams = Array.isArray(parsed.streams) ? parsed.streams : [];
  const videoStream = streams.find((s) => s.codec_type === 'video') || null;
  const audioStreams = streams.filter((s) => s.codec_type === 'audio');
  const format = parsed.format || {};

  return {
    filePath,
    analysisMode: 'ffprobe',
    ffprobeAvailable: true,
    sizeBytes: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    durationSec: safeNumber(format.duration),
    bitrate: safeNumber(format.bit_rate),
    container: format.format_name || null,
    video: videoStream
      ? {
          codec: videoStream.codec_name || null,
          width: videoStream.width || null,
          height: videoStream.height || null,
          fps: normalizeFps(videoStream.avg_frame_rate || videoStream.r_frame_rate || null)
        }
      : null,
    audioTrackCount: audioStreams.length
  };
}

async function discoverMcpDocsIndex(args) {
  const indexUrl = String(args.indexUrl || 'https://modelcontextprotocol.io/llms.txt').trim();
  const timeoutMs = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 15000;
  const maxBytes = Number.isFinite(args.maxBytes) ? args.maxBytes : 200000;
  const maxUrls = Number.isFinite(args.maxUrls) ? Math.floor(args.maxUrls) : 200;

  const resp = await fetchUrl(indexUrl, timeoutMs, maxBytes);
  const body = String(resp.body || '');
  const lines = body.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const urlSet = new Set();
  const urlRegex = /(https?:\/\/[^\s)]+)(?:\)|\s|$)/gi;
  for (const line of lines) {
    let m;
    while ((m = urlRegex.exec(line)) !== null) {
      const url = m[1].replace(/[>,.;]+$/, '');
      urlSet.add(url);
      if (urlSet.size >= maxUrls) break;
    }
    if (urlSet.size >= maxUrls) break;
  }

  const urls = [...urlSet];
  const groups = {
    gettingStarted: urls.filter((u) => /getting-started|intro/i.test(u)),
    architecture: urls.filter((u) => /architecture|learn/i.test(u)),
    specification: urls.filter((u) => /spec|protocol/i.test(u)),
    examples: urls.filter((u) => /example|tutorial/i.test(u)),
    other: urls.filter((u) => !/getting-started|intro|architecture|learn|spec|protocol|example|tutorial/i.test(u))
  };

  return {
    indexUrl,
    statusCode: resp.statusCode,
    discoveredUrlCount: urls.length,
    groups,
    urls
  };
}

function draftSkillPackManifest(args) {
  const goal = String(args.goal || '').trim();
  if (!goal) throw new Error('goal is required');

  const includeRoles = Array.isArray(args.includeRoles)
    ? args.includeRoles.map((r) => String(r || '').trim()).filter(Boolean)
    : [];
  const basePath = String(args.basePath || '.github/skills').trim();
  const maxSkills = Number.isFinite(args.maxSkills) ? Math.floor(args.maxSkills) : 20;

  const selected = includeRoles.length
    ? SPECIALIST_AGENT_CATALOG.filter((r) => includeRoles.includes(r.id))
    : SPECIALIST_AGENT_CATALOG.slice();

  const roles = selected.slice(0, maxSkills);
  const skills = roles.map((role) => ({
    roleId: role.id,
    roleTitle: role.title,
    domain: role.domain,
    skillPath: `${basePath}/${role.id}`,
    files: [
      `${basePath}/${role.id}/SKILL.md`,
      `${basePath}/${role.id}/prompts/${role.id}.prompt.md`
    ],
    contract: {
      inputs: ['task', 'constraints', 'context'],
      outputs: ['plan', 'changes', 'validation'],
      qualityGate: 'must include verification evidence before complete'
    },
    strengths: role.strengths
  }));

  const manifest = {
    generatedAt: new Date().toISOString(),
    goal,
    basePath,
    skillCount: skills.length,
    skills,
    operatingRules: [
      'Every skill execution must produce a validation summary.',
      'Cross-domain changes require at least one reviewer skill from quality or security domain.',
      'Long-running autonomous loops must checkpoint progress artifacts each cycle.'
    ]
  };

  return manifest;
}

function readAutonomousLoopState(stateDir) {
  const filePath = path.join(stateDir, 'autonomous-loop-state.json');
  if (!fs.existsSync(filePath)) {
    return {
      status: 'idle',
      control: 'running',
      totalCycles: 0,
      triggerNow: false,
      nextPulseAt: null,
      pauseReason: null,
      updatedAt: new Date().toISOString()
    };
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_err) {
    return {
      status: 'idle',
      control: 'running',
      totalCycles: 0,
      triggerNow: false,
      nextPulseAt: null,
      pauseReason: 'state-parse-failure-recovered',
      updatedAt: new Date().toISOString()
    };
  }
}

function writeAutonomousLoopState(stateDir, state) {
  fs.mkdirSync(stateDir, { recursive: true });
  const filePath = path.join(stateDir, 'autonomous-loop-state.json');
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
  return filePath;
}

function writeLoopCycleSnapshot(stateDir, snapshot) {
  const cyclesDir = path.join(stateDir, 'cycles');
  fs.mkdirSync(cyclesDir, { recursive: true });
  const filePath = path.join(cyclesDir, `cycle-${String(snapshot.cycleNumber).padStart(4, '0')}-${toStamp(new Date())}.json`);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
  return filePath;
}

function listLoopCycleSnapshots(stateDir) {
  const cyclesDir = path.join(stateDir, 'cycles');
  if (!fs.existsSync(cyclesDir)) return [];
  return safeReadDir(cyclesDir)
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => path.join(cyclesDir, e.name))
    .sort();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function inferWorkstreamsFromGoal(goal) {
  const lower = String(goal || '').toLowerCase();
  const streams = [];
  streams.push('requirements and scope definition');

  if (/ux|ui|design|frontend|responsive|mobile/.test(lower)) streams.push('ux and frontend implementation');
  if (/backend|api|service|database|schema/.test(lower)) streams.push('backend and data architecture');
  if (/security|auth|oauth|oidc|token|permission/.test(lower)) streams.push('security and identity hardening');
  if (/bug|test|quality|qa|regression/.test(lower)) streams.push('quality engineering and bug fixing');
  if (/perf|performance|latency|memory|speed/.test(lower)) streams.push('performance profiling and optimization');
  if (/docs|documentation|readme|guide/.test(lower)) streams.push('documentation and developer onboarding');

  streams.push('release planning and rollout');
  return [...new Set(streams)];
}

function classifyWorkstreamDomain(workstream) {
  const lower = String(workstream || '').toLowerCase();
  if (/ux|ui|design|visual|mobile|responsive/.test(lower)) return 'ux';
  if (/front|browser|client/.test(lower)) return 'frontend';
  if (/backend|api|service|distributed/.test(lower)) return 'backend';
  if (/data|database|etl|pipeline|schema/.test(lower)) return 'data';
  if (/security|auth|identity|token|threat/.test(lower)) return 'security';
  if (/test|quality|bug|regression|validate/.test(lower)) return 'quality';
  if (/prompt|mcp|llm|agent|ai/.test(lower)) return 'ai';
  if (/doc|guide|readme|reference/.test(lower)) return 'docs';
  if (/release|deploy|ci|cd|infra|ops|monitor/.test(lower)) return 'platform';
  if (/customer|support|incident/.test(lower)) return 'operations';
  return 'product';
}

function suggestSuccessCriteria(domain) {
  const map = {
    ux: ['Validated user flow', 'Accessible interaction states', 'Responsive layout pass'],
    frontend: ['Performance budget met', 'No critical UI regressions', 'Browser compatibility pass'],
    backend: ['Contract tests passing', 'Error handling coverage', 'Throughput baseline met'],
    data: ['Schema migration validated', 'Integrity checks pass', 'Query performance acceptable'],
    security: ['Threat checks reviewed', 'Auth flows validated', 'No high-severity findings'],
    quality: ['Regression suite green', 'Critical bugs closed', 'Coverage improved'],
    ai: ['Tool contract adherence', 'Prompt quality validated', 'Agent workflow reliability improved'],
    docs: ['Docs updated for new behaviors', 'Examples tested', 'Navigation clear for AI and humans'],
    platform: ['CI gates stable', 'Deploy and rollback tested', 'Operational checks green'],
    operations: ['Incident playbooks updated', 'Escalation paths clear', 'Monitoring alerts tuned'],
    product: ['Scope aligned to outcomes', 'Milestones tracked', 'Dependencies resolved']
  };
  return map[domain] || map.product;
}

function isLikelySvg(buf) {
  const sample = buf.slice(0, 400).toString('utf8').toLowerCase();
  return sample.includes('<svg');
}

function parseSvgDimensions(text) {
  const widthMatch = text.match(/\bwidth\s*=\s*"([0-9.]+)(px)?"/i);
  const heightMatch = text.match(/\bheight\s*=\s*"([0-9.]+)(px)?"/i);
  if (widthMatch && heightMatch) {
    return { width: Math.round(Number(widthMatch[1])), height: Math.round(Number(heightMatch[1])) };
  }

  const vb = text.match(/\bviewBox\s*=\s*"([0-9.\s-]+)"/i);
  if (vb) {
    const parts = vb[1].trim().split(/\s+/).map((n) => Number(n));
    if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3])) {
      return { width: Math.round(parts[2]), height: Math.round(parts[3]) };
    }
  }

  return { width: null, height: null };
}

function isJpeg(buf) {
  return buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function parseJpegDimensions(buf) {
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) break;
    const marker = buf[offset + 1];
    const len = buf.readUInt16BE(offset + 2);
    const sof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (sof && offset + 8 < buf.length) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return { width, height };
    }
    offset += 2 + len;
  }
  return { width: null, height: null };
}

function isWebp(buf) {
  return buf.length >= 16 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP';
}

function parseWebpDimensions(buf) {
  const fourCC = buf.slice(12, 16).toString('ascii');
  if (fourCC === 'VP8X' && buf.length >= 30) {
    const w = 1 + buf.readUIntLE(24, 3);
    const h = 1 + buf.readUIntLE(27, 3);
    return { width: w, height: h };
  }
  return { width: null, height: null };
}

function sha256(buf) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeFps(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const parts = raw.split('/').map((n) => Number(n));
  if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1]) && parts[1] !== 0) {
    return Math.round((parts[0] / parts[1]) * 1000) / 1000;
  }
  return safeNumber(raw);
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function compressText(text, maxChars) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, maxChars);
}

function extractActionableIdeas(sourceUrl, text, keywords) {
  const t = String(text || '');
  const lowered = t.toLowerCase();
  const out = [];

  const patterns = [
    {
      id: 'parallel-execution-wave',
      title: 'Increase parallel execution wave capacity',
      action: 'Add wave-aware scheduling and dynamic parallelism limits for multi-agent pods.',
      trigger: /parallel|concurrent|queue|throughput/
    },
    {
      id: 'contract-first-tooling',
      title: 'Strengthen contract-first tool schemas',
      action: 'Add stricter input/output schema checks and auto-generated contract tests for new tools.',
      trigger: /schema|contract|validation|json-rpc/
    },
    {
      id: 'continuous-evals-loop',
      title: 'Expand continuous eval loop',
      action: 'Run periodic eval suites after each improvement pulse and store trend snapshots.',
      trigger: /evaluation|eval|benchmark|quality/
    },
    {
      id: 'agent-role-routing',
      title: 'Improve specialist role routing',
      action: 'Route tasks to specialist pods by domain confidence and track assignment outcomes.',
      trigger: /agent|role|orchestration|workflow/
    },
    {
      id: 'security-guardrails',
      title: 'Add stronger security guardrails',
      action: 'Embed permission/risk classification checks before executing open-world or destructive tasks.',
      trigger: /security|permission|risk|policy/
    }
  ];

  let keywordBoost = 0;
  for (const k of keywords) {
    if (lowered.includes(k)) keywordBoost += 1;
  }

  for (const p of patterns) {
    if (p.trigger.test(lowered)) {
      out.push({
        id: p.id,
        sourceUrl,
        title: p.title,
        action: p.action,
        score: 5 + keywordBoost
      });
    }
  }

  return out;
}

function validateJsonSchema(args) {
  const schema = args.schema;
  const data   = args.data;

  if (!schema || typeof schema !== 'object') throw new Error('schema must be an object');

  const errors = [];

  function validate(schemaNode, value, path) {
    const p = path || 'root';

    if (schemaNode.type) {
      const types = Array.isArray(schemaNode.type) ? schemaNode.type : [schemaNode.type];
      const actualType = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
      if (!types.includes(actualType)) {
        errors.push({ path: p, message: `Expected type ${types.join('|')}, got ${actualType}` });
        return;
      }
    }

    if (schemaNode.required && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const req of schemaNode.required) {
        if (!(req in value)) {
          errors.push({ path: `${p}.${req}`, message: `Required property missing: ${req}` });
        }
      }
    }

    if (schemaNode.properties && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const [key, subSchema] of Object.entries(schemaNode.properties)) {
        if (key in value) {
          validate(subSchema, value[key], `${p}.${key}`);
        }
      }

      if (schemaNode.additionalProperties === false) {
        const extra = Object.keys(value).filter((k) => !(k in (schemaNode.properties || {})));
        for (const k of extra) {
          errors.push({ path: `${p}.${k}`, message: `Additional property not allowed: ${k}` });
        }
      }
    }

    if (schemaNode.minimum !== undefined && typeof value === 'number' && value < schemaNode.minimum) {
      errors.push({ path: p, message: `Value ${value} is below minimum ${schemaNode.minimum}` });
    }

    if (schemaNode.maximum !== undefined && typeof value === 'number' && value > schemaNode.maximum) {
      errors.push({ path: p, message: `Value ${value} exceeds maximum ${schemaNode.maximum}` });
    }

    if (schemaNode.minLength !== undefined && typeof value === 'string' && value.length < schemaNode.minLength) {
      errors.push({ path: p, message: `String length ${value.length} below minLength ${schemaNode.minLength}` });
    }

    if (schemaNode.enum && !schemaNode.enum.includes(value)) {
      errors.push({ path: p, message: `Value not in enum: ${JSON.stringify(value)}` });
    }
  }

  validate(schema, data, 'root');

  return {
    valid: errors.length === 0,
    errorCount: errors.length,
    errors
  };
}

async function driftDetectionCheck(args) {
  const repoPath = normalizeFsPath(args.repoPath);
  const checkRemote = args.checkRemote !== false;
  const checkDeps   = args.checkDeps   !== false;

  if (!fs.existsSync(path.join(repoPath, '.git'))) {
    throw new Error(`Not a git repository: ${repoPath}`);
  }

  const findings = [];

  // 1. Uncommitted changes
  const statusResult = await runShellCommand('git status --porcelain', repoPath, 15000);
  const statusLines = (statusResult.stdout || '').trim().split('\n').filter(Boolean);
  const dirty = statusLines.length > 0;
  if (dirty) {
    const modified  = statusLines.filter((l) => l.match(/^.M|^M/)).length;
    const untracked = statusLines.filter((l) => l.startsWith('??')).length;
    const staged    = statusLines.filter((l) => l.match(/^[MADRCU]/)).length;
    findings.push({
      severity: 'warning',
      category: 'uncommitted_changes',
      detail: `${statusLines.length} dirty files (${staged} staged, ${modified} modified, ${untracked} untracked)`,
      files: statusLines.slice(0, 20).map((l) => l.trim())
    });
  }

  // 2. Remote divergence
  if (checkRemote) {
    const branchResult = await runShellCommand('git rev-parse --abbrev-ref HEAD', repoPath, 10000);
    const branch = (branchResult.stdout || '').trim();
    const revListResult = await runShellCommand(
      `git rev-list --left-right --count HEAD...origin/${branch}`,
      repoPath, 15000
    );
    if (revListResult.exitCode === 0) {
      const parts = (revListResult.stdout || '').trim().split(/\s+/);
      const ahead  = parseInt(parts[0], 10) || 0;
      const behind = parseInt(parts[1], 10) || 0;
      if (ahead > 0) {
        findings.push({
          severity: 'info',
          category: 'ahead_of_remote',
          detail: `${ahead} local commits not yet pushed to origin/${branch}`
        });
      }
      if (behind > 0) {
        findings.push({
          severity: 'warning',
          category: 'behind_remote',
          detail: `${behind} remote commits not yet pulled from origin/${branch}`
        });
      }
    }
  }

  // 3. Stale dependencies
  if (checkDeps) {
    const pkgPath  = path.join(repoPath, 'package.json');
    const lockPath = path.join(repoPath, 'package-lock.json');
    const nmPath   = path.join(repoPath, 'node_modules');
    if (fs.existsSync(pkgPath) && fs.existsSync(lockPath) && fs.existsSync(nmPath)) {
      const pkgMtime  = fs.statSync(pkgPath).mtimeMs;
      const lockMtime = fs.statSync(lockPath).mtimeMs;
      const nmMtime   = fs.statSync(nmPath).mtimeMs;
      if (pkgMtime > nmMtime || lockMtime > nmMtime) {
        findings.push({
          severity: 'warning',
          category: 'stale_node_modules',
          detail: 'package.json or package-lock.json is newer than node_modules — may need npm install'
        });
      }
    }
  }

  const severity = findings.some((f) => f.severity === 'warning')
    ? 'warning'
    : findings.length > 0 ? 'info' : 'clean';

  return {
    repoPath,
    severity,
    driftDetected: findings.length > 0,
    findingCount: findings.length,
    findings
  };
}

async function multiRepoSyncStatus(args) {
  const rootPath  = normalizeFsPath(args.rootPath || DEFAULT_MCP_ROOT);
  const maxRepos  = Math.min(args.maxRepos || 20, 50);
  const fetchFirst = args.fetchFirst === true;

  if (!fs.existsSync(rootPath)) throw new Error(`Root path not found: ${rootPath}`);

  const entries = fs.readdirSync(rootPath, { withFileTypes: true });
  const repoDirs = entries
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(rootPath, e.name, '.git')))
    .map((e) => path.join(rootPath, e.name))
    .slice(0, maxRepos);

  if (repoDirs.length === 0) {
    return { rootPath, repos: [], summary: 'No git repos found under root path.' };
  }

  const results = await Promise.all(repoDirs.map(async (repoPath) => {
    const name = path.basename(repoPath);
    try {
      if (fetchFirst) {
        await runShellCommand('git fetch --all --quiet', repoPath, 20000);
      }
      const [statusRes, branchRes, logRes] = await Promise.all([
        runShellCommand('git status --porcelain', repoPath, 10000),
        runShellCommand('git rev-parse --abbrev-ref HEAD', repoPath, 5000),
        runShellCommand('git log -1 --format="%h %s" HEAD', repoPath, 5000)
      ]);
      const branch      = (branchRes.stdout || '').trim();
      const dirty       = (statusRes.stdout || '').trim().split('\n').filter(Boolean).length;
      const lastCommit  = (logRes.stdout || '').trim();

      const revRes = await runShellCommand(
        `git rev-list --left-right --count HEAD...origin/${branch}`,
        repoPath, 10000
      );
      let ahead = 0, behind = 0;
      if (revRes.exitCode === 0) {
        const parts = (revRes.stdout || '').trim().split(/\s+/);
        ahead  = parseInt(parts[0], 10) || 0;
        behind = parseInt(parts[1], 10) || 0;
      }

      const state = dirty > 0 ? 'dirty' : ahead > 0 ? 'ahead' : behind > 0 ? 'behind' : 'clean';
      return { name, branch, state, dirty, ahead, behind, lastCommit };
    } catch (err) {
      return { name, branch: '?', state: 'error', dirty: 0, ahead: 0, behind: 0, lastCommit: '', error: err.message };
    }
  }));

  const summary = {
    total: results.length,
    clean:  results.filter((r) => r.state === 'clean').length,
    dirty:  results.filter((r) => r.state === 'dirty').length,
    ahead:  results.filter((r) => r.state === 'ahead').length,
    behind: results.filter((r) => r.state === 'behind').length,
    errors: results.filter((r) => r.state === 'error').length
  };

  return { rootPath, repos: results, summary };
}

async function generateChangelog(args) {
  const repoPath   = normalizeFsPath(args.repoPath);
  const toRef      = args.toRef    || 'HEAD';
  const maxCommits = Math.min(args.maxCommits || 100, 500);

  if (!fs.existsSync(path.join(repoPath, '.git'))) {
    throw new Error(`Not a git repository: ${repoPath}`);
  }

  // Determine fromRef
  let fromRef = args.fromRef;
  if (!fromRef) {
    const tagRes = await runShellCommand('git describe --tags --abbrev=0 HEAD^', repoPath, 10000);
    fromRef = (tagRes.exitCode === 0 && tagRes.stdout.trim()) ? tagRes.stdout.trim() : null;
  }

  const range = fromRef ? `${fromRef}..${toRef}` : toRef;
  const logCmd = `git log ${range} --format="%H|%s|%an|%ad" --date=short --max-count=${maxCommits}`;
  const logRes = await runShellCommand(logCmd, repoPath, 15000);

  if (logRes.exitCode !== 0) {
    throw new Error(`git log failed: ${logRes.stderr}`);
  }

  const lines = (logRes.stdout || '').trim().split('\n').filter(Boolean);
  const commits = lines.map((l) => {
    const parts = l.split('|');
    return { sha: (parts[0] || '').slice(0, 8), subject: parts[1] || '', author: parts[2] || '', date: parts[3] || '' };
  });

  // Classify by conventional commit prefix
  const categories = {
    feat:     { label: '### Features',       items: [] },
    fix:      { label: '### Bug Fixes',      items: [] },
    perf:     { label: '### Performance',    items: [] },
    refactor: { label: '### Refactors',      items: [] },
    test:     { label: '### Tests',          items: [] },
    docs:     { label: '### Documentation', items: [] },
    chore:    { label: '### Chores',         items: [] },
    other:    { label: '### Other',          items: [] }
  };

  for (const c of commits) {
    const m = c.subject.match(/^(\w+)(\(.+?\))?(!)?:\s*(.*)/);
    const type = m ? m[1].toLowerCase() : 'other';
    const msg  = m ? m[4] : c.subject;
    const cat  = categories[type] || categories.other;
    cat.items.push(`- ${msg} (${c.sha})`);
  }

  const today     = new Date().toISOString().slice(0, 10);
  const rangeLabel = fromRef ? `${fromRef}..${toRef}` : toRef;
  const mdParts   = [`## Changelog — ${rangeLabel} (${today})`, ''];

  for (const cat of Object.values(categories)) {
    if (cat.items.length > 0) {
      mdParts.push(cat.label, ...cat.items, '');
    }
  }

  return {
    repoPath,
    fromRef: fromRef || '(beginning)',
    toRef,
    commitCount: commits.length,
    markdown: mdParts.join('\n'),
    commits
  };
}

function regressionRootCauseAnalysis(args) {
  const text      = args.failureText || '';
  const suite     = args.suiteName || 'unknown';
  const repoPath  = args.repoPath || null;

  // Root cause pattern matchers
  const PATTERNS = [
    {
      category: 'assertion_error',
      severity: 'high',
      patterns: [/AssertionError/i, /Expected .+ to (equal|be|match)/i, /assert\.(strictEqual|deepEqual|ok)/i, /expected .+ got/i],
      hint: 'A test assertion failed — expected value did not match actual value. Review the specific assertion and the code path it exercises.'
    },
    {
      category: 'missing_module',
      severity: 'high',
      patterns: [/Cannot find module/i, /MODULE_NOT_FOUND/i, /Error: Cannot resolve/i],
      hint: 'A required module or file is missing. Run npm install or check the import path.'
    },
    {
      category: 'timeout',
      severity: 'medium',
      patterns: [/Timeout.*exceeded/i, /timed out/i, /ETIMEDOUT/i, /Test Timeout/i],
      hint: 'An async operation or test exceeded its time limit. Check for slow I/O, network calls, or infinite loops.'
    },
    {
      category: 'auth_failure',
      severity: 'high',
      patterns: [/401|403|Unauthorized|Forbidden|Invalid credentials/i, /auth.*fail/i, /login.*fail/i],
      hint: 'Authentication or authorization failed. Verify credentials, session tokens, and permission scopes.'
    },
    {
      category: 'network_error',
      severity: 'medium',
      patterns: [/ECONNREFUSED/i, /ENOTFOUND/i, /ECONNRESET/i, /fetch.*failed/i, /getaddrinfo/i],
      hint: 'A network connection failed. Check if the server is running, the URL is correct, and firewalls are not blocking.'
    },
    {
      category: 'syntax_error',
      severity: 'high',
      patterns: [/SyntaxError/i, /Unexpected token/i, /Invalid or unexpected token/i],
      hint: 'A JavaScript syntax error was encountered. Check the file indicated in the stack trace.'
    },
    {
      category: 'type_error',
      severity: 'high',
      patterns: [/TypeError/i, /is not a function/i, /Cannot read propert/i, /undefined is not/i],
      hint: 'A runtime type error occurred — likely a null/undefined access or wrong type passed to a function.'
    },
    {
      category: 'reference_error',
      severity: 'medium',
      patterns: [/ReferenceError/i, /is not defined/i],
      hint: 'A variable or identifier is not defined in scope. Check for typos or missing imports.'
    },
    {
      category: 'permission_error',
      severity: 'medium',
      patterns: [/EACCES/i, /EPERM/i, /permission denied/i, /access.*denied/i],
      hint: 'File system permission error. Check directory/file permissions or run with elevated privileges.'
    },
    {
      category: 'out_of_memory',
      severity: 'critical',
      patterns: [/heap out of memory/i, /FATAL ERROR.*Allocation failed/i, /JavaScript heap/i],
      hint: 'Process ran out of memory. Increase --max-old-space-size or reduce memory usage in the test.'
    },
    {
      category: 'process_exit',
      severity: 'high',
      patterns: [/process.*exit.*code [^0]/i, /exited with code [^0]/i, /non-zero exit/i],
      hint: 'A child process or the test runner exited with a non-zero exit code. Check the output above for the specific error.'
    }
  ];

  const matched = [];
  for (const rule of PATTERNS) {
    if (rule.patterns.some((p) => p.test(text))) {
      // Extract a context snippet around the first match
      let snippet = '';
      for (const p of rule.patterns) {
        const m = text.match(p);
        if (m) {
          const idx = text.indexOf(m[0]);
          snippet = text.slice(Math.max(0, idx - 80), idx + 200).replace(/\n+/g, ' ').trim();
          break;
        }
      }
      matched.push({ category: rule.category, severity: rule.severity, hint: rule.hint, snippet });
    }
  }

  // Extract stack trace lines
  const stackLines = text.split('\n').filter((l) => /^\s+at /.test(l)).slice(0, 10).map((l) => l.trim());

  // Extract test names from common runners
  const testNames = [];
  for (const m of text.matchAll(/✗|✘|FAIL|not ok\s+\d+\s+(.+)/gi)) {
    if (m[1]) testNames.push(m[1].trim());
  }

  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  matched.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));

  const topCause = matched[0] || { category: 'unknown', severity: 'low', hint: 'No known pattern matched. Manual inspection required.', snippet: '' };

  return {
    suite,
    repoPath,
    primaryCause: topCause.category,
    primarySeverity: topCause.severity,
    totalPatternsMatched: matched.length,
    rootCauses: matched,
    stackTrace: stackLines,
    failedTestNames: testNames.slice(0, 20),
    recommendation: topCause.hint
  };
}

// ─── AI Dev Org Execution Engine ──────────────────────────────────────────────

const SPECIALIST_WORK_LOG_DIR = path.resolve(__dirname, 'logs', 'specialist-runs');

function dispatchSpecialistTask(args) {
  const specialistId = args.specialistId;
  const taskTitle    = args.taskTitle;
  const taskContext  = args.taskContext;
  const outputFormat = args.outputFormat || 'markdown';

  const specialist = SPECIALIST_AGENT_CATALOG.find((s) => s.id === specialistId);
  if (!specialist) {
    const available = SPECIALIST_AGENT_CATALOG.map((s) => s.id).join(', ');
    throw new Error(`Unknown specialistId: "${specialistId}". Available: ${available}`);
  }

  // Build domain-specific behavioral directives
  const DOMAIN_DIRECTIVES = {
    ux:          'Anchor every recommendation in user needs and interaction quality. Reference heuristics, patterns, and measurable usability outcomes.',
    frontend:    'Focus on rendering performance, bundle efficiency, and maintainable component architecture. Be concrete about browser/device targets.',
    backend:     'Prioritize correctness, reliability, and clean API boundaries. Call out any scalability or coupling risks explicitly.',
    data:        'Validate data integrity assumptions first. Be explicit about schema, query cost, and migration safety.',
    security:    'Apply threat modeling thinking. Classify risks by OWASP top 10 where applicable. Never leave a security concern vague.',
    quality:     'Define acceptance criteria and failure modes before proposing solutions. Think about edge cases the happy-path misses.',
    ai:          'Frame recommendations around prompt behavior, evaluation rigor, and AI-system composability. Distrust magic — require measurable criteria.',
    platform:    'Consider operational burden, observability, and developer experience equally. Infrastructure changes must be reversible.',
    docs:        'Write for the reader who is confused right now. Structure first, then detail. Every section needs a clear purpose.',
    operations:  'Prioritize speed of recovery over perfection. Identify the fastest safe path to resolution.',
    product:     'Ground decisions in user value and delivery reality. Push back on scope that inflates without proportionate value.',
    performance: 'Lead with measurement, not assumptions. Identify the bottleneck with evidence before recommending any fix.',
  };

  // Output format guidance per type
  const FORMAT_GUIDANCE = {
    json:     'Return a single valid JSON object. Keys must be camelCase. No prose outside the JSON.',
    markdown: 'Use ## headers, bullet lists, and code fences. Sections: Summary, Analysis, Recommendations, Next Steps.',
    code:     'Provide working, production-ready code. Include: brief comment on purpose, the implementation, one usage example.',
    analysis: 'Structure as: Problem Statement, Evidence, Root Cause, Impact Assessment, Recommended Mitigations.',
    plan:     'Produce a numbered action plan. Each item: action verb + what + why + acceptance criterion.',
  };

  const domainDirective = DOMAIN_DIRECTIVES[specialist.domain] || 'Apply deep expertise and be specific.';
  const strengthsStr    = specialist.strengths.join(', ');
  const formatGuidance  = FORMAT_GUIDANCE[outputFormat] || FORMAT_GUIDANCE.markdown;

  const systemPrompt = `You are the ${specialist.title} on a specialist AI development team.

Your domain: ${specialist.domain}
Your core strengths: ${strengthsStr}

Behavioral directives:
- ${domainDirective}
- Be specific and actionable — vague recommendations have zero value.
- Surface risks and trade-offs honestly; do not soften important concerns.
- Draw on your full depth of knowledge as a ${specialist.title}.
- Do not hedge unless genuine uncertainty exists — own your recommendations.
- Scope your response to your domain expertise; do not stray into areas outside your strengths.
- Implement your recommendations as concrete, numbered steps the caller can execute immediately.
- Validate every assumption by citing evidence from the provided context.
- Create explicit acceptance criteria for each recommendation so success is measurable.
- Configure outputs to match the requested format exactly; do not add unsolicited sections.
- Test your reasoning: if a recommendation fails the "so what?" test, remove it or sharpen it.
- Deploy your expertise selectively — depth over breadth for each item.
- Add risk ratings (high/medium/low) to each recommendation.
- Extract the 3 most critical action items and place them first.`;

  const taskPrompt = `## Task: ${taskTitle}

### Context
${taskContext}

### Your Assignment
As the ${specialist.title}, analyze the above context and produce a ${outputFormat} output.

${formatGuidance}

### Required Output Structure
- Add a concise executive summary (2-3 sentences) at the top
- Create a prioritized list of findings using bullet items
- Implement concrete next steps with owners and acceptance criteria
- Validate each recommendation against the context provided
- Configure your output to match the requested format: ${outputFormat}
- Extract and highlight any blockers or dependencies

Focus areas for this task (your strongest angles): ${strengthsStr}`;

  const framingContext = `Specialist: ${specialist.title} (${specialist.id})
Domain: ${specialist.domain}
Strengths: ${strengthsStr}
Output format: ${outputFormat}
Task: ${taskTitle}

Execution checklist:
- Validate task scope against specialist strengths
- Implement domain-specific analysis depth
- Create actionable, numbered recommendations
- Add risk and effort estimates per item
- Configure output format as: ${outputFormat}
- Test output completeness: summary + findings + recommendations + next steps`;

  // Compute domain confidence: keyword overlap between task and specialist
  const taskText = `${taskTitle || ''} ${taskContext || ''}`.toLowerCase();
  const domainKeywords = [specialist.domain, ...specialist.strengths].map(s => s.toLowerCase());
  const matchCount = domainKeywords.filter(kw => taskText.includes(kw)).length;
  const confidence = Math.min(1, matchCount / Math.max(1, Math.ceil(domainKeywords.length * 0.5)));
  const confidenceLabel = confidence >= 0.7 ? 'high' : confidence >= 0.4 ? 'medium' : 'low';

  return {
    specialistId,
    role:           specialist.title,
    domain:         specialist.domain,
    strengths:      specialist.strengths,
    confidence:     Math.round(confidence * 100) / 100,
    confidenceLabel,
    taskTitle,
    outputFormat,
    systemPrompt,
    taskPrompt,
    framingContext,
    outputGuidance: formatGuidance,
    timestamp:      new Date().toISOString()
  };
}

async function runParallelSpecialistSprint(args) {
  const sprintName    = args.sprintName;
  const tasks         = args.tasks || [];
  const maxConcurrent = Number.isFinite(args.maxConcurrent) ? args.maxConcurrent : 8;

  if (tasks.length === 0) throw new Error('tasks array must not be empty');

  const sprintId = `sprint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  emitHub('sprint_start', { sprintId, sprintName, taskCount: tasks.length });

  // Chunk tasks into batches of maxConcurrent for display ordering
  const batches = [];
  for (let i = 0; i < tasks.length; i += maxConcurrent) {
    batches.push(tasks.slice(i, i + maxConcurrent));
  }

  // Dispatch all tasks (sync per task, but Promise.all across a batch for async future-proofing)
  const dispatchedTasks = [];
  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(async (task) => {
        try {
          const bundle = dispatchSpecialistTask({
            specialistId: task.specialistId,
            taskTitle:    task.taskTitle,
            taskContext:  task.taskContext,
            outputFormat: task.outputFormat || 'markdown'
          });
          const _workerIdx = dispatchedTasks.length + batch.indexOf(task);
          emitHub('worker_spawned', { sprintId, workerIdx: _workerIdx, specialistId: task.specialistId, taskTitle: task.taskTitle });
          return { ...bundle, taskId: `${sprintId}-${_workerIdx}`, status: 'dispatched' };
        } catch (err) {
          return {
            specialistId: task.specialistId,
            taskTitle:    task.taskTitle,
            taskId:       `${sprintId}-err-${batch.indexOf(task)}`,
            status:       'error',
            error:        err.message
          };
        }
      })
    );
    dispatchedTasks.push(...batchResults);
  }

  const dispatched = dispatchedTasks.filter((t) => t.status === 'dispatched').length;
  const errors     = dispatchedTasks.filter((t) => t.status === 'error').length;
  emitHub('sprint_complete', { sprintId, sprintName, taskCount: tasks.length, dispatchedCount: dispatched, errorCount: errors });

  return {
    sprintId,
    sprintName,
    timestamp:      new Date().toISOString(),
    taskCount:      tasks.length,
    dispatchedCount: dispatched,
    errorCount:     errors,
    maxConcurrent,
    batchCount:     batches.length,
    tasks:          dispatchedTasks
  };
}

function evaluateSprintOutput(args) {
  const sprintId = args.sprintId;
  const outputs  = args.outputs || [];
  const rubric   = args.rubric  || {};

  const maxSpecificity    = Number.isFinite(rubric.specificity)    ? rubric.specificity    : 25;
  const maxActionability  = Number.isFinite(rubric.actionability)  ? rubric.actionability  : 25;
  const maxCoverage       = Number.isFinite(rubric.coverage)       ? rubric.coverage       : 25;
  const maxClarity        = Number.isFinite(rubric.clarity)        ? rubric.clarity        : 25;
  const maxTotal = maxSpecificity + maxActionability + maxCoverage + maxClarity;

  // Domain-specific keywords for keyword density scoring
  const DOMAIN_KEYWORDS = {
    ux:          ['user', 'flow', 'interaction', 'journey', 'heuristic', 'usability', 'prototype', 'persona'],
    frontend:    ['component', 'render', 'bundle', 'css', 'responsive', 'performance', 'dom', 'event'],
    backend:     ['service', 'api', 'endpoint', 'database', 'queue', 'cache', 'latency', 'throughput'],
    data:        ['schema', 'query', 'index', 'migration', 'pipeline', 'integrity', 'etl', 'aggregate'],
    security:    ['vulnerability', 'authentication', 'authorization', 'injection', 'encryption', 'threat', 'owasp', 'token'],
    quality:     ['test', 'coverage', 'assertion', 'edge', 'regression', 'mock', 'fixture', 'flaky'],
    ai:          ['prompt', 'model', 'eval', 'token', 'embedding', 'inference', 'hallucination', 'context'],
    platform:    ['deploy', 'ci', 'pipeline', 'container', 'monitor', 'alert', 'rollback', 'provisioning'],
    docs:        ['readme', 'example', 'reference', 'guide', 'section', 'navigate', 'audience', 'clarity'],
    operations:  ['incident', 'runbook', 'triage', 'escalate', 'mitigate', 'resolve', 'postmortem', 'sla'],
    product:     ['feature', 'requirement', 'priority', 'milestone', 'stakeholder', 'value', 'roadmap', 'acceptance'],
    performance: ['profiling', 'bottleneck', 'latency', 'throughput', 'benchmark', 'cpu', 'memory', 'optimization'],
  };

  const perTaskScores = outputs.map((item) => {
    const text    = item.output || item.content || '';
    const words   = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Specificity: longer + more numeric mentions = more specific
    const numberCount = (text.match(/\d+(?:\.\d+)?/g) || []).length;
    const specificityRaw = Math.min(1, (wordCount / 300)) * 0.6 + Math.min(1, numberCount / 10) * 0.4;
    const specificityScore = Math.round(specificityRaw * maxSpecificity);

    // Actionability: action verbs, imperative sentences, bullet items
    const actionVerbs = ['add', 'remove', 'update', 'fix', 'refactor', 'implement', 'ensure', 'create', 'replace', 'extract', 'migrate', 'test', 'deploy', 'validate', 'configure'];
    const actionCount = actionVerbs.reduce((sum, v) => sum + (text.toLowerCase().split(v).length - 1), 0);
    const bulletCount = (text.match(/^[\s]*[-*•]\s/gm) || []).length;
    const actionabilityRaw = Math.min(1, actionCount / 15) * 0.5 + Math.min(1, bulletCount / 10) * 0.5;
    const actionabilityScore = Math.round(actionabilityRaw * maxActionability);

    // Coverage: section headers indicate breadth of coverage
    const headerCount = (text.match(/^#{1,4}\s/gm) || []).length;
    const paragraphCount = text.split(/\n\n+/).length;
    const coverageRaw = Math.min(1, headerCount / 5) * 0.6 + Math.min(1, paragraphCount / 8) * 0.4;
    const coverageScore = Math.round(coverageRaw * maxCoverage);

    // Clarity: code fences, structured lists, not too long (wall-of-text penalty)
    const codeFenceCount = (text.match(/```/g) || []).length / 2;
    const wallOfTextPenalty = wordCount > 1500 ? 0.7 : 1.0;
    const clarityRaw = (Math.min(1, (bulletCount + codeFenceCount) / 8) * 0.7 + 0.3) * wallOfTextPenalty;
    const clarityScore = Math.round(clarityRaw * maxClarity);

    // Domain keyword density bonus
    const domain   = item.domain || 'backend';
    const domainKw = DOMAIN_KEYWORDS[domain] || [];
    const kwHits   = domainKw.reduce((sum, kw) => sum + (text.toLowerCase().includes(kw) ? 1 : 0), 0);
    const kwBonus  = kwHits >= 3 ? 2 : kwHits >= 1 ? 1 : 0; // small bonus, max 2

    const totalScore = Math.min(maxTotal, specificityScore + actionabilityScore + coverageScore + clarityScore + kwBonus);
    const pct        = Math.round((totalScore / maxTotal) * 100);

    let grade;
    if (pct >= 85)      grade = 'A';
    else if (pct >= 70) grade = 'B';
    else if (pct >= 55) grade = 'C';
    else if (pct >= 40) grade = 'D';
    else                grade = 'F';

    return {
      specialistId:       item.specialistId,
      taskTitle:          item.taskTitle,
      wordCount,
      scores: {
        specificity:   specificityScore,
        actionability: actionabilityScore,
        coverage:      coverageScore,
        clarity:       clarityScore,
        domainBonus:   kwBonus,
      },
      totalScore,
      maxPossible:    maxTotal,
      percentScore:   pct,
      grade,
    };
  });

  const overallScore  = perTaskScores.length
    ? Math.round(perTaskScores.reduce((s, t) => s + t.percentScore, 0) / perTaskScores.length)
    : 0;

  const failing       = perTaskScores.filter((t) => t.grade === 'F' || t.grade === 'D');
  const recommendation = overallScore >= 85
    ? 'Excellent sprint quality. Outputs are specific, actionable, and well-structured.'
    : overallScore >= 70
    ? 'Good sprint quality. Minor improvements possible — check low-scoring axes on D/F tasks.'
    : overallScore >= 55
    ? `Adequate but improvable. ${failing.length} task(s) underperforming — review context depth and output format guidance.`
    : `Sprint quality needs attention (${overallScore}/100). Key issues: thin outputs, low actionability, or missing structure. Consider enriching taskContext or reviewing specialist assignments.`;

  emitHub('evaluation_result', { sprintId, overallScore, grade: overallScore >= 85 ? 'A' : overallScore >= 70 ? 'B' : overallScore >= 55 ? 'C' : overallScore >= 40 ? 'D' : 'F', taskCount: outputs.length, recommendation });
  return {
    sprintId,
    evaluatedAt:    new Date().toISOString(),
    taskCount:      outputs.length,
    overallScore,
    grade:          overallScore >= 85 ? 'A' : overallScore >= 70 ? 'B' : overallScore >= 55 ? 'C' : overallScore >= 40 ? 'D' : 'F',
    recommendation,
    rubric:         { maxSpecificity, maxActionability, maxCoverage, maxClarity, maxTotal },
    perTaskScores
  };
}

function synthesizeSprintOutputs(args) {
  const outputs       = args.outputs || [];
  const synthesisGoal = args.synthesisGoal || 'synthesize specialist findings';
  const format        = args.format || 'plan';

  if (outputs.length === 0) throw new Error('outputs array must not be empty');

  // Group by domain
  const domainMap = {};
  for (const item of outputs) {
    const specialist = SPECIALIST_AGENT_CATALOG.find((s) => s.id === item.specialistId);
    const domain     = item.domain || specialist?.domain || 'general';
    if (!domainMap[domain]) domainMap[domain] = [];
    domainMap[domain].push({ ...item, domain });
  }

  // Extract action items (lines starting with action indicators)
  const ACTION_PATTERNS = [/^[-*•]\s+(.+)/, /^\d+[.)]\s+(.+)/, /^(implement|add|fix|update|remove|refactor|ensure|create|replace|migrate|deploy|validate|test)\s+/i];
  const allActions = [];
  for (const item of outputs) {
    const lines = (item.output || item.content || '').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      for (const pat of ACTION_PATTERNS) {
        if (pat.test(trimmed) && trimmed.length > 15 && trimmed.length < 200) {
          allActions.push({ text: trimmed.replace(/^[-*•\d.)]+\s*/, ''), source: item.specialistId, domain: item.domain || 'general' });
          break;
        }
      }
    }
  }

  // Simple deduplication: group near-duplicate actions by first 40 chars
  const seen     = new Set();
  const deduped  = allActions.filter((a) => {
    const key = a.text.toLowerCase().slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Detect conflicts: same domain, contradictory keywords
  const CONFLICT_PAIRS = [['add', 'remove'], ['increase', 'decrease'], ['enable', 'disable'], ['split', 'merge']];
  const conflicts = [];
  for (const [kA, kB] of CONFLICT_PAIRS) {
    const matchA = deduped.filter((a) => a.text.toLowerCase().includes(kA));
    const matchB = deduped.filter((a) => a.text.toLowerCase().includes(kB));
    for (const a of matchA) {
      for (const b of matchB) {
        if (a.domain === b.domain && a.source !== b.source) {
          conflicts.push({ action1: a.text, source1: a.source, action2: b.text, source2: b.source, domain: a.domain });
        }
      }
    }
  }

  // Build domain groups for output
  const domainGroups = Object.entries(domainMap).map(([domain, items]) => ({
    domain,
    specialistCount: items.length,
    specialists:     items.map((i) => i.specialistId),
    actionCount:     deduped.filter((a) => a.domain === domain).length,
    topActions:      deduped.filter((a) => a.domain === domain).slice(0, 5).map((a) => a.text)
  }));

  // Build merged actions ordered by domain then alphabetically
  const mergedActions = deduped.map((a, i) => ({ index: i + 1, ...a }));

  // Build final summary
  const domainList = Object.keys(domainMap).join(', ');
  let finalSummary;
  if (format === 'report') {
    finalSummary = `## Synthesis: ${synthesisGoal}\n\nSpecialists contributing: ${outputs.length} across domains: ${domainList}.\n\nTotal action items identified: ${mergedActions.length}. Conflicts detected: ${conflicts.length}.\n\nKey domains: ${domainGroups.map((g) => `${g.domain} (${g.actionCount} actions)`).join(', ')}.`;
  } else if (format === 'code_brief') {
    finalSummary = `// Synthesis: ${synthesisGoal}\n// Domains: ${domainList}\n// Actions: ${mergedActions.length} | Conflicts: ${conflicts.length}\n// Top actions:\n${mergedActions.slice(0, 10).map((a, i) => `// ${i + 1}. [${a.domain}] ${a.text}`).join('\n')}`;
  } else {
    // plan (default)
    finalSummary = `Goal: ${synthesisGoal}\n\nContributing specialists: ${outputs.length} (domains: ${domainList})\nAction items: ${mergedActions.length} | Conflicts: ${conflicts.length}\n\nTop 10 prioritized actions:\n${mergedActions.slice(0, 10).map((a) => `${a.index}. [${a.domain}] ${a.text}`).join('\n')}`;
  }

  emitHub('synthesis_complete', { synthesisGoal, totalActions: mergedActions.length, conflictCount: conflicts.length, specialistCount: outputs.length });
  return {
    synthesisGoal,
    format,
    synthesizedAt:    new Date().toISOString(),
    specialistCount:  outputs.length,
    totalActions:     mergedActions.length,
    conflictCount:    conflicts.length,
    domainGroups,
    mergedActions,
    conflictsFound:   conflicts.slice(0, 10), // cap at 10
    finalSummary
  };
}

function specialistWorkLog(args) {
  const action   = args.action;
  const sprintId = args.sprintId;

  if (!fs.existsSync(SPECIALIST_WORK_LOG_DIR)) {
    fs.mkdirSync(SPECIALIST_WORK_LOG_DIR, { recursive: true });
  }

  if (action === 'write') {
    if (!sprintId) throw new Error('sprintId required for write action');
    if (!args.entry) throw new Error('entry required for write action');
    const dateStr   = new Date().toISOString().slice(0, 10);
    const dayDir    = path.join(SPECIALIST_WORK_LOG_DIR, dateStr);
    if (!fs.existsSync(dayDir)) fs.mkdirSync(dayDir, { recursive: true });
    const filePath  = path.join(dayDir, `${sprintId}.json`);
    const entry     = { sprintId, writtenAt: new Date().toISOString(), ...args.entry };
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf8');
    return { action: 'write', sprintId, filePath, writtenAt: entry.writtenAt, ok: true };
  }

  if (action === 'read') {
    if (!sprintId) throw new Error('sprintId required for read action');
    // Search across all date directories
    let found = null;
    for (const dateDir of fs.readdirSync(SPECIALIST_WORK_LOG_DIR)) {
      const candidate = path.join(SPECIALIST_WORK_LOG_DIR, dateDir, `${sprintId}.json`);
      if (fs.existsSync(candidate)) {
        found = JSON.parse(fs.readFileSync(candidate, 'utf8'));
        break;
      }
    }
    if (!found) throw new Error(`Sprint log not found for sprintId: ${sprintId}`);
    return { action: 'read', sprintId, entry: found };
  }

  if (action === 'list') {
    const entries = [];
    if (!fs.existsSync(SPECIALIST_WORK_LOG_DIR)) return { action: 'list', totalCount: 0, entries };
    for (const dateDir of fs.readdirSync(SPECIALIST_WORK_LOG_DIR).sort().reverse()) {
      const dayPath = path.join(SPECIALIST_WORK_LOG_DIR, dateDir);
      if (!fs.statSync(dayPath).isDirectory()) continue;
      for (const file of fs.readdirSync(dayPath)) {
        if (!file.endsWith('.json')) continue;
        try {
          const raw  = JSON.parse(fs.readFileSync(path.join(dayPath, file), 'utf8'));
          entries.push({ sprintId: raw.sprintId, sprintName: raw.sprintName, date: dateDir, writtenAt: raw.writtenAt, taskCount: raw.taskCount, overallScore: raw.overallScore });
        } catch (_) { /* skip corrupt entries */ }
      }
    }
    return { action: 'list', totalCount: entries.length, entries };
  }

  throw new Error(`Unknown action "${action}". Must be write, read, or list.`);
}

// ─── Sprint Quality Trend ──────────────────────────────────────────────────────

function getSprintQualityTrend(args) {
  const lookbackDays = Math.min(Number.isFinite(args.lookbackDays) ? args.lookbackDays : 30, 365);
  const filterSpecialist = args.specialistId || null;
  const minSprints = Number.isFinite(args.minSprints) ? args.minSprints : 1;

  if (!fs.existsSync(SPECIALIST_WORK_LOG_DIR)) {
    return { totalSprints: 0, specialists: [], rubricTrend: {}, recommendations: [], lookbackDays };
  }

  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
  const allEntries = [];

  for (const dateDir of fs.readdirSync(SPECIALIST_WORK_LOG_DIR).sort()) {
    const dayPath = path.join(SPECIALIST_WORK_LOG_DIR, dateDir);
    if (!fs.statSync(dayPath).isDirectory()) continue;
    for (const file of fs.readdirSync(dayPath)) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(dayPath, file), 'utf8'));
        const ts = raw.writtenAt ? new Date(raw.writtenAt).getTime() : 0;
        if (ts < cutoff) continue;
        allEntries.push(raw);
      } catch (_) { /* skip corrupt */ }
    }
  }

  // Per-specialist aggregation
  const specialistMap = {};
  const rubricAxes = ['specificity', 'actionability', 'coverage', 'clarity', 'domainBonus'];
  const rubricTotals = {};

  for (const entry of allEntries) {
    const perTask = entry.perTaskScores || [];
    for (const task of perTask) {
      const sid = task.specialistId;
      if (filterSpecialist && sid !== filterSpecialist) continue;
      if (!specialistMap[sid]) specialistMap[sid] = { specialistId: sid, scores: [], sprintIds: [], axisAvgs: {} };
      specialistMap[sid].scores.push(task.percentScore || task.totalScore || 0);
      if (!specialistMap[sid].sprintIds.includes(entry.sprintId)) specialistMap[sid].sprintIds.push(entry.sprintId);
      if (task.scores) {
        for (const ax of rubricAxes) {
          if (task.scores[ax] !== undefined) {
            if (!specialistMap[sid].axisAvgs[ax]) specialistMap[sid].axisAvgs[ax] = [];
            specialistMap[sid].axisAvgs[ax].push(task.scores[ax]);
            if (!rubricTotals[ax]) rubricTotals[ax] = [];
            rubricTotals[ax].push(task.scores[ax]);
          }
        }
      }
    }
  }

  // Build specialist summaries
  const specialists = Object.values(specialistMap)
    .filter((s) => s.sprintIds.length >= minSprints)
    .map((s) => {
      const avg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length;
      const sorted = [...s.scores];
      const delta = sorted.length >= 2 ? sorted[sorted.length - 1] - sorted[0] : 0;
      const axisAvgs = {};
      for (const [ax, vals] of Object.entries(s.axisAvgs)) {
        axisAvgs[ax] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
      }
      const weakAxes = Object.entries(axisAvgs)
        .filter(([, v]) => v < 15)
        .sort((a, b) => a[1] - b[1])
        .map(([k]) => k);
      return {
        specialistId: s.specialistId,
        sprintCount: s.sprintIds.length,
        avgScore: Math.round(avg * 10) / 10,
        scoreDelta: Math.round(delta * 10) / 10,
        trend: delta > 3 ? 'improving' : delta < -3 ? 'declining' : 'stable',
        axisAvgs,
        weakAxes,
        grade: avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 60 ? 'D' : 'F'
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore);

  // Global rubric axis averages
  const rubricTrend = {};
  for (const [ax, vals] of Object.entries(rubricTotals)) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    rubricTrend[ax] = { avg: Math.round(avg * 10) / 10, samples: vals.length, weak: avg < 15 };
  }

  // Recommendations
  const recommendations = [];
  const weakGlobal = Object.entries(rubricTrend).filter(([, v]) => v.weak).map(([k]) => k);
  if (weakGlobal.length) {
    recommendations.push(`Global rubric weakness in: ${weakGlobal.join(', ')} — add more specific context and examples to task prompts.`);
  }
  const declining = specialists.filter((s) => s.trend === 'declining');
  for (const s of declining.slice(0, 3)) {
    recommendations.push(`${s.specialistId} is declining (delta ${s.scoreDelta}) — review recent task context quality for this specialist.`);
  }
  const lowScorers = specialists.filter((s) => s.grade === 'D' || s.grade === 'F');
  for (const s of lowScorers.slice(0, 3)) {
    recommendations.push(`${s.specialistId} averaging ${s.avgScore}/100 (${s.grade}) — weak axes: ${s.weakAxes.join(', ') || 'none identified'}.`);
  }
  if (!recommendations.length) recommendations.push('All tracked specialists are performing well. No immediate prompt adjustments needed.');

  return {
    lookbackDays,
    totalSprints: allEntries.length,
    specialistCount: specialists.length,
    specialists,
    rubricTrend,
    recommendations
  };
}

// ─── Persistent Memory Store ───────────────────────────────────────────────────

const MEMORY_STORE_PATH = path.resolve(__dirname, 'artifacts', 'memory', 'session-state.json');

function _readMemoryStore() {
  if (!fs.existsSync(MEMORY_STORE_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(MEMORY_STORE_PATH, 'utf8')); }
  catch (_) { return {}; }
}

function _writeMemoryStore(store) {
  const dir = path.dirname(MEMORY_STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(MEMORY_STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function _getNestedKey(obj, dotKey) {
  const parts = dotKey.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

function _setNestedKey(obj, dotKey, value) {
  const parts = dotKey.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function getMemory(args) {
  const key = args.key;
  const store = _readMemoryStore();
  const value = _getNestedKey(store, key);
  return { key, value: value !== undefined ? value : null, found: value !== undefined };
}

function setMemory(args) {
  const key = args.key;
  const store = _readMemoryStore();
  _setNestedKey(store, key, args.value);
  _writeMemoryStore(store);
  return { key, value: args.value, ok: true, storedAt: new Date().toISOString() };
}

function appendMemory(args) {
  const key = args.key;
  const store = _readMemoryStore();
  const existing = _getNestedKey(store, key);
  if (existing !== undefined && !Array.isArray(existing)) {
    throw new Error(`Key "${key}" exists but is not an array (got ${typeof existing}). Use set_memory to overwrite.`);
  }
  const arr = Array.isArray(existing) ? existing : [];
  arr.push(args.item);
  _setNestedKey(store, key, arr);
  _writeMemoryStore(store);
  return { key, appended: args.item, newLength: arr.length, ok: true };
}

function listMemoryKeys(args) {
  const store = _readMemoryStore();
  const prefix = args && args.prefix;
  if (prefix) {
    const sub = _getNestedKey(store, prefix);
    if (sub === undefined || sub === null) return { prefix, keys: [], count: 0 };
    if (typeof sub !== 'object' || Array.isArray(sub)) return { prefix, keys: [prefix], count: 1, value: sub };
    const keys = Object.keys(sub).map(k => `${prefix}.${k}`);
    return { prefix, keys, count: keys.length };
  }
  const keys = Object.keys(store);
  return { keys, count: keys.length };
}

function clearMemory(args) {
  const key = args.key;
  if (key === '__all__') {
    _writeMemoryStore({});
    return { key, cleared: true, deletedAll: true };
  }
  const store = _readMemoryStore();
  const parts = key.split('.');
  if (parts.length === 1) {
    const existed = key in store;
    delete store[key];
    _writeMemoryStore(store);
    return { key, cleared: true, existed };
  }
  // nested delete
  let cur = store;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== 'object') {
      return { key, cleared: false, existed: false };
    }
    cur = cur[p];
  }
  const leaf = parts[parts.length - 1];
  const existed = leaf in cur;
  delete cur[leaf];
  _writeMemoryStore(store);
  return { key, cleared: true, existed };
}

async function autoRemediateDrift(args) {
  const repoPath = normalizeFsPath(args.repoPath);
  const dryRun   = args.dryRun !== false; // default true
  const requested = Array.isArray(args.driftTypes) && args.driftTypes.length > 0
    ? new Set(args.driftTypes)
    : null; // null = fix all detected

  const actions = [];
  const applied = [];
  const errors  = [];

  // --- Detect: uncommitted changes ---
  let hasUncommitted = false;
  try {
    const status = execSync('git status --porcelain', { cwd: repoPath, encoding: 'utf8', timeout: 10000 });
    hasUncommitted = status.trim().length > 0;
  } catch (e) {
    errors.push({ type: 'detect_uncommitted', error: e.message });
  }

  if (hasUncommitted && (!requested || requested.has('uncommitted_changes'))) {
    const action = { type: 'uncommitted_changes', command: 'git stash push -m "auto-remediate-drift"', cwd: repoPath };
    actions.push(action);
    if (!dryRun) {
      try {
        const out = execSync(action.command, { cwd: repoPath, encoding: 'utf8', timeout: 15000 });
        applied.push({ ...action, output: out.trim() });
      } catch (e) {
        errors.push({ type: 'uncommitted_changes', error: e.message });
      }
    }
  }

  // --- Detect: missing deps (node_modules absent or out of sync) ---
  let missingDeps = false;
  const nmPath = path.join(repoPath, 'node_modules');
  const pkgPath = path.join(repoPath, 'package.json');
  if (fs.existsSync(pkgPath) && !fs.existsSync(nmPath)) {
    missingDeps = true;
  } else if (fs.existsSync(pkgPath) && fs.existsSync(nmPath)) {
    // Check if package.json is newer than node_modules
    const pkgStat = fs.statSync(pkgPath);
    const nmStat  = fs.statSync(nmPath);
    if (pkgStat.mtimeMs > nmStat.mtimeMs) missingDeps = true;
  }

  if (missingDeps && (!requested || requested.has('missing_deps'))) {
    const action = { type: 'missing_deps', command: 'npm install --prefer-offline', cwd: repoPath };
    actions.push(action);
    if (!dryRun) {
      try {
        const out = execSync(action.command, { cwd: repoPath, encoding: 'utf8', timeout: 60000 });
        applied.push({ ...action, output: out.trim().slice(0, 500) });
      } catch (e) {
        errors.push({ type: 'missing_deps', error: e.message });
      }
    }
  }

  // --- Detect: remote behind (local branch behind origin) ---
  let remoteBehind = false;
  try {
    execSync('git fetch --quiet', { cwd: repoPath, encoding: 'utf8', timeout: 20000 });
    const behind = execSync('git rev-list HEAD..@{u} --count', { cwd: repoPath, encoding: 'utf8', timeout: 10000 });
    remoteBehind = parseInt(behind.trim(), 10) > 0;
  } catch (e) {
    // Not behind or no upstream — skip silently
  }

  if (remoteBehind && (!requested || requested.has('remote_behind'))) {
    const action = { type: 'remote_behind', command: 'git pull --ff-only', cwd: repoPath };
    actions.push(action);
    if (!dryRun) {
      try {
        const out = execSync(action.command, { cwd: repoPath, encoding: 'utf8', timeout: 30000 });
        applied.push({ ...action, output: out.trim() });
      } catch (e) {
        errors.push({ type: 'remote_behind', error: e.message });
      }
    }
  }

  return {
    repoPath,
    dryRun,
    driftDetected: {
      uncommitted_changes: hasUncommitted,
      missing_deps: missingDeps,
      remote_behind: remoteBehind
    },
    plannedActions: actions,
    appliedActions: dryRun ? [] : applied,
    errors
  };
}

function compareServerCapabilities(args) {
  const pathA = normalizeFsPath(args.serverPathA);
  const pathB = args.serverPathB ? normalizeFsPath(args.serverPathB) : __filename;

  function extractTools(filePath) {
    let src;
    try {
      src = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      throw new Error(`Cannot read ${filePath}: ${err.message}`);
    }
    const tools = {};
    // Extract { name: '...', description: '...' } pairs in order from the source
    const nameRe   = /name:\s*'([^']+)'/g;
    const descRe   = /description:\s*'([^']+)'/g;
    const names = [...src.matchAll(nameRe)].map((m) => m[1]);
    const descs = [...src.matchAll(descRe)].map((m) => m[1]);
    // TOOLS section names come before PROMPTS — heuristic: descriptions outnumber names slightly
    // Use positional pairing up to the names count
    for (let i = 0; i < names.length; i++) {
      tools[names[i]] = descs[i] || '';
    }
    return tools;
  }

  const toolsA = extractTools(pathA);
  const toolsB = extractTools(pathB);

  const namesA = new Set(Object.keys(toolsA));
  const namesB = new Set(Object.keys(toolsB));

  const added   = [...namesB].filter((n) => !namesA.has(n)).map((n) => ({ name: n, description: toolsB[n] }));
  const removed = [...namesA].filter((n) => !namesB.has(n)).map((n) => ({ name: n, description: toolsA[n] }));
  const changed = [...namesA].filter((n) => namesB.has(n) && toolsA[n] !== toolsB[n]).map((n) => ({
    name: n,
    descriptionA: toolsA[n],
    descriptionB: toolsB[n]
  }));
  const unchanged = [...namesA].filter((n) => namesB.has(n) && toolsA[n] === toolsB[n]).length;

  return {
    serverA: pathA,
    serverB: pathB,
    totalInA: namesA.size,
    totalInB: namesB.size,
    addedCount:   added.length,
    removedCount: removed.length,
    changedCount: changed.length,
    unchangedCount: unchanged,
    added,
    removed,
    changed
  };
}

function toolDependencyGraph(args) {
  const targetPath = args.serverPath ? normalizeFsPath(args.serverPath) : __filename;
  const filterTool = args.toolName ? args.toolName.toLowerCase() : null;

  let src;
  try {
    src = fs.readFileSync(targetPath, 'utf8');
  } catch (err) {
    throw new Error(`Cannot read serverPath: ${err.message}`);
  }

  const lines = src.split('\n');

  // Step 1: Extract all function names defined in the file
  const functionNames = new Set();
  const funcDefRe = /^(?:async\s+)?function\s+(\w+)\s*\(/;
  const arrowFuncRe = /^(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|\w+)\s*=>/;
  for (const line of lines) {
    const m = line.match(funcDefRe) || line.match(arrowFuncRe);
    if (m) functionNames.add(m[1]);
  }

  // Step 2: Extract case blocks — tool name -> handler function call
  // Pattern: case 'tool_name': return someFunction(args);
  const caseRe = /case\s+'([^']+)':\s*(?:return\s+)?(\w+)\(/;
  const toolHandlers = {};
  for (const line of lines) {
    const m = line.match(caseRe);
    if (m) {
      toolHandlers[m[1]] = m[2];
    }
  }

  // Step 3: For each implementation function, find which other functions it calls
  const callGraph = {};
  // Build a map: functionName -> source lines
  const funcRanges = {};
  let currentFunc = null;
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(funcDefRe) || line.match(arrowFuncRe);
    if (m && (line.includes('{') || lines[i + 1]?.includes('{'))) {
      if (currentFunc && depth === 0) {
        funcRanges[currentFunc].end = i - 1;
      }
      currentFunc = m[1];
      funcRanges[currentFunc] = { start: i, end: lines.length - 1, lines: [] };
      depth = 0;
    }
    if (currentFunc && funcRanges[currentFunc]) {
      funcRanges[currentFunc].lines.push(line);
    }
  }

  for (const [funcName, range] of Object.entries(funcRanges)) {
    const called = new Set();
    const callRe = /\b(\w+)\s*\(/g;
    for (const line of range.lines) {
      let m;
      while ((m = callRe.exec(line)) !== null) {
        if (m[1] !== funcName && functionNames.has(m[1])) {
          called.add(m[1]);
        }
      }
    }
    callGraph[funcName] = [...called];
  }

  // Step 4: Build tool dependency entries
  const allEntries = Object.entries(toolHandlers).map(([tool, handler]) => ({
    tool,
    handler,
    handlerCallsTo: callGraph[handler] || []
  }));

  const filtered = filterTool
    ? allEntries.filter((e) => e.tool.toLowerCase().includes(filterTool))
    : allEntries;

  return {
    serverPath: targetPath,
    totalFunctions: functionNames.size,
    totalTools: Object.keys(toolHandlers).length,
    filteredCount: filtered.length,
    graph: filtered
  };
}

function semanticToolSearch(args) {
  const query      = (args.query || '').toLowerCase().trim();
  const maxResults = Number.isFinite(args.maxResults) ? args.maxResults : 10;

  if (!query) {
    throw new Error('query is required and must not be empty');
  }

  // Determine which tool list to search
  let toolList = TOOLS;
  if (args.serverPath) {
    const sp = normalizeFsPath(args.serverPath);
    try {
      const src = fs.readFileSync(sp, 'utf8');
      // Extract tool objects via simple name+description extraction
      const nameMatches = [...src.matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1]);
      const descMatches = [...src.matchAll(/description:\s*'([^']+)'/g)].map((m) => m[1]);
      toolList = nameMatches.slice(0, descMatches.length).map((name, i) => ({
        name,
        description: descMatches[i] || ''
      }));
    } catch (err) {
      throw new Error(`Cannot read serverPath: ${err.message}`);
    }
  }

  // Tokenize query
  const tokens = query.split(/\s+/).filter(Boolean);

  // Score each tool
  const scored = toolList.map((tool) => {
    const haystack = `${tool.name} ${tool.description || ''}`.toLowerCase();
    let score = 0;

    for (const token of tokens) {
      // Exact word boundary match = 3 pts, substring = 1 pt
      const wordBoundary = new RegExp(`(?:^|[^a-z])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[^a-z]|$)`);
      if (wordBoundary.test(haystack)) {
        score += 3;
      } else if (haystack.includes(token)) {
        score += 1;
      }
      // Bonus if token appears in the name specifically
      if (tool.name.toLowerCase().includes(token)) {
        score += 2;
      }
    }

    return { name: tool.name, description: tool.description || '', score };
  });

  const results = scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((r) => ({
      name: r.name,
      description: r.description.length > 120 ? r.description.slice(0, 117) + '...' : r.description,
      relevanceScore: r.score
    }));

  return {
    query,
    totalToolsSearched: toolList.length,
    matchCount: results.length,
    results
  };
}

async function estimateRefactorRisk(args) {
  const filePath     = normalizeFsPath(args.filePath);
  const churnDays    = Number.isFinite(args.churnLookback) ? args.churnLookback : 90;

  if (!fs.existsSync(filePath)) {
    throw new Error(`Path not found: ${filePath}`);
  }

  const stat = fs.statSync(filePath);
  const isDir = stat.isDirectory();

  // ── Size score (0–30) ──────────────────────────────────────────────────
  let totalLines = 0;
  let fileCount  = 0;
  if (isDir) {
    const jsFiles = fs.readdirSync(filePath).filter((f) => f.endsWith('.js'));
    fileCount = jsFiles.length;
    for (const f of jsFiles.slice(0, 20)) {
      try {
        const lines = fs.readFileSync(path.join(filePath, f), 'utf8').split('\n').length;
        totalLines += lines;
      } catch (_) { /* skip unreadable */ }
    }
  } else {
    fileCount = 1;
    try { totalLines = fs.readFileSync(filePath, 'utf8').split('\n').length; } catch (_) {}
  }
  const sizeScore = Math.min(30, Math.round((totalLines / 5000) * 30));

  // ── Complexity score (0–35) — reuse codeComplexityScan if single JS file ──
  let complexityScore = 0;
  let complexityDetail = 'n/a (directory or non-JS file)';
  if (!isDir && filePath.endsWith('.js')) {
    try {
      const cx = codeComplexityScan({ filePath });
      const nestingPenalty  = Math.min(15, Math.max(0, (cx.maxNestingDepth - 3) * 3));
      const longFnPenalty   = Math.min(20, cx.longFunctionCount * 4);
      complexityScore  = nestingPenalty + longFnPenalty;
      complexityDetail = `nesting=${cx.maxNestingDepth} longFns=${cx.longFunctionCount} avgLen=${cx.averageFunctionLines}`;
    } catch (_) {}
  }

  // ── Churn score (0–35) — git log commit frequency ──────────────────────
  let churnScore = 0;
  let churnDetail = 'git unavailable';
  let churnCommits = 0;
  const repoPath = normalizeFsPath(args.repoPath || (isDir ? filePath : path.dirname(filePath)));
  const since = new Date(Date.now() - churnDays * 86400000).toISOString().slice(0, 10);
  const relPath = path.relative(repoPath, filePath).replace(/\\/g, '/');
  try {
    const gitCmd = `git -C "${repoPath}" log --oneline --since="${since}" -- "${relPath}"`;
    const res = await runShellCommand(gitCmd, repoPath, 15000);
    if (res.exitCode === 0) {
      churnCommits = res.stdout.trim().split('\n').filter(Boolean).length;
      churnScore   = Math.min(35, Math.round((churnCommits / 20) * 35));
      churnDetail  = `${churnCommits} commits in last ${churnDays}d`;
    }
  } catch (_) {}

  // ── Total risk score ───────────────────────────────────────────────────
  const totalScore = sizeScore + complexityScore + churnScore;
  const riskLevel = totalScore >= 70 ? 'critical'
    : totalScore >= 50 ? 'high'
    : totalScore >= 30 ? 'medium'
    : 'low';

  const recommendation = riskLevel === 'critical'
    ? 'High-risk file — break into smaller modules before touching. Add tests first.'
    : riskLevel === 'high'
    ? 'Elevated risk — add unit tests and review carefully before making changes.'
    : riskLevel === 'medium'
    ? 'Moderate risk — test coverage recommended before refactoring.'
    : 'Low risk — safe to refactor with standard care.';

  return {
    filePath,
    isDirectory: isDir,
    totalLines,
    fileCount,
    churnCommits,
    riskScore: totalScore,
    riskLevel,
    scoreBreakdown: {
      sizeScore,
      complexityScore,
      churnScore
    },
    details: {
      size:       `${totalLines} lines across ${fileCount} file(s)`,
      complexity: complexityDetail,
      churn:      churnDetail
    },
    recommendation
  };
}

function codeComplexityScan(args) {
  const filePath        = normalizeFsPath(args.filePath);
  const longThreshold   = Number.isFinite(args.longFunctionLines) ? args.longFunctionLines : 50;
  const nestingWarnAt   = Number.isFinite(args.maxNestingWarn) ? args.maxNestingWarn : 4;

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const src   = fs.readFileSync(filePath, 'utf8');
  const lines = src.split('\n');
  const totalLines = lines.length;

  // Detect function declarations / expressions / arrow functions
  const FUNC_RE = /(?:^|[\s;{(,])(?:async\s+)?function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>)|=>\s*\{|class\s+\w+/;
  const functions = [];
  let currentFuncStart = null;
  let braceDepth = 0;
  let inFunc = false;

  // Simple line-by-line nesting depth tracker
  let maxNesting = 0;
  let currentNesting = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Count braces for nesting
    for (const ch of line) {
      if (ch === '{') {
        currentNesting++;
        if (currentNesting > maxNesting) maxNesting = currentNesting;
      } else if (ch === '}') {
        currentNesting = Math.max(0, currentNesting - 1);
      }
    }

    // Detect function start
    if (!inFunc && FUNC_RE.test(line)) {
      inFunc = true;
      currentFuncStart = i + 1; // 1-based
      braceDepth = 0;
      // count braces on this line
      for (const ch of line) {
        if (ch === '{') braceDepth++;
        else if (ch === '}') braceDepth--;
      }
      // Extract function name
      const nameMatch = line.match(/function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=/)
        || line.match(/class\s+(\w+)/);
      functions.push({
        name: nameMatch ? (nameMatch[1] || nameMatch[2] || 'anonymous') : 'anonymous',
        startLine: currentFuncStart,
        endLine: null,
        lineCount: null
      });
    } else if (inFunc) {
      for (const ch of line) {
        if (ch === '{') braceDepth++;
        else if (ch === '}') braceDepth--;
      }
      if (braceDepth <= 0) {
        const fn = functions[functions.length - 1];
        fn.endLine  = i + 1;
        fn.lineCount = fn.endLine - fn.startLine + 1;
        inFunc = false;
        braceDepth = 0;
      }
    }
  }

  // Close any unclosed function at end of file
  if (inFunc && functions.length > 0) {
    const fn = functions[functions.length - 1];
    fn.endLine  = totalLines;
    fn.lineCount = fn.endLine - fn.startLine + 1;
  }

  const completedFuncs = functions.filter((f) => f.lineCount !== null);
  const longFunctions  = completedFuncs.filter((f) => f.lineCount > longThreshold)
    .sort((a, b) => b.lineCount - a.lineCount)
    .slice(0, 20);

  const avgLength = completedFuncs.length > 0
    ? Math.round(completedFuncs.reduce((s, f) => s + f.lineCount, 0) / completedFuncs.length)
    : 0;

  const nestingWarning = maxNesting >= nestingWarnAt
    ? `Max nesting depth ${maxNesting} exceeds threshold ${nestingWarnAt} — consider refactoring deeply nested blocks`
    : null;

  return {
    filePath,
    totalLines,
    functionCount: completedFuncs.length,
    maxNestingDepth: maxNesting,
    averageFunctionLines: avgLength,
    longFunctionThreshold: longThreshold,
    longFunctionCount: longFunctions.length,
    longFunctions,
    nestingWarning,
    summary: [
      `${totalLines} lines`,
      `${completedFuncs.length} functions`,
      `max nesting ${maxNesting}`,
      `avg fn length ${avgLength}`,
      longFunctions.length > 0 ? `${longFunctions.length} long functions` : 'no long functions'
    ].join(' | ')
  };
}

// ─── ROADMAP #5: Adversarial Review Gate ─────────────────────────────────────

function adversarialReview(args) {
  const content    = args.content;
  const context    = args.context || '';
  const focusAreas = Array.isArray(args.focusAreas) && args.focusAreas.length > 0
    ? args.focusAreas
    : ['security', 'logic', 'edge-cases', 'breaking-changes'];
  const minObjections = Number.isFinite(args.minObjections) ? args.minObjections : 3;

  const focusSection = focusAreas.map((f, i) => `${i + 1}. **${f}**: Search specifically for ${f}-related problems.`).join('\n');

  const systemPrompt = `You are a hostile, adversarial code and design reviewer. Your job is to FIND PROBLEMS — not to be helpful or supportive. You must:
1. Assume the author has made mistakes.
2. Surface at least ${minObjections} specific, actionable objections.
3. Never say "looks good" or validate anything without evidence.
4. Categorize every objection by risk: CRITICAL / HIGH / MEDIUM / LOW.
5. Each objection must include: what is wrong, why it fails, and what the impact is.`;

  const taskPrompt = `Review the following ${context ? `(context: ${context}) ` : ''}and find every problem you can:

\`\`\`
${content.slice(0, 6000)}
\`\`\`

Focus areas:
${focusSection}

Output a JSON object with this exact shape:
{
  "objectionCount": <number>,
  "passesGate": false,
  "objections": [
    {
      "id": "obj-1",
      "category": "<focus-area>",
      "risk": "CRITICAL|HIGH|MEDIUM|LOW",
      "what": "<what is wrong>",
      "why": "<why it fails or causes a problem>",
      "impact": "<what bad outcome this causes>",
      "suggestion": "<minimal fix>"
    }
  ],
  "summary": "<one-sentence overall verdict>"
}

You MUST produce at least ${minObjections} objections. If you cannot find ${minObjections} real problems, produce MEDIUM/LOW risk style guide and robustness issues.`;

  return {
    reviewType: 'adversarial',
    contentLength: content.length,
    focusAreas,
    minObjections,
    systemPrompt,
    taskPrompt,
    instructions: `Feed systemPrompt + taskPrompt to your AI model and parse the returned JSON. The objections array is the review gate output. If any CRITICAL objections exist, do not proceed with implementation.`,
    timestamp: new Date().toISOString()
  };
}

// ─── ROADMAP #3: Auto-Commit Pipeline ────────────────────────────────────────

async function autoImplementPlan(args) {
  const targetFile   = normalizeFsPath(args.targetFile);
  const dryRun       = args.dryRun !== false; // default true = safe
  const runTests     = args.runTests === true;
  const commitMsg    = args.commitMessage || null;
  const plan         = args.plan || '';
  const explicitEdits = Array.isArray(args.edits) ? args.edits : [];

  // Security: reject path traversal — file must stay within server root or a known safe dir
  const serverRoot = path.resolve(__dirname);
  const resolvedTarget = path.resolve(targetFile);
  const ALLOWED_ROOTS = [
    serverRoot,
    path.resolve(process.cwd()),
  ];
  const isAllowed = ALLOWED_ROOTS.some(root => resolvedTarget.startsWith(root + path.sep) || resolvedTarget === root);
  if (!isAllowed) {
    throw new Error(`Path outside allowed root: ${resolvedTarget}`);
  }

  if (!fs.existsSync(targetFile)) {
    throw new Error(`targetFile not found: ${targetFile}`);
  }

  const originalContent = fs.readFileSync(targetFile, 'utf8');
  let edits = explicitEdits;

  // If no explicit edits, try to parse plan into find/replace pairs
  if (edits.length === 0 && plan) {
    // Pattern: lines like "FIND: ..." / "REPLACE: ..." or ```find ... ``` / ```replace ... ```
    const blockRe = /(?:FIND|find):\s*`([^`]+)`\s*(?:REPLACE|replace):\s*`([^`]+)`/g;
    let m;
    while ((m = blockRe.exec(plan)) !== null) {
      edits.push({ find: m[1], replace: m[2] });
    }
  }

  const appliedEdits = [];
  const failedEdits  = [];
  let workingContent = originalContent;

  for (const edit of edits) {
    if (workingContent.includes(edit.find)) {
      workingContent = workingContent.replace(edit.find, edit.replace);
      appliedEdits.push({ find: edit.find.slice(0, 80), replace: edit.replace.slice(0, 80), status: 'applied' });
    } else {
      failedEdits.push({ find: edit.find.slice(0, 80), status: 'not_found' });
    }
  }

  if (dryRun) {
    return {
      dryRun: true,
      targetFile,
      editCount: edits.length,
      appliedCount: appliedEdits.length,
      failedCount: failedEdits.length,
      appliedEdits,
      failedEdits,
      preview: workingContent.slice(0, 500),
      message: 'Dry run complete — no changes written. Set dryRun=false to apply.'
    };
  }

  // Write changes
  fs.writeFileSync(targetFile, workingContent, 'utf8');

  // Syntax check
  let syntaxOk = false;
  let syntaxError = null;
  const checkRes = await runShellCommand(`node --check "${targetFile}"`, path.dirname(targetFile), 15000);
  if (checkRes.exitCode === 0) {
    syntaxOk = true;
  } else {
    syntaxError = checkRes.stderr || checkRes.stdout;
    // Revert on syntax failure
    fs.writeFileSync(targetFile, originalContent, 'utf8');
    return {
      dryRun: false,
      targetFile,
      syntaxOk: false,
      syntaxError,
      reverted: true,
      appliedEdits,
      failedEdits,
      message: 'Syntax check failed — changes reverted.'
    };
  }

  // Optionally run tests
  let testResult = null;
  if (runTests) {
    const cwd = path.dirname(targetFile);
    const testCmd = 'npm test';
    const tres = await runShellCommand(testCmd, cwd, 120000);
    testResult = { exitCode: tres.exitCode, stdout: tres.stdout.slice(0, 1000), stderr: tres.stderr.slice(0, 500) };
    if (tres.exitCode !== 0) {
      fs.writeFileSync(targetFile, originalContent, 'utf8');
      return {
        dryRun: false,
        targetFile,
        syntaxOk: true,
        testsPassed: false,
        testResult,
        reverted: true,
        message: 'Tests failed — changes reverted.'
      };
    }
  }

  // Optionally commit
  let committed = false;
  let commitHash = null;
  if (commitMsg) {
    const cwd = path.dirname(targetFile);
    await runShellCommand('git add -A', cwd, 10000);
    const cr = await runShellCommand(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, cwd, 15000);
    if (cr.exitCode === 0) {
      committed = true;
      const hres = await runShellCommand('git rev-parse --short HEAD', cwd, 5000);
      commitHash = hres.stdout.trim();
      await runShellCommand('git push', cwd, 30000);
    }
  }

  return {
    dryRun: false,
    targetFile,
    syntaxOk,
    testsPassed: runTests ? true : null,
    testResult,
    committed,
    commitHash,
    appliedEdits,
    failedEdits,
    message: 'Changes applied successfully.'
  };
}

// ─── ROADMAP #4: Live Web Scraping Research Feed ──────────────────────────────

async function scrapeResearchUrl(args) {
  const url         = args.url;
  const topic       = args.topic || '';
  const maxChars    = Number.isFinite(args.maxChars) ? args.maxChars : 3000;
  const saveInsight = args.saveInsight !== false;

  // Fetch via built-in https/http
  const rawHtml = await new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? require('https') : require('http');
    const timeout = setTimeout(() => reject(new Error('Fetch timeout after 15s')), 15000);
    const req = mod.get(url, { headers: { 'User-Agent': 'agent-ops-hub-research/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        clearTimeout(timeout);
        resolve(null); // redirect — skip
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { clearTimeout(timeout); resolve(data); });
    });
    req.on('error', (e) => { clearTimeout(timeout); reject(e); });
  });

  if (!rawHtml) {
    return { url, error: 'Redirect — unable to follow automatically. Try the final URL directly.' };
  }

  // Strip HTML tags and collapse whitespace
  const text = rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxChars);

  // Score relevance against topic
  let relevanceScore = 0;
  if (topic) {
    const tokens = topic.toLowerCase().split(/\s+/).filter(Boolean);
    const haystack = text.toLowerCase();
    for (const tok of tokens) {
      const count = (haystack.match(new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      relevanceScore += Math.min(10, count);
    }
    relevanceScore = Math.round(Math.min(100, relevanceScore / (tokens.length || 1) * 10));
  }

  // Deduplicate: check existing pulses for this URL
  const pulsesDir = path.resolve(__dirname, 'artifacts', 'research-pulses');
  if (!fs.existsSync(pulsesDir)) fs.mkdirSync(pulsesDir, { recursive: true });

  const slug = url.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 60);
  const dateStr = new Date().toISOString().slice(0, 10);
  const pulsePath = path.join(pulsesDir, `${dateStr}-${slug}.json`);

  const existing = fs.readdirSync(pulsesDir).filter((f) => f.includes(slug));
  const isDuplicate = existing.length > 0;

  const insight = {
    url,
    topic,
    relevanceScore,
    extractedAt: new Date().toISOString(),
    charCount: text.length,
    isDuplicate,
    text
  };

  if (saveInsight && !isDuplicate) {
    fs.writeFileSync(pulsePath, JSON.stringify(insight, null, 2), 'utf8');
  }

  return {
    url,
    topic,
    relevanceScore,
    charCount: text.length,
    isDuplicate,
    savedTo: saveInsight && !isDuplicate ? pulsePath : null,
    text: text.slice(0, 500) + (text.length > 500 ? '...' : ''),
    fullTextAvailable: text.length > 500
  };
}

// ─── ROADMAP #7: Tool Self-Registration API ───────────────────────────────────

const REGISTERED_TOOLS_PATH = path.resolve(__dirname, 'artifacts', 'registered-tools.json');
const _dynamicHandlers = new Map(); // name → handler function
const _loadedPacks = new Map();     // packId → { id, name, version, toolNames[] }

function _loadRegisteredTools() {
  if (!fs.existsSync(REGISTERED_TOOLS_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(REGISTERED_TOOLS_PATH, 'utf8')); }
  catch (_) { return []; }
}

function _saveRegisteredTools(tools) {
  const dir = path.dirname(REGISTERED_TOOLS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(REGISTERED_TOOLS_PATH, JSON.stringify(tools, null, 2), 'utf8');
}

// Boot: load persisted dynamic tools
(function _bootDynamicTools() {
  const saved = _loadRegisteredTools();
  for (const t of saved) {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('args', t.handlerCode);
      _dynamicHandlers.set(t.name, fn);
      if (!TOOLS.find((x) => x.name === t.name)) {
        TOOLS.push({ name: t.name, description: t.description, inputSchema: t.inputSchema || {} });
      }
    } catch (_) { /* skip broken saved tools */ }
  }
})();

function registerTool(args) {
  const name        = args.name;
  const description = args.description;
  const schema      = args.inputSchema || { type: 'object', properties: {}, additionalProperties: true };
  const handlerCode = args.handlerCode;
  const packId      = args.packId || null;

  if (!name || !/^[a-z][a-z0-9_]*$/.test(name)) {
    throw new Error('Tool name must be snake_case and start with a letter.');
  }
  if (TOOLS.find((t) => t.name === name)) {
    throw new Error(`A tool named "${name}" is already registered.`);
  }

  // Syntax check the handler code by wrapping it in a function
  const wrappedCode = `(function(args) { ${handlerCode} })`;
  try {
    // Use vm module for safer eval — only checks syntax
    const vm = require('vm');
    vm.compileFunction(handlerCode, ['args']);
  } catch (e) {
    throw new Error(`Handler code syntax error: ${e.message}`);
  }

  // Register in memory
  // eslint-disable-next-line no-new-func
  const fn = new Function('args', handlerCode);
  _dynamicHandlers.set(name, fn);
  TOOLS.push({ name, description, inputSchema: schema });

  // Persist
  const saved = _loadRegisteredTools();
  saved.push({ name, description, inputSchema: schema, handlerCode, packId, registeredAt: new Date().toISOString() });
  _saveRegisteredTools(saved);

  return { name, registered: true, packId, totalTools: TOOLS.length };
}

function unregisterTool(args) {
  const name = args.name;
  const idx = TOOLS.findIndex((t) => t.name === name);
  if (idx === -1) throw new Error(`Tool "${name}" not found.`);

  // Check if it's a core tool
  const saved = _loadRegisteredTools();
  const isDynamic = saved.some((t) => t.name === name);
  if (!isDynamic) throw new Error(`Tool "${name}" is a core tool and cannot be unregistered.`);

  TOOLS.splice(idx, 1);
  _dynamicHandlers.delete(name);

  const updated = saved.filter((t) => t.name !== name);
  _saveRegisteredTools(updated);

  return { name, unregistered: true, totalTools: TOOLS.length };
}

// ─── ROADMAP #8: Dependency Graph Execution Engine ───────────────────────────

async function executeDependencyGraph(args) {
  const nodes      = args.nodes || [];
  const edges      = args.edges || [];
  const stopOnErr  = args.stopOnError === true;

  if (nodes.length === 0) throw new Error('nodes array must not be empty');

  // Build adjacency: node id → set of dependency ids
  const deps = new Map(nodes.map((n) => [n.id, new Set()]));
  const rdeps = new Map(nodes.map((n) => [n.id, new Set()])); // reverse: who depends on me

  for (const edge of edges) {
    if (!deps.has(edge.from)) throw new Error(`Edge "from" node "${edge.from}" not found`);
    if (!deps.has(edge.to))   throw new Error(`Edge "to" node "${edge.to}" not found`);
    deps.get(edge.to).add(edge.from);
    rdeps.get(edge.from).add(edge.to);
  }

  // Kahn's topological sort — find execution waves
  const inDegree = new Map(nodes.map((n) => [n.id, deps.get(n.id).size]));
  const waves = [];
  const remaining = new Set(nodes.map((n) => n.id));

  while (remaining.size > 0) {
    const wave = [...remaining].filter((id) => inDegree.get(id) === 0);
    if (wave.length === 0) throw new Error('Cycle detected in dependency graph — cannot execute.');
    waves.push(wave);
    for (const id of wave) {
      remaining.delete(id);
      for (const dependent of rdeps.get(id)) {
        inDegree.set(dependent, inDegree.get(dependent) - 1);
      }
    }
  }

  // Execute waves in order, nodes within a wave in parallel
  const results = {};
  const executionOrder = [];
  const waveTimings = [];
  const startedAt = Date.now();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  for (let waveIdx = 0; waveIdx < waves.length; waveIdx++) {
    const wave = waves[waveIdx];
    executionOrder.push(wave);
    const waveStart = Date.now();
    const waveResults = await Promise.all(wave.map(async (id) => {
      const node = nodeMap.get(id);
      const t0 = Date.now();
      try {
        const result = await runTool(node.toolName, node.args || {});
        return { id, status: 'ok', result, startedAt: t0, endedAt: Date.now(), durationMs: Date.now() - t0 };
      } catch (err) {
        return { id, status: 'error', error: err.message, startedAt: t0, endedAt: Date.now(), durationMs: Date.now() - t0 };
      }
    }));
    const waveEnd = Date.now();
    waveTimings.push({ waveIndex: waveIdx, nodes: wave, durationMs: waveEnd - waveStart });

    for (const wr of waveResults) {
      results[wr.id] = wr;
      if (wr.status === 'error' && stopOnErr) {
        return {
          aborted: true,
          abortedAt: wr.id,
          results,
          executionOrder,
          waves: waveTimings,
          totalMs: Date.now() - startedAt
        };
      }
    }
  }

  return {
    aborted: false,
    nodeCount: nodes.length,
    waveCount: waves.length,
    results,
    executionOrder,
    waves: waveTimings,
    totalMs: Date.now() - startedAt
  };
}

// ─── ROADMAP #9: Skill Pack Runtime ──────────────────────────────────────────

function loadSkillPack(args) {
  const manifestPath = normalizeFsPath(args.manifestPath);
  if (!fs.existsSync(manifestPath)) throw new Error(`Manifest not found: ${manifestPath}`);

  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); }
  catch (e) { throw new Error(`Invalid manifest JSON: ${e.message}`); }

  const { id, name, version, tools } = manifest;
  if (!id)    throw new Error('Manifest missing "id"');
  if (!tools || !Array.isArray(tools)) throw new Error('Manifest missing "tools" array');
  if (_loadedPacks.has(id)) throw new Error(`Skill pack "${id}" is already loaded.`);

  const loadedTools = [];
  const errors = [];

  for (const tool of tools) {
    try {
      registerTool({ ...tool, packId: id });
      loadedTools.push(tool.name);
    } catch (e) {
      errors.push({ tool: tool.name, error: e.message });
    }
  }

  _loadedPacks.set(id, { id, name: name || id, version: version || '0.0.0', toolNames: loadedTools, manifestPath });

  return {
    packId: id,
    packName: name || id,
    version: version || '0.0.0',
    loadedTools,
    errors,
    totalTools: TOOLS.length
  };
}

function listLoadedSkillPacks() {
  const packs = [..._loadedPacks.values()].map((p) => ({
    id: p.id,
    name: p.name,
    version: p.version,
    toolCount: p.toolNames.length,
    toolNames: p.toolNames,
    manifestPath: p.manifestPath
  }));
  return { packCount: packs.length, packs };
}

function unloadSkillPack(args) {
  const id = args.id;
  if (!_loadedPacks.has(id)) throw new Error(`Skill pack "${id}" is not loaded.`);

  const pack = _loadedPacks.get(id);
  const unloaded = [];
  const errors = [];

  for (const toolName of pack.toolNames) {
    try {
      unregisterTool({ name: toolName });
      unloaded.push(toolName);
    } catch (e) {
      errors.push({ tool: toolName, error: e.message });
    }
  }

  _loadedPacks.delete(id);
  return { packId: id, unloaded, errors, totalTools: TOOLS.length };
}

// ─── ROADMAP #10: Multi-Server Orchestration Hub ─────────────────────────────

const _childServers = new Map(); // serverId → { process, port, label, path }

// ─── Per-tool latency histogram (rolling 100 samples) ─────────────────────────
// _toolMetrics: name → { calls: number, samples: number[], callsIn progress: number }
const _toolMetrics = new Map();
const LATENCY_WINDOW = 100; // keep last N samples per tool

function _recordToolLatency(toolName, durationMs) {
  let m = _toolMetrics.get(toolName);
  if (!m) { m = { calls: 0, samples: [] }; _toolMetrics.set(toolName, m); }
  m.calls++;
  m.samples.push(durationMs);
  if (m.samples.length > LATENCY_WINDOW) m.samples.shift();
}

function _percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.max(0, Math.ceil(sorted.length * p) - 1);
  return sorted[idx];
}

function _getLatencyStats(topN = 5) {
  const entries = [];
  for (const [name, m] of _toolMetrics) {
    if (m.samples.length === 0) continue;
    const sorted = [...m.samples].sort((a, b) => a - b);
    entries.push({
      tool:    name,
      calls:   m.calls,
      p50:     _percentile(sorted, 0.5),
      p95:     _percentile(sorted, 0.95),
      p99:     _percentile(sorted, 0.99),
      samples: m.samples.length,
    });
  }
  // Sort by total calls desc, return top N
  return entries.sort((a, b) => b.calls - a.calls).slice(0, topN);
}


function getToolMetrics(args) {
  const topN = Math.min(75, Number.isFinite(args && args.topN) ? args.topN : 10);
  const stats = _getLatencyStats(topN);
  return {
    topN,
    totalToolsTracked: _toolMetrics.size,
    latency:           stats,
    collectedAt:       new Date().toISOString(),
  };
}

function explainTool(args) {
  const toolName = args.toolName;
  const tool = TOOLS.find(t => t.name === toolName);
  if (!tool) {
    const names = TOOLS.map(t => t.name).sort();
    throw new Error(`Unknown tool: "${toolName}". Available (${TOOLS.length}): ${names.join(', ')}`);
  }

  const schema   = tool.inputSchema || {};
  const props    = schema.properties || {};
  const required = new Set(schema.required || []);

  const params = Object.entries(props).map(([k, v]) => ({
    name:        k,
    type:        v.type || 'any',
    required:    required.has(k),
    description: v.description || '',
    ...(v.enum   ? { enum: v.enum }   : {}),
    ...(v.default !== undefined ? { default: v.default } : {}),
  }));

  // Build a minimal usage example using required params
  const exampleArgs = {};
  for (const p of params) {
    if (!p.required) continue;
    exampleArgs[p.name] = p.type === 'number' ? 0 : p.type === 'boolean' ? false : `<${p.name}>`;
  }

  return {
    name:        tool.name,
    description: tool.description,
    params,
    requiredParams:  params.filter(p => p.required).map(p => p.name),
    optionalParams:  params.filter(p => !p.required).map(p => p.name),
    usageExample: { toolName: tool.name, args: exampleArgs },
  };
}

function exportToolCatalog(args) {
  const format        = (args && args.format)        || 'markdown';
  const includeSchema = (args && args.includeSchema) === true;

  const catalog = TOOLS.map(t => {
    const entry = {
      name:        t.name,
      description: t.description,
    };
    if (includeSchema) entry.inputSchema = t.inputSchema || {};
    return entry;
  });

  if (format === 'json') {
    return { format: 'json', toolCount: catalog.length, tools: catalog, exportedAt: new Date().toISOString() };
  }

  // Markdown format
  const lines = [
    `# MCP Tool Catalog — agent-ops-hub`,
    ``,
    `**${catalog.length} tools** · Exported ${new Date().toISOString()}`,
    ``,
  ];
  for (const t of catalog) {
    lines.push(`## \`${t.name}\``);
    lines.push(`${t.description}`);
    if (includeSchema && t.inputSchema) {
      lines.push('');
      lines.push('```json');
      lines.push(JSON.stringify(t.inputSchema, null, 2));
      lines.push('```');
    }
    lines.push('');
  }
  return { format: 'markdown', toolCount: catalog.length, markdown: lines.join('\n'), exportedAt: new Date().toISOString() };
}

async function runEvalLoop(args) {
  const toolName   = args.toolName;
  const testCases  = Array.isArray(args.testCases) ? args.testCases : [];
  const iterations = Math.min(20, Math.max(1, Number.isFinite(args.iterations) ? args.iterations : 3));
  const stopOnFail = args.stopOnFail === true;

  if (testCases.length === 0) throw new Error('testCases must be a non-empty array');
  if (!TOOLS.find(t => t.name === toolName) && !_dynamicHandlers.has(toolName)) {
    throw new Error(`Unknown tool: "${toolName}"`);
  }

  const caseResults = testCases.map(tc => ({ args: tc.args || {}, expectKey: tc.expectKey, expectValue: tc.expectValue, pass: 0, fail: 0, latencies: [] }));
  let totalPass = 0, totalFail = 0;
  let aborted = false;

  for (let iter = 0; iter < iterations && !aborted; iter++) {
    for (let ci = 0; ci < testCases.length && !aborted; ci++) {
      const tc = caseResults[ci];
      const t0 = Date.now();
      try {
        const result = await runTool(toolName, tc.args);
        const ok = tc.expectKey
          ? (result && String(result[tc.expectKey]) === String(tc.expectValue))
          : true;
        if (ok) { tc.pass++; totalPass++; }
        else    { tc.fail++; totalFail++; if (stopOnFail) { aborted = true; } }
      } catch (e) {
        tc.fail++; totalFail++;
        if (stopOnFail) { aborted = true; }
      }
      tc.latencies.push(Date.now() - t0);
    }
  }

  const report = caseResults.map((tc, i) => {
    const sorted = [...tc.latencies].sort((a, b) => a - b);
    return {
      caseIndex: i,
      args:      tc.args,
      pass:      tc.pass,
      fail:      tc.fail,
      passRate:  Math.round(tc.pass / Math.max(1, tc.pass + tc.fail) * 100),
      p50:       _percentile(sorted, 0.5),
      p95:       _percentile(sorted, 0.95),
    };
  });

  const overallPassRate = Math.round(totalPass / Math.max(1, totalPass + totalFail) * 100);
  return {
    toolName,
    iterations,
    testCaseCount: testCases.length,
    totalRuns:     totalPass + totalFail,
    totalPass,
    totalFail,
    overallPassRate,
    aborted,
    cases:         report,
    ranAt:         new Date().toISOString(),
  };
}

async function replayLastSprint(args) {
  const sprintId           = args && args.sprintId;
  const specialistFilter   = Array.isArray(args && args.specialistFilter) ? args.specialistFilter : null;
  const compareWithOriginal = (args && args.compareWithOriginal) !== false; // default true

  // Find saved sprint log
  const sprintLogDir = path.join(__dirname, 'logs', 'specialist-runs');
  if (!fs.existsSync(sprintLogDir)) throw new Error(`Sprint log dir not found: ${sprintLogDir}`);

  // Collect all sprint log files
  const allFiles = [];
  for (const dateDir of fs.readdirSync(sprintLogDir)) {
    const datePath = path.join(sprintLogDir, dateDir);
    if (!fs.statSync(datePath).isDirectory()) continue;
    for (const f of fs.readdirSync(datePath)) {
      if (f.endsWith('.json')) allFiles.push(path.join(datePath, f));
    }
  }
  if (allFiles.length === 0) throw new Error('No sprint logs found to replay');

  // Find target log
  let targetFile;
  if (sprintId) {
    targetFile = allFiles.find(f => f.includes(sprintId));
    if (!targetFile) throw new Error(`Sprint log not found for sprintId: "${sprintId}"`);
  } else {
    // Most recent by mtime
    allFiles.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    targetFile = allFiles[0];
  }

  const originalLog = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
  const tasks = Array.isArray(originalLog.tasks) ? originalLog.tasks
    : Array.isArray(originalLog.perTaskScores) ? originalLog.perTaskScores
    : [];

  // Filter if needed
  const filteredTasks = specialistFilter
    ? tasks.filter(t => specialistFilter.includes(t.specialistId))
    : tasks;

  if (filteredTasks.length === 0) throw new Error('No matching tasks after filter');

  // Re-dispatch each task
  const replayOutputs = await Promise.all(filteredTasks.map(async (t) => {
    const fresh = dispatchSpecialistTask({
      specialistId: t.specialistId,
      taskTitle:    t.taskTitle || t.title,
      taskContext:  t.taskContext || t.context || '',
      outputFormat: t.outputFormat || 'markdown',
    });
    return {
      specialistId:   t.specialistId,
      taskTitle:      fresh.taskTitle,
      fresh:          { systemPrompt: fresh.systemPrompt, taskPrompt: fresh.taskPrompt, confidence: fresh.confidence },
      original:       compareWithOriginal ? (t.result || t.output || null) : undefined,
    };
  }));

  return {
    replayedSprintId:  originalLog.sprintId || path.basename(targetFile, '.json'),
    sourceFile:        targetFile,
    tasksReplayed:     replayOutputs.length,
    outputs:           replayOutputs,
    replayedAt:        new Date().toISOString(),
  };
}

async function runAiBenchmark(args) {
  const saveResults     = args && args.saveResults !== false;
  const categoryFilter  = Array.isArray(args && args.categories) ? args.categories : null;

  const LOGS_DIR  = path.join(__dirname, 'tests', 'logs');
  const BENCH_LOG = path.join(LOGS_DIR, 'ai-benchmarks.json');
  const LATEST    = path.join(LOGS_DIR, 'latest_ai_benchmark.json');

  // Helper: call a tool via the in-process handleTool
  async function localTool(name, toolArgs) {
    try {
      const result = await handleTool(name, toolArgs || {});
      const text = result && result.content && result.content[0] && result.content[0].text;
      return text ? JSON.parse(text) : result;
    } catch (e) {
      return { __error: e.message };
    }
  }

  const results = {};

  // ── 1. tool_accuracy ──────────────────────────────────────────────────────
  if (!categoryFilter || categoryFilter.includes('tool_accuracy')) {
    const checks = [];
    const checkTool = async (toolName, validator) => {
      try {
        const t0 = Date.now();
        const r = await localTool(toolName, {});
        const ms = Date.now() - t0;
        const ok = !r.__error && validator(r);
        checks.push({ tool: toolName, ok, ms, detail: r.__error || (ok ? 'ok' : 'bad shape') });
      } catch (e) {
        checks.push({ tool: toolName, ok: false, detail: e.message });
      }
    };

    await checkTool('export_tool_catalog', r => typeof r === 'object' && !r.__error);
    await checkTool('get_memory', r => typeof r === 'object');
    await checkTool('get_tool_metrics', r => typeof r === 'object' && !r.__error);
    await checkTool('list_loaded_skill_packs', r => typeof r === 'object' && !r.__error);
    await checkTool('get_autonomous_loop_state', r => typeof r === 'object');

    const passed = checks.filter(c => c.ok).length;
    results.tool_accuracy = {
      score:   Math.round((passed / checks.length) * 100),
      passed,
      total:   checks.length,
      checks,
    };
  }

  // ── 2. test_suite_health ──────────────────────────────────────────────────
  if (!categoryFilter || categoryFilter.includes('test_suite_health')) {
    const logPath = path.join(LOGS_DIR, 'latest_ai.json');
    if (!fs.existsSync(logPath)) {
      results.test_suite_health = { score: 0, detail: 'No test log found', passRate: 0 };
    } else {
      try {
        const raw  = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        const s    = raw.summary || {};
        const rate = s.total > 0 ? s.passed / s.total : 0;
        results.test_suite_health = {
          score:     Math.round(rate * 100),
          passRate:  Math.round(rate * 100),
          passed:    s.passed || 0,
          total:     s.total  || 0,
          failed:    s.failed || 0,
          timestamp: raw.timestamp,
        };
      } catch (e) {
        results.test_suite_health = { score: 0, detail: 'Parse error: ' + e.message, passRate: 0 };
      }
    }
  }

  // ── 3. sprint_output_quality ──────────────────────────────────────────────
  if (!categoryFilter || categoryFilter.includes('sprint_output_quality')) {
    try {
      const hist = await localTool('get_sprint_quality_trend', {});
      const sprints = Array.isArray(hist) ? hist : (hist && hist.trend ? hist.trend : (hist && hist.sprints ? hist.sprints : []));
      const scores = sprints
        .map(s => {
          if (typeof s.avgScore === 'number') return s.avgScore;
          if (typeof s.score   === 'number') return s.score;
          const gradeMap = { 'A+':100, A:95, 'A-':90, 'B+':87, B:83, 'B-':80, 'C+':77, C:73, 'C-':70 };
          return gradeMap[s.grade] || null;
        })
        .filter(v => v !== null);

      if (scores.length === 0) {
        results.sprint_output_quality = { score: 50, detail: 'No scored sprints found', sprintCount: sprints.length };
      } else {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        results.sprint_output_quality = {
          score:        Math.round(avg),
          avgScore:     Math.round(avg * 10) / 10,
          sprintCount:  sprints.length,
          scoredSprints: scores.length,
        };
      }
    } catch (e) {
      results.sprint_output_quality = { score: 0, detail: e.message };
    }
  }

  // ── 4. api_availability ───────────────────────────────────────────────────
  if (!categoryFilter || categoryFilter.includes('api_availability')) {
    const HUB_PORT = HTTP_PORT;
    const endpoints = [
      { path: '/health', expectedStatus: 200 },
      { path: '/api/test-results', expectedStatus: 200 },
      { path: '/events/recent', expectedStatus: 200 },
      { path: '/', expectedStatus: 200 },
    ];
    const checks = [];
    for (const ep of endpoints) {
      await new Promise((resolve) => {
        const req = require('http').request(
          { hostname: '127.0.0.1', port: HUB_PORT, path: ep.path, method: 'GET' },
          (res) => { res.resume(); checks.push({ path: ep.path, ok: res.statusCode === ep.expectedStatus, statusCode: res.statusCode }); resolve(); }
        );
        req.on('error', (e) => { checks.push({ path: ep.path, ok: false, error: e.message }); resolve(); });
        req.setTimeout(5000, () => { req.destroy(); checks.push({ path: ep.path, ok: false, error: 'timeout' }); resolve(); });
        req.end();
      });
    }
    const passed = checks.filter(c => c.ok).length;
    results.api_availability = {
      score:    Math.round((passed / checks.length) * 100),
      passed,
      total:    checks.length,
      endpoints: checks,
    };
  }

  // ── 5. response_latency ───────────────────────────────────────────────────
  if (!categoryFilter || categoryFilter.includes('response_latency')) {
    const trials = [];
    for (const toolName of ['export_tool_catalog', 'get_memory', 'get_tool_metrics']) {
      const t0 = Date.now();
      try {
        await localTool(toolName, {});
        trials.push({ tool: toolName, ms: Date.now() - t0 });
      } catch (e) {
        trials.push({ tool: toolName, ms: null, error: e.message });
      }
    }
    const valid = trials.filter(t => t.ms !== null);
    if (valid.length === 0) {
      results.response_latency = { score: 0, detail: 'All latency checks failed', trials };
    } else {
      const avg = valid.reduce((a, b) => a + b.ms, 0) / valid.length;
      const latencyScore =
        avg <= 100 ? 100 : avg <= 300 ? 90 : avg <= 500 ? 75 :
        avg <= 1000 ? 60 : avg <= 2000 ? 40 : 20;
      results.response_latency = { score: latencyScore, avgMs: Math.round(avg), maxMs: Math.max(...valid.map(t => t.ms)), trials };
    }
  }

  // ── Compute overall ───────────────────────────────────────────────────────
  const catScores = Object.values(results).map(c => c.score);
  const overall   = catScores.length ? Math.round(catScores.reduce((a, b) => a + b, 0) / catScores.length) : 0;
  const grade     = overall >= 95 ? 'A+' : overall >= 90 ? 'A'  : overall >= 85 ? 'A-' :
                    overall >= 80 ? 'B+' : overall >= 75 ? 'B'  : overall >= 70 ? 'B-' :
                    overall >= 65 ? 'C+' : overall >= 60 ? 'C'  : 'D';

  const record = {
    timestamp:  new Date().toISOString(),
    model:      'Claude Sonnet 4.6',
    version:    '1.0',
    overall,
    grade,
    scores:     Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.score])),
    categories: results,
  };

  // ── Persist ───────────────────────────────────────────────────────────────
  if (saveResults) {
    if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
    let history = [];
    if (fs.existsSync(BENCH_LOG)) { try { history = JSON.parse(fs.readFileSync(BENCH_LOG, 'utf8')); } catch { history = []; } }
    history.push(record);
    fs.writeFileSync(BENCH_LOG, JSON.stringify(history, null, 2));
    fs.writeFileSync(LATEST, JSON.stringify(record, null, 2));
  }

  return record;
}

async function listAvailableServers(args) {
  const rootPath = normalizeFsPath(args && args.rootPath ? args.rootPath : 'C:\\Users\\justi\\mcp-servers');
  const checkHealth = args && args.checkHealth !== false;

  if (!fs.existsSync(rootPath)) {
    throw new Error(`rootPath not found: ${rootPath}`);
  }

  const entries = fs.readdirSync(rootPath, { withFileTypes: true });
  const servers = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const serverDir  = path.join(rootPath, entry.name);
    const mcpFile    = path.join(serverDir, 'mcp-server.js');
    const pkgFile    = path.join(serverDir, 'package.json');
    if (!fs.existsSync(mcpFile)) continue;

    let meta = { name: entry.name, version: 'unknown', port: null };
    if (fs.existsSync(pkgFile)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
        meta.name    = pkg.name || entry.name;
        meta.version = pkg.version || 'unknown';
        // Try to read port from source
        const src = fs.readFileSync(mcpFile, 'utf8');
        const portMatch = src.match(/HTTP_PORT\s*=\s*(\d+)/) || src.match(/port:\s*(\d+)/);
        if (portMatch) meta.port = parseInt(portMatch[1], 10);
      } catch (_) {}
    }

    let health = null;
    if (checkHealth && meta.port) {
      health = await new Promise((resolve) => {
        const req = require('http').get(
          `http://127.0.0.1:${meta.port}/health`,
          { timeout: 2000 },
          (res) => {
            let d = '';
            res.on('data', (c) => { d += c; });
            res.on('end', () => {
              try { resolve(JSON.parse(d)); }
              catch (_) { resolve({ status: 'parse_error' }); }
            });
          }
        );
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
      });
    }

    servers.push({
      id:       entry.name,
      name:     meta.name,
      version:  meta.version,
      path:     serverDir,
      port:     meta.port,
      running:  health !== null,
      health
    });
  }

  return {
    rootPath,
    serverCount: servers.length,
    runningCount: servers.filter((s) => s.running).length,
    servers
  };
}

async function delegateToServer(args) {
  const serverUrl = args.serverUrl.replace(/\/$/, '');
  const toolName  = args.toolName;
  const toolArgs  = args.args || {};
  const timeoutMs = Number.isFinite(args.timeoutMs) ? args.timeoutMs : 30000;
  const maxRetries = Number.isFinite(args.retries) ? Math.max(0, Math.min(args.retries, 5)) : 0;

  const body = JSON.stringify({
    jsonrpc: '2.0',
    id:      1,
    method:  'tools/call',
    params:  { name: toolName, arguments: toolArgs }
  });

  const attemptOnce = () => new Promise((resolve, reject) => {
    const url = new URL(`${serverUrl}/mcp`);
    const mod = url.protocol === 'https:' ? require('https') : require('http');
    const to  = setTimeout(() => reject(new Error(`Delegate timeout after ${timeoutMs}ms`)), timeoutMs);

    const req = mod.request({
      hostname: url.hostname,
      port:     parseInt(url.port, 10),
      path:     url.pathname,
      method:   'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        clearTimeout(to);
        try { resolve(JSON.parse(d)); }
        catch (e) { reject(new Error(`Bad JSON from peer: ${e.message}`)); }
      });
    });
    req.on('error', (e) => { clearTimeout(to); reject(e); });
    req.write(body);
    req.end();
  });

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await attemptOnce();
      if (result.error) throw new Error(`Peer error: ${JSON.stringify(result.error)}`);
      return {
        serverUrl,
        toolName,
        result:    result.result,
        attempt:   attempt + 1,
        delegatedAt: new Date().toISOString()
      };
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        // brief back-off: 200ms * (attempt+1)
        await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

async function spawnChildServer(args) {
  const serverPath   = normalizeFsPath(args.serverPath);
  const port         = args.port || null;
  const label        = args.label || path.basename(serverPath);
  const waitForReady = args.waitForReady === true;
  const readyTimeoutMs = Number.isFinite(args.readyTimeoutMs) ? args.readyTimeoutMs : 5000;

  if (!fs.existsSync(path.join(serverPath, 'mcp-server.js'))) {
    throw new Error(`mcp-server.js not found in: ${serverPath}`);
  }

  // Enforce child server limit to prevent resource exhaustion
  const MAX_CHILD_SERVERS = Number.isFinite(parseInt(process.env.MAX_CHILD_SERVERS))
    ? parseInt(process.env.MAX_CHILD_SERVERS) : 5;
  if (_childServers.size >= MAX_CHILD_SERVERS) {
    throw new Error(`Child server limit reached (${MAX_CHILD_SERVERS}). Stop an existing child server before spawning a new one.`);
  }

  const env = { ...process.env };
  if (port) env.HTTP_PORT = String(port);

  const child = require('child_process').spawn('node', ['mcp-server.js'], {
    cwd:   serverPath,
    env,
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const serverId = `child-${Date.now()}-${child.pid}`;
  _childServers.set(serverId, { process: child, port, label, path: serverPath, pid: child.pid, startedAt: new Date().toISOString() });

  child.on('exit', () => { _childServers.delete(serverId); });

  // Optionally wait until the child's HTTP health endpoint responds
  let readyMs = null;
  if (waitForReady && port) {
    const http = require('http');
    const deadline = Date.now() + readyTimeoutMs;
    let ready = false;
    while (Date.now() < deadline) {
      try {
        await new Promise((resolve) => {
          const req = http.get(`http://127.0.0.1:${port}/health`, (res) => { ready = res.statusCode < 500; res.resume(); resolve(); });
          req.on('error', () => resolve());
          req.setTimeout(300, () => { req.destroy(); resolve(); });
        });
        if (ready) { readyMs = Date.now() - (deadline - readyTimeoutMs); break; }
      } catch (_) { /* keep polling */ }
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return {
    serverId,
    pid:     child.pid,
    port,
    label,
    serverPath,
    ready:   readyMs !== null ? true : (waitForReady ? false : null),
    readyMs,
    message: `Child server spawned (PID ${child.pid}). Use delegate_to_server with the correct port to call tools.`
  };
}

function stopChildServer(args) {
  const serverId = args.serverId;
  const entry = _childServers.get(serverId);
  // If not in map, the child already exited — treat as already-stopped (idempotent)
  if (!entry) {
    // Only error if it looks like a totally unknown/fake id (no child- prefix)
    if (!serverId || !serverId.startsWith('child-')) {
      throw new Error(`No child server found with id: ${serverId}`);
    }
    return { serverId, stopped: true, alreadyExited: true };
  }

  try { entry.process.kill('SIGTERM'); }
  catch (e) { throw new Error(`Failed to stop child server: ${e.message}`); }

  _childServers.delete(serverId);
  return { serverId, stopped: true, pid: entry.pid, label: entry.label };
}

function buildPromptText(name, args) {
  if (name === 'agent_ops_workflow') {
    const goal = args.goal || 'your current task';
    return `You are using agent-ops-hub, an MCP server for orchestrating complex agent operations.

Goal: ${goal}

Recommended workflow:
1. Run \`agent_mode_preflight\` to verify the environment is ready (node, npm, MCP root accessible).
2. Use \`list_local_mcp_servers\` to inventory available MCP servers.
3. Use \`agent_task_planner\` to break your goal into ordered steps.
4. For each step: use \`run_validation_gate\` to execute and verify commands.
5. Use \`summarize_test_artifacts\` after test runs to get a machine-readable summary.
6. Use \`roadmap_tracker\` to record progress and update task statuses.
7. At the end: use \`generate_changelog_entry\` and \`write_release_notes\` to document what changed.

Key tools available: agent_mode_preflight, agent_task_planner, run_validation_gate, benchmark_validation_gate, roadmap_tracker, scan_tool_coverage, find_missing_tests, generate_changelog_entry, write_release_notes, server_capability_matrix, dependency_audit.`;
  }

  if (name === 'validation_strategy') {
    const serverName = args.serverName || 'your MCP server';
    return `Validation strategy for ${serverName}:

1. Syntax check first: \`node --check mcp-server.js\` — catches all parse errors instantly.
2. Smoke test: run the fastest test group (e.g. group-a-capabilities) to confirm tools/list works.
3. Full gate: run all test groups via \`run_validation_gate\` with commands like:
   - \`{ command: "node --check mcp-server.js", severity: "error" }\`
   - \`{ command: "node tests/smoke.js", severity: "error" }\`
   - \`{ command: "node tests/run-all.js", severity: "warn" }\`
4. Severity guidance: use \`error\` for blockers (syntax, tool list failures), \`warn\` for non-fatal issues.
5. Use \`benchmark_validation_gate\` to establish a performance baseline before refactoring.
6. After any major change: use \`scan_tool_coverage\` and \`find_missing_tests\` to maintain test parity.
7. Tag passing results with \`tag_test_results\` before a release so you have a known-good baseline.`;
  }

    if (name === 'specialist_team_blueprint') {
     const goal = args.goal || 'build and evolve a complex software product';
     const teamSize = args.teamSize || '12';
     return `Specialist team blueprint for: ${goal}

  1. Generate your role pool:
    - Run \`generate_specialist_agent_roster\` to pull from the 40-role catalog.
    - Start with 8-15 active specialists (requested: ${teamSize}) and keep the rest as on-demand experts.

  2. Build execution pods:
    - Run \`plan_specialist_assignments\` with your goal and key workstreams.
    - Keep each pod small: 1 lead, 2-3 support specialists, 1 cross-reviewer.

  3. Enable concurrent collaboration:
    - Run \`build_collaboration_schedule\` with \`maxParallelPods\` set to 2-4.
    - Work in waves: discovery -> implement -> validate.

  4. Keep quality always-on:
    - Attach quality/security reviewers to every pod.
    - Run validation gates per wave boundary.

  5. Continuous improvement loop:
    - After each wave, update roadmap progress and rerun assignment planning for remaining work.
    - Keep a rotating bug-hunter and UX specialist active for feedback-driven refinement.

  This creates a software-company style operating model: domain experts collaborating in parallel pods with structured handoffs and always-on validation.`;
    }

  if (name === 'release_prep_checklist') {
    const serverDir = args.serverDir || '/path/to/server';
    const version   = args.version   || 'vX.Y.Z';
    return `Release preparation checklist for ${version} in ${serverDir}:

[ ] 1. Run full test suite: \`node tests/run-all.js\` — must be 100% pass.
[ ] 2. Syntax check: \`node --check mcp-server.js\` — must exit 0.
[ ] 3. Dependency audit: \`npm outdated\` — review and update critical packages.
[ ] 4. Update version in package.json to ${version}.
[ ] 5. Update version string in mcp-server.js \`serverInfo.version\`.
[ ] 6. Run \`generate_changelog_entry\` to draft the changelog.
[ ] 7. Run \`write_release_notes\` and save to RELEASE_NOTES.md.
[ ] 8. Commit: \`git add -A && git commit -m "${version}: <description>"\`.
[ ] 9. Tag: \`git tag ${version} && git push && git push --tags\`.
[ ] 10. Tag test results with \`tag_test_results\` label="${version}" as post-release baseline.
[ ] 11. Verify the server passes \`check_server_health\` after release commit.`;
  }

  if (name === 'multi_repo_ops_playbook') {
    const reposRoot = args.reposRoot || '/path/to/mcp-servers';
    const goal = args.goal || 'synchronize, validate, and release all repos';
    return `Multi-repo operations playbook
Goal: ${goal}
Repos root: ${reposRoot}

## Phase 1 — Inventory & Drift Check
1. Run \`list_local_mcp_servers\` with rootPath="${reposRoot}" to get the full repo inventory.
2. For each repo, run \`drift_detection_check\` to identify uncommitted changes, remote divergence, and stale deps.
3. Run \`multi_repo_sync_status\` with rootPath="${reposRoot}" for a summary table.
4. Triage findings: repos with 'critical' or 'high' severity drift are addressed first.

## Phase 2 — Parallel Work
5. Group repos by risk level (from drift check) into work waves.
6. For each repo needing changes:
   a. Run \`code_complexity_scan\` on the main server file to identify hotspots.
   b. Run \`estimate_refactor_risk\` to decide if changes are safe to make now.
   c. Make changes; run \`run_validation_gate\` after each change.

## Phase 3 — Testing
7. For each repo: run \`node tests/run-all.js\` — all must pass before proceeding.
8. Use \`regression_root_cause_analysis\` on any test failures to classify and fix quickly.

## Phase 4 — Changelog & Release
9. Run \`generate_changelog\` for each repo to produce release notes.
10. Bump version in package.json for each changed repo.
11. Commit and push all repos. Optionally tag milestone repos.

## Phase 5 — Post-Release Verification
12. Re-run \`multi_repo_sync_status\` — all repos should show clean/synced state.
13. Archive test logs and changelog artifacts.
14. Record a research pulse (\`record_research_pulse\`) with learnings from this release cycle.`;
  }

  if (name === 'multi_repo_ops_playbook') {
    const reposRoot = args.reposRoot || '/path/to/mcp-servers';
    const goal = args.goal || 'synchronize, validate, and release all repos';
    return `Multi-repo operations playbook
Goal: ${goal}
Repos root: ${reposRoot}

## Phase 1 — Inventory & Drift Check
1. Run \`list_local_mcp_servers\` with rootPath="${reposRoot}" to get the full repo inventory.
2. For each repo, run \`drift_detection_check\` to identify uncommitted changes, remote divergence, and stale deps.
3. Run \`multi_repo_sync_status\` with rootPath="${reposRoot}" for a summary table.
4. Triage findings: repos with 'critical' or 'high' severity drift are addressed first.

## Phase 2 — Parallel Work
5. Group repos by risk level (from drift check) into work waves.
6. For each repo needing changes:
   a. Run \`code_complexity_scan\` on the main server file to identify hotspots.
   b. Run \`estimate_refactor_risk\` to decide if changes are safe to make now.
   c. Make changes; run \`run_validation_gate\` after each change.

## Phase 3 — Testing
7. For each repo: run \`node tests/run-all.js\` — all must pass before proceeding.
8. Use \`regression_root_cause_analysis\` on any test failures to classify and fix quickly.

## Phase 4 — Changelog & Release
9. Run \`generate_changelog\` for each repo to produce release notes.
10. Bump version in package.json for each changed repo.
11. Commit and push all repos. Optionally tag milestone repos.

## Phase 5 — Post-Release Verification
12. Re-run \`multi_repo_sync_status\` — all repos should show clean/synced state.
13. Archive test logs and changelog artifacts.
14. Record a research pulse (\`record_research_pulse\`) with learnings from this release cycle.`;
  }

  // ── P: Specialist Execution Prompt Text Handlers ─────────────────────────

  if (name === 'specialist_sprint_briefing') {
    const sprintGoal     = args.sprintGoal || 'improve system quality';
    const specialists    = args.specialistList || 'all assigned specialists';
    const outputFormat   = args.outputFormat || 'markdown';
    return `SPRINT BRIEFING — AI Orchestrator Directive

GOAL: ${sprintGoal}
SPECIALISTS DISPATCHED: ${specialists}
REQUIRED OUTPUT FORMAT: ${outputFormat}

EXECUTION CONTRACT:
- Each specialist operates independently within their domain. Do not wait for other specialists.
- Produce outputs matching the assigned outputFormat exactly.
- Be specific. Every claim must be backed by a concrete recommendation or evidence.
- Flag blockers immediately as "BLOCKER: <description>" at the top of your output.
- Do not summarize the task back — proceed directly to expert output.
- Your output will be scored on: specificity (25), actionability (25), coverage (25), clarity (25).

ROUTING: Run \`dispatch_specialist_task\` per specialist ID listed above.
PARALLEL EXECUTION: Run \`run_parallel_specialist_sprint\` with all tasks for simultaneous dispatch.
EVALUATION: After all outputs collected, run \`evaluate_sprint_output\` with sprintId.
SYNTHESIS: Run \`synthesize_sprint_outputs\` to produce final merged deliverable.
LOG: Run \`specialist_work_log\` with action=write to persist evidence.`;
  }

  if (name === 'code_review_specialist') {
    const codeContext = args.codeContext || '[paste code or describe module here]';
    const language    = args.language || 'JavaScript';
    return `ROLE: Senior Code Review Specialist — ${language}
DOMAIN: code quality, maintainability, correctness, security hygiene

CODE TO REVIEW:
${codeContext}

REVIEW PROTOCOL:
1. SOLID violations — identify any single-responsibility, open-closed, or dependency inversion violations
2. DRY violations — flag duplicated logic that should be extracted
3. YAGNI violations — flag speculative complexity with no clear current use case
4. Bug risk — identify off-by-one errors, null dereferences, race conditions, uncaught exceptions
5. Security anti-patterns — hardcoded secrets, unsanitized inputs, overly permissive access
6. Naming & readability — misleading names, deeply nested conditionals, magic numbers
7. Test coverage gaps — what is not currently tested that should be

OUTPUT FORMAT:
## Summary
## Critical Findings (severity: critical | high | medium | low)
Each finding: [SEVERITY] [CATEGORY] Description → Recommended fix
## Quick Wins (< 30 min each)
## Longer Refactors (> 30 min, estimate effort)`;
  }

  if (name === 'security_audit_specialist') {
    const target  = args.target  || '[endpoint, module, or feature area]';
    const context = args.context || '[paste relevant code, config, or architecture notes]';
    return `ROLE: Security Audit Specialist
DOMAIN: OWASP Top 10, threat modeling, auth/authz, secret hygiene, injection risks

AUDIT TARGET: ${target}

CONTEXT:
${context}

AUDIT PROTOCOL (OWASP Top 10 scan):
1. A01 Broken Access Control — check authz on every route/action, privilege escalation paths
2. A02 Cryptographic Failures — data-at-rest/in-transit encryption, weak algorithms
3. A03 Injection — SQL/NoSQL/cmd injection vectors, unsanitized inputs, template injection
4. A04 Insecure Design — missing rate limiting, lack of defense-in-depth
5. A05 Security Misconfiguration — default creds, verbose error messages, open CORS
6. A06 Vulnerable Components — dependency versions, known CVEs
7. A07 Auth/Session Failures — session fixation, weak tokens, missing MFA
8. A08 Software/Data Integrity — unsigned artifacts, insecure deserialization
9. A09 Logging & Monitoring — missing audit logs, insufficient alerting
10. A10 SSRF — unvalidated outbound URL calls

OUTPUT FORMAT:
## Threat Model Summary
## Findings Table: | Risk | Category | OWASP Ref | Description | Remediation |
## Immediate Actions (patch now)
## Medium-term Hardening (next sprint)`;
  }

  if (name === 'test_strategy_specialist') {
    const feature      = args.feature      || '[feature, module, or system to test]';
    const existingTests = args.existingTests || 'none described';
    return `ROLE: Test Strategy Specialist
DOMAIN: TDD, risk-based coverage, edge cases, chaos injection

FEATURE TO TEST: ${feature}
EXISTING TEST COVERAGE: ${existingTests}

TEST STRATEGY PROTOCOL:
1. Identify the 3 most critical behaviors — what absolutely must not break
2. Unit tests: one test per public function, pure/isolated, no network/FS
3. Integration tests: module boundary interactions, ordered state transitions
4. E2E tests: full-flow happy path + 1 critical failure path
5. Edge cases: empty input, max input, concurrent calls, null/undefined
6. Chaos injection: network timeout, DB unavailable, malformed response, disk full
7. Performance baseline: define acceptable response-time threshold for each critical path

OUTPUT FORMAT:
## Coverage Map: | Layer | What to Test | Priority | Edge Cases |
## Test Cases (numbered): Name → Input → Expected Output → Pass Criterion
## Gaps in Existing Coverage
## Recommended Test Execution Order
## Acceptance: sprint is done when [specific coverage target met]`;
  }

  if (name === 'architecture_review_specialist') {
    const systemDescription = args.systemDescription || '[describe system, components, and service boundaries]';
    const concerns          = args.concerns          || 'general architectural quality';
    return `ROLE: Architecture Review Specialist
DOMAIN: system design, coupling/cohesion, scalability, consistency of decisions

SYSTEM DESCRIPTION:
${systemDescription}

CONCERNS TO EXAMINE: ${concerns}

ARCHITECTURE REVIEW PROTOCOL:
1. Boundary mapping — are service/module responsibilities cleanly separated?
2. Coupling analysis — which modules are tightly coupled? What breaks if X changes?
3. Cohesion — do modules do one thing well, or are they grab-bags of unrelated logic?
4. Scalability ceiling — where does this design break under 10x or 100x load?
5. Consistency of decisions — are similar problems solved the same way everywhere?
6. Data flow integrity — is data transformation predictable and traceable end-to-end?
7. Failure modes — what happens when each component fails? Is it graceful?

OUTPUT FORMAT:
## Architecture Summary (current state)
## Findings: | Area | Issue | Severity | Recommendation |
## Architectural Decision Records (ADR) for any significant change recommended:
  ADR-N: Title | Context | Decision | Consequences
## Priority Refactoring Roadmap`;
  }

  if (name === 'performance_specialist') {
    const target   = args.target   || '[system, function, or user flow with performance issue]';
    const symptoms = args.symptoms || 'no symptoms described — run baseline profiling';
    return `ROLE: Performance Specialist
DOMAIN: profiling, Big-O analysis, DB query cost, memory pressure, render blocking

TARGET: ${target}
SYMPTOMS: ${symptoms}

PERFORMANCE ANALYSIS PROTOCOL:
1. Baseline measurement — define the metric (ms p95, RPS, MB heap) before any changes
2. Bottleneck identification — profile first: CPU, memory, I/O, or network?
3. Big-O audit — identify O(n²) or worse operations in hot paths
4. DB query cost — EXPLAIN plan for slow queries, N+1 patterns, missing indexes
5. Memory pressure — identify allocation-heavy loops, retained references, large buffers
6. Render blocking — (frontend) identify blocking scripts, layout thrash, reflow triggers
7. Caching opportunities — what is computed repeatedly that could be memoized?

RULE: Every recommendation requires a before/after measurement criterion.
Format: "Changing X is expected to reduce [metric] from [baseline] to [target]."

OUTPUT FORMAT:
## Bottleneck Report (ranked by impact)
## Measurements Required Before Starting
## Optimization Plan: | Change | Expected Gain | Measurement Criterion | Risk |
## Instrumentation Additions Needed`;
  }

  if (name === 'debugging_specialist') {
    const bugDescription = args.bugDescription || '[what is broken, expected vs actual behavior]';
    const errorOutput    = args.errorOutput    || '[no error output provided]';
    return `ROLE: Debugging Specialist
DOMAIN: root cause analysis, fault isolation, minimal reproduction

BUG DESCRIPTION:
${bugDescription}

ERROR OUTPUT / STACK TRACE:
${errorOutput}

DEBUGGING PROTOCOL:
1. Reproduce first — define exact steps to reproduce before any code changes
2. Bisect the failure — isolate to smallest failing unit: function, line, input
3. Identify the invariant violation — what assumption does the code make that is false?
4. Trace side effects — what else does the broken code touch? Map blast radius.
5. Propose fix — minimal change that restores the broken invariant
6. Verify fix — define exactly how to confirm the bug is resolved (test case or assertion)
7. Regression test — write a test that would have caught this before it reached production

OUTPUT FORMAT:
## Root Cause (one sentence)
## Reproduction Steps (numbered)
## Fault Isolation: | Layer | Component | Status | Evidence |
## Proposed Fix (code diff or pseudocode)
## Verification: "This bug is fixed when [test name] passes with [specific assertion]"
## Regression Test (paste ready-to-run test case)`;
  }

  if (name === 'documentation_specialist') {
    const subject  = args.subject  || '[module, API, feature, or concept to document]';
    const audience = args.audience || 'developer';
    return `ROLE: Documentation Specialist
DOMAIN: API reference, README, inline comments, usage examples, audience-first writing

SUBJECT TO DOCUMENT: ${subject}
TARGET AUDIENCE: ${audience}

DOCUMENTATION PROTOCOL:
1. Purpose statement — one sentence: what does this do and why does it exist?
2. When to use it — concrete conditions that indicate this is the right tool/module
3. When NOT to use it — anti-patterns, wrong use cases, alternatives
4. Quick start — minimal working example (the fastest path to a result)
5. Full reference — every parameter, return value, error condition
6. Examples — 3 examples minimum: basic, intermediate, and edge-case
7. Troubleshooting — top 3 things that go wrong and how to fix them

WRITING RULES:
- Write for a reader who is confused right now.
- No jargon without immediate definition.
- Every claim gets an example.
- Short sentences. Active voice. Present tense.

OUTPUT FORMAT:
## Purpose
## Quick Start (code block)
## Reference: Parameters | Returns | Throws
## Examples (3+)
## Troubleshooting`;
  }

  if (name === 'refactoring_specialist') {
    const codeTarget  = args.codeTarget  || '[code, module, or pattern to refactor]';
    const constraints = args.constraints || 'do not change public API contracts';
    return `ROLE: Refactoring Specialist
DOMAIN: code smell detection, safe incremental refactoring, pattern transformation

CODE TO REFACTOR: ${codeTarget}
CONSTRAINTS (must not change): ${constraints}

REFACTORING PROTOCOL:
1. Smell inventory — identify: long methods, feature envy, primitive obsession, shotgun surgery, god objects
2. Risk assessment — rate each refactoring by: effort (S/M/L), risk (low/med/high), value (1-5)
3. Incremental plan — each step must be independently deployable and testable
4. Pattern selection — choose from: Extract Function/Module, Inline, Move, Replace Conditional with Polymorphism, Strangler Fig
5. Constraint validation — verify each step does not violate: ${constraints}
6. Test checkpoint — define what test must pass after each refactoring step

RULE: No refactoring step changes behavior AND structure simultaneously.
Break behavior changes and structural changes into separate commits.

OUTPUT FORMAT:
## Smell Inventory: | Smell | Location | Severity | Pattern to Apply |
## Refactoring Plan (ordered steps):
  Step N: [Pattern] → What changes → Test checkpoint → Constraint check
## Files/Functions Affected (blast radius)
## Estimated Total Effort
## Rollback Plan`;
  }

  if (name === 'devops_specialist') {
    const deployTarget = args.deployTarget || '[service, config, or infra change to deploy]';
    const environment  = args.environment  || 'Node.js service, Linux, no container orchestration';
    return `ROLE: DevOps Specialist
DOMAIN: CI/CD pipeline design, deployment strategies, monitoring, rollback procedures

DEPLOY TARGET: ${deployTarget}
ENVIRONMENT: ${environment}

DEVOPS PROTOCOL:
1. Deployment strategy selection — evaluate: blue-green, canary, rolling, feature flag, big-bang
2. Pre-deploy checklist — tests passing, secrets rotated, DB migrations validated, rollback plan ready
3. CI/CD pipeline design — stages: lint → test → build → staging deploy → smoke test → prod deploy
4. Health check definition — what endpoint/metric confirms successful deployment?
5. Rollback procedure — exact steps to revert in < 5 minutes if deploy fails
6. Monitoring hookup — what metrics/logs/alerts are added for this change?
7. Post-deploy verification — runbook for first 30 minutes after deployment

RULE: Every deployment plan includes a revert path.
Format: "If [condition], revert by [specific steps], confirmed by [health check]."

OUTPUT FORMAT:
## Deployment Strategy Recommendation + Rationale
## Pre-Deploy Checklist
## CI/CD Pipeline Stages (with gates)
## Rollback Procedure (step-by-step, time-bound)
## Monitoring: | Metric | Alert Threshold | Alert Target |
## Post-Deploy Runbook (first 30 min)`;
  }

    if (name === 'continuous_research_loop') {
     const goal = args.goal || 'continuous MCP server and agent-system improvement';
     const cadence = Number.isFinite(Number(args.cadenceMinutes)) ? Number(args.cadenceMinutes) : 10;
     return `Continuous research loop for: ${goal}

  Cadence: every ${cadence} minutes

  1. Research pulse:
    - Run \`research_improvement_ideas\` against MCP, AI tooling, and workflow sources.
    - Capture top ideas ranked by signal score.

  2. Persist and schedule:
    - Run \`record_research_pulse\` with cadence=${cadence} to store snapshots and next-run timestamp.

  3. Convert ideas to execution:
    - Use \`agent_task_planner\` to turn top ideas into implementation steps.
    - Use \`plan_specialist_assignments\` to assign specialist pods.
    - Use \`build_collaboration_schedule\` for parallel execution waves.

  4. Validate each wave:
    - Run validation gates and tests after each implemented idea.
    - Keep only improvements that pass quality gates.

  5. Repeat indefinitely:
    - At each pulse, compare new ideas to previous snapshots and prioritize net-new high-impact upgrades.

  This loop keeps your system in nonstop autonomous improvement mode while retaining traceable decisions and stable quality.`;
    }

  if (name === 'media_toolchain_blueprint') {
    const goal = args.goal || 'generate and analyze media for development workflows';
    return `Media toolchain blueprint for: ${goal}

  1. Generate visual assets quickly:
    - Use \`generate_svg_image\` to create banners, placeholders, and report cards for docs/UI mocks.

  2. Validate image artifacts:
    - Use \`analyze_image_file\` to verify format, dimensions, and checksum before publishing.

  3. Inspect video assets:
    - Use \`analyze_video_file\` for duration/codec/fps metadata when ffprobe is available.
    - If ffprobe is missing, use fallback metadata and install ffmpeg for deeper analysis.

  4. Integrate with engineering workflow:
    - Attach generated visuals to release notes and QA artifacts.
    - Run image/video analysis inside validation gates for deterministic media checks.

  This gives you native media generation + analysis in your MCP stack so future app projects can automate visual artifacts and media QA.`;
  }

  if (name === 'autonomous_loop_controller') {
    const goal = args.goal || 'continuous autonomous improvement without manual handoff';
    return `Autonomous loop controller playbook for: ${goal}

  1. Start or continue loop execution:
    - Use \`orchestrate_continuous_improvement_loop\` for bounded execution batches.
    - Use \`resume_interrupted_cycle\` to continue from checkpointed state.

  2. Control runtime behavior:
    - Use \`set_autonomous_loop_control\` with pause/resume/trigger_now.

  3. Monitor and evaluate rigor:
    - Use \`get_autonomous_loop_state\` for current status and snapshots.
    - Use \`evaluate_autonomous_loop_quality\` for cadence/trend quality scoring.

  4. Keep loop non-terminal:
    - Continue cycle batches indefinitely unless explicitly paused or interrupted by the operator.
    - Never treat an intermediate cycle as task completion.`;
  }

    if (name === 'skill_pack_operating_model') {
     const goal = args.goal || 'rigorous specialist auto-coding at scale';
     return `Skill-pack operating model for: ${goal}

  1. Create structured specialist skills:
    - Run \`draft_skill_pack_manifest\` to map roles to skill folders and contracts.
    - Keep skills in .github/skills (project) or ~/.copilot/skills (personal reusable).

  2. Ground research with canonical docs index:
    - Run \`discover_mcp_docs_index\` against MCP llms.txt before major architecture changes.

  3. Enforce rigor with contracts:
    - Each skill must define inputs, outputs, and quality gates.
    - Every autonomous cycle must include validation evidence.

  4. Orchestrate with specialist pods:
    - Use specialist assignment + collaboration schedule tools to run skills in parallel waves.

  5. Continuous loop:
    - Run recurring research pulses, update skill packs, and revalidate behavior after each wave.

  This model turns specialist roles into reusable, testable skill packs so autonomous coding stays creative but controlled.`;
    }

  return `Unknown prompt: ${name}`;
}

// ── Chat history & MCP server scan helpers ───────────────────────────────

const chatHistoryDir = path.join(__dirname, 'artifacts', 'chat-history');
if (!fs.existsSync(chatHistoryDir)) fs.mkdirSync(chatHistoryDir, { recursive: true });

const CHAT_BACKEND_NAME = process.env.AGENT_OPS_CHAT_BACKEND_NAME || 'Claude2';
const CHAT_BACKEND_URL = process.env.AGENT_OPS_CHAT_BACKEND_URL || process.env.CHAT_BACKEND_URL || 'http://127.0.0.1:12345/api/ai/chat';
const CHAT_CONTEXT_URL = process.env.AGENT_OPS_CHAT_CONTEXT_URL || `http://127.0.0.1:${HTTP_PORT}/events/recent`;
const CHAT_BACKEND_TIMEOUT_MS = readPositiveIntEnv('AGENT_OPS_CHAT_BACKEND_TIMEOUT_MS', 30000);

let _mcpServerCache = null;
let _mcpServerCacheTime = 0;
const MCP_CACHE_TTL = 30000;

async function scanMcpServers() {
  if (_mcpServerCache && (Date.now() - _mcpServerCacheTime) < MCP_CACHE_TTL) return _mcpServerCache;
  const results = [];
  let dirs;
  try {
    dirs = fs.readdirSync(DEFAULT_MCP_ROOT, { withFileTypes: true })
      .filter(d => d.isDirectory()).map(d => d.name);
  } catch (_) { return []; }

  for (const dir of dirs) {
    const dirPath = path.join(DEFAULT_MCP_ROOT, dir);
    const entry = { name: dir, dir: dirPath, description: '', version: null, port: null, running: false, tools: null, hasMcpServer: false };
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(dirPath, 'package.json'), 'utf8'));
      entry.name = pkg.name || dir;
      entry.version = pkg.version || null;
      entry.description = pkg.description || '';
      const scripts = JSON.stringify(pkg.scripts || {});
      const pm = scripts.match(/--port[=\s]+(\d+)|:(\d{4,5})\b/);
      if (pm) entry.port = parseInt(pm[1] || pm[2]);
    } catch (_) {}
    if (fs.existsSync(path.join(dirPath, 'mcp-server.js'))) {
      entry.hasMcpServer = true;
      if (!entry.port) {
        try {
          const src = fs.readFileSync(path.join(dirPath, 'mcp-server.js'), 'utf8');
          const pm = src.match(/HTTP_PORT\s*=\s*(\d+)|const\s+PORT\s*=\s*(\d+)/);
          if (pm) entry.port = parseInt(pm[1] || pm[2]);
        } catch (_) {}
      }
    }
    if (entry.port) {
      await new Promise(resolve => {
        const req2 = http.get(`http://127.0.0.1:${entry.port}/health`, { timeout: 1500 }, (r2) => {
          let body = ''; r2.on('data', c => body += c);
          r2.on('end', () => {
            try {
              const h = JSON.parse(body);
              entry.running = true;
              if (h.tools !== undefined) entry.tools = h.tools;
              if (h.version) entry.version = h.version;
            } catch (_) { entry.running = true; }
            resolve();
          });
        });
        req2.on('error', () => resolve());
        req2.on('timeout', () => { req2.destroy(); resolve(); });
      });
    }
    if (entry.hasMcpServer) results.push(entry);
  }
  _mcpServerCache = results;
  _mcpServerCacheTime = Date.now();
  return results;
}

function proxyJsonPost(targetUrl, body, requestConfig = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const urlObj = new URL(targetUrl);
    const mod = urlObj.protocol === 'https:' ? https : http;
    const timeoutMs = Number.isFinite(requestConfig.timeoutMs) && requestConfig.timeoutMs > 0 ? requestConfig.timeoutMs : 30000;
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) },
      timeout: timeoutMs,
    };
    const req2 = mod.request(requestOptions, (r2) => {
      let data = ''; r2.on('data', c => data += c);
      r2.on('end', () => {
        try { resolve({ status: r2.statusCode, body: JSON.parse(data) }); }
        catch (_) { resolve({ status: r2.statusCode, body: data }); }
      });
    });
    req2.on('error', reject);
    req2.on('timeout', () => { req2.destroy(); reject(new Error('Request timed out')); });
    req2.write(bodyStr); req2.end();
  });
}

function clientSupportsSampling() {
  const sampling = mcpClientSession.capabilities && mcpClientSession.capabilities.sampling;
  return !!(mcpClientSession.initialized && sampling && typeof sampling === 'object');
}

function updateChatTransportState(nextState = {}) {
  Object.assign(lastChatTransportState, nextState, {
    updatedAt: new Date().toISOString(),
  });
  return getChatBackendInfo();
}

function getChatBackendInfo(overrides = {}) {
  const samplingAvailable = clientSupportsSampling();
  const base = samplingAvailable
    ? {
        mode: 'mcp_sampling',
        name: mcpClientSession.clientInfo && mcpClientSession.clientInfo.name
          ? `${mcpClientSession.clientInfo.name} (MCP sampling)`
          : 'Connected MCP client (sampling)',
        url: 'mcp://sampling/createMessage',
        fallbackUrl: CHAT_BACKEND_URL,
        timeoutMs: CHAT_BACKEND_TIMEOUT_MS,
        contextUrl: CHAT_CONTEXT_URL,
        samplingAvailable: true,
        available: true,
        degraded: false,
        clientInfo: mcpClientSession.clientInfo || null,
      }
    : {
        mode: 'http_proxy',
        name: CHAT_BACKEND_NAME,
        url: CHAT_BACKEND_URL,
        timeoutMs: CHAT_BACKEND_TIMEOUT_MS,
        contextUrl: CHAT_CONTEXT_URL,
        samplingAvailable: false,
        available: null,
        degraded: false,
        clientInfo: mcpClientSession.clientInfo || null,
      };

  const state = lastChatTransportState.mode === base.mode ? lastChatTransportState : null;
  if (state && state.updatedAt) {
    Object.assign(base, {
      available: state.available,
      degraded: !!state.degraded,
      code: state.code || null,
      error: state.error || null,
      updatedAt: state.updatedAt,
    });
  }

  return Object.assign(base, overrides);
}

function requestClient(method, params, options = {}) {
  if (!mcpClientSession.initialized) {
    return Promise.reject(new Error('No MCP client is connected to agent-ops-hub'));
  }

  const id = nextClientRequestId++;
  const timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
    ? options.timeoutMs
    : MCP_CLIENT_REQUEST_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingClientRequests.delete(id);
      reject(new Error(`${method} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    pendingClientRequests.set(id, { method, resolve, reject, timeout });
    process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`, (error) => {
      if (!error) {
        return;
      }
      clearTimeout(timeout);
      pendingClientRequests.delete(id);
      reject(error);
    });
  });
}

function buildSamplingMessages(history) {
  return history
    .slice(-12)
    .map((entry) => ({
      role: entry.role === 'assistant' ? 'assistant' : 'user',
      content: {
        type: 'text',
        text: String(entry.content || ''),
      },
    }))
    .filter((entry) => entry.content.text.trim());
}

function extractTextContent(value, depth = 0) {
  if (depth > 6 || value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => extractTextContent(item, depth + 1))
      .filter(Boolean)
      .join('\n\n')
      .trim();
  }
  if (typeof value !== 'object') {
    return '';
  }
  if (typeof value.text === 'string' && value.text.trim()) {
    return value.text.trim();
  }
  if (value.content !== undefined) {
    const nested = extractTextContent(value.content, depth + 1);
    if (nested) return nested;
  }
  if (value.message !== undefined) {
    const nested = extractTextContent(value.message, depth + 1);
    if (nested) return nested;
  }
  if (value.parts !== undefined) {
    const nested = extractTextContent(value.parts, depth + 1);
    if (nested) return nested;
  }
  return '';
}

function getSamplingReplyText(replyBody) {
  const text = replyBody && Object.prototype.hasOwnProperty.call(replyBody, 'content')
    ? extractTextContent(replyBody.content)
    : extractTextContent(replyBody);
  return text.slice(0, 4000).trim();
}

async function sampleChatReply(history) {
  const messages = buildSamplingMessages(history);
  if (!messages.length) {
    throw new Error('Sampling chat requires at least one message');
  }

  return requestClient('sampling/createMessage', {
    messages,
    systemPrompt: 'You are the agent-ops-hub dashboard assistant. Answer directly, concretely, and stay focused on the user request.',
    maxTokens: 1200,
  }, {
    timeoutMs: CHAT_BACKEND_TIMEOUT_MS,
  });
}

function readChatHistory(histPath) {
  if (!fs.existsSync(histPath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(histPath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function writeChatHistory(histPath, history) {
  fs.writeFileSync(histPath, JSON.stringify(history, null, 2));
}

function getChatReplyText(replyBody) {
  if (replyBody && typeof replyBody === 'object') {
    if (typeof replyBody.answer === 'string' && replyBody.answer.trim()) return replyBody.answer.trim();
    if (typeof replyBody.reply === 'string' && replyBody.reply.trim()) return replyBody.reply.trim();
    if (typeof replyBody.error === 'string' && replyBody.error.trim()) return replyBody.error.trim();
  }
  return String(replyBody || '').slice(0, 1000);
}

function isChatBackendTimeout(error) {
  const message = String((error && error.message) || error || '');
  return /timed out/i.test(message);
}

function isChatBackendUnavailable(error) {
  const code = String((error && error.code) || '');
  const message = String((error && error.message) || error || '');
  return code === 'ECONNREFUSED' || /ECONNREFUSED|actively refused|ENOTFOUND|EHOSTUNREACH|socket hang up/i.test(message);
}

function buildChatBackendFailurePayload(sessionId, reason) {
  const ts = new Date().toISOString();
  let code = 'chat_backend_unavailable';
  let reply = `${CHAT_BACKEND_NAME} chat backend is unavailable right now. Start the backend at ${CHAT_BACKEND_URL} or set AGENT_OPS_CHAT_BACKEND_URL to the correct endpoint, then try again.`;

  if (reason && Number.isFinite(reason.status)) {
    code = 'chat_backend_http_error';
    reply = `${CHAT_BACKEND_NAME} chat backend returned HTTP ${reason.status}. Check the upstream service logs and endpoint configuration, then try again.`;
  } else if (reason && isChatBackendTimeout(reason.error)) {
    code = 'chat_backend_timeout';
    reply = `${CHAT_BACKEND_NAME} chat backend timed out after ${CHAT_BACKEND_TIMEOUT_MS}ms. Check whether the upstream service is responsive, then try again.`;
  } else if (reason && !isChatBackendUnavailable(reason.error)) {
    code = 'chat_backend_error';
    reply = `${CHAT_BACKEND_NAME} chat backend failed unexpectedly. Check the upstream service and endpoint configuration, then try again.`;
  }

  const backend = updateChatTransportState({
    mode: 'http_proxy',
    available: false,
    degraded: true,
    code,
    error: reason && reason.error ? String(reason.error.message || reason.error) : null,
  });

  return {
    reply,
    chatId: sessionId,
    ts,
    degraded: true,
    code,
    findings: [],
    backend: Object.assign({}, backend, {
      status: reason && Number.isFinite(reason.status) ? reason.status : null,
    }),
  };
}

function buildChatSamplingFailurePayload(sessionId, error) {
  const ts = new Date().toISOString();
  const clientName = mcpClientSession.clientInfo && mcpClientSession.clientInfo.name
    ? mcpClientSession.clientInfo.name
    : 'connected MCP client';
  let code = 'chat_sampling_error';
  let reply = `${clientName} failed to produce a sampled chat reply. Check the MCP client connection and approval flow, then try again.`;

  if (isChatBackendTimeout(error)) {
    code = 'chat_sampling_timeout';
    reply = `${clientName} timed out while creating a sampled reply after ${CHAT_BACKEND_TIMEOUT_MS}ms. Check the MCP client connection, then try again.`;
  }

  const backend = updateChatTransportState({
    mode: 'mcp_sampling',
    available: false,
    degraded: true,
    code,
    error: error ? String(error.message || error) : null,
  });

  return {
    reply,
    chatId: sessionId,
    ts,
    degraded: true,
    code,
    findings: [],
    backend,
  };
}

// ── HTTP server ──────────────────────────────────────────────────────────

const httpServer = http.createServer((req, res) => {
  const url  = req.url || '/';
  const method = req.method || 'GET';

  res.setHeader('Content-Type', 'application/json');

  if (url === '/' && method === 'GET') {
    const htmlPath = path.join(__dirname, 'public', 'dashboard.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.writeHead(200);
    if (fs.existsSync(htmlPath)) {
      res.end(fs.readFileSync(htmlPath, 'utf8'));
    } else {
      res.end('<h1>agent-ops-hub</h1><p>Dashboard not found. Create public/dashboard.html.</p>');
    }
    return;
  }

  if (url === '/stream' && method === 'GET') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200);
    // Replay ring buffer so new clients see recent history
    for (const evt of eventRingBuffer) {
      res.write(`event: ${evt.type}\ndata: ${JSON.stringify(evt.data)}\n\n`);
    }
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    const keepAlive = setInterval(() => {
      try { res.write(': keep-alive\n\n'); } catch (_) { clearInterval(keepAlive); sseClients.delete(res); }
    }, 20000);
    return;
  }

  if (url === '/events/recent' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ events: eventRingBuffer, count: eventRingBuffer.length }));
    return;
  }

  if (url === '/health' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      server: 'agent-ops-hub',
      version: '1.0.0',
      tools: TOOLS.length,
      prompts: PROMPTS.length,
      port: HTTP_PORT,
      uptime: Math.round((Date.now() - serverStartTime) / 1000),
      sseClients: sseClients.size,
      toolCallCount,
      chatBackend: getChatBackendInfo(),
    }));
    return;
  }

  if (url === '/api/test-results' && method === 'GET') {
    const logPath = path.join(__dirname, 'tests', 'logs', 'latest_ai.json');
    if (!fs.existsSync(logPath)) {
      res.writeHead(200);
      res.end(JSON.stringify({ available: false, message: 'No test results yet — run the test suite first.' }));
      return;
    }
    try {
      const raw = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      const summary = raw.summary || {};
      const failures = (raw.tests || []).filter(t => t.status === 'fail').map(t => ({
        name: t.name, error: t.error, duration_ms: t.duration_ms
      }));
      res.writeHead(200);
      res.end(JSON.stringify({
        available:    true,
        timestamp:    raw.timestamp,
        suite:        raw.suite,
        total:        summary.total,
        passed:       summary.passed,
        failed:       summary.failed,
        skipped:      summary.skipped,
        duration_ms:  summary.duration_ms,
        passRate:     summary.total > 0 ? Math.round(summary.passed / summary.total * 100) : 0,
        failures,
        label:        `${summary.passed} passed / ${summary.failed} failed`,
      }));
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Failed to read test log: ' + e.message }));
    }
    return;
  }

  if (url === '/mcp' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString('utf8'); });
    req.on('end', async () => {
      let message;
      try {
        message = JSON.parse(body);
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }
      try {
        // Capture the MCP response by temporarily redirecting stdout
        const chunks = [];
        const origWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = (chunk) => { chunks.push(chunk); return true; };
        await handleMessage(message);
        process.stdout.write = origWrite;
        const output = chunks.join('').trim();
        const parsed = output ? JSON.parse(output) : {};
        res.writeHead(200);
        res.end(JSON.stringify(parsed));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (url === '/api/ai-benchmarks' && method === 'GET') {
    const benchLog = path.join(__dirname, 'tests', 'logs', 'ai-benchmarks.json');
    const latestLog = path.join(__dirname, 'tests', 'logs', 'latest_ai_benchmark.json');
    if (!fs.existsSync(benchLog)) {
      res.writeHead(200);
      res.end(JSON.stringify({ available: false, message: 'No benchmark results yet — run run_ai_benchmark first.', history: [] }));
      return;
    }
    try {
      const history = JSON.parse(fs.readFileSync(benchLog, 'utf8'));
      const latest  = fs.existsSync(latestLog) ? JSON.parse(fs.readFileSync(latestLog, 'utf8')) : (history[history.length - 1] || null);
      res.writeHead(200);
      res.end(JSON.stringify({
        available:    true,
        runCount:     history.length,
        latest:       latest,
        trend:        history.slice(-10).map(r => ({ timestamp: r.timestamp, overall: r.overall, grade: r.grade })),
        history,
      }));
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Failed to read benchmark log: ' + e.message }));
    }
    return;
  }

  if (url === '/api/mcp-servers' && method === 'GET') {
    scanMcpServers().then(servers => {
      res.writeHead(200);
      res.end(JSON.stringify({ servers, count: servers.length, cachedAt: _mcpServerCacheTime }));
    }).catch(e => { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); });
    return;
  }

  if (url === '/api/chat' && method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', async () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch (_) { res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid JSON' })); return; }
      const { message, chatId } = parsed;
      if (!message || !String(message).trim()) { res.writeHead(400); res.end(JSON.stringify({ error: 'message is required' })); return; }
      const userMessage = String(message).trim();
      const sessionId = chatId || `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const histPath = path.join(chatHistoryDir, `${sessionId}.json`);
      const history = readChatHistory(histPath);
      const userTs = new Date().toISOString();
      history.push({ role: 'user', content: userMessage, ts: userTs });

      if (clientSupportsSampling()) {
        try {
          const sampled = await sampleChatReply(history);
          const reply = getSamplingReplyText(sampled);
          if (!reply) {
            throw new Error('Sampling client returned no text reply');
          }
          const assistantTs = new Date().toISOString();
          const backend = updateChatTransportState({
            mode: 'mcp_sampling',
            available: true,
            degraded: false,
            code: null,
            error: null,
          });
          history.push({
            role: 'assistant',
            content: reply,
            ts: assistantTs,
            meta: {
              degraded: false,
              mode: 'mcp_sampling',
              model: sampled && sampled.model ? sampled.model : null,
            },
          });
          writeChatHistory(histPath, history);
          res.writeHead(200);
          res.end(JSON.stringify({
            reply,
            chatId: sessionId,
            ts: assistantTs,
            degraded: false,
            findings: [],
            backend: Object.assign({}, backend, {
              model: sampled && sampled.model ? sampled.model : null,
              stopReason: sampled && sampled.stopReason ? sampled.stopReason : null,
            }),
          }));
          return;
        } catch (error) {
          const degraded = buildChatSamplingFailurePayload(sessionId, error);
          history.push({
            role: 'assistant',
            content: degraded.reply,
            ts: degraded.ts,
            meta: {
              degraded: true,
              code: degraded.code,
              mode: 'mcp_sampling',
              error: degraded.backend.error || null,
            },
          });
          writeChatHistory(histPath, history);
          res.writeHead(200);
          res.end(JSON.stringify(degraded));
          return;
        }
      }

      try {
        const result = await proxyJsonPost(CHAT_BACKEND_URL, {
          question: userMessage,
          source: 'url',
          url: CHAT_CONTEXT_URL,
          maxPages: 1,
        }, { timeoutMs: CHAT_BACKEND_TIMEOUT_MS });
        const replyBody = result.body;
        if (!result.status || result.status < 200 || result.status >= 300) {
          const degraded = buildChatBackendFailurePayload(sessionId, { status: result.status });
          history.push({ role: 'assistant', content: degraded.reply, ts: degraded.ts, meta: { degraded: true, code: degraded.code, status: result.status } });
          writeChatHistory(histPath, history);
          res.writeHead(200);
          res.end(JSON.stringify(degraded));
          return;
        }
        const reply = getChatReplyText(replyBody);
        const assistantTs = new Date().toISOString();
        const backend = updateChatTransportState({
          mode: 'http_proxy',
          available: true,
          degraded: false,
          code: null,
          error: null,
        });
        history.push({ role: 'assistant', content: reply, ts: assistantTs, meta: { degraded: false, mode: 'http_proxy', status: result.status } });
        writeChatHistory(histPath, history);
        res.writeHead(200);
        res.end(JSON.stringify({
          reply,
          chatId: sessionId,
          ts: assistantTs,
          degraded: false,
          findings: Array.isArray(replyBody && replyBody.findings) ? replyBody.findings : [],
          backend: Object.assign({}, backend, {
            status: result.status,
          }),
        }));
      } catch (e) {
        const degraded = buildChatBackendFailurePayload(sessionId, { error: e });
        history.push({ role: 'assistant', content: degraded.reply, ts: degraded.ts, meta: { degraded: true, code: degraded.code, mode: 'http_proxy', error: degraded.backend.error } });
        writeChatHistory(histPath, history);
        res.writeHead(200);
        res.end(JSON.stringify(degraded));
      }
    });
    return;
  }

  if (url === '/api/chat/history' && method === 'GET') {
    try {
      if (!fs.existsSync(chatHistoryDir)) { res.writeHead(200); res.end(JSON.stringify({ sessions: [] })); return; }
      const files = fs.readdirSync(chatHistoryDir).filter(f => f.endsWith('.json'));
      const sessions = files.map(f => {
        const cid = f.replace('.json', '');
        try {
          const history = JSON.parse(fs.readFileSync(path.join(chatHistoryDir, f), 'utf8'));
          const last = history[history.length - 1];
          const firstUser = history.find(m => m.role === 'user');
          return { chatId: cid, messageCount: history.length, lastActivity: last?.ts, preview: (firstUser?.content || '').slice(0, 60) };
        } catch (_) { return { chatId: cid, messageCount: 0, lastActivity: null, preview: '' }; }
      }).sort((a, b) => (b.lastActivity || '') > (a.lastActivity || '') ? 1 : -1);
      res.writeHead(200);
      res.end(JSON.stringify({ sessions, count: sessions.length }));
    } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
    return;
  }

  if (url.startsWith('/api/chat/history/') && method === 'GET') {
    const chatId = url.slice('/api/chat/history/'.length).replace(/[^a-zA-Z0-9\-_]/g, '');
    if (!chatId) { res.writeHead(400); res.end(JSON.stringify({ error: 'chatId required' })); return; }
    const histPath = path.join(chatHistoryDir, `${chatId}.json`);
    if (!fs.existsSync(histPath)) { res.writeHead(404); res.end(JSON.stringify({ error: 'Session not found' })); return; }
    try {
      const history = JSON.parse(fs.readFileSync(histPath, 'utf8'));
      res.writeHead(200);
      res.end(JSON.stringify({ chatId, messages: history, count: history.length }));
    } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
    return;
  }

  if (url === '/api/sprint-history' && method === 'GET') {
    const sprintEvents = eventRingBuffer.filter(e => ['sprint_start','sprint_complete','evaluation_result'].includes(e.type));
    const sprints = {};
    for (const evt of sprintEvents) {
      const sid = evt.data.sprintId || 'unknown';
      if (!sprints[sid]) sprints[sid] = { sprintId: sid, ts: evt.data.ts, events: [] };
      sprints[sid].events.push({ type: evt.type, ts: evt.data.ts });
      if (evt.type === 'sprint_complete') Object.assign(sprints[sid], { sprintName: evt.data.sprintName, taskCount: evt.data.taskCount, dispatchedCount: evt.data.dispatchedCount });
      if (evt.type === 'evaluation_result') { sprints[sid].grade = evt.data.grade; sprints[sid].overallScore = evt.data.overallScore; }
    }
    const list = Object.values(sprints).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    res.writeHead(200);
    res.end(JSON.stringify({ sprints: list, count: list.length }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found', endpoints: ['/', '/health', '/mcp', '/stream', '/events/recent', '/api/test-results', '/api/ai-benchmarks', '/api/mcp-servers', '/api/chat', '/api/chat/history', '/api/sprint-history'] }));
});

httpServer.listen(HTTP_PORT, '127.0.0.1', () => {
  process.stderr.write(`[agent-ops-hub] HTTP listening on http://127.0.0.1:${HTTP_PORT}\n`);
  // Broadcast a ping every 5s so the dashboard can track uptime + call counts
  setInterval(() => {
    emitHub('ping', {
      uptime:        Math.round((Date.now() - serverStartTime) / 1000),
      toolCallCount,
      clientCount:   sseClients.size,
    });
  }, 5000);
});

httpServer.on('error', (e) => {
  process.stderr.write(`[agent-ops-hub] HTTP error: ${e.message}\n`);
});

function sendError(id, code, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } })}\n`);
}
