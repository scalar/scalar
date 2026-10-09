import { prettyPrintJson } from '@scalar/helpers/json/pretty-print-json'
import { isObject } from '@scalar/helpers/object/is-object'

/** Format the selected message example once so the code block and clipboard show the same content. */
export const getMessageExampleContent = (example: { headers?: unknown; payload?: unknown }): string | undefined => {
  const body = example.payload !== undefined ? example.payload : example.headers
  const content =
    example.headers !== undefined && example.payload !== undefined
      ? { headers: example.headers, payload: example.payload }
      : body

  if (content === null || typeof content === 'boolean') {
    return String(content)
  }
  if (typeof content === 'string' || typeof content === 'number' || Array.isArray(content) || isObject(content)) {
    return prettyPrintJson(content)
  }
  return undefined
}
