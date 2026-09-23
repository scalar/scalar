import { describe, expect, it } from 'vitest'

import { resolveIntersectingEntry } from './resolve-intersecting-entry'

const documentStartId = 'doc/description/introduction'
const headingId = 'doc/description/resources'

describe('resolveIntersectingEntry', () => {
  it('resolves to the document start while the start of the document is in view', () => {
    expect(resolveIntersectingEntry({ id: headingId, documentStartId, documentStartTop: 0 })).toBe(documentStartId)
    expect(resolveIntersectingEntry({ id: documentStartId, documentStartId, documentStartTop: 0 })).toBe(
      documentStartId,
    )
  })

  it('resolves to the reported entry once the start of the document has scrolled past the top of the viewport', () => {
    expect(resolveIntersectingEntry({ id: headingId, documentStartId, documentStartTop: -1 })).toBe(headingId)
  })

  it('resolves to the reported entry when the document start is not rendered', () => {
    expect(resolveIntersectingEntry({ id: headingId, documentStartId, documentStartTop: undefined })).toBe(headingId)
  })
})
