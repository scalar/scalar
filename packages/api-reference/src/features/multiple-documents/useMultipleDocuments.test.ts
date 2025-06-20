import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { normalizeConfigurations, useMultipleDocuments } from './useMultipleDocuments'

describe('useMultipleDocuments', () => {
  let mockUrl: URL
  let replaceStateSpy: any

  // Common test setup
  beforeEach(() => {
    mockUrl = new URL('http://example.com')
    vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)
    replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
  })

  describe('document selection', () => {
    it('selects document using numeric index from query parameter', () => {
      mockUrl = new URL('http://example.com?api=1')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multipleConfigurations = {
        configuration: ref([
          { url: '/openapi.json', slug: 'first-api' },
          { url: '/openapi-2.yaml', slug: 'second-api' },
        ]),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multipleConfigurations)

      expect(selectedDocumentIndex.value).toBe(1)
      expect(selectedConfiguration.value).toMatchObject(multipleConfigurations.configuration.value[1])
    })

    it('selects document using slug from query parameter', () => {
      mockUrl = new URL('http://example.com?api=second-api')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multipleConfigurations = {
        configuration: ref([
          { url: '/openapi.json', slug: 'first-api' },
          { url: '/openapi-2.yaml', slug: 'second-api' },
        ]),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multipleConfigurations)

      expect(selectedDocumentIndex.value).toBe(1)
      expect(selectedConfiguration.value).toMatchObject(multipleConfigurations.configuration.value[1])
    })

    it('defaults to first API when query parameter is invalid', () => {
      mockUrl = new URL('http://example.com?api=invalid')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multipleConfigurations = {
        configuration: ref([
          { url: '/openapi.json', slug: 'first-api' },
          { url: '/openapi-2.yaml', slug: 'second-api' },
        ]),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multipleConfigurations)

      expect(selectedDocumentIndex.value).toBe(0)
      expect(selectedConfiguration.value).toMatchObject(multipleConfigurations.configuration.value[0])
    })

    it('omits sources without url and content', () => {
      const multipleConfigurations = {
        configuration: ref({ sources: [{}] }),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { availableDocuments } = useMultipleDocuments(multipleConfigurations)
      expect(availableDocuments.value).toHaveLength(0)
    })

    it('selects first configuration marked as default at the top level', () => {
      mockUrl = new URL('http://example.com')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multipleConfigurations = {
        configuration: ref([
          {
            url: '/openapi.json',
            slug: 'first-api',
          },
          {
            url: '/openapi-2.yaml',
            slug: 'second-api',
            // This is the first configuration with default: true
            default: true,
          },
          {
            url: '/openapi-3.yaml',
            slug: 'third-api',
            // This default should be ignored since we already found one
            default: true,
          },
        ]),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multipleConfigurations)

      // Should select the second configuration (index 1)
      expect(selectedDocumentIndex.value).toBe(1)
      expect(selectedConfiguration.value).toMatchObject({
        url: '/openapi-2.yaml',
        slug: 'second-api',
      })
    })

    it('selects first source when no default is set and no query parameter exists', () => {
      mockUrl = new URL('http://example.com')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multipleConfigurations = {
        configuration: ref([
          { url: '/openapi.json', slug: 'first-api' },
          { url: '/openapi-2.yaml', slug: 'second-api' },
        ]),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multipleConfigurations)

      expect(selectedDocumentIndex.value).toBe(0)
      expect(selectedConfiguration.value).toMatchObject(multipleConfigurations.configuration.value[0])
    })
  })

  describe('URL management', () => {
    it.todo('updates URL when initializing with a selection', () => {
      const multipleConfigurations = {
        configuration: ref([
          { url: '/openapi.json', slug: 'first-api' },
          { url: '/openapi-2.yaml', slug: 'second-api' },
        ]),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multipleConfigurations)

      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', 'http://example.com/?api=first-api')
      expect(selectedDocumentIndex.value).toBe(0)
      expect(selectedConfiguration.value).toMatchObject(multipleConfigurations.configuration.value[0])
    })

    it('does not update URL when there is only one document', () => {
      const singleConfig = {
        configuration: ref([{ url: '/openapi.json', slug: 'single-api' }]),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      useMultipleDocuments(singleConfig)

      expect(replaceStateSpy).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('handles single API configuration', () => {
      const singleConfig = {
        configuration: ref({ url: '/openapi.json', slug: 'single-api' }),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { selectedConfiguration, availableDocuments } = useMultipleDocuments(singleConfig)

      expect(availableDocuments.value).toHaveLength(1)
      expect(selectedConfiguration.value).toMatchObject(singleConfig.configuration.value)
    })

    it('handles undefined configuration', () => {
      const emptyConfig = {
        configuration: ref(undefined),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { selectedConfiguration, availableDocuments } = useMultipleDocuments(emptyConfig)

      expect(availableDocuments.value).toHaveLength(0)
      expect(selectedConfiguration.value).toMatchObject({})
    })

    it('filters out APIs with undefined sources/url/content', () => {
      const configWithUndefinedSpec = {
        configuration: ref([{ url: undefined }, { url: '/openapi-2.yaml', slug: 'valid-api' }]),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { availableDocuments } = useMultipleDocuments(configWithUndefinedSpec)

      expect(availableDocuments.value).toHaveLength(1)
    })
  })

  describe('multiple sources', () => {
    it('selects API using numeric index from query parameter', () => {
      mockUrl = new URL('http://example.com?api=1')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multipleConfigurations = {
        configuration: ref({
          hideClientButton: true,
          sources: [
            {
              url: '/openapi-1.yaml',
              slug: 'first-api',
            },
            {
              url: '/openapi-2.yaml',
              slug: 'second-api',
            },
          ],
        }),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multipleConfigurations)

      expect(selectedDocumentIndex.value).toBe(1)
      expect(selectedConfiguration.value).toMatchObject({
        hideClientButton: true,
        url: '/openapi-2.yaml',
        slug: 'second-api',
      })
    })

    it('selects API using slug from query parameter', () => {
      mockUrl = new URL('http://example.com?api=second-api')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multipleConfigurations = {
        configuration: ref({
          sources: [
            {
              url: '/openapi-1.yaml',
              slug: 'first-api',
            },
            {
              url: '/openapi-2.yaml',
              slug: 'second-api',
            },
          ],
        }),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multipleConfigurations)

      expect(selectedDocumentIndex.value).toBe(1)
      expect(selectedConfiguration.value).toMatchObject({
        url: '/openapi-2.yaml',
        slug: 'second-api',
      })
    })

    it('defaults to first API if query parameter is invalid', () => {
      mockUrl = new URL('http://example.com?api=invalid-api')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multipleConfigurations = {
        configuration: ref({
          sources: [
            {
              url: '/openapi-1.yaml',
              slug: 'first-api',
            },
            {
              url: '/openapi-2.yaml',
              slug: 'second-api',
            },
          ],
        }),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multipleConfigurations)

      expect(selectedDocumentIndex.value).toBe(0)
      expect(selectedConfiguration.value).toMatchObject({
        url: '/openapi-1.yaml',
        slug: 'first-api',
      })
    })

    it('updates URL when selection changes', async () => {
      mockUrl = new URL('http://example.com')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

      const multipleConfigurations = {
        configuration: ref({
          sources: [
            {
              url: '/openapi-1.yaml',
              slug: 'first-api',
            },
            {
              url: '/openapi-2.yaml',
              slug: 'second-api',
            },
          ],
        }),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { selectedDocumentIndex } = useMultipleDocuments(multipleConfigurations)

      selectedDocumentIndex.value = 1

      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', 'http://example.com/?api=second-api')
    })

    it('filters out undefined sources', () => {
      const configWithUndefinedSource = {
        configuration: ref({
          sources: [
            undefined,
            {
              url: '/openapi.yaml',
              slug: 'valid-api',
            },
          ],
        }),
      }

      // @ts-expect-error This is a test for the edge case
      const { availableDocuments } = useMultipleDocuments(configWithUndefinedSource)

      expect(availableDocuments.value).toHaveLength(1)
      expect(availableDocuments.value[0].slug).toBe('valid-api')
    })

    it('handles multiple configurations with multiple sources', () => {
      // Set up the URL with the query parameter we want to test
      mockUrl = new URL('http://example.com?api=second-api-2')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multipleConfigurations = {
        configuration: ref([
          {
            sources: [
              {
                url: '/openapi-1.yaml',
                slug: 'first-api',
                title: 'First API',
              },
              {
                url: '/openapi-2.yaml',
                slug: 'second-api',
                title: 'Second API',
              },
            ],
          },
          {
            sources: [
              {
                url: '/openapi-3.yaml',
                slug: 'third-api',
                title: 'Third API',
              },
              {
                url: '/openapi-4.yaml',
                slug: 'fourth-api',
                title: 'Fourth API',
              },
            ],
          },
        ]),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { selectedDocumentIndex, selectedConfiguration, availableDocuments } =
        useMultipleDocuments(multipleConfigurations)

      // Check that all documents are available
      expect(availableDocuments.value).toHaveLength(4)

      // Verify the selected document matches the query parameter
      expect(selectedConfiguration.value).toMatchObject({
        url: '/openapi-1.yaml',
        slug: 'first-api',
        title: 'First API',
      })
      expect(selectedDocumentIndex.value).toBe(0)
    })

    it('handles multiple configurations with multiple sources and a default source', () => {
      // Set up the URL with the query parameter we want to test
      mockUrl = new URL('http://example.com?api=second-api-2')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multipleConfigurations = {
        configuration: ref([
          {
            sources: [
              {
                url: '/openapi-1.yaml',
                slug: 'first-api',
                title: 'First API ',
              },
              {
                url: '/openapi-2.yaml',
                slug: 'second-api',
                title: 'Second API',
              },
            ],
          },
          {
            sources: [
              {
                url: '/openapi-3.yaml',
                slug: 'third-api',
                title: 'Third API',
                // Setting the default source to the third AP
                default: true,
              },
              {
                url: '/openapi-4.yaml',
                slug: 'fourth-api',
                title: 'Fourth API',
              },
            ],
          },
        ]),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { selectedDocumentIndex, selectedConfiguration, availableDocuments } =
        useMultipleDocuments(multipleConfigurations)

      // Check that all documents are available
      expect(availableDocuments.value).toHaveLength(4)

      // Verify the selected document matches the query parameter
      expect(selectedConfiguration.value).toMatchObject({
        url: '/openapi-3.yaml',
        slug: 'third-api',
        title: 'Third API',
      })
      expect(selectedDocumentIndex.value).toBe(2)
    })
  })

  describe('title and slug handling', () => {
    it('generates slug from title if only title exists', () => {
      const config = {
        configuration: ref({
          sources: [
            {
              url: '/openapi-1.yaml',
              title: 'My Cool API',
            },
          ],
        }),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { availableDocuments } = useMultipleDocuments(config)

      expect(availableDocuments.value[0]).toMatchObject({
        title: 'My Cool API',
        slug: 'my-cool-api',
      })
    })

    it('uses slug as title if only slug exists', () => {
      const config = {
        configuration: ref({
          sources: [
            {
              url: '/openapi-1.yaml',
              slug: 'my-api',
            },
          ],
        }),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { availableDocuments } = useMultipleDocuments(config)

      expect(availableDocuments.value[0]).toMatchObject({
        title: 'my-api',
        slug: 'my-api',
      })
    })

    it('generates both title and slug from index if neither exists', () => {
      const config = {
        configuration: ref({
          sources: [
            {
              url: '/openapi-1.yaml',
            },
            {
              url: '/openapi-2.yaml',
            },
          ],
        }),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { availableDocuments } = useMultipleDocuments(config)

      expect(availableDocuments.value[0]).toMatchObject({
        title: 'API #1',
        slug: 'api-1',
      })
      expect(availableDocuments.value[1]).toMatchObject({
        title: 'API #2',
        slug: 'api-2',
      })
    })

    it('preserves existing slug when title is present', () => {
      const config = {
        configuration: ref({
          sources: [
            {
              url: '/openapi-1.yaml',
              title: 'My Cool API',
              slug: 'custom-slug',
            },
          ],
        }),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { availableDocuments } = useMultipleDocuments(config)

      expect(availableDocuments.value[0]).toMatchObject({
        title: 'My Cool API',
        slug: 'custom-slug',
      })
    })
  })

  describe('slugs', () => {
    it('generates slugs from the title', () => {
      mockUrl = new URL('http://example.com?slug=second-api')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multipleConfigurations = {
        configuration: ref({
          sources: [
            {
              url: '/openapi-1.yaml',
              title: 'First API',
            },
            {
              url: '/openapi-2.yaml',
              title: 'Second API',
            },
          ],
        }),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { availableDocuments } = useMultipleDocuments(multipleConfigurations)

      expect(availableDocuments.value[0].slug).toBe('first-api')
      expect(availableDocuments.value[1].slug).toBe('second-api')
      expect(availableDocuments.value[0].title).toBe('First API')
      expect(availableDocuments.value[1].title).toBe('Second API')
    })
  })

  describe('SSR compatibility', () => {
    it('works in SSR environment without window object', () => {
      // Temporarily remove window.location and window.history
      const originalWindow = global.window
      // @ts-expect-error Testing SSR environment
      global.window = undefined

      const config = {
        configuration: ref({
          sources: [
            {
              url: '/openapi-1.yaml',
              title: 'My API',
            },
          ],
        }),
        hash: ref(''),
        hashPrefix: ref(''),
        isIntersectionEnabled: ref(false),
      }

      const { selectedConfiguration, availableDocuments } = useMultipleDocuments(config)

      expect(availableDocuments.value).toHaveLength(1)
      expect(selectedConfiguration.value).toMatchObject({
        url: '/openapi-1.yaml',
        title: 'My API',
        slug: 'my-api',
      })

      // Restore window object
      global.window = originalWindow
    })
  })
})

describe('normalizeConfigurations', () => {
  it('returns empty array for undefined configuration', () => {
    expect(normalizeConfigurations(undefined)).toEqual([])
  })

  it('handles single configuration without sources', () => {
    const config = {
      url: '/openapi.json',
      title: 'Single API',
    }
    const result = normalizeConfigurations(config)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      url: '/openapi.json',
      title: 'Single API',
      slug: 'single-api',
    })
  })

  it('handles array of configurations without sources', () => {
    const configs = [
      { url: '/api1.json', title: 'API 1' },
      { url: '/api2.json', title: 'API 2' },
    ]
    const result = normalizeConfigurations(configs)
    expect(result).toHaveLength(2)
    expect(result[0].slug).toBe('api-1')
    expect(result[1].slug).toBe('api-2')
  })

  it('flattens configurations with sources', () => {
    const config = {
      hideClientButton: true,
      sources: [
        { url: '/api1.json', title: 'API 1' },
        { url: '/api2.json', title: 'API 2' },
      ],
    }
    const result = normalizeConfigurations(config)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      hideClientButton: true,
      url: '/api1.json',
      title: 'API 1',
    })
    expect(result[1]).toMatchObject({
      hideClientButton: true,
      url: '/api2.json',
      title: 'API 2',
    })
  })

  it('filters out invalid sources without url or content', () => {
    const config = {
      sources: [{ title: 'Invalid API' }, { url: '/valid.json', title: 'Valid API' }],
    }
    const result = normalizeConfigurations(config)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Valid API')
  })

  it('generates slugs from titles when missing', () => {
    const config = {
      sources: [{ url: '/api.json', title: 'My Cool API!' }],
    }
    const result = normalizeConfigurations(config)
    expect(result[0].slug).toBe('my-cool-api')
  })

  it('generates numeric slugs when no title or slug provided', () => {
    const config = {
      sources: [{ url: '/api1.json' }, { url: '/api2.json' }],
    }
    const result = normalizeConfigurations(config)
    expect(result[0].slug).toBe('api-1')
    expect(result[1].slug).toBe('api-2')
  })

  it('preserves existing slugs', () => {
    const config = {
      sources: [{ url: '/api.json', title: 'My API', slug: 'custom-slug' }],
    }
    const result = normalizeConfigurations(config)
    expect(result[0].slug).toBe('custom-slug')
  })

  it('handles mixed configuration types', () => {
    const configs = [
      { url: '/api1.json', title: 'Direct API' },
      {
        sources: [{ url: '/api2.json', title: 'Source API' }],
      },
    ]
    const result = normalizeConfigurations(configs)
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Direct API')
    expect(result[1].title).toBe('Source API')
  })

  it('merges spec properties from old format', () => {
    const config = {
      spec: {
        customField: 'value',
      },
      url: '/api.json',
      title: 'API',
    }
    const result = normalizeConfigurations(config)
    expect(result[0]).toMatchObject({
      customField: 'value',
      url: '/api.json',
      title: 'API',
    })
  })
})
