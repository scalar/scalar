# How to host an MCP server: options compared (2026)

*Last updated: October 2026*

A stdio MCP server only works on the machine that starts it, so hosting an MCP server means serving it over Streamable HTTP from somewhere other people can reach. You have two kinds of choice: deploy the server yourself on a platform such as Cloudflare Workers, Vercel, AWS Lambda, or Google Cloud Run, or use a managed host that runs the server for you. If the server exists to expose an API you already describe with OpenAPI, the easiest route with no infrastructure to manage is a managed host such as Scalar, which serves the server from the document. If the server contains its own logic, deploy it like any stateless HTTP service.

This guide compares the realistic hosting options on the things that decide the choice: session state, duration and streaming limits, cost model, and what you have to run. It includes a deploy-ready server you can put in a container, the checklist a public MCP server must pass before launch, and a plain account of when Scalar's hosting is and is not the right fit. Platform limits and prices were checked against each vendor's documentation on 7 October 2026.

**On this page**

- [Why hosting means Streamable HTTP](#why-hosting-means-streamable-http)
- [MCP server hosting options compared](#mcp-server-hosting-options-compared)
- [Self-hosting platforms in detail](#self-hosting-platforms-in-detail)
- [A deploy-ready MCP server](#a-deploy-ready-mcp-server)
- [What a public MCP server needs before launch](#what-a-public-mcp-server-needs-before-launch)
- [Hosting an MCP server with Scalar](#hosting-an-mcp-server-with-scalar)
- [When not to pick Scalar](#when-not-to-pick-scalar)
- [Frequently asked questions](#frequently-asked-questions)

## Why hosting means Streamable HTTP

MCP defines two standard transports. With **stdio**, the client launches the server as a child process and talks to it over standard input and output; nothing is listening on a port, so nobody else can connect. With **Streamable HTTP**, the server exposes one endpoint, usually `/mcp`, and the client sends each JSON-RPC message as an HTTP POST and reads the reply as JSON or as a short Server-Sent Events stream. Hosting a server means serving that endpoint.

Two details of the current specification, revision [2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http), change what hosting looks like:

- **There are no protocol sessions any more.** The [2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog) removed the `Mcp-Session-Id` header and the `initialize` handshake; every request carries its protocol version and client capabilities in `_meta`. A server written for this revision is stateless by construction, which means any instance behind a load balancer can answer any request, and serverless platforms fit well.
- **HTTP+SSE is deprecated.** Tutorials from 2024 that open a `GET /sse` stream describe the 2024-11-05 transport, which has been deprecated since 2025-03-26 and is formally classified as Deprecated in the current revision. New servers should not offer it. Tutorials from 2025 that depend on a session ID describe the 2025-03-26 to 2025-11-25 revisions; modern SDKs still serve those clients through a stateless fallback, but you should not design around sessions.

The specification is the same whether you host the server yourself or someone hosts it for you. [Remote MCP servers](/learn/mcp/remote-mcp-servers) explains the transport in depth and shows how to connect one from Claude, Cursor, and VS Code.

## MCP server hosting options compared

| Option | Session state | Duration and streaming | Cost model | Best fit |
| --- | --- | --- | --- | --- |
| **Cloudflare Workers** | Stateless by default with `createMcpHandler`; the Durable Object based `McpAgent` is deprecated | No hard wall-clock limit while the client stays connected; CPU time per request is 10 ms on Free and up to 5 minutes on Paid; streaming supported | Requests plus CPU milliseconds; no charge for wall-clock duration | Small TypeScript servers at the edge, pay-per-use |
| **Vercel Functions** | Stateless; `mcp-handler` v2 in a Next.js route | 300 s on Hobby; 800 s on Pro and Enterprise (1800 s in beta); streaming supported; 4.5 MB request and response bodies | Invocations plus active CPU plus provisioned memory (Fluid Compute) | Teams already deploying a Next.js app on Vercel |
| **AWS Lambda** | Stateless | 15-minute maximum timeout; response streaming on Node.js runtimes through function URLs or API Gateway, up to 200 MB per streamed response | Requests plus GB-seconds, plus a per-GB charge for streamed bytes beyond 6 MB per request | Teams on AWS with existing IAM, VPC, and observability |
| **Google Cloud Run** (or any container platform) | You choose; a container can hold state, but it should not need to | Request timeout 5 minutes by default, up to 60 minutes; streaming supported | vCPU-seconds and GiB-seconds while serving requests, plus requests (request-based billing) | Servers with heavy dependencies or long tool calls; portable containers |
| **Scalar (managed)** | Handled for you | Handled for you | Pro plan at $150 per month and above; usage draws on Agent Scalar credits | Exposing an API you describe with OpenAPI, with no deployment |
| **Speakeasy (managed, formerly Gram)** | Handled for you | Handled for you | Not published; the pricing page lists one tailored Enterprise plan | Enterprises standardizing MCP across many servers |
| **Zuplo (gateway handler)** | Stateless | Handled by the gateway | Zuplo gateway plan | Teams already running their API through Zuplo |

The row that matters most is the first column. Because the current specification has no sessions, the "stateful MCP server" patterns from 2025, which needed sticky routing or Durable Objects, are no longer the default on any platform. Pick the platform you already operate, and keep the server stateless.

## Self-hosting platforms in detail

Every figure below comes from the vendor's own documentation, linked inline, and was read on 7 October 2026.

### Cloudflare Workers

Cloudflare's [remote MCP server guide](https://developers.cloudflare.com/agents/model-context-protocol/guides/remote-mcp-server/) says to use `createMcpHandler` for a new stateless server, and marks the older `McpAgent` class, which backed each server with a Durable Object, as deprecated and feature-frozen, kept only for existing servers while they migrate. The [Workers limits page](https://developers.cloudflare.com/workers/platform/limits/) states there is no hard limit on duration for HTTP-triggered Workers and that a Worker still streaming a response stays active; CPU time per request is 10 ms on the Free plan and up to 5 minutes (default 30 seconds) on Paid. [Pricing](https://developers.cloudflare.com/workers/platform/pricing/) is per request and per CPU millisecond, with no charge for wall-clock time: the Free plan includes 100,000 requests a day, and Paid includes 10 million requests and 30 million CPU milliseconds a month. Because the MCP TypeScript SDK's `createMcpHandler` returns a web-standard `fetch` handler, the same server code runs on Workers without a Node adapter.

### Vercel Functions

Vercel's [deploy guide](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel) uses the `mcp-handler` package (version 2, built on `@modelcontextprotocol/server`) inside a Next.js App Router route, served at `/api/mcp` over Streamable HTTP; version 2 removed the legacy HTTP+SSE transport. The [function limitations page](https://vercel.com/docs/functions/limitations) gives the maximum duration with Fluid Compute as 300 seconds on Hobby and 800 seconds on Pro and Enterprise, with an 1800-second extended maximum in beta, and caps request and response bodies at 4.5 MB. Streaming responses are supported and count toward the duration. [Pricing](https://vercel.com/docs/functions/usage-and-pricing) is per invocation plus active CPU plus provisioned memory; CPU billing pauses while a function waits on I/O, memory billing does not.

### AWS Lambda

The [Lambda quotas page](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html) sets the function timeout at 900 seconds (15 minutes) for synchronous invocations, with synchronous payloads of 6 MB or 200 MB for a streamed response. [Response streaming](https://docs.aws.amazon.com/lambda/latest/dg/configuration-response-streaming.html) is native on the Node.js managed runtimes through function URLs or an API Gateway proxy integration; other languages need a custom runtime or the Lambda Web Adapter, and function URLs do not stream inside a VPC. AWS [recommends function URLs for simple applications and API Gateway for production at scale](https://docs.aws.amazon.com/lambda/latest/dg/furls-http-invoke-decision.html). [Pricing](https://aws.amazon.com/lambda/pricing/) is $0.20 per million requests plus compute in GB-seconds, with a free tier of one million requests and 400,000 GB-seconds a month; streamed responses beyond 6 MB per request cost $0.008 per GB after a 100 GB monthly allowance.

### Google Cloud Run and containers

Cloud Run runs any container. The [request timeout](https://docs.cloud.google.com/run/docs/configuring/request-timeout) defaults to 5 minutes and can be raised to 60 minutes, and [streaming HTTP responses](https://docs.cloud.google.com/run/docs/triggering/https-request) work with no configuration as long as the server sends `Transfer-Encoding: chunked`. With the default [request-based billing](https://docs.cloud.google.com/run/docs/configuring/billing-settings), instances are charged only while they process requests, start, and shut down; [pricing](https://cloud.google.com/run/pricing) is per vCPU-second, per GiB-second, and per million requests, with a monthly free tier. The container below runs unchanged on Cloud Run, AWS App Runner, Fly.io, Railway, or a Kubernetes cluster.

### API gateways with an MCP handler

Some API gateways can serve an MCP endpoint from the routes they already proxy. Zuplo's [MCP Server Handler](https://zuplo.com/docs/handlers/mcp-server) runs a stateless MCP server on the gateway and turns listed OpenAPI operations into tools. If your API already sits behind such a gateway, this is often the shortest path, with the gateway's authentication and rate limiting in front. It ties the MCP server to the gateway vendor, which is the trade-off to weigh.

## A deploy-ready MCP server

This is a minimal Streamable HTTP server on the official TypeScript SDK v2, written to run in a container on any of the platforms above. It validates the `Host` and `Origin` headers (the specification requires `Origin` validation), listens on all interfaces so the platform can route to it, and creates a fresh server per request because the protocol has no sessions. We ran it locally and in Docker on 7 October 2026; the exact versions are at the end of the page.

```bash
mkdir orders-mcp && cd orders-mcp
npm init -y && npm pkg set type=module
npm install @modelcontextprotocol/server @modelcontextprotocol/node zod tsx
```

Save this as `http-server.ts`:

```ts
import { createServer } from 'node:http'
import { hostHeaderValidation, originValidation, toNodeHandler } from '@modelcontextprotocol/node'
import { McpServer, createMcpHandler } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'

// The public hostname(s) this server is reachable at. Set ALLOWED_HOSTS="mcp.example.com" in production.
const allowedHostnames = (process.env.ALLOWED_HOSTS ?? 'localhost,127.0.0.1').split(',')
const port = Number(process.env.PORT ?? 3000)

// A fresh McpServer per request: the 2026-07-28 revision has no protocol sessions,
// so any instance behind a load balancer can answer any request.
const buildServer = (): McpServer => {
  const server = new McpServer({ name: 'orders', version: '1.0.0' })

  server.registerTool(
    'get_order',
    {
      title: 'Get an order',
      description: 'Fetch one order by its ID, for example ord_1001.',
      inputSchema: z.object({ orderId: z.string() }),
      annotations: { readOnlyHint: true },
    },
    async ({ orderId }) => {
      // Credentials for your API come from the environment, never from the model.
      const response = await fetch(`https://api.example.com/orders/${encodeURIComponent(orderId)}`, {
        headers: { Authorization: `Bearer ${process.env.API_TOKEN ?? ''}` },
      })
      return { isError: !response.ok, content: [{ type: 'text', text: await response.text() }] }
    },
  )

  return server
}

// The spec requires Origin validation on HTTP servers to stop DNS rebinding.
// These guards answer bad requests with 403 themselves and return false.
const validateHost = hostHeaderValidation(allowedHostnames)
const validateOrigin = originValidation(allowedHostnames)
const handler = toNodeHandler(createMcpHandler(buildServer))

createServer(async (request, response) => {
  if (request.url !== '/mcp') {
    response.writeHead(404).end()
    return
  }
  if (!validateHost(request, response) || !validateOrigin(request, response)) {
    return
  }
  await handler(request, response)
}).listen(port, '0.0.0.0', () => console.log(`MCP server listening on port ${port} at /mcp`))
```

And this as `Dockerfile`:

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY http-server.ts ./
ENV PORT=3000
EXPOSE 3000
CMD ["npx", "tsx", "http-server.ts"]
```

Build and run it, then list the tools with a request in the 2026-07-28 shape:

```bash
docker build -t orders-mcp .
docker run --rm -p 3000:3000 -e ALLOWED_HOSTS=localhost:3000,localhost orders-mcp
```

```bash
curl -X POST http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: tools/list' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {
      "_meta": {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientInfo": { "name": "curl", "version": "1.0.0" },
        "io.modelcontextprotocol/clientCapabilities": {}
      }
    }
  }'
```

The response is a JSON object listing `get_order`. A request with a foreign `Origin` or `Host` header gets `403`, which is the behaviour the specification requires. On Cloud Run, set `ALLOWED_HOSTS` to the service's hostname; on a platform that terminates TLS and rewrites `Host`, set it to whatever the platform forwards.

Three notes on moving this to other platforms:

- **Cloudflare Workers, Deno, and Bun** do not need `@modelcontextprotocol/node`. `createMcpHandler(buildServer).fetch` is already a web-standard handler; validate `Origin` with the `validateOriginHeader` helper from `@modelcontextprotocol/server` or the platform's own middleware.
- **Vercel** wraps the same idea in `mcp-handler`, per its [deploy guide](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel).
- **Lambda** needs a function URL or API Gateway in front and a small adapter from the Lambda event to a web-standard `Request`.

We tested the container locally and in Docker, not on each platform; treat the platform notes as pointers to the vendors' own guides.

In Python, the official SDK gives you the equivalent in one call: `mcp.run(transport="streamable-http", host="0.0.0.0", port=8000, stateless_http=True)` on an `MCPServer` serves `/mcp` with `Host` and `Origin` validation enabled. [How to build an MCP server](/learn/mcp/build-mcp-server) has a complete Python server.

## What a public MCP server needs before launch

An MCP server on the internet executes actions on behalf of whoever can reach it. Before you share the URL:

1. **Validate `Origin`.** The [Streamable HTTP specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http) says servers MUST validate the `Origin` header and respond `403` to an invalid one, to prevent DNS rebinding. Validate `Host` as well. When running locally, bind to `127.0.0.1`, not `0.0.0.0`.
2. **Serve over HTTPS.** Every platform above terminates TLS for you. Do not expose a plain HTTP port to the internet.
3. **Rate limit.** Agents retry, loop, and fan out in ways people do not. Put a limit at the edge (the platform, a gateway, or a CDN) and a per-user limit in the server.
4. **Add real authorization.** For HTTP servers the specification defines an OAuth 2.1 based flow in which an unauthenticated request gets a `401` with a `WWW-Authenticate` header pointing at the server's protected resource metadata. [MCP OAuth](/learn/mcp/mcp-oauth) walks through it and shows how to add it with the SDK. API keys in a header are acceptable for headless agents and CI; OAuth is the better default for anything a person uses.
5. **Keep upstream credentials server-side.** The server holds its own credential for your API, or forwards one the caller supplied. It never puts a credential in a tool argument or result, and it never forwards the token a client used to authenticate to the MCP server itself; the specification forbids that passthrough.
6. **Expose the fewest tools that do the job.** Read-only by default; confirmation or exclusion for destructive operations.
7. **Log and monitor.** Tool name, caller, duration, and outcome per call. [MCP server security](/learn/mcp/mcp-server-security) covers the threat model.
8. **Test with a real client.** Add the server to Claude Code or VS Code, complete the sign-in, and trigger a tool call. Web-based hosts such as claude.ai require the server to be [reachable from the public internet](https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp); a server behind a VPN will look intermittently broken.

## Hosting an MCP server with Scalar

Scalar hosts MCP servers for you, built from the OpenAPI documents you already publish, so there is no server code to write, deploy, patch, or scale. The workflow, from the [MCP servers guide](/products/agent/mcp):

<scalar-steps>
<scalar-step title="Upload your OpenAPI document">

In the [Scalar Dashboard](https://dashboard.scalar.com), create an MCP server and select your API. Scalar parses and indexes the document.

</scalar-step>
<scalar-step title="Choose what agents may do">

For each operation, choose **search** (lookup only, no request is sent to your API) or **execute** (real, authenticated requests). Leave everything else out.

</scalar-step>
<scalar-step title="Configure authentication to your API">

Store one credential on the installation (global auth), let each caller supply their own through a header you nominate, which Scalar forwards without storing (passthrough), or have callers sign in with your API's own OAuth authorization server (OAuth passthrough). Agents never receive a stored credential.

</scalar-step>
<scalar-step title="Share the installation URL">

The server runs at `https://mcp.scalar.com/mcp/YOUR_INSTALL_ID`. Installations are private by default: your team connects with a Personal Access Token, and people outside your team sign in with OAuth once you grant them access.

</scalar-step>
</scalar-steps>

From Claude Code:

```bash
claude mcp add \
  YOUR_MCP_SERVER_NAME \
  https://mcp.scalar.com/mcp/YOUR_MCP_SERVER_ID \
  --header "Authorization: YOUR_PERSONAL_ACCESS_TOKEN" \
  --transport http
```

How it relates to the checklist above: Scalar serves the endpoint over HTTPS, answers unauthenticated requests with a standard `401` and a `resource_metadata` pointer, runs the OAuth flow, keeps upstream credentials off the client, and exposes a small fixed set of tools rather than one per endpoint. That last point is the main design difference from generated servers. The server has three tools: summarize the available API descriptions, search operations, and execute a request. In Scalar's own benchmark on its own product against the Zoom Meetings API, a one-tool-per-endpoint server needed 183 tools and about 89,000 schema tokens, against about 400 tokens for Scalar's three tools. Treat that as one data point from an interested party, but the shape holds for any large API: a fixed tool surface does not grow with the document.

Scalar also serves a separate Docs MCP at `your-docs-domain/mcp` that searches published documentation. It is a different endpoint from the hosted API MCP server described here and does not call your API.

Hosted MCP servers are included on the Pro plan ($150 per month, or $125 per month billed yearly) and above, and are not included on the Free plan. Usage draws on Agent Scalar credits, with 500 credits a month on Pro and 2,000 on Business, where one credit covers 200 MCP tool calls. These figures are from the [pricing page](/pricing) as of 7 October 2026; check it before you decide.

## When not to pick Scalar

- **The server must run inside your own network.** Scalar runs the server at `mcp.scalar.com`. If policy requires the MCP endpoint in your VPC, deploy generated code or the SDK server above yourself.
- **You need a custom domain for the MCP endpoint.** Custom domains are [not supported for MCP servers yet](/products/agent/authentication/customer-access); the URL is always on `mcp.scalar.com`.
- **Your tools are not API operations.** If a tool reads local files, drives a browser, or combines several calls with its own logic, write it with the SDK and host it yourself.
- **You want free hosting.** Hosted MCP is not on the Free plan. Cloudflare Workers, Vercel Hobby, AWS Lambda, and Cloud Run all have free tiers large enough for a prototype, and the container above runs on any of them.
- **You do not have an OpenAPI document.** Scalar's server is built from one. You can write a document first, which also gives you docs and SDKs, or start from the SDK.

For a wider comparison of hosted and generated options, see [best MCP server generators (2026)](/library/best-mcp-server-generators-2026).

## Frequently asked questions

<scalar-detail title="How do I host a remote MCP server?">
Serve it over Streamable HTTP at an HTTPS URL. Write the server with an official SDK (the TypeScript SDK's createMcpHandler or the Python SDK's streamable-http transport), make sure it validates the Origin header, and deploy it as a stateless HTTP service on Cloudflare Workers, Vercel, AWS Lambda, Cloud Run, or any container platform. Then add authorization and share the URL. If the server exposes an OpenAPI-described API, a managed host can do all of this from the document.
</scalar-detail>

<scalar-detail title="What is the easiest way to host an MCP server without managing infrastructure?">
Use a managed host. Scalar builds and serves the MCP server from your OpenAPI document at mcp.scalar.com, with OAuth, credential storage, and per-operation control, and nothing to deploy. Speakeasy offers a similar hosted service for enterprises, and some API gateways such as Zuplo can serve an MCP endpoint from the routes they already proxy. If your tools are not API operations, the next easiest option is a single container on Cloud Run or a Worker on Cloudflare.
</scalar-detail>

<scalar-detail title="Can I host an MCP server for free?">
Yes, for a prototype. Cloudflare Workers Free includes 100,000 requests a day, Vercel Hobby and AWS Lambda have monthly free allowances, and Cloud Run has a free tier. Managed hosting on Scalar starts on the Pro plan. Figures are from the vendors' pricing pages on 7 October 2026.
</scalar-detail>

<scalar-detail title="Does a hosted MCP server need to be stateless?">
It should be. The 2026-07-28 revision removed protocol sessions, so a server that keeps per-session state in memory is working against the specification and will break behind a load balancer. Create a fresh server per request and keep any state in a database.
</scalar-detail>

<scalar-detail title="Do I need Cloudflare Durable Objects to host an MCP server?">
No. Cloudflare's own documentation now recommends createMcpHandler for new servers and marks the Durable Object based McpAgent class as deprecated. Stateless servers do not need them.
</scalar-detail>

<scalar-detail title="Can I use a custom domain for a Scalar-hosted MCP server?">
Not yet. Scalar-hosted MCP servers are always served from mcp.scalar.com. If a custom domain is a requirement, self-host.
</scalar-detail>

## Related

- **Learn:** [Remote MCP servers](/learn/mcp/remote-mcp-servers) · [MCP OAuth](/learn/mcp/mcp-oauth) · [How to build an MCP server](/learn/mcp/build-mcp-server) · [MCP server security](/learn/mcp/mcp-server-security)
- **Docs:** [MCP servers](/products/agent/mcp) · [MCP authentication](/products/agent/authentication)
- **Product:** [Scalar MCP](/products/agent/mcp) — hosted MCP servers from your OpenAPI document, with OAuth built in and nothing to deploy

---

*Specification details refer to MCP revision 2026-07-28. Platform limits and prices were read from Cloudflare, Vercel, AWS, Google Cloud, Zuplo, Speakeasy, and Scalar documentation and pricing pages on 7 October 2026 and are linked inline. The container on this page was run on that date with @modelcontextprotocol/server 2.3.1, @modelcontextprotocol/node 2.1.1, zod 4.6.5, tsx 4.23.15, and Node.js 24.21.0, locally and in Docker. Scalar wrote this guide and sells managed MCP hosting, so read the Scalar sections with that in mind. If something is wrong or out of date, [open an issue](https://github.com/scalar/scalar/issues).*
