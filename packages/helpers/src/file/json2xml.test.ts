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
})
