import { describe, expect, it } from 'vitest'
import { getFeaturedClients, isFeaturedClient } from './featured-clients'
import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'
import type { AvailableClients } from '@scalar/snippetz'

describe('featured-clients', () => {
  // Test data setup
  const mockClientOptions: ClientOptionGroup[] = [
    {
      label: 'Shell',
      options: [
        {
          id: 'shell/curl',
          label: 'cURL',
          lang: 'curl',
          title: 'Shell cURL',
          targetKey: 'shell',
          targetTitle: 'Shell',
          clientKey: 'curl',
        },
        {
          id: 'shell/httpie',
          label: 'HTTPie',
          lang: 'shell',
          title: 'Shell HTTPie',
          targetKey: 'shell',
          targetTitle: 'Shell',
          clientKey: 'httpie',
        },
      ],
    },
    {
      label: 'Ruby',
      options: [
        {
          id: 'ruby/native',
          label: 'Native',
          lang: 'ruby',
          title: 'Ruby Native',
          targetKey: 'ruby',
          targetTitle: 'Ruby',
          clientKey: 'native',
        },
      ],
    },
    {
      label: 'Node.js',
      options: [
        {
          id: 'node/undici',
          label: 'Undici',
          lang: 'node',
          title: 'Node.js Undici',
          targetKey: 'node',
          targetTitle: 'Node.js',
          clientKey: 'undici',
        },
        {
          id: 'node/fetch',
          label: 'Fetch',
          lang: 'node',
          title: 'Node.js Fetch',
          targetKey: 'node',
          targetTitle: 'Node.js',
          clientKey: 'fetch',
        },
      ],
    },
    {
      label: 'PHP',
      options: [
        {
          id: 'php/guzzle',
          label: 'Guzzle',
          lang: 'php',
          title: 'PHP Guzzle',
          targetKey: 'php',
          targetTitle: 'PHP',
          clientKey: 'guzzle',
        },
        {
          id: 'php/curl',
          label: 'cURL',
          lang: 'php',
          title: 'PHP cURL',
          targetKey: 'php',
          targetTitle: 'PHP',
          clientKey: 'curl',
        },
      ],
    },
    {
      label: 'Python',
      options: [
        {
          id: 'python/python3',
          label: 'Python3',
          lang: 'python',
          title: 'Python Python3',
          targetKey: 'python',
          targetTitle: 'Python',
          clientKey: 'python3',
        },
        {
          id: 'python/requests',
          label: 'Requests',
          lang: 'python',
          title: 'Python Requests',
          targetKey: 'python',
          targetTitle: 'Python',
          clientKey: 'requests',
        },
      ],
    },
  ]

  describe('isFeaturedClient', () => {
    describe('when clientId is a featured client', () => {
      it('should return true for shell/curl', () => {
        const result = isFeaturedClient('shell/curl')
        expect(result).toBe(true)
      })

      it('should return true for ruby/native', () => {
        const result = isFeaturedClient('ruby/native')
        expect(result).toBe(true)
      })

      it('should return true for node/undici', () => {
        const result = isFeaturedClient('node/undici')
        expect(result).toBe(true)
      })

      it('should return true for php/guzzle', () => {
        const result = isFeaturedClient('php/guzzle')
        expect(result).toBe(true)
      })

      it('should return true for python/python3', () => {
        const result = isFeaturedClient('python/python3')
        expect(result).toBe(true)
      })
    })

    describe('when clientId is not a featured client', () => {
      it('should return false for non-featured client', () => {
        const result = isFeaturedClient('shell/httpie')
        expect(result).toBe(false)
      })

      it('should return false for another non-featured client', () => {
        const result = isFeaturedClient('js/fetch')
        expect(result).toBe(false)
      })

      it('should return false for python/requests', () => {
        const result = isFeaturedClient('python/requests')
        expect(result).toBe(false)
      })
    })

    describe('when clientId is undefined', () => {
      it('should return false for undefined clientId', () => {
        const result = isFeaturedClient(undefined)
        expect(result).toBe(false)
      })
    })

    describe('with custom featured clients list', () => {
      it('should use custom featured clients list', () => {
        const customFeaturedClients = ['js/fetch', 'python/requests'] satisfies AvailableClients[number][]
        const result = isFeaturedClient('js/fetch', customFeaturedClients)
        expect(result).toBe(true)
      })

      it('should return false for client not in custom list', () => {
        const customFeaturedClients = ['js/fetch', 'python/requests'] satisfies AvailableClients[number][]
        const result = isFeaturedClient('shell/curl', customFeaturedClients)
        expect(result).toBe(false)
      })

      it('should return false for undefined with custom list', () => {
        const customFeaturedClients = ['js/fetch', 'python/requests'] satisfies AvailableClients[number][]
        const result = isFeaturedClient(undefined, customFeaturedClients)
        expect(result).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should handle empty featured clients list', () => {
        const emptyFeaturedClients: any = []
        const result = isFeaturedClient('shell/curl', emptyFeaturedClients)
        expect(result).toBe(false)
      })

      it('should handle single item featured clients list', () => {
        const singleFeaturedClient = ['js/fetch'] satisfies AvailableClients[number][]
        const result = isFeaturedClient('js/fetch', singleFeaturedClient)
        expect(result).toBe(true)
      })
    })
  })

  describe('getFeaturedClients', () => {
    describe('with default featured clients', () => {
      it('should return only featured clients from the options', () => {
        const result = getFeaturedClients(mockClientOptions)

        expect(result).toHaveLength(5)
        expect(result.map((client) => client.id)).toEqual([
          'shell/curl',
          'ruby/native',
          'node/undici',
          'php/guzzle',
          'python/python3',
        ])
      })

      it('should maintain the order of featured clients', () => {
        const result = getFeaturedClients(mockClientOptions)

        // Check that the order matches the FEATURED_CLIENTS constant
        expect(result[0].id).toBe('shell/curl')
        expect(result[1].id).toBe('ruby/native')
        expect(result[2].id).toBe('node/undici')
        expect(result[3].id).toBe('php/guzzle')
        expect(result[4].id).toBe('python/python3')
      })

      it('should include all required properties for each client', () => {
        const result = getFeaturedClients(mockClientOptions)

        result.forEach((client) => {
          expect(client).toHaveProperty('id')
          expect(client).toHaveProperty('label')
          expect(client).toHaveProperty('lang')
          expect(client).toHaveProperty('title')
          expect(client).toHaveProperty('targetKey')
          expect(client).toHaveProperty('targetTitle')
          expect(client).toHaveProperty('clientKey')
        })
      })
    })

    describe('with custom featured clients list', () => {
      it('should return only clients from custom featured list', () => {
        const customFeaturedClients = ['js/fetch', 'python/httpx_sync'] satisfies AvailableClients[number][]
        const result = getFeaturedClients(mockClientOptions, customFeaturedClients)

        expect(result).toHaveLength(0) // None of these are in our mock data
      })

      it('should return clients that exist in both options and custom list', () => {
        const customFeaturedClients = ['shell/curl', 'python/python3'] satisfies AvailableClients[number][]
        const result = getFeaturedClients(mockClientOptions, customFeaturedClients)

        expect(result).toHaveLength(2)
        expect(result.map((client) => client.id)).toEqual(['shell/curl', 'python/python3'])
      })
    })

    describe('edge cases', () => {
      it('should return empty array when no featured clients are found', () => {
        const nonFeaturedOptions: ClientOptionGroup[] = [
          {
            label: 'JavaScript',
            options: [
              {
                id: 'js/fetch',
                label: 'Fetch',
                lang: 'js',
                title: 'JavaScript Fetch',
                targetKey: 'js',
                targetTitle: 'JavaScript',
                clientKey: 'fetch',
              },
            ],
          },
        ]

        const result = getFeaturedClients(nonFeaturedOptions)
        expect(result).toEqual([])
      })

      it('should handle empty client options', () => {
        const result = getFeaturedClients([])
        expect(result).toEqual([])
      })

      it('should handle groups with empty options arrays', () => {
        const emptyGroups: ClientOptionGroup[] = [
          {
            label: 'Empty Group',
            options: [],
          },
          {
            label: 'Valid Group',
            options: [
              {
                id: 'shell/curl',
                label: 'cURL',
                lang: 'curl',
                title: 'Shell cURL',
                targetKey: 'shell',
                targetTitle: 'Shell',
                clientKey: 'curl',
              },
            ],
          },
        ]

        const result = getFeaturedClients(emptyGroups)
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('shell/curl')
      })

      it('should handle empty featured clients list', () => {
        const emptyFeaturedClients: AvailableClients[number][] = []
        const result = getFeaturedClients(mockClientOptions, emptyFeaturedClients)
        expect(result).toEqual([])
      })

      it('should handle single item featured clients list', () => {
        const singleFeaturedClient = ['shell/curl'] as AvailableClients[number][]
        const result = getFeaturedClients(mockClientOptions, singleFeaturedClient)

        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('shell/curl')
      })
    })

    describe('data integrity', () => {
      it('should preserve all client properties', () => {
        const result = getFeaturedClients(mockClientOptions)

        const curlClient = result.find((client) => client.id === 'shell/curl')
        expect(curlClient).toEqual({
          id: 'shell/curl',
          label: 'cURL',
          lang: 'curl',
          title: 'Shell cURL',
          targetKey: 'shell',
          targetTitle: 'Shell',
          clientKey: 'curl',
        })
      })

      it('should not modify the original client options', () => {
        const originalOptions = JSON.parse(JSON.stringify(mockClientOptions))
        getFeaturedClients(mockClientOptions)

        expect(mockClientOptions).toEqual(originalOptions)
      })
    })
  })
})
