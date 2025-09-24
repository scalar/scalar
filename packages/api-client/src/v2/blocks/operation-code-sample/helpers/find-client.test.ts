import { describe, expect, it } from 'vitest'
import { findClient } from './find-client'
import type { ClientOption, ClientOptionGroup } from '../types'
import type { AvailableClients } from '@scalar/snippetz'

describe('findClient', () => {
  // Test data setup
  const mockClientGroups: ClientOptionGroup[] = [
    {
      label: 'JavaScript',
      options: [
        {
          id: 'js/fetch',
          label: 'Fetch API',
          lang: 'js',
          title: 'Fetch API',
          targetKey: 'js',
          targetTitle: 'JavaScript',
          clientKey: 'fetch',
        },
        {
          id: 'js/axios',
          label: 'Axios',
          lang: 'js',
          title: 'Axios',
          targetKey: 'js',
          targetTitle: 'JavaScript',
          clientKey: 'axios',
        },
        {
          id: 'js/jquery',
          label: 'jQuery',
          lang: 'js',
          title: 'jQuery',
          targetKey: 'js',
          targetTitle: 'JavaScript',
          clientKey: 'jquery',
        },
      ],
    },
    {
      label: 'Python',
      options: [
        {
          id: 'python/requests',
          label: 'Requests',
          lang: 'python',
          title: 'Requests',
          targetKey: 'python',
          targetTitle: 'Python',
          clientKey: 'requests',
        },
        {
          id: 'python/httpx_sync',
          label: 'HTTPX Sync',
          lang: 'python',
          title: 'HTTPX Sync',
          targetKey: 'python',
          targetTitle: 'Python',
          clientKey: 'httpx_sync',
        },
      ],
    },
    {
      label: 'Shell',
      options: [
        {
          id: 'shell/curl',
          label: 'cURL',
          lang: 'shell',
          title: 'cURL',
          targetKey: 'shell',
          targetTitle: 'Shell',
          clientKey: 'curl',
        },
        {
          id: 'shell/httpie',
          label: 'HTTPie',
          lang: 'shell',
          title: 'HTTPie',
          targetKey: 'shell',
          targetTitle: 'Shell',
          clientKey: 'httpie',
        },
      ],
    },
  ]

  describe('when clientId is provided and found', () => {
    it('returns the exact client when found', () => {
      const result = findClient(mockClientGroups, 'js/fetch')
      expect(result).toEqual(mockClientGroups[0].options[0])
    })

    it('returns the exact client when found in different groups', () => {
      const result = findClient(mockClientGroups, 'python/requests')
      expect(result).toEqual(mockClientGroups[1].options[0])
    })
  })

  describe('when clientId is provided but not found', () => {
    it('returns default client when clientId does not exist', () => {
      const result = findClient(mockClientGroups, 'nonexistent/client' as AvailableClients[number])
      expect(result).toEqual(mockClientGroups[2].options[0])
    })
  })

  describe('when clientId is not provided', () => {
    it('returns default client when clientId is undefined', () => {
      const result = findClient(mockClientGroups)
      expect(result).toEqual(mockClientGroups[2].options[0])
    })
  })

  describe('edge cases', () => {
    it('handles single group with single option', () => {
      const singleGroup: ClientOptionGroup[] = [
        {
          label: 'Test',
          options: [
            {
              id: 'js/fetch',
              label: 'Test Client',
              lang: 'js',
              title: 'Test Client',
              targetKey: 'js',
              targetTitle: 'JavaScript',
              clientKey: 'fetch',
            },
          ],
        },
      ]

      const result = findClient(singleGroup, 'js/fetch')

      expect(result).toEqual(singleGroup[0].options[0])
    })

    it('returns first option when searching in single group without clientId', () => {
      const singleGroup: ClientOptionGroup[] = [
        {
          label: 'Test',
          options: [
            {
              id: 'js/fetch',
              label: 'Test Client',
              lang: 'js',
              title: 'Test Client',
              targetKey: 'js',
              targetTitle: 'JavaScript',
              clientKey: 'fetch',
            },
          ],
        },
      ]

      const result = findClient(singleGroup)

      expect(result).toEqual(singleGroup[0].options[0])
    })

    it('handles group with empty options array', () => {
      const groupsWithEmpty: ClientOptionGroup[] = [
        {
          label: 'Empty Group',
          options: [],
        },
        {
          label: 'Valid Group',
          options: [
            {
              id: 'js/fetch',
              label: 'Valid Client',
              lang: 'js',
              title: 'Valid Client',
              targetKey: 'js',
              targetTitle: 'JavaScript',
              clientKey: 'fetch',
            },
          ],
        },
      ]

      const result = findClient(groupsWithEmpty, 'js/fetch')

      expect(result).toEqual(groupsWithEmpty[1].options[0])
    })

    it('returns undefined when first group has empty options and no default found', () => {
      const groupsWithEmpty: ClientOptionGroup[] = [
        {
          label: 'Empty Group',
          options: [],
        },
        {
          label: 'Valid Group',
          options: [
            {
              id: 'js/fetch',
              label: 'Valid Client',
              lang: 'js',
              title: 'Valid Client',
              targetKey: 'js',
              targetTitle: 'JavaScript',
              clientKey: 'fetch',
            },
          ],
        },
      ]

      const result = findClient(groupsWithEmpty)

      expect(result).toBeUndefined()
    })
  })

  describe('custom client handling', () => {
    it('returns first option when first option is custom', () => {
      const customGroups: ClientOptionGroup[] = [
        {
          label: 'Custom',
          options: [
            {
              id: 'custom/example',
              label: 'Custom Client',
              lang: 'js',
              title: 'Custom Client',
            } as unknown as ClientOption,
            {
              id: 'js/fetch',
              label: 'Fetch API',
              lang: 'js',
              title: 'Fetch API',
              targetKey: 'js',
              targetTitle: 'JavaScript',
              clientKey: 'fetch',
            },
          ],
        },
      ]

      const result = findClient(customGroups)

      expect(result).toEqual({
        id: 'custom/example',
        label: 'Custom Client',
        lang: 'js',
        title: 'Custom Client',
      })
    })

    it('returns default client when first option is not custom', () => {
      const nonCustomGroups: ClientOptionGroup[] = [
        {
          label: 'JavaScript',
          options: [
            {
              id: 'js/fetch',
              label: 'Fetch API',
              lang: 'js',
              title: 'Fetch API',
              targetKey: 'js',
              targetTitle: 'JavaScript',
              clientKey: 'fetch',
            },
            {
              id: 'js/axios',
              label: 'Axios',
              lang: 'js',
              title: 'Axios',
              targetKey: 'js',
              targetTitle: 'JavaScript',
              clientKey: 'axios',
            },
          ],
        },
        {
          label: 'Shell',
          options: [
            {
              id: 'shell/curl',
              label: 'cURL',
              lang: 'shell',
              title: 'cURL',
              targetKey: 'shell',
              targetTitle: 'Shell',
              clientKey: 'curl',
            },
          ],
        },
      ]

      const result = findClient(nonCustomGroups)

      expect(result).toEqual({
        id: 'shell/curl',
        label: 'cURL',
        lang: 'shell',
        title: 'cURL',
        targetKey: 'shell',
        targetTitle: 'Shell',
        clientKey: 'curl',
      })
    })

    it('returns first option when default client is not found', () => {
      const groupsWithoutDefault: ClientOptionGroup[] = [
        {
          label: 'JavaScript',
          options: [
            {
              id: 'js/fetch',
              label: 'Fetch API',
              lang: 'js',
              title: 'Fetch API',
              targetKey: 'js',
              targetTitle: 'JavaScript',
              clientKey: 'fetch',
            },
            {
              id: 'js/axios',
              label: 'Axios',
              lang: 'js',
              title: 'Axios',
              targetKey: 'js',
              targetTitle: 'JavaScript',
              clientKey: 'axios',
            },
          ],
        },
      ]

      const result = findClient(groupsWithoutDefault)

      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Fetch API',
        lang: 'js',
        title: 'Fetch API',
        targetKey: 'js',
        targetTitle: 'JavaScript',
        clientKey: 'fetch',
      })
    })
  })
})
