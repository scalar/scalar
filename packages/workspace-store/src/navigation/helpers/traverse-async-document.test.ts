import { describe, expect, it } from 'vitest'

import type { AsyncApiDocument } from '@/schemas/asyncapi/asyncapi-document'

import { traverseAsyncDocument } from './traverse-async-document'

describe('traverseAsyncDocument', () => {
  it('emits a single Introduction entry when description is empty', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: { title: 'Streetlights', version: '1.0.0' },
      'x-scalar-original-document-hash': '',
    }

    const nav = traverseAsyncDocument('streetlights', document)

    expect(nav.children).toEqual([{ id: expect.any(String), title: 'Introduction', type: 'text' }])
  })

  it('extracts headings from info.description as children of Introduction', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: {
        title: 'Streetlights',
        version: '1.0.0',
        description:
          'Some leading text.\n\n## Event-Driven Features\n\n- bullet a\n- bullet b\n\n## Resources\n\n- link a\n',
      },
      'x-scalar-original-document-hash': '',
    }

    const nav = traverseAsyncDocument('streetlights', document)

    const intro = nav.children?.[0]
    expect(intro?.title).toBe('Introduction')
    expect(intro?.type).toBe('text')
    expect('children' in (intro ?? {}) ? (intro as { children?: unknown }).children : undefined).toEqual([
      { id: expect.any(String), title: 'Event-Driven Features', type: 'text', children: [] },
      { id: expect.any(String), title: 'Resources', type: 'text', children: [] },
    ])
  })
})
