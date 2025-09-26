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
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'abc123',
            }),
          },
          {
            name: 'theme',
            in: 'cookie',
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
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
            }),
          },
        ],
      })

      expect(result.queryString).toEqual([{ name: 'email', value: '' }])
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
