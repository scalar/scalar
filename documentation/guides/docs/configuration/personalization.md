# Personalization

Personalize your published Scalar Docs for signed-in visitors: show relevant navigation and content, display their plan or name, and prefill the API playground. Scalar handles sign-in and calls a **user-info hook**, an HTTPS endpoint you own, to look up the visitor by their verified email address.

Personalization controls visibility, not access. Hidden pages remain reachable by URL, and hidden content remains in the page source. Use [Private Docs](private-docs.md) and access groups to restrict access to an entire site. Do not put confidential content behind a visibility filter.

## Configure and publish

Add `siteConfig.userInfoHook` to your `scalar.config.json`. The URL must use HTTPS and resolve to a public address; localhost and private network addresses are not supported.

This complete configuration serves a welcome page and an enterprise page. Create the two Markdown files shown below alongside it:

```json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "info": { "title": "Acme Docs" },
  "siteConfig": {
    "userInfoHook": "https://api.example.com/docs/user-info"
  },
  "navigation": {
    "header": [{ "type": "spacer" }],
    "routes": {
      "/": {
        "type": "page",
        "title": "Welcome",
        "filepath": "welcome.md"
      },
      "/enterprise": {
        "type": "page",
        "title": "Enterprise",
        "filepath": "enterprise.md",
        "groups": ["enterprise"]
      }
    }
  }
}
```

Replace the endpoint URL with your own. [Publish your project](../deployment/automatic-deployment.md), then open the project in the [Scalar Dashboard](https://dashboard.scalar.com) and go to **Settings → Privacy → Personalization**.

1. Check that your published endpoint appears. It is read-only here; change it in the configuration and publish again.
2. Click **Generate secret**. Copy the secret immediately: Scalar shows it only once.
3. Store it in your hook server's environment as `SCALAR_USER_INFO_SECRET`. Never put it in your documentation, client-side code, or repository.

The secret belongs to this docs project. Generating or rotating it requires the `team.manage` permission; viewing its status requires `docs.edit`. Removing `userInfoHook` and publishing again stops hook calls.

## Build the hook

Scalar sends a server-to-server request after a visitor signs in. You do not need to build a login flow, configure browser CORS, or pass identity tokens in URLs.

### Request contract

```http
POST /docs/user-info
Content-Type: application/json
User-Agent: Scalar-UserInfo/1
scalar-event: user.info
scalar-signature: t=1770000000,v1=<hex signature>,v1=<optional rotation signature>
```

```json
{
  "type": "user.info",
  "email": "jane@example.com",
  "host": "docs.example.com",
  "project": { "uid": "your-project-uid" },
  "timestamp": 1770000000
}
```

`email` is verified by Scalar and lowercased. `host` identifies the docs host, and `project.uid` identifies the docs project. `timestamp` is Unix time in seconds and matches the signed header timestamp.

**Verify the signature before looking up or returning user data.** Compute HMAC-SHA256 over `<timestamp>.<raw request body>` using the complete signing secret, including its `whsec_` prefix, as the UTF-8 key. Compare the hexadecimal digest with any `v1` signature using a constant-time comparison. Preserve the raw body bytes: parsing and re-serializing JSON changes the signed payload. Reject timestamps more than 300 seconds in the past or future.

### Working Node.js example

Save this as `user-info.mjs`. It uses only Node.js built-ins. Set `DOCS_DEMO_EMAIL` to an email address you can sign in with. The example returns demo profile data for that address and no context for everyone else. Replace the demo lookup with your customer database lookup when adopting it.

```js
import { createHmac, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'

const secret = process.env.SCALAR_USER_INFO_SECRET
const demoEmail = process.env.DOCS_DEMO_EMAIL?.toLowerCase()

if (!secret || !demoEmail) {
  throw new Error('Set SCALAR_USER_INFO_SECRET and DOCS_DEMO_EMAIL')
}

const verifySignature = (header, body) => {
  if (typeof header !== 'string') return null

  const parts = header.split(',').map((part) => part.trim())
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2)
  if (!timestamp || !/^\d+$/.test(timestamp)) return null

  const seconds = Number(timestamp)
  if (!Number.isSafeInteger(seconds)) return null
  if (Math.abs(Date.now() / 1000 - seconds) > 300) return null

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.`)
    .update(body)
    .digest()

  const valid = parts.some((part) => {
    if (!/^v1=[a-f0-9]{64}$/.test(part)) return false
    return timingSafeEqual(expected, Buffer.from(part.slice(3), 'hex'))
  })

  return valid ? seconds : null
}

createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST' || request.url !== '/docs/user-info') {
    response.writeHead(404).end()
    return
  }

  try {
    const chunks = []
    let size = 0
    for await (const chunk of request) {
      size += chunk.length
      if (size > 64 * 1024) {
        response.writeHead(413).end()
        return
      }
      chunks.push(chunk)
    }

    const body = Buffer.concat(chunks)
    const timestamp = verifySignature(request.headers['scalar-signature'], body)
    if (timestamp === null) {
      response.writeHead(401).end()
      return
    }

    const lookup = JSON.parse(body.toString('utf8'))
    if (
      request.headers['scalar-event'] !== 'user.info' ||
      lookup?.type !== 'user.info' ||
      lookup.timestamp !== timestamp ||
      typeof lookup.email !== 'string' ||
      typeof lookup.host !== 'string' ||
      typeof lookup.project?.uid !== 'string'
    ) {
      response.writeHead(400).end()
      return
    }

    if (lookup.email !== demoEmail) {
      response.writeHead(204).end()
      return
    }

    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(
      JSON.stringify({
        expiresAt: Math.floor(Date.now() / 1000) + 300,
        groups: ['enterprise'],
        content: { firstName: 'Jane', plan: 'Enterprise' },
        apiPlaygroundInputs: { server: { subdomain: 'acme' } },
      }),
    )
  } catch {
    response.writeHead(400).end()
  }
}).listen(3000)
```

Set both environment variables in your hosting provider's secret settings, then run `node user-info.mjs`. Deploy behind HTTPS so the published URL forwards `/docs/user-info` to this server on port 3000. The local HTTP listener alone cannot receive Scalar's hook calls. Keep the signing secret on the server.

### Response contract

Return a `200` response containing the user-info object directly, without a `user` wrapper. All fields are optional; unknown fields are ignored.

| Field                 | Type                  | Behavior                                                                                                                                                                                                        |
| --------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expiresAt`           | Positive integer      | Unix seconds, not milliseconds. Hosting caches until this time, capped at 15 minutes. If omitted, the cache lasts 15 minutes. An already expired response supplies no context.                                  |
| `groups`              | Array of strings      | Up to 100 case-sensitive group names, each 1–64 characters, starting with a letter or digit and containing only letters, digits, `_`, `.`, `:`, or `-`. Merged with the access-group slugs the visitor matches. |
| `content`             | Object                | Up to 100 top-level keys, each 1–64 characters. `UserValue` renders string and number values; other values use its fallback.                                                                                    |
| `apiPlaygroundInputs` | Object of string maps | Optional `header`, `query`, `cookie`, `path`, and `server` maps. Keys are 1–200 characters; values are strings of at most 4,096 characters. See the supported prefills below.                                   |

Return `204` or `404` for an unknown visitor. Scalar treats these as no context without logging an error. Other non-2xx responses, invalid payloads, responses over 64 KB, and requests taking more than five seconds also supply no hook context. They do not prevent sign-in or grant access to a private site.

Hosting caches context per project and email. The docs client loads user context once per page load; an open page does not automatically refresh at `expiresAt`. Reload after the cache expires to see updated data.

## Personalize content

Create `welcome.md` with this content:

```markdown
# Welcome

Hello, :user[firstName]{fallback="visitor"}. Your plan is :user[plan]{fallback="Free"}.

:::visible{groups="enterprise"}
Your enterprise workspace includes priority support.
:::

:::visible{groups="enterprise" not}
Contact us to learn about the enterprise plan.
:::
```

Create `enterprise.md`:

```markdown
# Enterprise

Learn how to get the most from your enterprise workspace.
```

Publish these files, then open your site while signed out. You should see the fallback values and the enterprise contact message. Sign in with `DOCS_DEMO_EMAIL`: after the hook succeeds, the welcome page shows Jane and Enterprise, the support block appears, and the Enterprise navigation entry becomes visible. Signing out restores the anonymous view.

### MDX elements

In MDX, use the corresponding elements directly:

```mdx
Hello, <UserValue name="firstName" fallback="visitor" />.

<Visible groups="enterprise">
  Your enterprise workspace includes priority support.
</Visible>

<Visible
  not
  groups="enterprise">
  Contact us to learn about the enterprise plan.
</Visible>
```

`Visible` matches any of the listed groups. Use `groups="enterprise,admin"` to accept either; `not` shows the block to visitors who match none, including anonymous visitors. `UserValue` reads one top-level `content` key and inserts text, never HTML. Its `name` may contain letters, digits, underscores, dots, or hyphens, up to 64 characters. A dot is part of the key, not a nested property lookup. Its fallback defaults to an empty string.

## Filter navigation

Add `groups` to a page, group, link, or OpenAPI navigation entry, or a header link. An entry is visible if the visitor has at least one matching group. Entries without groups (or with an empty list) remain visible to everyone. Group names are case-sensitive: `Enterprise` and `enterprise` differ.

For example, add this entry under `navigation.routes` to show a section to enterprise visitors or administrators:

```json
{
  "/resources": {
    "type": "group",
    "title": "Customer resources",
    "groups": ["enterprise", "admin"],
    "children": {
      "/support": {
        "type": "link",
        "title": "Contact support",
        "url": "https://example.com/support"
      }
    }
  }
}
```

You can also set groups in page frontmatter:

```markdown
---
groups: [enterprise, admin]
---

# Customer resources
```

Filtering a parent group hides its children in navigation too. These filters do not protect the pages' URLs. Hook groups do not need to be created as dashboard access groups, and returning an access-group name from the hook does not grant access to a private site.

## Prefill the API playground

Return `apiPlaygroundInputs` to supply defaults for declared API security schemes and server variables:

```json
{
  "apiPlaygroundInputs": {
    "header": {
      "Authorization": "Bearer visitor-scoped-token",
      "X-API-Key": "visitor-api-key"
    },
    "query": { "api_key": "visitor-api-key" },
    "cookie": { "api_key": "visitor-api-key" },
    "server": { "subdomain": "acme" }
  }
}
```

For an `apiKey` security scheme, Scalar matches the key's location (`header`, `query`, or `cookie`) and declared name, such as `X-API-Key`. HTTP bearer schemes use the token from the `Authorization: Bearer …` header. Server values match declared server variable names, such as `subdomain`. These defaults sit underneath the visitor's manual edits.

The current implementation does not prefill arbitrary operation parameters, request bodies, HTTP Basic credentials, or OAuth flows. Although the response contract accepts a `path` map, it does not currently populate path parameters. Undeclared inputs do not create new security schemes or server variables.

Playground credentials reach the visitor's browser. Return only short-lived, narrowly scoped credentials belonging to that visitor. Do not return a privileged application session or place credentials in `content`.

## Public and private sites

On a **public site**, configuring a hook enables sign-in for personalization. Visitors can continue reading anonymously; signing in does not turn public pages into protected pages. Use a visible header, as in the configuration above, to expose the sign-in action.

On a **private site**, Scalar checks the existing site access rules before asking the hook for context. Workspace membership and configured access groups still determine who gets in. The hook enriches an admitted visitor; it cannot admit someone or deny their existing site access. Matching access-group slugs are included alongside groups returned by the hook.

Scalar uses its existing magic-link, Google, Microsoft, or configured SSO sign-in flow and a first-party HTTP-only cookie. The docs client requests `/_scalar/me` on your docs origin (under the project's subpath for multi-project domains). Anonymous visitors receive `{ "user": null }`.

## Rotate the signing secret

In **Settings → Privacy → Personalization**, rotate the secret and copy the newly displayed value into your hook server's secret settings. Redeploy or restart the hook so it uses the new value.

During normal rotation, Scalar signs with both the new secret and the previous secret for a 24-hour grace window. The verifier above accepts any matching `v1` signature, so the old deployment continues working while you update it. Complete the update before the grace window ends.

If you revoke the previous secret during rotation, it stops being accepted immediately. Update the hook promptly; verification against the revoked secret fails and personalization has no hook context until the new secret is installed. Previously cached context can remain until its expiry.

## Current limitations

- Local preview does not load visitor identity. Test sign-in and hook calls on a published site.

- Visibility filters run in the browser. Hidden navigation entries remain reachable by URL, and `Visible` content remains in HTML source. `Visible` blocks are omitted from plain Markdown exports, but this is not a confidentiality guarantee.
- Page groups are not enforced server-side, including on private sites. Keep content with different access requirements in separately protected sites.
- Search and sitemaps are not group-aware. Do not rely on groups to hide content from discovery.
- Groups do not filter individual OpenAPI operations or schema properties.
- Use Markdown directives or MDX for `Visible` and `UserValue`; the visual editor does not currently provide menus for these elements.
- Hook errors remove hook-provided context, not the visitor's sign-in or existing site access. Design useful anonymous and fallback content.
