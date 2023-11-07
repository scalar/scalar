import { describe, expect, it } from 'vitest'

import { analyze } from './analyze'
import { parse } from './parse'

describe('analyze', () => {
  it('detects the title', async () => {
    const spec = { openapi: '3.1.0', info: { title: 'Example' }, paths: {} }

    expect(analyze(await parse(spec))).toMatchObject({
      hasTitle: true,
    })
  })

  it('detects a missing title', async () => {
    const spec = { openapi: '3.1.0', info: {}, paths: {} }

    expect(analyze(await parse(spec))).toMatchObject({
      hasTitle: false,
    })
  })

  it('detects the description', async () => {
    const spec = {
      openapi: '3.1.0',
      info: { description: 'Example' },
      paths: {},
    }

    expect(analyze(await parse(spec))).toMatchObject({
      hasDescription: true,
    })
  })

  it('detects a missing title', async () => {
    const spec = { openapi: '3.1.0', info: {}, paths: {} }

    expect(analyze(await parse(spec))).toMatchObject({
      hasDescription: false,
    })
  })

  it('counts tags', async () => {
    const spec = {
      openapi: '3.1.0',
      info: {},
      paths: {
        '/example': {
          get: {
            tags: ['foo', 'bar'],
          },
        },
      },
      tags: [
        {
          name: 'foo',
        },
        {
          name: 'bar',
        },
      ],
    }

    expect(analyze(await parse(spec))).toMatchObject({
      numberOfTags: 2,
    })
  })

  it('counts tags in operations', async () => {
    const spec = {
      openapi: '3.1.0',
      info: {},
      paths: {
        '/example': {
          get: {
            tags: ['foobar'],
          },
        },
      },
    }

    expect(analyze(await parse(spec))).toMatchObject({
      numberOfTags: 1,
    })
  })

  it('counts tags and tags in operations', async () => {
    const spec = {
      openapi: '3.1.0',
      info: {},
      tags: [
        {
          name: 'foo',
        },
      ],
      paths: {
        '/example': {
          get: {
            tags: ['bar', 'foo'],
          },
        },
      },
    }

    expect(analyze(await parse(spec))).toMatchObject({
      numberOfTags: 2,
    })
  })

  it('merges tags and tags in operations', async () => {
    const spec = {
      openapi: '3.1.0',
      info: {},
      tags: [
        {
          name: 'foobar',
        },
      ],
      paths: {
        '/example': {
          get: {
            tags: ['foobar'],
          },
        },
      },
    }

    expect(analyze(await parse(spec))).toMatchObject({
      numberOfTags: 1,
    })
  })

  it('counts operations', async () => {
    const spec = {
      openapi: '3.1.0',
      info: {},
      paths: {
        '/example': {
          get: {},
          post: {},
        },
      },
    }

    expect(analyze(await parse(spec))).toMatchObject({
      numberOfOperations: 2,
    })
  })

  it('counts models', async () => {
    const spec = {
      openapi: '3.1.0',
      info: {},
      paths: {},
      components: {
        schemas: {
          success: {
            required: ['data'],
            properties: {
              links: {
                description: 'Link members related to the primary data.',
              },
              included: {
                description:
                  'To reduce the number of HTTP requests, servers **MAY** allow responses that include related resources along with the requested primary resources. Such responses are called "compound documents".',
                type: 'array',
              },
            },
            type: 'object',
            additionalProperties: false,
          },
        },
      },
    }

    expect(analyze(await parse(spec))).toMatchObject({
      numberOfModels: 1,
    })
  })
})
