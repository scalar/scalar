# llms.txt for API documentation: what it does and what it does not

*Last updated: September 2026*

llms.txt is a proposed convention for a Markdown file at the root of a website, `/llms.txt`, that gives large language models and AI agents a short, curated index of the site's most useful content, with links to clean Markdown versions of the pages. For API documentation, it is a map an agent can read in one request: what the API is, where the OpenAPI document lives, how authentication works, and which pages to fetch next.

It is also one of the most over-promised files on the web right now. Google has said it does not use llms.txt, server logs show the major AI crawlers barely request it, and it will not improve your search rankings. It is still worth shipping for API documentation, for narrower and more honest reasons than most articles give. This guide covers the format, the evidence, what to put in the file for an API, and what actually matters more.

**On this page**

- [The short answer](#the-short-answer)
- [What llms.txt looks like](#what-llmstxt-looks-like)
- [llms-full.txt and Markdown page twins](#llms-fulltxt-and-markdown-page-twins)
- [What the evidence says](#what-the-evidence-says)
- [Why ship it anyway](#why-ship-it-anyway)
- [What to put in llms.txt for API docs](#what-to-put-in-llmstxt-for-api-docs)
- [llms.txt vs robots.txt vs sitemap.xml vs api-catalog](#llmstxt-vs-robotstxt-vs-sitemapxml-vs-api-catalog)
- [What matters more than llms.txt](#what-matters-more-than-llmstxt)
- [llms.txt in Scalar Docs](#llmstxt-in-scalar-docs)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## The short answer

- **What it is:** a Markdown index of your site for AI agents, proposed by Jeremy Howard at [llmstxt.org](https://llmstxt.org) in September 2024.
- **Who reads it:** very few crawlers, according to the log data available in 2026. The realistic reader is an agent or developer tool that someone has deliberately pointed at your documentation.
- **Does it help SEO?** No. Google's own guidance says you do not need special AI text files to appear in AI Overviews or AI Mode.
- **Should you ship one?** For API documentation, yes, because it costs almost nothing when generated automatically and makes your docs easier for coding agents to use. Just do not expect traffic from it.

## What llms.txt looks like

The format is deliberately simple Markdown. The proposal requires only one thing, an H1 with the name of the project or site. The recommended structure adds a blockquote summary, optional free-form notes, and H2 sections containing lists of links, each with an optional description after a colon. A section titled `Optional` marks links an agent can skip when its context window is tight.

Here is a sensible llms.txt for a fictional payments API:

```markdown
# Acme Payments API

> REST API for creating payments, refunds and payouts. JSON over HTTPS, OAuth 2.0 client credentials or API keys, versioned by date in the Acme-Version header.

Base URL: https://api.acme.example/v1
Sandbox: https://sandbox.acme.example/v1

## API description

- [OpenAPI document](https://docs.acme.example/openapi.yaml): The complete OpenAPI 3.1 description of every endpoint, schema and security scheme
- [API reference](https://docs.acme.example/reference.md): Human-readable reference generated from the OpenAPI document

## Getting started

- [Quickstart](https://docs.acme.example/quickstart.md): Create a sandbox key and make a first payment in five minutes
- [Authentication](https://docs.acme.example/authentication.md): API keys, OAuth 2.0 client credentials, key rotation
- [Errors](https://docs.acme.example/errors.md): Error format, codes and retry guidance
- [Idempotency](https://docs.acme.example/idempotency.md): Safely retrying POST requests with the Idempotency-Key header

## SDKs and tools

- [TypeScript SDK](https://docs.acme.example/sdks/typescript.md): Installation and usage
- [Python SDK](https://docs.acme.example/sdks/python.md): Installation and usage
- [MCP server](https://docs.acme.example/mcp.md): Connect AI agents to the Acme API

## Optional

- [Changelog](https://docs.acme.example/changelog.md): Release history
- [Webhooks](https://docs.acme.example/webhooks.md): Event types and signature verification
```

Notice what this file does not contain: the API itself. It is an index. The heavy lifting is done by the documents it links to, especially the OpenAPI document.

## llms-full.txt and Markdown page twins

Two companion ideas usually travel with llms.txt.

**llms-full.txt.** A single file with the full Markdown content of the documentation, concatenated in navigation order. It is not part of the core proposal, but it has become a common convention because it lets an agent load a whole documentation set in one request instead of following links. For large API documentation it can be very long, which is fine for tools that chunk or search it and wasteful for tools that paste it whole into a prompt.

**Markdown twins.** The proposal recommends that pages with useful information are also available as clean Markdown at the same URL with `.md` appended (`page.html.md`) or with the extension replaced (`page.md`). The current version of the proposal also recommends advertising them with standard link relations: `rel="alternate" type="text/markdown"` pointing at the Markdown version, and `rel="describedby"` pointing at the llms.txt that covers the page, either as HTML `<link>` elements or as an HTTP `Link` header.

In our experience the Markdown twins are more useful than llms.txt itself. When a developer pastes a documentation link into a chat assistant or a coding agent fetches a page, a clean Markdown version without navigation, scripts and cookie banners is a much better input than the rendered HTML.

## What the evidence says

The honest part. Several sources point the same way.

**Google does not use it.** Google's documentation on [AI features in Search](https://developers.google.com/search/docs/appearance/ai-features) states that you do not need to create new machine-readable files, AI text files or markup to appear in AI Overviews or AI Mode, and that there are no special optimizations required. Separately, Google's John Mueller wrote in June 2025 that no AI system currently uses llms.txt, as [reported by Search Engine Roundtable](https://www.seroundtable.com/google-ai-llms-txt-39607.html).

**AI crawlers rarely fetch it.** An [EZY.ai log study](https://www.ezy.ai/research/do-ai-bots-read-llms-txt) tracked verified bot requests across 83 websites for 12 weeks, from April 27 to July 19, 2026, and compared llms.txt fetches with robots.txt fetches:

| Crawler | llms.txt fetches | robots.txt fetches |
| --- | --- | --- |
| OpenAI GPTBot | 7 | 3,990 |
| Anthropic ClaudeBot | 9 | 3,120 |
| PerplexityBot | 0 | 775 |
| Googlebot | 67 | 5,125 |
| Meta's crawler | 193 | 172 |

*Source: EZY.ai, "Do AI bots read llms.txt?", 83 sites, April 27 to July 19, 2026. Checked September 2026.*

The pattern is clear: the same crawlers that read robots.txt thousands of times read llms.txt a handful of times, with Meta's crawler the one exception in that sample. One study of 83 sites is not the whole web, but nobody has published data showing the opposite.

**It is not a ranking factor.** Nothing in Google's documentation suggests llms.txt affects rankings, and given the above, nothing suggests it affects which sources AI answers cite either.

## Why ship it anyway

If crawlers ignore it, why bother? Because crawlers are not the audience that matters for API documentation.

**Agents that are pointed at your docs on purpose.** A developer asks a coding agent to integrate your API and gives it your docs URL. The agent needs to find the authentication page, the error format and the OpenAPI document quickly. A curated index at a predictable path is exactly the right tool for that, whether or not a crawler ever reads it.

**Developers who paste links into assistants.** A link to a Markdown twin, or to llms-full.txt, gives an assistant clean input instead of a rendered page full of navigation.

**It is nearly free.** If your documentation platform generates llms.txt from your navigation, it costs nothing to maintain and cannot go stale. Hand-writing one is where the cost appears, because a hand-written index drifts.

**It forces a useful exercise.** Writing a two-line summary of your API and choosing the ten pages that matter most is good documentation practice. Many API docs cannot say in one sentence what the API does or where the OpenAPI document lives. The file makes that gap visible.

So ship it, generate it, keep it accurate, and then spend your real effort on the things below.

## What to put in llms.txt for API docs

API documentation has specific content that agents need and generic llms.txt advice misses.

1. **A one-paragraph summary** in the blockquote: what the API does, protocol and format, how authentication works, how versioning works.
2. **Base URLs** for production and sandbox, in plain text.
3. **A link to the OpenAPI document** near the top. This is the single most useful link you can give an agent, because it describes every endpoint, parameter and schema precisely. If the document is not public, consider publishing one. See [what is OpenAPI](/learn/openapi/what-is-openapi) if you are starting from scratch.
4. **Authentication, errors, pagination, rate limits and idempotency** pages. These are where agents and humans get integrations wrong.
5. **SDKs and the MCP server**, if you have them, so an agent can choose a typed client or connect as a tool instead of hand-writing HTTP calls. See [what is MCP](/learn/mcp/what-is-mcp).
6. **Changelog and deprecations** under `Optional`.

Leave out marketing pages, pricing tables, blog posts and anything behind a login. Link to Markdown twins rather than HTML pages wherever you have them.

## llms.txt vs robots.txt vs sitemap.xml vs api-catalog

These files sit side by side at the root of a site and are often confused.

| File | Purpose | Standardized? | Main reader |
| --- | --- | --- | --- |
| `robots.txt` | Tells crawlers what they may and may not fetch | Yes, RFC 9309 | Every well-behaved crawler |
| `sitemap.xml` | Lists every indexable URL with update dates | Yes, sitemaps.org protocol | Search engine crawlers |
| `llms.txt` | Curated Markdown index for language models | No, a community proposal | Agents directed at the site; few crawlers |
| `/.well-known/api-catalog` | Machine-readable list of a publisher's APIs, with links to their descriptions and docs | Yes, RFC 9727 | API tooling and automated clients |

llms.txt does not replace robots.txt: if you want to control whether AI crawlers can fetch your content, robots.txt is still the mechanism they check. For APIs specifically, `/.well-known/api-catalog` is the standardized way to say "here are my APIs and their OpenAPI documents". It is covered in [what is an API catalog](/learn/openapi/api-catalog).

## What matters more than llms.txt

If the goal is for developers and their AI tools to use your API successfully, these have more effect than any index file.

**A public, accurate OpenAPI document.** Agents and tools that generate code work best from a precise contract. A stale or incomplete document produces confident, wrong integrations. Lint it with [Spectral rules](/learn/openapi/spectral-rules) and publish it at a stable URL, for example from the [Scalar Registry](/products/registry).

**Crawlable, server-rendered documentation.** Search engines and AI answer engines read your HTML. A documentation site that renders content on the server, has clean headings and stable URLs, and loads quickly does more for visibility than any new file. Our guide to [OpenAPI documentation](/learn/openapi/openapi-documentation) and our [API documentation best practices](/learn/openapi/api-documentation-best-practices) cover this in depth.

**Examples that work.** Agents copy examples. Every request and response example in your [API reference](/learn/openapi/what-is-an-api-reference) should be valid against its schema. The [Scalar API reference](/products/api-references) renders them straight from the document, so fixing the document fixes the docs.

**An MCP server.** If you want AI agents to call your API, rather than read about it, give them tools. A hosted MCP server generated from your OpenAPI document lets an agent act through your API with proper authentication. See [remote MCP servers](/learn/mcp/remote-mcp-servers) and [Scalar's hosted MCP servers](/products/agent/mcp).

**Being mentioned and discussed.** An [Ahrefs study of 75,000 brands](https://ahrefs.com/blog/ai-brand-visibility-correlations) found that visibility in AI answers correlates most strongly with how often a brand is mentioned across the web and on YouTube, not with anything a site serves about itself. There is no shortcut file for that.

## llms.txt in Scalar Docs

Every site published with [Scalar Docs](/products/docs) serves `/llms.txt` and `/llms-full.txt` automatically. You do not write or configure them.

- **llms.txt** starts with your site title as an H1 and a short summary as a blockquote, followed by `##` sections that mirror your navigation groups. Each entry links to the page's `.md` URL with the page description where there is one.
- **llms-full.txt** contains the full Markdown of your pages in the same navigation order.
- **Hidden pages are left out** of both files, matching your sidebar and sitemap.
- **The output is stable.** The order follows your navigation, so identical content produces an identical file on every build, which keeps diffs quiet.

The generated index looks like this:

```markdown
# Your Documentation

> A short summary of your site

## Guides

- [Home](https://your-domain/index.md): The landing page
- [Getting Started](https://your-domain/getting-started/index.md)

## Reference

- [Scalar Galaxy](https://your-domain/api-reference/openapi.json): Explore the Galaxy API
```

If you are still choosing a platform, our roundup of [API documentation tools](/library/best-api-documentation-tools-2026) compares how each one handles this. Note that API references appear with a link to the OpenAPI document itself, which is exactly what an agent needs. Details are in the [llms.txt configuration guide](/products/docs/configuration/llms-txt). scalar.com itself is built with Scalar Docs and serves its own [llms.txt](https://scalar.com/llms.txt).

## Common mistakes

**Expecting SEO or traffic gains.** It is not a ranking signal, and the crawler data says it is rarely read. Judge it by whether agents that use your docs succeed, not by analytics.

**Hand-writing it and forgetting it.** A hand-maintained llms.txt that links to renamed pages is worse than none. Generate it from your navigation.

**Linking to HTML instead of Markdown.** The point is clean input. If your platform serves Markdown twins, link to those.

**Dumping everything into llms-full.txt and nothing else.** A huge single file is useful for some tools and a context-window problem for others. Keep the curated index too.

**Leaving out the OpenAPI document.** For API documentation, the most valuable link is the machine-readable description. Put it near the top.

**Using it to block AI crawlers.** llms.txt has no access-control semantics. Use robots.txt for that.

## Frequently asked questions

<scalar-detail title="Does Google use llms.txt?">
No. Google's documentation on AI features in Search says you do not need new machine-readable files or AI text files to appear in AI Overviews or AI Mode, and Google's John Mueller said in June 2025 that no AI system currently uses llms.txt.
</scalar-detail>

<scalar-detail title="Do AI crawlers read llms.txt?">
Rarely, based on published log data. An EZY.ai study of 83 sites over 12 weeks in 2026 found GPTBot fetched llms.txt 7 times and ClaudeBot 9 times, against thousands of robots.txt fetches each. Meta's crawler was the exception in that sample.
</scalar-detail>

<scalar-detail title="Is llms.txt worth adding to API documentation?">
Yes, if it is generated automatically. It costs almost nothing, helps agents and developers who are deliberately pointed at your docs, and nudges you to publish a clear summary and a link to your OpenAPI document. Do not expect it to change rankings or traffic.
</scalar-detail>

<scalar-detail title="What is the difference between llms.txt and llms-full.txt?">
llms.txt is a short index with links and descriptions. llms-full.txt contains the full Markdown content of the documentation in one file. The index is better for agents that fetch selectively; the full file is better for tools that search or chunk a whole documentation set.
</scalar-detail>

<scalar-detail title="Should llms.txt link to my OpenAPI document?">
Yes. For an API, the OpenAPI document is the most precise description you can give an agent, covering every endpoint, parameter, schema and security scheme. Put it near the top of the file.
</scalar-detail>

<scalar-detail title="Does llms.txt replace robots.txt?">
No. robots.txt controls crawler access and is the file crawlers actually check. llms.txt is an optional index with no access-control meaning.
</scalar-detail>

## Related

- **Learn:** [What is an API catalog?](/learn/openapi/api-catalog) · [API documentation best practices](/learn/openapi/api-documentation-best-practices) · [What is MCP?](/learn/mcp/what-is-mcp)
- **Docs:** [llms.txt in Scalar Docs](/products/docs/configuration/llms-txt)
- **Product:** [Scalar Docs](/products/docs) — documentation sites that generate llms.txt, llms-full.txt and Markdown pages for you.
