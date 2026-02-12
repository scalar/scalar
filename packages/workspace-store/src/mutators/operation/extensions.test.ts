import { describe, expect, it } from 'vitest'

import type { WorkspaceDocument } from '@/schemas'

import { updateOperationExtension } from './extensions'

const createDocument = (initial?: Partial<WorkspaceDocument>): WorkspaceDocument => {
  return {
    openapi: '3.1.0',
    info: { title: 'Test', version: '1.0.0' },
    ...initial,
    'x-scalar-original-document-hash': '123',
  }
}

describe('updateOperationExtension', () => {
  it('adds a new extension to an existing operation', () => {
    const document = createDocument({
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
          },
        },
      },
    })

    updateOperationExtension(document, {
      meta: { method: 'get', path: '/users' },
      payload: { 'x-post-response': 'console.log(response)' },
    })

    expect(document.paths?.['/users']?.get?.['x-post-response']).toBe('console.log(response)')
  })

  it('overwrites an existing extension value', () => {
    const document = createDocument({
      paths: {
        '/users': {
          get: {
            'x-post-response': 'console.log(old)',
          },
        },
      },
    })

    updateOperationExtension(document, {
      meta: { method: 'get', path: '/users' },
      payload: { 'x-post-response': 'console.log(new)' },
    })

    expect(document.paths?.['/users']?.get?.['x-post-response']).toBe('console.log(new)')
  })

  it('deep merges extension objects without dropping existing nested keys', () => {
    const document = createDocument({
      paths: {
        '/users': {
          get: {
            'x-scalar-config': {
              retries: 1,
              nested: {
                enabled: true,
                mode: 'strict',
              },
            },
          },
        },
      },
    })

    updateOperationExtension(document, {
      meta: { method: 'get', path: '/users' },
      payload: {
        'x-scalar-config': {
          nested: {
            mode: 'loose',
          },
        },
      },
    })

    expect(document.paths?.['/users']?.get?.['x-scalar-config']).toEqual({
      retries: 1,
      nested: {
        enabled: true,
        mode: 'loose',
      },
    })
  })

  it('updates the dereferenced operation when the path method node is a $ref', () => {
    const document = createDocument({
      paths: {
        '/users': {
          get: {
            $ref: '#/components/pathItems/UsersGet',
            '$ref-value': {
              summary: 'Get users',
            },
          },
        },
      },
    })

    updateOperationExtension(document, {
      meta: { method: 'get', path: '/users' },
      payload: { 'x-post-response': 'console.log(ref)' },
    })

    const operationRef = document.paths?.['/users']?.get
    if (typeof operationRef === 'object' && operationRef !== null && '$ref-value' in operationRef) {
      expect(operationRef['$ref-value']?.['x-post-response']).toBe('console.log(ref)')
      return
    }

    throw new Error('Expected a $ref operation in test setup')
  })

  it('no-ops when document is null or operation does not exist', () => {
    expect(() =>
      updateOperationExtension(null, {
        meta: { method: 'get', path: '/users' },
        payload: { 'x-post-response': 'console.log(response)' },
      }),
    ).not.toThrow()

    const document = createDocument({
      paths: {
        '/users': {},
      },
    })

    updateOperationExtension(document, {
      meta: { method: 'get', path: '/users' },
      payload: { 'x-post-response': 'console.log(response)' },
    })

    expect(document.paths?.['/users']).toEqual({})
  })
})
