import { beforeAll, describe, expect, it } from 'vitest'

import { convert } from './convert'
import type { PostmanCollection } from './types'

const bucketName = 'scalar-test-fixtures'
const BASE_URL = `https://storage.googleapis.com/${bucketName}`

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
