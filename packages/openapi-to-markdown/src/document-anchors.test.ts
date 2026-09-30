import { describe, expect, it } from 'vitest'

import { anchor, createDocumentAnchors } from './document-anchors'

describe('document-anchors', () => {
  it('keeps distinct identities unique even when names contain numeric suffixes', () => {
    const anchors = createDocumentAnchors()
    expect(anchors.get('schema', 'Pet')).toBe('scalar-schema-pet')
    expect(anchors.get('schema', 'Pet!')).toBe('scalar-schema-pet-1')
    expect(anchors.get('schema', 'Pet-1')).toBe('scalar-schema-pet-1-1')
    expect(anchors.get('schema', 'Pet!')).toBe('scalar-schema-pet-1')
  })

  it('retains Unicode and removes characters that could inject HTML', () => {
    const id = createDocumentAnchors().get('schema', '猫"/><script>')
    expect(id).toBe('scalar-schema-猫script')
    expect(anchor(id)).toStrictEqual({ type: 'html', value: '<a id="scalar-schema-猫script"></a>' })
    expect(createDocumentAnchors().get('schema', '!!!')).toBe('scalar-schema')
  })
})
