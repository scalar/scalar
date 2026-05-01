# Scalar Typescript Type to OpenAPI Spec Converter

[![Version](https://img.shields.io/npm/v/%40scalar/type-to-openapi)](https://www.npmjs.com/package/@scalar/type-to-openapi)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/type-to-openapi)](https://www.npmjs.com/package/@scalar/type-to-openapi)
[![License](https://img.shields.io/npm/l/%40scalar%type-to-openapi)](https://www.npmjs.com/package/@scalar/type-to-openapi)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

This an extremely early version of a typescript type to OpenAPI document converter. The goal is to take types that one
would normally use when developing an API and convert them to an OpenAPI document which will then be used to power the
standalone Scalar API References.

This package is not meant to be used directly, but will be the core technology behind framework specific integrations.

## Fastify examples

Fastify route generics can be converted into OpenAPI paths. Fastify `schema` values are preferred when present because
they include validation keywords such as `required`, `format`, and `minLength`.

```ts
import { generateFastifyOpenApiDocument } from '@scalar/ts-to-openapi'

fastify.post<{
  Body: {
    name: string
    email: string
  }
  Reply: {
    201: {
      id: string
      name: string
      email: string
    }
  }
}>(
  '/users',
  {
    schema: {
      summary: 'Create a user',
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
        },
        required: ['name', 'email'],
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
          required: ['id', 'name', 'email'],
        },
      },
    },
  },
  async (request) => ({
    id: 'user-1',
    name: request.body.name,
    email: request.body.email,
  }),
)
```

Routes without Fastify validation schemas can still be described from their route generic input and response types:

```ts
fastify.post<{
  Body: {
    name: string
    email: string
    role: 'admin' | 'member'
  }
  Querystring: {
    invite?: boolean
  }
  Headers: {
    'x-tenant': string
  }
  Reply: {
    201: {
      id: string
      role: 'admin' | 'member'
    }
    400: {
      error: string
    }
  }
}>('/typed-users', async (request) => ({
  id: 'user-2',
  role: request.body.role,
}))
```

The same extraction supports `fastify.route` declarations:

```ts
fastify.route<{
  Body: {
    enabled: boolean
  }
  Reply: {
    204: null
  }
}>({
  method: 'PATCH',
  url: '/users/:id/settings',
  schema: {
    summary: 'Update user settings',
    body: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
      },
      required: ['enabled'],
    },
    response: {
      204: {
        description: 'Settings updated',
      },
    },
  },
  handler: async () => null,
})
```
