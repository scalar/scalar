import { describe, expect, it } from 'vitest'

import type { PostmanCollection } from '@/types'

import { processContact } from './contact'

describe('contact', () => {
  it('returns contact when name is present', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'contact.name',
          value: 'API Support',
        },
      ],
    }

    const result = processContact(collection)

    expect(result).toEqual({
      name: 'API Support',
    })
  })

  it('returns contact when URL is present', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'contact.url',
          value: 'https://example.com/support',
        },
      ],
    }

    const result = processContact(collection)

    expect(result).toEqual({
      url: 'https://example.com/support',
    })
  })

  it('returns contact when email is present', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'contact.email',
          value: 'support@example.com',
        },
      ],
    }

    const result = processContact(collection)

    expect(result).toEqual({
      email: 'support@example.com',
    })
  })

  it('returns contact with all fields when present', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'contact.name',
          value: 'API Support',
        },
        {
          key: 'contact.url',
          value: 'https://example.com/support',
        },
        {
          key: 'contact.email',
          value: 'support@example.com',
        },
      ],
    }

    const result = processContact(collection)

    expect(result).toEqual({
      name: 'API Support',
      url: 'https://example.com/support',
      email: 'support@example.com',
    })
  })

  it('returns undefined contact when all fields are missing', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [],
    }

    const result = processContact(collection)

    expect(result).toBeUndefined()
  })

  it('excludes non-string contact values', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'contact.name',
          value: 123,
        },
        {
          key: 'contact.email',
          value: 'support@example.com',
        },
      ],
    }

    const result = processContact(collection)

    expect(result).toEqual({
      email: 'support@example.com',
    })
  })
})
