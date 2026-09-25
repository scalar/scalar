import type { XmlDiagnostic, XmlExampleResult, XmlName, XmlNode } from './xml-node'

const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace'
const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/'
// XML 1.0 (fifth edition) NCName: a QName's prefix and local part cannot contain colons.
const NAME_START =
  'A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\u{10000}-\\u{EFFFF}'
const namePattern = new RegExp(`^[${NAME_START}][${NAME_START}\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$`, 'u')
const invalidCharacter = /[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/u

/** Formatting is restricted to element-only content, where it cannot change text values. */
export type WriteXmlOptions = { format?: boolean; xmlDeclaration?: boolean }

/** Serialize an XML document, validating names, characters, and namespace bindings. */
export const writeXml = (nodes: XmlNode[], options: WriteXmlOptions = {}): XmlExampleResult => {
  const diagnostics: XmlDiagnostic[] = []
  const fail = (code: string, message: string, path: string[]): void => {
    diagnostics.push({ severity: 'error', code, message, path })
  }
  const escape = (value: string, attribute: boolean, path: string[]): string => {
    if (invalidCharacter.test(value)) {
      fail('invalid-character', 'The value contains a character XML 1.0 cannot represent.', path)
    }
    const escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r/g, '&#13;')
    // XML parsers normalize literal whitespace in attributes, so encode it explicitly.
    return attribute ? escaped.replace(/"/g, '&quot;').replace(/\n/g, '&#10;').replace(/\t/g, '&#9;') : escaped
  }
  let generatedPrefix = 0
  let count = 0
  const render = (
    node: XmlNode,
    inherited: Map<string, string>,
    depth: number,
    path: string[],
    pretty: boolean,
  ): string => {
    if (++count > 10000 || depth > 100) {
      fail('limit-exceeded', 'The XML example exceeds the node or depth limit.', path)
      return ''
    }
    if (node.type !== 'element') {
      if (node.type === 'text') {
        return escape(node.value, false, path)
      }
      if (invalidCharacter.test(node.value)) {
        fail('invalid-character', 'The CDATA contains a character XML 1.0 cannot represent.', path)
      }
      // Carriage returns must be outside CDATA to survive XML line-ending normalization.
      return `<![CDATA[${node.value.replace(/]]>/g, ']]]]><![CDATA[>').replace(/\r/g, ']]>&#13;<![CDATA[')}]]>`
    }
    const bindings = new Map(inherited)
    const declarations = new Map<string, string>()
    const usedPrefixes = new Map<string, string>()
    const explicitPrefixes = new Set([node.prefix, ...node.attributes.map((attribute) => attribute.prefix)])
    const qualify = (input: XmlName, attribute: boolean): { name: string; namespace: string } => {
      if (!namePattern.test(input.name) || (input.prefix !== undefined && !namePattern.test(input.prefix))) {
        fail('invalid-name', `Invalid XML name: ${input.prefix ? `${input.prefix}:` : ''}${input.name}`, path)
      }
      let prefix = input.prefix ?? ''
      const namespace = input.namespace ?? (prefix ? bindings.get(prefix) : attribute ? '' : bindings.get('')) ?? ''
      if (prefix === 'xmlns' || namespace === XMLNS_NAMESPACE || (attribute && !prefix && input.name === 'xmlns')) {
        fail('reserved-namespace', 'Namespace declarations must be expressed through XML namespace metadata.', path)
      }
      if (namespace === XML_NAMESPACE && !prefix) {
        prefix = 'xml'
      }
      if ((prefix === 'xml') !== (namespace === XML_NAMESPACE)) {
        fail('reserved-namespace', 'The xml prefix is reserved for the XML namespace.', path)
      }
      if (prefix && !namespace) {
        fail('unbound-prefix', `The prefix ${prefix} has no namespace binding.`, path)
      }
      if (attribute && namespace && !prefix) {
        prefix = [...bindings].find(([candidate, uri]) => candidate !== '' && uri === namespace)?.[0] ?? ''
        if (!prefix) {
          do {
            prefix = `ns${++generatedPrefix}`
          } while (bindings.has(prefix) || explicitPrefixes.has(prefix))
        }
      }
      if (!attribute || prefix) {
        if (usedPrefixes.has(prefix) && usedPrefixes.get(prefix) !== namespace) {
          fail(
            'namespace-conflict',
            `The prefix ${prefix || '(default)'} is assigned incompatible namespaces on one element.`,
            path,
          )
        }
        usedPrefixes.set(prefix, namespace)
        if ((bindings.get(prefix) ?? '') !== namespace) {
          declarations.set(prefix, namespace)
          bindings.set(prefix, namespace)
        }
      }
      return { name: prefix ? `${prefix}:${input.name}` : input.name, namespace }
    }
    const element = qualify(node, false)
    const attributeNames = new Set<string>()
    const attributes = node.attributes
      .map((attribute) => {
        const qualified = qualify(attribute, true)
        const key = `${qualified.namespace}\0${attribute.name}`
        if (attributeNames.has(key)) {
          fail('duplicate-attribute', `Duplicate XML attribute: ${qualified.name}`, path)
        }
        attributeNames.add(key)
        return ` ${qualified.name}="${escape(attribute.value, true, path)}"`
      })
      .join('')
    const namespaces = [...declarations]
      .map(([prefix, uri]) => ` xmlns${prefix ? `:${prefix}` : ''}="${escape(uri, true, path)}"`)
      .join('')
    const opening = `<${element.name}${namespaces}${attributes}`
    if (node.children.length === 0) {
      return `${opening}/>`
    }
    const indentChildren = pretty && node.children.every((child) => child.type === 'element')
    const children = node.children.map((child, index) =>
      render(child, bindings, depth + 1, [...path, String(index)], pretty),
    )
    if (indentChildren) {
      return `${opening}>\n${children.map((child) => `${'  '.repeat(depth + 1)}${child}`).join('\n')}\n${'  '.repeat(depth)}</${element.name}>`
    }
    return `${opening}>${children.join('')}</${element.name}>`
  }
  if (nodes.length !== 1 || nodes[0]?.type !== 'element') {
    fail('invalid-root', 'An XML document must contain exactly one root element.', [])
    return { xml: undefined, diagnostics }
  }
  const body = render(nodes[0], new Map([['xml', XML_NAMESPACE]]), 0, [], options.format !== false)
  const declaration =
    options.xmlDeclaration === false
      ? ''
      : `<?xml version="1.0" encoding="UTF-8"?>${options.format === false ? '' : '\n'}`
  return {
    xml: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? undefined : declaration + body,
    diagnostics,
  }
}
