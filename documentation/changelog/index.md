# Changelog

Everything that shipped across Scalar, in one stream. Filter by product, scrub the release history, search every change, or diff two versions before you upgrade.

<div class="changelog" data-changelog data-changelog-state="static">
  <div class="changelog-header">
    <div class="changelog-stats" data-changelog-stats></div>
    <button class="changelog-mark-read" type="button" data-changelog-mark-read hidden>
      <span class="changelog-mark-read-dot" aria-hidden="true"></span>
      <span data-changelog-new-count></span> since your last visit
      <span class="changelog-mark-read-action">Mark read</span>
    </button>
  </div>

  <section class="changelog-activity" aria-label="Shipping activity">
    <div class="changelog-activity-head">
      <span class="changelog-activity-title">Shipping activity</span>
      <div class="changelog-legend" data-changelog-chart-legend></div>
      <button class="changelog-text-button" type="button" data-changelog-chart-reset hidden>Clear selection</button>
    </div>
    <div class="changelog-chart" data-changelog-chart role="group" aria-label="Releases per week. Select a column to filter the stream."></div>
    <p class="changelog-activity-hint">Every column is a week. Pick one to see just those releases.</p>
  </section>

  <div class="changelog-controls">
    <div class="changelog-chips" data-changelog-chips role="group" aria-label="Filter by product"></div>
    <div class="changelog-tools">
      <label class="changelog-search">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5Zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" />
        </svg>
        <input type="search" placeholder="Search every change" data-changelog-search aria-label="Search every change" />
        <kbd aria-hidden="true">/</kbd>
      </label>
      <button class="changelog-toggle" type="button" data-changelog-features aria-pressed="false">Features only</button>
      <button class="changelog-toggle" type="button" data-changelog-compare aria-expanded="false">Compare versions</button>
      <button class="changelog-text-button" type="button" data-changelog-reset hidden>Reset</button>
    </div>
  </div>

  <div class="changelog-compare" data-changelog-compare-panel hidden>
    <div class="changelog-compare-row">
      <label class="changelog-field">
        <span>Product</span>
        <select data-changelog-compare-product></select>
      </label>
      <label class="changelog-field">
        <span>From</span>
        <select data-changelog-compare-from></select>
      </label>
      <label class="changelog-field">
        <span>To</span>
        <select data-changelog-compare-to></select>
      </label>
    </div>
    <p class="changelog-compare-summary" data-changelog-compare-summary role="status"></p>
  </div>

  <p class="changelog-count" data-changelog-count role="status"></p>

  <ol class="changelog-stream" data-changelog-stream></ol>

  <div class="changelog-empty" data-changelog-empty hidden>
    <strong>No releases match.</strong>
    <span>Try a different product, a wider week, or clear the search.</span>
  </div>

  <div data-changelog-static>
    <p>Each product maintains a user-facing summary generated from its Changesets changelog on every release. Choose a product to read what shipped recently:</p>

<scalar-page-link filepath="projects/scalar-app/RELEASE_NOTES.md" title="API Client" description="Desktop and web API testing client">
</scalar-page-link>

<scalar-page-link filepath="packages/api-reference/RELEASE_NOTES.md" title="API Reference" description="OpenAPI documentation component for Vue and framework integrations">
</scalar-page-link>

<scalar-page-link filepath="packages/agent-chat/RELEASE_NOTES.md" title="Agent" description="OpenAPI-backed agent chat UI and SDK for connecting APIs to LLMs">
</scalar-page-link>

<scalar-page-link filepath="packages/mock-server/RELEASE_NOTES.md" title="Mock Server" description="Node.js mock server that generates realistic API responses from OpenAPI documents">
</scalar-page-link>
  </div>
</div>

Each release links to the full maintainer changelog on GitHub when you need every pull request that landed in a version.

<style>
  /* -----------------------------------------------------------------------
     Per-product accents. Everything keyed off `data-product` picks these up,
     so a new product needs one block here and nothing else.
     ----------------------------------------------------------------------- */

  .changelog [data-product="api-client"] {
    --changelog-accent: #3564d9;
  }

  .changelog [data-product="api-reference"] {
    --changelog-accent: #159f6f;
  }

  .changelog [data-product="agent"] {
    --changelog-accent: #a855f7;
  }

  .changelog [data-product="mock-server"] {
    --changelog-accent: #e0821c;
  }

  .dark-mode .changelog [data-product="api-client"] {
    --changelog-accent: #6f97ff;
  }

  .dark-mode .changelog [data-product="api-reference"] {
    --changelog-accent: #3fc796;
  }

  .dark-mode .changelog [data-product="agent"] {
    --changelog-accent: #c084fc;
  }

  .dark-mode .changelog [data-product="mock-server"] {
    --changelog-accent: #f0a94c;
  }

  .changelog {
    --changelog-accent: var(--scalar-color-1);
    margin: 32px 0 40px;
  }

  /* Several pieces below set `display`, which would otherwise beat the browser's
     rule for `hidden` and leave them on screen when the widget hides them. */
  .changelog [hidden] {
    display: none !important;
  }

  /* Nothing below is styled until the widget has data, so the static list is
     all a reader without JavaScript sees. */
  .changelog[data-changelog-state="static"] > :not([data-changelog-static]) {
    display: none;
  }

  /* -----------------------------------------------------------------------
     Header and counters
     ----------------------------------------------------------------------- */

  .changelog-header {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  .changelog-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, auto));
    gap: 8px 32px;
  }

  @media screen and (max-width: 600px) {
    .changelog-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
    }

    .changelog-stat-value {
      font-size: var(--scalar-font-size-3);
    }
  }

  .changelog-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .changelog-stat-value {
    font-size: var(--scalar-font-size-2);
    font-weight: var(--scalar-bold);
    color: var(--scalar-color-1);
    line-height: 1.2;
  }

  .changelog-stat-label {
    font-size: var(--scalar-micro);
    color: var(--scalar-color-3);
  }

  .changelog-mark-read {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px 6px 12px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius-full, 999px);
    background: var(--scalar-background-1);
    font-size: var(--scalar-micro);
    color: var(--scalar-color-2);
    cursor: pointer;
  }

  .changelog-mark-read:hover {
    background: var(--scalar-background-2);
  }

  .changelog-mark-read-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #159f6f;
  }

  .changelog-mark-read-action {
    padding: 2px 8px;
    border-radius: var(--scalar-radius-full, 999px);
    background: var(--scalar-background-3);
    color: var(--scalar-color-1);
  }

  /* -----------------------------------------------------------------------
     Activity chart
     ----------------------------------------------------------------------- */

  .changelog-activity {
    margin-top: 20px;
    padding: 16px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius-lg);
    background: var(--scalar-background-1);
  }

  .changelog-activity-head {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    align-items: center;
  }

  .changelog-activity-title {
    font-size: var(--scalar-small);
    font-weight: var(--scalar-semibold);
    color: var(--scalar-color-1);
  }

  .changelog-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-right: auto;
  }

  .changelog-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: var(--scalar-micro);
    color: var(--scalar-color-3);
  }

  .changelog-legend-swatch {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    background: var(--changelog-accent);
  }

  .changelog-chart {
    display: flex;
    gap: 3px;
    align-items: flex-end;
    height: 96px;
    margin-top: 14px;
  }

  .changelog-chart-column {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-end;
    gap: 6px;
    height: 100%;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }

  .changelog-chart-bar {
    display: flex;
    flex-direction: column-reverse;
    gap: 2px;
    min-height: 2px;
    border-radius: 3px;
    background: var(--scalar-background-3);
    overflow: hidden;
    transition: opacity 0.15s ease;
  }

  .changelog-chart-segment {
    flex-basis: 0;
    min-height: 4px;
    border-radius: 2px;
    background: var(--changelog-accent);
  }

  .changelog-chart-tick {
    font-size: 9px;
    line-height: 1;
    color: var(--scalar-color-3);
    text-align: center;
  }

  /* One selected column dims the rest, so the filter is visible in the chart
     itself and not only in the stream below it. */
  .changelog-chart:has([aria-pressed="true"]) .changelog-chart-column[aria-pressed="false"] .changelog-chart-bar {
    opacity: 0.25;
  }

  .changelog-chart-column:hover .changelog-chart-bar,
  .changelog-chart-column:focus-visible .changelog-chart-bar {
    opacity: 1;
    outline: 2px solid var(--scalar-color-3);
    outline-offset: 2px;
  }

  .changelog-activity-hint {
    margin: 10px 0 0;
    font-size: var(--scalar-micro);
    color: var(--scalar-color-3);
  }

  /* -----------------------------------------------------------------------
     Filters
     ----------------------------------------------------------------------- */

  .changelog-controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
  }

  .changelog-chips,
  .changelog-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .changelog-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius-full, 999px);
    background: var(--scalar-background-1);
    font-size: var(--scalar-micro);
    color: var(--scalar-color-2);
    cursor: pointer;
  }

  .changelog-chip:hover {
    background: var(--scalar-background-2);
  }

  .changelog-chip[aria-pressed="true"] {
    border-color: var(--changelog-accent);
    color: var(--scalar-color-1);
    box-shadow: inset 0 0 0 1px var(--changelog-accent);
  }

  .changelog-chip-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--changelog-accent);
  }

  .changelog-chip-count {
    color: var(--scalar-color-3);
    font-variant-numeric: tabular-nums;
  }

  .changelog-search {
    display: inline-flex;
    flex: 1;
    min-width: 200px;
    align-items: center;
    gap: 8px;
    padding: 0 8px 0 10px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius);
    background: var(--scalar-background-1);
  }

  .changelog-search:focus-within {
    border-color: var(--scalar-color-3);
  }

  .changelog-search svg {
    width: 14px;
    height: 14px;
    color: var(--scalar-color-3);
  }

  .changelog-search input {
    flex: 1;
    min-width: 0;
    padding: 7px 0;
    border: 0;
    background: none;
    font-size: var(--scalar-small);
    color: var(--scalar-color-1);
    outline: none;
  }

  .changelog-search kbd {
    padding: 1px 6px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: 4px;
    font-family: var(--scalar-font-code);
    font-size: 10px;
    color: var(--scalar-color-3);
  }

  .changelog-toggle {
    padding: 6px 12px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius);
    background: var(--scalar-background-1);
    font-size: var(--scalar-micro);
    color: var(--scalar-color-2);
    cursor: pointer;
    white-space: nowrap;
  }

  .changelog-toggle:hover {
    background: var(--scalar-background-2);
  }

  .changelog-toggle[aria-pressed="true"],
  .changelog-toggle[aria-expanded="true"] {
    background: var(--scalar-background-3);
    color: var(--scalar-color-1);
  }

  .changelog-text-button {
    padding: 6px 4px;
    border: 0;
    background: none;
    font-size: var(--scalar-micro);
    color: var(--scalar-color-3);
    text-decoration: underline;
    cursor: pointer;
  }

  .changelog-text-button:hover {
    color: var(--scalar-color-1);
  }

  /* -----------------------------------------------------------------------
     Compare panel
     ----------------------------------------------------------------------- */

  .changelog-compare {
    margin-top: 12px;
    padding: 14px 16px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius-lg);
    background: var(--scalar-background-2);
  }

  .changelog-compare-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .changelog-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--scalar-micro);
    color: var(--scalar-color-3);
  }

  .changelog-field select {
    padding: 6px 8px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: var(--scalar-radius);
    background: var(--scalar-background-1);
    font-size: var(--scalar-small);
    color: var(--scalar-color-1);
  }

  .changelog-compare-summary {
    margin: 12px 0 0;
    font-size: var(--scalar-small);
    color: var(--scalar-color-2);
  }

  .changelog-compare-summary code {
    font-size: var(--scalar-micro);
  }

  /* -----------------------------------------------------------------------
     Release stream
     ----------------------------------------------------------------------- */

  .changelog-count {
    margin: 18px 0 8px;
    font-size: var(--scalar-micro);
    color: var(--scalar-color-3);
  }

  .changelog-stream {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .changelog-entry {
    display: grid;
    grid-template-columns: 12px 132px minmax(0, 1fr);
    gap: 0 14px;
  }

  @media screen and (max-width: 720px) {
    .changelog-entry {
      grid-template-columns: 12px minmax(0, 1fr);
    }

    .changelog-entry-aside {
      grid-column: 2;
      flex-direction: row;
      gap: 8px;
      padding-bottom: 6px;
    }
  }

  /* The rail is one continuous line down the stream, drawn per entry so the
     first and last ones can cap it. */
  .changelog-entry-rail {
    position: relative;
    display: flex;
    justify-content: center;
  }

  .changelog-entry-rail::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: var(--scalar-border-width);
    background: var(--scalar-border-color);
  }

  .changelog-entry:first-child .changelog-entry-rail::before {
    top: 9px;
  }

  .changelog-entry:last-child .changelog-entry-rail::before {
    bottom: calc(100% - 9px);
  }

  .changelog-entry-dot {
    position: relative;
    width: 9px;
    height: 9px;
    margin-top: 5px;
    border-radius: 50%;
    background: var(--changelog-accent);
  }

  /* A release published since the reader was last here gets a halo. */
  .changelog-entry[data-new="true"] .changelog-entry-dot::after {
    content: '';
    position: absolute;
    inset: -4px;
    border: var(--scalar-border-width) solid var(--changelog-accent);
    border-radius: 50%;
    opacity: 0.5;
  }

  .changelog-entry-aside {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding-top: 1px;
  }

  .changelog-entry-date {
    font-size: var(--scalar-micro);
    font-weight: var(--scalar-semibold);
    color: var(--scalar-color-2);
  }

  .changelog-entry-ago {
    font-size: var(--scalar-micro);
    color: var(--scalar-color-3);
  }

  .changelog-card {
    padding: 0 0 28px;
    min-width: 0;
  }

  .changelog-entry:last-child .changelog-card {
    padding-bottom: 4px;
  }

  .changelog-card-head {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .changelog-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: var(--scalar-micro);
    font-weight: var(--scalar-semibold);
    color: var(--changelog-accent);
  }

  .changelog-badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .changelog-version {
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--scalar-background-3);
    font-size: var(--scalar-micro);
  }

  .changelog-kind {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--scalar-color-3);
  }

  .changelog-entry[data-kind="patch"] .changelog-kind {
    display: none;
  }

  .changelog-new {
    padding: 1px 6px;
    border-radius: var(--scalar-radius-full, 999px);
    background: var(--changelog-accent);
    font-size: 10px;
    font-weight: var(--scalar-bold);
    color: var(--scalar-background-1);
  }

  .changelog-entry[data-new="false"] .changelog-new {
    display: none;
  }

  /* The permalink only appears once the card is hovered or focused, the way a
     heading anchor does. */
  .changelog-permalink {
    margin-left: auto;
    font-size: var(--scalar-micro);
    color: var(--scalar-color-3);
    text-decoration: none;
    opacity: 0;
  }

  .changelog-entry:hover .changelog-permalink,
  .changelog-permalink:focus-visible {
    opacity: 1;
  }

  .changelog-card-title {
    margin: 6px 0 0;
    font-size: var(--scalar-font-size-3);
    font-weight: var(--scalar-semibold);
    line-height: 1.35;
    color: var(--scalar-color-1);
  }

  .changelog-card-summary {
    margin: 6px 0 0;
    font-size: var(--scalar-small);
    line-height: 1.6;
    color: var(--scalar-color-2);
  }

  .changelog-card-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    padding: 0;
    border: 0;
    background: none;
    font-size: var(--scalar-micro);
    color: var(--scalar-color-3);
    cursor: pointer;
  }

  .changelog-card-toggle:hover {
    color: var(--scalar-color-1);
  }

  .changelog-card-caret {
    display: inline-block;
    transition: transform 0.15s ease;
  }

  .changelog-card-toggle[aria-expanded="true"] .changelog-card-caret {
    transform: rotate(90deg);
  }

  .changelog-card-changes {
    margin: 8px 0 0;
    padding-left: 18px;
    font-size: var(--scalar-small);
    line-height: 1.6;
    color: var(--scalar-color-2);
  }

  .changelog-card-changes li {
    margin: 3px 0;
  }

  /* Block, so it sits below the change list rather than beside the toggle. */
  .changelog-card-link {
    display: block;
    margin-top: 10px;
    font-size: var(--scalar-micro);
    color: var(--scalar-color-3);
  }

  .changelog mark {
    padding: 0 2px;
    border-radius: 3px;
    background: var(--scalar-background-accent);
    color: var(--scalar-color-accent);
  }

  .changelog-empty {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 32px;
    border: var(--scalar-border-width) dashed var(--scalar-border-color);
    border-radius: var(--scalar-radius-lg);
    font-size: var(--scalar-small);
    color: var(--scalar-color-3);
    text-align: center;
  }

  /* Cards fade up in sequence as a filter is applied, capped so a long list does
     not leave the last card waiting. */
  .changelog-stream[data-animate="true"] .changelog-entry {
    animation: changelog-enter 0.32s ease both;
    animation-delay: calc(min(var(--changelog-entry-index), 12) * 25ms);
  }

  @keyframes changelog-enter {
    from {
      opacity: 0;
      transform: translateY(6px);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .changelog-stream[data-animate="true"] .changelog-entry {
      animation: none;
    }

    .changelog-card-caret {
      transition: none;
    }
  }
</style>
