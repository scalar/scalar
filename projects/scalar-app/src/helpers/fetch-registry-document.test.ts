import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchRegistryDocument } from './fetch-registry-document'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

/**
 * The SDK call is `registry.retrieveAPIDocumentVersion(...).withResponse()`,
 * so the mock returns an object exposing `withResponse`. Tests drive its
 * resolved value to pin the new response contract: body on `.data`, version
 * hash on `response.response.headers`.
 */
const { retrieveAPIDocumentVersion } = vi.hoisted(() => ({ retrieveAPIDocumentVersion: vi.fn() }))

vi.mock('@/helpers/scalar-client', () => ({
  scalarClient: {
    registry: {
      retrieveAPIDocumentVersion,
    },
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validDocument = { openapi: '3.1.0', info: { title: 'Test', version: '1.0.0' }, paths: {} }

/** Builds a `withResponse()` result with an optional version-sha header. */
const mockResponse = (data: unknown, versionSha?: string) => {
  const headers = new Headers()
  if (versionSha !== undefined) {
    headers.set('x-scalar-version-sha', versionSha)
  }
  retrieveAPIDocumentVersion.mockReturnValue({
    withResponse: () => Promise.resolve({ data, response: { headers } }),
  })
}

/** Builds a rejected SDK call. */
const mockRejection = (error: unknown) => {
  retrieveAPIDocumentVersion.mockReturnValue({
    withResponse: () => Promise.reject(error),
  })
}

describe('fetch-registry-document', () => {
  beforeEach(() => {
    retrieveAPIDocumentVersion.mockReset()
  })

  it('parses the document from `response.data` and reads the version sha from the header', async () => {
    mockResponse(JSON.stringify(validDocument), 'abc123')

    const result = await fetchRegistryDocument({ namespace: 'ns', slug: 'my-api', version: '1.0.0' })

    expect(result).toEqual({ ok: true, data: { document: validDocument, versionSha: 'abc123' } })
  })

  it('passes namespace, slug, and version as positional arguments', async () => {
    mockResponse(JSON.stringify(validDocument), 'abc123')

    await fetchRegistryDocument({ namespace: 'ns', slug: 'my-api', version: '2.1.0' })

    expect(retrieveAPIDocumentVersion).toHaveBeenCalledWith('ns', 'my-api', '2.1.0')
  })

  it('defaults the version to "latest" when none is provided', async () => {
    mockResponse(JSON.stringify(validDocument), 'abc123')

    await fetchRegistryDocument({ namespace: 'ns', slug: 'my-api' })

    expect(retrieveAPIDocumentVersion).toHaveBeenCalledWith('ns', 'my-api', 'latest')
  })

  it('leaves versionSha undefined when the header is absent', async () => {
    mockResponse(JSON.stringify(validDocument))

    const result = await fetchRegistryDocument({ namespace: 'ns', slug: 'my-api', version: 'latest' })

    expect(result).toEqual({ ok: true, data: { document: validDocument, versionSha: undefined } })
  })

  it('returns UNKNOWN when the body is not a string', async () => {
    mockResponse(undefined)

    const result = await fetchRegistryDocument({ namespace: 'ns', slug: 'my-api', version: 'latest' })

    expect(result).toEqual({ ok: false, error: 'UNKNOWN', message: 'Registry returned an empty document body' })
  })

  it('returns UNKNOWN when the body parses to a non-object', async () => {
    mockResponse(JSON.stringify(42))

    const result = await fetchRegistryDocument({ namespace: 'ns', slug: 'my-api', version: 'latest' })

    expect(result).toEqual({ ok: false, error: 'UNKNOWN', message: 'Cannot parse document from registry' })
  })

  it('maps a 404 rejection to NOT_FOUND', async () => {
    mockRejection({ status: 404 })

    const result = await fetchRegistryDocument({ namespace: 'ns', slug: 'missing', version: 'latest' })

    expect(result).toMatchObject({ ok: false, error: 'NOT_FOUND' })
  })

  it('maps a 401 rejection to UNAUTHORIZED', async () => {
    mockRejection({ status: 401 })

    const result = await fetchRegistryDocument({ namespace: 'ns', slug: 'my-api', version: 'latest' })

    expect(result).toMatchObject({ ok: false, error: 'UNAUTHORIZED' })
  })
})
