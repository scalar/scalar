import { describe, expect, it } from 'vitest'

import { json2xml } from './json2xml'

describe('getUrlFromServerState', () => {
  it('transforms JSON to xml', () => {
    const xml = json2xml({
      foo: 'bar',
    })

    expect(xml).toMatchObject('<foo>bar</foo>')
  })

  it('wraps array items', () => {
    const xml = json2xml({
      urls: {
        url: ['https://example.com', 'https://example.com'],
      },
    })

    expect(xml).toMatchObject(
      '<urls><url>https://example.com</url><url>https://example.com</url></urls>',
    )
  })
})
