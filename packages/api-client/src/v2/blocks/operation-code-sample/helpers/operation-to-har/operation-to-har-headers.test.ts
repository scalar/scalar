import type { SecuritySchemeObjectSecret } from '@scalar/workspace-store/request-example'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { OperationObject, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { generateCodeSnippet } from '../generate-code-snippet'
import { operationToHar } from './operation-to-har'

describe('operation-to-har-headers', () => {
  it('includes header parameters in the generated HAR request', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'X-ONESOURCE-Client-Id',
          in: 'header',
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
          name: 'X-ONESOURCE-Client-Number',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
          examples: {
            'default': {
              value: 'ABC123',
            },
          },
        },
        {
          name: 'Authorization',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
          examples: {
            'default': {
              value: 'Bearer YOUR_SECRET_TOKEN',
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
      path: '/blueprints/{id}',
      includeDefaultHeaders: false,
    })

    expect(result.headers).toContainEqual({
      name: 'X-ONESOURCE-Client-Id',
      value: '1',
    })
    expect(result.headers).toContainEqual({
      name: 'X-ONESOURCE-Client-Number',
      value: 'ABC123',
    })
    expect(result.headers).toContainEqual({
      name: 'Authorization',
      value: 'Bearer YOUR_SECRET_TOKEN',
    })
  })

  it('includes header parameters when includeDefaultHeaders is true', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'X-ONESOURCE-Client-Id',
          in: 'header',
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
          name: 'X-ONESOURCE-Client-Number',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
          examples: {
            'default': {
              value: 'ABC123',
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
      path: '/blueprints/{id}',
      includeDefaultHeaders: true,
    })

    expect(result.headers).toContainEqual({
      name: 'X-ONESOURCE-Client-Id',
      value: '1',
    })
    expect(result.headers).toContainEqual({
      name: 'X-ONESOURCE-Client-Number',
      value: 'ABC123',
    })
  })

  it('includes both header parameters and security scheme headers', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'X-ONESOURCE-Client-Id',
          in: 'header',
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
          name: 'X-ONESOURCE-Client-Number',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
          examples: {
            'default': {
              value: 'ABC123',
            },
          },
        },
      ],
      security: [
        {
          bearerAuth: [],
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    }

    const securitySchemes: SecuritySchemeObjectSecret[] = [
      {
        type: 'http',
        scheme: 'bearer',
        'x-scalar-secret-token': 'test-token',
        'x-scalar-secret-username': '',
        'x-scalar-secret-password': '',
      },
    ]

    const result = operationToHar({
      operation,
      method: 'get',
      path: '/blueprints/{id}',
      securitySchemes,
      includeDefaultHeaders: false,
    })

    expect(result.headers).toContainEqual({
      name: 'X-ONESOURCE-Client-Id',
      value: '1',
    })
    expect(result.headers).toContainEqual({
      name: 'X-ONESOURCE-Client-Number',
      value: 'ABC123',
    })
    expect(result.headers).toContainEqual({
      name: 'Authorization',
      value: 'Bearer test-token',
    })
  })

  it('includes header parameters in POST requests with body', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'X-ONESOURCE-Client-Id',
          in: 'header',
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
          name: 'X-ONESOURCE-Client-Number',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
          examples: {
            'default': {
              value: 'ABC123',
            },
          },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'OK',
        },
      },
    }

    const result = operationToHar({
      operation,
      method: 'post',
      path: '/blueprints/{id}/custom-views',
      includeDefaultHeaders: false,
    })

    expect(result.headers).toContainEqual({
      name: 'X-ONESOURCE-Client-Id',
      value: '1',
    })
    expect(result.headers).toContainEqual({
      name: 'X-ONESOURCE-Client-Number',
      value: 'ABC123',
    })
    expect(result.headers).toContainEqual({
      name: 'Content-Type',
      value: 'application/json',
    })
  })

  it('generates curl snippet with header parameters when includeDefaultHeaders is false', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'X-ONESOURCE-Client-Id',
          in: 'header',
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
          name: 'X-ONESOURCE-Client-Number',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
          examples: {
            'default': {
              value: 'ABC123',
            },
          },
        },
        {
          name: 'Authorization',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
          examples: {
            'default': {
              value: 'Bearer YOUR_SECRET_TOKEN',
            },
          },
        },
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'integer',
          }),
          examples: {
            'default': {
              value: 46,
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
              }),
            },
          },
        },
      },
    }

    const server: ServerObject = {
      url: 'https://api.onesourcetrax.com/general-ledger-manager/v1',
    }

    const snippet = generateCodeSnippet({
      clientId: 'shell/curl',
      customCodeSamples: [],
      contentType: undefined,
      example: undefined,
      operation,
      method: 'get',
      path: '/blueprints/{id}',
      includeDefaultHeaders: false,
      server,
      securitySchemes: [],
    })

    expect(snippet).toContain("--header 'X-ONESOURCE-Client-Id: 1'")
    expect(snippet).toContain("--header 'X-ONESOURCE-Client-Number: ABC123'")
    expect(snippet).toContain("--header 'Authorization: Bearer YOUR_SECRET_TOKEN'")
    expect(snippet).toContain('/blueprints/46')
  })

  it('generates curl snippet with header parameters when includeDefaultHeaders is true', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'X-ONESOURCE-Client-Id',
          in: 'header',
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
          name: 'X-ONESOURCE-Client-Number',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
          examples: {
            'default': {
              value: 'ABC123',
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
              }),
            },
          },
        },
      },
    }

    const server: ServerObject = {
      url: 'https://api.example.com',
    }

    const snippet = generateCodeSnippet({
      clientId: 'shell/curl',
      customCodeSamples: [],
      contentType: undefined,
      example: undefined,
      operation,
      method: 'get',
      path: '/blueprints/{id}',
      includeDefaultHeaders: true,
      server,
      securitySchemes: [],
    })

    expect(snippet).toContain("--header 'X-ONESOURCE-Client-Id: 1'")
    expect(snippet).toContain("--header 'X-ONESOURCE-Client-Number: ABC123'")
    expect(snippet).toContain("--header 'Accept:")
  })

  it('generates curl snippet with header parameters when using a non-default example', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'X-ONESOURCE-Client-Id',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'integer',
          }),
          examples: {
            'default': {
              value: 1,
            },
            'custom': {
              value: 999,
            },
          },
        },
        {
          name: 'X-ONESOURCE-Client-Number',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
          examples: {
            'default': {
              value: 'ABC123',
            },
            'custom': {
              value: 'XYZ789',
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
      customCodeSamples: [],
      contentType: undefined,
      operation,
      method: 'get',
      path: '/blueprints/{id}',
      includeDefaultHeaders: false,
      server,
      securitySchemes: [],
      example: 'custom',
    })

    expect(snippet).toContain("--header 'X-ONESOURCE-Client-Id: 999'")
    expect(snippet).toContain("--header 'X-ONESOURCE-Client-Number: XYZ789'")
  })

  it('generates curl snippet with header parameters when parameter has schema default', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'X-ONESOURCE-Client-Id',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'integer',
            default: 42,
          }),
        },
        {
          name: 'X-ONESOURCE-Client-Number',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
            default: 'DEFAULT123',
          }),
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
      customCodeSamples: [],
      contentType: undefined,
      example: undefined,
      operation,
      method: 'get',
      path: '/blueprints/{id}',
      includeDefaultHeaders: false,
      server,
      securitySchemes: [],
    })

    expect(snippet).toContain("--header 'X-ONESOURCE-Client-Id: 42'")
    expect(snippet).toContain("--header 'X-ONESOURCE-Client-Number: DEFAULT123'")
  })

  it('generates curl snippet with header parameters when parameter has no example or default', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'X-ONESOURCE-Client-Id',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'integer',
          }),
        },
        {
          name: 'X-ONESOURCE-Client-Number',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
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
      customCodeSamples: [],
      contentType: undefined,
      example: undefined,
      operation,
      method: 'get',
      path: '/blueprints/{id}',
      includeDefaultHeaders: false,
      server,
      securitySchemes: [],
    })

    expect(snippet).toContain("--header 'X-ONESOURCE-Client-Id: 1'")
    expect(snippet).toContain("--header 'X-ONESOURCE-Client-Number:")
  })

  it('includes optional header parameters with examples in code snippets', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'X-ONESOURCE-Client-Id',
          in: 'header',
          required: false,
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
          name: 'X-ONESOURCE-Client-Number',
          in: 'header',
          required: false,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
          examples: {
            'default': {
              value: 'ABC123',
            },
          },
        },
        {
          name: 'Authorization',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
          examples: {
            'default': {
              value: 'Bearer YOUR_SECRET_TOKEN',
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
      customCodeSamples: [],
      contentType: undefined,
      example: undefined,
      operation,
      method: 'get',
      path: '/blueprints/{id}',
      includeDefaultHeaders: false,
      server,
      securitySchemes: [],
    })

    expect(snippet).toContain("--header 'X-ONESOURCE-Client-Id: 1'")
    expect(snippet).toContain("--header 'X-ONESOURCE-Client-Number: ABC123'")
    expect(snippet).toContain("--header 'Authorization: Bearer YOUR_SECRET_TOKEN'")
  })

  it('excludes optional header parameters without examples from code snippets', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'X-Optional-Header',
          in: 'header',
          required: false,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
        },
        {
          name: 'Authorization',
          in: 'header',
          required: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
          examples: {
            'default': {
              value: 'Bearer YOUR_SECRET_TOKEN',
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
      customCodeSamples: [],
      contentType: undefined,
      example: undefined,
      operation,
      method: 'get',
      path: '/test',
      includeDefaultHeaders: false,
      server,
      securitySchemes: [],
    })

    expect(snippet).not.toContain('X-Optional-Header')
    expect(snippet).toContain("--header 'Authorization: Bearer YOUR_SECRET_TOKEN'")
  })
})
