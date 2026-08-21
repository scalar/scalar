# Interactive Demo

This is the SDK Generator, running against a fictional HR API called Warp. Everything below the browser bar is the Scalar dashboard: pick a target to see the code it generates, add a language, and press **Build** to watch a generation run go from OpenAPI document to a release pull request.

Nothing here talks to a server — it is a faithful replica of the real thing, so you can see the whole flow before creating an account.

<div class="sdk-demo" data-sdk-demo data-sdk-demo-menu="closed" data-sdk-demo-state="live">
  <div class="sdk-demo-stage">
    <div class="sdk-demo-frame" data-sdk-demo-frame>
      <div class="sdk-demo-chrome" data-sdk-demo-chrome>
        <div class="sdk-demo-chrome-lights" aria-hidden="true"></div>
        <div class="sdk-demo-chrome-left" aria-hidden="true">
          <svg fill="currentColor" height="16" viewBox="0 0 20 16" width="20">
            <path clip-rule="evenodd" d="M19.4 15.4a2 2 0 0 1-1.4.6H2a2 2 0 0 1-1.4-.6A2 2 0 0 1 0 14V2C0 1.4.2 1 .6.6A2 2 0 0 1 2 0h16c.6 0 1 .2 1.4.6.4.4.6.8.6 1.4v12c0 .6-.2 1-.6 1.4ZM2 14h5V2H2v12Zm7 0h9V2H9v12ZM3.3 3c-.2 0-.3.2-.3.3v1c0 .2.1.3.3.3h2.5c.1 0 .2-.1.2-.3v-1l-.2-.2H3.3Zm0 2c-.2 0-.3.2-.3.3v1c0 .2.1.3.3.3h2.5c.1 0 .2-.1.2-.3v-1l-.2-.2H3.3ZM3 7.4c0-.1.1-.2.3-.2h2.5c.1 0 .2 0 .2.2v1c0 .2-.1.3-.2.3H3.3a.3.3 0 0 1-.3-.3v-1Z" fill-rule="evenodd" />
          </svg>
          <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24">
            <path d="M16 22 6 12 16 2l1.8 1.8L9.5 12l8.3 8.2L16 22Z" />
          </svg>
          <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24">
            <path d="m8 22 10-10L8 2 6.2 3.8l8.3 8.2-8.3 8.2L8 22Z" />
          </svg>
        </div>
        <div class="sdk-demo-chrome-nav">
          <div class="sdk-demo-chrome-url">
            <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 10H15V6C15 5.16667 14.7083 4.45833 14.125 3.875C13.5417 3.29167 12.8333 3 12 3C11.1667 3 10.4583 3.29167 9.875 3.875C9.29167 4.45833 9 5.16667 9 6V10H7V6C7 4.61667 7.4875 3.4375 8.4625 2.4625C9.4375 1.4875 10.6167 1 12 1C13.3833 1 14.5625 1.4875 15.5375 2.4625C16.5125 3.4375 17 4.61667 17 6V10C17.55 10 18.0208 10.1958 18.4125 10.5875C18.8042 10.9792 19 11.45 19 12V20C19 20.55 18.8042 21.0208 18.4125 21.4125C18.0208 21.8042 17.55 22 17 22H7C6.45 22 5.97917 21.8042 5.5875 21.4125C5.19583 21.0208 5 20.55 5 20V12C5 11.45 5.19583 10.9792 5.5875 10.5875C5.97917 10.1958 6.45 10 7 10Z" />
            </svg>
            <span data-sdk-demo-url>dashboard.scalar.com/sdks/warp-hr/typescript</span>
            <button type="button" data-sdk-demo-reload aria-label="Reload and reset the demo">
              <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 22a8.7 8.7 0 0 0 6.4-2.6A9.1 9.1 0 0 0 21 13h-2c0 2-.7 3.6-2 5-1.4 1.3-3 2-5 2s-3.6-.7-5-2c-1.3-1.4-2-3-2-5s.7-3.6 2-5c1.4-1.3 3-2 5-2h.2l-1.6 1.5L12 9l4-4-4-4-1.4 1.5L12.2 4H12a8.7 8.7 0 0 0-6.4 2.6A9.1 9.1 0 0 0 3 13a8.7 8.7 0 0 0 2.6 6.4A9.1 9.1 0 0 0 12 22Z" />
              </svg>
            </button>
          </div>
        </div>
        <div class="sdk-demo-chrome-right" aria-hidden="true">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 23a2 2 0 0 1-1.4-.6A2 2 0 0 1 4 21V10c0-.6.2-1 .6-1.4A2 2 0 0 1 6 8h3v2H6v11h12V10h-3V8h3c.6 0 1 .2 1.4.6.4.4.6.8.6 1.4v11c0 .6-.2 1-.6 1.4a2 2 0 0 1-1.4.6H6Zm5-7V4.8L9.4 6.4 8 5l4-4 4 4-1.4 1.4L13 4.8V16h-2Z" />
          </svg>
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2v-6Z" />
          </svg>
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 22a2 2 0 0 1-1.4-.6A2 2 0 0 1 6 20v-2H4a2 2 0 0 1-1.4-.6A2 2 0 0 1 2 16V6h2v10h2V8c0-.5.2-1 .6-1.4A2 2 0 0 1 8 6h8V4H6V2h10c.6 0 1 .2 1.4.6.4.4.6.9.6 1.4v2h2c.6 0 1 .2 1.4.6.4.4.6.9.6 1.4v12c0 .6-.2 1-.6 1.4a2 2 0 0 1-1.4.6H8Zm0-2h12V8H8v12ZM2 6V4c0-.5.2-1 .6-1.4A2 2 0 0 1 4 2h2v2H4v2H2Z" />
          </svg>
        </div>
      </div>
      <div class="sdk-demo-viewport">
        <div class="sdk-demo-main">
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
          <div class="sdk-demo-section-head">
            <span class="sdk-demo-section-title">Targets</span>
            <div class="sdk-demo-add-wrap">
              <button class="sdk-demo-add" type="button" data-sdk-demo-add aria-expanded="false" aria-haspopup="true">+ Add target</button>
              <div class="sdk-demo-add-menu" data-sdk-demo-add-menu role="menu"></div>
            </div>
          </div>
          <div class="sdk-demo-targets" data-sdk-demo-targets>
            <button class="sdk-demo-target" type="button" data-target="typescript" aria-pressed="true">
              <span class="sdk-demo-target-mark"><svg aria-hidden="true" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#3178C6"><path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z" /></svg></span>
              <span class="sdk-demo-target-body">
                <span class="sdk-demo-target-head">
                  <span class="sdk-demo-target-name">Typescript</span>
                </span>
                <span class="sdk-demo-target-registry">npm</span>
              </span>
              <span class="sdk-demo-dot sdk-demo-dot-green"></span>
            </button>
          </div>
          <div class="sdk-demo-package">
            <span class="sdk-demo-package-title">
              <span class="sdk-demo-package-name" data-sdk-demo-package>warp-hr</span>
              <span class="sdk-demo-package-sep" aria-hidden="true">·</span>
              <span class="sdk-demo-package-registry" data-sdk-demo-registry>npm</span>
            </span>
            <span class="sdk-demo-install" data-sdk-demo-install>npm install warp-hr</span>
          </div>
          <div class="sdk-demo-panel">
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
    <div class="sdk-demo-build-window" data-sdk-demo-build-window hidden>
      <div class="sdk-demo-build-window-bar" data-sdk-demo-build-window-bar>
        <div class="sdk-demo-build-window-lights">
          <button type="button" data-sdk-demo-build-window-close aria-label="Close the build log"></button>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </div>
      </div>
      <div class="sdk-demo-log" data-sdk-demo-log role="log" aria-label="Build log"></div>
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

  /* Positioning context for the build window, which layers over the browser. */
  .sdk-demo-stage {
    position: relative;
  }

  .sdk-demo-frame {
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius-3xl);
    background: var(--scalar-background-1);
    overflow: hidden;
    box-shadow: 0 18px 40px -24px rgb(0 0 0 / 35%);
  }

  /* ---------------------------------------------------------------------
     Browser chrome, matching the omnibar on scalar.com/app-docs-animated.svg
     --------------------------------------------------------------------- */

  .sdk-demo-chrome {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    background: var(--scalar-background-2);
    border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
    cursor: grab;
    touch-action: none;
    user-select: none;
  }

  .sdk-demo-chrome[data-dragging="true"] {
    cursor: grabbing;
  }

  .sdk-demo-chrome-lights {
    position: absolute;
    top: 15px;
    left: 12px;
    width: 10px;
    height: 9px;
    border-radius: 50%;
    background: var(--scalar-background-3);
    box-shadow:
      14px 0 0 var(--scalar-background-3),
      29px 0 0 var(--scalar-background-3);
  }

  .sdk-demo-chrome-left {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 150px;
    padding-left: 68px;
    color: var(--scalar-color-3);
  }

  .sdk-demo-chrome-left svg {
    width: 16px;
    height: 16px;
  }

  .sdk-demo-chrome-left svg:last-of-type {
    opacity: 0.5;
  }

  .sdk-demo-chrome-nav {
    flex: 1;
    max-width: 600px;
    padding: 6px 0;
  }

  .sdk-demo-chrome-url {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    padding: 0 24px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: 7px;
    font-size: 13px;
    color: var(--scalar-color-1);
    white-space: nowrap;
    overflow: hidden;
  }

  .sdk-demo-chrome-url > span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sdk-demo-chrome-url > svg {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
    margin-right: 3px;
    color: var(--scalar-color-3);
  }

  .sdk-demo-chrome-url button {
    position: absolute;
    right: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: transparent;
    color: var(--scalar-color-3);
    cursor: pointer;
  }

  .sdk-demo-chrome-url button:hover {
    background: var(--scalar-background-3);
    color: var(--scalar-color-1);
  }

  .sdk-demo-chrome-url button svg {
    width: 13px;
    height: 13px;
  }

  .sdk-demo-chrome-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    width: 150px;
    padding-right: 12px;
    color: var(--scalar-color-3);
  }

  .sdk-demo-chrome-right svg {
    width: 17px;
    height: 17px;
  }

  /* ---------------------------------------------------------------------
     Dashboard replica
     --------------------------------------------------------------------- */

  .sdk-demo-viewport {
    min-height: 520px;
  }

  .sdk-demo-main {
    padding: 22px 24px 24px;
  }

  .sdk-demo-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .sdk-demo-title {
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

  /* Selection reads as a filled row; the border stays the default. */
  .sdk-demo-target[aria-pressed="true"] {
    background: var(--scalar-background-2);
  }

  .sdk-demo-target-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: var(--scalar-color-1);
  }

  .sdk-demo-target-mark svg {
    width: 100%;
    height: 100%;
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

  /* The package line is a section title, not a code block. */
  .sdk-demo-package {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin: 22px 0 10px;
  }

  .sdk-demo-package-title {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
  }

  .sdk-demo-package-name {
    color: var(--scalar-color-1);
    font-size: var(--scalar-small);
    font-weight: var(--scalar-semibold);
  }

  .sdk-demo-package-sep,
  .sdk-demo-package-registry {
    color: var(--scalar-color-3);
    font-size: var(--scalar-micro);
  }

  .sdk-demo-install {
    color: var(--scalar-color-3);
    font-family: var(--scalar-font-code);
    font-size: var(--scalar-micro);
  }

  .sdk-demo-panel {
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius-lg);
    overflow: hidden;
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

  /* ---------------------------------------------------------------------
     Build window — a second, minimal window with a terminal inside.
     It stays dark in both themes, the way a terminal does.
     --------------------------------------------------------------------- */

  .sdk-demo-build-window {
    position: absolute;
    right: 20px;
    bottom: 20px;
    z-index: 12;
    width: min(370px, calc(100% - 40px));
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: var(--scalar-radius-2xl);
    background: #0d0f12;
    overflow: hidden;
    box-shadow: 0 24px 48px -18px rgb(0 0 0 / 55%);
  }

  .sdk-demo-build-window[hidden] {
    display: none;
  }

  .sdk-demo-build-window-bar {
    display: flex;
    align-items: center;
    height: 26px;
    padding: 0 10px;
    background: #16191e;
    cursor: grab;
    touch-action: none;
    user-select: none;
  }

  .sdk-demo-build-window-bar[data-dragging="true"] {
    cursor: grabbing;
  }

  .sdk-demo-build-window-lights {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .sdk-demo-build-window-lights > * {
    width: 9px;
    height: 9px;
    padding: 0;
    border-radius: 50%;
    background: #3a3f47;
  }

  .sdk-demo-build-window-lights > button {
    cursor: pointer;
  }

  .sdk-demo-build-window-lights > button:hover,
  .sdk-demo-build-window-lights > button:focus-visible {
    background: #ec6a5e;
  }

  .sdk-demo-log {
    height: 190px;
    overflow-y: auto;
    padding: 10px 12px;
    font-family: var(--scalar-font-code);
    font-size: 11px;
    line-height: 1.75;
    color: #8b949e;
  }

  .sdk-demo-log-line {
    display: flex;
    gap: 7px;
  }

  .sdk-demo-log-prompt {
    flex-shrink: 0;
    color: #3fb950;
  }

  .sdk-demo-log-active .sdk-demo-log-text {
    color: #e6edf3;
  }

  .sdk-demo-log-cursor {
    width: 6px;
    height: 12px;
    margin-top: 3px;
    background: #3fb950;
    animation: sdk-demo-blink 1s steps(2, start) infinite;
  }

  @keyframes sdk-demo-blink {
    to {
      visibility: hidden;
    }
  }

  @media screen and (max-width: 760px) {
    .sdk-demo-chrome-left,
    .sdk-demo-chrome-right {
      display: none;
    }

    .sdk-demo-chrome-nav {
      padding: 6px 12px 6px 68px;
    }

    .sdk-demo-main {
      padding: 16px;
    }

    .sdk-demo-viewport {
      min-height: 0;
    }

    .sdk-demo-build-window {
      right: 12px;
      bottom: 12px;
      width: calc(100% - 24px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sdk-demo-spinner,
    .sdk-demo-log-cursor {
      animation: none;
    }
  }
</style>
