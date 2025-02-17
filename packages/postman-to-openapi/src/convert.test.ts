import { beforeAll, describe, expect, it } from 'vitest'

import { convert } from './convert'
import type { PostmanCollection } from './types'

const bucketName = 'scalar-test-fixtures'
const BASE_URL = `https://storage.googleapis.com/${bucketName}`

describe.skip('convert', () => {
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

  it('should work with a basic transform', () => {
    expect(convert(JSON.parse(collections.PostmantoOpenAPI) as PostmanCollection)).toEqual(JSON.parse(expected.Basic))
  })

  it('Should convert a simple postman collection to OpenAPI including servers', () => {
    expect(convert(JSON.parse(collections.SimplePost) as PostmanCollection)).toEqual(JSON.parse(expected.SimplePost))
  })

  it('should use default version if not informed and not in postman variables', () => {
    expect(convert(JSON.parse(collections.NoVersion) as PostmanCollection)).toEqual(JSON.parse(expected.NoVersion))
  })

  it('should work with folders and use as tags', () => {
    expect(convert(JSON.parse(collections.Folders) as PostmanCollection)).toEqual(JSON.parse(expected.Folders))
  })

  it('should parse GET methods with query string', () => {
    expect(convert(JSON.parse(collections.GetMethods) as PostmanCollection)).toEqual(JSON.parse(expected.GetMethods))
  })

  it.skip('should parse HEADERS parameters', () => {
    expect(convert(JSON.parse(collections.Headers) as PostmanCollection)).toEqual(JSON.parse(expected.Headers))
  })

  it('should parse path params', () => {
    expect(convert(JSON.parse(collections.PathParams) as PostmanCollection)).toEqual(JSON.parse(expected.PathParams))
  })

  it('should parse servers from existing host in postman collection', () => {
    expect(convert(JSON.parse(collections.MultipleServers) as PostmanCollection)).toEqual(
      JSON.parse(expected.MultipleServers),
    )
  })

  it('should parse license and contact from variables', () => {
    expect(convert(JSON.parse(collections.LicenseContact) as PostmanCollection)).toEqual(
      JSON.parse(expected.LicenseContact),
    )
  })

  it('should parse status codes from test', () => {
    expect(convert(JSON.parse(collections.ParseStatusCode) as PostmanCollection)).toEqual(
      JSON.parse(expected.ParseStatusCode),
    )
  })

  it('should parse operation when no path (only domain)', () => {
    expect(convert(JSON.parse(collections.NoPath) as PostmanCollection)).toEqual(JSON.parse(expected.NoPath))
  })

  it('should support "DELETE" operations', () => {
    expect(convert(JSON.parse(collections.DeleteOperation) as PostmanCollection)).toEqual(
      JSON.parse(expected.DeleteOperation),
    )
  })

  it('should parse global authorization (Bearer)', () => {
    expect(convert(JSON.parse(collections.AuthBearer) as PostmanCollection)).toEqual(JSON.parse(expected.AuthBearer))
  })

  it('should parse global authorization (Basic)', () => {
    expect(convert(JSON.parse(collections.AuthBasic) as PostmanCollection)).toEqual(JSON.parse(expected.AuthBasic))
  })

  it('should parse url with port', () => {
    expect(convert(JSON.parse(collections.UrlWithPort) as PostmanCollection)).toEqual(JSON.parse(expected.UrlWithPort))
  })

  it('should parse external docs info from variables', () => {
    expect(convert(JSON.parse(collections.ExternalDocs) as PostmanCollection)).toEqual(
      JSON.parse(expected.ExternalDocs),
    )
  })

  it('should not transform empty url request', () => {
    expect(convert(JSON.parse(collections.EmptyUrl) as PostmanCollection)).toEqual(JSON.parse(expected.EmptyUrl))
  })

  it('should use "x-logo" from variables', () => {
    expect(convert(JSON.parse(collections.XLogo) as PostmanCollection)).toEqual(JSON.parse(expected.XLogoVar))
  })

  it('should support auth definition at request level', () => {
    expect(convert(JSON.parse(collections.AuthMultiple) as PostmanCollection)).toEqual(
      JSON.parse(expected.AuthMultiple),
    )
  })

  it('should work if auth only defined at request level', () => {
    expect(convert(JSON.parse(collections.AuthRequest) as PostmanCollection)).toEqual(JSON.parse(expected.AuthRequest))
  })

  it('should parse POST methods with form data', () => {
    expect(convert(JSON.parse(collections.FormData) as PostmanCollection)).toEqual(JSON.parse(expected.FormData))
  })

  it('should parse POST methods with www form urlencoded', () => {
    expect(convert(JSON.parse(collections.FormUrlencoded) as PostmanCollection)).toEqual(
      JSON.parse(expected.FormUrlencoded),
    )
  })

  it('should try to parse raw body as json but fallback to text', () => {
    expect(convert(JSON.parse(collections.RawBody) as PostmanCollection)).toEqual(JSON.parse(expected.RawBody))
  })

  it.skip('should not fail if response body is json but empty', () => {
    expect(convert(JSON.parse(collections.ResponsesEmpty) as PostmanCollection)).toEqual(
      JSON.parse(expected.ResponsesEmpty),
    )
  })

  it('should include `operationId` when `brackets` is selected', () => {
    expect(convert(JSON.parse(collections.OperationIds) as PostmanCollection)).toEqual(
      JSON.parse(expected.OperationIds),
    )
  })

  // fast follow with this test
  it.skip('should add responses from postman examples', () => {
    expect(convert(JSON.parse(collections.Responses) as PostmanCollection)).toEqual(JSON.parse(expected.Responses))
  })

  it('should parse nested servers instead of leaving the server empty', () => {
    expect(convert(JSON.parse(collections.NestedServers) as PostmanCollection)).toEqual(
      JSON.parse(expected.NestedServers),
    )
  })
})
