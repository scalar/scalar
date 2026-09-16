import { parseMimeType } from './mime-type'

/** Identifies response formats whose bodies may continue indefinitely. */
export const isStreamingContentType = (contentType: string | null | undefined): boolean => {
  const { essence, subtype, type } = parseMimeType(contentType ?? '')

  return (
    essence === 'text/event-stream' ||
    essence === 'application/jsonl' ||
    essence === 'application/x-ndjson' ||
    essence === 'application/json-lines' ||
    essence === 'application/json-seq' ||
    subtype.endsWith('+json-seq') ||
    (type === 'multipart' && (subtype === 'mixed' || subtype === 'x-mixed-replace'))
  )
}
