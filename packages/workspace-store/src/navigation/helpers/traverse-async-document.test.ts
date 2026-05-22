import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

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
    // Narrow to TraversedDescription so `children` resolves on the union.
    const introChildren = intro && intro.type === 'text' ? intro.children : undefined
    expect(introChildren).toEqual([
      { id: expect.any(String), title: 'Event-Driven Features', type: 'text', children: [] },
      { id: expect.any(String), title: 'Resources', type: 'text', children: [] },
    ])
  })

  it('appends a Messages container after the Introduction when messages exist', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: { title: 'Streetlights', version: '1.0.0' },
      components: { messages: { LightOn: { title: 'Light On' } } },
      'x-scalar-original-document-hash': '',
    }

    const nav = traverseAsyncDocument('streetlights', document)

    expect(nav.children?.map((entry) => entry.type)).toEqual(['text', 'messages'])
  })
})
