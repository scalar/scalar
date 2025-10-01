import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type {
  OperationObject,
  SecuritySchemeObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { bench, describe } from 'vitest'

import { operationToHar } from './operation-to-har'

/**
 * Benchmarks for operationToHar with large complex payloads.
 *
 * Goal: stress request building with heavy request bodies, numerous parameters,
 * and multiple security schemes, without spending time constructing data inside
 * the measured function. All large inputs are constructed ahead of time.
 */

// Shared server config
const server: ServerObject = {
  url: 'https://api.example.com/v1',
}

// Shared security schemes to exercise headers/query/cookies and http auth
const complexSecuritySchemes: readonly SecuritySchemeObject[] = [
  {
    type: 'http',
    scheme: 'bearer',
    'x-scalar-secret-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.large.token.payload',
    'x-scalar-secret-username': '',
    'x-scalar-secret-password': '',
  },
  {
    type: 'apiKey',
    in: 'query',
    name: 'api_key',
    'x-scalar-secret-token': 'QUERY_API_KEY_VALUE',
  },
  {
    type: 'apiKey',
    in: 'header',
    name: 'X-Client-Id',
    'x-scalar-secret-token': 'CLIENT-1234567890',
  },
  {
    type: 'http',
    scheme: 'basic',
    'x-scalar-secret-username': 'benchuser',
    'x-scalar-secret-password': 'verylongpasswordvalue',
    'x-scalar-secret-token': '',
  },
] as const

// Large deeply nested JSON example to avoid schema generation cost during bench
const largeJsonExample: Record<string, unknown> = {
  id: 'user_12345',
  profile: {
    name: {
      first: 'Ada',
      middle: 'Lovelace',
      last: 'Byron',
    },
    contacts: Array.from({ length: 50 }).map((_, i) => ({
      type: i % 2 === 0 ? 'email' : 'phone',
      value: i % 2 === 0 ? `user${i}@example.com` : `+1-555-000-${String(i).padStart(4, '0')}`,
      preferred: i % 10 === 0,
    })),
    addresses: Array.from({ length: 20 }).map((_, i) => ({
      kind: i % 2 === 0 ? 'shipping' : 'billing',
      line1: `123${i} Long Street Name Apt ${i}`,
      line2: i % 3 === 0 ? `Suite ${i}` : undefined,
      city: 'Metropolis',
      state: 'NY',
      postalCode: `100${String(i).padStart(2, '0')}`,
      country: 'US',
      coordinates: { lat: 40.7128 + i / 1000, lng: -74.006 + i / 1000 },
    })),
    preferences: {
      theme: 'dark',
      notifications: {
        email: true,
        sms: false,
        push: true,
        topics: {
          marketing: false,
          product: true,
          security: true,
          newsletters: Array.from({ length: 30 }).map((_, i) => ({ id: `nl_${i}`, subscribed: i % 3 !== 0 })),
        },
      },
    },
  },
  orders: Array.from({ length: 100 }).map((_, i) => ({
    orderId: `ord_${String(i).padStart(5, '0')}`,
    status: ['pending', 'shipped', 'delivered', 'returned'][i % 4],
    items: Array.from({ length: 10 }).map((__, j) => ({
      sku: `SKU-${i}-${j}`,
      name: `Product ${i}-${j}`,
      price: 19.99 + j,
      quantity: (j % 3) + 1,
      attributes: {
        color: ['red', 'green', 'blue'][j % 3],
        size: ['S', 'M', 'L', 'XL'][j % 4],
        warrantyMonths: 12 + (j % 6),
      },
    })),
    totals: {
      subtotal: 199.99 + i,
      tax: 19.99 + i / 10,
      shipping: i % 2 === 0 ? 0 : 9.99,
      discount: i % 5 === 0 ? 5.0 : 0,
      currency: 'USD',
    },
    placedAt: new Date(1700000000000 + i * 1000).toISOString(),
  })),
  metadata: Object.fromEntries(Array.from({ length: 200 }).map((_, i) => [`key_${i}`, `value_${i}`])),
}

// Operation with many parameters exercising styles/explode across path/query/header/cookie
const operationJson: OperationObject = {
  parameters: [
    // path styles
    { in: 'path', name: 'userId', required: true, schema: { type: 'string' } },
    { in: 'path', name: 'filters', style: 'matrix', explode: false, required: false, schema: { type: 'object' } },
    {
      in: 'path',
      name: 'labels',
      style: 'label',
      explode: true,
      required: false,
      schema: { type: 'array', items: { type: 'string' } },
    },
    // query styles
    { in: 'query', name: 'tags', style: 'form', explode: true, schema: { type: 'array', items: { type: 'string' } } },
    {
      in: 'query',
      name: 'rgb',
      style: 'form',
      explode: false,
      schema: { type: 'object', additionalProperties: { type: 'integer' } },
    },
    { in: 'query', name: 'matrix', style: 'pipeDelimited', schema: { type: 'array', items: { type: 'string' } } },
    { in: 'query', name: 'space', style: 'spaceDelimited', schema: { type: 'array', items: { type: 'string' } } },
    {
      in: 'query',
      name: 'deep',
      style: 'deepObject',
      explode: true,
      schema: { type: 'object', additionalProperties: { type: 'string' } },
    },
    // header
    { in: 'header', name: 'X-Features', schema: { type: 'array', items: { type: 'string' } }, explode: false },
    // cookie
    {
      in: 'cookie',
      name: 'prefs',
      schema: { type: 'object', additionalProperties: { type: 'string' } },
      explode: true,
    },
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          additionalProperties: true,
        },
        example: largeJsonExample,
      },
    },
  },
  responses: {},
} satisfies OperationObject

describe('bench:operationToHar with large complex payloads', () => {
  const operationForm: OperationObject = {
    parameters: operationJson.parameters,
    requestBody: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
        },
      },
    },
    responses: {},
  } satisfies OperationObject

  bench('large JSON + multipart/form-data bodies with many params and security', () => {
    const method: HttpMethod = 'post'
    // JSON body
    operationToHar({
      operation: operationJson,
      method,
      path: '/users/{userId}/orders/{.labels}/{;filters}',
      server,
      securitySchemes: [...complexSecuritySchemes],
      contentType: 'application/json',
    })

    // multipart/form-data body
    operationToHar({
      operation: operationForm,
      method,
      path: '/users/{userId}/profile/{.labels}/{;filters}',
      server,
      securitySchemes: [...complexSecuritySchemes],
      contentType: 'multipart/form-data',
    })
  })
})
