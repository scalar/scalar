import { isObject } from '@scalar/helpers/object/is-object'
import { getRaw } from '@scalar/json-magic/magic-proxy'
import { describe, inlineCode, item, list, paragraph, strong, text } from '@scalar/openapi-to-markdown/markdown'
import type { Code, ListItem, RootContent } from 'mdast'

import { object, resolve, string } from './document'

/** Serialize authored data without adding workspace reference metadata or interpreting literal $ref keys. */
export const code = (value: unknown, lang = 'json'): Code => ({
  type: 'code',
  lang,
  value: lang !== 'json' && typeof value === 'string' ? value : (JSON.stringify(getRaw(value), null, 2) ?? 'null'),
})

const annotations = [
  'format',
  'enum',
  'const',
  'default',
  'readOnly',
  'writeOnly',
  'deprecated',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'minLength',
  'maxLength',
  'pattern',
  'minItems',
  'maxItems',
  'uniqueItems',
  'minProperties',
  'maxProperties',
] as const

/** Render AsyncAPI / Draft 7 schemas without coercing them through OpenAPI's schema dialect. */
export const createSchemaRenderer = (): ((input: unknown) => RootContent[]) => {
  const state = { remaining: 5000 }
  const render = (input: unknown, ancestors: Set<unknown>, depth: number): RootContent[] => {
    const resolved = resolve(input)
    if (typeof resolved === 'boolean') {
      return [paragraph(text(resolved ? 'Any value is allowed.' : 'No value is allowed.'))]
    }
    if (!isObject(resolved)) {
      return [code(resolved)]
    }
    const schema = object(resolved)
    if ('schema' in schema) {
      const format = string(schema.schemaFormat)
      if (
        !format ||
        /^application\/(?:vnd\.aai\.asyncapi(?:\+json|\+yaml)?|schema\+(?:json|yaml))(?:;|$)/.test(format)
      ) {
        return render(schema.schema, ancestors, depth)
      }
      return [
        paragraph(strong(text('Schema format:')), text(' '), inlineCode(format)),
        code(schema.schema, typeof schema.schema === 'string' ? 'text' : 'json'),
      ]
    }
    const identity = getRaw(resolved)
    if (ancestors.has(identity)) {
      const reference = isObject(input) ? string(input.$ref) : undefined
      return [paragraph(text('Recursive schema'), ...(reference ? [text(': '), inlineCode(reference)] : []))]
    }
    if (depth >= 10 || state.remaining-- <= 0) {
      return [paragraph(text('Schema expansion limit reached.'))]
    }
    const next = new Set(ancestors).add(identity)
    const type = Array.isArray(schema.type)
      ? schema.type.join(' | ')
      : (string(schema.type) ?? (schema.properties ? 'object' : schema.items !== undefined ? 'array' : undefined))
    const blocks: RootContent[] = [...(type ? [paragraph(inlineCode(type))] : []), ...describe(schema.description)]
    const details = annotations.flatMap((name) =>
      schema[name] === undefined
        ? []
        : [item(paragraph(strong(text(`${name}:`)), text(' '), inlineCode(JSON.stringify(getRaw(schema[name])))))],
    )
    if (details.length) {
      blocks.push(list(details))
    }
    const required = new Set(Array.isArray(schema.required) ? schema.required : [])
    const unlistedRequired = [...required].filter(
      (name) => typeof name === 'string' && !Object.hasOwn(object(schema.properties), name),
    )
    if (unlistedRequired.length) {
      blocks.push(paragraph(strong(text('Required properties:')), text(' '), inlineCode(unlistedRequired.join(', '))))
    }
    const properties = Object.entries(object(schema.properties)).map(
      ([name, property]): ListItem =>
        item(
          paragraph(strong(inlineCode(name)), ...(required.has(name) ? [text(' (required)')] : [])),
          ...(render(property, next, depth + 1) as ListItem['children']),
        ),
    )
    if (properties.length) {
      blocks.push(list(properties))
    }
    for (const keyword of [
      'items',
      'additionalItems',
      'additionalProperties',
      'contains',
      'propertyNames',
      'not',
      'if',
      'then',
      'else',
    ] as const) {
      if (schema[keyword] !== undefined) {
        const values = Array.isArray(schema[keyword]) ? schema[keyword] : [schema[keyword]]
        blocks.push(paragraph(strong(text(`${keyword}:`))))
        for (const value of values) {
          blocks.push(...render(value, next, depth + 1))
        }
      }
    }
    for (const keyword of ['oneOf', 'anyOf', 'allOf'] as const) {
      if (Array.isArray(schema[keyword])) {
        blocks.push(
          paragraph(strong(text(`${keyword}:`))),
          list(schema[keyword].map((branch) => item(...(render(branch, next, depth + 1) as ListItem['children'])))),
        )
      }
    }
    for (const keyword of ['patternProperties', 'dependencies'] as const) {
      const entries = Object.entries(object(schema[keyword]))
      if (entries.length) {
        blocks.push(
          paragraph(strong(text(`${keyword}:`))),
          list(
            entries.map(([name, value]) =>
              item(
                paragraph(inlineCode(name)),
                ...((Array.isArray(value) ? [code(value)] : render(value, next, depth + 1)) as ListItem['children']),
              ),
            ),
          ),
        )
      }
    }
    const examples = Array.isArray(schema.examples)
      ? schema.examples
      : schema.example === undefined
        ? []
        : [schema.example]
    for (const example of examples) {
      blocks.push(paragraph(strong(text('Example:'))), code(example))
    }
    return blocks.length ? blocks : [paragraph(text('Any value is allowed.'))]
  }
  return (input) => render(input, new Set(), 0)
}
