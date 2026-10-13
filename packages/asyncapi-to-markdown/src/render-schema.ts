import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import { isObject } from '@scalar/helpers/object/is-object'
import { getRaw } from '@scalar/json-magic/magic-proxy'
import { describe, inlineCode, item, list, paragraph, strong, text } from '@scalar/openapi-to-markdown/markdown'
import { getXmlBodyExample } from '@scalar/workspace-store/request-example'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { Code, ListItem, PhrasingContent, RootContent } from 'mdast'

import { object, resolve, string } from './document'
import { isJsonSchemaFormat } from './schema-format'
import { createSchemaView } from './schema-view'

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
export const createSchemaRenderer = (
  reference: (input: unknown, depth: number, mediaType?: string) => RootContent[] | undefined = () => undefined,
  view = createSchemaView(),
  preserveReferences = false,
): ((input: unknown, expand?: boolean, mediaType?: string) => RootContent[]) => {
  const state = { remaining: 5000 }
  const render = (
    input: unknown,
    ancestors: Set<unknown>,
    depth: number,
    expand = false,
    mediaType = 'application/json',
  ): RootContent[] => {
    const linked = expand ? undefined : reference(input, depth, mediaType)
    if (linked) {
      return linked
    }
    const resolved = resolve(input)
    if (typeof resolved === 'boolean') {
      return [paragraph(text(resolved ? 'Any value is allowed.' : 'No value is allowed.'))]
    }
    if (!isObject(resolved)) {
      return [code(resolved)]
    }
    const raw = object(resolved)
    const hasReferenceBranch = ['allOf', 'anyOf', 'oneOf'].some(
      (keyword) =>
        Array.isArray(raw[keyword]) &&
        raw[keyword].some((branch) => isObject(branch) && typeof branch.$ref === 'string'),
    )
    const schema = preserveReferences && hasReferenceBranch ? raw : view(raw)
    if ('schema' in schema) {
      const format = string(schema.schemaFormat)
      if (isJsonSchemaFormat(format)) {
        return render(schema.schema, ancestors, depth, expand, mediaType)
      }
      return [
        paragraph(strong(text('Schema format:')), text(' '), inlineCode(format ?? '')),
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
    const summary: PhrasingContent[] = type ? [inlineCode(type)] : []
    for (const name of annotations) {
      if (schema[name] !== undefined) {
        summary.push(
          text(`${summary.length ? ', ' : ''}${name}: `),
          inlineCode(typeof schema[name] === 'string' ? schema[name] : JSON.stringify(getRaw(schema[name]))),
        )
      }
    }
    const blocks: RootContent[] = [...(summary.length ? [paragraph(...summary)] : []), ...describe(schema.description)]
    const discriminator = schema.discriminator
    const propertyName = typeof discriminator === 'string' ? discriminator : string(object(discriminator).propertyName)
    if (propertyName) {
      blocks.push(paragraph(strong(text('Discriminator:')), text(' '), inlineCode(propertyName)))
      const mappings = Object.entries(object(object(discriminator).mapping))
      if (mappings.length) {
        blocks.push(
          list(
            mappings.map(([name, target]) => item(paragraph(inlineCode(name), text(': '), inlineCode(String(target))))),
          ),
        )
      }
    }
    const required = new Set(Array.isArray(schema.required) ? schema.required : [])
    const unlistedRequired = [...required].filter(
      (name) => typeof name === 'string' && !Object.hasOwn(object(schema.properties), name),
    )
    if (unlistedRequired.length) {
      blocks.push(paragraph(strong(text('Required properties:')), text(' '), inlineCode(unlistedRequired.join(', '))))
    }
    const properties = Object.entries(object(schema.properties)).map(([name, property]): ListItem => {
      const children = render(property, next, depth + 1)
      const first = children[0]
      const compact = first?.type === 'paragraph' && ['inlineCode', 'link'].includes(first.children[0]?.type ?? '')
      return item(
        paragraph(
          strong(inlineCode(name)),
          ...(compact ? [text(': '), ...first.children] : []),
          ...(required.has(name) ? [text(' (required)')] : []),
        ),
        ...((compact ? children.slice(1) : children) as ListItem['children']),
      )
    })
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
    blocks.push(...renderAuthoredSchemaExamples(schema, mediaType))
    return blocks.length ? blocks : [paragraph(text('Any value is allowed.'))]
  }
  return (input, expand = false, mediaType = 'application/json') => {
    state.remaining = 5000
    return render(input, new Set(), 0, expand, mediaType)
  }
}

/** Authored examples remain at every usage, including when the schema itself becomes a link. */
export const renderAuthoredSchemaExamples = (input: unknown, mediaType = 'application/json'): RootContent[] => {
  const resolved = object(input)
  const schema = 'schema' in resolved && isJsonSchemaFormat(resolved.schemaFormat) ? object(resolved.schema) : resolved
  const examples = Array.isArray(schema.examples)
    ? schema.examples
    : schema.example === undefined
      ? []
      : [schema.example]
  return examples.flatMap((example) => {
    const label = paragraph(strong(text('Example:')))
    if (!isXmlMediaType(mediaType)) {
      return [label, code(example)]
    }
    if (typeof example === 'string') {
      return [label, code(example, 'xml')]
    }
    const result = getXmlBodyExample(schema as SchemaObject, { value: example })
    return [
      label,
      ...(result.xml !== undefined
        ? [code(result.xml, 'xml')]
        : [paragraph(text('Unable to generate an XML example.'))]),
    ]
  })
}
