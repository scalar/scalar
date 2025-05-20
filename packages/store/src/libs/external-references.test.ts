import { describe, expect, it, vi } from 'vitest'
import { createExternalReferenceFetcher, getAbsoluteUrl } from './external-references'

describe('external-references', () => {
  describe('createExternalReferenceFetcher', () => {
    describe('url', () => {
      it('fetches all references', async () => {
        // Mock fetch to return a static OpenAPI document with external references
        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url === 'https://example.com/openapi.yaml') {
            return Promise.resolve({
              ok: true,
              text: () =>
                Promise.resolve(
                  JSON.stringify({
                    openapi: '3.1.1',
                    info: {
                      title: 'Test API',
                      version: '1.0.0',
                    },
                    paths: {
                      '/test': {
                        get: {
                          $ref: 'components.yaml#/components/schemas/Test',
                        },
                      },
                    },
                  }),
                ),
            })
          }

          if (url === 'https://example.com/components.yaml') {
            return Promise.resolve({
              ok: true,
              text: () =>
                Promise.resolve(
                  JSON.stringify({
                    components: {
                      schemas: {
                        Test: {
                          type: 'object',
                          properties: {
                            id: {
                              type: 'string',
                            },
                          },
                        },
                      },
                    },
                  }),
                ),
            })
          }

          return Promise.reject(new Error(`Unexpected URL: ${url}`))
        })

        const { isReady, getReference } = createExternalReferenceFetcher({
          url: 'https://example.com/openapi.yaml',
        })

        await isReady()

        expect(getReference('https://example.com/openapi.yaml')?.status).toBe('fetched')
        expect(getReference('https://example.com/components.yaml')?.status).toBe('fetched')
      })

      it('handles lazy loading strategy', async () => {
        const mockFetch = vi.fn().mockImplementation((url: string) => {
          if (url === 'https://example.com/openapi.yaml') {
            return Promise.resolve({
              ok: true,
              text: () => Promise.resolve(JSON.stringify({ openapi: '3.1.1' })),
            })
          }
          return Promise.reject(new Error(`Unexpected URL: ${url}`))
        })
        global.fetch = mockFetch

        const { isReady, references } = createExternalReferenceFetcher({
          url: 'https://example.com/openapi.yaml',
          strategy: 'lazy',
        })

        // Initial state should be idle
        expect(references.value.get('https://example.com/openapi.yaml')?.status).toBe('pending')

        await isReady()

        // After isReady, should be fetched
        expect(references.value.get('https://example.com/openapi.yaml')?.status).toBe('fetched')
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      it('handles fetch errors gracefully', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

        const { isReady, references } = createExternalReferenceFetcher({
          url: 'https://example.com/openapi.yaml',
        })

        await isReady()

        const entry = references.value.get('https://example.com/openapi.yaml')
        expect(entry?.status).toBe('failed')
        expect(entry?.errors[0].message).toBe('Network error')
      })

      it('handles HTTP errors gracefully', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
        })

        const { isReady, references } = createExternalReferenceFetcher({
          url: 'https://example.com/openapi.yaml',
        })

        await isReady()

        const entry = references.value.get('https://example.com/openapi.yaml')
        expect(entry?.status).toBe('failed')
        expect(entry?.errors[0].message).toContain('HTTP error! status: 404')
      })

      it('processes nested references correctly', async () => {
        global.fetch = vi.fn().mockImplementation((url: string) => {
          const responses: Record<string, string> = {
            'https://example.com/openapi.yaml': JSON.stringify({
              openapi: '3.1.1',
              paths: {
                '/test': {
                  $ref: 'https://example.com/paths.yaml#/paths/test',
                },
              },
            }),
            'https://example.com/paths.yaml': JSON.stringify({
              paths: {
                test: {
                  $ref: 'https://example.com/components.yaml#/components/schemas/Test',
                },
              },
            }),
            'https://example.com/components.yaml': JSON.stringify({
              components: {
                schemas: {
                  Test: {
                    type: 'object',
                  },
                },
              },
            }),
          }

          if (url in responses) {
            return Promise.resolve({
              ok: true,
              text: () => Promise.resolve(responses[url]),
            })
          }

          return Promise.reject(new Error(`Unexpected URL: ${url}`))
        })

        const { isReady, references } = createExternalReferenceFetcher({
          url: 'https://example.com/openapi.yaml',
        })

        await isReady()

        // Should have fetched all three references.value
        expect(references.value.size).toBe(3)
        expect(references.value.get('https://example.com/openapi.yaml')?.status).toBe('fetched')
        expect(references.value.get('https://example.com/paths.yaml')?.status).toBe('fetched')
        expect(references.value.get('https://example.com/components.yaml')?.status).toBe('fetched')
      })

      it('handles circular references without infinite loops', async () => {
        global.fetch = vi.fn().mockImplementation((url: string) => {
          const responses: Record<string, string> = {
            'https://example.com/openapi.yaml': JSON.stringify({
              openapi: '3.1.1',
              $ref: 'https://example.com/circular.yaml',
            }),
            'https://example.com/circular.yaml': JSON.stringify({
              $ref: 'https://example.com/openapi.yaml',
            }),
          }

          if (url in responses) {
            return Promise.resolve({
              ok: true,
              text: () => Promise.resolve(responses[url]),
            })
          }

          return Promise.reject(new Error(`Unexpected URL: ${url}`))
        })

        const { isReady, references, getReference } = createExternalReferenceFetcher({
          url: 'https://example.com/openapi.yaml',
        })

        await isReady()

        // Should only fetch each file once
        expect(references.value.size).toBe(2)
        expect(getReference('https://example.com/openapi.yaml')?.status).toBe('fetched')
        expect(getReference('https://example.com/circular.yaml')?.status).toBe('fetched')
      })

      it('handles invalid JSON responses', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: () => Promise.resolve('invalid json'),
        })

        const { isReady, references } = createExternalReferenceFetcher({
          url: 'https://example.com/openapi.yaml',
        })

        await isReady()

        const entry = references.value.get('https://example.com/openapi.yaml')
        expect(entry?.status).toBe('failed')
        expect(entry?.errors[0].message).toContain('Invalid OpenAPI document: Failed to parse the content')
        expect(entry?.errors.length).toBe(1)
      })
    })

    describe('content', () => {
      it('reads content directly (string)', async () => {
        const { isReady, references } = createExternalReferenceFetcher({
          strategy: 'lazy',
          content: JSON.stringify({
            openapi: '3.1.1',
            info: {
              title: 'Test API',
              version: '1.0.0',
            },
            paths: {
              '/test': {
                get: {
                  $ref: 'components.yaml#/components/schemas/Test',
                },
              },
            },
          }),
        })

        await isReady()

        expect(references.value.size).toBe(1)
        expect(references.value.get('UNKNOWN_URL')?.status).toBe('fetched')
      })

      it('handles eager loading strategy with directly provided content (string)', async () => {
        // Mock fetch to return a static OpenAPI document with external references
        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url === 'https://example.com/openapi.yaml') {
            return Promise.resolve({
              ok: true,
              text: () => Promise.resolve(JSON.stringify({ openapi: '3.1.1' })),
            })
          }

          if (url === 'https://example.com/components.yaml') {
            return Promise.resolve({
              ok: true,
              text: () =>
                Promise.resolve(
                  JSON.stringify({
                    components: { schemas: { Test: { type: 'object' } } },
                  }),
                ),
            })
          }

          return Promise.reject(new Error(`Unexpected URL: ${url}`))
        })

        const { isReady, references } = createExternalReferenceFetcher({
          strategy: 'eager',
          content: JSON.stringify({
            openapi: '3.1.1',
            info: {
              title: 'Test API',
              version: '1.0.0',
            },
            paths: {
              '/test': {
                get: {
                  $ref: 'https://example.com/components.yaml#/components/schemas/Test',
                },
              },
            },
          }),
        })

        await isReady()

        expect(references.value.size).toBe(2)
        expect(references.value.get('UNKNOWN_URL')?.status).toBe('fetched')
        expect(references.value.get('https://example.com/components.yaml')?.status).toBe('fetched')
      })

      it('reads content directly (object)', async () => {
        const { isReady, references } = createExternalReferenceFetcher({
          strategy: 'lazy',
          content: {
            openapi: '3.1.1',
            info: {
              title: 'Test API',
              version: '1.0.0',
            },
            paths: {
              '/test': {
                get: {
                  $ref: 'components.yaml#/components/schemas/Test',
                },
              },
            },
          },
        })

        await isReady()

        expect(references.value.size).toBe(1)
        expect(references.value.get('UNKNOWN_URL')?.status).toBe('fetched')
      })

      it('handles eager loading strategy with directly provided content (object)', async () => {
        // Mock fetch to return a static OpenAPI document with external references
        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url === 'https://example.com/openapi.yaml') {
            return Promise.resolve({
              ok: true,
              text: () => Promise.resolve(JSON.stringify({ openapi: '3.1.1' })),
            })
          }

          if (url === 'https://example.com/components.yaml') {
            return Promise.resolve({
              ok: true,
              text: () =>
                Promise.resolve(
                  JSON.stringify({
                    components: { schemas: { Test: { type: 'object' } } },
                  }),
                ),
            })
          }

          return Promise.reject(new Error(`Unexpected URL: ${url}`))
        })

        const { isReady, references } = createExternalReferenceFetcher({
          strategy: 'eager',
          content: {
            openapi: '3.1.1',
            info: {
              title: 'Test API',
              version: '1.0.0',
            },
            paths: {
              '/test': {
                get: {
                  $ref: 'https://example.com/components.yaml#/components/schemas/Test',
                },
              },
            },
          },
        })

        await isReady()

        expect(references.value.size).toBe(2)
        expect(references.value.get('UNKNOWN_URL')?.status).toBe('fetched')
        expect(references.value.get('https://example.com/components.yaml')?.status).toBe('fetched')
      })
    })
  })

  describe('getAbsoluteUrl', () => {
    it('returns the absolute URL', () => {
      expect(getAbsoluteUrl('https://example.com/openapi.yaml', '/components.yaml')).toBe(
        'https://example.com/components.yaml',
      )
    })

    it('adds a relative path to an absolute base URL', () => {
      expect(getAbsoluteUrl('https://example.com/foobar/openapi.yaml', 'components.yaml')).toBe(
        'https://example.com/foobar/components.yaml',
      )
    })

    it('adds a relative path to a relative base URL', () => {
      expect(getAbsoluteUrl('/foobar/openapi.yaml', 'components.yaml')).toBe('/foobar/components.yaml')
    })

    it('adds a relative path with a slash to a relative base URL', () => {
      expect(getAbsoluteUrl('/foobar/openapi.yaml', '/components.yaml')).toBe('/components.yaml')
    })

    it('handles absolute URLs correctly', () => {
      expect(getAbsoluteUrl('https://example.com/openapi.yaml', 'https://other.com/schema.yaml')).toBe(
        'https://other.com/schema.yaml',
      )
    })

    it('handles base URL without trailing slash', () => {
      expect(getAbsoluteUrl('https://example.com', 'schema.yaml')).toBe('https://example.com/schema.yaml')
    })

    it('handles relative paths with multiple segments', () => {
      expect(getAbsoluteUrl('https://example.com/api/v1/openapi.yaml', '../v2/schema.yaml')).toBe(
        'https://example.com/api/v2/schema.yaml',
      )
    })

    it('handles relative paths with query parameters', () => {
      expect(getAbsoluteUrl('https://example.com/openapi.yaml', 'schema.yaml?version=1.0')).toBe(
        'https://example.com/schema.yaml?version=1.0',
      )
    })

    it('handles relative paths with hash fragments', () => {
      expect(getAbsoluteUrl('https://example.com/openapi.yaml', 'schema.yaml#/components/schemas/Test')).toBe(
        'https://example.com/schema.yaml#/components/schemas/Test',
      )
    })
  })
})
