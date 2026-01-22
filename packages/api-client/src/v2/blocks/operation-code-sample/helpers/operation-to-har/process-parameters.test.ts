import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Request as HarRequest } from 'har-format'
import { describe, expect, it } from 'vitest'

import { processParameters } from './process-parameters'

describe('parameter styles', () => {
  const createHarRequest = (url: string): HarRequest => ({
    url,
    method: 'get',
    headers: [],
    queryString: [],
    httpVersion: 'HTTP/1.1',
    cookies: [],
    headersSize: 0,
    bodySize: 0,
  })

  describe('matrix style', () => {
    it('should handle matrix style with explode=false and single value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users{;color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'matrix',
            explode: false,
            examples: {
              blue: {
                value: 'blue',
              },
            },
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
            }),
          },
        ],
        example: 'blue',
      })

      expect(result.url).toBe('/api/users;color=blue')
    })

    it('should handle matrix style with explode=false and array values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users{;color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'matrix',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'string' },
              example: ['blue', 'black', 'brown'],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users;color=blue,black,brown')
    })

    it('should handle matrix style with explode=false and object values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users{;color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'matrix',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
              example: { R: 100, G: 200, B: 150 },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users;color=R,100,G,200,B,150')
    })

    it('should handle matrix style with explode=true and single value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users{;color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'matrix',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'blue',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users;color=blue')
    })

    it('should handle matrix style with explode=true and array values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users{;color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'matrix',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'string' },
              example: ['blue', 'black', 'brown'],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users;color=blue;color=black;color=brown')
    })

    it('should handle matrix style with explode=true and object values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users{;color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'matrix',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
              example: { R: 100, G: 200, B: 150 },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users;R=100;G=200;B=150')
    })
  })

  describe('label style', () => {
    it('should handle label style with explode=false and single value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users{.color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'label',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'blue',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users.blue')
    })

    it('should handle label style with explode=false and array values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users{.color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'label',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'string' },
              example: ['blue', 'black', 'brown'],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users.blue,black,brown')
    })

    it('should handle label style with explode=false and object values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users{.color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'label',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
              example: { R: 100, G: 200, B: 150 },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users.R,100,G,200,B,150')
    })

    it('should handle label style with explode=true and single value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users{.color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'label',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'blue',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users.blue')
    })

    it('should handle label style with explode=true and array values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users{.color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'label',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'string' },
              example: ['blue', 'black', 'brown'],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users.blue.black.brown')
    })

    it('should handle label style with explode=true and object values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users{.color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'label',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
              example: { R: 100, G: 200, B: 150 },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users.R=100.G=200.B=150')
    })
  })

  describe('simple style', () => {
    it('should handle simple style with explode=false and single value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users/{color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'simple',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'blue',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users/blue')
    })

    it('should handle simple style with explode=false and array values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users/{color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'simple',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'string' },
              example: ['blue', 'black', 'brown'],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users/blue,black,brown')
    })

    it('should handle simple style with explode=false and object values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users/{color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'simple',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
              example: { R: 100, G: 200, B: 150 },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users/R,100,G,200,B,150')
    })

    it('should handle simple style with explode=true and single value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users/{color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'simple',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'blue',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users/blue')
    })

    it('should handle simple style with explode=true and array values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users/{color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'simple',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'string' },
              example: ['blue', 'black', 'brown'],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users/blue,black,brown')
    })

    it('should handle simple style with explode=true and object values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users/{color}'),
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'simple',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
              example: { R: 100, G: 200, B: 150 },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users/R=100,G=200,B=150')
    })
  })

  describe('form style', () => {
    it('should handle form style with explode=false and single value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'color',
            in: 'query',
            required: true,
            style: 'form',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'blue',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([{ name: 'color', value: 'blue' }])
    })

    it('should handle form style with explode=false and array values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'color',
            in: 'query',
            required: true,
            style: 'form',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'string' },
              example: ['blue', 'black', 'brown'],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([{ name: 'color', value: 'blue,black,brown' }])
    })

    it('should handle form style with explode=false and object values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'color',
            in: 'query',
            required: true,
            style: 'form',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
              example: { R: 100, G: 200, B: 150 },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([{ name: 'color', value: 'R,100,G,200,B,150' }])
    })

    it('should handle form style with explode=true and single value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'color',
            in: 'query',
            required: true,
            style: 'form',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'blue',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([{ name: 'color', value: 'blue' }])
    })

    it('should handle form style with explode=true and array values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'color',
            in: 'query',
            required: true,
            style: 'form',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'string' },
              example: ['blue', 'black', 'brown'],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([
        { name: 'color', value: 'blue' },
        { name: 'color', value: 'black' },
        { name: 'color', value: 'brown' },
      ])
    })

    it('should handle form style with explode=true and object values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'color',
            in: 'query',
            required: true,
            style: 'form',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
              example: { R: 100, G: 200, B: 150 },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([
        { name: 'R', value: '100' },
        { name: 'G', value: '200' },
        { name: 'B', value: '150' },
      ])
    })
  })

  describe('spaceDelimited style', () => {
    it('should handle spaceDelimited style with explode=false and array values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'color',
            in: 'query',
            required: true,
            style: 'spaceDelimited',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'string' },
              example: ['blue', 'black', 'brown'],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([{ name: 'color', value: 'blue black brown' }])
    })

    it('should handle spaceDelimited style with explode=false and object values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'color',
            in: 'query',
            required: true,
            style: 'spaceDelimited',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
              example: { R: 100, G: 200, B: 150 },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([{ name: 'color', value: 'R 100 G 200 B 150' }])
    })
  })

  describe('pipeDelimited style', () => {
    it('should handle pipeDelimited style with explode=false and array values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'color',
            in: 'query',
            required: true,
            style: 'pipeDelimited',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'string' },
              example: ['blue', 'black', 'brown'],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([{ name: 'color', value: 'blue|black|brown' }])
    })

    it('should handle pipeDelimited style with explode=false and object values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'color',
            in: 'query',
            required: true,
            style: 'pipeDelimited',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
              example: { R: 100, G: 200, B: 150 },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([{ name: 'color', value: 'R|100|G|200|B|150' }])
    })
  })

  describe('deepObject style', () => {
    it('should handle deepObject style with explode=true and object values', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'color',
            in: 'query',
            required: true,
            style: 'deepObject',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
              example: { R: 100, G: 200, B: 150 },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([
        { name: 'color[R]', value: '100' },
        { name: 'color[G]', value: '200' },
        { name: 'color[B]', value: '150' },
      ])
    })
  })

  describe('header parameters', () => {
    it('should handle header parameter with string value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'Authorization',
            in: 'header',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'Bearer token123',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.headers).toEqual([{ name: 'Authorization', value: 'Bearer token123' }])
    })

    it('should handle header parameter with simple style and explode=true', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'Accept',
            in: 'header',
            required: true,
            style: 'simple',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'string' },
              example: ['application/json', 'application/xml', 'text/plain'],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.headers).toEqual([
        { name: 'Accept', value: 'application/json' },
        { name: 'Accept', value: 'application/xml' },
        { name: 'Accept', value: 'text/plain' },
      ])
    })

    it('should handle header parameter with simple style and explode=false', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'Accept',
            in: 'header',
            required: true,
            style: 'simple',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'string' },
              example: ['application/json', 'application/xml', 'text/plain'],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.headers).toEqual([{ name: 'Accept', value: 'application/json,application/xml,text/plain' }])
    })

    it('should handle header parameter with object and explode=true', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'X-Custom-Header',
            in: 'header',
            required: true,
            style: 'simple',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                version: { type: 'string' },
                client: { type: 'string' },
              },
              example: { version: '1.0', client: 'web' },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.headers).toEqual([{ name: 'X-Custom-Header', value: 'version=1.0,client=web' }])
    })

    it('should handle header parameter with object and explode=false', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'X-Custom-Header',
            in: 'header',
            required: true,
            style: 'simple',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                version: { type: 'string' },
                client: { type: 'string' },
              },
              example: { version: '1.0', client: 'web' },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.headers).toEqual([{ name: 'X-Custom-Header', value: 'version,1.0,client,web' }])
    })

    it('should enforce simple style for headers even if other style is specified', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'Authorization',
            in: 'header',
            required: true,
            style: 'form', // This should be ignored and default to 'simple'
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'Bearer token123',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.headers).toEqual([{ name: 'Authorization', value: 'Bearer token123' }])
    })

    it('should preserve existing headers when adding new ones', () => {
      const harRequest = createHarRequest('/api/users')
      harRequest.headers = [{ name: 'X-Existing-Header', value: 'existingValue' }]

      const result = processParameters({
        harRequest,
        parameters: [
          {
            name: 'X-New-Header',
            in: 'header',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'newValue',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.headers).toEqual([
        { name: 'X-Existing-Header', value: 'existingValue' },
        { name: 'X-New-Header', value: 'newValue' },
      ])
    })
  })

  describe('cookie parameters', () => {
    it('should handle cookie parameter with string value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'sessionId',
            in: 'cookie',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
            }),
            examples: { 'alpha': { value: 'abc123' } },
          },
        ],
        example: 'alpha',
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([{ name: 'sessionId', value: 'abc123' }])
    })

    it('should handle cookie parameter with form style and explode=true (default)', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'preferences',
            in: 'cookie',
            required: true,
            style: 'form',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'string' },
              example: ['dark', 'compact', 'notifications'],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([
        { name: 'preferences', value: 'dark' },
        { name: 'preferences', value: 'compact' },
        { name: 'preferences', value: 'notifications' },
      ])
    })

    it('should handle cookie parameter with form style and explode=false', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'preferences',
            in: 'cookie',
            required: true,
            style: 'form',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'string' },
              example: ['dark', 'compact', 'notifications'],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([{ name: 'preferences', value: 'dark,compact,notifications' }])
    })

    it('should handle cookie parameter with object and explode=true', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'settings',
            in: 'cookie',
            required: true,
            style: 'form',
            explode: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                theme: { type: 'string' },
                language: { type: 'string' },
                timezone: { type: 'string' },
              },
              example: { theme: 'dark', language: 'en', timezone: 'UTC' },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([
        { name: 'theme', value: 'dark' },
        { name: 'language', value: 'en' },
        { name: 'timezone', value: 'UTC' },
      ])
    })

    it('should handle cookie parameter with object and explode=false', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'settings',
            in: 'cookie',
            required: true,
            style: 'form',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                theme: { type: 'string' },
                language: { type: 'string' },
                timezone: { type: 'string' },
              },
              example: { theme: 'dark', language: 'en', timezone: 'UTC' },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([{ name: 'settings', value: 'theme,dark,language,en,timezone,UTC' }])
    })

    it('should enforce form style for cookies even if other style is specified', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'sessionId',
            in: 'cookie',
            required: true,
            style: 'simple', // This should be ignored and default to 'form'
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'abc123',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([{ name: 'sessionId', value: 'abc123' }])
    })

    it('should handle cookie parameter with number value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'userId',
            in: 'cookie',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'integer',
              example: 12345,
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([{ name: 'userId', value: '12345' }])
    })

    it('should handle cookie parameter with boolean value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'premium',
            in: 'cookie',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'boolean',
              example: true,
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([{ name: 'premium', value: 'true' }])
    })

    it('should handle multiple cookie parameters', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'sessionId',
            in: 'cookie',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'abc123',
            }),
          },
          {
            name: 'theme',
            in: 'cookie',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'dark',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([
        { name: 'sessionId', value: 'abc123' },
        { name: 'theme', value: 'dark' },
      ])
    })

    it('should handle cookie parameter with array value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'preferences',
            in: 'cookie',
            required: true,
            style: 'form',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'string' },
              example: ['dark', 'compact', 'notifications'],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([{ name: 'preferences', value: 'dark,compact,notifications' }])
    })

    it('should handle cookie parameter with object value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'settings',
            in: 'cookie',
            required: true,
            style: 'form',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                theme: { type: 'string' },
                language: { type: 'string' },
                timezone: { type: 'string' },
              },
              example: { theme: 'dark', language: 'en', timezone: 'UTC' },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([{ name: 'settings', value: 'theme,dark,language,en,timezone,UTC' }])
    })

    it('should handle cookie parameter with null value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'sessionId',
            in: 'cookie',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              nullable: true,
              example: null,
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([{ name: 'sessionId', value: 'null' }])
    })

    it('should handle cookie parameter with undefined value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'sessionId',
            in: 'cookie',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([
        {
          name: 'sessionId',
          value: '',
        },
      ])
    })

    it('should handle cookie parameter with empty string value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'sessionId',
            in: 'cookie',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: '',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([{ name: 'sessionId', value: '' }])
    })

    it('should handle cookie parameter with special characters', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'auth_token',
            in: 'cookie',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([
        {
          name: 'auth_token',
          value:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
      ])
    })

    it('should handle cookie parameter with URL-encoded characters', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'user_pref',
            in: 'cookie',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'name=John Doe&email=john@example.com',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([{ name: 'user_pref', value: 'name=John Doe&email=john@example.com' }])
    })

    it('should handle cookie parameter with numeric array', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'scores',
            in: 'cookie',
            required: true,
            style: 'form',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'integer' },
              example: [85, 92, 78, 96],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([{ name: 'scores', value: '85,92,78,96' }])
    })

    it('should handle cookie parameter with boolean array', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'flags',
            in: 'cookie',
            required: true,
            style: 'form',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'boolean' },
              example: [true, false, true, true],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([{ name: 'flags', value: 'true,false,true,true' }])
    })

    it('should handle cookie parameter with mixed array', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'mixed_data',
            in: 'cookie',
            required: true,
            style: 'form',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: {},
              example: ['string', 123, true, null],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([{ name: 'mixed_data', value: 'string,123,true,null' }])
    })

    it('should handle cookie parameter with nested object', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'user_config',
            in: 'cookie',
            required: true,
            style: 'form',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                preferences: {
                  type: 'object',
                  properties: {
                    theme: { type: 'string' },
                    notifications: { type: 'boolean' },
                  },
                },
                metadata: {
                  type: 'object',
                  properties: {
                    version: { type: 'string' },
                    timestamp: { type: 'string' },
                  },
                },
              },
              example: {
                preferences: { theme: 'dark', notifications: true },
                metadata: { version: '1.0.0', timestamp: '2023-01-01T00:00:00Z' },
              },
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([
        {
          name: 'user_config',
          value: 'preferences,theme,dark,notifications,true,metadata,version,1.0.0,timestamp,2023-01-01T00:00:00Z',
        },
      ])
    })

    it('should handle cookie parameter with empty array', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'tags',
            in: 'cookie',
            required: true,
            style: 'form',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: { type: 'string' },
              example: [],
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([{ name: 'tags', value: '' }])
    })

    it('should handle cookie parameter with empty object', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'config',
            in: 'cookie',
            required: true,
            style: 'form',
            explode: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'object',
              example: {},
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([{ name: 'config', value: '' }])
    })

    it('should preserve existing cookies when adding new ones', () => {
      const harRequest = createHarRequest('/api/users')
      harRequest.cookies = [{ name: 'existingCookie', value: 'existingValue' }]

      const result = processParameters({
        harRequest,
        parameters: [
          {
            name: 'newCookie',
            in: 'cookie',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'newValue',
            }),
          },
        ],
      })

      expect(result.url).toBe('/api/users')
      expect(result.cookies).toEqual([
        { name: 'existingCookie', value: 'existingValue' },
        { name: 'newCookie', value: 'newValue' },
      ])
    })
  })

  describe('query parameters', () => {
    it('should add empty query string if no parameters are present', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'email',
            in: 'query',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
            }),
          },
        ],
      })

      expect(result.queryString).toEqual([{ name: 'email', value: '' }])
    })
  })

  describe('content-based parameters', () => {
    it('handles query parameter with object value in application/json content type', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'offset',
            description: 'The number of items to skip before starting to collect the result set',
            in: 'query',
            required: false,
            content: {
              'application/json': {
                schema: coerceValue(SchemaObjectSchema, {
                  type: 'object',
                }),
                examples: {
                  default: {
                    value: {
                      test: 'what',
                    },
                    'x-disabled': false,
                  },
                },
              },
            },
          },
        ],
      })

      // Object values should be serialized as JSON strings
      expect(result.queryString).toEqual([{ name: 'offset', value: '{"test":"what"}' }])
    })

    it('handles query parameter with text/plain content type', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'description',
            description: 'Plain text description',
            in: 'query',
            required: false,
            content: {
              'text/plain': {
                schema: coerceValue(SchemaObjectSchema, {
                  type: 'string',
                }),
                examples: {
                  default: {
                    value: 'This is plain text content',
                    'x-disabled': false,
                  },
                },
              },
            },
          },
        ],
      })

      // Plain text values should be passed as-is
      expect(result.queryString).toEqual([{ name: 'description', value: 'This is plain text content' }])
    })

    it('handles query parameter with text/xml content type', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'xmlData',
            description: 'XML formatted data',
            in: 'query',
            required: false,
            content: {
              'text/xml': {
                schema: coerceValue(SchemaObjectSchema, {
                  type: 'string',
                }),
                examples: {
                  default: {
                    value: '<root><item>value</item></root>',
                    'x-disabled': false,
                  },
                },
              },
            },
          },
        ],
      })

      // XML values should be passed as-is
      expect(result.queryString).toEqual([{ name: 'xmlData', value: '<root><item>value</item></root>' }])
    })

    it('handles query parameter with application/xml content type', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'payload',
            description: 'Application XML data',
            in: 'query',
            required: false,
            content: {
              'application/xml': {
                schema: coerceValue(SchemaObjectSchema, {
                  type: 'string',
                }),
                examples: {
                  default: {
                    value: '<?xml version="1.0"?><data><field>test</field></data>',
                    'x-disabled': false,
                  },
                },
              },
            },
          },
        ],
      })

      // Application XML values should be passed as-is
      expect(result.queryString).toEqual([
        { name: 'payload', value: '<?xml version="1.0"?><data><field>test</field></data>' },
      ])
    })

    it('handles query parameter with application/x-www-form-urlencoded content type', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'formData',
            description: 'URL encoded form data',
            in: 'query',
            required: false,
            content: {
              'application/x-www-form-urlencoded': {
                schema: coerceValue(SchemaObjectSchema, {
                  type: 'string',
                }),
                examples: {
                  default: {
                    value: 'username=john_doe&email=john@example.com',
                    'x-disabled': false,
                  },
                },
              },
            },
          },
        ],
      })

      // Form data should be passed as-is when already URL encoded
      expect(result.queryString).toEqual([{ name: 'formData', value: 'username=john_doe&email=john@example.com' }])
    })

    it('handles query parameter with text/html content type', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'htmlContent',
            description: 'HTML formatted content',
            in: 'query',
            required: false,
            content: {
              'text/html': {
                schema: coerceValue(SchemaObjectSchema, {
                  type: 'string',
                }),
                examples: {
                  default: {
                    value: '<div><p>Hello World</p></div>',
                    'x-disabled': false,
                  },
                },
              },
            },
          },
        ],
      })

      // HTML values should be passed as-is
      expect(result.queryString).toEqual([{ name: 'htmlContent', value: '<div><p>Hello World</p></div>' }])
    })

    it('handles query parameter with application/octet-stream content type', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'binaryData',
            description: 'Binary data as base64',
            in: 'query',
            required: false,
            content: {
              'application/octet-stream': {
                schema: coerceValue(SchemaObjectSchema, {
                  type: 'string',
                  format: 'binary',
                }),
                examples: {
                  default: {
                    value: 'SGVsbG8gV29ybGQ=',
                    'x-disabled': false,
                  },
                },
              },
            },
          },
        ],
      })

      // Binary data (base64 encoded) should be passed as-is
      expect(result.queryString).toEqual([{ name: 'binaryData', value: 'SGVsbG8gV29ybGQ=' }])
    })

    it('handles content-based parameter with matching content type from header', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'Content-Type',
            in: 'header',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
            }),
            examples: {
              default: { value: 'application/json' },
            },
          },
          {
            name: 'X-Payload',
            in: 'header',
            required: true,
            content: {
              'application/json': {
                examples: {
                  default: { value: 'json-value' },
                },
              },
              'text/xml': {
                examples: {
                  default: { value: 'xml-value' },
                },
              },
            },
          },
        ],
      })

      // Should use the JSON example since Content-Type is application/json
      expect(result.headers).toContainEqual({ name: 'X-Payload', value: 'json-value' })
    })

    it('skips content-based parameter when content type does not match', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'Content-Type',
            in: 'header',
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
            }),
            examples: {
              default: { value: 'application/xml' },
            },
          },
          {
            name: 'X-Missing-Content-Type',
            in: 'header',
            content: {
              'application/json': {
                examples: {
                  default: { value: 'json-value' },
                },
              },
            },
          },
        ],
      })

      // Should skip the parameter since content type does not match
      expect(result.headers).not.toContainEqual(expect.objectContaining({ name: 'X-Missing-Content-Type' }))
    })

    it('handles content-based parameter with array value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'tags',
            description: 'Filter by tags',
            in: 'query',
            required: false,
            content: {
              'application/json': {
                schema: coerceValue(SchemaObjectSchema, {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                }),
                examples: {
                  default: {
                    value: ['javascript', 'typescript', 'vue'],
                    'x-disabled': false,
                  },
                },
              },
            },
          },
        ],
      })

      // Array values in content should be serialized as JSON strings
      expect(result.queryString).toEqual([{ name: 'tags', value: '["javascript","typescript","vue"]' }])
    })

    it('handles content-based parameter with nested object value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'filter',
            description: 'Complex filter object',
            in: 'query',
            required: false,
            content: {
              'application/json': {
                schema: coerceValue(SchemaObjectSchema, {
                  type: 'object',
                }),
                examples: {
                  default: {
                    value: {
                      user: {
                        name: 'John',
                        age: 30,
                      },
                      active: true,
                    },
                    'x-disabled': false,
                  },
                },
              },
            },
          },
        ],
        contentType: 'application/json',
      })

      // Nested objects should be serialized as JSON strings
      expect(result.queryString).toEqual([{ name: 'filter', value: '{"user":{"name":"John","age":30},"active":true}' }])
    })

    it('handles content-based parameter with multiple content types', () => {
      const jsonResult = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'X-Payload',
            in: 'header',
            required: true,
            content: {
              'application/json': {
                examples: {
                  default: { value: '{"type":"json"}' },
                },
              },
              'text/xml': {
                examples: {
                  default: { value: '<type>xml</type>' },
                },
              },
            },
          },
        ],
        contentType: 'application/json',
      })

      const xmlResult = processParameters({
        harRequest: createHarRequest('/api/users'),
        parameters: [
          {
            name: 'X-Payload',
            in: 'header',
            required: true,
            content: {
              'application/json': {
                examples: {
                  default: { value: '{"type":"json"}' },
                },
              },
              'text/xml': {
                examples: {
                  default: { value: '<type>xml</type>' },
                },
              },
            },
          },
        ],
        contentType: 'text/xml',
      })

      // Should use the correct example based on content type
      expect(jsonResult.headers).toContainEqual({ name: 'X-Payload', value: '{"type":"json"}' })
      expect(xmlResult.headers).toContainEqual({ name: 'X-Payload', value: '<type>xml</type>' })
    })
  })

  describe('path parameters', () => {
    it('should add variable name if no value or example is provided', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users/{username}'),
        parameters: [
          {
            name: 'username',
            in: 'path',
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
            }),
          },
        ],
      })

      expect(result.url).toEqual('/api/users/{username}')
    })

    it('should replace the variable with the example value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users/{username}'),
        parameters: [
          {
            name: 'username',
            in: 'path',
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'scalarUser',
            }),
          },
        ],
      })

      expect(result.url).toEqual('/api/users/scalarUser')
    })

    it('should replace the variable with the upper example value', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users/{username}'),
        parameters: [
          {
            name: 'username',
            in: 'path',
            example: 'scalarUser',
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
            }),
          },
        ],
      })

      expect(result.url).toEqual('/api/users/scalarUser')
    })

    it('should replace the variable with the example value from examples', () => {
      const result = processParameters({
        harRequest: createHarRequest('/api/users/{username}'),
        parameters: [
          {
            name: 'username',
            in: 'path',
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
            }),
            examples: {
              'example1': {
                value: 'scalarUser',
              },
            },
          },
        ],
      })

      expect(result.url).toEqual('/api/users/scalarUser')
    })
  })
})
