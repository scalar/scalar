# Best MCP server generators (2026)

*Last updated: September 2026*

An MCP server generator takes an API description, usually an OpenAPI document, and produces a Model Context Protocol server that exposes your endpoints as tools an AI agent can call, and the options worth evaluating in September 2026 are Scalar, Speakeasy (Gram and its open-source generator), FastMCP, openapi-mcp-generator, the AWS Labs OpenAPI MCP server, Bump.sh, and liblab.

If you searched for "MCP server generator" you may have landed on a Stainless page first. That page is still live and still invites you to sign up, but Stainless [announced in May 2026](https://www.stainless.com/blog/stainless-is-joining-anthropic/) that it is joining Anthropic, winding down its hosted products, and closing new signups. This page is meant to be the current answer instead.

It is written by Scalar, which hosts MCP servers and is on this list. Every claim about another tool links to its own documentation or repository, checked on 26 September 2026. New to the protocol? Start with [what is MCP](/learn/mcp/what-is-mcp).

## Three shapes of MCP server generator

The tools below do not all do the same job. Before comparing features, decide which shape you want.

1. **Hosted.** You upload or connect an OpenAPI document, pick the tools, and the vendor runs the server at a URL. No deployment, but your server runs on someone else's infrastructure. Scalar, Speakeasy Gram, and Bump.sh work this way.
2. **Generated code.** The tool writes an MCP server project you own, build, and deploy yourself (Docker, Cloudflare Workers, a desktop extension). Full control, and full operational responsibility. Speakeasy's open-source generator and openapi-mcp-generator work this way.
3. **Runtime conversion.** A library or process reads the OpenAPI document at startup and creates tools on the fly, with no code generation step. FastMCP's `from_openapi` and the AWS Labs server work this way.

One caution applies to all three. The FastMCP documentation says plainly that "LLMs achieve significantly better performance with well-designed and curated MCP servers than with auto-converted OpenAPI servers", and recommends auto-conversion for bootstrapping and prototyping ([FastMCP docs](https://gofastmcp.com/integrations/openapi)). We agree. Whatever you pick, expose a curated subset of operations with good descriptions rather than every endpoint in the document. We go deeper in [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server).

## Comparison table

| Tool | Shape | Licence | Auth to your API | Pricing |
| --- | --- | --- | --- | --- |
| Scalar | Hosted | Closed service (docs stack is MIT) | Stored credential or per-user passthrough; OAuth for people connecting | Pro and up; usage in Agent Scalar credits ([pricing](/pricing)) |
| Speakeasy Gram | Hosted | [AGPL-3.0 repo](https://github.com/speakeasy-api/gram) | Optional OAuth 2.1 proxy with DCR | Not published |
| Speakeasy generator | Generated code (TypeScript) | [AGPL-3.0](https://github.com/speakeasy-api/openapi-generation) | Configured in generated code | Free under AGPL; commercial licence available |
| FastMCP | Runtime conversion (Python) | [Apache-2.0](https://github.com/PrefectHQ/fastmcp) | Your HTTP client | Free |
| openapi-mcp-generator | Generated code (TypeScript) | [MIT](https://github.com/harsha-iiiv/openapi-mcp-generator) | API key, bearer, basic, OAuth2 | Free |
| AWS Labs OpenAPI MCP server | Runtime conversion (Python) | [Apache-2.0](https://github.com/awslabs/mcp/tree/main/src/openapi-mcp-server) | Bearer, basic, API key via env vars | Free |
| Bump.sh | Hosted, workflow-based | Closed | Hosted data plane | From $50/month, 5 MCP tools ([pricing](https://bump.sh/pricing)) |
| liblab | MCP generator | Closed | Not documented on pricing page | 100 calls/month free for the first year, then $5 per 100 calls ([pricing](https://liblab.com/pricing)) |
| Stainless | Generated code | Closed | n/a | Closed to new signups |

## 1. Scalar

**What it is.** Hosted MCP servers generated from the OpenAPI documents you already publish with Scalar. You choose which operations become tools and set each one to **Search** (lookup only, no request sent) or **Execute** (real, authenticated requests). The server runs at `mcp.scalar.com`, private by default. Team members connect with a Personal Access Token; people outside your team sign in with OAuth, which has been available since March 2026. Scalar also exposes a separate docs MCP at `your-docs-domain/mcp` for searching published documentation. Details in the [MCP servers guide](/products/agent/mcp).

Connecting from Claude Code looks like this:

```bash
claude mcp add \
  YOUR_MCP_SERVER_NAME \
  https://mcp.scalar.com/mcp/YOUR_MCP_SERVER_ID \
  --header "Authorization: YOUR_PERSONAL_ACCESS_TOKEN" \
  --transport http
```

**Auth to your API.** Either one stored credential on the installation (OAuth, API key, or bearer token), so the AI client never sees it, or passthrough, where each caller supplies their own key and Scalar forwards it without storing it.

**Pricing.** Hosted MCP servers are on Pro ($150 per month) and above. Usage draws on Agent Scalar credits: 500 a month on Pro and 2,000 on Business, where one credit covers 200 MCP tool calls ([pricing](/pricing)).

**Best for.** Teams who do not want to operate another service, and who want tool selection and credentials managed next to the API description the tools come from, alongside docs and SDKs from the same document.

**Watch out for.** These are hosted servers, not code you deploy. If the server must run inside your own network, pick a generated-code or runtime option below.

## 2. Speakeasy: Gram and the open-source generator

**Disclosure.** Scalar and Speakeasy work together; Speakeasy's [API reference](https://www.speakeasy.com/docs/ai-control-plane/reference/api-reference) is rendered by Scalar. We are not neutral about them.

Speakeasy offers two different things, and they are easy to confuse.

**Gram (hosted).** Gram is Speakeasy's managed MCP platform, now part of what it calls the AI control plane. You [upload an OpenAPI document](https://www.speakeasy.com/docs/mcp/build/toolsets/create-default-toolset) and Gram generates a hosted server from it, or you write tools in TypeScript with [Gram Functions](https://www.speakeasy.com/blog/release-gram-functions). Gram's [source](https://github.com/speakeasy-api/gram) is public under AGPL-3.0. Speakeasy's [pricing page](https://www.speakeasy.com/pricing) lists a single "Tailored" enterprise plan.

**The generator (code).** Speakeasy's MCP server generator produces a TypeScript server you deploy yourself, with [Cloudflare Workers configuration and Anthropic desktop extension (.dxt) output](https://www.speakeasy.com/docs/standalone-mcp/overview), and tool names, descriptions, and scoping controlled through OpenAPI extensions. On 17 September 2026 it was [released under AGPL-3.0](https://www.speakeasy.com/blog/partnering-with-google) together with Speakeasy's SDK generators.

**Best for.** Enterprises that want MCP governance across many servers (Gram), or teams that want generated MCP code they own and can deploy anywhere (the generator).

**Watch out for.** No published price for Gram. AGPL obligations apply if you modify and host the open-source code. See [Scalar vs Speakeasy](/resources/compare/speakeasy).

## 3. FastMCP

**What it is.** A widely used Python framework for building MCP servers, maintained under [PrefectHQ](https://github.com/PrefectHQ/fastmcp) with about 27,900 GitHub stars. `FastMCP.from_openapi()` turns every endpoint in an OpenAPI document into a tool by default, at runtime.

```python
import httpx
from fastmcp import FastMCP

client = httpx.AsyncClient(base_url="https://api.example.com")
openapi_spec = httpx.get("https://api.example.com/openapi.json").json()

mcp = FastMCP.from_openapi(
    openapi_spec=openapi_spec,
    client=client,
    name="Example API",
)

if __name__ == "__main__":
    mcp.run()
```

**Pricing.** Free, Apache-2.0.

**Best for.** Python teams prototyping an MCP server quickly, then hand-curating it into something better. The same framework takes you from auto-converted to hand-written tools.

**Watch out for.** FastMCP's own docs recommend against mirroring a whole API this way in production. You host and secure it yourself.

## 4. openapi-mcp-generator

**What it is.** A community CLI that generates a TypeScript MCP server project from an OpenAPI 3.0+ document, with Zod validation and support for stdio, SSE, StreamableHTTP, and Cloudflare Worker transports ([repository](https://github.com/harsha-iiiv/openapi-mcp-generator), MIT, about 640 stars).

```bash
npm install -g openapi-mcp-generator
openapi-mcp-generator --input path/to/openapi.json --output path/to/output/dir
```

**Pricing.** Free.

**Best for.** TypeScript teams who want a generated starting point with no vendor involved.

**Watch out for.** It is a community project; review the generated code and plan who maintains it as your API changes.

## 5. AWS Labs OpenAPI MCP server

**What it is.** Part of the [awslabs/mcp](https://github.com/awslabs/mcp) collection. The [OpenAPI MCP server](https://github.com/awslabs/mcp/tree/main/src/openapi-mcp-server) reads an OpenAPI document at startup and creates tools dynamically, configured through environment variables or arguments, with tag-based include and exclude filters.

```bash
awslabs.openapi-mcp-server \
  --api-name petstore \
  --api-url https://petstore3.swagger.io/api/v3 \
  --spec-url https://petstore3.swagger.io/api/v3/openapi.json
```

**Pricing.** Free, Apache-2.0.

**Best for.** Teams on AWS who want a runtime proxy they can run locally or in their own account, with no generation step.

**Watch out for.** You run it; tool quality depends entirely on the operation descriptions already in your document.

## 6. Bump.sh

**What it is.** A hosted API docs platform that now [generates hosted MCP servers](https://docs.bump.sh/help/mcp-servers/) from workflow definitions written in Arazzo or Bump.sh's own Flower format. Each tool runs a defined sequence of API calls, which makes behaviour deterministic.

**Pricing.** Basic is $50 per month with 5 MCP tools, Pro $120 per month with 50 MCP tools and private MCP servers ([pricing](https://bump.sh/pricing)).

**Best for.** Teams who want agents to run multi-step workflows rather than call raw endpoints one at a time.

**Watch out for.** This is workflow-first, not a direct one-tool-per-operation conversion of your OpenAPI document. You write the workflows.

## 7. liblab

**What it is.** A commercial SDK generator that also sells an MCP generator.

**Pricing.** The [pricing page](https://liblab.com/pricing) lists 100 free MCP calls per month, for the first year only, then $5 per 100 calls.

**Best for.** Teams already using liblab for SDKs.

**Watch out for.** Per-call pricing on the pricing page; model your expected agent traffic before committing. We could not confirm from liblab's public docs whether the server is hosted or generated code, so ask.

## Stainless (winding down)

Stainless [generated MCP servers as code](https://www.stainless.com/docs/mcp/) alongside its SDKs. Its [announcement](https://www.stainless.com/blog/stainless-is-joining-anthropic/) says all hosted products are winding down and new signups, projects, and SDKs are closed, although its [MCP server generator page](https://www.stainless.com/mcp/mcp-server-generator) still carries a signup button. Existing MCP code you generated is yours. See the [Stainless wind-down guide](/resources/stainless-wind-down) and [Stainless alternatives](/alternatives/stainless).

## Not a generator: docs MCP servers

Several docs platforms, including Mintlify, Fern, and Scalar, offer an MCP server that searches your documentation. That is useful, but it is a different thing. Mintlify's server, for example, [provides search, docs filesystem, and feedback tools](https://www.mintlify.com/docs/ai/model-context-protocol); it does not call your API endpoints. If you want agents to take actions through your API, you need one of the tools above.

## When to pick something other than Scalar

- **The server must run inside your own network or VPC.** Use generated code (Speakeasy's generator, openapi-mcp-generator) or a runtime server (AWS Labs, FastMCP).
- **You want to hand-write and curate tools in Python.** FastMCP.
- **You want deterministic, multi-step workflows as tools.** Bump.sh.
- **You need governance across many MCP servers from many vendors.** That is the problem Speakeasy is positioning Gram against.
- **You are on the Free plan and only need a prototype.** One of the free open-source options costs nothing.

## Frequently asked questions

<scalar-detail title="Can I generate an MCP server from an OpenAPI document?">
Yes. Hosted services (Scalar, Speakeasy Gram) take the document and give you a server URL. Code generators (Speakeasy's open-source generator, openapi-mcp-generator) write a project you deploy. Runtime libraries (FastMCP, AWS Labs) read the document at startup. See [generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi).
</scalar-detail>

<scalar-detail title="Is Stainless still an MCP server generator option?">
Not for new users. Stainless announced on 18 May 2026 that it is joining Anthropic, winding down its hosted products, and closing new signups. Its marketing pages are still online, but you cannot start a new project.
</scalar-detail>

<scalar-detail title="Should I expose every endpoint as an MCP tool?">
Usually not. Agents choose tools better from a smaller, well-described set. FastMCP's documentation recommends curated servers over auto-converted ones. Scalar lets you set each operation to search-only or execute, or leave it out entirely.
</scalar-detail>

<scalar-detail title="What is the difference between a hosted and a self-hosted MCP server?">
A hosted server runs on the vendor's infrastructure at a URL, and the vendor handles uptime, OAuth, and credential storage. A self-hosted server is code or a process you run, which gives you control over where credentials live and full operational responsibility. See [remote MCP servers](/learn/mcp/remote-mcp-servers).
</scalar-detail>

<scalar-detail title="How do MCP servers authenticate to my API?">
Either the server holds one credential and uses it for every call, or each user passes their own credential through. Separately, the people or agents connecting to the MCP server need to authenticate to it, which is where OAuth comes in. We explain both layers in [MCP OAuth](/learn/mcp/mcp-oauth).
</scalar-detail>

## Related

- **Learn:** [What is MCP?](/learn/mcp/what-is-mcp) · [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server)
- **Docs:** [MCP servers guide](/products/agent/mcp)
- **Product:** [Scalar MCP](/products/agent/mcp) — hosted MCP servers from your OpenAPI document, with per-tool control and OAuth

---

*Tool status, licences, and prices are taken from each vendor's public announcements, pricing pages, documentation, and GitHub repositories as of 26 September 2026, and are linked inline. GitHub star counts were read the same day. This page is written by Scalar, which hosts MCP servers and has a working relationship with Speakeasy. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
