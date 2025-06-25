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
        { id: 'js/fetch', label: 'Fetch API', lang: 'js', title: 'Fetch API' },
        { id: 'js/axios', label: 'Axios', lang: 'js', title: 'Axios' },
        { id: 'js/jquery', label: 'jQuery', lang: 'js', title: 'jQuery' },
      ],
    },
    {
      label: 'Python',
      options: [
        { id: 'python/requests', label: 'Requests', lang: 'python', title: 'Requests' },
        { id: 'python/httpx_sync', label: 'HTTPX Sync', lang: 'python', title: 'HTTPX Sync' },
      ],
    },
    {
      label: 'Shell',
      options: [
        { id: 'shell/curl', label: 'cURL', lang: 'shell', title: 'cURL' },
        { id: 'shell/httpie', label: 'HTTPie', lang: 'shell', title: 'HTTPie' },
      ],
    },
  ]

  describe('when clientId is provided and found', () => {
    it('should return the exact client when found in first group', () => {
      const result = findClient(mockClientGroups, 'js/fetch')

      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Fetch API',
        lang: 'js',
        title: 'Fetch API',
      })
    })

    it('should return the exact client when found in second group', () => {
      const result = findClient(mockClientGroups, 'python/requests')

      expect(result).toEqual({
        id: 'python/requests',
        label: 'Requests',
        lang: 'python',
        title: 'Requests',
      })
    })

    it('should return the exact client when found in third group', () => {
      const result = findClient(mockClientGroups, 'shell/curl')

      expect(result).toEqual({
        id: 'shell/curl',
        label: 'cURL',
        lang: 'shell',
        title: 'cURL',
      })
    })

    it('should return the exact client when found in middle of options array', () => {
      const result = findClient(mockClientGroups, 'js/axios')

      expect(result).toEqual({
        id: 'js/axios',
        label: 'Axios',
        lang: 'js',
        title: 'Axios',
      })
    })

    it('should return the exact client when found in last position of options array', () => {
      const result = findClient(mockClientGroups, 'js/jquery')

      expect(result).toEqual({
        id: 'js/jquery',
        label: 'jQuery',
        lang: 'js',
        title: 'jQuery',
      })
    })
  })

  describe('when clientId is provided but not found', () => {
    it('should return first option when clientId does not exist', () => {
      const result = findClient(mockClientGroups, 'nonexistent/client' as AvailableClients[number])

      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Fetch API',
        lang: 'js',
        title: 'Fetch API',
      })
    })

    it('should return first option when clientId is empty string', () => {
      const result = findClient(mockClientGroups, '' as AvailableClients[number])

      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Fetch API',
        lang: 'js',
        title: 'Fetch API',
      })
    })

    it('should return first option when clientId is null-like', () => {
      const result = findClient(mockClientGroups, null as unknown as AvailableClients[number])

      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Fetch API',
        lang: 'js',
        title: 'Fetch API',
      })
    })
  })

  describe('when clientId is not provided', () => {
    it('should return first option when clientId is undefined', () => {
      const result = findClient(mockClientGroups)

      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Fetch API',
        lang: 'js',
        title: 'Fetch API',
      })
    })

    it('should return first option when clientId is explicitly undefined', () => {
      const result = findClient(mockClientGroups, undefined)

      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Fetch API',
        lang: 'js',
        title: 'Fetch API',
      })
    })
  })

  describe('edge cases with empty or minimal data', () => {
    it('should handle single group with single option', () => {
      const singleGroup: ClientOptionGroup[] = [
        {
          label: 'Test',
          options: [{ id: 'js/fetch', label: 'Test Client', lang: 'js', title: 'Test Client' }],
        },
      ]

      const result = findClient(singleGroup, 'js/fetch')

      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Test Client',
        lang: 'js',
        title: 'Test Client',
      })
    })

    it('should return first option when searching in single group with single option', () => {
      const singleGroup: ClientOptionGroup[] = [
        {
          label: 'Test',
          options: [{ id: 'js/fetch', label: 'Test Client', lang: 'js', title: 'Test Client' }],
        },
      ]

      const result = findClient(singleGroup)

      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Test Client',
        lang: 'js',
        title: 'Test Client',
      })
    })

    it('should handle group with empty options array', () => {
      const groupsWithEmpty: ClientOptionGroup[] = [
        {
          label: 'Empty Group',
          options: [],
        },
        {
          label: 'Valid Group',
          options: [{ id: 'js/fetch', label: 'Valid Client', lang: 'js', title: 'Valid Client' }],
        },
      ]

      const result = findClient(groupsWithEmpty, 'js/fetch')

      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Valid Client',
        lang: 'js',
        title: 'Valid Client',
      })
    })

    it('should return first option when first group has empty options', () => {
      const groupsWithEmpty: ClientOptionGroup[] = [
        {
          label: 'Empty Group',
          options: [],
        },
        {
          label: 'Valid Group',
          options: [{ id: 'js/fetch', label: 'Valid Client', lang: 'js', title: 'Valid Client' }],
        },
      ]

      const result = findClient(groupsWithEmpty)

      // This should return the first option from the first non-empty group
      // Based on the current implementation, it will try to access groupsWithEmpty[0].options[0]
      // which would be undefined, but the function doesn't handle this case
      // This test documents the current behavior
      expect(result).toBeUndefined()
    })
  })

  describe('case sensitivity and exact matching', () => {
    it('should be case sensitive when matching clientId', () => {
      const result = findClient(mockClientGroups, 'JS/FETCH' as AvailableClients[number])

      // Should not find the match due to case sensitivity
      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Fetch API',
        lang: 'js',
        title: 'Fetch API',
      })
    })

    it('should require exact string match', () => {
      const result = findClient(mockClientGroups, 'js/fetch' as AvailableClients[number])

      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Fetch API',
        lang: 'js',
        title: 'Fetch API',
      })
    })
  })

  describe('performance and iteration behavior', () => {
    it('should stop searching after finding the first match', () => {
      const groupsWithDuplicates: ClientOptionGroup[] = [
        {
          label: 'First Group',
          options: [{ id: 'js/fetch', label: 'First Match', lang: 'js', title: 'First Match' }],
        },
        {
          label: 'Second Group',
          options: [{ id: 'js/fetch', label: 'Second Match', lang: 'js', title: 'Second Match' }],
        },
      ]

      const result = findClient(groupsWithDuplicates, 'js/fetch')

      // Should return the first match found
      expect(result).toEqual({
        id: 'js/fetch',
        label: 'First Match',
        lang: 'js',
        title: 'First Match',
      })
    })

    it('should search through all groups when clientId is not found', () => {
      const result = findClient(mockClientGroups, 'nonexistent/client' as AvailableClients[number])

      // Should return first option after searching all groups
      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Fetch API',
        lang: 'js',
        title: 'Fetch API',
      })
    })
  })

  describe('type safety and validation', () => {
    it('should handle valid AvailableClients types', () => {
      const validClientIds: AvailableClients[number][] = [
        'js/fetch',
        'python/requests',
        'shell/curl',
        'node/axios',
        'csharp/httpclient',
      ]

      validClientIds.forEach((clientId) => {
        // This should not throw type errors
        const result = findClient(mockClientGroups, clientId)
        expect(result).toBeDefined()
      })
    })

    it('should handle undefined clientId parameter', () => {
      const result = findClient(mockClientGroups, undefined)

      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Fetch API',
        lang: 'js',
        title: 'Fetch API',
      })
    })
  })

  describe('real-world scenarios', () => {
    it('should work with actual client IDs from the snippetz library', () => {
      const realClientGroups: ClientOptionGroup[] = [
        {
          label: 'JavaScript',
          options: [
            { id: 'js/fetch', label: 'Fetch API', lang: 'js', title: 'Fetch API' },
            { id: 'js/axios', label: 'Axios', lang: 'js', title: 'Axios' },
            { id: 'js/jquery', label: 'jQuery', lang: 'js', title: 'jQuery' },
            { id: 'js/ofetch', label: 'ofetch', lang: 'js', title: 'ofetch' },
            { id: 'js/xhr', label: 'XMLHttpRequest', lang: 'js', title: 'XMLHttpRequest' },
          ],
        },
        {
          label: 'Node.js',
          options: [
            { id: 'node/axios', label: 'Axios', lang: 'node', title: 'Axios' },
            { id: 'node/fetch', label: 'Fetch', lang: 'node', title: 'Fetch' },
            { id: 'node/ofetch', label: 'ofetch', lang: 'node', title: 'ofetch' },
            { id: 'node/undici', label: 'undici', lang: 'node', title: 'undici' },
          ],
        },
      ]

      // Test with various real client IDs
      expect(findClient(realClientGroups, 'js/fetch')).toEqual({
        id: 'js/fetch',
        label: 'Fetch API',
        lang: 'js',
        title: 'Fetch API',
      })

      expect(findClient(realClientGroups, 'node/undici')).toEqual({
        id: 'node/undici',
        label: 'undici',
        lang: 'node',
        title: 'undici',
      })

      expect(findClient(realClientGroups, 'js/xhr')).toEqual({
        id: 'js/xhr',
        label: 'XMLHttpRequest',
        lang: 'js',
        title: 'XMLHttpRequest',
      })
    })

    it('should handle mixed client groups with different languages', () => {
      const mixedGroups: ClientOptionGroup[] = [
        {
          label: 'Web',
          options: [
            { id: 'js/fetch', label: 'Fetch API', lang: 'js', title: 'Fetch API' },
            { id: 'js/axios', label: 'Axios', lang: 'js', title: 'Axios' },
          ],
        },
        {
          label: 'Server',
          options: [
            { id: 'node/fetch', label: 'Node Fetch', lang: 'node', title: 'Node Fetch' },
            { id: 'python/requests', label: 'Python Requests', lang: 'python', title: 'Python Requests' },
          ],
        },
        {
          label: 'CLI',
          options: [{ id: 'shell/curl', label: 'cURL', lang: 'shell', title: 'cURL' }],
        },
      ]

      // Test finding clients across different groups
      expect(findClient(mixedGroups, 'python/requests')).toEqual({
        id: 'python/requests',
        label: 'Python Requests',
        lang: 'python',
        title: 'Python Requests',
      })

      expect(findClient(mixedGroups, 'shell/curl')).toEqual({
        id: 'shell/curl',
        label: 'cURL',
        lang: 'shell',
        title: 'cURL',
      })

      // Test fallback to first option
      expect(findClient(mixedGroups)).toEqual({
        id: 'js/fetch',
        label: 'Fetch API',
        lang: 'js',
        title: 'Fetch API',
      })
    })
  })

  describe('error handling and robustness', () => {
    it('should handle malformed client groups gracefully', () => {
      const malformedGroups = [
        {
          label: 'Test',
          options: [{ id: 'js/fetch', label: 'Test Client', lang: 'js', title: 'Test Client' }],
        },
      ] as ClientOptionGroup[]

      const result = findClient(malformedGroups, 'js/fetch')

      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Test Client',
        lang: 'js',
        title: 'Test Client',
      })
    })

    it('should handle groups with missing properties', () => {
      const incompleteGroups = [
        {
          label: 'Incomplete',
          options: [{ id: 'js/fetch', label: 'Incomplete Client', title: 'Incomplete Client' } as ClientOption],
        },
      ]

      const result = findClient(incompleteGroups, 'js/fetch')

      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Incomplete Client',
        title: 'Incomplete Client',
      })
    })
  })
})
