import { parseMimeType } from './mime-type'

/** Keep detection and framing aligned on the same supported media formats. */
export const getStreamFormat = (contentType: string): 'json-lines' | 'json-seq' | 'sse' | undefined => {
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
