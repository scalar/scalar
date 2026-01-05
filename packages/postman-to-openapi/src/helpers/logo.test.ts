import { describe, expect, it } from 'vitest'

import type { PostmanCollection } from '@/types'

import { processLogo } from './logo'

describe('logoHelper', () => {
  it('returns logo object when logo variables are present', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'x-logo.url',
          value: 'https://example.com/logo.png',
        },
        {
          key: 'x-logo.backgroundColor',
          value: '#ffffff',
        },
        {
          key: 'x-logo.altText',
          value: 'Company Logo',
        },
        {
          key: 'x-logo.href',
          value: 'https://example.com',
        },
      ],
    }

    const result = processLogo(collection)

    expect(result).toEqual({
      url: 'https://example.com/logo.png',
      backgroundColor: '#ffffff',
      altText: 'Company Logo',
      href: 'https://example.com',
    })
  })

  it('handles logo variables with Var suffix', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'x-logo.urlVar',
          value: 'https://example.com/logo.png',
        },
        {
          key: 'x-logo.backgroundColorVar',
          value: '#ffffff',
        },
      ],
    }

    const result = processLogo(collection)

    expect(result).toEqual({
      url: 'https://example.com/logo.png',
      backgroundColor: '#ffffff',
      altText: undefined,
      href: undefined,
    })
  })

  it('returns null when no logo variables are present', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'other.variable',
          value: 'value',
        },
      ],
    }

    const result = processLogo(collection)

    expect(result).toBeNull()
  })

  it('returns null when variables array is missing', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
    }

    const result = processLogo(collection)

    expect(result).toBeNull()
  })

  it('handles partial logo information', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'x-logo.url',
          value: 'https://example.com/logo.png',
        },
      ],
    }

    const result = processLogo(collection)

    expect(result).toEqual({
      url: 'https://example.com/logo.png',
      backgroundColor: undefined,
      altText: undefined,
      href: undefined,
    })
  })

  it('ignores variables without key', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'x-logo.url',
          value: 'https://example.com/logo.png',
        },
        {
          key: '',
          value: 'ignored',
        },
      ],
    }

    const result = processLogo(collection)

    expect(result).toEqual({
      url: 'https://example.com/logo.png',
      backgroundColor: undefined,
      altText: undefined,
      href: undefined,
    })
  })
})
