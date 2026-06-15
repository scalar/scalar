import { describe, expect, it } from 'vitest'

import { createMockServer } from '../src/create-mock-server'

const baseInfo = {
  title: 'Prefer Header',
  version: '1.0.0',
}

describe('Prefer header', () => {
  describe('code directive', () => {
    const document = {
      openapi: '3.1.0',
      info: baseInfo,
      paths: {
        '/things': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: { 'application/json': { example: { status: 'ok' } } },
              },
              '404': {
                description: 'Not Found',
                content: { 'application/json': { example: { error: 'not found' } } },
              },
              '204': {
                description: 'No Content',
              },
            },
          },
        },
      },
    }

    it('selects a defined non-default response and sets its status', async () => {
      const server = await createMockServer({ document })

      const response = await server.request('/things', { headers: { Prefer: 'code=404' } })

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'not found' })
    })

    it('falls back to the preferred key for an unknown code', async () => {
      const server = await createMockServer({ document })

      const response = await server.request('/things', { headers: { Prefer: 'code=418' } })

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ status: 'ok' })
    })

    it('returns no body for a 204 selected via code', async () => {
      const server = await createMockServer({ document })

      const response = await server.request('/things', { headers: { Prefer: 'code=204' } })

      expect(response.status).toBe(204)
      expect(await response.text()).toBe('')
    })

    it('uses the preferred response without a Prefer header', async () => {
      const server = await createMockServer({ document })

      const response = await server.request('/things')

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ status: 'ok' })
    })

    it('uses a success response by default when the operation also defines errors', async () => {
      const server = await createMockServer({
        document: {
          openapi: '3.1.0',
          info: baseInfo,
          paths: {
            '/jobs': {
              post: {
                responses: {
                  '202': {
                    description: 'Accepted',
                    content: { 'application/json': { example: { status: 'queued' } } },
                  },
                  '404': {
                    description: 'Not Found',
                    content: { 'application/json': { example: { error: 'not found' } } },
                  },
                },
              },
            },
          },
        },
      })

      const response = await server.request('/jobs', { method: 'POST' })

      expect(response.status).toBe(202)
      expect(await response.json()).toEqual({ status: 'queued' })
    })

    it('selects a 2XX range response and maps it to a concrete status', async () => {
      const server = await createMockServer({
        document: {
          openapi: '3.1.0',
          info: baseInfo,
          paths: {
            '/jobs': {
              post: {
                responses: {
                  '2XX': {
                    description: 'Success',
                    content: { 'application/json': { example: { status: 'queued' } } },
                  },
                  '4XX': {
                    description: 'Client Error',
                    content: { 'application/json': { example: { error: 'bad request' } } },
                  },
                },
              },
            },
          },
        },
      })

      const response = await server.request('/jobs', { method: 'POST' })

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ status: 'queued' })
    })

    it('prefers a defined 2xx success over the default response', async () => {
      const server = await createMockServer({
        document: {
          openapi: '3.1.0',
          info: baseInfo,
          paths: {
            '/things': {
              get: {
                responses: {
                  default: {
                    description: 'Unexpected error',
                    content: { 'application/json': { example: { error: 'unexpected' } } },
                  },
                  '200': {
                    description: 'OK',
                    content: { 'application/json': { example: { status: 'ok' } } },
                  },
                },
              },
            },
          },
        },
      })

      const response = await server.request('/things')

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ status: 'ok' })
    })

    it('falls back to the default response when no concrete code is defined', async () => {
      const server = await createMockServer({
        document: {
          openapi: '3.1.0',
          info: baseInfo,
          paths: {
            '/things': {
              get: {
                responses: {
                  default: {
                    description: 'Unexpected error',
                    content: { 'application/json': { example: { error: 'unexpected' } } },
                  },
                },
              },
            },
          },
        },
      })

      const response = await server.request('/things')

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ error: 'unexpected' })
    })
  })

  describe('example directive', () => {
    const documentWithExamples = {
      openapi: '3.1.0',
      info: baseInfo,
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    examples: {
                      alice: { value: { name: 'Alice' } },
                      bob: { value: { name: 'Bob' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    it('selects a named example', async () => {
      const server = await createMockServer({ document: documentWithExamples })

      const response = await server.request('/users', { headers: { Prefer: 'example=bob' } })

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ name: 'Bob' })
    })

    it('uses the first example when no name is given', async () => {
      const server = await createMockServer({ document: documentWithExamples })

      const response = await server.request('/users')

      expect(await response.json()).toEqual({ name: 'Alice' })
    })

    it('falls back to the first example for an unknown name', async () => {
      const server = await createMockServer({ document: documentWithExamples })

      const response = await server.request('/users', { headers: { Prefer: 'example=carol' } })

      expect(await response.json()).toEqual({ name: 'Alice' })
    })

    it('prefers the singular example over the examples map', async () => {
      const document = {
        openapi: '3.1.0',
        info: baseInfo,
        paths: {
          '/users': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/json': {
                      example: { name: 'Singular' },
                      examples: { alice: { value: { name: 'Alice' } } },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const server = await createMockServer({ document })

      const response = await server.request('/users')

      expect(await response.json()).toEqual({ name: 'Singular' })
    })

    it('generates a body from the schema when nothing is defined', async () => {
      const document = {
        openapi: '3.1.0',
        info: baseInfo,
        paths: {
          '/users': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: { name: { type: 'string', example: 'Generated' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const server = await createMockServer({ document })

      const response = await server.request('/users')

      expect(await response.json()).toEqual({ name: 'Generated' })
    })
  })

  describe('null example', () => {
    it('serializes a null JSON example as null', async () => {
      const document = {
        openapi: '3.1.0',
        info: baseInfo,
        paths: {
          '/nothing': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  content: { 'application/json': { example: null } },
                },
              },
            },
          },
        },
      }

      const server = await createMockServer({ document })

      const response = await server.request('/nothing')

      expect(response.status).toBe(200)
      expect(await response.text()).toBe('null')
    })

    it('does not feed a null example into json2xml for XML responses', async () => {
      const document = {
        openapi: '3.1.0',
        info: baseInfo,
        paths: {
          '/nothing': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  content: { 'application/xml': { example: null } },
                },
              },
            },
          },
        },
      }

      const server = await createMockServer({ document })

      const response = await server.request('/nothing', { headers: { Accept: 'application/xml' } })

      expect(response.status).toBe(200)
      expect(await response.text()).toBe('null')
    })
  })

  describe('code and example combined', () => {
    it('picks the response by code, then the example within it', async () => {
      const document = {
        openapi: '3.1.0',
        info: baseInfo,
        paths: {
          '/users': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/json': {
                      examples: { ok: { value: { status: 'ok' } } },
                    },
                  },
                },
                '422': {
                  description: 'Unprocessable Entity',
                  content: {
                    'application/json': {
                      examples: {
                        missingName: { value: { error: 'name is required' } },
                        missingEmail: { value: { error: 'email is required' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const server = await createMockServer({ document })

      const response = await server.request('/users', {
        headers: { Prefer: 'code=422, example=missingEmail' },
      })

      expect(response.status).toBe(422)
      expect(await response.json()).toEqual({ error: 'email is required' })
    })
  })
})
