# Simple Pricing for your API needs

One platform for: APIs, Docs, Agents, SDKs, Governance & API Client all based on OpenAPI™.

<scalar-row>
<scalar-card title="Free">
**Best for:** self-hosting, local development, and personal API workflows.

- Self-hosted docs
- API Client for personal use
- Agent on `localhost`
</scalar-card>

<scalar-card title="Hobby">
**Best for:** solo builders who want hosted docs and a cleaner publishing workflow.

- 1 hosted docs site
- Custom domain
- Cloud-synced client workflows
</scalar-card>
</scalar-row>

<scalar-row>
<scalar-card title="Pro">
**Best for:** teams shipping production docs, client collaboration, and embedded agents.

- `$24 / seat / month`
- Minimum 3 seats (`$72 / month` base)
- Production Agent usage and shared workspaces
</scalar-card>

<scalar-card title="Enterprise">
**Best for:** platform teams that need governance, access control, and support.

- Custom pricing
- SSO / SAML and RBAC
- Priority support and rollout help
</scalar-card>
</scalar-row>

## Trusted by the world's best API teams

<div class="pricing-logowall">
  <div class="pricing-logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-tr.svg"></scalar-icon>
  </div>
  <div class="pricing-logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-maersk.svg"></scalar-icon>
  </div>
  <div class="pricing-logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-bobcat.svg"></scalar-icon>
  </div>
  <div class="pricing-logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-clerk.svg?v=2"></scalar-icon>
  </div>
  <div class="pricing-logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-lufthansa.svg"></scalar-icon>
  </div>
  <div class="pricing-logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-partech.svg?v=2"></scalar-icon>
  </div>
</div>

## Developer Docs

Everything you need to publish OpenAPI-powered docs, from self-hosted starts to branded multi-site portals.

| Feature | Free | Hobby | Pro | Enterprise |
| ------- | ---- | ----- | --- | ---------- |
| Hosted sites | Self-host | 1 | Unlimited | Unlimited |
| Custom domain | — | ✓ | ✓ | ✓ |
| Remove Scalar branding | — | — | ✓ | ✓ |
| Git sync & versioning | ✓ | ✓ | ✓ | ✓ |
| Preview deployments | — | — | ✓ | ✓ |
| Custom CSS / theming | — | — | ✓ | ✓ |
| Password protection | — | — | ✓ | ✓ |

## Agent Scalar

Use Agent locally for free, add production usage on paid plans, and scale with credit packs when you need more.

<scalar-row>
<scalar-card title="One credit per agent action">
Every agent response costs `1 credit`. Every API call your agent makes on your behalf costs `1 credit`. Complex tasks may use more than one credit, and failed calls are never charged.
</scalar-card>

<scalar-card title="Bring your own key">
Paid plans can connect OpenAI, Anthropic, Gemini, or custom API keys. Agent reasoning runs on your own account, and only the API calls the agent makes count toward Scalar credits.
</scalar-card>
</scalar-row>

| Agent product | Included with | Details |
| ------------- | ------------- | ------- |
| Local Agent | Free | 10 free localhost messages, no setup required |
| Embedded Agent in docs and references | Pro / Enterprise | 250 messages included, `$0.02 / message` after that |
| `agent.scalar.com` | Pro / Enterprise | 2,000,000 tokens included, `$2 / M` input and `$10 / M` output |

| Credit pack | Price | Effective rate |
| ----------- | ----- | -------------- |
| 1,000 credits | $10 | `$0.010 / credit` |
| 5,000 credits | $40 | `$0.008 / credit` |
| 25,000 credits | $150 | `$0.006 / credit` |

## Team & Access

Collaboration, access control, and governance features for teams moving from personal workflows to shared API platforms.

| Feature | Free | Hobby | Pro | Enterprise |
| ------- | ---- | ----- | --- | ---------- |
| Full API Client with cloud sync | ✓ | ✓ | ✓ | ✓ |
| Unlimited personal collections | ✓ | ✓ | ✓ | ✓ |
| Agent embedded in client | ✓ | ✓ | ✓ | ✓ |
| Team workspaces | — | — | ✓ | ✓ |
| Shared collections | — | — | ✓ | ✓ |
| Role-based access control | — | — | — | ✓ |
| SSO / SAML | — | — | — | ✓ |
| Priority support | — | — | — | ✓ |

## FAQ

Everything else you might want to know. Still unclear on something? [Talk to our team](https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a) — we'd rather explain it once than have you guess.

### What exactly is a credit?

One credit equals one agent action. A question asked to the agent is `1 credit`. An API call made by the agent on your behalf is `1 credit`. A complex task with multiple calls might cost 5-10 credits. We show the expected cost before you run anything, and failed calls are never charged.

### What if I run out of credits mid-month?

Buy a credit pack on any paid plan — starting at 1,000 credits for $10. Credits from packs do not expire, and volume discounts kick in at larger sizes.

### Can I really bring my own LLM key?

Yes. On any paid plan you can connect an OpenAI, Anthropic, Gemini, or custom API key. When you do, agent reasoning runs on your account at your rates. Only API calls the agent makes on your behalf count toward your Scalar credits. Keys are stored on your device, not ours.

### Who counts as an "editor"?

Anyone who can edit your docs, API Client workspaces, or registries. Viewers (anyone reading your published docs) are unlimited and free on every tier — we do not charge per reader.

### What happens in the Pro trial?

14 days of full Pro access, including the 1,000 agent credits. No credit card required to start. If you upgrade, any credits you used during trial do not count against your first month's allocation.

<style>
.pricing-logowall {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0 40px;
}

.pricing-logowall-item {
  align-items: center;
  background: var(--scalar-background-2);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  display: flex;
  justify-content: center;
  min-height: 72px;
  padding: 16px;
}

.pricing-logowall-item svg {
  height: 24px;
  max-width: 136px;
  opacity: 0.8;
  width: 100%;
}

@media screen and (max-width: 800px) {
  .pricing-logowall {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media screen and (max-width: 520px) {
  .pricing-logowall {
    grid-template-columns: 1fr;
  }
}
</style>
