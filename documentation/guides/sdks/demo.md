# Interactive Demo

This is the SDK Generator, running against a fictional HR API called Warp. Everything below the browser bar is the Scalar dashboard: pick a target to see the code it generates, add a language, and press **Build** to watch a generation run go from OpenAPI document to a release pull request.

Nothing here talks to a server — it is a faithful replica of the real thing, so you can see the whole flow before creating an account.

<div class="sdk-demo" data-sdk-demo data-sdk-demo-menu="closed" data-sdk-demo-state="live">
  <div class="sdk-demo-frame">
    <div class="sdk-demo-chrome">
      <div class="sdk-demo-lights" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="sdk-demo-omnibox">
        <svg class="sdk-demo-lock" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm3 8H9V7a3 3 0 1 1 6 0v3Z" />
        </svg>
        <span data-sdk-demo-url>dashboard.scalar.com/sdks/warp-hr/typescript</span>
      </div>
      <button class="sdk-demo-reload" type="button" data-sdk-demo-reload aria-label="Reset the demo">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 5V2L8 6l4 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7Z" />
        </svg>
      </button>
    </div>
    <div class="sdk-demo-viewport">
      <aside class="sdk-demo-nav" aria-hidden="true">
        <div class="sdk-demo-nav-brand">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M14.044 0c.243 0 .486.202.486.486v5.423l3.804-3.845c.202-.202.526-.202.688 0l2.914 2.914c.162.162.202.486 0 .648v.04L18.09 9.47h5.423c.284 0 .486.203.486.486v4.088a.468.468 0 0 1-.486.486h-5.423l3.845 3.804c.162.202.202.526 0 .688l-2.914 2.914c-.162.162-.486.202-.648 0h-.04L14.53 18.09v5.423a.468.468 0 0 1-.486.486H9.956a.468.468 0 0 1-.486-.486v-2.833c0-.89.365-1.74.972-2.388l5.261-5.261a1.466 1.466 0 0 0 0-2.064l-5.22-5.221A3.4 3.4 0 0 1 9.47 3.359V.486c0-.284.203-.486.486-.486h4.088Z" />
          </svg>
          <span>Warp</span>
        </div>
        <div class="sdk-demo-nav-label">Products</div>
        <div class="sdk-demo-nav-item">Overview</div>
        <div class="sdk-demo-nav-item">Registry<span>12</span></div>
        <div class="sdk-demo-nav-item">Docs<span>8</span></div>
        <div class="sdk-demo-nav-item sdk-demo-nav-active">SDKs<span>1</span></div>
        <div class="sdk-demo-nav-item">MCP<span>3</span></div>
        <div class="sdk-demo-nav-label">Settings</div>
        <div class="sdk-demo-nav-item">Configuration</div>
        <div class="sdk-demo-nav-item">Team</div>
      </aside>
      <div class="sdk-demo-main">
        <div class="sdk-demo-crumbs">SDKs<span aria-hidden="true">›</span>Warp HR SDK</div>
        <div class="sdk-demo-title-row">
          <div class="sdk-demo-title">Warp HR SDK</div>
          <div class="sdk-demo-title-actions">
            <span class="sdk-demo-ghost-button">{ } View API</span>
            <button class="sdk-demo-build-button" type="button" data-sdk-demo-build>Build</button>
          </div>
        </div>
        <div class="sdk-demo-status">
          <div class="sdk-demo-status-left">
            <span class="sdk-demo-dot sdk-demo-dot-green" data-sdk-demo-status-dot></span>
            <div class="sdk-demo-status-text">
              <span class="sdk-demo-status-label" data-sdk-demo-status-label>Build live</span>
              <span class="sdk-demo-status-meta"><code data-sdk-demo-version>v1.4.0</code><span data-sdk-demo-status-meta>4 minutes ago</span></span>
            </div>
          </div>
          <div class="sdk-demo-steps" data-sdk-demo-steps>
            <div class="sdk-demo-step">
              <span class="sdk-demo-step-name">Codegen</span>
              <span class="sdk-demo-step-state sdk-demo-step-done">✓</span>
            </div>
            <div class="sdk-demo-step">
              <span class="sdk-demo-step-name">Build</span>
              <span class="sdk-demo-step-state sdk-demo-step-done">✓</span>
            </div>
          </div>
        </div>
        <div class="sdk-demo-log" data-sdk-demo-log hidden></div>
        <div class="sdk-demo-section-head">
          <span class="sdk-demo-section-title">Targets</span>
          <div class="sdk-demo-add-wrap">
            <button class="sdk-demo-add" type="button" data-sdk-demo-add aria-expanded="false" aria-haspopup="true">+ Add target</button>
            <div class="sdk-demo-add-menu" data-sdk-demo-add-menu role="menu"></div>
          </div>
        </div>
        <div class="sdk-demo-targets" data-sdk-demo-targets>
          <button class="sdk-demo-target" type="button" data-target="typescript" aria-pressed="true">
            <span class="sdk-demo-target-mark" style="--sdk-demo-target-tone: #3178c6">TS</span>
            <span class="sdk-demo-target-body">
              <span class="sdk-demo-target-head">
                <span class="sdk-demo-target-name">Typescript</span>
              </span>
              <span class="sdk-demo-target-registry">npm</span>
            </span>
            <span class="sdk-demo-dot sdk-demo-dot-green"></span>
          </button>
        </div>
        <div class="sdk-demo-panel">
          <div class="sdk-demo-package">
            <span class="sdk-demo-package-name" data-sdk-demo-package>warp-hr</span>
            <span class="sdk-demo-package-sep" aria-hidden="true">·</span>
            <span class="sdk-demo-package-registry" data-sdk-demo-registry>npm</span>
            <code class="sdk-demo-install" data-sdk-demo-install>npm install warp-hr</code>
          </div>
          <div class="sdk-demo-tabs" role="tablist" data-sdk-demo-tablist aria-label="Generated output">
            <button class="sdk-demo-tab" type="button" role="tab" data-sdk-demo-tab="quickstart" aria-selected="true">Quickstart</button>
            <button class="sdk-demo-tab" type="button" role="tab" data-sdk-demo-tab="reference" aria-selected="false" tabindex="-1">api.md</button>
            <button class="sdk-demo-tab" type="button" role="tab" data-sdk-demo-tab="skill" aria-selected="false" tabindex="-1">SKILL.md</button>
            <button class="sdk-demo-tab" type="button" role="tab" data-sdk-demo-tab="files" aria-selected="false" tabindex="-1">Files</button>
          </div>
          <div class="sdk-demo-code-head"><span data-sdk-demo-code-title>index.ts</span></div>
          <pre class="sdk-demo-code" data-sdk-demo-code>import WarpAPI from "warp-hr";

const client = new WarpAPI({
  apiKey: process.env["WARP_API_KEY"], // defaults to the WARP_API_KEY env var
});

// Auto-paginating: the next cursor page is fetched as you iterate.
for await (const assignment of client.timeOff.listAssignments({ limit: 50 })) {
  console.log(assignment.id, assignment.policy.name);
}</pre>
          <div class="sdk-demo-files" data-sdk-demo-files hidden></div>
        </div>
      </div>
    </div>
  </div>
</div>

## What the demo is showing you

Each control maps to something the real dashboard does.

| In the demo | What it is |
| --- | --- |
| Selecting a target | Every language has its own configuration, version history, and build log. The package name and registry come from that target's config. |
| **Add target** | Targets are added to an existing SDK at any time. A new target is a draft until you save a version, and drafts are never billed. |
| **Build** | One generation run compiles your document to an intermediate representation once, then hands it to every configured emitter. See [managing your SDK](managing.md). |
| The build log | The real log is per run and streams the same stages: load, bundle, compile, emit, format, push. Failures are scoped to one target where possible. |
| **api.md** and **SKILL.md** | Generated on every build so coding agents can look up a real call signature instead of inventing one. |
| **Files** → `your code` badge | Files you edited are carried forward by a three-way merge on every rebuild. See [custom code](custom-code.md). |

## What the demo leaves out

The parts that need your accounts rather than a browser:

- **Linking a repository.** Scalar authors commits through a GitHub App installation, pushing generated output to `scalar-generated` and the merged result to `scalar-next`. See [GitHub](publishing/github.md).
- **Publishing.** release-please maintains the version and changelog pull request; merging it cuts the tag and publishes from your repository. See [publishing](publishing/overview.md).
- **Following your API.** Point an SDK at a semver range and a matching document change rebuilds every target automatically.

## Try it on your own document

<div class="flex flex-wrap gap-2">
  <a class="t-editor__button button__primary" href="https://dashboard.scalar.com/register">Generate your first SDK</a>
  <a class="t-editor__button button__secondary" href="getting-started.md">Read the getting started guide</a>
</div>

<style>
  .sdk-demo {
    margin: 32px 0;
  }

  .sdk-demo-frame {
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius-lg);
    background: var(--scalar-background-1);
    overflow: hidden;
    box-shadow: 0 18px 40px -24px rgb(0 0 0 / 35%);
  }

  .sdk-demo-chrome {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--scalar-background-2);
    border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  }

  .sdk-demo-lights {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .sdk-demo-lights span {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--scalar-background-3);
  }

  .sdk-demo-omnibox {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--scalar-background-1);
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    color: var(--scalar-color-2);
    font-size: var(--scalar-micro);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sdk-demo-lock {
    width: 11px;
    height: 11px;
    flex-shrink: 0;
    color: var(--scalar-color-3);
  }

  .sdk-demo-reload {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border-radius: var(--scalar-radius);
    background: transparent;
    color: var(--scalar-color-3);
    cursor: pointer;
  }

  .sdk-demo-reload:hover {
    background: var(--scalar-background-3);
    color: var(--scalar-color-1);
  }

  .sdk-demo-reload svg {
    width: 14px;
    height: 14px;
  }

  .sdk-demo-viewport {
    display: flex;
    min-height: 560px;
  }

  .sdk-demo-nav {
    width: 168px;
    flex-shrink: 0;
    padding: 12px 8px;
    border-right: var(--scalar-border-width) solid var(--scalar-border-color);
    background: var(--scalar-background-1);
    font-size: var(--scalar-micro);
  }

  .sdk-demo-nav-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px 12px;
    font-weight: var(--scalar-semibold);
    color: var(--scalar-color-1);
  }

  .sdk-demo-nav-brand svg {
    width: 13px;
    height: 13px;
  }

  .sdk-demo-nav-label {
    padding: 10px 8px 4px;
    color: var(--scalar-color-3);
    font-weight: var(--scalar-semibold);
  }

  .sdk-demo-nav-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 8px;
    border-radius: var(--scalar-radius);
    color: var(--scalar-color-2);
  }

  .sdk-demo-nav-item span {
    color: var(--scalar-color-3);
  }

  .sdk-demo-nav-active {
    background: var(--scalar-background-2);
    color: var(--scalar-color-1);
    font-weight: var(--scalar-semibold);
  }

  .sdk-demo-main {
    flex: 1;
    min-width: 0;
    padding: 20px 24px 24px;
  }

  .sdk-demo-crumbs {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--scalar-color-3);
    font-size: var(--scalar-micro);
  }

  .sdk-demo-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin: 6px 0 16px;
  }

  .sdk-demo-title {
    margin: 0;
    font-size: var(--scalar-font-size-1);
    font-weight: var(--scalar-bold);
    color: var(--scalar-color-1);
  }

  .sdk-demo-title-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sdk-demo-ghost-button {
    padding: 5px 10px;
    border-radius: var(--scalar-radius);
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    color: var(--scalar-color-2);
    font-size: var(--scalar-micro);
  }

  .sdk-demo-build-button {
    padding: 6px 16px;
    border-radius: var(--scalar-radius);
    background: var(--scalar-color-1);
    color: var(--scalar-background-1);
    font-size: var(--scalar-micro);
    font-weight: var(--scalar-semibold);
    cursor: pointer;
  }

  .sdk-demo-build-button:hover {
    opacity: 0.85;
  }

  .sdk-demo-build-button:disabled {
    cursor: default;
    opacity: 0.55;
  }

  .sdk-demo-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding: 10px 14px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius-lg);
    background: var(--scalar-background-1);
  }

  .sdk-demo-status-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .sdk-demo-status-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sdk-demo-status-label {
    color: var(--scalar-color-1);
    font-weight: var(--scalar-semibold);
    font-size: var(--scalar-small);
  }

  .sdk-demo-status-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--scalar-color-3);
    font-size: var(--scalar-micro);
  }

  .sdk-demo-status-meta code {
    font-family: var(--scalar-font-code);
  }

  .sdk-demo-dot {
    width: 8px;
    height: 8px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--scalar-color-3);
  }

  .sdk-demo-dot-green {
    background: var(--scalar-color-green);
  }

  .sdk-demo-dot-amber {
    background: var(--scalar-color-orange);
  }

  .sdk-demo-steps {
    display: flex;
    gap: 8px;
  }

  .sdk-demo-step {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius);
    font-size: var(--scalar-micro);
    color: var(--scalar-color-2);
  }

  .sdk-demo-step-done {
    color: var(--scalar-color-green);
  }

  .sdk-demo-spinner {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1.5px solid var(--scalar-border-color);
    border-top-color: var(--scalar-color-2);
    animation: sdk-demo-spin 0.7s linear infinite;
  }

  @keyframes sdk-demo-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .sdk-demo-log {
    max-height: 132px;
    overflow-y: auto;
    margin-top: 8px;
    padding: 10px 14px;
    border-radius: var(--scalar-radius-lg);
    background: var(--scalar-background-2);
    font-family: var(--scalar-font-code);
    font-size: var(--scalar-micro);
    color: var(--scalar-color-2);
    line-height: 1.7;
  }

  .sdk-demo-log-line::before {
    content: "› ";
    color: var(--scalar-color-3);
  }

  .sdk-demo-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 22px 0 10px;
  }

  .sdk-demo-section-title {
    color: var(--scalar-color-1);
    font-weight: var(--scalar-semibold);
    font-size: var(--scalar-small);
  }

  .sdk-demo-add-wrap {
    position: relative;
  }

  .sdk-demo-add {
    padding: 4px 8px;
    border-radius: var(--scalar-radius);
    background: transparent;
    color: var(--scalar-color-2);
    font-size: var(--scalar-micro);
    cursor: pointer;
  }

  .sdk-demo-add:hover {
    background: var(--scalar-background-2);
    color: var(--scalar-color-1);
  }

  .sdk-demo-add-menu {
    display: none;
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 5;
    min-width: 190px;
    padding: 4px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius-lg);
    background: var(--scalar-background-1);
    box-shadow: 0 10px 24px -12px rgb(0 0 0 / 40%);
  }

  .sdk-demo[data-sdk-demo-menu="open"] .sdk-demo-add-menu {
    display: block;
  }

  .sdk-demo-add-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 6px 8px;
    border-radius: var(--scalar-radius);
    background: transparent;
    font-size: var(--scalar-micro);
    color: var(--scalar-color-1);
    cursor: pointer;
    text-align: left;
  }

  .sdk-demo-add-item:hover {
    background: var(--scalar-background-2);
  }

  .sdk-demo-add-item-meta {
    color: var(--scalar-color-3);
  }

  .sdk-demo-add-empty {
    display: block;
    padding: 6px 8px;
    font-size: var(--scalar-micro);
    color: var(--scalar-color-3);
  }

  .sdk-demo-targets {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 8px;
  }

  .sdk-demo-target {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius-lg);
    background: var(--scalar-background-1);
    cursor: pointer;
    text-align: left;
  }

  .sdk-demo-target:hover {
    background: var(--scalar-background-2);
  }

  .sdk-demo-target[aria-pressed="true"] {
    border-color: var(--scalar-color-accent);
    background: var(--scalar-background-accent);
  }

  .sdk-demo-target-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border-radius: var(--scalar-radius);
    background: var(--sdk-demo-target-tone, var(--scalar-color-3));
    color: #fff;
    font-family: var(--scalar-font-code);
    font-size: 10px;
    font-weight: var(--scalar-bold);
  }

  .sdk-demo-target-body {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
    min-width: 0;
  }

  .sdk-demo-target-head {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .sdk-demo-target-name {
    color: var(--scalar-color-1);
    font-size: var(--scalar-small);
    font-weight: var(--scalar-semibold);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sdk-demo-target-registry {
    color: var(--scalar-color-3);
    font-size: var(--scalar-micro);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sdk-demo-badge {
    flex-shrink: 0;
    padding: 2px 6px;
    border-radius: 999px;
    background: var(--scalar-background-3);
    color: var(--scalar-color-2);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .sdk-demo-panel {
    margin-top: 20px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius-lg);
    overflow: hidden;
  }

  .sdk-demo-package {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 10px 14px;
    border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
    font-size: var(--scalar-micro);
  }

  .sdk-demo-package-name {
    font-family: var(--scalar-font-code);
    color: var(--scalar-color-1);
    font-weight: var(--scalar-semibold);
  }

  .sdk-demo-package-sep,
  .sdk-demo-package-registry {
    color: var(--scalar-color-3);
  }

  .sdk-demo-install {
    margin-left: auto;
    padding: 3px 8px;
    border-radius: var(--scalar-radius);
    background: var(--scalar-background-2);
    color: var(--scalar-color-2);
    font-family: var(--scalar-font-code);
  }

  .sdk-demo-tabs {
    display: flex;
    gap: 2px;
    padding: 6px 8px 0;
    border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
    overflow-x: auto;
  }

  .sdk-demo-tab {
    padding: 6px 10px;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--scalar-color-3);
    font-size: var(--scalar-micro);
    white-space: nowrap;
    cursor: pointer;
  }

  .sdk-demo-tab:hover {
    color: var(--scalar-color-1);
  }

  .sdk-demo-tab[aria-selected="true"] {
    color: var(--scalar-color-1);
    border-bottom-color: var(--scalar-color-1);
    font-weight: var(--scalar-semibold);
  }

  .sdk-demo-code-head {
    padding: 8px 14px;
    background: var(--scalar-background-2);
    color: var(--scalar-color-3);
    font-family: var(--scalar-font-code);
    font-size: var(--scalar-micro);
  }

  .sdk-demo-code {
    margin: 0;
    padding: 14px;
    min-height: 210px;
    max-height: 300px;
    overflow: auto;
    background: var(--scalar-background-1);
    color: var(--scalar-color-1);
    font-family: var(--scalar-font-code);
    font-size: var(--scalar-micro);
    line-height: 1.55;
    white-space: pre;
    tab-size: 2;
  }

  .sdk-demo-files {
    padding: 10px 14px;
    min-height: 210px;
    max-height: 300px;
    overflow: auto;
    font-family: var(--scalar-font-code);
    font-size: var(--scalar-micro);
    line-height: 1.8;
  }

  .sdk-demo-file {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--scalar-color-2);
  }

  .sdk-demo-file[data-depth="1"] {
    padding-left: 16px;
  }

  .sdk-demo-file-dir {
    color: var(--scalar-color-1);
    font-weight: var(--scalar-semibold);
  }

  .sdk-demo-file-badge {
    padding: 1px 6px;
    border-radius: 999px;
    background: var(--scalar-background-accent);
    color: var(--scalar-color-accent);
    font-family: var(--scalar-font);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  @media screen and (max-width: 800px) {
    .sdk-demo-nav {
      display: none;
    }

    .sdk-demo-main {
      padding: 16px;
    }

    .sdk-demo-viewport {
      min-height: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sdk-demo-spinner {
      animation: none;
    }
  }
</style>
