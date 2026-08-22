/*
 * Styles for the interactive SDK Generator demo.
 *
 * Kept as a string and injected by the component rather than imported as a
 * stylesheet: the MDX pipeline bundles pages with esbuild, which would emit a
 * sibling .css file that nothing on the page links to.
 */

export const SDK_DEMO_STYLES = `
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
    font-size: var(--scalar-micro);
    color: var(--scalar-color-1);
    white-space: nowrap;
    overflow: hidden;
  }

  .sdk-demo-chrome-url > span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sdk-demo-chrome-url > svg {
    width: 12px;
    height: 12px;
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
    width: 12px;
    height: 12px;
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
     Tab overview, in the shape Safari shows it: a dimmed sheet over the page
     with one card per tab, each a title above a preview of what is on it.
     --------------------------------------------------------------------- */

  .sdk-demo-overview {
    position: absolute;
    inset: 40px 0 0;
    z-index: 15;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 14px 20px 24px;
    background: color-mix(in srgb, var(--scalar-background-3) 82%, transparent);
    backdrop-filter: blur(6px);
    overflow-y: auto;
  }

  .sdk-demo-overview[hidden] {
    display: none;
  }

  .sdk-demo-overview-bar {
    display: flex;
    justify-content: flex-end;
  }

  .sdk-demo-overview-search {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 200px;
    padding: 4px 9px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius);
    background: var(--scalar-background-1);
    color: var(--scalar-color-3);
  }

  .sdk-demo-overview-search svg {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
  }

  .sdk-demo-overview-search input {
    width: 100%;
    min-width: 0;
    padding: 0;
    background: transparent;
    color: var(--scalar-color-1);
    font-family: inherit;
    font-size: var(--scalar-micro);
    outline: none;
  }

  .sdk-demo-overview-search input::placeholder {
    color: var(--scalar-color-3);
  }

  .sdk-demo-overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 18px;
    align-content: start;
  }

  .sdk-demo-tab-card {
    display: flex;
    flex-direction: column;
    padding: 0;
    border-radius: var(--scalar-radius-lg);
    background: var(--scalar-background-1);
    box-shadow: 0 8px 20px -10px rgb(0 0 0 / 45%);
    overflow: hidden;
    cursor: pointer;
    text-align: left;
  }

  .sdk-demo-tab-card[hidden] {
    display: none;
  }

  .sdk-demo-tab-card:hover,
  .sdk-demo-tab-card:focus-visible {
    outline: 2px solid var(--scalar-color-accent);
    outline-offset: 1px;
  }

  .sdk-demo-tab-card[aria-current="page"] {
    outline: 2px solid var(--scalar-color-accent);
    outline-offset: 1px;
  }

  .sdk-demo-tab-card-head {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 10px;
    border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
    color: var(--scalar-color-1);
    font-size: var(--scalar-micro);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sdk-demo-tab-card-mark {
    display: flex;
    width: 12px;
    height: 12px;
    flex-shrink: 0;
  }

  .sdk-demo-tab-card-mark svg {
    width: 100%;
    height: 100%;
  }

  .sdk-demo-tab-card-mark-video {
    color: #ff0033;
  }

  .sdk-demo-tab-card-preview {
    display: block;
    height: 128px;
    padding: 8px;
    background: var(--scalar-background-1);
    overflow: hidden;
  }

  /* A drawn miniature of the dashboard, rather than a copy of it — the real
     thing carries the demo's own hooks and must not exist twice. */
  .sdk-demo-mini {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .sdk-demo-mini-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  .sdk-demo-mini-title {
    width: 46%;
    height: 8px;
    border-radius: 2px;
    background: var(--scalar-color-3);
  }

  .sdk-demo-mini-button {
    width: 22px;
    height: 8px;
    border-radius: 2px;
    background: var(--scalar-color-1);
  }

  .sdk-demo-mini-card {
    height: 16px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: 3px;
  }

  .sdk-demo-mini-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }

  .sdk-demo-mini-grid > span {
    height: 14px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: 3px;
    background: var(--scalar-background-2);
  }

  .sdk-demo-mini-panel {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: 3px;
  }

  .sdk-demo-mini-panel > span {
    height: 4px;
    border-radius: 2px;
    background: var(--scalar-background-3);
  }

  .sdk-demo-mini-panel > span:nth-child(2) {
    width: 72%;
  }

  .sdk-demo-mini-panel > span:nth-child(3) {
    width: 48%;
  }

  .sdk-demo-tab-card-preview-video {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: #000;
  }

  .sdk-demo-mini-play {
    width: 34px;
    height: 24px;
    border-radius: 6px;
    background: #ff0033;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    position: relative;
  }

  .sdk-demo-mini-play::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-style: solid;
    border-width: 5px 0 5px 8px;
    border-color: transparent transparent transparent #fff;
  }

  /* Decorative, like the other browser furniture in the chrome. */
  .sdk-demo-tab-card-new {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 128px;
    background: color-mix(in srgb, var(--scalar-background-1) 45%, transparent);
    box-shadow: none;
    color: var(--scalar-color-3);
    font-size: 32px;
    font-weight: 300;
    cursor: default;
  }

  /* ---------------------------------------------------------------------
     Second tab
     --------------------------------------------------------------------- */

  .sdk-demo-video {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 24px;
    background: var(--scalar-background-1);
  }

  .sdk-demo-video[hidden] {
    display: none;
  }

  .sdk-demo-video-frame {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: var(--scalar-radius-lg);
    background: #000;
    overflow: hidden;
  }

  .sdk-demo-video-frame iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }

  .sdk-demo-video-caption {
    margin: 0;
    color: var(--scalar-color-2);
    font-size: var(--scalar-small);
    font-weight: var(--scalar-semibold);
  }

  /* The floating windows belong to the dashboard tab. */
  .sdk-demo[data-sdk-demo-page="video"] .sdk-demo-window {
    display: none;
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

  /* Syntax tokens, drawn from the theme's own accent colours so both
     schemes stay in step with the rest of the docs. */
  .sdk-demo-tok-comment {
    color: var(--scalar-color-3);
  }

  .sdk-demo-tok-string {
    color: var(--scalar-color-green);
  }

  .sdk-demo-tok-keyword {
    color: var(--scalar-color-purple);
  }

  .sdk-demo-tok-builtin,
  .sdk-demo-tok-number {
    color: var(--scalar-color-orange);
  }

  .sdk-demo-tok-type {
    color: var(--scalar-color-yellow);
  }

  .sdk-demo-tok-fn {
    color: var(--scalar-color-blue);
  }

  .sdk-demo-tok-flag {
    color: var(--scalar-color-blue);
  }

  .sdk-demo-tok-heading {
    color: var(--scalar-color-1);
    font-weight: var(--scalar-semibold);
  }

  .sdk-demo-tok-meta,
  .sdk-demo-tok-bullet {
    color: var(--scalar-color-3);
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
     Third tab: scalar.com, embedded
     --------------------------------------------------------------------- */

  .sdk-demo-site {
    height: 100%;
    min-height: 520px;
    background: var(--scalar-background-1);
  }

  .sdk-demo-site[hidden] {
    display: none;
  }

  .sdk-demo-site iframe {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 520px;
    border: 0;
  }

  .sdk-demo-tab-card-preview-site {
    background: var(--scalar-background-2);
  }

  .sdk-demo-mini-site {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .sdk-demo-mini-site > span {
    height: 12px;
    border-radius: 3px;
    background: var(--scalar-background-3);
  }

  .sdk-demo-mini-site > span:first-child {
    height: 34px;
  }

  .sdk-demo-mini-site > span:last-child {
    width: 60%;
  }

  .sdk-demo-tab-card-new {
    cursor: pointer;
  }

  .sdk-demo-tab-card-new:hover {
    color: var(--scalar-color-1);
  }

  /* ---------------------------------------------------------------------
     Share sheet, in the shape iOS shows it
     --------------------------------------------------------------------- */

  .sdk-demo-share-layer {
    position: absolute;
    inset: 0;
    z-index: 18;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    border-radius: var(--scalar-radius-3xl);
    overflow: hidden;
  }

  .sdk-demo-share-layer[hidden] {
    display: none;
  }

  .sdk-demo-share-scrim {
    position: absolute;
    inset: 0;
    background: rgb(0 0 0 / 35%);
  }

  .sdk-demo-share-sheet {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: min(400px, 100%);
    max-height: 100%;
    overflow-y: auto;
    padding: 8px 12px 14px;
    border-radius: 18px 18px 0 0;
    background: var(--scalar-background-2);
    animation: sdk-demo-sheet-up 0.28s cubic-bezier(0.32, 0.72, 0, 1) both;
  }

  @keyframes sdk-demo-sheet-up {
    from {
      transform: translateY(100%);
    }
  }

  .sdk-demo-share-grabber {
    width: 36px;
    height: 5px;
    margin: 0 auto 2px;
    border-radius: 999px;
    background: var(--scalar-color-3);
    opacity: 0.5;
  }

  .sdk-demo-share-card {
    border-radius: 12px;
    background: var(--scalar-background-1);
  }

  .sdk-demo-share-preview {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
  }

  .sdk-demo-share-favicon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    border-radius: 8px;
    background: var(--scalar-background-2);
    color: var(--scalar-color-1);
  }

  .sdk-demo-share-favicon svg {
    width: 18px;
    height: 18px;
  }

  .sdk-demo-share-preview-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
    min-width: 0;
  }

  .sdk-demo-share-preview-title {
    color: var(--scalar-color-1);
    font-size: var(--scalar-small);
    font-weight: var(--scalar-semibold);
  }

  .sdk-demo-share-preview-host {
    color: var(--scalar-color-3);
    font-size: var(--scalar-micro);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sdk-demo-share-options {
    flex-shrink: 0;
    color: var(--scalar-color-accent);
    font-size: var(--scalar-micro);
  }

  .sdk-demo-share-people,
  .sdk-demo-share-apps {
    display: flex;
    gap: 18px;
    padding: 4px 12px 6px;
    overflow-x: auto;
  }

  .sdk-demo-share-person,
  .sdk-demo-share-app {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    width: 58px;
    padding: 0;
    background: transparent;
    color: var(--scalar-color-2);
    font-family: inherit;
    font-size: 10px;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
  }

  .sdk-demo-share-person:hover .sdk-demo-share-tile,
  .sdk-demo-share-person:hover .sdk-demo-share-avatar,
  .sdk-demo-share-app:hover .sdk-demo-share-tile {
    filter: brightness(0.92);
  }

  /* iOS opens an app list here; there is nothing to list. */
  .sdk-demo-share-app-inert {
    cursor: default;
  }

  .sdk-demo-share-app-inert:hover .sdk-demo-share-tile {
    filter: none;
  }

  .sdk-demo-share-status {
    margin: 0;
    padding: 0 12px;
    color: var(--scalar-color-2);
    font-size: var(--scalar-micro);
    text-align: center;
  }

  .sdk-demo-share-status:empty {
    display: none;
  }

  .sdk-demo-share-avatar {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(#a2a7ae, #7e848c);
    color: #fff;
    font-size: 20px;
    font-weight: var(--scalar-semibold);
  }

  .sdk-demo-share-avatar-badge {
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 20px;
    height: 20px;
    border: 2px solid var(--scalar-background-2);
    border-radius: 50%;
    background: #4cd964;
  }

  .sdk-demo-share-tile {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    border-radius: 12px;
    background: var(--scalar-background-3);
    color: var(--scalar-color-2);
  }

  .sdk-demo-share-tile svg {
    width: 26px;
    height: 26px;
  }

  .sdk-demo-share-tile-messages {
    background: #4cd964;
  }

  .sdk-demo-share-tile-mail {
    background: #1a8cff;
  }

  .sdk-demo-share-tile-slack {
    background: #fff;
  }

  .sdk-demo-share-tile-notes {
    background: #fbdd6d;
  }

  .sdk-demo-share-person-name,
  .sdk-demo-share-app-name {
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sdk-demo-share-actions {
    display: flex;
    flex-direction: column;
  }

  .sdk-demo-share-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 11px 12px;
    background: transparent;
    color: var(--scalar-color-1);
    font-size: var(--scalar-small);
    text-align: left;
    cursor: pointer;
  }

  .sdk-demo-share-action + .sdk-demo-share-action {
    border-top: var(--scalar-border-width) solid var(--scalar-border-color);
  }

  .sdk-demo-share-action:hover {
    background: var(--scalar-background-2);
  }

  .sdk-demo-share-action svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: var(--scalar-color-2);
  }

  .sdk-demo-share-cancel {
    padding: 12px;
    border-radius: 12px;
    background: var(--scalar-background-1);
    color: var(--scalar-color-1);
    font-size: var(--scalar-small);
    font-weight: var(--scalar-semibold);
    cursor: pointer;
  }

  .sdk-demo-share-cancel:hover {
    background: var(--scalar-background-3);
  }

  .sdk-demo-chrome-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .sdk-demo-chrome-button:hover,
  .sdk-demo-chrome-button[aria-expanded="true"] {
    color: var(--scalar-color-1);
  }

  /* ---------------------------------------------------------------------
     "Click to interact" hint. Never takes pointer events, so the click that
     dismisses it lands on whatever the reader was aiming at.
     --------------------------------------------------------------------- */

  .sdk-demo-hint {
    position: absolute;
    inset: 0;
    z-index: 16;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .sdk-demo-hint[hidden] {
    display: none;
  }

  .sdk-demo-hint-pill {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 9px 18px 9px 14px;
    border: 1px solid color-mix(in srgb, var(--scalar-color-green) 55%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--scalar-color-green) 16%, var(--scalar-background-1));
    color: var(--scalar-color-1);
    font-size: var(--scalar-small);
    font-weight: var(--scalar-semibold);
    white-space: nowrap;
    box-shadow:
      0 0 0 6px color-mix(in srgb, var(--scalar-color-green) 10%, transparent),
      0 10px 24px -12px rgb(0 0 0 / 45%);
    animation: sdk-demo-hint-in 0.4s ease both;
  }

  .sdk-demo-hint-dot {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--scalar-color-green);
    animation: sdk-demo-hint-pulse 2s ease-in-out infinite;
  }

  @keyframes sdk-demo-hint-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }

  @keyframes sdk-demo-hint-pulse {
    50% {
      opacity: 0.35;
    }
  }

  /* ---------------------------------------------------------------------
     Floating windows — the build terminal and the API document. Both share
     one minimal chrome: stoplights, a shorter bar than the omnibar, no URL.
     They stay dark in either theme, the way a terminal is.
     --------------------------------------------------------------------- */

  .sdk-demo-window {
    position: absolute;
    z-index: 12;
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: var(--scalar-radius-2xl);
    background: #0d0f12;
    overflow: hidden;
    box-shadow: 0 24px 48px -18px rgb(0 0 0 / 55%);
  }

  .sdk-demo-window[hidden] {
    display: none;
  }

  .sdk-demo-window-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 26px;
    padding: 0 10px;
    background: #16191e;
    cursor: grab;
    touch-action: none;
    user-select: none;
  }

  .sdk-demo-window-bar[data-dragging="true"] {
    cursor: grabbing;
  }

  .sdk-demo-window-lights {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .sdk-demo-window-lights > * {
    width: 9px;
    height: 9px;
    padding: 0;
    border-radius: 50%;
    background: #3a3f47;
  }

  .sdk-demo-window-lights > button {
    cursor: pointer;
  }

  .sdk-demo-window-lights > button:hover,
  .sdk-demo-window-lights > button:focus-visible {
    background: #ec6a5e;
  }

  .sdk-demo-window-title {
    color: #8b949e;
    font-family: var(--scalar-font-code);
    font-size: 11px;
  }

  /* The modifiers only say where each window sits. */
  .sdk-demo-window-build {
    right: 20px;
    bottom: 20px;
    width: min(370px, calc(100% - 40px));
  }

  .sdk-demo-window-api {
    left: 20px;
    bottom: 20px;
    width: min(380px, calc(100% - 40px));
  }

  .sdk-demo-log,
  .sdk-demo-api-doc {
    overflow: auto;
    padding: 10px 12px;
    font-family: var(--scalar-font-code);
    font-size: 11px;
    line-height: 1.75;
    color: #8b949e;
  }

  .sdk-demo-log {
    height: 190px;
  }

  .sdk-demo-api-doc {
    margin: 0;
    height: 230px;
    color: #c9d1d9;
    white-space: pre;
    tab-size: 2;
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

  /* The document sits on the dark window, so its tokens cannot use the page
     palette — those are tuned for the page background, not this one. */
  .sdk-demo-api-doc .sdk-demo-tok-key {
    color: #79c0ff;
  }

  .sdk-demo-api-doc .sdk-demo-tok-string {
    color: #a5d6ff;
  }

  .sdk-demo-api-doc .sdk-demo-tok-number,
  .sdk-demo-api-doc .sdk-demo-tok-builtin {
    color: #ffa657;
  }

  .sdk-demo-api-doc .sdk-demo-tok-comment,
  .sdk-demo-api-doc .sdk-demo-tok-bullet {
    color: #8b949e;
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

    .sdk-demo-window-build,
    .sdk-demo-window-api {
      right: 12px;
      left: 12px;
      bottom: 12px;
      width: auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sdk-demo-spinner,
    .sdk-demo-log-cursor {
      animation: none;
    }

    .sdk-demo-hint-pill,
    .sdk-demo-hint-dot,
    .sdk-demo-share-sheet {
      animation: none;
    }
  }
`
