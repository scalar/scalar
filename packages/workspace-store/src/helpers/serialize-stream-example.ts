import { getStreamFormat } from '@scalar/helpers/http/is-streaming-media-type'
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
  const format = getStreamFormat(contentType)
  const items = singleItem ? [value] : Array.isArray(value) ? value : [value]
  if (format === 'json-lines') {
    return items.map((item) => `${JSON.stringify(item)}\n`).join('')
  }
  if (format === 'json-seq') {
    return items.map((item) => `\u001e${JSON.stringify(item)}\n`).join('')
  }
  if (format === 'sse') {
    return items
      .map((item) => {
        if (!isObject(item)) {
          return `data: ${JSON.stringify(item)}\n\n`
        }
        const fields = ['event', 'id', 'retry', 'data'].flatMap((field) => {
          const fieldValue = item[field]
          if (field === 'retry') {
            return typeof fieldValue === 'number' && Number.isInteger(fieldValue) && fieldValue >= 0
              ? [`retry: ${fieldValue}`]
              : []
          }
          if (field === 'data' && fieldValue !== undefined) {
            const data = typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue)
            return data.split(/\r\n|\r|\n/).map((line) => `data: ${line}`)
          }
          if (typeof fieldValue !== 'string' || (field === 'id' && fieldValue.includes('\0'))) {
            return []
          }
          const lines = fieldValue.split(/\r\n|\r|\n/)
          return lines.length === 1 ? [`${field}: ${fieldValue}`] : []
        })
        return fields.length ? `${fields.join('\n')}\n\n` : ''
      })
      .join('')
  }
  return undefined
}
