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
  }
];

const HTTP_PORT = 11200;

let inputBuffer = '';

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

    handleMessage(message).catch((error) => {
      sendError(message.id || null, -32603, error.message || 'Internal error');
    });
  }
}

async function handleMessage(message) {
  const { id, method, params } = message;

  if (method === 'initialize') {
    return sendResult(id, {
      protocolVersion: '2024-11-05',
      serverInfo: {
        name: 'agent-ops-hub',
        version: '0.8.0'
      },
      capabilities: {
        tools: {},
        prompts: {}
      }
    });
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

    const result = await runTool(toolName, args);
    return sendResult(id, {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    });
  }

  sendError(id || null, -32601, `Method not found: ${method}`);
}

async function runTool(name, args) {
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
    default:
      throw new Error(`Unknown tool: ${name}`);
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
  const now = new Date();
  const stamp = toStamp(now);
  const runbook = {
    id: `${slugify(args.name)}-${stamp}`,
    name: args.name,
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
    const score     = syntaxOk ? Math.min(100, Math.round(100 - Math.max(0, lineCount - 500) / 50)) : 0;
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

function buildPromptText(name, args) {
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

// ── HTTP server ──────────────────────────────────────────────────────────

const httpServer = http.createServer((req, res) => {
  const url  = req.url || '/';
  const method = req.method || 'GET';

  res.setHeader('Content-Type', 'application/json');

  if (url === '/health' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      server: 'agent-ops-hub',
      version: '0.8.0',
      tools: TOOLS.length,
      prompts: PROMPTS.length,
      port: HTTP_PORT
    }));
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

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found', endpoints: ['/health', '/mcp'] }));
});

httpServer.listen(HTTP_PORT, '127.0.0.1', () => {
  process.stderr.write(`[agent-ops-hub] HTTP listening on http://127.0.0.1:${HTTP_PORT}\n`);
});

httpServer.on('error', (e) => {
  process.stderr.write(`[agent-ops-hub] HTTP error: ${e.message}\n`);
});

function sendError(id, code, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } })}\n`);
}
