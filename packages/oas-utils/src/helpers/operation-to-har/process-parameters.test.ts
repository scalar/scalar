import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Request as HarRequest } from 'har-format'
import { describe, it, expect } from 'vitest'

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
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'matrix',
            explode: false,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users{;color}'), operation.parameters || [], {
        color: 'blue',
      })

      expect(result.url).toBe('/api/users;color=blue')
    })

    it('should handle matrix style with explode=false and array values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'matrix',
            explode: false,
            schema: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users{;color}'), operation.parameters || [], {
        color: ['blue', 'black', 'brown'],
      })

      expect(result.url).toBe('/api/users;color=blue,black,brown')
    })

    it('should handle matrix style with explode=false and object values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'matrix',
            explode: false,
            schema: {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users{;color}'), operation.parameters || [], {
        color: { R: 100, G: 200, B: 150 },
      })

      expect(result.url).toBe('/api/users;color=R,100,G,200,B,150')
    })

    it('should handle matrix style with explode=true and single value', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'matrix',
            explode: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users{;color}'), operation.parameters || [], {
        color: 'blue',
      })

      expect(result.url).toBe('/api/users;color=blue')
    })

    it('should handle matrix style with explode=true and array values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'matrix',
            explode: true,
            schema: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users{;color}'), operation.parameters || [], {
        color: ['blue', 'black', 'brown'],
      })

      expect(result.url).toBe('/api/users;color=blue;color=black;color=brown')
    })

    it('should handle matrix style with explode=true and object values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'matrix',
            explode: true,
            schema: {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users{;color}'), operation.parameters || [], {
        color: { R: 100, G: 200, B: 150 },
      })

      expect(result.url).toBe('/api/users;R=100;G=200;B=150')
    })
  })

  describe('label style', () => {
    it('should handle label style with explode=false and single value', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'label',
            explode: false,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users{.color}'), operation.parameters || [], {
        color: 'blue',
      })

      expect(result.url).toBe('/api/users.blue')
    })

    it('should handle label style with explode=false and array values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'label',
            explode: false,
            schema: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users{.color}'), operation.parameters || [], {
        color: ['blue', 'black', 'brown'],
      })

      expect(result.url).toBe('/api/users.blue,black,brown')
    })

    it('should handle label style with explode=false and object values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'label',
            explode: false,
            schema: {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users{.color}'), operation.parameters || [], {
        color: { R: 100, G: 200, B: 150 },
      })

      expect(result.url).toBe('/api/users.R,100,G,200,B,150')
    })

    it('should handle label style with explode=true and single value', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'label',
            explode: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users{.color}'), operation.parameters || [], {
        color: 'blue',
      })

      expect(result.url).toBe('/api/users.blue')
    })

    it('should handle label style with explode=true and array values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'label',
            explode: true,
            schema: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users{.color}'), operation.parameters || [], {
        color: ['blue', 'black', 'brown'],
      })

      expect(result.url).toBe('/api/users.blue.black.brown')
    })

    it('should handle label style with explode=true and object values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'label',
            explode: true,
            schema: {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users{.color}'), operation.parameters || [], {
        color: { R: 100, G: 200, B: 150 },
      })

      expect(result.url).toBe('/api/users.R=100.G=200.B=150')
    })
  })

  describe('simple style', () => {
    it('should handle simple style with explode=false and single value', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'simple',
            explode: false,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users/{color}'), operation.parameters || [], {
        color: 'blue',
      })

      expect(result.url).toBe('/api/users/blue')
    })

    it('should handle simple style with explode=false and array values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'simple',
            explode: false,
            schema: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users/{color}'), operation.parameters || [], {
        color: ['blue', 'black', 'brown'],
      })

      expect(result.url).toBe('/api/users/blue,black,brown')
    })

    it('should handle simple style with explode=false and object values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'simple',
            explode: false,
            schema: {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users/{color}'), operation.parameters || [], {
        color: { R: 100, G: 200, B: 150 },
      })

      expect(result.url).toBe('/api/users/R,100,G,200,B,150')
    })

    it('should handle simple style with explode=true and single value', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'simple',
            explode: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users/{color}'), operation.parameters || [], {
        color: 'blue',
      })

      expect(result.url).toBe('/api/users/blue')
    })

    it('should handle simple style with explode=true and array values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'simple',
            explode: true,
            schema: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users/{color}'), operation.parameters || [], {
        color: ['blue', 'black', 'brown'],
      })

      expect(result.url).toBe('/api/users/blue,black,brown')
    })

    it('should handle simple style with explode=true and object values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'simple',
            explode: true,
            schema: {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users/{color}'), operation.parameters || [], {
        color: { R: 100, G: 200, B: 150 },
      })

      expect(result.url).toBe('/api/users/R=100,G=200,B=150')
    })
  })

  describe('form style', () => {
    it('should handle form style with explode=false and single value', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'form',
            explode: false,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users'), operation.parameters || [], { color: 'blue' })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([{ name: 'color', value: 'blue' }])
    })

    it('should handle form style with explode=false and array values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'form',
            explode: false,
            schema: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users'), operation.parameters || [], {
        color: ['blue', 'black', 'brown'],
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([{ name: 'color', value: 'blue,black,brown' }])
    })

    it('should handle form style with explode=false and object values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'form',
            explode: false,
            schema: {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users'), operation.parameters || [], {
        color: { R: 100, G: 200, B: 150 },
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([{ name: 'color', value: 'R,100,G,200,B,150' }])
    })

    it('should handle form style with explode=true and single value', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'form',
            explode: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users'), operation.parameters || [], { color: 'blue' })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([{ name: 'color', value: 'blue' }])
    })

    it('should handle form style with explode=true and array values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'form',
            explode: true,
            schema: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users'), operation.parameters || [], {
        color: ['blue', 'black', 'brown'],
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([
        { name: 'color', value: 'blue' },
        { name: 'color', value: 'black' },
        { name: 'color', value: 'brown' },
      ])
    })

    it('should handle form style with explode=true and object values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'form',
            explode: true,
            schema: {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users'), operation.parameters || [], {
        color: { R: 100, G: 200, B: 150 },
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
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'spaceDelimited',
            explode: false,
            schema: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users'), operation.parameters || [], {
        color: ['blue', 'black', 'brown'],
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([{ name: 'color', value: 'blue black brown' }])
    })

    it('should handle spaceDelimited style with explode=false and object values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'spaceDelimited',
            explode: false,
            schema: {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users'), operation.parameters || [], {
        color: { R: 100, G: 200, B: 150 },
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([{ name: 'color', value: 'R 100 G 200 B 150' }])
    })
  })

  describe('pipeDelimited style', () => {
    it('should handle pipeDelimited style with explode=false and array values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'pipeDelimited',
            explode: false,
            schema: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users'), operation.parameters || [], {
        color: ['blue', 'black', 'brown'],
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([{ name: 'color', value: 'blue|black|brown' }])
    })

    it('should handle pipeDelimited style with explode=false and object values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'pipeDelimited',
            explode: false,
            schema: {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users'), operation.parameters || [], {
        color: { R: 100, G: 200, B: 150 },
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([{ name: 'color', value: 'R|100|G|200|B|150' }])
    })
  })

  describe('deepObject style', () => {
    it('should handle deepObject style with explode=true and object values', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'deepObject',
            explode: true,
            schema: {
              type: 'object',
              properties: {
                R: { type: 'integer' },
                G: { type: 'integer' },
                B: { type: 'integer' },
              },
            },
          },
        ],
        responses: {
          '200': { description: 'OK' },
        },
      }

      const result = processParameters(createHarRequest('/api/users'), operation.parameters || [], {
        color: { R: 100, G: 200, B: 150 },
      })

      expect(result.url).toBe('/api/users')
      expect(result.queryString).toEqual([
        { name: 'color[R]', value: '100' },
        { name: 'color[G]', value: '200' },
        { name: 'color[B]', value: '150' },
      ])
    })
  })
})
