# Privacy

## No analytics, no tracking

Docs is privacy-friendly by default:

- We do not inject third-party analytics scripts.
- We do not inject tracking scripts or cookies on custom domains.
- We do not use any form of fingerprinting technologies to uniquely identify users.

That said, you're free to [add any HTML/JS](./content/html-css-js.md) to your projects.

## Technically required cookies only

We use a small set of technically required cookies for authentication and the routing functionality:

- always: `scalar-docs-subpaths` contains just a string
- if authenticated: `scalar-registry-auth` contains your authentication token (HTTP Only, not accessible through JS)

## No IP logging

We do not log request traffic. Only internal proxy errors are logged, and those logs do not include IP addresses.

## Content Signals

Content Signals declare how search and AI crawlers may use your published documentation. Scalar adds a `Content-Signal` line to the generated `robots.txt`. By default, search indexing, AI input, and AI training are all allowed.

Open your documentation project's **Settings → Content Signals** to change these preferences:

- **Search**: building a search index and showing links and short excerpts.
- **AI input**: using content as input for AI answers, including retrieval and grounding.
- **AI training**: training or fine-tuning AI models.

Turn an individual signal off to declare `no` for that use. Turn **Enable** off to omit the entire `Content-Signal` line; this does not declare `no` for all uses. Publish your changes to update the generated `robots.txt`.

These preferences are advisory and depend on crawlers honoring them. They do not restrict access to your documentation or change its authentication settings.

You can also set these preferences in [`siteConfig.contentSignals`](./configuration/site-config.md#content-signals). If your project's assets include a custom `robots.txt`, Scalar preserves that file; update its Content Signals directly.
