import { describe, expect, it } from 'vitest'

import { detectDocumentConflicts } from './detect-document-conflicts'

describe('detectDocumentConflicts', () => {
  it('returns false when nothing has changed on either side', () => {
    const doc = { info: { title: 'Pets' } }
    expect(
      detectDocumentConflicts({
        original: doc,
        local: structuredClone(doc),
        remote: structuredClone(doc),
      }),
    ).toBe(false)
  })

  it('returns false when only the local side changed', () => {
    expect(
      detectDocumentConflicts({
        original: { info: { title: 'Pets', version: '1.0.0' } },
        local: { info: { title: 'Pets API', version: '1.0.0' } },
        remote: { info: { title: 'Pets', version: '1.0.0' } },
      }),
    ).toBe(false)
  })

  it('returns false when only the remote side changed', () => {
    expect(
      detectDocumentConflicts({
        original: { info: { title: 'Pets', version: '1.0.0' } },
        local: { info: { title: 'Pets', version: '1.0.0' } },
        remote: { info: { title: 'Pets', version: '1.1.0' } },
      }),
    ).toBe(false)
  })

  it('returns false when local and remote edited disjoint paths', () => {
    expect(
      detectDocumentConflicts({
        original: { info: { title: 'Pets', version: '1.0.0' } },
        local: { info: { title: 'Pets API', version: '1.0.0' } },
        remote: { info: { title: 'Pets', version: '1.1.0' } },
      }),
    ).toBe(false)
  })

  it('returns true when both sides updated the same path to different values', () => {
    expect(
      detectDocumentConflicts({
        original: { info: { title: 'Pets', version: '1.0.0' } },
        local: { info: { title: 'Local Title', version: '1.0.0' } },
        remote: { info: { title: 'Remote Title', version: '1.0.0' } },
      }),
    ).toBe(true)
  })

  it('returns true when one side deletes a path the other modified', () => {
    expect(
      detectDocumentConflicts({
        original: { info: { title: 'Pets' }, paths: { '/pets': { get: {} } } },
        local: { info: { title: 'Pets' }, paths: { '/pets': { get: { summary: 'List' } } } },
        remote: { info: { title: 'Pets' }, paths: {} },
      }),
    ).toBe(true)
  })
})
