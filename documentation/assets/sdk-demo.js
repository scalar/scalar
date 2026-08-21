/*
 * Interactive SDK Generator demo.
 *
 * Drives the mini-browser widget on documentation/guides/sdks/demo.md. The page
 * ships a complete, static TypeScript view so the demo still reads correctly
 * without JavaScript; everything below is progressive enhancement that swaps
 * that view as the reader picks targets, runs a build, or changes tabs.
 */

const SDK_NAME = 'warp-hr'

/* Package registries and sample output for each target Scalar can generate.
 * `stable: false` mirrors the experimental flag the dashboard shows. */
const TARGETS = {
  typescript: {
    label: 'Typescript',
    monogram: 'TS',
    tone: '#3178c6',
    registry: 'npm',
    stable: true,
    packageName: 'warp-hr',
    install: 'npm install warp-hr',
    quickstartFile: 'index.ts',
    quickstart: `import WarpAPI from "warp-hr";

const client = new WarpAPI({
  apiKey: process.env["WARP_API_KEY"], // defaults to the WARP_API_KEY env var
});

// Auto-paginating: the next cursor page is fetched as you iterate.
for await (const assignment of client.timeOff.listAssignments({ limit: 50 })) {
  console.log(assignment.id, assignment.policy.name);
}`,
    reference: `# Time Off

Types:

- \`TimeOffAssignment\`
- \`TimeOffPolicy\`

Methods:

- client.timeOff.listAssignments({ ...params }) -> Page<TimeOffAssignment>
  GET /v1/time-off/assignments
- client.timeOff.retrieveAssignment(id) -> TimeOffAssignment
  GET /v1/time-off/assignments/{id}
- client.timeOff.createAssignment({ ...body }) -> TimeOffAssignment
  POST /v1/time-off/assignments`,
    skill: `---
name: warp-hr
description: Call the Warp HR API from TypeScript with the warp-hr package.
---

# Warp HR — TypeScript

## Install

npm install warp-hr

## Construct the client

The default export is the client. It reads WARP_API_KEY from the
environment, so the happy path needs no secret inline.

## Look up a call signature

Every method is listed in api.md, grouped by resource, with its request
and response types. Read that before inventing a method name.`,
    files: [
      { path: 'sdk/typescript/', kind: 'dir' },
      { path: 'src/index.ts', depth: 1 },
      { path: 'src/client.ts', depth: 1 },
      { path: 'src/resources/time-off.ts', depth: 1 },
      { path: 'src/core/pagination.ts', depth: 1 },
      { path: 'src/lib/retry-with-backoff.ts', depth: 1, badge: 'your code' },
      { path: 'api.md', depth: 1 },
      { path: 'SKILL.md', depth: 1 },
      { path: 'README.md', depth: 1 },
      { path: 'package.json', depth: 1 },
    ],
  },
  python: {
    label: 'Python',
    monogram: 'PY',
    tone: '#4b8bbe',
    registry: 'PyPI',
    stable: true,
    packageName: 'warp',
    install: 'pip install warp',
    quickstartFile: 'main.py',
    quickstart: `import os

from warp import Warp

client = Warp(api_key=os.environ.get("WARP_API_KEY"))

# Auto-paginating: the next cursor page is fetched as you iterate.
for assignment in client.time_off.list_assignments(limit=50):
    print(assignment.id, assignment.policy.name)`,
    reference: `# Time Off

Types:

- \`TimeOffAssignment\`
- \`TimeOffPolicy\`

Methods:

- client.time_off.list_assignments(**params) -> SyncCursorPage[TimeOffAssignment]
  GET /v1/time-off/assignments
- client.time_off.retrieve_assignment(assignment_id) -> TimeOffAssignment
  GET /v1/time-off/assignments/{id}
- client.time_off.create_assignment(**body) -> TimeOffAssignment
  POST /v1/time-off/assignments`,
    skill: `---
name: warp-hr
description: Call the Warp HR API from Python with the warp package.
---

# Warp HR — Python

## Install

pip install warp

## Construct the client

Warp() reads WARP_API_KEY from the environment. An AsyncWarp counterpart
exposes the same resource tree with await.

## Look up a call signature

Every method is listed in api.md, grouped by resource, with its request
and response types.`,
    files: [
      { path: 'sdk/python/', kind: 'dir' },
      { path: 'src/warp/__init__.py', depth: 1 },
      { path: 'src/warp/_client.py', depth: 1 },
      { path: 'src/warp/resources/time_off.py', depth: 1 },
      { path: 'src/warp/pagination.py', depth: 1 },
      { path: 'api.md', depth: 1 },
      { path: 'SKILL.md', depth: 1 },
      { path: 'README.md', depth: 1 },
      { path: 'pyproject.toml', depth: 1 },
    ],
  },
  go: {
    label: 'Go',
    monogram: 'GO',
    tone: '#00acd7',
    registry: 'Go modules',
    stable: true,
    packageName: 'github.com/TeamWarp/warp-go-sdk',
    install: 'go get github.com/TeamWarp/warp-go-sdk',
    quickstartFile: 'main.go',
    quickstart: `package main

import (
	"context"
	"fmt"
	"os"

	sdk "github.com/TeamWarp/warp-go-sdk"
	"github.com/TeamWarp/warp-go-sdk/option"
)

func main() {
	client := sdk.NewClient(option.WithAPIKey(os.Getenv("WARP_API_KEY")))

	iter := client.TimeOff.ListAssignmentsAutoPaging(context.Background(),
		sdk.TimeOffListAssignmentsParams{Limit: sdk.Int(50)})

	for iter.Next() {
		assignment := iter.Current()
		fmt.Println(assignment.ID, assignment.Policy.Name)
	}

	if err := iter.Err(); err != nil {
		panic(err)
	}
}`,
    reference: `# Time Off

Types:

- \`TimeOffAssignment\`
- \`TimeOffPolicy\`

Methods:

- client.TimeOff.ListAssignments(ctx, params) (*Page[TimeOffAssignment], error)
  GET /v1/time-off/assignments
- client.TimeOff.RetrieveAssignment(ctx, id) (*TimeOffAssignment, error)
  GET /v1/time-off/assignments/{id}
- client.TimeOff.CreateAssignment(ctx, body) (*TimeOffAssignment, error)
  POST /v1/time-off/assignments`,
    skill: `---
name: warp-hr
description: Call the Warp HR API from Go with the warp-go-sdk module.
---

# Warp HR — Go

## Install

go get github.com/TeamWarp/warp-go-sdk

## Construct the client

sdk.NewClient takes functional options. option.WithAPIKey is optional —
the client falls back to WARP_API_KEY.

## Look up a call signature

Every method is listed in api.md, grouped by resource, with its request
and response types.`,
    files: [
      { path: 'sdk/go/', kind: 'dir' },
      { path: 'client.go', depth: 1 },
      { path: 'timeoff.go', depth: 1 },
      { path: 'pagination.go', depth: 1 },
      { path: 'option/requestoption.go', depth: 1 },
      { path: 'api.md', depth: 1 },
      { path: 'SKILL.md', depth: 1 },
      { path: 'README.md', depth: 1 },
      { path: 'go.mod', depth: 1 },
    ],
  },
  cli: {
    label: 'CLI',
    monogram: '>_',
    tone: '#6b7280',
    registry: 'npm and Homebrew',
    stable: true,
    packageName: 'warp',
    install: 'brew install teamwarp/tap/warp',
    quickstartFile: 'terminal',
    quickstart: `# Install from Homebrew, or run it with npx warp
brew install teamwarp/tap/warp

export WARP_API_KEY="wrp_live_..."

# Flags are typed from the OpenAPI parameters
warp time-off list-assignments --limit 50 --output table

# Every command speaks JSON too, so it composes
warp time-off list-assignments --output json | jq '.data[].policy.name'`,
    reference: `# Time Off

Commands:

- warp time-off list-assignments [--limit] [--cursor] [--output]
  GET /v1/time-off/assignments
- warp time-off retrieve-assignment <id> [--output]
  GET /v1/time-off/assignments/{id}
- warp time-off create-assignment --policy-id <id> --employee-id <id>
  POST /v1/time-off/assignments`,
    skill: `---
name: warp-cli
description: Call the Warp HR API from the shell with the warp CLI.
---

# Warp HR — CLI

## Install

brew install teamwarp/tap/warp

## Authenticate

Set WARP_API_KEY, or run warp auth login to store a token in the
system keychain.

## Look up a command

warp --help lists every resource. api.md maps each command back to the
operation it calls.`,
    files: [
      { path: 'sdk/cli/', kind: 'dir' },
      { path: 'src/commands/time-off.ts', depth: 1 },
      { path: 'src/commands/index.ts', depth: 1 },
      { path: 'src/output/table.ts', depth: 1 },
      { path: 'completions/warp.bash', depth: 1 },
      { path: 'api.md', depth: 1 },
      { path: 'SKILL.md', depth: 1 },
      { path: 'README.md', depth: 1 },
      { path: 'package.json', depth: 1 },
    ],
  },
  java: {
    label: 'Java',
    monogram: 'JV',
    tone: '#e76f00',
    registry: 'Maven Central',
    stable: false,
    packageName: 'dev.warp:warp-java',
    install: 'implementation("dev.warp:warp-java:1.5.0")',
    quickstartFile: 'Main.java',
    quickstart: `import dev.warp.client.WarpClient;
import dev.warp.models.timeoff.TimeOffListAssignmentsParams;

WarpClient client = WarpClient.builder()
    .apiKey(System.getenv("WARP_API_KEY"))
    .build();

client.timeOff()
    .listAssignments(TimeOffListAssignmentsParams.builder().limit(50).build())
    .autoPager()
    .forEach(assignment ->
        System.out.println(assignment.id() + " " + assignment.policy().name()));`,
    reference: `# Time Off

Types:

- \`TimeOffAssignment\`
- \`TimeOffPolicy\`

Methods:

- client.timeOff().listAssignments(params) -> TimeOffListAssignmentsPage
  GET /v1/time-off/assignments
- client.timeOff().retrieveAssignment(params) -> TimeOffAssignment
  GET /v1/time-off/assignments/{id}
- client.timeOff().createAssignment(params) -> TimeOffAssignment
  POST /v1/time-off/assignments`,
    skill: `---
name: warp-hr
description: Call the Warp HR API from Java with the dev.warp:warp-java artifact.
---

# Warp HR — Java

## Install

implementation("dev.warp:warp-java:1.5.0")

## Construct the client

WarpClient.builder() reads WARP_API_KEY when apiKey is omitted. An async
client exposes the same resource tree returning CompletableFuture.

## Look up a call signature

Every method is listed in api.md, grouped by resource.`,
    files: [
      { path: 'sdk/java/', kind: 'dir' },
      { path: 'src/main/java/dev/warp/client/WarpClient.java', depth: 1 },
      { path: 'src/main/java/dev/warp/services/TimeOffService.java', depth: 1 },
      { path: 'src/main/java/dev/warp/core/Page.java', depth: 1 },
      { path: 'api.md', depth: 1 },
      { path: 'SKILL.md', depth: 1 },
      { path: 'README.md', depth: 1 },
      { path: 'build.gradle.kts', depth: 1 },
    ],
  },
  ruby: {
    label: 'Ruby',
    monogram: 'RB',
    tone: '#cc342d',
    registry: 'RubyGems',
    stable: false,
    packageName: 'warp',
    install: 'bundle add warp',
    quickstartFile: 'main.rb',
    quickstart: `require "warp"

client = Warp::Client.new(api_key: ENV["WARP_API_KEY"])

# Auto-paginating: the next cursor page is fetched as you iterate.
client.time_off.list_assignments(limit: 50).each do |assignment|
  puts "#{assignment.id} #{assignment.policy.name}"
end`,
    reference: `# Time Off

Types:

- \`Warp::Models::TimeOffAssignment\`
- \`Warp::Models::TimeOffPolicy\`

Methods:

- client.time_off.list_assignments(**params) -> Warp::CursorPage
  GET /v1/time-off/assignments
- client.time_off.retrieve_assignment(id) -> TimeOffAssignment
  GET /v1/time-off/assignments/{id}
- client.time_off.create_assignment(**body) -> TimeOffAssignment
  POST /v1/time-off/assignments`,
    skill: `---
name: warp-hr
description: Call the Warp HR API from Ruby with the warp gem.
---

# Warp HR — Ruby

## Install

bundle add warp

## Construct the client

Warp::Client.new reads WARP_API_KEY from the environment when api_key
is omitted.

## Look up a call signature

Every method is listed in api.md, grouped by resource.`,
    files: [
      { path: 'sdk/ruby/', kind: 'dir' },
      { path: 'lib/warp.rb', depth: 1 },
      { path: 'lib/warp/client.rb', depth: 1 },
      { path: 'lib/warp/resources/time_off.rb', depth: 1 },
      { path: 'lib/warp/cursor_page.rb', depth: 1 },
      { path: 'api.md', depth: 1 },
      { path: 'SKILL.md', depth: 1 },
      { path: 'README.md', depth: 1 },
      { path: 'warp.gemspec', depth: 1 },
    ],
  },
}

/* Targets the demo starts with, in dashboard order. */
const INITIAL_TARGETS = ['typescript', 'python', 'go', 'cli']

/* Everything else is offered by the "Add target" menu. Languages without a
 * sample below are listed as available but generate the same shape. */
const ADDITIONAL_TARGETS = ['java', 'ruby']

/* One generation run, as the build log renders it. Each entry is a line and
 * the delay before the next one, so the log paces like a real run. */
const BUILD_LOG = [
  ['Loading registry document @warp/warp-hr@1.5.0', 320],
  ['Bundling external $refs — 18 documents', 420],
  ['Compiling to IR — 64 operations, 112 schemas', 620],
  ['Emitting typescript → sdk/typescript', 380],
  ['Emitting python → sdk/python', 340],
  ['Emitting go → sdk/go', 340],
  ['Emitting cli → sdk/cli', 340],
  ['Formatting with Biome, ruff and gofmt', 460],
  ['Writing openapi.augmented.json — 64 code samples', 400],
  ['Pushing generated output to scalar-generated', 420],
  ['Three-way merge onto scalar-next — 1 custom file carried forward', 520],
  ['Opened release pull request #128', 300],
]

const REDUCED_MOTION = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/** Render state. `build` tracks the simulated generation run. */
const createState = () => ({
  installed: [...INITIAL_TARGETS],
  selected: 'typescript',
  tab: 'quickstart',
  version: '1.4.0',
  build: 'live',
  builtAt: '4 minutes ago',
  logIndex: 0,
})

const qs = (root, selector) => root.querySelector(selector)
const qsa = (root, selector) => Array.from(root.querySelectorAll(selector))

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) {
    node.className = className
  }
  if (text !== undefined) {
    node.textContent = text
  }
  return node
}

/** Nothing here is user input, but the demo still writes text as text. */
const setText = (node, value) => {
  if (node) {
    node.textContent = value
  }
}

const initSdkDemo = (root) => {
  if (root.dataset.sdkDemoReady === 'true') {
    return
  }
  root.dataset.sdkDemoReady = 'true'

  const state = createState()
  const timers = new Set()

  const later = (fn, delay) => {
    const id = window.setTimeout(() => {
      timers.delete(id)
      fn()
    }, delay)
    timers.add(id)
    return id
  }

  const clearTimers = () => {
    timers.forEach((id) => window.clearTimeout(id))
    timers.clear()
  }

  const nodes = {
    url: qs(root, '[data-sdk-demo-url]'),
    reload: qs(root, '[data-sdk-demo-reload]'),
    buildButton: qs(root, '[data-sdk-demo-build]'),
    statusDot: qs(root, '[data-sdk-demo-status-dot]'),
    statusLabel: qs(root, '[data-sdk-demo-status-label]'),
    statusMeta: qs(root, '[data-sdk-demo-status-meta]'),
    statusVersion: qs(root, '[data-sdk-demo-version]'),
    steps: qs(root, '[data-sdk-demo-steps]'),
    log: qs(root, '[data-sdk-demo-log]'),
    targets: qs(root, '[data-sdk-demo-targets]'),
    addTarget: qs(root, '[data-sdk-demo-add]'),
    addMenu: qs(root, '[data-sdk-demo-add-menu]'),
    tabs: qsa(root, '[data-sdk-demo-tab]'),
    codeTitle: qs(root, '[data-sdk-demo-code-title]'),
    code: qs(root, '[data-sdk-demo-code]'),
    files: qs(root, '[data-sdk-demo-files]'),
    install: qs(root, '[data-sdk-demo-install]'),
    packageName: qs(root, '[data-sdk-demo-package]'),
    registry: qs(root, '[data-sdk-demo-registry]'),
  }

  const target = () => TARGETS[state.selected]

  const renderUrl = () => {
    setText(nodes.url, `dashboard.scalar.com/sdks/${SDK_NAME}/${state.selected}`)
  }

  const renderStatus = () => {
    const running = state.build === 'running'
    const map = {
      live: ['Build live', 'sdk-demo-dot-green'],
      running: ['Building', 'sdk-demo-dot-amber'],
      queued: ['Queued', 'sdk-demo-dot-amber'],
    }
    const [label, dotClass] = map[state.build] ?? map.live

    setText(nodes.statusLabel, label)
    setText(nodes.statusMeta, running ? 'just now' : state.builtAt)
    setText(nodes.statusVersion, `v${state.version}`)

    if (nodes.statusDot) {
      nodes.statusDot.className = `sdk-demo-dot ${dotClass}`
    }

    if (nodes.buildButton) {
      nodes.buildButton.disabled = running
      setText(nodes.buildButton, running ? 'Building…' : 'Build')
    }

    root.dataset.sdkDemoState = state.build
  }

  const renderSteps = () => {
    if (!nodes.steps) {
      return
    }
    nodes.steps.replaceChildren()

    const running = state.build === 'running'
    const progress = state.logIndex / BUILD_LOG.length
    const rows = [
      ['Codegen', running ? progress > 0.75 : true],
      ['Build', running ? progress >= 1 : true],
    ]

    rows.forEach(([name, done]) => {
      const row = el('div', 'sdk-demo-step')
      row.append(el('span', 'sdk-demo-step-name', name))

      if (done) {
        const check = el('span', 'sdk-demo-step-state sdk-demo-step-done', '✓')
        check.setAttribute('aria-label', `${name} succeeded`)
        row.append(check)
      } else {
        row.append(el('span', 'sdk-demo-step-state sdk-demo-spinner'))
      }

      nodes.steps.append(row)
    })
  }

  const renderLog = () => {
    if (!nodes.log) {
      return
    }
    nodes.log.replaceChildren()
    nodes.log.hidden = state.logIndex === 0

    BUILD_LOG.slice(0, state.logIndex).forEach(([line]) => {
      nodes.log.append(el('div', 'sdk-demo-log-line', line))
    })

    nodes.log.scrollTop = nodes.log.scrollHeight
  }

  const renderTargets = () => {
    if (!nodes.targets) {
      return
    }
    nodes.targets.replaceChildren()

    state.installed.forEach((key) => {
      const config = TARGETS[key]
      const button = el('button', 'sdk-demo-target')
      button.type = 'button'
      button.dataset.target = key
      button.setAttribute('aria-pressed', key === state.selected ? 'true' : 'false')

      const monogram = el('span', 'sdk-demo-target-mark', config.monogram)
      monogram.style.setProperty('--sdk-demo-target-tone', config.tone)

      /* Name and the experimental badge share a row so the registry line
       * below keeps the full width of the card. */
      const head = el('span', 'sdk-demo-target-head')
      head.append(el('span', 'sdk-demo-target-name', config.label))

      if (!config.stable) {
        head.append(el('span', 'sdk-demo-badge', 'Experimental'))
      }

      const body = el('span', 'sdk-demo-target-body')
      body.append(head)
      body.append(el('span', 'sdk-demo-target-registry', config.registry))

      button.append(monogram, body)

      const dot = el('span', 'sdk-demo-dot sdk-demo-dot-green')
      dot.setAttribute('aria-label', 'Generated')
      button.append(dot)

      nodes.targets.append(button)
    })
  }

  const renderAddMenu = () => {
    if (!nodes.addMenu) {
      return
    }
    nodes.addMenu.replaceChildren()

    const available = ADDITIONAL_TARGETS.filter((key) => !state.installed.includes(key))

    if (!available.length) {
      nodes.addMenu.append(el('span', 'sdk-demo-add-empty', 'Every demo target is added'))
      return
    }

    available.forEach((key) => {
      const config = TARGETS[key]
      const item = el('button', 'sdk-demo-add-item')
      item.type = 'button'
      item.dataset.add = key
      item.append(el('span', 'sdk-demo-add-item-name', config.label))
      item.append(el('span', 'sdk-demo-add-item-meta', config.registry))
      nodes.addMenu.append(item)
    })
  }

  const renderFiles = () => {
    if (!nodes.files) {
      return
    }
    nodes.files.replaceChildren()

    target().files.forEach((file) => {
      const row = el('div', 'sdk-demo-file')
      row.dataset.depth = String(file.depth ?? 0)

      if (file.kind === 'dir') {
        row.classList.add('sdk-demo-file-dir')
      }

      row.append(el('span', 'sdk-demo-file-path', file.path))

      if (file.badge) {
        row.append(el('span', 'sdk-demo-file-badge', file.badge))
      }

      nodes.files.append(row)
    })
  }

  const renderPanel = () => {
    const config = target()
    const showFiles = state.tab === 'files'

    nodes.tabs.forEach((tab) => {
      const active = tab.dataset.sdkDemoTab === state.tab
      tab.setAttribute('aria-selected', active ? 'true' : 'false')
      tab.tabIndex = active ? 0 : -1
    })

    if (nodes.code) {
      nodes.code.hidden = showFiles
    }
    if (nodes.files) {
      nodes.files.hidden = !showFiles
    }

    const titles = {
      quickstart: config.quickstartFile,
      reference: 'api.md',
      skill: 'SKILL.md',
      files: `${config.files.filter((file) => file.kind !== 'dir').length} files generated`,
    }
    setText(nodes.codeTitle, titles[state.tab] ?? config.quickstartFile)

    if (showFiles) {
      renderFiles()
    } else if (nodes.code) {
      const bodies = {
        quickstart: config.quickstart,
        reference: config.reference,
        skill: config.skill,
      }
      setText(nodes.code, bodies[state.tab] ?? config.quickstart)
    }

    setText(nodes.install, config.install)
    setText(nodes.packageName, config.packageName)
    setText(nodes.registry, config.registry)
  }

  const render = () => {
    renderUrl()
    renderStatus()
    renderSteps()
    renderLog()
    renderTargets()
    renderAddMenu()
    renderPanel()
  }

  const closeAddMenu = () => {
    root.dataset.sdkDemoMenu = 'closed'
    nodes.addTarget?.setAttribute('aria-expanded', 'false')
  }

  const runBuild = () => {
    if (state.build === 'running') {
      return
    }

    clearTimers()
    closeAddMenu()

    state.build = 'running'
    state.logIndex = 0
    render()

    /* With reduced motion the run still happens, it just lands at once. */
    if (REDUCED_MOTION()) {
      state.logIndex = BUILD_LOG.length
      finishBuild()
      return
    }

    const step = (index) => {
      if (index >= BUILD_LOG.length) {
        finishBuild()
        return
      }
      state.logIndex = index + 1
      renderSteps()
      renderLog()
      later(() => step(index + 1), BUILD_LOG[index][1])
    }

    later(() => step(0), 260)
  }

  const finishBuild = () => {
    const [major, minor] = state.version.split('.')
    state.version = `${major}.${Number(minor) + 1}.0`
    state.build = 'live'
    state.builtAt = 'just now'
    render()
  }

  const reset = () => {
    clearTimers()
    closeAddMenu()
    Object.assign(state, createState())
    render()
  }

  nodes.buildButton?.addEventListener('click', runBuild)
  nodes.reload?.addEventListener('click', reset)

  nodes.targets?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-target]')
    if (!button) {
      return
    }
    state.selected = button.dataset.target
    closeAddMenu()
    render()
  })

  nodes.addTarget?.addEventListener('click', () => {
    const open = root.dataset.sdkDemoMenu === 'open'
    root.dataset.sdkDemoMenu = open ? 'closed' : 'open'
    nodes.addTarget.setAttribute('aria-expanded', open ? 'false' : 'true')
  })

  nodes.addMenu?.addEventListener('click', (event) => {
    const item = event.target.closest('[data-add]')
    if (!item) {
      return
    }
    const key = item.dataset.add
    if (!state.installed.includes(key)) {
      state.installed.push(key)
    }
    state.selected = key
    closeAddMenu()
    render()
  })

  nodes.tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      state.tab = tab.dataset.sdkDemoTab
      renderPanel()
    })
  })

  /* Left and right arrows move between tabs, as a tablist should. */
  qs(root, '[data-sdk-demo-tablist]')?.addEventListener('keydown', (event) => {
    let offset = 0
    if (event.key === 'ArrowRight') {
      offset = 1
    } else if (event.key === 'ArrowLeft') {
      offset = -1
    } else {
      return
    }
    event.preventDefault()
    const index = nodes.tabs.findIndex((tab) => tab.dataset.sdkDemoTab === state.tab)
    const next = nodes.tabs[(index + offset + nodes.tabs.length) % nodes.tabs.length]
    state.tab = next.dataset.sdkDemoTab
    renderPanel()
    next.focus()
  })

  document.addEventListener('click', (event) => {
    if (!root.contains(event.target)) {
      closeAddMenu()
    }
  })

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAddMenu()
    }
  })

  render()
}

const initAll = () => {
  document.querySelectorAll('[data-sdk-demo]').forEach(initSdkDemo)
}

initAll()

/* Docs pages swap their content client side, so re-run when the widget lands. */
const sdkDemoObserver = new MutationObserver((records) => {
  if (!records.some((record) => record.addedNodes.length)) {
    return
  }
  initAll()
})

sdkDemoObserver.observe(document.documentElement || document.body, {
  childList: true,
  subtree: true,
})
