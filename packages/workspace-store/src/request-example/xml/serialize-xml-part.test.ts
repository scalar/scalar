import { describe, expect, it, vi } from 'vitest'

import { serializeXmlPart } from './serialize-xml-part'

describe('serialize-xml-part', () => {
  it('uses schema attributes and an explicit root name', () => {
    expect(
      serializeXmlPart(
        { id: 7, name: 'a & b' },
        {
          type: 'object',
          xml: { name: 'person' },
          properties: { id: { type: 'integer', xml: { attribute: true } }, name: { type: 'string' } },
        },
      ),
    ).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<person id="7">\n  <name>a &amp; b</name>\n</person>')
  })

  it.each([{ id: 1 }, { id: 1, name: 'Alice' }])('keeps the unnamed root stable for %j', (value) => {
    const xml = serializeXmlPart(value)
    expect(xml).toContain('<root>')
    expect(xml).toContain('<id>1</id>')
    expect(xml).toContain('</root>')
  })

  it('rejects a part with unsupported patterns rather than returning incomplete XML', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      expect(() =>
        serializeXmlPart(
          { name: 'Alice' },
          {
            type: 'object',
            patternProperties: { '(name|title)': { type: 'string' } },
          },
        ),
      ).toThrow('Unable to serialize XML part: unsupported-pattern')
      expect(warning).toHaveBeenCalledWith(
        'Unable to generate an XML example:',
        expect.objectContaining({ code: 'unsupported-pattern', path: ['name'] }),
      )
    } finally {
      warning.mockRestore()
    }
  })
})
