import { describe, expect, it } from 'vitest'

import { json2xml } from './json2xml'

describe('json2xml', () => {
  it('transforms JSON to formatted XML by default', () => {
    const xml = json2xml({
      foo: 'bar',
    })

    expect(xml).toBe(`<?xml version="1.0" encoding="UTF-8"?>
<foo>bar</foo>`)
  })

  it('wraps array items with proper indentation', () => {
    const xml = json2xml({
      urls: {
        url: ['https://example.com', 'https://example.com'],
      },
    })

    expect(xml).toBe(
      `<?xml version="1.0" encoding="UTF-8"?>
<urls>
  <url>https://example.com</url>
  <url>https://example.com</url>
</urls>`,
    )
  })

  it('handles nested objects with proper indentation', () => {
    const xml = json2xml({
      user: {
        name: 'John',
        profile: {
          age: 30,
          email: 'john@example.com',
        },
      },
    })

    expect(xml).toBe(
      `<?xml version="1.0" encoding="UTF-8"?>
<user>
  <name>John</name>
  <profile>
    <age>30</age>
    <email>john@example.com</email>
  </profile>
</user>`,
    )
  })

  it('handles attributes correctly', () => {
    const xml = json2xml({
      user: {
        '@id': '123',
        '@type': 'admin',
        name: 'John',
      },
    })

    expect(xml).toBe(
      `<?xml version="1.0" encoding="UTF-8"?>
<user id="123" type="admin">
  <name>John</name>
</user>`,
    )
  })

  it('can output compact XML when format is false', () => {
    const xml = json2xml(
      {
        foo: 'bar',
      },
      { format: false },
    )

    expect(xml).toBe('<?xml version="1.0" encoding="UTF-8"?><foo>bar</foo>')
  })

  it('can use custom indentation', () => {
    const xml = json2xml(
      {
        user: {
          name: 'John',
        },
      },
      { indent: '    ' },
    )

    expect(xml).toBe(`<?xml version="1.0" encoding="UTF-8"?>
<user>
    <name>John</name>
</user>`)
  })

  it('can disable XML declaration', () => {
    const xml = json2xml(
      {
        foo: 'bar',
      },
      { xmlDeclaration: false },
    )

    expect(xml).toBe('<foo>bar</foo>')
  })

  it('handles empty objects and null values', () => {
    const xml = json2xml({
      empty: {},
      nullValue: null,
      undefinedValue: undefined,
    })

    expect(xml).toBe(
      `<?xml version="1.0" encoding="UTF-8"?>
<empty/>
<nullValue></nullValue>
<undefinedValue></undefinedValue>`,
    )
  })

  it('escapes special characters in values to prevent XML injection', () => {
    const xml = json2xml({
      message: '<script>alert("xss")</script>',
      query: 'foo & bar',
      quote: 'He said "hello"',
    })

    expect(xml).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    expect(xml).toContain('foo &amp; bar')
    expect(xml).toContain('He said &quot;hello&quot;')
    expect(xml).not.toContain('<script>')
  })

  it('escapes special characters in attribute values', () => {
    const xml = json2xml({
      element: {
        '@dangerous': '"><injected attr="',
        '@ampersand': 'foo & bar',
        content: 'safe',
      },
    })

    expect(xml).toContain('dangerous="&quot;&gt;&lt;injected attr=&quot;"')
    expect(xml).toContain('ampersand="foo &amp; bar"')
    expect(xml).not.toContain('"><injected')
  })

  it('escapes CDATA closing sequences to prevent CDATA injection', () => {
    const xml = json2xml({
      data: {
        '#cdata': 'Some content with ]]> closing sequence',
      },
    })

    // The ]]> should be escaped by splitting the CDATA section
    expect(xml).toContain('<![CDATA[Some content with ]]]]><![CDATA[> closing sequence]]>')
    // The original unescaped ]]> should not appear in the output
    expect(xml).not.toContain('with ]]> closing')
  })
})
