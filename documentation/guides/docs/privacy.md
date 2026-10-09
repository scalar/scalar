# Privacy

## No third-party tracking

Docs is privacy-friendly by default:

- We do not inject third-party analytics or tracking scripts into your pages.
- We do not set tracking cookies.
- We do not track readers across sites or build visitor profiles.

That said, you are free to [add any HTML/JS](./content/html-css-js.md) to your projects.

## First-party page view analytics

Scalar records page views on its own servers when it serves a page, so you can see how your documentation is used. Nothing is added to your pages, and no cookies are set for analytics.

Each page view records:

- the page path, domain, response status, and content type
- the referrer
- the browser or client family, for example Chrome or Cursor, not the full user agent
- whether the visitor is a person, a bot, an LLM crawler, or an MCP client
- a visitor ID

For people, the visitor ID is a pseudonym derived from a keyed hash of the IP address and user agent. It changes every day, so a visitor cannot be followed from one day to the next. The IP address itself is never stored. Bots, LLM crawlers, and MCP clients are counted as groups, not as individuals.

Only successfully served pages count. Failed requests and other files, like images and scripts, are not recorded.

You can view your analytics in the editor under **Settings → Analytics**.

### Turn off analytics

Open **Settings → Analytics** and turn off **Enable analytics**. The change applies from your next publish. You need permission to edit the project.

## Technically required cookies only

We use a small set of technically required cookies for authentication and the routing functionality:

- always: `scalar-docs-subpaths` lists the projects that share your domain, so search works across them
- if authenticated: `scalar-registry-auth` contains your authentication token (HTTP Only, not accessible through JS)
- while signing in to a private site: `scalar-docs-verifier` holds a one-time sign-in code. It is HTTP Only, sent only to the sign-in callback, and expires after an hour.

## Content Signals

Content Signals declare how search and AI crawlers may use your published documentation. Scalar adds a `Content-Signal` line to the generated `robots.txt`. By default, search indexing, AI input, and AI training are all allowed.

Open your documentation project's **Settings → Content Signals** to change these preferences:

- **Search**: building a search index and showing links and short excerpts.
- **AI input**: using content as input for AI answers, including retrieval and grounding.
- **AI training**: training or fine-tuning AI models.

Turn an individual signal off to declare `no` for that use. Turn **Enable** off to omit the entire `Content-Signal` line; this does not declare `no` for all uses. Publish your changes to update the generated `robots.txt`.

These preferences are advisory and depend on crawlers honoring them. They do not restrict access to your documentation or change its authentication settings.

You can also set these preferences in [`siteConfig.contentSignals`](./configuration/site-config.md#content-signals). If your project's assets include a custom `robots.txt`, Scalar preserves that file; update its Content Signals directly.
