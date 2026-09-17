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
  { compositionSelection }: { compositionSelection?: Record<string, number> } = {},
): string | undefined => {
  if (example !== undefined) {
    return prettyPrintJson(getResolvedRefDeep(example)?.value ?? '')
  }

  if (response?.schema) {
    const schema = getResolvedRefDeep(response.schema) as SchemaObject | undefined
    if (!schema) {
      return undefined
    }
    const content = getExampleFromSchema(schema, {
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
