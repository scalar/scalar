import { parseMimeType } from '@scalar/helpers/http/mime-type'
import { isObject } from '@scalar/helpers/object/is-object'

/** Keep detection and framing aligned on the same supported media formats. */
const getStreamFormat = (contentType: string): 'json-lines' | 'json-seq' | 'sse' | undefined => {
  const { essence, subtype } = parseMimeType(contentType)
  if (essence === 'text/event-stream') {
    return 'sse'
  }
  if (essence === 'application/json-seq' || subtype.endsWith('+json-seq')) {
    return 'json-seq'
  }
  return ['application/jsonl', 'application/x-ndjson', 'application/json-lines'].includes(essence)
    ? 'json-lines'
    : undefined
}

/** Recognize the sequential media types whose examples have record framing. */
export const isStreamingMediaType = (contentType: string): boolean => getStreamFormat(contentType) !== undefined

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
