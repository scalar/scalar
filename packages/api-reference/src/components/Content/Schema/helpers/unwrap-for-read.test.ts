import { createDetectChangesProxy } from '@scalar/workspace-store/helpers/detect-changes-proxy'
import { createOverridesProxy } from '@scalar/workspace-store/helpers/overrides-proxy'
import { resolve } from '@scalar/workspace-store/resolve'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'

import { unwrapForRead } from './unwrap-for-read'

/** The object branch of the schema union, so `properties` is readable */
type ObjectSchema = Extract<SchemaObject, { type: 'object' }>

/**
 * The stack a document sits under in the app, minus the magic layer, which is
 * not resolvable from this package. The magic layer's whole contribution to a
 * read is the virtual `$ref-value`, so the fixtures carry that key directly and
 * `resolve.schema` reads it exactly as it would through the real proxy.
 */
const asStoreDocument = <T extends Record<string, unknown>>(raw: T, overrides?: Record<string, unknown>): T =>
  reactive(createDetectChangesProxy(createOverridesProxy(raw, { overrides: overrides as never }))) as T

describe('unwrapForRead', () => {
  it('returns a plain object unchanged', () => {
    const schema = { type: 'object' } as const

    expect(unwrapForRead(schema)).toBe(schema)
  })

  it('keeps resolving $ref-value after the outer layers come off', () => {
    // Peeling one layer too many (the store's own getRaw / unpackProxyObject
    // strip the magic layer) leaves every $ref in the tree unresolvable, so the
    // properties of a referenced schema render as nothing at all.
    const target = { type: 'string', description: 'A referenced schema' }
    const document = asStoreDocument({
      components: {
        schemas: {
          Widget: {
            type: 'object',
            properties: {
              name: { $ref: '#/components/schemas/Name', '$ref-value': target },
            },
          },
        },
      },
    })

    const unwrapped = unwrapForRead(document)
    const widget = unwrapped.components.schemas.Widget as ObjectSchema

    expect(resolve.schema(widget.properties?.name)).toMatchObject({
      type: 'string',
      description: 'A referenced schema',
    })
  })

  it('keeps x-scalar overrides visible after the outer layers come off', () => {
    // The overrides layer is what surfaces the reader's own edits on top of the
    // document, so a read that skipped it would show the untouched document.
    const document = asStoreDocument(
      {
        components: {
          schemas: {
            Widget: { type: 'object', 'x-scalar-example': 'from the document' },
          },
        },
      },
      {
        components: {
          schemas: {
            Widget: { 'x-scalar-example': 'from the overrides' },
          },
        },
      },
    )

    const unwrapped = unwrapForRead(document)
    const widget = unwrapped.components.schemas.Widget as Record<string, unknown>

    expect(widget['x-scalar-example']).toBe('from the overrides')
  })

  it('unwraps a subtree handed in below the document root', () => {
    // ParameterListItem and Headers pass a schema in directly, so the helper has
    // to peel the layers off whatever node it is given, not only a whole document.
    const target = { type: 'integer' }
    const document = asStoreDocument({
      schema: {
        type: 'object',
        properties: {
          count: { $ref: '#/x', '$ref-value': target },
        },
      },
    })

    const unwrapped = unwrapForRead(document.schema) as ObjectSchema

    expect(resolve.schema(unwrapped.properties?.count)).toMatchObject({
      type: 'integer',
    })
  })
})
