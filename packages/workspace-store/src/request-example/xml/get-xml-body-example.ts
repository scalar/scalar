import { type RefNode, getResolvedRef } from '@/helpers/get-resolved-ref'
import type { SchemaObject } from '@/schemas/v3.1/strict/openapi-document'
import type { ExampleObject } from '@/schemas/v3.2/strict/example'

import { type XmlExampleOptions, getXmlExampleFromSchema, serializeXmlExample } from './get-xml-example'
import type { XmlExampleResult } from './xml-node'

/** Resolve media-level XML examples without treating schema string values as serialized payloads. */
export const getXmlBodyExample = (
  schema: SchemaObject | undefined,
  inputExample: ExampleObject | RefNode<ExampleObject> | undefined,
  options: XmlExampleOptions = {},
): XmlExampleResult => {
  const example = getResolvedRef(inputExample)
  if (example?.serializedValue !== undefined) {
    return { xml: example.serializedValue, diagnostics: [] }
  }
  if (example?.dataValue !== undefined) {
    return serializeXmlExample(example.dataValue, schema ?? ({} as SchemaObject), options)
  }
  if (typeof example?.value === 'string') {
    return { xml: example.value, diagnostics: [] }
  }
  if (example?.value !== undefined) {
    return serializeXmlExample(example.value, schema ?? ({} as SchemaObject), options)
  }
  return schema ? getXmlExampleFromSchema(schema, options) : { xml: undefined, diagnostics: [] }
}
