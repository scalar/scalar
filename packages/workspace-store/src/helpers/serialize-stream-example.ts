import { parseMimeType } from '@scalar/helpers/http/mime-type'
import { isObject } from '@scalar/helpers/object/is-object'

/** Recognize the sequential media types whose examples have record framing. */
export const isStreamingMediaType = (contentType: string): boolean => {
  const { essence, subtype } = parseMimeType(contentType)
  return (
    essence === 'text/event-stream' ||
    subtype === 'json-seq' ||
    subtype.endsWith('+json-seq') ||
    ['application/jsonl', 'application/x-ndjson', 'application/json-lines'].includes(essence)
  )
}

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
  if (
    mimeType === 'application/jsonl' ||
    mimeType === 'application/x-ndjson' ||
    mimeType === 'application/json-lines'
  ) {
    return items.map((item) => `${JSON.stringify(item)}\n`).join('')
  }
  if (mimeType === 'application/json-seq' || mimeType.endsWith('+json-seq')) {
    return items.map((item) => `\u001e${JSON.stringify(item)}\n`).join('')
  }
  if (mimeType === 'text/event-stream') {
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
