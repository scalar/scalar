# OpenAPI to MCP server: how the mapping works

*Last updated: September 2026*

Turning OpenAPI into an MCP server means mapping each OpenAPI operation to an MCP tool: the `operationId` becomes the tool name, the `summary` and `description` become the tool description, the operation's path, query, and header parameters plus its request body become one JSON Schema `inputSchema`, and the security scheme becomes something the server handles on the model's behalf, never a tool argument. The idea fits in one sentence. The details (references, recursion, `oneOf`, `readOnly`, file uploads, and credentials) are where most OpenAPI-to-MCP conversions go wrong.

This guide is about that mapping. It goes element by element through an OpenAPI 3.1 document, shows what each part becomes in an MCP tool definition under the 2026-07-28 MCP specification, and ends with a tested TypeScript converter you can read in one sitting. If you want to compare hand-written, generated, and hosted servers instead, read [how to generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi). If you would rather see the mapping applied to your own document, try the [OpenAPI to MCP tool](/tools/openapi-to-mcp).

**On this page**

- [The mapping at a glance](#the-mapping-at-a-glance)
- [Operations become tools](#operations-become-tools)
- [Parameters become input schema properties](#parameters-become-input-schema-properties)
- [Request bodies become a body property](#request-bodies-become-a-body-property)
- [Responses become tool results](#responses-become-tool-results)
- [Security schemes become server configuration](#security-schemes-become-server-configuration)
- [Servers, tags, and everything else](#servers-tags-and-everything-else)
- [A worked example](#a-worked-example)
- [A tested converter in TypeScript](#a-tested-converter-in-typescript)
- [Pitfalls](#pitfalls)
- [Frequently asked questions](#frequently-asked-questions)

## The mapping at a glance

An OpenAPI document and an MCP tool list describe the same thing from two directions, which is also the core of the [MCP vs API](/learn/mcp/mcp-vs-api) distinction. OpenAPI describes an HTTP interface for any client. An MCP tool list describes callable functions for a language model. Here is how the pieces line up.

| OpenAPI element | MCP tool element | Notes |
| --- | --- | --- |
| Operation (`paths./x.get`) | One tool | Or none, if you leave it out. Curate. |
| `operationId` | `name` | Stable and unique. Must fit MCP's recommended name rules. |
| `summary` | `title` | Human-readable label shown in clients. |
| `summary` + `description` | `description` | Rewrite for a model: what it does, what it returns, when to use it. |
| `parameters` (`in: path`) | Required `inputSchema.properties` | Always required, per the OpenAPI Specification. |
| `parameters` (`in: query`) | Optional or required properties | Keep defaults, enums, and limits. |
| `parameters` (`in: header` / `cookie`) | Properties, or server-side config | Most are infrastructure, not model input. Never auth headers. |
| `requestBody` (JSON) | A `body` property holding the schema | Nesting avoids collisions with parameter names. |
| `requestBody` (`multipart/form-data`) | Needs a design decision | Models do not hold files; accept a URL or resource instead. |
| `components.schemas` + `$ref` | `$defs` + `$ref` inside `inputSchema` | Avoid full inlining; recursive schemas never finish. |
| `readOnly` / `writeOnly` | Drop `readOnly` from input schemas | A server-assigned `id` is not a model input. |
| `responses` (2xx schema) | `outputSchema` + `structuredContent` (optional) | Plus a text block for compatibility. |
| `responses` (4xx/5xx) | Result with `isError: true` | Not a protocol error, so the model can recover. |
| HTTP method | `annotations` (`readOnlyHint`, `destructiveHint`) | Hints only; clients treat them as untrusted. |
| `securitySchemes` + `security` | Server configuration | Credentials never appear in tool arguments or results. |
| `servers[0].url` | The server's upstream base URL | Configurable per environment. |
| `deprecated: true` | Usually excluded | Do not teach a model deprecated operations. |
| `tags` | Toolsets or separate servers | Useful for splitting large APIs. |

The rest of this page explains each row.

## Operations become tools

In OpenAPI, an operation is a method on a path: `GET /planets/{planetId}` is one operation, `DELETE /planets/{planetId}` is another. In MCP, the unit is a tool. The natural mapping is one operation to one tool, and every converter starts there.

Two decisions sit on top of that default.

**Which operations to include.** Including all of them is easy and usually wrong for large APIs, because every tool definition costs context tokens on every turn and some clients cap the total tool count. VS Code, for instance, enforces a [hard limit of 128 tools per request](https://github.com/microsoft/vscode/issues/290356) across all connected servers. Pick operations by task. Exclude `deprecated: true` operations, internal endpoints, and anything bulk-destructive.

**What to call them.** Use the `operationId`. The [MCP tools specification](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) says tool names should be 1 to 128 characters, case-sensitive, unique within the server, and limited to ASCII letters, digits, underscore (`_`), hyphen (`-`), and dot (`.`). Most `operationId` values already satisfy that. Ones that do not (spaces, slashes, non-ASCII) need sanitizing, and the sanitized name must still be unique. If an operation has no `operationId`, the best fix is to add one to the OpenAPI document. A name derived from the path, like `post_planets_planetid_image`, changes when the path changes and reads poorly.

The `summary` maps cleanly to the tool's `title`, which clients show to people. The `description` is a different story: the tool description is what the model reads to decide whether to call the tool, so it deserves more care than a sidebar label. A converter can concatenate `summary` and `description` as a starting point; a person should then edit the ones that matter.

## Parameters become input schema properties

An MCP tool has exactly one input: a JSON object validated by `inputSchema`. OpenAPI spreads inputs across four locations (`path`, `query`, `header`, `cookie`) plus the request body. The converter flattens all of them into the properties of one object.

**Path parameters** become required properties. The [OpenAPI Specification](https://spec.openapis.org/oas/v3.1.1.html#parameter-object) requires `required: true` for path parameters, so a converter can treat them as required even if a document forgets.

**Query parameters** become properties, required only if `required: true`. Copy the parameter's `schema` and keep everything a model can use: `type`, `enum`, `default`, `minimum`, `maximum`, `format`, and `pattern`. Copy the parameter-level `description` onto the property, because that is where a model looks.

**Header and cookie parameters** need judgment. A header like `X-Request-ID` or `Idempotency-Key` is something the server should generate, not something to ask a model for. A header like `Accept-Language` might be a legitimate input. Authentication headers are never inputs; they are covered by security schemes below.

**Parameters defined at the path level** apply to every operation on that path. Merge them with operation-level parameters, and let an operation-level parameter with the same `name` and `in` override the path-level one.

**Name collisions** happen more often than you would expect: a path parameter `id` and a body field `id`, or a query parameter and header parameter with the same name. Two common fixes are nesting the body under a `body` property (used in this guide) or prefixing names by location (`path_id`, `query_id`). Whatever you choose, the handler must map each property back to the right location.

**Serialization styles** (`style`, `explode`) do not appear in the tool schema, because the model provides plain values. The handler must apply them when building the URL. An array query parameter with `explode: true` becomes `?tag=a&tag=b`; with `explode: false` it becomes `?tag=a,b`.

## Request bodies become a body property

For `application/json` bodies, place the body schema under a single `body` property in the input schema. This keeps it apart from parameters and makes the handler trivial: `JSON.stringify(args.body)`. Mark `body` required when `requestBody.required` is true.

Several schema features need translation:

- **`readOnly` properties** such as a server-assigned `id` or `createdAt` must be removed from the input schema, including from `required`. OpenAPI lets one schema serve both requests and responses; an MCP input schema is only ever a request. Our converter hit this on its first run: the model was told `id` was required when creating a planet.
- **`writeOnly` properties** such as `password` stay in the input schema but should not appear in output schemas.
- **`nullable: true`** exists only in OpenAPI 3.0. Convert it to `type: ["string", "null"]` (JSON Schema 2020-12 style) before using the schema in MCP, which defaults to 2020-12. OpenAPI 3.1 schemas are already JSON Schema 2020-12 compatible. If you are unsure which version you have, [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0) explains the differences, and [JSON Schema vs OpenAPI](/learn/openapi/json-schema-vs-openapi) covers the schema dialects.
- **`oneOf`, `anyOf`, `allOf`** are valid in MCP input schemas; the 2026-07-28 revision explicitly allows any JSON Schema 2020-12 keyword. Models handle simple unions well and deep, discriminated unions less well. If an operation takes one of five very different payloads, consider five tools instead of one.
- **`discriminator`** is an OpenAPI keyword, not JSON Schema. Keep the `oneOf` and a `const` on the discriminating property so validation still works.
- **Other media types.** `application/x-www-form-urlencoded` maps to an object like JSON and is encoded differently by the handler. `multipart/form-data` with binary parts is covered under [pitfalls](#pitfalls).

## Responses become tool results

An MCP tool result is a list of content blocks (text, images, audio, resource links, embedded resources), plus an optional `structuredContent` value and an `isError` flag.

**Successful responses.** The simplest mapping returns the response body as a text block. If the operation's 2xx response has a JSON schema, you can also declare it as the tool's `outputSchema` and return the parsed body as `structuredContent`. The [tools specification](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) says a tool returning structured content should also return the serialized JSON as text for backward compatibility. Response schemas tend to be large, so only declare `outputSchema` where clients benefit.

**Error responses.** A 4xx or 5xx from your API should become a normal result with `isError: true` and a message containing the status and the error body. The specification distinguishes these "tool execution errors", which models can learn from and retry, from protocol errors like an unknown tool name. Throwing an exception in the handler turns a fixable mistake into an opaque failure.

**Large responses.** Every byte of a result lands in the model's context. Trim fields the model does not need, keep pagination cursors, and default to small pages.

## Security schemes become server configuration

This is the row people most often get wrong. An OpenAPI `securitySchemes` entry describes how a client authenticates to the API. In MCP, the client is a model, and a model must never hold the credential. So security schemes do not map to tool inputs at all. They map to how the MCP server attaches credentials when it makes the upstream call.

| Scheme in OpenAPI | Typical MCP server handling |
| --- | --- |
| `apiKey` in header, query, or cookie | Server holds the key, or forwards a key each caller supplies (passthrough) |
| `http` with `scheme: bearer` | Same: stored token or per-user passthrough |
| `http` with `scheme: basic` | Stored credential; avoid passing passwords through a model-facing system |
| `oauth2` | Per-user tokens, usually obtained through the MCP server's own OAuth flow |
| `openIdConnect` | Same as `oauth2` |

Operation-level `security` overrides the global requirement. An operation with `security: []` (like `getPlanet` in the Galaxy API) needs no credentials, so the handler should not attach any.

Separately from upstream credentials, a [remote MCP server](/learn/mcp/remote-mcp-servers) has its own authorization question: who may connect? The MCP specification answers that with an OAuth-based framework for HTTP servers; [MCP OAuth](/learn/mcp/mcp-oauth) walks through it. Scalar's hosted servers keep the two layers apart explicitly, as described in [MCP authentication](/products/agent/authentication). For the OpenAPI side, see [OpenAPI security schemes](/learn/openapi/openapi-security-schemes).

## Servers, tags, and everything else

- **`servers`.** The first server URL is a sensible default base URL for upstream calls. Make it configurable, so the same MCP server can point at staging or production. Resolve server variables (`{region}`) from configuration, not from the model.
- **`tags`.** Tags are a ready-made way to split a large API into toolsets or separate servers: one for billing, one for support.
- **`callbacks` and `webhooks`.** These describe requests your API sends out. They have no direct MCP equivalent and are ignored by most converters.
- **`links`.** Links describe how one operation's output feeds another's input. They are good material for tool descriptions ("use the `id` returned by `createPlanet` with `getPlanet`").
- **`examples`.** Example values make excellent hints in property descriptions.
- **`x-` extensions.** Several generators read vendor extensions to override tool names, descriptions, or inclusion. The MCP specification itself defines one schema extension, `x-mcp-header`, which asks Streamable HTTP clients to mirror a primitive parameter into an `Mcp-Param-{Name}` header for routing. It is unrelated to OpenAPI header parameters, and the spec warns against using it for sensitive values.

## A worked example

Here is `GET /planets` from the Scalar Galaxy OpenAPI document, trimmed to the parts that matter:

```yaml
paths:
  /planets:
    get:
      summary: Get all planets
      description: It's easy to say you know them all, but do you really? Retrieve all the planets and check whether you missed one.
      operationId: getAllData
      security: []
      parameters:
        - $ref: '#/components/parameters/limit'
        - $ref: '#/components/parameters/offset'
components:
  parameters:
    limit:
      name: limit
      in: query
      description: The number of items to return
      required: false
      schema:
        type: integer
        format: int64
        default: 10
    offset:
      name: offset
      in: query
      description: The number of items to skip before starting to collect the result set
      required: false
      schema:
        type: integer
        format: int64
        default: 0
```

And this is the tool definition the converter below produces for it, exactly as an MCP client receives it from `tools/list`:

```json
{
  "name": "getAllData",
  "title": "Get all planets",
  "description": "Get all planets\n\nIt's easy to say you know them all, but do you really? Retrieve all the planets and check whether you missed one.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "limit": {
        "type": "integer",
        "format": "int64",
        "default": 10,
        "description": "The number of items to return"
      },
      "offset": {
        "type": "integer",
        "format": "int64",
        "default": 0,
        "description": "The number of items to skip before starting to collect the result set"
      }
    },
    "required": []
  },
  "annotations": {
    "readOnlyHint": true,
    "destructiveHint": false
  }
}
```

The mapping is faithful, and it also shows why automatic conversion is only a first draft. `getAllData` is a poor tool name for "list planets", and the description is playful copy written for a human reader. A reviewer would rename the tool (or better, the `operationId`) to `listPlanets` and rewrite the description to say that results are paginated and return `data` plus `meta`.

Size matters too. Converting the whole Galaxy document produced 10 tools totaling about 20 KB of JSON. The two smallest tools were under 500 bytes each; `createPlanet` was about 5 KB, because its body references the `Planet` schema, which references `Satellite` and `User`. A 200-operation API with rich schemas can easily exceed what a model should carry on every turn.

## A tested converter in TypeScript

This converter reads an OpenAPI 3.1 document, registers one tool per operation with the official MCP TypeScript SDK (v2, `@modelcontextprotocol/server` 2.1.0), and runs over stdio. It handles local `$ref` pointers, path-level parameters, recursive schemas, `readOnly` fields, and HTTP errors. It deliberately leaves out header parameters, non-JSON bodies, and auth schemes beyond a bearer token, so it stays readable. It was tested on 26 September 2026 against the Galaxy API.

```bash
npm install @modelcontextprotocol/server yaml
npm install --save-dev tsx typescript @types/node
curl -o galaxy.yaml https://galaxy.scalar.com/openapi.yaml
npx tsx openapi-to-mcp.ts galaxy.yaml
```

```ts
import { readFile } from 'node:fs/promises'
import { McpServer, fromJsonSchema } from '@modelcontextprotocol/server'
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio'
import { parse } from 'yaml'

type JsonSchema = { [key: string]: unknown }
type Parameter = { name: string; in: string; required?: boolean; description?: string; schema?: JsonSchema }
type Operation = {
  operationId?: string
  summary?: string
  description?: string
  deprecated?: boolean
  parameters?: (Parameter | { $ref: string })[]
  requestBody?: { required?: boolean; content?: Record<string, { schema?: JsonSchema }> }
}

const METHODS = ['get', 'put', 'post', 'patch', 'delete'] as const

const document = parse(await readFile(process.argv[2] ?? 'openapi.yaml', 'utf8'))
const baseUrl: string = process.env.API_BASE_URL ?? document.servers?.[0]?.url
const token = process.env.API_TOKEN

/** Follows a local JSON pointer such as `#/components/parameters/planetId`. */
const resolve = <T>(value: T | { $ref: string }): T => {
  if (value && typeof value === 'object' && '$ref' in value) {
    const path = value.$ref.replace(/^#\//, '').split('/')
    return resolve(path.reduce((node, key) => node[key.replace(/~1/g, '/').replace(/~0/g, '~')], document))
  }
  return value as T
}

/**
 * Rewrites component references to `$defs` instead of inlining them.
 * Inlining a recursive schema (a planet has satellites, a satellite orbits a planet) never terminates.
 */
const toToolSchema = (schema: JsonSchema): JsonSchema => {
  const json = JSON.stringify(schema).replaceAll('"#/components/schemas/', '"#/$defs/')
  const used = new Set<string>()
  const queue = [...json.matchAll(/"#\/\$defs\/([^"]+)"/g)].map((match) => match[1])

  // Only ship the component schemas this tool can actually reach, to keep the tool list small.
  while (queue.length) {
    const name = queue.pop()!
    if (used.has(name)) continue
    used.add(name)
    const component = JSON.stringify(document.components.schemas[name])
    queue.push(...[...component.matchAll(/"#\/components\/schemas\/([^"]+)"/g)].map((match) => match[1]))
  }

  const $defs = Object.fromEntries(
    [...used].map((name) => [
      name,
      JSON.parse(JSON.stringify(document.components.schemas[name]).replaceAll('"#/components/schemas/', '"#/$defs/')),
    ]),
  )

  return { ...JSON.parse(json), ...(used.size ? { $defs } : {}) }
}

/** Tool arguments are always requests, so `readOnly` properties (like a server-assigned `id`) must not be asked for. */
const dropReadOnly = (node: unknown): unknown => {
  if (Array.isArray(node)) return node.map(dropReadOnly)
  if (!node || typeof node !== 'object') return node

  const schema = Object.fromEntries(Object.entries(node).map(([key, value]) => [key, dropReadOnly(value)])) as JsonSchema
  const properties = schema.properties as Record<string, JsonSchema> | undefined

  if (properties && typeof properties === 'object') {
    const readOnly = Object.keys(properties).filter((key) => properties[key]?.readOnly === true)
    schema.properties = Object.fromEntries(Object.entries(properties).filter(([key]) => !readOnly.includes(key)))
    if (Array.isArray(schema.required)) schema.required = schema.required.filter((key) => !readOnly.includes(key))
  }

  return schema
}

const server = new McpServer({ name: document.info.title, version: document.info.version })

for (const [path, pathItem] of Object.entries<Record<string, unknown>>(document.paths ?? {})) {
  for (const method of METHODS) {
    const operation = pathItem[method] as Operation | undefined

    // No operationId means no stable tool name, so skip it rather than invent one.
    if (!operation?.operationId || operation.deprecated) continue

    // Path-level parameters apply to every operation under the path.
    const parameters = [...((pathItem.parameters as Operation['parameters']) ?? []), ...(operation.parameters ?? [])]
      .map((parameter) => resolve<Parameter>(parameter))
      .filter((parameter) => parameter.in === 'path' || parameter.in === 'query')

    const properties: JsonSchema = {}
    const required: string[] = []

    for (const parameter of parameters) {
      properties[parameter.name] = { ...parameter.schema, description: parameter.description }
      if (parameter.required || parameter.in === 'path') required.push(parameter.name)
    }

    // Nest the JSON body under `body` so a body field can never collide with a parameter name.
    const requestBody = operation.requestBody ? resolve(operation.requestBody) : undefined
    const bodySchema = requestBody?.content?.['application/json']?.schema
    if (bodySchema) {
      properties.body = bodySchema
      if (requestBody?.required) required.push('body')
    }

    server.registerTool(
      operation.operationId,
      {
        title: operation.summary,
        description: [operation.summary, operation.description].filter(Boolean).join('\n\n'),
        inputSchema: fromJsonSchema<Record<string, unknown>>(
          dropReadOnly(toToolSchema({ type: 'object', properties, required })) as JsonSchema,
        ),
        annotations: { readOnlyHint: method === 'get', destructiveHint: method === 'delete' },
      },
      async (args) => {
        let url = `${baseUrl}${path}`
        const query = new URLSearchParams()

        for (const parameter of parameters) {
          const value = args[parameter.name]
          if (value === undefined) continue
          if (parameter.in === 'path') url = url.replace(`{${parameter.name}}`, encodeURIComponent(String(value)))
          else query.append(parameter.name, String(value))
        }

        const response = await fetch(query.size ? `${url}?${query}` : url, {
          method: method.toUpperCase(),
          headers: {
            Accept: 'application/json',
            ...(args.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: args.body !== undefined ? JSON.stringify(args.body) : undefined,
        })

        const text = await response.text()

        // Errors are returned as tool results, not thrown, so the model can read them and try again.
        return {
          isError: !response.ok,
          content: [{ type: 'text', text: response.ok ? text : `${response.status} ${response.statusText}: ${text}` }],
        }
      },
    )
  }
}

await server.connect(new StdioServerTransport())
```

What running it taught us, in order:

1. **Full dereferencing crashed.** The first version dereferenced the whole document up front. The Galaxy `Planet` schema is recursive, and the SDK's JSON Schema validator hit "Maximum call stack size exceeded" walking it. Keeping references as `$defs` fixed it, and the 2026-07-28 specification explicitly allows local `$ref` in input schemas.
2. **`readOnly` fields broke creation.** `createPlanet` rejected every call because `id`, which the API assigns, was marked required. Dropping `readOnly` properties from input schemas fixed it.
3. **Validation errors help the model.** Calling `getPlanet` with `"planetId": "abc"` returned a tool result with `isError: true` and the message "data/planetId must be integer", which a model can correct on the next turn.
4. **Auth errors look like auth errors.** Without `API_TOKEN`, `createPlanet` returned `401 Unauthorized` as a readable tool error rather than crashing.

## Pitfalls

**Recursive and shared schemas.** Inline everything and recursive schemas never finish, while shared schemas get duplicated into every tool that uses them. Keep references local with `$defs`, include only the definitions a tool can reach, and bound the depth if your clients struggle with references. Never let a validator fetch remote `$ref` URIs: the MCP specification says implementations must not dereference network URIs automatically.

**External `$ref` files.** Multi-file OpenAPI documents need to be bundled into one document before conversion, and validated: the [OpenAPI validator](/tools/openapi-validator) catches broken references before they become broken tools. A bundler pulls external references into `components`, after which the local strategy above works.

**`oneOf` without a discriminator.** Models do better when each alternative is clearly labeled. Add a `title` and a distinguishing `const` property to each branch, or split the operation into multiple tools.

**File uploads.** `multipart/form-data` with `format: binary` (like Galaxy's `uploadImage`) has no good direct mapping, because a model does not hold file bytes. Options are to accept a URL and have the server fetch the file, to accept a resource URI the host can resolve, or to accept small base64 content with a size limit. The converter above skips non-JSON bodies, which is why `uploadImage` gets only its `planetId` input.

**Binary and streaming responses.** Images can be returned as image content blocks. Large binaries, CSV exports, and streams are better returned as a link or a resource.

**Enormous enums.** A 400-value `enum` of country codes costs tokens on every turn. Consider a plain string with a description and let the API validate.

**Formats.** `format: date-time` or `format: uuid` are annotations in JSON Schema 2020-12 unless a validator opts into format assertion. Mention the format in the description as well, so the model gets it right the first time.

**Swagger 2.0 documents.** Swagger 2.0 uses `in: body` and `in: formData` parameters and a different schema dialect. Upgrade the document to OpenAPI 3.x first; the [OpenAPI converter](/tools/openapi-converter) does this in a browser.

**Credentials in schemas.** If a converter turns your `Authorization` header parameter into a tool input, the model will be asked for a token. Filter security-related headers out of every input schema.

**Using an MCP server that does all this for you.** If you would rather not own a converter, [Scalar's hosted MCP servers](/products/agent/mcp) read the OpenAPI document directly and serve it through a fixed set of search and execute tools, so none of the per-operation mapping reaches the model's tool list. They are hosted by Scalar rather than code you deploy.

## Frequently asked questions

<scalar-detail title="Does every OpenAPI operation need to become an MCP tool?">
No. Include the operations your target tasks need, and leave out deprecated, internal, and bulk-destructive ones. Fewer, better-described tools usually outperform a complete one-to-one mapping, and some clients cap the number of tools per request.
</scalar-detail>

<scalar-detail title="What should the MCP tool name be?">
Use the operationId. It is unique, stable, and already meaningful. MCP recommends tool names of 1 to 128 characters using ASCII letters, digits, underscore, hyphen, and dot. If an operation has no operationId, add one to the OpenAPI document rather than deriving a name from the path.
</scalar-detail>

<scalar-detail title="Can MCP input schemas use $ref?">
Yes. The 2026-07-28 revision allows any JSON Schema 2020-12 keyword in input and output schemas and sets rules for $ref resolution. Local references to $defs work; implementations must not fetch network references automatically. Rewriting #/components/schemas references to #/$defs is a practical approach.
</scalar-detail>

<scalar-detail title="How do OpenAPI security schemes map to MCP?">
They do not become tool inputs. The MCP server attaches credentials when it calls the upstream API, either from a stored credential or by forwarding a credential the caller supplies. Who may connect to a remote MCP server is a separate question, handled by the MCP authorization framework.
</scalar-detail>

<scalar-detail title="How do I handle file uploads when converting OpenAPI to MCP?">
A model cannot send raw file bytes the way an HTTP client does. Accept a URL the server downloads, a resource URI the host resolves, or small base64 content with a strict size limit, and have the server build the multipart request.
</scalar-detail>

<scalar-detail title="Does this work with OpenAPI 3.0 and Swagger 2.0?">
OpenAPI 3.1 maps most directly, because its schemas are JSON Schema 2020-12. OpenAPI 3.0 needs nullable converted to type arrays. Swagger 2.0 should be upgraded to OpenAPI 3.x first.
</scalar-detail>

## Related

- **Learn:** [Generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi) · [What is MCP?](/learn/mcp/what-is-mcp) · [MCP OAuth](/learn/mcp/mcp-oauth)
- **Docs:** [MCP servers in Scalar](/products/agent/mcp)
- **Product:** [Scalar MCP & Agent](/products/agent) — hosted MCP servers that read your OpenAPI document directly, with no converter to maintain.

---

*MCP details reflect specification revision 2026-07-28 as published on modelcontextprotocol.io, checked on 26 September 2026. The converter was tested on that date with @modelcontextprotocol/server 2.1.0 and the Scalar Galaxy OpenAPI document.*
