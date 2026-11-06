import { describe, expect, it } from 'vitest'

import { textFromHtml } from '../../test/html'
import { samples } from '../../test/samples'
import { syntaxHighlight } from '../compat/syntax-highlight'
import { highlight, registerLanguage, tokenize } from '../index'
import protobuf from './protobuf'

registerLanguage(protobuf)

const scopeOf = (source: string, text: string): string | null | undefined => {
  return tokenize(source, 'protobuf').find((token) => token.text === text)?.scope
}

describe('protobuf', () => {
  it('recognizes keyword-named fields and types across newlines', () => {
    const source =
      'message Product { string import = 1; string option = 2; string syntax = 3; string edition = 4; product\nitem\n= 5; }'
    for (const name of ['import', 'option', 'syntax', 'edition', 'item']) {
      expect(scopeOf(source, name)).toBe('property')
    }
    expect(scopeOf(source, 'product')).toBe('type')
  })

  it('recognizes qualified and custom option names', () => {
    for (const name of ['features.field_presence', '(custom.setting)', '(custom.setting).field']) {
      expect(scopeOf(`option ${name} = EXPLICIT;`, name)).toBe('property')
    }
  })

  it('keeps declaration keywords used as field names as properties', () => {
    const source = 'message Product { string message = 1; string rpc = 2; string oneof = 3; }'
    const properties = tokenize(source, 'protobuf')
      .filter((token) => token.scope === 'property')
      .map((token) => token.text)
    expect(properties).toStrictEqual(['message', 'rpc', 'oneof'])
  })

  it('keeps enum values consistent across aggregate option separators', () => {
    const source = 'option x = { status: ACTIVE, other: INACTIVE };'
    expect(scopeOf(source, 'ACTIVE')).toBe('constant')
    expect(scopeOf(source, 'INACTIVE')).toBe('constant')
  })

  it.each(['protobuf', 'proto'])('highlights the source using %s', (lang) => {
    const source = 'message Product { string name = 1; }'
    expect(highlight(source, lang)).toBe(highlight(source, protobuf))
    expect(scopeOf(source, 'message')).toBe('keyword.declaration')
    expect(scopeOf(source, 'Product')).toBe('class')
    expect(scopeOf(source, 'string')).toBe('type.builtin')
    expect(scopeOf(source, 'name')).toBe('property')
    expect(scopeOf(source, '1')).toBe('number')
  })

  it('recognizes declarations across whitespace and comments', () => {
    const source =
      'package scalar.catalog; message /* doc */ product {} enum\nStatus {} service Catalog { rpc /* doc */ Watch(product) returns (stream .scalar.product); }'
    expect(scopeOf(source, 'scalar.catalog')).toBe('namespace')
    expect(scopeOf(source, 'product')).toBe('class')
    expect(scopeOf(source, 'Status')).toBe('class')
    expect(scopeOf(source, 'Catalog')).toBe('class')
    expect(scopeOf(source, 'Watch')).toBe('function')
    expect(scopeOf(source, '.scalar.product')).toBe('type')
    expect(scopeOf(source, 'stream')).toBe('keyword')
  })

  it('recognizes proto2, proto3 and Editions constructs', () => {
    const source =
      'syntax = "proto2"; edition = "2024"; import public "base.proto"; required bytes data = 1; extensions 100 to max; extend Product {} oneof price {} map<string, product> items = 2; option features.field_presence = EXPLICIT;'
    for (const text of ['syntax', 'edition', 'required', 'extensions', 'to', 'max', 'extend', 'public', 'option']) {
      expect(scopeOf(source, text)).toBe('keyword')
    }
    expect(scopeOf(source, 'import')).toBe('keyword.import')
    expect(scopeOf(source, 'price')).toBe('property')
    expect(scopeOf(source, 'product')).toBe('type')
    expect(scopeOf(source, 'EXPLICIT')).toBe('constant')
  })

  it('recognizes field types, enum assignments and options', () => {
    const source =
      'product item = 1; .catalog.product other = 2; bool optional = 3 [deprecated = true]; enum Status { UNKNOWN = 0; }'
    expect(scopeOf(source, 'product')).toBe('type')
    expect(scopeOf(source, '.catalog.product')).toBe('type')
    for (const text of ['item', 'other', 'optional', 'deprecated', 'UNKNOWN']) {
      expect(scopeOf(source, text)).toBe('property')
    }
    expect(scopeOf(source, 'true')).toBe('boolean')
    expect(tokenize('unscoped', 'protobuf')).toStrictEqual([{ text: 'unscoped', scope: null, start: 0, end: 8 }])
  })

  it.each(['0', '-42', '077', '0xFF', '-1.5e+3', '.25', '2.', '-inf', 'nan'])(
    'recognizes the numeric literal %s',
    (number) => {
      expect(scopeOf(`option value = ${number};`, number)).toBe('number')
    },
  )

  it('isolates comments and quoted strings from declarations', () => {
    const source = String.raw`// message Fake {}
/* service Fake {} */
option text = "message // not a comment \" \\ \n \x41";
option other = 'rpc /* not a comment */ \' \101';`
    expect(tokenize(source, 'proto').filter((token) => token.scope === 'keyword.declaration')).toStrictEqual([])
    for (const text of ['\\"', '\\\\', '\\n', '\\x41', "\\'", '\\101']) {
      expect(scopeOf(source, text)).toBe('string.escape')
    }
  })

  it('recovers at the next line after an unfinished string', () => {
    expect(scopeOf('option text = "unfinished\\\nmessage Next {}', 'Next')).toBe('class')
  })

  it('preserves and escapes source in both renderers', () => {
    const source = 'message Product { map<string, string> labels = 1; } // <script>&'
    for (const lang of ['protobuf', 'proto']) {
      const html = syntaxHighlight(source, { lang })
      expect(textFromHtml(html)).toBe(source)
      expect(html).toContain('hljs-keyword')
      expect(html).not.toContain('<script>')
      expect(textFromHtml(highlight(source, lang))).toBe(source)
    }
  })

  it('terminates and preserves every truncated prefix', () => {
    const source = samples.protobuf!
    for (let end = 0; end <= source.length; end++) {
      const prefix = source.slice(0, end)
      expect(
        tokenize(prefix, 'protobuf')
          .map((token) => token.text)
          .join(''),
      ).toBe(prefix)
    }
  })
})
