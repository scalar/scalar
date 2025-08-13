import { join } from '@/utils/join/join'
import { describe, expect, it } from 'vitest'

describe('join', () => {
  it('should handle joining info objects, prioritizing the first input document', () => {
    const result = join([
      {
        info: {
          title: 'Main title',
          version: '1.1.1',
        },
      },
      {
        info: {
          title: 'Second title',
          version: '1.43.1',
          summary: 'Some extra information about the API',
        },
      },
      {
        info: {
          title: 'Third title',
          version: '1.3.1',
          summary: 'This will be overridden',
        },
      },
    ])

    expect(result).toEqual({
      ok: true,
      document: {
        info: {
          title: 'Main title',
          version: '1.1.1',
          summary: 'Some extra information about the API',
        },
        paths: {},
        webhooks: {},
        tags: [],
      },
    })
  })

  it('should merge path operations correctly', () => {
    const result = join([
      {
        paths: {
          '/': {
            get: {
              description: 'Get your feed',
            },
          },
        },
      },
      {
        paths: {
          '/': {
            post: {
              description: 'create a new post',
            },
          },
          '/users': {
            post: {
              description: 'create a new user',
            },
          },
        },
      },
    ])

    expect(result).toEqual({
      ok: true,
      document: {
        info: {},
        paths: {
          '/': {
            get: {
              description: 'Get your feed',
            },
            post: {
              description: 'create a new post',
            },
          },
          '/users': {
            post: {
              description: 'create a new user',
            },
          },
        },
        webhooks: {},
        tags: [],
      },
    })
  })

  it('should return conflicts when there is conflicts on the paths', () => {
    const result = join([
      {
        paths: {
          '/': {
            get: {
              description: 'Get your feed',
            },
          },
        },
      },
      {
        paths: {
          '/': {
            get: {
              description: 'Get the list of all post',
            },
            post: {
              description: 'create a new post',
            },
          },
          '/users': {
            post: {
              description: 'create a new user',
            },
          },
        },
        webhooks: {},
      },
    ])

    expect(result).toEqual({
      ok: false,
      conflicts: [
        {
          type: 'path',
          method: 'get',
          path: '/',
        },
      ],
    })
  })

  it('should merge webhooks correctly', () => {
    const result = join([
      {
        webhooks: {
          '/': {
            get: {
              description: 'Get your feed',
            },
          },
        },
      },
      {
        webhooks: {
          '/': {
            post: {
              description: 'create a new post',
            },
          },
          '/users': {
            post: {
              description: 'create a new user',
            },
          },
        },
      },
    ])

    expect(result).toEqual({
      ok: true,
      document: {
        info: {},
        paths: {},
        webhooks: {
          '/': {
            get: {
              description: 'Get your feed',
            },
            post: {
              description: 'create a new post',
            },
          },
          '/users': {
            post: {
              description: 'create a new user',
            },
          },
        },
        tags: [],
      },
    })
  })

  it('should return conflicts when there is conflicts on the paths', () => {
    const result = join([
      {
        webhooks: {
          '/': {
            get: {
              description: 'Get your feed',
            },
          },
        },
      },
      {
        webhooks: {
          '/': {
            get: {
              description: 'Get the list of all post',
            },
            post: {
              description: 'create a new post',
            },
          },
          '/users': {
            post: {
              description: 'create a new user',
            },
          },
        },
      },
    ])

    expect(result).toEqual({
      ok: false,
      conflicts: [
        {
          type: 'webhook',
          method: 'get',
          path: '/',
        },
      ],
    })
  })

  it('should merge tags', () => {
    const result = join([
      {
        tags: [
          {
            name: 'tag-1',
            description: 'some tag1 description',
          },
          {
            name: 'tag-2',
            description: 'some tag2 description',
          },
        ],
      },
      {
        tags: [
          {
            name: 'tag-1',
            description: 'some tag1 description',
          },
          {
            name: 'tag-3',
            description: 'some tag3 description',
          },
        ],
      },
      {
        tags: [
          {
            name: 'tag-4',
            description: 'some tag4 description',
          },
          {
            name: 'tag-3',
            description: 'some tag3 description',
          },
        ],
      },
    ])

    expect(result).toEqual({
      ok: true,
      document: {
        info: {},
        paths: {},
        webhooks: {},
        tags: [
          {
            description: 'some tag4 description',
            name: 'tag-4',
          },
          {
            description: 'some tag3 description',
            name: 'tag-3',
          },
          {
            description: 'some tag1 description',
            name: 'tag-1',
          },
          {
            description: 'some tag2 description',
            name: 'tag-2',
          },
        ],
      },
    })
  })
})
