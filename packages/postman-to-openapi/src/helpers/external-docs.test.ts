import { describe, expect, it } from 'vitest'

import type { PostmanCollection } from '@/types'

import { processExternalDocs } from './external-docs'

describe('external-docs', () => {
  it('returns external documentation object when URL is present', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'externalDocs.url',
          value: 'https://example.com/docs',
        },
      ],
    }

    const result = processExternalDocs(collection)

    expect(result).toEqual({
      url: 'https://example.com/docs',
    })
  })

  it('includes description when present', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'externalDocs.url',
          value: 'https://example.com/docs',
        },
        {
          key: 'externalDocs.description',
          value: 'API Documentation',
        },
      ],
    }

    const result = processExternalDocs(collection)

    expect(result).toEqual({
      url: 'https://example.com/docs',
      description: 'API Documentation',
    })
  })

  it('returns undefined when URL is missing', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'externalDocs.description',
          value: 'API Documentation',
        },
      ],
    }

    const result = processExternalDocs(collection)

    expect(result).toBeUndefined()
  })

  it('returns undefined when URL variable has no value', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'externalDocs.url',
          value: '',
        },
      ],
    }

    const result = processExternalDocs(collection)

    expect(result).toBeUndefined()
  })

  it('returns undefined when variables array is missing', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
    }

    const result = processExternalDocs(collection)

    expect(result).toBeUndefined()
  })

  it('throws error when URL value is not a string', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'externalDocs.url',
          value: 123,
        },
      ],
    }

    expect(() => processExternalDocs(collection)).toThrowError('External docs URL must be a string')
  })

  it('excludes description when it is not a string', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'externalDocs.url',
          value: 'https://example.com/docs',
        },
        {
          key: 'externalDocs.description',
          value: 123,
        },
      ],
    }

    const result = processExternalDocs(collection)

    expect(result).toEqual({
      url: 'https://example.com/docs',
    })
  })
})
