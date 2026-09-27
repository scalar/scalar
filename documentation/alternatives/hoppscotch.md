# Best Hoppscotch alternatives (2026)

*Last updated: September 2026*

A good Hoppscotch alternative keeps what makes Hoppscotch appealing (open source, fast, free to start) and fixes the part that bothers you, whether that is browser limits, the depth of OpenAPI import, or running your own server. This page compares six options, starting with Scalar, and ends with the cases where Hoppscotch remains the better pick.

This page is written by Scalar, so read it with that in mind. Every claim about Hoppscotch and the other tools links to the vendor's own documentation, pricing page or repository, checked on September 26, 2026.

## Why people look for a Hoppscotch alternative

Hoppscotch is MIT licensed, [one of the most popular open-source API clients on GitHub](https://github.com/hoppscotch/hoppscotch), and it runs [in the browser, on desktop and as a CLI](https://docs.hoppscotch.io/). The reasons people move on are specific, and most are documented by Hoppscotch itself.

**Browser requests need an interceptor.** Browsers block many cross-origin requests, so the Hoppscotch web app routes them through an [interceptor](https://docs.hoppscotch.io/documentation/features/interceptor.md): the Hoppscotch Agent running locally, a proxy (Proxyscotch, self-hostable), or a browser extension for Chrome and Firefox. It works, but "which interceptor is on" becomes one more thing to debug. The [desktop app](https://docs.hoppscotch.io/documentation/clients/desktop/overview.md) avoids this.

**OpenAPI import leaves out request bodies.** Hoppscotch's [importer documentation](https://docs.hoppscotch.io/documentation/features/importer.md) says OpenAPI imports include parameters, authorization, headers and response examples, "however, details like request bodies, scripts, and tests aren't imported." For an API with many POST and PUT operations, you rebuild the bodies by hand. There is also no documented ongoing sync with the source document.

**Shared workspaces are REST-only.** In Hoppscotch's words, ["GraphQL and Realtime APIs are available only in the personal workspace and are not supported for collaboration in shared workspaces."](https://docs.hoppscotch.io/documentation/features/workspaces.md) Teams that chose Hoppscotch for its realtime protocols sometimes discover this late.

**Self-hosting is a service to run.** The [Community Edition](https://docs.hoppscotch.io/documentation/self-host/community-edition/getting-started.md) is free and open source, and SCIM provisioning, user groups, audit logs and activity logs are documented as [Enterprise Edition](https://docs.hoppscotch.io/documentation/self-host/enterprise-edition/getting-started.md) features. Either way, you now operate a server, an admin dashboard and upgrades for your API client.

**Collaboration needs a login and a server.** Hoppscotch's docs describe switching between workspaces and inviting teammates [once you are logged in](https://docs.hoppscotch.io/documentation/features/workspaces.md), and shared collections live in Hoppscotch Cloud or your own instance rather than in your Git repository.

## Hoppscotch alternatives at a glance

| Tool | License | Runs in | Account needed | Where your work lives | OpenAPI | Protocols today | Paid from |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Scalar** | MIT | Browser and desktop | No | On your machine | Native format, bodies included | HTTP (gRPC, GraphQL, WebSocket, SOAP coming soon) | Client free on every plan ([pricing](/pricing)) |
| **Bruno** | [MIT](https://github.com/usebruno/bruno) | [Desktop, CLI](https://github.com/usebruno/bruno) | [No](https://www.usebruno.com/) | Plain-text files in your repo | [Import and sync](https://docs.usebruno.com/open-api/openapi-sync.md) | REST, GraphQL, gRPC, WebSocket | [$6/user/month, annual](https://www.usebruno.com/pricing) |
| **Insomnia** | [Apache-2.0](https://github.com/Kong/insomnia) | Desktop, CLI | [Beyond Scratch Pad](https://developer.konghq.com/insomnia/storage/) | Local Vault, Git Sync or cloud | Design and import | REST, GraphQL, WebSockets, SSE, gRPC | [$12/user/month](https://insomnia.rest/pricing) |
| **Yaak** | [MIT](https://github.com/mountain-loop/yaak) | Desktop | [No](https://yaak.app/pricing) | On your device, mirrorable to files | Import | REST, GraphQL, WebSockets, SSE, gRPC | [$79/year for work use](https://yaak.app/pricing) |
| **Postman** | Closed source | Browser and desktop | [For collections](https://blog.postman.com/announcing-new-lightweight-postman-api-client/) | Postman cloud, or [Git on desktop](https://learning.postman.com/docs/use/native-git/overview) | Import | HTTP, GraphQL, gRPC, WebSocket, MQTT, MCP | [$9/month Solo](https://www.postman.com/pricing/) |
| **VS Code REST Client** | [MIT](https://github.com/Huachao/vscode-restclient) | Your editor | No | `.http` files | None | HTTP, GraphQL | Free |
| Hoppscotch (for reference) | [MIT](https://github.com/hoppscotch/hoppscotch) | Browser, desktop, CLI | [For workspaces](https://docs.hoppscotch.io/documentation/features/workspaces.md) | Hoppscotch Cloud or self-hosted | [Import, no bodies](https://docs.hoppscotch.io/documentation/features/importer.md) | REST, GraphQL, WebSocket, SSE, Socket.IO, MQTT | [$6/user/month, annual](https://hoppscotch.com/pricing) |

## The options, one by one

### 1. Scalar: browser and desktop, with a full OpenAPI import

**Verdict:** the closest match for Hoppscotch users who liked the browser client but want OpenAPI to come across complete.

Like Hoppscotch, the [Scalar API Client](/products/api-client) is MIT licensed and runs both in the browser at [client.scalar.com](https://client.scalar.com) and as a [desktop app](/products/api-client/download) for macOS, Windows and Linux. Unlike Hoppscotch, it needs no account and has no workspace login: everything is stored on your machine.

The bigger difference is OpenAPI. Scalar does not convert your document into a separate collection format. [The OpenAPI document is the collection](/products/api-client/import), so request bodies, schemas, examples, servers and [security schemes](/products/api-client/authentication) are all there when you open an operation. You can import from a URL, a file, or a local development server, and the client can watch a document on disk and follow its changes. It also imports Postman Collections, Swagger 2.0 (upgraded to OpenAPI 3.1 automatically) and cURL.

You get [environments](/products/api-client/environments), [pre-request scripts](/products/api-client/scripts) and [tests](/products/api-client/testing) using the Postman-compatible `pm` API, a collection runner, and [code snippets](/products/api-client/code-generation) in 40+ HTTP clients across 21 languages.

In fairness, the browser has the same CORS rules for everyone. Scalar's web client routes requests through proxy.scalar.com by default, and you can [run your own proxy](https://github.com/scalar/scalar/tree/main/projects/proxy-scalar-com). The desktop app skips the proxy unless you configure one. Where Hoppscotch is clearly ahead: GraphQL, WebSocket, SSE, Socket.IO and MQTT work today, while Scalar lists GraphQL, WebSocket, SSE, gRPC and SOAP as "Coming Soon" on the [pricing page](/pricing). Hoppscotch also has shared team workspaces and a CLI; Scalar's client has neither yet, and cloud sync is also listed as coming soon.

**Best for:** REST and OpenAPI-first teams who want the same client in the browser and on desktop with no account and no server to run.

### 2. Bruno: files in Git instead of a workspace server

**Verdict:** the best choice if what you want is to stop running a shared server and put collections in Git.

Bruno is MIT licensed, needs no account, and stores collections as [plain-text files in your repository](https://www.usebruno.com/), so pull requests replace shared workspaces. It supports REST, GraphQL, gRPC and WebSocket, has a [CLI for CI](https://docs.usebruno.com/bru-cli/overview.md), and can [sync collections with an OpenAPI document](https://docs.usebruno.com/open-api/openapi-sync.md). It is desktop-only. See [Bruno alternatives](/alternatives/bruno).

**Best for:** teams leaving a self-hosted Hoppscotch instance for a Git-based workflow.

### 3. Insomnia: more protocols, more platform

**Verdict:** the pick if you need gRPC, which Hoppscotch's docs do not cover.

Insomnia is Apache-2.0 and covers [REST, GraphQL, WebSockets, SSE and gRPC](https://github.com/Kong/insomnia), with [Local Vault, Cloud Sync and Git Sync](https://developer.konghq.com/insomnia/storage/) storage, an OpenAPI design editor and the Inso CLI. Kong says its cloud collaboration is [free for unlimited users](https://konghq.com/blog/product-releases/migrate-to-insomnia-free-collaboration-for-unlimited-users). Anything beyond the Scratch Pad needs an account. See [Insomnia alternatives](/alternatives/insomnia).

**Best for:** teams that want free hosted collaboration across many protocols.

### 4. Yaak: a fast native desktop client

**Verdict:** the choice for individuals who want a native app rather than a web app.

Yaak is MIT licensed, local-first, supports REST, GraphQL, WebSockets, SSE and gRPC, and [imports OpenAPI, Postman and Insomnia collections](https://github.com/mountain-loop/yaak). It is free for personal use; [work use needs a licence](https://yaak.app/pricing) from $79 per year.

**Best for:** developers who want a polished desktop client and do not need a browser version.

### 5. Postman: when you need the whole platform

**Verdict:** only if you want monitors, cloud mocks and a large ecosystem, and accept the account model.

Postman runs in the browser and on desktop and supports the widest range of protocols. Collections require an account, and the Free plan has been [limited to one user](https://learning.postman.com/docs/billing/about-plans) since March 2026. See [Postman alternatives](/alternatives/postman).

**Best for:** larger teams that want a complete, paid platform.

### 6. VS Code REST Client: nothing to host at all

**Verdict:** the lightest possible alternative.

The [REST Client extension](https://github.com/Huachao/vscode-restclient) is MIT licensed and sends HTTP and GraphQL requests from `.http` files in your editor. No server, no account, no CORS, and the files live in Git.

**Best for:** developers who want requests next to their code and no separate app.

## When to stay on Hoppscotch

- **You use realtime protocols.** WebSocket, SSE, Socket.IO and MQTT in one open-source client is rare. Scalar does not support them yet.
- **You want a shared team client you host yourself.** The Community Edition gives you that for free, and few open-source clients do.
- **Your team works in the browser.** Hoppscotch's web app is quick to open and share, and the interceptors handle CORS once set up.
- **You run tests in CI.** The Hoppscotch CLI runs collections from your pipeline.
- **Your collections are not built from OpenAPI.** If you do not maintain an OpenAPI document, the import gap described above does not affect you.

## Frequently asked questions

<scalar-detail title="Is Hoppscotch free?">
Yes. Hoppscotch is MIT licensed, the cloud Free plan includes unlimited workspaces, collections and requests, and the self-hosted Community Edition is free. The Organization plan is $6 per user per month billed annually, according to Hoppscotch's [pricing page](https://hoppscotch.com/pricing) on September 26, 2026.
</scalar-detail>

<scalar-detail title="Why does Hoppscotch need an interceptor or browser extension?">
Browsers enforce CORS, so the Hoppscotch web app sends many requests through an interceptor: the local Hoppscotch Agent, a proxy, or a browser extension. The desktop app does not need one. Scalar's browser client also uses a proxy for cross-origin requests, and its desktop app does not.
</scalar-detail>

<scalar-detail title="Does Hoppscotch import request bodies from OpenAPI?">
According to Hoppscotch's importer documentation, OpenAPI imports include parameters, authorization, headers and response examples, but not request bodies, scripts or tests. Scalar uses the OpenAPI document directly, so request bodies and schemas are available for every operation.
</scalar-detail>

<scalar-detail title="Does Hoppscotch support gRPC?">
Hoppscotch's documentation covers REST, GraphQL and realtime protocols (WebSocket, SSE, Socket.IO and MQTT). We did not find gRPC in its docs. Insomnia, Bruno, Yaak and Postman support gRPC today.
</scalar-detail>

<scalar-detail title="Can I use Scalar without an account like Hoppscotch?">
Yes, and with fewer limits: Scalar's API client needs no account in the browser or on desktop, and your collections stay on your machine. The trade-off is that Scalar has no shared cloud workspace yet.
</scalar-detail>

## Related

- **Learn:** [What is an API client?](/learn/openapi/what-is-an-api-client) · [Best open-source API clients (2026)](/library/best-open-source-api-clients-2026)
- **Docs:** [Import an OpenAPI document into the API Client](/products/api-client/import)
- **Product:** [Scalar API Client](/products/api-client) — MIT licensed, in the browser and on desktop, with no account

---

*This page is based on Hoppscotch's documentation, pricing page and GitHub repository, and on the public pages of every other tool listed, as checked on September 26, 2026. Hoppscotch is actively developed and its features may change. If something here is wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
