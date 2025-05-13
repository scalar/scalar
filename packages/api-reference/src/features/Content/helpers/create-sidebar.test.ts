import { describe, expect, it } from 'vitest'
import { toValue } from 'vue'

import { createCollection } from '@scalar/store'
import { type SortOptions, createSidebar } from './create-sidebar'

/**
 * Parse the given OpenAPI document and return the items for the sidebar.
 */
async function getItemsForDocument(content: Record<string, any>, options?: SortOptions) {
  const collection = createCollection(content)

  const { items } = createSidebar({
    ...{
      tagSort: undefined,
      operationSort: undefined,
      ...options,
    },
    collection,
  })

  return toValue(items)
}

describe('createSidebar', async () => {
  describe('instance', () => {
    it('creates a new instance every time', async () => {
      const collection = createCollection({
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
      })

      const sidebar1 = createSidebar({ collection })
      const sidebar2 = createSidebar({ collection })

      // Every call to createSidebar should return a new instance
      expect(toValue(sidebar1.items)).not.toBe(toValue(sidebar2.items))
      // But have the same values
      expect(JSON.stringify(toValue(sidebar1.items))).toMatchObject(JSON.stringify(toValue(sidebar2.items)))
    })
  })

  describe('empty content', () => {
    it("doesn't return any entries for an empty specification", async () => {
      expect(
        await getItemsForDocument({
          openapi: '3.1.0',
          info: {
            title: 'Hello World',
            version: '1.0.0',
          },
          paths: {},
        }),
      ).toStrictEqual({
        titles: {},
        entries: [],
      })
    })
  })

  describe('tags', () => {
    it('has a tag', async () => {
      expect(
        await getItemsForDocument({
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
        }),
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

    it('has multiple tags', async () => {
      expect(
        await getItemsForDocument({
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
        }),
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

    it('shows operations without tags directly in the sidebar', async () => {
      expect(
        await getItemsForDocument({
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
        }),
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

    it('filters out both internal and ignored tags', async () => {
      expect(
        await getItemsForDocument({
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
        }),
      ).toMatchObject({
        entries: [{ title: 'Public' }],
      })
    })

    it('sorts tags alphabetically', async () => {
      expect(
        await getItemsForDocument(
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
            tagSort: 'alpha',
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

    it('sorts tags with custom function', async () => {
      expect(
        await getItemsForDocument(
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
            tagSort: (a) => {
              if (a.name === 'Foobar') {
                return -1
              }

              return 1
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

    it('adds to existing tags', async () => {
      expect(
        await getItemsForDocument({
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
        }),
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

    it('creates a default tag', async () => {
      expect(
        await getItemsForDocument({
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
        }),
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
    it.only('groups tags by x-tagGroups', async () => {
      expect(
        await getItemsForDocument({
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
        }),
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

    it.only('groups tags by x-tagGroups and shows default webhook group', async () => {
      expect(
        await getItemsForDocument({
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
        }),
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

    it.todo('groups tags by x-tagGroups and adds the webhooks to the tag group', async () => {
      expect(
        await getItemsForDocument({
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
        }),
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

    it.todo('groups tags by x-tagGroups and keeps the webhook default entry', async () => {
      expect(
        await getItemsForDocument({
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
        }),
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
    it('adds heading to the sidebar', async () => {
      expect(
        await getItemsForDocument({
          openapi: '3.1.0',
          info: {
            title: 'Hello World',
            version: '1.0.0',
            description: '# Foobar',
          },
          paths: {},
        }),
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

    it('adds two levels of headings to the sidebar', async () => {
      expect(
        await getItemsForDocument({
          openapi: '3.1.0',
          info: {
            title: 'Hello World',
            version: '1.0.0',
            description: '# Foobar\n\n## Barfoo',
          },
          paths: {},
        }),
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

    it("doesn't add third level of headings", async () => {
      expect(
        await getItemsForDocument({
          openapi: '3.1.0',
          info: {
            title: 'Hello World',
            version: '1.0.0',
            description: '# Foobar\n\n## Barfoo\n\n### Foofoo',
          },
          paths: {},
        }),
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
    it('has a single entry for a single operation', async () => {
      expect(
        await getItemsForDocument({
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
        }),
      ).toMatchObject({
        entries: [{ title: 'Hello World' }],
      })
    })

    it('has two entries for a single operation and a webhook', async () => {
      expect(
        await getItemsForDocument({
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
                summary: 'Hello Webhook',
              },
            },
          },
        }),
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

    it('hides operations with x-internal: true', async () => {
      expect(
        await getItemsForDocument({
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
        }),
      ).toMatchObject({
        entries: [{ title: 'Get' }],
      })
    })

    it('sorts operations alphabetically with summary', async () => {
      expect(
        await getItemsForDocument(
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
            operationSort: 'alpha',
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

    it('sorts operations alphabetically with paths', async () => {
      expect(
        await getItemsForDocument(
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
            operationSort: 'alpha',
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

    it('sorts operations by method', async () => {
      expect(
        await getItemsForDocument(
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
            operationSort: 'method',
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

    it.todo('sorts operations with custom function', async () => {
      expect(
        await getItemsForDocument(
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
            operationSort: (a, b) => {
              const methodOrder = ['GET', 'POST', 'DELETE']
              const methodComparison = methodOrder.indexOf(a.httpVerb) - methodOrder.indexOf(b.httpVerb)

              if (methodComparison !== 0) {
                return methodComparison
              }

              return a.path.localeCompare(b.path)
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
    it('shows webhooks', async () => {
      expect(
        await getItemsForDocument({
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
        }),
      ).toMatchObject({
        entries: [{ title: 'Webhooks', children: [{ title: 'Webhook' }] }],
      })
    })

    it('hides webhooks with x-internal: true', async () => {
      expect(
        await getItemsForDocument({
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
        }),
      ).toMatchObject({
        entries: [{ title: 'Operation' }, { title: 'Webhooks', children: [{ title: 'Webhook' }] }],
      })
    })

    it('shows operations and webhooks', async () => {
      expect(
        await getItemsForDocument({
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
        }),
      ).toMatchObject({
        entries: [{ title: 'Operation' }, { title: 'Webhooks', children: [{ title: 'Webhook' }] }],
      })
    })
  })

  describe('schemas', () => {
    it('shows schemas', async () => {
      expect(
        await getItemsForDocument({
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
        }),
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

    it('hides schemas with x-internal: true', async () => {
      expect(
        await getItemsForDocument({
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
        }),
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
