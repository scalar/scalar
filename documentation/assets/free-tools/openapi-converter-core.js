/*
 * Pure logic for /tools/openapi-converter.
 *
 * The conversion itself is @scalar/openapi-parser: `upgrade()` takes Swagger
 * 2.0 or OpenAPI 3.0 to OpenAPI 3.1, and `upgradeFromTwoToThree()` stops at
 * OpenAPI 3.0 for toolchains that are not ready for 3.1 yet. This module adds
 * the bits around it: parsing, a readable summary of what moved, and output
 * in JSON or YAML.
 */

import { detectVersion, orderTopLevelKeys, parseText, stringify } from './tools-shared.js'

/** A small Swagger 2.0 document that exercises the interesting parts of an upgrade. */
export const SAMPLE_DOCUMENT = `swagger: '2.0'
info:
  title: Galaxy Planets API
  version: 1.0.0
host: galaxy.scalar.com
basePath: /v1
schemes:
  - https
consumes:
  - application/json
produces:
  - application/json
securityDefinitions:
  apiKey:
    type: apiKey
    in: header
    name: X-API-Key
security:
  - apiKey: []
paths:
  /planets:
    get:
      operationId: listPlanets
      summary: List all planets
      parameters:
        - name: limit
          in: query
          type: integer
          minimum: 1
          maximum: 100
      responses:
        '200':
          description: A page of planets
          schema:
            type: array
            items:
              $ref: '#/definitions/Planet'
    post:
      operationId: createPlanet
      summary: Create a planet
      parameters:
        - name: planet
          in: body
          required: true
          schema:
            $ref: '#/definitions/Planet'
      responses:
        '201':
          description: Created
          schema:
            $ref: '#/definitions/Planet'
  /planets/{planetId}/image:
    post:
      operationId: uploadImage
      summary: Upload an image of a planet
      consumes:
        - multipart/form-data
      parameters:
        - name: planetId
          in: path
          required: true
          type: integer
        - name: image
          in: formData
          type: file
          required: true
      responses:
        '204':
          description: Uploaded
definitions:
  Planet:
    type: object
    required:
      - name
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

/** Count the Swagger 2.0 constructs that change shape, so people know what to review. */
export const summarizeSwagger2 = (document) => {
  const notes = []
  const paths = document.paths && typeof document.paths === 'object' ? Object.values(document.paths) : []
  let body = 0
  let formData = 0
  let files = 0
  for (const pathItem of paths) {
    for (const [key, operation] of Object.entries(pathItem ?? {})) {
      const parameters = key === 'parameters' ? operation : operation?.parameters
      for (const parameter of Array.isArray(parameters) ? parameters : []) {
        if (parameter?.in === 'body') {
          body += 1
        }
        if (parameter?.in === 'formData') {
          formData += 1
          if (parameter.type === 'file') {
            files += 1
          }
        }
      }
    }
  }
  if (document.host || document.basePath || document.schemes) {
    notes.push('host, basePath and schemes became a servers entry.')
  }
  const definitions = Object.keys(document.definitions ?? {}).length
  if (definitions) {
    notes.push(
      `${definitions} definition${definitions === 1 ? '' : 's'} moved to components/schemas, and every $ref was rewritten.`,
    )
  }
  if (body) {
    notes.push(`${body} body parameter${body === 1 ? '' : 's'} became requestBody.`)
  }
  if (formData) {
    notes.push(
      `${formData} formData parameter${formData === 1 ? '' : 's'} became requestBody schema properties${files ? ` (including ${files} file upload${files === 1 ? '' : 's'}, now a binary schema)` : ''}.`,
    )
  }
  if (document.consumes || document.produces) {
    notes.push('consumes and produces became media types under content.')
  }
  const security = Object.keys(document.securityDefinitions ?? {}).length
  if (security) {
    notes.push(`${security} security definition${security === 1 ? '' : 's'} moved to components/securitySchemes.`)
  }
  return notes
}

/**
 * Convert OpenAPI text.
 *
 * @param {string} text Swagger 2.0 or OpenAPI 3.x as JSON or YAML
 * @param {{ target: '3.1' | '3.0', format: 'yaml' | 'json' | 'same' }} options
 * @param {{ parser: object, YAML: object }} libraries
 */
export const convertText = (text, { target = '3.1', format = 'same' } = {}, { parser, YAML }) => {
  const parsed = parseText(text, YAML)
  if (!parsed.ok) {
    const where = parsed.error.line ? ` (line ${parsed.error.line})` : ''
    return { ok: false, error: `${parsed.error.message}${where}` }
  }

  const from = detectVersion(parsed.value)
  if (!from) {
    return {
      ok: false,
      error: 'This does not look like Swagger 2.0 or OpenAPI 3.x: there is no top-level swagger or openapi field.',
    }
  }

  const outputFormat = format === 'same' ? parsed.format : format
  const notes = from === '2.0' ? summarizeSwagger2(parsed.value) : []
  let converted
  let to

  if (target === '3.0') {
    if (from === '2.0') {
      converted = parser.upgradeFromTwoToThree(structuredClone(parsed.value))
      to = '3.0'
    } else if (from === '3.0') {
      converted = parsed.value
      to = '3.0'
      notes.push('The document is already OpenAPI 3.0, so only the format changed.')
    } else {
      return {
        ok: false,
        error: `This is an OpenAPI ${from} document. Downgrading to 3.0 is not supported, because 3.1 features (like JSON Schema type arrays) have no exact 3.0 equivalent.`,
      }
    }
  } else {
    const result = parser.upgrade(structuredClone(parsed.value))
    if (!result.specification) {
      return { ok: false, error: 'The upgrade did not produce a document. Check that the input validates first.' }
    }
    converted = result.specification
    to = result.version ?? detectVersion(converted)
    if (from === '3.0') {
      notes.push(
        'nullable became type arrays with "null", example became examples, and exclusiveMinimum/Maximum became numbers.',
      )
    }
    if (from === '3.1' || from === '3.2') {
      notes.push(`The document is already OpenAPI ${from}, so only the format changed.`)
    }
  }

  const output = stringify(orderTopLevelKeys(converted), outputFormat, YAML)
  return { ok: true, from, to, format: outputFormat, output, notes, document: converted }
}
