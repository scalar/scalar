import { parse } from 'src/helpers/parse'
import { describe, expect, it } from 'vitest'

import { analyze } from './analyze'

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
      paths: {},
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
            tags: ['bar'],
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
})
