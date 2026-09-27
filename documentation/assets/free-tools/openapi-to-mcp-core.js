/*
 * Pure logic for /tools/openapi-to-mcp.
 *
 * This approximates how an OpenAPI operation maps to an MCP tool: one tool per
 * operation, a name from the operationId (or method and path), a description
 * from the summary and description, and a JSON Schema for the input built from
 * the parameters and the request body. It is a preview to reason about your
 * document, not a copy of what Scalar's hosted MCP servers produce.
 */

import { detectVersion, inlineRefs, listOperations } from './tools-shared.js'

/** The sample loaded on open: reads, a write with a body, and a delete. */
export const SAMPLE_DOCUMENT = `openapi: 3.1.1
info:
  title: Galaxy Planets API
  version: 1.0.0
servers:
  - url: https://galaxy.scalar.com
paths:
  /planets:
    get:
      operationId: listPlanets
      summary: List all planets
      parameters:
        - name: limit
          in: query
          description: How many planets to return.
          schema:
            type: integer
            minimum: 1
            maximum: 100
      responses:
        '200':
          description: A page of planets
    post:
      operationId: createPlanet
      summary: Create a planet
      description: Adds a planet to the galaxy and returns it.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Planet'
      responses:
        '201':
          description: Created
  /planets/{planetId}:
    parameters:
      - name: planetId
        in: path
        required: true
        schema:
          type: integer
    get:
      operationId: getPlanet
      summary: Get a planet
      responses:
        '200':
          description: The planet
    delete:
      summary: Delete a planet
      responses:
        '204':
          description: Deleted
components:
  schemas:
    Planet:
      type: object
      required: [name]
      properties:
        id:
          type: integer
          readOnly: true
        name:
          type: string
        type:
          type: string
          enum: [terrestrial, gas_giant, ice_giant, dwarf]
`

/** Placeholder installation URL, in the shape Scalar's dashboard hands out. */
export const PLACEHOLDER_URL = 'https://mcp.scalar.com/mcp/YOUR_INSTALL_ID'

/**
 * Many clients (including the Claude API) only accept tool names that match
 * ^[a-zA-Z0-9_-]{1,64}$, so we stay inside that.
 */
const MAX_NAME_LENGTH = 64

const IGNORED_HEADERS = new Set(['accept', 'content-type', 'authorization'])

export const toToolName = (operationId, method, path) => {
  const source = operationId || `${method}_${path.replace(/[{}]/g, '')}`
  const cleaned = source
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  return (cleaned || method).slice(0, MAX_NAME_LENGTH)
}

/** A short, lowercase identifier for the server, used in install snippets. */
export const toServerName = (title) =>
  String(title ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'my-api'

const firstJsonMediaType = (content) => {
  if (!content || typeof content !== 'object') {
    return undefined
  }
  const types = Object.keys(content)
  const json = types.find((type) => /json/i.test(type))
  const form = types.find((type) => /form/i.test(type))
  const chosen = json ?? form ?? types[0]
  return chosen ? { mediaType: chosen, schema: content[chosen]?.schema } : undefined
}

/**
 * Tidy a schema for use as tool input: drop vendor extensions and XML hints,
 * and remove readOnly properties, which a client never sends.
 */
export const cleanInputSchema = (schema) => {
  if (Array.isArray(schema)) {
    return schema.map(cleanInputSchema)
  }
  if (!schema || typeof schema !== 'object') {
    return schema
  }
  const result = {}
  for (const [key, value] of Object.entries(schema)) {
    if (key.startsWith('x-') || key === 'xml' || key === 'externalDocs') {
      continue
    }
    if (key === 'properties' && value && typeof value === 'object') {
      const properties = {}
      for (const [name, property] of Object.entries(value)) {
        if (property?.readOnly !== true) {
          properties[name] = cleanInputSchema(property)
        }
      }
      result.properties = properties
      continue
    }
    result[key] = cleanInputSchema(value)
  }
  if (Array.isArray(result.required) && result.properties) {
    result.required = result.required.filter((name) => name in result.properties)
    if (!result.required.length) {
      delete result.required
    }
  }
  return result
}

/** JSON Schema for one parameter, keeping its description. */
const parameterSchema = (parameter, root) => {
  let schema = parameter.schema
  if (!schema && parameter.content) {
    schema = firstJsonMediaType(parameter.content)?.schema
  }
  const resolved = schema ? cleanInputSchema(inlineRefs(schema, root)) : { type: 'string' }
  const description = [parameter.description, `Sent as a ${parameter.in} parameter.`].filter(Boolean).join(' ')
  return {
    ...resolved,
    description: resolved.description ? `${resolved.description.replace(/\.?\s*$/, '.')} ${description}` : description,
  }
}

/**
 * Build the MCP tool list for an OpenAPI 3.x document.
 *
 * @returns {{ tools: object[], skipped: string[] }}
 */
export const toMcpTools = (document) => {
  const tools = []
  const skipped = []
  const usedNames = new Set()

  for (const { method, path, operation, parameters } of listOperations(document)) {
    if (operation['x-scalar-ignore'] === true) {
      skipped.push(`${method.toUpperCase()} ${path} (x-scalar-ignore)`)
      continue
    }
    if (operation.deprecated === true) {
      skipped.push(`${method.toUpperCase()} ${path} (deprecated)`)
      continue
    }

    let name = toToolName(operation.operationId, method, path)
    for (let suffix = 2; usedNames.has(name); suffix += 1) {
      name = `${name.slice(0, MAX_NAME_LENGTH - String(suffix).length - 1)}_${suffix}`
    }
    usedNames.add(name)

    // OpenAPI says these header parameters are ignored; credentials belong to the server, not the model.
    const inputs = parameters.filter(
      (parameter) => !(parameter.in === 'header' && IGNORED_HEADERS.has(String(parameter.name).toLowerCase())),
    )
    const properties = {}
    const required = []
    const names = new Map()
    for (const parameter of inputs) {
      names.set(parameter.name, (names.get(parameter.name) ?? 0) + 1)
    }
    for (const parameter of inputs) {
      // Same name in two locations (say, an `id` in path and query) needs a prefix.
      const key = names.get(parameter.name) > 1 ? `${parameter.in}_${parameter.name}` : parameter.name
      properties[key] = parameterSchema(parameter, document)
      if (parameter.required || parameter.in === 'path') {
        required.push(key)
      }
    }

    const requestBody = inlineRefs(operation.requestBody, document)
    const body = firstJsonMediaType(requestBody?.content)
    if (body) {
      const schema = body.schema ? cleanInputSchema(inlineRefs(body.schema, document)) : {}
      const description = [requestBody.description, `Request body (${body.mediaType}).`].filter(Boolean).join(' ')
      properties.body = {
        ...schema,
        description: schema.description ? `${schema.description.replace(/\.?\s*$/, '.')} ${description}` : description,
      }
      if (requestBody.required) {
        required.push('body')
      }
    }

    const inputSchema = { type: 'object', properties }
    if (required.length) {
      inputSchema.required = required
    }

    const text = [operation.summary, operation.description].filter(Boolean)
    const description = text.length
      ? [...new Set(text.map((part) => String(part).trim()))].join('\n\n')
      : `${method.toUpperCase()} ${path}`

    const readOnly = method === 'get' || method === 'head' || method === 'options'
    const tool = {
      name,
      title: operation.summary || undefined,
      description,
      inputSchema,
      // The MCP spec only reads destructive/idempotent hints when readOnlyHint is false.
      annotations: readOnly
        ? { readOnlyHint: true }
        : {
            readOnlyHint: false,
            destructiveHint: method === 'delete',
            idempotentHint: method === 'put' || method === 'delete',
          },
      _operation: `${method.toUpperCase()} ${path}`,
    }
    if (!tool.title) {
      delete tool.title
    }
    tools.push(tool)
  }

  return { tools, skipped }
}

/** Drop the private `_operation` field, leaving what a `tools/list` result would carry. */
export const toToolsListResult = (tools) => ({
  tools: tools.map(({ _operation, ...tool }) => tool),
})

/**
 * Install snippets for the three clients people ask about most. Formats checked
 * against each client's documentation on 2026-09-26.
 */
export const installSnippets = (serverName, url = PLACEHOLDER_URL) => ({
  claudeCode: `claude mcp add --transport http ${serverName} ${url}`,
  cursor: JSON.stringify({ mcpServers: { [serverName]: { url } } }, null, 2),
  vscode: JSON.stringify({ servers: { [serverName]: { type: 'http', url } } }, null, 2),
})

/**
 * Preview the MCP server for a parsed document. Swagger 2.0 is upgraded first
 * with the parser's `upgrade()`, so the mapping only has to understand 3.x.
 */
export const previewMcpServer = (document, { parser }) => {
  const version = detectVersion(document)
  if (!version) {
    return {
      ok: false,
      error: 'This does not look like an OpenAPI document: there is no top-level openapi or swagger field.',
    }
  }
  const source = version === '2.0' ? parser.upgrade(structuredClone(document)).specification : document
  if (!source) {
    return { ok: false, error: 'The Swagger 2.0 document could not be upgraded. Try the validator first.' }
  }
  const { tools, skipped } = toMcpTools(source)
  const serverName = toServerName(source.info?.title)
  return {
    ok: true,
    version,
    serverName,
    title: source.info?.title ?? 'Untitled API',
    tools,
    skipped,
    snippets: installSnippets(serverName),
  }
}
