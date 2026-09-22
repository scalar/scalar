import { getStreamFormat } from '@scalar/helpers/http/is-streaming-content-type'
import { isObject } from '@scalar/helpers/object/is-object'

/**
 * Frame generated values and authored structured examples as sequential content.
 * Callers bypass this helper for authored strings that already contain wire framing.
 * SSE objects with no valid fields are omitted with one warning per call; an empty
 * input sequence is valid and does not produce a warning.
 */
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
    const frames = items.map((item) => {
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
    const omitted = frames.filter((frame) => frame === '').length
    if (omitted > 0) {
      console.warn(`Skipped ${omitted} SSE example item(s) with no valid event, id, retry, or data fields.`)
    }
    return frames.join('')
  }
  return undefined
}
