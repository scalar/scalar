import type { AsyncApiChannelObject } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ParameterObject, SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Adapt AsyncAPI channel parameters into the OpenAPI `ParameterObject` shape so we can reuse the
 * existing `ParameterList` rendering instead of building a separate component.
 *
 * AsyncAPI parameters are address placeholders (the `{param}` expressions in a channel address).
 * They are string-only and, because every placeholder in the address must be supplied, always
 * required. We therefore map them to `path` parameters (the closest OpenAPI analog) and fold the
 * `enum`, `default`, and `examples` fields onto a synthetic string schema so the schema renderer
 * can display them. The `location` runtime expression has no display equivalent and is dropped.
 */
export const adaptAsyncApiParameters = (parameters: AsyncApiChannelObject['parameters']): ParameterObject[] => {
  if (!parameters) {
    return []
  }

  return Object.entries(parameters).map(([name, value]) => {
    // Fall back to an empty object so an unresolved `$ref` still renders the parameter name.
    const parameter = getResolvedRef(value) ?? {}

    const schema: SchemaObject = { type: 'string' }
    if (parameter.enum) {
      schema.enum = parameter.enum
    }
    if (parameter.default !== undefined) {
      schema.default = parameter.default
    }
    if (parameter.examples) {
      schema.examples = parameter.examples
    }

    const result: ParameterObject = {
      name,
      in: 'path',
      required: true,
      schema,
    }
    if (parameter.description) {
      result.description = parameter.description
    }

    return result
  })
}
