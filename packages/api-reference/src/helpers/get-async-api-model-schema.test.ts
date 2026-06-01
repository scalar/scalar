import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { getAsyncApiModelSchema } from './get-async-api-model-schema'

const asDocument = (components: unknown): AsyncApiDocument =>
  ({ asyncapi: '3.0.0', info: { title: 'Test', version: '1.0.0' }, components }) as unknown as AsyncApiDocument

describe('getAsyncApiModelSchema', () => {
  it('returns a plain JSON Schema object by name', () => {
    const schema = { type: 'object', properties: { id: { type: 'string' } } }
    const document = asDocument({ schemas: { Planet: schema } })

    expect(getAsyncApiModelSchema(document, 'Planet')).toEqual(schema)
  })

  it('unwraps a Multi Format Schema Object to its inner payload', () => {
    const inner = { type: 'object', properties: { name: { type: 'string' } } }
    const document = asDocument({
      schemas: {
        Planet: { schemaFormat: 'application/vnd.aai.asyncapi+json;version=3.0.0', schema: inner },
      },
    })

    expect(getAsyncApiModelSchema(document, 'Planet')).toEqual(inner)
  })

  it('skips boolean schemas', () => {
    const document = asDocument({ schemas: { Anything: true } })

    expect(getAsyncApiModelSchema(document, 'Anything')).toBeUndefined()
  })

  it('resolves a `$ref` schema entry to its target', () => {
    const target = { type: 'object', properties: { id: { type: 'string' } } }
    const document = asDocument({
      schemas: { Planet: { $ref: '#/components/schemas/Real', '$ref-value': target } },
    })

    expect(getAsyncApiModelSchema(document, 'Planet')).toEqual(target)
  })

  it('reads schemas declared beside a `$ref` on components', () => {
    const schema = { type: 'object' }
    const document = asDocument({
      $ref: '#/components',
      '$ref-value': { schemas: {} },
      schemas: { Planet: schema },
    })

    expect(getAsyncApiModelSchema(document, 'Planet')).toEqual(schema)
  })

  it('returns undefined for an unknown name or missing components', () => {
    expect(getAsyncApiModelSchema(asDocument({ schemas: {} }), 'Missing')).toBeUndefined()
    expect(getAsyncApiModelSchema(asDocument(undefined), 'Planet')).toBeUndefined()
  })
})
