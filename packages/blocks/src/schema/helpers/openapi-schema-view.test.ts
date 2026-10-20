import { resolve } from '@scalar/workspace-store/resolve'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { type ConstraintSchema, schemaDialect } from '../constraint-metadata'
import { hasSchemaConstraints } from './has-schema-constraints'
import { openApiSchemaView } from './openapi-schema-view'
import { partitionAllOfCompositions } from './partition-all-of-compositions'

const document = (options: Record<string, unknown> = {}): OpenApiDocument =>
  ({
    openapi: '3.1.0',
    info: { title: 'Example', version: '1' },
    paths: {},
    ...options,
  }) as OpenApiDocument
const schema = (value: Record<string, unknown>): ConstraintSchema => value as ConstraintSchema
const condition = schema({ if: { required: ['kind'] }, then: { required: ['company'] } })

describe('openapi-schema-view', () => {
  it.each(['3.1.0', '3.2.0'])('enables default constraints in OpenAPI %s', (openapi) => {
    const view = openApiSchemaView(condition, document({ openapi }))
    expect(hasSchemaConstraints(view)).toBe(true)
    expect(view).not.toBe(condition)
    expect(schemaDialect in condition).toBe(false)
    expect(JSON.stringify(view)).toBe(JSON.stringify(condition))
  })

  it.each(['2.0', '3.0.4'])('keeps upgraded %s documents unchanged', (version) => {
    const source = { ...condition, $schema: 'https://json-schema.org/draft/2020-12/schema' }
    expect(openApiSchemaView(source, document({ 'x-original-oas-version': version }))).toBe(source)
  })

  it.each([
    ['http://json-schema.org/draft-07/schema#', 'draft-07'],
    ['https://json-schema.org/draft/2019-09/schema', '2019-09'],
    ['https://json-schema.org/draft/2020-12/schema', '2020-12'],
    ['https://spec.openapis.org/oas/3.1/dialect/base', '2020-12'],
    ['https://spec.openapis.org/oas/3.2/dialect/base', '2020-12'],
    ['https://example.com/custom', 'unsupported'],
  ])('uses document dialect %s', (jsonSchemaDialect, expected) => {
    const view = openApiSchemaView(condition, document({ jsonSchemaDialect })) as ConstraintSchema
    expect(view[schemaDialect]).toBe(expected)
    expect(hasSchemaConstraints(view)).toBe(expected !== 'unsupported')
  })

  it('inherits resource dialects and allows explicit overrides without adapting examples', () => {
    const example = { if: {}, then: {} }
    const source = schema({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        legacy: { dependencies: { card: ['address'] } },
        modern: {
          $id: 'https://example.com/modern',
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          dependentRequired: { card: ['address'] },
        },
        unknown: { $id: 'https://example.com/custom', $schema: 'https://example.com/custom', ...condition },
      },
      example,
    })
    const view = openApiSchemaView(source, document())!
    const properties = ('properties' in view ? view.properties : {}) as Record<string, ConstraintSchema>
    expect(properties.legacy?.[schemaDialect]).toBe('draft-07')
    expect(properties.modern?.[schemaDialect]).toBe('2020-12')
    expect(hasSchemaConstraints(properties.unknown)).toBe(false)
    expect(view.example).toBe(example)
    expect(schemaDialect in example).toBe(false)
  })

  it('uses the target resource dialect for local references, including pointers into a resource', () => {
    const child = schema({ dependencies: { card: ['address'] } })
    const root = { $schema: 'http://json-schema.org/draft-07/schema#', $defs: { child } }
    const doc = document({ components: { schemas: { Root: root } } })
    const ref = {
      $ref: '#/components/schemas/Root/$defs/child',
      '$ref-value': child,
      description: 'Annotated reference',
    }
    const view = resolve.schema(openApiSchemaView(schema(ref), doc)) as ConstraintSchema
    expect(view[schemaDialect]).toBe('draft-07')
    expect(hasSchemaConstraints(view)).toBe(true)
  })

  it('allows a known schema dialect to override an unknown document default', () => {
    const view = openApiSchemaView(
      schema({ ...condition, $schema: 'https://json-schema.org/draft/2020-12/schema' }),
      document({ jsonSchemaDialect: 'https://example.com/custom' }),
    )
    expect(hasSchemaConstraints(view)).toBe(true)
  })

  it('preserves recursive identities and independently authored allOf conditions', () => {
    const source: ConstraintSchema = { type: 'object', properties: {} }
    source.properties!.self = source
    const doc = document()
    const view = openApiSchemaView(source, doc)!
    expect('properties' in view && view.properties!.self).toBe(view)
    expect(openApiSchemaView(source, doc)).toBe(view)
    const composed = openApiSchemaView(
      schema({ allOf: [condition, { ...condition, then: { required: ['person'] } }] }),
      doc,
    )
    const segments = partitionAllOfCompositions(composed).segments
    expect(segments).toHaveLength(2)
    expect(segments.map((segment) => segment.kind === 'object' && (segment.schema as ConstraintSchema).then)).toEqual([
      { required: ['company'], [schemaDialect]: '2020-12' },
      { required: ['person'], [schemaDialect]: '2020-12' },
    ])
  })
  it('keeps different dialects on reference siblings and their targets separate', () => {
    const target = { $schema: 'http://json-schema.org/draft-07/schema#', ...condition }
    const source = {
      $ref: '#/components/schemas/Target',
      '$ref-value': target,
      if: { required: ['account'] },
      then: { required: ['accountId'] },
    }
    const view = openApiSchemaView(schema(source), document({ components: { schemas: { Target: target } } }))
    const segments = partitionAllOfCompositions(view).segments
    expect(segments).toHaveLength(2)
    expect(
      segments.map((segment) => segment.kind === 'object' && (segment.schema as ConstraintSchema)[schemaDialect]),
    ).toEqual(['2020-12', 'draft-07'])
  })
  it.each(['then', 'else'])('does not pair a referenced condition with %s-only siblings', (keyword) => {
    const view = openApiSchemaView(
      schema({ $ref: '#/target', '$ref-value': condition, [keyword]: { required: ['unrelated'] } }),
      document(),
    )
    const segments = partitionAllOfCompositions(view).segments
    expect(
      segments.filter((segment) => segment.kind === 'object' && hasSchemaConstraints(segment.schema)),
    ).toHaveLength(1)
    expect(JSON.stringify(segments)).not.toContain('unrelated')
  })

  it('ignores reference siblings in Draft-07', () => {
    const view = resolve.schema(
      openApiSchemaView(
        schema({
          $schema: 'http://json-schema.org/draft-07/schema#',
          $ref: '#/target',
          '$ref-value': { type: 'string' },
          ...condition,
        }),
        document(),
      ),
    )
    expect(hasSchemaConstraints(view)).toBe(false)
    expect(view).toMatchObject({ type: 'string' })
    expect(view).not.toHaveProperty('if')
  })
  it.each(['minContains', 'maxContains'])('does not apply orphan %s to a referenced contains', (keyword) => {
    const view = openApiSchemaView(
      schema({ $ref: '#/target', '$ref-value': { contains: { const: 'x' } }, [keyword]: 0 }),
      document(),
    )
    const constraints = partitionAllOfCompositions(view).segments.filter(
      (segment) => segment.kind === 'object' && hasSchemaConstraints(segment.schema),
    )
    expect(constraints).toHaveLength(1)
    expect(constraints[0]?.kind === 'object' && constraints[0].schema).not.toHaveProperty(keyword)
  })
})
