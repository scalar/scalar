import { describe, expect, it } from 'vitest'

import type { PostmanCollection } from '../types'
import { processLicenseAndContact } from './licenseContactHelper'

describe('licenseContactHelper', () => {
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

    const result = processLicenseAndContact(collection)

    expect(result.license).toEqual({
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

    const result = processLicenseAndContact(collection)

    expect(result.license).toEqual({
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

    const result = processLicenseAndContact(collection)

    expect(result.license).toBeUndefined()
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

    const result = processLicenseAndContact(collection)

    expect(result.license).toBeUndefined()
  })

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

    const result = processLicenseAndContact(collection)

    expect(result.contact).toEqual({
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

    const result = processLicenseAndContact(collection)

    expect(result.contact).toEqual({
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

    const result = processLicenseAndContact(collection)

    expect(result.contact).toEqual({
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

    const result = processLicenseAndContact(collection)

    expect(result.contact).toEqual({
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

    const result = processLicenseAndContact(collection)

    expect(result.contact).toBeUndefined()
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

    const result = processLicenseAndContact(collection)

    expect(result.contact).toEqual({
      email: 'support@example.com',
    })
  })

  it('returns both license and contact when present', () => {
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
          key: 'contact.email',
          value: 'support@example.com',
        },
      ],
    }

    const result = processLicenseAndContact(collection)

    expect(result.license).toEqual({
      name: 'MIT',
    })
    expect(result.contact).toEqual({
      email: 'support@example.com',
    })
  })
})
