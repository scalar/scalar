import { describe, expect, it } from 'vitest'
import { toValue } from 'vue'

import { parse } from '../helpers'
import { useSidebar } from './useSidebar'

/**
 * Parse the given OpenAPI definition and return the items for the sidebar.
 */
async function getItemsForDocument(definition: Record<string, any>) {
  const parsedSpec = await parse(definition)

  const { items } = useSidebar({
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
          title: 'Webhook',
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
          title: 'Webhook',
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
              title: 'Webhook',
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
          title: 'Webhook',
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
