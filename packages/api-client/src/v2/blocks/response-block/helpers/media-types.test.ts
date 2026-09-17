import { describe, expect, it } from 'vitest'

import { getMediaTypeConfig, isTextMediaType } from './media-types'

describe('media-types', () => {
  const cases = [
    {
      type: 'application/json',
      config: {
        extension: '.json',
        raw: true,
        language: 'json',
        preview: 'json',
      },
    },
    {
      type: 'application/fhir+json',
      config: {
        extension: '.json',
        raw: true,
        language: 'json',
        preview: 'json',
      },
    },
    {
      type: 'application/ld+json',
      config: {
        extension: '.jsonld',
        raw: true,
        language: 'json',
        preview: 'json',
      },
    },
    {
      type: 'application/x-ndjson',
      config: {
        extension: '.ndjson',
        raw: true,
        language: 'json',
        preview: 'ndjson',
      },
    },
    {
      type: 'application/ndjson',
      config: {
        extension: '.ndjson',
        raw: true,
        language: 'json',
        preview: 'ndjson',
      },
    },
    {
      type: 'image/jpeg',
      config: {
        extension: '.jpg',
        preview: 'image',
      },
    },
    {
      type: 'application/yaml',
      config: {
        extension: '.yaml',
        raw: true,
        language: 'yaml',
      },
    },
  ]

  it.each(cases)('returns the correct config for $type', ({ type, config }) => {
    const result = getMediaTypeConfig(type)
    expect(result).toStrictEqual(config)
  })

  it.each(['application/vnd.com.company.model+xml', 'application/soap+xml', 'application/atom+xml'])(
    'displays %s as raw XML with an XML download extension',
    (type) => {
      expect(getMediaTypeConfig(type)).toStrictEqual({ extension: '.xml', raw: true, language: 'xml' })
      expect(isTextMediaType(type)).toBe(true)
    },
  )

  it('preserves the SVG image preview', () => {
    expect(getMediaTypeConfig('image/svg+xml')).toStrictEqual({
      extension: '.svg',
      raw: true,
      language: 'xml',
      preview: 'image',
      alpha: true,
    })
  })

  it('preserves XHTML highlighting and extension', () => {
    expect(getMediaTypeConfig('application/xhtml+xml')).toStrictEqual({
      extension: '.xhtml',
      raw: true,
      language: 'html',
    })
  })

  it.each(['application/vnd.company+xmlish', 'application/octet-stream', 'application/unknown'])(
    'does not treat %s as XML text',
    (type) => {
      expect(isTextMediaType(type)).toBe(false)
    },
  )

  it('isTextMediaType', () => {
    expect(isTextMediaType('application/json')).toBe(true)
    expect(isTextMediaType('application/x-ndjson')).toBe(true)
    expect(isTextMediaType('application/ndjson')).toBe(true)
    expect(isTextMediaType('application/ld+json')).toBe(true)
    expect(isTextMediaType('application/fhir+json')).toBe(true)
    expect(isTextMediaType('text/plain')).toBe(true)
    expect(isTextMediaType('image/jpeg')).toBe(false)
    expect(isTextMediaType('application/octet-stream')).toBe(false)
    expect(isTextMediaType('application/xml')).toBe(true)
  })
})
