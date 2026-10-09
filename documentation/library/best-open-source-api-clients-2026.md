# Best open-source API clients (2026)

*Last updated: September 2026*

An open-source API client is a tool for building, sending, and saving HTTP requests whose source code is published under an open-source licence, and the strongest options in 2026 are Scalar, Bruno, Hoppscotch, Insomnia, Yaak, HTTPie, and RESTer.

Most people looking for one are leaving Postman, which is not open source, and want something that works offline, keeps collections in files they control, and does not require an account to send a request. The tools below all meet at least part of that brief, but they make different trade-offs, and one of them (Yaak) has an open-source codebase with a paid licence for commercial use of its builds. We explain each.

This page is written by Scalar, which makes one of the clients listed. Every licence below was checked against the project's GitHub repository on 26 September 2026, and every price links to the vendor's pricing page. Where another client is the better choice, we say so.

## How we evaluated

- **Licence.** What the repository's licence actually says, and whether the builds you download are covered by it.
- **Storage.** Are collections local files, a proprietary cloud, or both? Can you commit them to Git?
- **Account requirement.** Can you send a request without signing in?
- **Protocols.** REST, GraphQL, WebSockets, server-sent events, gRPC.
- **OpenAPI.** Can it import an OpenAPI document, and does it treat OpenAPI as a first-class format or as a one-off import?
- **Platforms.** Desktop, browser, CLI.
- **Paid tiers.** What the free version leaves out, and what the paid one costs.

## Comparison table

Stars are GitHub stars on 26 September 2026.

| Client | Licence | Stars | Platforms | Protocols (from the project's docs) | Collections stored as | Paid tier |
| --- | --- | --- | --- | --- | --- | --- |
| Scalar | MIT | 15.7k (monorepo) | Windows, macOS, Linux, browser | REST, with streaming responses | OpenAPI documents | Client is free |
| Bruno | MIT | 47.2k | Windows, macOS, Linux, CLI | REST, GraphQL, SOAP, gRPC, WebSocket | `.bru` files on disk | [From $6/user/month](https://www.usebruno.com/pricing) |
| Hoppscotch | MIT | 80.5k | Browser (PWA), desktop, CLI, self-host | REST, GraphQL, WebSocket, SSE, Socket.IO, MQTT | Local or cloud workspaces | [$6/user/month](https://hoppscotch.com/pricing) |
| Insomnia | Apache-2.0 | 40.0k | Windows, macOS, Linux, CLI | REST, GraphQL, WebSockets, SSE, gRPC | Local Vault, Git Sync, or cloud | [From $12/user/month](https://insomnia.rest/pricing) |
| Yaak | MIT source; commercial use of builds needs a licence | 19.3k | Windows, macOS, Linux | REST, GraphQL, WebSockets, SSE, gRPC | Local | [From $79/year](https://yaak.app/pricing) |
| HTTPie (CLI) | BSD-3-Clause | 38.6k | Command line | HTTP | Sessions and shell history | Free |
| RESTer | MIT | 386 | Firefox and Chrome extension | HTTP | Browser storage | Free |

## 1. Scalar API Client

**What it is.** An offline-first API client built on OpenAPI, available for [Windows, macOS, Linux, and in the browser](/products/api-client/download). It is the same client that opens when a reader clicks "Test Request" in a Scalar API reference, so the requests your users try in your docs and the ones your team sends in the desktop app share one tool. Features include environments, dynamic variables, Postman-compatible scripting, request testing, and code generation for 40+ HTTP clients and languages.

**Licence.** MIT, in the [scalar/scalar](https://github.com/scalar/scalar) monorepo alongside the API reference.

**OpenAPI.** OpenAPI 3.x is the client's native format, not an import target: environments, authentication schemes, and servers map directly to the document. Swagger 2.0 files are upgraded to OpenAPI 3.1 on import. It also [imports](/products/api-client) Postman collections (v2.0 and v2.1) and cURL commands.

**Account.** Not required.

**Best for.** Teams whose API already has an OpenAPI document and who want the client, the API reference, and the source of truth to be the same file. Also good if you want your API consumers to use the same client you do.

**Watch out for.** Scalar's client is REST-focused. If your daily work is GraphQL, gRPC, WebSockets, or MQTT, Hoppscotch, Insomnia, Yaak, or Bruno cover more protocols today.

## 2. Bruno

**What it is.** A desktop API client that stores every request as a plain-text `.bru` file in a folder, so collections live in your repository and change through pull requests. The README states that Bruno is offline-only, with "no plans to add cloud-sync to Bruno, ever" ([repository](https://github.com/usebruno/bruno)). It includes a CLI for running collections in CI, and the [docs](https://docs.usebruno.com/send-requests/overview) list REST, GraphQL, SOAP, gRPC, and WebSocket requests.

**Licence.** MIT.

**Paid tiers.** The open-source edition is free. Pro is $6 per user per month and Ultimate $11 per user per month, both billed annually, adding Git integration in the app, automation, SSO, SCIM, and audit logs ([pricing](https://www.usebruno.com/pricing)).

**OpenAPI.** Imports OpenAPI documents into Bruno collections.

**Best for.** Teams who want Git to be the collaboration layer and never want request data in a vendor cloud.

**Watch out for.** `.bru` is Bruno's own format, so your collections are portable as text but not as OpenAPI. Some Git workflow features sit in the paid tiers. See [Bruno alternatives](/alternatives/bruno).

## 3. Hoppscotch

**What it is.** The most-starred open-source API client on GitHub, starting life as a browser-based tool and now also shipping desktop apps, a CLI, and a self-hostable server ([repository](https://github.com/hoppscotch/hoppscotch)). It covers the widest protocol range on this list: REST, GraphQL, WebSocket, server-sent events, Socket.IO, and MQTT.

**Licence.** MIT.

**Paid tiers.** The cloud Free plan includes unlimited workspaces, collections, and requests. The Organization plan is $6 per user per month billed annually and adds an admin dashboard and dedicated support ([pricing](https://hoppscotch.com/pricing)). Self-hosting is available from GitHub.

**OpenAPI.** Supports importing OpenAPI documents.

**Best for.** Teams who want one client for many protocols, a browser version for quick work, and the option to self-host the whole thing.

**Watch out for.** Browser-based requests to local or private APIs can hit CORS, which Hoppscotch works around with a browser extension or its proxy. See [Hoppscotch alternatives](/alternatives/hoppscotch).

## 4. Insomnia

**What it is.** A mature desktop API client from Kong, with a built-in OpenAPI editor, mock servers, and a CLI ([repository](https://github.com/Kong/insomnia)).

**Licence.** Apache-2.0.

**Account.** The README says an account is not required for the local Scratch Pad, but most features need one. Projects can be kept entirely local with Local Vault or Git Sync.

**Paid tiers.** Essentials is free, with Git Sync for up to 3 users and 1,000 mock requests a month. Pro is $12 per user per month and Enterprise $45 per user per month ([pricing](https://insomnia.rest/pricing)).

**OpenAPI.** A native OpenAPI editor with visual preview.

**Best for.** Teams who design in OpenAPI and test in the same app, need gRPC alongside REST and GraphQL, or already run Kong.

**Watch out for.** The account requirement for most features is the main reason people leave. See [Insomnia alternatives](/alternatives/insomnia).

## 5. Yaak

**What it is.** A fast desktop client built with Tauri, Rust, and React by Greg Schier, who [created Insomnia](https://yaak.app/) and sold it in 2019. It handles REST, GraphQL, WebSockets, server-sent events, and gRPC, with no telemetry ([repository](https://github.com/mountain-loop/yaak)).

**Licence.** The source code is MIT. The prebuilt binaries are free for personal use, but commercial use requires a licence: $79 per year or $399 lifetime for individuals, and $149 per user per year for businesses ([pricing](https://yaak.app/pricing)). You can build from source under MIT.

**OpenAPI.** Imports from Postman, Insomnia, OpenAPI, Swagger, and cURL.

**Best for.** Individual developers who want a polished, quick desktop client and are happy to pay a modest licence for work use.

**Watch out for.** If your definition of open source includes "free to use at work without buying a licence", the official builds do not meet it.

## 6. HTTPie

**What it is.** A command-line HTTP client with readable syntax, JSON support, sessions, and plugins ([repository](https://github.com/httpie/cli)). This entry covers the CLI; HTTPie also makes a desktop app, whose source we did not find under an open-source licence.

```bash
http POST https://api.example.com/users name=Jane
```

**Licence.** BSD-3-Clause.

**Best for.** Developers who live in the terminal and want something friendlier than cURL for everyday requests and scripts.

**Watch out for.** No collections UI, no OpenAPI import. It complements a GUI client rather than replacing one.

## 7. RESTer

**What it is.** A REST client that runs as a Firefox and Chrome extension, with collections, history, and Basic, OAuth 2, and cookie authentication ([repository](https://github.com/frigus02/RESTer)). The latest GitHub release, 4.15.1, was published in August 2026.

**Licence.** MIT.

**Best for.** Quick requests from the browser without installing a desktop app.

**Watch out for.** A small project maintained by a small team, with a narrower feature set than the desktop clients.

## Not quite open source: Requestly

Requestly markets itself as a local-first Postman alternative with Git sync and OpenAPI import. Its [GitHub repository](https://github.com/requestly/requestly) is AGPL-3.0, but the repository README describes the API client application itself as proprietary. We mention it because it often appears in "open source" lists, and it is worth reading the licence before you rely on it.

## Why not Postman?

Postman is the default API client, and for large teams with established workspaces it is often still the practical choice. It is not open source, and its collaboration model is built around Postman's cloud. We compare in detail at [Scalar vs Postman](/resources/compare/postman), and list options at [Postman alternatives](/alternatives/postman).

## When another client is the better choice

- **You work mostly in GraphQL, gRPC, WebSockets, or MQTT.** Hoppscotch, Insomnia, Yaak, or Bruno.
- **You want collections as plain-text files reviewed in pull requests, and your API has no OpenAPI document.** Bruno.
- **You want a browser-first client you can self-host for the whole company.** Hoppscotch.
- **You live in the terminal.** HTTPie.
- **You want a quick client inside the browser.** RESTer.

If your API has an OpenAPI document, or you want one, Scalar is the client that treats it as the source of truth rather than an import format.

## Frequently asked questions

<scalar-detail title="What is the best open-source alternative to Postman?">
It depends on how you work. Scalar suits teams with an OpenAPI document who want the client and the docs to share it. Bruno suits Git-first teams. Hoppscotch suits teams who need many protocols and self-hosting. Insomnia suits teams who want an OpenAPI editor and gRPC in a mature app. All four are open source.
</scalar-detail>

<scalar-detail title="Is Bruno really free?">
The open-source edition is MIT licensed and free. Bruno also sells Pro ($6 per user per month) and Ultimate ($11 per user per month) plans, billed annually, which add features such as in-app Git integration, SSO, and audit logs.
</scalar-detail>

<scalar-detail title="Is Yaak open source?">
Yaak's source code is MIT licensed. The official prebuilt binaries are free for personal use, but commercial use requires a paid licence. You can build Yaak from source yourself under the MIT licence.
</scalar-detail>

<scalar-detail title="Which open-source API clients work offline?">
Scalar, Bruno, Yaak, and HTTPie all work offline without an account. Insomnia works offline with Local Vault or the Scratch Pad. Hoppscotch's desktop app and PWA can work offline for local requests.
</scalar-detail>

<scalar-detail title="Can I import an OpenAPI document into these clients?">
Scalar, Bruno, Hoppscotch, Insomnia, and Yaak all import OpenAPI. Scalar is the only one on this list that uses OpenAPI as its native storage format, so changes stay in the document. See [what is an API client](/learn/openapi/what-is-an-api-client).
</scalar-detail>

<scalar-detail title="Can I self-host an open-source API client?">
Desktop clients run on your machine, so there is nothing to host. For a shared browser client, Hoppscotch documents self-hosting, and Scalar's API client can be embedded or mounted in your own web app from the MIT-licensed `@scalar/api-client` package.
</scalar-detail>

## Related

- **Learn:** [What is an API client?](/learn/openapi/what-is-an-api-client) · [What is OpenAPI?](/learn/openapi/what-is-openapi)
- **Docs:** [Download the API client](/products/api-client/download)
- **Product:** [Scalar API Client](/products/api-client) — an MIT-licensed, offline-first client that uses your OpenAPI document as the source of truth

---

*Licences, star counts, and features are taken from each project's GitHub repository, and prices from each vendor's pricing page, as of 26 September 2026, and are linked inline. This page is written by Scalar, which makes one of the clients listed. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
