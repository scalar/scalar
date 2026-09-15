/** A qualified XML name. Namespace bindings are assigned by the writer. */
export type XmlName = {
  name: string
  namespace?: string
  prefix?: string
}

/** Attributes are separate from children so element and attribute names cannot collide. */
export type XmlAttribute = XmlName & { value: string }

/** An ordered XML tree, including mixed content and repeated sibling names. */
export type XmlNode =
  | (XmlName & { type: 'element'; attributes: XmlAttribute[]; children: XmlNode[] })
  | { type: 'text' | 'cdata'; value: string }

/** Actionable mapping errors and recoverable omissions, without console side effects. */
export type XmlDiagnostic = {
  severity: 'warning' | 'error'
  code: string
  message: string
  path: string[]
}

/** An error never carries a partial or malformed XML document. */
export type XmlExampleResult = {
  xml: string | undefined
  diagnostics: XmlDiagnostic[]
}
