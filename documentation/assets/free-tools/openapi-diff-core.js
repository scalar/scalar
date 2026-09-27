/*
 * Pure logic for /tools/openapi-diff.
 *
 * Compares two OpenAPI 3.x documents operation by operation. Changes get one
 * of three severities:
 *
 * - breaking: an existing client can fail (removed operation, new required
 *   parameter, removed response field, changed type, ...)
 * - warning: probably fine, worth a look (removed optional parameter, response
 *   field no longer required, new enum value in a response, ...)
 * - info: additive changes
 *
 * The rules are intentionally few and readable. Direction matters: a request
 * schema may accept more than before, a response schema may promise less
 * only at a cost.
 */

import { HTTP_METHODS, detectVersion, inlineRefs, listOperations } from './tools-shared.js'

/** The sample pair loaded on open: v1 and a v2 with a mix of changes. */
export const SAMPLE_BEFORE = `openapi: 3.1.1
info:
  title: Galaxy Planets API
  version: 1.0.0
paths:
  /planets:
    get:
      operationId: listPlanets
      summary: List all planets
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: A page of planets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Planet'
  /planets/{planetId}:
    get:
      operationId: getPlanet
      summary: Get a planet
      parameters:
        - name: planetId
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: The planet
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Planet'
    delete:
      operationId: deletePlanet
      summary: Delete a planet
      parameters:
        - name: planetId
          in: path
          required: true
          schema:
            type: integer
      responses:
        '204':
          description: Deleted
components:
  schemas:
    Planet:
      type: object
      required: [id, name]
      properties:
        id:
          type: integer
        name:
          type: string
        radius:
          type: number
`

export const SAMPLE_AFTER = `openapi: 3.1.1
info:
  title: Galaxy Planets API
  version: 2.0.0
paths:
  /planets:
    get:
      operationId: listPlanets
      summary: List all planets
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
        - name: galaxy
          in: query
          required: true
          schema:
            type: string
      responses:
        '200':
          description: A page of planets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Planet'
    post:
      operationId: createPlanet
      summary: Create a planet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Planet'
      responses:
        '201':
          description: Created
  /planets/{id}:
    get:
      operationId: getPlanet
      summary: Get a planet
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: The planet
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Planet'
components:
  schemas:
    Planet:
      type: object
      required: [id, name]
      properties:
        id:
          type: string
        name:
          type: string
        moons:
          type: integer
`

const MAX_SCHEMA_DEPTH = 10

/** `/planets/{planetId}` and `/planets/{id}` are the same route. */
const normalizePath = (path) => path.replace(/\{[^}]+\}/g, '{}')

/** Types as a sorted list, folding in OpenAPI 3.0 `nullable`. */
const typesOf = (schema) => {
  if (!schema || typeof schema !== 'object') {
    return []
  }
  const types = [schema.type ?? []].flat()
  if (schema.nullable === true && types.length && !types.includes('null')) {
    types.push('null')
  }
  return types.sort()
}

const isSubset = (small, large) => small.every((item) => large.includes(item))

const describeTypes = (types) => (types.length ? types.join(' | ') : 'any')

/**
 * Compare two (already inlined) schemas.
 *
 * @param {'request' | 'response'} direction who sends data shaped by this schema
 * @param {string} location human-readable path, like `body.name` or `200 response.items[].id`
 * @param {(severity: string, message: string) => void} report
 */
export const compareSchemas = (before, after, direction, location, report, depth = 0) => {
  if (depth > MAX_SCHEMA_DEPTH || !before || !after || typeof before !== 'object' || typeof after !== 'object') {
    return
  }

  const oldTypes = typesOf(before)
  const newTypes = typesOf(after)
  if (oldTypes.length && newTypes.length && oldTypes.join() !== newTypes.join()) {
    // Requests may widen (accept more); responses may narrow (promise more).
    const compatible = direction === 'request' ? isSubset(oldTypes, newTypes) : isSubset(newTypes, oldTypes)
    report(
      compatible ? 'info' : 'breaking',
      `${location}: type changed from ${describeTypes(oldTypes)} to ${describeTypes(newTypes)}`,
    )
    if (!compatible) {
      return
    }
  }

  if (Array.isArray(before.enum) && Array.isArray(after.enum)) {
    const removed = before.enum.filter((value) => !after.enum.includes(value))
    const added = after.enum.filter((value) => !before.enum.includes(value))
    if (removed.length) {
      report(
        direction === 'request' ? 'breaking' : 'info',
        `${location}: enum value${removed.length === 1 ? '' : 's'} ${removed.map((value) => JSON.stringify(value)).join(', ')} removed`,
      )
    }
    if (added.length) {
      report(
        direction === 'response' ? 'warning' : 'info',
        `${location}: enum value${added.length === 1 ? '' : 's'} ${added.map((value) => JSON.stringify(value)).join(', ')} added`,
      )
    }
  }

  const oldProperties = before.properties ?? {}
  const newProperties = after.properties ?? {}
  const oldRequired = new Set(Array.isArray(before.required) ? before.required : [])
  const newRequired = new Set(Array.isArray(after.required) ? after.required : [])
  const prefix = location ? `${location}.` : ''

  for (const name of Object.keys(oldProperties)) {
    if (!(name in newProperties)) {
      report(
        direction === 'response' ? 'breaking' : 'warning',
        direction === 'response'
          ? `${prefix}${name}: response field removed`
          : `${prefix}${name}: request field removed (clients that still send it may be rejected or ignored)`,
      )
    }
  }
  for (const name of Object.keys(newProperties)) {
    if (!(name in oldProperties)) {
      const nowRequired = newRequired.has(name)
      report(
        direction === 'request' && nowRequired ? 'breaking' : 'info',
        `${prefix}${name}: ${direction} field added${nowRequired ? ' (required)' : ''}`,
      )
    }
  }
  for (const name of Object.keys(oldProperties)) {
    if (!(name in newProperties)) {
      continue
    }
    if (direction === 'request' && !oldRequired.has(name) && newRequired.has(name)) {
      report('breaking', `${prefix}${name}: request field is now required`)
    }
    if (direction === 'response' && oldRequired.has(name) && !newRequired.has(name)) {
      report('warning', `${prefix}${name}: response field is no longer required, so it may be missing`)
    }
    compareSchemas(oldProperties[name], newProperties[name], direction, `${prefix}${name}`, report, depth + 1)
  }

  if (before.items && after.items) {
    compareSchemas(before.items, after.items, direction, `${location}[]`, report, depth + 1)
  }
}

const jsonSchemaOf = (content) => {
  if (!content || typeof content !== 'object') {
    return undefined
  }
  const key = Object.keys(content).find((type) => /json/i.test(type)) ?? Object.keys(content)[0]
  return key ? content[key]?.schema : undefined
}

/** Compare one operation that exists in both documents. */
const compareOperation = (before, after) => {
  const changes = []
  const report = (severity, message) => changes.push({ severity, message })

  // Parameters are matched by location and name. Path parameters are matched
  // by their position in the path template, because renaming {planetId} to
  // {id} is invisible to clients.
  const indexed = (entry) => {
    const template = [...entry.path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1])
    return new Map(
      entry.parameters.map((parameter) => [
        parameter.in === 'path' ? `path:#${template.indexOf(parameter.name)}` : `${parameter.in}:${parameter.name}`,
        parameter,
      ]),
    )
  }
  const oldParameters = indexed(before)
  const newParameters = indexed(after)
  const label = (parameter) => `${parameter.in} parameter "${parameter.name}"`

  for (const [key, parameter] of oldParameters) {
    if (!newParameters.has(key)) {
      report(parameter.in === 'path' ? 'breaking' : 'warning', `${label(parameter)} removed`)
    }
  }
  for (const [key, parameter] of newParameters) {
    const previous = oldParameters.get(key)
    if (!previous) {
      report(
        parameter.required ? 'breaking' : 'info',
        `${label(parameter)} added${parameter.required ? ' as required' : ''}`,
      )
      continue
    }
    if (!previous.required && parameter.required) {
      report('breaking', `${label(parameter)} is now required`)
    }
    compareSchemas(previous.schema, parameter.schema, 'request', label(parameter), report)
  }

  const oldBody = before.operation.requestBody
  const newBody = after.operation.requestBody
  if (!oldBody && newBody) {
    report(newBody.required ? 'breaking' : 'info', `request body added${newBody.required ? ' as required' : ''}`)
  } else if (oldBody && !newBody) {
    report('warning', 'request body removed')
  } else if (oldBody && newBody) {
    if (!oldBody.required && newBody.required) {
      report('breaking', 'request body is now required')
    }
    compareSchemas(jsonSchemaOf(oldBody.content), jsonSchemaOf(newBody.content), 'request', 'body', report)
  }

  const oldResponses = before.operation.responses ?? {}
  const newResponses = after.operation.responses ?? {}
  for (const code of Object.keys(oldResponses)) {
    if (!(code in newResponses)) {
      report(/^2/.test(code) ? 'breaking' : 'warning', `${code} response removed`)
      continue
    }
    const oldSchema = jsonSchemaOf(oldResponses[code]?.content)
    const newSchema = jsonSchemaOf(newResponses[code]?.content)
    if (oldSchema && !newSchema) {
      report('breaking', `${code} response no longer has a body`)
    }
    compareSchemas(oldSchema, newSchema, 'response', `${code} response body`, report)
  }
  for (const code of Object.keys(newResponses)) {
    if (!(code in oldResponses)) {
      report('info', `${code} response added`)
    }
  }

  return changes
}

/** Operations with local references inlined, keyed by method and normalized path. */
const indexOperations = (document) => {
  const map = new Map()
  for (const entry of listOperations(document)) {
    map.set(`${entry.method} ${normalizePath(entry.path)}`, {
      ...entry,
      operation: inlineRefs(entry.operation, document),
      parameters: entry.parameters.map((parameter) => inlineRefs(parameter, document)),
    })
  }
  return map
}

const METHOD_ORDER = Object.fromEntries(HTTP_METHODS.map((method, index) => [method, index]))

const byRoute = (a, b) => a.path.localeCompare(b.path) || METHOD_ORDER[a.method] - METHOD_ORDER[b.method]

/**
 * Diff two parsed OpenAPI 3.x documents.
 *
 * @returns {{ summary: { breaking: number, warning: number, info: number }, added: object[], removed: object[], changed: object[], schemas: { added: string[], removed: string[] } }}
 */
export const diffDocuments = (before, after) => {
  const oldOperations = indexOperations(before)
  const newOperations = indexOperations(after)
  const added = []
  const removed = []
  const changed = []

  for (const [key, entry] of oldOperations) {
    if (!newOperations.has(key)) {
      removed.push({
        method: entry.method,
        path: entry.path,
        operationId: entry.operation.operationId,
        severity: 'breaking',
      })
    }
  }
  for (const [key, entry] of newOperations) {
    const previous = oldOperations.get(key)
    if (!previous) {
      added.push({ method: entry.method, path: entry.path, operationId: entry.operation.operationId, severity: 'info' })
      continue
    }
    const changes = compareOperation(previous, entry)
    if (previous.path !== entry.path) {
      changes.unshift({ severity: 'info', message: `path template renamed from ${previous.path}` })
    }
    if (changes.length) {
      changed.push({ method: entry.method, path: entry.path, operationId: entry.operation.operationId, changes })
    }
  }

  const oldSchemas = Object.keys(before.components?.schemas ?? {})
  const newSchemas = Object.keys(after.components?.schemas ?? {})
  const schemas = {
    added: newSchemas.filter((name) => !oldSchemas.includes(name)),
    removed: oldSchemas.filter((name) => !newSchemas.includes(name)),
  }

  const summary = {
    breaking: removed.length,
    warning: 0,
    info: added.length + schemas.added.length + schemas.removed.length,
  }
  for (const operation of changed) {
    for (const change of operation.changes) {
      summary[change.severity] += 1
    }
  }

  return {
    summary,
    added: added.sort(byRoute),
    removed: removed.sort(byRoute),
    changed: changed.sort(byRoute),
    schemas,
  }
}

/** Upgrade Swagger 2.0 input so both sides are compared as OpenAPI 3.x. */
export const prepareDocument = (document, { parser }) => {
  const version = detectVersion(document)
  if (!version) {
    return { ok: false, error: 'No top-level openapi or swagger field found.' }
  }
  if (version === '2.0') {
    const upgraded = parser.upgrade(structuredClone(document)).specification
    return upgraded
      ? { ok: true, document: upgraded, version }
      : { ok: false, error: 'The Swagger 2.0 document could not be upgraded.' }
  }
  return { ok: true, document, version }
}

/** Plain-text report, for copying into a pull request or changelog. */
export const formatReport = (diff) => {
  const lines = [
    `OpenAPI diff: ${diff.summary.breaking} breaking, ${diff.summary.warning} warnings, ${diff.summary.info} other changes`,
    '',
  ]
  const route = (entry) => `${entry.method.toUpperCase()} ${entry.path}`
  for (const entry of diff.removed) {
    lines.push(`[breaking] ${route(entry)}: operation removed`)
  }
  for (const entry of diff.added) {
    lines.push(`[info] ${route(entry)}: operation added`)
  }
  for (const entry of diff.changed) {
    for (const change of entry.changes) {
      lines.push(`[${change.severity}] ${route(entry)}: ${change.message}`)
    }
  }
  for (const name of diff.schemas.added) {
    lines.push(`[info] schema ${name} added`)
  }
  for (const name of diff.schemas.removed) {
    lines.push(`[info] schema ${name} removed`)
  }
  return `${lines.join('\n')}\n`
}
