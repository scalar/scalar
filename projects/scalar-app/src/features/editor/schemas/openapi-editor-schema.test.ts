import { createValidator } from '@scalar/json-schema-validator'
import { describe, expect, it } from 'vitest'
import { stringify } from 'yaml'

import { openApiEditorSchema } from './openapi-editor-schema'

describe('openapi-editor-schema', () => {
  const validate = createValidator(openApiEditorSchema, { formats: { 'media-range': true } })
  const document = {
    openapi: '3.2.0',
    info: { title: 'Example', version: '1.0.0' },
    $self: 'https://example.com/openapi.yaml',
    servers: [{ url: 'https://example.com', name: 'Production' }],
    tags: [{ name: 'users', summary: 'Users', parent: 'accounts', kind: 'nav' }],
    paths: {
      '/users': {
        query: {
          parameters: [{ name: 'filter', in: 'querystring', content: { 'application/json': { schema: {} } } }],
          responses: {
            '200': {
              summary: 'User stream',
              content: { 'application/jsonl': { itemSchema: { type: 'object' } } },
            },
          },
        },
        additionalOperations: { COPY: { responses: { '204': { summary: 'Copied' } } } },
      },
    },
  }

  it('accepts OpenAPI 3.2 fields in JSON and YAML documents', () => {
    expect(validate(JSON.stringify(document))).toEqual({ valid: true, errors: [] })
    expect(validate(stringify(document))).toEqual({ valid: true, errors: [] })
  })

  it('accepts existing OpenAPI 3.1 documents', () => {
    expect(validate({ openapi: '3.1.1', info: document.info, paths: {} })).toEqual({ valid: true, errors: [] })
  })

  it('still rejects invalid OpenAPI 3.2 field values', () => {
    expect(validate({ ...document, servers: [{ url: 'https://example.com', name: 42 }] }).valid).toBe(false)
  })

  it('allows path extensions while rejecting paths without a leading slash', () => {
    expect(validate({ ...document, paths: { 'x-description': 'Example' } })).toEqual({ valid: true, errors: [] })
    expect(validate({ ...document, paths: { users: {} } }).valid).toBe(false)
  })
})
