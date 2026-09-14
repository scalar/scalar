import { describe, expect, it } from 'vitest'

import { isXmlMediaType } from './is-xml-media-type'

describe('is-xml-media-type', () => {
  it.each(['application/xml', 'text/xml', 'application/soap+xml', 'APPLICATION/XML; charset=utf-8'])(
    'recognizes %s',
    (mediaType) => {
      expect(isXmlMediaType(mediaType)).toBe(true)
    },
  )
  it.each([undefined, '', 'application/json', 'text/plain; boundary=xml', 'application/xmlish'])(
    'rejects %s',
    (mediaType) => {
      expect(isXmlMediaType(mediaType)).toBe(false)
    },
  )
})
