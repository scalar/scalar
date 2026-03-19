import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/request-body'
import { describe, expect, it } from 'vitest'

import { getSelectedBodyContentType } from './get-selected-body-content-type'

describe('getSelectedBodyContentType', () => {
  it('returns the custom selected content type when x-scalar-selected-content-type is set', () => {
    const requestBody: RequestBodyObject = {
      content: {
        'application/json': {},
        'application/xml': {},
      },
      'x-scalar-selected-content-type': {
        default: 'application/xml',
      },
    }

    const result = getSelectedBodyContentType(requestBody, 'default')

    expect(result).toBe('application/xml')
  })

  it('returns the first content type key when no custom selection is set', () => {
    const requestBody: RequestBodyObject = {
      content: {
        'application/json': {},
        'text/plain': {},
      },
    }

    const result = getSelectedBodyContentType(requestBody)

    expect(result).toBe('application/json')
  })

  it('returns null when request body has no content types', () => {
    const requestBody: RequestBodyObject = {
      content: {},
    }

    const result = getSelectedBodyContentType(requestBody)

    expect(result).toBe(null)
  })

  it('returns null when request body is undefined', () => {
    const result = getSelectedBodyContentType(undefined)

    expect(result).toBe(null)
  })
})
