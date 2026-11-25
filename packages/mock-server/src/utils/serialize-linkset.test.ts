import { describe, expect, it } from 'vitest'

import { serializeLinkset } from './serialize-linkset'

describe('serialize-linkset', () => {
  it('preserves ordered links, quoted attributes, and language tags', () => {
    expect(
      serializeLinkset({
        linkset: [
          {
            anchor: '/items',
            next: [
              {
                href: '/items?page=2',
                title: 'Page "two"',
                hreflang: ['en', 'de'],
                'title*': [{ value: 'nächste Seite', language: 'de' }],
              },
            ],
            prev: [{ href: '/items?page=0' }],
          },
        ],
      }),
    ).toBe(
      '</items?page=2>; rel="next"; anchor="/items"; title="Page \\"two\\""; hreflang="en"; hreflang="de"; ' +
        "title*=UTF-8'de'n%C3%A4chste%20Seite, " +
        '</items?page=0>; rel="prev"; anchor="/items"',
    )
  })

  it('converts line breaks in standalone linksets to header whitespace', () => {
    expect(serializeLinkset('</first>; rel="first",\r\n</last>; rel="last"')).toBe(
      '</first>; rel="first", </last>; rel="last"',
    )
  })

  it('rejects targets containing Link delimiters', () => {
    expect(serializeLinkset({ linkset: [{ next: [{ href: '/next>bad' }] }] })).toBeUndefined()
  })
})
