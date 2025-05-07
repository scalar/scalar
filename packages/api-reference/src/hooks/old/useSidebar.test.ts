import { describe, expect, it, vi } from 'vitest'
import { computed, toValue } from 'vue'

import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { parse } from '../../helpers'
import { type SorterOption, useSidebar } from './useSidebar'

// Mock the useConfig hook
vi.mock('@/hooks/useConfig', () => ({
  useConfig: vi.fn().mockReturnValue(computed(() => apiReferenceConfigurationSchema.parse({}))),
}))

// Mock vue's inject
vi.mock('vue', () => {
  const actual = require('vue')
  return {
    ...actual,
    inject: vi.fn().mockReturnValue({
      getTagId: vi.fn(),
      getOperationId: vi.fn(),
      getHeadingId: vi.fn(),
      getModelId: vi.fn(),
      getWebhookId: vi.fn(),
      hash: { value: '' },
      hashPrefix: { value: '' },
      isIntersectionEnabled: { value: false },
    }),
  }
})
/**
 * Parse the given OpenAPI definition and return the items for the sidebar.
 */
async function getItemsForDocument(definition: Record<string, any>, options?: SorterOption) {
  const parsedSpec = await parse(definition)

  const { items } = useSidebar({
    ...{
      tagsSorter: undefined,
      operationsSorter: undefined,
      ...options,
    },
    parsedSpec,
  })

  return toValue(items)
}

describe('useSidebar', async () => {
  it('doesn’t return any entries for an empty specification', async () => {
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
          tagsSorter: 'alpha',
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
          tagsSorter: (a) => {
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

  it('groups tags by x-tagGroups', async () => {
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

  it('groups tags by x-tagGroups and shows default webhook group', async () => {
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

  it('groups tags by x-tagGroups and adds the webhooks to the tag group', async () => {
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

  it('groups tags by x-tagGroups and keeps the webhook default entry', async () => {
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
              summary: 'Get',
            },
          },
        },
        webhooks: {
          hello: {
            post: {
              'summary': 'Hello Webhook',
              'x-internal': true,
            },
          },
        },
      }),
    ).toMatchObject({
      entries: [{ title: 'Get' }],
    })
  })

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

  it('doesn’t add third level of headings', async () => {
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
                summary: 'Hello',
                tags: ['Hello'],
              },
            },
            '/world': {
              get: {
                summary: 'Also Hello',
                tags: ['Hello'],
              },
            },
          },
        },
        {
          operationsSorter: 'alpha',
        },
      ),
    ).toMatchObject({
      entries: [
        {
          title: 'Hello',
          children: [
            {
              title: 'Also Hello',
            },
            {
              title: 'Hello',
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
          operationsSorter: 'alpha',
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
                summary: 'Also Hello',
                tags: ['Hello'],
              },
            },
            '/world': {
              get: {
                summary: 'Hello',
                tags: ['Hello'],
              },
            },
          },
        },
        {
          operationsSorter: 'method',
        },
      ),
    ).toMatchObject({
      entries: [
        {
          title: 'Hello',
          children: [
            {
              title: 'Hello',
            },
            {
              title: 'Also Hello',
            },
          ],
        },
      ],
    })
  })

  it('sorts operations with custom function', async () => {
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
          operationsSorter: (a, b) => {
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
