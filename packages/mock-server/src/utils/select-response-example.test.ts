import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

import { selectResponseExample } from './select-response-example'

describe('selectResponseExample', () => {
  it('returns undefined when the media type is missing', () => {
    expect(selectResponseExample(undefined)).toBeUndefined()
  })

  it('returns undefined when nothing is defined', () => {
    expect(selectResponseExample({ schema: { type: 'string' } })).toBeUndefined()
  })

  it('uses the singular example', () => {
    expect(selectResponseExample({ example: { foo: 'bar' } })).toEqual({ value: { foo: 'bar' } })
  })

  it('treats a null singular example as a real value', () => {
    expect(selectResponseExample({ example: null })).toEqual({ value: null })
  })

  it('uses the first entry of the examples map when there is no singular example', () => {
    const mediaType: OpenAPIV3_1.MediaTypeObject = {
      examples: {
        first: { value: { id: 1 } },
        second: { value: { id: 2 } },
      },
    }

    expect(selectResponseExample(mediaType)).toEqual({ value: { id: 1 } })
  })

  it('prefers the singular example over the examples map without a name', () => {
    const mediaType: OpenAPIV3_1.MediaTypeObject = {
      example: { from: 'singular' },
      examples: {
        first: { value: { from: 'map' } },
      },
    }

    expect(selectResponseExample(mediaType)).toEqual({ value: { from: 'singular' } })
  })

  it('selects a named example', () => {
    const mediaType: OpenAPIV3_1.MediaTypeObject = {
      example: { from: 'singular' },
      examples: {
        first: { value: { id: 1 } },
        notFound: { value: { error: 'not found' } },
      },
    }

    expect(selectResponseExample(mediaType, 'notFound')).toEqual({ value: { error: 'not found' } })
  })

  it('falls through to the singular example for an unknown name', () => {
    const mediaType: OpenAPIV3_1.MediaTypeObject = {
      example: { from: 'singular' },
      examples: {
        first: { value: { id: 1 } },
      },
    }

    expect(selectResponseExample(mediaType, 'missing')).toEqual({ value: { from: 'singular' } })
  })

  it('skips a named example without a value so the caller can use the schema', () => {
    const mediaType: OpenAPIV3_1.MediaTypeObject = {
      schema: { type: 'string' },
      examples: {
        external: { externalValue: 'https://example.com/payload.json' },
      },
    }

    expect(selectResponseExample(mediaType, 'external')).toBeUndefined()
  })

  it('falls through to the singular example when a named example has no value', () => {
    const mediaType: OpenAPIV3_1.MediaTypeObject = {
      example: { from: 'singular' },
      examples: {
        external: { externalValue: 'https://example.com/payload.json' },
      },
    }

    expect(selectResponseExample(mediaType, 'external')).toEqual({ value: { from: 'singular' } })
  })

  it('skips the first examples entry when it has no value', () => {
    const mediaType: OpenAPIV3_1.MediaTypeObject = {
      schema: { type: 'string' },
      examples: {
        external: { externalValue: 'https://example.com/payload.json' },
      },
    }

    expect(selectResponseExample(mediaType)).toBeUndefined()
  })

  it('treats a null named example value as a real value', () => {
    const mediaType: OpenAPIV3_1.MediaTypeObject = {
      examples: {
        empty: { value: null },
      },
    }

    expect(selectResponseExample(mediaType, 'empty')).toEqual({ value: null })
  })
})
