import type { RequestExample } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { createFetchHeaders } from './create-fetch-headers'

describe('createFetchHeaders', () => {
  it('creates headers from enabled parameters', () => {
    const example: Pick<RequestExample, 'parameters'> = {
      parameters: {
        path: [],
        query: [],
        cookies: [],
        headers: [
          { key: 'Authorization', value: 'Bearer {{token}}', enabled: true },
          { key: 'Content-Type', value: 'application/json', enabled: true },
          { key: 'X-Custom-Header', value: 'custom value', enabled: true },
          { key: 'Disabled-Header', value: 'disabled', enabled: false },
        ],
      },
    }

    const env = { token: '12345' }

    const result = createFetchHeaders(example, env)

    expect(result).toStrictEqual({
      'authorization': 'Bearer 12345',
      'content-type': 'application/json',
      'x-custom-header': 'custom value',
    })
  })

  it("doesn't include multipart/form-data Content-Type header", () => {
    const example: Pick<RequestExample, 'parameters'> = {
      parameters: {
        path: [],
        query: [],
        cookies: [],
        headers: [
          { key: 'Content-Type', value: 'multipart/form-data', enabled: true },
          { key: 'X-Custom-Header', value: 'custom value', enabled: true },
        ],
      },
    }

    const result = createFetchHeaders(example, {})

    expect(result).toStrictEqual({
      'x-custom-header': 'custom value',
    })
  })

  it('handles empty parameters', () => {
    const example: Pick<RequestExample, 'parameters'> = {
      parameters: {
        path: [],
        query: [],
        cookies: [],
        headers: [],
      },
    }

    const result = createFetchHeaders(example, {})

    expect(result).toStrictEqual({})
  })

  it('handles headers with mixed case characters', () => {
    const example: Pick<RequestExample, 'parameters'> = {
      parameters: {
        path: [],
        query: [],
        cookies: [],
        headers: [
          { key: 'X-sTrAnGe-HeAdEr', value: 'MixedCaseValue', enabled: true },
          { key: 'NoRmAl-HeAdEr', value: 'NormalValue', enabled: true },
        ],
      },
    }

    const result = createFetchHeaders(example, {})

    expect(result).toStrictEqual({
      'x-strange-header': 'MixedCaseValue',
      'normal-header': 'NormalValue',
    })
  })

  it('handles headers with trailing spaces', () => {
    const example: Pick<RequestExample, 'parameters'> = {
      parameters: {
        path: [],
        query: [],
        cookies: [],
        headers: [
          {
            key: 'X-Trailing-Space',
            value: 'value with space ',
            enabled: true,
          },
          {
            key: 'X-No-Trailing-Space',
            value: 'value without space',
            enabled: true,
          },
        ],
      },
    }

    const result = createFetchHeaders(example, {})

    expect(result).toStrictEqual({
      'x-trailing-space': 'value with space ',
      'x-no-trailing-space': 'value without space',
    })
  })

  it('handles headers with trailing spaces in the header name', () => {
    const example: Pick<RequestExample, 'parameters'> = {
      parameters: {
        path: [],
        query: [],
        cookies: [],
        headers: [
          {
            key: 'X-Trailing-Space-Header ',
            value: 'value',
            enabled: true,
          },
          {
            key: 'X-Normal-Header',
            value: 'normal value',
            enabled: true,
          },
        ],
      },
    }

    const result = createFetchHeaders(example, {})

    expect(result).toStrictEqual({
      'x-trailing-space-header': 'value',
      'x-normal-header': 'normal value',
    })
  })
})
