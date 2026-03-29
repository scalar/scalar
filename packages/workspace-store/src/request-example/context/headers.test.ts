import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getDefaultHeaders } from './headers'

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
      exampleName: 'example-1',
    })

    const contentTypeHeader = headers['content-type']
    expect(contentTypeHeader).toBeUndefined()
  })

  it('adds Content-Type header for POST requests when the request body defines one', () => {
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
      exampleName: 'example-1',
    })

    const contentTypeHeader = headers['content-type']
    expect(contentTypeHeader).toBeDefined()
    expect(contentTypeHeader).toBe('application/json')
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
      exampleName: 'example-1',
    })

    const contentTypeHeader = headers['content-type']
    expect(contentTypeHeader).toBeDefined()
    expect(contentTypeHeader).toBe('application/xml')
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
      exampleName: 'example-1',
    })

    const contentTypeHeader = headers['content-type']
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
      exampleName: 'example-1',
    })

    const contentTypeHeader = headers['content-type']

    expect(contentTypeHeader).toBeDefined()
    expect(contentTypeHeader).toBe('application/json')
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
      exampleName: 'example-1',
    })

    const contentTypeHeader = headers['content-type']
    expect(contentTypeHeader).toBeDefined()
    expect(contentTypeHeader).toBe('application/json')
  })

  it('always adds Accept header, falling back to wildcard when no responses are defined', () => {
    const operation: OperationObject = {}

    const headers = getDefaultHeaders({
      method: 'get',
      operation,
      exampleName: 'example-1',
    })

    const acceptHeader = headers['accept']
    expect(acceptHeader).toBeDefined()
    expect(acceptHeader).toBe('*/*')
  })

  it('derives Accept header from the 2xx response content type', () => {
    const operation: OperationObject = {
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {},
          },
        },
      },
    }

    const headers = getDefaultHeaders({
      method: 'get',
      operation,
      exampleName: 'example-1',
    })

    const acceptHeader = headers['accept']
    expect(acceptHeader).toBe('application/json')
  })

  it('joins all content types of the 2xx response when multiple are defined', () => {
    const operation: OperationObject = {
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {},
            'application/xml': {},
          },
        },
      },
    }

    const headers = getDefaultHeaders({
      method: 'get',
      operation,
      exampleName: 'example-1',
    })

    const acceptHeader = headers['accept']
    expect(acceptHeader).toBe('application/json, application/xml')
  })

  it('falls back to wildcard when the 2xx response has no content', () => {
    const operation: OperationObject = {
      responses: {
        '204': {
          description: 'No Content',
        },
      },
    }

    const headers = getDefaultHeaders({
      method: 'delete',
      operation,
      exampleName: 'example-1',
    })

    const acceptHeader = headers['accept']
    expect(acceptHeader).toBe('*/*')
  })

  it('falls back to wildcard when only non-2xx responses are defined', () => {
    const operation: OperationObject = {
      responses: {
        '400': {
          description: 'Bad Request',
          content: { 'application/json': {} },
        },
        '500': {
          description: 'Internal Server Error',
          content: { 'application/json': {} },
        },
      },
    }

    const headers = getDefaultHeaders({
      method: 'get',
      operation,
      exampleName: 'example-1',
    })

    const acceptHeader = headers['accept']
    expect(acceptHeader).toBe('*/*')
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
      exampleName: 'example-1',
      hideDisabledHeaders: true,
    })

    const acceptHeader = headers['accept']

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
      exampleName: 'example-1',
      hideDisabledHeaders: false,
    })

    const acceptHeader = headers['accept']
    expect(acceptHeader).toBeDefined()
  })

  it('handles operation with no requestBody', () => {
    const operation: OperationObject = {}

    const headers = getDefaultHeaders({
      method: 'post',
      operation,
      exampleName: 'example-1',
    })

    // Should still have Accept header, but no Content-Type since there's no requestBody
    expect(Object.keys(headers).length).toBeGreaterThan(0)
    const acceptHeader = headers['accept']
    const contentTypeHeader = headers['content-type']
    expect(acceptHeader).toBeDefined()
    expect(contentTypeHeader).toBeUndefined()
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
      exampleName: 'example-1',
    })

    const contentTypeHeader = headers['content-type']

    expect(contentTypeHeader).toBeDefined()
    // Should use the first key in the content object
    expect(contentTypeHeader).toBe('application/xml')
  })

  it('does not add Content-Type when the requestBody has no content types', () => {
    const operation: OperationObject = {
      requestBody: {
        content: {},
      },
    }

    const headers = getDefaultHeaders({
      method: 'post',
      operation,
      exampleName: 'example-1',
    })

    const contentTypeHeader = headers['content-type']

    expect(contentTypeHeader).toBeUndefined()
  })

  it('does not add Content-Type for DELETE requests without a request body', () => {
    const operation: OperationObject = {
      responses: {
        '200': {
          description: 'Delete Success',
          content: {
            'application/json': {},
          },
        },
      },
    }

    const headers = getDefaultHeaders({
      method: 'delete',
      operation,
      exampleName: 'example-1',
    })

    const contentTypeHeader = headers['content-type']

    expect(contentTypeHeader).toBeUndefined()
  })
})
