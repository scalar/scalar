/*
 * Pure logic for /tools/openapi-validator.
 *
 * Structural validation comes from @scalar/openapi-parser (`validate`), which
 * checks the document against the official schema for its version and resolves
 * references. On top of that we run a handful of lint checks that the schema
 * cannot express, reported as warnings so they never block a valid document.
 */

import { detectVersion, fromPointer, listOperations, parseText, toPointer } from './tools-shared.js'

/** The sample loaded on open. It has exactly one error: a response without a description. */
export const SAMPLE_DOCUMENT = `openapi: 3.1.1
info:
  title: Galaxy Planets API
  version: 1.0.0
  description: A tiny API for looking up planets.
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
          schema:
            type: integer
            minimum: 1
            maximum: 100
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
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Planet'
        '404':
          description: Planet not found
components:
  schemas:
    Planet:
      type: object
      required:
        - id
        - name
      properties:
        id:
          type: integer
        name:
          type: string
        type:
          type: string
          enum: [terrestrial, gas_giant, ice_giant, dwarf]
`

/** Normalize the parser's error path (string pointer or array) into a JSON pointer. */
export const errorPointer = (path) => {
  if (Array.isArray(path)) {
    return toPointer(path)
  }
  if (typeof path === 'string' && path.length) {
    return path.startsWith('/') ? path : `/${path}`
  }
  return ''
}

/** Find where a `$ref` with the given value is used, so reference errors get a location. */
const findRefUsages = (root, ref) => {
  const found = []
  const walk = (node, segments) => {
    if (found.length > 20 || node === null || typeof node !== 'object') {
      return
    }
    if (node.$ref === ref) {
      found.push(toPointer([...segments, '$ref']))
    }
    for (const [key, child] of Object.entries(node)) {
      walk(child, [...segments, key])
    }
  }
  walk(root, [])
  return found
}

/**
 * Lint checks that go beyond schema validation. Deliberately small: each one
 * is a mistake that makes generated docs, SDKs or MCP tools worse.
 */
export const lintDocument = (document) => {
  const warnings = []
  const version = detectVersion(document)
  if (!version || version === '2.0') {
    return warnings
  }

  const seenIds = new Map()
  for (const { method, path, operation } of listOperations(document)) {
    const base = ['paths', path, method]
    const label = `${method.toUpperCase()} ${path}`

    if (!operation.operationId) {
      warnings.push({
        path: toPointer(base),
        message: `${label} has no operationId. SDK method names and MCP tool names fall back to the method and path.`,
        rule: 'operation-operationId',
      })
    } else if (seenIds.has(operation.operationId)) {
      warnings.push({
        path: toPointer([...base, 'operationId']),
        message: `operationId "${operation.operationId}" is also used by ${seenIds.get(operation.operationId)}. operationIds must be unique.`,
        rule: 'operation-operationId-unique',
      })
    } else {
      seenIds.set(operation.operationId, label)
    }

    if (!operation.summary && !operation.description) {
      warnings.push({
        path: toPointer(base),
        message: `${label} has neither a summary nor a description.`,
        rule: 'operation-description',
      })
    }

    const responses =
      operation.responses && typeof operation.responses === 'object' ? Object.keys(operation.responses) : []
    if (responses.length && !responses.some((code) => /^2(\d\d|XX)$/i.test(code) || code === 'default')) {
      warnings.push({
        path: toPointer([...base, 'responses']),
        message: `${label} documents no success (2xx) response.`,
        rule: 'operation-success-response',
      })
    }
  }

  const schemas = document.components?.schemas
  if (schemas && typeof schemas === 'object') {
    const text = JSON.stringify(document)
    for (const name of Object.keys(schemas)) {
      const pointer = `#/components/schemas/${name.replace(/~/g, '~0').replace(/\//g, '~1')}`
      if (!text.includes(`"${pointer}"`)) {
        warnings.push({
          path: toPointer(['components', 'schemas', name]),
          message: `Schema "${name}" is never referenced.`,
          rule: 'no-unused-components',
        })
      }
    }
  }

  return warnings
}

/**
 * Validate OpenAPI text (JSON or YAML).
 *
 * @param {string} text
 * @param {{ parser: { validate: Function }, YAML: object }} libraries
 * @returns {Promise<{ status: 'empty' | 'parse-error' | 'invalid' | 'valid', format?: string, version?: string, errors: object[], warnings: object[] }>}
 */
export const validateText = async (text, { parser, YAML }) => {
  if (!text || !text.trim()) {
    return { status: 'empty', errors: [], warnings: [] }
  }

  const parsed = parseText(text, YAML)
  if (!parsed.ok) {
    return {
      status: 'parse-error',
      format: parsed.format,
      errors: [{ path: '', message: parsed.error.message, line: parsed.error.line, column: parsed.error.column }],
      warnings: [],
    }
  }

  const document = parsed.value
  const declared = detectVersion(document)
  if (!declared) {
    return {
      status: 'invalid',
      format: parsed.format,
      errors: [
        {
          path: '',
          message:
            'No supported version found. Add a top-level "openapi: 3.1.1" (or 3.0.x, 3.2.x) or "swagger: \'2.0\'".',
        },
      ],
      warnings: [],
    }
  }

  // The parser fills in a missing info.version, so give it a copy.
  const result = await parser.validate(structuredClone(document))

  const errors = []
  for (const error of result.errors ?? []) {
    const reference = String(error.message ?? '').match(/resolve reference: (#\S*)/i)
    if (!error.path && reference) {
      const usages = findRefUsages(document, reference[1])
      if (usages.length) {
        for (const usage of usages) {
          errors.push({ path: usage, message: error.message, code: error.code })
        }
        continue
      }
    }
    errors.push({ path: errorPointer(error.path), message: error.message, code: error.code })
  }

  return {
    status: result.valid ? 'valid' : 'invalid',
    format: parsed.format,
    version: result.version ?? declared,
    errors,
    warnings: result.valid ? lintDocument(document) : [],
  }
}

/**
 * Map a JSON pointer to a 1-based line in the source text, using yaml's CST
 * (JSON is valid YAML, so one code path covers both). When the pointer names
 * a key that does not exist, we stop at the closest parent key, which is
 * where the missing key belongs.
 */
export const locatePointer = (text, pointer, YAML) => {
  try {
    const lineCounter = new YAML.LineCounter()
    const document = YAML.parseDocument(text, { lineCounter })
    const lineOf = (node) => (node?.range ? lineCounter.linePos(node.range[0]).line : undefined)
    let node = document.contents
    let line = lineOf(node)
    for (const segment of fromPointer(pointer)) {
      if (YAML.isMap(node)) {
        const pair = node.items.find((item) => String(YAML.isScalar(item.key) ? item.key.value : item.key) === segment)
        if (!pair) {
          break
        }
        line = lineOf(pair.key) ?? line
        node = pair.value
      } else if (YAML.isSeq(node)) {
        const item = node.items[Number(segment)]
        if (!item) {
          break
        }
        line = lineOf(item) ?? line
        node = item
      } else {
        break
      }
    }
    return line
  } catch {
    // No line is better than a wrong line.
    return undefined
  }
}
