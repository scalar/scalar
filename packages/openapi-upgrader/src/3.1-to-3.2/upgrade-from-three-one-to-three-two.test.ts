import type { OpenAPIV3_2 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

import { upgradeFromThreeOneToThreeTwo } from '@/3.1-to-3.2/upgrade-from-three-one-to-three-two'

describe('upgradeFromThreeOneToThreeTwo', () => {
  describe('version', () => {
    it(`doesn't modify Swagger 2.0 files`, async () => {
      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo({
        swagger: '2.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      })

      expect(result.swagger).toBe('2.0')
    })

    it('changes the version to from 3.1.0 to 3.2.0', async () => {
      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo({
        openapi: '3.1.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      })

      expect(result.openapi).toBe('3.2.0')
    })

    it('changes the version to 3.1.1 to 3.2.0', async () => {
      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo({
        openapi: '3.1.1',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      })

      expect(result.openapi).toBe('3.2.0')
    })
  })

  describe('x-tagGroups migration', () => {
    it('migrates x-tagGroups to kind property for navigation groups', () => {
      const input = {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0',
        },
        paths: {},
        tags: [
          {
            name: 'account-updates',
            summary: 'Account Updates',
            description: 'Account update operations',
          },
        ],
        'x-tagGroups': [
          {
            name: 'Navigation',
            tags: ['account-updates'],
          },
        ],
      }

      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo(input)

      expect(result.openapi).toBe('3.2.0')
      expect(result['x-tagGroups']).toBeUndefined()
      expect(result.tags).toHaveLength(1)
      expect(result.tags?.[0]).toMatchObject({
        name: 'account-updates',
        summary: 'Account Updates',
        description: 'Account update operations',
        kind: 'nav',
      })
    })

    it('migrates x-tagGroups to kind property for audience groups', () => {
      const input = {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0',
        },
        paths: {},
        tags: [
          {
            name: 'partner',
            summary: 'Partner',
            description: 'Operations available to the partners network',
          },
          {
            name: 'external',
            summary: 'External',
            description: 'Operations available to external consumers',
            externalDocs: {
              description: 'Find more info here',
              url: 'https://example.com',
            },
          },
        ],
        'x-tagGroups': [
          {
            name: 'Audience',
            tags: ['partner', 'external'],
          },
        ],
      }

      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo(input)

      expect(result.openapi).toBe('3.2.0')
      expect(result['x-tagGroups']).toBeUndefined()
      expect(result.tags).toHaveLength(2)
      expect(result.tags?.[0]).toMatchObject({
        name: 'partner',
        summary: 'Partner',
        description: 'Operations available to the partners network',
        kind: 'audience',
      })
      expect(result.tags?.[1]).toMatchObject({
        name: 'external',
        summary: 'External',
        description: 'Operations available to external consumers',
        kind: 'audience',
        externalDocs: {
          description: 'Find more info here',
          url: 'https://example.com',
        },
      })
    })

    it('migrates x-tagGroups to kind property for badge groups', () => {
      const input = {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0',
        },
        paths: {},
        tags: [
          {
            name: 'beta',
            summary: 'Beta Features',
            description: 'Experimental features',
          },
        ],
        'x-tagGroups': [
          {
            name: 'Badge',
            tags: ['beta'],
          },
        ],
      }

      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo(input)

      expect(result.openapi).toBe('3.2.0')
      expect(result['x-tagGroups']).toBeUndefined()
      expect(result.tags).toBeDefined()
      expect(result.tags).toHaveLength(1)
      expect(result.tags![0]).toMatchObject({
        name: 'beta',
        summary: 'Beta Features',
        description: 'Experimental features',
        kind: 'badge',
      })
    })

    it('handles multiple tag groups with different kinds', () => {
      const input = {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0',
        },
        paths: {},
        tags: [
          {
            name: 'account-updates',
            summary: 'Account Updates',
            description: 'Account update operations',
          },
          {
            name: 'partner',
            summary: 'Partner',
            description: 'Operations available to the partners network',
          },
          {
            name: 'beta',
            summary: 'Beta Features',
            description: 'Experimental features',
          },
        ],
        'x-tagGroups': [
          {
            name: 'Navigation',
            tags: ['account-updates'],
          },
          {
            name: 'Audience',
            tags: ['partner'],
          },
          {
            name: 'Badge',
            tags: ['beta'],
          },
        ],
      }

      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo(input)

      expect(result.openapi).toBe('3.2.0')
      expect(result['x-tagGroups']).toBeUndefined()
      expect(result.tags).toHaveLength(3)
      expect(result.tags?.[0]).toMatchObject({
        name: 'account-updates',
        kind: 'nav',
      })
      expect(result.tags?.[1]).toMatchObject({
        name: 'partner',
        kind: 'audience',
      })
      expect(result.tags?.[2]).toMatchObject({
        name: 'beta',
        kind: 'badge',
      })
    })

    it('defaults to nav kind for unknown group types', () => {
      const input = {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0',
        },
        paths: {},
        tags: [
          {
            name: 'custom-tag',
            summary: 'Custom Tag',
            description: 'A custom tag',
          },
        ],
        'x-tagGroups': [
          {
            name: 'CustomGroup',
            tags: ['custom-tag'],
          },
        ],
      }

      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo(input)

      expect(result.openapi).toBe('3.2.0')
      expect(result['x-tagGroups']).toBeUndefined()
      expect(result.tags).toHaveLength(1)
      expect(result.tags?.[0]).toMatchObject({
        name: 'custom-tag',
        summary: 'Custom Tag',
        description: 'A custom tag',
        kind: 'nav',
      })
    })

    it('handles case-insensitive group name matching', () => {
      const input = {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0',
        },
        paths: {},
        tags: [
          {
            name: 'nav-tag',
            summary: 'Navigation Tag',
            description: 'A navigation tag',
          },
          {
            name: 'audience-tag',
            summary: 'Audience Tag',
            description: 'An audience tag',
          },
        ],
        'x-tagGroups': [
          {
            name: 'NAVIGATION',
            tags: ['nav-tag'],
          },
          {
            name: 'AUDIENCE',
            tags: ['audience-tag'],
          },
        ],
      }

      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo(input)

      expect(result.openapi).toBe('3.2.0')
      expect(result['x-tagGroups']).toBeUndefined()
      expect(result.tags).toHaveLength(2)
      expect(result.tags?.[0]).toMatchObject({
        name: 'nav-tag',
        kind: 'nav',
      })
      expect(result.tags?.[1]).toMatchObject({
        name: 'audience-tag',
        kind: 'audience',
      })
    })

    it('handles partial group name matching', () => {
      const input = {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0',
        },
        paths: {},
        tags: [
          {
            name: 'nav-tag',
            summary: 'Navigation Tag',
            description: 'A navigation tag',
          },
          {
            name: 'audience-tag',
            summary: 'Audience Tag',
            description: 'An audience tag',
          },
        ],
        'x-tagGroups': [
          {
            name: 'Main Navigation',
            tags: ['nav-tag'],
          },
          {
            name: 'User Audience',
            tags: ['audience-tag'],
          },
        ],
      }

      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo(input)

      expect(result.openapi).toBe('3.2.0')
      expect(result['x-tagGroups']).toBeUndefined()
      expect(result.tags).toHaveLength(2)
      expect(result.tags?.[0]).toMatchObject({
        name: 'nav-tag',
        kind: 'nav',
      })
      expect(result.tags?.[1]).toMatchObject({
        name: 'audience-tag',
        kind: 'audience',
      })
    })

    it('does not modify tags that are not in x-tagGroups', () => {
      const input = {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0',
        },
        paths: {},
        tags: [
          {
            name: 'ungrouped-tag',
            summary: 'Ungrouped Tag',
            description: 'A tag not in any group',
          },
          {
            name: 'grouped-tag',
            summary: 'Grouped Tag',
            description: 'A tag in a group',
          },
        ],
        'x-tagGroups': [
          {
            name: 'Navigation',
            tags: ['grouped-tag'],
          },
        ],
      }

      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo(input)

      expect(result.openapi).toBe('3.2.0')
      expect(result['x-tagGroups']).toBeUndefined()
      expect(result.tags).toBeDefined()
      expect(result.tags).toHaveLength(2)
      expect(result.tags![0]).toMatchObject({
        name: 'ungrouped-tag',
        summary: 'Ungrouped Tag',
        description: 'A tag not in any group',
        // No kind property should be added
      })
      expect(result.tags![0]!.kind).toBeUndefined()
      expect(result.tags![1]).toMatchObject({
        name: 'grouped-tag',
        summary: 'Grouped Tag',
        description: 'A tag in a group',
        kind: 'nav',
      })
    })

    it('handles documents without x-tagGroups', () => {
      const input = {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0',
        },
        paths: {},
        tags: [
          {
            name: 'simple-tag',
            summary: 'Simple Tag',
            description: 'A simple tag',
          },
        ],
      }

      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo(input)

      expect(result.openapi).toBe('3.2.0')
      expect(result.tags).toBeDefined()
      expect(result.tags).toHaveLength(1)
      expect(result.tags![0]).toMatchObject({
        name: 'simple-tag',
        summary: 'Simple Tag',
        description: 'A simple tag',
      })
      expect(result.tags![0]?.kind).toBeUndefined()
    })

    it('handles documents without tags array', () => {
      const input = {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0',
        },
        paths: {},
        'x-tagGroups': [
          {
            name: 'Navigation',
            tags: ['missing-tag'],
          },
        ],
      }

      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo(input)

      expect(result.openapi).toBe('3.2.0')
      expect(result['x-tagGroups']).toBeUndefined()
      expect(result.tags).toEqual([])
    })

    it('handles empty x-tagGroups array', () => {
      const input = {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0',
        },
        paths: {},
        tags: [
          {
            name: 'simple-tag',
            summary: 'Simple Tag',
            description: 'A simple tag',
          },
        ],
        'x-tagGroups': [],
      }

      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo(input)

      expect(result.openapi).toBe('3.2.0')
      expect(result['x-tagGroups']).toBeUndefined()
      expect(result.tags).toBeDefined()
      expect(result.tags).toHaveLength(1)
      expect(result.tags![0]?.kind).toBeUndefined()
    })

    it('preserves existing tag properties when adding kind', () => {
      const input = {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0',
        },
        paths: {},
        tags: [
          {
            name: 'complex-tag',
            summary: 'Complex Tag',
            description: 'A complex tag with many properties',
            externalDocs: {
              description: 'External documentation',
              url: 'https://example.com/docs',
            },
            'x-custom-extension': 'custom-value',
          },
        ],
        'x-tagGroups': [
          {
            name: 'Navigation',
            tags: ['complex-tag'],
          },
        ],
      }

      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo(input)

      expect(result.openapi).toBe('3.2.0')
      expect(result['x-tagGroups']).toBeUndefined()
      expect(result.tags).toHaveLength(1)
      expect(result.tags?.[0]).toMatchObject({
        name: 'complex-tag',
        summary: 'Complex Tag',
        description: 'A complex tag with many properties',
        kind: 'nav',
        externalDocs: {
          description: 'External documentation',
          url: 'https://example.com/docs',
        },
        'x-custom-extension': 'custom-value',
      })
    })
  })
})
