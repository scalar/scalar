import type { OpenAPI } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

import type { AnyObject } from '../types'

function transform(definition: AnyObject): OpenAPI.Document {
  // Throw error if it's a Swagger document
  if ('swagger' in definition) {
    throw new Error(
      'Swagger 2.0 documents are not supported. Please upgrade to OpenAPI 3.x.',
    )
  }

  // Add OpenAPI version
  const transformed: AnyObject = {
    openapi: definition.openapi ?? '3.1.1',
    ...definition,
  }

  // Add info object if not present
  if (!transformed.info) {
    transformed.info = {}
  }

  // Add required properties to info object
  transformed.info = {
    ...transformed.info,
    title: transformed.info.title ?? '',
    version: transformed.info.version ?? '1.0',
  }

  return transformed
}

describe('transform', () => {
  /** @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#openapi-object */
  it('adds required properties', () => {
    const result = transform({})

    expect(result).toStrictEqual({
      openapi: '3.1.1',
      info: {
        title: '',
        version: '1.0',
      },
    })
  })

  it('doesn’t overwrite existing properties', () => {
    const result = transform({
      openapi: '3.0.0',
      info: {
        title: 'Foobar',
      },
    })

    expect(result).toStrictEqual({
      openapi: '3.0.0',
      info: {
        title: 'Foobar',
        version: '1.0',
      },
    })
  })

  it('throws an error when it’s a swagger document', () => {
    expect(() =>
      transform({
        swagger: '2.0',
      }),
    ).toThrow(
      'Swagger 2.0 documents are not supported. Please upgrade to OpenAPI 3.x.',
    )
  })
})
