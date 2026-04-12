# Blog Layout Mockups

Three mockups for reducing density and improving hierarchy on `/blog`.

<style>
.blog-mockup-grid {
  display: grid;
  gap: 12px;
  margin: 16px 0 24px;
}

.blog-mockup-card {
  background: var(--scalar-background-1);
  border: 1px solid var(--scalar-border-color);
  border-radius: 14px;
  padding: 14px;
}

.blog-mockup-kicker {
  color: var(--scalar-color-2);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.blog-mockup-title {
  font-size: 18px;
  font-weight: 650;
  line-height: 1.3;
  margin: 0 0 8px;
}

.blog-mockup-summary {
  color: var(--scalar-color-2);
  margin: 0;
}

.blog-mockup-meta {
  color: var(--scalar-color-2);
  display: flex;
  font-size: 12px;
  gap: 8px;
  margin-top: 10px;
}

/* Variant A: date chip + clean text hierarchy */
.mockup-a {
  display: grid;
  gap: 10px;
  grid-template-columns: 108px 1fr;
  align-items: start;
}

.mockup-a-date {
  background: color-mix(in srgb, var(--scalar-color-blue) 12%, transparent);
  border-radius: 10px;
  color: var(--scalar-color-1);
  font-size: 12px;
  font-weight: 600;
  padding: 8px 10px;
  text-align: center;
}

/* Variant B: visual accent rail + tags */
.mockup-b {
  border-left: 4px solid var(--scalar-color-purple);
  display: grid;
  gap: 10px;
  grid-template-columns: 94px 1fr;
}

.mockup-b-thumb {
  background: linear-gradient(140deg, #8b5cf6, #06b6d4);
  border-radius: 10px;
  min-height: 84px;
}

.mockup-b-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.mockup-b-tag {
  background: color-mix(in srgb, var(--scalar-color-purple) 12%, transparent);
  border-radius: 999px;
  color: var(--scalar-color-1);
  font-size: 11px;
  padding: 3px 8px;
}

/* Variant C: timeline / digest list */
.mockup-c-list {
  border-left: 2px solid var(--scalar-border-color);
  display: grid;
  gap: 14px;
  margin-left: 8px;
  padding-left: 16px;
}

.mockup-c-item {
  position: relative;
}

.mockup-c-item::before {
  background: var(--scalar-background-1);
  border: 2px solid var(--scalar-color-green);
  border-radius: 999px;
  content: '';
  height: 10px;
  left: -23px;
  position: absolute;
  top: 4px;
  width: 10px;
}

.mockup-c-row {
  display: grid;
  grid-template-columns: 86px 1fr;
  gap: 10px;
}

.mockup-c-date {
  color: var(--scalar-color-2);
  font-size: 12px;
  padding-top: 2px;
}

.mockup-c-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
  margin: 0 0 4px;
}
</style>

## Mockup A: Editorial cards with date chip

Moves date into a quiet chip, gives title clear priority, and trims summaries to one to two lines.

<div class="blog-mockup-grid">
  <article class="blog-mockup-card mockup-a">
    <div class="mockup-a-date">Apr 11<br />2026</div>
    <div>
      <p class="blog-mockup-kicker">Open Source</p>
      <h3 class="blog-mockup-title">Scalar's 2025 Open Source Pledge</h3>
      <p class="blog-mockup-summary">Open source is the foundation everything we build sits on. In 2025 we contributed $21,232 directly to maintainers.</p>
      <div class="blog-mockup-meta"><span>4 min read</span><span>·</span><span>Company</span></div>
    </div>
  </article>
  <article class="blog-mockup-card mockup-a">
    <div class="mockup-a-date">Mar 25<br />2026</div>
    <div>
      <p class="blog-mockup-kicker">Agent + MCP</p>
      <h3 class="blog-mockup-title">Too Long; Did Not Read; Used MCP</h3>
      <p class="blog-mockup-summary">Turn your OpenAPI description into an MCP server, then use it in tooling with delegated auth and low context usage.</p>
      <div class="blog-mockup-meta"><span>6 min read</span><span>·</span><span>Tutorial</span></div>
    </div>
  </article>
</div>

## Mockup B: Visual cards with category accents

Adds a compact thumbnail zone plus color-coded tags so scanning does not rely only on text.

<div class="blog-mockup-grid">
  <article class="blog-mockup-card mockup-b">
    <div class="mockup-b-thumb"></div>
    <div>
      <div class="mockup-b-tags">
        <span class="mockup-b-tag">MCP</span>
        <span class="mockup-b-tag">Guide</span>
      </div>
      <h3 class="blog-mockup-title">Use your API in Cursor (or your favorite LLM)</h3>
      <p class="blog-mockup-summary">Expose your API description through MCP and connect it to your preferred agent setup in minutes.</p>
      <div class="blog-mockup-meta"><span>Mar 17, 2026</span><span>·</span><span>5 min read</span></div>
    </div>
  </article>
  <article class="blog-mockup-card mockup-b" style="border-left-color: var(--scalar-color-green);">
    <div class="mockup-b-thumb" style="background: linear-gradient(140deg, #22c55e, #14b8a6);"></div>
    <div>
      <div class="mockup-b-tags">
        <span class="mockup-b-tag" style="background: color-mix(in srgb, var(--scalar-color-green) 14%, transparent);">Performance</span>
      </div>
      <h3 class="blog-mockup-title">Your API? 0.2% of your context window</h3>
      <p class="blog-mockup-summary">Agent keeps context lean by using fixed tools and fetching details just in time, with fewer model steps.</p>
      <div class="blog-mockup-meta"><span>Mar 5, 2026</span><span>·</span><span>Benchmark</span></div>
    </div>
  </article>
</div>

## Mockup C: Timeline digest

Treats the blog as an update stream with minimal summaries and very low visual noise.

<div class="blog-mockup-c-list">
  <article class="mockup-c-item">
    <div class="mockup-c-row">
      <div class="mockup-c-date">Apr 11</div>
      <div>
        <h3 class="mockup-c-title">Scalar's 2025 Open Source Pledge</h3>
        <p class="blog-mockup-summary">How we contribute directly to open-source maintainers.</p>
      </div>
    </div>
  </article>
  <article class="mockup-c-item">
    <div class="mockup-c-row">
      <div class="mockup-c-date">Mar 25</div>
      <div>
        <h3 class="mockup-c-title">Too Long; Did Not Read; Used MCP</h3>
        <p class="blog-mockup-summary">OpenAPI to MCP workflow with delegated authentication.</p>
      </div>
    </div>
  </article>
  <article class="mockup-c-item">
    <div class="mockup-c-row">
      <div class="mockup-c-date">Mar 17</div>
      <div>
        <h3 class="mockup-c-title">Use your API in Cursor</h3>
        <p class="blog-mockup-summary">Ship an agent-ready interface for your API quickly.</p>
      </div>
    </div>
  </article>
</div>
