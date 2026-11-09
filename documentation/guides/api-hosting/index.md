<section class="bf-hero" data-bf-hero>
<div class="bf-stage" aria-hidden="true" data-md-exclude><canvas class="bf-canvas" data-bf-canvas></canvas></div>
<div class="bf-copy">

# API Hosting

Deploy your API from the server framework you already use: NestJS, Hono, Elysia, .NET and more. Every push goes live, it scales with your traffic, and it costs nothing while it sleeps.

<form class="bf-waitlist" data-bf-waitlist data-md-exclude action="https://app.loops.so/api/newsletter-form/clksm7aj203tclb0olg1z2xb3" method="post">
  <input type="hidden" name="userGroup" value="Hosting" />
  <input type="hidden" name="mailingLists" value="" />
  <input type="hidden" name="landing" value="true" />
  <div class="bf-waitlist-row">
    <div class="bf-combo">
      <label class="bf-sr" for="bf-waitlist-email">Email</label>
      <input id="bf-waitlist-email" class="bf-email" name="email" type="email" required autocomplete="email" placeholder="you@example.com" />
      <label class="bf-sr" for="bf-waitlist-framework">Framework</label>
      <span class="bf-select">
        <select id="bf-waitlist-framework" name="framework">
          <option value="">Framework</option>
          <option>.NET</option>
          <option>AdonisJS</option>
          <option>Elysia</option>
          <option>Express</option>
          <option>FastAPI</option>
          <option>Fastify</option>
          <option>Go</option>
          <option>Hono</option>
          <option>Laravel</option>
          <option>Litestar</option>
          <option>NestJS</option>
          <option>Next.js</option>
          <option>Nitro</option>
          <option>Nuxt</option>
          <option>Platformatic</option>
          <option>Rust</option>
          <option>Other</option>
        </select>
        <scalar-icon class="bf-select-caret" src="phosphor/regular/caret-down"></scalar-icon>
      </span>
    </div>
    <button type="submit" class="t-editor__button button__primary bf-pill bf-join">Join Waitlist</button>
  </div>
</form>

</div>
</section>

Bring the app you already have, in the framework it is written in. Every pull request gets a preview of its own, logs and metrics come built in, and you pay by the second for what runs, with no request fees. Start with $5 of free credits, no card needed.

## Everything your API needs to run

<div class="feature">
  <div class="feature-container">
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-c-1">
        <scalar-icon src="phosphor/bold/brackets-curly"></scalar-icon>
        The framework you already use
      </b>
      <p class="leading-6">NestJS, Hono, Elysia, .NET, FastAPI, Laravel, Rust and nine more. Bring your app as it is, with nothing to rewrite.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-c-1">
        <scalar-icon src="phosphor/bold/git-branch"></scalar-icon>
        Deploys on every push
      </b>
      <p class="leading-6">Push to your repository and the new version goes live. Shipping is a git push, not a release day.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-c-1">
        <scalar-icon src="phosphor/bold/git-pull-request"></scalar-icon>
        A preview for every pull request
      </b>
      <p class="leading-6">Each pull request runs on a preview of its own, so you can try a change before it reaches your users.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-c-1">
        <scalar-icon src="phosphor/bold/cpu"></scalar-icon>
        Scales with your traffic
      </b>
      <p class="leading-6">From 1 vCPU and 0.5 GB of memory up to 48 vCPU and 48 GB, as your traffic grows.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-c-1">
        <scalar-icon src="phosphor/bold/moon"></scalar-icon>
        Sleeps when idle, $0
      </b>
      <p class="leading-6">Billed per second for what runs, with no request fees. Quiet hours cost nothing.</p>
    </div>
    <div class="feature-item">
      <b class="flex items-center icon-text gap-3 font-medium min-h-8 text-c-1">
        <scalar-icon src="phosphor/bold/pulse"></scalar-icon>
        Logs, metrics and networking
      </b>
      <p class="leading-6">Logs and metrics come built in, and private networking connects your API to your other services.</p>
    </div>
  </div>
</div>

<style>
  .t-editor__anchor {
    --font-visited: none;
  }

  main.content {
    overflow-x: clip;
  }

  .t-editor.page {
    position: relative;
  }

  .t-doc .layout-header {
    z-index: 10000;
  }

  .t-editor__button {
    min-width: 160px;
    justify-content: center;
  }

  /* What hosting includes, laid out as /products/agent lays out its features. */
  .feature-container {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 48px;
    row-gap: 36px;
    margin-top: 32px;
  }

  @media screen and (max-width: 1000px) {
    .feature-container {
      grid-template-columns: 1fr;
      row-gap: 28px;
    }
  }

  /* the hero starts right under the header, as the home page's does */
  .t-editor .editor-static .page-node,
  .t-editor .page-node,
  .t-editor .content {
    margin-top: 0;
  }

  /* The home page's hero box, so the h1 lands on the same line. The home page centres its copy in a box
     min(90dvh - header, 640px) tall, so its h1 sits at half that box less a step that depends on how its copy
     wraps. This copy is pinned to the top of the same box at exactly that line, as on /products/agent, whose
     numbers these are. The butterflies need more room under the words than the home page's logos do, so the
     hero runs on past the box by --bf-more. */
  .bf-hero {
    --bf-w: calc(100dvw - var(--scalar-sidebar-width, 0px));
    --bf-box: min(calc(90dvh - var(--scalar-header-height, 48px)), 640px);
    --bf-line: 130.5px;
    --bf-top: max(48px, calc(var(--bf-box) / 2 - var(--bf-line)));
    --bf-more: 72px;
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    min-height: calc(var(--bf-box) + var(--bf-more));
    padding: var(--bf-top) 0 0;
  }
  /* the home page's steps, where its padding grows and its lede rewraps */
  @media screen and (max-width: 1100px) {
    .bf-hero {
      --bf-line: 138.5px;
    }
  }
  @media screen and (max-width: 560px) {
    .bf-hero {
      --bf-line: 154.4px;
    }
  }
  @media screen and (max-width: 439px) {
    .bf-hero {
      --bf-line: 190.9px;
    }
  }
  /* The copy as the home page sets it: a 680px block, balanced lines. */
  .bf-copy {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    max-width: 680px;
    align-self: start;
    text-align: center;
    text-wrap: balance;
  }
  /* The art fills the hero from the header down, across the whole column to the right of the sidebar. */
  .bf-stage {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: var(--bf-w);
    transform: translateX(-50%);
    pointer-events: none;
  }
  .bf-canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  .bf-copy > * {
    margin: 0;
  }
  .bf-copy .t-editor__heading {
    justify-content: center;
  }
  /* The heading's anchor button only shows its icon on hover, which widens the centred heading and shifts
     it; the home page hides it too. */
  .bf-copy .notify-container {
    display: none;
  }
  /* the home page's lede: a narrow measure under the heading */
  .bf-copy p {
    max-width: 460px;
    font-size: 14px;
    line-height: 1.5;
    text-wrap: pretty;
  }
  /* The call to action is the hosting waitlist from the API reference's Deploy card: one pill that takes an
     email, with the framework it would run on picked inside it on the right, and the button beside it, at the
     home page's 40px. api-hosting-waitlist.js sends it to the same Loops form and user group as the card. */
  .bf-waitlist {
    position: relative;
    /* as wide as the copy, which centres what is in it, so that the row can stretch on a phone */
    width: 100%;
    margin-top: 12px;
  }
  .bf-waitlist-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .bf-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .bf-combo {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 320px;
    height: 40px;
    padding: 0 5px 0 18px;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: 999px;
    background: var(--scalar-background-1);
    transition: border-color 150ms ease-in-out;
  }
  .bf-combo:hover {
    border-color: color-mix(in srgb, var(--scalar-border-color), var(--scalar-color-1) 20%);
  }
  .bf-combo:focus-within {
    border-color: var(--scalar-color-1);
  }
  .bf-email {
    flex: 1;
    min-width: 0;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--scalar-color-1);
    font-family: var(--scalar-font);
    font-size: 14px;
  }
  .bf-email::placeholder {
    color: var(--scalar-color-3);
  }
  /* The framework, inside the pill at its right end and only as wide as what it says, with the site's caret in
     place of the browser's arrow. Where field-sizing is unknown, api-hosting-waitlist.js sizes it instead. */
  .bf-select {
    position: relative;
    display: inline-flex;
    flex: none;
  }
  .bf-select select {
    appearance: none;
    field-sizing: content;
    box-sizing: border-box;
    height: 30px;
    margin: 0;
    padding: 0 28px 0 12px;
    border: 0;
    border-radius: 999px;
    background: var(--scalar-background-2);
    color: var(--scalar-color-1);
    font-family: var(--scalar-font);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 150ms ease-in-out;
  }
  .bf-select select:hover {
    background: var(--scalar-background-3);
  }
  .bf-select select:focus-visible {
    outline: 1px solid var(--scalar-color-1);
    outline-offset: 1px;
  }
  /* no framework picked yet: the placeholder's grey */
  .bf-select select:has(option[value=""]:checked) {
    color: var(--scalar-color-2);
  }
  .bf-select option {
    color: var(--scalar-color-1);
  }
  .bf-select-caret {
    position: absolute;
    top: 50%;
    right: 10px;
    width: 12px;
    height: 12px;
    translate: 0 -50%;
    color: var(--scalar-color-3);
    pointer-events: none;
  }
  .bf-waitlist .bf-join {
    min-width: 0;
    height: 40px;
    margin: 0;
    padding: 0 20px;
    border: 0;
    border-radius: 999px;
    font-family: var(--scalar-font);
    cursor: pointer;
  }
  .bf-waitlist .bf-join[aria-busy="true"] {
    opacity: 0.6;
    cursor: progress;
  }
  /* Feedback goes under the row without making the copy taller, because the hero lays its land out from the
     copy's box. The script adds it, as the page leaves out an empty paragraph. */
  .bf-waitlist .bf-waitlist-status {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-width: none;
    margin: 8px 0 0;
    color: var(--scalar-color-2);
    font-size: 13px;
    text-align: center;
  }
  .bf-waitlist .bf-waitlist-status.is-error {
    color: var(--scalar-color-red);
  }
  /* Once signed up, the thanks takes the row's place at the row's height. */
  .bf-waitlist.is-done .bf-waitlist-row {
    display: none;
  }
  .bf-waitlist.is-done .bf-waitlist-status {
    position: static;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    margin: 0;
    color: var(--scalar-color-1);
    font-size: 15px;
    font-weight: 500;
  }
  /* On a phone the button goes under the pill, as wide as it. */
  @media screen and (max-width: 560px) {
    .bf-waitlist-row {
      flex-direction: column;
      align-items: stretch;
      width: min(100%, 360px);
      margin: 0 auto;
    }
    .bf-combo,
    .bf-waitlist .bf-join {
      width: 100%;
    }
  }
  /* Where WebGL2 is unavailable the hero is the copy on its own, on the same line, rather than an empty box
     where a drawing should be. */
  [data-bf-fallback="true"] .bf-stage {
    display: none;
  }
  .bf-hero[data-bf-fallback="true"] {
    min-height: 0;
    padding-bottom: 48px;
  }

  /* Below 1000px the docs hide the sidebar but leave its width set, so the stage takes the whole screen
     there, as the home page's hero does. */
  @media screen and (max-width: 1000px) {
    .bf-hero {
      --bf-w: 100dvw;
    }
  }
</style>
