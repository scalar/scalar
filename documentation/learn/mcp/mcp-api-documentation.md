# MCP API documentation: documenting MCP servers and writing docs agents can read

*Last updated: September 2026*

MCP API documentation covers two related jobs: documenting an MCP server so that both people and models know what its tools do and how to connect to it, and publishing your ordinary API documentation in forms that AI agents can read directly, such as `llms.txt`, a Markdown version of every page, and a docs MCP server. The first job is about the server you ship. The second is about everything else an agent needs to use your API well.

They belong together because the same agent often uses both. A developer asks Claude Code to add your API to their app. The agent reads your docs to understand the concepts, calls your MCP server to try things out, then writes code against your SDK. Each of those steps depends on documentation that was written with a model as one of the readers.

**On this page**

- [Two readers, three surfaces](#two-readers-three-surfaces)
- [Documenting the tools themselves](#documenting-the-tools-themselves)
- [Server instructions](#server-instructions)
- [Starting from OpenAPI](#starting-from-openapi)
- [The human-facing page for your MCP server](#the-human-facing-page-for-your-mcp-server)
- [Making your API docs agent-readable](#making-your-api-docs-agent-readable)
- [Which surface does what](#which-surface-does-what)
- [Keeping documentation and server in sync](#keeping-documentation-and-server-in-sync)
- [Testing documentation with an agent](#testing-documentation-with-an-agent)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## Two readers, three surfaces

An MCP server has two kinds of reader.

**People** decide whether to connect it and how. They need the server URL, the authentication method, which clients are supported, what data it can touch, and how to install it. They read a web page.

**Models** decide, turn by turn, which tool to call and with which arguments. They never see your web page unless someone pastes it in. They read what the protocol gives them: the server's instructions, and each tool's name, description, input schema and output schema. [What is MCP](/learn/mcp/what-is-mcp) describes those primitives.

On top of that sits a third surface that is not specific to MCP at all: your API reference and guides. Agents increasingly read these directly, fetching `llms.txt`, Markdown pages or a docs search tool, so the documentation you already have is part of your agent experience whether you planned it or not.

The rest of this guide takes those surfaces one at a time.

## Documenting the tools themselves

Tool metadata is the documentation that matters most, because it is the only documentation a model is guaranteed to read. The [tools specification](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) defines the fields:

- `name`: the identifier the model calls. 1 to 128 characters of letters, digits, underscores, hyphens and dots.
- `title`: an optional human-readable label for client interfaces.
- `description`: free text telling the model what the tool does.
- `inputSchema`: a JSON Schema (2020-12 by default) for the arguments.
- `outputSchema`: an optional JSON Schema for structured results.
- `annotations`: optional hints such as `readOnlyHint` and `destructiveHint`.

A useful description answers three questions in this order: **when to use the tool**, **what comes back**, and **what the limits are**. Here is one we would be happy to ship:

```json
{
  "name": "search_invoices",
  "title": "Search invoices",
  "description": "Search a customer's invoices by status and date range. Use this to answer questions about unpaid, overdue or recent invoices; use get_invoice when you already have an invoice ID. Returns up to 25 invoices per call, newest first, with id, number, status, total and due_date. Pass next_cursor from the previous result to get more. Amounts are in the smallest currency unit (cents for USD).",
  "inputSchema": {
    "type": "object",
    "properties": {
      "customer_id": { "type": "string", "description": "Customer ID, for example cus_4821" },
      "status": { "type": "string", "enum": ["draft", "open", "paid", "overdue", "void"] },
      "due_after": { "type": "string", "format": "date", "description": "Only invoices due on or after this date, YYYY-MM-DD" },
      "next_cursor": { "type": "string", "description": "Opaque cursor from a previous call" }
    },
    "required": ["customer_id"],
    "additionalProperties": false
  },
  "annotations": { "readOnlyHint": true }
}
```

A few details in that example are deliberate:

- **It names its neighbour.** Telling the model when to use `get_invoice` instead prevents the most common mistake in servers with similar tools.
- **It states units.** Models guess wrong about cents versus dollars more often than you would like.
- **It explains paging in one sentence.** Otherwise the model either stops after 25 results or invents a page parameter.
- **Every parameter has a description or an enum.** A bare `"type": "string"` leaves the model to guess the format.

Length has limits. Claude Code [truncates each tool description and each server's instructions at 2,048 characters by default](https://code.claude.com/docs/en/mcp), and every character you add is paid for in context on every turn in clients that load definitions up front. Put the critical sentence first and cut anything a model does not need to choose correctly.

The same guide applies to errors. A tool result with `isError: true` is documentation delivered at the moment the model needs it. "No invoice with that ID; call search_invoices to find one" teaches the model more than any description could.

## Server instructions

Besides per-tool descriptions, a server can send general instructions that a client may show to the model. This is the place for guidance that spans tools: which tool to start with, how IDs relate to each other, rate limits the model should respect, and what the server is not for.

Instructions have become more important as clients defer tool loading. With tool search, which Claude Code enables by default, only tool names and server instructions load at the start of a session, and the [Claude Code documentation](https://code.claude.com/docs/en/mcp) asks server authors to use instructions to explain what category of tasks the tools handle and when the model should search for them. If your instructions are empty, the model has only your tool names to go on.

Keep them short and factual:

```text
Tools for the Acme Billing API. Use them for questions about customers,
invoices and payments in the user's Acme account. Start with search_customers
to resolve a name to a customer ID. All amounts are in cents. Read-only tools
are safe to call freely; tools that create or change records require the user
to confirm first.
```

## Starting from OpenAPI

If your server is built from an OpenAPI document, most tool documentation comes from fields you already have. [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server) walks through the full mapping; for documentation purposes the important parts are:

- `operationId` becomes the tool name, so make it a clear verb-noun pair.
- `summary` and `description` become the tool description.
- Parameter and schema `description`, `enum`, `format`, `example` and `examples` become the input schema's guidance.
- Response schemas can become an output schema.

That means improving your OpenAPI descriptions improves your MCP server, your [API reference](/learn/openapi/what-is-an-api-reference) and your SDK docs at the same time. A description written for both humans and models usually looks like this:

```yaml
openapi: 3.1.0
info:
  title: Acme Billing API
  version: 1.0.0
paths:
  /customers/{customer_id}/invoices:
    get:
      operationId: searchInvoices
      summary: Search a customer's invoices
      description: >-
        Returns up to 25 invoices per page, newest first. Use get_invoice when
        you already have an invoice ID. Amounts are in the smallest currency
        unit (cents for USD).
      parameters:
        - name: customer_id
          in: path
          required: true
          description: Customer ID, for example cus_4821
          schema:
            type: string
        - name: status
          in: query
          schema:
            type: string
            enum: [draft, open, paid, overdue, void]
      responses:
        '200':
          description: A page of invoices
```

Human readers lose nothing from that style. It is shorter and more concrete than most reference prose. If you need more for people (tutorials, background, diagrams), put it in guides rather than stuffing it into the operation description that a model reads on every call. [API documentation best practices](/learn/openapi/api-documentation-best-practices) covers the rest of the reference, and linting with [Spectral rules](/learn/openapi/spectral-rules) can enforce that every operation has an `operationId`, a summary and described parameters.

## The human-facing page for your MCP server

The web page for your MCP server is short, but it gets skipped surprisingly often. A good one covers:

1. **What it is for**, in one paragraph, including what it cannot do.
2. **The server URL** and transport (almost always Streamable HTTP for a hosted server).
3. **Authentication**: OAuth sign-in, an API key in a header, or both, and which scopes it requests.
4. **Install snippets** for the clients your users actually use. [Connect an MCP server to Claude](/learn/mcp/connect-mcp-server-to-claude) and [MCP server configuration](/learn/mcp/mcp-server-configuration) have tested formats you can adapt.
5. **The tool list**: name, one-line purpose, and whether each one reads or writes.
6. **Limits**: rate limits, result sizes, and data retention.
7. **A changelog**, because a changed tool description changes behaviour for every connected user.

A minimal install section in Markdown:

````markdown
## Connect

Server URL: `https://mcp.example.com/mcp` (Streamable HTTP, OAuth sign-in)

**Claude Code**

```bash
claude mcp add --transport http acme https://mcp.example.com/mcp
```

Then run `/mcp` in Claude Code and choose **Authenticate**.

**Cursor** (`.cursor/mcp.json`)

```json
{ "mcpServers": { "acme": { "url": "https://mcp.example.com/mcp" } } }
```
````

## Making your API docs agent-readable

The second half of the job is your existing documentation. Four formats help agents most.

**llms.txt.** A Markdown file at the root of your site that lists your important pages with one-line descriptions, following the convention proposed at [llmstxt.org](https://llmstxt.org). An agent that fetches it gets a map of your docs in a few thousand tokens instead of crawling HTML. Treat it as a convenience for tools and agents that look for it, not as a search ranking signal. [llms.txt for API docs](/learn/openapi/llms-txt-for-api-docs) goes into format and examples.

**llms-full.txt.** The companion file: the full text of your docs in one Markdown document. Useful when a user wants to drop your whole documentation into a project's context.

**Markdown twins.** A clean Markdown version of every page at a predictable URL. HTML pages carry navigation, scripts and styling that waste tokens and confuse extraction; Markdown carries only content. On scalar.com, for example, appending `.md` to a page URL returns `text/markdown`: `https://scalar.com/products/agent/mcp.md` returns the MCP guide as plain Markdown (we checked on 26 September 2026).

**A docs MCP server.** An MCP server whose tools search and read your documentation, so an agent can look things up mid-task without the user pasting links. Scalar's documentation has one at `https://scalar.com/mcp`. It exposes a single `search-documentation` tool that takes a `question` and returns matching page content with titles and URLs. You can try it with the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector --cli https://scalar.com/mcp \
  --transport http --method tools/call \
  --tool-name search-documentation --tool-arg question="passthrough auth"
```

A docs MCP server and an API MCP server are different things. The first answers questions about your API; the second calls it. Scalar's [MCP guide](/products/agent/mcp) draws the same line between its Docs MCP and Installation MCP.

## Which surface does what

| Surface | What it contains | Who reads it | When it helps most | In Scalar |
| --- | --- | --- | --- | --- |
| Tool name, description and schema | Per-tool purpose, arguments, output | The model, every turn | Choosing and calling tools correctly | Taken from your OpenAPI operations |
| Server instructions | Guidance that spans tools | The model, at session start | Clients that defer tool loading | Depends on the server |
| MCP server web page | URL, auth, install snippets, tool list, limits | People deciding to connect | Adoption and support | Written in Scalar Docs |
| `llms.txt` | Index of pages with descriptions | Agents and tools that fetch it | Orienting an agent in large docs | [Generated automatically](/products/docs/configuration/llms-txt) |
| `llms-full.txt` | Full text of all pages | Agents loading everything | Small to medium doc sites | Generated automatically |
| Markdown twins | One clean Markdown file per page | Agents fetching a specific page | Deep links from search or llms.txt | Served at the page URL plus `.md` |
| Docs MCP | Search tool over your docs | Agents mid-task | Answering questions without leaving the client | At `/mcp` on your docs domain, via [Ask AI](/products/docs/configuration/ask-ai) |
| API reference | Every operation from OpenAPI | People and agents | Exact parameters and responses | [Scalar API reference](/products/api-references) |

## Keeping documentation and server in sync

The fastest way for agent documentation to go wrong is for it to describe a different API from the one the server calls. A renamed parameter in the API, an old description in the server, and suddenly the model is sending a field that no longer exists.

Three habits prevent most drift:

- **One source.** Generate tool definitions, the API reference and SDK docs from the same OpenAPI document. Edit the document, not the outputs.
- **Checks in CI.** Lint the document on every pull request, and snapshot the server's `tools/list` output so a changed description shows up in review. [How to test MCP servers](/learn/mcp/test-mcp-servers) shows how to script that with the Inspector CLI.
- **Visible changes.** Keep a changelog for the MCP server that notes description changes, not just new tools.

In Scalar, one OpenAPI document (kept in sync through the [Registry](/products/registry) if you like) can feed the API reference, the docs site and the hosted MCP server, so a change to the document reaches all three.

## Testing documentation with an agent

You would not ship an API reference without reading it. Do the same with agent documentation, using an agent as the reader.

1. Write ten realistic tasks a user might give an assistant, in the user's words ("which invoices for Globex are overdue?").
2. Connect your server to one or two clients and run each task in a fresh session.
3. Record which tool the model chose first, whether the arguments were valid, and whether the answer was right.
4. For every miss, ask why. Usually it is a description that did not say when to use the tool, two tools with overlapping purposes, or a parameter without a format.
5. Fix the description, not the prompt, and run the set again.

The same exercise works for docs: ask an agent to answer a question using only your `llms.txt` and Markdown pages, and see where it gets lost.

## Common mistakes

- **Copying long reference prose into tool descriptions.** Models need when, what and limits. Put tutorials in guides.
- **Similar tools with no guidance on which to use.** Name the neighbour in each description.
- **Undocumented units and formats.** Say cents, UTC and `YYYY-MM-DD` explicitly.
- **Empty server instructions.** With deferred loading, instructions may be all the model sees at first.
- **No human page for the server.** Users cannot connect what they cannot find, and support ends up answering the same install questions.
- **HTML-only docs.** Provide `llms.txt` and Markdown so agents do not have to scrape.
- **Treating the docs MCP and the API MCP as one.** One answers questions, the other takes actions, and they need different access controls.

## Frequently asked questions

<scalar-detail title="What is MCP API documentation?">
It is documentation written for the Model Context Protocol world: the names, descriptions and schemas of an MCP server's tools, the web page that tells people how to connect the server, and versions of your API docs that agents can read directly, such as llms.txt, Markdown pages and a docs MCP server.
</scalar-detail>

<scalar-detail title="How long should an MCP tool description be?">
Long enough to say when to use the tool, what it returns and what its limits are, which is usually two to four sentences. Put the most important sentence first. Claude Code truncates descriptions at 2,048 characters by default, and every word costs context in clients that load all definitions up front.
</scalar-detail>

<scalar-detail title="Can I generate MCP tool documentation from OpenAPI?">
Yes. The operationId becomes the tool name, the summary and description become the tool description, and parameter descriptions, enums and formats become the input schema. Improving those fields in your OpenAPI document improves the MCP server, the API reference and the SDK documentation together.
</scalar-detail>

<scalar-detail title="What is the difference between llms.txt and a docs MCP server?">
llms.txt is a static Markdown index of your pages that an agent fetches once. A docs MCP server is a live service with tools, typically a search tool, that an agent calls during a task to find specific answers. Many sites offer both.
</scalar-detail>

<scalar-detail title="Does Scalar generate llms.txt and Markdown versions of docs pages?">
Yes. Every published Scalar Docs site serves llms.txt and llms-full.txt automatically, and pages are available as Markdown by adding .md to the URL. Scalar Docs sites also expose a docs MCP server at /mcp on the docs domain.
</scalar-detail>

## Related

- **Learn:** [llms.txt for API docs](/learn/openapi/llms-txt-for-api-docs) · [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server) · [REST API to MCP server](/learn/mcp/rest-api-to-mcp-server) · [OpenAPI documentation](/learn/openapi/openapi-documentation)
- **Docs:** [llms.txt](/products/docs/configuration/llms-txt) · [Ask AI and docs MCP](/products/docs/configuration/ask-ai)
- **Product:** [Scalar Docs](/products/docs) — API reference, guides, llms.txt, Markdown pages and a docs MCP server from one OpenAPI document

*Specification details refer to MCP revision 2026-07-28. The scalar.com Markdown and docs MCP responses were checked on 26 September 2026. Tool names and fields in the invoice examples are illustrative.*
