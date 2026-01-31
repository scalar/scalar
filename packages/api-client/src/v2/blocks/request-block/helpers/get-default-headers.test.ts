import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getDefaultHeaders } from './get-default-headers'

describe('get-default-headers', () => {
  describe('getDefaultHeaders', () => {
    it('does not add Content-Type header when contentType is "none"', () => {
      const operation: OperationObject = {
        requestBody: {
          'x-scalar-selected-content-type': {
            'example-1': 'none',
          },
          content: {},
        },
      }

      const headers = getDefaultHeaders({
        method: 'post',
        operation,
        exampleKey: 'example-1',
      })

      const contentTypeHeader = headers.find((header) => header.name.toLowerCase() === 'content-type')

      expect(contentTypeHeader).toBeUndefined()
    })

    it('adds Content-Type header for POST requests with default application/json', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {},
          },
        },
      }

      const headers = getDefaultHeaders({
        method: 'post',
        operation,
        exampleKey: 'example-1',
      })

      const contentTypeHeader = headers.find((header) => header.name.toLowerCase() === 'content-type')

      expect(contentTypeHeader).toBeDefined()
      expect(contentTypeHeader?.defaultValue).toBe('application/json')
      expect(contentTypeHeader?.isOverridden).toBe(false)
    })

    it('uses selected content type from x-scalar-selected-content-type', () => {
      const operation: OperationObject = {
        requestBody: {
          'x-scalar-selected-content-type': {
            'example-1': 'application/xml',
          },
          content: {
            'application/json': {},
            'application/xml': {},
          },
        },
      }

      const headers = getDefaultHeaders({
        method: 'post',
        operation,
        exampleKey: 'example-1',
      })

      const contentTypeHeader = headers.find((header) => header.name.toLowerCase() === 'content-type')

      expect(contentTypeHeader).toBeDefined()
      expect(contentTypeHeader?.defaultValue).toBe('application/xml')
    })

    it('does not add Content-Type for GET requests', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {},
          },
        },
      }

      const headers = getDefaultHeaders({
        method: 'get',
        operation,
        exampleKey: 'example-1',
      })

      const contentTypeHeader = headers.find((header) => header.name.toLowerCase() === 'content-type')

      expect(contentTypeHeader).toBeUndefined()
    })

    it('adds Content-Type for PUT requests', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {},
          },
        },
      }

      const headers = getDefaultHeaders({
        method: 'put',
        operation,
        exampleKey: 'example-1',
      })

      const contentTypeHeader = headers.find((header) => header.name.toLowerCase() === 'content-type')

      expect(contentTypeHeader).toBeDefined()
      expect(contentTypeHeader?.defaultValue).toBe('application/json')
    })

    it('adds Content-Type for PATCH requests', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {},
          },
        },
      }

      const headers = getDefaultHeaders({
        method: 'patch',
        operation,
        exampleKey: 'example-1',
      })

      const contentTypeHeader = headers.find((header) => header.name.toLowerCase() === 'content-type')

      expect(contentTypeHeader).toBeDefined()
      expect(contentTypeHeader?.defaultValue).toBe('application/json')
    })

    it('always adds Accept header', () => {
      const operation: OperationObject = {}

      const headers = getDefaultHeaders({
        method: 'get',
        operation,
        exampleKey: 'example-1',
      })

      const acceptHeader = headers.find((header) => header.name.toLowerCase() === 'accept')

      expect(acceptHeader).toBeDefined()
      expect(acceptHeader?.defaultValue).toBe('*/*')
      expect(acceptHeader?.isOverridden).toBe(false)
    })

    it('marks header as overridden when defined in operation parameters', () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: 'Accept',
            in: 'header',
            schema: { type: 'string' },
          },
        ],
      }

      const headers = getDefaultHeaders({
        method: 'get',
        operation,
        exampleKey: 'example-1',
      })

      const acceptHeader = headers.find((header) => header.name.toLowerCase() === 'accept')

      expect(acceptHeader).toBeDefined()
      expect(acceptHeader?.isOverridden).toBe(true)
    })

    it('filters out disabled headers when hideDisabledHeaders is true', () => {
      const operation: OperationObject = {
        'x-scalar-disable-parameters': {
          'default-headers': {
            'example-1': {
              accept: true,
            },
          },
        },
      }

      const headers = getDefaultHeaders({
        method: 'get',
        operation,
        exampleKey: 'example-1',
        hideDisabledHeaders: true,
      })

      const acceptHeader = headers.find((header) => header.name.toLowerCase() === 'accept')

      expect(acceptHeader).toBeUndefined()
    })

    it('includes disabled headers when hideDisabledHeaders is false', () => {
      const operation: OperationObject = {
        'x-scalar-disable-parameters': {
          'default-headers': {
            'example-1': {
              accept: true,
            },
          },
        },
      }

      const headers = getDefaultHeaders({
        method: 'get',
        operation,
        exampleKey: 'example-1',
        hideDisabledHeaders: false,
      })

      const acceptHeader = headers.find((header) => header.name.toLowerCase() === 'accept')

      expect(acceptHeader).toBeDefined()
    })

    it('handles operation with no requestBody', () => {
      const operation: OperationObject = {}

      const headers = getDefaultHeaders({
        method: 'post',
        operation,
        exampleKey: 'example-1',
      })

      // Should still have Accept header, but no Content-Type since there's no requestBody
      expect(headers.length).toBeGreaterThan(0)
      const acceptHeader = headers.find((header) => header.name.toLowerCase() === 'accept')
      expect(acceptHeader).toBeDefined()
    })

    it('uses first content type when no selection is made', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/xml': {},
            'application/json': {},
          },
        },
      }

      const headers = getDefaultHeaders({
        method: 'post',
        operation,
        exampleKey: 'example-1',
      })

      const contentTypeHeader = headers.find((header) => header.name.toLowerCase() === 'content-type')

      expect(contentTypeHeader).toBeDefined()
      // Should use the first key in the content object
      expect(contentTypeHeader?.defaultValue).toBe('application/xml')
    })

    it('handles empty content object', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {},
        },
      }

      const headers = getDefaultHeaders({
        method: 'post',
        operation,
        exampleKey: 'example-1',
      })

      const contentTypeHeader = headers.find((header) => header.name.toLowerCase() === 'content-type')

      // Should fall back to default application/json
      expect(contentTypeHeader).toBeDefined()
      expect(contentTypeHeader?.defaultValue).toBe('application/json')
    })
  })
})
