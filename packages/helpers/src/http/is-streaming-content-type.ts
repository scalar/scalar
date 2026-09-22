import { parseMimeType } from './mime-type'

/** Classify streaming bodies so consumers share one set of supported media types. */
export const getStreamFormat = (
  contentType: string | null | undefined,
): 'json-lines' | 'json-seq' | 'sse' | 'multipart' | undefined => {
  const { essence, subtype, type } = parseMimeType(contentType ?? '')
  if (essence === 'text/event-stream') {
    return 'sse'
  }
  if (essence === 'application/json-seq' || subtype.endsWith('+json-seq')) {
    return 'json-seq'
  }
  if (['application/jsonl', 'application/x-ndjson', 'application/json-lines'].includes(essence)) {
    return 'json-lines'
  }
  return type === 'multipart' && (subtype === 'mixed' || subtype === 'x-mixed-replace') ? 'multipart' : undefined
}

/** Identifies response formats whose bodies may continue indefinitely. */
export const isStreamingContentType = (contentType: string | null | undefined): boolean =>
  getStreamFormat(contentType) !== undefined
