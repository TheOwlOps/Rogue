<div align="center">

# 🦉 Rogue

**Autonomous multi-agent orchestration runtime & execution engine**

*Define agents. Give them a mission. Rogue plans, delegates, executes, and verifies — on your machine, under your rules.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-pre--alpha-orange.svg)](#-project-status)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933.svg)](https://nodejs.org)

</div>

---

## What is Rogue?

Rogue is an open-source runtime for running **teams of autonomous AI agents** on your own infrastructure. Instead of one model answering one prompt, Rogue lets you define specialized agents — a planner, a coder, a researcher, a reviewer — and orchestrates them through a complete mission: breaking work into tasks, assigning the right agent, running tools, checking results, and retrying or escalating when something fails.

You describe **who** the agents are and **what** the goal is. Rogue handles **how** it gets done:

1. **Plan** — the orchestrator decomposes the mission into a task graph.
2. **Delegate** — each task is routed to the agent whose role, skills, and tools fit it best.
3. **Execute** — agents run in a controlled execution engine with real tools (shell, files, browser, APIs), budgets, and timeouts.
4. **Verify** — results are checked against the task's acceptance criteria before they are accepted.
5. **Report** — you get the outcome, the full execution trace, and every artifact the swarm produced.

Rogue is **local-first**: the runtime, state, memory, and logs live on your machine. Models are pluggable — point Rogue at any provider you already use.

> **Status:** Rogue is in active development (pre-alpha). The concepts and workflows on this page are the project's public contract; APIs may still change between releases. See [Project status](#-project-status).

---

## Why Rogue?

| Problem with hand-rolled agent scripts | How Rogue solves it |
|---|---|
| Gluing prompts, loops, and tool calls together for every new task | Declarative agent & mission definitions — config, not plumbing |
| One agent trying to do everything, badly | Specialist agents with roles, skills, and their own toolsets |
| No idea what the swarm did, or why it failed | Full execution trace: every plan, message, tool call, and result is logged |
| Runaway loops burning tokens | Hard budgets per mission, per agent, and per task — enforced by the runtime |
| Agents doing dangerous things unattended | Approval gates for sensitive actions, sandboxed execution, deny-by-default tool permissions |
| Restarting from zero after a crash | Persistent state and resumable runs — pick up exactly where execution stopped |

---

## Key features

- **Multi-agent orchestration** — sequential, parallel, and hierarchical (manager → workers) execution patterns out of the box.
- **Task graph engine** — missions are decomposed into dependent tasks; independent tasks run in parallel automatically.
- **Real execution engine** — agents act through tools: shell, filesystem, HTTP, browser automation, and your own custom tools.
- **Pluggable models** — per-agent model selection; mix providers and price tiers (a strong planner, cheap workers).
- **Persistent memory** — per-agent and shared swarm memory across runs, stored locally.
- **Budgets & guardrails** — token, time, and step limits; approval gates; sandboxed workspaces.
- **Observable by default** — structured logs, live run view, and a replayable event trace for every run.
- **Resumable runs** — pause, stop, and resume missions without losing completed work.
- **TypeScript-native** — define everything in typed code, or in YAML if you prefer config over code.
- **Open source, MIT licensed** — no account, no hosted control plane, no telemetry.

---

## How it works

```text
                          ┌─────────────────────────────┐
            mission ────► │         ORCHESTRATOR        │
                          │  plan · route · verify      │
                          └──────────────┬──────────────┘
                                         │ task graph
              ┌──────────────────────────┼──────────────────────────┐
              ▼                          ▼                          ▼
        ┌───────────┐              ┌───────────┐              ┌───────────┐
        │  AGENT A  │              │  AGENT B  │              │  AGENT C  │
        │ researcher│              │   coder   │              │ reviewer  │
        └─────┬─────┘              └─────┬─────┘              └─────┬─────┘
              │                          │                          │
              ▼                          ▼                          ▼
        ┌───────────────────────────────────────────────────────────────┐
        │                    EXECUTION ENGINE                           │
        │  tools · sandbox · budgets · approvals · memory · events      │
        └───────────────────────────────────────────────────────────────┘
```

- The **Orchestrator** owns the mission. It plans, assigns, verifies, and decides what happens when a task fails (retry, reassign, replan, or escalate to you).
- **Agents** are specialists. Each has a role, instructions, a model, a set of skills, and an explicit list of tools it is allowed to use.
- The **Execution Engine** is the only layer that touches the real world. Every tool call passes through it, so permissions, budgets, logging, and approvals are enforced in one place — agents cannot bypass it.

---

## Requirements

- **Node.js 20+** (LTS recommended)
- An API key (or local endpoint) for at least one model provider
- macOS, Linux, or Windows (WSL2 recommended on Windows)

---

## Installation

Install the CLI globally:

```bash
npm install -g @theowlops/rogue
```

Or run it without installing:

```bash
npx @theowlops/rogue --help
```

Or add it to a project as a library:

```bash
npm install @theowlops/rogue
```

Verify the installation:

```bash
rogue --version
rogue doctor        # checks Node, config, and provider connectivity
```

---

## Quickstart (5 minutes)

### 1. Create a project

```bash
rogue init my-swarm
cd my-swarm
```

This scaffolds:

```text
my-swarm/
├── rogue.config.ts     # runtime + provider configuration
├── agents/             # one file per agent
│   ├── planner.ts
│   ├── researcher.ts
│   └── coder.ts
├── missions/           # reusable mission definitions
│   └── research-and-build.ts
└── .rogue/             # local state, memory, logs (git-ignored)
```

### 2. Configure your model provider

Edit `rogue.config.ts`:

```ts
import { defineConfig } from '@theowlops/rogue'

export default defineConfig({
  provider: {
    name: 'openai',                    // or 'anthropic', 'google', 'ollama', …
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: 'gpt-5'
  },
  runtime: {
    workspace: './workspace',          // where agents are allowed to work
    maxConcurrency: 4,                 // parallel tasks
    budget: { maxTokens: 500_000, maxMinutes: 30 }
  }
})
```

Or use environment variables only — no config file required:

```bash
export ROGUE_PROVIDER=openai
export OPENAI_API_KEY=sk-…
```

### 3. Define an agent

`agents/researcher.ts`:

```ts
import { defineAgent } from '@theowlops/rogue'

export default defineAgent({
  name: 'researcher',
  role: 'Research analyst',
  goal: 'Find accurate, sourced answers to open questions',
  instructions: `
    Always cite sources. Prefer primary documentation over blog posts.
    If evidence conflicts, say so explicitly instead of guessing.
  `,
  model: 'gpt-5-mini',                 // cheap + fast for legwork
  skills: ['web-research', 'summarization'],
  tools: ['web.search', 'web.fetch', 'fs.read']
})
```

### 4. Run a mission

From the CLI, in plain language:

```bash
rogue run "Research the top 3 open-source vector databases, then write a comparison report to report.md"
```

Or as a reusable mission file, `missions/research-and-build.ts`:

```ts
import { defineMission } from '@theowlops/rogue'

export default defineMission({
  name: 'research-and-build',
  goal: 'Research vector databases and produce a comparison report',
  agents: ['planner', 'researcher', 'coder'],
  pattern: 'hierarchical',             // planner delegates, agents execute
  acceptance: [
    'report.md exists in the workspace',
    'report covers at least 3 databases with cited sources'
  ]
})
```

```bash
rogue run missions/research-and-build.ts
```

### 5. Watch and inspect the run

```bash
rogue status          # live view of the current run: tasks, agents, budget
rogue logs --follow   # stream structured events as they happen
rogue trace last      # full replay of the last run, step by step
```

When the mission finishes, Rogue prints the outcome, the artifacts produced, token/time spent, and anything that needs your decision.

---

## Core concepts

### Agent

An **agent** is a specialist worker: a role, a goal, instructions, a model, skills, and a tool allow-list. Agents only ever have the tools they are explicitly given — deny by default.

```ts
defineAgent({
  name: 'reviewer',
  role: 'Code reviewer',
  goal: 'Reject anything that would break production',
  model: 'gpt-5',
  tools: ['fs.read', 'git.diff'],
  budget: { maxTokens: 50_000 }
})
```

### Mission

A **mission** is the unit of work: a goal, the agents involved, an execution pattern, and acceptance criteria. A mission succeeds only when its acceptance criteria are verified — "the agent said it's done" is not enough.

### Task graph

The orchestrator decomposes a mission into **tasks** with dependencies. Tasks with no unmet dependencies run in parallel, up to `maxConcurrency`. A failed task is retried, reassigned, or causes a replan — according to the mission's policy, never silently dropped.

### Tools

A **tool** is a capability the execution engine exposes to agents: running a shell command, reading a file, calling an API. Every tool call is permission-checked, budget-checked, logged, and — for sensitive tools — approval-gated.

### Skills

A **skill** is a packaged bundle of instructions + tools for a domain (for example `web-research` or `code-review`). Skills keep agent definitions short: attach the skill, the agent knows the playbook.

### Memory

Agents have **memory**: a private scratchpad per agent and a shared blackboard per mission, persisted across runs in `.rogue/`. Memory is plain local data — inspect it, edit it, delete it.

### Approvals

Sensitive actions (writing outside the workspace, network calls to new hosts, destructive shell commands, spending beyond a threshold) pause execution and ask **you**. Approvals can be granted per action, per run, or by policy — never silently.

---

## Execution patterns

| Pattern | How it works | Best for |
|---|---|---|
| `sequential` | Agents work one after another, each building on the previous result | Pipelines: research → write → review |
| `parallel` | The same task is fanned out to several agents at once; results are merged | Broad research, multi-option exploration |
| `hierarchical` | A planner/manager agent delegates to worker agents and verifies their output | Complex, open-ended missions (default) |
| `debate` | Agents argue opposing positions; a judge agent synthesizes the verdict | Decisions, design reviews, fact-checking |

Set the pattern per mission:

```ts
defineMission({ name: 'design-review', pattern: 'debate', agents: ['architect-a', 'architect-b', 'judge'] })
```

---

## Configuration reference

`rogue.config.ts` (or `rogue.config.js` / `rogue.yaml`) at the project root:

| Key | Type | Default | Description |
|---|---|---|---|
| `provider.name` | string | — | Model provider: `openai`, `anthropic`, `google`, `ollama`, or any OpenAI-compatible endpoint |
| `provider.apiKey` | string | env | API key (prefer environment variables) |
| `provider.baseUrl` | string | provider default | Custom endpoint, e.g. a local model server |
| `provider.defaultModel` | string | — | Model used when an agent doesn't specify one |
| `runtime.workspace` | path | `./workspace` | The only directory agents may write to by default |
| `runtime.maxConcurrency` | number | `4` | Maximum tasks executing in parallel |
| `runtime.budget.maxTokens` | number | unlimited | Hard token ceiling per run — execution stops when hit |
| `runtime.budget.maxMinutes` | number | unlimited | Hard wall-clock ceiling per run |
| `runtime.approvals` | `'ask' \| 'policy' \| 'never'` | `'ask'` | How sensitive actions are approved (`never` still respects deny rules) |
| `runtime.sandbox` | boolean | `true` | Run shell tools in the restricted workspace sandbox |
| `memory.dir` | path | `./.rogue/memory` | Where persistent memory is stored |
| `logging.level` | `'debug' \| 'info' \| 'warn'` | `'info'` | Event log verbosity |
| `logging.file` | path | `./.rogue/logs` | Where run traces are written |

Every value can be overridden by an environment variable prefixed with `ROGUE_` (for example `ROGUE_MAX_CONCURRENCY=8`) or by a CLI flag.

---

## CLI reference

| Command | Description |
|---|---|
| `rogue init [dir]` | Scaffold a new Rogue project |
| `rogue run <goal \| mission-file>` | Run a mission from a plain-language goal or a mission file |
| `rogue run --dry <goal>` | Show the plan and estimated budget without executing |
| `rogue status` | Live view of the running mission: task graph, agents, budget burn |
| `rogue logs [--follow] [--run <id>]` | Show or stream the event log |
| `rogue trace <run-id \| last>` | Replay a run step by step |
| `rogue pause` / `rogue resume` | Pause a run (state is kept) / resume it later |
| `rogue stop` | Stop a run safely; completed tasks and artifacts are kept |
| `rogue agents` | List agents in the current project with their tools and models |
| `rogue tools` | List available tools and which agents may use them |
| `rogue doctor` | Diagnose Node, config, provider connectivity, and permissions |
| `rogue config` | Print the resolved configuration (secrets redacted) |

Useful global flags: `--config <path>`, `--workspace <path>`, `--budget <tokens>`, `--yes` (auto-approve non-destructive actions), `--json` (machine-readable output).

---

## Programmatic API

Everything the CLI does is available as a library:

```ts
import { Rogue, defineAgent, defineMission } from '@theowlops/rogue'

const rogue = new Rogue({ configFile: './rogue.config.ts' })

rogue.registerAgent(defineAgent({
  name: 'coder',
  role: 'Software engineer',
  goal: 'Implement features with tests',
  tools: ['fs.read', 'fs.write', 'shell.run', 'git.diff']
}))

const run = await rogue.run(defineMission({
  name: 'fix-login-bug',
  goal: 'Reproduce, fix, and regression-test the login redirect bug',
  agents: ['planner', 'coder', 'reviewer'],
  pattern: 'hierarchical',
  acceptance: ['a regression test exists and passes', 'reviewer approved the diff']
}))

console.log(run.status)      // 'succeeded' | 'failed' | 'needs-input'
console.log(run.artifacts)   // files produced during the run
console.log(run.usage)       // { tokens, minutes, costEstimate }
```

Runs are event-emitters — stream progress into your own UI:

```ts
run.on('task:completed', (e) => console.log(e.agent, 'finished', e.task))
run.on('approval:needed', async (e) => /* decide in your app */ true)
```

---

## Tools

### Built-in tools

| Tool | Capability | Sensitive |
|---|---|---|
| `fs.read` / `fs.list` | Read files inside the workspace | no |
| `fs.write` / `fs.edit` | Create and modify files inside the workspace | no (workspace only) |
| `shell.run` | Run shell commands in the sandbox | **yes** beyond the allow-list |
| `web.search` / `web.fetch` | Search the web and fetch pages | no |
| `web.browser` | Drive a real browser (click, type, screenshot) | **yes** for submissions |
| `http.request` | Call HTTP APIs | **yes** for new hosts |
| `git.status` / `git.diff` / `git.commit` | Inspect and commit the workspace repo | commit = **yes** |
| `memory.read` / `memory.write` | Access persistent memory | no |

### Writing a custom tool

```ts
import { defineTool } from '@theowlops/rogue'
import { z } from 'zod'

export default defineTool({
  name: 'deploy.preview',
  description: 'Deploy the workspace to the preview environment',
  input: z.object({ target: z.string() }),
  sensitive: true,                       // requires approval by default
  async run({ target }, ctx) {
    ctx.log(`deploying to ${target}`)
    // … your code …
    return { url: `https://preview.example.com/${target}` }
  }
})
```

Drop the file in `tools/` and add `'deploy.preview'` to an agent's `tools` list.

---

## Safety model

Rogue is built to run unattended **without** running away:

- **Deny by default** — an agent can only use tools it was explicitly given.
- **Workspace jail** — file and shell tools are confined to the workspace unless you widen the scope.
- **Approval gates** — sensitive tools pause for your decision; every decision is written to the trace.
- **Hard budgets** — token, time, and step ceilings are enforced by the runtime, not by prompt politeness.
- **Full traceability** — if it happened, it's in the log: plans, messages, tool calls, results, approvals.
- **Local state** — memory, logs, and credentials stay on your machine. Rogue sends data only to the model providers you configured.

---

## Project layout (for contributors)

```text
rogue/
├── packages/
│   ├── core/          # orchestrator, task graph, run lifecycle
│   ├── engine/        # execution engine: tools, sandbox, budgets, approvals
│   ├── memory/        # persistent agent + swarm memory
│   └── cli/           # the `rogue` command-line interface
├── examples/          # runnable example swarms
└── docs/              # design notes and ADRs
```

---

## Examples

| Example | What it shows |
|---|---|
| `examples/research-team` | Hierarchical research swarm producing a cited report |
| `examples/code-crew` | Planner + coder + reviewer fixing a real bug end-to-end |
| `examples/debate-club` | Two agents debating a design decision, judge synthesizing |
| `examples/overnight-ops` | Long-running mission with budgets, approvals by policy, and resume-after-crash |

---

## Roadmap

- [x] Core orchestrator: task graph, hierarchical pattern, verification loop
- [x] Execution engine: sandbox, budgets, approval gates, event trace
- [x] CLI: init / run / status / logs / trace / pause / resume
- [ ] Visual run dashboard (live task graph in the browser)
- [ ] Skill marketplace (shareable skill packs)
- [ ] More providers and local-model optimizations
- [ ] Team mode: multiple humans approving and steering one swarm

---

## 📌 Project status

Rogue is **pre-alpha** and under active development by [TheOwlOps](https://github.com/TheOwlOps). Expect breaking changes between releases while the core APIs settle. Bug reports, design feedback, and "here's how my swarm failed" write-ups are the most valuable contributions right now.

---

## Contributing

1. Fork the repo and create a branch: `git checkout -b feat/my-change`
2. Make your change, with tests where it matters.
3. Run the checks: `pnpm test && pnpm build`
4. Open a pull request describing **what changed and why** — include a trace or log excerpt if it touches execution behavior.

Please keep PRs focused: one feature or fix per PR. For big ideas, open an issue first so we can align on the design.

---

## License

[MIT](LICENSE) © TheOwlOps

*Rogue is not affiliated with any model provider. Model names are used only to describe compatibility.*
