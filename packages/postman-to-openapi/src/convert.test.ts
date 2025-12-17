import { beforeAll, describe, expect, it } from 'vitest'

import { convert } from './convert'
import type { PostmanCollection } from './types'

const TEST_FIXTURES_BUCKET_NAME = 'scalar-test-fixtures'
const BASE_URL = `https://storage.googleapis.com/${TEST_FIXTURES_BUCKET_NAME}`

describe('convert', () => {
  // Define all file content variables
  const collections: Record<string, string> = {}
  const expected: Record<string, string> = {}

  beforeAll(async () => {
    try {
      // Download all files in parallel
      const allPromises = [
        // Input collections
        ...[
          'AuthBasic',
          'AuthBearer',
          'AuthMultiple',
          'AuthRequest',
          'DeleteOperation',
          'EmptyUrl',
          'ExternalDocs',
          'Folders',
          'FormData',
          'FormUrlencoded',
          'GetMethods',
          'Headers',
          'LicenseContact',
          'MultipleServers',
          'NoPath',
          'NoVersion',
          'OperationIds',
          'ParseStatusCode',
          'PathParams',
          'PostmantoOpenAPI',
          'RawBody',
          'Responses',
          'ResponsesEmpty',
          'SimplePost',
          'UrlWithPort',
          'XLogo',
          'NestedServers',
        ].map(async (name) => {
          const path = `oas/postman-to-openapi/fixtures/input/${name}.json`
          const response = await fetch(`${BASE_URL}/${path}`)
          collections[name] = await response.text()
        }),
        // Expected outputs
        ...[
          'AuthBasic',
          'AuthBearer',
          'AuthMultiple',
          'AuthRequest',
          'Basic',
          'DeleteOperation',
          'EmptyUrl',
          'ExternalDocs',
          'Folders',
          'FormData',
          'FormUrlencoded',
          'GetMethods',
          'Headers',
          'LicenseContact',
          'MultipleServers',
          'NoPath',
          'NoVersion',
          'OperationIds',
          'ParseStatusCode',
          'PathParams',
          'RawBody',
          'Responses',
          'ResponsesEmpty',
          'SimplePost',
          'UrlWithPort',
          'XLogoVar',
          'NestedServers',
        ].map(async (name) => {
          const response = await fetch(`${BASE_URL}/oas/postman-to-openapi/fixtures/output/${name}.json`)
          expected[name] = await response.text()
        }),
      ]

      await Promise.all(allPromises)
    } catch (error) {
      console.error('Failed to download test files:', error)
      throw error
    }
  }, 5000)

  it('transforms basic collection', () => {
    expect(convert(JSON.parse(collections.PostmantoOpenAPI ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.Basic ?? ''),
    )
  })

  it('creates tags from nested folders without mutating the input collection', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Tags',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Parent',
          description: 'Parent folder',
          item: [
            {
              name: 'Child',
              item: [
                {
                  name: 'Leaf request',
                  request: 'https://api.scalar.com/users',
                },
              ],
            },
          ],
        },
        {
          name: 'Standalone request',
          request: 'https://api.scalar.com/status',
        },
      ],
    }

    const snapshot = JSON.parse(JSON.stringify(collection))
    const result = convert(collection)

    expect(result.tags).toEqual([{ name: 'Parent', description: 'Parent folder' }, { name: 'Parent > Child' }])
    expect(collection).toEqual(snapshot)
  })

  it('fails fast when string input is not valid JSON', () => {
    expect(() => convert('{"info": {"name": "Broken"')).toThrowError(/invalid postman collection json/i)
  })

  it('errors when required collection info is missing', () => {
    expect(() => convert({} as PostmanCollection)).toThrowError(/missing required info/i)
    expect(() =>
      convert({
        // @ts-expect-error testing runtime validation
        info: { schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
        item: [],
      }),
    ).toThrowError(/missing required info.name/i)
  })

  it('merges global and request-level security schemes', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Security',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      auth: {
        type: 'bearer',
      },
      item: [
        {
          name: 'Users',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/users',
            auth: {
              type: 'basic',
            },
          },
        },
      ],
    }

    const result = convert(collection)

    expect(result.security).toEqual([{ bearerAuth: [] }])
    expect(result.components?.securitySchemes).toEqual({
      bearerAuth: {
        scheme: 'bearer',
        type: 'http',
      },
      basicAuth: {
        scheme: 'basic',
        type: 'http',
      },
    })
  })

  it('overwrites duplicate operations with last-write-wins policy', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Duplicate operations',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'First',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/users',
          },
        },
        {
          name: 'Second',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/users',
          },
        },
      ],
    }

    const result = convert(collection)
    const operation = result.paths['/users']?.get

    expect(operation).toBeDefined()
    expect(operation?.summary).toBe('Second')
  })

  it('handles collections without items', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Empty',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
    }

    const result = convert(collection)

    expect(result.paths).toEqual({})
    expect(result.components).toBeUndefined()
    expect(result.tags).toBeUndefined()
  })

  it('keeps security undefined when collection has no auth', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Authless',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Ping',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/ping',
          },
        },
      ],
    }

    const result = convert(collection)

    expect(result.security).toBeUndefined()
    expect(result.components).toBeUndefined()
  })

  it('defaults requestBody content to text/plain when extractor returns empty content', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Empty body content',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Upload',
          request: {
            method: 'POST',
            url: 'https://api.scalar.com/upload',
            body: {
              mode: 'file',
              file: { src: null },
            },
          },
        },
      ],
    }

    const result = convert(collection)
    const postOperation = result.paths?.['/upload']?.post

    expect(postOperation?.requestBody).toBeDefined()
    expect(postOperation?.requestBody && 'content' in postOperation.requestBody).toBe(true)
    if (postOperation?.requestBody && 'content' in postOperation.requestBody) {
      expect(postOperation.requestBody.content).toEqual({ 'text/plain': {} })
    }
  })

  it('throws when item is not an array', () => {
    expect(() =>
      convert({
        info: {
          name: 'Bad item',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        // @ts-expect-error invalid runtime shape
        item: {},
      }),
    ).toThrowError(/item must be an array/i)
  })

  it('errors when variables are not an array', () => {
    expect(() =>
      convert({
        info: {
          name: 'Bad variable',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [],
        // @ts-expect-error invalid runtime shape
        variable: {},
      }),
    ).toThrowError(/variable must be an array/i)
  })

  it('converts collection with servers', () => {
    expect(convert(JSON.parse(collections.SimplePost ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.SimplePost ?? ''),
    )
  })

  it('uses default version when not specified', () => {
    expect(convert(JSON.parse(collections.NoVersion ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.NoVersion ?? ''),
    )
  })

  it('converts folders to tags', () => {
    expect(convert(JSON.parse(collections.Folders ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.Folders ?? ''),
    )
  })

  it('parses GET methods with query strings', () => {
    expect(convert(JSON.parse(collections.GetMethods ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.GetMethods ?? ''),
    )
  })

  it.skip('parses header parameters', () => {
    expect(convert(JSON.parse(collections.Headers ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.Headers ?? ''),
    )
  })

  it('parses path parameters', () => {
    expect(convert(JSON.parse(collections.PathParams ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.PathParams ?? ''),
    )
  })

  it('parses servers from postman collection host', () => {
    expect(convert(JSON.parse(collections.MultipleServers ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.MultipleServers ?? ''),
    )
  })

  it('parses license and contact from variables', () => {
    expect(convert(JSON.parse(collections.LicenseContact ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.LicenseContact ?? ''),
    )
  })

  it('parses status codes from tests', () => {
    expect(convert(JSON.parse(collections.ParseStatusCode ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.ParseStatusCode ?? ''),
    )
  })

  it('parses operations with domain only (no path)', () => {
    expect(convert(JSON.parse(collections.NoPath ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.NoPath ?? ''),
    )
  })

  it('converts DELETE operations', () => {
    expect(convert(JSON.parse(collections.DeleteOperation ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.DeleteOperation ?? ''),
    )
  })

  it('parses global Bearer authorization', () => {
    expect(convert(JSON.parse(collections.AuthBearer ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.AuthBearer ?? ''),
    )
  })

  it('parses global Basic authorization', () => {
    expect(convert(JSON.parse(collections.AuthBasic ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.AuthBasic ?? ''),
    )
  })

  it('parses URLs with ports', () => {
    expect(convert(JSON.parse(collections.UrlWithPort ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.UrlWithPort ?? ''),
    )
  })

  it('parses external docs from variables', () => {
    expect(convert(JSON.parse(collections.ExternalDocs ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.ExternalDocs ?? ''),
    )
  })

  it('handles empty URL requests', () => {
    expect(convert(JSON.parse(collections.EmptyUrl ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.EmptyUrl ?? ''),
    )
  })

  it('uses x-logo from variables', () => {
    expect(convert(JSON.parse(collections.XLogo ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.XLogoVar ?? ''),
    )
  })

  it('supports auth at request level', () => {
    expect(convert(JSON.parse(collections.AuthMultiple ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.AuthMultiple ?? ''),
    )
  })

  it('handles auth defined only at request level', () => {
    expect(convert(JSON.parse(collections.AuthRequest ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.AuthRequest ?? ''),
    )
  })

  it('parses POST methods with form data', () => {
    expect(convert(JSON.parse(collections.FormData ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.FormData ?? ''),
    )
  })

  it('parses POST methods with urlencoded form data', () => {
    expect(convert(JSON.parse(collections.FormUrlencoded ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.FormUrlencoded ?? ''),
    )
  })

  it('parses raw body as JSON with text fallback', () => {
    expect(convert(JSON.parse(collections.RawBody ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.RawBody ?? ''),
    )
  })

  it.skip('handles empty JSON response bodies', () => {
    expect(convert(JSON.parse(collections.ResponsesEmpty ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.ResponsesEmpty ?? ''),
    )
  })

  it('includes operationId when brackets selected', () => {
    expect(convert(JSON.parse(collections.OperationIds ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.OperationIds ?? ''),
    )
  })

  it.skip('adds responses from postman examples', () => {
    expect(convert(JSON.parse(collections.Responses ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.Responses ?? ''),
    )
  })

  it('parses nested servers', () => {
    expect(convert(JSON.parse(collections.NestedServers ?? '') as PostmanCollection)).toEqual(
      JSON.parse(expected.NestedServers ?? ''),
    )
  })
})
