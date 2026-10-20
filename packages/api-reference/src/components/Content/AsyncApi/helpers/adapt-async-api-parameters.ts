import type { AsyncApiChannelObject, AsyncApiParameterObject } from '@scalar/types/asyncapi/3.1'
import { getResolvedAsyncApiRef } from '@scalar/workspace-store/helpers/get-resolved-async-api-ref'
import type { ParameterObject, SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Preserve AsyncAPI metadata without adding it to the OpenAPI parameter schema. */
type AdaptedAsyncApiParameter = ParameterObject & Pick<AsyncApiParameterObject, 'location'>

/**
 * Adapt AsyncAPI channel parameters into the OpenAPI `ParameterObject` shape so we can reuse the
 * existing `ParameterList` rendering instead of building a separate component.
 *
 * AsyncAPI parameters are address placeholders (the `{param}` expressions in a channel address).
 * They are string-only and, because every placeholder in the address must be supplied, always
 * required. We therefore map them to `path` parameters (the closest OpenAPI analog) and fold the
 * `enum`, `default`, and `examples` fields onto a synthetic string schema so the schema renderer
 * can display them. Keep `location` separately so the channel can render its runtime expression.
 */
export const adaptAsyncApiParameters = (
  parameters: AsyncApiChannelObject['parameters'],
): AdaptedAsyncApiParameter[] => {
  if (!parameters) {
    return []
  }

  return Object.entries(parameters).map(([name, value]) => {
    // Fall back to an empty object so an unresolved `$ref` still renders the parameter name.
    const parameter = getResolvedAsyncApiRef(value) ?? {}

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

    const result: AdaptedAsyncApiParameter = {
      name,
      in: 'path',
      required: true,
      schema,
    }
    if (parameter.description) {
      result.description = parameter.description
    }

    if (parameter.location !== undefined) {
      result.location = parameter.location
    }

    return result
  })
}
