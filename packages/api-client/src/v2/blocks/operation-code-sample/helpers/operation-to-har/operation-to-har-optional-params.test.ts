import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { OperationObject, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { generateCodeSnippet } from '../generate-code-snippet'
import { operationToHar } from './operation-to-har'

describe('operation-to-har-optional-params', () => {
  it('includes optional query parameters with examples in code snippets', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'filter',
          in: 'query',
          required: false,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
          examples: {
            'default': {
              value: 'active',
            },
          },
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'integer',
          }),
          examples: {
            'default': {
              value: 10,
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    }

    const result = operationToHar({
      operation,
      method: 'get',
      path: '/users',
      includeDefaultHeaders: false,
    })

    expect(result.queryString).toContainEqual({
      name: 'filter',
      value: 'active',
    })
    expect(result.queryString).toContainEqual({
      name: 'limit',
      value: '10',
    })
  })

  it('excludes optional query parameters without examples from code snippets', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'filter',
          in: 'query',
          required: false,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
        },
        {
          name: 'limit',
          in: 'query',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'integer',
          }),
          examples: {
            'default': {
              value: 10,
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    }

    const result = operationToHar({
      operation,
      method: 'get',
      path: '/users',
      includeDefaultHeaders: false,
    })

    expect(result.queryString).not.toContainEqual(
      expect.objectContaining({
        name: 'filter',
      }),
    )
    expect(result.queryString).toContainEqual({
      name: 'limit',
      value: '10',
    })
  })

  it('includes optional cookie parameters with examples', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'session',
          in: 'cookie',
          required: false,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
          examples: {
            'default': {
              value: 'abc123',
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    }

    const result = operationToHar({
      operation,
      method: 'get',
      path: '/users',
      includeDefaultHeaders: false,
    })

    expect(result.cookies).toContainEqual({
      name: 'session',
      value: 'abc123',
    })
  })

  it('includes optional parameters with schema defaults even without examples', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'X-Custom-Header',
          in: 'header',
          required: false,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
            default: 'default-value',
          }),
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    }

    const result = operationToHar({
      operation,
      method: 'get',
      path: '/users',
      includeDefaultHeaders: false,
    })

    expect(result.headers).toContainEqual({
      name: 'X-Custom-Header',
      value: 'default-value',
    })
  })

  it('generates curl snippet with mixed required and optional parameters', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
          examples: {
            'default': {
              value: 'Bearer token',
            },
          },
        },
        {
          name: 'X-Optional-Header',
          in: 'header',
          required: false,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
          examples: {
            'default': {
              value: 'optional-value',
            },
          },
        },
        {
          name: 'page',
          in: 'query',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'integer',
          }),
          examples: {
            'default': {
              value: 1,
            },
          },
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'integer',
          }),
          examples: {
            'default': {
              value: 20,
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    }

    const server: ServerObject = {
      url: 'https://api.example.com',
    }

    const snippet = generateCodeSnippet({
      clientId: 'shell/curl',
      operation,
      method: 'get',
      path: '/users',
      includeDefaultHeaders: false,
      server,
      securitySchemes: [],
    })

    expect(snippet).toContain("--header 'Authorization: Bearer token'")
    expect(snippet).toContain("--header 'X-Optional-Header: optional-value'")
    expect(snippet).toContain('page=1')
    expect(snippet).toContain('limit=20')
  })
})
