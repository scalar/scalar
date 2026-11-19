import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { HeaderObject, SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { applySchemaExamples } from './apply-schema-examples'
import { getParameterExamples } from './get-parameter-examples'

/** Resolve a response header schema and prefer its explicit examples over schema examples. */
export const getHeaderSchema = (header: HeaderObject): SchemaObject | undefined => {
  const content = 'content' in header ? getResolvedRef(Object.values(header.content ?? {})[0]) : undefined
  const schema = getResolvedRef('schema' in header && header.schema ? header.schema : content?.schema)

  // Empty or unresolved header examples must not hide usable media type examples.
  const examples = getParameterExamples({ parameter: header, content })
  return examples.length ? applySchemaExamples(schema, examples) : schema
}
