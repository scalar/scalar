import { describe, expect, it } from 'vitest'

import type { PostmanCollection } from '@/types'

import { processLicense } from './license'

describe('license', () => {
  it('returns license when name is present', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'license.name',
          value: 'MIT',
        },
      ],
    }

    const result = processLicense(collection)

    expect(result).toEqual({
      name: 'MIT',
    })
  })

  it('includes license URL when present', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'license.name',
          value: 'MIT',
        },
        {
          key: 'license.url',
          value: 'https://opensource.org/licenses/MIT',
        },
      ],
    }

    const result = processLicense(collection)

    expect(result).toEqual({
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    })
  })

  it('returns undefined license when name is missing', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'license.url',
          value: 'https://opensource.org/licenses/MIT',
        },
      ],
    }

    const result = processLicense(collection)

    expect(result).toBeUndefined()
  })

  it('returns undefined license when name is not a string', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [
        {
          key: 'license.name',
          value: 123,
        },
      ],
    }

    const result = processLicense(collection)

    expect(result).toBeUndefined()
  })
})
