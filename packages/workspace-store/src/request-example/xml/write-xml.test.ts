import { describe, expect, it } from 'vitest'

import { writeXml } from './write-xml'
import type { XmlNode } from './xml-node'

const element = (name: string, children: XmlNode[] = []): XmlNode => ({
  type: 'element',
  name,
  attributes: [],
  children,
})
const text = (value: string): XmlNode => ({ type: 'text', value })
const options = { xmlDeclaration: false }

describe('write-xml', () => {
  it('preserves mixed content, repeated names, and significant whitespace', () => {
    expect(
      writeXml(
        [
          element('message', [
            text('Hello\n '),
            element('name', [text('Ada')]),
            text(' and '),
            element('name', [text('Grace')]),
            text('!'),
          ]),
        ],
        options,
      ),
    ).toStrictEqual({
      xml: '<message>Hello\n <name>Ada</name> and <name>Grace</name>!</message>',
      diagnostics: [],
    })
  })

  it('formats element-only descendants without adding whitespace to mixed content', () => {
    expect(
      writeXml([element('root', [text('before'), element('group', [element('leaf')]), text('after')])], options),
    ).toStrictEqual({
      xml: '<root>before<group>\n    <leaf/>\n  </group>after</root>',
      diagnostics: [],
    })
  })

  it('only indents element-only content', () => {
    expect(writeXml([element('root', [element('a'), element('b', [text('x')])])], options).xml).toBe(
      '<root>\n  <a/>\n  <b>x</b>\n</root>',
    )
  })

  it('preserves text newlines in compact output and escapes markup', () => {
    expect(writeXml([element('root', [text('<a>&\n\r')])], { ...options, format: false }).xml).toBe(
      '<root>&lt;a&gt;&amp;\n&#13;</root>',
    )
  })

  it('splits CDATA terminators and encodes carriage returns outside CDATA', () => {
    expect(writeXml([element('root', [{ type: 'cdata', value: '<b>]]>\r' }])], options).xml).toBe(
      '<root><![CDATA[<b>]]]]><![CDATA[>]]>&#13;<![CDATA[]]></root>',
    )
  })

  it('binds namespaces, preserves attribute whitespace, and inherits element namespaces', () => {
    expect(
      writeXml(
        [
          {
            type: 'element',
            name: 'root',
            namespace: 'urn:root',
            attributes: [
              { name: 'id', namespace: 'urn:id', value: 'a\n\t\r"&' },
              { name: 'plain', value: 'ok' },
            ],
            children: [element('child')],
          },
        ],
        { ...options, format: false },
      ),
    ).toStrictEqual({
      xml: '<root xmlns="urn:root" xmlns:ns1="urn:id" ns1:id="a&#10;&#9;&#13;&quot;&amp;" plain="ok"><child/></root>',
      diagnostics: [],
    })
  })

  it('keeps generated prefixes clear of explicit attribute prefixes', () => {
    expect(
      writeXml(
        [
          {
            type: 'element',
            name: 'root',
            children: [],
            attributes: [
              { name: 'id', namespace: 'urn:generated', value: '1' },
              { name: 'id', namespace: 'urn:explicit', prefix: 'ns1', value: '2' },
            ],
          },
        ],
        options,
      ),
    ).toStrictEqual({
      xml: '<root xmlns:ns2="urn:generated" xmlns:ns1="urn:explicit" ns2:id="1" ns1:id="2"/>',
      diagnostics: [],
    })
  })

  it('rebinds a prefix on a descendant without changing siblings', () => {
    expect(
      writeXml(
        [
          {
            type: 'element',
            name: 'root',
            prefix: 'p',
            namespace: 'urn:a',
            attributes: [],
            children: [
              { type: 'element', name: 'child', prefix: 'p', namespace: 'urn:b', attributes: [], children: [] },
              { type: 'element', name: 'child', prefix: 'p', attributes: [], children: [] },
            ],
          },
        ],
        { ...options, format: false },
      ).xml,
    ).toBe('<p:root xmlns:p="urn:a"><p:child xmlns:p="urn:b"/><p:child/></p:root>')
  })

  it('rejects duplicate attributes by expanded name even with different prefixes', () => {
    const result = writeXml([
      {
        type: 'element',
        name: 'root',
        children: [],
        attributes: [
          { name: 'id', namespace: 'urn:id', prefix: 'a', value: '1' },
          { name: 'id', namespace: 'urn:id', prefix: 'b', value: '2' },
        ],
      },
    ])
    expect(result.xml).toBeUndefined()
    expect(result.diagnostics.map(({ code }) => code)).toStrictEqual(['duplicate-attribute'])
  })

  it.each(['bad name', '1name', 'a:b', ''])('rejects invalid name %j', (name) => {
    expect(writeXml([element(name)]).diagnostics.map(({ code }) => code)).toStrictEqual(['invalid-name'])
  })

  it('allows Unicode XML names', () => {
    expect(writeXml([element('世界')], options)).toStrictEqual({ xml: '<世界/>', diagnostics: [] })
  })

  it('rejects illegal characters, unbound prefixes, and multiple roots', () => {
    expect(writeXml([element('root', [text('\u0000')])]).diagnostics.map(({ code }) => code)).toStrictEqual([
      'invalid-character',
    ])
    expect(
      writeXml([{ type: 'element', name: 'root', prefix: 'p', attributes: [], children: [] }]).diagnostics.map(
        ({ code }) => code,
      ),
    ).toStrictEqual(['unbound-prefix'])
    expect(writeXml([element('a'), element('b')]).diagnostics.map(({ code }) => code)).toStrictEqual(['invalid-root'])
  })
})
