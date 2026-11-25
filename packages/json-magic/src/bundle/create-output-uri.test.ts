import { describe, expect, it } from 'vitest'

import { createOutputUri } from './create-output-uri'

describe('create-output-uri', () => {
  it.each([
    ['/private/source/root.json', '/private/source/models/Pet #%.json'],
    [String.raw`C:\private\source\root.json`, String.raw`C:\private\source\models\Pet #%.json`],
    [String.raw`\\server\share\root.json`, String.raw`\\server\share\models\Pet #%.json`],
  ])('maps escaped paths relative to %s', (origin, source) => {
    const output = createOutputUri(origin, 'https://published.test/api/root.json')
    expect(output(origin)).toBe('https://published.test/api/root.json')
    expect(output(source)).toBe('https://published.test/api/models/Pet%20%23%25.json')
    expect(output('https://external.test/schema.json')).toBe('https://external.test/schema.json')
  })

  it('isolates external directories without exposing parent paths or merging equal filenames', () => {
    const output = createOutputUri('/private/source/root.json', 'https://published.test/api/root.json')
    expect(output('/private/shared/child.json')).toBe('https://published.test/api/__bundle__/source-0/child.json')
    expect(output('/other/shared/child.json')).toBe('https://published.test/api/__bundle__/source-1/child.json')
    expect(output('/private/shared/next.json')).toBe('https://published.test/api/__bundle__/source-0/next.json')
  })

  it.each(['./relative.json', 'urn:opaque:base', 'https://published.test/root.json#fragment'])(
    'rejects an unsuitable output base %s',
    (base) => {
      expect(() => createOutputUri('/private/source/root.json', base)).toThrow(TypeError)
    },
  )
})
