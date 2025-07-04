import { describe, expect, it } from 'vitest'
import { findClient } from './find-client'
import type { ClientOptionGroup } from '../types'
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
    it('returns the exact client when found', () => {
      const result = findClient(mockClientGroups, 'js/fetch')

      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Fetch API',
        lang: 'js',
        title: 'Fetch API',
      })
    })

    it('returns the exact client when found in different groups', () => {
      const result = findClient(mockClientGroups, 'python/requests')

      expect(result).toEqual({
        id: 'python/requests',
        label: 'Requests',
        lang: 'python',
        title: 'Requests',
      })
    })
  })

  describe('when clientId is provided but not found', () => {
    it('returns default client when clientId does not exist', () => {
      const result = findClient(mockClientGroups, 'nonexistent/client' as AvailableClients[number])

      expect(result).toEqual({
        id: 'shell/curl',
        label: 'cURL',
        lang: 'shell',
        title: 'cURL',
      })
    })
  })

  describe('when clientId is not provided', () => {
    it('returns default client when clientId is undefined', () => {
      const result = findClient(mockClientGroups)

      expect(result).toEqual({
        id: 'shell/curl',
        label: 'cURL',
        lang: 'shell',
        title: 'cURL',
      })
    })
  })

  describe('edge cases', () => {
    it('handles single group with single option', () => {
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

    it('returns first option when searching in single group without clientId', () => {
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

    it('handles group with empty options array', () => {
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

    it('returns undefined when first group has empty options and no default found', () => {
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

      expect(result).toBeUndefined()
    })
  })

  describe('custom client handling', () => {
    it('returns first option when first option is custom', () => {
      const customGroups: ClientOptionGroup[] = [
        {
          label: 'Custom',
          options: [
            { id: 'custom/example', label: 'Custom Client', lang: 'js', title: 'Custom Client' },
            { id: 'js/fetch', label: 'Fetch API', lang: 'js', title: 'Fetch API' },
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
            { id: 'js/fetch', label: 'Fetch API', lang: 'js', title: 'Fetch API' },
            { id: 'js/axios', label: 'Axios', lang: 'js', title: 'Axios' },
          ],
        },
        {
          label: 'Shell',
          options: [{ id: 'shell/curl', label: 'cURL', lang: 'shell', title: 'cURL' }],
        },
      ]

      const result = findClient(nonCustomGroups)

      expect(result).toEqual({
        id: 'shell/curl',
        label: 'cURL',
        lang: 'shell',
        title: 'cURL',
      })
    })

    it('returns first option when default client is not found', () => {
      const groupsWithoutDefault: ClientOptionGroup[] = [
        {
          label: 'JavaScript',
          options: [
            { id: 'js/fetch', label: 'Fetch API', lang: 'js', title: 'Fetch API' },
            { id: 'js/axios', label: 'Axios', lang: 'js', title: 'Axios' },
          ],
        },
      ]

      const result = findClient(groupsWithoutDefault)

      expect(result).toEqual({
        id: 'js/fetch',
        label: 'Fetch API',
        lang: 'js',
        title: 'Fetch API',
      })
    })
  })
})
