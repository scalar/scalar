import { getMediaTypeConfig, isTextMediaType } from './mediaTypes'
import { describe, it, expect } from 'vitest'

describe('mediaTypes', () => {
  const cases = [
    {
      type: 'application/json',
      config: {
        extension: '.json',
        raw: true,
        language: 'json',
      },
    },
    {
      type: 'application/fhir+json',
      config: {
        extension: '.json',
        raw: true,
        language: 'json',
      },
    },
    {
      type: 'application/ld+json',
      config: {
        extension: '.jsonld',
        raw: true,
        language: 'json',
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

  it.each(cases)('should return the correct config for $type', ({ type, config }) => {
    const result = getMediaTypeConfig(type)
    expect(result).toStrictEqual(config)
  })

  it('isTextMediaType', () => {
    expect(isTextMediaType('application/json')).toBe(true)
    expect(isTextMediaType('application/ld+json')).toBe(true)
    expect(isTextMediaType('application/fhir+json')).toBe(true)
    expect(isTextMediaType('text/plain')).toBe(true)
    expect(isTextMediaType('image/jpeg')).toBe(false)
    expect(isTextMediaType('application/octet-stream')).toBe(false)
    expect(isTextMediaType('application/xml')).toBe(true)
  })
})
