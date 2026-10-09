# Mintlify pricing, reviews and alternatives (September 2026)

*Last updated: September 2026*

Mintlify pricing in September 2026 is $0 for Starter, $450 per month billed annually for Pro, and a custom price for Enterprise, with AI features billed in credits on top of the Pro allowance.

We refresh this page every month, because Mintlify's pricing has changed shape more than once and most third-party write-ups are out of date. Everything below was checked against [mintlify.com/pricing](https://www.mintlify.com/pricing) and Mintlify's own documentation on 26 September 2026, and every claim links to its source.

This page is written by Scalar. We make a documentation platform that competes with Mintlify, so read our commentary with that in mind. We have kept facts and opinions clearly separate, and we have not invented or estimated any review scores: where we could not read a rating ourselves, we link to the source and leave the number out.

## Mintlify pricing at a glance

| | Starter | Pro | Enterprise |
| --- | --- | --- | --- |
| Price | $0 | $450/month, billed annually | Custom |
| Editor seats | 5 | Unlimited | Unlimited |
| Custom domain, web editor, API playground, MCP server | Yes | Yes | Yes |
| AI assistant, writing agent, automations | No | Yes | Yes |
| AI credits | None | 10,000/month, then $0.01 per credit | Custom, with committed-volume discounts |
| Preview deployments | No | Yes | Yes |
| Custom components, custom CSS and JS | Yes | Yes | Yes |
| White labeling | No | No | Yes |
| Self-hosting, EU hosting | No | No | Available |
| SSO, SCIM, audit logs | No | No | Yes |

Source: [Mintlify pricing](https://www.mintlify.com/pricing), 26 September 2026. The page defaults to annual billing; a monthly-billing option is also offered, and we quote the annual figure shown by default.

A few details from the same page that matter when you budget:

- **Trial.** New accounts get 14 days free, no card required, with all AI features and up to 5,000 credits.
- **AI is not on Starter.** The assistant, agent, and automations are Pro and Enterprise only.
- **Credit prices are flat per action.** An Assistant answer is 25 credits, and an automation run that updates your docs is 250 credits. If the Assistant cannot answer or an automation finds nothing to update, there is no charge. The writing agent is included on Pro and Enterprise at no credit cost.
- **You can cap spend.** Dashboard controls let you turn off overages so AI features pause when the monthly quota runs out.
- **Open source projects.** Mintlify's [OSS program](https://www.mintlify.com/oss-program) gives Pro free to non-commercial open source projects that are not venture-backed or owned by a for-profit company.

## What Mintlify actually costs

The headline price is simple. The AI line is where bills diverge, so here is the arithmetic using Mintlify's published rates.

| Scenario | Monthly | Yearly |
| --- | --- | --- |
| Pro, annual billing, within the included credits | $450 | $5,400 |
| Included Assistant answers per month (10,000 ÷ 25) | 400 answers | — |
| Each Assistant answer beyond the allowance (25 × $0.01) | $0.25 | — |
| Each automation update beyond the allowance (250 × $0.01) | $2.50 | — |
| Pro plus 2,000 extra Assistant answers a month | $450 + $500 = $950 | $11,400 |

The last row is illustrative, not typical: most docs sites will sit inside the allowance. But if your docs get heavy AI traffic, model it before you sign, because the Assistant is billed per answer.

For comparison, and because you are probably pricing both: Scalar Pro is $150 per month, or $125 per month billed yearly, with 5 editor seats and 500 Agent Scalar credits a month, where one credit covers 2 docs chat messages. Business is $600 per month with 10 seats and 2,000 credits. Mintlify's unlimited seats on Pro are cheaper than per-seat growth for a large writing team; Scalar's lower entry price is cheaper for small teams. See [Scalar pricing](/pricing).

## What changed at Mintlify in 2026

- **Series B.** Mintlify [raised $45 million at a $500 million valuation](https://mintlify.com/blog/series-b) in April 2026, led by Andreessen Horowitz and Salesforce Ventures. It says it powers documentation for more than 20,000 companies.
- **Credits-based AI pricing.** AI features are now metered in credits with a flat price per action, rather than bundled.
- **A broader positioning.** The pricing page now calls Mintlify "the knowledge platform built for agents", and AI features (assistant, agent, automations, agent analytics) make up a large part of the Pro plan.

## Mintlify reviews

Public review data for Mintlify is thinner than its profile suggests. Here is what we could verify, and where to read more.

**Product Hunt.** Mintlify's [Product Hunt reviews page](https://www.producthunt.com/products/mintlify/reviews) showed a 5.0 rating from 83 reviews on 26 September 2026. The same page groups 82 of those as reviews from founders and 1 as other reviews, so treat it as a signal of peer respect among startup founders more than of day-to-day user experience.

**G2.** Mintlify has a [G2 reviews page](https://www.g2.com/products/mintlify/reviews). G2 blocked our automated check, so we are not quoting a rating or review count here. Read it directly.

**Hacker News.** Discussion threads such as [Investing in Mintlify](https://news.ycombinator.com/item?id=41462347) give a less curated view. As with any comment thread, weigh individual opinions accordingly.

**Security history.** In March 2024 Mintlify published an [incident report](https://www.mintlify.com/blog/incident-march-13) about a breach that exposed customer GitHub tokens, followed by a post on [how it improved security](https://www.mintlify.com/blog/security-update). Its pricing FAQ now states SOC 2 Type 2 certification and GDPR compliance. We include this because it comes up in reviews and procurement, not to suggest a current issue.

### Our assessment

This section is our opinion, as a competitor, based on Mintlify's public docs and pricing.

**What Mintlify does well.** The out-of-the-box design is strong, and it is the main reason teams choose it. Unlimited editors on Pro suit docs owned by writers, product, or developer relations. AI translations are included on Pro. The free Starter plan is generous where it counts: custom domain, API playground, MCP server, and custom CSS and JS all at $0.

**Where teams run into limits.**

- **No SDK generation.** Mintlify renders SDK code samples from other vendors, with integrations for [Speakeasy](https://www.mintlify.com/docs/integrations/sdks/speakeasy) and [Stainless](https://www.mintlify.com/docs/integrations/sdks/stainless). Stainless is [winding down its hosted products](https://www.stainless.com/blog/stainless-is-joining-anthropic/), which is a reminder that two-vendor setups carry dependency risk.
- **No standalone API client.** The playground lives in the docs site.
- **Closed renderer, hosted by default.** [Self-hosting requires Enterprise](https://www.mintlify.com/docs/deploy/self-host) and is scoped with an account team rather than installed self-serve.
- **White labeling is Enterprise only.**
- **The docs MCP server searches docs; it does not call your API.** Mintlify's [MCP server](https://www.mintlify.com/docs/ai/model-context-protocol) provides search, filesystem, and feedback tools. If you want agents to take actions through your API, you need another tool.

## Mintlify alternatives

If you are weighing a move, these are the options we would look at. Our fuller list, with a comparison table, is at [Mintlify alternatives](/alternatives/mintlify), and our head-to-head is at [Scalar vs Mintlify](/resources/compare/mintlify).

1. **Scalar.** An MIT-licensed API reference and API client you can self-host on any plan or mount inside your app through framework integrations, plus hosted docs, an SDK generator, and hosted MCP servers from the same OpenAPI document. Pro is $150 per month. Best for engineering-led teams who want to own the docs layer and generate SDKs from the same document.
2. **Fern.** Docs and SDKs from one vendor, [owned by Postman](https://buildwithfern.com/post/postman-acquires-fern) since January 2026. Free docs for up to 10 team members; Enterprise is custom ([pricing](https://buildwithfern.com/pricing.md)). Best for teams with gRPC or OpenRPC APIs. See [Scalar vs Fern](/resources/compare/fern).
3. **ReadMe.** A mature developer hub with API usage metrics. Pro is $250 per month billed annually ([pricing](https://readme.com/pricing)). Best for teams that want metrics tied to docs. See [Scalar vs ReadMe](/resources/compare/readme).
4. **GitBook.** A knowledge base with OpenAPI blocks whose "Test it" feature is [powered by Scalar](https://www.gitbook.com/blog/gitbook-open-source-and-scalar). Premium is $65 per site per month billed annually ([pricing](https://www.gitbook.com/pricing)). Best when the API reference is one part of a bigger knowledge base.
5. **Redocly.** Per-seat pricing from $10 per seat per month ([pricing](https://redocly.com/pricing)) and the open-source Redoc. Best for docs-as-code teams already on Redocly CLI. See [Scalar vs Redocly](/resources/compare/redocly).
6. **Docusaurus.** Free and MIT licensed, with an OpenAPI plugin. Best if you have front-end time and want full control. See [Docusaurus alternatives](/alternatives/docusaurus).

We cover the wider market in [the best API documentation tools of 2026](/library/best-api-documentation-tools-2026).

## When to stay on Mintlify

Stay if your docs are owned by writers or marketing rather than engineers and the design is doing its job; if you ship documentation in many languages; if you have a large editor team that benefits from unlimited seats on a flat price; or if your AI traffic sits comfortably inside the Pro allowance. Switching docs platforms has a real cost, and none of the alternatives above is worth it just to save a few hundred dollars a month.

Consider moving if you need SDKs generated from the same OpenAPI document as your docs, want to self-host without an Enterprise contract, need the reference inside your own application, or want an API client your users can keep.

## Moving in or out of Mintlify

Switching cost is lower than it looks, in both directions, because Mintlify content is Markdown and MDX in a Git repository.

**Moving to Mintlify.** Mintlify's pricing FAQ says it offers public packages for automated migration from ReadMe and Docusaurus, and asks teams on other platforms to get in touch.

**Moving away from Mintlify.** Your pages are already files you own. The work is in three places: components (Mintlify's built-in components need mapping to the target platform's equivalents), navigation config (Mintlify's config file has to be translated), and redirects (so existing URLs keep ranking). Scalar Docs reads Markdown and [MDX](/products/docs/content/mdx), uses one `scalar.config.json` for navigation, and supports [redirects](/products/docs/configuration/redirects). The API reference is the easy part on any platform: point it at the same OpenAPI document.

Before you move, export your analytics and note which pages receive AI Assistant traffic, so you can check the new setup answers the same questions.

## Change log for this page

| Date | Change |
| --- | --- |
| 26 September 2026 | First published. Pricing, AI credit rates, trial terms, and review data checked against Mintlify's site and Product Hunt. |

## Frequently asked questions

<scalar-detail title="How much does Mintlify cost?">
On 26 September 2026: Starter is free with 5 editor seats, Pro is $450 per month billed annually with unlimited seats and 10,000 AI credits a month, and Enterprise is custom. AI usage beyond the Pro allowance costs $0.01 per credit.
</scalar-detail>

<scalar-detail title="Does Mintlify have a free plan?">
Yes. Starter is $0 and includes 5 editor seats, a custom domain, the web editor, authentication, an MCP server, and the API playground. AI features are not included on Starter.
</scalar-detail>

<scalar-detail title="How do Mintlify AI credits work?">
Pro includes 10,000 credits a month. An Assistant answer costs 25 credits and an automation update costs 250 credits, with no charge when the Assistant cannot answer or there is nothing to update. Overages are $0.01 per credit, and you can turn overages off so AI features pause at the limit.
</scalar-detail>

<scalar-detail title="Can I self-host Mintlify?">
Only on Enterprise. Mintlify's documentation says self-hosting requires an Enterprise plan and is scoped with your account team.
</scalar-detail>

<scalar-detail title="Does Mintlify generate SDKs?">
No. Mintlify displays SDK code samples produced by other vendors, with documented integrations for Speakeasy and Stainless. Stainless is winding down its hosted products following its move to Anthropic.
</scalar-detail>

<scalar-detail title="Is Mintlify free for open source projects?">
Mintlify's OSS program offers Pro free to non-commercial open source projects under a recognized licence that are not venture-backed, revenue-funded, or owned by a for-profit company.
</scalar-detail>

## Related

- **Learn:** [API documentation best practices](/learn/openapi/api-documentation-best-practices) · [llms.txt for API docs](/learn/openapi/llms-txt-for-api-docs)
- **Docs:** [Scalar Docs getting started](/products/docs/getting-started)
- **Product:** [Scalar Docs](/products/docs) — hosted docs with an open-source API reference, SDKs, and MCP from one OpenAPI document

---

*Mintlify pricing, features, and policies are taken from mintlify.com and Mintlify's documentation as of 26 September 2026. Review data is taken from the linked review sites on the same date; we do not publish ratings we could not read ourselves. This page is written by Scalar, a Mintlify competitor, and is refreshed monthly. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
