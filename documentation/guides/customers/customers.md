<div class="customers-hero">
  <h1>Trusted by the world's best API teams.</h1>
  <h2>Powering Docs, MCP servers &amp; SDKs for the most ambitious API companies in the world.</h2>
  <div class="customers-hero-actions">
    <a class="t-editor__button" href="https://dashboard.scalar.com/register">Get Started</a>
    <a class="t-editor__button" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Book a Demo</a>
  </div>
  <div class="logowall">
    <div class="logowall-item">
      <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-tr.svg"></scalar-icon>
    </div>
    <div class="logowall-item">
      <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-maersk.svg"></scalar-icon>
    </div>
    <div class="logowall-item">
      <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-tailscale.svg"></scalar-icon>
    </div>
    <div class="logowall-item">
      <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-supabase.svg"></scalar-icon>
    </div>
    <div class="logowall-item">
      <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-flyio.svg"></scalar-icon>
    </div>
    <div class="logowall-item">
      <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-clerk.svg?v=2"></scalar-icon>
    </div>
  </div>
</div>

<a class="featured-story-card" href="/customers/partech" aria-label="Read the PAR customer story">
  <div class="featured-story-copy">
    <p class="featured-story-eyebrow">Featured Story</p>
    <h2 class="featured-story-title">How PAR modernized its developer experience with Scalar</h2>
    <div class="featured-story-logos" aria-label="PAR and Scalar">
      <scalar-icon class="featured-story-logo-par" src="https://cdn.scalar.com/marketing/landing/logo-partech.svg?v=2"></scalar-icon>
      <span class="featured-story-logo-separator" aria-hidden="true">×</span>
      <img class="featured-story-logo-scalar" src="/brand/scalar-wordmark-light.svg" alt="Scalar" />
    </div>
  </div>
  <div class="featured-story-media" aria-hidden="true">
    <img src="/partech-branding.png" alt="" />
  </div>
</a>

<div class="customer-docs-grid">
  <article class="customer-docs-item">
    <a class="customer-docs-image customer-docs-image-bobcat" href="https://developer.bobcat.com/" target="_blank" rel="noreferrer" aria-label="View Bobcat docs">
      <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-bobcat.svg"></scalar-icon>
    </a>
    <p class="customer-docs-copy">American-based manufacturer of farm and construction equipment</p>
    <a class="customer-docs-link" href="https://developer.bobcat.com/" target="_blank" rel="noreferrer">View Docs -&gt;</a>
  </article>
  <article class="customer-docs-item">
    <a class="customer-docs-image customer-docs-image-thomson-reuters" href="https://developers.thomsonreuters.com/pages/api-reference/19232a0d-5cf9-53a9-a215-efe481550832" target="_blank" rel="noreferrer" aria-label="View Thomson Reuters docs">
      <span class="customer-docs-logo">
        <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-tr.svg"></scalar-icon>
      </span>
    </a>
    <p class="customer-docs-copy">Provider of software and decision tools for legal and accounting companies</p>
    <a class="customer-docs-link" href="https://developers.thomsonreuters.com/pages/api-reference/19232a0d-5cf9-53a9-a215-efe481550832" target="_blank" rel="noreferrer">View Docs -&gt;</a>
  </article>
  <article class="customer-docs-item">
    <a class="customer-docs-image customer-docs-image-clerk" href="https://clerk.com/docs/reference/frontend-api" target="_blank" rel="noreferrer" aria-label="View Clerk docs">
      <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-clerk.svg?v=2"></scalar-icon>
    </a>
    <p class="customer-docs-copy">Authentication and User Management platform built for the modern web</p>
    <a class="customer-docs-link" href="https://clerk.com/docs/reference/frontend-api" target="_blank" rel="noreferrer">View Docs -&gt;</a>
  </article>
</div>

<style>
  main {
    --scalar-container-width: 820px;
  }
  .customers-hero {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0 auto 48px;
  }
  .customers-hero h1,
  .customers-hero h2 {
    margin: 0;
    text-wrap: balance;
  }
  .customers-hero h1.t-editor__page-title {
    max-width: 760px;
    font-size: var(--scalar-heading-1);
    line-height: 1.1;
    letter-spacing: 0;
    margin-top: 0;
  }
  .customers-hero h2 {
    max-width: 640px;
    color: var(--scalar-color-2);
    font-size: var(--scalar-heading-2);
    font-weight: 400;
    line-height: 1.45;
  }
  .customers-hero-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .customers-hero .t-editor__button {
    min-width: 160px;
    justify-content: center;
  }
  .logowall.logowall {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    align-items: center;
    gap: 40px;
    width: 100%;
    margin-top: 32px;
  }
  .logowall-item {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .logowall-item svg {
    width: 100%;
    height: auto;
    max-height: 24px;
  }
  .fill-current-bg {
    fill: var(--scalar-background-1);
  }
  .featured-story-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    min-height: 320px;
    margin: 48px 0;
    overflow: hidden;
    color: var(--scalar-color-1);
    text-decoration: none;
    background: var(--scalar-background-2);
    border-radius: var(--scalar-radius-xl);
  }
  .featured-story-card:hover {
    color: var(--scalar-color-1);
    text-decoration: none;
  }
  .featured-story-card:focus-visible {
    outline: 2px solid var(--scalar-color-accent);
    outline-offset: 4px;
  }
  .featured-story-copy {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 320px;
    padding: 64px 48px;
    text-align: center;
  }
  .featured-story-eyebrow {
    margin: 0 0 24px;
    color: var(--scalar-color-2);
    font-size: var(--scalar-small);
    font-weight: var(--scalar-regular);
    line-height: var(--scalar-line-height-3);
  }
  .featured-story-card .featured-story-title {
    display: block;
    max-width: 380px;
    margin: 0;
    color: var(--scalar-color-1);
    font-size: var(--scalar-heading-2);
    font-weight: var(--scalar-bold);
    letter-spacing: 0;
    line-height: var(--scalar-line-height-2);
  }
  .featured-story-logos {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    margin-top: 26px;
    color: var(--scalar-color-1);
  }
  .featured-story-logo-par {
    width: auto;
    height: 26px;
    max-width: 104px;
  }
  .featured-story-logo-separator {
    color: var(--scalar-color-1);
    font-size: var(--scalar-small);
    font-weight: var(--scalar-regular);
    line-height: var(--scalar-line-height-5);
  }
  .featured-story-logo-scalar {
    width: auto;
    height: 26px;
  }
  .featured-story-media {
    min-height: 320px;
    background: var(--scalar-background-2);
  }
  .featured-story-media img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .customer-docs-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 40px;
    row-gap: 56px;
    margin: 56px 0 0;
  }
  .customer-docs-item {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 16px;
  }
  .customer-docs-image {
    display: flex;
    aspect-ratio: 16 / 9;
    align-items: center;
    justify-content: center;
    padding: 32px;
    color: var(--scalar-color-1);
    text-decoration: none;
    background: var(--scalar-background-2);
    border-radius: var(--scalar-radius-xl);
  }
  .customer-docs-image:hover {
    color: var(--scalar-color-1);
    background: var(--scalar-background-3);
    text-decoration: none;
  }
  .customer-docs-image-bobcat,
  .customer-docs-image-bobcat:hover {
    color: #fff;
    background: #ff3600;
    border-color: #ff3600;
  }
  .customer-docs-image-bobcat svg {
    fill: #fff;
  }
  .customer-docs-image-thomson-reuters {
    color: #fff;
    background: var(--scalar-background-2);
    overflow: hidden;
    position: relative;
  }
  .customer-docs-image-thomson-reuters::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url('/thomson-reuters-lobby.png') center / cover;
    filter: grayscale(1) brightness(0.6);
  }
  .customer-docs-image-thomson-reuters:hover {
    color: #fff;
    background: var(--scalar-background-2);
  }
  .customer-docs-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
  }
  .customer-docs-image.customer-docs-image-thomson-reuters svg {
    width: min(82%, 220px);
    max-height: 56px;
    fill: #fff;
    transform: scale(1.35);
    transform-origin: center;
  }
  .customer-docs-image.customer-docs-image-thomson-reuters svg * {
    fill: #fff;
  }
  .customer-docs-image-clerk,
  .customer-docs-image-clerk:hover {
    color: var(--scalar-color-1);
    background: var(--scalar-background-2) url('/clerk-background.webp') center / cover;
  }
  .customer-docs-image:focus-visible,
  .customer-docs-link:focus-visible {
    outline: 2px solid var(--scalar-color-accent);
    outline-offset: 4px;
  }
  .customer-docs-image svg {
    width: min(68%, 160px);
    height: auto;
    max-height: 40px;
  }
  .customer-docs-copy {
    margin: 0;
    color: var(--scalar-color-1);
    font-size: var(--scalar-font-size-2);
    font-weight: var(--scalar-regular);
    line-height: var(--scalar-line-height-2);
  }
  .customer-docs-link {
    width: fit-content;
    color: var(--scalar-color-2);
    font-size: var(--scalar-small);
    font-weight: var(--scalar-semibold);
    line-height: var(--scalar-line-height-3);
    text-decoration: none;
  }
  .customer-docs-link:hover {
    color: var(--scalar-color-1);
    text-decoration: none;
  }
  @media (max-width: 720px) {
    .customers-hero {
      margin-top: 40px;
    }
    .customers-hero h1 {
      font-size: 40px;
    }
    .customers-hero h2 {
      font-size: var(--scalar-font-size-3);
    }
    .customers-hero-actions {
      width: 100%;
    }
    .customers-hero .t-editor__button {
      flex: 1 1 180px;
    }
    .logowall.logowall {
      grid-template-columns: repeat(3, 1fr);
      column-gap: 20px;
      row-gap: 32px;
    }
    .logowall-item svg {
      max-height: 20px;
    }
    .featured-story-card {
      grid-template-columns: 1fr;
      margin: 40px 0;
    }
    .featured-story-copy {
      min-height: auto;
      padding: 56px 24px;
    }
    .featured-story-card .featured-story-title {
      max-width: 340px;
    }
    .featured-story-logos {
      flex-wrap: wrap;
      row-gap: 10px;
    }
    .featured-story-media {
      min-height: 220px;
    }
    .customer-docs-grid {
      grid-template-columns: 1fr;
      row-gap: 40px;
    }
  }
</style>
