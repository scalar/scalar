import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it, vi } from 'vitest'
import { toRef, toValue } from 'vue'
import { createSidebar } from './create-sidebar'
import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { useNavState } from '@/hooks/useNavState'

// Mock vue's inject
vi.mock('vue', () => {
  const actual = require('vue')
  return {
    ...actual,
    inject: vi.fn().mockReturnValue({
      hash: { value: '' },
      hashPrefix: { value: '' },
      isIntersectionEnabled: { value: false },
    }),
  }
})

const config = apiReferenceConfigurationSchema.parse({})
const mockOptions = {
  config,
  ...useNavState(toRef(config)),
}

describe('createSidebar', () => {
  describe('instance', () => {
    it('creates a new instance every time', () => {
      const content = {
        openapi: '3.1.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/hello': {
            get: {
              summary: 'Hello World',
            },
          },
        },
      } as OpenAPIV3_1.Document

      const sidebar1 = createSidebar(content, mockOptions)
      const sidebar2 = createSidebar(content, mockOptions)

      // Every call to createSidebar should return a new instance
      expect(toValue(sidebar1)).not.toBe(toValue(sidebar2))

      // But have the same values
      expect(JSON.stringify(sidebar1)).toMatchObject(JSON.stringify(sidebar2))
    })
  })

  describe('empty content', () => {
    it("doesn't return any entries for an empty specification", () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {},
          },
          mockOptions,
        ),
      ).toStrictEqual({ entries: [], titles: new Map() })
    })
  })

  describe('tags', () => {
    it('has a tag', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/hello': {
                get: {
                  summary: 'Hello World',
                  tags: ['Foobar'],
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [
          {
            title: 'Foobar',
            children: [
              {
                title: 'Hello World',
              },
            ],
          },
        ],
      })
    })

    it('has multiple tags', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/hello': {
                get: {
                  summary: 'Hello World',
                  tags: ['Foobar', 'Barfoo'],
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [
          {
            title: 'Foobar',
            children: [
              {
                title: 'Hello World',
              },
            ],
          },
          {
            title: 'Barfoo',
            children: [
              {
                title: 'Hello World',
              },
            ],
          },
        ],
      })
    })

    it('shows operations without tags directly in the sidebar', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/hello': {
                get: {
                  summary: 'Get Hello',
                },
                post: {
                  summary: 'Post Hello',
                },
              },
              '/world': {
                get: {
                  summary: 'Get World',
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [
          {
            title: 'Get Hello',
          },
          {
            title: 'Post Hello',
          },
          {
            title: 'Get World',
          },
        ],
      })
    })

    it('filters out both internal and ignored tags', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: { title: 'Test', version: '1.0.0' },
            tags: [
              { name: 'Public' },
              { name: 'Internal', 'x-internal': true },
              { name: 'Ignored', 'x-scalar-ignore': true },
              { name: 'Both', 'x-internal': true, 'x-scalar-ignore': true },
            ],
            paths: {
              '/hello': {
                get: {
                  tags: ['Public'],
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [{ title: 'Public' }],
      })
    })

    it('sorts tags alphabetically', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/hello': {
                get: {
                  summary: 'Hello World',
                  tags: ['Foobar', 'Barfoo'],
                },
              },
            },
          },
          {
            ...mockOptions,
            config: {
              ...mockOptions.config,
              tagsSorter: 'alpha',
            },
          },
        ),
      ).toMatchObject({
        entries: [
          {
            title: 'Barfoo',
            children: [
              {
                title: 'Hello World',
              },
            ],
          },
          {
            title: 'Foobar',
            children: [
              {
                title: 'Hello World',
              },
            ],
          },
        ],
      })
    })

    it('sorts tags with custom function', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/hello': {
                get: {
                  summary: 'Hello World',
                  tags: ['Foobar', 'Barfoo'],
                },
              },
            },
          },
          {
            ...mockOptions,
            config: {
              ...mockOptions.config,
              tagsSorter: (a: { name: string }) => {
                if (a.name === 'Foobar') {
                  return -1
                }

                return 1
              },
            },
          },
        ),
      ).toMatchObject({
        entries: [
          {
            title: 'Foobar',
            children: [
              {
                title: 'Hello World',
              },
            ],
          },
          {
            title: 'Barfoo',
            children: [
              {
                title: 'Hello World',
              },
            ],
          },
        ],
      })
    })

    it('adds to existing tags', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            tags: [
              {
                name: 'Foobar',
                description: 'Foobar',
              },
            ],
            paths: {
              '/hello': {
                get: {
                  summary: 'Hello World',
                  tags: ['Foobar'],
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [
          {
            title: 'Foobar',
            children: [
              {
                title: 'Hello World',
              },
            ],
          },
        ],
      })
    })

    it('creates a default tag', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            tags: [
              {
                name: 'Foobar',
                description: 'Foobar',
              },
            ],
            paths: {
              '/hello': {
                get: {
                  summary: 'Get Hello World',
                  tags: ['foobar'],
                },
                post: {
                  summary: 'Post Hello World',
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [
          {
            title: 'foobar',
            children: [
              {
                title: 'Get Hello World',
              },
            ],
          },
          {
            title: 'default',
            children: [
              {
                title: 'Post Hello World',
              },
            ],
          },
        ],
      })
    })
  })

  describe('tag groups', () => {
    it('groups tags by x-tagGroups', () => {
      expect(
        createSidebar(
          {
            'openapi': '3.1.0',
            'info': {
              title: 'Example',
              version: '1.0',
            },
            'tags': [
              {
                name: 'planets',
              },
            ],
            'x-tagGroups': [
              {
                name: 'galaxy',
                tags: ['planets'],
              },
            ],
            'paths': {
              '/planets': {
                get: {
                  summary: 'Get all planets',
                  tags: ['planets'],
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [
          {
            title: 'galaxy',
            children: [
              {
                title: 'planets',
                children: [
                  {
                    title: 'Get all planets',
                  },
                ],
              },
            ],
          },
        ],
      })
    })

    it('groups tags by x-tagGroups and shows default webhook group', () => {
      expect(
        createSidebar(
          {
            'openapi': '3.1.0',
            'info': {
              title: 'Example',
              version: '1.0',
            },
            'tags': [
              {
                name: 'planets',
              },
            ],
            'x-tagGroups': [
              {
                name: 'galaxy',
                tags: ['planets'],
              },
            ],
            'paths': {
              '/planets': {
                get: {
                  summary: 'Get all planets',
                  tags: ['planets'],
                },
              },
            },
            'webhooks': {
              hello: {
                post: {
                  tags: ['planets'],
                  summary: 'Hello Webhook',
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [
          {
            title: 'galaxy',
            children: [
              {
                title: 'planets',
                children: [
                  {
                    title: 'Get all planets',
                  },
                  {
                    title: 'Hello Webhook',
                  },
                ],
              },
            ],
          },
        ],
      })
    })

    it.todo('groups tags by x-tagGroups and adds the webhooks to the tag group', () => {
      expect(
        createSidebar(
          {
            'openapi': '3.1.0',
            'info': {
              title: 'Example',
              version: '1.0',
            },
            'tags': [
              {
                name: 'planets',
              },
            ],
            'x-tagGroups': [
              {
                name: 'galaxy',
                tags: ['planets', 'webhooks'],
              },
            ],
            'paths': {
              '/planets': {
                get: {
                  summary: 'Get all planets',
                  tags: ['planets'],
                },
              },
            },
            'webhooks': {
              hello: {
                post: {
                  summary: 'Hello Webhook',
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [
          {
            title: 'galaxy',
            children: [
              {
                title: 'planets',
                children: [
                  {
                    title: 'Get all planets',
                  },
                ],
              },
              {
                title: 'Webhooks',
                children: [
                  {
                    title: 'Hello Webhook',
                  },
                ],
              },
            ],
          },
        ],
      })
    })

    it('groups tags by x-tagGroups and keeps the webhook default entry', () => {
      expect(
        createSidebar(
          {
            'openapi': '3.1.0',
            'info': {
              title: 'Example',
              version: '1.0',
            },
            'tags': [
              {
                name: 'planets',
              },
            ],
            'x-tagGroups': [
              {
                name: 'galaxy',
                tags: ['planets'],
              },
            ],
            'paths': {
              '/planets': {
                get: {
                  summary: 'Get all planets',
                  tags: ['planets'],
                },
              },
            },
            'webhooks': {
              hello: {
                post: {
                  summary: 'Hello Webhook',
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [
          {
            title: 'galaxy',
            children: [
              {
                title: 'planets',
                children: [
                  {
                    title: 'Get all planets',
                  },
                ],
              },
            ],
          },
          {
            title: 'Webhooks',
            children: [
              {
                title: 'Hello Webhook',
              },
            ],
          },
        ],
      })
    })
  })

  describe('description', () => {
    it('adds heading to the sidebar', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
              description: '# Foobar',
            },
            paths: {},
          },
          mockOptions,
        ),
      ).toMatchObject({
        titles: {},
        entries: [
          {
            id: 'description/foobar',
            title: 'Foobar',
            children: [],
          },
        ],
      })
    })

    it('adds two levels of headings to the sidebar', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
              description: '# Foobar\n\n## Barfoo',
            },
            paths: {},
          },
          mockOptions,
        ),
      ).toMatchObject({
        titles: {},
        entries: [
          {
            id: 'description/foobar',
            title: 'Foobar',
            children: [
              {
                id: 'description/barfoo',
                title: 'Barfoo',
              },
            ],
          },
        ],
      })
    })

    it("doesn't add third level of headings", () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
              description: '# Foobar\n\n## Barfoo\n\n### Foofoo',
            },
            paths: {},
          },
          mockOptions,
        ),
      ).toMatchObject({
        titles: {},
        entries: [
          {
            id: 'description/foobar',
            title: 'Foobar',
            children: [
              {
                id: 'description/barfoo',
                title: 'Barfoo',
              },
            ],
          },
        ],
      })
    })
  })

  describe('operations', () => {
    it('has a single entry for a single operation', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/hello': {
                get: {
                  summary: 'Hello World',
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [{ title: 'Hello World' }],
      })
    })

    it('has two entries for a single operation and a webhook', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/hello': {
                get: {
                  summary: 'Hello World',
                },
              },
            },
            webhooks: {
              hello: {
                post: {
                  'summary': 'Hello Webhook',
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [
          { title: 'Hello World' },
          {
            title: 'Webhooks',
            children: [
              {
                title: 'Hello Webhook',
              },
            ],
          },
        ],
      })
    })

    it('hides operations with x-internal: true', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/hello': {
                get: {
                  'summary': 'Get',
                  'x-internal': false,
                },
                post: {
                  'summary': 'Post',
                  'x-internal': true,
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [{ title: 'Get' }],
      })
    })

    it('sorts operations alphabetically with summary', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/hello': {
                get: {
                  summary: 'Operation A',
                  tags: ['Hello'],
                },
              },
              '/world': {
                get: {
                  summary: 'Operation B',
                  tags: ['Hello'],
                },
              },
            },
          },
          {
            ...mockOptions,
            config: {
              ...mockOptions.config,
              operationsSorter: 'alpha',
            },
          },
        ),
      ).toMatchObject({
        entries: [
          {
            title: 'Hello',
            children: [
              {
                title: 'Operation A',
              },
              {
                title: 'Operation B',
              },
            ],
          },
        ],
      })
    })

    it('sorts operations alphabetically with paths', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/foo': {
                get: {
                  tags: ['Hello'],
                },
              },
              '/bar': {
                get: {
                  tags: ['Hello'],
                },
              },
            },
          },
          {
            ...mockOptions,
            config: {
              ...mockOptions.config,
              operationsSorter: 'alpha',
            },
          },
        ),
      ).toMatchObject({
        entries: [
          {
            title: 'Hello',
            children: [
              {
                title: '/bar',
              },
              {
                title: '/foo',
              },
            ],
          },
        ],
      })
    })

    it('sorts operations by method', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/hello': {
                post: {
                  summary: 'Operation A',
                  tags: ['Example'],
                },
              },
              '/world': {
                get: {
                  summary: 'Operation B',
                  tags: ['Example'],
                },
              },
            },
          },
          {
            ...mockOptions,
            config: {
              ...mockOptions.config,
              operationsSorter: 'method',
            },
          },
        ),
      ).toMatchObject({
        entries: [
          {
            title: 'Example',
            children: [
              {
                title: 'Operation B',
              },
              {
                title: 'Operation A',
              },
            ],
          },
        ],
      })
    })

    it('sorts operations with custom function', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/foo': {
                post: {
                  summary: 'Hello World',
                  tags: ['Foobar'],
                },
              },
              '/hello': {
                delete: {
                  summary: 'Also World',
                  tags: ['Foobar'],
                },
              },
              '/world': {
                get: {
                  summary: 'Also Hello World',
                  tags: ['Foobar'],
                },
              },
              '/bar': {
                get: {
                  summary: 'Bar',
                  tags: ['Foobar'],
                },
              },
            },
          },
          {
            ...mockOptions,
            config: {
              ...mockOptions.config,
              operationsSorter: (a, b) => {
                const methodOrder = ['get', 'post', 'delete']
                const methodComparison = methodOrder.indexOf(a.method) - methodOrder.indexOf(b.method)

                if (methodComparison !== 0) {
                  return methodComparison
                }

                return a.path.localeCompare(b.path)
              },
            },
          },
        ),
      ).toMatchObject({
        entries: [
          {
            title: 'Foobar',
            children: [
              {
                title: 'Bar',
              },
              {
                title: 'Also Hello World',
              },
              {
                title: 'Hello World',
              },
              {
                title: 'Also World',
              },
            ],
          },
        ],
      })
    })
  })

  describe('webhooks', () => {
    it('shows webhooks', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {},
            webhooks: {
              hello: {
                post: {
                  'summary': 'Webhook',
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [{ title: 'Webhooks', children: [{ title: 'Webhook' }] }],
      })
    })

    it('hides webhooks with x-internal: true', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/hello': {
                get: {
                  summary: 'Operation',
                },
              },
            },
            webhooks: {
              hello: {
                post: {
                  'summary': 'Webhook',
                },
              },
              goodbye: {
                post: {
                  'summary': 'Secret Webhook',
                  'x-internal': true,
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [{ title: 'Operation' }, { title: 'Webhooks', children: [{ title: 'Webhook' }] }],
      })
    })

    it('shows operations and webhooks', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/hello': {
                get: {
                  summary: 'Operation',
                },
              },
            },
            webhooks: {
              hello: {
                post: {
                  'summary': 'Webhook',
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [{ title: 'Operation' }, { title: 'Webhooks', children: [{ title: 'Webhook' }] }],
      })
    })
  })

  describe('schemas', () => {
    it('shows schemas', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/hello': {
                get: {
                  summary: 'Get',
                },
              },
            },
            components: {
              schemas: {
                Planet: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [
          { title: 'Get' },
          {
            title: 'Models',
            children: [
              {
                title: 'Planet',
              },
            ],
          },
        ],
      })
    })

    it('hides schemas with x-internal: true', () => {
      expect(
        createSidebar(
          {
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/hello': {
                get: {
                  summary: 'Get',
                },
              },
            },
            components: {
              schemas: {
                Planet: {
                  'type': 'object',
                  'x-internal': false,
                  'properties': {
                    name: {
                      type: 'string',
                    },
                  },
                },
                User: {
                  'type': 'object',
                  'x-internal': true,
                  'properties': {
                    name: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          mockOptions,
        ),
      ).toMatchObject({
        entries: [
          { title: 'Get' },
          {
            title: 'Models',
            children: [
              {
                title: 'Planet',
              },
            ],
          },
        ],
      })
    })
  })
})
