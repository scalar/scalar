import { getResolvedRefDeep } from '@scalar/blocks/code-example'
import { prettyPrintJson } from '@scalar/helpers/json/pretty-print-json'
import { getExampleValue, getExplicitExampleText } from '@scalar/workspace-store/helpers/get-example-value'
import { getExampleFromSchema } from '@scalar/workspace-store/request-example'
import type {
  ExampleObject,
  MediaTypeObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Keep the displayed response and its clipboard action on the same resolved, formatted value. */
export const getExampleContent = (
  response: MediaTypeObject | undefined,
  example: ExampleObject | undefined,
  { contentType = 'application/json', compositionSelection }: {
    contentType?: string
    compositionSelection?: Record<string, number>
  } = {},
): string | undefined => {
  if (example !== undefined) {
    const selected = getExampleValue(getResolvedRefDeep(example))
    const explicitText = getExplicitExampleText(selected, contentType, 2)
    if (explicitText !== undefined) {
      return explicitText
    }
    const value = selected?.value
    if (selected?.source === 'value') {
      // Keep the formatter's expansion budget for shared, resolved legacy examples.
      return prettyPrintJson((value === undefined ? '' : value) as Parameters<typeof prettyPrintJson>[0])
    }
    return typeof value === 'string' ? prettyPrintJson(value) : (JSON.stringify(value, null, 2) ?? '')
  }

  if (response?.schema) {
    const schema = getResolvedRefDeep(response.schema) as SchemaObject | undefined
    if (!schema) {
      return undefined
    }
    const composition = schema.oneOf ? 'oneOf' : 'anyOf'
    const index = compositionSelection?.[composition]
    const variant = index === undefined ? undefined : schema[composition]?.[index]
    // The generator handles an explicit primitive/array type before its root union.
    // Merge that selected branch with the common fields so its constraints still apply.
    const { oneOf: _oneOf, anyOf: _anyOf, ...base } = schema
    const selectedSchema =
      variant && !('properties' in schema) && ('items' in schema || ('type' in schema && schema.type !== 'object'))
        ? { ...base, ...variant }
        : schema
    const content = getExampleFromSchema(selectedSchema as SchemaObject, {
      emptyString: 'string',
      mode: 'read',
      compositionSelection,
    })
    if (content === undefined) {
      return undefined
    }
    // Schema generation returns unknown, but produces JSON values supported by the formatter.
    return prettyPrintJson(content as Parameters<typeof prettyPrintJson>[0])
  }

  return undefined
}
