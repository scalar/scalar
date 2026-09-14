import { parseMimeType } from '@scalar/helpers/http/mime-type'
import { isObject } from '@scalar/helpers/object/is-object'

/** Serialize generated sequential content; explicit wire-format examples bypass this helper. */
export const serializeStreamExample = (
  value: unknown,
  contentType: string,
  singleItem: boolean,
): string | undefined => {
  if (value === undefined) {
    return undefined
  }
  const { essence: mimeType } = parseMimeType(contentType)
  const items = singleItem ? [value] : Array.isArray(value) ? value : [value]
  if (mimeType === 'application/jsonl' || mimeType === 'application/x-ndjson') {
    return items.map((item) => `${JSON.stringify(item)}\n`).join('')
  }
  if (mimeType === 'application/json-seq' || mimeType.endsWith('+json-seq')) {
    return items.map((item) => `\u001e${JSON.stringify(item)}\n`).join('')
  }
  if (mimeType === 'text/event-stream') {
    return items
      .map((item) => {
        if (!isObject(item)) {
          return ''
        }
        const fields = ['event', 'id', 'retry', 'data'].flatMap((field) => {
          const fieldValue = item[field]
          if (field === 'retry') {
            return typeof fieldValue === 'number' && Number.isInteger(fieldValue) && fieldValue >= 0
              ? [`retry: ${fieldValue}`]
              : []
          }
          if (typeof fieldValue !== 'string' || (field === 'id' && fieldValue.includes('\0'))) {
            return []
          }
          const lines = fieldValue.split(/\r\n|\r|\n/)
          return field === 'data'
            ? lines.map((line) => `data: ${line}`)
            : lines.length === 1
              ? [`${field}: ${fieldValue}`]
              : []
        })
        return fields.length ? `${fields.join('\n')}\n\n` : ''
      })
      .join('')
  }
  return undefined
}
