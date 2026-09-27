# How to test MCP servers: Inspector, unit tests, CI and evals

*Last updated: September 2026*

*By Marc Laventure · Reviewed by: pending*

Testing an MCP server means checking three things: that it speaks the protocol correctly, so any client can list and call its tools; that each tool does the right thing with valid and invalid input; and that a real model, given a realistic task, picks the right tool with the right arguments. The first two are ordinary software testing with a new tool or two. The third is new, and it is the one that decides whether users find your server useful.

This guide works through all three with commands and code we ran on 26 September 2026: the MCP Inspector in its web and CLI modes, unit tests with the official TypeScript SDK's in-memory transport, a CI job that catches schema and definition changes, and a lightweight approach to evals. It ends with a debugging section for the failures you are most likely to hit.

**On this page**

- [What to test, and with what](#what-to-test-and-with-what)
- [A note on protocol versions](#a-note-on-protocol-versions)
- [Explore a server with the MCP Inspector](#explore-a-server-with-the-mcp-inspector)
- [Script checks with the Inspector CLI](#script-checks-with-the-inspector-cli)
- [Unit tests with an in-memory transport](#unit-tests-with-an-in-memory-transport)
- [Testing remote servers and authentication](#testing-remote-servers-and-authentication)
- [A CI job for MCP servers](#a-ci-job-for-mcp-servers)
- [Evals: does the model use your tools well?](#evals-does-the-model-use-your-tools-well)
- [Debugging common failures](#debugging-common-failures)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## What to test, and with what

| Layer | What it catches | Tool | When to run |
| --- | --- | --- | --- |
| Protocol | Server does not start, wrong transport, malformed responses, auth discovery broken | MCP Inspector (web or CLI) | While developing, and as a smoke test in CI |
| Tool logic | Wrong upstream request, bad error mapping, missing validation | Unit tests with an in-memory client | Every commit |
| Definitions | Changed descriptions, renamed tools, schemas some clients reject | Snapshot of `tools/list`, Inspector `--strict` | Every pull request |
| Behaviour | Model picks the wrong tool, invents arguments, loops on errors | Evals with real tasks and a real model | Before releases and after description changes |
| Clients | A specific client's config format, OAuth quirks, size limits | Manual runs in Claude, Cursor, VS Code | Before launch and after client updates |

The layers apply whether you wrote the server by hand or [generated it from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi). If you are still at the design stage, [REST API to MCP server](/learn/mcp/rest-api-to-mcp-server) covers the decisions that make a server easier to test: small tools, bounded results and explicit errors.

## A note on protocol versions

The current MCP revision, [2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/changelog), changed how clients and servers talk. It removed the `initialize` handshake and the `Mcp-Session-Id` header: every request now carries its protocol version and client capabilities in `_meta`, and servers advertise what they support through a new `server/discover` method. Version mismatches return an `UnsupportedProtocolVersionError`. It also removed `ping` and `logging/setLevel`, and deprecated the Logging feature in favour of stderr or OpenTelemetry.

Clients and SDKs in the wild are at different points in that transition, so test your server in both protocol eras until your users' clients have caught up. The Inspector makes that a flag: `--protocol-era legacy` speaks the session-based protocol, `modern` pins the 2026-07-28 revision, and `auto` tries the new one and falls back.

It is worth doing, because the results are not always what you expect. With version 2.1.0 of the TypeScript SDK, our HTTP server built on `createMcpHandler` answered in both eras. Our stdio server, built with `McpServer` and `StdioServerTransport`, answered only in the legacy era: pinning `modern` failed with "the server did not offer pinned protocol version 2026-07-28 via server/discover", and `auto` quietly fell back. Neither is wrong today, but you want to know which one you are shipping.

## Explore a server with the MCP Inspector

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) is the official developer tool for poking at a server by hand. Version 2 ships as one package with three interfaces: a web UI (the default), a CLI and a terminal UI. It needs Node 22.19 or later.

Start it against a local stdio server by passing the command that runs the server:

```bash
npx @modelcontextprotocol/inspector npx tsx planets.ts
```

Or against a remote server:

```bash
npx @modelcontextprotocol/inspector --server-url https://scalar.com/mcp --transport http
```

The web UI opens on `http://127.0.0.1:6274`. Things to check on a new server:

- **Tools list.** Every tool you expect is there, with the name, description and schema you intended. Read the descriptions as if you were the model: would you know when to use each one?
- **A happy-path call** for each tool, with realistic arguments.
- **A bad call** for each tool: a missing required argument, a wrong type, an ID that does not exist. You want a tool error with a helpful message, not a crash.
- **Schema warnings.** The web UI flags schema constructs that some clients reject, the same check the CLI's `--strict` flag runs.

Two practical notes. The Inspector stores OAuth secrets in your operating system's keychain, but on a machine without one (headless Linux, containers) it falls back to a plaintext file under `~/.mcp-inspector/`, so be careful on shared machines. And if you are following an older tutorial, the v1 line is still available as `@modelcontextprotocol/inspector@v1-latest`; its flags and exit codes differ.

## Script checks with the Inspector CLI

The CLI mode runs one MCP method and exits, which makes it the fastest way to check a server from a shell or a CI job. The server target comes first, then the flags:

```bash
# List tools as JSON
npx @modelcontextprotocol/inspector --cli npx tsx planets.ts \
  --method tools/list --format json

# Call a tool with arguments
npx @modelcontextprotocol/inspector --cli npx tsx planets.ts \
  --method tools/call --tool-name list_planets --tool-arg limit=5 --format json

# The same against a remote server over Streamable HTTP
npx @modelcontextprotocol/inspector --cli https://scalar.com/mcp --transport http \
  --method tools/call --tool-name search-documentation --tool-arg question="llms.txt"
```

`--tool-arg` values are parsed as JSON where possible, so `limit=5` arrives as a number. Use `--tool-args-json '{"id":"012"}'` when you need a value kept as a string. Add `--header "X-API-Key: ..."` for servers that take a key, and `--protocol-era legacy`, `modern` or `auto` to choose which protocol generation to negotiate.

The exit codes are designed for scripts. The ones you will use most: `0` success, `3` the server requires authentication, `4` the server is unreachable, `5` the tool returned `isError: true` or does not exist, and `6` when `--strict` found a schema that is valid JSON Schema but not portable across clients. On any failure, the last line on stderr is a JSON object with an error `code`, so a script can branch on it.

Here is what a validation failure looks like. We called our example `get_planet` tool with a negative ID:

```bash
npx @modelcontextprotocol/inspector --cli npx tsx server.ts \
  --method tools/call --tool-name get_planet --tool-arg planetId=-3
```

The tool result carried `"isError": true` and the message `Input validation error: Invalid arguments for tool get_planet: planetId: Too small: expected number to be >0`, and the command exited with code `5`. That is the behaviour you want: the model receives a readable explanation and can try again.

The `--strict` check is worth running on every server. On our `list_planets` example it flagged the `next_offset` output field, declared as `number | null`, because the array form of `type` (`["number", "null"]`) is legal JSON Schema but rejected by some clients that expect a single type. The suggested fix is to use `anyOf` with two single-type branches. Nothing else would have caught that until a user of one of those clients complained.

## Unit tests with an in-memory transport

The Inspector tests the server from the outside. For tool logic, you want fast unit tests that run on every commit without spawning processes or calling real APIs. Version 2 of the official TypeScript SDK includes an `InMemoryTransport` that links a client and a server in the same process.

Structure the server so that anything external is passed in. Here the upstream `fetch` is a parameter:

```ts
// server.ts
import { McpServer } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'

export const buildServer = (fetchImpl: typeof fetch = fetch): McpServer => {
  const server = new McpServer({ name: 'galaxy', version: '1.0.0' })

  server.registerTool(
    'get_planet',
    {
      title: 'Get a planet',
      description: 'Fetch one planet by its numeric ID. Use this when you already know the ID.',
      inputSchema: z.object({
        planetId: z.number().int().positive().describe('The planet ID, for example 1'),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ planetId }) => {
      const response = await fetchImpl(`https://galaxy.scalar.com/planets/${planetId}`)
      const body = await response.text()

      if (!response.ok) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Planet ${planetId} not found (HTTP ${response.status}).` }],
        }
      }

      return { content: [{ type: 'text', text: body }] }
    },
  )

  return server
}
```

Then test it through a real client, so you exercise schema validation and result encoding exactly as a client would:

```ts
// server.test.ts
import { Client } from '@modelcontextprotocol/client'
import { InMemoryTransport } from '@modelcontextprotocol/server'
import { afterEach, describe, expect, it } from 'vitest'

import { buildServer } from './server'

// A stub upstream API: planet 1 exists, everything else is a 404.
const stubFetch = async (url: string | URL | Request): Promise<Response> =>
  String(url).endsWith('/planets/1')
    ? new Response(JSON.stringify({ id: 1, name: 'Mars' }), { status: 200 })
    : new Response('Not found', { status: 404 })

const connect = async (): Promise<Client> => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await buildServer(stubFetch as typeof fetch).connect(serverTransport)
  const client = new Client({ name: 'test-client', version: '1.0.0' })
  await client.connect(clientTransport)
  return client
}

let client: Client

afterEach(async () => {
  await client?.close()
})

describe('server', () => {
  it('lists get_planet with a read-only hint', async () => {
    client = await connect()
    const { tools } = await client.listTools()

    expect(tools.map((tool) => tool.name)).toEqual(['get_planet'])
    expect(tools[0].annotations?.readOnlyHint).toBe(true)
    expect(tools[0].inputSchema.required).toEqual(['planetId'])
  })

  it('returns the planet as text content', async () => {
    client = await connect()
    const result = await client.callTool({ name: 'get_planet', arguments: { planetId: 1 } })

    expect(result.isError).toBeFalsy()
    expect(result.content).toEqual([{ type: 'text', text: '{"id":1,"name":"Mars"}' }])
  })

  it('reports a missing planet as a tool error the model can read', async () => {
    client = await connect()
    const result = await client.callTool({ name: 'get_planet', arguments: { planetId: 99 } })

    expect(result.isError).toBe(true)
    expect(result.content).toEqual([{ type: 'text', text: 'Planet 99 not found (HTTP 404).' }])
  })

  it('rejects arguments that do not match the input schema', async () => {
    client = await connect()
    const result = await client.callTool({ name: 'get_planet', arguments: { planetId: 'one' } })

    expect(result.isError).toBe(true)
  })
})
```

With `@modelcontextprotocol/server` and `@modelcontextprotocol/client` 2.1.0 and Vitest, all four tests pass in well under a second. Note what they cover: the tool list and its annotations, a success path, an upstream failure turned into a readable tool error, and schema validation. Add a test for every error path in your handler; they are the paths a model will hit most.

## Testing remote servers and authentication

Remote servers add a network, a transport and usually OAuth to the list of things that can fail; [remote MCP servers](/learn/mcp/remote-mcp-servers) explains how they differ from local ones. Start with `curl`. A protected server should answer an unauthenticated request with `401` and a `WWW-Authenticate` header pointing at its protected resource metadata:

```bash
curl -i -X POST https://mcp.example.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

If you get `403`, a redirect, or `401` without the header, clients will never start the sign-in flow. [MCP OAuth](/learn/mcp/mcp-oauth) walks through the discovery documents to check next, using a Scalar installation as a live example.

The Inspector CLI helps here too. Exit code `3` means authentication is required. In CI, pass `--stored-auth-only` so the CLI fails fast with `auth_required` instead of trying to open a browser. For a hosted Scalar server (the [getting started guide](/products/agent/getting-started) shows where to find the installation URL), a wrong installation ID is easy to spot: the endpoint answers `404` with `MCP_INSTALLATION_NOT_FOUND`, which the CLI reports as a generic error with exit code `1`.

Then test the full sign-in in at least two real clients, because each implements discovery and client registration a little differently. [Connect an MCP server to Claude](/learn/mcp/connect-mcp-server-to-claude) and [MCP server configuration](/learn/mcp/mcp-server-configuration) have the exact steps for Claude, Cursor and VS Code.

## A CI job for MCP servers

A useful CI job for an MCP server runs four checks: unit tests, a smoke test through the Inspector, the `--strict` schema check, and a snapshot of the tool definitions so that a changed description shows up in code review. As a GitHub Actions workflow:

```yaml
name: mcp-server
on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: npm ci
      - run: npx vitest run

      # Smoke test: the server starts and a tool call succeeds.
      - run: >
          npx @modelcontextprotocol/inspector --cli npx tsx planets.ts
          --method tools/call --tool-name list_planets --tool-arg limit=1

      # Fail on schemas that some clients reject.
      - run: npx @modelcontextprotocol/inspector --cli npx tsx planets.ts --method tools/list --strict

      # Fail if tool definitions changed without the snapshot being updated.
      - run: |
          npx @modelcontextprotocol/inspector --cli npx tsx planets.ts \
            --method tools/list --format json \
            | jq -S '.result.tools | sort_by(.name)' > tools.snapshot.json
          git diff --exit-code tools.snapshot.json
```

The snapshot step matters more than it looks. Tool descriptions are behaviour: changing "use this when" in one tool changes which tool a model picks. Making every change visible in a diff is also a security control, covered in [MCP server security](/learn/mcp/mcp-server-security).

## Evals: does the model use your tools well?

Unit tests prove the tools work. They do not prove a model will use them correctly. For that you need evals: realistic tasks, run through a real model with your server connected, scored automatically.

Keep the first version simple:

1. **Write 20 to 50 tasks in users' words**, each with the tool you expect first and the arguments that matter. Include tasks that should use no tool at all, and tasks where the right answer is to ask the user a question.
2. **Run each task** through the agent runtime your users use (Claude Code in non-interactive mode, the Claude Agent SDK, the OpenAI Agents SDK, the Vercel AI SDK) with your server connected, and record the tool calls.
3. **Score** tool selection, argument validity and the final answer. The first two can be checked in code; the last usually needs a rubric or a second model as a judge.
4. **Track the numbers across changes.** Run the suite after every change to descriptions or tools, and before releases.

A task file can be as plain as this:

```json
[
  {
    "task": "What kind of planet is Mars?",
    "expected_tool": "list_planets",
    "expected_args": {}
  },
  {
    "task": "Show me the full details for planet 1",
    "expected_tool": "get_planet",
    "expected_args": { "planetId": 1 }
  }
]
```

The failures you find will mostly be description problems: two tools whose purposes overlap, a parameter without a format, a description that says what a tool does but not when to use it. Fix the description, rerun the suite, and resist the temptation to fix the prompt instead, because your users will not be using your prompt. [MCP API documentation](/learn/mcp/mcp-api-documentation) has guidance on writing descriptions that score well.

Evals are also the only way to compare architectures fairly. When we compared a one-tool-per-endpoint server with Scalar's three search-and-execute tools on the Zoom and Notion APIs, the difference in [tokens and steps per task](/blog/posts/2026-03-05-agent-scalar) only showed up because we ran the same tasks through both.

## Debugging common failures

**The server exits immediately or the client reports a parse error (stdio).** Something is writing to stdout that is not an MCP message: a `console.log`, a banner, a dependency's warning. Over stdio, stdout belongs to the protocol. Log to stderr instead. Claude Desktop captures each server's stderr in `mcp-server-<name>.log`.

**`-32602 Invalid params` or "Unknown tool".** The client called a tool name the server does not have, often after a rename, or sent arguments that fail the request schema. Compare the client's cached tool list with a fresh `tools/list`.

**`UnsupportedProtocolVersionError`.** Client and server do not share a protocol version. Run the Inspector with `--protocol-era legacy` and then `modern` to see which one your server supports, and upgrade the SDK on whichever side is behind.

**401 on every request.** For OAuth servers, check the `WWW-Authenticate` header and discovery documents with `curl`. For API-key servers, check the header name and whether the server expects `Bearer ` before the key.

**Works in the Inspector, fails in a client.** Usually a client-specific limit or format: a config entry missing `"type": "http"` in Claude Code, a schema construct the client rejects (run `--strict`), a result larger than the client accepts (Claude Code cuts tool output at 25,000 tokens by default), or a tool count over the client's cap.

**The model calls the right tool with wrong arguments.** The schema is too loose. Add `enum`, `format`, examples and descriptions to parameters, and mark required fields as required.

**The model loops on an error.** The error message does not say what to do next. "Rate limited; wait 30 seconds and do not retry immediately" stops a loop; "429" does not.

For production, add structured logs per tool call (tool name, outcome, latency, upstream status) and, where you can, OpenTelemetry tracing. The 2026-07-28 revision documents `traceparent` in request `_meta`, which lets you follow one tool call through to the upstream API.

## Common mistakes

- **Testing only the happy path.** Models hit error paths constantly. Test each one.
- **Only testing in one client.** Formats, limits and OAuth behaviour differ between Claude, Cursor and VS Code.
- **Calling the real API in unit tests.** Inject the HTTP client and stub it; keep live calls for smoke tests.
- **Ignoring schema portability.** A schema that works in one client can be rejected by another. Run `--strict`.
- **Changing descriptions without evals.** A one-word change can move tool selection. Measure before and after.
- **Logging to stdout in a stdio server.** It corrupts the protocol stream.

## Frequently asked questions

<scalar-detail title="What is the MCP Inspector?">
The MCP Inspector is the official developer tool for testing MCP servers. It connects to a local or remote server and lets you list and call tools, read resources and prompts, and check authentication. Version 2 has a web UI, a CLI mode for scripts and CI, and a terminal UI, all run with npx @modelcontextprotocol/inspector.
</scalar-detail>

<scalar-detail title="How do I test an MCP server from the command line?">
Use the Inspector's CLI mode: npx @modelcontextprotocol/inspector --cli, followed by the server command or URL, then --method tools/list or --method tools/call with --tool-name and --tool-arg. Add --format json for machine-readable output. Exit codes distinguish authentication failures, unreachable servers and tool errors.
</scalar-detail>

<scalar-detail title="How do I unit test MCP tools?">
Connect a real MCP client to your server in the same process with the SDK's in-memory transport, stub any upstream API, and assert on listTools and callTool results. This exercises schema validation and result encoding the way a real client would, without spawning processes or making network calls.
</scalar-detail>

<scalar-detail title="How do I test a remote MCP server that uses OAuth?">
First check the unauthenticated response with curl: it should be 401 with a WWW-Authenticate header that points at protected resource metadata. Then complete the sign-in in the Inspector's web UI and in at least two real clients. In CI, use the Inspector CLI with stored credentials and --stored-auth-only so it never tries to open a browser.
</scalar-detail>

<scalar-detail title="What are MCP evals?">
Evals are automated tests of model behaviour: a set of realistic tasks run through a real model with your server connected, scored on whether the model chose the right tool, passed valid arguments and reached the right answer. They catch description and design problems that unit tests cannot.
</scalar-detail>

<scalar-detail title="Do I need to test a Scalar-hosted MCP server?">
You do not test the server code, because Scalar runs it. You should still check the parts you configure: which operations are exposed, the authentication setup, and how well a model handles your API's descriptions. The Inspector and an eval suite work against a Scalar installation URL the same way as against any remote server.
</scalar-detail>

## Related

- **Learn:** [REST API to MCP server](/learn/mcp/rest-api-to-mcp-server) · [MCP server security](/learn/mcp/mcp-server-security) · [MCP OAuth](/learn/mcp/mcp-oauth) · [What is MCP?](/learn/mcp/what-is-mcp)
- **Docs:** [MCP servers](/products/agent/mcp) · [Agent SDK](/products/agent/integration/sdk)
- **Product:** [Scalar MCP](/products/agent/mcp) — hosted MCP servers from OpenAPI, so you test your API and descriptions, not server code

*Commands were run on 26 September 2026 with MCP Inspector 2.8.0, @modelcontextprotocol/server and @modelcontextprotocol/client 2.1.0, Vitest 5 and Node 24. Specification details refer to MCP revision 2026-07-28.*
