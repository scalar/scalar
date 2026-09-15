import { getResolvedRefDeep } from '@scalar/blocks/code-example'
import { prettyPrintJson } from '@scalar/helpers/json/pretty-print-json'
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
  compositionSelection?: Record<string, number>,
): string | undefined => {
  if (example !== undefined) {
    return prettyPrintJson(getResolvedRefDeep(example)?.value ?? '')
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
    const rootType = 'type' in schema ? schema.type : undefined
    const variantType = variant && 'type' in variant ? variant.type : undefined
    const selectedType =
      variantType ?? rootType ?? ('items' in schema && !('properties' in schema) ? 'array' : undefined)
    const selectedSchema =
      variant && selectedType !== undefined && selectedType !== 'object' ? { ...base, ...variant } : schema

    // Object and array keywords do not constrain other types. The generator infers
    // those types from their keywords, so omit them from this fresh branch copy.
    if (selectedSchema !== schema) {
      if ('properties' in selectedSchema) {
        delete selectedSchema.properties
      }
      if (selectedType !== 'array' && 'items' in selectedSchema) {
        delete selectedSchema.items
      }
    }
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
